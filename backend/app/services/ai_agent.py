import asyncio
import logging
from typing import Any, AsyncGenerator, Dict, List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.models.portfolio import Experience, Project, Skill, TimelineEvent
from app.infrastructure.services.ai.factory import AIFactory
from app.services.ai_persona import REFUSAL_MESSAGE, build_clarification_message, build_system_prompt
from app.services.classifier import (
    ACHIEVEMENT,
    AMBIGUOUS,
    ARCHITECTURE,
    BLOG,
    CAREER,
    CERTIFICATION,
    EDUCATION,
    EXPERIENCE,
    GENERAL_PERSONAL,
    GITHUB,
    GREETING,
    JOB_MATCHING,
    OUT_OF_SCOPE,
    PERSONAL_PROFILE,
    PROJECT,
    PROJECT_COMPARISON,
    PUBLICATION,
    RESEARCH,
    RESUME,
    SKILLS,
    TIMELINE,
    Classification,
    DomainClassifier,
)
from app.services.knowledge import LinkedinProfile, get_knowledge_service

logger = logging.getLogger("app.services.ai_agent")

MAX_README_CHARS = 1600
MAX_ABOUT_CHARS = 1200

INTENT_CITATIONS: Dict[str, List[Dict[str, str]]] = {
    PROJECT: [{"title": "Projects", "url": "/projects"}],
    PROJECT_COMPARISON: [{"title": "Projects", "url": "/projects"}],
    ARCHITECTURE: [{"title": "Projects", "url": "/projects"}],
    EXPERIENCE: [{"title": "Career Timeline", "url": "/timeline"}],
    CAREER: [{"title": "Career Timeline", "url": "/timeline"}],
    SKILLS: [{"title": "About", "url": "/about"}],
    EDUCATION: [{"title": "About", "url": "/about"}],
    CERTIFICATION: [{"title": "About", "url": "/about"}],
    TIMELINE: [{"title": "Career Timeline", "url": "/timeline"}],
    ACHIEVEMENT: [{"title": "Career Timeline", "url": "/timeline"}],
    GITHUB: [{"title": "GitHub", "url": "https://github.com/MohammedHabibQureshi"}],
    PERSONAL_PROFILE: [{"title": "About", "url": "/about"}],
    GENERAL_PERSONAL: [{"title": "About", "url": "/about"}],
    RESUME: [{"title": "Resume", "url": "/resume"}],
    GREETING: [{"title": "About", "url": "/about"}],
}


