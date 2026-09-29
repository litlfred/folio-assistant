#!/usr/bin/env bun
/**
 * Latent Semantic Indexing over the declared knowledge graphs — build a
 * per-graph index sidecar, query it, check it is fresh, and audit which graphs
 * need one.
 *
 * @covers library, skills, beans, folio, docs, methodology, memory, policies, glossary
 *
 * Method: `methodologies/lsi.md`. Engine: `content/pipeline/lsi.ts`. Skill:
 * `skills/graph-management/lsi-indexing.md`.
 *
 * ## Subcommands
 *
 *   bun run lsi index  [--instance <name>] [--graph <id>] [--doc <slug>…] [--k N]
 *   bun run lsi query  "<text>" [--instance <name>] [--graph <id>] [--doc <slug>…] [--top N]
 *   echo "<text>" | bun run lsi query --instance <name> --graph <id>   # the Tool node's form
 *   bun run lsi audit  [--strict]      # which graphs need an index; is each fresh?
 *
 * ## What is committed, and why not the vectors
 *
 * The sidecar under `cat-harness/test/results/lsi/<instance>/<graph>.lsi.json`
 * carries the input fingerprint, the parameters, the retained variance, the
 * top-loading terms at each pole of the first dimensions, each unit's nearest
 * neighbours, and two kinds of finding. It does NOT carry `U` or `V`: a
 * rebuild is about a second at this corpus size, and a multi-megabyte float
 * dump is not something a reviewer can judge. What a reviewer CAN judge — do
 * the dimensions make sense, are the neighbours plausible — is what is kept.
 *
 * ## The need-an-index rule, and its basis
 *
 * A graph NEEDS an index when it holds at least `NEED_UNITS` text units and
 * `NEED_WORDS` words. **Basis: a house threshold, not from the method.** The
 * 1990 paper gives no corpus-size rule. The two numbers encode the case the
 * method exists for — more prose than one reader holds in a sitting, so a
 * change of vocabulary between two units goes unnoticed — and they are here,
 * named, so a reviewer can move them. Below either threshold the result is
 * `n/a`, not `pass`: a small graph was not judged to be fine, it was not
 * judged.
 *
 * It REPORTS by default (exit 0 with findings), like `check:methodology-
 * evidence`; `--strict` fails on a needed-but-missing or stale index.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { declaredGraphs, instanceRootsIn } from "../schemas/cat-harness";
import { buildQaResult, writeQaResult } from "./qa-results.ts";
import {
  buildLsi,
  dimensionSummaries,
  fingerprintUnits,
  neighboursOf,
  query,
  tokenize,
  type LsiIndex,
  type LsiOptions,
  type LsiUnit,
} from "../content/pipeline/lsi";

const REPO = resolve(import.meta.dir, "../..");
const RESULTS = join(REPO, "cat-harness/test/results/lsi");
/** Where `gen-lsi-viz.ts` writes; never a unit of any index (see `unitsOf`). */
export const VIEWER_DIR = join(REPO, "cat-harness/docs/lsi") + "/";

export const NEED_UNITS = 100;
export const NEED_WORDS = 20_000;
/** Graph kinds whose files are prose a reader reads. `code`, `schemas`,
 *  `tools` and the like are indexed by their own structure, not by LSI. */
const PROSE_KINDS = new Set(["library", "skills", "beans", "folio", "docs", "methodology", "memory", "policies", "glossary"]);
const DEFAULT_OPTS: LsiOptions = { k: 100, weighting: "log-entropy", minDf: 2, maxDfShare: 0.5, powerIterations: 4, seed: 1990 };
/** State graphs change on nearly every commit: a committed index would be
 *  stale on every PR and a merge-conflict magnet, so they are rebuilt on
 *  demand (`lsi:epics` does) and the audit does not ask for a sidecar. */
const ON_DEMAND_KINDS = new Set(["beans"]);
/** A unit shorter than this carries too little vocabulary to place. */
const MIN_TOKENS = 20;

