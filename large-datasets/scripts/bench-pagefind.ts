#!/usr/bin/env bun
/**
 * Measure Pagefind on the same corpus the prefix-sharded identifier lookup
 * was measured on, so the two can be read side by side.
 *
 * @module large-datasets/scripts/bench-pagefind
 *
 * Bean `folio-assistant-4pm8`. Owner, 2026-09-24: "Prototype Pagefind in
 * large-datasets". This script is the method; the numbers are recorded in the
 * bean. Pagefind is a dev dependency used by THIS subgraph only. The plain
 * docs pipeline loads none of it, and `pagefind-guard.test.ts` fails if a
 * file under `cat-harness/docs/` starts to.
 *
 * ## The corpus is the one `bench-id-lookup.ts` measured
 *
 * The 10 real referenced who-iris nodes plus `--items` synthetic items
 * (default 273,559), from `syntheticCorpus()` with its default seed. Same ids,
 * same titles, same urls, byte for byte, so a difference in the numbers is a
 * difference between the engines and not between the corpora. Synthetic at
 * scale, and an extrapolation: see that script's module comment.
 *
 * ## One record per node, title only
 *
 * Each node is a Pagefind custom record: `content` is the title, `meta.title`
 * the title, and `url` the source URL. The id is NOT indexed unless
 * `--index-ids` is given (it then goes in `meta.id`, which Pagefind indexes),
 * because the question under measurement is title search; `--index-ids`
 * measures what indexing the ids as well costs, and how they tokenise.
 *
 * ## What it reports
 *
 * - size: file count by kind, bytes as written (Pagefind gzips its index,
 *   fragment and meta files itself) and uncompressed, and the fragment and
 *   index-chunk size distributions;
 * - build time (records added through Pagefind's Node API, then written);
 * - with `--browser`, in Chromium via Playwright against a local static
 *   server that does no content-encoding, unthrottled and at slow 4G (150 ms
 *   RTT, 1.6 Mbit/s down, the profile `bench-id-lookup.ts` used): bytes
 *   transferred for the first query (which loads the runtime) and for each
 *   later one, query latency p50/p95/max, JS heap after a forced GC, and the
 *   renderer processes' resident memory, because Pagefind's index lives in
 *   WebAssembly memory, which the JS heap figure does not count;
 * - recall: for a seeded sample of items, whether the item itself is in the
 *   top 10 for (a) its whole title and (b) three consecutive words of it, and
 *   how many items in the corpus contain every word of the query, which is
 *   the ceiling any engine's top 10 is under;
 * - ids: whether an item's UUID, and its full `item/<uuid>` id, find it.
 *
 * Everything is seeded, so two runs build the same corpus and ask the same
 * queries. Pagefind's own output is not byte-stable across runs (its file
 * names carry hashes); its sizes are.
 *
 * Usage:
 *   bun run pagefind:bench [--items N] [--browser] [--queries N] [--index-ids] [--worker] [--via-html] [--out DIR]
 *   bun run pagefind:fixture                        # build the small committed fixture for the page
 *   bun run pagefind:fixture --write-fixture        # regenerate the fixture's records
 */
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import { gunzipSync, gzipSync } from "node:zlib";

import type { IdEntry } from "../schemas/id-lookup.js";
import { rng, syntheticCorpus, titleWords } from "./bench-id-lookup.js";
import { catalogueNodesDir, referencedEntries, SOURCE } from "./gen-id-lookup.js";

const INSTANCE = resolve(import.meta.dir, "..");

/** The committed fixture: the real referenced nodes plus a few seeded synthetic items. */
export const FIXTURE = join(INSTANCE, "pagefind", "fixture.json");
/** How many synthetic items the fixture carries beside the real nodes. */
export const FIXTURE_ITEMS = 40;
/** Where the fixture index is built. Git-ignored (`build/`): Pagefind output is never committed. */
export const FIXTURE_BUILD = join(INSTANCE, "pagefind", "build", "fixture");

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1]! : fallback;
}

function pct(sorted: number[], p: number): number {
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))]!;
}

/** The corpus `bench-id-lookup.ts` measures, built by its own generator. */
export function corpus(items: number, titleMax = 180): IdEntry[] {
  return syntheticCorpus(referencedEntries(catalogueNodesDir(SOURCE)), items, titleMax, titleWords());
}

/** The fixture's records, as the generator makes them now. The committed file must equal this. */
export function fixtureRecords(): IdEntry[] {
  return corpus(FIXTURE_ITEMS);
}

