/**
 * Folio Assistant — Streaming chat route (generic).
 *
 * POST /api/chat { messages[], context?, mode? }
 * Returns SSE stream. Delegates tool definitions and execution to the adapter.
 *
 * @module folio-assistant/routes/chat
 */

import Anthropic from "@anthropic-ai/sdk";
import type { ContentAdapter } from "../types.js";
import { getUserRole, getUserName } from "../core/rbac.js";
import type { FeedbackStore } from "../core/feedback.js";
import { log, logDebug } from "../core/logging.js";

const CORS = { "Access-Control-Allow-Origin": "*" };

let anthropic: Anthropic | null = null;

function getAnthropic(): Anthropic | null {
  if (anthropic) return anthropic;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  anthropic = new Anthropic({ apiKey: key });
  return anthropic;
}

export { getAnthropic };

export async function handleChatPost(
  url: URL,
  req: Request,
  adapter: ContentAdapter,
  feedbackStore: FeedbackStore,
): Promise<Response | null> {
  if (url.pathname !== "/api/chat") return null;

  try {
    const body = (await req.json()) as {
      messages: Array<{ role: string; content: string }>;
      context?: Record<string, unknown>;
      mode?: "read" | "edit" | "status";
    };

    const client = getAnthropic();
    if (!client) {
      return Response.json(
        { error: "ANTHROPIC_API_KEY not set. Chat requires an API key." },
        { status: 503, headers: CORS },
      );
    }

    const mode = body.mode || "read";
    const userRole = getUserRole(req);
    const userName = getUserName(req);

    const chatTools = adapter.getChatTools() as Anthropic.Tool[];
    const systemPrompt = adapter.getChatSystemPrompt(mode, userRole, userName, body.context);

    const apiMessages: Anthropic.MessageParam[] = body.messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const encoder = new TextEncoder();
    const sseHeaders = {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      ...CORS,
    };

    const readable = new ReadableStream({
      async start(controller) {
        const send = (obj: Record<string, unknown>) =>
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));

        try {
          let toolRounds = 0;
          const MAX_TOOL_ROUNDS = 3;

          while (toolRounds < MAX_TOOL_ROUNDS) {
            send({ status: toolRounds === 0 ? "thinking..." : `looking up data (step ${toolRounds + 1})...` });

            const response = await client.messages.create({
              model: "claude-haiku-4-5-20251001",
              max_tokens: 1500,
              system: systemPrompt,
              tools: chatTools,
              messages: apiMessages,
            });

            const toolUses = response.content.filter((b) => b.type === "tool_use");
            if (toolUses.length === 0) {
              const textBlocks = response.content.filter((b) => b.type === "text");
              const fullText = textBlocks.map((b) => (b as any).text).join("");
              const chunkSize = 20;
              for (let i = 0; i < fullText.length; i += chunkSize) {
                send({ text: fullText.slice(i, i + chunkSize) });
              }
              send({});
              controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
              logDebug("chat", `complete (${toolRounds} tool rounds, ${fullText.length} chars)`);
              controller.close();
              return;
            }

            const toolNames = toolUses.map((t) => (t as any).name);
            logDebug("chat:tools", `round ${toolRounds + 1}: ${toolUses.length} calls`, toolNames.join(", "));
            send({ status: toolNames.join(", ") + "..." });

            apiMessages.push({ role: "assistant", content: response.content });

            const toolResults: Anthropic.ToolResultBlockParam[] = [];
            for (const tu of toolUses) {
              const toolUseBlock = tu as Anthropic.ToolUseBlock;
              const result = await adapter.executeChatTool(
                toolUseBlock.name,
                toolUseBlock.input as Record<string, unknown>,
                body.context,
              );
              toolResults.push({
                type: "tool_result",
                tool_use_id: toolUseBlock.id,
                content: result,
              });
            }
            apiMessages.push({ role: "user", content: toolResults });
            toolRounds++;
          }

          // Exhausted tool rounds — final streaming call
          send({ status: "composing response..." });
          const stream = await client.messages.stream({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 1500,
            system: systemPrompt,
            messages: apiMessages,
          });

          for await (const event of stream) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              send({ text: event.delta.text });
            }
          }
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        } catch (e) {
          log("chat", "stream error", String(e));
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: String(e) })}\n\n`));
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        }
      },
    });

    return new Response(readable, { headers: sseHeaders });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500, headers: CORS });
  }
}
