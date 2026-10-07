import json
from datetime import date
from typing import List, Optional
from uuid import UUID

from sqlalchemy import ARRAY, TEXT, Boolean, Date, ForeignKey, Integer, Numeric, String, TypeDecorator
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.models.base import AuditMixin, Base


class ArrayType(TypeDecorator):
    """Platform-independent Array type.
    Uses PostgreSQL's ARRAY type on Postgres, and JSON/TEXT on other databases.
    """
    impl = TEXT
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(ARRAY(String))
        else:
            return dialect.type_descriptor(TEXT)

    def process_bind_param(self, value, dialect):
        if dialect.name == 'postgresql':
            return value
        if value is None:
            return None
        return json.dumps(value)

    def process_result_value(self, value, dialect):
        if dialect.name == 'postgresql':
            return value
        if value is None:
            return None
        try:
            return json.loads(value)
        except Exception:
            return []


class Project(Base, AuditMixin):
    __tablename__ = "projects"

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    short_description: Mapped[str] = mapped_column(String(1024), nullable=False)
    full_description: Mapped[Optional[str]] = mapped_column(nullable=True)
    problem_statement: Mapped[Optional[str]] = mapped_column(nullable=True)
    solution: Mapped[Optional[str]] = mapped_column(nullable=True)
    architecture: Mapped[Optional[str]] = mapped_column(nullable=True)
    challenges: Mapped[Optional[str]] = mapped_column(nullable=True)
    future_work: Mapped[Optional[str]] = mapped_column(nullable=True)
    github_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    demo_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    cover_image: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="draft", nullable=False)
    featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    difficulty: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    estimated_duration: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    objectives: Mapped[Optional[str]] = mapped_column(nullable=True)
    learning: Mapped[Optional[str]] = mapped_column(nullable=True)
    results: Mapped[Optional[str]] = mapped_column(nullable=True)
    security_model: Mapped[Optional[str]] = mapped_column(nullable=True)
    highlights: Mapped[List[str]] = mapped_column(ArrayType, default=list, nullable=False)

    # Relationships
    technologies: Mapped[List["ProjectTechnology"]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )


class Skill(Base, AuditMixin):
    __tablename__ = "skills"

    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    icon: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    level: Mapped[int] = mapped_column(Integer, default=3, nullable=False)
    years_of_experience: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)


class ProjectTechnology(Base, AuditMixin):
    __tablename__ = "project_technologies"

    project_id: Mapped[UUID] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    skill_id: Mapped[UUID] = mapped_column(ForeignKey("skills.id", ondelete="CASCADE"), nullable=False)

    # Relationships
    project: Mapped["Project"] = relationship(back_populates="technologies")
    skill: Mapped["Skill"] = relationship()


class Experience(Base, AuditMixin):
    __tablename__ = "experience"

    company: Mapped[str] = mapped_column(String(255), nullable=False)
    position: Mapped[str] = mapped_column(String(255), nullable=False)
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    employment_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    description: Mapped[Optional[str]] = mapped_column(nullable=True)
    technologies: Mapped[List[str]] = mapped_column(ArrayType, default=list, nullable=False)


class Education(Base, AuditMixin):
    __tablename__ = "education"

    institution: Mapped[str] = mapped_column(String(255), nullable=False)
    degree: Mapped[str] = mapped_column(String(255), nullable=False)
    major: Mapped[str] = mapped_column(String(255), nullable=False)
    cgpa: Mapped[Optional[float]] = mapped_column(Numeric(3, 2), nullable=True)
    start_year: Mapped[int] = mapped_column(Integer, nullable=False)
    end_year: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)


class TimelineEvent(Base, AuditMixin):
    __tablename__ = "timeline_events"

    event_date: Mapped[date] = mapped_column(Date, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(nullable=True)
    category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
