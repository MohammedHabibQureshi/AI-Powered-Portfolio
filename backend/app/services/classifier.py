import re
from dataclasses import dataclass
from typing import Dict, List, Optional, Set, Tuple

from app.core.config import settings

# ---------------------------------------------------------------------------
# Intent categories (spec section 4)
# ---------------------------------------------------------------------------
PERSONAL_PROFILE = "PERSONAL_PROFILE"
PROJECT = "PROJECT"
SKILLS = "SKILLS"
EXPERIENCE = "EXPERIENCE"
EDUCATION = "EDUCATION"
CERTIFICATION = "CERTIFICATION"
RESEARCH = "RESEARCH"
PUBLICATION = "PUBLICATION"
BLOG = "BLOG"
GITHUB = "GITHUB"
ACHIEVEMENT = "ACHIEVEMENT"
TIMELINE = "TIMELINE"
CAREER = "CAREER"
JOB_MATCHING = "JOB_MATCHING"
PROJECT_COMPARISON = "PROJECT_COMPARISON"
ARCHITECTURE = "ARCHITECTURE"
RESUME = "RESUME"
GENERAL_PERSONAL = "GENERAL_PERSONAL"
GREETING = "GREETING"
OUT_OF_SCOPE = "OUT_OF_SCOPE"
AMBIGUOUS = "AMBIGUOUS"

DOMAIN_INTENTS = {
    "project": PROJECT,
    "projects": PROJECT,
    "portfolio": PERSONAL_PROFILE,
    "architecture": ARCHITECTURE,
    "skill": SKILLS,
    "skills": SKILLS,
    "technologies": SKILLS,
    "technology": SKILLS,
    "languages": SKILLS,
    "tools": SKILLS,
    "stack": SKILLS,
    "experience": EXPERIENCE,
    "career": CAREER,
    "work": EXPERIENCE,
    "internship": CAREER,
    "internships": CAREER,
    "job": CAREER,
    "role": CAREER,
    "recruiter": JOB_MATCHING,
    "recruiters": JOB_MATCHING,
    "hiring": JOB_MATCHING,
    "hire": JOB_MATCHING,
    "education": EDUCATION,
    "degree": EDUCATION,
    "university": EDUCATION,
    "college": EDUCATION,
    "school": EDUCATION,
    "study": EDUCATION,
    "studies": EDUCATION,
    "certification": CERTIFICATION,
    "certifications": CERTIFICATION,
    "certificate": CERTIFICATION,
    "credential": CERTIFICATION,
    "research": RESEARCH,
    "publication": PUBLICATION,
    "publications": PUBLICATION,
    "paper": PUBLICATION,
    "papers": PUBLICATION,
    "blog": BLOG,
    "blogs": BLOG,
    "github": GITHUB,
    "repository": GITHUB,
    "repositories": GITHUB,
    "repos": GITHUB,
    "achievement": ACHIEVEMENT,
    "achievements": ACHIEVEMENT,
    "award": ACHIEVEMENT,
    "awards": ACHIEVEMENT,
    "honors": ACHIEVEMENT,
    "timeline": TIMELINE,
    "milestone": TIMELINE,
    "milestones": TIMELINE,
    "history": TIMELINE,
    "resume": RESUME,
    "cv": RESUME,
    "profile": PERSONAL_PROFILE,
    "background": PERSONAL_PROFILE,
    "strengths": GENERAL_PERSONAL,
    "strength": GENERAL_PERSONAL,
    "yourself": PERSONAL_PROFILE,
    "name": PERSONAL_PROFILE,
    "contact": PERSONAL_PROFILE,
    "location": PERSONAL_PROFILE,
}

PROFILE_PRONOUN_RE = re.compile(
    r"(?i)\b(your|you|yourself|yours|my|mine)\b|\b(i|i've|i'm|i am|i have)\b(?=\s+\w+(?:ed|ing))"
)

GREETING_RE = re.compile(r"(?i)\b(hi|hello|hey|greetings|good morning|good afternoon|good evening|how are you)\b")

