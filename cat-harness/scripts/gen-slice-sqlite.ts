#!/usr/bin/env bun
/**
 * Build a KG slice as ONE SQLite file a browser opens without parsing it.
 * Bean `q8ar` (late materialization). Owner ruling 2026-10-03: use the official
 * SQLite WASM build with an OPFS VFS.
 *
 * The contract is `skills/kg/kg-core/kg-export.md` §"Per-slice SQLite — a
 * named subgraph as one file a browser mounts". The browser half is
 * `docs/assets/js/slice-sqlite.js`, and the one search page is
 * `docs/slices/search.html?slice=<name>`. The procedure is the BPMN process
 * `processes/kg/slice-sqlite-publish.bpmn`, and the Tool node is
 * `slice-sqlite` in `tools/index.ts`.
 *
 * ## One builder, one definition per slice
 *
 * Every slice is a {@link SliceDef} in {@link SLICES}: its DDL, its stored
 * tables with the order their rows go in, its one FTS5 index, where its
 * payloads live, how the search page shows a result, and a `load` that turns
 * the source into rows. The engine — build, `VACUUM INTO`, digest, manifest,
 * `--check` — knows nothing about any slice. Adding a slice is adding a
 * definition, never copying this file.
 *
 * | slice | source | heavy field → payload |
 * |---|---|---|
 * | `beans` | `beans/defs/` via `readBeans` | the bean file, written at deploy |
 * | `todos` | `docs/assets/todos/index.json` | the todo's source file, written at deploy |
 * | `library` | `docs/assets/library/index.json` + `entries/<id>.json` | the published entry JSON, written at deploy |
 * | `kg` | the whole-repo KG export (`buildExport`) | the KG's own committed payloads (`docs/payload/`) |
 *
 * ## What it writes
 *
 * - `<out>/<slice>.sqlite3`: the skeleton — rows, edges, a contentless FTS5.
 * - `<out>/<slice>.sqlite3.json`: the manifest (`folio-slice-sqlite/v1`). It
 *   carries the file's `sha256` and `bytes`, which the client verifies the
 *   download against and keys its OPFS copy by; per-table row counts; the
 *   schema and SQLite versions; a `contentDigest` over the ROWS; and the
 *   `search` block the generic page reads.
 * - `<out>/index.json`: the list of slices in `<out>`, for the search page.
 * - With `--payload-out <dir>`: every deploy-written payload of the slices
 *   built, at `<dir>/<hex>` plus its `<hex>.json` sidecar, written by
 *   `gen-subgraph-jsonld`'s own `renderPayloadFiles` — not a second writer.
 *
 * ## Bodies are payloads, not columns
 *
 * Measured 2026-10-03 over 717 beans, one 4096-byte page per `VACUUM INTO`:
 * bodies stored with an external-content FTS5 gave 7,847,936 bytes; no bodies
 * with a contentless full-detail FTS5 gave 2,637,824. So every slice's FTS5 is
 * CONTENTLESS (`content=''`): it indexes the text without storing it, and keeps
 * full detail, because positions are what make a phrase query work. A row
 * carries `payload_sha256`; the client fetches `<site>/payload/sha256/<hex>`
 * when a result is opened.
 *
 * ## Deterministic, proved rather than claimed
 *
 * Rows go in in each table's declared order, the page size is fixed, nothing
 * time-varying is written, and the published file is `VACUUM INTO` a fresh
 * path. `--check` builds twice and fails unless the two files have one sha256.
 * The file's sha256 is stable only for one SQLite version, so the manifest also
 * carries `contentDigest`, a sha256 over the canonical row dump, which stays
 * equal across a Bun upgrade.
 *
 * ## Neither the binaries nor their deploy payloads are committed
 *
 * Every session writes `beans/`, and the other three sources are regenerated
 * by their own generators on most merges, so a committed binary would be stale
 * against a merge ref and would grow the clone on every edit. The deploy
 * (`docs-site.yml`, `feature-staging.yml`) builds every slice from the tree it
 * publishes, straight into `_site/`.
 *
 * What `--check` gates, per slice:
 *
 *   1. the builder runs, and two builds give one sha256;
 *   2. the `contentDigest` read back from the DATABASE equals the digest
 *      computed from the source rows without SQLite — a dropped, truncated or
 *      mis-keyed row fails (`kg-export` §"A partial graph must never pass for
 *      a whole one");
 *   3. FTS5 answers a phrase query for a known row;
 *   4. the payloads pass `auditPayloadTree`: deploy payloads as written, and
 *      the `kg` slice's pointers against the committed payload tree.
 *
 * @module cat-harness/scripts/gen-slice-sqlite
 * @covers bean-defs
 */
import { Database } from "bun:sqlite";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";

import { readDeclaration, repoRootFor, siteDirFor } from "../schemas/cat-harness.ts";
import { LibraryEntrySchema, LibraryIndexSchema } from "../schemas/site-indexes.ts";
import { PAYLOAD_MEDIA_TYPES, PAYLOAD_PATH, type PayloadLink } from "../schemas/subgraph-manifest.ts";
import { TodoIndexSchema } from "../schemas/todo-index.ts";
import { readBeans, type BeanNode } from "./beans.ts";
import { auditPayloadTree, payloadOutDir, planPayloads, renderPayloadFiles, type PayloadEntry, type PayloadPlan } from "./gen-subgraph-jsonld.ts";

const INSTANCE_ROOT = resolve(import.meta.dir, "..");
/** Where a LOCAL build lands — gitignored. The deploy writes into `_site/` instead. */
export const SLICES_DIR = join(INSTANCE_ROOT, siteDirFor(INSTANCE_ROOT), "assets", "slices");
export const MANIFEST_SCHEMA = "folio-slice-sqlite/v1";
export const SLICE_INDEX_SCHEMA = "folio-slice-index/v1";
/** Bumped whenever a table, column or index changes. Also `PRAGMA user_version`. */
export const SCHEMA_VERSION = 2;
/** Fixed, so two builds cannot differ by a default. 4096 is SQLite's default. */
export const PAGE_SIZE = 4096;
/**
 * The size above which a slice is not shipped without a decision (bean `q8ar`,
 * coordinator 2026-10-03: "above about 5 MB, stop that slice and report").
 * REPORTED by a build, not gated: the beans slice grows with every session,
 * and a gate would turn every open PR red the day it crossed the line, for a
 * change nobody made. The measurement in the manifest is what a person reads.
 */
export const SIZE_BUDGET_BYTES = 5 * 1024 * 1024;

/** The repository root a source `file` is relative to. */
export const REPO_ROOT = repoRootFor(INSTANCE_ROOT);

