#!/usr/bin/env bun
/**
 * Every seeded state branch still matches the ref it was seeded from.
 *
 * @module scripts/state-drift
 * @covers cat-harness
 *
 * ## The defect this exists for — bean `9ofm`
 *
 * `cat/cat-harness/beans`, `cat/cat-harness/todos` and
 * `cat/cat-harness/fsh-guts` are **seeds**: each says so in its own
 * `manifest.json` (`status: "seed"`, `authoritative: false`), and each is a
 * copy of one subgraph of `main` taken at a recorded `source.sha`. `main`
 * stays the store until the cutover moves every reader onto the branch.
 *
 * A seed is only useful if it is CURRENT, and nothing kept it current. Two
 * measurements, both on 2026-10-03:
 *
 * - The `beans` seed was **173 commits and 14 files** behind `main` when I came
 *   back to it, and I refreshed it by hand. Nothing had reported it.
 * - Having refreshed it to *exact* tree parity at 15:27, it was **8 files**
 *   behind again within the hour — one of them the bean I had just claimed.
 *   `todos` was 1 file behind, `fsh-guts` 5, two of those binary PDFs.
 *
 * This is not bookkeeping. A cutover from a stale seed does not fail: it
 * silently resurrects whatever the seed still holds and loses whatever landed
 * on `main` since. For the work plan that means closed beans reopening and
 * claimed beans unclaiming, with no diff anywhere to read afterwards — the
 * cutover commit replaces a whole subtree at once.
 *
 * ## It compares TREES, not commits
 *
 * `source.sha` going stale is expected and harmless: `main` moves on every
 * merge, and a merge that touched nothing under the subgraph leaves the seed
 * perfectly current. Reporting a commit distance would cry wolf on every
 * merge. What matters is whether the two trees differ, so that is what is
 * compared — and the file list is the remedy, because "refresh the seed" and
 * "somebody wrote to the branch directly" are different problems with the same
 * tree mismatch.
 *
 * ## Reading the branch is the whole job, so it needs the network
 *
 * Deliberately NOT a CI gate: `check:declared-dirs` and `audit:coverage` are
 * local and offline by construction (bean `9ofm` row B), and a gate that can
 * go red because a fetch failed teaches contributors to re-run gates until
 * they pass. This is a command the cutover must run and quote. `unknown` is
 * its own exit code for the same reason: "could not reach the branch" is never
 * reported as "in sync".
 *
 * Exit codes: 0 every seed current · 1 drift · 4 could not determine.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { BranchStore, MANIFEST_FILE, MANIFEST_SCHEMA } from "./branch-store.ts";

export const SPECIAL_BRANCHES = join(import.meta.dir, "special-branches.json");

interface SpecialBranch {
  id: string;
  shape: string;
  name: string;
  legacy: string[];
}

/** The manifest a seeded state branch carries at its root. */
interface SeedManifest {
  $schema?: string;
  status?: string;
  /** Why, when `status` is `retired` — reported verbatim so the reason travels with the branch. */
  retiredReason?: string;
  authoritative?: boolean;
  subgraph?: string;
  source?: { ref?: string; sha?: string };
  graphs?: Array<{ path: string; tree?: string; files?: number }>;
}

export interface DriftRow {
  id: string;
  branch: string;
  path: string;
  /**
   * - `in-sync` — the branch's tree at `path` is byte-identical to the source
   *   ref's.
   * - `drift` — they differ; `files` names how.
   * - `authoritative` — the manifest says the branch IS the store, so there is
   *   no source ref to be current with. The inverse invariant (the checkout
   *   must no longer track the path) is `check:declared-dirs`'s `not-cut-over`.
   * - `not-a-seed` — no `state-manifest/v1` at the root. `gh-pages` and the
   *   commit-keyed `qa-reports` are not seeds of anything.
   * - `retired` — `status: "retired"`. A SUPERSEDED seed, which is worse than
   *   a stale one: it still carries a valid manifest over real graphs, so a
   *   cutover tool that found it would use it. `cat/cat-harness/state` is the
   *   case (owner, 2026-10-03, D4 option (b)): per-graph branches replaced it,
   *   and the beans graph's branch is `cat/cat-harness/beans`. Reporting its
   *   drift would be crying wolf over a branch nothing should read; reporting
   *   it as a seed would be worse. So it is named, and not compared.
   * - `unknown` — could not be determined. **Never folded into `in-sync`.**
   */
  state: "in-sync" | "drift" | "authoritative" | "not-a-seed" | "retired" | "unknown";
  detail?: string;
  /** On `drift`, `git diff-tree --name-status` between the two trees. */
  files?: string[];
}

/** A commit's root tree. The reads below are tree-addressed, `fetchTip` is not. */
function treeOf(store: BranchStore, commit: string): string {
  return store.must(["rev-parse", `${commit}^{tree}`]).trim();
}

