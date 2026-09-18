/**
 * Where a running process instance lives.
 *
 * `beans/workflows/<id>.json`, in the repo, committed — for the same reason
 * `beans/` is committed rather than held in a session: the container is
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
import { INSTANCE_SCHEMA, type InstanceState } from "./instance.js";

/**
 * The `workflow-state` node of the bean graph — `beans/workflows/`.
 *
 * The two nodes answer the two halves of one question: `beans/defs/` says WHAT
 * is being worked on, `beans/workflows/` says WHERE IT GOT TO. They are
 * siblings under `beans/` and visible, because a dot-prefixed directory is
 * absent from a plain `ls`, from most file browsers and from GitHub's web tree
 * — which made the two artefacts a person most needs the two hardest to find.
 *
 * **This constant is the compiled-in default, not the declaration.**
 * `beans/beans.json` is where the layout is stated; `bun run check:harness-dirs`
 * fails when this and the graph disagree. It stays a constant because the store
 * is on the hot path of every workflow call and re-reading a JSON file per call
 * to learn its own directory would be worse than a checked duplicate.
 */
export const WORKFLOW_DIR = join("beans", "workflows");

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
  // `$schema` FIRST, and written on every save rather than only on create, so
  // a file from before the tag existed gains it the next time it is touched.
  // The bean graph says a directory holds `workflow-state` and leaves
  // recognising one to the file — this is the file holding up its end.
  const tagged: InstanceState = { $schema: INSTANCE_SCHEMA, ...state };
  writeFileSync(p, `${JSON.stringify(tagged, null, 2)}\n`, "utf-8");
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
