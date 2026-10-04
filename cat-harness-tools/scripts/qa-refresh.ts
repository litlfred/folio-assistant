#!/usr/bin/env bun
/**
 * qa-refresh — produce the QA working copy that `qa-publish` stores, and say
 * whether it is complete. Bean `3hk4`, a blocker of `5hox` (arc `3fva`).
 *
 * ## The gap it closes
 *
 * `qa:publish` stores whatever the checkout holds under the declared `qa`
 * directories. While `test/results/` is committed, that is the commit's own
 * copy. Once `5hox` removes it, a fresh CI checkout holds ONE file there (the
 * bootstrap kg-export sidecar the publish job writes itself), so every
 * `main/<sha>` entry would shrink to one file and every `--against main`
 * baseline would shrink with it. Measured on a scratch branch with the removal
 * cherry-picked: 0 of the inventory's 1,186 paths on disk after checkout.
 *
 * ## Why the publish job runs the writers, and the gates job does not hand over
 *
 * The job's comment named two fixes: (a) the gates job uploads its working
 * copy as an artifact, (b) the publish job runs the QA writers. (a) carries
 * nothing. Every gate over the `qa` graph is in JUDGE mode (beans `bo44`,
 * `id4s`, `0dav`, `oqe3`): it computes, judges and **writes nothing**, and
 * `gates.ts`' tree guard reports a read-only gate that writes. So after the
 * gates run, their checkout's `test/results/` is exactly the fresh checkout's,
 * and an artifact of it is the one-file entry this bean exists to prevent.
 * Making the gates write again would undo judge mode, and would put the
 * writers on the critical path of every PR and of every local `bun run gates`.
 *
 * So (b): the writers run here, in `qa-publish`, which is not a gate and runs
 * after the gates whatever they concluded. It is the same commit and the same
 * producers, so what it stores is what the gates judged, recomputed.
 *
 * ## The writers are DECLARED, and the declaration is checked on every run
 *
 * {@link QA_WRITERS} says which command writes which part of the tree. It was
 * measured, not inferred: on the scratch branch each writer was run into the
 * empty tree and the result compared path-for-path with the files-present
 * inventory (`qa:verify-moved --inventory`). A list is how a producer goes
 * missing, so the list is checked where it matters — after every computed
 * run, over the real tree:
 *
 * - a file **no** writer claims is `unclaimed`: something wrote where the
 *   declaration does not look, and the record's provenance is unknown;
 * - a writer whose families hold **no** file is `empty`: it ran and produced
 *   nothing, or did not run;
 * - a writer that exits outside its `okExits` is `failed`.
 *
 * Any of the three makes the run INCOMPLETE (exit 1), and `qa:publish
 * --completeness` refuses an incomplete report. A partial entry is never
 * stored as if it were whole.
 *
 * ## Two modes, decided by the checkout
 *
 * - **tracked** — every writer's declared paths are still tracked (before
 *   `5hox`). Nothing is run: the commit's own copy IS the record, and
 *   `5hox`'s precondition is that `main/<sha>` is byte-identical to it
 *   (`qa:verify-moved`). Running the writers would make it differ.
 * - **computed** — nothing is tracked there (after `5hox`). Every writer runs,
 *   in order, into the working copy.
 * - **mixed** — some writers' paths are tracked and some are not. Each writer
 *   is decided ON ITS OWN DECLARED PATHS: unbacked, it runs; backed, the
 *   commit's copy is its record and it does not.
 *
 * ## Why the mode is per WRITER and not per checkout (bean `tqjj`)
 *
 * It was per checkout until 2026-10-04, as one boolean over every tracked file
 * under the qa roots. That made `5hox` **atomic**: untracking one family while
 * its 1,020 siblings stayed tracked left the mode at `tracked`, so the family's
 * writer did not run, so nothing produced it, so `qa-reports` stopped carrying
 * it — and the readers that fetch it by ref went UNKNOWN with no step having
 * failed. Measured on the LSI family, the first subset whose readers were
 * migrated (`oq1j`). A removal that can only be done 1,186 files at once is a
 * removal that does not get done; `QA_WRITERS` already declares each writer's
 * paths, so the decision each writer needs was already in hand.
 *
 * The asymmetry between the two halves of `mixed` is deliberate. `empty` and
 * `failed` are judged over EVERY writer, because a backed writer's family
 * holding no file means the commit's copy is missing it. `unclaimed` is judged
 * only over the files NOT tracked: a tracked file's provenance is the commit
 * that carries it, so asking which writer claims it is asking the wrong
 * question, and answering it would fail `qa-publish` over files this change
 * does not touch.
 *
 * Usage:
 *   bun run qa:refresh [--report FILE] [--json]   # run (computed) or account (tracked); write the report
 *   bun run qa:refresh --github --report FILE     # CI: skip, with a notice, where qa:publish would skip
 *   bun run qa:refresh --list                     # the declared writers, in order; runs nothing
 *
 * Exit: 0 complete · 1 incomplete · 2 could not determine (no declaration, not a checkout).
 *
 * @module scripts/qa-refresh
 * @covers qa
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

import { githubPublishDecision, QaUsageError, REFRESH_SCHEMA, refreshReportComplete } from "../../cat-harness/scripts/qa-store.ts";
import { movedInventory, movedRoots, type MovedInventory } from "../../cat-harness/scripts/qa-verify-moved.ts";

export { REFRESH_SCHEMA, refreshReportComplete };
export const REFRESH_EXIT = { complete: 0, incomplete: 1, unknown: 2 } as const;

/** One producer of part of the `qa` tree. */
export interface QaWriter {
  /** Stable id: the npm script it runs where there is one. */
  id: string;
  /**
   * `bun run` arguments, from the repository root — an npm script name or a
   * script path, then its flags. `external` for a family another step of the
   * same job writes; it is still checked for files.
   */
  run: readonly string[] | "external";
  /** Repository-relative globs (`*` one segment, `**` any) of what it writes. */
  writes: readonly string[];
  /** Exit codes that mean "wrote its output". Default `[0]`. */
  okExits?: readonly number[];
  /** Why it is here, or what it depends on. */
  because: string;
}

