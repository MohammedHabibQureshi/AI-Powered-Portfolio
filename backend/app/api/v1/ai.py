import json
import logging
from typing import Any, Dict, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.middleware.rate_limiting import InMemoryRateLimiter
from app.database.session import get_db
from app.infrastructure.models.others import AIConversation, AIConversationMessage
from app.infrastructure.services.ai.factory import AIFactory
from app.services.ai_agent import AIAgentService
from app.services.knowledge import get_knowledge_service
from app.services.validator import ResponseValidator

logger = logging.getLogger("app.api.v1.ai")
router = APIRouter()

chat_limiter = InMemoryRateLimiter(requests_limit=10, window_seconds=60)
match_limiter = InMemoryRateLimiter(requests_limit=5, window_seconds=60)


class ChatRequest(BaseModel):
    session_id: str = Field(..., description="Unique visitor session identifier")
    message: str = Field(..., min_length=1, description="User question")


class JobMatchRequest(BaseModel):
    job_description: str = Field(..., min_length=10, description="Raw text of target job posting")


async def get_or_create_conversation(session_id: str, db: AsyncSession) -> AIConversation:
    """Fetch conversation mapped to session_id, or initialize a new record if missing."""
    stmt = select(AIConversation).where(AIConversation.session_id == session_id)
    res = await db.execute(stmt)
    conversation = res.scalars().first()

    if not conversation:
        conversation = AIConversation(session_id=session_id, visitor_type="general")
        db.add(conversation)
        await db.flush()

    return conversation


async def fetch_message_history(conversation_id: UUID, db: AsyncSession) -> List[dict]:
    """Retrieve preceding message list formatted for generative prompts."""
    stmt = (
        select(AIConversationMessage)
        .where(AIConversationMessage.conversation_id == conversation_id)
        .order_by(AIConversationMessage.created_at.asc())
        .limit(10)
    )
    res = await db.execute(stmt)
    messages = res.scalars().all()

    return [{"sender": msg.sender, "text": msg.text} for msg in messages]


@router.post("/chat", dependencies=[Depends(chat_limiter)])
async def chat(payload: ChatRequest, db: AsyncSession = Depends(get_db)):
    """
    Streams AI responses grounded in verified personal knowledge via SSE.

    The pipeline applies an application-level domain gate before any model
    call: out-of-scope and ambiguous questions receive a refusal/clarification
    stream, and the final answer is validated against the knowledge vocabulary.
    """
    try:
        conversation = await get_or_create_conversation(payload.session_id, db)
        history = await fetch_message_history(conversation.id, db)

        user_message = AIConversationMessage(
            conversation_id=conversation.id,
            sender="user",
            text=payload.message,
        )
        db.add(user_message)
        await db.flush()

        agent_service = AIAgentService(db)
        knowledge = get_knowledge_service()
        snapshot = knowledge.snapshot()
        validator = ResponseValidator(snapshot.vocabulary())

        async def event_generator():
            full_response_text = ""
            confidence_score = 0.95
            citations = []
            response_type = "answer"

            try:
                async for chunk in agent_service.chat_stream(payload.message, history):
                    text_segment = chunk.get("chunk", "")
                    full_response_text += text_segment
                    confidence_score = chunk.get("confidence", confidence_score)
                    citations = chunk.get("citations", citations)
                    response_type = chunk.get("type", response_type)

                    yield f"data: {json.dumps(chunk)}\n\n"

                # Post-stream grounding validation (spec section 21).
                validation = validator.validate(full_response_text)
                if not validation.supported and response_type == "answer":
                    confidence_score = max(0.0, confidence_score - validation.confidence_penalty)
                    caveat_chunk = {
                        "chunk": validation.caveat,
                        "confidence": confidence_score,
                        "citations": citations,
                        "intent": "answer",
                        "type": "answer",
                    }
                    full_response_text += validation.caveat
                    yield f"data: {json.dumps(caveat_chunk)}\n\n"
                    logger.info(
                        "Grounding validation flagged %d unsupported claim(s): %s",
                        len(validation.unsupported_claims),
                        validation.unsupported_claims[:5],
                    )

                assistant_message = AIConversationMessage(
                    conversation_id=conversation.id,
                    sender="assistant",
                    text=full_response_text,
                    confidence_score=confidence_score,
                    citations=citations,
                )
                db.add(assistant_message)
                await db.commit()
            except Exception as e:
                logger.error(f"Error inside SSE stream loop: {e}")
                await db.rollback()
                error_chunk = json.dumps({"chunk": f"[Stream Error: {str(e)}]", "confidence": 0.0, "citations": []})
                yield f"data: {error_chunk}\n\n"

        return StreamingResponse(event_generator(), media_type="text/event-stream")

    except Exception as e:
        logger.error(f"Chat route failed setup: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initiate chat stream: {str(e)}",
        )


@router.post("/match-job", response_model=Dict[str, Any], dependencies=[Depends(match_limiter)])
async def match_job(payload: JobMatchRequest, db: AsyncSession = Depends(get_db)):
    """
    Compares a raw job description against the portfolio owner's verified skills
    and projects only. Missing skills are reported as gaps and never invented.
    """
    try:
        snapshot = get_knowledge_service().snapshot()
        profile = snapshot.profile

        skills = list(profile.skills)
        projects = [
            {
                "title": proj.get("title", ""),
                "description": proj.get("description", "") or proj.get("short_description", ""),
            }
            for proj in profile.projects
            if proj.get("title")
        ]

        # 2. Configure target JSON Schema for structured AI extraction
        extraction_schema = {
            "type": "object",
            "properties": {
                "match_percentage": {"type": "integer"},
                "relevant_projects": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "title": {"type": "string"},
                            "reason": {"type": "string"},
                        },
                        "required": ["title", "reason"],
                    },
                },
                "relevant_skills": {
                    "type": "array",
                    "items": {"type": "string"},
                },
                "gaps": {
                    "type": "array",
                    "items": {"type": "string"},
                },
                "recommendation": {"type": "string"},
            },
            "required": ["match_percentage", "relevant_projects", "relevant_skills", "gaps", "recommendation"],
        }

        provider = AIFactory.get_provider()
        parsing_prompt = (
            f"JOB DESCRIPTION:\n{payload.job_description}\n\n"
            f"OWNER VERIFIED SKILLS LIST:\n{', '.join(skills) if skills else '(none listed)'}\n\n"
            f"OWNER VERIFIED PROJECTS LIST:\n{json.dumps(projects) if projects else '(none listed)'}\n\n"
            "INSTRUCTIONS:\n"
            "- Compare ONLY against the verified skills and projects above.\n"
            "- Do NOT invent skills, projects, or experience that are not listed.\n"
            "- Report skills the job requires but the owner lacks in 'gaps'.\n"
        )

        extracted_result = await provider.extract(parsing_prompt, extraction_schema)
        return extracted_result
    except Exception as e:
        logger.error(f"Job matching service failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to compile job match profile: {str(e)}",
        )


@router.get("/knowledge/status")
async def knowledge_status():
    """Development/admin diagnostic exposing knowledge source freshness."""
    return get_knowledge_service().status()


@router.post("/knowledge/refresh")
async def knowledge_refresh():
    """Manually trigger a knowledge refresh (content-hash based)."""
    service = get_knowledge_service()
    changed = service.refresh()
    return {"changed": changed, **service.status()}
