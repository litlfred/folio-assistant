#!/usr/bin/env bun
/**
 * qa-site-assets — the QA evidence a site build publishes, fetched from the
 * `qa-reports` branch and checked after it is copied. Bean `tfqf`, reader audit
 * family F6 (`docs/proposals/qa-readers-audit-2026-10-01.md`, defects C9, C10).
 *
 * ## Why
 *
 * `docs-site.yml` and `feature-staging.yml` published `/assets/qa/` with two
 * shell lines: `cp -rT …/test/results/witnesses` and a `find … -name
 * '*.qa-results.json' -exec cp`. Both copy WHATEVER IS THERE. With the derived
 * corpus absent — every checkout, once it lives on `qa-reports` — the build
 * wrote two witnesses and one export result, the other 19 results vanished
 * from `/assets/qa/`, and the step printed a smaller count and stayed green
 * (C10). Nothing in the build knew what it should have published.
 *
 * So the build now says where its evidence came from BEFORE it generates
 * anything, and what it should hold:
 *
 * 1. **`fetch`**, before the docs generator. Reads the entry for this build's
 *    ref (`main/<sha>`, `pr/<n>/<sha>`) — and optional fallbacks — from
 *    `qa-reports` into a scratch directory, never into the checkout. Then:
 *    - the checkout already holds the corpus (it is still committed today):
 *      source `checkout`, and the expected counts are the checkout's;
 *    - it does not, and the fetch hit: the entry is MATERIALISED into the
 *      checkout's `test/results/` paths (`fetched`, or `fetched-fallback` when
 *      only a fallback ref hit — another commit's evidence, labelled as such);
 *    - neither: source `unavailable`. Stated, in the run log and in the
 *      published site — never a smaller set passed off as the whole.
 *    The state, with the counts the build must publish, goes to `--state`.
 * 2. **`verify`**, after the copy. Counts what landed in `_site/assets/qa/`
 *    against what the source held at fetch time, FAILS on a shortfall, and
 *    writes `_site/assets/qa/availability.json` saying which source the
 *    evidence came from — so the published site carries the answer too.
 *
 * ## Why the checkout wins while the corpus is committed
 *
 * A PR's entry is published from the pull request's MERGE checkout, while a
 * staging preview builds the head. Overwriting the head's committed results
 * with the merge commit's would publish evidence about a tree the preview does
 * not show. Once `storage` is declared and the corpus leaves the checkout
 * (bean `5hox`) the fetched entry is the only source and this question goes
 * away.
 *
 * ## A miss is never clean
 *
 * `unavailable` exits 0 by default — a docs deploy racing the job that
 * publishes its QA must not fail the site — but it is said three ways: a
 * `::warning` in the run, `availability.json` in the site, and the docs
 * generator's own "not available in this build" badges and `unknown` QA tile
 * (`qaCorpusAvailability`). `--require` makes it exit 1 for a caller that would
 * rather fail.
 *
 * Usage:
 *   bun run cat-harness/scripts/qa-site-assets.ts fetch --ref <ref> [--fallback <ref>]... \
 *       --results <dir> [--state FILE] [--require]
 *   bun run cat-harness/scripts/qa-site-assets.ts verify --site <dir> --results <dir> [--state FILE]
 *
 * Exit: 0 ok (or `unavailable`, stated) · 1 a shortfall, or `unavailable` under
 * `--require` · 2 usage, or `verify` with no fetch state to judge against.
 *
 * @module scripts/qa-site-assets
 * @covers qa
 */
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

import { fetchQa, QaUsageError } from "./qa-store.ts";
import { siteFetchStatePath } from "./qa-result-link.ts";

export const AVAILABILITY_SCHEMA = "folio-qa-availability/v1" as const;
export const STATE_SCHEMA = "folio-qa-fetch-state/v1" as const;
/** The file `verify` writes beside the evidence it checked. */
export const AVAILABILITY_FILE = "availability.json";
/** The results subdirectory the docs generator writes witness projections into. */
export const WITNESS_SUBDIR = "witnesses";
const RESULT_SUFFIX = ".qa-results.json";

export type QaSource = "checkout" | "fetched" | "fetched-fallback" | "unavailable";

/** What one results tree holds, in the two shapes the site publishes. */
export interface QaAssetCounts {
  /** `*.json` anywhere under `<results>/witnesses/`. */
  witnesses: number;
  /** `<results>/*.qa-results.json`, top level only — what the copy step takes. */
  results: number;
  /** Every file under `<results>/`, for the "is the corpus here at all" question. */
  files: number;
}

