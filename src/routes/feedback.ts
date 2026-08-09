/**
 * Folio Assistant — Feedback API routes (generic).
 *
 * GET  /api/feedback?itemId=X&rootName=Y → todos for one block
 * GET  /api/feedback/all?status=open     → all todos
 * POST /api/feedback                     → create todo
 * POST /api/feedback/update              → update priority/status
 * POST /api/feedback/delete              → delete (collaborator+)
 * POST /api/feedback/triage              → AI triage
 *
 * @module folio-assistant/routes/feedback
 */

import {
  FeedbackStore, INVALID_ENUM, parseTodoPriority, parseTodoStatus,
  TODO_PRIORITIES, TODO_STATUSES,
} from "../core/feedback.js";
import type { FeedbackItem } from "../../schemas/types.js";
import type { ContentAdapter } from "../types.js";
import { getUserName, getUserEmail, hasRole, forbidden } from "../core/rbac.js";
import { log } from "../core/logging.js";

const CORS = { "Access-Control-Allow-Origin": "*" };

export function handleFeedbackGet(url: URL, feedbackStore: FeedbackStore): Response | null {
  const path = url.pathname;

  if (path === "/api/feedback/all") {
    const status = url.searchParams.get("status") || undefined;
    return Response.json(feedbackStore.listAll(status));
  }

  if (path === "/api/feedback") {
    const itemId = url.searchParams.get("itemId") || url.searchParams.get("paperId");
    const rootName = url.searchParams.get("rootName");
    if (itemId && rootName) {
      return Response.json(feedbackStore.read(itemId, rootName));
    }
    return null; // POST handled separately
  }

  return null;
}

export async function handleFeedbackPost(
  url: URL,
  req: Request,
  feedbackStore: FeedbackStore,
  adapter: ContentAdapter,
): Promise<Response | null> {
  const path = url.pathname;

  // ── Create feedback ──────────────────────────────────────────
  if (path === "/api/feedback" && req.method === "POST") {
    try {
      const body = (await req.json()) as {
        itemId?: string;
        paperId?: string;
        rootName: string;
        summary: string;
        comment: string;
        priority: string;
        assignee: string;
      };
      const itemId = body.itemId || body.paperId || "";

      const priority = parseTodoPriority(body.priority || undefined);
      if (priority === INVALID_ENUM) {
        return Response.json({
          error: `Invalid priority: must be one of ${TODO_PRIORITIES.join("|")}`,
        }, { status: 400 });
      }

      const todo: FeedbackItem = {
        id: FeedbackStore.makeId(),
        summary: body.summary,
        comment: body.comment,
        status: "open",
        priority: priority ?? "medium",
        origin: "human",
        author: getUserName(req),
        authorEmail: getUserEmail(req),
        assignee: body.assignee || "editor-agent",
        createdAt: new Date().toISOString(),
      };

      const todos = feedbackStore.read(itemId, body.rootName);
      todos.push(todo);
      feedbackStore.write(itemId, body.rootName, todos);
      log("feedback", `created: ${itemId}/${body.rootName}`, `id=${todo.id}`);

      return Response.json({ ok: true, todo });
    } catch (e) {
      return Response.json({ error: String(e) }, { status: 500 });
    }
  }

  // ── Update feedback ──────────────────────────────────────────
  if (path === "/api/feedback/update") {
    try {
      const body = (await req.json()) as {
        itemId?: string;
        paperId?: string;
        rootName: string;
        todoId: string;
        priority?: string;
        status?: string;
      };
      const itemId = body.itemId || body.paperId || "";
      // Both arrive off the wire as bare strings and were written through
      // unchecked; see `parseTodoPriority` on what that cost.
      const priority = parseTodoPriority(body.priority);
      const status = parseTodoStatus(body.status);
      if (priority === INVALID_ENUM || status === INVALID_ENUM) {
        return Response.json({
          error: `Invalid update: priority must be one of ${TODO_PRIORITIES.join("|")}, ` +
            `status one of ${TODO_STATUSES.join("|")}`,
        }, { status: 400 });
      }
      const todos = feedbackStore.read(itemId, body.rootName);
      const idx = todos.findIndex((t) => t.id === body.todoId);
      if (idx < 0) return Response.json({ error: "Todo not found" }, { status: 404 });
      if (priority !== undefined) todos[idx].priority = priority;
      if (status !== undefined) todos[idx].status = status;
      feedbackStore.write(itemId, body.rootName, todos);
      return Response.json({ ok: true, todo: todos[idx] });
    } catch (e) {
      return Response.json({ error: String(e) }, { status: 500 });
    }
  }

  // ── Delete feedback (collaborator+) ──────────────────────────
  if (path === "/api/feedback/delete") {
    if (!hasRole(req, "collaborator")) {
      return forbidden("deleting feedback", "collaborator");
    }
    try {
      const body = (await req.json()) as {
        itemId?: string;
        paperId?: string;
        rootName: string;
        todoId: string;
      };
      const itemId = body.itemId || body.paperId || "";
      const todos = feedbackStore.read(itemId, body.rootName);
      const idx = todos.findIndex((t) => t.id === body.todoId);
      if (idx < 0) return Response.json({ error: "Todo not found" }, { status: 404 });
      todos.splice(idx, 1);
      feedbackStore.write(itemId, body.rootName, todos);
      return Response.json({ ok: true });
    } catch (e) {
      return Response.json({ error: String(e) }, { status: 500 });
    }
  }

  // ── AI triage ────────────────────────────────────────────────
  if (path === "/api/feedback/triage") {
    try {
      const body = (await req.json()) as {
        itemId?: string;
        paperId?: string;
        rootName: string;
        todoId: string;
      };
      const itemId = body.itemId || body.paperId || "";
      const todos = feedbackStore.read(itemId, body.rootName);
      const todo = todos.find((t) => t.id === body.todoId);
      if (!todo) return Response.json({ error: "Todo not found" }, { status: 404 });

      const doc = await adapter.getDocument(itemId);
      const blk = doc?.blocksByName?.get(body.rootName);
      const blockContent = blk?.md || "";
      const blockKind = blk?.kind || "";

      const triage = await adapter.triageFeedback(todo, blockContent, blockKind, itemId, body.rootName);
      return Response.json(triage, { headers: CORS });
    } catch (e) {
      return Response.json({ error: String(e) }, { status: 500 });
    }
  }

  return null;
}
