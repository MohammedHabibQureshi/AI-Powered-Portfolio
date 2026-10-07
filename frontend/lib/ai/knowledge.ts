import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { GitHubRepository } from "./constants";

export interface SourceInfo {
  source: string;
  path: string;
  content_hash: string;
  last_updated: string;
  loaded: boolean;
  error?: string | null;
}

export interface ProjectRecord {
  title?: string;
  description?: string;
  technologies?: string[];
  skills?: string[];
  dates?: string;
  associated_with?: string;
  urls?: string[];
}

export interface EducationRecord {
  institution?: string;
  degree?: string;
  dates?: string;
  activities?: string;
  details?: string;
}

export interface CertificationRecord {
  title?: string;
  issuer?: string;
  issued?: string;
  credential_id?: string;
  skills?: string[];
  notes?: string[];
}

export interface ExperienceRecord {
  company?: string;
  position?: string;
  dates?: string;
  description?: string;
  skills?: string[];
  urls?: string[];
}

export interface PublicationRecord {
  title?: string;
  date?: string;
  description?: string;
}

export interface LinkedinProfile {
  name: string;
  headline: string;
  pronouns: string;
  location: string;
  contact: string[];
  connections: string;
  about: string;
  role: string;
  open_to: string;
  skills: string[];
  projects: ProjectRecord[];
  experience: ExperienceRecord[];
  education: EducationRecord[];
  certifications: CertificationRecord[];
  publications: PublicationRecord[];
}

export interface KnowledgeSnapshot {
  profile: LinkedinProfile;
  repositories: GitHubRepository[];
  version: string;
  updated_at: string;
  sources: Record<string, SourceInfo>;
  vocabulary(): Set<string>;
}

const SECTION_PATTERNS: Record<string, RegExp> = {
  about: /^About section:\s*$/i,
  education: /^Education\s*$/i,
  certifications: /^Licenses & certifications section:\s*$/i,
  projects: /^Projects section:\s*$/i,
  experience: /^Experience section:\s*$/i,
  publications: /^Publications section:\s*$/i,
  research: /^Research section:\s*$/i,
  honors: /^Honors & awards( section)?:\s*$/i,
  skills: /^Skills( section)?:\s*$/i,
};

const MONTHS =
  "(January|February|March|April|May|June|July|August|September|" +
  "October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)";

const DATE_RANGE_RE = new RegExp(
  `^\\s*(?:${MONTHS})\\s+\\d{4}\\s*(?:[-–—]\\s*(?:${MONTHS}\\s+\\d{4}|Present|Now))?\\s*$`,
  "i"
);

const KNOWN_CONTEXT_HINTS = [
  "show all",
  "thumbnail for",
  "other contributors",
  "view all contributors",
  "associated with",
  "credential id",
  "show credential",
  "displayed with permission",
];

const PRONOUN_RE = /^\s*(?:He\/Him|She\/Her|They\/Them|He\/They|She\/They)\s*$/i;
const CONNECTIONS_RE = /^\s*\d[\d,]*\s+connections\s*$/i;