export interface QaFetchState {
  $schema: typeof STATE_SCHEMA;
  source: QaSource;
  /** The refs asked for, in order. */
  requested: string[];
  /** The store key that hit, when one did. */
  key?: string;
  reason: string;
  /** What the build must publish — the source's counts at fetch time. */
  expected: QaAssetCounts;
  /** Each attempt, so a miss says which refs missed and why. */
  attempts: Array<{ ref: string; state: string; reason?: string }>;
}

export interface QaAvailability {
  $schema: typeof AVAILABILITY_SCHEMA;
  source: QaSource;
  requested: string[];
  key?: string;
  reason: string;
  expected: Pick<QaAssetCounts, "witnesses" | "results">;
  published: Pick<QaAssetCounts, "witnesses" | "results">;
}

function walkFiles(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walkFiles(p, out);
    else if (e.isFile()) out.push(p);
  }
  return out;
}

/**
 * The verdict families whose presence means "the corpus is here". NOT "any
 * file": a build writes a few results itself (`kg-export` writes
 * `kg-export.qa-results.json` during the site build), and counting those as a
 * corpus is exactly the C10 shape — measured here, when a preview run left that
 * one file behind and the next fetch called the checkout's corpus present.
 */
export const CORPUS_FAMILIES = ["kg-qa", "block-qa", "translation-qa"] as const;

/** Does this results tree hold a verdict corpus (any family), as opposed to a build's own leftovers? */
export function holdsCorpus(resultsDir: string): boolean {
  return CORPUS_FAMILIES.some((f) => existsSync(join(resultsDir, f)));
}

/** Count a results tree. An absent tree is all zeros — the caller decides what that means. */
export function countResults(resultsDir: string): QaAssetCounts {
  const files = walkFiles(resultsDir);
  const witnesses = walkFiles(join(resultsDir, WITNESS_SUBDIR)).filter((f) => f.endsWith(".json")).length;
  const results = existsSync(resultsDir)
    ? readdirSync(resultsDir, { withFileTypes: true }).filter((e) => e.isFile() && e.name.endsWith(RESULT_SUFFIX)).length
    : 0;
  return { witnesses, results, files: files.length };
}

/**
 * Count what a built site publishes under `assets/qa/`, in the same two
 * shapes. Witness projections always sit one directory down (`<page>/<key>.json`),
 * results at the top; the top-level `index.json` is the graph projection the
 * generator writes through Jekyll, and this module's own `availability.json`,
 * and neither is evidence.
 */
/** Top-level files under `assets/qa/` that the witness tree did not put there. */
export const PUBLISHED_NOT_EVIDENCE: readonly string[] = ["index.json", "availability.json"];

export function countPublished(siteDir: string): Pick<QaAssetCounts, "witnesses" | "results"> {
  const qa = join(siteDir, "assets", "qa");
  if (!existsSync(qa)) return { witnesses: 0, results: 0 };
  let witnesses = 0;
  let results = 0;
  for (const e of readdirSync(qa, { withFileTypes: true })) {
    if (e.isDirectory()) witnesses += walkFiles(join(qa, e.name)).filter((f) => f.endsWith(".json")).length;
    else if (e.isFile() && e.name.endsWith(RESULT_SUFFIX)) results++;
    // A top-level file the witness tree itself carries (bean `4l4d`:
    // `translation-qa-pages.json`, the shared list the badge script fetches)
    // is copied here like the rest, and `countResults` counts it — so it is
    // counted here too, or every build reads one short. The two top-level
    // files that are NOT from the tree are excluded, as the docblock says.
    else if (e.isFile() && e.name.endsWith(".json") && !PUBLISHED_NOT_EVIDENCE.includes(e.name)) witnesses++;
  }
  return { witnesses, results };
}

/**
 * Decide the source. Pure over its inputs so every branch is testable without
 * a network: `local` is the checkout's counts, `hits` the first fetch that
 * hit (or undefined), with its index into the requested refs.
 */