export function readFixture(): IdEntry[] {
  return JSON.parse(readFileSync(FIXTURE, "utf8")) as IdEntry[];
}

/** Stable text for the fixture file. */
export function fixtureText(entries: IdEntry[]): string {
  return JSON.stringify(entries, null, 2) + "\n";
}

/**
 * The Pagefind record for one node. Pagefind indexes a record's `meta`
 * values as well as its `content` (measured: with the id in `meta.id` and
 * not in the content, a UUID query finds the item), so the id is left out
 * of `meta` too unless `--index-ids` asks for it. The url carries the UUID
 * either way; Pagefind does not index urls.
 */
export function record(e: IdEntry, indexIds = false): { url: string; content: string; language: string; meta: Record<string, string> } {
  return { url: e.url, content: e.title, language: "en", meta: indexIds ? { title: e.title, id: e.id } : { title: e.title } };
}

/**
 * Build a Pagefind bundle for `entries` into `<outDir>/pagefind/`.
 * Records are sent through Pagefind's Node API in concurrent batches; the
 * native binary does the indexing.
 */
export async function buildPagefind(entries: IdEntry[], outDir: string, opts: { indexIds?: boolean } = {}): Promise<{ addMs: number; writeMs: number; bundle: string }> {
  if (entries.length === 0) throw new Error("refusing to build a Pagefind index over zero records");
  const pagefind = await import("pagefind");
  const bundle = join(outDir, "pagefind");
  rmSync(bundle, { recursive: true, force: true });
  const t0 = performance.now();
  const { index, errors } = await pagefind.createIndex({ forceLanguage: "en" });
  if (!index || errors.length) throw new Error(`pagefind.createIndex: ${errors.join("; ")}`);
  const BATCH = 1000;
  for (let i = 0; i < entries.length; i += BATCH) {
    const res = await Promise.all(entries.slice(i, i + BATCH).map((e) => index.addCustomRecord(record(e, opts.indexIds))));
    const bad = res.find((r) => r.errors.length);
    if (bad) throw new Error(`pagefind.addCustomRecord: ${bad.errors.join("; ")}`);
  }
  const t1 = performance.now();
  const w = await index.writeFiles({ outputPath: bundle });
  if (w.errors.length) throw new Error(`pagefind.writeFiles: ${w.errors.join("; ")}`);
  const t2 = performance.now();
  await index.deleteIndex();
  await pagefind.close();
  return { addMs: t1 - t0, writeMs: t2 - t1, bundle };
}

const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * The other route Pagefind offers: minimal static HTML pages on disk, one per
 * node, indexed with `addDirectory` (the CLI's own path, which parallelises
 * the parsing). Written under `outDir/site/`, a scratch directory. Measured
 * for build time and size only: the result urls are the local pages', not
 * the source's, so recall is read off the custom-record build.
 */
export async function buildPagefindFromHtml(entries: IdEntry[], outDir: string): Promise<{ addMs: number; writeMs: number; emitMs: number; bundle: string }> {
  if (entries.length === 0) throw new Error("refusing to build a Pagefind index over zero records");
  const site = join(outDir, "site");
  rmSync(site, { recursive: true, force: true });
  const t0 = performance.now();
  entries.forEach((e, i) => {
    const d = join(site, "n", String(Math.floor(i / 1000)));
    if (i % 1000 === 0) mkdirSync(d, { recursive: true });
    const t = esc(e.title);
    writeFileSync(join(d, `${i}.html`), `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${t}</title></head><body><h1>${t}</h1></body></html>`);
  });
  const emitMs = performance.now() - t0;
  const pagefind = await import("pagefind");
  const bundle = join(outDir, "pagefind");
  rmSync(bundle, { recursive: true, force: true });
  const t1 = performance.now();
  const { index, errors } = await pagefind.createIndex({ forceLanguage: "en" });
  if (!index || errors.length) throw new Error(`pagefind.createIndex: ${errors.join("; ")}`);
  const r = await index.addDirectory({ path: site });
  if (r.errors.length) throw new Error(`pagefind.addDirectory: ${r.errors.join("; ")}`);
  if (r.page_count !== entries.length) throw new Error(`pagefind.addDirectory indexed ${r.page_count} pages of ${entries.length}`);
  const t2 = performance.now();
  const w = await index.writeFiles({ outputPath: bundle });
  if (w.errors.length) throw new Error(`pagefind.writeFiles: ${w.errors.join("; ")}`);
  const t3 = performance.now();
  await index.deleteIndex();
  await pagefind.close();
  return { emitMs, addMs: t2 - t1, writeMs: t3 - t2, bundle };
}

