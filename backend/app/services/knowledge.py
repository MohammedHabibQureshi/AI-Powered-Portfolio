import asyncio
import hashlib
import json
import logging
import re
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Set

from app.core.config import settings

logger = logging.getLogger("app.services.knowledge")

SECTION_MARKERS = [
    "about",
    "experience",
    "education",
    "certifications",
    "projects",
    "publications",
    "research",
    "honors",
    "skills",
    "contact",
]

SECTION_PATTERNS: Dict[str, str] = {
    "about": r"^About section:\s*$",
    "education": r"^Education\s*$",
    "certifications": r"^Licenses & certifications section:\s*$",
    "projects": r"^Projects section:\s*$",
    "experience": r"^Experience section:\s*$",
    "publications": r"^Publications section:\s*$",
    "research": r"^Research section:\s*$",
    "honors": r"^Honors & awards( section)?:\s*$",
    "skills": r"^Skills( section)?:\s*$",
}

MONTHS = (
    r"(January|February|March|April|May|June|July|August|September|"
    r"October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)"
)
DATE_RANGE_RE = re.compile(
    rf"^\s*(?:{MONTHS})\s+\d{{4}}\s*(?:[-–—]\s*(?:{MONTHS}\s+\d{{4}}|Present|Now))?\s*$",
    re.IGNORECASE,
)

KNOWN_CONTEXT_HINTS = (
    "show all",
    "thumbnail for",
    "other contributors",
    "view all contributors",
    "associated with",
    "credential id",
    "show credential",
    "displayed with permission",
)

PRONOUN_RE = re.compile(r"^\s*(?:He/Him|She/Her|They/Them|He/They|She/They)\s*$", re.IGNORECASE)
CONNECTIONS_RE = re.compile(r"^\s*\d[\d,]*\s+connections\s*$", re.IGNORECASE)


@dataclass
class SourceInfo:
    """Immutable metadata describing a loaded knowledge source."""

    source: str
    path: str
    content_hash: str
    last_updated: str
    loaded: bool
    error: Optional[str] = None


@dataclass
class LinkedinProfile:
    """Normalized representation of the LinkedIn text source."""

    name: str = ""
    headline: str = ""
    pronouns: str = ""
    location: str = ""
    contact: List[str] = field(default_factory=list)
    connections: str = ""
    about: str = ""
    role: str = ""
    open_to: str = ""
    skills: List[str] = field(default_factory=list)
    projects: List[Dict[str, Any]] = field(default_factory=list)
    experience: List[Dict[str, Any]] = field(default_factory=list)
    education: List[Dict[str, Any]] = field(default_factory=list)
    certifications: List[Dict[str, Any]] = field(default_factory=list)
    publications: List[Dict[str, Any]] = field(default_factory=list)


@dataclass
class KnowledgeSnapshot:
    """A versioned, fully normalized view of the personal knowledge base."""

    profile: LinkedinProfile
    repositories: List[Dict[str, Any]]
    version: str
    updated_at: str
    sources: Dict[str, SourceInfo] = field(default_factory=dict)

    def vocabulary(self) -> Set[str]:
        """Bag of normalized terms known to the personal knowledge base."""
        terms: Set[str] = set()
        profile = self.profile
        if profile.name:
            terms.add(profile.name.lower())
        if profile.headline:
            terms.update(_tokenize(profile.headline))
        if profile.about:
            terms.update(_tokenize(profile.about))
        for skill in profile.skills:
            terms.add(skill.lower())
            terms.update(_tokenize(skill))
        for proj in profile.projects:
            title = proj.get("title") or ""
            if title:
                terms.add(title.lower())
                terms.update(_tokenize(title))
            for tech in proj.get("technologies") or []:
                terms.add(str(tech).lower())
                terms.update(_tokenize(str(tech)))
        for exp in profile.experience:
            for key in ("company", "position"):
                value = exp.get(key) or ""
                if value:
                    terms.add(value.lower())
                    terms.update(_tokenize(value))
        for edu in profile.education:
            for key in ("institution", "degree", "major"):
                value = edu.get(key) or ""
                if value:
                    terms.add(value.lower())
                    terms.update(_tokenize(value))
        for cert in profile.certifications:
            title = cert.get("title") or ""
            issuer = cert.get("issuer") or ""
            if title:
                terms.add(title.lower())
                terms.update(_tokenize(title))
            if issuer:
                terms.add(issuer.lower())
        for repo in self.repositories:
            name = repo.get("name") or ""
            if name:
                terms.add(name.lower())
            desc = repo.get("description") or ""
            if desc:
                terms.update(_tokenize(desc))
        return terms


