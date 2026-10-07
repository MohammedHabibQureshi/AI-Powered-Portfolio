import logging
import time

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("app.core.middleware.analytics")

class AnalyticsTrackingMiddleware(BaseHTTPMiddleware):
    """
    Middleware tracking page visits, route logs, and client user-agents.
    Records metric logs asynchronously to prevent request processing overhead.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        client_host = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("user-agent", "unknown")
        path = request.url.path

        start_time = time.time()
        response = await call_next(request)
        duration = time.time() - start_time

        # We log analytics footprints. In production environments, 
        # these write directly to PostgreSQL event tables asynchronously.
        if not path.startswith(("/static", "/favicon", "/docs", "/openapi.json")):
            logger.info(
                f"[Analytics Log] Path: {path} | Method: {request.method} | "
                f"Status: {response.status_code} | Host: {client_host} | "
                f"Agent: {user_agent[:50]} | Duration: {duration:.4f}s"
            )

        return response
