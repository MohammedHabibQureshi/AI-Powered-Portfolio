from datetime import date, datetime
from typing import List, Optional
from uuid import UUID, uuid4

from sqlalchemy import JSON, Boolean, Date, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.models.base import AuditMixin, Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    last_login: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)


class Blog(Base, AuditMixin):
    __tablename__ = "blogs"

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    content: Mapped[str] = mapped_column(nullable=False)
    summary: Mapped[Optional[str]] = mapped_column(nullable=True)
    cover_image: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    reading_time: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    published: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    tags: Mapped[List[str]] = mapped_column(JSON, default=list, nullable=False)


class Research(Base, AuditMixin):
    __tablename__ = "research"

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    abstract: Mapped[Optional[str]] = mapped_column(nullable=True)
    authors: Mapped[List[str]] = mapped_column(JSON, default=list, nullable=False)
    conference: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    publication_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    pdf_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    github_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    related_project_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("projects.id", ondelete="SET NULL"), nullable=True
    )


class Certificate(Base, AuditMixin):
    __tablename__ = "certificates"

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    issuer: Mapped[str] = mapped_column(String(255), nullable=False)
    issue_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    credential_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    certificate_file: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    skills: Mapped[List[str]] = mapped_column(JSON, default=list, nullable=False)


class AIConversation(Base, AuditMixin):
    __tablename__ = "ai_conversations"

    session_id: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    visitor_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Relationships
    messages: Mapped[List["AIConversationMessage"]] = relationship(
        back_populates="conversation", cascade="all, delete-orphan"
    )


class AIConversationMessage(Base, AuditMixin):
    __tablename__ = "ai_conversation_messages"

    conversation_id: Mapped[UUID] = mapped_column(ForeignKey("ai_conversations.id", ondelete="CASCADE"), nullable=False)
    sender: Mapped[str] = mapped_column(String(50), nullable=False) # 'user', 'assistant', 'system'
    text: Mapped[str] = mapped_column(nullable=False)
    confidence_score: Mapped[Optional[float]] = mapped_column(nullable=True)
    citations: Mapped[Optional[dict]] = mapped_column(JSON, default=list, nullable=True)

    # Relationships
    conversation: Mapped["AIConversation"] = relationship(back_populates="messages")


class MediaLibrary(Base, AuditMixin):
    __tablename__ = "media_library"

    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    bucket: Mapped[str] = mapped_column(String(100), nullable=False)
    path: Mapped[str] = mapped_column(String(1024), nullable=False)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[Optional[UUID]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    table_name: Mapped[str] = mapped_column(String(100), nullable=False)
    record_id: Mapped[UUID] = mapped_column(nullable=False)
    previous_value: Mapped[Optional[dict]] = mapped_column(JSON, default=dict, nullable=True)
    new_value: Mapped[Optional[dict]] = mapped_column(JSON, default=dict, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
