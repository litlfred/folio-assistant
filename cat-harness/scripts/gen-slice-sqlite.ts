#!/usr/bin/env bun
/**
 * Build a KG slice as ONE SQLite file a browser opens without parsing it.
 * Bean `q8ar` (late materialization). Owner ruling 2026-10-03: use the official
 * SQLite WASM build with an OPFS VFS; the pilot slice is `beans`.
 *
 * The contract is `skills/kg/kg-core/kg-export.md` §"Per-slice SQLite — a
 * named subgraph as one file a browser mounts". This script is its first
 * implementation, and the browser half is `docs/assets/js/slice-sqlite.js`.
 *
 * ## What it writes
 *
 * - `<out>/beans.sqlite3`: the skeleton. One row per bean, the block edges,
 *   and an FTS5 index over title and body.
 * - `<out>/beans.sqlite3.json`: the manifest (`folio-slice-sqlite/v1`). It
 *   carries the file's `sha256` and `bytes`, which the client verifies the
 *   download against and keys its OPFS copy by. It also carries per-table row
 *   counts, the schema version, the SQLite version that wrote the file, and a
 *   `contentDigest` over the ROWS.
 * - With `--payload-out <dir>`: every bean FILE, verbatim, as a
 *   content-addressed payload (`f233`), at `<dir>/<hex>` plus its `<hex>.json`
 *   sidecar. These are written
 *   by `gen-subgraph-jsonld`'s own `renderPayloadFiles` / `payloadSidecar`, not
 *   a second writer.
 *
 * ## Bodies are payloads, not columns
 *
 * Measured 2026-10-03 over 717 beans, with one 4096-byte page per
 * `VACUUM INTO`:
 *
 * | layout | bytes |
 * |---|---|
 * | bodies stored, external-content FTS5 | 7,847,936 |
 * | bodies stored, FTS5 `detail=column` | 6,316,032 |
 * | **no bodies, contentless FTS5, full detail** | **2,637,824** |
 * | no bodies, contentless, `detail=column` | 1,232,896 |
 *
 * Bodies were 4.58 MB of a 7.85 MB file, and the bean's own done-when list
 * says the slice holds the skeleton and pointers, with payloads fetched on
 * demand. So the FTS5 index is CONTENTLESS (`content=''`): it indexes the
 * body without storing it. It keeps full detail, because positions are what
 * make a phrase query (`"named subgraph"`) work. Each row carries
 * `payload_sha256`, and the client fetches `<site>/payload/sha256/<hex>` when a
 * result is opened. The coordinator decided this on 2026-10-03.
 *
 * ## Deterministic, proved rather than claimed
 *
 * - Rows go in sorted by (id, file).
 * - The page size is fixed.
 * - Nothing time-varying is written.
 * - The published file is `VACUUM INTO` a fresh path, so free pages, the
 *   change counter and insertion history cannot leak in.
 *
 * `--check` builds twice and fails unless the two files have the same sha256.
 *
 * Even so, the file's sha256 is stable only for ONE SQLite version. The header
 * records the library version that last wrote it (offset 96), and a different
 * build may lay out pages differently. So the manifest also carries
 * `contentDigest`, a sha256 over the canonical row dump, which stays equal
 * across a Bun upgrade. There are two digests because there are two questions:
 * "are these the bytes I was promised?" and "is this the same data?".
 *
 * ## Neither the binary nor its payloads is committed, and why
 *
 * This is the same reason `assets/beans/index.json` is checked only for
 * existence in `gen-docs-pages.ts`. Every agent session writes `beans/`, so a
 * committed projection of it is stale against a merge ref by the time CI tests
 * it. A content gate would be red on every open PR, for a change nobody forgot
 * to make. A 2.6 MB binary rewritten on every bean edit would also grow the
 * clone that `bun run health` measures.
 *
 * So the deploy (`docs-site.yml`, `feature-staging.yml`) builds the slice from
 * the tree it publishes, straight into `_site/`, and nothing served goes stale.
 * The bean payloads go into `_site/payload/sha256/` beside the KG's committed
 * ones. They are NOT written into `docs/payload/`: that tree is
 * `gen-subgraph-jsonld`'s, and its orphan audit is right to reject a payload
 * no KG node references. Beans are not KG nodes (`kg-export` §"Adding a node
 * type").
 *
 * What `--check` gates:
 *
 *   1. the builder runs, and the build is deterministic (two builds give one
 *      sha256);
 *   2. the manifest's `contentDigest`, read back from the DATABASE, equals the
 *      digest computed independently from the bean store. A slice that drops,
 *      truncates or mis-keys a row fails here. This is the
 *      partial-must-not-pass-for-whole rule (`kg-export` §"A partial graph
 *      must never pass for a whole one");
 *   3. FTS5 answers a phrase query for a known bean;
 *   4. the payload tree passes `auditPayloadTree`: no orphan, nothing missing,
 *      every file hashes to its name.
 *
 * @module cat-harness/scripts/gen-slice-sqlite
 * @covers bean-defs
 */
