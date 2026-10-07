import { describe, expect, it } from "vitest";
import { AIAgentService } from "../agent";

// The spec's MOST IMPORTANT ACCEPTANCE TEST (section 36): each question must
// produce a different, question-specific answer — never a generic profile
// summary, clarification, or refusal.
const ACCEPTANCE_QUESTIONS = [
  "What projects has he done?",
  "What blockchain project has he done?",
  "What security projects has he done?",
  "What did he use in AWS CSPM?",
  "Give me the AWS CSPM project description.",
  "What challenges did he face in AWS CSPM?",
  "What certifications does he have?",
  "What IoT projects has he done?",
];

async function ask(agent: AIAgentService, query: string): Promise<{ text: string; type: string }> {
  let text = "";
  let type = "";
  for await (const chunk of agent.chatStream(query, [])) {
    if (chunk.type) type = chunk.type;
    text += chunk.chunk ?? "";
  }
  return { text: text.trim(), type };
}

const agent = () => new AIAgentService();

// Mock streaming throttles output (3 words / ~12ms), so multi-question tests
// need a longer budget than the default 5s.
const ACCEPTANCE_TIMEOUT = 30000;

describe("Acceptance: distinct question-specific answers (spec section 36)", { timeout: ACCEPTANCE_TIMEOUT }, () => {
  it("answers every acceptance question as an in-scope answer", async () => {
    for (const q of ACCEPTANCE_QUESTIONS) {
      const { type, text } = await ask(agent(), q);
      expect(type, `expected an answer for: ${q}`).toBe("answer");
      expect(text.length, `expected a substantive answer for: ${q}`).toBeGreaterThan(20);
    }
  });

  it("never returns the generic profile fallback", async () => {
    for (const q of ACCEPTANCE_QUESTIONS) {
      const { text } = await ask(agent(), q);
      expect(text, q).not.toContain("I work across embedded systems, IoT, cloud, and AI");
      expect(text.toLowerCase(), q).not.toContain("happy to go deeper");
    }
  });

  it("produces a different answer for each of the 8 questions", async () => {
    const answers: string[] = [];
    for (const q of ACCEPTANCE_QUESTIONS) {
      const { text } = await ask(agent(), q);
      answers.push(text);
    }
    expect(new Set(answers).size).toBe(ACCEPTANCE_QUESTIONS.length);
  });
});

describe("Acceptance: question-specific answers come from the right knowledge (spec section 35)", { timeout: ACCEPTANCE_TIMEOUT }, () => {
  it("blockchain questions answer from the blockchain learning repository", async () => {
    const recommendation = await ask(agent(), "Which project best demonstrates your blockchain skills?");
    expect(recommendation.type).toBe("answer");
    expect(recommendation.text.toLowerCase()).toContain("blockchain");

    const done = await ask(agent(), "What blockchain project has he done?");
    expect(done.type).toBe("answer");
    expect(done.text.toLowerCase()).toContain("blockchain");

    const built = await ask(agent(), "What blockchain projects has he built?");
    expect(built.type).toBe("answer");
    expect(built.text.toLowerCase()).toContain("blockchain");
  });

  it("security questions list the security projects", async () => {
    const { text } = await ask(agent(), "What security projects has he done?");
    expect(text).toContain("Security");
  });

  it("answers about all projects as a list", async () => {
    const { text } = await ask(agent(), "What projects has he done?");
    expect(text).toContain("AWS Cloud Security Posture Monitoring System");
    expect(text).toContain("AI-Driven Web Application Security Suite");
  });

  it("AWS CSPM technology question answers with the actual technologies", async () => {
    const { text } = await ask(agent(), "What did he use in AWS CSPM?");
    expect(text).toMatch(/Lambda|Terraform|Boto3|DynamoDB|CloudWatch/);
  });

  it("AWS CSPM description question answers with the project description", async () => {
    const { text } = await ask(agent(), "Give me the AWS CSPM project description.");
    expect(text).toMatch(/CSPM|Cloud Security Posture/);
  });

  it("challenge questions never invent challenges", async () => {
    const { text } = await ask(agent(), "What challenges did he face during AWS CSPM?");
    expect(text).toMatch(/don't have documented|not documented|no specific challenges/i);
  });

  it("certification questions answer with actual certifications", async () => {
    const { text } = await ask(agent(), "What certifications does he have?");
    expect(text).toMatch(/Oracle|AWS Cloud Practitioner|NPTEL|Coursera|IBM/);
  });

  it("education questions answer with actual education", async () => {
    const { text } = await ask(agent(), "What is his education?");
    expect(text).toMatch(/KL University|Bachelor|BTech/);
  });

  it("IoT questions answer with the IoT projects", async () => {
    const { text } = await ask(agent(), "What are his IoT projects?");
    expect(text).toMatch(/Environmental Monitoring|Smart Mirror/);
  });

  it("handles typos like 'proejcts'", async () => {
    const { type, text } = await ask(agent(), "what proejcts have he done?");
    expect(type).toBe("answer");
    expect(text).toContain("AWS Cloud Security Posture Monitoring System");
  });
});

describe("Acceptance: out-of-scope protection (spec sections 22-23)", { timeout: ACCEPTANCE_TIMEOUT }, () => {
  it("rejects finance questions", async () => {
    const { type } = await ask(agent(), "What is the price of gold?");
    expect(type).toBe("refusal");
  });

  it("rejects news questions", async () => {
    const { type } = await ask(agent(), "What is happening in India?");
    expect(type).toBe("refusal");
  });

  it("rejects definitional tech questions (spec section 5)", async () => {
    const { type, text } = await ask(agent(), "What is blockchain?");
    expect(type).toBe("refusal");
    expect(text.toLowerCase()).not.toContain("blockchain is a");
  });
});
