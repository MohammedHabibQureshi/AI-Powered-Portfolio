import {
  ACHIEVEMENT,
  AgentChunk,
  BLOG,
  CAREER,
  CERTIFICATION,
  ChatHistoryMessage,
  Citation,
  EDUCATION,
  EXPERIENCE,
  GENERAL_PERSONAL,
  GITHUB,
  GitHubRepository,
  GREETING,
  INTENT_CITATIONS,
  JOB_MATCHING,
  MAX_ABOUT_CHARS,
  MAX_README_CHARS,
  PERSONAL_PROFILE,
  PROJECT,
  PUBLICATION,
  RESEARCH,
  RESUME,
  SKILLS,
  TIMELINE,
} from "./constants";
import { AMBIGUOUS, Classification, DomainClassifier } from "./classifier";
import { GeminiProvider } from "./gemini";
import {
  CertificationRecord,
  EducationRecord,
  ExperienceRecord,
  getKnowledgeService,
  KnowledgeSnapshot,
  LinkedinProfile,
  ProjectRecord,
} from "./knowledge";
import { buildClarificationMessage, buildSystemPrompt, REFUSAL_MESSAGE } from "./persona";
import {
  buildDebug,
  buildRetrieval,
  isLearningQuestion,
  isProjectFamily,
  RetrievalResult,
} from "./retrieval";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Build an alias map from project titles in the knowledge base.
 * Extracts short recognizable aliases so conversation history can be searched
 * without hardcoded personal data. Only generates aliases that are unique enough
 * to avoid false-positive matches in natural language (min 6 chars for phrases,
 * min 5 chars for single words).
 */
function buildAliasMap(projects: ProjectRecord[]): Record<string, string> {
  const ALIASES: Record<string, string> = {};
  for (const proj of projects) {
    if (!proj.title) continue;
    const titleLower = proj.title.toLowerCase();
    const words = titleLower.split(/\s+/);
    // Single-word alias: first significant word ≥ 5 chars (avoids "cloud", "multi", "iot")
    const firstWord = words.find((w) => w.length >= 5 && !["the", "and", "using", "with", "for", "from", "cloud"].includes(w));
    if (firstWord) ALIASES[firstWord] = proj.title;
    // Two-word phrase: first two significant words ≥ 8 chars total
    const sigWords = words.filter((w) => w.length >= 3 && !["the", "and", "using", "with", "for", "from"].includes(w));
    if (sigWords.length >= 2) {
      const phrase = sigWords.slice(0, 2).join(" ");
      if (phrase.length >= 8) ALIASES[phrase] = proj.title;
    }
  }
  return ALIASES;
}

/**
 * Extract recent project entities mentioned in conversation history.
 * Used for anaphora resolution: "What technologies did it use?" → resolves to
 * the most recently discussed project entity.
 *
 * Strategy: scan messages most-recent-first. When an assistant response focuses
 * on a single project (mentions only one), that's the primary entity. List
 * responses (mentioning multiple projects) are deprioritized.
 */
