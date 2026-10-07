"""End-to-end agent pipeline tests: out-of-scope rejection before the model,
in-scope grounding, and hallucination validation."""

import pytest

from app.services.ai_agent import AIAgentService
from app.services.knowledge import get_knowledge_service
from app.services.validator import ResponseValidator


async def _collect(service, query):
    chunks = []
    async for chunk in service.chat_stream(query, []):
        chunks.append(chunk)
    return chunks


@pytest.mark.asyncio
async def test_out_of_scope_query_streams_refusal_without_model(db_session):
    service = AIAgentService(db_session)
    chunks = await _collect(service, "What is the current price of gold?")
    text = "".join(c.get("chunk", "") for c in chunks)
    assert chunks[0]["type"] == "refusal"
    assert "can't answer general questions" in text


@pytest.mark.asyncio
async def test_ambiguous_query_streams_clarification(db_session):
    service = AIAgentService(db_session)
    chunks = await _collect(service, "Tell me about AI.")
    text = "".join(c.get("chunk", "") for c in chunks)
    assert chunks[0]["type"] == "clarification"
    assert "experience or projects involving ai" in text.lower()


@pytest.mark.asyncio
async def test_in_scope_query_streams_answer(db_session):
    service = AIAgentService(db_session)
    chunks = await _collect(service, "Tell me about your projects.")
    assert chunks[0]["type"] == "answer"
    assert chunks[0]["intent"] == "PROJECT"


@pytest.mark.asyncio
async def test_grounding_context_contains_linkedin_skills(db_session):
    service = AIAgentService(db_session)
    context = await service.get_grounding_context("SKILLS", "What are your skills?")
    assert "SKILLS" in context.upper()
    assert "Python" in context


def test_validator_flags_unknown_entity():
    snapshot = get_knowledge_service().snapshot()
    validator = ResponseValidator(snapshot.vocabulary())
    result = validator.validate("I worked at a completely fictional company called Zephyrion Labs on Planet X.")
    assert result.supported is False
    assert result.confidence_penalty > 0
    assert "may not be verified" in result.caveat


def test_validator_passes_grounded_text():
    snapshot = get_knowledge_service().snapshot()
    validator = ResponseValidator(snapshot.vocabulary())
    result = validator.validate("My projects include an AWS Cloud Security Posture Monitoring System using Terraform.")
    assert result.supported is True
