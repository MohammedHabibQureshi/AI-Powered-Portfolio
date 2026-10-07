import { AgentChunk, ChatHistoryMessage } from "./constants";
import { LinkedinProfile } from "./knowledge";
import { RetrievalResult } from "./retrieval";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";

export interface StreamParams {
  prompt: string;
  history: ChatHistoryMessage[];
  systemInstruction: string;
  profile?: LinkedinProfile;
  retrieval?: RetrievalResult;
}

export class GeminiProvider {
  private apiKey: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || "";
    this.model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  }

  get isConfigured(): boolean {
    return !!this.apiKey && this.apiKey !== "mockkey";
  }

  async *stream(params: StreamParams): AsyncGenerator<AgentChunk> {
    if (!this.isConfigured) {
      yield* this._mockStream(params);
      return;
    }

    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
    for (const msg of params.history) {
      contents.push({ role: msg.sender === "user" ? "user" : "model", parts: [{ text: msg.text }] });
    }
    contents.push({ role: "user", parts: [{ text: params.prompt }] });

    const url = `${GEMINI_API_URL}/${this.model}:streamGenerateContent?alt=sse&key=${encodeURIComponent(this.apiKey)}`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: params.systemInstruction }] },
          contents,
          generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
        }),
      });
    } catch (err) {
      console.error("[gemini] request failed:", err);
      yield { chunk: "\n[Streaming Exception: Gemini request failed]", confidence: 0.0, citations: [] };
      return;
    }

    if (!response.ok || !response.body) {
      let detail = "";
      try {
        detail = await response.text();
      } catch {
        detail = "";
      }
      console.error(`[gemini] HTTP ${response.status}: ${detail}`);
      yield { chunk: `\n[Streaming Exception: Gemini returned HTTP ${response.status}]`, confidence: 0.0, citations: [] };
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let boundary: number;
        while ((boundary = buffer.indexOf("\n\n")) !== -1) {
          const event = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);
          for (const line of event.split("\n")) {
            if (!line.startsWith("data:")) continue;
            const payload = line.slice(5).trim();
            if (!payload) continue;
            let confidence = 0.95;
            let textChunk = "";
            try {
              const json = JSON.parse(payload);
              const parts = json?.candidates?.[0]?.content?.parts;
              if (Array.isArray(parts)) {
                textChunk = parts.map((p: { text?: string }) => p.text ?? "").join("");
              }
              const lower = textChunk.toLowerCase();
              if (
                lower.includes("don't have enough info") ||
                lower.includes("sorry") ||
                lower.includes("i don't know")
              ) {
                confidence = 0.2;
              }
            } catch {
              continue;
            }
            if (textChunk) {
              yield { chunk: textChunk, confidence, citations: [] };
            }
          }
        }
      }
    } catch (err) {
      console.error("[gemini] stream error:", err);
      yield { chunk: `\n[Streaming Exception: ${err instanceof Error ? err.message : String(err)}]`, confidence: 0.0, citations: [] };
    }
  }

  async generateText(prompt: string, systemInstruction: string): Promise<string> {
    if (!this.isConfigured) {
      return "";
    }
    const url = `${GEMINI_API_URL}/${this.model}:generateContent?key=${encodeURIComponent(this.apiKey)}`;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 512 },
        }),
      });
      if (!response.ok) return "";
      const json = (await response.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      return json?.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    } catch (err) {
      console.error("[gemini] generateText failed:", err);
      return "";
    }
  }

  private async *_mockStream(params: StreamParams): AsyncGenerator<AgentChunk> {
    const replyText = this._buildMockReply(params);
    const words = replyText.split(/\s+/);
    for (let i = 0; i < words.length; i += 3) {
      const chunkWords = words.slice(i, i + 3).join(" ") + " ";
      yield { chunk: chunkWords, confidence: 0.95, citations: [] };
      await new Promise((resolve) => setTimeout(resolve, 12));
    }
  }

  private _buildMockReply(params: StreamParams): string {
    const { profile, retrieval } = params;
    if (!profile) {
      return (
        "Hi! Feel free to ask me about my projects, technical skills, experience, research, education, or GitHub work."
      );
    }
    if (!retrieval || retrieval.intent === "GREETING") {
      return this._genericProfileIntro(profile);
    }

    const query = retrieval.normalizedQuery;

    // If the query asks about a specific company/role not in the data, say so
    // (before intent-specific handling, so it applies to all intents)
    const companyMatch = /\b(?:at|for|in)\s+([a-zA-Z][a-zA-Z]+)\b/i.exec(query);
    if (companyMatch && !retrieval.entity) {
      const company = companyMatch[1];
      // Skip common English words that aren't company names
      const commonWords = new Set([
        "first", "last", "next", "least", "most", "best", "worst", "worst",
        "all", "any", "some", "both", "each", "every", "few", "many", "much",
        "his", "her", "its", "our", "their", "your", "my", "the", "this",
        "that", "these", "those", "what", "which", "who", "whom", "when",
        "where", "why", "how", "which", "that", "these", "those",
      ]);
      if (commonWords.has(company.toLowerCase())) {
        // Not a company name, fall through to normal handling
      } else {
        const knownCompanies = new Set(
          profile.experience.map((e) => (e.company ?? "").toLowerCase()).filter(Boolean)
        );
        if (!knownCompanies.has(company.toLowerCase())) {
          return `I don't have documented information about a role at ${company}. My professional experience is limited to what's shown in my background.`;
        }
      }
    }

    // Questions about the challenges faced during a project: never invent.
    if (
      /\b(challenge|challenges|difficult|hardest|hard part|problem|obstacle)\b/i.test(query) &&
      (retrieval.recommendedProject || retrieval.entity)
    ) {
      return "I don't have documented details about the specific challenges I faced during that project.";
    }

    // Questions about learning outcomes: never invent.
    if (
      /\b(learn(?:ed|ing)?|gain(?:ed|ing)?|takeaway|outcome)\b/i.test(query) &&
      (retrieval.recommendedProject || retrieval.entity)
    ) {
      return "I don't have documented details about what I specifically learned from that project.";
    }

    switch (retrieval.intent) {
      case "PROJECT":
      case "PROJECT_COMPARISON":
      case "ARCHITECTURE":
      case "JOB_MATCHING":
      case "RESUME":
        return this._answerProjectQuestion(profile, retrieval);
      case "SKILLS":
        return this._skillsText(profile);
      case "EDUCATION":
        return this._educationText(profile);
      case "CERTIFICATION":
        return this._certificationText(profile);
      case "GITHUB":
        return this._repositoriesText(retrieval.matchedRepositories.length > 0 ? retrieval.matchedRepositories : []);
      case "EXPERIENCE":
      case "CAREER":
        return this._experienceText(profile);
      case "PERSONAL_PROFILE":
      case "GENERAL_PERSONAL":
        return this._genericProfileIntro(profile);
      default:
        return this._genericProfileIntro(profile);
    }
  }

  private _answerProjectQuestion(profile: LinkedinProfile, retrieval: RetrievalResult): string {
    const query = retrieval.normalizedQuery;
    const techQuestion = /\b(use|uses|used|using|technolog(?:y|ies)?|tools?|stack|services|components)\b/i.test(query);
    const wantsDetails = /\b(description|describe|about|overview|how it works|purpose|detail|explain|tell)\b/i.test(query);
    const isSelection = /\b(which one|which project|which)\b/i.test(query);

    if (retrieval.entity) {
      const focus =
        retrieval.matchedProjects.find((p) => p.project.title === retrieval.entity) ??
        retrieval.recommendedProject;
      if (focus) return this._describeProject(focus, techQuestion ? "tech" : "description");
    }

    // For selection questions ("Which one uses X?"), describe the top match
    // instead of listing all projects — this ensures the next turn's anaphora
    // resolves to the correct entity.
    if (isSelection && retrieval.matchedProjects.length >= 1) {
      const top = retrieval.matchedProjects[0];
      return this._describeProject(top, techQuestion ? "tech" : "description");
    }

    if (retrieval.matchedProjects.length >= 2) {
      return this._listProjects(retrieval.matchedProjects.slice(0, 6), true);
    }

    if (retrieval.matchedProjects.length === 1) {
      return this._describeProject(retrieval.matchedProjects[0], techQuestion ? "tech" : "description");
    }

    if (retrieval.matchedRepositories.length) {
      return this._describeLearningRepos(retrieval.matchedRepositories);
    }

    if (profile.projects.length) {
      return this._listProjects(
        profile.projects.map((p) => ({ project: p })),
        wantsDetails
      );
    }
    return "I don't have documented information about that specific topic yet.";
  }

  private static _firstSentence(text?: string | null): string {
    const sentence = (text ?? "").split(/(?<=[.!?])\s+/)[0] ?? "";
    return sentence.replace(/[.!?]+$/, "").trim();
  }

  private _describeProject(
    focus: {
      project: { title?: string; dates?: string; description?: string; technologies?: string[] };
      repository?: { url?: string | null; name?: string; description?: string | null };
    },
    mode: "tech" | "description"
  ): string {
    const p = focus.project;
    const title = p.title ?? "that project";
    const dates = p.dates ? ` (${p.dates})` : "";
    const tech = p.technologies ?? [];
    const projectSummary = GeminiProvider._firstSentence(p.description);
    const repoSummary = GeminiProvider._firstSentence(focus.repository?.description);
    const repoUrl = focus.repository?.url ?? "";

    if (mode === "tech") {
      const parts: string[] = [];
      if (tech.length) {
        parts.push(`In ${title}, I primarily used ${tech.join(", ")}.`);
      } else if (projectSummary) {
        parts.push(`${title} is a ${projectSummary.toLowerCase()}.`);
      }
      if (repoSummary) parts.push(`It is built around ${repoSummary.toLowerCase()}.`);
      if (repoUrl) parts.push(`The code is on GitHub: ${repoUrl}.`);
      return parts.join(" ");
    }

    const parts: string[] = [];
    parts.push(`${title}${dates} is one of my key projects.`);
    if (projectSummary) parts.push(projectSummary + ".");
    if (tech.length) parts.push(`Technologies: ${tech.join(", ")}.`);
    if (repoSummary) parts.push(`It is a ${repoSummary.toLowerCase()}.`);
    if (repoUrl) parts.push(`GitHub: ${repoUrl}.`);
    return parts.join(" ");
  }

  private _listProjects(
    rps: Array<{ project: { title?: string; dates?: string; description?: string }; repository?: { url?: string | null } }>,
    detailed: boolean
  ): string {
    const items = rps.map((rp) => {
      const p = rp.project;
      const title = `${p.title ?? ""}${p.dates ? ` (${p.dates})` : ""}`;
      const url = rp.repository?.url ? ` [${rp.repository.url}]` : "";
      if (detailed && p.description) {
        return `- ${title}${url} — ${GeminiProvider._firstSentence(p.description)}.`;
      }
      return `- ${title}${url}`;
    });
    const prefix = `Some of the projects I've worked on include:`;
    return `${prefix}\n${items.join("\n")}`;
  }

  private _describeLearningRepos(repos: Array<{ name?: string | null; description?: string | null; url?: string | null; language?: string | null }>): string {
    const parts = repos.slice(0, 2).map((repo) => {
      const name = repo.name ?? "a repository";
      const desc = repo.description ? ` ${repo.description.replace(/[.!?]+$/, "")}.` : "";
      const url = repo.url ? ` You can find it at ${repo.url}.` : "";
      return `I don't have a documented portfolio project on that exact topic, but I've been exploring it — I have a GitHub repository "${name}"${desc}${url}`;
    });
    return parts.join(" ");
  }

  private _genericProfileIntro(profile: LinkedinProfile): string {
    const skills = profile.skills.slice(0, 8).join(", ") || "";
    const projects = profile.projects.slice(0, 3).map((p) => p.title).filter(Boolean).join(", ") || "";
    const parts: string[] = [];
    if (profile.name) {
      parts.push(`${profile.name} is a Computer Science Engineering student with hands-on experience across IoT, embedded systems, cloud security, AI, cybersecurity, and blockchain.`);
    } else {
      parts.push("I'm a Computer Science Engineering student with hands-on experience across IoT, embedded systems, cloud security, AI, cybersecurity, and blockchain.");
    }
    if (projects) parts.push(`Recent projects include ${projects}.`);
    if (skills) parts.push(`Technical skills span ${skills}.`);
    parts.push("Happy to go deeper on any of these areas.");
    return parts.join(" ");
  }

  private _skillsText(profile: LinkedinProfile): string {
    if (!profile.skills.length) return "I don't have a documented skills list yet.";
    // Group skills naturally instead of listing everything linearly
    const skillList = profile.skills;
    const grouped: string[] = [];
    const iotSkills = skillList.filter((s) => /iot|embedded|esp32|stm32|raspberry|sensor|mqtt/i.test(s));
    const cloudSkills = skillList.filter((s) => /aws|cloud|lambda|terraform|dynamodb|cloudwatch/i.test(s));
    const securitySkills = skillList.filter((s) => /security|cyber|waf|vulnerability|forensic|cryptography/i.test(s));
    const aiSkills = skillList.filter((s) => /ai|machine|learning|opencv|langchain|generative/i.test(s));
    const devSkills = skillList.filter((s) => /python|fastapi|react|celery|postgresql|redis|java|c\b/i.test(s));
    const otherSkills = skillList.filter(
      (s) => !iotSkills.includes(s) && !cloudSkills.includes(s) && !securitySkills.includes(s) && !aiSkills.includes(s) && !devSkills.includes(s)
    );

    if (iotSkills.length) grouped.push(`**IoT & Embedded:** ${iotSkills.join(", ")}`);
    if (cloudSkills.length) grouped.push(`**Cloud & AWS:** ${cloudSkills.join(", ")}`);
    if (securitySkills.length) grouped.push(`**Cybersecurity:** ${securitySkills.join(", ")}`);
    if (aiSkills.length) grouped.push(`**AI & ML:** ${aiSkills.join(", ")}`);
    if (devSkills.length) grouped.push(`**Development:** ${devSkills.join(", ")}`);
    if (otherSkills.length) grouped.push(`**Other:** ${otherSkills.join(", ")}`);

    return `My technical skills are organized by area:\n\n${grouped.join("\n")}`;
  }

  private _educationText(profile: LinkedinProfile): string {
    if (!profile.education.length) return "I don't have education details documented.";
    return (
      profile.education
        .map((e) => `${e.degree ?? "Study"} at ${e.institution ?? "an institution"}${e.dates ? ` (${e.dates})` : ""}`)
        .join(". ") + "."
    );
  }

  private _certificationText(profile: LinkedinProfile): string {
    if (!profile.certifications.length) return "I don't have certifications documented.";
    return (
      profile.certifications
        .map((c) => `${c.title ?? "Certification"} — ${c.issuer ?? ""}${c.issued ? ` (${c.issued})` : ""}`)
        .join(". ") + "."
    );
  }

  private _repositoriesText(repos: Array<{ name?: string | null; description?: string | null; url?: string | null; language?: string | null }>): string {
    if (!repos.length) return "I don't have public repositories documented.";
    return (
      repos
        .slice(0, 6)
        .map((r) => `${r.name ?? "repository"}${r.description ? ` — ${r.description.split(".")[0]}` : ""}${r.url ? ` (${r.url})` : ""}`)
        .join(". ") + "."
    );
  }

  private _experienceText(profile: LinkedinProfile): string {
    if (!profile.experience.length) {
      return "I don't have professional experience documented yet, but I'm actively seeking internships.";
    }
    return (
      profile.experience
        .map((e) => `${e.position ?? "Position"} at ${e.company ?? ""}${e.dates ? ` (${e.dates})` : ""}`)
        .join(". ") + "."
    );
  }
}
