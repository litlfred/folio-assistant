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
 * 1. **Before** — refuse any file where either side carries one that the
 *    ATTESTATION STORE does not hold, leaving it conflicted for a person.
 * 2. **After** — verify that every non-script entry present in either side is
 *    still present in the regenerated file. A fast path that is the only
 *    protection is a fast path that becomes the protection the day its
 *    assumption breaks.
 *
 * ## The guard reads the store (bean `8wj1`)
 *
 * Until the attestation store existed, "either side carries a non-script
 * entry" meant "regeneration would destroy it", because the writers kept those
 * entries only by reading the file being regenerated. Since `8wj1` every block
 * and translation writer reads them from `test/attestations/` instead
 * (`schemas/qa-attestations.ts`), so a file whose non-script entries
 * are ALL held there, byte for byte, regenerates without losing one, and is
 * resolved. One the store does not hold, a store file that is itself
 * conflicted, or a store that cannot be read, is still refused: those are the
 * cases where a person has to look.
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

import { directoriesForGraph, instanceRootsIn, repoRootFor } from "../schemas/cat-harness.ts";
import { attestationKeyForDerived, attestationPath, entryIdentity, readCriteriaAttestations } from "../schemas/qa-attestations.ts";

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

/** The stages git holds for an unmerged path (1 base, 2 ours, 3 theirs). */
export function unmergedStages(repoRoot: string, path: string): Set<number> {
  const out = new Set<number>();
  for (const line of git(repoRoot, ["ls-files", "-u", "--", path]).split("\n")) {
    const stage = Number(line.split(/\s+/)[2]);
    if (stage) out.add(stage);
  }
  return out;
}

/**
 * Which side stands in for a resolved sidecar until regeneration rewrites it.
 *
 * Both sides present: either will do, and this has always taken ours. ONE side
 * missing is a modify/delete conflict, and `checkout --ours` throws on it
 * ("does not have our version") — the qa-sidecar half of issue #1854, the
 * same crash `takeBase` in `merge-base.ts` fixed for take-base paths. Then
 * the side being merged in (the base, "theirs") decides, as it does there:
 * its copy when it kept the file, its deletion when it removed it. Taking a
 * deletion loses nothing the guard protects — `plan` has already refused any
 * file whose surviving side carries a non-script verdict — and regeneration
 * recreates the sidecar if its subject is still audited.
 */
export function provisionalSide(stages: ReadonlySet<number>): "ours" | "theirs" | "delete" {
  if (stages.has(2) && stages.has(3)) return "ours";
  return stages.has(3) ? "theirs" : "delete";
}

/** Apply `provisionalSide` to one path and stage the result. */
export function takeProvisionalSide(repoRoot: string, path: string): void {
  const side = provisionalSide(unmergedStages(repoRoot, path));
  if (side === "delete") {
    git(repoRoot, ["rm", "-q", "--", path]);
    return;
  }
  git(repoRoot, ["checkout", `--${side}`, "--", path]);
  git(repoRoot, ["add", "--", path]);
}

/** How a file's two sides look to the guard. */
export interface SideScan {
  /** Every `reviewer.kind` seen, across both sides. */
  kinds: string[];
  /** Identities of the non-script entries, for the after-check. */
  nonScript: string[];
  /** The non-script entries themselves — criterion and exact serialisation — for the store check. */
  nonScriptEntries?: { criterion: string | undefined; json: string }[];
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
      if (kind !== "script") {
        into.nonScript.push(`${path.join(".")}|${kind}|${id ?? "?"}`);
        const criterion = path.length >= 3 && path[path.length - 3] === "criteria" ? path[path.length - 2] : undefined;
        (into.nonScriptEntries ??= []).push({ criterion, json: entryIdentity(doc) });
      }
    }
    // Only a SCRIPT reviewer names a generator; an agent's id never will, and
    // looking one up would report a "missing writer" for every adjudication.
    if (id !== undefined && kind === "script" && !into.reviewerIds.includes(id)) into.reviewerIds.push(id);
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

/**
 * Does the attestation store hold every non-script entry of both sides?
 * `undefined` when it does; otherwise why not. Never "yes" by default: a family
 * the store does not serve, a store file in conflict, or an unreadable store
 * are each a reason.
 */