function extractRecentEntities(history: ChatHistoryMessage[], projects: ProjectRecord[]): string[] {
  const ALIAS_MAP = buildAliasMap(projects);
  const recent = history.slice(-5);

  // Build significant word sets for each project (title words ≥ 4 chars, excluding
  // generic words). Used for partial-title matching when the mock response uses a
  // shortened form of the project name. Only words that are distinctive to the
  // project are used — common portfolio words like "monitoring", "system", "project"
  // are excluded to prevent false matches.
  const STOP_WORDS = new Set([
    "the", "and", "using", "with", "for", "from", "that", "this", "which",
    "monitoring", "system", "project", "based", "data", "using", "building",
    "application", "platform", "suite", "multi",
  ]);
  const projSignificantWords = new Map<string, string[]>();
  for (const proj of projects) {
    if (!proj.title) continue;
    const sigWords = proj.title
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length >= 4 && !STOP_WORDS.has(w));
    projSignificantWords.set(proj.title, sigWords);
  }

  type MsgEntities = { entities: string[]; count: number };
  const perMessage: MsgEntities[] = [];

  for (let i = recent.length - 1; i >= 0; i--) {
    const msg = recent[i];
    const text = (msg.text ?? "").toLowerCase();
    const found = new Set<string>();

    for (const proj of projects) {
      if (!proj.title) continue;
      const titleLower = proj.title.toLowerCase();
      if (text.includes(titleLower)) {
        found.add(proj.title);
        continue;
      }
      // Partial match: check if 2+ significant words from the title appear in text
      const sigWords = projSignificantWords.get(proj.title) ?? [];
      const matches = sigWords.filter((w) => text.includes(w));
      if (matches.length >= 2) {
        found.add(proj.title);
      }
    }
    for (const [alias, title] of Object.entries(ALIAS_MAP)) {
      if (alias.length >= 6 && text.includes(alias)) found.add(title);
    }

    perMessage.push({ entities: [...found], count: found.size });
  }

  // Prefer the most recent assistant message that mentions exactly one project
  // (a focused response). If none, fall back to the most recent entity overall.
  const entities: string[] = [];
  let primaryFound = false;

  for (const me of perMessage) {
    if (me.count === 1 && !primaryFound) {
      entities.push(me.entities[0]);
      primaryFound = true;
    } else if (me.count > 0 && !primaryFound) {
      for (const e of me.entities) {
        if (!entities.includes(e)) entities.push(e);
      }
    }
  }

  return entities.length > 0 ? entities : [];
}

export class AIAgentService {
  private classifier: DomainClassifier;
  private provider: GeminiProvider;

  constructor(provider?: GeminiProvider) {
    this.classifier = new DomainClassifier();
    this.provider = provider ?? new GeminiProvider();
  }

  async getGroundingContext(intent: string, query?: string): Promise<string> {
    const snapshot = getKnowledgeService().snapshot();
    if (query) {
      const retrieval = buildRetrieval(query, intent, snapshot);
      return AIAgentService._formatRetrievalContext(intent, snapshot, retrieval);
    }
    return AIAgentService._formatIntentContext(intent, snapshot);
  }

  async *chatStream(query: string, history: ChatHistoryMessage[]): AsyncGenerator<AgentChunk> {
    getKnowledgeService().refreshIfChanged();
    const snapshot = getKnowledgeService().snapshot();
    const recentEntities = extractRecentEntities(history, snapshot.profile.projects);
    const classification = this.classifier.classify(query, snapshot.vocabulary(), recentEntities);

    if (!this.classifier.isInScope(classification)) {
      yield* this._streamStaticMessage(query, classification);
      return;
    }

    const retrieval = buildRetrieval(query, classification.intent, snapshot, classification.definition_target);
    const groundingData = AIAgentService._formatRetrievalContext(classification.intent, snapshot, retrieval);
    const ownerName = snapshot.profile.name || "the portfolio owner";
    const systemInstruction = buildSystemPrompt(ownerName, groundingData);

    const citations = retrieval.citations.length ? retrieval.citations : INTENT_CITATIONS[classification.intent] ?? [];

    if (process.env.KNOWLEDGE_DEBUG === "1") {
      yield {
        chunk: "",
        confidence: 1,
        citations: [],
        type: "debug",
        debug: buildDebug(query, classification.intent, retrieval, groundingData),
      };
    }

    yield* this._streamAnswer(query, history, systemInstruction, classification, citations, snapshot.profile, retrieval, groundingData);
  }

  private async *_streamAnswer(
    query: string,
    history: ChatHistoryMessage[],
    systemInstruction: string,
    classification: Classification,
    citations: Citation[],
    profile: LinkedinProfile,
    retrieval?: RetrievalResult,
    groundingContext?: string
  ): AsyncGenerator<AgentChunk> {
    let isFirst = true;
    for await (const chunk of this.provider.stream({
      prompt: query,
      history,
      systemInstruction,
      profile,
      retrieval,
    })) {
      yield {
        ...chunk,
        intent: classification.intent,
        type: "answer",
        citations: citations.length ? citations : chunk.citations ?? [],
        ...(isFirst && groundingContext ? { groundingContext } : {}),
      };
      isFirst = false;
    }
  }