export function sha256Text(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

export function sha256File(filePath: string): string {
  const buffer = fs.readFileSync(filePath);
  return createHash("sha256").update(buffer).digest("hex");
}

export function utcNowIso(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

function _tokenize(text: string): Set<string> {
  const words = text.toLowerCase().match(/[A-Za-z0-9][A-Za-z0-9_.+-]{2,}/g) || [];
  return new Set(words);
}

function _cleanLine(line: string): string {
  return line.replace(/^\uFEFF/, "").trim();
}

/** Everything after the first ':' (mirrors Python's `line.split(':', 1)[1]`). */
function _afterColon(line: string): string {
  const idx = line.indexOf(":");
  return idx === -1 ? "" : line.slice(idx + 1).trim();
}

function _isDegreeLine(line: string): boolean {
  if (line.toLowerCase().includes("specialization")) return false;
  return /^(Bachelor(?: of [A-Za-z ]+)?|B\.?Tech|B\.?E\.?|Intermediate|Higher Secondary|High School|Master(?:'s)?(?: of [A-Za-z ]+)?|M\.?Sc|M\.?Tech|MBA|PhD|Doctorate)\b/i.test(
    line
  );
}

function _stripLogo(line: string): string {
  const cleaned = _cleanLine(line);
  if (cleaned.toLowerCase().endsWith(" logo")) return cleaned.slice(0, -5).trim();
  return cleaned;
}

function _fileMtime(filePath: string): string {
  try {
    return new Date(fs.statSync(filePath).mtimeMs).toISOString().replace(/\.\d{3}Z$/, "Z");
  } catch {
    return "";
  }
}

function emptyProfile(): LinkedinProfile {
  return {
    name: "",
    headline: "",
    pronouns: "",
    location: "",
    contact: [],
    connections: "",
    about: "",
    role: "",
    open_to: "",
    skills: [],
    projects: [],
    experience: [],
    education: [],
    certifications: [],
    publications: [],
  };
}

export function buildVocabulary(snapshot: {
  profile: LinkedinProfile;
  repositories: GitHubRepository[];
}): Set<string> {
  const terms = new Set<string>();
  const profile = snapshot.profile;
  if (profile.name) terms.add(profile.name.toLowerCase());
  if (profile.headline) _tokenize(profile.headline).forEach((t) => terms.add(t));
  if (profile.about) _tokenize(profile.about).forEach((t) => terms.add(t));
  for (const skill of profile.skills) {
    terms.add(skill.toLowerCase());
    _tokenize(skill).forEach((t) => terms.add(t));
  }
  for (const proj of profile.projects) {
    if (proj.title) {
      terms.add(proj.title.toLowerCase());
      _tokenize(proj.title).forEach((t) => terms.add(t));
    }
    for (const tech of proj.technologies || []) {
      terms.add(String(tech).toLowerCase());
      _tokenize(String(tech)).forEach((t) => terms.add(t));
    }
  }
  for (const exp of profile.experience) {
    for (const key of ["company", "position"] as const) {
      const value = exp[key];
      if (value) {
        terms.add(value.toLowerCase());
        _tokenize(value).forEach((t) => terms.add(t));
      }
    }
  }
  for (const edu of profile.education) {
    for (const key of ["institution", "degree"] as const) {
      const value = edu[key];
      if (value) {
        terms.add(value.toLowerCase());
        _tokenize(value).forEach((t) => terms.add(t));
      }
    }
  }
  for (const cert of profile.certifications) {
    if (cert.title) {
      terms.add(cert.title.toLowerCase());
      _tokenize(cert.title).forEach((t) => terms.add(t));
    }
    if (cert.issuer) terms.add(cert.issuer.toLowerCase());
  }
  for (const repo of snapshot.repositories) {
    if (repo.name) {
      terms.add(repo.name.toLowerCase());
      _tokenize(repo.name).forEach((t) => terms.add(t));
    }
    if (repo.description) _tokenize(repo.description).forEach((t) => terms.add(t));
    for (const topic of repo.topics ?? []) terms.add(String(topic).toLowerCase());
    for (const language of repo.languages ?? []) terms.add(String(language).toLowerCase());
  }
  return terms;
}

export class LinkedinParser {
  private text: string;
  private lines: string[];

  constructor(text: string) {
    this.text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    this.lines = this.text.split("\n");
  }

  parse(): LinkedinProfile {
    const profile = emptyProfile();
    const sections = this._splitSections();
    const header = sections.header ?? this.lines;
    this._parseHeader(header, profile);
    this._parseSimpleKeys(header, profile);
    if (sections.about) {
      profile.about = sections.about.filter((l) => _cleanLine(l)).map(_cleanLine).join("\n");
      if (!profile.open_to) profile.open_to = LinkedinParser._detectOpenTo(profile.about);
    }
    if (sections.education) profile.education = this._parseEducation(sections.education);
    if (sections.certifications) profile.certifications = this._parseCertifications(sections.certifications);
    if (sections.projects) profile.projects = this._parseProjects(sections.projects);
    if (sections.experience) profile.experience = this._parseExperience(sections.experience);
    if (sections.publications) profile.publications = this._parsePublications(sections.publications);
    if (sections.skills) profile.skills = this._parseSkills(sections.skills, profile);
    return profile;
  }

  private static _detectOpenTo(text: string): string {
    for (const sentence of text.split(/(?<=[.!?])\s+/)) {
      const low = sentence.toLowerCase();
      if (low.includes("open to") || low.includes("seeking")) return sentence.trim();
    }
    return "";
  }

  private _splitSections(): Record<string, string[]> {
    const sectionLine: Record<number, string> = {};
    const ordered: string[] = [];
    this.lines.forEach((line, idx) => {
      const cleaned = _cleanLine(line);
      if (!cleaned) return;
      for (const [name, pattern] of Object.entries(SECTION_PATTERNS)) {
        if (pattern.test(cleaned)) {
          sectionLine[idx] = name;
          ordered.push(name);
          break;
        }
      }
    });

    if (Object.keys(sectionLine).length === 0) return { header: this.lines };

    const bounds = Object.keys(sectionLine)
      .map(Number)
      .sort((a, b) => a - b);
    const sections: Record<string, string[]> = {};
    for (let i = 0; i < bounds.length; i++) {
      const start = bounds[i];
      const end = i + 1 < bounds.length ? bounds[i + 1] : this.lines.length;
      sections[sectionLine[start]] = this.lines.slice(start + 1, end);
    }
    const headerEnd = bounds[0];
    sections.header = this.lines.slice(0, headerEnd);
    return sections;
  }

  private _parseHeader(header: string[], profile: LinkedinProfile): void {
    const remaining = header.map(_cleanLine).filter(Boolean);
    if (remaining.length === 0) return;
    profile.name = remaining[0];
    const rest = remaining.slice(1);
    if (rest.length > 0 && PRONOUN_RE.test(rest[0])) {
      profile.pronouns = rest.shift() as string;
    }
    if (rest.length > 0) profile.headline = rest.shift() as string;
    for (const line of rest) {
      const lower = line.toLowerCase();
      if (CONNECTIONS_RE.test(line)) profile.connections = line;
      else if (line.includes(",") && line.length < 80) profile.location = line;
      else if (lower === "contact info") continue;
      else if (lower.startsWith("http") || line.includes("@")) profile.contact.push(line);
      else if (lower.includes("open to") || lower.includes("seeking")) profile.open_to = line;
    }
  }

  private _parseSimpleKeys(header: string[], profile: LinkedinProfile): void {
    for (const line of header) {
      const cleaned = _cleanLine(line);
      const match = /^([A-Za-z][A-Za-z0-9 ]{1,40}):\s*(.*)$/.exec(cleaned);
      if (!match) continue;
      const key = match[1].trim().toLowerCase();
      const value = match[2].trim();
      if (!value) continue;
      if (key === "role" || key === "title" || key === "headline" || key === "position") {
        profile.role = value;
        if (!profile.headline) profile.headline = value;
      } else if (key === "name") {
        profile.name = value;
      } else if (key === "location" || key === "city" || key === "based in") {
        profile.location = value;
      } else if (key === "about" || key === "summary") {
        profile.about = value;
      } else if (key === "open to" || key === "availability") {
        profile.open_to = value;
      } else if (key === "email" || key === "phone" || key === "website" || key === "linkedin" || key === "github") {
        profile.contact.push(value);
      }
    }
  }

  private _parseEducation(lines: string[]): EducationRecord[] {
    const entries: EducationRecord[] = [];
    let current: EducationRecord = {};
    let previousNonEmpty = "";
    const nonEmpty = lines.map(_cleanLine).filter(Boolean);
    const total = nonEmpty.length;

    const finalize = () => {
      if (current.institution || current.degree) entries.push(current);
      current = {};
    };

    nonEmpty.forEach((line, i) => {
      const low = line.toLowerCase();
      const nextLine = i + 1 < total ? nonEmpty[i + 1] : "";
      if (low.endsWith("logo") || low.includes(" logo")) {
        return;
      } else if (DATE_RANGE_RE.test(line)) {
        current.dates = line;
      } else if (low.startsWith("activities and societies:")) {
        current.activities = _afterColon(line);
      } else if (_isDegreeLine(line)) {
        finalize();
        current = { institution: _stripLogo(previousNonEmpty), degree: line };
      } else if (_isDegreeLine(nextLine)) {
        finalize();
        current = {};
      } else if (current.degree) {
        const details = current.details ? current.details.split(" ") : [];
        details.push(line);
        current.details = details.join(" ");
      } else {
        current.institution = line;
      }
      previousNonEmpty = line;
    });

    finalize();
    return entries;
  }

  private _parseCertifications(lines: string[]): CertificationRecord[] {
    const entries: CertificationRecord[] = [];
    let current: CertificationRecord = {};
    let skipNext = false;
    let pendingNewEntry = false;

    const finalize = () => {
      if (current.title || current.issuer) entries.push(current);
      current = {};
    };

    for (const raw of lines) {
      const line = _cleanLine(raw);
      if (!line) continue;
      const low = line.toLowerCase();

      if (skipNext) {
        skipNext = false;
        pendingNewEntry = true;
        continue;
      }
      if (low.startsWith("thumbnail for")) {
        skipNext = true;
        continue;
      }
      if (low === "show credential") continue;
      if (low.endsWith("logo") || low.includes(" logo")) {
        finalize();
        pendingNewEntry = false;
        continue;
      }
      if (pendingNewEntry) {
        pendingNewEntry = false;
        finalize();
        current.title = line;
        continue;
      }
      if (low.startsWith("issued")) {
        current.issued = line;
      } else if (low.startsWith("skills:")) {
        current.skills = _afterColon(line).split(",").map((s) => s.trim());
      } else if (low.startsWith("credential")) {
        current.credential_id = line;
      } else if (current.title === undefined) {
        current.title = line;
      } else if (current.issuer === undefined) {
        current.issuer = line;
      } else {
        current.notes = current.notes || [];
        current.notes.push(line);
      }
    }
    finalize();
    return entries;
  }

  private _parseProjects(lines: string[]): ProjectRecord[] {
    const entries: ProjectRecord[] = [];
    let current: ProjectRecord = {};
    let description: string[] = [];
    const nonEmpty = lines.map(_cleanLine).filter(Boolean);
    const total = nonEmpty.length;

    const finish = () => {
      if (!current.title) return;
      current.description = description.join("\n").trim();
      entries.push(current);
      current = {};
      description = [];
    };

    for (let i = 0; i < total; i++) {
      const line = nonEmpty[i];
      const low = line.toLowerCase();
      if (low.startsWith("tech:")) {
        current.technologies = _afterColon(line).split("·").map((t) => t.trim());
      } else if (low.startsWith("skills:")) {
        current.skills = _afterColon(line).split(",").map((s) => s.trim());
      } else if (low.startsWith("associated with")) {
        current.associated_with = line.includes(":")
          ? _afterColon(line)
          : line.replace("Associated with", "").trim();
      } else if (low.includes("thumbnail") || low.includes("media") || low.includes("contributor")) {
        continue;
      } else if (low.startsWith("http")) {
        current.urls = current.urls || [];
        current.urls.push(line);
      } else if (DATE_RANGE_RE.test(line)) {
        current.dates = line;
      } else if (i + 1 < total && current.title && DATE_RANGE_RE.test(nonEmpty[i + 1])) {
        finish();
        current.title = line;
      } else {
        if (current.title) description.push(line);
        else current.title = line;
      }
    }
    finish();
    return entries;
  }

  private _parseExperience(lines: string[]): ExperienceRecord[] {
    const entries: ExperienceRecord[] = [];
    for (const block of this._splitBlocks(lines)) {
      const entry: ExperienceRecord = {};
      const description: string[] = [];
      for (const raw of block) {
        const line = _cleanLine(raw);
        if (!line) continue;
        const low = line.toLowerCase();
        if (DATE_RANGE_RE.test(line)) entry.dates = line;
        else if (low.startsWith("skills:")) entry.skills = _afterColon(line).split(",").map((s) => s.trim());
        else if (low.startsWith("http")) {
          entry.urls = entry.urls || [];
          entry.urls.push(line);
        } else if (entry.company === undefined) entry.company = line;
        else if (entry.position === undefined) entry.position = line;
        else description.push(line);
      }
      if (entry.company || entry.position) {
        entry.description = description.join("\n").trim();
        entries.push(entry);
      }
    }
    return entries;
  }

  private _parsePublications(lines: string[]): PublicationRecord[] {
    const entries: PublicationRecord[] = [];
    for (const block of this._splitBlocks(lines)) {
      const entry: PublicationRecord = {};
      for (const raw of block) {
        const line = _cleanLine(raw);
        if (!line) continue;
        if (DATE_RANGE_RE.test(line)) entry.date = line;
        else if (entry.title === undefined) entry.title = line;
        else entry.description = `${entry.description || ""}\n${line}`.trim();
      }
      if (entry.title) entries.push(entry);
    }
    return entries;
  }

  private _parseSkills(lines: string[], profile: LinkedinProfile): string[] {
    const knownContext = new Set<string>();
    for (const proj of profile.projects) if (proj.title) knownContext.add(proj.title.toLowerCase());
    for (const cert of profile.certifications) if (cert.title) knownContext.add(cert.title.toLowerCase());
    for (const edu of profile.education) if (edu.institution) knownContext.add(edu.institution.toLowerCase());

    const skills: string[] = [];
    const seen = new Set<string>();
    for (const raw of lines) {
      const line = _cleanLine(raw);
      if (!line) continue;
      const low = line.toLowerCase();
      if (KNOWN_CONTEXT_HINTS.some((hint) => low.startsWith(hint))) continue;
      if (low.includes("show all ") || low.includes(" details")) continue;
      if (knownContext.has(low)) continue;
      if (seen.has(low)) continue;
      seen.add(low);
      skills.push(line);
    }
    return skills;
  }

  private _splitBlocks(lines: string[]): string[][] {
    const blocks: string[][] = [];
    let current: string[] = [];
    for (const line of lines) {
      if (_cleanLine(line)) current.push(line);
      else if (current.length) {
        blocks.push(current);
        current = [];
      }
    }
    if (current.length) blocks.push(current);
    return blocks;
  }
}

export function resolveDataDir(): string {
  const envDir = process.env.KNOWLEDGE_DATA_DIR;
  if (envDir) return path.resolve(envDir);

  const candidates = [
    path.join(process.cwd(), "..", "data"),
    path.join(process.cwd(), "data"),
    path.join(process.cwd(), "..", "..", "data"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, "linkedin.txt"))) return candidate;
  }
  return candidates[0];
}

export class KnowledgeService {
  private dataDir: string;
  private snapshotValue: KnowledgeSnapshot | null = null;
  private version: string | null = null;
  private hashes: Record<string, string> = {};

  constructor(dataDir?: string) {
    this.dataDir = dataDir ? path.resolve(dataDir) : resolveDataDir();
    this.refresh();
  }

  get data_directory(): string {
    return this.dataDir;
  }

  refresh(): boolean {
    const linkedinPath = path.join(this.dataDir, "linkedin.txt");
    const githubPath = path.join(this.dataDir, "github.json");

    let changed = false;
    const linkedinSource = this._loadTextSource(linkedinPath, "linkedin");
    const githubSource = this._loadJsonSource(githubPath, "github");

    const profile = linkedinSource !== null ? new LinkedinParser(linkedinSource).parse() : emptyProfile();
    const repositories = githubSource !== null ? githubSource : [];

    const rawSources: Record<string, unknown> = { linkedin: linkedinSource, github: githubSource };
    const sources: Record<string, SourceInfo> = {};

    for (const [source, info] of Object.entries(rawSources)) {
      const filename = source === "linkedin" ? "linkedin.txt" : "github.json";
      const filePath = path.resolve(this.dataDir, filename);
      if (info === null || info === undefined) {
        sources[source] = {
          source,
          path: filePath,
          content_hash: "",
          last_updated: "",
          loaded: false,
          error: "source file not found",
        };
      } else {
        const rawText = typeof info === "string" ? info : JSON.stringify(info);
        const hashValue = sha256Text(rawText);
        sources[source] = {
          source,
          path: filePath,
          content_hash: hashValue,
          last_updated: _fileMtime(filePath),
          loaded: true,
        };
        if (this.hashes[source] !== hashValue) {
          changed = true;
          this.hashes[source] = hashValue;
        }
      }
    }

    const newVersion = this._buildVersion(sources);
    if (newVersion !== this.version) {
      changed = true;
      this.version = newVersion;
    }

    const snapshotProfile = profile;
    this.snapshotValue = {
      profile: snapshotProfile,
      repositories,
      version: newVersion,
      updated_at: utcNowIso(),
      sources,
      vocabulary() {
        return buildVocabulary({ profile: snapshotProfile, repositories });
      },
    };

    if (process.env.KNOWLEDGE_DEBUG === "1") {
      console.log("[Knowledge] refresh");
      console.log(`[Knowledge] LinkedIn TXT loaded: ${linkedinSource !== null} (${linkedinSource?.length ?? 0} chars)`);
      console.log(`[Knowledge] GitHub loaded: ${githubSource !== null} (${repositories.length} repos)`);
      console.log(
        `[Knowledge] Profile — projects: ${profile.projects.length}, skills: ${profile.skills.length}, ` +
          `certifications: ${profile.certifications.length}, education: ${profile.education.length}, ` +
          `experience: ${profile.experience.length}, publications: ${profile.publications.length}`
      );
      for (const [name, info] of Object.entries(sources)) {
        console.log(
          `[Knowledge] Source ${name}: loaded=${info.loaded} hash=${info.content_hash.slice(0, 12)} ` +
            `updated=${info.last_updated}${info.error ? ` error=${info.error}` : ""}`
        );
      }
      console.log(`[Knowledge] Changed: ${changed} | Version: ${newVersion}`);
    }
    return changed;
  }

  private _buildVersion(sources: Record<string, SourceInfo>): string {
    const hashParts = Object.values(sources)
      .map((info) => info.content_hash)
      .filter(Boolean)
      .sort();
    if (hashParts.length === 0) return utcNowIso();
    return hashParts.join("|");
  }

  private _loadTextSource(filePath: string, source: string): string | null {
    try {
      if (!fs.existsSync(filePath)) return null;
      return fs.readFileSync(filePath, "utf8");
    } catch (err) {
      console.error(`[knowledge] failed to read ${source} source:`, err);
      return null;
    }
  }

  private _loadJsonSource(filePath: string, source: string): GitHubRepository[] | null {
    try {
      if (!fs.existsSync(filePath)) return null;
      const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
      const list = Array.isArray(data) ? data : data?.repositories ?? [];
      return list.filter((item: unknown) => item !== null && typeof item === "object") as GitHubRepository[];
    } catch (err) {
      console.error(`[knowledge] failed to parse ${source} source:`, err);
      return null;
    }
  }

  /** Detects a change via content hashing and refreshes only when needed. */
  refreshIfChanged(): boolean {
    return this.refresh();
  }

  snapshot(): KnowledgeSnapshot {
    if (this.snapshotValue === null) this.refresh();
    return this.snapshotValue as KnowledgeSnapshot;
  }

  status(): Record<string, unknown> {
    const snap = this.snapshot();
    return {
      knowledge_version: snap.version,
      updated_at: snap.updated_at,
      sources: Object.fromEntries(
        Object.entries(snap.sources).map(([name, info]) => [
          name,
          {
            source: info.source,
            loaded: info.loaded,
            last_updated: info.last_updated,
            content_hash: info.content_hash,
            path: info.path,
            error: info.error ?? null,
          },
        ])
      ),
      github_repositories: snap.repositories.length,
      data_dir: this.dataDir,
    };
  }
}

let _knowledgeService: KnowledgeService | null = null;

export function getKnowledgeService(): KnowledgeService {
  if (_knowledgeService === null) {
    _knowledgeService = new KnowledgeService();
  }
  return _knowledgeService;
}

export function resetKnowledgeService(): void {
  _knowledgeService = null;
}