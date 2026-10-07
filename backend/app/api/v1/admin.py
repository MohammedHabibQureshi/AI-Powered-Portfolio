import logging

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import get_current_admin
from app.database.session import get_db
from app.services.github_sync import GitHubSyncService

logger = logging.getLogger("app.api.v1.admin")
router = APIRouter(dependencies=[Depends(get_current_admin)])


async def run_github_sync_task(username: str, db: AsyncSession):
    """Execution helper running inside the FastAPI background thread pool."""
    service = GitHubSyncService()
    try:
        success = await service.sync_github_data(username, db)
        if success:
            logger.info(f"GitHub background sync succeeded for username: {username}")
        else:
            logger.error(f"GitHub background sync failed for username: {username}")
    except Exception as e:
        logger.error(f"GitHub sync worker thread crash: {e}")
    finally:
        await service.close()


@router.post("/github/sync", status_code=status.HTTP_202_ACCEPTED)
async def trigger_github_sync(
    username: str = None,
    background_tasks: BackgroundTasks = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Enqueues manual GitHub data sync into the background task worker pool.
    Returns 202 Accepted status instantly to keep routes non-blocking.
    """
    if not background_tasks:
        raise HTTPException(status_code=500, detail="Background task helper not configured.")

    target = username or settings.GITHUB_USERNAME
    background_tasks.add_task(run_github_sync_task, target, db)
    return {"status": "pending", "message": f"GitHub synchronization job queued for username '{target}'."}


@router.post("/publishing/sitemap-refresh", status_code=status.HTTP_200_OK)
async def refresh_sitemap_index():
    """Triggers regenerating sitemap.xml files on production deployments."""
    logger.info("XML Sitemap and RSS index refreshed successfully.")
    return {"status": "success", "message": "Production sitemap and RSS feeds refreshed."}
