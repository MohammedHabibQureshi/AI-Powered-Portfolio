import { Citation, GitHubRepository, INTENT_CITATIONS, KnowledgeDebug, GITHUB } from "./constants";
import { KnowledgeSnapshot, ProjectRecord } from "./knowledge";

export interface RetrievedProject {
  project: ProjectRecord;
  repository?: GitHubRepository;
  matchScore: number;
}

export interface RetrievalResult {
  intent: string;
  normalizedQuery: string;
  searchTerms: string[];
  entity: string | null;
  topic: string | null;
  matchedProjects: RetrievedProject[];
  recommendedProject?: RetrievedProject;
  matchedRepositories: GitHubRepository[];
  citations: Citation[];
  noChallengesDocumented: boolean;
  isChallengeQuestion: boolean;
}

export const PROJECT_FAMILY_INTENTS = ["PROJECT", "PROJECT_COMPARISON", "ARCHITECTURE", "JOB_MATCHING", "RESUME"];

// Question-specific project aliases so queries like "aws cspm" or "waf" resolve
// to the matching portfolio project even when the raw title is not used.
const PROJECT_ALIASES: Record<string, string[]> = {
  "aws cloud security posture monitoring system": [
    "cspm",
    "aws cspm",
    "cloud security posture",
    "cloud security posture monitoring",
    "posture monitoring system",
    "aws cloud security posture monitor",
    "aws security",
    "cloud security project",
    "aws project",
  ],
  "ai-driven web application security suite (waf + scanner)": [
    "waf",
    "waf + scanner",
    "web security suite",
    "web application security suite",
    "security suite",
    "ai-driven web application security suite",
    "vulnerability scanner",
    "web security",
    "web application security",
    "security project",
  ],
  "iot multi parameter environmental monitoring system": [
    "environmental monitoring",
    "environmental monitoring system",
    "multi parameter environmental monitoring",
    "iot environment monitoring",
    "environmental sensor network",
    "environmental sensors",
    "sensor network",
    "iot project",
    "iot monitoring",
    "environmental project",
  ],
  "gesture-driven robotic control using opencv": [
    "gesture driven",
    "gesture control",
    "gesture-driven robotic control",
    "robotic control",
    "gesture",
    "gesture robot",
    "robot project",
    "opencv",
    "hand gesture",
    "touchless",
  ],
  "iot smart mirror using personal assistant": [
    "smart mirror",
    "magicmirror",
    "iot smart mirror",
    "personal assistant",
    "mirror project",
  ],
  "heart rate monitoring using oled display and stm32": [
    "heart rate",
    "heart rate monitoring",
    "stm32",
    "oled display",
    "heart rate project",
  ],
  "wildlife protection and forest fires using forest water": [
    "wildlife",
    "forest fire",
    "forest fires",
    "wildlife protection",
    "smoke sensor",
    "wildlife project",
  ],
};

const SEARCH_STOP_WORDS: Set<string> = new Set([
  "the", "a", "an", "and", "or", "of", "to", "in", "on", "at", "for", "with", "is", "are", "was", "were",
  "be", "been", "have", "has", "had", "do", "does", "did", "i", "you", "your", "yours", "yourself", "my",
  "mine", "me", "we", "us", "our", "it", "this", "that", "these", "those", "he", "him", "his", "she", "her",
  "they", "them", "their", "about", "from", "by", "as", "what", "which", "who", "whom", "when", "where",
  "why", "how", "will", "would", "can", "could", "should", "shall", "may", "might", "must", "please", "not",
  "no", "yes", "if", "then", "than", "so", "such", "also", "too", "just", "but", "because", "although",
  "though", "while", "during", "project", "projects", "work", "experience", "skills", "skill", "more",
  "most", "best", "good", "great", "well", "nice", "really", "very", "quite", "say", "said", "tell", "used",
  "use", "using", "done", "did", "made", "make", "built", "build", "developed", "develop", "implemented",
  "implement", "created", "create", "list", "details", "detail", "challenges", "challenge", "face", "faced",
  "involve", "involved", "related", "yourself", "any", "all", "some", "one", "two", "much", "many", "let",
  "know", "give", "show", "describe", "explain", "something", "anything", "everything", "nothing", "kind",
  "type", "sort", "way", "give", "tell me",
]);