/**
 * Candidate names for a special branch, canonical first — the resolution rule
 * `special-branches.json` states: the new name if it exists on the remote,
 * else the first `legacy` that does. {@link BranchStore.open} implements
 * exactly that over an ordered candidate list, so the rule has one
 * implementation rather than a second one here.
 *
 * `shape: "family"` entries (the Lean and FHIR caches) are a branch PREFIX,
 * not a branch, and are not seeds of a subgraph of this repository.
 */
export function candidatesOf(b: SpecialBranch): string[] | undefined {
  if (b.shape !== "branch") return undefined;
  return [b.name, ...(b.legacy ?? [])];
}

export function specialBranches(file: string = SPECIAL_BRANCHES): SpecialBranch[] {
  return (JSON.parse(readFileSync(file, "utf-8")) as { branches: SpecialBranch[] }).branches;
}

/**
 * One special branch's rows — one per `graphs[]` entry in its manifest.
 *
 * `source.ref` is read from the manifest rather than assumed to be `main`: a
 * seed that recorded a different ref is compared against the ref it actually
 * claims, and a seed that records none is `unknown` rather than compared
 * against a guess.
 */
export interface DriftOptions {
  repoRoot?: string;
  /** Passed to {@link BranchStore.open}; a test points both at a local bare repository so the gate is exercised against real git and no network. */
  remote?: string;
  storeDir?: string;
  log?: (l: string) => void;
}

export function driftOf(b: SpecialBranch, opts: DriftOptions = {}): DriftRow[] {
  const candidates = candidatesOf(b);
  if (!candidates) return [];
  const row = (r: Partial<DriftRow>): DriftRow => ({ id: b.id, branch: b.name, path: "", state: "unknown", ...r });

  const open = (names: string[]): BranchStore =>
    BranchStore.open(names, { repoRoot: opts.repoRoot, remote: opts.remote, storeDir: opts.storeDir, log: opts.log ?? (() => {}) });
  const store = open(candidates);
  const here = store.fetchTip();
  if (here.state !== "ok") {
    return [row({ state: "unknown", detail: `could not resolve ${b.name}: ${here.state === "absent" ? "no such branch on the remote" : here.reason}` })];
  }
  const hereTree = treeOf(store, here.tip);

  // Read the manifest through the PLUMBING rather than `readJson`, which goes
  // via `verifiedTip` and so answers "is this a valid state store" — the
  // wrong question here. `gh-pages` and the commit-keyed `qa-reports` are
  // perfectly healthy branches that are not seeds of anything, and this gate
  // must say `not-a-seed` for them rather than `unknown`: an unknown is a
  // finding, and three of those on every run is how a report stops being read.
  const entry = store.lookup(hereTree, MANIFEST_FILE);
  if (!entry) return [row({ branch: here.branch, state: "not-a-seed", detail: `no ${MANIFEST_FILE} at the root of ${here.branch}` })];
  if (entry.type !== "blob") return [row({ branch: here.branch, state: "unknown", detail: `${MANIFEST_FILE} on ${here.branch} is a ${entry.type}` })];
  if (!store.ensureBlobs(hereTree, [entry.sha])) {
    return [row({ branch: here.branch, state: "unknown", detail: `could not fetch ${MANIFEST_FILE} from ${here.branch}` })];
  }
  let m: SeedManifest;
  try {
    m = JSON.parse(store.blobText(entry.sha)) as SeedManifest;
  } catch (e) {
    return [row({ branch: here.branch, state: "unknown", detail: `${MANIFEST_FILE} on ${here.branch} does not parse: ${(e as Error).message}` })];
  }
  if (m.$schema !== MANIFEST_SCHEMA) return [row({ branch: here.branch, state: "not-a-seed", detail: `root manifest is ${m.$schema ?? "untyped"}, not ${MANIFEST_SCHEMA}` })];
  if (m.status === "retired") {
    return [row({ branch: here.branch, state: "retired", detail: m.retiredReason ?? "the manifest says this branch is retired; nothing should read it" })];
  }
  if (m.authoritative === true) return [row({ branch: here.branch, state: "authoritative", detail: "the manifest says this branch IS the store" })];

  const ref = m.source?.ref;
  if (!ref) return [row({ state: "unknown", detail: `${MANIFEST_FILE} records no \`source.ref\`, so there is nothing to be current with` })];
  const graphs = m.graphs?.length ? m.graphs : m.subgraph ? [{ path: m.subgraph }] : [];
  if (!graphs.length) return [row({ state: "unknown", detail: `${MANIFEST_FILE} names no graph path` })];

  // The SOURCE ref, fetched into the same bare store, so the two trees' object
  // ids are directly comparable and `diff-tree` needs no second repository.
  const src = open([ref]);
  const srcTip = src.fetchTip();
  if (srcTip.state !== "ok") {
    return [row({ branch: here.branch, state: "unknown", detail: `could not resolve ${ref}: ${srcTip.state === "absent" ? "no such branch on the remote" : srcTip.reason}` })];
  }
  const srcTree = treeOf(src, srcTip.tip);

  const out: DriftRow[] = [];
  for (const g of graphs) {
    const mine = store.lookup(hereTree, g.path);
    const theirs = src.lookup(srcTree, g.path);
    const base = { branch: here.branch, path: g.path, detail: `${here.branch}@${here.tip.slice(0, 12)} vs ${ref}@${srcTip.tip.slice(0, 12)}` };
    if (!mine || !theirs) {
      out.push(
        row({
          ...base,
          state: "unknown",
          detail: `${!mine ? `${g.path} is not on ${here.branch}` : `${g.path} is not on ${ref}`} — ${base.detail}`,
        }),
      );
      continue;
    }
    if (mine.sha === theirs.sha) {
      out.push(row({ ...base, state: "in-sync" }));
      continue;
    }
    // `diff-tree -r --name-status` compares the blob ids the trees carry and
    // never opens a blob, so a partial clone answers it once the TREES are
    // present — which is what `hydrate` ensures.
    store.hydrate(mine.sha);
    src.hydrate(theirs.sha);
    const d = store.git(["diff-tree", "-r", "--name-status", mine.sha, theirs.sha]);
    const files = d.status === 0 ? d.stdout.toString("utf-8").split("\n").filter(Boolean) : [];
    out.push(
      row({
        ...base,
        state: "drift",
        files,
        detail: `${files.length || "?"} file(s) differ — ${base.detail}`,
      }),
    );
  }
  return out;
}