class AIAgentService:
    """Recruiter-assistant pipeline:

    1. Classify the query into an in-scope intent (domain gate).
    2. If out of scope / ambiguous -> stream a refusal/clarification, never
       invoking the generation model.
    3. Otherwise compile grounded knowledge context (LinkedIn + GitHub + DB).
    4. Stream a grounded answer from the provider.
    5. Validate the finished answer against the knowledge vocabulary.
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.provider = AIFactory.get_provider()
        self.knowledge = get_knowledge_service()
        self.classifier = DomainClassifier()

    # ------------------------------------------------------------------
    # Grounding
    # ------------------------------------------------------------------
    async def get_grounding_context(self, intent: str, query: str) -> str:
        snapshot = self.knowledge.snapshot()
        profile = snapshot.profile
        sections: List[str] = []

        profile_text = self._format_profile(profile)
        if profile_text:
            sections.append(profile_text)

        if intent in (EXPERIENCE, CAREER, GENERAL_PERSONAL, PERSONAL_PROFILE):
            experience = await self._load_experience() or profile.experience
            if experience:
                sections.append(self._format_experience(experience))
            education = profile.education
            if education:
                sections.append(self._format_education(education))
            certifications = profile.certifications
            if certifications:
                sections.append(self._format_certifications(certifications))

        if intent in (PROJECT, PROJECT_COMPARISON, ARCHITECTURE, JOB_MATCHING, RESUME):
            projects = await self._load_projects() or profile.projects
            if projects:
                sections.append(self._format_projects(projects))

        if intent in (SKILLS, JOB_MATCHING, RESUME, GENERAL_PERSONAL):
            skills = self._merge_skills(profile.skills, await self._load_db_skills())
            if skills:
                sections.append(self._format_skills(skills))

        if intent in (TIMELINE, ACHIEVEMENT, EXPERIENCE, GENERAL_PERSONAL):
            timeline = await self._load_timeline()
            if timeline:
                sections.append(self._format_timeline(timeline))

        if intent in (GITHUB, PROJECT, RESUME, GENERAL_PERSONAL):
            if snapshot.repositories:
                sections.append(self._format_repositories(snapshot.repositories))

        if intent in (EDUCATION,):
            education = profile.education
            if education:
                sections.append(self._format_education(education))
            certifications = profile.certifications
            if certifications:
                sections.append(self._format_certifications(certifications))

        if intent in (CERTIFICATION,):
            certifications = profile.certifications
            if certifications:
                sections.append(self._format_certifications(certifications))

        if intent in (RESEARCH, PUBLICATION, BLOG):
            if profile.publications:
                sections.append(self._format_publications(profile.publications))

        if not sections:
            sections.append(
                "BIO OVERVIEW:\n"
                f"{profile.name} is an embedded systems & IoT professional. "
                "Consult the LinkedIn-derived profile details above for specifics."
            )
        return "\n\n".join(sections)

    # ------------------------------------------------------------------
    # Streaming pipeline
    # ------------------------------------------------------------------
    async def chat_stream(self, query: str, history: List[Dict[str, Any]]) -> AsyncGenerator[Dict[str, Any], None]:
        snapshot = self.knowledge.snapshot()
        classification = self.classifier.classify(query, snapshot.vocabulary())

        if not self.classifier.is_in_scope(classification):
            async for chunk in self._stream_static_message(query, classification):
                yield chunk
            return

        logger.info(
            "In-scope query classified: intent=%s confidence=%.2f | query=%r",
            classification.intent,
            classification.confidence,
            query,
        )

        grounding_data = await self.get_grounding_context(classification.intent, query)
        owner_name = snapshot.profile.name or "the portfolio owner"
        system_instruction = build_system_prompt(owner_name, grounding_data)

        citations = INTENT_CITATIONS.get(classification.intent, [])
        async for chunk in self.provider.stream(query, history, system_instruction):
            chunk["intent"] = classification.intent
            chunk["type"] = "answer"
            if citations and not chunk.get("citations"):
                chunk["citations"] = citations
            yield chunk

    # ------------------------------------------------------------------
    # Static (no-model) messages
    # ------------------------------------------------------------------
    async def _stream_static_message(
        self, query: str, classification: Classification
    ) -> AsyncGenerator[Dict[str, Any], None]:
        if classification.intent == AMBIGUOUS:
            message = build_clarification_message(classification.definition_target)
            message_type = "clarification"
        elif classification.intent == OUT_OF_SCOPE:
            message = REFUSAL_MESSAGE
            message_type = "refusal"
        else:
            message = REFUSAL_MESSAGE
            message_type = "refusal"

        logger.info(
            "Rejected query: intent=%s confidence=%.2f | query=%r",
            classification.intent,
            classification.confidence,
            query,
        )
        words = message.split(" ")
        for i in range(0, len(words), 3):
            chunk_words = " ".join(words[i : i + 3]) + " "
            yield {
                "chunk": chunk_words,
                "confidence": 0.0,
                "citations": [],
                "intent": classification.intent,
                "type": message_type,
            }
            await asyncio.sleep(0.008)

    # ------------------------------------------------------------------
    # Formatting helpers
    # ------------------------------------------------------------------
    @staticmethod
    def _format_profile(profile: LinkedinProfile) -> str:
        lines = ["PROFILE (Source: LinkedIn Profile):"]
        if profile.name:
            lines.append(f"- Name: {profile.name}")
        if profile.headline:
            lines.append(f"- Headline: {profile.headline}")
        if profile.pronouns:
            lines.append(f"- Pronouns: {profile.pronouns}")
        if profile.location:
            lines.append(f"- Location: {profile.location}")
        if profile.role:
            lines.append(f"- Current role: {profile.role}")
        if profile.open_to:
            lines.append(f"- Open to: {profile.open_to}")
        if profile.contact:
            lines.append(f"- Contact: {', '.join(profile.contact)}")
        if profile.about:
            lines.append(f"- About: {profile.about[:MAX_ABOUT_CHARS]}")
        return "\n".join(lines) if len(lines) > 1 else ""

    @staticmethod
    def _format_experience(records: List[Dict[str, Any]]) -> str:
        if not records:
            return ""
        lines = ["PROFESSIONAL EXPERIENCE (Source: LinkedIn Profile / Portfolio):"]
        for exp in records:
            company = exp.get("company", "")
            position = exp.get("position", "")
            dates = exp.get("dates", "")
            description = exp.get("description", "")
            skills = ", ".join(exp.get("skills", [])) if exp.get("skills") else ""
            lines.append(f"- {position} at {company} ({dates})")
            if description:
                lines.append(f"  Details: {description}")
            if skills:
                lines.append(f"  Skills: {skills}")
        return "\n".join(lines)

    @staticmethod
    def _format_education(records: List[Dict[str, Any]]) -> str:
        if not records:
            return ""
        lines = ["EDUCATION (Source: LinkedIn Profile):"]
        for edu in records:
            institution = edu.get("institution", "")
            degree = edu.get("degree", "")
            dates = edu.get("dates", "")
            details = edu.get("details", "")
            activities = edu.get("activities", "")
            entry = f"- {degree} at {institution}" if degree and institution else f"- {institution or degree}"
            if dates:
                entry += f" ({dates})"
            lines.append(entry)
            if details:
                lines.append(f"  Details: {details}")
            if activities:
                lines.append(f"  Activities: {activities}")
        return "\n".join(lines)

    @staticmethod
    def _format_certifications(records: List[Dict[str, Any]]) -> str:
        if not records:
            return ""
        lines = ["CERTIFICATIONS (Source: LinkedIn Profile):"]
        for cert in records:
            title = cert.get("title", "")
            issuer = cert.get("issuer", "")
            issued = cert.get("issued", "")
            skills = ", ".join(cert.get("skills", [])) if cert.get("skills") else ""
            entry = f"- {title}"
            if issuer:
                entry += f" — {issuer}"
            if issued:
                entry += f" ({issued})"
            lines.append(entry)
            if skills:
                lines.append(f"  Skills: {skills}")
        return "\n".join(lines)

    @staticmethod
    def _format_projects(records: List[Any]) -> str:
        if not records:
            return ""
        lines = ["PROJECTS (Source: Portfolio / GitHub):"]
        for proj in records:
            if isinstance(proj, dict):
                title = proj.get("title", "")
                description = proj.get("description", "") or proj.get("short_description", "")
                tech = proj.get("technologies", [])
                github_url = proj.get("github_url", "")
                dates = proj.get("dates", "")
                entry = f"- {title}"
                if dates:
                    entry += f" ({dates})"
                lines.append(entry)
                if description:
                    lines.append(f"  Summary: {description}")
                if tech:
                    lines.append(f"  Tech: {', '.join(tech)}")
                if github_url:
                    lines.append(f"  GitHub: {github_url}")
            else:
                lines.append(f"- {getattr(proj, 'title', '')}: {getattr(proj, 'short_description', '')}")
        return "\n".join(lines)

    @staticmethod
    def _format_skills(skills: List[Any]) -> str:
        if not skills:
            return ""
        lines = ["SKILLS (Source: LinkedIn Profile):"]
        for skill in skills:
            if isinstance(skill, dict):
                lines.append(
                    f"- {skill.get('name')} (Category: {skill.get('category')} | Level: {skill.get('level')}/5)"
                )
            else:
                lines.append(f"- {skill}")
        return "\n".join(lines)

    @staticmethod
    def _format_timeline(records: List[Any]) -> str:
        if not records:
            return ""
        lines = ["TIMELINE & ACHIEVEMENTS (Source: Portfolio):"]
        for ev in records:
            if isinstance(ev, dict):
                lines.append(f"- {ev.get('event_date')}: {ev.get('title')} — {ev.get('description', '')}")
            else:
                ev_date = getattr(ev, "event_date", "")
                ev_title = getattr(ev, "title", "")
                ev_desc = getattr(ev, "description", "")
                lines.append(f"- {ev_date}: {ev_title} — {ev_desc}")
        return "\n".join(lines)

    @staticmethod
    def _format_repositories(repositories: List[Dict[str, Any]]) -> str:
        if not repositories:
            return ""
        lines = ["GITHUB REPOSITORIES (Source: GitHub):"]
        for repo in repositories:
            name = repo.get("name", "")
            description = repo.get("description")
            language = repo.get("language")
            languages = repo.get("languages") or []
            topics = repo.get("topics") or []
            url = repo.get("url", "")
            stars = repo.get("stars", 0)
            last_updated = repo.get("last_updated", "")
            readme = repo.get("readme") or ""
            entry = f"- {name} ({language or 'N/A'})"
            if description:
                entry += f" — {description}"
            lines.append(entry)
            if languages:
                lines.append(f"  Languages: {', '.join(languages[:12])}")
            if topics:
                lines.append(f"  Topics: {', '.join(topics[:12])}")
            if stars:
                lines.append(f"  Stars: {stars}")
            if last_updated:
                lines.append(f"  Last updated: {last_updated[:10]}")
            if url:
                lines.append(f"  URL: {url}")
            if readme:
                lines.append(f"  README excerpt: {readme[:MAX_README_CHARS]}")
        return "\n".join(lines)

    @staticmethod
    def _format_publications(records: List[Dict[str, Any]]) -> str:
        if not records:
            return ""
        lines = ["PUBLICATIONS (Source: LinkedIn Profile):"]
        for pub in records:
            title = pub.get("title", "")
            date = pub.get("date", "")
            description = pub.get("description", "")
            entry = f"- {title}" + (f" ({date})" if date else "")
            lines.append(entry)
            if description:
                lines.append(f"  {description}")
        return "\n".join(lines)

    @staticmethod
    def _merge_skills(linkedin_skills: List[str], db_skills: List[Any]) -> List[Any]:
        """LinkedIn skills are authoritative; DB skills add category metadata."""
        if not db_skills:
            return list(linkedin_skills)
        result: List[Any] = []
        for skill in db_skills:
            if isinstance(skill, dict):
                result.append(skill)
            else:
                result.append(skill)
        for name in linkedin_skills:
            if name.lower() not in {str(getattr(s, "name", s.get("name", ""))).lower() for s in result}:
                result.append(name)
        return result

    # ------------------------------------------------------------------
    # DB loaders (tolerant to missing tables/environments)
    # ------------------------------------------------------------------
    async def _load_projects(self) -> List[Any]:
        try:
            stmt = (
                select(Project)
                .where(Project.deleted_at.is_(None))
                .where(Project.status == "published")
                .order_by(Project.created_at.asc())
            )
            res = await self.db.execute(stmt)
            return list(res.scalars().all())
        except Exception as exc:
            logger.warning("DB project load failed, falling back to LinkedIn: %s", exc)
            return []

    async def _load_experience(self) -> List[Any]:
        try:
            stmt = select(Experience).where(Experience.deleted_at.is_(None)).order_by(Experience.start_date.desc())
            res = await self.db.execute(stmt)
            return list(res.scalars().all())
        except Exception as exc:
            logger.warning("DB experience load failed: %s", exc)
            return []

    async def _load_db_skills(self) -> List[Any]:
        try:
            stmt = select(Skill).where(Skill.deleted_at.is_(None)).order_by(Skill.display_order.asc())
            res = await self.db.execute(stmt)
            return list(res.scalars().all())
        except Exception as exc:
            logger.warning("DB skills load failed: %s", exc)
            return []

    async def _load_timeline(self) -> List[Any]:
        try:
            stmt = select(TimelineEvent).order_by(TimelineEvent.event_date.desc())
            res = await self.db.execute(stmt)
            return list(res.scalars().all())
        except Exception as exc:
            logger.warning("DB timeline load failed: %s", exc)
            return []