// declared-path-literal: the HARNESS's qa tree, as the repo-relative key every writer below is keyed by. This script moved up to cat-harness-tools in 70lx B2 and drives its implementer's writers (downward); it was an own-instance path until the move.
const R = "cat-harness/test/results";

/**
 * Every writer of the `qa` tree, in the order they must run. Order matters
 * where one reads another's output: the witnesses project the block and
 * translation verdicts; `lsi audit` reads the indexes; `audit:coverage`
 * counts the files the others wrote; the subgraph READMEs list them.
 *
 * Measured 2026-10-02 on a scratch branch with `5hox`'s removal applied, each
 * run into the empty tree: together they reproduce 1,182 of the inventory's
 * 1,186 paths. The other four are `agent-skills/` and `large-datasets/`
 * kg-qa trees of two instances that were folded away (`j7ql`): no writer
 * audits an instance that no longer exists, so the record correctly loses
 * them. The block sweep covers the whole docs tree, which adds the 106 block
 * verdicts no hand sweep had reached — a derived result is a function of the
 * tree, not of which chapters somebody once swept.
 */
export const QA_WRITERS: readonly QaWriter[] = [
  {
    id: "kg:audit:all",
    run: ["kg:audit:all"],
    writes: [
      "*/test/results/kg-qa/**",
      "*/test/results/kg-qa.manifest.json",
      `${R}/bootstrap/**`,
      `${R}/bootstrap-tools/**`,
      `${R}/cat-harness-tools/**`,
    ],
    because: "every declared instance's KG verdicts, hosted homes included (bootstrap, bootstrap-tools, cat-harness-tools)",
  },
  { id: "kg:detangle", run: ["kg:detangle"], writes: [`${R}/detangle/**`], because: "detangle measurements per instance graph" },
  { id: "translation:block-qa", run: ["translation:block-qa"], writes: [`${R}/translation-qa/**`], because: "translation verdicts; read by the witnesses below" },
  {
    id: "qa-sweep:docs",
    run: ["cat-harness/content/pipeline/qa-sweep.ts", "cat-harness/content/docs"],
    writes: [`${R}/block-qa/**`],
    because: "script block verdicts over the docs tree; agent verdicts are composed from test/attestations/, which stays on main. Read by the witnesses below",
  },
  { id: "check:l1-complete", run: ["check:l1-complete", "--write"], writes: [`${R}/library-qa/**`], because: "per-library-entry L1 completeness; `--write` is its writer form" },
  { id: "lsi:index:cat-harness:skills", run: ["lsi:skills"], writes: [`${R}/lsi/cat-harness/skills.lsi.json`, `${R}/tool-runs/lsi-index/cat-harness/skills.tool-run.json`], because: "the skills graph's LSI index and its run record" },
  ...(["cat-harness", "smart-base", "who-iris"] as const).map(
    (inst): QaWriter => ({
      id: `lsi:index:${inst}:library`,
      run: ["lsi", "index", "--instance", inst, "--graph", "library"],
      writes: [`${R}/lsi/${inst}/library.lsi.json`, `${R}/tool-runs/lsi-index/${inst}/library.tool-run.json`],
      because: "a library graph `lsi audit` says needs an index (measured); a fourth would show as `index-missing` there",
    }),
  ),
  { id: "lsi:audit", run: ["lsi:audit"], writes: [`${R}/lsi-need-an-index.qa-results.json`], because: "which prose graphs need an index; reads the indexes above" },
  { id: "docs:pages", run: ["docs:pages"], writes: [`${R}/witnesses/**`], because: "the published witness projections of the block and translation verdicts above" },
  { id: "viewer:nav:audit", run: ["viewer:nav:audit"], writes: [`${R}/viewer-nav/**`], because: "viewer navbar census" },
  { id: "eval:crdm-detect", run: ["eval:crdm-detect"], writes: [`${R}/crdm-detect-eval.test-run.json`], because: "the crdm-detect phrase-signal evaluation over its fixed corpus" },
  ...(
    [
      ["root-scan-census", "root-scan-census"],
      ["skill:register", "skill-register"],
      ["term:mapping", "term-mapping"],
      ["check:harness-state", "harness-state"],
      ["check:wireframes", "wireframes"],
      ["check:source-licence", "source-licence"],
      ["check:layout-norms", "layout-norms"],
      ["check:rendered-labels", "rendered-labels"],
      ["check:lane-documentation", "lane-documentation"],
      ["check:methodology-evidence", "methodology-evidence"],
      ["check:avatar-coverage", "avatar-coverage"],
      ["kg:export", "kg-export"],
    ] as const
  ).map(([script, stem]): QaWriter => ({ id: script, run: [script], writes: [`${R}/${stem}.qa-results.json`], because: "a whole-artefact review; its writer form writes the sidecar" })),
  {
    id: "check:reference-direction",
    run: ["check:reference-direction"],
    writes: [`${R}/reference-direction.qa-results.json`],
    okExits: [0, 1],
    because: "exits 1 when it finds a wrong-direction reference, and writes the sidecar either way",
  },
  {
    id: "kg-export:bootstrap",
    run: "external",
    writes: [`${R}/kg-export.bootstrap.qa-results.json`],
    because: "written by the job's own `Regenerate the bootstrap kg-export QA sidecar` step, which `check:published-instance-exports` reads as its producer",
  },
  { id: "audit:coverage", run: ["audit:coverage"], writes: [`${R}/audit-coverage.qa-results.json`], because: "counts what every writer above produced, so it runs after them" },
  {
    id: "readme:subgraphs",
    run: ["readme:subgraphs"],
    // Its findings sidecar only. It writes no README into a `qa` directory
    // any more: a STORED directory is skipped (bean `f3bh`), so the README and
    // the findings cannot depend on whether a working copy was fetched.
    writes: [`${R}/subgraph-readmes.qa-results.json`],
    because: "its findings cover every declared directory's README, so it runs last",
  },
];