export function storeHolds(
  repoRoot: string,
  instanceRoot: string,
  path: string,
  scan: SideScan,
  unmerged: readonly string[],
): string | undefined {
  const key = attestationKeyForDerived(instanceRoot, join(repoRoot, path));
  if (!key) return "its family is not one the attestation store serves";
  const storePath = relative(repoRoot, attestationPath(instanceRoot, key));
  if (unmerged.includes(storePath)) return `its attestation file ${storePath} is itself conflicted`;
  const read = readCriteriaAttestations(instanceRoot, key);
  if (read.state === "corrupt" || read.state === "unknown") return `the attestation store is ${read.state} at ${storePath}: ${read.reason}`;
  const held = read.state === "hit" ? read.criteria : {};
  const missing = (scan.nonScriptEntries ?? []).filter(
    (e) => e.criterion === undefined || !(held[e.criterion] ?? []).some((h) => entryIdentity(h) === e.json),
  );
  if (missing.length > 0) {
    return `${missing.length} of them ${read.state === "absent" ? "with no attestation store at all" : `not held in ${storePath}`} — run \`bun run qa:attestations:migrate\` first`;
  }
  return undefined;
}

/**
 * Which instance's attestation store answers for `path`: the instance owning
 * the LONGEST declared qa directory that contains it. `undefined` when no
 * owner is known for that directory.
 */
export type InstanceFor = string | ((path: string) => string | undefined);

/**
 * Pair every declared `qa` directory (repo-relative, trailing `/`) with the
 * instance that owns it — of the instances declaring it, the deepest one whose
 * root contains it, else the first to declare it. An instance inherits its
 * dependencies' declarations, so "declares it" alone does not say whose store
 * a sidecar's non-script verdicts are held in.
 */