  private async *_streamStaticMessage(query: string, classification: Classification): AsyncGenerator<AgentChunk> {
    let message: string;
    let messageType: string;
    if (classification.intent === AMBIGUOUS) {
      message = buildClarificationMessage(classification.definition_target);
      messageType = "clarification";
    } else {
      message = REFUSAL_MESSAGE;
      messageType = "refusal";
    }

    const words = message.split(/\s+/);
    for (let i = 0; i < words.length; i += 3) {
      const chunkWords = words.slice(i, i + 3).join(" ") + " ";
      yield {
        chunk: chunkWords,
        confidence: 0.0,
        citations: [],
        intent: classification.intent,
        type: messageType,
      };
      await sleep(8);
    }
  }

  // ------------------------------------------------------------------
  // Formatting helpers
  // ------------------------------------------------------------------
  private static _formatProfile(profile: LinkedinProfile): string {
    const lines: string[] = ["PROFILE:"];
    if (profile.name) lines.push(`- Name: ${profile.name}`);
    if (profile.headline) lines.push(`- Headline: ${profile.headline}`);
    if (profile.pronouns) lines.push(`- Pronouns: ${profile.pronouns}`);
    if (profile.location) lines.push(`- Location: ${profile.location}`);
    if (profile.role) lines.push(`- Current role: ${profile.role}`);
    if (profile.open_to) lines.push(`- Open to: ${profile.open_to}`);
    if (profile.contact.length) lines.push(`- Contact: ${profile.contact.join(", ")}`);
    if (profile.about) lines.push(`- About: ${profile.about.slice(0, MAX_ABOUT_CHARS)}`);
    return lines.length > 1 ? lines.join("\n") : "";
  }

  private static _formatIntentContext(intent: string, snapshot: KnowledgeSnapshot): string {
    const profile = snapshot.profile;
    const sections: string[] = [];

    const profileText = AIAgentService._formatProfile(profile);
    if (profileText) sections.push(profileText);

    if ([EXPERIENCE, CAREER, GENERAL_PERSONAL, PERSONAL_PROFILE].includes(intent)) {
      if (profile.experience.length) sections.push(AIAgentService._formatExperience(profile.experience));
      if (profile.education.length) sections.push(AIAgentService._formatEducation(profile.education));
      if (profile.certifications.length) sections.push(AIAgentService._formatCertifications(profile.certifications));
    }

    if (isProjectFamily(intent)) {
      if (profile.projects.length) sections.push(AIAgentService._formatProjects(profile.projects));
    }

    if ([SKILLS, JOB_MATCHING, RESUME, GENERAL_PERSONAL].includes(intent)) {
      if (profile.skills.length) sections.push(AIAgentService._formatSkills(profile.skills));
    }

    if ([TIMELINE, ACHIEVEMENT, EXPERIENCE, GENERAL_PERSONAL].includes(intent)) {
      const timeline = [...profile.education, ...profile.certifications];
      if (timeline.length) sections.push(AIAgentService._formatTimeline(timeline));
    }

    if ([GITHUB, PROJECT, RESUME, GENERAL_PERSONAL].includes(intent)) {
      if (snapshot.repositories.length) sections.push(AIAgentService._formatRepositories(snapshot.repositories));
    }

    if (intent === EDUCATION) {
      if (profile.education.length) sections.push(AIAgentService._formatEducation(profile.education));
      if (profile.certifications.length) sections.push(AIAgentService._formatCertifications(profile.certifications));
    }

    if (intent === CERTIFICATION) {
      if (profile.certifications.length) sections.push(AIAgentService._formatCertifications(profile.certifications));
    }

    if ([RESEARCH, PUBLICATION, BLOG].includes(intent)) {
      if (profile.publications.length) sections.push(AIAgentService._formatPublications(profile.publications));
    }

    if (sections.length === 0) {
      sections.push(`BIO OVERVIEW:\n${profile.name || "the portfolio owner"} is an embedded systems & IoT professional.`);
    }
    return sections.join("\n\n");
  }