/** A repository-relative glob as a RegExp: `**` any depth, `*` one segment. */
export function globToRegExp(glob: string): RegExp {
  let re = "";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i]!;
    if (c === "*" && glob[i + 1] === "*") {
      re += ".*";
      i++;
    } else if (c === "*") re += "[^/]*";
    else re += c.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`^${re}$`);
}

/** The writers whose `writes` match `path`. */
export function claimants(path: string, writers: readonly QaWriter[] = QA_WRITERS): string[] {
  return writers.filter((w) => w.writes.some((g) => globToRegExp(g).test(path))).map((w) => w.id);
}

export type RefreshMode = "tracked" | "computed" | "mixed";

export interface WriterRun {
  id: string;
  exit: number | null;
  seconds: number;
}

export interface QaRefreshReport {
  $schema: typeof REFRESH_SCHEMA;
  mode: RefreshMode;
  /** The checkout this describes. */
  commit?: string;
  files: number;
  bytes: number;
  /** Files per writer, in declaration order (computed mode). */
  families: Record<string, number>;
  writers: WriterRun[];
  /** Files no writer claims. */
  unclaimed: string[];
  /** Writers whose families hold no file. */
  empty: string[];
  /** Writers that exited outside their `okExits`. */
  failed: string[];
  complete: boolean;
  /** Why it is not complete, one line each. Empty when complete. */
  reasons: string[];
}

