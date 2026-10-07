import logging
from typing import Any, List
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.middleware.rate_limiting import InMemoryRateLimiter
from app.core.security import get_current_admin
from app.database.session import get_db
from app.infrastructure.models.others import MediaLibrary
from app.infrastructure.repositories.base import SQLAlchemyRepository
from app.infrastructure.storage.supabase import SupabaseStorageManager
from app.schemas.others import MediaLibrary as MediaLibrarySchema

logger = logging.getLogger("app.api.v1.media")
router = APIRouter(dependencies=[Depends(get_current_admin)])

ALLOWED_MIME_TYPES = {
    "image/png", "image/jpeg", "image/jpg", 
    "image/svg+xml", "video/mp4", "application/pdf"
}

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
upload_limiter = InMemoryRateLimiter(requests_limit=5, window_seconds=60)

@router.post(
    "/upload",
    response_model=MediaLibrarySchema,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(upload_limiter)],
)
async def upload_file(
    bucket: str = Form(
        ...,
        description="Target Supabase storage bucket name",
    ),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    admin: Any = Depends(get_current_admin)
):
    """
    Validates file sizes/mimes, uploads to Supabase storage buckets, 
    and registers metadata inside PostgreSQL catalog.
    """
    # 1. Validate Mime type
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{file.content_type}'. Supported: PNG, JPEG, SVG, MP4, PDF."
        )

    # 2. Validate File Size
    file_bytes = await file.read()
    file_size = len(file_bytes)
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum size limit of 10MB (Size: {file_size / (1024*1024):.2f}MB)."
        )

    # 3. Trigger Supabase Upload
    storage_manager = SupabaseStorageManager()
    path = f"media/{file.filename}"
    
    public_url = await storage_manager.upload_file(
        bucket=bucket,
        path=path,
        file_bytes=file_bytes,
        content_type=file.content_type
    )

    if not public_url:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload file bytes to Supabase storage bucket."
        )

    # 4. Save metadata to database catalog
    repo = SQLAlchemyRepository(MediaLibrary, db, current_user_id=admin.id)
    media_entry = MediaLibrary(
        filename=file.filename,
        mime_type=file.content_type,
        file_size=file_size,
        bucket=bucket,
        path=public_url
    )
    
    try:
        saved_entry = await repo.add(media_entry)
        return saved_entry
    except Exception as e:
        logger.error(f"Failed to save media metadata to DB: {e}")
        # Soft cleanup uploaded files if database inserts fail
        await storage_manager.delete_file(bucket, path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database record initialization failed: {str(e)}"
        )

@router.get("/", response_model=List[MediaLibrarySchema])
async def list_media(db: AsyncSession = Depends(get_db)):
    """Fetch list of all cataloged media assets."""
    repo = SQLAlchemyRepository(MediaLibrary, db)
    return await repo.get_all()

@router.delete("/{media_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_media(media_id: UUID, db: AsyncSession = Depends(get_db), admin: Any = Depends(get_current_admin)):
    """Deletes files from storage buckets and soft-deletes DB catalog logs."""
    repo = SQLAlchemyRepository(MediaLibrary, db, current_user_id=admin.id)
    media = await repo.get_by_id(media_id)
    if not media:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Media asset not found in database records."
        )

    # Remove from Supabase Storage
    storage_manager = SupabaseStorageManager()
    # Simple extraction of storage path key
    path_key = f"media/{media.filename}"
    await storage_manager.delete_file(media.bucket, path_key)

    # Remove DB Log
    await repo.delete(media.id)
    return
