#!/usr/bin/env bun
/**
 * WHERE TO READ A DECLARED GRAPH FROM — the checkout, or its mount.
 *
 * @module scripts/graph-read
 * @covers cat-harness
 *
 * ## What this is for — bean `9ofm`, row D
 *
 * Every reader of `beans/`, `todos/`, `issue-marks/` and the health results
 * joins its path onto the repository root. That is correct today and wrong
 * after the cutover, and the migration the bean asks for is one row per
 * reader. The thing each row needs is the same, so it is written once here:
 * **given a declared directory id, which directory do I actually read.**
 *
 * With this in place the cutover is a no-op for correctness. Before it, a
 * tip-keyed declaration whose files are still tracked resolves to the
 * checkout — which is where they are. After it, the same call resolves to the
 * mount. No reader changes between those two states, which is the whole point:
 * a migration that needed every reader edited again at cutover time would be
 * two migrations.
 *
 * ## It REFUSES rather than returning a plausible empty directory
 *
 * The states come from {@link tipPresence} and {@link routePresence} (row B), and
 * each maps onto exactly one read decision. The first row read *"not tip-keyed |
 * the checkout | nothing moved"* until `route` existed, and that was the whole
 * bug: a route-keyed entry is not tip-keyed, so it took the "nothing moved" arm
 * while its files had moved to a branch.
 *
 * | state | read from | why |
 * |---|---|---|
 * | not branch-keyed, or `commit`-keyed | the checkout | nothing moved |
 * | `route`-keyed, files still tracked | the checkout | pre-cutover: **here** is the store |
 * | `route`-keyed, cut over | **refused** | no route store is mounted, so there is no local path to give |
 * | `not-cut-over` | the checkout | the declaration points at a branch and the files are still tracked here, so **here** is the store |
 * | `mounted` | the marker's `into` | the cutover happened and the mount is the store |
 * | `unmounted` | **refused** | cut over, nothing mounted: the only honest answer is not a path |
 *
 * That last row is the reason this module exists rather than a one-line
 * `join`. A reader handed `repoRoot/beans` after the cutover gets an absent or
 * empty directory and reports a clean run over nothing — `dh4f`, and for the
 * work plan specifically it is an empty `beans list`, which reads as "there is
 * no work". So {@link graphReadPath} returns a REFUSAL a caller must handle,
 * and {@link mustReadGraph} throws with the remedy for the many callers whose
 * honest behaviour is to stop.
 *
 * ## Resolution, and what it does not do
 *
 * The declaration is resolved through `resolveSubgraphSource` (#1987), so both
 * the `source: { kind: "branch" }` spelling and the legacy `storage` reach the
 * same answer, and a future source kind lands in the default arm rather than
 * being guessed at. Presence is read from `git ls-files` and the mount marker,
 * never from the branch, so this is **offline**: it cannot block a reader on a
 * fetch, and it cannot be made to answer differently by one.
 *
 * It resolves the directory and nothing inside it. `beans/beans.json`'s nested
 * declaration still says where `defs` is *within* the graph, and
 * `resolveBeanDefs` still answers that — a nested declaration is invisible to
 * the mount (measured: `beans/` is not an instance root), which is precisely
 * why the two questions stay separate.
 */
import { relative, sep } from "node:path";

import { instanceRootsIn, resolveDirectories } from "../schemas/cat-harness.js";
import "../schemas/folio-graph-typology.js";
import { resolveSubgraphSource, type ResolvedSubgraphSource } from "../schemas/subgraph-source.js";
import { routePresence, tipPresence } from "./check-declared-dirs.ts";

export type GraphReadFrom = "checkout" | "mount";

export type GraphRead =
  | {
      state: "ok";
      /** The absolute directory to read. */
      at: string;
      from: GraphReadFrom;
      /** The declared directory id. */
      id: string;
      /**
       * The DECLARED repository-relative path (e.g. `beans`), with `/`
       * separators — which is not `relative(repoRoot, at)` once the graph is
       * mounted somewhere else.
       *
       * Carried because a caller holding a path FURTHER IN (`.beans.yml`'s
       * `beans/defs`) can only rebase it onto `at` if it knows which prefix of
       * it the graph accounts for. Deriving that from `at` works in the
       * checkout case and silently breaks for a mount.
       */
      path: string;
      /**
       * Set when the answer is the checkout although the declaration names a
       * branch — the pre-cutover state. Carried rather than hidden so a caller
       * that wants to report which store it read can.
       */
      notCutOver?: true;
    }
  | {
      state: "refused";
      id: string;
      reason: string;
      /**
       * The declared repository-relative path, when it is known.
       *
       * Carried on a REFUSAL because a caller holding a path of its own
       * (`.beans.yml`'s) must be able to ask "is mine even inside this
       * graph?" before inheriting the refusal. Without it, an unreachable
       * `beans` graph refuses a `.beans.yml` pointing somewhere else
       * entirely — which my own tests caught.
       *
       * Absent when the entry could not be resolved at all (a declaration
       * carrying both `source` and `storage`), because then there is no
       * trustworthy path to report.
       */
      path?: string;
    }
  | { state: "undeclared"; id: string; reason: string };