export function qaDirOwners(repoRoot: string, instances: readonly string[]): Map<string, string> {
  const owners = new Map<string, string>();
  const depth = (p: string) => p.split("/").length;
  for (const inst of instances) {
    for (const abs of directoriesForGraph(inst, "qa")) {
      const rel = relative(repoRoot, abs).replace(/\/*$/, "") + "/";
      const contains = !relative(inst, abs).startsWith("..");
      const prev = owners.get(rel);
      if (prev === undefined) {
        owners.set(rel, inst);
        continue;
      }
      const prevContains = !relative(prev, abs).startsWith("..");
      if (contains && (!prevContains || depth(inst) > depth(prev))) owners.set(rel, inst);
    }
  }
  return owners;
}

/**
 * Decide, per conflicted path, without touching anything.
 *
 * `qaDirs` is EVERY declared `qa` directory in the checkout, repo-relative,
 * not only the root instance's — measured 2026-10-02 on #1822: a
 * `who-iris/test/results/kg-qa/…` sidecar was classified `qa-sidecar` by
 * `merge-conflict-patterns.ts`, handed here, and "left alone — outside the
 * declared qa graph", because this walked `cat-harness/test/results/` only.
 * merge-base then aborted on a conflict the pattern had promised to resolve.
 *
 * `instanceRoot` names whose attestation store must hold a sidecar's
 * non-script entries before it may be dropped (bean `2gst`). A string means
 * one instance for every path; a function answers per path, so a who-iris
 * sidecar is checked against who-iris's store and not the root's.
 */
export function plan(
  repoRoot: string,
  qaDirs: string | readonly string[],
  paths: readonly string[],
  instanceRoot?: InstanceFor,
): Outcome[] {
  const dirs = typeof qaDirs === "string" ? [qaDirs] : qaDirs;
  const ownerOf = (path: string): string | undefined =>
    typeof instanceRoot === "function" ? instanceRoot(path) : instanceRoot;
  return paths.map((path) => {
    if (!dirs.some((d) => path.startsWith(d))) {
      return { path, action: "skip" as const, reason: `outside every declared \`qa\` graph (${dirs.join(", ")})` };
    }
    // A qa DIRECTORY holds more than sidecars: `test/results/README.md` is a
    // generated README that `merge-conflict-patterns.ts` resolves by its own
    // pattern. Measured 2026-10-02 on #1811 and #1830: it was scanned here as
    // a sidecar, refused as "not valid JSON", and that refusal aborted
    // merge-base on a conflict another pattern had already promised to
    // resolve. Only a JSON file can be a sidecar; anything else is skipped and
    // left to the pattern that names it (or refused there, if none does).
    if (!path.endsWith(".json")) {
      return { path, action: "skip" as const, reason: "not a JSON sidecar — left to the merge pattern that names it" };
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
      const kinds = [...new Set(scan.nonScript.map((s) => s.split("|")[1]))].join(", ");
      const owner = ownerOf(path);
      const why =
        owner === undefined
          ? "no instance root was given to find the attestation store"
          : storeHolds(repoRoot, owner, path, scan, paths);
      if (why !== undefined) {
        return {
          path,
          action: "refuse" as const,
          reason: `carries ${scan.nonScript.length} non-script verdict(s) (${kinds}) — regenerating could destroy them: ${why}`,
        };
      }
      return {
        path,
        action: "resolve" as const,
        reason: `${scan.nonScript.length} non-script verdict(s) (${kinds}), every one held in the attestation store, which the regenerating writer reads`,
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
  // Every instance in the checkout, nested ones included — see `plan`.
  const qaAbsAll = [...new Set(instanceRootsIn(repoRoot).flatMap((inst) => directoriesForGraph(inst, "qa")))];
  if (qaAbsAll.length === 0) {
    // NOT a pass. A checkout declaring no `qa` graph has no sidecars to
    // resolve, and saying so differs from saying there was nothing to do.
    console.log("qa-resolve-conflicts — no instance here declares a `qa` graph, so nothing was considered");
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
  const qaDirs = qaAbsAll.map((a) => relative(repoRoot, a).replace(/\/*$/, "") + "/");
  const missing = qaAbsAll.find((a) => !existsSync(a));
  if (missing !== undefined) {
    console.error(
      `qa-resolve-conflicts — a declared \`qa\` directory does not exist: ${missing}\n` +
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

  // The instance that owns the `qa` directory a path lies in: ITS
  // `test/attestations/` is the store that must hold the path's non-script
  // verdicts — a who-iris sidecar is judged against who-iris's store, never
  // the root's. The longest matching directory wins, since homes nest.
  const owners = qaDirOwners(repoRoot, instanceRootsIn(repoRoot));
  const instanceFor = (path: string): string | undefined => {
    const dir = [...owners.keys()].filter((d) => path.startsWith(d)).sort((a, b) => b.length - a.length)[0];
    return dir === undefined ? undefined : owners.get(dir);
  };
  const outcomes = plan(repoRoot, qaDirs, paths, instanceFor);
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
  // this command touches — by criterion and exact serialisation, not by array
  // index, since a writer composes attestations FIRST and an index may move.
  const mustSurvive = new Map<string, string[]>();
  const survivalId = (e: { criterion: string | undefined; json: string }) => `${e.criterion ?? "?"}|${e.json}`;
  for (const o of resolve) mustSurvive.set(o.path, (scanConflict(repoRoot, o.path).nonScriptEntries ?? []).map(survivalId));

  // Take either side. Which one does not matter: the regeneration below
  // overwrites it from the MERGED tree, and both sides are stale with respect
  // to that tree by definition. A side that does not exist (modify/delete)
  // cannot be taken — see `provisionalSide`.
  for (const o of resolve) takeProvisionalSide(repoRoot, o.path);

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
    // `kg:audit:all` too: a resolved sidecar may belong to a nested instance
    // (#1822's was who-iris's), which the root-only `kg:audit` does not write.
    for (const s of ["kg:audit", "kg:audit:all", "translation:block-qa"]) if (scripts[s] !== undefined) wanted.add(s);
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
    const afterIds = new Set((after.nonScriptEntries ?? []).map(survivalId));
    for (const entry of before) {
      if (!afterIds.has(entry)) {
        console.error(`  ✗ ${path}: regeneration dropped ${entry.slice(0, 160)}`);
        lost++;
      }
    }
  }
  if (lost > 0) {
    console.error(`\n${lost} non-script verdict(s) lost. NOTHING was committed; inspect the working tree.`);
    process.exit(1);
  }

  // A sidecar taken as a deletion and not recreated is already staged by
  // `git rm`; naming it to `git add` would fail on a path that is gone.
  const present = resolve.map((o) => o.path).filter((p) => existsSync(join(repoRoot, p)));
  if (present.length > 0) git(repoRoot, ["add", "--", ...present]);
  console.log(`\n  ✓ ${resolve.length} sidecar(s) regenerated and staged.`);
  for (const o of refuse) console.log(`  ✗ ${o.path} left conflicted — ${o.reason}`);
  for (const o of skip) console.log(`  · ${o.path} left alone — ${o.reason}`);
  console.log("\nReview `git diff --cached`, run `bun run gates`, then commit the merge.");
  if (refuse.length > 0) process.exit(1);
}
