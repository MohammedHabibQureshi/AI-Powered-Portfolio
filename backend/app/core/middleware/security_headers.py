from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Middleware appending security headers to all outbound API responses
    protecting against clickjacking, sniff injection, and cross-origin leaks.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        
        # Enforce HTTPS HSTS
        response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"
        
        # Clickjacking protection
        response.headers["X-Frame-Options"] = "DENY"
        
        # MIME sniffing protection
        response.headers["X-Content-Type-Options"] = "nosniff"
        
        # Referrer privacy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # Device sensor permissions policy
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        
        # Base Content Security Policy (CSP)
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "style-src 'self' 'unsafe-inline'; "
            "script-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: blob: https:; "
            "connect-src 'self' https://*.supabase.co https://api.github.com;"
        )
        
        return response
