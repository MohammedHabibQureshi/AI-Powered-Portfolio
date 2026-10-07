import { getKnowledgeService } from "@/lib/ai/knowledge";

export const dynamic = "force-dynamic";

export async function POST() {
  const service = getKnowledgeService();
  const changed = service.refresh();
  return Response.json({ changed, ...service.status() });
}