#!/usr/bin/env bun
/**
 * lean-kg-ingest — turn doc-gen4's per-module declaration data into the
 * `lean` directory's knowledge-graph shards, which the dynamic Lean viewer
 * (`lean-kg-viewer/`) loads on demand.
 *
 * Owner, 2026-10-11: *"can we have it dynamically load from the KG instead of
 * static content?"* — option A (hybrid): doc-gen4 still ELABORATES (it is the
 * only thing that produces type-checked signatures with resolved links), but
 * its static HTML is no longer what is published. Its structured output,
 * `<lake-root>/.lake/build/doc-data/declaration-data-<Module>.bmp` (JSON,
 * despite the extension), is reshaped into graph nodes.
 *
 * ## Output (`--out <dir>`)
 *
 *   index.json                 modules: name, decl count, chunk count, content hash
 *   names.json                 [[declName, moduleIdx, kindIdx], …] for search; lazy-loaded
 *   m/<Module>.jsonld          one JSON-LD graph per module: the module node,
 *                              its `imports` edges, and one node per declaration
 *                              (name, kind, line, sourceLink, docstring,
 *                              `formalizes` edges to the content blocks whose
 *                              `lean.ref` names it, and the chunk holding its
 *                              rendered signature)
 *   m/<Module>.<k>.sig.json    rendered signature HTML, CHUNK_SIZE declarations
 *                              per chunk, links rewritten for the viewer
 *
 * Signatures are chunked because one module can be enormous: qou's
 * `QOU.BraidKnot.AllKnownIsotopesUniqueness` carries 12,804 declarations and
 * ~50 MB of signature HTML. The shard itself stays small enough to list the
 * module at once; the viewer fetches signature chunks as they scroll in.
 *
 * ## Incremental (branches/) mode
 *
 * `--base <dir-or-url of a published index.json's directory>` compares each
 * module's content hash with the base index and writes ONLY modules that
 * changed or are new, plus `overlay.json` naming the base and the changed set.
 * The viewer loads changed modules from the overlay and everything else from
 * the base, so a branch publishes kilobytes, not the whole graph.
 *
 * ## Links inside signatures
 *
 * doc-gen4 writes root-relative hrefs (`./Mathlib/Algebra/Field/Defs.html#Field`).
 * A link into a KEPT module root becomes a viewer route (`#/m/<Module>/<decl>`);
 * anything else goes to `--external-base` (default: the community mathlib4
 * docs). Same stated limit as lean-render.ts: the external docs are built from
 * their Mathlib, not the folio's pin.
 *
 * Exit 0 written; 2 usage or the input is not a doc-gen4 doc-data directory.
 *
 * @module folio-assistant-sci/adapters/paper/lean/lean-kg-ingest
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { DEFAULT_EXTERNAL_BASE } from "./lean-render.ts";

export const CHUNK_SIZE = 500;
export const KINDS = ["theorem", "def", "structure", "class", "instance", "inductive", "ctor", "axiom", "opaque", "other"] as const;

export interface DocGenDecl {
  header: string;
  info: { name: string; kind: string; doc?: string | null; docLink?: string; sourceLink?: string; line?: number };
}
export interface DocGenModule {
  name: string;
  imports: string[];
  declarations: DocGenDecl[];
  instances?: unknown[];
}

/** A content block that formalizes a declaration through its `lean.ref`. */
export interface BlockRef {
  label: string;
  /** Path of the block's `.md`, relative to the content root. */
  md: string;
}

/** `QOU/Mass/X.html#QOU.Mass.X.y` → `{ module: "QOU.Mass.X", frag: "QOU.Mass.X.y" }`, or undefined for non-module pages. */
export function moduleOfDocPath(path: string): { module: string; frag: string } | undefined {
  const m = /^\.?\/?([A-Z][^#?]*)\.html(?:#(.*))?$/.exec(path);
  if (!m) return undefined;
  return { module: m[1]!.split("/").join("."), frag: m[2] ?? "" };
}

/** Rewrite doc-gen4's root-relative hrefs for the viewer. */
export function rewriteHeader(html: string, keepRoots: ReadonlySet<string>, externalBase: string): string {
  const base = externalBase.endsWith("/") ? externalBase : `${externalBase}/`;
  return html.replace(/\bhref="([^"]*)"/g, (whole, href: string) => {
    if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith("#")) return whole;
    const target = href.replace(/^\.\//, "");
    const mod = moduleOfDocPath(target);
    if (mod && keepRoots.has(mod.module.split(".")[0]!.toLowerCase())) {
      return `href="#/m/${mod.module}${mod.frag ? `/${encodeURIComponent(mod.frag)}` : ""}"`;
    }
    return `href="${base}${target}"`;
  });
}