/** Which part of the bundle a file is. `ui` is Pagefind's optional prebuilt UI, which a search does not load. */
export function kindOf(rel: string): "fragment" | "index" | "filter" | "meta" | "wasm" | "runtime" | "ui" | "other" {
  if (rel.startsWith("fragment/")) return "fragment";
  if (rel.startsWith("index/")) return "index";
  if (rel.startsWith("filter/")) return "filter";
  if (rel.endsWith(".pf_meta")) return "meta";
  if (rel.startsWith("wasm.")) return "wasm";
  if (rel === "pagefind.js" || rel === "pagefind-worker.js" || rel === "pagefind-entry.json") return "runtime";
  if (/^pagefind-(component-ui|modular-ui|ui|highlight)\./.test(rel)) return "ui";
  return "other";
}

function isGzip(b: Buffer): boolean {
  return b.length > 2 && b[0] === 0x1f && b[1] === 0x8b;
}

export interface KindSize {
  files: number;
  /** Bytes as written. Pagefind writes its index, fragment, meta and wasm files already gzipped. */
  bytes: number;
  /** Bytes after gunzip, for files Pagefind wrote gzipped; the same as `bytes` otherwise. */
  uncompressedBytes: number;
  /** Bytes a static host would send with gzip: the file as written if already gzipped, gzip -9 of it otherwise. */
  servedGzipBytes: number;
}

export interface PagefindSizeReport {
  records: number;
  meanTitleChars: number;
  indexIds: boolean;
  addMs: number;
  writeMs: number;
  buildMs: number;
  /** Everything a search can load: runtime, wasm, meta, index chunks, fragments, filters. Excludes the optional UI. */
  search: KindSize;
  byKind: Record<string, KindSize>;
  fragmentBytes: { p50: number; p95: number; max: number };
  indexChunkBytes: { p50: number; p95: number; max: number };
  bytesPerRecord: number;
}

function walk(dir: string, base = dir): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p, base));
    else out.push(relative(base, p));
  }
  return out.sort();
}

export function sizeReport(bundle: string, entries: IdEntry[], timing: { addMs: number; writeMs: number }, indexIds: boolean): PagefindSizeReport {
  const byKind: Record<string, KindSize> = {};
  const frag: number[] = [];
  const chunk: number[] = [];
  const search: KindSize = { files: 0, bytes: 0, uncompressedBytes: 0, servedGzipBytes: 0 };
  for (const rel of walk(bundle)) {
    const buf = readFileSync(join(bundle, rel));
    const gz = isGzip(buf);
    const unc = gz ? gunzipSync(buf).length : buf.length;
    const served = gz ? buf.length : gzipSync(buf, { level: 9 }).length;
    const k = kindOf(rel);
    const s = (byKind[k] ??= { files: 0, bytes: 0, uncompressedBytes: 0, servedGzipBytes: 0 });
    for (const t of k === "ui" ? [s] : [s, search]) {
      t.files++;
      t.bytes += buf.length;
      t.uncompressedBytes += unc;
      t.servedGzipBytes += served;
    }
    if (k === "fragment") frag.push(buf.length);
    if (k === "index") chunk.push(buf.length);
  }
  frag.sort((a, b) => a - b);
  chunk.sort((a, b) => a - b);
  const dist = (xs: number[]) => (xs.length ? { p50: pct(xs, 50), p95: pct(xs, 95), max: xs[xs.length - 1]! } : { p50: 0, p95: 0, max: 0 });
  return {
    records: entries.length,
    meanTitleChars: entries.reduce((s, e) => s + e.title.length, 0) / entries.length,
    indexIds,
    addMs: timing.addMs,
    writeMs: timing.writeMs,
    buildMs: timing.addMs + timing.writeMs,
    search,
    byKind,
    fragmentBytes: dist(frag),
    indexChunkBytes: dist(chunk),
    bytesPerRecord: search.bytes / entries.length,
  };
}

