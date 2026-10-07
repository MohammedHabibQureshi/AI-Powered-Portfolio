import {
  ACHIEVEMENT,
  AMBIGUOUS,
  ARCHITECTURE,
  BLOG,
  CAREER,
  CERTIFICATION,
  EDUCATION,
  EXPERIENCE,
  GENERAL_PERSONAL,
  GITHUB,
  GREETING,
  JOB_MATCHING,
  OUT_OF_SCOPE,
  PERSONAL_PROFILE,
  PROJECT,
  PROJECT_COMPARISON,
  PUBLICATION,
  RESEARCH,
  RESUME,
  SKILLS,
  TIMELINE,
  CLASSIFIER_CONFIDENCE_THRESHOLD,
} from "./constants";

// Intent categories are re-exported so callers (and tests) can import them from
// the classifier module, mirroring the Python classifier's public constants.
export {
  ACHIEVEMENT,
  AMBIGUOUS,
  ARCHITECTURE,
  BLOG,
  CAREER,
  CERTIFICATION,
  EDUCATION,
  EXPERIENCE,
  GENERAL_PERSONAL,
  GITHUB,
  GREETING,
  JOB_MATCHING,
  OUT_OF_SCOPE,
  PERSONAL_PROFILE,
  PROJECT,
  PROJECT_COMPARISON,
  PUBLICATION,
  RESEARCH,
  RESUME,
  SKILLS,
  TIMELINE,
};

export const DOMAIN_INTENTS: Record<string, string> = {
  project: PROJECT,
  projects: PROJECT,
  portfolio: PERSONAL_PROFILE,
  architecture: ARCHITECTURE,
  skill: SKILLS,
  skills: SKILLS,
  technologies: SKILLS,
  technology: SKILLS,
  languages: SKILLS,
  tools: SKILLS,
  stack: SKILLS,
  experience: EXPERIENCE,
  career: CAREER,
  work: EXPERIENCE,
  internship: CAREER,
  internships: CAREER,
  job: CAREER,
  role: CAREER,
  recruiter: JOB_MATCHING,
  recruiters: JOB_MATCHING,
  hiring: JOB_MATCHING,
  hire: JOB_MATCHING,
  education: EDUCATION,
  degree: EDUCATION,
  university: EDUCATION,
  college: EDUCATION,
  school: EDUCATION,
  study: EDUCATION,
  studies: EDUCATION,
  certification: CERTIFICATION,
  certifications: CERTIFICATION,
  certificate: CERTIFICATION,
  credential: CERTIFICATION,
  research: RESEARCH,
  publication: PUBLICATION,
  publications: PUBLICATION,
  paper: PUBLICATION,
  papers: PUBLICATION,
  blog: BLOG,
  blogs: BLOG,
  github: GITHUB,
  repository: GITHUB,
  repositories: GITHUB,
  repos: GITHUB,
  achievement: ACHIEVEMENT,
  achievements: ACHIEVEMENT,
  award: ACHIEVEMENT,
  awards: ACHIEVEMENT,
  honors: ACHIEVEMENT,
  timeline: TIMELINE,
  milestone: TIMELINE,
  milestones: TIMELINE,
  history: TIMELINE,
  resume: RESUME,
  cv: RESUME,
  profile: PERSONAL_PROFILE,
  background: PERSONAL_PROFILE,
  strengths: GENERAL_PERSONAL,
  strength: GENERAL_PERSONAL,
  yourself: PERSONAL_PROFILE,
  name: PERSONAL_PROFILE,
  contact: PERSONAL_PROFILE,
  location: PERSONAL_PROFILE,
};

export const PROFILE_PRONOUN_RE =
  /\b(your|you|yourself|yours|my|mine|he|him|his|habib|mohammed habib qureshi)\b|\b(i|i've|i'm|i am|i have)\b(?=\s+\w+(?:ed|ing))/i;