export function driftRows(opts: DriftOptions & { file?: string } = {}): DriftRow[] {
  return specialBranches(opts.file).flatMap((b) => driftOf(b, opts));
}

export function exitCodeFor(rows: readonly DriftRow[]): number {
  if (rows.some((r) => r.state === "drift")) return 1;
  if (rows.some((r) => r.state === "unknown")) return 4;
  return 0;
}

export const MARK = { "in-sync": "✓", drift: "✗", unknown: "?", authoritative: "·", "not-a-seed": "·", retired: "·" } as const;

/**
 * The session-start form: the finding and nothing else.
 *
 * The full report prints every differing path, and the superseded
 * `cat/cat-harness/state` alone carried **159** of them — which in a sweep
 * whose job is to be read would bury the rest of the sweep. So `--brief`
 * prints one line per drifted graph with its COUNT, and says where the list
 * is. Silent when every seed is current, because a sweep that prints a clean
 * section every time trains people to skip the section.
 */
export function brief(rows: readonly DriftRow[]): string {
  const drifted = rows.filter((r) => r.state === "drift");
  const unknown = rows.filter((r) => r.state === "unknown");
  if (!drifted.length && !unknown.length) return "";
  const lines = ["## Seeded state branches"];
  for (const r of drifted) lines.push(`  ✗ ${r.id}:${r.path} — ${r.files?.length ?? "?"} file(s) behind ${r.detail?.replace(/^.*vs /, "") ?? "its source ref"}`);
  for (const r of unknown) lines.push(`  ? ${r.id}${r.path ? `:${r.path}` : ""} — could not determine: ${r.detail ?? ""}`);
  lines.push(
    "",
    "These are SEEDS: `main` is still the store, so drift here breaks nothing today.",
    "It breaks the cutover: a cutover from a stale seed resurrects what the seed holds",
    "and loses what landed since, in one subtree replacement with no diff to read.",
    "Full list: `bun run state:drift`. Refresh one: `bun run state:seed --id <graph>`.",
  );
  return lines.join("\n");
}

if (import.meta.main) {
  const json = process.argv.includes("--json");
  const rows = driftRows({ log: (l) => process.argv.includes("--verbose") && console.error(l) });
  if (json) {
    console.log(JSON.stringify(rows, null, 2));
  } else if (process.argv.includes("--brief")) {
    const b = brief(rows);
    if (b) console.log(b);
  } else {
    const mark = MARK;
    for (const r of rows) {
      console.log(`  ${mark[r.state]} ${r.id}${r.path ? `:${r.path}` : ""} — ${r.state}${r.detail ? `: ${r.detail}` : ""}`);
      for (const f of r.files ?? []) console.log(`      ${f}`);
    }
    const seeds = rows.filter((r) => r.state === "in-sync" || r.state === "drift" || r.state === "unknown");
    const drifted = rows.filter((r) => r.state === "drift");
    const unknown = rows.filter((r) => r.state === "unknown");
    console.log(
      `\n${seeds.length} seeded graph(s) across ${rows.length} special-branch row(s); ` +
        `${drifted.length} drifted; ${unknown.length} could not be determined`,
    );
    if (drifted.length) {
      console.log(
        `\n✗ Refresh the seed before any cutover — \`bun run state:seed --id <graph>\`, one per drifted\n` +
          `  row above. A cutover from a stale seed does NOT fail: it resurrects what the seed still\n` +
          `  holds and loses what landed on the source ref since, and the cutover commit replaces the\n` +
          `  whole subtree at once so there is no diff to read.`,
      );
    }
    if (unknown.length) console.log(`\n? Not a pass. "Could not reach the branch" and "in sync" are different answers.`);
  }
  process.exit(exitCodeFor(rows));
}