  /**
   * Question-specific context: only the retrieved/ranked projects and repos for
   * project questions (never the full profile blob), focused sections otherwise.
   *
   * The compact profile summary is ONLY included for broad profile questions
   * ("tell me about yourself", greetings). It is never prepended to project or
   * topic questions, so Gemini never latches onto a generic profile summary.
   */
  private static _formatRetrievalContext(intent: string, snapshot: KnowledgeSnapshot, retrieval: RetrievalResult): string {
    const profile = snapshot.profile;
    const sections: string[] = [];

    if (isProjectFamily(intent)) {
      sections.push(...AIAgentService._formatProjectContext(snapshot, retrieval));
      if (retrieval.isChallengeQuestion) {
        sections.push(
          "PROJECT CHALLENGES:\nNo specific challenges are documented for this project in the knowledge sources. " +
          "If asked about challenges, respond that no specific challenges are documented."
        );
      }
      if (isLearningQuestion(retrieval.normalizedQuery)) {
        sections.push(
          "PROJECT LEARNINGS:\nNo specific learning outcomes are documented for this project in the knowledge sources. " +
          "If asked about learnings, respond that no specific learning outcomes are documented."
        );
      }
    } else if (intent === SKILLS) {
      if (profile.skills.length) sections.push(AIAgentService._formatSkills(profile.skills));
    } else if (intent === EDUCATION) {
      if (profile.education.length) sections.push(AIAgentService._formatEducation(profile.education));
    } else if (intent === CERTIFICATION) {
      if (profile.certifications.length) sections.push(AIAgentService._formatCertifications(profile.certifications));
    } else if (intent === GITHUB) {
      const repos = retrieval.matchedRepositories.length ? retrieval.matchedRepositories : snapshot.repositories;
      if (repos.length) sections.push(AIAgentService._formatRepositories(repos));
    } else if ([EXPERIENCE, CAREER].includes(intent)) {
      if (profile.experience.length) sections.push(AIAgentService._formatExperience(profile.experience));
      if (profile.education.length) sections.push(AIAgentService._formatEducation(profile.education));
    } else if ([PERSONAL_PROFILE, GENERAL_PERSONAL, GREETING].includes(intent)) {
      const compactProfile = AIAgentService._formatCompactProfile(profile);
      if (compactProfile) sections.push(compactProfile);
      if (profile.skills.length) sections.push(AIAgentService._formatSkills(profile.skills));
      if (profile.projects.length) sections.push(AIAgentService._formatProjects(profile.projects.slice(0, 5)));
    }

    if (sections.length === 0) {
      sections.push(
        `I don't have documented information matching this question about ${profile.name || "the portfolio owner"}.`
      );
    }
    return sections.join("\n\n");
  }

  /**
   * Project questions: focus on the resolved project when one exists (with its
   * GitHub README), otherwise list the matched projects and repositories.
   *
   * When a specific entity is resolved (e.g., "AWS CSPM"), only include that
   * project and its repository to prevent cross-contamination.
   */
  private static _formatProjectContext(snapshot: KnowledgeSnapshot, retrieval: RetrievalResult): string[] {
    const out: string[] = [];

    const focus = retrieval.entity
      ? retrieval.matchedProjects.find((p) => p.project.title === retrieval.entity) ?? retrieval.recommendedProject
      : retrieval.recommendedProject && retrieval.recommendedProject.matchScore > 0
        ? retrieval.recommendedProject
        : undefined;

    if (focus) {
      const challengeQuestion = retrieval.isChallengeQuestion;
      const learningQuestion = isLearningQuestion(retrieval.normalizedQuery);
      out.push(AIAgentService._formatFocusedProject(focus, !challengeQuestion && !learningQuestion));
      // When a specific entity is resolved, ONLY include the focused project.
      // Do NOT include other projects or repos to prevent cross-contamination.
      if (!retrieval.entity) {
        const others = retrieval.matchedProjects.filter((p) => !focus || p.project.title !== focus.project.title);
        if (others.length && !challengeQuestion && !learningQuestion) {
          out.push(AIAgentService._formatProjects(others.map((r) => r.project).slice(0, 5)));
        }
        const focusRepo = focus?.repository?.name;
        const repos = (retrieval.matchedRepositories.length ? retrieval.matchedRepositories : snapshot.repositories)
          .filter((r) => !focusRepo || r.name !== focusRepo)
          .slice(0, 4);
        if (repos.length) out.push(AIAgentService._formatRepositories(repos));
      }
    } else if (retrieval.matchedProjects.length) {
      out.push(AIAgentService._formatProjects(retrieval.matchedProjects.map((r) => r.project)));
      const repos = (retrieval.matchedRepositories.length ? retrieval.matchedRepositories : snapshot.repositories)
        .slice(0, 4);
      if (repos.length) out.push(AIAgentService._formatRepositories(repos));
    }

    return out;
  }

