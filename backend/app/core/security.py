import logging
from typing import Any

from fastapi import HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.db.session import get_supabase_client

logger = logging.getLogger("app.core.security")
security = HTTPBearer(auto_error=False)

async def get_current_admin(credentials: HTTPAuthorizationCredentials = Security(security)) -> Any:
    """
    Validates the Supabase JWT token passed in the Authorization header.
    Returns the user data if valid, otherwise raises 401 Unauthorized.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization credentials are required."
        )

    token = credentials.credentials
    try:
        client = get_supabase_client()
        # Retrieve user from Supabase using the jwt token
        response = client.auth.get_user(token)
        if not response or not response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token."
            )
        
        # Verify the user has access. Since there is no public auth,
        # any authenticated user in our Supabase instance is the admin.
        return response.user
    except Exception as e:
        logger.error(f"Authentication validation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials."
        )