/** Map `<pkg>:<Decl>` lean.refs in the content tree to the blocks that carry them. */
export function collectLeanRefs(contentRoot: string): Map<string, BlockRef[]> {
  const out = new Map<string, BlockRef[]>();
  const walk = (dir: string): void => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.name === "node_modules" || e.name.startsWith(".") || e.name === "lean") continue;
      const abs = join(dir, e.name);
      if (e.isDirectory()) walk(abs);
      else if (e.name.endsWith(".ts")) {
        const src = readFileSync(abs, "utf-8");
        const ref = /\bref:\s*"[a-z0-9]+:([^"]+)"/.exec(src);
        const label = /\blabel:\s*"([^"]+)"/.exec(src);
        if (!ref || !label) continue;
        const md = relative(contentRoot, abs.replace(/\.ts$/, ".md")).split(sep).join("/");
        const list = out.get(ref[1]!) ?? [];
        list.push({ label: label[1]!, md });
        out.set(ref[1]!, list);
      }
    }
  };
  walk(contentRoot);
  return out;
}

function sha12(s: string): string {
  return createHash("sha256").update(s).digest("hex").slice(0, 12);
}

export interface IngestOptions {
  docData: string;
  out: string;
  modules: readonly string[];
  contentRoot?: string;
  externalBase?: string;
  /** Directory (or URL) of a published base `index.json`; enables overlay mode. */
  base?: string;
  baseIndex?: IndexFile;
}

export interface IndexModule {
  name: string;
  decls: number;
  chunks: number;
  hash: string;
}
export interface IndexFile {
  schema: "folio-lean-kg/v1";
  chunkSize: number;
  modules: IndexModule[];
  kinds: readonly string[];
  totals: { modules: number; decls: number; formalized: number };
}

export interface IngestReport {
  modules: number;
  decls: number;
  formalized: number;
  written: number;
  unchanged: number;
  overlay: boolean;
}