// Strong work/project context words used to recognise questions about the
// owner's projects or tech even when no domain keyword appears (for example
// "In aws cspm what he have used", "What did he use in AWS CSPM?",
// "What challenges did he face in AWS CSPM?" or a typo like "proejcts").
export const PERSONAL_WORK_RE =
  /\b(projects?|built|build|developed|develop|worked|worked on|work on|use|uses|used|using|implemented|implement|created|made|done|stack|technolog(?:y|ies)|involve|resume|certifications?|education|skills?|github|repositor(?:y|ies)|challenge|challenges|face|faced|facing|obstacle|obstacles|difficult|hardest|learn(?:ed|ing)?|gain(?:ed|ing)?|know(?:s|ledge)?|compare)\b/i;

export const GREETING_RE =
  /\b(hi|hello|hey|greetings|good morning|good afternoon|good evening|how are you)\b/i;

export const INJECTION_PATTERNS: RegExp[] = [
  /\b(ignore|forget|disregard|overlook)\b.{0,40}\b(instructions?|prompts?|system|rules?|guidelines?|context|directives?|constraints?)\b/i,
  /\b(reveal|show|print|display|leak|expose|tell me)\b.{0,30}\b(system prompt|hidden instructions?|your prompt|instructions?|persona|restrictions?)\b/i,
  /\b(act as|pretend(?: to be)?|behave like|play the role of)\b.{0,40}\b(general|unrestricted|no limits|jailbreak|chatgpt)\b/i,
  /\bjailbreak\b/i,
  /\b(bypass|override|disable)\b.{0,30}\b(filter|restriction|guardrail|boundary|limitation|safety)\b/i,
  /\b(ignore|disregard|forget)\b.{0,40}\b(portfolio data|knowledge base|grounding)\b/i,
  /\b(forget|disregard|ignore|stop being)\b.{0,40}\b(portfolio|recruiter assistant|your assistant role)\b/i,
];

export interface OutOfScopePattern {
  reason: string;
  pattern: RegExp;
}

export const OUT_OF_SCOPE_PATTERNS: OutOfScopePattern[] = [
  {
    reason: "finance",
    pattern: /\b(price|rate)\b.{0,25}\b(gold|silver|bitcoin|crypto|cryptocurrency|stock|share|oil|petrol|apple|reliance)\b/i,
  },
  {
    reason: "finance",
    pattern: /\b(gold|silver|bitcoin|crypto|cryptocurrency|apple|oil)\b.{0,20}\b(price|rate|value|worth)\b/i,
  },
  {
    reason: "finance",
    pattern: /\b(stock market|share price|stock price|sensex|nifty|nasdaq|dow jones|bitcoin price)\b/i,
  },
  {
    reason: "weather",
    pattern: /\btoday's? weather\b|\bweather (today|forecast|now|outside)\b|\b(what'?s the temperature|forecast)\b/i,
  },
  { reason: "news", pattern: /\b(news|breaking news|current affairs|headlines|newspaper)\b/i },
  {
    reason: "news",
    pattern: /\b(happening in|happened in|what'?s happening in|what'?s going on in|going on in)\b|\b(latest (update|updates|news))\b/i,
  },
  {
    reason: "politics",
    pattern: /\b(prime minister|president of|election(?:s)? of|government of|parliament)\b/i,
  },
  { reason: "sports", pattern: /\b(cricket match|football match|world cup|ipl|score|who won|match result|sports)\b/i },
  { reason: "entertainment", pattern: /\b(tell me a joke|joke|funny story|meme)\b/i },
  {
    reason: "translation",
    pattern: /\b(translate(?: this)?|in french|in spanish|in german|in hindi|in chinese)\b/i,
  },
  {
    reason: "science",
    pattern:
      /\b(quantum physics|calculus|integral|derivative|homework)\b|\b(solve|calculate)\b.{0,30}\b(mathematics?|math|problem|equation|algebra)\b/i,
  },
  {
    reason: "general",
    pattern: /\b(capital of|largest country|smallest country|highest mountain|longest river)\b/i,
  },
  {
    reason: "recommendation",
    pattern: /\b(recommend (a|me)|best (phone|laptop|restaurant|movie|book|car|laptop|tv))\b/i,
  },
  {
    reason: "coding_request",
    pattern:
      /^\s*(write|create|build|develop|fix|debug|review|optimize|implement)\b.{0,40}\b(program|code|script|function|algorithm|api|app|application)\b/i,
  },
  {
    reason: "general_learning",
    pattern: /^\s*(teach|tutor|explain to me|help me learn)\b.{0,40}\b(python|javascript|c\+\+|java|react|aws|terraform)\b/i,
  },
  {
    reason: "general_learning",
    pattern: /\b(how (can|do|should) (i|we|you) learn|where (can|do|should) (i|we|you) learn|how to learn|where to learn|learn (python|javascript|c\+\+|java|react|aws|terraform|cybersecurity|programming|coding))\b/i,
  },
  {
    reason: "general_knowledge",
    pattern: /\b(who (is|are|was|were) (the|a|an)\b.{0,30}(minister|president|governor|ceo|founder|winner|champion))/i,
  },
  {
    reason: "general_knowledge",
    pattern: /\b(latest|recent|newest|trend|trending)\b.{0,20}\b(phone|laptop|phone|gadget|device|tech|technology)\b/i,
  },
  {
    reason: "general_knowledge",
    pattern: /\b(compare|versus|vs\.?|better)\b.{0,20}\b(phone|laptop|iphone|samsung|macbook|windows|android|ios)\b/i,
  },
];