INJECTION_PATTERNS = [
    re.compile(
        r"(?i)\b(ignore|forget|disregard|overlook)\b.{0,40}\b(instructions?|prompts?|system|rules?|guidelines?|context|directives?|constraints?)\b"
    ),
    re.compile(
        r"(?i)\b(reveal|show|print|display|leak|expose|tell me)\b.{0,30}\b(system prompt|hidden instructions?|your prompt|instructions?|persona|restrictions?)\b"  # noqa: E501
    ),
    re.compile(
        r"(?i)\b(act as|pretend(?: to be)?|behave like|play the role of)\b.{0,40}\b(general|unrestricted|no limits|jailbreak|chatgpt)\b"  # noqa: E501
    ),
    re.compile(r"(?i)\bjailbreak\b"),
    re.compile(
        r"(?i)\b(bypass|override|disable)\b.{0,30}\b(filter|restriction|guardrail|boundary|limitation|safety)\b"
    ),
    re.compile(r"(?i)\b(ignore|disregard|forget)\b.{0,40}\b(portfolio data|knowledge base|grounding)\b"),
    re.compile(
        r"(?i)\b(forget|disregard|ignore|stop being)\b.{0,40}\b(portfolio|recruiter assistant|your assistant role)\b"
    ),  # noqa: E501
]

OUT_OF_SCOPE_PATTERNS: List[Tuple[re.Pattern, str]] = [
    (
        re.compile(
            r"(?i)\b(price|rate)\b.{0,25}\b(gold|silver|bitcoin|crypto|cryptocurrency|stock|share|oil|petrol|apple|reliance)\b"
        ),
        "finance",
    ),  # noqa: E501
    (
        re.compile(r"(?i)\b(gold|silver|bitcoin|crypto|cryptocurrency|apple|oil)\b.{0,20}\b(price|rate|value|worth)\b"),
        "finance",
    ),  # noqa: E501
    (
        re.compile(r"(?i)\b(stock market|share price|stock price|sensex|nifty|nasdaq|dow jones|bitcoin price)\b"),
        "finance",
    ),  # noqa: E501
    (
        re.compile(
            r"(?i)\btoday's? weather\b|\bweather (today|forecast|now|outside)\b|\b(what'?s the temperature|forecast)\b"
        ),
        "weather",
    ),  # noqa: E501
    (re.compile(r"(?i)\b(news|breaking news|current affairs|headlines|newspaper)\b"), "news"),
    (re.compile(r"(?i)\b(happening in|what'?s happening in|going on in|latest (update|updates|news))\b"), "news"),
    (re.compile(r"(?i)\b(prime minister|president of|election(?:s)? of|government of|parliament)\b"), "politics"),
    (re.compile(r"(?i)\b(cricket match|football match|world cup|ipl|score|who won|match result|sports)\b"), "sports"),
    (re.compile(r"(?i)\b(tell me a joke|joke|funny story|meme)\b"), "entertainment"),
    (re.compile(r"(?i)\b(translate(?: this)?|in french|in spanish|in german|in hindi|in chinese)\b"), "translation"),
    (
        re.compile(
            r"(?i)\b(quantum physics|calculus|integral|derivative|homework)\b|\b(solve|calculate)\b.{0,30}\b(mathematics?|math|problem|equation|algebra)\b"  # noqa: E501
        ),
        "science",
    ),
    (re.compile(r"(?i)\b(capital of|largest country|smallest country|highest mountain|longest river)\b"), "general"),
    (
        re.compile(r"(?i)\b(recommend (a|me)|best (phone|laptop|restaurant|movie|book|car|laptop|tv))\b"),
        "recommendation",
    ),  # noqa: E501
    (
        re.compile(
            r"(?i)^\s*(write|create|build|develop|fix|debug|review|optimize|implement)\b.{0,40}\b(program|code|script|function|algorithm|api|app|application)\b"
        ),
        "coding_request",
    ),  # noqa: E501
    (
        re.compile(
            r"(?i)^\s*(teach|tutor|explain to me|help me learn)\b.{0,40}\b(python|javascript|c\+\+|java|react|aws|terraform)\b"  # noqa: E501
        ),
        "general_learning",
    ),
]

DEFINITIONAL_RE = re.compile(
    r"(?i)^(what|who|when|where|why|which|how)\s+(is|are|was|were|does|do|did|isn't|aren't)\b"
    r"|^(what is|what are|what's|define|meaning of|explain)\b"
)