/**
 * Judge a working copy: pure, so the completeness rule is tested on fixtures.
 *
 * In `tracked` mode the record is the commit's own copy, so only emptiness is
 * judged — a tracked copy with no file at all is not a record of anything.
 *
 * In `mixed` mode the per-writer judgements apply, but `unclaimed` is computed
 * over `unbacked` only: see the module docblock for why a tracked file is not
 * asked which writer claims it.
 */
export function assess(args: {
  mode: RefreshMode;
  inventory: MovedInventory;
  runs: readonly WriterRun[];
  writers?: readonly QaWriter[];
  commit?: string;
  /** `mixed` mode: the paths version control still tracks, whose provenance is the commit. */
  tracked?: readonly string[];
}): QaRefreshReport {
  const writers = args.writers ?? QA_WRITERS;
  const paths = args.inventory.directories.flatMap((d) => d.files.map((f) => f.path));
  const families: Record<string, number> = {};
  const unclaimed: string[] = [];
  const empty: string[] = [];
  const failed: string[] = [];
  const reasons: string[] = [];
  if (args.mode !== "tracked") {
    const trackedSet = new Set(args.tracked ?? []);
    for (const w of writers) families[w.id] = 0;
    for (const p of paths) {
      const by = claimants(p, writers);
      // A tracked file's provenance is the commit that carries it, so it is
      // never asked which writer claims it (module docblock, bean `tqjj`).
      if (by.length === 0 && !trackedSet.has(p)) unclaimed.push(p);
      for (const id of by) families[id]!++;
    }
    for (const w of writers) if (families[w.id] === 0) empty.push(w.id);
    for (const r of args.runs) {
      const w = writers.find((x) => x.id === r.id);
      if (r.exit === null || !(w?.okExits ?? [0]).includes(r.exit)) failed.push(r.id);
    }
    if (unclaimed.length) reasons.push(`${unclaimed.length} file(s) no declared writer claims (first: ${unclaimed[0]}) — QA_WRITERS is out of date`);
    if (empty.length) reasons.push(`${empty.length} writer(s) produced nothing: ${empty.join(", ")}`);
    if (failed.length) reasons.push(`${failed.length} writer(s) failed: ${failed.join(", ")}`);
  }
  if (paths.length === 0) reasons.push("no file under any declared qa directory — an entry of nothing is not a record");
  return {
    $schema: REFRESH_SCHEMA,
    mode: args.mode,
    ...(args.commit ? { commit: args.commit } : {}),
    files: paths.length,
    bytes: args.inventory.bytes,
    families,
    writers: [...args.runs],
    unclaimed,
    empty,
    failed,
    complete: reasons.length === 0,
    reasons,
  };
}

function git(repoRoot: string, args: string[]): string {
  const r = spawnSync("git", args, { cwd: repoRoot, encoding: "utf-8", maxBuffer: 1 << 26 });
  if (r.status !== 0) throw new Error(`git ${args.join(" ")}: ${r.stderr.trim()}`);
  return r.stdout;
}

/** Files version control tracks under the declared `qa` roots. */
export function trackedQaFiles(repoRoot: string, roots: readonly string[]): string[] {
  if (roots.length === 0) return [];
  return git(repoRoot, ["ls-files", "-z", "--", ...roots]).split("\0").filter(Boolean);
}

/**
 * Split the declared writers by whether version control still carries their
 * output — the per-writer form of the two modes (module docblock, bean `tqjj`).
 *
 * A writer is BACKED when at least one tracked path matches one of its
 * declared `writes` globs: the commit carries its record, so running it would
 * make `main/<sha>` differ from the commit and break `5hox`'s hash check.
 * UNBACKED, nothing in the commit holds its output, so this run must produce
 * it or `qa-reports` carries nothing for it.
 */
