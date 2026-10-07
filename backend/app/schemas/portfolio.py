from datetime import date, datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


# ==========================================
# BASE SCHEMAS
# ==========================================
class AuditBase(BaseModel):
    id: UUID
    created_at: datetime
    updated_at: datetime
    created_by: Optional[UUID] = None
    updated_by: Optional[UUID] = None

    class Config:
        from_attributes = True

# ==========================================
# PROJECTS SCHEMAS
# ==========================================
class ProjectBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    slug: str = Field(..., pattern=r"^[a-z0-9-]+$")
    short_description: str = Field(..., max_length=1024)
    full_description: Optional[str] = None
    problem_statement: Optional[str] = None
    solution: Optional[str] = None
    architecture: Optional[str] = None
    challenges: Optional[str] = None
    future_work: Optional[str] = None
    github_url: Optional[str] = Field(None, max_length=1024)
    demo_url: Optional[str] = Field(None, max_length=1024)
    cover_image: Optional[str] = Field(None, max_length=1024)
    status: str = Field(default="draft")
    featured: bool = False
    difficulty: int = Field(default=1, ge=1, le=5)
    estimated_duration: Optional[str] = Field(None, max_length=100)
    objectives: Optional[str] = None
    learning: Optional[str] = None
    results: Optional[str] = None
    security_model: Optional[str] = None
    highlights: List[str] = Field(default_factory=list)

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=255)
    slug: Optional[str] = Field(None, pattern=r"^[a-z0-9-]+$")
    short_description: Optional[str] = Field(None, max_length=1024)
    full_description: Optional[str] = None
    problem_statement: Optional[str] = None
    solution: Optional[str] = None
    architecture: Optional[str] = None
    challenges: Optional[str] = None
    future_work: Optional[str] = None
    github_url: Optional[str] = Field(None, max_length=1024)
    demo_url: Optional[str] = Field(None, max_length=1024)
    cover_image: Optional[str] = Field(None, max_length=1024)
    status: Optional[str] = None
    featured: Optional[bool] = None
    difficulty: Optional[int] = Field(None, ge=1, le=5)
    estimated_duration: Optional[str] = Field(None, max_length=100)
    objectives: Optional[str] = None
    learning: Optional[str] = None
    results: Optional[str] = None
    security_model: Optional[str] = None
    highlights: Optional[List[str]] = None

class Project(ProjectBase, AuditBase):
    pass

# ==========================================
# SKILLS SCHEMAS
# ==========================================
class SkillBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    category: str = Field(..., max_length=100)
    icon: Optional[str] = Field(None, max_length=255)
    level: int = Field(default=3, ge=1, le=5)
    years_of_experience: int = Field(default=0, ge=0)
    display_order: int = Field(default=0)

class SkillCreate(SkillBase):
    pass

class SkillUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    category: Optional[str] = Field(None, max_length=100)
    icon: Optional[str] = Field(None, max_length=255)
    level: Optional[int] = Field(None, ge=1, le=5)
    years_of_experience: Optional[int] = Field(None, ge=0)
    display_order: Optional[int] = None

class Skill(SkillBase, AuditBase):
    pass

# ==========================================
# EXPERIENCE SCHEMAS
# ==========================================
class ExperienceBase(BaseModel):
    company: str = Field(..., min_length=1, max_length=255)
    position: str = Field(..., min_length=1, max_length=255)
    location: Optional[str] = Field(None, max_length=255)
    employment_type: Optional[str] = Field(None, max_length=100)
    start_date: date
    end_date: Optional[date] = None
    description: Optional[str] = None
    technologies: List[str] = Field(default_factory=list)

class ExperienceCreate(ExperienceBase):
    pass

class ExperienceUpdate(BaseModel):
    company: Optional[str] = Field(None, min_length=1, max_length=255)
    position: Optional[str] = Field(None, min_length=1, max_length=255)
    location: Optional[str] = Field(None, max_length=255)
    employment_type: Optional[str] = Field(None, max_length=100)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    description: Optional[str] = None
    technologies: Optional[List[str]] = None

class Experience(ExperienceBase, AuditBase):
    pass

# ==========================================
# EDUCATION SCHEMAS
# ==========================================
class EducationBase(BaseModel):
    institution: str = Field(..., min_length=1, max_length=255)
    degree: str = Field(..., min_length=1, max_length=255)
    major: str = Field(..., min_length=1, max_length=255)
    cgpa: Optional[float] = Field(None, ge=0.0, le=4.0)
    start_year: int = Field(..., ge=1900)
    end_year: Optional[int] = Field(None, ge=1900)

class EducationCreate(EducationBase):
    pass

class Education(EducationBase, AuditBase):
    pass

# ==========================================
# TIMELINE EVENTS SCHEMAS
# ==========================================
class TimelineEventBase(BaseModel):
    event_date: date
    title: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    category: Optional[str] = Field(None, max_length=100)

class TimelineEventCreate(TimelineEventBase):
    pass

class TimelineEvent(TimelineEventBase, AuditBase):
    pass