// ─── Unit extraction ─────────────────────────────────────────────────────────

function walk(dir: string, out: string[] = []): string[] {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (e.name.startsWith(".") || e.name === "node_modules") continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.isFile() && e.name.endsWith(".md")) out.push(p);
  }
  return out;
}

/** A library's unit is a SECTION — the chunking ingestion already produced.
 *  Everything else: one markdown file per unit. */
export function unitsOf(absPath: string, graphKinds: string[], docs?: string[]): LsiUnit[] {
  let files: string[];
  if (graphKinds.includes("library")) {
    const slugs = docs?.length ? docs : readdirSync(absPath, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
    files = slugs.flatMap((s) => {
      const sec = join(absPath, s, "sections");
      return existsSync(sec) ? readdirSync(sec).filter((f) => f.endsWith(".md")).sort().map((f) => join(sec, f)) : [];
    });
  } else {
    files = walk(absPath).sort();
  }
  return files
    // The index viewer's own page reports on the indexes; indexing it would
    // make every regeneration stale the index it reports on, and the page
    // would never reach a fixed point (the self-reference class of bean 1xrg).
    .filter((f) => !f.startsWith(VIEWER_DIR))
    .map((f) => ({ id: relative(REPO, f), text: readFileSync(f, "utf8") }))
    .filter((u) => tokenize(u.text).length >= MIN_TOKENS);
}

export interface GraphTarget {
  instance: string;
  id: string;
  graphKinds: string[];
  absPath: string;
}

export function proseGraphs(): GraphTarget[] {
  // A directory is declared again by every instance that sees it — a
  // dependency's graph by each dependent, a sibling's library by the harness.
  // Index it once, attributed to the instance whose ROOT contains it (the
  // owner), falling back to the first declarer for a repository-scoped path.
  const byPath = new Map<string, GraphTarget & { rootLen: number }>();
  for (const root of instanceRootsIn(REPO)) {
    for (const g of declaredGraphs(root)) {
      if (!g.absPath || !existsSync(g.absPath) || !statSync(g.absPath).isDirectory()) continue;
      if (!g.graphKinds.some((k) => PROSE_KINDS.has(k))) continue;
      const owns = g.absPath.startsWith(root + "/") ? root.length : -1;
      const prev = byPath.get(g.absPath);
      if (prev && prev.rootLen >= owns) continue;
      byPath.set(g.absPath, { instance: g.declaredBy, id: g.id, graphKinds: g.graphKinds, absPath: g.absPath, rootLen: owns });
    }
  }
  return [...byPath.values()]
    .map(({ rootLen: _r, ...t }) => t)
    .sort((a, b) => (a.instance + a.id < b.instance + b.id ? -1 : 1));
}

function sidecarPath(t: GraphTarget, docs?: string[]): string {
  const suffix = docs?.length ? `.${docs.join("+")}` : "";
  return join(RESULTS, t.instance, `${t.id}${suffix}.lsi.json`);
}

/** The committed per-graph index sidecar, `folio-lsi-index/v1`. */
export interface LsiSidecar {
  $schema: "folio-lsi-index/v1";
  method: string;
  instance: string;
  graph: string;
  path: string;
  docs: string[] | null;
  fingerprint: string;
  options: LsiOptions;
  units: number;
  terms: number;
  k: number;
  retained: number;
  dimensions: Array<{ dim: number; sigma: number; positive: string[]; negative: string[] }>;
  findings: {
    nearDuplicates: Array<{ a: string; b: string; cosine: number }>;
    narrowDimensions: Array<{ dim: number; units: string[] }>;
  };
  neighbours: Record<string, Array<[string, number]>>;
}

// ─── Findings ────────────────────────────────────────────────────────────────

/** Two units this close are near-duplicates: one may restate the other. */
const DUPLICATE_COSINE = 0.95;

function findings(index: LsiIndex) {
  const dupes: Array<{ a: string; b: string; cosine: number }> = [];
  const neighbours: Record<string, Array<[string, number]>> = {};
  for (const id of index.unitIds) {
    const nn = neighboursOf(index, id, 3);
    neighbours[id] = nn.map((h) => [h.id, Number(h.cosine.toFixed(3))]);
    for (const h of nn) if (h.cosine >= DUPLICATE_COSINE && id < h.id) dupes.push({ a: id, b: h.id, cosine: Number(h.cosine.toFixed(3)) });
  }
  // A dimension carried by very few units is an outlier cluster — boilerplate,
  // specimen text, a mis-extracted page — rather than a theme of the graph.
  const narrow: Array<{ dim: number; units: string[] }> = [];
  const n = index.unitIds.length;
  for (let c = 0; c < Math.min(20, index.k); c++) {
    const mass = index.unitIds.map((id, j) => [id, index.unitCoords[j * index.k + c] ** 2] as const);
    const total = mass.reduce((s, [, m]) => s + m, 0);
    mass.sort((a, b) => b[1] - a[1]);
    let acc = 0;
    const carriers: string[] = [];
    for (const [id, m] of mass) {
      acc += m;
      carriers.push(id);
      if (acc >= 0.8 * total) break;
    }
    if (carriers.length <= Math.max(3, Math.floor(0.01 * n))) narrow.push({ dim: c + 1, units: carriers });
  }
  return { dupes, narrow, neighbours };
}

// ─── Commands ────────────────────────────────────────────────────────────────

export function index(t: GraphTarget, docs: string[] | undefined, opts: LsiOptions = DEFAULT_OPTS): LsiSidecar {
  const units = unitsOf(t.absPath, t.graphKinds, docs);
  const t0 = performance.now();
  const ix = buildLsi(units, opts);
  const ms = Math.round(performance.now() - t0);
  const f = findings(ix);
  const sidecar: LsiSidecar = {
    $schema: "folio-lsi-index/v1",
    method: "cat-harness/methodologies/lsi.md",
    instance: t.instance,
    graph: t.id,
    path: relative(REPO, t.absPath),
    docs: docs ?? null,
    fingerprint: ix.fingerprint,
    options: opts,
    units: units.length,
    terms: ix.terms.length,
    k: ix.k,
    retained: Number(ix.retained.toFixed(4)),
    dimensions: dimensionSummaries(ix, 12, 8),
    findings: {
      nearDuplicates: f.dupes,
      narrowDimensions: f.narrow,
    },
    neighbours: f.neighbours,
  };
  const out = sidecarPath(t, docs);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(sidecar, null, 2) + "\n");
  console.log(
    `${t.instance}/${t.id}${docs ? ` [${docs.join(", ")}]` : ""}: ${units.length} units, ${ix.terms.length} terms, k=${ix.k}, retained ${(ix.retained * 100).toFixed(1)}%, ${ms} ms` +
      ` — ${f.dupes.length} near-duplicate pair(s), ${f.narrow.length} narrow dimension(s) → ${relative(REPO, out)}`,
  );
  return sidecar;
}

