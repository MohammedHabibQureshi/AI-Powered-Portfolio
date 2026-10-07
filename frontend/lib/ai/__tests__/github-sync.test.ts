import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GitHubSyncService, getSyncMetadata, isSyncInProgress } from "../github-sync";

let tempDirs: string[] = [];

function makeDataDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sync-test-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
  tempDirs = [];
});

describe("GitHubSyncService - Concurrency Protection", () => {
  it("prevents concurrent sync operations", async () => {
    const dir = makeDataDir();
    const service = new GitHubSyncService(dir);

    const mockRepos = [
      {
        name: "test-repo",
        full_name: "user/test-repo",
        description: "Test",
        html_url: "https://github.com/user/test-repo",
        language: "TypeScript",
        topics: [],
        stargazers_count: 0,
        forks_count: 0,
        updated_at: "2026-01-01T00:00:00Z",
      },
    ];

    vi.spyOn(service, "fetchUserRepos").mockResolvedValue(mockRepos);
    vi.spyOn(service, "fetchRepoReadme").mockResolvedValue("# Test");
    vi.spyOn(service, "fetchRepoLanguages").mockResolvedValue(["TypeScript"]);

    const promise1 = service.sync();
    const result2 = await service.sync();

    expect(result2.success).toBe(false);
    expect(result2.message).toContain("already in progress");

    await promise1;
  });

  it("allows sync after previous sync completes", async () => {
    const dir = makeDataDir();
    const service = new GitHubSyncService(dir);

    vi.spyOn(service, "fetchUserRepos").mockResolvedValue([]);
    vi.spyOn(service, "fetchRepoReadme").mockResolvedValue(null);
    vi.spyOn(service, "fetchRepoLanguages").mockResolvedValue([]);

    await service.sync();
    expect(isSyncInProgress()).toBe(false);

    const result2 = await service.sync();
    expect(result2).toBeDefined();
  });
});

describe("GitHubSyncService - Metadata Tracking", () => {
  it("tracks sync metadata", async () => {
    const dir = makeDataDir();
    const service = new GitHubSyncService(dir);

    const mockRepos = [
      {
        name: "test-repo",
        full_name: "user/test-repo",
        description: "Test",
        html_url: "https://github.com/user/test-repo",
        language: "TypeScript",
        topics: [],
        stargazers_count: 0,
        forks_count: 0,
        updated_at: "2026-01-01T00:00:00Z",
      },
    ];

    vi.spyOn(service, "fetchUserRepos").mockResolvedValue(mockRepos);
    vi.spyOn(service, "fetchRepoReadme").mockResolvedValue("# Test");
    vi.spyOn(service, "fetchRepoLanguages").mockResolvedValue(["TypeScript"]);

    await service.sync();

    const metadata = getSyncMetadata();
    expect(metadata).toBeDefined();
    expect(metadata?.last_sync_status).toBe("success");
    expect(metadata?.github_repos_count).toBe(1);
    expect(metadata?.github_updated).toBe(true);
    expect(metadata?.last_github_sync).toBeTruthy();
  });

  it("tracks failed sync metadata", async () => {
    const dir = makeDataDir();
    const service = new GitHubSyncService(dir);

    vi.spyOn(service, "fetchUserRepos").mockRejectedValue(new Error("API Error"));

    await service.sync();

    const metadata = getSyncMetadata();
    expect(metadata).toBeDefined();
    expect(metadata?.last_sync_status).toBe("failed");
    expect(metadata?.errors.length).toBeGreaterThan(0);
  });
});

describe("GitHubSyncService - Knowledge Refresh", () => {
  it("refreshes knowledge after successful sync", async () => {
    const dir = makeDataDir();
    const service = new GitHubSyncService(dir);

    const mockRepos = [
      {
        name: "new-project",
        full_name: "user/new-project",
        description: "A new project",
        html_url: "https://github.com/user/new-project",
        language: "Python",
        topics: ["python", "web"],
        stargazers_count: 5,
        forks_count: 1,
        updated_at: "2026-09-01T00:00:00Z",
      },
    ];

    vi.spyOn(service, "fetchUserRepos").mockResolvedValue(mockRepos);
    vi.spyOn(service, "fetchRepoReadme").mockResolvedValue("# New Project");
    vi.spyOn(service, "fetchRepoLanguages").mockResolvedValue(["Python"]);

    const result = await service.sync();

    expect(result.success).toBe(true);
    expect(result.count).toBe(1);

    const githubPath = path.join(dir, "github.json");
    expect(fs.existsSync(githubPath)).toBe(true);

    const githubData = JSON.parse(fs.readFileSync(githubPath, "utf8"));
    expect(githubData.length).toBe(1);
    expect(githubData[0].name).toBe("new-project");
  });
});

describe("GitHubSyncService - Error Handling", () => {
  it("handles empty repos gracefully", async () => {
    const dir = makeDataDir();
    const service = new GitHubSyncService(dir);

    vi.spyOn(service, "fetchUserRepos").mockResolvedValue([]);

    const result = await service.sync();

    expect(result.success).toBe(false);
    expect(result.message).toContain("No repositories fetched");
  });

  it("handles API errors gracefully", async () => {
    const dir = makeDataDir();
    const service = new GitHubSyncService(dir);

    vi.spyOn(service, "fetchUserRepos").mockRejectedValue(new Error("Network error"));

    const result = await service.sync();

    expect(result.success).toBe(false);
    expect(result.message).toContain("Sync failed");
  });
});
