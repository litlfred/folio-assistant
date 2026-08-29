/**
 * Where a running process instance lives.
 *
 * `.folio/workflow/<id>.json`, in the repo, committed — for the same reason
 * `.beans/` is committed rather than held in a session: the container is
 * ephemeral, and a work-plan only one agent can see is not a work-plan. A
 * sibling session on another branch, and a human reading the diff, both get the
 * same answer to "where did that change get to".
 *
 * One file per instance rather than a single ledger, so two agents advancing
 * two instances do not collide on the same file.
 *
 * @module folio-assistant/workflow/store
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { InstanceState } from "./instance.js";

export const WORKFLOW_DIR = join(".folio", "workflow");

const pathFor = (repoRoot: string, id: string): string =>
  join(repoRoot, WORKFLOW_DIR, `${id}.json`);

/**
 * Instance ids are derived from the subject, not random: re-running a step for
 * the same block should find the instance that already exists rather than mint
 * a second one. `beans create` is not idempotent and that cost the `qou` folio
 * 14,688 duplicate beans in one afternoon; this does not repeat the mistake.
 */
export function instanceId(processId: string, subject: string): string {
  const slug = subject
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${processId.replace(/^Process_/, "").toLowerCase()}--${slug || "unnamed"}`;
}

export function loadInstance(repoRoot: string, id: string): InstanceState | undefined {
  const p = pathFor(repoRoot, id);
  if (!existsSync(p)) return undefined;
  return JSON.parse(readFileSync(p, "utf-8")) as InstanceState;
}

export function saveInstance(repoRoot: string, state: InstanceState): string {
  const dir = join(repoRoot, WORKFLOW_DIR);
  mkdirSync(dir, { recursive: true });
  const p = pathFor(repoRoot, state.id);
  writeFileSync(p, `${JSON.stringify(state, null, 2)}\n`, "utf-8");
  return p;
}

export function listInstances(repoRoot: string): InstanceState[] {
  const dir = join(repoRoot, WORKFLOW_DIR);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(readFileSync(join(dir, f), "utf-8")) as InstanceState)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
