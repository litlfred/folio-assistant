import { describe, expect, test } from "bun:test";
import { z } from "zod";

import { cell, columnsFor, dashboardHtml, fieldsOf, kindDir, nodeHtml, plannedPages, type FieldInfo } from "../gen-node-kind-pages.ts";
import type { NodeKindEntry } from "../../schemas/node-kind-index.ts";
import type { KindNode } from "../../schemas/node-kind-nodes.ts";

/** Issue #2195: generic pages, built from the kind's schema. */

const kind = (id: string, extra: Partial<NodeKindEntry> = {}): NodeKindEntry => ({
  id, version: "1.0.0", tag: `${id}/1.0.0`, parents: [], subclasses: [], declaredBy: "core", holdings: [], ...extra,
});
const node = (k: string, harness: string, path: string, fields: Record<string, unknown>): KindNode => ({
  kind: k, harness, path, file: `${harness}/${path}.json`, node: { $schema: `${k}/1.0.0`, ...fields },
});

describe("fieldsOf", () => {
  test("unwraps optional and default, and keeps an enum's values in order", () => {
    const f = fieldsOf(z.object({ status: z.enum(["open", "done"]).default("open"), note: z.string().optional(), n: z.number() }));
    expect(f).toEqual([
      { name: "status", type: "enum", options: ["open", "done"] },
      { name: "note", type: "string" },
      { name: "n", type: "number" },
    ]);
  });

  test("a value that is not an object schema has no fields, rather than throwing", () => {
    expect(fieldsOf(undefined)).toEqual([]);
  });
});

describe("columnsFor", () => {
  const fields: FieldInfo[] = [
    { name: "$schema", type: "string" }, { name: "zeta", type: "string" }, { name: "status", type: "enum", options: ["a"] },
    { name: "id", type: "string" }, { name: "history", type: "array" }, { name: "title", type: "string" },
  ];
  test("scalars only, preferred names first, never `$schema`", () => {
    expect(columnsFor(fields).map((f) => f.name)).toEqual(["id", "title", "status", "zeta"]);
  });
  test("at most n", () => {
    expect(columnsFor(fields, 2).map((f) => f.name)).toEqual(["id", "title"]);
  });
});

describe("cell", () => {
  test("summarises structure and truncates long text", () => {
    expect(cell([1, 2])).toBe("2 item(s)");
    expect(cell({ a: 1 })).toBe("{…}");
    expect(cell(undefined)).toBe("");
    expect(cell("x".repeat(200)).length).toBe(140);
  });
});

describe("the dashboard", () => {
  const parent = kind("comment", { subclasses: ["public-comment"] });
  const child = kind("public-comment", { parents: ["comment"] });
  const byId = new Map([parent, child].map((k) => [k.id, k]));
  const fields = fieldsOf(z.object({ id: z.string(), status: z.enum(["open", "closed", "merged"]) }));
  const nodes = [
    node("comment", "alpha", "c/one", { id: "C-1", status: "open" }),
    node("public-comment", "beta", "p/two", { id: "P-2", status: "open" }),
    node("public-comment", "beta", "p/three", { id: "P-3", status: "closed" }),
  ];
  const html = dashboardHtml(parent, nodes, fields, byId, "en");

  test("lists the subclass's nodes, and filters by kind and by harness", () => {
    expect(html).toContain("P-2");
    expect(html).toContain('data-filter="kind"');
    expect(html).toContain('data-filter="harness"');
  });

  test("tiles count only values that occur", () => {
    expect(html).toContain("<li><b>2</b>open</li>");
    expect(html).toContain("<li><b>1</b>closed</li>");
    expect(html).not.toContain("merged</li>");
  });

  test("counts per harness, each linking to that harness's page", () => {
    expect(html).toContain('<li><b>2</b><a href="beta/">beta</a></li>');
  });

  test("links each node to its own page, relative to this one", () => {
    expect(html).toContain('href="beta/p/two/"');
  });

  test("a harness page has no harness filter or column, and links back to every harness", () => {
    const one = dashboardHtml(parent, nodes.filter((n) => n.harness === "beta"), fields, byId, "en", "beta");
    expect(one).not.toContain('data-filter="harness"');
    expect(one).toContain('<a href="../">Every harness</a>');
  });

  test("an empty kind says so instead of drawing an empty table", () => {
    expect(dashboardHtml(child, [], fields, byId, "en")).toContain("No node of this kind on this site yet.");
  });
});

describe("the node page", () => {
  const html = nodeHtml(kind("todo"), node("todo", "alpha", "todos/items/x", { summary: "Fix it", refs: [{ kind: "bean", id: "b1" }] }), "en");
  test("titles itself from the node and links to the kind and the harness", () => {
    expect(html).toContain("<h1>Fix it</h1>");
    expect(html).toContain('<a href="../../../../">todo</a>');
    expect(html).toContain('<a href="../../../">alpha</a>');
  });
  test("shows a nested value as JSON rather than flattening it", () => {
    expect(html).toContain("&quot;kind&quot;: &quot;bean&quot;");
  });
});

describe("plannedPages", () => {
  test("a kind page, a page per harness and a page per node, under the locale; an ancestor-only kind has none", () => {
    const index = { kinds: [kind("todo"), { ...kind("themed"), version: undefined, declaredBy: undefined }], unkinded: [], collisions: [] };
    const pages = plannedPages(index, (id) => (id === "todo" ? [node("todo", "alpha", "t/a", {})] : []));
    expect(pages).toEqual(["en/core/todo", "en/core/todo/alpha", "en/core/todo/alpha/t/a"]);
    expect(kindDir("en", kind("todo"))).toBe("en/core/todo");
  });
});
