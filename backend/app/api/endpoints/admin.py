
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import get_current_admin
from app.schemas.portfolio import (
    Education,
    EducationCreate,
    EducationUpdate,
    Experience,
    ExperienceCreate,
    ExperienceUpdate,
    Project,
    ProjectCreate,
    ProjectUpdate,
    Skill,
    SkillCreate,
    SkillUpdate,
)
from app.services.portfolio_crud import EducationService, ExperienceService, ProjectService, SkillService

router = APIRouter(dependencies=[Depends(get_current_admin)])

project_service = ProjectService()
experience_service = ExperienceService()
education_service = EducationService()
skill_service = SkillService()

# ==========================================
# ADMIN PROJECTS CMS
# ==========================================
@router.post("/projects", response_model=Project, status_code=status.HTTP_201_CREATED)
async def create_project(data: ProjectCreate):
    try:
        return project_service.create(data.model_dump())
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.put("/projects/{project_id}", response_model=Project)
async def update_project(project_id: str, data: ProjectUpdate):
    try:
        updated = project_service.update(project_id, data.model_dump(exclude_unset=True))
        if not updated:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        return updated
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(project_id: str):
    try:
        success = project_service.delete(project_id)
        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        return
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# ==========================================
# ADMIN EXPERIENCE CMS
# ==========================================
@router.post("/experience", response_model=Experience, status_code=status.HTTP_201_CREATED)
async def create_experience(data: ExperienceCreate):
    try:
        return experience_service.create(data.model_dump())
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.put("/experience/{exp_id}", response_model=Experience)
async def update_experience(exp_id: str, data: ExperienceUpdate):
    try:
        updated = experience_service.update(exp_id, data.model_dump(exclude_unset=True))
        if not updated:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Experience record not found")
        return updated
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/experience/{exp_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_experience(exp_id: str):
    try:
        success = experience_service.delete(exp_id)
        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Experience record not found")
        return
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# ==========================================
# ADMIN EDUCATION CMS
# ==========================================
@router.post("/education", response_model=Education, status_code=status.HTTP_201_CREATED)
async def create_education(data: EducationCreate):
    try:
        return education_service.create(data.model_dump())
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.put("/education/{edu_id}", response_model=Education)
async def update_education(edu_id: str, data: EducationUpdate):
    try:
        updated = education_service.update(edu_id, data.model_dump(exclude_unset=True))
        if not updated:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Education record not found")
        return updated
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/education/{edu_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_education(edu_id: str):
    try:
        success = education_service.delete(edu_id)
        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Education record not found")
        return
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# ==========================================
# ADMIN SKILLS CMS
# ==========================================
@router.post("/skills", response_model=Skill, status_code=status.HTTP_201_CREATED)
async def create_skill(data: SkillCreate):
    try:
        return skill_service.create(data.model_dump())
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.put("/skills/{skill_id}", response_model=Skill)
async def update_skill(skill_id: str, data: SkillUpdate):
    try:
        updated = skill_service.update(skill_id, data.model_dump(exclude_unset=True))
        if not updated:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill not found")
        return updated
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/skills/{skill_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_skill(skill_id: str):
    try:
        success = skill_service.delete(skill_id)
        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill not found")
        return
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