import { Database } from "bun:sqlite";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

import { readDeclaration, repoRootFor, siteDirFor } from "../schemas/cat-harness.ts";
import { PAYLOAD_MEDIA_TYPES, PAYLOAD_PATH, type PayloadLink } from "../schemas/subgraph-manifest.ts";
import { readBeans, type BeanNode } from "./beans.ts";
import { auditPayloadTree, renderPayloadFiles, type PayloadPlan } from "./gen-subgraph-jsonld.ts";

const INSTANCE_ROOT = resolve(import.meta.dir, "..");
/** Where a LOCAL build lands — gitignored. The deploy writes into `_site/` instead. */
export const SLICES_DIR = join(INSTANCE_ROOT, siteDirFor(INSTANCE_ROOT), "assets", "slices");
export const MANIFEST_SCHEMA = "folio-slice-sqlite/v1";
/** Bumped whenever a table, column or index changes. Also `PRAGMA user_version`. */
export const SCHEMA_VERSION = 1;
/** Fixed, so two builds cannot differ by a default. 4096 is SQLite's default. */
export const PAGE_SIZE = 4096;

/** The DDL in one place, so the skill and the manifest can quote it. */
export const BEANS_DDL = [
  `CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT NOT NULL) WITHOUT ROWID`,
  // A rowid table, not WITHOUT ROWID, because FTS5 addresses rows by rowid.
  // Rows go in (id, file) order, so the rowid is deterministic.
  //
  // `file` is the key, NOT `id`. Measured 2026-10-03: two bean files both
  // declare `folio-assistant-t3n8`. With a UNIQUE id the build would refuse
  // the whole store, and keeping only one would publish a partial slice as a
  // whole one. So both rows go in, and the manifest lists the id under
  // `duplicateIds`.
  `CREATE TABLE beans (
     id TEXT NOT NULL,
     title TEXT NOT NULL,
     status TEXT NOT NULL,
     type TEXT NOT NULL,
     priority TEXT NOT NULL,
     parent TEXT,
     created_at TEXT,
     updated_at TEXT,
     file TEXT NOT NULL UNIQUE,
     tags TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(tags)),
     payload_sha256 TEXT NOT NULL CHECK (length(payload_sha256) = 64),
     payload_bytes INTEGER NOT NULL
   )`,
  `CREATE INDEX beans_id ON beans (id)`,
  `CREATE INDEX beans_status_type ON beans (status, type)`,
  `CREATE INDEX beans_parent ON beans (parent) WHERE parent IS NOT NULL`,
  `CREATE INDEX beans_updated ON beans (updated_at)`,
  // ONE edge table, and each row records which side declared it. Two stored
  // tables for one relation are two answers that can disagree, so the two
  // directions are views over this one.
  `CREATE TABLE bean_block (
     blocker TEXT NOT NULL,
     blocked TEXT NOT NULL,
     declared_on TEXT NOT NULL CHECK (declared_on IN ('blocking', 'blocked_by')),
     PRIMARY KEY (blocker, blocked, declared_on)
   ) WITHOUT ROWID`,
  `CREATE INDEX bean_block_blocked ON bean_block (blocked, blocker)`,
  `CREATE VIEW blocking (id, target) AS SELECT DISTINCT blocker, blocked FROM bean_block`,
  `CREATE VIEW blocked_by (id, blocker) AS SELECT DISTINCT blocked, blocker FROM bean_block`,
  // JSON1 over the tags column, rather than a third stored table.
  `CREATE VIEW bean_tags (id, tag) AS SELECT beans.id, j.value FROM beans, json_each(beans.tags) AS j`,
  // CONTENTLESS, with full detail. The body is indexed and not stored (it is
  // a payload), and positions are kept, so phrase queries work. Join on
  // rowid to reach the row.
  `CREATE VIRTUAL TABLE beans_fts USING fts5 (
     title, body,
     content = '',
     tokenize = 'unicode61 remove_diacritics 2'
   )`,
];

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
  fts5: { contentless: boolean; detail: "full" };
  /** Relative to the SITE ROOT: where a row's `payload_sha256` resolves. */
  payloadPath: string;
  rows: Record<string, number>;
  /** Ids that more than one bean file declares. A store defect, reported rather than hidden. */
  duplicateIds: string[];
  source: { graph: string; path: string };
}