  private static _formatCompactProfile(profile: LinkedinProfile): string {
    const lines: string[] = ["PROFILE:"];
    if (profile.name) lines.push(`- Name: ${profile.name}`);
    if (profile.headline) lines.push(`- Headline: ${profile.headline}`);
    if (profile.role) lines.push(`- Current role: ${profile.role}`);
    if (profile.open_to) lines.push(`- Open to: ${profile.open_to}`);
    return lines.length > 1 ? lines.join("\n") : "";
  }

  private static _formatFocusedProject(
    retrieved: { project: ProjectRecord; repository?: GitHubRepository },
    includeReadme = true
  ): string {
    const proj = retrieved.project;
    const lines: string[] = ["FOCUS PROJECT:"];
    let entry = `- ${proj.title ?? ""}`;
    if (proj.dates) entry += ` (${proj.dates})`;
    lines.push(entry);
    if (proj.description) lines.push(`  Summary: ${proj.description}`);
    if (proj.technologies?.length) lines.push(`  Tech: ${proj.technologies.join(", ")}`);
    if (proj.skills?.length) lines.push(`  Skills: ${proj.skills.join(", ")}`);
    if (proj.associated_with) lines.push(`  Associated with: ${proj.associated_with}`);
    if (retrieved.repository) {
      lines.push(`  GitHub repo: ${retrieved.repository.name ?? ""}`);
      if (retrieved.repository.description) lines.push(`  Repo description: ${retrieved.repository.description}`);
      if (retrieved.repository.url) lines.push(`  Repo URL: ${retrieved.repository.url}`);
      if (includeReadme && retrieved.repository.readme) {
        lines.push(`  README: ${retrieved.repository.readme.slice(0, MAX_README_CHARS)}`);
      }
    }
    return lines.join("\n");
  }

  private static _formatExperience(records: ExperienceRecord[]): string {
    if (!records.length) return "";
    const lines: string[] = ["PROFESSIONAL EXPERIENCE:"];
    for (const exp of records) {
      const company = exp.company ?? "";
      const position = exp.position ?? "";
      const dates = exp.dates ?? "";
      const description = exp.description ?? "";
      const skills = exp.skills?.join(", ") ?? "";
      lines.push(`- ${position} at ${company} (${dates})`);
      if (description) lines.push(`  Details: ${description}`);
      if (skills) lines.push(`  Skills: ${skills}`);
    }
    return lines.join("\n");
  }

  private static _formatEducation(records: EducationRecord[]): string {
    if (!records.length) return "";
    const lines: string[] = ["EDUCATION:"];
    for (const edu of records) {
      const institution = edu.institution ?? "";
      const degree = edu.degree ?? "";
      const dates = edu.dates ?? "";
      const details = edu.details ?? "";
      const activities = edu.activities ?? "";
      let entry = degree && institution ? `- ${degree} at ${institution}` : `- ${institution || degree}`;
      if (dates) entry += ` (${dates})`;
      lines.push(entry);
      if (details) lines.push(`  Details: ${details}`);
      if (activities) lines.push(`  Activities: ${activities}`);
    }
    return lines.join("\n");
  }

