import { COMMON_ENGLISH } from "./classifier";

// Phrases/words that are normal conversational English and must never be flagged
// as hallucinated entities even though they are capitalized.
export const NON_ENTITY_ALLOWLIST: Set<string> = new Set([
  "the", "a", "an", "and", "of", "to", "in", "on", "at", "for", "with", "from", "by", "as", "or",
  "you", "your", "i", "my", "me", "we", "our", "it", "he", "she", "they", "their", "this", "that",
  "these", "those", "is", "are", "was", "were", "be", "been", "have", "has", "had", "do", "does",
  "did", "will", "would", "can", "could", "should", "would", "shall", "may", "might", "must", "yes",
  "no", "not", "please", "thanks", "thank", "hello", "hi", "hey", "am", "are", "really", "very",
  "also", "too", "just", "but", "if", "then", "so", "such", "what", "which", "who", "when", "where",
  "why", "how", "more", "most", "best", "good", "great", "well", "about", "because", "recruiter",
  "recruiters", "internship", "internships", "portfolio", "project", "projects", "skills", "skill",
  "experience", "education", "certification", "certifications", "research", "github", "resume",
  "career", "technology", "technologies", "company", "companies", "role", "work", "engineer",
  "engineering", "degree", "university", "location",
  // Common response phrases
  "Sure", "Happy", "Here", "Let", "That's", "Great", "Excellent", "Interesting",
  "One", "Two", "Three", "First", "Second", "Third", "Some", "Several", "Many",
  "主要包括", "主要", "包括",
  // Sentence-start words that appear in portfolio responses
  "Science", "Recent", "Technical", "Computer", "Engineering", "Skills", "Projects",
  "Experience", "Education", "Certifications", "Profile", "Summary", "Overview",
  // Technical but common terms that shouldn't be flagged
  "API", "APIs", "REST", "SQL", "NoSQL", "CSS", "HTML", "JSON", "XML", "HTTP", "HTTPS",
  "SSH", "SSL", "TLS", "CI", "CD", "DevOps", "MVP", "UI", "UX",
  // Common action phrases
  "Built", "Developed", "Created", "Implemented", "Designed", "Led", "Managed",
  "Integrated", "Developed", "Configured", "Deployed", "Maintained",
  // Certification-related terms
  "Issued", "Expires", "Credential", "Expired", "Valid",
]);

export interface ValidationResult {
  supported: boolean;
  unsupported_claims: string[];
  confidence_penalty: number;
  caveat: string;
}

export class ResponseValidator {
  private vocabulary: Set<string>;
  private lowerVocab: Set<string>;

  constructor(vocabulary: Set<string>) {
    this.vocabulary = vocabulary;
    this.lowerVocab = new Set([...vocabulary].map((term) => term.toLowerCase()));
  }

  /**
   * Enhance the validator's vocabulary with terms extracted from the grounding
   * context. This ensures that legitimate source terms (e.g., "Blue Pill",
   * "Sep", "STM32") are not flagged as unsupported claims.
   */
  addGroundingTerms(groundingContext: string): void {
    if (!groundingContext) return;
    // Extract key terms: capitalized words, technical terms, dates, hardware names
    const terms = ResponseValidator._extractGroundingTerms(groundingContext);
    for (const term of terms) {
      this.lowerVocab.add(term.toLowerCase());
    }
  }

  private static _extractGroundingTerms(context: string): string[] {
    const terms: string[] = [];
    const seen = new Set<string>();
    // Multi-word technical phrases (e.g., "STM32 Blue Pill", "AWS Lambda")
    const multiWord = /\b[A-Z][A-Za-z0-9+&.]*[- ][A-Z][A-Za-z0-9+&.]*\b/g;
    let match: RegExpExecArray | null;
    while ((match = multiWord.exec(context)) !== null) {
      const phrase = match[0];
      if (!seen.has(phrase.toLowerCase())) {
        seen.add(phrase.toLowerCase());
        terms.push(phrase);
      }
    }
    // All-caps abbreviations (e.g., "AWS", "IoT", "STM32")
    const caps = /\b[A-Z]{2,}[A-Z0-9+.-]*\b/g;
    while ((match = caps.exec(context)) !== null) {
      const token = match[0];
      if (!seen.has(token.toLowerCase())) {
        seen.add(token.toLowerCase());
        terms.push(token);
      }
    }
    // Date patterns (e.g., "Sep 2024", "Jan 2026", "Mar 2025")
    const dates = /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{4}\b/gi;
    while ((match = dates.exec(context)) !== null) {
      const date = match[0];
      if (!seen.has(date.toLowerCase())) {
        seen.add(date.toLowerCase());
        terms.push(date);
      }
      // Also add the month abbreviation
      const month = date.split(" ")[0];
      if (!seen.has(month.toLowerCase())) {
        seen.add(month.toLowerCase());
        terms.push(month);
      }
    }
    // Hardware/tech terms with numbers (e.g., "ESP32", "DHT22", "MQ135")
    const hw = /\b[A-Za-z]+[0-9]{1,4}\b/g;
    while ((match = hw.exec(context)) !== null) {
      const token = match[0];
      if (!seen.has(token.toLowerCase())) {
        seen.add(token.toLowerCase());
        terms.push(token);
      }
    }
    // Single capitalized words that look like proper nouns (e.g., "Kubernetes", "Docker")
    // Skip words at sentence start
    const properNoun = /\b([A-Z][a-z]{2,20})\b/g;
    while ((match = properNoun.exec(context)) !== null) {
      const word = match[1];
      const beforeMatch = context.slice(0, match.index);
      const isSentenceStart = /(^|[.!?]\s+)$/.test(beforeMatch.trimEnd());
      if (isSentenceStart) continue;
      if (!seen.has(word.toLowerCase())) {
        seen.add(word.toLowerCase());
        terms.push(word);
      }
    }
    return terms;
  }