/**
 * Rebuild the index of the library that holds `libraryDir`, and say what it
 * found about one newly promoted document. Called by `ingest --promote`
 * (option B, bean `ansc`): a promotion changes the library, so its index is
 * stale by construction (method step 7), and the two ingestion findings LSI
 * gives — outlier dimensions and near-duplicate sections — are cheapest to
 * act on while the document is fresh. ADVISORY: returns lines to print and
 * never throws, because an index is not part of L1 and must not fail an
 * ingest that met every L1 requirement.
 */
export function refreshLibraryIndex(libraryDir: string, slug: string): string[] {
  try {
    const abs = resolve(libraryDir);
    const t = proseGraphs().find((g) => g.absPath === abs || g.absPath === abs + "/");
    if (!t) return [`  · lsi: ${relative(REPO, abs)} is not a declared prose graph — no index to refresh`];
    const sc = index(t, undefined);
    const mine = (id: string) => id.includes(`/${slug}/`);
    const dupes = sc.findings.nearDuplicates.filter((d) => mine(d.a) || mine(d.b));
    const narrow = sc.findings.narrowDimensions.filter((d) => d.units.some(mine));
    const out = [`  · lsi: ${t.instance}/${t.id} re-indexed (${sc.units} units); this document: ${dupes.length} near-duplicate pair(s), ${narrow.length} narrow dimension(s)`];
    for (const d of dupes.slice(0, 5)) out.push(`      near-duplicate ${d.cosine}: ${relative(REPO, join(REPO, d.a))} ~ ${relative(REPO, join(REPO, d.b))}`);
    for (const d of narrow) out.push(`      narrow dimension ${d.dim} (boilerplate, specimen text or a bad page?): ${d.units.join(", ")}`);
    return out;
  } catch (e) {
    return [`  · lsi: index NOT refreshed — ${(e as Error).message}. Run \`bun run lsi index\` for this library; this is not a pass.`];
  }
}

