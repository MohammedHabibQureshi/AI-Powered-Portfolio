import logging

from supabase import Client, create_client

from app.core.config import settings

logger = logging.getLogger("app.db.session")

_supabase_client: Client = None

def get_supabase_client() -> Client:
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        logger.warning(
            "Supabase URL or Key is not configured. Database operations will fail. "
            "Please configure SUPABASE_URL and SUPABASE_KEY in your .env file."
        )
        # We don't raise error immediately to allow application to boot up/be inspected,
        # but we raise it when connection is explicitly requested.
        raise ValueError(
            "Supabase connection details are missing. Check your environment variables."
        )

    try:
        _supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        return _supabase_client
    except Exception as e:
        logger.error(f"Failed to create Supabase client: {e}")
        raise e