  private static _formatCertifications(records: CertificationRecord[]): string {
    if (!records.length) return "";
    const lines: string[] = ["CERTIFICATIONS:"];
    for (const cert of records) {
      const title = cert.title ?? "";
      const issuer = cert.issuer ?? "";
      const issued = cert.issued ?? "";
      const skills = cert.skills?.join(", ") ?? "";
      let entry = `- ${title}`;
      if (issuer) entry += ` — ${issuer}`;
      if (issued) entry += ` (${issued})`;
      lines.push(entry);
      if (skills) lines.push(`  Skills: ${skills}`);
    }
    return lines.join("\n");
  }

  private static _formatProjects(records: ProjectRecord[]): string {
    if (!records.length) return "";
    const lines: string[] = ["PROJECTS:"];
    for (const proj of records) {
      const title = proj.title ?? "";
      const description = proj.description ?? "";
      const tech = proj.technologies ?? [];
      const dates = proj.dates ?? "";
      let entry = `- ${title}`;
      if (dates) entry += ` (${dates})`;
      lines.push(entry);
      if (description) lines.push(`  Summary: ${description}`);
      if (tech.length) lines.push(`  Tech: ${tech.join(", ")}`);
    }
    return lines.join("\n");
  }

  private static _formatSkills(skills: string[]): string {
    if (!skills.length) return "";
    const lines: string[] = ["SKILLS:"];
    for (const skill of skills) lines.push(`- ${skill}`);
    return lines.join("\n");
  }

  private static _formatTimeline(records: Array<EducationRecord | CertificationRecord>): string {
    if (!records.length) return "";
    const lines: string[] = ["TIMELINE & ACHIEVEMENTS:"];
    for (const ev of records) {
      const isEducation = "degree" in ev;
      const title = isEducation ? (ev as EducationRecord).degree ?? "" : (ev as CertificationRecord).title ?? "";
      const when = isEducation ? (ev as EducationRecord).dates ?? "" : (ev as CertificationRecord).issued ?? "";
      if (title) lines.push(`- ${when ? `${when}: ` : ""}${title}`);
    }
    return lines.join("\n");
  }

  private static _formatRepositories(repositories: GitHubRepository[]): string {
    if (!repositories.length) return "";
    const lines: string[] = ["GITHUB REPOSITORIES:"];
    for (const repo of repositories) {
      const name = repo.name ?? "";
      const description = repo.description ?? undefined;
      const language = repo.language ?? undefined;
      const languages = repo.languages ?? [];
      const topics = repo.topics ?? [];
      const url = repo.url ?? undefined;
      const stars = repo.stars ?? 0;
      const lastUpdated = repo.last_updated ?? "";
      const readme = repo.readme ?? "";
      let entry = `- ${name} (${language || "N/A"})`;
      if (description) entry += ` — ${description}`;
      lines.push(entry);
      if (languages.length) lines.push(`  Languages: ${languages.slice(0, 12).join(", ")}`);
      if (topics.length) lines.push(`  Topics: ${topics.slice(0, 12).join(", ")}`);
      if (stars) lines.push(`  Stars: ${stars}`);
      if (lastUpdated) lines.push(`  Last updated: ${lastUpdated.slice(0, 10)}`);
      if (url) lines.push(`  URL: ${url}`);
      if (readme) lines.push(`  README excerpt: ${readme.slice(0, MAX_README_CHARS)}`);
    }
    return lines.join("\n");
  }

  private static _formatPublications(records: Array<{ title?: string; date?: string; description?: string }>): string {
    if (!records.length) return "";
    const lines: string[] = ["PUBLICATIONS:"];
    for (const pub of records) {
      const title = pub.title ?? "";
      const date = pub.date ?? "";
      const description = pub.description ?? "";
      lines.push(`- ${title}${date ? ` (${date})` : ""}`);
      if (description) lines.push(`  ${description}`);
    }
    return lines.join("\n");
  }
}