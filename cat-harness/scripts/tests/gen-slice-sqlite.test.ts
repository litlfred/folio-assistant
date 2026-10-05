import { afterAll, describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { repoRootFor } from "../../schemas/cat-harness.ts";
import { inAggregate } from "../../test/support/checkout.ts";
import { readBeans, type BeanNode } from "../beans.ts";
import { auditPayloadTree } from "../gen-subgraph-jsonld.ts";
import {
  BEANS_SLICE,
  KG_SLICE,
  LIBRARY_SLICE,
  SLICES,
  TODOS_SLICE,
  TODO_INDEX,
  LIBRARY_DIR,
  beanEdges,
  beansData,
  buildSlice,
  checkSlice,
  databaseContentDigest,
  emptyPlan,
  expectedContentDigest,
  kgData,
  libraryData,
  todosData,
  manifestFileName,
  rotateSliceFiles,
  sliceFileName,
  SLICE_FILE,
  writePayloads,
  type SliceData,
  type SliceDef,
} from "../gen-slice-sqlite.ts";

const BASE = "https://example.org/site";
const buildBeansSlice = (beans: BeanNode[], outDir: string, root: string) => buildSlice(BEANS_SLICE, beansData(beans, root, BASE), outDir);

const bean = (id: string, over: Partial<BeanNode> = {}): BeanNode => ({
  id,
  file: `beans/defs/${id}--x.md`,
  title: `Title of ${id}`,
  status: "todo",
  type: "task",
  priority: "normal",
  parent: "",
  blocking: [],
  createdAt: "2026-10-03T00:00:00Z",
  updatedAt: "2026-10-03T00:00:00Z",
  body: `Body of ${id}.\n`,
  ...over,
});

function withDir<T>(fn: (dir: string) => T): T {
  const dir = mkdtempSync(join(tmpdir(), "slice-test-"));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** A bean file as the CLI writes one, so the payload is a real file's bytes. */
const fileText = (b: BeanNode) => `---\n# ${b.id}\ntitle: ${b.title}\nstatus: ${b.status}\n---\n${b.body}`;

/** A temp repository root holding the fixture's files. */
function fixtureRoot(beans: BeanNode[]): string {
  const root = mkdtempSync(join(tmpdir(), "slice-root-"));
  for (const b of beans) {
    mkdirSync(dirname(join(root, b.file)), { recursive: true });
    writeFileSync(join(root, b.file), fileText(b));
  }
  return root;
}

describe("gen-slice-sqlite — fixture", () => {
  const fixture = [
    bean("p-bbbb", { blocking: ["p-cccc"], tags: ["ui", "x"] }),
    bean("p-aaaa", { title: "Named subgraph contract", body: "The late materialization of a slice.\n" }),
    bean("p-cccc", { declaredBlockedBy: ["p-aaaa", "p-bbbb"], parent: "p-aaaa" }),
    // Two files, one id: the t3n8 shape. Both rows must survive.
    bean("p-dddd"),
    bean("p-dddd", { file: "beans/defs/p-dddd--other.md" }),
  ];
  const root = fixtureRoot(fixture);
  afterAll(() => rmSync(root, { recursive: true, force: true }));

  test("every bean is a row, both declarations of an edge are kept, and a duplicate id is reported rather than dropped", () =>
    withDir((dir) => {
      const m = buildBeansSlice(fixture, dir, root);
      expect(m.rows.beans).toBe(5);
      expect(m.duplicateIds).toEqual(["p-dddd"]);
      // bbbb→cccc is declared on BOTH sides: two rows, one edge in each view.
      expect(beanEdges(fixture)).toHaveLength(3);
      expect(m.rows.bean_block).toBe(3);
      expect(m.rows.blocked_by).toBe(2);
      expect(m.rows.bean_tags).toBe(2);
      const db = new Database(join(dir, m.file), { readonly: true });
      expect(db.query(`SELECT blocker FROM blocked_by WHERE id = 'p-cccc' ORDER BY blocker`).all()).toEqual([
        { blocker: "p-aaaa" },
        { blocker: "p-bbbb" },
      ]);
      db.close();
    }));

  test("bodies are NOT stored — the slice carries the payload sha256 — yet FTS5 finds a phrase in a body", () =>
    withDir((dir) => {
      const m = buildBeansSlice(fixture, dir, root);
      const db = new Database(join(dir, m.file), { readonly: true });
      const cols = (db.query(`PRAGMA table_info(beans)`).all() as { name: string }[]).map((c) => c.name);
      expect(cols).not.toContain("body");
      const row = db.query(`SELECT payload_sha256, payload_bytes FROM beans WHERE id = 'p-aaaa'`).get() as { payload_sha256: string; payload_bytes: number };
      // The payload is the source FILE verbatim, front matter included (kg-export §"Payloads").
      const file = readFileSync(join(root, "beans/defs/p-aaaa--x.md"));
      expect(row.payload_sha256).toBe(createHash("sha256").update(file).digest("hex"));
      expect(row.payload_bytes).toBe(file.length);
      const hit = db
        .query(`SELECT b.id FROM beans_fts JOIN beans b ON b.rowid = beans_fts.rowid WHERE beans_fts MATCH ?`)
        .all(`"late materialization"`);
      expect(hit).toEqual([{ id: "p-aaaa" }]);
      // Word order matters to a phrase: positions are kept.
      expect(db.query(`SELECT rowid FROM beans_fts WHERE beans_fts MATCH ?`).all(`"materialization late"`)).toEqual([]);
      db.close();
    }));

  test("two builds are byte-identical, and the row digest read back equals the one computed from the beans", () =>
    withDir((dir) => {
      const a = buildBeansSlice(fixture, join(dir, "a"), root);
      const b = buildBeansSlice([...fixture].reverse(), join(dir, "b"), root);
      expect(b.sha256).toBe(a.sha256);
      expect(b.file).toBe(a.file);
      expect(readFileSync(join(dir, "a", a.file)).equals(readFileSync(join(dir, "b", b.file)))).toBe(true);
      expect(a.contentDigest).toBe(expectedContentDigest(BEANS_SLICE, beansData(fixture, root, BASE)));
      const db = new Database(join(dir, "a", a.file), { readonly: true });
      expect(databaseContentDigest(db, BEANS_SLICE)).toBe(a.contentDigest);
      db.close();
    }));

  test("the database is published under its own sha256, and the manifest names that file (bean `wixl`)", () =>
    withDir((dir) => {
      const m = buildBeansSlice(fixture, dir, root);
      const bytes = readFileSync(join(dir, m.file));
      const hex = createHash("sha256").update(bytes).digest("hex");
      expect(m.sha256).toBe(hex);
      expect(m.file).toBe(`beans.${hex}.sqlite3`);
      expect(m.file).toBe(sliceFileName("beans", hex));
      expect(SLICE_FILE.exec(m.file)?.slice(1)).toEqual(["beans", hex]);
      expect(m.bytes).toBe(bytes.length);
      // Exactly ONE file is written: no fixed-path `beans.sqlite3`, no leftover temp file.
      expect(readdirSync(dir)).toEqual([m.file]);
      // A different source is a different name, so a cache holding the old one cannot answer for the new one.
      const other = buildBeansSlice(fixture.slice(1), dir, root);
      expect(other.file).not.toBe(m.file);
      expect(other.file).toBe(sliceFileName("beans", other.sha256));
    }));

  test("rotation removes this slice's earlier builds and the legacy fixed path, and nothing else", () =>
    withDir((dir) => {
      const old = buildBeansSlice(fixture.slice(1), dir, root);
      const cur = buildBeansSlice(fixture, dir, root);
      writeFileSync(join(dir, "beans.sqlite3"), "legacy");
      writeFileSync(join(dir, manifestFileName("beans")), "{}");
      const otherSlice = sliceFileName("todos", "0".repeat(64));
      writeFileSync(join(dir, otherSlice), "x");
      writeFileSync(join(dir, "index.json"), "{}");
      expect(rotateSliceFiles(dir, "beans", cur.file)).toEqual(["beans.sqlite3", old.file].sort());
      expect(readdirSync(dir).sort()).toEqual([cur.file, "beans.sqlite3.json", "index.json", otherSlice].sort());
    }));

  test("a slice that lost a row does not match the store's digest", () =>
    withDir((dir) => {
      const m = buildBeansSlice(fixture.slice(1), dir, root);
      expect(m.contentDigest).not.toBe(expectedContentDigest(BEANS_SLICE, beansData(fixture, root, BASE)));
    }));

  test("bean bodies are written by gen-subgraph-jsonld's payload writer and pass its orphan audit", () =>
    withDir((dir) => {
      const plan = beansData(fixture, root, BASE).payloads;
      // p-dddd's two files have identical bytes, so they share ONE payload.
      expect(plan.payloads.size).toBe(4);
      expect(writePayloads(plan, dir)).toBe(4);
      expect(auditPayloadTree(dir, plan.links)).toEqual([]);
      const link = plan.links.get("beans/defs/p-aaaa--x.md")!;
      expect(link["@id"]).toBe(`https://example.org/site/payload/sha256/${link.sha256}`);
      expect(readFileSync(join(dir, link.sha256), "utf-8")).toBe(fileText(fixture[1]!));
    }));
});

// The bean store is the AGGREGATE's, at its checkout root: cat-harness run as
// its own clone has none, so these two are skipped there, never passed (bean `ho66`).
describe.skipIf(!inAggregate())("gen-slice-sqlite — the real bean store", () => {
  const beans = readBeans(repoRootFor(join(import.meta.dir, "../.."))) ?? [];

  test("rows equal the bean count, and a known bean is queryable by id and by FTS", () =>
    withDir((dir) => {
      expect(beans.length).toBeGreaterThan(100);
      const m = buildSlice(BEANS_SLICE, beansData(beans), dir);
      expect(m.rows.beans).toBe(beans.length);
      const known = beans.find((b) => b.id === "folio-assistant-q8ar")!;
      expect(known).toBeDefined();
      const db = new Database(join(dir, m.file), { readonly: true });
      expect(db.query(`SELECT title, status FROM beans WHERE id = ?`).get(known.id)).toEqual({ title: known.title, status: known.status });
      const ids = (db
        .query(`SELECT b.id FROM beans_fts JOIN beans b ON b.rowid = beans_fts.rowid WHERE beans_fts MATCH ?`)
        .all(`"late materialization"`) as { id: string }[]).map((r) => r.id);
      expect(ids).toContain(known.id);
      db.close();
    }));

  test("--check is green over the store as it is", () => {
    expect(checkSlice(BEANS_SLICE, beansData(beans))).toEqual([]);
  });
});

// ── The engine is table-driven: every definition is complete ──────────────

describe("gen-slice-sqlite — the slice table", () => {
  test("one definition per slice, each naming its FTS rows among its tables and counting every table", () => {
    expect(SLICES.map((s) => s.slice)).toEqual(["beans", "todos", "library", "kg"]);
    for (const d of SLICES) {
      expect(d.tables.map((t) => t.name)).toContain(d.fts.rowsOf);
      for (const t of d.tables) expect(d.counts).toContain(t.name);
      // The search block the generic page reads names the FTS row table's alias.
      expect(d.search.select).toContain(` ${d.search.alias}`);
      expect(d.ddl.some((x) => x.includes(`VIRTUAL TABLE ${d.fts.table} USING fts5`) && x.includes("content = ''"))).toBe(true);
    }
  });
});

// ── Slice: todos ───────────────────────────────────────────────────────────

const INSTANCE = join(import.meta.dir, "../..");
const REPO = repoRootFor(INSTANCE);
const realTodoIndex = JSON.parse(readFileSync(join(INSTANCE, TODO_INDEX), "utf-8"));

describe("gen-slice-sqlite — todos", () => {
  const item = realTodoIndex.items[0];
  const index = {
    ...realTodoIndex,
    items: [
      { ...item, id: "t-bbbb", summary: "Second todo about payload pointers", comment: "Nothing heavy here." },
      { ...item, id: "t-aaaa", summary: "First todo", comment: "The contentless index keeps word positions.\n" },
    ],
  };
  const root = mkdtempSync(join(tmpdir(), "slice-todos-"));
  mkdirSync(join(root, "todos/items"), { recursive: true });
  writeFileSync(join(root, "todos/items/t-aaaa.md"), "---\n$schema: todo/1.0.0\n---\nThe contentless index keeps word positions.\n");
  afterAll(() => rmSync(root, { recursive: true, force: true }));
  const data = () => todosData(index, new Map([["t-aaaa", "todos/items/t-aaaa.md"]]), root, BASE);
  const relations = new Set(item.relations.map((r: { axis: string; label: string }) => `${r.axis} ${r.label}`)).size;

  test("every published todo is a row; a todo with no source file keeps its row, has no payload, and is a finding", () =>
    withDir((dir) => {
      const d = data();
      const m = buildSlice(TODOS_SLICE, d, dir);
      expect(m.rows.todos).toBe(2);
      expect(m.findings).toEqual(["todo t-bbbb: the index publishes it but no source file was found — row kept, no payload"]);
      const db = new Database(join(dir, m.file), { readonly: true });
      const rows = db.query(`SELECT id, payload_sha256 FROM todos ORDER BY rowid`).all() as { id: string; payload_sha256: string | null }[];
      expect(rows.map((r) => r.id)).toEqual(["t-aaaa", "t-bbbb"]);
      expect(rows[0]!.payload_sha256).toBe(createHash("sha256").update(readFileSync(join(root, "todos/items/t-aaaa.md"))).digest("hex"));
      expect(rows[1]!.payload_sha256).toBeNull();
      // The comment is indexed and not stored.
      expect(db.query(`SELECT t.id FROM todos_fts f JOIN todos t ON t.rowid = f.rowid WHERE todos_fts MATCH ?`).all(`"word positions"`)).toEqual([{ id: "t-aaaa" }]);
      expect((db.query(`PRAGMA table_info(todos)`).all() as { name: string }[]).map((c) => c.name)).not.toContain("comment");
      expect(m.rows.todo_relation).toBe(2 * relations);
      db.close();
    }));

  test("--check is green over the fixture, and the row digest catches a lost row", () => {
    expect(checkSlice(TODOS_SLICE, data())).toEqual([]);
    const d = data();
    const lost: SliceData = { ...d, rows: { ...d.rows, todos: d.rows.todos!.slice(1) }, fts: d.fts.slice(1) };
    withDir((dir) => expect(buildSlice(TODOS_SLICE, lost, dir).contentDigest).not.toBe(expectedContentDigest(TODOS_SLICE, d)));
  });

  // The published index is committed here, but its todos' SOURCE files are the
  // aggregate's todo graph; alone, every one would be a missing-source finding.
  test.skipIf(!inAggregate())("the real index slices green, every todo with its source file", async () => {
    const d = (await TODOS_SLICE.load(REPO))!;
    expect(d.rows.todos!.length).toBe(realTodoIndex.items.length);
    expect(d.findings).toEqual([]);
    expect(checkSlice(TODOS_SLICE, d)).toEqual([]);
  });
});

// ── Slice: library ─────────────────────────────────────────────────────────

const realLibraryIndex = JSON.parse(readFileSync(join(INSTANCE, LIBRARY_DIR, "index.json"), "utf-8"));

describe("gen-slice-sqlite — library", () => {
  const e0 = realLibraryIndex.entries[0];
  const index = {
    ...realLibraryIndex,
    entries: [
      { ...e0, id: "lib-b", title: "Second source" },
      { ...e0, id: "lib-a", title: "Handbook for guideline development" },
      { ...e0, id: "lib-c", title: "No entry file" },
    ],
  };
  const block = (id: string, title: string, content: string | null) => ({
    id, types: ["folio-assistant-core:Prose"], kind: "prose", title, pageStart: 1, pageEnd: 2, target: null,
    narrative: null, content, truncated: false, provenance: "ingested", summary: null,
  });
  const entry = (id: string, blocks: unknown[]) => Buffer.from(JSON.stringify({ $schema: "folio-library-entry/v1", id, blocks }));
  const files = new Map<string, Buffer>([
    ["lib-a", entry("lib-a", [block("library/lib-a/blocks/p1", "Rating the certainty", "The GRADE approach rates certainty of evidence."), block("library/lib-a/blocks/p2", "Withheld", null)])],
    ["lib-b", entry("lib-b", [block("library/lib-b/blocks/p1", "Foreword", "A short foreword.")])],
    ["lib-x", entry("lib-x", [])],
  ]);
  const data = () => libraryData(index, files, BASE);

  test("entries and blocks are rows; a block's payload is its PUBLISHED entry file; gaps are findings, not drops", () =>
    withDir((dir) => {
      const d = data();
      const m = buildSlice(LIBRARY_SLICE, d, dir);
      expect(m.rows).toEqual({ entries: 3, blocks: 3, entry_ref: 3 * (e0.referencedBy?.length ?? 0) });
      expect(m.findings).toEqual([
        "entries/lib-x.json is not in the library index — not sliced",
        "library entry lib-c: no entries/lib-c.json — entry row kept, no blocks, no payload",
      ]);
      const db = new Database(join(dir, m.file), { readonly: true });
      const hex = createHash("sha256").update(files.get("lib-a")!).digest("hex");
      expect(db.query(`SELECT DISTINCT payload_sha256 AS p FROM blocks WHERE entry = 'lib-a'`).all()).toEqual([{ p: hex }]);
      expect(db.query(`SELECT payload_sha256 AS p FROM entries WHERE id = 'lib-a'`).get()).toEqual({ p: hex });
      // Block text is searchable and not stored; the entry title is searchable from its blocks.
      const q = (s: string) =>
        (db.query(`SELECT b.id FROM library_fts f JOIN blocks b ON b.rowid = f.rowid WHERE library_fts MATCH ? ORDER BY b.id`).all(s) as { id: string }[]).map((r) => r.id);
      expect(q(`"certainty of evidence"`)).toEqual(["library/lib-a/blocks/p1"]);
      expect(q(`"guideline development"`)).toEqual(["library/lib-a/blocks/p1", "library/lib-a/blocks/p2"]);
      expect((db.query(`PRAGMA table_info(blocks)`).all() as { name: string }[]).map((c) => c.name)).not.toContain("content");
      expect(db.query(`SELECT has_text FROM blocks WHERE id = 'library/lib-a/blocks/p2'`).get()).toEqual({ has_text: 0 });
      db.close();
      expect(checkSlice(LIBRARY_SLICE, d)).toEqual([]);
    }));

  test("the real library slices green, and every indexed entry is a row", async () => {
    const d = (await LIBRARY_SLICE.load(REPO))!;
    expect(d.rows.entries!.length).toBe(realLibraryIndex.entries.length);
    expect(checkSlice(LIBRARY_SLICE, d)).toEqual([]);
  });
});

// ── Slice: kg (the whole repository) ───────────────────────────────────────

describe("gen-slice-sqlite — kg", () => {
  const DOC = "https://example.org/site/x.jsonld";
  const doc = {
    "@id": DOC,
    "@context": {
      ex: "https://example.org/ns#",
      partOf: { "@id": "ex:partOf", "@type": "@id" },
      uses: { "@id": "ex:uses", "@type": "@id" },
      title: "ex:title",
    },
    "@graph": [
      { "@id": `${DOC}#skill/b`, "@type": "https://example.org/ns#Skill", name: "b", title: "Late materialization skill", partOf: `${DOC}#pkg/p`, uses: [`${DOC}#skill/a`, `${DOC}#missing`] },
      { "@id": `${DOC}#skill/a`, "@type": ["https://example.org/ns#Skill"], name: "a", description: "Indexes descriptions without storing them.", partOf: { "@id": `${DOC}#pkg/p` } },
      { "@id": `${DOC}#pkg/p`, "@type": "https://example.org/ns#Package", name: "p" },
    ],
  };

  test("nodes keyed by fragment, every @id-typed term an edge, types compacted, a dangling target reported by the view", () =>
    withDir((dir) => {
      const plan = emptyPlan();
      plan.links.set(`${DOC}#skill/a`, { "@id": `${BASE}/payload/sha256/${"a".repeat(64)}`, sha256: "a".repeat(64), bytes: 9 });
      const d = kgData(doc, plan);
      const m = buildSlice(KG_SLICE, d, dir);
      expect(m.rows).toEqual({ nodes: 3, edges: 4, dangling: 1 });
      const db = new Database(join(dir, m.file), { readonly: true });
      expect(db.query(`SELECT iri, type, payload_sha256 AS p FROM nodes ORDER BY rowid`).all()).toEqual([
        { iri: "pkg/p", type: "ex:Package", p: null },
        { iri: "skill/a", type: "ex:Skill", p: "a".repeat(64) },
        { iri: "skill/b", type: "ex:Skill", p: null },
      ]);
      expect(db.query(`SELECT value FROM meta WHERE key = 'base'`).get()).toEqual({ value: `${DOC}#` });
      expect(db.query(`SELECT src FROM incoming WHERE iri = 'pkg/p' ORDER BY src`).all()).toEqual([{ src: "skill/a" }, { src: "skill/b" }]);
      expect(db.query(`SELECT dst FROM dangling`).all()).toEqual([{ dst: "missing" }]);
      const hit = db.query(`SELECT n.iri FROM kg_fts f JOIN nodes n ON n.rowid = f.rowid WHERE kg_fts MATCH ?`).all(`"without storing"`);
      expect(hit).toEqual([{ iri: "skill/a" }]);
      db.close();
      expect(d.probe).toEqual({ phrase: "materialization skill", column: "iri", value: "skill/b" });
    }));

  test("a pointer at a payload the published tree does not hold fails --check", () => {
    const plan = emptyPlan();
    plan.links.set(`${DOC}#skill/a`, { "@id": `${BASE}/payload/sha256/${"b".repeat(64)}`, sha256: "b".repeat(64), bytes: 1 });
    withDir((dir) => {
      const problems = checkSlice(KG_SLICE as SliceDef, kgData(doc, plan), { publishedPayloadDir: dir });
      expect(problems.some((p) => p.includes("which the published tree does not hold"))).toBe(true);
    });
  });

  test("the whole-repo KG slices green, its pointers resolve to the COMMITTED payloads, and it stays under the budget", async () => {
    const d = (await KG_SLICE.load(REPO))!;
    expect(d.rows.nodes!.length).toBeGreaterThan(1000);
    expect(d.payloads.links.size).toBeGreaterThan(100);
    expect(checkSlice(KG_SLICE, d)).toEqual([]);
    withDir((dir) => expect(buildSlice(KG_SLICE, d, dir).overBudget).toBe(false));
  }, 60_000);
});
