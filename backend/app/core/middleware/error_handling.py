import logging
import time
import traceback

from fastapi import Request, Response, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("app.core.middleware.error_handling")

class GlobalErrorHandlingMiddleware(BaseHTTPMiddleware):
    """
    Middleware catching all unhandled exceptions globally.
    Formats logs and hides internal stack traces from client responses.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        try:
            start_time = time.time()
            response = await call_next(request)
            process_time = time.time() - start_time
            response.headers["X-Process-Time"] = str(process_time)
            return response
        except Exception as e:
            # Log exact traceback for internal debugging
            logger.error(
                f"Unhandled Exception occurred on {request.method} {request.url.path}\n"
                f"Detail: {str(e)}\n"
                f"Traceback: {traceback.format_exc()}"
            )
            
            from app.core.config import settings

            # Format consistent JSON error response
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={
                    "status": "error",
                    "code": 500,
                    "message": "An unexpected error occurred. Please contact the administrator.",
                    "detail": str(e) if settings.ENVIRONMENT != "production" else "Internal Server Error"
                }
            )
