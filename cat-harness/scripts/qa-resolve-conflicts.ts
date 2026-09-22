#!/usr/bin/env bun
/**
 * Resolve merge conflicts in generated QA sidecars by REGENERATING them.
 *
 * @module scripts/qa-resolve-conflicts
 * @graphNode none — a maintenance command over the `qa` graph
 *
 * ## Why this exists
 *
 * Bean `520m`, and the owner's ruling of 2026-09-21 (a script rather than a git
 * merge driver). Measured across one working session on PR #773 and its
 * successor: **four base merges, four conflicts, every one in a committed
 * generated QA sidecar and none in authored code.**
 *
 * The bean's first explanation was that the conflicts carried no information —
 * a timestamp both sides restamped. That was tested and is **wrong**:
 *
 * ```sh
 * bun run translation:block-qa && git status --porcelain   # empty
 * bun run kg:audit              && git status --porcelain   # empty
 * ```
 *
 * Both generators are idempotent, because `sameScriptVerdict` in `qa-utils.ts`
 * keeps a reproduced entry verbatim and ignores `reviewed_at`, `reviewed_sha`
 * and `script_commit_sha` when deciding that. So both sides really had changed
 * the inputs. The verdict being unchanged does not make the conflict empty — it
 * makes it **trivially resolvable**, and idempotence is exactly the property
 * that makes regeneration a safe resolution rather than a guess.
 *
 * ## The thing that would make it unsafe, counted rather than feared
 *
 * Across all 630 committed sidecars: **5,883 `script` entries and 13 `agent`
 * ones** (11 `block-qa/v1`, 2 `translation-qa/v1`). Regenerating blindly is
 * right for 5,883 and would silently destroy 13 — two of them in the family
 * that churns most.
 *
 * A non-script entry is self-identifying, so the guard is a predicate and not a
 * judgement call. It is applied TWICE on purpose:
 *
 * 1. **Before** — refuse any file where either side carries one, leaving it
 *    conflicted for a person.
 * 2. **After** — verify that every non-script entry present in either side is
 *    still present in the regenerated file. A fast path that is the only
 *    protection is a fast path that becomes the protection the day its
 *    assumption breaks.
 *
 * ## Two constraints found by resolving a real conflict rather than imagining one
 *
 * - **A conflicted file is not valid JSON.** The working tree holds conflict
 *   markers, so the guard reads git's stages 2 and 3 (`git show :2:<path>`),
 *   never the file on disk. Reading the working tree would throw on every
 *   single input and, in a less careful draft, be caught and treated as
 *   "no agent entries found" — the false-clean this repository keeps paying for.
 * - **Not every family has a `reviewer` at all.** `kg-qa/v1` records
 *   `criteria[id].result` with no reviewer anywhere; it is wholly derived by
 *   `kg-audit`. The guard walks for `reviewer.kind` and therefore passes those
 *   files, which is correct — but "found none" and "the shape has none" are
 *   different facts, and `--explain` prints which one it saw.
 *
 * ## What it will not do
 *
 * It resolves conflicts ONLY under the declared `qa` graph, and leaves every
 * other conflicted path untouched and unstaged — a conflict in authored code is
 * not this command's business, and silently staging one would be the habit the
 * bean warns about, mechanised.
 *
 * It also never picks a generator by guessing. The command to re-run is read
 * from `package.json`, matched against the `reviewer.id` recorded in the
 * sidecars themselves; a family whose generator cannot be identified is
 * REPORTED and its file left conflicted, because "could not determine" is never
 * rendered as a clean run.
 *
 * Usage:
 *   bun run qa:resolve-conflicts             # resolve what is safe, report the rest
 *   bun run qa:resolve-conflicts --dry-run   # say what it would do, change nothing
 *   bun run qa:resolve-conflicts --explain   # ...and why, per file
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

import { directoryForGraph, repoRootFor } from "../schemas/cat-harness.ts";

const ROOT = join(import.meta.dir, "..");
const dryRun = process.argv.includes("--dry-run");
const explain = process.argv.includes("--explain");

function git(repoRoot: string, args: string[]): string {
  return execFileSync("git", args, { cwd: repoRoot, encoding: "utf-8", maxBuffer: 64 * 1024 * 1024 });
}

/** Paths git reports as unmerged, repo-relative. */
export function unmergedPaths(repoRoot: string): string[] {
  const out = git(repoRoot, ["diff", "--name-only", "--diff-filter=U"]);
  return out.split("\n").map((s) => s.trim()).filter((s) => s.length > 0);
}

/** How a file's two sides look to the guard. */
export interface SideScan {
  /** Every `reviewer.kind` seen, across both sides. */
  kinds: string[];
  /** Identities of the non-script entries, for the after-check. */
  nonScript: string[];
  /** Distinct `reviewer.id` values — which generator wrote this. */
  reviewerIds: string[];
  /** A side that would not parse. Never treated as "nothing found". */
  unreadable: string[];
}