export function decideSource(
  local: QaAssetCounts & { corpus: boolean },
  hit: { index: number; key: string; counts: QaAssetCounts } | undefined,
): { source: QaSource; expected: QaAssetCounts; reason: string } {
  if (local.corpus) {
    return {
      source: "checkout",
      expected: { witnesses: local.witnesses, results: local.results, files: local.files },
      reason:
        "the checkout holds the QA corpus (still committed), so it is published as checked out" +
        (hit ? `; qa-reports also has ${hit.key}` : "; qa-reports had no entry for this build's ref"),
    };
  }
  if (hit) {
    return {
      source: hit.index === 0 ? "fetched" : "fetched-fallback",
      expected: hit.counts,
      reason:
        hit.index === 0
          ? `fetched ${hit.key} from qa-reports`
          : `no entry for the requested ref; fetched ${hit.key} instead — QA evidence from ANOTHER commit, labelled as such`,
    };
  }
  return {
    source: "unavailable",
    expected: { witnesses: 0, results: 0, files: 0 },
    reason: "QA not available for this ref: the checkout holds no QA corpus and qa-reports had no entry for any requested ref",
  };
}

/**
 * Judge a published `assets/qa/` against the state. Returns the problems
 * (empty when it is fine) and the availability document to publish.
 *
 * - `now`: what the results tree holds at verify time. Fewer published than
 *   that means the copy itself dropped files — always an error.
 * - `state.expected`: what the source held at fetch time. Fewer published
 *   than that is the C10 shrink — an error, except that a FALLBACK entry is
 *   another commit's evidence, whose counts may legitimately differ, so there
 *   a witness shortfall is a warning.
 */
export function judgePublished(
  state: QaFetchState,
  now: QaAssetCounts,
  published: Pick<QaAssetCounts, "witnesses" | "results">,
): { errors: string[]; warnings: string[]; availability: QaAvailability } {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (published.results < now.results) {
    errors.push(`the copy published ${published.results} *.qa-results.json of the ${now.results} in the results tree`);
  }
  if (published.witnesses < now.witnesses) {
    errors.push(`the copy published ${published.witnesses} witness file(s) of the ${now.witnesses} in the results tree`);
  }
  if (state.source !== "unavailable") {
    if (published.results < state.expected.results) {
      errors.push(
        `SHRINK: ${published.results} *.qa-results.json published, but the ${state.source} source held ` +
          `${state.expected.results} when the build started (C10)`,
      );
    }
    if (published.witnesses < state.expected.witnesses) {
      const msg =
        `${published.witnesses} witness file(s) published, but the ${state.source} source held ` +
        `${state.expected.witnesses} when the build started`;
      if (state.source === "fetched-fallback") warnings.push(`${msg} (a fallback entry is another commit's evidence)`);
      else errors.push(`SHRINK: ${msg} (C10)`);
    }
  } else {
    warnings.push(state.reason);
  }
  return {
    errors,
    warnings,
    availability: {
      $schema: AVAILABILITY_SCHEMA,
      source: state.source,
      requested: state.requested,
      ...(state.key ? { key: state.key } : {}),
      reason: state.reason,
      expected: { witnesses: state.expected.witnesses, results: state.expected.results },
      published,
    },
  };
}

// ── CLI ──────────────────────────────────────────────────────────────────

function args(argv: string[]) {
  const pos: string[] = [];
  const vals = new Map<string, string[]>();
  const bools = new Set<string>();
  const VALUED = new Set(["ref", "fallback", "results", "state", "site"]);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (!a.startsWith("--")) {
      pos.push(a);
      continue;
    }
    const k = a.slice(2);
    if (VALUED.has(k)) {
      const v = argv[++i];
      if (v === undefined) throw new QaUsageError(`--${k} needs a value`);
      vals.set(k, [...(vals.get(k) ?? []), v]);
    } else bools.add(k);
  }
  return { pos, one: (n: string) => vals.get(n)?.at(-1), many: (n: string) => vals.get(n) ?? [], has: (n: string) => bools.has(n) };
}

function repoRoot(): string {
  const r = spawnSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf-8" });
  if (r.status !== 0) throw new QaUsageError(`not inside a git checkout: ${process.cwd()}`);
  return r.stdout.trim();
}

// One answer for this writer and for `gen-docs-pages.ts`, which reads the state
// to name the entry its result links point at (bean `bejf`).
const defaultState = () => siteFetchStatePath();

function annotate(level: "notice" | "warning" | "error", msg: string): void {
  // A GitHub annotation in CI, a plain line elsewhere; the text is the same.
  console.log(process.env.GITHUB_ACTIONS ? `::${level} title=qa-site-assets::${msg}` : `${level}: ${msg}`);
}

