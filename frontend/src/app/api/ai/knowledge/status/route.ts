import { getKnowledgeService } from "@/lib/ai/knowledge";

export const dynamic = "force-dynamic";

export async function GET() {
  const status = getKnowledgeService().status();
  return Response.json(status);
}