export interface GraphVerdict {
  result: "pass" | "fail" | "n/a";
  /** Human detail WITH counts — for the console and the qa-results file. */
  detail: string;
  /** The same verdict with NO counts, for the kg:audit sidecar: it changes
   *  only when the verdict does, so an edit that keeps an index fresh (or
   *  keeps it missing) does not make the committed audit stale. */
  stableDetail: string;
  units: number;
  words: number;
}

/** Does this graph need an LSI index, and is the one it has fresh? One answer
 *  for `lsi:audit` and for kg:audit's `lsi-index-fresh`. */
export function graphVerdict(t: GraphTarget): GraphVerdict {
  const us = unitsOf(t.absPath, t.graphKinds);
  const units = us.length;
  const words = us.reduce((s, u) => s + tokenize(u.text).length, 0);
  const sc = sidecarPath(t);
  if (t.graphKinds.some((k) => ON_DEMAND_KINDS.has(k)))
    return { result: "n/a", detail: `state graph — indexed on demand, never committed (${units} units)`, stableDetail: "state graph — indexed on demand, never committed", units, words };
  if (!(units >= NEED_UNITS && words >= NEED_WORDS))
    return { result: "n/a", detail: `below threshold (${units} units, ${words} words)`, stableDetail: "below the need-an-index threshold — not judged", units, words };
  if (!existsSync(sc))
    return { result: "fail", detail: `needs an index (${units} units, ${words} words) and has none`, stableDetail: `needs an LSI index and has none — run \`bun run lsi index --instance ${t.instance} --graph ${t.id}\``, units, words };
  const s = JSON.parse(readFileSync(sc, "utf8")) as LsiSidecar;
  const fresh = fingerprintUnits(us, s.options) === s.fingerprint;
  return fresh
    ? { result: "pass", detail: `fresh (${units} units)`, stableDetail: "fresh", units, words }
    : { result: "fail", detail: `stale — the graph changed since ${relative(REPO, sc)} was built`, stableDetail: `stale — re-run \`bun run lsi index --instance ${t.instance} --graph ${t.id}\``, units, words };
}

