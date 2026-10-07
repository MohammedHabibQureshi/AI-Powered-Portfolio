import logging
from typing import Optional

from app.db.session import get_supabase_client

logger = logging.getLogger("app.infrastructure.storage.supabase")

class SupabaseStorageManager:
    """Manages raw byte buffer uploads and deletions against Supabase buckets."""

    def __init__(self):
        try:
            self.client = get_supabase_client()
        except Exception:
            logger.warning("Supabase client could not be resolved. Storage upload calls will fail.")
            self.client = None

    async def upload_file(self, bucket: str, path: str, file_bytes: bytes, content_type: str) -> Optional[str]:
        """
        Uploads binary buffer to bucket.
        Returns the public static file URL, or None if failed.
        """
        if not self.client:
            logger.error("Supabase client is not instantiated.")
            return None

        try:
            # Note: Supabase python storage upload is synchronous. We run in standard thread block.
            self.client.storage.from_(bucket).upload(
                path=path,
                file=file_bytes,
                file_options={"content-type": content_type, "upsert": "true"}
            )
            
            # Retrieve public URL
            public_url = self.client.storage.from_(bucket).get_public_url(path)
            return public_url
        except Exception as e:
            logger.error(f"Failed to upload file to bucket '{bucket}' path '{path}': {e}")
            return None

    async def delete_file(self, bucket: str, path: str) -> bool:
        """Removes resource from Supabase bucket."""
        if not self.client:
            return False

        try:
            self.client.storage.from_(bucket).remove([path])
            return True
        except Exception as e:
            logger.error(f"Failed to delete file from bucket '{bucket}' path '{path}': {e}")
            return False