function cmdFetch(a: ReturnType<typeof args>): number {
  const ref = a.one("ref");
  const resultsRel = a.one("results");
  if (!ref || !resultsRel) throw new QaUsageError("fetch needs --ref <ref> and --results <dir>");
  const root = repoRoot();
  const results = resolve(root, resultsRel);
  const requested = [ref, ...a.many("fallback")];
  const local = { ...countResults(results), corpus: holdsCorpus(results) };

  const scratch = mkdtempSync(join(tmpdir(), "qa-site-assets-"));
  const attempts: QaFetchState["attempts"] = [];
  let hit: { index: number; key: string; counts: QaAssetCounts } | undefined;
  try {
    for (const [index, r] of requested.entries()) {
      const into = join(scratch, String(index));
      const f = fetchQa({ ref: r, into }, { repoRoot: root });
      attempts.push({ ref: r, state: f.state, ...(f.reason ? { reason: f.reason } : {}) });
      if (f.state === "hit") {
        hit = { index, key: f.key!, counts: countResults(join(into, resultsRel)) };
        break;
      }
    }
    const d = decideSource(local, hit);
    if (hit && d.source !== "checkout") {
      // Materialise the WHOLE entry: the generator reads block, translation
      // and kg sidecars across every instance's results tree, not only the
      // tree this build publishes from.
      cpSync(join(scratch, String(hit.index)), root, { recursive: true });
    }
    const state: QaFetchState = {
      $schema: STATE_SCHEMA,
      source: d.source,
      requested,
      ...(hit ? { key: hit.key } : {}),
      reason: d.reason,
      expected: d.expected,
      attempts,
    };
    const out = a.one("state") ?? defaultState();
    mkdirSync(resolve(out, ".."), { recursive: true });
    writeFileSync(out, JSON.stringify(state, null, 2) + "\n");

    for (const t of attempts) console.log(`  ${t.state === "hit" ? "✓" : "·"} ${t.ref}: ${t.state}${t.reason ? ` — ${t.reason}` : ""}`);
    console.log(
      `qa-site-assets: source ${d.source.toUpperCase()} — ${d.reason}\n` +
        `  expected: ${d.expected.witnesses} witness file(s), ${d.expected.results} *.qa-results.json (state → ${out})`,
    );
    if (d.source === "unavailable") {
      annotate("warning", d.reason);
      return a.has("require") ? 1 : 0;
    }
    if (d.source === "fetched-fallback") annotate("warning", d.reason);
    return 0;
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}

function cmdVerify(a: ReturnType<typeof args>): number {
  const site = a.one("site");
  const resultsRel = a.one("results");
  if (!site || !resultsRel) throw new QaUsageError("verify needs --site <dir> and --results <dir>");
  const statePath = a.one("state") ?? defaultState();
  if (!existsSync(statePath)) {
    console.error(
      `qa-site-assets: no fetch state at ${statePath} — run \`fetch\` before the docs generator. ` +
        "Without it this step cannot say what the build SHOULD have published, which is the defect it exists for. NOT a pass.",
    );
    return 2;
  }
  const state = JSON.parse(readFileSync(statePath, "utf-8")) as QaFetchState;
  const now = countResults(resolve(repoRoot(), resultsRel));
  const published = countPublished(site);
  const j = judgePublished(state, now, published);
  const qaDir = join(site, "assets", "qa");
  mkdirSync(qaDir, { recursive: true });
  writeFileSync(join(qaDir, AVAILABILITY_FILE), JSON.stringify(j.availability, null, 2) + "\n");
  console.log(
    `qa-site-assets: published ${published.witnesses} witness file(s) and ${published.results} *.qa-results.json ` +
      `from source ${state.source.toUpperCase()}${state.key ? ` (${state.key})` : ""}; ` +
      `expected ${state.expected.witnesses} and ${state.expected.results} → ${join(qaDir, AVAILABILITY_FILE)}`,
  );
  for (const w of j.warnings) annotate("warning", w);
  for (const e of j.errors) annotate("error", e);
  return j.errors.length ? 1 : 0;
}

export function main(argv: string[]): number {
  const a = args(argv);
  switch (a.pos[0]) {
    case "fetch":
      return cmdFetch(a);
    case "verify":
      return cmdVerify(a);
    default:
      throw new QaUsageError(`unknown command "${a.pos[0] ?? ""}" — fetch | verify`);
  }
}

if (import.meta.main) {
  let code: number;
  try {
    code = main(process.argv.slice(2));
  } catch (e) {
    if (e instanceof QaUsageError) {
      console.error(`qa-site-assets: ${e.message}`);
      code = 2;
    } else {
      console.error(`qa-site-assets: could not determine — ${(e as Error).message}. This is NOT a pass.`);
      code = 2;
    }
  }
  process.exit(code);
}
