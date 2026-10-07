from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.models.others import Blog
from app.infrastructure.models.portfolio import Project, Skill, Experience, Education, TimelineEvent
from app.infrastructure.repositories.base import SQLAlchemyRepository


class ProjectRepository(SQLAlchemyRepository[Project]):
    """Concrete repository mapping Database operations for Project entities."""
    
    def __init__(self, db: AsyncSession):
        super().__init__(Project, db)

    async def get_by_slug(self, slug: str) -> Optional[Project]:
        """Retrieve dynamic case studies using target slug."""
        stmt = (
            select(self.model)
            .where(self.model.slug == slug)
            .where(self.model.deleted_at.is_(None))
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_featured(self) -> List[Project]:
        """Fetch active projects marked as featured."""
        stmt = (
            select(self.model)
            .where(self.model.featured.is_(True))
            .where(self.model.status == "published")
            .where(self.model.deleted_at.is_(None))
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())


class BlogRepository(SQLAlchemyRepository[Blog]):
    """Concrete repository mapping Database operations for Blog posts."""

    def __init__(self, db: AsyncSession):
        super().__init__(Blog, db)

    async def get_by_slug(self, slug: str) -> Optional[Blog]:
        """Retrieve published articles using slug keys."""
        stmt = (
            select(self.model)
            .where(self.model.slug == slug)
            .where(self.model.deleted_at.is_(None))
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()


class SkillRepository(SQLAlchemyRepository[Skill]):
    """Concrete repository mapping Database operations for Skill details."""

    def __init__(self, db: AsyncSession):
        super().__init__(Skill, db)

    async def get_by_category(self, category: str) -> List[Skill]:
        """Fetch skills matching target category classification."""
        stmt = (
            select(self.model)
            .where(self.model.category == category)
            .where(self.model.deleted_at.is_(None))
            .order_by(self.model.display_order.asc())
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())


class ExperienceRepository(SQLAlchemyRepository[Experience]):
    """Concrete repository mapping Database operations for Experience details."""

    def __init__(self, db: AsyncSession):
        super().__init__(Experience, db)


class EducationRepository(SQLAlchemyRepository[Education]):
    """Concrete repository mapping Database operations for Education details."""

    def __init__(self, db: AsyncSession):
        super().__init__(Education, db)


class TimelineEventRepository(SQLAlchemyRepository[TimelineEvent]):
    """Concrete repository mapping Database operations for TimelineEvent details."""

    def __init__(self, db: AsyncSession):
        super().__init__(TimelineEvent, db)
