import { describe, expect, it } from "vitest";
import {
  AMBIGUOUS_MESSAGE,
  REFUSAL_MESSAGE,
  UNVERIFIED_MESSAGE,
  buildClarificationMessage,
  buildSystemPrompt,
} from "../persona";

describe("Persona copy", () => {
  it("refusal message keeps the domain boundary naturally", () => {
    expect(REFUSAL_MESSAGE).toContain("background");
    expect(REFUSAL_MESSAGE).toContain("projects");
    expect(REFUSAL_MESSAGE).not.toContain("AI");
  });

  it("ambiguous message asks for clarification naturally", () => {
    expect(AMBIGUOUS_MESSAGE).toContain("professional background");
    expect(AMBIGUOUS_MESSAGE).toContain("clarify");
  });

  it("clarification with a topic mentions owner projects", () => {
    const message = buildClarificationMessage("AI");
    expect(message).toContain("AI");
    expect(message).toContain("projects involving");
  });

  it("clarification without a topic uses generic copy", () => {
    expect(buildClarificationMessage()).toContain("professional background");
    expect(buildClarificationMessage(undefined)).toBe(AMBIGUOUS_MESSAGE);
  });

  it("system prompt enforces restrictions", () => {
    const prompt = buildSystemPrompt("Mohammed Habib Qureshi", "SKILLS:\n- Python\n- C");
    expect(prompt).toContain("professional recruiter assistant");
    expect(prompt).toContain("Mohammed Habib Qureshi");
    expect(prompt).toContain("NEVER answer");
    expect(prompt).toContain("NEVER invent");
    expect(prompt).toContain("NEVER use general world knowledge");
    expect(prompt).toContain(UNVERIFIED_MESSAGE);
    expect(prompt).toContain("SKILLS:");
  });

  it("system prompt provides background naturally without RAG meta-language", () => {
    const prompt = buildSystemPrompt("Owner", "PROJECTS:\n- AWS Security Monitor");
    expect(prompt).toContain("PROJECTS:");
    expect(prompt).toContain("BACKGROUND INFORMATION");
    expect(prompt).not.toContain("VERIFIED PORTFOLIO KNOWLEDGE SOURCES");
    expect(prompt.toLowerCase()).not.toContain("grounded");
  });
});