/** Lower-cased word tokens, the way a reader would type them. */
export function words(s: string): string[] {
  return s.toLowerCase().split(/[^a-z0-9']+/).filter(Boolean);
}

export interface Query {
  kind: "title" | "words" | "uuid" | "id";
  q: string;
  /** The url of the item the query was made from. */
  expect: string;
  /** Items whose title contains every word of the query: more than 10 and no engine can promise the item a top-10 place. */
  matchingItems?: number;
}

/**
 * The seeded query sample: `n` distinct synthetic items (seed 99, as
 * `bench-id-lookup.ts` picks its lookups), each asked by whole title and by
 * three consecutive whole words of it; and `idQueries` of them by UUID and by
 * full id. A title's last word may be cut mid-word by the generator, so the
 * three-word run is drawn from whole words only.
 */
export function sampleQueries(entries: IdEntry[], n: number, idQueries = 20): Query[] {
  const items = entries.filter((e) => e.id.startsWith("item/"));
  const r = rng(99);
  const pick = new Set<IdEntry>();
  while (pick.size < Math.min(n, items.length)) pick.add(items[Math.floor(r() * items.length)]!);
  const tokenSets = items.map((e) => new Set(words(e.title)));
  const count = (q: string) => {
    const ws = words(q);
    let c = 0;
    for (const s of tokenSets) if (ws.every((w) => s.has(w))) c++;
    return c;
  };
  const out: Query[] = [];
  let i = 0;
  for (const e of pick) {
    out.push({ kind: "title", q: e.title, expect: e.url });
    const ws = e.title.split(/\s+/).slice(0, -1).filter((w) => words(w).length > 0);
    const at = Math.floor(r() * Math.max(1, ws.length - 2));
    const q = ws.slice(at, at + 3).join(" ");
    out.push({ kind: "words", q, expect: e.url, matchingItems: count(q) });
    if (i++ < idQueries) {
      out.push({ kind: "uuid", q: e.id.slice("item/".length), expect: e.url });
      out.push({ kind: "id", q: e.id, expect: e.url });
    }
  }
  return out;
}

export interface QueryResult {
  kind: Query["kind"];
  ms: number;
  bytes: number;
  requests: number;
  hits: number;
  top10: boolean;
  matchingItems?: number;
}

export interface BrowserReport {
  profile: string;
  /** Importing pagefind.js and calling init(). */
  initMs: number;
  /** Bytes settled by the end of init(); `first.bytes` includes them, and everything else the first search needed. */
  initBytes: number;
  worker: boolean;
  first: { ms: number; bytes: number; requests: number };
  subsequent: { bytes: { p50: number; p95: number; max: number; total: number }; requests: { p50: number; max: number } };
  latencyMs: Record<string, { p50: number; p95: number; max: number; n: number }>;
  heap: { baseline: number; afterInit: number; afterQueries: number };
  rendererRss: { baseline: number; afterInit: number; afterQueries: number };
  results: QueryResult[];
}

/** Resident set size of Chromium's renderer processes, from /proc. Linux only; 0 where unreadable. */
async function rendererRss(browserCdp: { send(m: string): Promise<unknown> }): Promise<number> {
  const info = (await browserCdp.send("SystemInfo.getProcessInfo")) as { processInfo: Array<{ type: string; id: number }> };
  let total = 0;
  for (const p of info.processInfo.filter((x) => x.type === "renderer")) {
    try {
      const m = /VmRSS:\s+(\d+) kB/.exec(readFileSync(`/proc/${p.id}/status`, "utf8"));
      if (m) total += Number(m[1]) * 1024;
    } catch {
      /* the process exited between the listing and the read */
    }
  }
  return total;
}

/**
 * `worker: false` (the default here) runs Pagefind on the page's main thread,
 * through its own supported `noWorker` option. That is deliberate: CDP's
 * network throttle and byte counts apply to the PAGE's requests, and in its
 * default mode Pagefind fetches from a Web Worker, which neither would see.
 * The fetches are the same files in both modes. `--worker` runs the default
 * mode, for latency only; its byte counts read zero and are not reported.
 */
async function browserRun(dir: string, queries: Query[], profiles: Array<"unthrottled" | "slow-4g">, worker = false): Promise<BrowserReport[]> {
  const { chromium } = await import("playwright");
  const { resolveChromium } = await import("../../cat-harness/scripts/playwright-chromium.js");
  const choice = resolveChromium(process.env as Record<string, string | undefined>);
  const server = Bun.serve({
    port: 0,
    hostname: "127.0.0.1",
    fetch(req) {
      const p = decodeURIComponent(new URL(req.url).pathname);
      const f = Bun.file(join(dir, p.endsWith("/") ? p + "index.html" : p));
      return f.exists().then((ok) => (ok ? new Response(f) : new Response("not found", { status: 404 })));
    },
  });
  const browser = await chromium.launch({ executablePath: choice.path, args: ["--no-sandbox", "--enable-precise-memory-info"] });
  const bcdp = await browser.newBrowserCDPSession();
  const out: BrowserReport[] = [];
  try {
    for (const profile of profiles) {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      const cdp = await ctx.newCDPSession(page);
      await cdp.send("Network.enable");
      await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
      let bytes = 0;
      let requests = 0;
      // Bytes are attributed to the query that caused them by waiting, after
      // each query, until every request it started has finished.
      const inflight = new Set<string>();
      cdp.on("Network.requestWillBeSent", (e: { requestId: string }) => void inflight.add(e.requestId));
      cdp.on("Network.loadingFinished", (e: { requestId: string; encodedDataLength: number }) => {
        inflight.delete(e.requestId);
        bytes += e.encodedDataLength;
        requests++;
      });
      cdp.on("Network.loadingFailed", (e: { requestId: string }) => void inflight.delete(e.requestId));
      const settle = async () => {
        for (let i = 0; i < 2000 && inflight.size; i++) await new Promise((r) => setTimeout(r, 5));
        if (inflight.size) throw new Error(`${inflight.size} requests never finished`);
      };
      if (profile === "slow-4g") {
        await cdp.send("Network.emulateNetworkConditions", {
          offline: false,
          latency: 150,
          downloadThroughput: (1.6 * 1024 * 1024) / 8,
          uploadThroughput: (750 * 1024) / 8,
        });
      }
      await cdp.send("Performance.enable");
      await page.goto(`http://127.0.0.1:${server.port}/blank.html`);
      const heap = async () => {
        await cdp.send("HeapProfiler.collectGarbage");
        const m = (await cdp.send("Performance.getMetrics")) as { metrics: Array<{ name: string; value: number }> };
        return m.metrics.find((x) => x.name === "JSHeapUsedSize")!.value;
      };
      const heapBase = await heap();
      const rssBase = await rendererRss(bcdp);
      bytes = 0;
      requests = 0;
      const initMs = await page.evaluate(
        async ([spec, noWorker]) => {
          const t = performance.now();
          // A variable specifier: the module is the page's, served beside it, not this script's.
          const pf = await import(spec as string);
          await pf.options({ excerptLength: 0, noWorker });
          await pf.init();
          (window as unknown as { __pf: unknown }).__pf = pf;
          return performance.now() - t;
        },
        ["/pagefind/pagefind.js", !worker] as const,
      );
      await settle();
      const initBytes = bytes;
      const heapInit = await heap();
      const rssInit = await rendererRss(bcdp);
      const results: QueryResult[] = [];
      // The first query's bytes are counted from the import of pagefind.js, not
      // from the query: init() starts fetching the meta file (1.6 MB at full
      // scale) without awaiting it, so where it lands between init and the first
      // query depends on timing. Counting both together is what a reader pays
      // for a first search on the page, and is the same on every run.
      let first = true;
      for (const q of queries) {
        if (!first) {
          bytes = 0;
          requests = 0;
        }
        first = false;
        const r = (await page.evaluate(async (text: string) => {
          type R = { results: Array<{ data(): Promise<{ url: string }> }> };
          const pf = (window as unknown as { __pf: { search(t: string): Promise<R> } }).__pf;
          const t = performance.now();
          const s = await pf.search(text);
          // A reader sees the top 10, so a query is not answered until their titles and urls are loaded.
          const top = await Promise.all(s.results.slice(0, 10).map((x) => x.data()));
          return { ms: performance.now() - t, hits: s.results.length, urls: top.map((d) => d.url) };
        }, q.q)) as { ms: number; hits: number; urls: string[] };
        await settle();
        results.push({ kind: q.kind, ms: r.ms, bytes, requests, hits: r.hits, top10: r.urls.includes(q.expect), matchingItems: q.matchingItems });
      }
      const heapAfter = await heap();
      const rssAfter = await rendererRss(bcdp);
      const later = results.slice(1);
      const lb = later.map((x) => x.bytes).sort((a, b) => a - b);
      const lr = later.map((x) => x.requests).sort((a, b) => a - b);
      const latencyMs: BrowserReport["latencyMs"] = {};
      for (const k of ["title", "words", "uuid", "id"] as const) {
        const ms = results.filter((x) => x.kind === k).map((x) => x.ms).sort((a, b) => a - b);
        if (ms.length) latencyMs[k] = { p50: pct(ms, 50), p95: pct(ms, 95), max: ms[ms.length - 1]!, n: ms.length };
      }
      out.push({
        profile,
        initMs,
        initBytes,
        worker,
        first: { ms: results[0]!.ms, bytes: results[0]!.bytes, requests: results[0]!.requests },
        subsequent: {
          bytes: { p50: pct(lb, 50), p95: pct(lb, 95), max: lb[lb.length - 1]!, total: lb.reduce((a, b) => a + b, 0) },
          requests: { p50: pct(lr, 50), max: lr[lr.length - 1]! },
        },
        latencyMs,
        heap: { baseline: heapBase, afterInit: heapInit, afterQueries: heapAfter },
        rendererRss: { baseline: rssBase, afterInit: rssInit, afterQueries: rssAfter },
        results,
      });
      await ctx.close();
    }
  } finally {
    await browser.close();
    server.stop(true);
  }
  return out;
}

/** Recall per query kind: the item in the top 10, and how often more than 10 items contain every query word. */
export function recall(results: QueryResult[]): Record<string, { n: number; top10: number; zeroHits: number; over10Matching?: number }> {
  const out: Record<string, { n: number; top10: number; zeroHits: number; over10Matching?: number }> = {};
  for (const r of results) {
    const s = (out[r.kind] ??= { n: 0, top10: 0, zeroHits: 0 });
    s.n++;
    if (r.top10) s.top10++;
    if (r.hits === 0) s.zeroHits++;
    if (r.matchingItems !== undefined) s.over10Matching = (s.over10Matching ?? 0) + (r.matchingItems > 10 ? 1 : 0);
  }
  return out;
}

if (import.meta.main) {
  if (process.argv.includes("--fixture")) {
    // The small committed fixture: check it is what the generator makes, then build it for the page.
    const want = fixtureText(fixtureRecords());
    if (process.argv.includes("--write-fixture")) {
      mkdirSync(join(INSTANCE, "pagefind"), { recursive: true });
      writeFileSync(FIXTURE, want);
      console.log(`pagefind: wrote ${relative(process.cwd(), FIXTURE)}`);
    } else if (!existsSync(FIXTURE) || readFileSync(FIXTURE, "utf8") !== want) {
      console.error(`pagefind: ${relative(process.cwd(), FIXTURE)} is not what the seeded generator makes. Run \`bun run pagefind:fixture --write-fixture\`.`);
      process.exit(1);
    }
    const entries = readFixture();
    const t = await buildPagefind(entries, FIXTURE_BUILD);
    const files = walk(t.bundle).length;
    console.log(`pagefind: built ${entries.length} records into ${relative(process.cwd(), t.bundle)} (${files} files) in ${(t.addMs + t.writeMs).toFixed(0)} ms.`);
    process.exit(0);
  }

  const items = Number(arg("items", "273559"));
  const nq = Number(arg("queries", "200"));
  const indexIds = process.argv.includes("--index-ids");
  const entries = corpus(items);
  const keep = process.argv.includes("--out");
  const dir = keep ? resolve(arg("out", "")) : mkdtempSync(join(tmpdir(), "pagefind-bench-"));
  const result: { viaHtml?: PagefindSizeReport & { emitMs: number }; size?: PagefindSizeReport; recall?: ReturnType<typeof recall>; browser?: Array<Omit<BrowserReport, "results">> } = {};
  try {
    if (process.argv.includes("--via-html")) {
      const t = await buildPagefindFromHtml(entries, dir);
      rmSync(join(dir, "site"), { recursive: true, force: true });
      result.viaHtml = { emitMs: t.emitMs, ...sizeReport(t.bundle, entries, t, false) };
    } else {
      const t = await buildPagefind(entries, dir, { indexIds });
      result.size = sizeReport(t.bundle, entries, t, indexIds);
    }
    writeFileSync(join(dir, "blank.html"), "<!doctype html><title>bench</title>");
    if (process.argv.includes("--browser") && result.size) {
      const queries = sampleQueries(entries, nq);
      const worker = process.argv.includes("--worker");
      const reports = await browserRun(dir, queries, worker ? ["unthrottled"] : ["unthrottled", "slow-4g"], worker);
      // Recall does not depend on the network, so it is read off the unthrottled run.
      result.recall = recall(reports[0]!.results);
      result.browser = reports.map(({ results: _r, ...rest }) => rest);
    }
  } finally {
    if (!keep) rmSync(dir, { recursive: true, force: true });
  }
  if (keep) console.error(`kept ${dir} (${statSync(dir).isDirectory() ? "directory" : "?"})`);
  console.log(JSON.stringify(result, null, 2));
}