def _tokenize(text: str) -> Set[str]:
    """Split text into lowercased alphanumeric token sets (3+ chars)."""
    words = re.findall(r"[A-Za-z0-9][A-Za-z0-9_.+-]{2,}", text.lower())
    return set(words)


def _clean_line(line: str) -> str:
    return line.strip().strip("\ufeff").strip()


def _is_degree_line(line: str) -> bool:
    """True when the line is a degree credential (not a field-of-study detail)."""
    if "specialization" in line.lower():
        return False
    return bool(
        re.match(
            r"(?i)^(Bachelor(?: of [A-Za-z ]+)?|B\.?Tech|B\.?E\.?|Intermediate|"
            r"Higher Secondary|High School|Master(?:'s)?(?: of [A-Za-z ]+)?|"
            r"M\.?Sc|M\.?Tech|MBA|PhD|Doctorate)\b",
            line,
        )
    )


def _strip_logo(line: str) -> str:
    """Remove a trailing 'logo' marker from an institution line."""
    cleaned = _clean_line(line)
    if cleaned.lower().endswith(" logo"):
        return cleaned[:-5].strip()
    return cleaned


def sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def sha256_file(path: Path) -> str:
    hasher = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(65536), b""):
            hasher.update(chunk)
    return hasher.hexdigest()


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


