from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.infrastructure.repositories.portfolio import (
    BlogRepository,
    ProjectRepository,
    SkillRepository,
    ExperienceRepository,
    EducationRepository,
    TimelineEventRepository,
)
from app.schemas.others import Blog
from app.schemas.portfolio import Project, Skill, Experience, Education, TimelineEvent

router = APIRouter()


@router.get("/projects", response_model=List[Project])
async def get_projects(db: AsyncSession = Depends(get_db)):
    """Fetch all active published projects."""
    try:
        repo = ProjectRepository(db)
        # Fetching all items (we can also filter by published status)
        items = await repo.get_all()
        return items
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch projects: {str(e)}"
        )

@router.get("/projects/{slug}", response_model=Project)
async def get_project_by_slug(slug: str, db: AsyncSession = Depends(get_db)):
    """Fetch individual project case study by slug."""
    repo = ProjectRepository(db)
    project = await repo.get_by_slug(slug)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with slug '{slug}' not found."
        )
    return project

@router.get("/blogs", response_model=List[Blog])
async def get_blogs(db: AsyncSession = Depends(get_db)):
    """Fetch all active published blogs."""
    try:
        repo = BlogRepository(db)
        items = await repo.get_all()
        return items
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve blogs: {str(e)}"
        )

@router.get("/blogs/{slug}", response_model=Blog)
async def get_blog_by_slug(slug: str, db: AsyncSession = Depends(get_db)):
    """Fetch individual blog post by slug."""
    repo = BlogRepository(db)
    blog = await repo.get_by_slug(slug)
    if not blog:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Blog article with slug '{slug}' not found."
        )
    return blog

@router.get("/skills", response_model=List[Skill])
async def get_skills(db: AsyncSession = Depends(get_db)):
    """Fetch all skills."""
    try:
        repo = SkillRepository(db)
        items = await repo.get_all()
        return items
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch skills: {str(e)}"
        )

@router.get("/experience", response_model=List[Experience])
async def get_experience(db: AsyncSession = Depends(get_db)):
    """Fetch all active work experiences."""
    try:
        repo = ExperienceRepository(db)
        items = await repo.get_all()
        items.sort(key=lambda x: x.start_date, reverse=True)
        return items
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch experiences: {str(e)}"
        )

@router.get("/education", response_model=List[Education])
async def get_education(db: AsyncSession = Depends(get_db)):
    """Fetch all education records."""
    try:
        repo = EducationRepository(db)
        items = await repo.get_all()
        items.sort(key=lambda x: x.start_year, reverse=True)
        return items
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch education records: {str(e)}"
        )

@router.get("/timeline", response_model=List[TimelineEvent])
async def get_timeline(db: AsyncSession = Depends(get_db)):
    """Fetch all timeline events."""
    try:
        repo = TimelineEventRepository(db)
        items = await repo.get_all()
        items.sort(key=lambda x: x.event_date, reverse=True)
        return items
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch timeline events: {str(e)}"
        )
