import logging
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

logger = logging.getLogger("app.database.session")

if not settings.DATABASE_URL:
    logger.warning("DATABASE_URL is not set. Database connections will fail.")

# Create Async Engine for SQLAlchemy 2.0
engine = create_async_engine(
    settings.async_database_url,
    pool_pre_ping=True,
    echo=False
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False
)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency yielding async db session, ensuring rollback on exception."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception as e:
            await session.rollback()
            logger.error(f"Database session exception: {e}")
            raise e
        finally:
            await session.close()