class LinkedinParser:
    """Parses a LinkedIn text export into a normalized LinkedinProfile."""

    def __init__(self, text: str):
        self.text = text.replace("\r\n", "\n").replace("\r", "\n")
        self.lines = self.text.split("\n")

    def parse(self) -> LinkedinProfile:
        profile = LinkedinProfile()
        sections = self._split_sections()
        header = sections.get("header", self.lines)
        self._parse_header(header, profile)
        self._parse_simple_keys(header, profile)
        if "about" in sections:
            profile.about = "\n".join(_clean_line(line) for line in sections["about"] if _clean_line(line))
            if not profile.open_to:
                profile.open_to = self._detect_open_to(profile.about)
        if "education" in sections:
            profile.education = self._parse_education(sections["education"])
        if "certifications" in sections:
            profile.certifications = self._parse_certifications(sections["certifications"])
        if "projects" in sections:
            profile.projects = self._parse_projects(sections["projects"])
        if "experience" in sections:
            profile.experience = self._parse_experience(sections["experience"])
        if "publications" in sections:
            profile.publications = self._parse_publications(sections["publications"])
        if "skills" in sections:
            profile.skills = self._parse_skills(sections["skills"], profile)
        return profile

    @staticmethod
    def _detect_open_to(text: str) -> str:
        """Extract an 'open to' statement from the About text when present."""
        for sentence in re.split(r"(?<=[.!?])\s+", text):
            low = sentence.lower()
            if "open to" in low or "seeking" in low:
                return sentence.strip()
        return ""

    def _split_sections(self) -> Dict[str, List[str]]:
        """Locate section markers and partition lines into section buckets."""
        section_line: Dict[int, str] = {}
        ordered: List[str] = []
        for idx, line in enumerate(self.lines):
            cleaned = _clean_line(line)
            if not cleaned:
                continue
            for name, pattern in SECTION_PATTERNS.items():
                if re.match(pattern, cleaned):
                    section_line[idx] = name
                    ordered.append(name)
                    break

        if not section_line:
            return {"header": self.lines}

        bounds = sorted(section_line.keys())
        sections: Dict[str, List[str]] = {}
        for i, start in enumerate(bounds):
            end = bounds[i + 1] if i + 1 < len(bounds) else len(self.lines)
            sections[section_line[start]] = self.lines[start + 1 : end]

        header_end = bounds[0]
        sections["header"] = self.lines[:header_end]
        return sections

    def _parse_header(self, header: List[str], profile: LinkedinProfile) -> None:
        remaining = [_clean_line(line) for line in header if _clean_line(line)]
        if not remaining:
            return
        profile.name = remaining[0]
        rest = remaining[1:]
        if rest and PRONOUN_RE.match(rest[0]):
            profile.pronouns = rest.pop(0)
        if rest:
            profile.headline = rest.pop(0)
        for line in rest:
            if CONNECTIONS_RE.match(line):
                profile.connections = line
            elif "," in line and len(line) < 80:
                profile.location = line
            elif line.lower() in ("contact info",):
                continue
            elif line.lower().startswith("http") or "@" in line:
                profile.contact.append(line)
            elif "open to" in line.lower() or "seeking" in line.lower():
                profile.open_to = line

    def _parse_simple_keys(self, header: List[str], profile: LinkedinProfile) -> None:
        """Handle simple 'Key: value' headers used by lightweight dumps."""
        for line in header:
            cleaned = _clean_line(line)
            match = re.match(r"^([A-Za-z][A-Za-z0-9 ]{1,40}):\s*(.*)$", cleaned)
            if not match:
                continue
            key, value = match.group(1).strip().lower(), match.group(2).strip()
            if not value:
                continue
            if key in ("role", "title", "headline", "position"):
                profile.role = value
                if not profile.headline:
                    profile.headline = value
            elif key in ("name",):
                profile.name = value
            elif key in ("location", "city", "based in"):
                profile.location = value
            elif key in ("about", "summary"):
                profile.about = value
            elif key in ("open to", "availability"):
                profile.open_to = value
            elif key in ("email", "phone", "website", "linkedin", "github"):
                profile.contact.append(value)

    def _parse_education(self, lines: List[str]) -> List[Dict[str, Any]]:
        """Education entries are anchored on degree lines (Bachelor/Intermediate/...).

        A new entry starts when a degree line is found: the institution is the
        most recent non-empty line appearing directly before the degree.
        """
        entries: List[Dict[str, Any]] = []
        current: Dict[str, Any] = {}
        previous_non_empty = ""
        non_empty = [_clean_line(line) for line in lines if _clean_line(line)]
        total = len(non_empty)

        def finalize() -> None:
            nonlocal current
            if current.get("institution") or current.get("degree"):
                entries.append(current)
            current = {}

        for i, line in enumerate(non_empty):
            low = line.lower()
            next_line = non_empty[i + 1] if i + 1 < total else ""
            if low.endswith("logo") or " logo" in low:
                # Skip branding lines such as 'KL University logo'.
                pass
            elif DATE_RANGE_RE.match(line):
                current["dates"] = line
            elif low.startswith("activities and societies:"):
                current["activities"] = line.split(":", 1)[1].strip()
            elif _is_degree_line(line):
                finalize()
                current = {"institution": _strip_logo(previous_non_empty), "degree": line}
            elif _is_degree_line(next_line):
                # A standalone institution line whose degree follows it.
                finalize()
                current = {}
            elif current.get("degree"):
                current.setdefault("details", []).append(line)
            else:
                current["institution"] = line
            previous_non_empty = line

        finalize()
        for entry in entries:
            details = entry.get("details")
            entry["details"] = " ".join(details) if isinstance(details, list) else (details or "")
        return entries

    def _parse_certifications(self, lines: List[str]) -> List[Dict[str, Any]]:
        """Certification entries follow the LinkedIn dump layout:

        [<issuer> logo] Title / Issuer / Issued <date> / Credential / Skills ...
        Each certification is followed by a 'Thumbnail for <label>' line whose
        <label> duplicates the certification title and must be skipped without
        opening a new entry.
        """
        entries: List[Dict[str, Any]] = []
        current: Dict[str, Any] = {}
        skip_next = False
        pending_new_entry = False

        def finalize() -> None:
            nonlocal current
            if current.get("title") or current.get("issuer"):
                entries.append(current)
            current = {}

        for raw in lines:
            line = _clean_line(raw)
            if not line:
                continue
            low = line.lower()

            if skip_next:
                # Thumbnail label line: belongs to the previous certification.
                skip_next = False
                pending_new_entry = True
                continue
            if low.startswith("thumbnail for"):
                skip_next = True
                continue
            if low in ("show credential",):
                continue
            if low.endswith("logo") or " logo" in low:
                finalize()
                pending_new_entry = False
                continue
            if pending_new_entry:
                # First real line after a thumbnail label: a new certification.
                pending_new_entry = False
                finalize()
                current["title"] = line
                continue
            if low.startswith("issued"):
                current["issued"] = line
            elif low.startswith("skills:"):
                current["skills"] = [s.strip() for s in line.split(":", 1)[1].split(",")]
            elif low.startswith("credential"):
                current["credential_id"] = line
            elif current.get("title") is None:
                current["title"] = line
            elif current.get("issuer") is None:
                current["issuer"] = line
            else:
                current.setdefault("notes", []).append(line)

        finalize()
        return entries

    def _parse_projects(self, lines: List[str]) -> List[Dict[str, Any]]:
        """Project entries start with a title line whose next non-empty line is a
        date range. Description, Tech/Skills lines and URLs are collected until
        the next project title is detected.
        """
        entries: List[Dict[str, Any]] = []
        current: Dict[str, Any] = {}
        description: List[str] = []
        i = 0
        non_empty = [_clean_line(line) for line in lines if _clean_line(line)]
        total = len(non_empty)

        def finish() -> None:
            nonlocal current, description
            if not current:
                return
            current["description"] = "\n".join(description).strip()
            entries.append(current)
            current = {}
            description = []

        while i < total:
            line = non_empty[i]
            low = line.lower()
            if low.startswith("tech:"):
                current["technologies"] = [t.strip() for t in line.split(":", 1)[1].split("·")]
            elif low.startswith("skills:"):
                current["skills"] = [s.strip() for s in line.split(":", 1)[1].split(",")]
            elif low.startswith("associated with"):
                current["associated_with"] = (
                    line.split(":", 1)[1].strip() if ":" in line else line.replace("Associated with", "", 1).strip()
                )
            elif "thumbnail" in low or "media" in low or "contributor" in low:
                pass
            elif low.startswith("http"):
                current.setdefault("urls", []).append(line)
            elif DATE_RANGE_RE.match(line):
                current["dates"] = line
            elif i + 1 < total and current and DATE_RANGE_RE.match(non_empty[i + 1]):
                # A title followed by a date range starts a new project.
                finish()
                current["title"] = line
            else:
                if current.get("title"):
                    description.append(line)
                else:
                    current["title"] = line
            i += 1

        finish()
        return entries

    def _parse_experience(self, lines: List[str]) -> List[Dict[str, Any]]:
        entries: List[Dict[str, Any]] = []
        blocks = self._split_blocks(lines)
        for block in blocks:
            entry: Dict[str, Any] = {}
            description: List[str] = []
            for raw in block:
                line = _clean_line(raw)
                if not line:
                    continue
                low = line.lower()
                if DATE_RANGE_RE.match(line):
                    entry["dates"] = line
                elif low.startswith("skills:"):
                    entry["skills"] = [s.strip() for s in line.split(":", 1)[1].split(",")]
                elif low.startswith("http"):
                    entry.setdefault("urls", []).append(line)
                elif "company" not in entry:
                    entry["company"] = line
                elif "position" not in entry:
                    entry["position"] = line
                else:
                    description.append(line)
            if entry.get("company") or entry.get("position"):
                entry["description"] = "\n".join(description).strip()
                entries.append(entry)
        return entries

    def _parse_publications(self, lines: List[str]) -> List[Dict[str, Any]]:
        entries: List[Dict[str, Any]] = []
        blocks = self._split_blocks(lines)
        for block in blocks:
            entry: Dict[str, Any] = {}
            for raw in block:
                line = _clean_line(raw)
                if not line:
                    continue
                if DATE_RANGE_RE.match(line):
                    entry["date"] = line
                elif "title" not in entry:
                    entry["title"] = line
                else:
                    entry.setdefault("description", "").append(line)
            if entry.get("title"):
                entries.append(entry)
        return entries

    def _parse_skills(self, lines: List[str], profile: LinkedinProfile) -> List[str]:
        """Extract skills from the LinkedIn 'Skills section' dump format.

        The section interleaves skill names with the credential/project context
        they are associated with. Context lines are excluded using the set of
        known project titles, certification titles, education institutions and
        generic hints (e.g. 'Show all N details').
        """
        known_context: Set[str] = set()
        for proj in profile.projects:
            if proj.get("title"):
                known_context.add(proj["title"].lower())
        for cert in profile.certifications:
            if cert.get("title"):
                known_context.add(cert["title"].lower())
        for edu in profile.education:
            if edu.get("institution"):
                known_context.add(edu["institution"].lower())

        skills: List[str] = []
        seen: Set[str] = set()
        for raw in lines:
            line = _clean_line(raw)
            if not line:
                continue
            low = line.lower()
            if low.startswith(KNOWN_CONTEXT_HINTS) or "show all " in low or " details" in low:
                continue
            if low in known_context:
                continue
            if low in seen:
                continue
            seen.add(low)
            skills.append(line)
        return skills

    def _split_blocks(self, lines: List[str]) -> List[List[str]]:
        blocks: List[List[str]] = []
        current: List[str] = []
        for line in lines:
            if _clean_line(line):
                current.append(line)
            elif current:
                blocks.append(current)
                current = []
        if current:
            blocks.append(current)
        return blocks


