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

export class FeedbackStore {
  constructor(private feedbackDir: string) {}

  private feedbackPath(itemId: string, rootName: string): string {
    return join(this.feedbackDir, itemId, `${rootName}.json`);
  }

  read(itemId: string, rootName: string): unknown[] {
    const p = this.feedbackPath(itemId, rootName);
    if (!existsSync(p)) return [];
    try {
      return JSON.parse(readFileSync(p, "utf-8"));
    } catch {
      return [];
    }
  }

  write(itemId: string, rootName: string, todos: unknown[]): void {
    const dir = join(this.feedbackDir, itemId);
    mkdirSync(dir, { recursive: true });
    writeFileSync(this.feedbackPath(itemId, rootName), JSON.stringify(todos, null, 2), "utf-8");
  }

  /** List all feedback items across all items, optionally filtered by status. */
  listAll(status?: string): Array<{ itemId: string; rootName: string; todo: any }> {
    const results: Array<{ itemId: string; rootName: string; todo: any }> = [];
    if (!existsSync(this.feedbackDir)) return results;
    for (const itemId of readdirSync(this.feedbackDir)) {
      const itemFbDir = join(this.feedbackDir, itemId);
      try {
        for (const file of readdirSync(itemFbDir)) {
          if (!file.endsWith(".json")) continue;
          const rootName = file.replace(/\.json$/, "");
          const todos = this.read(itemId, rootName);
          for (const t of todos as any[]) {
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
