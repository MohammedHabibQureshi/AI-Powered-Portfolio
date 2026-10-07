import { GitHubSyncService } from "@/lib/ai/github-sync";

export const dynamic = "force-dynamic";

interface SyncRequest {
  username?: string;
}

function verifyAdminAuth(request: Request): boolean {
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) return false;

  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${adminSecret}`) return true;

  const url = new URL(request.url);
  const tokenParam = url.searchParams.get("token");
  if (tokenParam === adminSecret) return true;

  return false;
}

export async function POST(request: Request) {
  if (!verifyAdminAuth(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: SyncRequest = {};
  try {
    body = (await request.json()) as SyncRequest;
  } catch {
    body = {};
  }

  const service = new GitHubSyncService();
  const result = await service.sync(body.username);
  return Response.json(result, { status: result.success ? 200 : 502 });
}