// ── The engine's types ─────────────────────────────────────────────────────

export type SqlValue = string | number | null;
export type Row = Record<string, SqlValue>;

/** A stored table: its columns in SELECT order, and the order its rows are dumped in. */
export interface SliceTable {
  readonly name: string;
  readonly columns: readonly string[];
  /** `rowid` for a rowid table, else the primary key's columns. */
  readonly orderBy: string;
}

/**
 * How the generic search page shows this slice. Carried in the manifest, so
 * the page has no per-slice code. Every query is built from these pieces and
 * run against a file the manifest's sha256 already vouched for.
 */
export interface SliceSearch {
  /** The noun a result is: "bean", "todo", "block", "node". */
  readonly noun: string;
  readonly title: string;
  readonly placeholder: string;
  /**
   * `SELECT … FROM <table> <alias>` returning `key`, `title`, `meta`,
   * `payload`, and optionally `part` (where in the payload the result is) and
   * `snippet` (stored text shown inline).
   */
  readonly select: string;
  readonly alias: string;
  /** The column a typed query degrades to a `LIKE` over when FTS5 syntax fails. */
  readonly like: string;
  /**
   * What the payload is, so the page knows how to show it:
   * `markdown` (front matter stripped), or `library-entry` (a
   * `folio-library-entry/v1` document; the block whose id is `part`).
   */
  readonly body: "markdown" | "library-entry";
}

/** What `load` turns a source into. Every row list is already in its table's `orderBy` order. */
export interface SliceData {
  readonly rows: Readonly<Record<string, Row[]>>;
  /** One entry per row of `fts.rowsOf`, by position: the text of each FTS column. */
  readonly fts: readonly SqlValue[][];
  /** Every payload the slice's rows point at, and each pointer. */
  readonly payloads: PayloadPlan;
  /** Defects in the SOURCE, reported in the manifest rather than hidden. */
  readonly findings: readonly string[];
  /** A row a phrase query must find, for `--check`. */
  readonly probe?: { readonly phrase: string; readonly column: string; readonly value: string };
  /** Extra `meta` rows (no timestamp, no commit — either would make two builds differ). */
  readonly meta?: Readonly<Record<string, string>>;
}

export interface SliceDef {
  readonly slice: string;
  readonly source: { readonly graph: string; readonly path: string };
  readonly ddl: readonly string[];
  readonly tables: readonly SliceTable[];
  readonly fts: { readonly table: string; readonly rowsOf: string; readonly columns: readonly string[] };
  /** Tables and views whose row counts go in the manifest. */
  readonly counts: readonly string[];
  /** A query returning `id` for every key more than one row declares, or absent. */
  readonly duplicateIdsSql?: string;
  /**
   * Where the payloads come from. `deploy`: written by `--payload-out` beside
   * the slice, never committed. `published`: already in the committed payload
   * tree, which `--check` audits the pointers against.
   */
  readonly payloads: "deploy" | "published";
  readonly search: SliceSearch;
  /** `null` is could-not-determine (no source), never an empty slice. */
  load(root: string): Promise<SliceData | null>;
}

export interface SliceManifest {
  $schema: typeof MANIFEST_SCHEMA;
  slice: string;
  file: string;
  schemaVersion: number;
  sha256: string;
  bytes: number;
  contentDigest: string;
  sqliteVersion: string;
  pageSize: number;
  fts5: { table: string; rowsOf: string; columns: string[]; contentless: true; detail: "full" };
  /** Relative to the SITE ROOT: where a row's `payload_sha256` resolves. */
  payloadPath: string;
  payloads: { mode: "deploy" | "published"; count: number; bytes: number };
  rows: Record<string, number>;
  /** Keys that more than one source row declares. A source defect, reported rather than hidden. */
  duplicateIds: string[];
  /** Other source defects the slice met, in words. */
  findings: string[];
  /** True when `bytes` exceeds {@link SIZE_BUDGET_BYTES}. */
  overBudget: boolean;
  search: SliceSearch;
  source: { graph: string; path: string };
}

const sha256 = (b: Uint8Array | string): string => createHash("sha256").update(b).digest("hex");
const cmp = (x: string, y: string) => (x < y ? -1 : x > y ? 1 : 0);
const posix = (p: string) => p.split("\\").join("/");

/** The instance's declared `canonicalUrl` — the base a payload IRI is minted on. */
export function canonicalBase(root: string = INSTANCE_ROOT): string {
  const url = readDeclaration(root)?.canonicalUrl;
  if (!url) throw new Error(`gen-slice-sqlite: ${root} declares no canonicalUrl to mint payload IRIs on`);
  return url;
}

/** An empty plan, to which {@link addPayload} adds. */
export function emptyPlan(): PayloadPlan {
  return { payloads: new Map(), links: new Map(), problems: [] };
}

/** Add one payload to a plan, keyed by `ref`. Identical bytes are one payload. */
export function addPayload(plan: PayloadPlan, ref: string, bytes: Buffer, mediaType: string, baseUrl: string): PayloadLink {
  const hex = sha256(bytes);
  const e: PayloadEntry = plan.payloads.get(hex) ?? { sha256: hex, bytes, mediaType, referencedBy: [] };
  if (!e.referencedBy.includes(ref)) e.referencedBy.push(ref);
  e.referencedBy.sort();
  plan.payloads.set(hex, e);
  const link: PayloadLink = { "@id": `${baseUrl.replace(/\/+$/, "")}/${PAYLOAD_PATH}/${hex}`, sha256: hex, bytes: bytes.length };
  plan.links.set(ref, link);
  return link;
}

/** Write a plan's payloads (body + sidecar) into `dir`; returns how many. */
export function writePayloads(plan: PayloadPlan, dir: string): number {
  mkdirSync(dir, { recursive: true });
  for (const [path, content] of renderPayloadFiles(plan, dir)) writeFileSync(path, content);
  return plan.payloads.size;
}

// ── The engine ─────────────────────────────────────────────────────────────

function metaRows(def: SliceDef, data: SliceData): { key: string; value: string }[] {
  const m: Record<string, string> = {
    schema: MANIFEST_SCHEMA,
    schema_version: String(SCHEMA_VERSION),
    slice: def.slice,
    source_graph: def.source.graph,
    ...(data.meta ?? {}),
  };
  return Object.keys(m).sort().map((key) => ({ key, value: m[key]! }));
}

/** A row in its table's column order, which is the order `SELECT` returns. */
function ordered(t: SliceTable, r: Row): Row {
  const out: Row = {};
  for (const c of t.columns) out[c] = r[c] ?? null;
  return out;
}