/**
 * The declared directory `id` across this checkout's instances, as the
 * presence checks see it.
 *
 * `resolveDirectories` is existence-filtered for `DEFAULT_DIRECTORIES` and for
 * MEMBERS, but **not** for an instance's own declared entries — those are
 * `byId.set` with no `existsSync` guard. That distinction is load-bearing
 * here and is asserted in the tests rather than taken on trust: a cut-over
 * directory has no files in the checkout, so if a declared entry vanished
 * from this lookup it would vanish at exactly the moment it starts to matter.
 */
function declaredEntry(
  id: string,
  repoRoot: string,
): { absPath: string; resolved: ResolvedSubgraphSource } | undefined {
  for (const inst of instanceRootsIn(repoRoot)) {
    for (const d of resolveDirectories([{ name: "(local)", root: inst, own: true }])) {
      if (d.id !== id) continue;
      return { absPath: d.absPath, resolved: resolveSubgraphSource(d) };
    }
  }
  return undefined;
}

/**
 * Which directory to read for the declared graph `id`.
 *
 * Never throws for a declaration it merely dislikes: an unknown id is
 * `undeclared` and an unreachable graph is `refused`, both carrying the
 * reason, so a caller chooses between stopping and reporting. See
 * {@link mustReadGraph} for the caller whose only honest move is to stop.
 */
export function graphReadPath(id: string, repoRoot: string): GraphRead {
  let found;
  try {
    found = declaredEntry(id, repoRoot);
  } catch (err) {
    // `resolveSubgraphSource` throws on a contradiction (both `source` and
    // `storage`; a tip-keyed `qa`). A reader must not pick one and carry on.
    return { state: "refused", id, reason: (err as Error).message };
  }
  if (!found) {
    return { state: "undeclared", id, reason: `no declared directory has id "${id}" in ${repoRoot}` };
  }
  const { absPath, resolved } = found;
  const declaredPath = relative(repoRoot, absPath).split(sep).join("/");
  if (resolved.kind === "branch" && resolved.keyedBy === "route") {
    const r = routePresence({ id, branch: resolved.branch, keyedBy: resolved.keyedBy }, absPath, repoRoot);
    // Same answer as `not-cut-over` below, and for the same reason: the files are
    // still tracked here, so HERE is the store.
    if (r.state === "not-cut-over") return { state: "ok", at: absPath, from: "checkout", id, path: declaredPath, notCutOver: true };
    return {
      state: "refused",
      id,
      path: declaredPath,
      reason:
        `${declaredPath} is kept per ROUTE on \`${resolved.branch}\` and is not tracked in this checkout, ` +
        `and a route store has no mount — \`state:mount\` only walks tip-keyed entries, so there is no local ` +
        `copy for this to resolve to. The branch is read by the route's own generator \`--check\`, which ` +
        `fetches; this resolver is offline. Returning the declared path would hand you an EMPTY directory and ` +
        `a clean run over nothing (bean \`dh4f\`), which is the one answer this module exists to refuse.`,
    };
  }
  if (resolved.kind === "family") {
    // A FAMILY (bean `lehh`) is one branch per key, and nothing here says which
    // key the caller means. The declared path would be an empty directory read
    // as a clean graph (bean `dh4f`) — the else-arm below is exactly that
    // answer, which is why this arm comes first.
    return {
      state: "refused",
      id,
      path: declaredPath,
      reason:
        `"${id}" is a FAMILY of branches (\`${resolved.branchPrefix}<key>\`, one per ${resolved.keyFrom}), ` +
        `not one branch, so there is no single graph at ${declaredPath} to read. Name the member you mean ` +
        `and read that branch.`,
    };
  }
  if (resolved.kind !== "branch" || resolved.keyedBy !== "tip") {
    return { state: "ok", at: absPath, from: "checkout", id, path: declaredPath };
  }
  const t = tipPresence({ id, branch: resolved.branch, keyedBy: resolved.keyedBy }, absPath, repoRoot);
  switch (t.state) {
    case "mounted":
      return { state: "ok", at: t.into, from: "mount", id, path: declaredPath };
    case "not-cut-over":
      // The declaration names the branch and the files are still tracked
      // here, so HERE is the store. `check:declared-dirs` reports the
      // inconsistency; a reader's job meanwhile is to read the real files.
      return { state: "ok", at: absPath, from: "checkout", id, path: declaredPath, notCutOver: true };
    case "unmounted":
      return {
        state: "refused",
        id,
        path: declaredPath,
        reason:
          `"${id}" is on ${resolved.branch} and is not mounted in ${repoRoot}, so there is no directory to read. ` +
          `Mount it (\`bun run state:mount\`). Reading ${relative(repoRoot, absPath).split(sep).join("/")} instead ` +
          `would report an EMPTY graph, and "nothing here" is not "could not reach it" — ${t.detail}`,
      };
  }
}

/**
 * {@link graphReadPath}, or a throw carrying the remedy.
 *
 * For the many readers whose honest behaviour when the graph is unreachable is
 * to stop: a crash with this message is strictly better than a clean run over
 * an empty directory, which is the failure the whole row exists to prevent.
 */
export function mustReadGraph(id: string, repoRoot: string): { at: string; from: GraphReadFrom } {
  const r = graphReadPath(id, repoRoot);
  if (r.state !== "ok") throw new Error(`cannot read graph "${id}": ${r.reason}`);
  return { at: r.at, from: r.from };
}