const sha256 = (b: Uint8Array | string): string => createHash("sha256").update(b).digest("hex");
const cmp = (x: string, y: string) => (x < y ? -1 : x > y ? 1 : 0);

/** The repository root a bean's `file` is relative to. */
export const REPO_ROOT = repoRootFor(INSTANCE_ROOT);

/**
 * A bean's payload bytes: its source file VERBATIM, front matter included.
 * This is `kg-export` §"Payloads": "the bytes are the source file verbatim".
 */
export function payloadBytes(b: BeanNode, root: string): Buffer {
  return readFileSync(join(root, b.file));
}

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

/** One `beans` row, exactly as `SELECT` returns it, in column order. */
function beanRow(b: BeanNode, root: string) {
  const bytes = payloadBytes(b, root);
  return {
    id: b.id,
    title: b.title,
    status: b.status,
    type: b.type,
    priority: b.priority,
    parent: b.parent || null,
    created_at: b.createdAt || null,
    updated_at: b.updatedAt || null,
    // Always `/`, so a Windows build does not produce a different file.
    file: b.file.split("\\").join("/"),
    tags: JSON.stringify(b.tags ?? []),
    payload_sha256: sha256(bytes),
    payload_bytes: bytes.length,
  };
}

const META: [string, string][] = [
  ["schema", MANIFEST_SCHEMA],
  ["schema_version", String(SCHEMA_VERSION)],
  ["slice", "beans"],
  ["source_graph", "bean-defs"],
];

function sortBeans(beans: BeanNode[]): BeanNode[] {
  return [...beans].sort((a, b) => cmp(a.id, b.id) || cmp(a.file, b.file));
}

/**
 * The digest the store SHOULD produce, computed from the bean nodes without
 * touching SQLite. `--check` compares it to the one read back from the file.
 */
export function expectedContentDigest(beans: BeanNode[], root: string = REPO_ROOT): string {
  const rows = [
    ...META.map(([key, value]) => ({ key, value })),
    ...sortBeans(beans).map((b) => beanRow(b, root)),
    ...beanEdges(beans),
  ];
  return sha256(rows.map((r) => JSON.stringify(r)).join("\n"));
}

/** The same digest, read back from a built database. */
export function databaseContentDigest(db: Database): string {
  const rows = [
    ...db.query(`SELECT key, value FROM meta ORDER BY key`).all(),
    ...db
      .query(
        `SELECT id, title, status, type, priority, parent, created_at, updated_at, file, tags, payload_sha256, payload_bytes
         FROM beans ORDER BY rowid`,
      )
      .all(),
    ...db.query(`SELECT blocker, blocked, declared_on FROM bean_block ORDER BY blocker, blocked, declared_on`).all(),
  ];
  return sha256(rows.map((r) => JSON.stringify(r)).join("\n"));
}

/**
 * The bean bodies as a `PayloadPlan`, the shape `gen-subgraph-jsonld` writes
 * and audits. The plan is built here, because `planPayloads` reads KG nodes
 * and beans are not KG nodes; WRITING and AUDITING are that script's.
 */
export function beanPayloadPlan(beans: BeanNode[], root: string = REPO_ROOT, baseUrl = canonicalBase()): PayloadPlan {
  const plan: PayloadPlan = { payloads: new Map(), links: new Map(), problems: [] };
  for (const b of sortBeans(beans)) {
    const bytes = payloadBytes(b, root);
    const hex = sha256(bytes);
    const e = plan.payloads.get(hex) ?? { sha256: hex, bytes, mediaType: PAYLOAD_MEDIA_TYPES.md!, referencedBy: [] };
    e.referencedBy.push(b.file);
    plan.payloads.set(hex, e);
    const link: PayloadLink = { "@id": `${baseUrl.replace(/\/+$/, "")}/${PAYLOAD_PATH}/${hex}`, sha256: hex, bytes: bytes.length };
    plan.links.set(b.file, link);
  }
  return plan;
}