export function partitionWriters(
  tracked: readonly string[],
  writers: readonly QaWriter[] = QA_WRITERS,
): { backed: QaWriter[]; unbacked: QaWriter[] } {
  const backed: QaWriter[] = [];
  const unbacked: QaWriter[] = [];
  for (const w of writers) {
    const res = w.writes.map((g) => globToRegExp(g));
    (tracked.some((p) => res.some((re) => re.test(p))) ? backed : unbacked).push(w);
  }
  return { backed, unbacked };
}

/** Run one writer from the repository root; its output streams through. */
function runWriter(repoRoot: string, w: QaWriter): WriterRun {
  const t = Date.now();
  if (w.run === "external") return { id: w.id, exit: 0, seconds: 0 };
  console.log(`::group::qa:refresh ${w.id} — bun run ${w.run.join(" ")}`);
  const r = spawnSync("bun", ["run", ...w.run], { cwd: repoRoot, stdio: "inherit" });
  console.log("::endgroup::");
  return { id: w.id, exit: r.status, seconds: Math.round((Date.now() - t) / 1000) };
}

function main(argv: string[]): number {
  const one = (n: string): string | undefined => {
    const i = argv.indexOf(`--${n}`);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  if (argv.includes("--list")) {
    for (const w of QA_WRITERS) console.log(`${w.id.padEnd(32)} ${w.run === "external" ? "(external step)" : `bun run ${w.run.join(" ")}`}\n${" ".repeat(33)}${w.writes.join(", ")}`);
    return 0;
  }
  if (argv.includes("--github")) {
    // The same decision `qa:publish --github` makes, asked first: a run whose
    // publish will be skipped (a fork PR, a push off main) has no use for
    // minutes of writers. Stated, never silent, and exit 0 — as the publish.
    let event: unknown;
    try {
      event = process.env.GITHUB_EVENT_PATH ? JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, "utf-8")) : undefined;
    } catch {
      event = undefined;
    }
    const d = githubPublishDecision(process.env, event);
    if (!d.publish) {
      console.log(`::notice title=qa:refresh skipped::${d.reason}`);
      return REFRESH_EXIT.complete;
    }
  }
  const repoRoot = git(process.cwd(), ["rev-parse", "--show-toplevel"]).trim();
  const roots = movedRoots(repoRoot);
  if (roots.length === 0) throw new QaUsageError("no instance declares a qa directory; there is nothing to refresh");
  const commit = git(repoRoot, ["rev-parse", "HEAD"]).trim();
  const tracked = trackedQaFiles(repoRoot, roots);
  const { backed, unbacked } = partitionWriters(tracked);
  const mode: RefreshMode = unbacked.length === 0 ? "tracked" : backed.length === 0 ? "computed" : "mixed";
  const runs: WriterRun[] = [];
  if (backed.length) {
    console.log(
      `qa:refresh: ${tracked.length} file(s) are still tracked under the qa directories, backing ${backed.length} writer(s) — ` +
        "the commit's own copy is their record, so they do not run (5hox's hash check needs main/<sha> byte-identical to it)",
    );
  }
  for (const w of unbacked) runs.push(runWriter(repoRoot, w));
  const report = assess({ mode, inventory: movedInventory(repoRoot, roots), runs, commit, tracked });
  const out = resolve(one("report") ?? join(repoRoot, "build", "qa-refresh.json"));
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(report, null, 2) + "\n");
  if (argv.includes("--json")) console.log(JSON.stringify(report, null, 2));
  console.log(
    `qa:refresh ${report.complete ? "COMPLETE" : "INCOMPLETE"} (${mode}): ${report.files} file(s), ${report.bytes} bytes` +
      (runs.length ? ` from ${runs.length} writer(s)` : "") +
      ` — report ${out}`,
  );
  for (const r of report.reasons) console.error(`  ✗ ${r}`);
  for (const p of report.unclaimed.slice(0, 20)) console.error(`    unclaimed ${p}`);
  return report.complete ? REFRESH_EXIT.complete : REFRESH_EXIT.incomplete;
}

if (import.meta.main) {
  let code: number;
  try {
    code = main(process.argv.slice(2));
  } catch (e) {
    console.error(`qa-refresh: could not determine — ${(e as Error).message}. This is NOT a pass.`);
    code = REFRESH_EXIT.unknown;
  }
  process.exit(code);
}
