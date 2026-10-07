from datetime import date
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.portfolio import AuditBase


# ==========================================
# BLOGS SCHEMAS
# ==========================================
class BlogBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    slug: str = Field(..., pattern=r"^[a-z0-9-]+$")
    content: str
    summary: Optional[str] = None
    cover_image: Optional[str] = Field(None, max_length=1024)
    reading_time: int = Field(default=1, ge=1)
    published: bool = False
    tags: List[str] = Field(default_factory=list)

class BlogCreate(BlogBase):
    pass

class BlogUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=255)
    slug: Optional[str] = Field(None, pattern=r"^[a-z0-9-]+$")
    content: Optional[str] = None
    summary: Optional[str] = None
    cover_image: Optional[str] = Field(None, max_length=1024)
    reading_time: Optional[int] = Field(None, ge=1)
    published: Optional[bool] = None
    tags: Optional[List[str]] = None

class Blog(BlogBase, AuditBase):
    pass

# ==========================================
# RESEARCH SCHEMAS
# ==========================================
class ResearchBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    abstract: Optional[str] = None
    authors: List[str] = Field(default_factory=list)
    conference: Optional[str] = Field(None, max_length=255)
    publication_date: Optional[date] = None
    pdf_url: Optional[str] = Field(None, max_length=1024)
    github_url: Optional[str] = Field(None, max_length=1024)
    related_project_id: Optional[UUID] = None

class ResearchCreate(ResearchBase):
    pass

class Research(ResearchBase, AuditBase):
    pass

# ==========================================
# CERTIFICATES SCHEMAS
# ==========================================
class CertificateBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    issuer: str = Field(..., min_length=1, max_length=255)
    issue_date: Optional[date] = None
    credential_url: Optional[str] = Field(None, max_length=1024)
    certificate_file: Optional[str] = Field(None, max_length=1024)
    skills: List[str] = Field(default_factory=list)

class CertificateCreate(CertificateBase):
    pass

class Certificate(CertificateBase, AuditBase):
    pass

# ==========================================
# AI CHAT SCHEMAS
# ==========================================
class AIMessageBase(BaseModel):
    sender: str = Field(..., pattern=r"^(user|assistant|system)$")
    text: str
    confidence_score: Optional[float] = None
    citations: Optional[List[Dict[str, Any]]] = Field(default_factory=list)

class AIMessageCreate(AIMessageBase):
    pass

class AIMessage(AIMessageBase, AuditBase):
    conversation_id: UUID

# ==========================================
# MEDIA LIBRARY SCHEMAS
# ==========================================
class MediaLibraryBase(BaseModel):
    filename: str = Field(..., max_length=255)
    mime_type: str = Field(..., max_length=100)
    file_size: int = Field(..., ge=0)
    bucket: str = Field(..., max_length=100)
    path: str = Field(..., max_length=1024)

class MediaLibrary(MediaLibraryBase, AuditBase):
    pass