/** The instance's declared `canonicalUrl` — the base a payload IRI is minted on. */
export function canonicalBase(root: string = INSTANCE_ROOT): string {
  const url = readDeclaration(root)?.canonicalUrl;
  if (!url) throw new Error(`gen-slice-sqlite: ${root} declares no canonicalUrl to mint payload IRIs on`);
  return url;
}

/** Write the plan's payloads (body + sidecar) into `dir`. */
export function writeBeanPayloads(plan: PayloadPlan, dir: string): number {
  mkdirSync(dir, { recursive: true });
  const files = renderPayloadFiles(plan, dir);
  for (const [path, content] of files) writeFileSync(path, content);
  return plan.payloads.size;
}

/**
 * Build the beans slice at `outFile` and return its manifest. The database is
 * written to a scratch file first and then `VACUUM INTO` the destination, so
 * the published bytes carry no build history.
 */
export function buildBeansSlice(beans: BeanNode[], outFile: string, root: string = REPO_ROOT): SliceManifest {
  const scratchDir = mkdtempSync(join(tmpdir(), "slice-sqlite-"));
  const scratch = join(scratchDir, "build.sqlite3");
  try {
    const db = new Database(scratch, { create: true });
    db.exec(`PRAGMA page_size = ${PAGE_SIZE}`);
    db.exec(`PRAGMA journal_mode = OFF`);
    db.exec(`PRAGMA user_version = ${SCHEMA_VERSION}`);
    for (const ddl of BEANS_DDL) db.exec(ddl);

    const sorted = sortBeans(beans);
    const insertBean = db.prepare(
      `INSERT INTO beans (id, title, status, type, priority, parent, created_at, updated_at, file, tags, payload_sha256, payload_bytes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    const insertFts = db.prepare(`INSERT INTO beans_fts (rowid, title, body) VALUES (?, ?, ?)`);
    const insertEdge = db.prepare(`INSERT INTO bean_block (blocker, blocked, declared_on) VALUES (?, ?, ?)`);
    const insertMeta = db.prepare(`INSERT INTO meta (key, value) VALUES (?, ?)`);
    db.transaction(() => {
      for (const b of sorted) {
        const r = beanRow(b, root);
        const { lastInsertRowid } = insertBean.run(
          r.id, r.title, r.status, r.type, r.priority, r.parent, r.created_at, r.updated_at,
          r.file, r.tags, r.payload_sha256, r.payload_bytes,
        );
        insertFts.run(lastInsertRowid, b.title, b.body);
      }
      for (const e of beanEdges(sorted)) insertEdge.run(e.blocker, e.blocked, e.declared_on);
      // No timestamp and no commit hash: either would make two builds differ.
      for (const [k, v] of META) insertMeta.run(k, v);
    })();
    db.exec(`INSERT INTO beans_fts (beans_fts) VALUES ('optimize')`);
    db.exec(`ANALYZE`);

    const rows: Record<string, number> = {};
    for (const t of ["beans", "bean_block", "blocking", "blocked_by", "bean_tags"]) {
      rows[t] = (db.query(`SELECT count(*) AS n FROM ${t}`).get() as { n: number }).n;
    }
    const duplicateIds = (
      db.query(`SELECT id FROM beans GROUP BY id HAVING count(*) > 1 ORDER BY id`).all() as { id: string }[]
    ).map((r) => r.id);
    const sqliteVersion = (db.query(`SELECT sqlite_version() AS v`).get() as { v: string }).v;

    mkdirSync(dirname(outFile), { recursive: true });
    const tmpOut = `${outFile}.tmp-${process.pid}`;
    rmSync(tmpOut, { force: true });
    db.exec(`VACUUM INTO '${tmpOut.replace(/'/g, "''")}'`);
    db.close();
    renameSync(tmpOut, outFile);

    // The digest is read back from the PUBLISHED file, not from the scratch
    // one, so it describes what was shipped.
    const shipped = new Database(outFile, { readonly: true });
    const contentDigest = databaseContentDigest(shipped);
    shipped.close();

    const bytes = readFileSync(outFile);
    return {
      $schema: MANIFEST_SCHEMA,
      slice: "beans",
      file: "beans.sqlite3",
      schemaVersion: SCHEMA_VERSION,
      sha256: sha256(bytes),
      bytes: bytes.length,
      contentDigest,
      sqliteVersion,
      pageSize: PAGE_SIZE,
      fts5: { contentless: true, detail: "full" },
      payloadPath: `${PAYLOAD_PATH}/`,
      rows,
      duplicateIds,
      source: { graph: "bean-defs", path: "beans/defs/" },
    };
  } finally {
    rmSync(scratchDir, { recursive: true, force: true });
  }
}