/**
 * Walk a parsed sidecar for reviewer entries.
 *
 * An entry's identity is its criterion path plus the reviewer id, which is
 * enough to tell whether the SAME agent verdict survived a regeneration — the
 * only question the after-check asks.
 */
export function scanDocument(doc: unknown, into: SideScan, path: string[] = []): void {
  if (Array.isArray(doc)) {
    doc.forEach((v, i) => scanDocument(v, into, [...path, String(i)]));
    return;
  }
  if (doc === null || typeof doc !== "object") return;
  const rec = doc as Record<string, unknown>;
  const reviewer = rec["reviewer"];
  if (reviewer !== null && typeof reviewer === "object") {
    const r = reviewer as Record<string, unknown>;
    const kind = typeof r["kind"] === "string" ? (r["kind"] as string) : undefined;
    const id = typeof r["id"] === "string" ? (r["id"] as string) : undefined;
    if (kind !== undefined) {
      into.kinds.push(kind);
      if (kind !== "script") into.nonScript.push(`${path.join(".")}|${kind}|${id ?? "?"}`);
    }
    if (id !== undefined && !into.reviewerIds.includes(id)) into.reviewerIds.push(id);
  }
  for (const [k, v] of Object.entries(rec)) scanDocument(v, into, [...path, k]);
}

/**
 * Scan both sides of a conflicted path.
 *
 * Reads git's STAGES, never the working tree — a conflicted file carries
 * markers and does not parse. A stage that will not parse is recorded as
 * `unreadable` and makes the file ineligible; it is never silently an
 * empty scan.
 */
export function scanConflict(repoRoot: string, path: string): SideScan {
  const into: SideScan = { kinds: [], nonScript: [], reviewerIds: [], unreadable: [] };
  for (const stage of ["2", "3"]) {
    let raw: string;
    try {
      raw = git(repoRoot, ["show", `:${stage}:${path}`]);
    } catch {
      // A stage may legitimately be absent (added on one side only). That is
      // not unreadable — there is simply nothing there to protect.
      continue;
    }
    try {
      scanDocument(JSON.parse(raw), into);
    } catch {
      into.unreadable.push(stage === "2" ? "ours" : "theirs");
    }
  }
  return into;
}

/**
 * The npm script that re-runs a given reviewer module.
 *
 * Derived from `package.json` rather than hardcoded: the mapping already exists
 * there, and a second copy is a second answer the moment either moves. A
 * `:check` script is excluded — it verifies and never writes.
 */
export function generatorFor(scripts: Record<string, string>, reviewerId: string): string | undefined {
  const hits = Object.entries(scripts)
    .filter(([name, cmd]) => !name.endsWith(":check") && !cmd.includes("--check") && cmd.includes(reviewerId))
    .map(([name]) => name)
    .sort((a, b) => a.length - b.length);
  return hits[0];
}

export interface Outcome {
  path: string;
  action: "resolve" | "refuse" | "skip";
  reason: string;
}

/** Decide, per conflicted path, without touching anything. */
export function plan(repoRoot: string, qaDir: string, paths: readonly string[]): Outcome[] {
  return paths.map((path) => {
    if (!path.startsWith(qaDir)) {
      return { path, action: "skip" as const, reason: `outside the declared \`qa\` graph (${qaDir})` };
    }
    const scan = scanConflict(repoRoot, path);
    if (scan.unreadable.length > 0) {
      return {
        path,
        action: "refuse" as const,
        reason: `the ${scan.unreadable.join(" and ")} side is not valid JSON — a side this command cannot read is a side it cannot promise to preserve`,
      };
    }
    if (scan.nonScript.length > 0) {
      return {
        path,
        action: "refuse" as const,
        reason: `carries ${scan.nonScript.length} non-script verdict(s) (${[...new Set(scan.nonScript.map((s) => s.split("|")[1]))].join(", ")}) — regenerating would destroy them`,
      };
    }
    return {
      path,
      action: "resolve" as const,
      reason:
        scan.kinds.length === 0
          ? "no reviewer entries in this family's shape at all — wholly derived"
          : `${scan.kinds.length} entry(ies), all script-authored`,
    };
  });
}

