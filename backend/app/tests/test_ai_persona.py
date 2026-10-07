"""Persona copy tests: strict system prompt, refusal and clarification messages."""

from app.services.ai_persona import (
    AMBIGUOUS_MESSAGE,
    REFUSAL_MESSAGE,
    UNVERIFIED_MESSAGE,
    build_clarification_message,
    build_system_prompt,
)


def test_refusal_message_keeps_domain_boundary():
    assert "professional background" in REFUSAL_MESSAGE
    assert "can't answer general questions" in REFUSAL_MESSAGE


def test_ambiguous_message_asks_for_clarification():
    assert "professional profile" in AMBIGUOUS_MESSAGE


def test_clarification_with_topic_mentions_owner_projects():
    message = build_clarification_message("AI")
    assert "AI" in message
    assert "experience or projects involving" in message


def test_clarification_without_topic_uses_generic_copy():
    assert "professional profile" in build_clarification_message()
    assert build_clarification_message(None) == AMBIGUOUS_MESSAGE


def test_system_prompt_enforces_restrictions():
    prompt = build_system_prompt("Mohammed Habib Qureshi", "SKILLS:\n- Python\n- C")
    assert "You are a professional AI recruiter assistant" in prompt
    assert "Mohammed Habib Qureshi" in prompt
    assert "You are NOT a general-purpose assistant" in prompt
    assert "Never invent information" in prompt
    assert "Never use general world knowledge" in prompt
    assert UNVERIFIED_MESSAGE in prompt
    assert "SKILLS:" in prompt


def test_system_prompt_grounds_in_knowledge():
    prompt = build_system_prompt("Owner", "PROJECTS:\n- AWS Security Monitor")
    assert "PROJECTS:" in prompt
    assert "grounded" in prompt.lower()