export function manifestText(m: SliceManifest): string {
  return JSON.stringify(m, null, 2) + "\n";
}

/** The problems `--check` reports; empty means green. */
export function checkBeansSlice(beans: BeanNode[], root: string = REPO_ROOT): string[] {
  const problems: string[] = [];
  const dir = mkdtempSync(join(tmpdir(), "slice-check-"));
  try {
    const a = buildBeansSlice(beans, join(dir, "a.sqlite3"), root);
    const b = buildBeansSlice(beans, join(dir, "b.sqlite3"), root);
    if (a.sha256 !== b.sha256) problems.push(`not deterministic: two builds gave ${a.sha256} and ${b.sha256}`);
    const expected = expectedContentDigest(beans, root);
    if (a.contentDigest !== expected) {
      problems.push(`the database's row digest ${a.contentDigest} ≠ the store's ${expected} — the slice is not the store`);
    }
    if (a.rows.beans !== beans.length) problems.push(`beans rows ${a.rows.beans} ≠ ${beans.length} beans read`);

    // A PHRASE query, which only full-detail FTS5 can answer.
    const known = sortBeans(beans).find((x) => /[A-Za-z]{4,}\s+[A-Za-z]{4,}/.test(x.title));
    if (known) {
      const phrase = known.title.match(/[A-Za-z]{4,}\s+[A-Za-z]{4,}/)![0];
      const db = new Database(join(dir, "a.sqlite3"), { readonly: true });
      const hit = db
        .query(`SELECT b.id FROM beans_fts JOIN beans b ON b.rowid = beans_fts.rowid WHERE beans_fts MATCH ? AND b.file = ?`)
        .get(`"${phrase}"`, known.file);
      db.close();
      if (!hit) problems.push(`FTS5 did not find ${known.id} by the phrase "${phrase}" from its title`);
    }

    const plan = beanPayloadPlan(beans, root);
    const payloadDir = join(dir, "payload");
    writeBeanPayloads(plan, payloadDir);
    problems.push(...auditPayloadTree(payloadDir, plan.links));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  return problems;
}

function argValue(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const outDir = resolve(argValue(args, "--out") ?? SLICES_DIR);
  const payloadOut = argValue(args, "--payload-out");
  const beans = readBeans(REPO_ROOT);
  if (beans === null) {
    // No store is not an empty store: say so, and build nothing.
    console.error("gen-slice-sqlite: no bean store — could not determine the beans slice");
    process.exit(1);
  }
  if (args.includes("--check")) {
    const problems = checkBeansSlice(beans);
    if (problems.length) {
      for (const p of problems) console.error(`  ✗ ${p}`);
      process.exit(1);
    }
    console.log(`✓ beans slice: deterministic, row digest equals the store (${beans.length} beans), FTS5 phrase query answers, payloads audit clean`);
  } else {
    const t0 = performance.now();
    const m = buildBeansSlice(beans, join(outDir, "beans.sqlite3"));
    writeFileSync(join(outDir, "beans.sqlite3.json"), manifestText(m));
    const ms = Math.round(performance.now() - t0);
    console.log(`  · ${join(outDir, "beans.sqlite3")} — ${m.bytes} bytes, ${m.rows.beans} beans, ${m.rows.bean_block} edges, ${ms} ms`);
    if (payloadOut) {
      const n = writeBeanPayloads(beanPayloadPlan(beans, REPO_ROOT), resolve(payloadOut));
      console.log(`  · ${n} bean body payload(s) → ${resolve(payloadOut)}`);
    }
    if (m.duplicateIds.length) console.warn(`  ! ids declared by more than one bean file: ${m.duplicateIds.join(", ")}`);
  }
}