if (import.meta.main) {
  const repoRoot = repoRootFor(ROOT);
  const qaAbs = directoryForGraph(ROOT, "qa");
  if (qaAbs === undefined) {
    // NOT a pass. An instance declaring no `qa` graph has no sidecars to
    // resolve, and saying so differs from saying there was nothing to do.
    console.log("qa-resolve-conflicts — this instance declares no `qa` graph, so nothing was considered");
    process.exit(0);
  }
  // `directoryForGraph` returns an ABSOLUTE path; `git diff --name-only`
  // reports repo-relative ones. This joined the declaration onto the instance
  // root as though it were relative, producing
  // `cat-harness/home/user/…/test/results/` — a prefix nothing matches, so
  // every conflicted sidecar was classified "outside the declared graph" and
  // the command did nothing while exiting 0.
  //
  // **It failed OPEN**, which is the shape this whole command exists to
  // prevent, in the command itself. Found on its first real conflict, not by
  // a test — hence the guard below and the regression beside it.
  const qaDir = relative(repoRoot, qaAbs).replace(/\/*$/, "") + "/";
  if (!existsSync(qaAbs)) {
    console.error(
      `qa-resolve-conflicts — the declared \`qa\` directory does not exist: ${qaAbs}\n` +
        "  Everything would be reported as 'outside the graph', which is indistinguishable\n" +
        "  from having nothing to do. Refusing rather than exiting clean.",
    );
    process.exit(1);
  }

  const paths = unmergedPaths(repoRoot);
  if (paths.length === 0) {
    console.log("qa-resolve-conflicts — no unmerged paths; nothing to do");
    process.exit(0);
  }

  const outcomes = plan(repoRoot, qaDir, paths);
  const resolve = outcomes.filter((o) => o.action === "resolve");
  const refuse = outcomes.filter((o) => o.action === "refuse");
  const skip = outcomes.filter((o) => o.action === "skip");

  console.log(
    `qa-resolve-conflicts — ${paths.length} unmerged path(s): ` +
      `${resolve.length} regenerable, ${refuse.length} refused, ${skip.length} outside the graph`,
  );
  if (explain || dryRun) {
    for (const o of outcomes) console.log(`  ${o.action === "resolve" ? "✓" : o.action === "refuse" ? "✗" : "·"} ${o.path}\n      ${o.reason}`);
  }
  if (dryRun) {
    console.log("\n--dry-run: nothing was changed.");
    process.exit(0);
  }
  if (resolve.length === 0) {
    for (const o of refuse) console.error(`  ✗ ${o.path}\n      ${o.reason}`);
    console.error("\nNothing here is safe to regenerate. Resolve the above by hand.");
    process.exit(refuse.length > 0 ? 1 : 0);
  }

  // What must survive: every non-script entry from either side of every file
  // this command touches. It is empty by construction today (a file carrying
  // one is refused above) and is computed anyway, because the check that only
  // ever passes is the one nobody notices has stopped running.
  const mustSurvive = new Map<string, string[]>();
  for (const o of resolve) mustSurvive.set(o.path, scanConflict(repoRoot, o.path).nonScript);

  // Take either side. Which one does not matter: the regeneration below
  // overwrites it from the MERGED tree, and both sides are stale with respect
  // to that tree by definition.
  for (const o of resolve) git(repoRoot, ["checkout", "--ours", "--", o.path]);
  git(repoRoot, ["add", "--", ...resolve.map((o) => o.path)]);

  // Which generators. Read from the files themselves, then matched against
  // package.json — never guessed.
  const scripts = (JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf-8")) as {
    scripts?: Record<string, string>;
  }).scripts ?? {};
  const wanted = new Set<string>();
  const unknown = new Set<string>();
  for (const o of resolve) {
    for (const id of scanConflict(repoRoot, o.path).reviewerIds) {
      const s = generatorFor(scripts, id);
      if (s === undefined) unknown.add(id);
      else wanted.add(s);
    }
  }
  // A family with no reviewer id (kg-qa) names no generator, so fall back to
  // every writer whose OUTPUT lives under the qa graph. Stated rather than
  // silent: this is the one place the mapping is not read from the data.
  if (wanted.size === 0 && unknown.size === 0) {
    for (const s of ["kg:audit", "translation:block-qa"]) if (scripts[s] !== undefined) wanted.add(s);
  }

  for (const s of [...wanted].sort()) {
    console.log(`  ▸ bun run ${s}`);
    execFileSync("bun", ["run", s], { cwd: repoRoot, stdio: "inherit" });
  }
  if (unknown.size > 0) {
    console.error(`\n  ! no writing script in package.json runs: ${[...unknown].join(", ")}`);
    console.error("    Those sidecars were taken from one side and NOT regenerated. Check them.");
  }

  // The after-check. Every non-script entry that was in either side must still
  // be in the regenerated file.
  let lost = 0;
  for (const [path, before] of mustSurvive) {
    if (before.length === 0) continue;
    const after: SideScan = { kinds: [], nonScript: [], reviewerIds: [], unreadable: [] };
    scanDocument(JSON.parse(readFileSync(join(repoRoot, path), "utf-8")), after);
    for (const entry of before) {
      if (!after.nonScript.includes(entry)) {
        console.error(`  ✗ ${path}: regeneration dropped ${entry}`);
        lost++;
      }
    }
  }
  if (lost > 0) {
    console.error(`\n${lost} non-script verdict(s) lost. NOTHING was committed; inspect the working tree.`);
    process.exit(1);
  }

  git(repoRoot, ["add", "--", ...resolve.map((o) => o.path)]);
  console.log(`\n  ✓ ${resolve.length} sidecar(s) regenerated and staged.`);
  for (const o of refuse) console.log(`  ✗ ${o.path} left conflicted — ${o.reason}`);
  for (const o of skip) console.log(`  · ${o.path} left alone — ${o.reason}`);
  console.log("\nReview `git diff --cached`, run `bun run gates`, then commit the merge.");
  if (refuse.length > 0) process.exit(1);
}