/**
 * The digest the slice SHOULD have, computed from the source rows without
 * touching SQLite. `--check` compares it to the one read back from the file.
 */
export function expectedContentDigest(def: SliceDef, data: SliceData): string {
  const rows: unknown[] = [...metaRows(def, data)];
  for (const t of def.tables) for (const r of data.rows[t.name] ?? []) rows.push(ordered(t, r));
  return sha256(rows.map((r) => JSON.stringify(r)).join("\n"));
}

/** The same digest, read back from a built database. */
export function databaseContentDigest(db: Database, def: SliceDef): string {
  const rows: unknown[] = [...db.query(`SELECT key, value FROM meta ORDER BY key`).all()];
  for (const t of def.tables) {
    rows.push(...db.query(`SELECT ${t.columns.join(", ")} FROM ${t.name} ORDER BY ${t.orderBy}`).all());
  }
  return sha256(rows.map((r) => JSON.stringify(r)).join("\n"));
}

/**
 * Build one slice at `outFile` and return its manifest. The database is
 * written to a scratch file first and then `VACUUM INTO` the destination, so
 * the published bytes carry no build history.
 */
export function buildSlice(def: SliceDef, data: SliceData, outFile: string): SliceManifest {
  const scratchDir = mkdtempSync(join(tmpdir(), "slice-sqlite-"));
  const scratch = join(scratchDir, "build.sqlite3");
  try {
    const db = new Database(scratch, { create: true });
    db.exec(`PRAGMA page_size = ${PAGE_SIZE}`);
    db.exec(`PRAGMA journal_mode = OFF`);
    db.exec(`PRAGMA user_version = ${SCHEMA_VERSION}`);
    db.exec(`CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT NOT NULL) WITHOUT ROWID`);
    for (const ddl of def.ddl) db.exec(ddl);

    const ftsRows = data.fts;
    const ftsOf = data.rows[def.fts.rowsOf] ?? [];
    if (ftsRows.length !== ftsOf.length) {
      throw new Error(`slice ${def.slice}: ${ftsRows.length} FTS row(s) for ${ftsOf.length} ${def.fts.rowsOf} row(s)`);
    }
    const insertFts = db.prepare(
      `INSERT INTO ${def.fts.table} (rowid, ${def.fts.columns.join(", ")}) VALUES (?, ${def.fts.columns.map(() => "?").join(", ")})`,
    );
    const insertMeta = db.prepare(`INSERT INTO meta (key, value) VALUES (?, ?)`);
    db.transaction(() => {
      for (const t of def.tables) {
        const ins = db.prepare(`INSERT INTO ${t.name} (${t.columns.join(", ")}) VALUES (${t.columns.map(() => "?").join(", ")})`);
        const rows = data.rows[t.name] ?? [];
        rows.forEach((r, i) => {
          const { lastInsertRowid } = ins.run(...t.columns.map((c) => r[c] ?? null));
          if (t.name === def.fts.rowsOf) insertFts.run(lastInsertRowid, ...ftsRows[i]!.map((v) => v ?? ""));
        });
      }
      for (const { key, value } of metaRows(def, data)) insertMeta.run(key, value);
    })();
    db.exec(`INSERT INTO ${def.fts.table} (${def.fts.table}) VALUES ('optimize')`);
    db.exec(`ANALYZE`);

    const rows: Record<string, number> = {};
    for (const t of def.counts) rows[t] = (db.query(`SELECT count(*) AS n FROM ${t}`).get() as { n: number }).n;
    const duplicateIds = def.duplicateIdsSql
      ? (db.query(def.duplicateIdsSql).all() as { id: string }[]).map((r) => r.id)
      : [];
    const sqliteVersion = (db.query(`SELECT sqlite_version() AS v`).get() as { v: string }).v;

    mkdirSync(dirname(outFile), { recursive: true });
    const tmpOut = `${outFile}.tmp-${process.pid}`;
    rmSync(tmpOut, { force: true });
    db.exec(`VACUUM INTO '${tmpOut.replace(/'/g, "''")}'`);
    db.close();
    renameSync(tmpOut, outFile);

    // The digest is read back from the PUBLISHED file, so it describes what shipped.
    const shipped = new Database(outFile, { readonly: true });
    const contentDigest = databaseContentDigest(shipped, def);
    shipped.close();

    const bytes = readFileSync(outFile);
    let payloadBytes = 0;
    for (const e of data.payloads.payloads.values()) payloadBytes += e.bytes.length;
    return {
      $schema: MANIFEST_SCHEMA,
      slice: def.slice,
      file: `${def.slice}.sqlite3`,
      schemaVersion: SCHEMA_VERSION,
      sha256: sha256(bytes),
      bytes: bytes.length,
      contentDigest,
      sqliteVersion,
      pageSize: PAGE_SIZE,
      fts5: { table: def.fts.table, rowsOf: def.fts.rowsOf, columns: [...def.fts.columns], contentless: true, detail: "full" },
      payloadPath: `${PAYLOAD_PATH}/`,
      payloads: { mode: def.payloads, count: data.payloads.payloads.size, bytes: payloadBytes },
      rows,
      duplicateIds,
      findings: [...data.findings],
      overBudget: bytes.length > SIZE_BUDGET_BYTES,
      search: def.search,
      source: { ...def.source },
    };
  } finally {
    rmSync(scratchDir, { recursive: true, force: true });
  }
}

export function manifestText(m: SliceManifest): string {
  return JSON.stringify(m, null, 2) + "\n";
}