TELL_ME_ABOUT_RE = re.compile(r"(?i)\btell me about\s+(.+)")

COMPARISON_RE = re.compile(r"(?i)\b(compare|which .* (better|best|most relevant|recommend)|difference between)\b")

JOB_MATCH_RE = re.compile(
    r"(?i)\b(job description|job posting|job match|matches? this|suitable for|role\b.*\b(description|posting|fit)|hire me)\b"  # noqa: E501
)

COMMON_ENGLISH = {
    "the",
    "a",
    "an",
    "and",
    "or",
    "of",
    "to",
    "in",
    "on",
    "at",
    "for",
    "with",
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
    "i",
    "you",
    "your",
    "yours",
    "yourself",
    "my",
    "mine",
    "me",
    "we",
    "us",
    "our",
    "it",
    "this",
    "that",
    "these",
    "those",
    "he",
    "she",
    "they",
    "them",
    "their",
    "his",
    "her",
    "about",
    "from",
    "by",
    "as",
    "what",
    "which",
    "who",
    "whom",
    "when",
    "where",
    "why",
    "how",
    "will",
    "would",
    "can",
    "could",
    "should",
    "shall",
    "may",
    "might",
    "must",
    "please",
    "thanks",
    "thank",
    "hello",
    "hi",
    "hey",
    "not",
    "no",
    "yes",
    "if",
    "then",
    "than",
    "so",
    "such",
    "also",
    "too",
    "just",
    "but",
    "because",
    "although",
    "though",
    "while",
    "during",
    "project",
    "projects",
    "work",
    "experience",
    "skills",
    "skill",
    "more",
    "most",
    "best",
    "good",
    "great",
    "well",
    "nice",
    "really",
    "very",
    "quite",
    "say",
    "said",
    "tell",
}


@dataclass(frozen=True)
class Classification:
    is_in_scope: bool
    intent: str
    confidence: float
    domain_word: str = ""
    definition_target: str = ""

    def to_dict(self) -> Dict[str, object]:
        return {
            "is_in_scope": self.is_in_scope,
            "intent": self.intent,
            "confidence": round(self.confidence, 3),
        }


