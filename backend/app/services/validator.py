import re
from dataclasses import dataclass, field
from typing import List, Set

from app.services.classifier import COMMON_ENGLISH

# Phrases/words that are normal conversational English and must never be flagged
# as hallucinated entities even though they are capitalized.
NON_ENTITY_ALLOWLIST = {
    "the",
    "a",
    "an",
    "and",
    "of",
    "to",
    "in",
    "on",
    "at",
    "for",
    "with",
    "from",
    "by",
    "as",
    "or",
    "you",
    "your",
    "i",
    "my",
    "me",
    "we",
    "our",
    "it",
    "he",
    "she",
    "they",
    "their",
    "this",
    "that",
    "these",
    "those",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "will",
    "would",
    "can",
    "could",
    "should",
    "would",
    "shall",
    "may",
    "might",
    "must",
    "yes",
    "no",
    "not",
    "please",
    "thanks",
    "thank",
    "hello",
    "hi",
    "hey",
    "am",
    "are",
    "really",
    "very",
    "also",
    "too",
    "just",
    "but",
    "if",
    "then",
    "so",
    "such",
    "what",
    "which",
    "who",
    "when",
    "where",
    "why",
    "how",
    "more",
    "most",
    "best",
    "good",
    "great",
    "well",
    "about",
    "because",
    "recruiter",
    "recruiters",
    "internship",
    "internships",
    "portfolio",
    "project",
    "projects",
    "skills",
    "skill",
    "experience",
    "education",
    "certification",
    "certifications",
    "research",
    "github",
    "resume",
    "career",
    "technology",
    "technologies",
    "company",
    "companies",
    "role",
    "work",
    "engineer",
    "engineering",
    "degree",
    "university",
    "location",
}


@dataclass
class ValidationResult:
    supported: bool
    unsupported_claims: List[str] = field(default_factory=list)
    confidence_penalty: float = 0.0
    caveat: str = ""


class ResponseValidator:
    """Grounding validation: flags claims the response made that are not
    backed by the personal knowledge vocabulary (spec section 21)."""

    def __init__(self, vocabulary: Set[str]):
        self.vocabulary = vocabulary
        self._lower_vocab = {term.lower() for term in vocabulary}

    def validate(self, response_text: str) -> ValidationResult:
        if not response_text or not response_text.strip():
            return ValidationResult(supported=True)

        candidates = self._extract_entity_candidates(response_text)
        unsupported: List[str] = []
        for candidate in candidates:
            if self._is_known(candidate):
                continue
            if not self._looks_like_claim(candidate):
                continue
            unsupported.append(candidate)

        if not unsupported:
            return ValidationResult(supported=True)

        penalty = min(0.5, 0.15 * len(unsupported))
        caveat = " Note: some details in this response may not be verified in my portfolio data."
        return ValidationResult(
            supported=False,
            unsupported_claims=unsupported,
            confidence_penalty=penalty,
            caveat=caveat,
        )

    def _is_known(self, candidate: str) -> bool:
        lowered = candidate.lower()
        if lowered in self._lower_vocab:
            return True
        # Token-overlap against vocabulary entries (e.g. 'AWS Lambda' vs 'AWS').
        tokens = set(re.findall(r"[a-z0-9][a-z0-9_.+-]{1,40}", lowered))
        for entry in self._lower_vocab:
            if lowered in entry or entry in lowered:
                return True
            entry_tokens = set(re.findall(r"[a-z0-9][a-z0-9_.+-]{1,40}", entry))
            if tokens & entry_tokens and len(tokens & entry_tokens) >= 2:
                return True
        return False

    def _looks_like_claim(self, candidate: str) -> bool:
        words = candidate.split()
        if not words:
            return False
        low = candidate.lower()
        if all(w.lower() in COMMON_ENGLISH for w in words):
            return False
        if low in NON_ENTITY_ALLOWLIST:
            return False
        if len(words) == 1 and words[0].lower() in COMMON_ENGLISH:
            return False
        return True

    @staticmethod
    def _extract_entity_candidates(text: str) -> List[str]:
        """Extract proper-noun-looking phrases from the response."""
        candidates: List[str] = []
        seen = set()
        # Multi-word capitalized phrases, e.g. 'AWS Cloud Security Posture Monitoring System'
        for match in re.finditer(r"\b[A-Z][A-Za-z0-9+&.]*(?:[- ]{1,2}[A-Z][A-Za-z0-9+&.]*){1,6}\b", text):
            phrase = match.group(0)
            if phrase not in seen:
                seen.add(phrase)
                candidates.append(phrase)
        # Single capitalized tokens that look technical (digits, caps, code).
        for match in re.finditer(r"\b[A-Z]{2,}[A-Z0-9+.-]*\b|\b[A-Za-z]+[0-9]{1,4}\b", text):
            token = match.group(0)
            if token not in seen:
                seen.add(token)
                candidates.append(token)
        return candidates
