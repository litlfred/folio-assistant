import { describe, expect, test } from "bun:test";
import { z } from "zod";

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  cell, columnsFor, dashboardHtml, dashboardSection, fieldsOf, isKindPages, kindDir, nodeHtml, nodeSection, PAGE_MARK, plannedPages,
  unresolvedPages, type FieldInfo,
} from "../gen-node-kind-pages.ts";
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

  test("links each node to its page under the kind it IS — one address per node", () => {
    expect(html).toContain('href="alpha/c/one/"');
    expect(html).toContain('href="../public-comment/beta/p/two/"');
  });

  test("a renderer's sections sit between the tiles and the table", () => {
    const withExtra = dashboardHtml(parent, nodes, fields, byId, "en", undefined, [{ id: "coverage", label: "Coverage", html: "<p>X</p>" }]);
    expect(withExtra).toMatch(/By status[\s\S]*<h2 id="coverage">Coverage<\/h2>\n<p>X<\/p>[\s\S]*<h2 id="nodes">/);
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
  test("a renderer's sections come before the fields", () => {
    const n = node("todo", "alpha", "t/x", {});
    expect(nodeHtml(kind("todo"), n, "en", [{ id: "comments", label: "Comments", html: "<p>Y</p>" }])).toMatch(
      /<h2 id="comments">Comments<\/h2>\n<p>Y<\/p>\n<h2 id="fields">Fields<\/h2>/,
    );
  });
});

describe("plannedPages", () => {
  test("a kind page, a page per harness and a page per node, under the locale; an ancestor-only kind has none", () => {
    const index = { kinds: [kind("todo"), { ...kind("themed"), version: undefined, declaredBy: undefined }], unkinded: [], collisions: [] };
    const pages = plannedPages(index, (id) => (id === "todo" ? [node("todo", "alpha", "t/a", {})] : []));
    expect(pages).toEqual(["en/core/todo", "en/core/todo/alpha", "en/core/todo/alpha/t/a"]);
    expect(kindDir("en", kind("todo"))).toBe("en/core/todo");
  });

  test("a subclass's node gets its page under its own kind only, though its parent's pages list it", () => {
    const index = { kinds: [kind("todo", { subclasses: ["sub"] }), kind("sub", { parents: ["todo"] })], unkinded: [], collisions: [] };
    const sub = node("sub", "alpha", "s/a", {});
    const pages = plannedPages(index, (id) => (id === "todo" ? [sub] : id === "sub" ? [sub] : []));
    expect(pages).toEqual(["en/core/todo", "en/core/todo/alpha", "en/core/sub", "en/core/sub/alpha", "en/core/sub/alpha/s/a"]);
  });
});

describe("unresolvedPages", () => {
  test("a planned page resolves only when it exists AND this generator wrote it", () => {
    const site = mkdtempSync(join(tmpdir(), "nk-site-"));
    try {
      mkdirSync(join(site, "en/a"), { recursive: true });
      writeFileSync(join(site, "en/a/index.html"), `<body ${PAGE_MARK}>`);
      mkdirSync(join(site, "en/b"), { recursive: true });
      writeFileSync(join(site, "en/b/index.html"), "<body>someone else's</body>");
      expect(unresolvedPages(site, ["en/a", "en/b", "en/c"])).toEqual(["en/b", "en/c"]);
    } finally {
      rmSync(site, { recursive: true, force: true });
    }
  });

  test("a renderer must provide at least one of its two hooks", () => {
    expect(isKindPages({ node: () => [] })).toBe(true);
    expect(isKindPages({})).toBe(false);
  });
});

describe("each page's own rail section (#1757)", () => {
  const k = kind("todo");
  const fields = fieldsOf(z.object({ status: z.enum(["open", "done"]) }));
  const nodes = [node("todo", "alpha", "t/a", { status: "open" }), node("todo", "beta", "t/b", {})];

  test("the kind page opens on itself with its regions, and links each harness page", () => {
    const s = dashboardSection(k, nodes, fields);
    expect(s[0]).toEqual({ label: "todo", items: [
      { label: "By harness", href: "#by-harness" }, { label: "By status", href: "#by-status" }, { label: "Nodes", href: "#nodes" },
    ] });
    expect(s.slice(1)).toEqual([{ label: "alpha", href: "alpha/" }, { label: "beta", href: "beta/" }]);
  });

  test("a harness page opens on its own row, and a tile region only where a value occurs", () => {
    const s = dashboardSection(k, nodes, fields, "beta");
    expect(s.find((e) => e.label === "beta")?.items).toEqual([{ label: "Nodes", href: "#nodes" }]);
    expect(s[0]).toEqual({ label: "todo", href: "../" });
  });

  test("a node page links up to its kind and its harness, however deep its path", () => {
    expect(nodeSection(k, node("todo", "alpha", "todos/items/x", {}))).toEqual([
      { label: "todo", href: "../../../../" },
      { label: "alpha", href: "../../../" },
      { label: "x", items: [{ label: "Fields", href: "#fields" }] },
    ]);
  });

  test("a renderer's sections are regions in the rail too", () => {
    expect(nodeSection(k, node("todo", "alpha", "t/x", {}), [{ id: "comments", label: "Comments" }])[2]).toEqual({
      label: "x",
      items: [{ label: "Comments", href: "#comments" }, { label: "Fields", href: "#fields" }],
    });
    expect(dashboardSection(k, nodes, fields, undefined, [{ id: "coverage", label: "Coverage" }])[0]!.items!.map((i) => i.href)).toContain("#coverage");
  });
});
