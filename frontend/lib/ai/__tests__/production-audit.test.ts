import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { AIAgentService } from "../agent";
import { DomainClassifier } from "../classifier";
import {
  buildRetrieval,
  resolveProjectEntity,
  findMatchingRepository,
  detectTopic,
  extractSearchTerms,
} from "../retrieval";
import {
  getKnowledgeService,
  resetKnowledgeService,
} from "../knowledge";
import { ResponseValidator } from "../validator";

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function ask(
  agent: AIAgentService,
  query: string
): Promise<{ text: string; type: string; intent: string }> {
  let text = "";
  let type = "";
  let intent = "";
  for await (const chunk of agent.chatStream(query, [])) {
    if (chunk.type) type = chunk.type;
    if (chunk.intent) intent = chunk.intent;
    text += chunk.chunk ?? "";
  }
  return { text: text.trim(), type, intent };
}

async function askWithHistory(
  agent: AIAgentService,
  query: string,
  history: Array<{ sender: "user" | "assistant"; text: string }>
): Promise<{ text: string; type: string; intent: string }> {
  let text = "";
  let type = "";
  let intent = "";
  for await (const chunk of agent.chatStream(query, history)) {
    if (chunk.type) type = chunk.type;
    if (chunk.intent) intent = chunk.intent;
    text += chunk.chunk ?? "";
  }
  return { text: text.trim(), type, intent };
}

const agent = () => new AIAgentService();
const TIMEOUT = 60000;

const snapshot = () => getKnowledgeService().snapshot();
const VOCAB = snapshot().vocabulary();