  validate(responseText: string): ValidationResult {
    if (!responseText || !responseText.trim()) {
      return { supported: true, unsupported_claims: [], confidence_penalty: 0, caveat: "" };
    }

    const candidates = ResponseValidator._extractEntityCandidates(responseText);
    const unsupported: string[] = [];
    for (const candidate of candidates) {
      if (this._isKnown(candidate)) continue;
      if (!this._looksLikeClaim(candidate)) continue;
      unsupported.push(candidate);
    }

    if (unsupported.length === 0) {
      return { supported: true, unsupported_claims: [], confidence_penalty: 0, caveat: "" };
    }

    const penalty = Math.min(0.5, 0.15 * unsupported.length);
    const caveat = " Some of those details may not be verified yet.";
    return {
      supported: false,
      unsupported_claims: unsupported,
      confidence_penalty: penalty,
      caveat,
    };
  }

  private _isKnown(candidate: string): boolean {
    const lowered = candidate.toLowerCase();
    if (this.lowerVocab.has(lowered)) return true;
    // Date patterns (e.g., "Sep 2024", "Jan 2026", "Issued Jul", "Expires Mar")
    if (/^(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i.test(lowered)) return true;
    if (/^(?:issued|expires|since|from|to)\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i.test(lowered)) return true;
    // Month abbreviations alone
    if (/^(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)$/i.test(lowered)) return true;
  // Hardware component patterns (e.g., "Blue Pill", "Red Board", "Green LED")
  // These are common electronics names that appear in embedded systems contexts.
  if (/^(?:blue|red|green|black|white|yellow|orange|purple)\s+(?:pill|board|module|shield|display|led|sensor|chip)$/i.test(lowered)) return true;
  // Individual hardware component words
  if (/^(?:blue|pill|led|oled|stm32|esp32|raspberry|arduino)$/i.test(lowered)) return true;
    // LED-prefixed terms (e.g., "LED-guided", "LED display")
    if (/^led[- ]/i.test(lowered)) return true;
    const tokens = new Set(lowered.match(/[a-z0-9][a-z0-9_.+-]{1,40}/g) || []);
    for (const entry of this.lowerVocab) {
      if (lowered.includes(entry) || entry.includes(lowered)) return true;
      const entryTokens = new Set(entry.match(/[a-z0-9][a-z0-9_.+-]{1,40}/g) || []);
      let shared = 0;
      for (const token of tokens) {
        if (entryTokens.has(token)) shared += 1;
      }
      if (shared >= 2) return true;
    }
    return false;
  }

  private _looksLikeClaim(candidate: string): boolean {
    const words = candidate.split(/\s+/).filter(Boolean);
    if (words.length === 0) return false;
    const low = candidate.toLowerCase();
    if (words.every((w) => COMMON_ENGLISH.has(w.toLowerCase()))) return false;
    if (NON_ENTITY_ALLOWLIST.has(low) || NON_ENTITY_ALLOWLIST.has(candidate)) return false;
    if (words.length === 1 && COMMON_ENGLISH.has(words[0].toLowerCase())) return false;
    // Allow single common verbs/adjectives that are capitalized at sentence start
    if (words.length === 1 && /^(built|developed|created|implemented|designed|led|managed|integrated|configured|deployed|maintained|worked|used|built|built|learned|gained)$/i.test(words[0])) return false;
    return true;
  }

  private static _extractEntityCandidates(text: string): string[] {
    const candidates: string[] = [];
    const seen = new Set<string>();
    const multiWord = /\b[A-Z][A-Za-z0-9+&.]*(?:[- ]{1,2}[A-Z][A-Za-z0-9+&.]*){1,6}\b/g;
    let match: RegExpExecArray | null;
    while ((match = multiWord.exec(text)) !== null) {
      const phrase = match[0];
      if (!seen.has(phrase)) {
        seen.add(phrase);
        candidates.push(phrase);
      }
    }
    const single = /\b[A-Z]{2,}[A-Z0-9+.-]*\b|\b[A-Za-z]+[0-9]{1,4}\b/g;
    while ((match = single.exec(text)) !== null) {
      const token = match[0];
      if (!seen.has(token)) {
        seen.add(token);
        candidates.push(token);
      }
    }
    // Also capture single capitalized words that look like proper nouns
    // (e.g., "Kubernetes", "Docker", "Spark") — skip words at sentence start
    // which are likely just capitalized English words.
    const properNoun = /\b([A-Z][a-z]{2,20})\b/g;
    while ((match = properNoun.exec(text)) !== null) {
      const word = match[1];
      // Skip if at start of sentence (preceded by start, period/question/exclamation, or newline + space)
      const beforeMatch = text.slice(0, match.index);
      const isSentenceStart = /(^|[.!?]\s+|\n\s*)$/.test(beforeMatch.trimEnd());
      if (isSentenceStart) continue;
      if (!seen.has(word)) {
        seen.add(word);
        candidates.push(word);
      }
    }
    return candidates;
  }
}