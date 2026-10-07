import { GitHubSyncService, getSyncMetadata } from "@/lib/ai/github-sync";
import { getKnowledgeService } from "@/lib/ai/knowledge";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function verifyCronAuth(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;

  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${cronSecret}`) return true;

  const url = new URL(request.url);
  const tokenParam = url.searchParams.get("token");
  if (tokenParam === cronSecret) return true;

  return false;
}

export async function GET(request: Request) {
  if (!verifyCronAuth(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("[CRON] Scheduled sync triggered");

  const githubService = new GitHubSyncService();
  const githubResult = await githubService.sync();

  const knowledgeService = getKnowledgeService();
  const knowledgeStatus = knowledgeService.status();

  const syncMetadata = getSyncMetadata();

  return Response.json({
    github: githubResult,
    knowledge: {
      version: knowledgeStatus.knowledge_version,
      updated_at: knowledgeStatus.updated_at,
      sources: knowledgeStatus.sources,
      github_repositories: knowledgeStatus.github_repositories,
    },
    metadata: syncMetadata,
  });
}

export async function POST(request: Request) {
  return GET(request);
}
