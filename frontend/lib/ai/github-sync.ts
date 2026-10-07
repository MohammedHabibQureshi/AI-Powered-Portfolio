import fs from "node:fs";
import path from "node:path";
import { GitHubRepository } from "./constants";
import { getKnowledgeService, resolveDataDir, utcNowIso } from "./knowledge";

const GITHUB_API = "https://api.github.com";
const DEFAULT_USERNAME = "MohammedHabibQureshi";

export interface SyncMetadata {
  last_sync_start: string;
  last_sync_end: string;
  last_sync_status: "success" | "partial" | "failed";
  last_github_sync: string;
  last_linkedin_check: string;
  github_repos_count: number;
  github_updated: boolean;
  linkedin_updated: boolean;
  errors: string[];
}

let _syncInProgress = false;
let _syncMetadata: SyncMetadata | null = null;

export function getSyncMetadata(): SyncMetadata | null {
  return _syncMetadata;
}

export function isSyncInProgress(): boolean {
  return _syncInProgress;
}

export class GitHubSyncService {
  private headers: Record<string, string>;
  private dataDir: string;

  constructor(dataDir?: string) {
    this.dataDir = dataDir ? path.resolve(dataDir) : resolveDataDir();
    this.headers = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "portfolio-builder",
    };
    if (process.env.GITHUB_ACCESS_TOKEN) {
      this.headers.Authorization = `token ${process.env.GITHUB_ACCESS_TOKEN}`;
    }
  }

  async fetchUserRepos(username: string): Promise<unknown[]> {
    const url = `${GITHUB_API}/users/${username}/repos`;
    try {
      const response = await fetch(`${url}?per_page=100&sort=updated`, { headers: this.headers });
      if (!response.ok) {
        console.error(`GitHub fetch failed with code ${response.status}`);
        return [];
      }
      return (await response.json()) as unknown[];
    } catch (err) {
      console.error(`Failed to fetch GitHub repositories for '${username}':`, err);
      return [];
    }
  }

  async fetchRepoReadme(owner: string, repo: string): Promise<string | null> {
    const url = `${GITHUB_API}/repos/${owner}/${repo}/readme`;
    try {
      const response = await fetch(url, {
        headers: { ...this.headers, Accept: "application/vnd.github.raw+json" },
      });
      if (response.ok) return await response.text();
      return null;
    } catch (err) {
      console.error(`Failed to fetch README for '${owner}/${repo}':`, err);
      return null;
    }
  }

  async fetchRepoLanguages(owner: string, repo: string): Promise<string[]> {
    const url = `${GITHUB_API}/repos/${owner}/${repo}/languages`;
    try {
      const response = await fetch(url, { headers: this.headers });
      if (response.ok) {
        const json = (await response.json()) as Record<string, number>;
        return Object.keys(json);
      }
      return [];
    } catch (err) {
      console.error(`Failed to fetch languages for '${owner}/${repo}':`, err);
      return [];
    }
  }

  async sync(username?: string): Promise<{ success: boolean; count: number; persisted: boolean; message: string }> {
    if (_syncInProgress) {
      return { success: false, count: 0, persisted: false, message: "Sync already in progress." };
    }

    _syncInProgress = true;
    const syncStart = utcNowIso();
    const errors: string[] = [];

    _syncMetadata = {
      ...(_syncMetadata ?? {
        last_sync_start: "",
        last_sync_end: "",
        last_sync_status: "failed",
        last_github_sync: "",
        last_linkedin_check: "",
        github_repos_count: 0,
        github_updated: false,
        linkedin_updated: false,
        errors: [],
      }),
      last_sync_start: syncStart,
      errors: [],
    };

    try {
      const target = username || process.env.GITHUB_USERNAME || DEFAULT_USERNAME;
      console.log(`[SYNC] START - GitHub sync for '${target}'`);

      const repos = await this.fetchUserRepos(target);
      if (repos.length === 0) {
        const msg = `No repositories fetched for '${target}'.`;
        console.error(`[SYNC] FAILED - ${msg}`);
        _syncMetadata.last_sync_status = "failed";
        _syncMetadata.last_sync_end = utcNowIso();
        _syncMetadata.errors.push(msg);
        return { success: false, count: 0, persisted: false, message: msg };
      }

      console.log(`[SYNC] SOURCE CHECK - Found ${repos.length} repositories`);

      const records: GitHubRepository[] = [];
      for (const raw of repos) {
        const repo = raw as Record<string, unknown> & {
          name?: string;
          full_name?: string;
          description?: string | null;
          language?: string | null;
          topics?: string[];
          html_url?: string | null;
          homepage?: string | null;
          license?: { spdx_id?: string | null } | null;
          stargazers_count?: number;
          forks_count?: number;
          updated_at?: string | null;
        };
        if (!repo.name) continue;
        const readme = await this.fetchRepoReadme(target, repo.name);
        const languages = await this.fetchRepoLanguages(target, repo.name);
        records.push({
          name: repo.name,
          full_name: repo.full_name,
          description: repo.description ?? null,
          readme,
          language: repo.language ?? null,
          languages,
          topics: repo.topics ?? [],
          url: repo.html_url ?? null,
          homepage: repo.homepage ?? null,
          license: repo.license?.spdx_id ?? null,
          stars: repo.stargazers_count ?? 0,
          forks: repo.forks_count ?? 0,
          last_updated: repo.updated_at ?? null,
        });
      }

      if (records.length === 0) {
        const msg = "No repository records could be normalized.";
        console.error(`[SYNC] FAILED - ${msg}`);
        _syncMetadata.last_sync_status = "failed";
        _syncMetadata.last_sync_end = utcNowIso();
        _syncMetadata.errors.push(msg);
        return { success: false, count: 0, persisted: false, message: msg };
      }

      const persisted = this._writeGithubJson(records);
      console.log(`[SYNC] GITHUB UPDATED - ${records.length} repositories`);

      getKnowledgeService().refresh();
      console.log(`[SYNC] KNOWLEDGE REFRESH`);

      _syncMetadata.github_updated = true;
      _syncMetadata.github_repos_count = records.length;
      _syncMetadata.last_github_sync = utcNowIso();
      _syncMetadata.last_sync_status = persisted ? "success" : "partial";
      _syncMetadata.last_sync_end = utcNowIso();

      console.log(`[SYNC] COMPLETE - ${records.length} repositories synced`);

      return {
        success: true,
        count: records.length,
        persisted,
        message: persisted
          ? `Synchronized ${records.length} repositories and refreshed knowledge.`
          : `Fetched ${records.length} repositories. Persisting to disk is not available in this environment; commit data/github.json via git.`,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[SYNC] FAILED - ${msg}`);
      errors.push(msg);
      _syncMetadata.last_sync_status = "failed";
      _syncMetadata.last_sync_end = utcNowIso();
      _syncMetadata.errors = errors;
      return { success: false, count: 0, persisted: false, message: `Sync failed: ${msg}` };
    } finally {
      _syncInProgress = false;
    }
  }

  private _writeGithubJson(records: GitHubRepository[]): boolean {
    const pathToWrite = path.join(this.dataDir, "github.json");
    try {
      if (!fs.existsSync(this.dataDir)) fs.mkdirSync(this.dataDir, { recursive: true });
      fs.writeFileSync(pathToWrite, JSON.stringify(records, null, 2), "utf8");
      console.info(`Persisted ${records.length} repositories to ${pathToWrite}`);
      return true;
    } catch (err) {
      // Immutable filesystems (e.g. Vercel serverless) cannot write; the
      // committed data/github.json remains the source of truth in production.
      console.warn(`Could not persist github.json to ${pathToWrite}:`, err);
      return false;
    }
  }
}