class DomainClassifier:
    """Deterministic, application-level domain gate for the recruiter assistant.

    A query is only routed to the generation model when it is classified as
    in-scope with sufficient confidence. Everything else receives a refusal or
    a clarification prompt, and the model is never given the chance to answer
    an unrelated question (spec section 3).
    """

    def __init__(self, confidence_threshold: Optional[float] = None):
        self.threshold = (
            confidence_threshold if confidence_threshold is not None else settings.CLASSIFIER_CONFIDENCE_THRESHOLD
        )

    # ------------------------------------------------------------------
    def classify(self, text: str, vocabulary: Optional[Set[str]] = None) -> Classification:
        query = text.strip()
        vocabulary = vocabulary or set()
        if not query:
            return Classification(is_in_scope=False, intent=AMBIGUOUS, confidence=0.0)

        # 1. Prompt injection attempts are always rejected.
        for pattern in INJECTION_PATTERNS:
            if pattern.search(query):
                return Classification(is_in_scope=False, intent=OUT_OF_SCOPE, confidence=0.99)

        # 2. Questions anchored on the portfolio owner (your/my/you ... domain word).
        anchor = PROFILE_PRONOUN_RE.search(query)
        domain_hits = self._domain_hits(query)
        if anchor and domain_hits:
            intent = self._resolve_intent(query, domain_hits)
            confidence = min(0.99, 0.75 + 0.06 * len(domain_hits))
            return Classification(is_in_scope=True, intent=intent, confidence=confidence, domain_word=domain_hits[0][1])

        # 3. Domain words mentioned without an anchor but with an owner intent
        #    (e.g. "Which project is most relevant for a cybersecurity job?").
        if domain_hits and not DEFINITIONAL_RE.search(query):
            intent = self._resolve_intent(query, domain_hits)
            return Classification(is_in_scope=True, intent=intent, confidence=0.8, domain_word=domain_hits[0][1])

        # 4. Short greetings are allowed.
        if GREETING_RE.search(query) and len(query.split()) <= 8 and not domain_hits:
            return Classification(is_in_scope=True, intent=GREETING, confidence=0.95)

        # 5. Explicit out-of-scope topics (news, weather, prices, coding, ...).
        for pattern, _reason in OUT_OF_SCOPE_PATTERNS:
            if pattern.search(query):
                return Classification(is_in_scope=False, intent=OUT_OF_SCOPE, confidence=0.95)

        # 6. Definitional questions about a profile term ("What is Terraform?") or
        #    about any external concept ("What is the capital of France?").
        if DEFINITIONAL_RE.search(query):
            target = self._definition_target(query)
            if target:
                if target.lower() in vocabulary:
                    return Classification(
                        is_in_scope=False, intent=OUT_OF_SCOPE, confidence=0.7, definition_target=target
                    )
                return Classification(is_in_scope=False, intent=OUT_OF_SCOPE, confidence=0.8, definition_target=target)
            return Classification(is_in_scope=False, intent=OUT_OF_SCOPE, confidence=0.75)

        # 7. "Tell me about X" - X inside the profile vocabulary is ambiguous,
        #    otherwise it is out of scope.
        match = TELL_ME_ABOUT_RE.search(query)
        if match:
            topic = match.group(1).strip().lower()
            if self._overlaps_vocab(topic, vocabulary):
                return Classification(is_in_scope=False, intent=AMBIGUOUS, confidence=0.6, definition_target=topic)
            return Classification(is_in_scope=False, intent=OUT_OF_SCOPE, confidence=0.8, definition_target=topic)

        # 8. Question mentions profile vocabulary but the intent is unclear.
        if self._overlaps_vocab(query, vocabulary):
            return Classification(is_in_scope=False, intent=AMBIGUOUS, confidence=0.5)

        # 9. Default: never guess.
        return Classification(is_in_scope=False, intent=AMBIGUOUS, confidence=0.3)

    # ------------------------------------------------------------------
    def is_in_scope(self, classification: Classification) -> bool:
        """Apply the configured confidence threshold to a classification."""
        return classification.is_in_scope and classification.confidence >= self.threshold

    def _domain_hits(self, text: str) -> List[Tuple[int, str, str]]:
        hits: List[Tuple[int, str, str]] = []
        lowered = text.lower()
        for word, intent in DOMAIN_INTENTS.items():
            for match in re.finditer(rf"\b{re.escape(word)}\b", lowered):
                hits.append((match.start(), intent, word))
        hits.sort(key=lambda item: item[0])
        return hits

    def _resolve_intent(self, text: str, hits: List[Tuple[int, str, str]]) -> str:
        intents = {intent for _, intent, _ in hits}
        if JOB_MATCH_RE.search(text):
            return JOB_MATCHING
        if COMPARISON_RE.search(text) and PROJECT in intents:
            return PROJECT_COMPARISON
        if ARCHITECTURE in intents:
            return ARCHITECTURE
        # Otherwise the earliest mentioned domain word wins.
        return hits[0][1] if hits else GENERAL_PERSONAL

    @staticmethod
    def _is_definitional(text: str) -> bool:
        return bool(DEFINITIONAL_RE.search(text))

    @staticmethod
    def _definition_target(text: str) -> str:
        """Extract the noun phrase being defined, e.g. 'Terraform' from 'What is Terraform?'"""
        match = re.search(
            r"(?i)(?:what is|what are|what's|define|meaning of|explain)\s+(?:the\s+)?([a-z0-9][a-z0-9 &+/.-]{1,60})",
            text,
        )
        if not match:
            return ""
        return re.sub(r"[?.!]*$", "", match.group(1)).strip().rstrip("?.").strip()

    @staticmethod
    def _overlaps_vocab(term: str, vocabulary: Set[str]) -> bool:
        term = term.lower().strip().rstrip("?.,!;:")
        if not term:
            return False
        if term in vocabulary:
            return True
        term_tokens = {t for t in re.findall(r"[a-z0-9][a-z0-9_.+-]{1,40}", term)}
        for entry in vocabulary:
            entry_lower = entry.lower()
            if re.search(rf"\b{re.escape(term)}\b", entry_lower) or re.search(rf"\b{re.escape(entry_lower)}\b", term):
                return True
            entry_tokens = set(re.findall(r"[a-z0-9][a-z0-9_.+-]{1,40}", entry_lower))
            if term_tokens & entry_tokens:
                return True
        return False