class KnowledgeService:
    """Manages the personal knowledge base from the canonical data/ directory.

    Responsibilities:
      - Load and normalize sources (linkedin.txt, github.json, optional DB enrichments)
      - Track content hashes, timestamps and a global knowledge version
      - Refresh (detect change via hash, invalidate cache, rebuild snapshot)
      - Expose a versioned snapshot and vocabulary to the AI layer
    """

    def __init__(self, data_dir: Optional[Path] = None):
        self.data_dir = data_dir or self._default_data_dir()
        self._snapshot: Optional[KnowledgeSnapshot] = None
        self._version: Optional[str] = None
        self._hashes: Dict[str, str] = {}
        self.refresh()

    @staticmethod
    def _default_data_dir() -> Path:
        if settings.KNOWLEDGE_DATA_DIR:
            return Path(settings.KNOWLEDGE_DATA_DIR).resolve()
        # knowledge.py -> services -> app -> backend -> <repo root>/data
        return Path(__file__).resolve().parents[3] / "data"

    def refresh(self) -> bool:
        """Reload any changed source and rebuild the snapshot.

        Returns True when the knowledge representation actually changed.
        """
        linkedin_path = self.data_dir / "linkedin.txt"
        github_path = self.data_dir / "github.json"

        changed = False
        linkedin_source = self._load_text_source(linkedin_path, "linkedin")
        github_source = self._load_json_source(github_path, "github")

        # Build normalized profile from whichever sources provided data.
        profile = LinkedinProfile()
        if linkedin_source is not None:
            profile = LinkedinParser(linkedin_source).parse()
        repositories = github_source if github_source is not None else []

        # Compute the new version/hashes and detect changes.
        raw_sources: Dict[str, Any] = {"linkedin": linkedin_source, "github": github_source}
        sources: Dict[str, SourceInfo] = {}
        for source, info in raw_sources.items():
            filename = self._filename_for(source)
            path = (self.data_dir / filename).resolve()
            if info is None:
                sources[source] = SourceInfo(
                    source=source,
                    path=str(path),
                    content_hash="",
                    last_updated="",
                    loaded=False,
                    error="source file not found",
                )
            else:
                raw_text = info if isinstance(info, str) else json.dumps(info, ensure_ascii=False, sort_keys=True)
                hash_value = sha256_text(raw_text)
                sources[source] = SourceInfo(
                    source=source,
                    path=str(path),
                    content_hash=hash_value,
                    last_updated=self._file_mtime(path),
                    loaded=True,
                )
                if self._hashes.get(source) != hash_value:
                    changed = True
                    self._hashes[source] = hash_value

        new_version = self._build_version(sources)
        if new_version != self._version:
            changed = True
            self._version = new_version

        self._snapshot = KnowledgeSnapshot(
            profile=profile,
            repositories=repositories,
            version=new_version,
            updated_at=utc_now_iso(),
            sources=sources,
        )
        return changed

    @staticmethod
    def _filename_for(source: str) -> str:
        return {"linkedin": "linkedin.txt", "github": "github.json"}.get(source, source)

    @staticmethod
    def _file_mtime(path: Path) -> str:
        try:
            return datetime.fromtimestamp(path.stat().st_mtime, tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        except OSError:
            return ""

    def _load_text_source(self, path: Path, source: str) -> Optional[str]:
        try:
            if not path.exists():
                logger.warning("Knowledge source missing: %s (%s)", source, path)
                return None
            return path.read_text(encoding="utf-8")
        except Exception as exc:  # pragma: no cover - defensive
            logger.error("Failed to read knowledge source %s: %s", source, exc)
            return None

    def _load_json_source(self, path: Path, source: str) -> Optional[List[Dict[str, Any]]]:
        try:
            if not path.exists():
                logger.warning("Knowledge source missing: %s (%s)", source, path)
                return None
            data = json.loads(path.read_text(encoding="utf-8"))
            if isinstance(data, dict):
                data = data.get("repositories", [])
            return [item for item in data if isinstance(item, dict)]
        except Exception as exc:
            logger.error("Failed to parse knowledge source %s: %s", source, exc)
            return None

    @staticmethod
    def _build_version(sources: Dict[str, SourceInfo]) -> str:
        hash_parts = sorted(info.content_hash for info in sources.values() if info.content_hash)
        return utc_now_iso() if not hash_parts else "|".join(hash_parts)

    def snapshot(self) -> KnowledgeSnapshot:
        if self._snapshot is None:
            self.refresh()
        return self._snapshot  # type: ignore[return-value]

    def status(self) -> Dict[str, Any]:
        snap = self.snapshot()
        return {
            "knowledge_version": snap.version,
            "updated_at": snap.updated_at,
            "sources": {
                name: {
                    "source": info.source,
                    "loaded": info.loaded,
                    "last_updated": info.last_updated,
                    "content_hash": info.content_hash,
                    "path": info.path,
                    "error": info.error,
                }
                for name, info in snap.sources.items()
            },
            "github_repositories": len(snap.repositories),
        }


# Module-level singleton used across the application.
_knowledge_service: Optional[KnowledgeService] = None


def get_knowledge_service() -> KnowledgeService:
    global _knowledge_service
    if _knowledge_service is None:
        _knowledge_service = KnowledgeService()
    return _knowledge_service


class KnowledgeWatcher:
    """Development-mode background task that polls knowledge sources and
    refreshes the in-memory knowledge base whenever content changes.

    Vercel/production filesystems are immutable, so no watcher runs there; the
    deployed knowledge comes from the latest git-committed data/ directory.
    """

    def __init__(self, service: Optional[KnowledgeService] = None, interval: float = 5.0):
        self.service = service or get_knowledge_service()
        self.interval = interval
        self._task: Optional[asyncio.Task] = None

    async def start(self) -> None:
        if self._task is None or self._task.done():
            self._task = asyncio.create_task(self._run(), name="knowledge-watcher")
            logger.info("Knowledge watcher started (interval=%ss)", self.interval)

    async def stop(self) -> None:
        if self._task is not None and not self._task.done():
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        self._task = None
        logger.info("Knowledge watcher stopped")

    async def _run(self) -> None:
        while True:
            try:
                self.service.refresh()
            except asyncio.CancelledError:
                raise
            except Exception:
                logger.exception("Knowledge watcher refresh failed")
            await asyncio.sleep(self.interval)
