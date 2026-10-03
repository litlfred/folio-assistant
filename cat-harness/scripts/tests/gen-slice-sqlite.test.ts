import { afterAll, describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { repoRootFor } from "../../schemas/cat-harness.ts";
import { readBeans, type BeanNode } from "../beans.ts";
import { auditPayloadTree } from "../gen-subgraph-jsonld.ts";
import {
  beanEdges,
  beanPayloadPlan,
  buildBeansSlice,
  checkBeansSlice,
  databaseContentDigest,
  expectedContentDigest,
  writeBeanPayloads,
} from "../gen-slice-sqlite.ts";

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
      const m = buildBeansSlice(fixture, join(dir, "s.sqlite3"), root);
      expect(m.rows.beans).toBe(5);
      expect(m.duplicateIds).toEqual(["p-dddd"]);
      // bbbb→cccc is declared on BOTH sides: two rows, one edge in each view.
      expect(beanEdges(fixture)).toHaveLength(3);
      expect(m.rows.bean_block).toBe(3);
      expect(m.rows.blocked_by).toBe(2);
      expect(m.rows.bean_tags).toBe(2);
      const db = new Database(join(dir, "s.sqlite3"), { readonly: true });
      expect(db.query(`SELECT blocker FROM blocked_by WHERE id = 'p-cccc' ORDER BY blocker`).all()).toEqual([
        { blocker: "p-aaaa" },
        { blocker: "p-bbbb" },
      ]);
      db.close();
    }));

  test("bodies are NOT stored — the slice carries the payload sha256 — yet FTS5 finds a phrase in a body", () =>
    withDir((dir) => {
      buildBeansSlice(fixture, join(dir, "s.sqlite3"), root);
      const db = new Database(join(dir, "s.sqlite3"), { readonly: true });
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
      const a = buildBeansSlice(fixture, join(dir, "a.sqlite3"), root);
      const b = buildBeansSlice([...fixture].reverse(), join(dir, "b.sqlite3"), root);
      expect(b.sha256).toBe(a.sha256);
      expect(readFileSync(join(dir, "a.sqlite3")).equals(readFileSync(join(dir, "b.sqlite3")))).toBe(true);
      expect(a.contentDigest).toBe(expectedContentDigest(fixture, root));
      const db = new Database(join(dir, "a.sqlite3"), { readonly: true });
      expect(databaseContentDigest(db)).toBe(a.contentDigest);
      db.close();
    }));

  test("a slice that lost a row does not match the store's digest", () =>
    withDir((dir) => {
      const m = buildBeansSlice(fixture.slice(1), join(dir, "s.sqlite3"), root);
      expect(m.contentDigest).not.toBe(expectedContentDigest(fixture, root));
    }));

  test("bean bodies are written by gen-subgraph-jsonld's payload writer and pass its orphan audit", () =>
    withDir((dir) => {
      const plan = beanPayloadPlan(fixture, root, "https://example.org/site");
      // p-dddd's two files have identical bytes, so they share ONE payload.
      expect(plan.payloads.size).toBe(4);
      expect(writeBeanPayloads(plan, dir)).toBe(4);
      expect(auditPayloadTree(dir, plan.links)).toEqual([]);
      const link = plan.links.get("beans/defs/p-aaaa--x.md")!;
      expect(link["@id"]).toBe(`https://example.org/site/payload/sha256/${link.sha256}`);
      expect(readFileSync(join(dir, link.sha256), "utf-8")).toBe(fileText(fixture[1]!));
    }));
});

describe("gen-slice-sqlite — the real bean store", () => {
  const beans = readBeans(repoRootFor(join(import.meta.dir, "../.."))) ?? [];

  test("rows equal the bean count, and a known bean is queryable by id and by FTS", () =>
    withDir((dir) => {
      expect(beans.length).toBeGreaterThan(100);
      const m = buildBeansSlice(beans, join(dir, "beans.sqlite3"));
      expect(m.rows.beans).toBe(beans.length);
      const known = beans.find((b) => b.id === "folio-assistant-q8ar")!;
      expect(known).toBeDefined();
      const db = new Database(join(dir, "beans.sqlite3"), { readonly: true });
      expect(db.query(`SELECT title, status FROM beans WHERE id = ?`).get(known.id)).toEqual({ title: known.title, status: known.status });
      const ids = (db
        .query(`SELECT b.id FROM beans_fts JOIN beans b ON b.rowid = beans_fts.rowid WHERE beans_fts MATCH ?`)
        .all(`"late materialization"`) as { id: string }[]).map((r) => r.id);
      expect(ids).toContain(known.id);
      db.close();
    }));

  test("--check is green over the store as it is", () => {
    expect(checkBeansSlice(beans)).toEqual([]);
  });
});
