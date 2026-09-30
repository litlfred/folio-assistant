/**
 * Where the actor registry lives: `actors/` inside a declared `scenarios`
 * directory, beside `roles.json` (owner, 2026-09-30, bean `rqao`).
 *
 * It was `.claude/skills/actors/` — a vendor-named dot-directory no
 * declaration reached, so no kind validator, audit or coverage row could
 * claim it, and an agent that was not Claude Code had no reason to look
 * there. An actor takes on the ROLES `roles.json` declares, so the two sit
 * together, and every reader asks this module rather than composing a path.
 *
 * Actors are declared once per repository, so this scans every instance in
 * the checkout for a `scenarios` directory holding `actors/` and returns the
 * first — the repository root's declaration listing is stable-ordered.
 *
 * @module schemas/actors-dir
 * @graphNode schema
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import { instanceDirectoriesForGraph, instanceRootsIn } from "./cat-harness.js";

/** The subdirectory of a `scenarios` graph that holds one JSON file per actor. */
export const ACTORS_SUBDIR = "actors";

/**
 * The actor registry's directory in the checkout at `repoRoot`, or
 * `undefined` when no declared `scenarios` directory holds one — a
 * different answer from an empty registry, and reported by callers as such.
 */
export function actorsDir(repoRoot: string): string | undefined {
  for (const root of instanceRootsIn(repoRoot)) {
    for (const dir of instanceDirectoriesForGraph(root, "scenarios")) {
      const candidate = join(dir, ACTORS_SUBDIR);
      if (existsSync(candidate)) return candidate;
    }
  }
  return undefined;
}

/** {@link actorsDir}, throwing when there is none — for callers that cannot proceed without it. */
export function requireActorsDir(repoRoot: string): string {
  const dir = actorsDir(repoRoot);
  if (dir === undefined) {
    throw new Error(
      `no declared \`scenarios\` directory under ${repoRoot} holds \`${ACTORS_SUBDIR}/\` — the actor registry cannot be found`,
    );
  }
  return dir;
}