function audit(strict: boolean): number {
  const rows: Array<Record<string, unknown>> = [];
  let failing = 0;
  for (const t of proseGraphs()) {
    const { result, detail, units, words } = graphVerdict(t);
    if (result === "fail") failing++;
    rows.push({ instance: t.instance, graph: t.id, path: relative(REPO, t.absPath), kinds: t.graphKinds, units, words, result, detail });
    console.log(`${result.padEnd(4)}  ${`${t.instance}/${t.id}`.padEnd(40)} ${detail}`);
  }
  const failed = (pred: (d: string) => boolean) =>
    rows.filter((r) => r.result === "fail" && pred(String(r.detail))).map(({ instance, graph, path, units, words, detail }) => ({ instance, graph, path, units, words, detail }));
  const out = writeQaResult(
    join(REPO, "cat-harness"),
    "lsi-need-an-index",
    buildQaResult({
      script: "cat-harness/scripts/lsi.ts",
      scriptAbsPath: import.meta.path,
      subject: { kind: "corpus", id: "declared-prose-graphs" },
      families: {
        "index-missing": {
          summary:
            `A declared prose graph with >= ${NEED_UNITS} units and >= ${NEED_WORDS} words has no LSI index sidecar. ` +
            "Basis: a HOUSE threshold, not from the method (the 1990 paper gives no corpus-size rule) — more prose than one " +
            "reader holds in a sitting, so a change of vocabulary between two units goes unnoticed. Graphs below either " +
            "threshold are not judged (n/a, not pass); state graphs (beans) are indexed on demand and never asked for one.",
          entries: failed((d) => d.startsWith("needs")),
        },
        "index-stale": {
          summary: "An LSI index sidecar whose input fingerprint no longer matches the graph: built before the graph last changed.",
          entries: failed((d) => d.startsWith("stale")),
        },
      },
    }),
  );
  console.log(`\n${failing} graph(s) need an index they do not have, or have a stale one. → ${relative(REPO, out)}`);
  return strict && failing > 0 ? 1 : 0;
}

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : undefined;
}
function args(name: string): string[] | undefined {
  const out: string[] = [];
  process.argv.forEach((a, i) => { if (a === `--${name}` && process.argv[i + 1]) out.push(process.argv[i + 1]); });
  return out.length ? out : undefined;
}

function targets(): GraphTarget[] {
  const inst = arg("instance");
  const gid = arg("graph");
  const all = proseGraphs().filter((t) => (!inst || t.instance === inst) && (!gid || t.id === gid));
  if (!all.length) {
    console.error(`no prose graph matches --instance ${inst ?? "*"} --graph ${gid ?? "*"}`);
    process.exit(2);
  }
  return all;
}

if (import.meta.main) {
  const cmd = process.argv[2];
  const opts: LsiOptions = { ...DEFAULT_OPTS, ...(arg("k") ? { k: Number(arg("k")) } : {}) };
  if (cmd === "index") {
    for (const t of targets()) {
      try {
        index(t, args("doc"), opts);
      } catch (e) {
        console.log(`${t.instance}/${t.id}: not indexed — ${(e as Error).message}`);
      }
    }
  } else if (cmd === "query") {
    // The query on STDIN when no positional is given — the Tool node's form,
    // since free text never goes on a command line (check:tools).
    const text = process.argv[3] && !process.argv[3].startsWith("--") ? process.argv[3] : (await Bun.stdin.text()).trim();
    const top = Number(arg("top") ?? 10);
    for (const t of targets()) {
      const units = unitsOf(t.absPath, t.graphKinds, args("doc"));
      if (units.length < 3) continue;
      const ix = buildLsi(units, opts);
      console.log(`# ${t.instance}/${t.id} — latent hits (cosine in the k=${ix.k} space; NOT a lexical match)`);
      const words = tokenize(text);
      for (const h of query(ix, text, top)) {
        const body = units.find((u) => u.id === h.id)!.text.toLowerCase();
        const lexical = words.some((w) => body.includes(w));
        console.log(`  ${h.cosine.toFixed(3)}  ${lexical ? "lexical+latent" : "latent only   "}  ${h.id}`);
      }
    }
  } else if (cmd === "check") {
    // Strict freshness for the graphs selected — the verify half of a
    // `skill:register` step (`lsi:skills` / `lsi:skills:check`).
    let bad = 0;
    for (const t of targets()) {
      const v = graphVerdict(t);
      if (v.result === "fail") bad++;
      console.log(`${v.result.padEnd(4)}  ${t.instance}/${t.id}  ${v.detail}`);
    }
    process.exit(bad ? 1 : 0);
  } else if (cmd === "audit") {
    process.exit(audit(process.argv.includes("--strict")));
  } else {
    console.log(readFileSync(import.meta.path, "utf8").split("\n").slice(9, 16).join("\n").replace(/^ \* ?/gm, ""));
    process.exit(cmd ? 2 : 0);
  }
}

