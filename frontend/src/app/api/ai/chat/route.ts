import { AIAgentService } from "@/lib/ai/agent";
import { ChatHistoryMessage } from "@/lib/ai/constants";
import { getKnowledgeService } from "@/lib/ai/knowledge";
import { ResponseValidator } from "@/lib/ai/validator";

export const dynamic = "force-dynamic";

interface ChatRequest {
  session_id?: string;
  message: string;
  history?: ChatHistoryMessage[];
}

const encoder = new TextEncoder();

function sse(payload: unknown): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify(payload)}\n\n`);
}

export async function POST(request: Request) {
  let body: ChatRequest;
  try {
    body = (await request.json()) as ChatRequest;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.message || !body.message.trim()) {
    return Response.json({ error: "message is required." }, { status: 400 });
  }

  const agent = new AIAgentService();
  const snapshot = getKnowledgeService().snapshot();
  const validator = new ResponseValidator(snapshot.vocabulary());

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let fullResponseText = "";
      let confidenceScore = 0.95;
      let citations: Array<{ title: string; url: string }> = [];
      let responseType = "answer";
      let groundingContextCaptured = false;
      try {
        for await (const chunk of agent.chatStream(body.message, body.history ?? [])) {
          const textSegment = chunk.chunk ?? "";
          fullResponseText += textSegment;
          if (typeof chunk.confidence === "number") confidenceScore = chunk.confidence;
          if (Array.isArray(chunk.citations)) citations = chunk.citations;
          if (chunk.type && chunk.type !== "debug") responseType = chunk.type;
          // Capture grounding context from the first answer chunk to enhance
          // the validator vocabulary with legitimate source terms.
          if (chunk.groundingContext && !groundingContextCaptured) {
            validator.addGroundingTerms(chunk.groundingContext);
            groundingContextCaptured = true;
          }
          controller.enqueue(sse(chunk));
        }

        // Post-stream grounding validation (spec section 21).
        const validation = validator.validate(fullResponseText);
        if (!validation.supported && responseType === "answer") {
          confidenceScore = Math.max(0, confidenceScore - validation.confidence_penalty);
          const caveatChunk = {
            chunk: validation.caveat,
            confidence: confidenceScore,
            citations,
            intent: "answer",
            type: "answer",
          };
          fullResponseText += validation.caveat;
          controller.enqueue(sse(caveatChunk));
          console.warn(
            `Grounding validation flagged ${validation.unsupported_claims.length} unsupported claim(s):`,
            validation.unsupported_claims.slice(0, 5)
          );
        }
      } catch (err) {
        console.error("Error inside chat stream loop:", err);
        controller.enqueue(sse({ chunk: `[Stream Error: ${err instanceof Error ? err.message : String(err)}]`, confidence: 0.0, citations: [] }));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}