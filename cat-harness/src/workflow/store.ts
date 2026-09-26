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
import { isAbsolute, join, relative, resolve } from "node:path";
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
// declared-path-literal: the checked duplicate. `bun run check:harness-dirs`
// fails when this and `beans/beans.json` disagree; it stays compiled in
// because the store is on the hot path of every workflow call.
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

/**
 * `source` as it must be COMMITTED: relative to the repository root.
 *
 * An instance records the `.bpmn` it was started from, and `loadProcessModel`
 * stores whatever path its caller passed — which is absolute whenever the
 * caller resolved one. That is harmless in memory and wrong on disk:
 * `beans/workflows/` is committed **precisely so a sibling session sees the
 * same position**, and `/home/<someone>/<their-checkout>/…` resolves on one
 * container and nowhere else. Found 2026-09-21 in
 * `crdm--issue-607-kg-to-cdn-portal.json` and its two children, against a
 * sibling instance that recorded the same diagram relatively (bean `chq5`).
 *
 * **Recursive, because `children` are instances too** and carried the same
 * absolute path — a fix applied only to the top level would leave the defect
 * one field deeper, where the next reader is less likely to look.
 *
 * ## A path outside the repository is LEFT ALONE
 *
 * `relative()` would turn it into a run of `../` — a path that resolves
 * somewhere, differently on every machine, and looks deliberate. An absolute
 * path at least fails honestly and says whose checkout it came from. Nothing
 * here can make a diagram outside the repository portable; pretending
 * otherwise is the worse answer.
 */
export function relativiseSource(repoRoot: string, state: InstanceState): InstanceState {
  const root = resolve(repoRoot);
  const fix = (s: string): string => {
    if (!isAbsolute(s)) return s;
    const rel = relative(root, resolve(s));
    // Outside the repository: `relative` escapes upward, so leave it.
    return rel.startsWith("..") || isAbsolute(rel) ? s : rel;
  };
  const children = state.children
    ? Object.fromEntries(
        Object.entries(state.children).map(([k, c]) => [k, relativiseSource(repoRoot, c)]),
      )
    : undefined;
  return {
    ...state,
    source: fix(state.source),
    ...(children === undefined ? {} : { children }),
  };
}

export function saveInstance(repoRoot: string, state: InstanceState): string {
  const dir = join(repoRoot, WORKFLOW_DIR);
  mkdirSync(dir, { recursive: true });
  const p = pathFor(repoRoot, state.id);
  // `$schema` FIRST, and written on every save rather than only on create, so
  // a file from before the tag existed gains it the next time it is touched.
  // The bean graph says a directory holds `workflow-state` and leaves
  // recognising one to the file — this is the file holding up its end.
  //
  // `relativiseSource` is applied on the same principle and for the same
  // reason: normalise on WRITE, so a file carrying an absolute path is
  // repaired the next time anything touches it rather than needing a
  // migration. See its own note for why a path outside the repo is left.
  const tagged: InstanceState = { $schema: INSTANCE_SCHEMA, ...relativiseSource(repoRoot, state) };
  writeFileSync(p, `${JSON.stringify(tagged, null, 2)}\n`, "utf-8");
  return p;
}

export function listInstances(repoRoot: string): InstanceState[] {
  const dir = join(repoRoot, WORKFLOW_DIR);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(readFileSync(join(dir, f), "utf-8")) as InstanceState)
    // `?? ""`: two committed instances (the `code-change-review--*` pair)
    // carry no `updatedAt`, and one missing field must not make every
    // instance unlistable. Found by the PROV-O QA/QC report (#1180 step 5).
    .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
}
