/**
 * Issue #1908 — the todos as one JSON-LD graph, a page per todo, and site
 * nodes published at the IRIs they carry.
 *
 * These read the COMMITTED output as well as the builders, because the claim
 * is about what is published: every todo's JSON-LD and page exist, the
 * graph names every todo, and every `target` edge names a file that is
 * really there.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import jsonld from "jsonld";

import { siteDirFor } from "../../schemas/cat-harness.ts";
import { DOCS_SITE_BASE, SITE_DOCUMENT_CONTEXT, ContentContextSchema, siteIri, siteNodeIri } from "../../schemas/jsonld.ts";
import { TodoIndexSchema, type TodoIndexItem } from "../../schemas/todo-index.ts";
import { thinPageConfigOf, thinPageHtml } from "../thin-page.ts";
import { termIri } from "../../schemas/namespaces.ts";
import { declaredSubgraphNode } from "../kg-export.ts";
import { subgraphPublicationFindings } from "../subgraph-node.ts";
import {
  segment,
  todoDocument,
  todoGraphDocument,
  todoIri,
  todoPageSitePath,
  todoSitePath,
} from "../todo-graph.ts";
import { TODO_PAGE_CONFIG_ID, isTodoPage, todoPageHtml } from "../todo-page.ts";
import { renderTodoListing } from "../todo-listing.ts";

const ROOT = join(import.meta.dir, "..", "..");
const SITE = join(ROOT, siteDirFor(ROOT));
const INDEX = TodoIndexSchema.parse(JSON.parse(readFileSync(join(SITE, "assets/todos/index.json"), "utf8")));

const ITEM: TodoIndexItem = {
  id: "a-todo",
  summary: "Fix the thing",
  comment: "One.\n\nTwo.",
  status: "open",
  priority: "high",
  origin: "agent",
  createdAt: "2026-10-03",
  targetLabel: "sec:p-n",
  target: { page: "p", node: "n", label: "sec:p-n" },
  tags: { roles: [], processes: [], tasks: [], identities: [], references: [], artefacts: [] },
  relations: [
    { axis: "who", label: "github:someone", href: "https://github.com/someone" },
    { axis: "bean", label: "folio-assistant-h32d", href: "https://example.org/bean" },
    { axis: "bean", label: "folio-assistant-zzzz" },
    { axis: "PR", label: "#1", href: "https://github.com/o/r/pull/1" },
    { axis: "process", label: "Process_X" },
  ],
  viewHref: "https://github.com/o/r/blob/main/todos/items/a-todo.md",
};

describe("todo IRIs", () => {
  test("a todo's IRI is the address of its published JSON-LD, under the site", () => {
    expect(todoSitePath("a-todo")).toBe("todos/a-todo.jsonld");
    expect(todoIri("a-todo")).toBe(`${DOCS_SITE_BASE}todos/a-todo.jsonld`);
    expect(DOCS_SITE_BASE).toBe("https://litlfred.github.io/folio-assistant/");
  });
  test("the rendering is a different resource — a directory", () => {
    expect(todoPageSitePath("a-todo")).toBe("todos/a-todo/");
  });
  test("a segment never carries a character that would end a Liquid string", () => {
    expect(segment("it's")).toBe("it%27s");
  });
});

describe("the JSON-LD", () => {
  test("typed edges: target is an IRI edge to the site node; who, bean, PR, process", async () => {
    const doc = todoDocument(ITEM);
    const [node] = (await jsonld.expand(doc as jsonld.JsonLdDocument)) as Array<Record<string, unknown>>;
    expect(node!["@id"]).toBe(todoIri("a-todo"));
    expect(node!["@type"]).toEqual(["http://www.w3.org/2002/12/cal/ical#Vtodo"]);
    const about = node!["https://schema.org/about"] as Array<Record<string, unknown>>;
    expect(about[0]!["@id"]).toBe(siteNodeIri("p", "n"));
    const agent = node!["https://schema.org/agent"] as Array<Record<string, unknown>>;
    expect(agent[0]!["@id"]).toBe("https://github.com/someone");
    const partOf = node!["http://purl.org/dc/terms/isPartOf"] as Array<Record<string, unknown>>;
    expect(partOf.map((b) => b["@id"])).toEqual(["https://example.org/bean", undefined]);
    expect(node!["http://purl.org/dc/terms/references"]).toHaveLength(1);
    expect(node!["http://purl.org/dc/terms/subject"]).toEqual([{ "@value": "Process_X" }]);
  });

  test("the todo carries no link to its rendering", () => {
    expect(JSON.stringify(todoDocument(ITEM))).not.toContain(todoPageSitePath("a-todo"));
  });

  test("an unresolved label keeps the label and gets no edge", () => {
    const { target: _t, ...rest } = ITEM;
    const doc = todoDocument(rest);
    expect(doc["target"]).toBeUndefined();
    expect(doc["label"]).toBe("sec:p-n");
  });

  const SUBGRAPH = { iri: "https://example.org/x/x.jsonld#directory/todos", contentSource: { kind: "directory", declaredIn: "default" } };

  test("the graph is the DECLARED Subgraph node, naming every todo, and each todo points back", () => {
    const g = todoGraphDocument([ITEM], SUBGRAPH);
    expect(g["@id"]).toBe(SUBGRAPH.iri);
    expect(g["@type"]).toBe("Subgraph");
    expect(g["hasPart"]).toEqual([todoIri("a-todo")]);
    expect((g["@graph"] as Array<Record<string, unknown>>)[0]!["@id"]).toBe(todoIri("a-todo"));
    expect(subgraphPublicationFindings(g, { iri: SUBGRAPH.iri })).toEqual([]);
  });

  test("a member's subgraph edge expands to dcterms:isPartOf, beside its bean", async () => {
    const [node] = (await jsonld.expand(todoDocument(ITEM, SUBGRAPH) as jsonld.JsonLdDocument)) as Array<Record<string, unknown>>;
    const partOf = (node!["http://purl.org/dc/terms/isPartOf"] as Array<Record<string, unknown>>).map((b) => b["@id"]);
    expect(partOf).toContain(SUBGRAPH.iri);
    expect(partOf).toContain("https://example.org/bean");
  });

  test("the container's own node expands to the bootstrap Subgraph class", async () => {
    const expanded = (await jsonld.expand(todoGraphDocument([ITEM], SUBGRAPH) as jsonld.JsonLdDocument)) as Array<Record<string, unknown>>;
    const container = expanded.find((n) => n["@id"] === SUBGRAPH.iri)!;
    expect(container["@type"]).toEqual([termIri("Subgraph")]);
  });

  test("without a declared subgraph, no container is invented", () => {
    const g = todoGraphDocument([ITEM]);
    expect(g["@id"]).toBeUndefined();
    expect(g["@type"]).toBeUndefined();
    expect((g["@graph"] as unknown[]).length).toBe(1);
  });
});

describe("the thin page", () => {
  test("canonical self, JSON-LD alternate, no content written in, config readable back", () => {
    const html = todoPageHtml(ITEM, { targetHref: "../../p.html#n" });
    expect(html).toContain(`<link rel="canonical" href="./">`);
    expect(html).toContain(`<link rel="alternate" type="application/ld+json" href="../a-todo.jsonld">`);
    expect(html).toContain(`<meta name="folio-navbar" content="none">`);
    expect(html).not.toContain(ITEM.summary);
    expect(isTodoPage(html)).toBe(true);
    expect(thinPageConfigOf(html, TODO_PAGE_CONFIG_ID)).toMatchObject({ id: "a-todo", targetHref: "../../p.html#n" });
  });
  test("a config cannot close its own script element", () => {
    const html = thinPageHtml({ title: "t", jsonld: "x.jsonld", script: "s.js", configId: "c", config: { x: "</script>" }, body: "" });
    expect(html).not.toContain(`"</script>`);
    expect(thinPageConfigOf(html, "c")).toEqual({ x: "</script>" });
  });
});

describe("the no-JS floor", () => {
  test("links each todo to its own page", () => {
    const html = renderTodoListing([ITEM], { todoPageHref: (id) => `/${todoPageSitePath(id)}` });
    expect(html).toContain(`<a href="/todos/a-todo/">Open this todo</a>`);
  });
});

describe("what is published", () => {
  const graph = JSON.parse(readFileSync(join(SITE, "todos.jsonld"), "utf8")) as Record<string, unknown>;

  test("the graph, as .jsonld and .json, names every todo in the index", () => {
    expect(readFileSync(join(SITE, "todos.json"), "utf8")).toBe(readFileSync(join(SITE, "todos.jsonld"), "utf8"));
    expect(graph["hasPart"]).toEqual(INDEX.items.map((i) => todoIri(i.id)));
  });

  test("its container is the declared todos Subgraph node, and every todo is a member of it", () => {
    const declared = declaredSubgraphNode(ROOT, "todos");
    expect(declared).toBeDefined();
    expect(subgraphPublicationFindings(graph, { iri: declared!.iri })).toEqual([]);
    expect(graph["contentSource"]).toEqual(declared!.contentSource);
  });

  for (const item of INDEX.items) {
    test(`${item.id}: its JSON-LD, its .json and its page exist`, () => {
      expect(existsSync(join(SITE, todoSitePath(item.id)))).toBe(true);
      expect(existsSync(join(SITE, todoSitePath(item.id).replace(/\.jsonld$/, ".json")))).toBe(true);
      expect(isTodoPage(readFileSync(join(SITE, todoPageSitePath(item.id), "index.html"), "utf8"))).toBe(true);
    });
    if (item.target) {
      const { page, node } = item.target;
      test(`${item.id}: its target IRI names a file the site publishes`, () => {
        const iri = siteNodeIri(page, node);
        const file = join(SITE, iri.slice(DOCS_SITE_BASE.length));
        expect(existsSync(file)).toBe(true);
        const doc = JSON.parse(readFileSync(file, "utf8")) as Record<string, unknown>;
        expect(doc["@context"]).toEqual([...SITE_DOCUMENT_CONTEXT]);
        expect(doc["@id"]).toBe(siteIri(page, node));
      });
    }
  }

  test("the site context is one a content record accepts", () => {
    expect(ContentContextSchema.safeParse([...SITE_DOCUMENT_CONTEXT]).success).toBe(true);
  });
});
