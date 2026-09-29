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

function index(t: GraphTarget, docs: string[] | undefined, opts: LsiOptions) {
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
}

function audit(strict: boolean): number {
  const rows: Array<Record<string, unknown>> = [];
  let failing = 0;
  for (const t of proseGraphs()) {
    const units = unitsOf(t.absPath, t.graphKinds);
    const words = units.reduce((s, u) => s + tokenize(u.text).length, 0);
    const needs = units.length >= NEED_UNITS && words >= NEED_WORDS;
    const sc = sidecarPath(t);
    let result: "pass" | "fail" | "n/a";
    let detail: string;
    if (t.graphKinds.some((k) => ON_DEMAND_KINDS.has(k))) {
      result = "n/a";
      detail = `state graph — indexed on demand, never committed (${units.length} units)`;
    } else if (!needs) {
      result = "n/a";
      detail = `below threshold (${units.length} units, ${words} words)`;
    } else if (!existsSync(sc)) {
      result = "fail";
      detail = `needs an index (${units.length} units, ${words} words) and has none`;
    } else {
      const s = JSON.parse(readFileSync(sc, "utf8"));
      const fp = fingerprintUnits(units, s.options);
      result = fp === s.fingerprint ? "pass" : "fail";
      detail = result === "pass" ? `fresh (${units.length} units)` : `stale — the graph changed since ${relative(REPO, sc)} was built`;
    }
    if (result === "fail") failing++;
    rows.push({ instance: t.instance, graph: t.id, path: relative(REPO, t.absPath), kinds: t.graphKinds, units: units.length, words, result, detail });
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
    const text = process.argv[3];
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
  } else if (cmd === "audit") {
    process.exit(audit(process.argv.includes("--strict")));
  } else {
    console.log(readFileSync(import.meta.path, "utf8").split("\n").slice(9, 16).join("\n").replace(/^ \* ?/gm, ""));
    process.exit(cmd ? 2 : 0);
  }
}

