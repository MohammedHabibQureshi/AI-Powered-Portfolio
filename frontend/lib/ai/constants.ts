export const PERSONAL_PROFILE = "PERSONAL_PROFILE";
export const PROJECT = "PROJECT";
export const SKILLS = "SKILLS";
export const EXPERIENCE = "EXPERIENCE";
export const EDUCATION = "EDUCATION";
export const CERTIFICATION = "CERTIFICATION";
export const RESEARCH = "RESEARCH";
export const PUBLICATION = "PUBLICATION";
export const BLOG = "BLOG";
export const GITHUB = "GITHUB";
export const ACHIEVEMENT = "ACHIEVEMENT";
export const TIMELINE = "TIMELINE";
export const CAREER = "CAREER";
export const JOB_MATCHING = "JOB_MATCHING";
export const PROJECT_COMPARISON = "PROJECT_COMPARISON";
export const ARCHITECTURE = "ARCHITECTURE";
export const RESUME = "RESUME";
export const GENERAL_PERSONAL = "GENERAL_PERSONAL";
export const GREETING = "GREETING";
export const OUT_OF_SCOPE = "OUT_OF_SCOPE";
export const AMBIGUOUS = "AMBIGUOUS";

export const CLASSIFIER_CONFIDENCE_THRESHOLD = 0.6;

export const MAX_README_CHARS = 1600;
export const MAX_ABOUT_CHARS = 1200;

export interface Citation {
  title: string;
  url: string;
}

export const INTENT_CITATIONS: Record<string, Citation[]> = {
  [PROJECT]: [{ title: "Projects", url: "/projects" }],
  [PROJECT_COMPARISON]: [{ title: "Projects", url: "/projects" }],
  [ARCHITECTURE]: [{ title: "Projects", url: "/projects" }],
  [EXPERIENCE]: [{ title: "Career Timeline", url: "/timeline" }],
  [CAREER]: [{ title: "Career Timeline", url: "/timeline" }],
  [SKILLS]: [{ title: "About", url: "/about" }],
  [EDUCATION]: [{ title: "About", url: "/about" }],
  [CERTIFICATION]: [{ title: "About", url: "/about" }],
  [TIMELINE]: [{ title: "Career Timeline", url: "/timeline" }],
  [ACHIEVEMENT]: [{ title: "Career Timeline", url: "/timeline" }],
  [GITHUB]: [{ title: "GitHub", url: "https://github.com/MohammedHabibQureshi" }],
  [PERSONAL_PROFILE]: [{ title: "About", url: "/about" }],
  [GENERAL_PERSONAL]: [{ title: "About", url: "/about" }],
  [RESUME]: [{ title: "Resume", url: "/resume" }],
  [GREETING]: [{ title: "About", url: "/about" }],
};

export interface ChatHistoryMessage {
  sender: "user" | "assistant" | "model";
  text: string;
}

export interface KnowledgeDebug {
  question: string;
  intent: string;
  entity: string | null;
  search_terms: string[];
  matched_sources: Array<{ project: string; repo?: string; score: number }>;
  context_length: number;
}

export interface AgentChunk {
  chunk: string;
  confidence: number;
  citations: Citation[];
  intent?: string;
  type?: string;
  debug?: KnowledgeDebug;
  groundingContext?: string;
}

export interface GitHubRepository {
  name: string;
  full_name?: string;
  description?: string | null;
  readme?: string | null;
  language?: string | null;
  languages?: string[];
  topics?: string[];
  url?: string | null;
  homepage?: string | null;
  license?: string | null;
  stars?: number;
  forks?: number;
  last_updated?: string | null;
}