/** The problems `--check` reports for one slice; empty means green. */
export function checkSlice(def: SliceDef, data: SliceData, opts: { publishedPayloadDir?: string } = {}): string[] {
  const problems: string[] = [];
  const dir = mkdtempSync(join(tmpdir(), "slice-check-"));
  try {
    const a = buildSlice(def, data, join(dir, "a.sqlite3"));
    const b = buildSlice(def, data, join(dir, "b.sqlite3"));
    if (a.sha256 !== b.sha256) problems.push(`not deterministic: two builds gave ${a.sha256} and ${b.sha256}`);
    const expected = expectedContentDigest(def, data);
    if (a.contentDigest !== expected) {
      problems.push(`the database's row digest ${a.contentDigest} ≠ the source's ${expected} — the slice is not the source`);
    }
    for (const t of def.tables) {
      const want = (data.rows[t.name] ?? []).length;
      if (a.rows[t.name] !== undefined && a.rows[t.name] !== want) problems.push(`${t.name} rows ${a.rows[t.name]} ≠ ${want} read`);
    }
    if (!data.probe) problems.push(`no known row to probe FTS5 with — an empty source is not a green slice`);
    else {
      // A PHRASE query, which only full-detail FTS5 can answer.
      const db = new Database(join(dir, "a.sqlite3"), { readonly: true });
      const { phrase, column, value } = data.probe;
      const hit = db
        .query(`SELECT 1 FROM ${def.fts.table} f JOIN ${def.fts.rowsOf} t ON t.rowid = f.rowid WHERE ${def.fts.table} MATCH ? AND t.${column} = ?`)
        .get(`"${phrase}"`, value);
      db.close();
      if (!hit) problems.push(`FTS5 did not find ${column}=${value} by the phrase "${phrase}"`);
    }
    for (const p of data.payloads.problems) problems.push(`payload: ${p}`);
    if (def.payloads === "deploy") {
      const payloadDir = join(dir, "payload");
      writePayloads(data.payloads, payloadDir);
      problems.push(...auditPayloadTree(payloadDir, data.payloads.links));
    } else {
      const pdir = opts.publishedPayloadDir ?? join(INSTANCE_ROOT, payloadOutDir(INSTANCE_ROOT));
      for (const [ref, link] of data.payloads.links) {
        if (!existsSync(join(pdir, link.sha256))) problems.push(`${ref}: points at payload ${link.sha256}, which the published tree does not hold`);
      }
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  return problems;
}

// ── Helpers the definitions share ──────────────────────────────────────────

/** The first two-long-word phrase in `text`, for a probe. */
export function phraseIn(text: string, min = 4): string | undefined {
  return text.match(new RegExp(`[A-Za-z]{${min},}\\s+[A-Za-z]{${min},}`))?.[0];
}

const FTS = (table: string, columns: readonly string[]) =>
  `CREATE VIRTUAL TABLE ${table} USING fts5 (${columns.join(", ")}, content = '', tokenize = 'unicode61 remove_diacritics 2')`;

// ── Slice: beans ───────────────────────────────────────────────────────────

const BEAN_COLS = [
  "id", "title", "status", "type", "priority", "parent", "created_at", "updated_at",
  "file", "tags", "payload_sha256", "payload_bytes",
] as const;

/** Every edge, from both declarations, deduplicated and sorted. */
export function beanEdges(beans: BeanNode[]): { blocker: string; blocked: string; declared_on: string }[] {
  const seen = new Map<string, { blocker: string; blocked: string; declared_on: string }>();
  for (const b of beans) {
    const add = (blocker: string, blocked: string, declared_on: string) =>
      seen.set(`${blocker}\u0000${blocked}\u0000${declared_on}`, { blocker, blocked, declared_on });
    for (const t of b.blocking) add(b.id, t, "blocking");
    for (const f of b.declaredBlockedBy ?? []) add(f, b.id, "blocked_by");
  }
  return [...seen.keys()].sort().map((k) => seen.get(k)!);
}

/** The beans slice's data from bean nodes. Exported so a test can pass fixtures. */
export function beansData(beans: BeanNode[], root: string = REPO_ROOT, baseUrl = canonicalBase()): SliceData {
  // `file` is the key, NOT `id`: two bean files have declared one id
  // (`folio-assistant-t3n8`, 2026-10-03), and keeping only one would publish
  // a partial slice as a whole one. Both rows go in; `duplicateIds` says so.
  const sorted = [...beans].sort((a, b) => cmp(a.id, b.id) || cmp(a.file, b.file));
  const plan = emptyPlan();
  const rows: Row[] = [];
  const fts: SqlValue[][] = [];
  for (const b of sorted) {
    const file = posix(b.file);
    // The payload is the source FILE verbatim, front matter included (kg-export §"Payloads").
    const link = addPayload(plan, file, readFileSync(join(root, b.file)), PAYLOAD_MEDIA_TYPES.md!, baseUrl);
    rows.push({
      id: b.id, title: b.title, status: b.status, type: b.type, priority: b.priority,
      parent: b.parent || null, created_at: b.createdAt || null, updated_at: b.updatedAt || null,
      file, tags: JSON.stringify(b.tags ?? []), payload_sha256: link.sha256, payload_bytes: link.bytes,
    });
    fts.push([b.title, b.body]);
  }
  const ids = sorted.map((b) => b.id);
  const known = sorted.find((b, i) => ids.indexOf(b.id) === i && ids.lastIndexOf(b.id) === i && phraseIn(b.title));
  return {
    rows: { beans: rows, bean_block: beanEdges(sorted) },
    fts,
    payloads: plan,
    findings: [],
    probe: known ? { phrase: phraseIn(known.title)!, column: "file", value: posix(known.file) } : undefined,
  };
}

export const BEANS_SLICE: SliceDef = {
  slice: "beans",
  source: { graph: "bean-defs", path: "beans/defs/" },
  ddl: [
    // A rowid table, because FTS5 addresses rows by rowid; rows go in (id, file) order.
    `CREATE TABLE beans (
       id TEXT NOT NULL, title TEXT NOT NULL, status TEXT NOT NULL, type TEXT NOT NULL,
       priority TEXT NOT NULL, parent TEXT, created_at TEXT, updated_at TEXT,
       file TEXT NOT NULL UNIQUE,
       tags TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(tags)),
       payload_sha256 TEXT NOT NULL CHECK (length(payload_sha256) = 64),
       payload_bytes INTEGER NOT NULL
     )`,
    `CREATE INDEX beans_id ON beans (id)`,
    `CREATE INDEX beans_status_type ON beans (status, type)`,
    `CREATE INDEX beans_parent ON beans (parent) WHERE parent IS NOT NULL`,
    `CREATE INDEX beans_updated ON beans (updated_at)`,
    // ONE edge table, each row saying which side declared it; the two
    // directions are views, because two stored tables for one relation are
    // two answers that can disagree.
    `CREATE TABLE bean_block (
       blocker TEXT NOT NULL, blocked TEXT NOT NULL,
       declared_on TEXT NOT NULL CHECK (declared_on IN ('blocking', 'blocked_by')),
       PRIMARY KEY (blocker, blocked, declared_on)
     ) WITHOUT ROWID`,
    `CREATE INDEX bean_block_blocked ON bean_block (blocked, blocker)`,
    `CREATE VIEW blocking (id, target) AS SELECT DISTINCT blocker, blocked FROM bean_block`,
    `CREATE VIEW blocked_by (id, blocker) AS SELECT DISTINCT blocked, blocker FROM bean_block`,
    `CREATE VIEW bean_tags (id, tag) AS SELECT beans.id, j.value FROM beans, json_each(beans.tags) AS j`,
    FTS("beans_fts", ["title", "body"]),
  ],
  tables: [
    { name: "beans", columns: BEAN_COLS, orderBy: "rowid" },
    { name: "bean_block", columns: ["blocker", "blocked", "declared_on"], orderBy: "blocker, blocked, declared_on" },
  ],
  fts: { table: "beans_fts", rowsOf: "beans", columns: ["title", "body"] },
  counts: ["beans", "bean_block", "blocking", "blocked_by", "bean_tags"],
  duplicateIdsSql: `SELECT id FROM beans GROUP BY id HAVING count(*) > 1 ORDER BY id`,
  payloads: "deploy",
  search: {
    noun: "bean",
    title: "Beans — the work plan",
    placeholder: 'e.g. "named subgraph" or opfs',
    select: "SELECT b.id AS key, b.title AS title, b.id || ' · ' || b.status || ' · ' || b.type AS meta, b.payload_sha256 AS payload FROM beans b",
    alias: "b",
    like: "b.title",
    body: "markdown",
  },
  async load(root) {
    const beans = readBeans(root);
    return beans === null ? null : beansData(beans, root);
  },
};

// ── Slice: todos ───────────────────────────────────────────────────────────

/** The published todo index, as `gen-docs-pages` writes it. */
export const TODO_INDEX = join(siteDirFor(INSTANCE_ROOT), "assets", "todos", "index.json");

/**
 * The todos slice's data from the published index plus each todo's SOURCE file
 * (its payload, verbatim). `sources` maps a todo id to its repo-relative file.
 */
export function todosData(
  indexJson: unknown,
  sources: ReadonlyMap<string, string>,
  root: string = REPO_ROOT,
  baseUrl = canonicalBase(),
): SliceData {
  const index = TodoIndexSchema.parse(indexJson);
  const items = [...index.items].sort((a, b) => cmp(a.id, b.id));
  const plan = emptyPlan();
  const findings: string[] = [];
  const todos: Row[] = [];
  const rels: Row[] = [];
  const fts: SqlValue[][] = [];
  for (const t of items) {
    const file = sources.get(t.id);
    let link: PayloadLink | undefined;
    if (file && existsSync(join(root, file))) link = addPayload(plan, file, readFileSync(join(root, file)), PAYLOAD_MEDIA_TYPES.md!, baseUrl);
    else findings.push(`todo ${t.id}: the index publishes it but no source file was found — row kept, no payload`);
    todos.push({
      id: t.id, summary: t.summary, status: t.status, priority: t.priority, origin: t.origin ?? null,
      created_at: t.createdAt, target_label: t.targetLabel ?? null, target_page: t.target?.page ?? null,
      theme: t.theme ?? null, file: file ?? null, view_href: t.viewHref ?? null,
      tags: JSON.stringify(t.tags), payload_sha256: link?.sha256 ?? null, payload_bytes: link?.bytes ?? null,
    });
    fts.push([t.summary, t.comment]);
    const seen = new Set<string>();
    for (const r of t.relations) {
      const k = `${r.axis}\u0000${r.label}`;
      if (seen.has(k)) continue;
      seen.add(k);
      rels.push({ todo: t.id, axis: r.axis, label: r.label, href: r.href ?? null });
    }
  }
  rels.sort((a, b) => cmp(String(a.todo), String(b.todo)) || cmp(String(a.axis), String(b.axis)) || cmp(String(a.label), String(b.label)));
  const known = items.find((t) => phraseIn(t.summary));
  return {
    rows: { todos, todo_relation: rels },
    fts,
    payloads: plan,
    findings,
    probe: known ? { phrase: phraseIn(known.summary)!, column: "id", value: known.id } : undefined,
  };
}

export const TODOS_SLICE: SliceDef = {
  slice: "todos",
  source: { graph: "todos", path: posix(join("cat-harness", TODO_INDEX)) },
  ddl: [
    `CREATE TABLE todos (
       id TEXT NOT NULL UNIQUE, summary TEXT NOT NULL, status TEXT NOT NULL, priority TEXT NOT NULL,
       origin TEXT, created_at TEXT NOT NULL, target_label TEXT, target_page TEXT, theme TEXT,
       file TEXT, view_href TEXT,
       tags TEXT NOT NULL CHECK (json_valid(tags)),
       payload_sha256 TEXT CHECK (payload_sha256 IS NULL OR length(payload_sha256) = 64),
       payload_bytes INTEGER
     )`,
    `CREATE INDEX todos_status ON todos (status, priority)`,
    `CREATE INDEX todos_target ON todos (target_page) WHERE target_page IS NOT NULL`,
    // A todo's relations are declared on the todo, one side only, so there is
    // no `declared_on`: a column that could hold one value is not a fact.
    `CREATE TABLE todo_relation (
       todo TEXT NOT NULL, axis TEXT NOT NULL, label TEXT NOT NULL, href TEXT,
       PRIMARY KEY (todo, axis, label)
     ) WITHOUT ROWID`,
    `CREATE INDEX todo_relation_label ON todo_relation (axis, label)`,
    FTS("todos_fts", ["summary", "comment"]),
  ],
  tables: [
    {
      name: "todos",
      columns: ["id", "summary", "status", "priority", "origin", "created_at", "target_label", "target_page", "theme", "file", "view_href", "tags", "payload_sha256", "payload_bytes"],
      orderBy: "rowid",
    },
    { name: "todo_relation", columns: ["todo", "axis", "label", "href"], orderBy: "todo, axis, label" },
  ],
  fts: { table: "todos_fts", rowsOf: "todos", columns: ["summary", "comment"] },
  counts: ["todos", "todo_relation"],
  payloads: "deploy",
  search: {
    noun: "todo",
    title: "Todos — items for a person",
    placeholder: "e.g. page or roles",
    select: "SELECT t.id AS key, t.summary AS title, t.status || ' · ' || t.priority || coalesce(' · ' || t.target_label, '') AS meta, t.payload_sha256 AS payload FROM todos t",
    alias: "t",
    like: "t.summary",
    body: "markdown",
  },
  async load(root) {
    const p = join(INSTANCE_ROOT, TODO_INDEX);
    if (!existsSync(p)) return null;
    // The todo reader is imported lazily: it resolves its graph at import.
    const { readTodoFiles } = await import("./todos.ts");
    const sources = new Map<string, string>();
    // `readTodoFiles` reports paths relative to THIS instance (`../todos/…`),
    // so they are resolved here before being made repo-relative (bean `pb04`).
    for (const f of readTodoFiles()) sources.set(f.todo.id, posix(relative(root, resolve(INSTANCE_ROOT, f.path))));
    return todosData(JSON.parse(readFileSync(p, "utf-8")), sources, root);
  },
};

// ── Slice: library ─────────────────────────────────────────────────────────

export const LIBRARY_DIR = join(siteDirFor(INSTANCE_ROOT), "assets", "library");
/** A published entry is JSON; it is not in `PAYLOAD_MEDIA_TYPES`, which types KG pointer files. */
export const JSON_MEDIA_TYPE = "application/json";

/**
 * The library slice's data from the published index and the per-entry graph.
 *
 * The payload of an entry — and of every one of its blocks — is the PUBLISHED
 * `entries/<id>.json`, verbatim. Not the section files under `library/`: a
 * withheld entry (bean `cw35`) publishes no verbatim text, and the published
 * entry is what already applied that rule. One payload per entry rather than
 * per block, because 3,600 blocks would be 7,200 files per deploy for bytes the
 * entry file already holds.
 */
export function libraryData(
  indexJson: unknown,
  entryJson: ReadonlyMap<string, Buffer>,
  baseUrl = canonicalBase(),
  entryPath = (id: string) => `entries/${id}.json`,
): SliceData {
  const index = LibraryIndexSchema.parse(indexJson);
  const entries = [...index.entries].sort((a, b) => cmp(a.id, b.id));
  const plan = emptyPlan();
  const findings: string[] = [];
  const eRows: Row[] = [];
  const bRows: Row[] = [];
  const refs: Row[] = [];
  const fts: SqlValue[][] = [];
  const indexed = new Set(entries.map((e) => e.id));
  for (const id of [...entryJson.keys()].sort()) {
    if (!indexed.has(id)) findings.push(`${entryPath(id)} is not in the library index — not sliced`);
  }
  for (const e of entries) {
    const bytes = entryJson.get(e.id);
    let link: PayloadLink | undefined;
    let blocks: { id: string; kind: string; title: string; pageStart: number | null; pageEnd: number | null; content: string | null; provenance: string; summary: { status: string; text?: string } | null }[] = [];
    if (bytes) {
      link = addPayload(plan, entryPath(e.id), bytes, JSON_MEDIA_TYPE, baseUrl);
      const parsed = LibraryEntrySchema.parse(JSON.parse(bytes.toString("utf-8")));
      if (parsed.id !== e.id) findings.push(`${entryPath(e.id)} declares id ${parsed.id}`);
      blocks = parsed.blocks;
    } else findings.push(`library entry ${e.id}: no ${entryPath(e.id)} — entry row kept, no blocks, no payload`);
    eRows.push({
      id: e.id, instance: e.instance, title: e.title, rung: e.rung, provenance: e.provenance,
      doi: e.doi || null, arxiv: e.arxiv || null, sections: e.sections, blocks: e.blocks, words: e.words,
      page_start: e.pageStart, page_end: e.pageEnd, withheld: e.withheld ?? null, view: e.view ?? null,
      payload_sha256: link?.sha256 ?? null, payload_bytes: link?.bytes ?? null,
    });
    // Blocks keep the entry's page order: `seq` is their position in the file.
    blocks.forEach((b, seq) => {
      bRows.push({
        id: b.id, entry: e.id, seq, kind: b.kind, title: b.title, page_start: b.pageStart, page_end: b.pageEnd,
        provenance: b.provenance, summary_status: b.summary?.status ?? null, has_text: b.content ? 1 : 0,
        payload_sha256: link?.sha256 ?? null,
      });
      fts.push([b.title, [b.content ?? "", b.summary?.text ?? ""].join("\n").trim(), e.title]);
    });
    for (const r of e.referencedBy ?? []) refs.push({ entry: e.id, kind: r.kind, instance: r.instance, from_path: r.from, count: r.count });
  }
  refs.sort((a, b) => cmp(String(a.entry), String(b.entry)) || cmp(String(a.from_path), String(b.from_path)) || cmp(String(a.kind), String(b.kind)));
  const known = bRows.find((b, i) => phraseIn(String(b.title)) && (fts[i]![1] as string).length > 0);
  return {
    rows: { entries: eRows, blocks: bRows, entry_ref: refs },
    fts,
    payloads: plan,
    findings,
    probe: known ? { phrase: phraseIn(String(known.title))!, column: "id", value: String(known.id) } : undefined,
  };
}

export const LIBRARY_SLICE: SliceDef = {
  slice: "library",
  source: { graph: "library", path: posix(join("cat-harness", LIBRARY_DIR, "index.json")) },
  ddl: [
    `CREATE TABLE entries (
       id TEXT NOT NULL UNIQUE, instance TEXT NOT NULL, title TEXT NOT NULL, rung TEXT NOT NULL,
       provenance TEXT NOT NULL, doi TEXT, arxiv TEXT, sections INTEGER, blocks INTEGER, words INTEGER,
       page_start INTEGER, page_end INTEGER, withheld TEXT, view TEXT,
       payload_sha256 TEXT CHECK (payload_sha256 IS NULL OR length(payload_sha256) = 64),
       payload_bytes INTEGER
     )`,
    `CREATE INDEX entries_instance ON entries (instance)`,
    // A rowid table, for FTS5. A block's text is indexed, not stored: its
    // bytes are in the entry payload, at the block whose id is `id`.
    `CREATE TABLE blocks (
       id TEXT NOT NULL UNIQUE, entry TEXT NOT NULL, seq INTEGER NOT NULL, kind TEXT NOT NULL,
       title TEXT NOT NULL, page_start INTEGER, page_end INTEGER, provenance TEXT NOT NULL,
       summary_status TEXT, has_text INTEGER NOT NULL CHECK (has_text IN (0, 1)),
       payload_sha256 TEXT CHECK (payload_sha256 IS NULL OR length(payload_sha256) = 64)
     )`,
    `CREATE INDEX blocks_entry ON blocks (entry, seq)`,
    `CREATE INDEX blocks_kind ON blocks (kind)`,
    // Who cites an entry, declared on the entry by the reference scan.
    `CREATE TABLE entry_ref (
       entry TEXT NOT NULL, kind TEXT NOT NULL, instance TEXT NOT NULL, from_path TEXT NOT NULL, count INTEGER NOT NULL,
       PRIMARY KEY (entry, from_path, kind)
     ) WITHOUT ROWID`,
    `CREATE INDEX entry_ref_from ON entry_ref (from_path)`,
    FTS("library_fts", ["title", "text", "entry_title"]),
  ],
  tables: [
    {
      name: "entries",
      columns: ["id", "instance", "title", "rung", "provenance", "doi", "arxiv", "sections", "blocks", "words", "page_start", "page_end", "withheld", "view", "payload_sha256", "payload_bytes"],
      orderBy: "rowid",
    },
    {
      name: "blocks",
      columns: ["id", "entry", "seq", "kind", "title", "page_start", "page_end", "provenance", "summary_status", "has_text", "payload_sha256"],
      orderBy: "rowid",
    },
    { name: "entry_ref", columns: ["entry", "kind", "instance", "from_path", "count"], orderBy: "entry, from_path, kind" },
  ],
  fts: { table: "library_fts", rowsOf: "blocks", columns: ["title", "text", "entry_title"] },
  counts: ["entries", "blocks", "entry_ref"],
  payloads: "deploy",
  search: {
    noun: "block",
    title: "Library — every ingested source, block by block",
    placeholder: 'e.g. "guideline development" or GRADE',
    select:
      "SELECT b.id AS key, CASE WHEN b.title = '' THEN '(' || b.kind || ')' ELSE b.title END AS title, " +
      "e.title || ' · ' || b.kind || coalesce(' · p. ' || b.page_start, '') AS meta, b.payload_sha256 AS payload, b.id AS part " +
      "FROM blocks b JOIN entries e ON e.id = b.entry",
    alias: "b",
    like: "b.title",
    body: "library-entry",
  },
  async load() {
    const dir = join(INSTANCE_ROOT, LIBRARY_DIR);
    if (!existsSync(join(dir, "index.json"))) return null;
    const entries = new Map<string, Buffer>();
    const edir = join(dir, "entries");
    if (existsSync(edir)) {
      for (const f of readdirSync(edir).sort()) if (f.endsWith(".json")) entries.set(f.slice(0, -5), readFileSync(join(edir, f)));
    }
    return libraryData(JSON.parse(readFileSync(join(dir, "index.json"), "utf-8")), entries);
  },
};

// ── Slice: kg (the whole repository's knowledge graph) ─────────────────────

type KgNode = Record<string, unknown> & { "@id": string; "@type"?: string | string[] };

/**
 * The whole-repo slice from a KG export: nodes, every `@type: @id` edge, and
 * an FTS5 over names, titles, summaries and descriptions — the NO-BODY
 * variant. No instruction body is in the export (it carries
 * `instructionsPath`), and the bodies are already payloads (`f233`), so a node
 * row carries the pointer `planPayloads` computes for the subgraph files, and
 * the client fetches the committed payload.
 *
 * IRIs are stored relative to the document: `skill/todo-manager` for
 * `<doc>#skill/todo-manager`, with `<doc>#` in `meta.base`. Measured: the
 * fragment form is what keeps 14,000 edges from carrying a 60-byte prefix
 * twice each, plus once more in the reverse index.
 */
export function kgData(doc: { "@id": string; "@context": unknown; "@graph": unknown[] }, plan: PayloadPlan): SliceData {
  const base = `${doc["@id"]}#`;
  const rel = (iri: string) => (iri.startsWith(base) ? iri.slice(base.length) : iri);
  const ctx = (Array.isArray(doc["@context"]) ? Object.assign({}, ...doc["@context"].filter((c) => typeof c === "object")) : doc["@context"]) as Record<string, unknown>;
  const edgeTerms = Object.keys(ctx)
    .filter((k) => { const v = ctx[k]; return typeof v === "object" && v !== null && (v as Record<string, unknown>)["@type"] === "@id"; })
    .sort();
  // Type IRIs compacted to CURIEs with the context's own prefixes, longest namespace first.
  const prefixes = Object.entries(ctx)
    .filter(([k, v]) => typeof v === "string" && /[#/]$/.test(v) && !k.startsWith("@"))
    .map(([k, v]) => [k, v as string] as const)
    .sort((a, b) => b[1].length - a[1].length);
  const curie = (iri: string) => { for (const [k, ns] of prefixes) if (iri.startsWith(ns)) return `${k}:${iri.slice(ns.length)}`; return iri; };
  const str = (v: unknown): string | null => (typeof v === "string" ? v : Array.isArray(v) && typeof v[0] === "string" ? v.join("; ") : null);

  const graph = (doc["@graph"] as KgNode[]).slice().sort((a, b) => cmp(a["@id"], b["@id"]));
  const findings: string[] = [];
  const nodes: Row[] = [];
  const edges = new Map<string, Row>();
  const fts: SqlValue[][] = [];
  let odd = 0;
  for (const n of graph) {
    const types = ([] as unknown[]).concat(n["@type"] ?? []).map((t) => curie(String(t)));
    const link = plan.links.get(n["@id"]);
    nodes.push({
      iri: rel(n["@id"]), type: types[0] ?? null, types: JSON.stringify(types),
      name: str(n.name), title: str(n.title), summary: str(n.summary),
      payload_sha256: link?.sha256 ?? null, payload_bytes: link?.bytes ?? null,
    });
    fts.push([str(n.name), str(n.title), str(n.summary), str(n.description)]);
    for (const term of edgeTerms) {
      for (const v of ([] as unknown[]).concat(n[term] ?? [])) {
        const dst = typeof v === "string" ? v : v && typeof v === "object" && typeof (v as { "@id"?: unknown })["@id"] === "string" ? (v as { "@id": string })["@id"] : null;
        if (dst === null) { odd++; continue; }
        const r = { src: rel(n["@id"]), rel: term, dst: rel(dst) };
        edges.set(`${r.src}\u0000${r.rel}\u0000${r.dst}`, r);
      }
    }
  }
  if (odd) findings.push(`${odd} value(s) under an @id-typed term were neither an IRI nor a node reference — not sliced as edges`);
  const edgeRows = [...edges.keys()].sort().map((k) => edges.get(k)!);
  const known = graph.findIndex((n) => typeof n.title === "string" && phraseIn(n.title, 5));
  return {
    rows: { nodes, edges: edgeRows },
    fts,
    payloads: plan,
    findings,
    meta: { base },
    probe: known >= 0 ? { phrase: phraseIn(graph[known]!.title as string, 5)!, column: "iri", value: rel(graph[known]!["@id"]) } : undefined,
  };
}

export const KG_SLICE: SliceDef = {
  slice: "kg",
  source: { graph: "kg", path: "kg-export (bun run kg:export)" },
  ddl: [
    `CREATE TABLE nodes (
       iri TEXT NOT NULL UNIQUE, type TEXT, types TEXT NOT NULL CHECK (json_valid(types)),
       name TEXT, title TEXT, summary TEXT,
       payload_sha256 TEXT CHECK (payload_sha256 IS NULL OR length(payload_sha256) = 64),
       payload_bytes INTEGER
     )`,
    `CREATE INDEX nodes_type ON nodes (type)`,
    // ONE edge table for every relation, keyed by `rel`, rather than one table
    // per relation: there are 36 @id-typed terms, each declared on one side
    // (the subject node) only, so a per-relation table would be 36 copies of
    // one shape and `declared_on` would hold one value.
    `CREATE TABLE edges (src TEXT NOT NULL, rel TEXT NOT NULL, dst TEXT NOT NULL, PRIMARY KEY (src, rel, dst)) WITHOUT ROWID`,
    `CREATE INDEX edges_dst ON edges (dst, rel)`,
    `CREATE VIEW incoming (iri, rel, src) AS SELECT dst, rel, src FROM edges`,
    `CREATE VIEW dangling (src, rel, dst) AS SELECT e.src, e.rel, e.dst FROM edges e WHERE e.dst NOT LIKE '%://%' AND NOT EXISTS (SELECT 1 FROM nodes n WHERE n.iri = e.dst)`,
    FTS("kg_fts", ["name", "title", "summary", "description"]),
  ],
  tables: [
    { name: "nodes", columns: ["iri", "type", "types", "name", "title", "summary", "payload_sha256", "payload_bytes"], orderBy: "rowid" },
    { name: "edges", columns: ["src", "rel", "dst"], orderBy: "src, rel, dst" },
  ],
  fts: { table: "kg_fts", rowsOf: "nodes", columns: ["name", "title", "summary", "description"] },
  counts: ["nodes", "edges", "dangling"],
  payloads: "published",
  search: {
    noun: "node",
    title: "The whole knowledge graph",
    placeholder: 'e.g. "todo manager" or payload',
    select:
      "SELECT n.iri AS key, coalesce(n.title, n.name, n.iri) AS title, coalesce(n.type, '') || ' · ' || n.iri AS meta, " +
      "n.payload_sha256 AS payload, n.summary AS snippet FROM nodes n",
    alias: "n",
    like: "coalesce(n.title, n.name, n.iri)",
    body: "markdown",
  },
  async load() {
    const { buildExport } = await import("./kg-export.ts");
    const data = await buildExport({ instanceRoot: INSTANCE_ROOT });
    const baseUrl = canonicalBase();
    // The SAME plan `gen-subgraph-jsonld` writes the committed payloads from.
    const plan = planPayloads(data["@graph"] as KgNode[], { root: INSTANCE_ROOT, baseUrl });
    return kgData(data as unknown as { "@id": string; "@context": unknown; "@graph": unknown[] }, plan);
  },
};

/** Every slice, in build order. The ONE list — the CLI, the gate and the tests read it. */
export const SLICES: readonly SliceDef[] = [BEANS_SLICE, TODOS_SLICE, LIBRARY_SLICE, KG_SLICE];

export function sliceIndexText(manifests: SliceManifest[]): string {
  const slices = manifests
    .map((m) => ({ slice: m.slice, manifest: `${m.slice}.sqlite3.json`, title: m.search.title, bytes: m.bytes, rows: m.rows }))
    .sort((a, b) => cmp(a.slice, b.slice));
  return JSON.stringify({ $schema: SLICE_INDEX_SCHEMA, slices }, null, 2) + "\n";
}

function argValues(args: string[], name: string): string[] {
  const out: string[] = [];
  args.forEach((a, i) => { if (a === name && args[i + 1]) out.push(args[i + 1]!); });
  return out;
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const outDir = resolve(argValues(args, "--out")[0] ?? SLICES_DIR);
  const payloadOut = argValues(args, "--payload-out")[0];
  const wanted = argValues(args, "--slice");
  const unknown = wanted.filter((w) => !SLICES.some((s) => s.slice === w));
  if (unknown.length) {
    console.error(`gen-slice-sqlite: unknown slice(s) ${unknown.join(", ")}; known: ${SLICES.map((s) => s.slice).join(", ")}`);
    process.exit(2);
  }
  const defs = wanted.length ? SLICES.filter((s) => wanted.includes(s.slice)) : SLICES;
  let failed = false;
  const manifests: SliceManifest[] = [];
  for (const def of defs) {
    const t0 = performance.now();
    const data = await def.load(REPO_ROOT);
    if (data === null) {
      // No source is not an empty source: say so, and build nothing.
      console.error(`  ✗ ${def.slice}: no source at ${def.source.path} — could not determine the slice`);
      failed = true;
      continue;
    }
    if (args.includes("--check")) {
      const problems = checkSlice(def, data);
      if (problems.length) {
        failed = true;
        for (const p of problems) console.error(`  ✗ ${def.slice}: ${p}`);
      } else {
        const n = (data.rows[def.fts.rowsOf] ?? []).length;
        console.log(`✓ ${def.slice} slice: deterministic, row digest equals the source (${n} ${def.fts.rowsOf}), FTS5 phrase query answers, payloads audit clean`);
      }
      continue;
    }
    const m = buildSlice(def, data, join(outDir, `${def.slice}.sqlite3`));
    writeFileSync(join(outDir, `${def.slice}.sqlite3.json`), manifestText(m));
    manifests.push(m);
    const ms = Math.round(performance.now() - t0);
    const counts = Object.entries(m.rows).map(([k, v]) => `${v} ${k}`).join(", ");
    console.log(`  · ${join(outDir, m.file)} — ${m.bytes} bytes (${counts}), ${m.payloads.count} payload(s) ${m.payloads.mode}, ${ms} ms`);
    if (m.overBudget) console.warn(`  ! ${def.slice}: ${m.bytes} bytes is over the ${SIZE_BUDGET_BYTES}-byte budget — a decision, not a default`);
    if (m.duplicateIds.length) console.warn(`  ! ${def.slice}: keys declared by more than one source row: ${m.duplicateIds.join(", ")}`);
    for (const f of m.findings) console.warn(`  ! ${def.slice}: ${f}`);
    if (payloadOut && def.payloads === "deploy") {
      const n = writePayloads(data.payloads, resolve(payloadOut));
      console.log(`  · ${def.slice}: ${n} payload(s) → ${resolve(payloadOut)}`);
    }
  }
  if (!args.includes("--check") && manifests.length) {
    // The index lists every slice now in `outDir`, so a `--slice` rebuild keeps the others.
    const all: SliceManifest[] = [];
    for (const f of readdirSync(outDir).sort()) {
      if (f.endsWith(".sqlite3.json")) all.push(JSON.parse(readFileSync(join(outDir, f), "utf-8")) as SliceManifest);
    }
    writeFileSync(join(outDir, "index.json"), sliceIndexText(all));
  }
  if (failed) process.exit(1);
}