/** Ingest every kept module's doc-data into graph shards under `out`. */
export function ingest(o: IngestOptions): IngestReport {
  const dir = resolve(o.docData);
  if (!existsSync(dir)) throw new Error(`${dir} does not exist`);
  const keep = new Set(o.modules.map((m) => m.toLowerCase()));
  const files = readdirSync(dir).filter((f) => f.startsWith("declaration-data-") && f.endsWith(".bmp"));
  if (files.length === 0) throw new Error(`${dir}: no declaration-data-*.bmp files — not a doc-gen4 doc-data directory`);
  const refs = o.contentRoot ? collectLeanRefs(resolve(o.contentRoot)) : new Map<string, BlockRef[]>();
  const externalBase = o.externalBase ?? DEFAULT_EXTERNAL_BASE;
  const baseHashes = new Map((o.baseIndex?.modules ?? []).map((m) => [m.name, m.hash]));
  const overlay = o.baseIndex !== undefined;

  const out = resolve(o.out);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(join(out, "m"), { recursive: true });

  const mods: DocGenModule[] = files
    .map((f) => f.slice("declaration-data-".length, -".bmp".length))
    .filter((name) => keep.size === 0 || keep.has(name.split(".")[0]!.toLowerCase()))
    .sort()
    .map((name) => JSON.parse(readFileSync(join(dir, `declaration-data-${name}.bmp`), "utf-8")) as DocGenModule);

  const index: IndexFile = { schema: "folio-lean-kg/v1", chunkSize: CHUNK_SIZE, modules: [], kinds: KINDS, totals: { modules: 0, decls: 0, formalized: 0 } };
  const names: [string, number, number][] = [];
  const report: IngestReport = { modules: 0, decls: 0, formalized: 0, written: 0, unchanged: 0, overlay };
  const changed: string[] = [];

  mods.forEach((mod, mi) => {
    const decls = mod.declarations;
    const chunks = Math.ceil(decls.length / CHUNK_SIZE);
    const nodes = decls.map((d, i) => {
      const blocks = refs.get(d.info.name) ?? [];
      if (blocks.length) report.formalized++;
      const k = (KINDS as readonly string[]).indexOf(d.info.kind);
      names.push([d.info.name, mi, k < 0 ? KINDS.length - 1 : k]);
      return {
        "@id": `lean:${d.info.name}`,
        "@type": "LeanDeclaration",
        name: d.info.name,
        kind: d.info.kind,
        ...(d.info.line !== undefined ? { line: d.info.line } : {}),
        ...(d.info.sourceLink ? { sourceLink: d.info.sourceLink } : {}),
        ...(d.info.doc ? { doc: d.info.doc } : {}),
        ...(blocks.length ? { formalizes: blocks.map((b) => ({ "@id": `block:${b.label}`, label: b.label, md: b.md })) } : {}),
        signatureChunk: Math.floor(i / CHUNK_SIZE),
      };
    });
    const shard = {
      "@context": { lean: "lean:", block: "block:", imports: { "@type": "@id" } },
      "@graph": [{ "@id": `lean:module:${mod.name}`, "@type": "LeanModule", name: mod.name, imports: mod.imports.map((m) => `lean:module:${m}`), declarations: decls.length, chunks }, ...nodes],
    };
    const sigChunks: string[][] = [];
    for (let c = 0; c < chunks; c++) sigChunks.push(decls.slice(c * CHUNK_SIZE, (c + 1) * CHUNK_SIZE).map((d) => rewriteHeader(d.header, keep, externalBase)));
    const shardText = JSON.stringify(shard);
    const sigText = sigChunks.map((s) => JSON.stringify(s));
    const hash = sha12(shardText + sigText.join("\n"));
    index.modules.push({ name: mod.name, decls: decls.length, chunks, hash });
    report.modules++;
    report.decls += decls.length;
    if (overlay && baseHashes.get(mod.name) === hash) {
      report.unchanged++;
      return;
    }
    changed.push(mod.name);
    writeFileSync(join(out, "m", `${mod.name}.jsonld`), shardText);
    sigText.forEach((s, c) => writeFileSync(join(out, "m", `${mod.name}.${c}.sig.json`), s));
    report.written++;
  });

  index.totals = { modules: report.modules, decls: report.decls, formalized: report.formalized };
  writeFileSync(join(out, "index.json"), JSON.stringify(index));
  writeFileSync(join(out, "names.json"), JSON.stringify(names));
  if (overlay) {
    const removed = [...baseHashes.keys()].filter((n) => !index.modules.some((m) => m.name === n));
    writeFileSync(join(out, "overlay.json"), JSON.stringify({ schema: "folio-lean-kg-overlay/v1", base: o.base, changed, removed }));
  }
  return report;
}

async function loadBaseIndex(base: string): Promise<IndexFile> {
  const url = base.replace(/\/+$/, "") + "/index.json";
  if (/^https?:/.test(url)) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
    return (await r.json()) as IndexFile;
  }
  return JSON.parse(readFileSync(url, "utf-8")) as IndexFile;
}

async function main(): Promise<number> {
  const argv = process.argv.slice(2);
  const at = (f: string): string | undefined => {
    const i = argv.indexOf(f);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const docData = at("--doc-data");
  const out = at("--out");
  if (!docData || !out) {
    console.error("usage: lean-kg-ingest.ts --doc-data <lake>/.lake/build/doc-data --out <dir> [--modules QOU,UGB] [--module <root>]... [--content-root <dir>] [--external-base <url>] [--base <dir|url>]");
    return 2;
  }
  const modules = [...(at("--modules")?.split(",") ?? []), ...argv.flatMap((a, i) => (a === "--module" && argv[i + 1] ? [argv[i + 1]!] : []))]
    .map((s) => s.trim())
    .filter(Boolean);
  const base = at("--base");
  try {
    const r = ingest({ docData, out, modules, contentRoot: at("--content-root"), externalBase: at("--external-base"), base, baseIndex: base ? await loadBaseIndex(base) : undefined });
    console.log(
      `lean-kg-ingest: ${r.modules} module(s), ${r.decls} declaration(s), ${r.formalized} formalizing a content block; ` +
        (r.overlay ? `overlay: ${r.written} changed, ${r.unchanged} unchanged against the base` : `${r.written} shard(s) written`),
    );
    return 0;
  } catch (e) {
    console.error(`? ${(e as Error).message}`);
    return 2;
  }
}

if (import.meta.main) process.exit(await main());
