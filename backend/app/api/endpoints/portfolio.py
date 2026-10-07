from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException, status

from app.schemas.portfolio import Education, Experience, Project, Skill
from app.services.portfolio_crud import EducationService, ExperienceService, ProjectService, SkillService

router = APIRouter()

project_service = ProjectService()
experience_service = ExperienceService()
education_service = EducationService()
skill_service = SkillService()

@router.get("/summary", response_model=Dict[str, Any])
async def get_portfolio_summary():
    """
    Returns an aggregated overview of the portfolio, useful for homepage loading
    and feeding quick context into AI generation.
    """
    try:
        projects = project_service.get_published()[:3]  # top 3 projects
        experience = experience_service.get_all()
        skills = skill_service.get_all()
        
        # Sort experience by start_date descending (newest first)
        experience.sort(key=lambda x: x.get("start_date", ""), reverse=True)
        
        return {
            "recent_projects": projects,
            "work_history": experience,
            "skills": skills
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch portfolio summary: {str(e)}"
        )

@router.get("/projects", response_model=List[Project])
async def get_projects():
    """Fetch all published projects."""
    try:
        return project_service.get_published()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch projects: {str(e)}"
        )

@router.get("/projects/{project_id}", response_model=Project)
async def get_project(project_id: str):
    """Fetch details of a single project."""
    try:
        project = project_service.get_by_id(project_id)
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Project with ID '{project_id}' not found."
            )
        return project
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving project: {str(e)}"
        )

@router.get("/experience", response_model=List[Experience])
async def get_experience():
    """Fetch all work experience records, sorted by timeline."""
    try:
        records = experience_service.get_all()
        records.sort(key=lambda x: x.get("start_date", ""), reverse=True)
        return records
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch experience: {str(e)}"
        )

@router.get("/education", response_model=List[Education])
async def get_education():
    """Fetch all education records."""
    try:
        records = education_service.get_all()
        records.sort(key=lambda x: x.get("start_date", ""), reverse=True)
        return records
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch education: {str(e)}"
        )

@router.get("/skills", response_model=List[Skill])
async def get_skills():
    """Fetch all listed skills."""
    try:
        return skill_service.get_all()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch skills: {str(e)}"
        )
