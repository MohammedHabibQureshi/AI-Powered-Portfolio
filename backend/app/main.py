import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import settings
from app.core.middleware.analytics import AnalyticsTrackingMiddleware
from app.core.middleware.error_handling import GlobalErrorHandlingMiddleware
from app.core.middleware.logging_filter import SensitiveDataScrubber
from app.core.middleware.security_headers import SecurityHeadersMiddleware

# Setup logging configuration
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s", handlers=[logging.StreamHandler()]
)

# Apply global log scrubbing filters
scrubber = SensitiveDataScrubber()
for handler in logging.root.handlers:
    handler.addFilter(scrubber)

logger = logging.getLogger("app.main")

_knowledge_watcher = None

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API supporting the AI-First Portfolio Platform",
    version="1.0.0",
    openapi_url="/api/v1/openapi.json",
)

# Register Global Error Handling middleware first
app.add_middleware(GlobalErrorHandlingMiddleware)
# Register Security Headers middleware
app.add_middleware(SecurityHeadersMiddleware)
# Register Analytics tracking middleware
app.add_middleware(AnalyticsTrackingMiddleware)

# Set up CORS middleware
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin).rstrip("/") for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


@app.on_event("startup")
async def startup_event():
    logger.info("Application starting up...")
    logger.info(f"Active AI Provider: {settings.LLM_PROVIDER}")

    # Load the personal knowledge base from the canonical data/ directory and,
    # in development, start the automatic file watcher that refreshes knowledge
    # whenever data/linkedin.txt or data/github.json changes.
    try:
        from app.services.knowledge import KnowledgeWatcher, get_knowledge_service

        get_knowledge_service().refresh()
        logger.info("Personal knowledge base loaded from %s", get_knowledge_service().data_dir)
        if settings.ENVIRONMENT == "development" and settings.KNOWLEDGE_WATCH_ENABLED:
            global _knowledge_watcher
            _knowledge_watcher = KnowledgeWatcher(interval=float(settings.KNOWLEDGE_WATCH_INTERVAL_SECONDS))
            await _knowledge_watcher.start()
    except Exception:
        logger.exception("Failed to initialize personal knowledge base")

    # We don't verify Supabase connection on start to allow configuring it later,
    # but we log if keys are missing.
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        logger.warning("Supabase URL and Key are not configured in environment variables!")


@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Application shutting down...")
    try:
        if _knowledge_watcher is not None:
            await _knowledge_watcher.stop()
    except Exception:
        logger.exception("Failed to stop knowledge watcher")


# Root health check endpoint (Liveness)
@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "project": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "ai_provider": settings.LLM_PROVIDER,
    }


# Readiness check endpoint
@app.get("/ready", tags=["Health"])
async def readiness_check():
    from fastapi import HTTPException
    from sqlalchemy import text

    from app.database.session import AsyncSessionLocal

    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
        return {
            "status": "ready",
            "database": "connected",
            "storage": "configured" if settings.SUPABASE_URL else "unconfigured",
        }
    except Exception as e:
        logger.error(f"Readiness check failed: {e}")
        raise HTTPException(status_code=503, detail=f"Services not ready: {str(e)}")


# Include API Router
app.include_router(api_router, prefix="/api/v1")