export const DEFINITIONAL_RE =
  /^(what|who|when|where|why|which|how)\s+(is|are|was|were|does|do|did|isn't|aren't)\b|^(what is|what are|what's|define|meaning of|explain)\b/i;

// Pure-definition phrasing ("what is X", "define X"). Used to exclude only
// dictionary-style questions from the personal-work path, while still allowing
// anchored questions like "What did he use in AWS CSPM?" into scope.
export const DEFINITIONAL_PURE_RE = /^(what is|what are|what's|define|meaning of|explain)\b/i;

// Core professional domains of the portfolio owner. A definitional question
// ("What is X?") about one of these is redirected to a profile clarification
// instead of a flat refusal, so the assistant asks whether the user wants to
// know about the owner's experience, projects, or research involving X.
export const PROFILE_TOPIC_RE =
  /\b(ai|artificial intelligence|generative ai|gen ai|machine learning|ml|deep learning|iot|internet of things|blockchain|aws|amazon web services|cloud security|cloud|cybersecurity|cyber security|information security|security|embedded systems|embedded|robotics|opencv|langchain|mcp|model context protocol)\b/i;

export const TELL_ME_ABOUT_RE = /\btell me about\s+(.+)/i;

export const COMPARISON_RE = /\b(compare|which .* (better|best|most relevant|recommend)|difference between)\b/i;

export const JOB_MATCH_RE =
  /\b(job description|job posting|job match|matches? this|suitable for|role\b.*\b(description|posting|fit)|hire me)\b/i;

export const COMMON_ENGLISH: Set<string> = new Set([
  "the", "a", "an", "and", "or", "of", "to", "in", "on", "at", "for", "with", "is", "are", "was", "were",
  "be", "been", "have", "has", "had", "do", "does", "did", "i", "you", "your", "yours", "yourself", "my",
  "mine", "me", "we", "us", "our", "it", "this", "that", "these", "those", "he", "she", "they", "them",
  "their", "his", "her", "about", "from", "by", "as", "what", "which", "who", "whom", "when", "where",
  "why", "how", "will", "would", "can", "could", "should", "shall", "may", "might", "must", "please",
  "thanks", "thank", "hello", "hi", "hey", "not", "no", "yes", "if", "then", "than", "so", "such", "also",
  "too", "just", "but", "because", "although", "though", "while", "during", "project", "projects", "work",
  "experience", "skills", "skill", "more", "most", "best", "good", "great", "well", "nice", "really",
  "very", "quite", "say", "said", "tell",
]);

// Known project keywords for "Tell me about X" entity resolution in the classifier.
// This avoids a circular dependency with retrieval.ts.
const PROJECT_KEYWORDS: Record<string, string[]> = {
  cspm: ["cspm", "cloud security posture", "aws cloud security"],
  waf: ["waf", "web security suite", "web application security", "security suite", "scanner"],
  environmental: ["environmental monitoring", "environmental sensor", "multi parameter", "iot monitoring"],
  gesture: ["gesture", "robotic control", "robot control"],
  mirror: ["smart mirror", "magicmirror"],
  "heart rate": ["heart rate", "oled display", "stm32"],
  wildlife: ["wildlife", "forest fire", "forest fires"],
  blockchain: ["blockchain learning", "solidity", "smart contract"],
};

export interface Classification {
  is_in_scope: boolean;
  intent: string;
  confidence: number;
  domain_word: string;
  definition_target: string;
}

export function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export class DomainClassifier {
  private threshold: number;

  constructor(confidenceThreshold?: number) {
    this.threshold =
      confidenceThreshold !== undefined ? confidenceThreshold : CLASSIFIER_CONFIDENCE_THRESHOLD;
  }

  classify(text: string, vocabulary?: Set<string>, recentEntities?: string[]): Classification {
    const query = text.trim();
    const vocab = vocabulary ?? new Set<string>();
    if (!query) return { is_in_scope: false, intent: AMBIGUOUS, confidence: 0.0, domain_word: "", definition_target: "" };

    // Normalize: lowercase, strip punctuation, correct common typos
    const normalized = query
      .toLowerCase()
      .replace(/[?.!;,:'"()]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // 1. Prompt injection attempts are always rejected.
    for (const pattern of INJECTION_PATTERNS) {
      if (pattern.test(query)) {
        return { is_in_scope: false, intent: OUT_OF_SCOPE, confidence: 0.99, domain_word: "", definition_target: "" };
      }
    }

    // 1.5. Anaphora resolution — HIGHEST PRIORITY when context exists.
    // "What technologies did he use?", "What about its architecture?",
    // "Go back to AWS CSPM", "Tell me more about it"
    // When the query contains anaphoric references and we have recentEntities from
    // conversation history, resolve to the most recently discussed entity immediately,
    // before any domain-word or anchor-based classification.
    //
    // EXCEPTION: "Which one uses X?" is a SELECTION question — the user is asking
    // to identify a project from the list, not referencing a specific one. For these,
    // we set intent=PROJECT but leave definition_target empty so retrieval can search
    // by the criterion (e.g., "uses AWS").
    anaphora_block: if (recentEntities && recentEntities.length > 0) {
      const SELECTION_RE = /\b(which one|which project|which of|which)\b/i;
      const REFERENCE_RE = /\b(what about|how about|more about|tell me more|and how|how did|how does|what technologies|what sensors|what tools|what tech|what services|what stack|go back to|back to|tell me about)\b/i;
      const PRONOUN_ANAPHORA_RE = /\b(it|its|its own|theirs|that one|this one)\b/i;

      const isSelection = SELECTION_RE.test(query);
      const isReference = REFERENCE_RE.test(query) || (PRONOUN_ANAPHORA_RE.test(query) && /\b(project|used|uses|built|developed|work|technolog|sensor|tool|service|architect|architecture|monitor|monitored)\b/i.test(query));

      if (isSelection) {
        // "Which one uses AWS?" → PROJECT intent, no entity — retrieval searches by criterion
        return {
          is_in_scope: true,
          intent: PROJECT,
          confidence: 0.85,
          domain_word: "",
          definition_target: "",
        };
      }

      if (isReference) {
        // "What technologies did he use?" → resolve entity from history
        // For explicit references like "Go back to AWS CSPM" or "Tell me about
        // Environmental Monitoring", extract from query first, then fall back
        // to the most recent entity from history.
        let resolvedEntity = recentEntities[recentEntities.length - 1];
        const explicitMatch = /(?:go back to|back to|tell me about)\s+(.+)/i.exec(query);
        if (explicitMatch) {
          const explicitTopic = explicitMatch[1].trim().toLowerCase().replace(/[?.!;:]+$/, "");
          // First try to find the entity in recentEntities
          let found = false;
          for (const ent of recentEntities) {
            if (ent.toLowerCase().includes(explicitTopic) || explicitTopic.includes(ent.toLowerCase().split(" ")[0])) {
              resolvedEntity = ent;
              found = true;
              break;
            }
          }
          // If not found in recentEntities, the user is introducing a NEW entity
          // (e.g., "Tell me about Environmental Monitoring" when the last entity
          // was AWS CSPM). Skip anaphora and let step 2a resolve from the query.
          if (!found) break anaphora_block;
        }
        return {
          is_in_scope: true,
          intent: PROJECT,
          confidence: 0.85,
          domain_word: "",
          definition_target: resolvedEntity,
        };
      }
    } // end anaphora_block

    // 2. Questions anchored on the portfolio owner (your/my/you ... domain word).
    const anchor = PROFILE_PRONOUN_RE.test(query);
    const domainHits = this._domainHits(normalized);

    // 2a. Project entity check — fires BEFORE anchor check so "What technologies
    // in AWS CSPM?" returns PROJECT even without a profile pronoun.
    const hasProjectEntity = Object.values(PROJECT_KEYWORDS).some((keywords) =>
      keywords.some((kw) => normalized.includes(kw.toLowerCase()))
    );
    if (hasProjectEntity && !DEFINITIONAL_RE.test(query)) {
      return {
        is_in_scope: true,
        intent: PROJECT,
        confidence: 0.85,
        domain_word: domainHits.length > 0 ? domainHits[0][1] : "",
        definition_target: "",
      };
    }

    if (anchor && domainHits.length > 0) {
      // When the query mentions a specific profile topic (IoT, AI, etc.) alongside
      // a general domain word like "work"/"experience"/"technologies", prefer
      // PROJECT intent.
      if (PROFILE_TOPIC_RE.test(query) && !DEFINITIONAL_RE.test(query)) {
        const genericIntents = new Set([EXPERIENCE, CAREER, SKILLS]);
        const hasOnlyGeneric = domainHits.every(([, intent]) => genericIntents.has(intent));
        if (hasOnlyGeneric) {
          return {
            is_in_scope: true,
            intent: PROJECT,
            confidence: 0.82,
            domain_word: domainHits[0][1],
            definition_target: "",
          };
        }
      }
      const intent = this._resolveIntent(query, domainHits);
      const confidence = Math.min(0.99, 0.75 + 0.06 * domainHits.length);
      return {
        is_in_scope: true,
        intent,
        confidence,
        domain_word: domainHits[0][1],
        definition_target: "",
      };
    }

    // 3. Domain words without an anchor but with owner intent.
    if (domainHits.length > 0 && !DEFINITIONAL_RE.test(query)) {
      const intent = this._resolveIntent(query, domainHits);
      return {
        is_in_scope: true,
        intent,
        confidence: 0.8,
        domain_word: domainHits[0][1],
        definition_target: "",
      };
    }

    // 3.5. Questions about the owner's work/tech anchored on a profile pronoun
    // (your/he/him/his/Habib). Covers project entities like "aws cspm", "What
    // did he use in AWS CSPM?", challenge questions, and typo variants of
    // domain words ("proejcts") with no vocabulary overlap.
    if (anchor && PERSONAL_WORK_RE.test(query) && !DEFINITIONAL_PURE_RE.test(query)) {
      const intent = domainHits.length > 0 ? this._resolveIntent(query, domainHits) : PROJECT;
      return {
        is_in_scope: true,
        intent,
        confidence: domainHits.length > 0 ? 0.82 : 0.75,
        domain_word: domainHits[0]?.[1] ?? "",
        definition_target: "",
      };
    }

    // 3.6. Explicit comparison questions: "Compare AWS CSPM and AI WAF",
    // "What's the difference between X and Y?"
    if (COMPARISON_RE.test(query)) {
      // Check if the query mentions known project entities
      const hasProjectRef = Object.values(PROJECT_KEYWORDS).some((keywords) =>
        keywords.some((kw) => normalized.includes(kw.toLowerCase()))
      );
      if (hasProjectRef) {
        return {
          is_in_scope: true,
          intent: PROJECT_COMPARISON,
          confidence: 0.85,
          domain_word: "",
          definition_target: "",
        };
      }
      // Even without known entities, comparison is in-scope if it mentions Habib
      if (anchor) {
        return {
          is_in_scope: true,
          intent: PROJECT_COMPARISON,
          confidence: 0.8,
          domain_word: "",
          definition_target: "",
        };
      }
    }

    // 4. Short greetings are allowed.
    if (GREETING_RE.test(query) && query.split(/\s+/).length <= 8 && domainHits.length === 0) {
      return { is_in_scope: true, intent: GREETING, confidence: 0.95, domain_word: "", definition_target: "" };
    }

    // 5. Explicit out-of-scope topics.
    for (const { pattern } of OUT_OF_SCOPE_PATTERNS) {
      if (pattern.test(query)) {
        return { is_in_scope: false, intent: OUT_OF_SCOPE, confidence: 0.95, domain_word: "", definition_target: "" };
      }
    }

    // 5.5. Mixed questions: "What is X and how has Habib used it?"
    // If the question contains both a definitional part and a personal part,
    // treat it as a personal question (answer only the Habib-specific portion).
    // Skip for "Who is [person]?" which is handled in step 6.
    if (DEFINITIONAL_RE.test(query) && anchor && !/^(who)\s+(is|are|was|were)/i.test(query)) {
      // "What is AWS Lambda and how has Habib used it?" → PERSONAL (Habib portion)
      return { is_in_scope: true, intent: PROJECT, confidence: 0.75, domain_word: "", definition_target: "" };
    }

    // 6. Definitional questions ("What is X?", "Who is X?").
    // "Who is Habib/Qureshi?" → PERSONAL_PROFILE (name-based, not vocab-based).
    // "Explain the architecture of X" → ARCHITECTURE.
    // All other "What is X?" definitional questions → OUT_OF_SCOPE.
    if (DEFINITIONAL_RE.test(query)) {
      const target = DomainClassifier._definitionTarget(query);
      if (target) {
        const targetLower = target.toLowerCase().trim().replace(/[?.!;:]+$/, "");
        // "Who is Habib Qureshi?" → personal profile (check name directly, not vocab)
        if (/^(who)\s+(is|are|was|were)/i.test(query)) {
          if (/\b(habib|mohammed habib qureshi|qureshi)\b/i.test(targetLower)) {
            return { is_in_scope: true, intent: PERSONAL_PROFILE, confidence: 0.9, domain_word: "", definition_target: target };
          }
        }
        // "Explain the architecture of X" → ARCHITECTURE (not definitional)
        if (/^(explain|describe)\b/i.test(query) && /\b(architecture|design|system)\b/i.test(query)) {
          if (domainHits.length > 0) {
            return { is_in_scope: true, intent: ARCHITECTURE, confidence: 0.82, domain_word: "architecture", definition_target: "" };
          }
          if (vocabulary && this._overlapsVocab(targetLower, vocabulary)) {
            return { is_in_scope: true, intent: ARCHITECTURE, confidence: 0.78, domain_word: "architecture", definition_target: "" };
          }
        }
        // "What is the AI WAF project?" → PROJECT (check if target is a known project entity)
        // Only match if target has project-specific modifiers (project, system, suite, etc.)
        // or is a multi-word project name. Don't match generic tech terms like "blockchain" or "iot".
        const hasProjectModifier = /\b(project|system|suite|monitor|monitoring|scanner|mirror|control|rate|fire|fires|learning|security)\b/i.test(targetLower);
        if (hasProjectModifier) {
          for (const keywords of Object.values(PROJECT_KEYWORDS)) {
            if (keywords.some((kw) => {
              const kwLower = kw.toLowerCase();
              if (targetLower.includes(kwLower)) return true;
              const targetRegex = new RegExp(`\\b${escapeRegex(targetLower)}\\b`, "i");
              return targetRegex.test(kwLower);
            })) {
              return { is_in_scope: true, intent: PROJECT, confidence: 0.85, domain_word: targetLower, definition_target: "" };
            }
          }
        }
        // All other definitional questions → OUT_OF_SCOPE.
        // "What is Python?" / "What is AI?" / "What is blockchain?" / "What is Terraform?"
        // are general definitions, not personal questions. Do NOT use vocab overlap
        // alone to promote a definition to AMBIGUOUS.
        return { is_in_scope: false, intent: OUT_OF_SCOPE, confidence: 0.8, domain_word: "", definition_target: target };
      }
      return { is_in_scope: false, intent: OUT_OF_SCOPE, confidence: 0.75, domain_word: "", definition_target: "" };
    }

    // 7. "Tell me about X" — inside the profile vocabulary it is ambiguous,
    //    otherwise it is out of scope. "Tell me about him/yourself/Habib" is personal profile.
    //    "Tell me about [project entity]" → PROJECT.
    const tellMatch = TELL_ME_ABOUT_RE.exec(query);
    if (tellMatch) {
      const topic = tellMatch[1].trim().toLowerCase().replace(/[?.!;:]+$/, "");
      // "Tell me about him/yourself/Habib" → personal profile
      if (/^(him|yourself|habib|mohammed habib qureshi|you|your)$/i.test(topic)) {
        return { is_in_scope: true, intent: PERSONAL_PROFILE, confidence: 0.95, domain_word: "", definition_target: "" };
      }
      // Check if topic matches a known project entity (e.g., "Tell me about AWS CSPM")
      for (const keywords of Object.values(PROJECT_KEYWORDS)) {
        if (keywords.some((kw) => {
          const kwLower = kw.toLowerCase();
          if (topic.includes(kwLower)) return true;
          const topicRegex = new RegExp(`\\b${escapeRegex(topic)}\\b`, "i");
          return topicRegex.test(kwLower);
        })) {
          return { is_in_scope: true, intent: PROJECT, confidence: 0.85, domain_word: topic, definition_target: "" };
        }
      }
      // "Tell me about AI/blockchain/etc." without a Habib connection → OUT_OF_SCOPE.
      // Do NOT use vocabulary overlap to promote to AMBIGUOUS.
      return { is_in_scope: false, intent: OUT_OF_SCOPE, confidence: 0.8, domain_word: "", definition_target: topic };
    }

    // 7.5. Profile introduction patterns: "Can you introduce Habib?",
    // "Give me an overview of Habib", etc. These are personal profile questions.
    if (/\b(introduce|introduction|overview|summary|brief)\b.{0,30}\b(habib|mohammed habib qureshi|him|yourself|you)\b/i.test(query)) {
      return { is_in_scope: true, intent: PERSONAL_PROFILE, confidence: 0.9, domain_word: "", definition_target: "" };
    }
    if (/\b(habib|mohammed habib qureshi|him|yourself|you)\b.{0,30}\b(introduce|introduction|overview|summary|brief)\b/i.test(query)) {
      return { is_in_scope: true, intent: PERSONAL_PROFILE, confidence: 0.9, domain_word: "", definition_target: "" };
    }

    // 8. Question mentions profile vocabulary but intent is unclear.
    if (this._overlapsVocab(query, vocab)) {
      return { is_in_scope: false, intent: AMBIGUOUS, confidence: 0.5, domain_word: "", definition_target: "" };
    }

    // 9. Default: never guess.
    return { is_in_scope: false, intent: AMBIGUOUS, confidence: 0.3, domain_word: "", definition_target: "" };
  }

  isInScope(classification: Classification): boolean {
    return classification.is_in_scope && classification.confidence >= this.threshold;
  }

  private _domainHits(text: string): Array<[number, string, string]> {
    const hits: Array<[number, string, string]> = [];
    const lowered = text.toLowerCase();
    for (const [word, intent] of Object.entries(DOMAIN_INTENTS)) {
      const pattern = new RegExp(`\\b${escapeRegex(word)}\\b`, "g");
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(lowered)) !== null) {
        hits.push([match.index, intent, word]);
      }
    }
    // Also check common typos against domain words
    const TYPO_TO_DOMAIN: Record<string, string> = {
      certifcations: "certifications",
      certfication: "certification",
      experiance: "experience",
      educaiton: "education",
      proejcts: "projects",
      technlogies: "technologies",
      repositoriy: "repository",
    };
    for (const [typo, corrected] of Object.entries(TYPO_TO_DOMAIN)) {
      if (lowered.includes(typo) && DOMAIN_INTENTS[corrected]) {
        const intent = DOMAIN_INTENTS[corrected];
        const idx = lowered.indexOf(typo);
        // Avoid duplicate if already matched
        if (!hits.some((h) => h[1] === intent)) {
          hits.push([idx, intent, corrected]);
        }
      }
    }
    hits.sort((a, b) => a[0] - b[0]);
    return hits;
  }

  private _resolveIntent(text: string, hits: Array<[number, string, string]>): string {
    const intents = new Set(hits.map(([, intent]) => intent));
    if (JOB_MATCH_RE.test(text)) return JOB_MATCHING;
    if (COMPARISON_RE.test(text) && intents.has(PROJECT)) return PROJECT_COMPARISON;
    if (intents.has(ARCHITECTURE)) return ARCHITECTURE;
    return hits.length > 0 ? hits[0][1] : GENERAL_PERSONAL;
  }

  private static _definitionTarget(text: string): string {
    const match =
      /(?:what is|what are|what's|who is|who are|who's|define|meaning of|explain)\s+(?:the\s+)?([a-z0-9][a-z0-9 &+/.-]{1,60})/i.exec(
        text
      );
    if (!match) return "";
    return match[1].replace(/[?.!]*$/, "").trim().replace(/[?.]*$/, "").trim();
  }

  private _overlapsVocab(term: string, vocabulary: Set<string>): boolean {
    const cleaned = term.toLowerCase().trim().replace(/[?.!;:]+$/, "");
    if (!cleaned) return false;
    if (vocabulary.has(cleaned)) return true;

    const termTokens = new Set(cleaned.match(/[a-z0-9][a-z0-9_.+-]{1,40}/g) || []);
    for (const entry of vocabulary) {
      const entryLower = entry.toLowerCase();
      if (new RegExp(`\\b${escapeRegex(cleaned)}\\b`, "i").test(entryLower)) return true;
      if (new RegExp(`\\b${escapeRegex(entryLower)}\\b`, "i").test(cleaned)) return true;
      const entryTokens = new Set(entryLower.match(/[a-z0-9][a-z0-9_.+-]{1,40}/g) || []);
      for (const token of termTokens) {
        if (entryTokens.has(token)) return true;
      }
    }
    return false;
  }
}