function classify(text: string) {
  const c = new DomainClassifier(0.6);
  return c.classify(text, VOCAB);
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1: FULL PIPELINE TRACE
// ═══════════════════════════════════════════════════════════════════════════════
describe("Full Pipeline Trace", { timeout: TIMEOUT }, () => {
  it("trace: What technologies did he use in AWS CSPM?", async () => {
    const snap = snapshot();
    const query = "What technologies did he use in AWS CSPM?";

    // Step 1: Classification
    const classification = classify(query);
    expect(classification.is_in_scope).toBe(true);
    expect(classification.intent).toBe("PROJECT");

    // Step 2: Retrieval
    const retrieval = buildRetrieval(query, classification.intent, snap);
    expect(retrieval.entity).toBe("AWS Cloud Security Posture Monitoring System");
    expect(retrieval.topic).toBe("AWS");
    expect(retrieval.matchedProjects.length).toBeGreaterThan(0);
    expect(retrieval.matchedProjects[0].project.title).toBe(
      "AWS Cloud Security Posture Monitoring System"
    );

    // Step 3: Focused project
    const focus = retrieval.matchedProjects.find(
      (p) => p.project.title === retrieval.entity
    );
    expect(focus).toBeDefined();
    expect(focus!.project.technologies).toBeDefined();

    // Step 4: Repository mapping
    expect(focus!.repository).toBeDefined();
    expect(focus!.repository!.url).toContain("aws-cloud-security-posture-monitor");

    // Step 5: Full answer
    const { type, text } = await ask(agent(), query);
    expect(type).toBe("answer");
    expect(text).toMatch(/Lambda|Terraform|Boto3|DynamoDB|CloudWatch/);
  });

  it("trace: What sensors did he use in environmental monitoring?", async () => {
    const snap = snapshot();
    const query = "What sensors did he use in his environmental monitoring project?";

    const classification = classify(query);
    expect(classification.is_in_scope).toBe(true);
    expect(classification.intent).toBe("PROJECT");

    const retrieval = buildRetrieval(query, classification.intent, snap);
    expect(retrieval.entity).toBe(
      "IoT Multi Parameter Environmental Monitoring System"
    );
    expect(retrieval.topic).toBe("IoT");

    const focus = retrieval.matchedProjects.find(
      (p) => p.project.title === retrieval.entity
    );
    expect(focus).toBeDefined();
    expect(focus!.project.technologies?.join(" ")).toMatch(/DHT|MQ135|BMP280|ESP32/);

    // Must NOT contain AWS CSPM technologies
    expect(focus!.project.technologies?.join(" ")).not.toMatch(/Terraform|Lambda/);

    const { type, text } = await ask(agent(), query);
    expect(type).toBe("answer");
    expect(text.toLowerCase()).toMatch(/dht|mq135|bmp280|esp32|sensor/);
  });

  it("trace: What did Habib build with OpenCV?", async () => {
    const snap = snapshot();
    const query = "What did Habib build with OpenCV?";

    const classification = classify(query);
    expect(classification.is_in_scope).toBe(true);

    const retrieval = buildRetrieval(query, classification.intent, snap);
    expect(retrieval.entity).toBe(
      "Gesture-Driven Robotic Control using OpenCV"
    );

    // Must NOT retrieve AWS CSPM
    const focus = retrieval.matchedProjects.find(
      (p) => p.project.title === retrieval.entity
    );
    expect(focus).toBeDefined();
    expect(focus!.project.technologies?.join(" ")).toMatch(/OpenCV/);

    const { type, text } = await ask(agent(), query);
    expect(type).toBe("answer");
    expect(text.toLowerCase()).toMatch(/gesture|opencv|robotic/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2: PROJECT ISOLATION
// ═══════════════════════════════════════════════════════════════════════════════
describe("Project Isolation", { timeout: TIMEOUT }, () => {
  const PROJECTS: Record<string, { keywords: string[]; notKeywords: string[] }> = {
    "AWS Cloud Security Posture Monitoring System": {
      keywords: ["Lambda", "Terraform", "Boto3", "DynamoDB", "CloudWatch", "SNS", "IAM", "S3", "EC2", "CloudTrail"],
      notKeywords: ["ESP32", "DHT22", "MQ135", "OpenCV", "Raspberry Pi", "MagicMirror", "OLED", "STM32", "FastAPI", "React"],
    },
    "AI-Driven Web Application Security Suite (WAF + Scanner)": {
      keywords: ["FastAPI", "React", "PostgreSQL", "Redis", "Celery", "Gemini"],
      notKeywords: ["Lambda", "Terraform", "DynamoDB", "ESP32", "DHT22", "OpenCV", "Raspberry Pi", "STM32", "OLED"],
    },
    "IoT Multi Parameter Environmental Monitoring System": {
      keywords: ["ESP32", "DHT22", "MQ135", "MQTT"],
      notKeywords: ["Lambda", "Terraform", "FastAPI", "React", "PostgreSQL", "OpenCV", "STM32", "OLED"],
    },
    "Gesture-Driven Robotic Control using OpenCV": {
      keywords: ["OpenCV", "Arduino", "Servo"],
      notKeywords: ["Lambda", "Terraform", "ESP32", "DHT22", "STM32", "OLED", "FastAPI", "React"],
    },
    "IoT Smart Mirror using Personal Assistant": {
      keywords: ["Raspberry Pi", "ESP32", "MagicMirror"],
      notKeywords: ["Lambda", "Terraform", "FastAPI", "PostgreSQL", "OpenCV", "STM32", "OLED"],
    },
    "Heart Rate Monitoring Using OLED Display and STM32": {
      keywords: ["STM32", "OLED", "Embedded C"],
      notKeywords: ["Lambda", "Terraform", "ESP32", "DHT22", "FastAPI", "React", "OpenCV", "Raspberry Pi"],
    },
  };

  for (const [projectTitle, { keywords }] of Object.entries(PROJECTS)) {
    it(`${projectTitle}: technologies belong to correct project`, async () => {
      const snap = snapshot();
      const query = `What technologies did he use in ${projectTitle}?`;
      const retrieval = buildRetrieval(query, "PROJECT", snap);

      const focus = retrieval.matchedProjects.find(
        (p) => p.project.title === retrieval.entity
      );
      if (focus) {
        const techStr = focus.project.technologies?.join(" ") ?? "";
        for (const kw of keywords) {
          expect(techStr).toContain(kw);
        }
      }
    });

    it(`${projectTitle}: GitHub URL is correct`, async () => {
      const snap = snapshot();
      const proj = snap.profile.projects.find((p) => p.title === projectTitle);
      if (proj) {
        const repo = findMatchingRepository(proj, snap.repositories);
        if (repo) {
          // Verify URL is for this project, not another
          const url = repo.url ?? "";
          if (projectTitle.includes("AWS CSPM") || projectTitle.includes("Cloud Security")) {
            expect(url).toContain("aws-cloud-security-posture-monitor");
          } else if (projectTitle.includes("WAF") || projectTitle.includes("Security Suite")) {
            expect(url).toContain("AI-Driven-Web-Application-Security-Suite");
          } else if (projectTitle.includes("Environmental Monitoring")) {
            expect(url).toContain("oT-Multi-Parameter-Environmental-Monitoring");
          } else if (projectTitle.includes("Blockchain")) {
            expect(url).toContain("Blockchain-Learning");
          }
        }
      }
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3: HALLUCINATION VALIDATOR
// ═══════════════════════════════════════════════════════════════════════════════
describe("Hallucination Validator", () => {
  it("flags unsupported claims (Kubernetes, Docker)", () => {
    const snap = snapshot();
    const vocab = snap.vocabulary();
    const validator = new ResponseValidator(vocab);

    const response =
      "In AWS CSPM, Habib used AWS Lambda, Terraform, DynamoDB, CloudWatch, Kubernetes, and Docker.";
    const result = validator.validate(response);
    expect(result.supported).toBe(false);
    expect(result.unsupported_claims.length).toBeGreaterThan(0);
    // Kubernetes and Docker should be flagged
    const allClaims = result.unsupported_claims.join(" ").toLowerCase();
    expect(allClaims).toMatch(/kubernetes|docker/);
  });

  it("does not flag supported claims", () => {
    const snap = snapshot();
    const vocab = snap.vocabulary();
    const validator = new ResponseValidator(vocab);

    const response =
      "In AWS CSPM, Habib used AWS Lambda, Terraform, Boto3, DynamoDB, and CloudWatch.";
    const result = validator.validate(response);
    expect(result.supported).toBe(true);
  });

  it("flags fabricated project names", () => {
    const snap = snapshot();
    const vocab = snap.vocabulary();
    const validator = new ResponseValidator(vocab);

    const response =
      "Habib built a Quantum Computing Dashboard using Qiskit and IBM Quantum.";
    const result = validator.validate(response);
    expect(result.supported).toBe(false);
    expect(result.unsupported_claims.length).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 4: MISSING INFORMATION
// ═══════════════════════════════════════════════════════════════════════════════
describe("Missing Information", { timeout: TIMEOUT }, () => {
  it("challenges question returns documented response", async () => {
    const { text } = await ask(agent(), "What challenges did he face in AWS CSPM?");
    expect(text.toLowerCase()).toMatch(
      /don't have documented|not documented|no specific challenges/
    );
  });

  it("learning question returns documented response", async () => {
    const { text } = await ask(agent(), "What did he learn from AWS CSPM?");
    expect(text.length).toBeGreaterThan(10);
    // Must NOT fabricate specific learning outcomes
    expect(text.toLowerCase()).not.toMatch(
      /i learned how to configure|the main takeaway was|the key learning/
    );
  });

  it("does not fabricate responsibilities for non-existent role", async () => {
    const { text } = await ask(agent(), "What was his role at Google?");
    expect(text.toLowerCase()).toMatch(
      /don't have documented|not documented|not available|no information/
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 5: SHORT TOKEN MATCHING
// ═══════════════════════════════════════════════════════════════════════════════
describe("Short Token Matching", () => {
  it("'blockchain' must not match 'ai' inside it", () => {
    // Verify the word-boundary regex doesn't cause false positives
    const query = "What is blockchain?";
    const result = classify(query);
    expect(result.is_in_scope).toBe(false);
    expect(result.intent).toBe("OUT_OF_SCOPE");
  });

  it("'AI' standalone must be handled correctly", () => {
    const result = classify("What is AI?");
    expect(result.is_in_scope).toBe(false);
    expect(result.intent).toBe("OUT_OF_SCOPE");
  });

  it("'C' standalone must not false-positive", () => {
    const result = classify("What is C?");
    expect(result.is_in_scope).toBe(false);
    expect(result.intent).toBe("OUT_OF_SCOPE");
  });

  it("'IoT' must not false-positive on other tokens", () => {
    const result = classify("What is IoT?");
    expect(result.is_in_scope).toBe(false);
    expect(result.intent).toBe("OUT_OF_SCOPE");
  });

  it("search terms filter short tokens", () => {
    const terms = extractSearchTerms("What is AI?");
    // 'AI' is only 2 chars, should be filtered
    expect(terms).not.toContain("ai");
  });

  it("search terms include meaningful tokens", () => {
    const terms = extractSearchTerms("What technologies did he use in AWS CSPM?");
    expect(terms).toContain("aws");
    expect(terms).toContain("cspm");
    expect(terms).toContain("technologies");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 6: CONVERSATION CONTEXT PRESERVATION
// ═══════════════════════════════════════════════════════════════════════════════
describe("Conversation Context", { timeout: TIMEOUT }, () => {
  it("follow-up: Tell me about AWS CSPM, then What technologies did he use?", async () => {
    const svc = agent();
    const first = await askWithHistory(svc, "Tell me about AWS CSPM.", []);
    expect(first.type).toBe("answer");
    expect(first.text.toLowerCase()).toMatch(/cspm|aws|cloud security/);

    // Second question with history: should still answer about AWS CSPM
    const second = await askWithHistory(svc, "What technologies did he use?", [
      { sender: "user", text: "Tell me about AWS CSPM." },
      { sender: "assistant", text: first.text },
    ]);
    expect(second.type).toBe("answer");
    expect(second.text).toMatch(/Lambda|Terraform|Boto3|DynamoDB|CloudWatch/);
  });

  it("follow-up: Tell me about environmental monitoring, then What sensors?", async () => {
    const svc = agent();
    const first = await askWithHistory(svc, "Tell me about his environmental monitoring project.", []);
    expect(first.type).toBe("answer");

    const second = await askWithHistory(svc, "What sensors did he use?", [
      { sender: "user", text: "Tell me about his environmental monitoring project." },
      { sender: "assistant", text: first.text },
    ]);
    expect(second.type).toBe("answer");
    expect(second.text.toLowerCase()).toMatch(/dht|mq135|bmp280|esp32|sensor/);
    // Must NOT return AWS CSPM sensors
    expect(second.text.toLowerCase()).not.toMatch(/terraform|lambda|cloudwatch/);
  });

  it("follow-up: What projects has he done?, then Which one uses AWS?", async () => {
    const svc = agent();
    const first = await askWithHistory(svc, "What projects has he done?", []);
    expect(first.type).toBe("answer");
    expect(first.text).toContain("AWS Cloud Security Posture Monitoring System");

    // With conversation history, "Which one uses AWS?" should resolve to the
    // AWS-related project from the previous answer via anaphora resolution.
    const second = await askWithHistory(svc, "Which one uses AWS?", [
      { sender: "user", text: "What projects has he done?" },
      { sender: "assistant", text: first.text },
    ]);
    expect(second.type).toBe("answer");
    expect(second.text.toLowerCase()).toMatch(/aws|cspm|cloud security/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 7: NO GENERIC FALLBACK
// ═══════════════════════════════════════════════════════════════════════════════
describe("No Generic Fallback", { timeout: TIMEOUT }, () => {
  it("AWS CSPM question does not return generic profile", async () => {
    const { text } = await ask(agent(), "What technologies did he use in AWS CSPM?");
    // Must NOT contain generic profile text
    expect(text.toLowerCase()).not.toContain(
      "i work across embedded systems"
    );
    expect(text.toLowerCase()).not.toContain(
      "i'm a computer science"
    );
    // Must contain project-specific tech
    expect(text).toMatch(/Lambda|Terraform|Boto3|DynamoDB/);
  });

  it("WAF question does not return generic profile", async () => {
    const { text } = await ask(agent(), "What technologies did he use in the WAF project?");
    expect(text.toLowerCase()).not.toContain(
      "i work across embedded systems"
    );
    expect(text.toLowerCase()).toMatch(/fastapi|react|postgresql|redis|celery/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 8: NATURAL RESPONSE STYLE
// ═══════════════════════════════════════════════════════════════════════════════
describe("Natural Response Style", { timeout: TIMEOUT }, () => {
  it("no 'Based on my portfolio data' phrases", async () => {
    const { text } = await ask(agent(), "Tell me about Habib.");
    expect(text.toLowerCase()).not.toMatch(
      /based on my (portfolio|knowledge|verified|training)/
    );
    expect(text.toLowerCase()).not.toMatch(
      /according to (my|the|your)/
    );
    expect(text.toLowerCase()).not.toMatch(
      /from my (knowledge|database|portfolio)/
    );
  });

  it("no AI-related language", async () => {
    const { text } = await ask(agent(), "Tell me about Habib.");
    expect(text.toLowerCase()).not.toContain("i am an ai");
    expect(text.toLowerCase()).not.toContain("as an ai");
    expect(text.toLowerCase()).not.toContain("ai assistant");
    expect(text.toLowerCase()).not.toContain("language model");
  });

  it("sounds like a professional assistant", async () => {
    const { text } = await ask(agent(), "What projects has he done?");
    // Should contain natural language about projects
    expect(text.length).toBeGreaterThan(50);
    expect(text.toLowerCase()).toMatch(/project|built|developed|worked/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 9: DYNAMIC DATA REFRESH
// ═══════════════════════════════════════════════════════════════════════════════
describe("Dynamic Data Refresh", () => {
  it("knowledge service detects file changes via content hash", () => {
    const svc1 = getKnowledgeService();
    const v1 = svc1.snapshot().version;

    // Simulate refresh (files haven't changed, version should stay same)
    svc1.refreshIfChanged();
    const v2 = svc1.snapshot().version;
    expect(v2).toBe(v1);
  });

  it("LinkedIn data is NOT hardcoded in persona.ts", () => {
    // persona.ts should contain behavioral instructions only
    // Read persona.ts and verify it doesn't contain specific data
    const personaPath = path.join(__dirname, "..", "persona.ts");
    const content = fs.readFileSync(personaPath, "utf8");

    // Should NOT contain specific project names, skills, or dates
    expect(content).not.toContain("AWS Cloud Security Posture Monitoring");
    expect(content).not.toContain("ESP32");
    expect(content).not.toContain("FastAPI");
    expect(content).not.toContain("KL University");
    expect(content).not.toContain("2023");
    expect(content).not.toContain("2027");
  });

  it("knowledge service can be reset and reloaded", () => {
    resetKnowledgeService();
    const svc = getKnowledgeService();
    const snap = svc.snapshot();
    expect(snap.profile.name).toBe("Mohammed Habib Qureshi");
    expect(snap.repositories.length).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 10: TECHNICAL TERM VS PERSONAL QUESTION
// ═══════════════════════════════════════════════════════════════════════════════
describe("Technical Term vs Personal Question", () => {
  const OUT_OF_SCOPE_CASES = [
    "What is AI?",
    "What is blockchain?",
    "What is Terraform?",
    "What is Python?",
    "What is IoT?",
    "What is machine learning?",
    "What is AWS?",
  ];

  const IN_SCOPE_CASES = [
    "What is AI and how has Habib used it?",
    "What blockchain projects has Habib worked on?",
    "What Terraform experience does Habib have?",
    "What AWS services has Habib used?",
    "Does Habib know AI?",
  ];

  for (const q of OUT_OF_SCOPE_CASES) {
    it(`"${q}" → OUT_OF_SCOPE`, () => {
      const result = classify(q);
      expect(result.is_in_scope).toBe(false);
      expect(result.intent).toBe("OUT_OF_SCOPE");
    });
  }

  for (const q of IN_SCOPE_CASES) {
    it(`"${q}" → in scope`, () => {
      const result = classify(q);
      expect(result.is_in_scope).toBe(true);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 11: PROJECT ENTITY RESOLUTION
// ═══════════════════════════════════════════════════════════════════════════════
describe("Project Entity Resolution", () => {
  const ENTITY_CASES: Array<[string, string]> = [
    ["What did he use in AWS CSPM?", "AWS Cloud Security Posture Monitoring System"],
    ["Tell me about the WAF project.", "AI-Driven Web Application Security Suite (WAF + Scanner)"],
    ["What sensors are in Environmental Monitoring?", "IoT Multi Parameter Environmental Monitoring System"],
    ["Tell me about the Smart Mirror.", "IoT Smart Mirror using Personal Assistant"],
    ["What about Heart Rate Monitoring?", "Heart Rate Monitoring Using OLED Display and STM32"],
    ["Tell me about the Gesture Robot project.", "Gesture-Driven Robotic Control using OpenCV"],
  ];

  for (const [query, expected] of ENTITY_CASES) {
    it(`"${query}" → "${expected}"`, () => {
      const entity = resolveProjectEntity(query, snapshot().profile.projects);
      expect(entity).toBe(expected);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 12: TOPIC DETECTION
// ═══════════════════════════════════════════════════════════════════════════════
describe("Topic Detection", () => {
  it("detects IoT topic", () => {
    expect(detectTopic("What IoT projects has he done?")).toBe("IoT");
  });

  it("detects AWS topic", () => {
    expect(detectTopic("What AWS services did he use?")).toBe("AWS");
  });

  it("detects Cybersecurity topic", () => {
    expect(detectTopic("Tell me about his security projects.")).toBe("Cybersecurity");
  });

  it("detects Blockchain topic", () => {
    expect(detectTopic("What blockchain work has he done?")).toBe("Blockchain");
  });

  it("detects AI topic", () => {
    expect(detectTopic("What AI work has he done?")).toBe("AI");
  });

  it("detects Python topic", () => {
    expect(detectTopic("What Python projects has he done?")).toBe("Python");
  });

  it("returns null for no topic", () => {
    expect(detectTopic("Tell me about Habib.")).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 13: SOURCE PRIORITY
// ═══════════════════════════════════════════════════════════════════════════════
describe("Source Priority", { timeout: TIMEOUT }, () => {
  it("education questions use LinkedIn data", async () => {
    const { text } = await ask(agent(), "Where does he study?");
    expect(text).toMatch(/KL University/);
  });

  it("project tech questions use GitHub data when available", async () => {
    const snap = snapshot();
    const retrieval = buildRetrieval(
      "What technologies did he use in AWS CSPM?",
      "PROJECT",
      snap
    );
    const focus = retrieval.matchedProjects.find(
      (p) => p.project.title === retrieval.entity
    );
    // Should have a repository with README
    expect(focus?.repository).toBeDefined();
    expect(focus?.repository?.readme).toBeDefined();
    expect(focus!.repository!.readme!.length).toBeGreaterThan(100);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 14: ALL OUT-OF-SCOPE QUESTIONS
// ═══════════════════════════════════════════════════════════════════════════════
describe("All Out-of-Scope Questions", { timeout: TIMEOUT }, () => {
  const cases = [
    "What is the price of gold?",
    "What is happening in India?",
    "What is today's weather?",
    "What is Bitcoin?",
    "What is Python?",
    "What is blockchain?",
    "What is AWS Lambda?",
    "What is Terraform?",
    "What is AI?",
    "What is IoT?",
    "What is machine learning?",
    "Tell me about AI.",
    "Write a Python program.",
    "How can I learn cybersecurity?",
    "What is the latest phone?",
    "Who is the president of India?",
    "Translate this to French.",
  ];

  for (const q of cases) {
    it(`"${q}" → refusal`, async () => {
      const { type } = await ask(agent(), q);
      expect(type).toBe("refusal");
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 15: PRONOUN RESOLUTION
// ═══════════════════════════════════════════════════════════════════════════════
describe("Pronoun Resolution", { timeout: TIMEOUT }, () => {
  it("pronoun 'his' triggers in-scope", () => {
    const result = classify("What are his skills?");
    expect(result.is_in_scope).toBe(true);
  });

  it("pronoun 'he' triggers in-scope", () => {
    const result = classify("What has he built?");
    expect(result.is_in_scope).toBe(true);
  });

  it("'yourself' triggers personal profile", () => {
    const result = classify("Tell me about yourself.");
    expect(result.is_in_scope).toBe(true);
    expect(result.intent).toBe("PERSONAL_PROFILE");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 16: QUESTION-SPECIFIC RETRIEVAL
// ═══════════════════════════════════════════════════════════════════════════════
describe("Question-Specific Retrieval", { timeout: TIMEOUT }, () => {
  it("challenge questions are detected", async () => {
    const snap = snapshot();
    const retrieval = buildRetrieval(
      "What challenges did he face in AWS CSPM?",
      "PROJECT",
      snap
    );
    expect(retrieval.isChallengeQuestion).toBe(true);
  });

  it("learning questions are detected", async () => {
    const snap = snapshot();
    const retrieval = buildRetrieval(
      "What did he learn from AWS CSPM?",
      "PROJECT",
      snap
    );
    const { isLearningQuestion } = await import("../retrieval");
    expect(isLearningQuestion(retrieval.normalizedQuery)).toBe(true);
  });

  it("tech questions focus on technologies", async () => {
    const snap = snapshot();
    const retrieval = buildRetrieval(
      "What technologies did he use in AWS CSPM?",
      "PROJECT",
      snap
    );
    expect(retrieval.entity).toBe(
      "AWS Cloud Security Posture Monitoring System"
    );
    expect(retrieval.matchedProjects.length).toBeGreaterThan(0);
  });
});