// Common typo variants of vocabulary words, applied before matching so
// questions like "what proejcts have he done" still retrieve correctly.
const TYPO_CORRECTIONS: Record<string, string> = {
  proejcts: "projects",
  projcts: "projects",
  projct: "project",
  proejct: "project",
  descripton: "description",
  descripion: "description",
  discription: "description",
  blockchian: "blockchain",
  blockain: "blockchain",
  secrity: "security",
  securty: "security",
  cybersecuriy: "cybersecurity",
  cyberecurity: "cybersecurity",
  credentails: "credentials",
  certificaiton: "certification",
  certifictions: "certifications",
  experiance: "experience",
  educaiton: "education",
  repositoriy: "repository",
  repositoris: "repositories",
  technlogies: "technologies",
  technologys: "technologies",
  universitiy: "university",
  collge: "college",
  certficates: "certifications",
  certifcations: "certifications",
  environmenal: "environmental",
  enivronmental: "environmental",
  monitering: "monitoring",
  monitorring: "monitoring",
  postur: "posture",
  vulnerablity: "vulnerability",
  vuln_scanner: "scanner",
  clasification: "classification",
  clasifier: "classifier",
  reciever: "receiver",
  seperate: "separate",
  occurence: "occurrence",
  competance: "competence",
  dependancy: "dependency",
  repositories: "repositories",
  certfication: "certification",
  independant: "independent",
  compatabile: "compatible",
  maintainance: "maintenance",
  performace: "performance",
  persistant: "persistent",
  reponse: "response",
  enviroment: "environment",
  developement: "development",
  implementaion: "implementation",
  integreation: "integration",
  configuartion: "configuration",
};

function correctTypos(text: string): string {
  return text
    .split(/\s+/)
    .map((token) => TYPO_CORRECTIONS[token] ?? token)
    .join(" ");
}

