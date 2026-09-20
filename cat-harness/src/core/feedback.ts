/**
 * Folio Assistant — Feedback storage (gitignored, global with hash-based IDs).
 *
 * Feedback is stored in a configurable directory, keyed by item/block.
 * This is content-agnostic — works for any content type.
 *
 * @module folio-assistant/core/feedback
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from "fs";
import { join } from "path";
import type { FeedbackItem, TodoPriority, TodoStatus } from "../../schemas/types.js";
import { TodoItemSchema } from "../../schemas/constraints.js";

/** Sentinel: the client sent a value the target enum does not accept. */
export const INVALID_ENUM = Symbol("invalid-enum");

function parseEnum<T extends string>(
  schema: { safeParse: (v: unknown) => { success: true; data: T } | { success: false } },
  value: string | undefined,
): T | undefined | typeof INVALID_ENUM {
  if (value === undefined) return undefined;
  const parsed = schema.safeParse(value);
  return parsed.success ? parsed.data : INVALID_ENUM;
}

/**
 * Narrow a wire string to a `TodoPriority` / `TodoStatus`.
 *
 * `undefined` in → `undefined` out ("field absent, leave it alone"); an
 * unrecognised string → `INVALID_ENUM`, for the caller to turn into a 400.
 *
 * The `/api/feedback/{create,update}` handlers used to assign these straight
 * onto a stored item, which typechecked only because the array was `any[]`.
 * `{"status":"banana"}` was persisted verbatim and then matched no filter in
 * the codebase, so the item silently disappeared from every view of it.
 */
export const parseTodoPriority = (v: string | undefined) => parseEnum<TodoPriority>(TodoItemSchema.shape.priority, v);
export const parseTodoStatus = (v: string | undefined) => parseEnum<TodoStatus>(TodoItemSchema.shape.status, v);

/** The accepted values, for error messages. */
export const TODO_PRIORITIES = TodoItemSchema.shape.priority.options;
export const TODO_STATUSES = TodoItemSchema.shape.status.options;

export class FeedbackStore {
  constructor(private feedbackDir: string) {}

  private feedbackPath(itemId: string, rootName: string): string {
    return join(this.feedbackDir, itemId, `${rootName}.json`);
  }

  /**
   * Read one feedback file's items.
   *
   * The file is written only by `write`, so `FeedbackItem` is the contract.
   * Entries are returned as-is rather than filtered against it: every caller
   * is read-modify-write over the whole file, so dropping a malformed entry
   * here would delete it on the next unrelated edit.
   */
  read(itemId: string, rootName: string): FeedbackItem[] {
    const p = this.feedbackPath(itemId, rootName);
    if (!existsSync(p)) return [];
    try {
      return JSON.parse(readFileSync(p, "utf-8")) as FeedbackItem[];
    } catch {
      return [];
    }
  }

  write(itemId: string, rootName: string, todos: FeedbackItem[]): void {
    const dir = join(this.feedbackDir, itemId);
    mkdirSync(dir, { recursive: true });
    writeFileSync(this.feedbackPath(itemId, rootName), JSON.stringify(todos, null, 2), "utf-8");
  }

  /** List all feedback items across all items, optionally filtered by status. */
  listAll(status?: string): Array<{ itemId: string; rootName: string; todo: FeedbackItem }> {
    const results: Array<{ itemId: string; rootName: string; todo: FeedbackItem }> = [];
    if (!existsSync(this.feedbackDir)) return results;
    for (const itemId of readdirSync(this.feedbackDir)) {
      const itemFbDir = join(this.feedbackDir, itemId);
      try {
        for (const file of readdirSync(itemFbDir)) {
          if (!file.endsWith(".json")) continue;
          const rootName = file.replace(/\.json$/, "");
          const todos = this.read(itemId, rootName);
          for (const t of todos) {
            if (!status || t.status === status) {
              results.push({ itemId, rootName, todo: t });
            }
          }
        }
      } catch {}
    }
    return results;
  }

  /** Generate a unique feedback item ID. */
  static makeId(): string {
    const ts = Date.now().toString(36);
    const hash = Math.random().toString(36).slice(2, 6);
    return `todo-${ts}-${hash}`;
  }
}