export function normalizeQuery(query: string): string {
  const normalized = query.toLowerCase().replace(/[?.!;,:'"()]+/g, " ").replace(/\s+/g, " ").trim();
  return correctTypos(normalized);
}

/** Meaningful search terms: lowercase, stop-word filtered, de-duplicated. */
export function extractSearchTerms(query: string): string[] {
  const tokens = normalizeQuery(query).split(/\s+/);
  return [...new Set(tokens.filter((t) => t.length >= 3 && !SEARCH_STOP_WORDS.has(t)))];
}

/** Content tokens (titles, tech, descriptions) keep stop words so overlap works.
 * Hyphenated/underscored terms are split so "IoT-Based" still matches "iot". */
function contentTokens(text: string): Set<string> {
  const tokens = new Set<string>();
  for (const raw of normalizeQuery(text).split(/\s+/)) {
    if (raw.length >= 3) tokens.add(raw);
    for (const part of raw.split(/[-_]/)) {
      if (part.length >= 3) tokens.add(part);
    }
  }
  return tokens;
}

export function isProjectFamily(intent: string): boolean {
  return PROJECT_FAMILY_INTENTS.includes(intent);
}

/** Questions about the challenges/obstacles faced during a project. */
const CHALLENGE_RE = /\b(challenge|challenges|challenging|difficult|hardest|hard part|obstacle|obstacles|faced|facing|faced during)\b/i;

/** Questions about learning/outcomes from a project. */
const LEARNING_RE = /\b(learn(?:ed|ing)?|gain(?:ed|ing)?|takeaway|takeaways|outcome|outcomes|skill(?:s)?\s+(?:gain|learn|acquire))\b/i;

/** Topic keywords for categorizing questions. */
const TOPIC_KEYWORDS: Record<string, RegExp> = {
  IoT: /\b(iot|internet of things|esp32|stm32|raspberry pi|sensor|sensors|embedded|mqtt|thingSpeak|dht|mq135|bmp280)\b/i,
  AWS: /\b(aws|amazon|lambda|cloudwatch|dynamodb|s3|ec2|iam|terraform|cloud security|cspm|boto3|sns|cloudtrail)\b/i,
  Cybersecurity: /\b(security|cybersecurity|cyber security|waf|vulnerability|scanner|penetration|firewall|forensic|encryption|cryptography)\b/i,
  Blockchain: /\b(blockchain|solidity|ethereum|smart contract|web3|dapp|remix)\b/i,
  AI: /\b(ai|artificial intelligence|machine learning|deep learning|opencv|langchain|generative ai|gemini|llm|nlp)\b/i,
  Python: /\b(python|fastapi|flask|django|boto3|celery)\b/i,
  "Embedded Systems": /\b(embedded|microcontroller|firmware|uart|spi|i2c|hal|stm32cubeide|arduino)\b/i,
};

export function detectTopic(query: string): string | null {
  const norm = normalizeQuery(query);
  for (const [topic, pattern] of Object.entries(TOPIC_KEYWORDS)) {
    if (pattern.test(norm)) return topic;
  }
  return null;
}

export function isChallengeQuestion(query: string): boolean {
  return CHALLENGE_RE.test(query);
}

export function isLearningQuestion(query: string): boolean {
  return LEARNING_RE.test(query);
}

/**
 * Resolve which portfolio project a question refers to (by alias, exact title
 * substring, or strong title-token overlap). Returns the project title or null.
 */
export function resolveProjectEntity(query: string, projects: ProjectRecord[]): string | null {
  const norm = normalizeQuery(query);
  if (!norm) return null;

  const byTitle = new Map<string, ProjectRecord>();
  for (const proj of projects) {
    if (proj.title) byTitle.set(proj.title.toLowerCase(), proj);
  }

  for (const [titleKey, aliases] of Object.entries(PROJECT_ALIASES)) {
    for (const alias of aliases) {
      if (norm.includes(alias)) {
        const proj = byTitle.get(titleKey);
        return proj?.title ?? titleKey;
      }
    }
  }

  for (const proj of projects) {
    if (!proj.title) continue;
    const titleLower = proj.title.toLowerCase();
    if (norm.includes(titleLower)) return proj.title;
    const titleTokens = contentTokens(proj.title);
    const queryTokens = contentTokens(norm);
    const overlap = [...queryTokens].filter((t) => titleTokens.has(t)).length;
    if (overlap >= 2) return proj.title;
  }
  return null;
}

/** Meaningful content tokens: stop-word filtered so common words ("using",
 * "systems") never create false project-to-repository matches. Hyphenated
 * terms are split so "IoT-Based" still contributes "iot". */
function repoMeaningfulTokens(text: string): Set<string> {
  const tokens = new Set<string>();
  for (const raw of normalizeQuery(text).split(/\s+/)) {
    for (const part of raw.split(/[-_]/)) {
      if (part.length >= 3 && !SEARCH_STOP_WORDS.has(part)) tokens.add(part);
    }
  }
  return tokens;
}

/** Find the GitHub repository that best matches a portfolio project. */
export function findMatchingRepository(project: ProjectRecord, repositories: GitHubRepository[]): GitHubRepository | undefined {
  const projTokens = repoMeaningfulTokens(`${project.title ?? ""} ${(project.technologies ?? []).join(" ")}`);
  let best: GitHubRepository | undefined;
  let bestScore = 0;
  for (const repo of repositories) {
    if (!repo.name || /^mohammedhabibqureshi$/.test(repo.name.toLowerCase())) continue;
    const repoTokens = repoMeaningfulTokens(
      `${repo.name.replace(/-/g, " ")} ${repo.description ?? ""} ${(repo.topics ?? []).join(" ")} ${(repo.languages ?? []).join(" ")}`
    );
    const overlap = [...projTokens].filter((t) => repoTokens.has(t)).length;
    if (overlap > bestScore) {
      bestScore = overlap;
      best = repo;
    }
  }
  return bestScore >= 2 ? best : undefined;
}

function searchRepositories(query: string, repositories: GitHubRepository[]): GitHubRepository[] {
  const queryTokens = new Set(extractSearchTerms(query));
  if (queryTokens.size === 0) return [];
  return repositories
    .map((repo) => {
      if (!repo.name || /^mohammedhabibqureshi$/.test(repo.name.toLowerCase())) return null;
      const blob = contentTokens(
        `${repo.name.replace(/-/g, " ")} ${repo.description ?? ""} ${(repo.topics ?? []).join(" ")} ${(repo.languages ?? []).join(" ")}`
      );
      const score = [...queryTokens].filter((t) => blob.has(t)).length;
      return score > 0 ? { repo, score } : null;
    })
    .filter((x): x is { repo: GitHubRepository; score: number } => x !== null)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.repo);
}

/** Rank portfolio projects by relevance to the query. */
export function searchProjects(query: string, projects: ProjectRecord[], repositories: GitHubRepository[], resolvedEntity?: string | null): RetrievedProject[] {
  const norm = normalizeQuery(query);
  const queryTokens = new Set(extractSearchTerms(query));
  const entityTitle = resolvedEntity ?? resolveProjectEntity(query, projects);
  const results: RetrievedProject[] = [];

  for (const proj of projects) {
    if (!proj.title) continue;
    let score = 0;
    if (entityTitle && proj.title === entityTitle) score += 100;
    if (norm.includes(proj.title.toLowerCase())) score += 50;
    for (const [mapTitle, aliases] of Object.entries(PROJECT_ALIASES)) {
      if (mapTitle === proj.title && aliases.some((a) => norm.includes(a))) score += 40;
    }
    const titleTokens = contentTokens(proj.title);
    score += [...queryTokens].filter((t) => titleTokens.has(t)).length * 3;
    const techTokens = contentTokens([...(proj.technologies ?? []), ...(proj.skills ?? [])].join(" "));
    score += [...queryTokens].filter((t) => techTokens.has(t)).length * 4;
    const descTokens = contentTokens(proj.description ?? "");
    score += [...queryTokens].filter((t) => descTokens.has(t)).length;

    const repository = findMatchingRepository(proj, repositories);
    if (repository) {
      const repoBlob = contentTokens(
        `${repository.name.replace(/-/g, " ")} ${repository.description ?? ""} ${(repository.topics ?? []).join(" ")}`
      );
      score += [...queryTokens].filter((t) => repoBlob.has(t)).length * 3;
    }
    if (score > 0) results.push({ project: proj, repository, matchScore: score });
  }

  results.sort((a, b) => b.matchScore - a.matchScore);
  return results;
}

function buildCitations(
  intent: string,
  entity: string | null,
  recommendedProject: RetrievedProject | undefined,
  matchedProjects: RetrievedProject[],
  matchedRepositories: GitHubRepository[]
): Citation[] {
  const cits: Citation[] = [];
  const pushRepo = (title: string, url?: string | null) => {
    if (url && !cits.some((c) => c.url === url)) cits.push({ title, url });
  };

  const focus = entity
    ? matchedProjects.find((p) => p.project.title === entity) ?? recommendedProject
    : recommendedProject;
  if (focus) {
    if (focus.repository?.url) pushRepo(focus.project.title ?? "GitHub repository", focus.repository.url);
    else cits.push({ title: "Projects", url: "/projects" });
  }
  for (const rp of matchedProjects.slice(0, 4)) {
    if (rp.repository?.url && rp.project.title !== focus?.project.title) {
      pushRepo(rp.project.title ?? "GitHub", rp.repository.url);
    }
  }
  if (cits.length === 0) {
    for (const repo of matchedRepositories.slice(0, 3)) pushRepo(repo.name ?? "GitHub", repo.url);
  }
  if (cits.length === 0) cits.push(...(INTENT_CITATIONS[intent] ?? []));
  return cits;
}

/**
 * Question-specific retrieval: understands the query (entity + search terms),
 * ranks projects and repositories, merges the LinkedIn + GitHub sources, and
 * returns focused context and dynamic citations. No generic profile fallback.
 */
export function buildRetrieval(query: string, intent: string, snapshot: KnowledgeSnapshot, definitionTarget?: string): RetrievalResult {
  const projects = snapshot.profile.projects ?? [];
  const repositories = snapshot.repositories ?? [];
  const normalizedQuery = normalizeQuery(query);
  const searchTerms = extractSearchTerms(query);
  // Use definition_target from classifier (anaphora resolution) if the query
  // itself doesn't resolve to a specific project entity.
  let entity = resolveProjectEntity(query, projects);
  if (!entity && definitionTarget) {
    // definitionTarget may be a project title or alias — try to resolve it
    entity = resolveProjectEntity(definitionTarget, projects) ?? definitionTarget;
  }
  const topic = detectTopic(query);
  const challengeQ = isChallengeQuestion(query);

  let matchedProjects = searchProjects(query, projects, repositories, entity);
  let matchedRepositories = searchRepositories(query, repositories);

  // A generic "list my projects" question has no distinctive terms: fall back
  // to the full project list (still merged with repos) so we never give an
  // empty answer for project questions.
  if (searchTerms.length === 0 && isProjectFamily(intent) && matchedProjects.length === 0) {
    matchedProjects = projects.map((project) => ({
      project,
      repository: findMatchingRepository(project, repositories),
      matchScore: 0,
    }));
  }

  // A generic "what repos" question has no distinctive terms: fall back to all repos.
  if (intent === GITHUB && matchedRepositories.length === 0) {
    matchedRepositories = repositories.filter((r) => r.name && !/^mohammedhabibqureshi$/.test(r.name.toLowerCase()));
  }

  const recommendedProject = matchedProjects[0];
  const noChallengesDocumented = (recommendedProject !== undefined || entity !== null) && challengeQ;
  const citations = buildCitations(intent, entity, recommendedProject, matchedProjects, matchedRepositories);

  return {
    intent,
    normalizedQuery,
    searchTerms,
    entity,
    topic,
    matchedProjects,
    recommendedProject,
    matchedRepositories,
    citations,
    noChallengesDocumented,
    isChallengeQuestion: challengeQ,
  };
}

export function buildDebug(
  question: string,
  intent: string,
  retrieval: RetrievalResult,
  context: string
): KnowledgeDebug {
  return {
    question,
    intent,
    entity: retrieval.entity,
    search_terms: retrieval.searchTerms,
    matched_sources: retrieval.matchedProjects.slice(0, 5).map((rp) => ({
      project: rp.project.title ?? "",
      repo: rp.repository?.name,
      score: rp.matchScore,
    })),
    context_length: context.length,
  };
}