/**
 * The linear floor renders every note, in document order, with no JavaScript.
 *
 * The unit half. `test/linear-floor.e2e.ts` is the other half: it serves this
 * function's output to a browser with `javaScriptEnabled: false` and asserts a
 * reader can read it. Both are needed and neither replaces the other — this
 * one pins WHAT is emitted, that one pins that a browser given only those
 * bytes shows it.
 *
 * @module scripts/tests/todo-listing.test
 */
import { describe, expect, test } from "bun:test";

import { escapeHtml, renderTodoListing } from "../todo-listing.js";
import { TodoIndexItemSchema } from "../../schemas/todo-index.js";

/** The minimum a note needs to be a valid `TodoIndexItem`. */
function item(over: Record<string, unknown> = {}) {
  return TodoIndexItemSchema.parse({
    id: "a",
    summary: "Decide the thing",
    comment: "First paragraph.\n\nSecond paragraph.",
    status: "open",
    priority: "high",
    createdAt: "2026-09-19",
    tags: { roles: [], processes: [], tasks: [], identities: [], references: [], artefacts: [] },
    relations: [],
    ...over,
  });
}

describe("escapeHtml", () => {
  test("closes every hole a note's prose could open", () => {
    expect(escapeHtml(`<script>alert("x")</script>`)).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;",
    );
    // `&` FIRST, or every other replacement's output is re-escaped. Pinned
    // because the order is invisible in the source and fatal when wrong.
    expect(escapeHtml("&lt;")).toBe("&amp;lt;");
    // Single quotes too: an attribute in this file may be single-quoted by a
    // later edit, and an escaper correct only for today's quoting style is
    // one refactor from a hole.
    expect(escapeHtml("it's")).toBe("it&#39;s");
  });
});

describe("the listing", () => {
  test("renders every note", () => {
    const html = renderTodoListing([item({ id: "a" }), item({ id: "b" }), item({ id: "c" })]);
    for (const id of ["a", "b", "c"]) {
      expect(html).toContain(`data-fa-todo="${id}"`);
    }
  });

  test("in DOCUMENT ORDER — the input's order, never sorted", () => {
    // The board stacks by BPMN subprocess depth. The floor deliberately does
    // not: document order is the property a screen reader and a printout
    // depend on, and a floor that reordered would be a second answer to
    // "what comes next".
    const html = renderTodoListing([
      item({ id: "zeta", summary: "Zeta" }),
      item({ id: "alpha", summary: "Alpha" }),
      item({ id: "mid", summary: "Mid" }),
    ]);
    expect(html.indexOf("Zeta")).toBeLessThan(html.indexOf("Alpha"));
    expect(html.indexOf("Alpha")).toBeLessThan(html.indexOf("Mid"));
  });

  test("the count on the section matches the number of items rendered", () => {
    const items = [item({ id: "a" }), item({ id: "b" })];
    const html = renderTodoListing(items);
    expect(html).toContain(`data-fa-todo-count="2"`);
    expect(html).toContain("Open notes (2)");
    expect(html.match(/data-fa-todo="/g)?.length).toBe(2);
  });

  test("zero notes is a DETERMINED empty and says so", () => {
    // Not the same fact as "the index failed to load", which `docs-ui.js`
    // reports separately. A listing that rendered nothing at all would make
    // the two indistinguishable.
    const html = renderTodoListing([]);
    expect(html).toContain("No notes are open in this folio.");
    expect(html).toContain(`data-fa-todo-count="0"`);
    expect(html).not.toContain("<ol");
  });

  test("a note's prose cannot close a tag", () => {
    const html = renderTodoListing([
      item({
        id: "x",
        summary: `</h3><img src=x onerror="alert(1)">`,
        comment: `</div><script>alert(2)</script>`,
      }),
    ]);
    expect(html).not.toContain("<img");
    expect(html).not.toContain("<script");
    expect(html).toContain("&lt;img");
  });

  test("the attachment is rendered from `target`'s PARTS, never from the label", () => {
    // `sec:<page>-<node>` is ambiguous to split — node ids contain `-` — which
    // is exactly why `target` exists. A renderer that parsed the composite
    // would reintroduce the burden `schemas/todo-index.ts` removed.
    const html = renderTodoListing([
      item({
        id: "x",
        targetLabel: "sec:beans-and-todos-human-todos",
        target: { page: "beans-and-todos", node: "human-todos", label: "sec:beans-and-todos-human-todos" },
      }),
    ]);
    expect(html).toContain("beans-and-todos &rsaquo; human-todos");
  });

  test("a label that resolves to no block is REPORTED, not dropped and not guessed", () => {
    const html = renderTodoListing([
      item({ id: "x", targetLabel: "sec:gone-away" }),
    ]);
    expect(html).toContain("sec:gone-away");
    expect(html).toContain("no block in this build carries this label");
  });

  test("no href is produced when the caller cannot resolve one — `pb04`", () => {
    // A dead link is worse than no link. With no `pageHref` the attachment is
    // still NAMED; it just is not clickable.
    const html = renderTodoListing([
      item({
        id: "x",
        target: { page: "p", node: "n", label: "sec:p-n" },
      }),
    ]);
    expect(html).toContain("p &rsaquo; n");
    expect(html).not.toContain("<a href");
  });

  test("an unresolved relation is text, a resolved one is a link", () => {
    const html = renderTodoListing([
      item({
        id: "x",
        relations: [
          { axis: "bean", label: "folio-assistant-29ij", href: "https://example.invalid/b" },
          { axis: "bean", label: "folio-assistant-gone" },
        ],
      }),
    ]);
    expect(html).toContain(`<a href="https://example.invalid/b">bean: folio-assistant-29ij</a>`);
    expect(html).toContain("<li>bean: folio-assistant-gone</li>");
  });

  test("the caller's `pageHref` is interpolated verbatim, which is how Liquid survives", () => {
    // `gen-docs-pages.ts` passes a Liquid `relative_url` call, because
    // `baseurl` is Jekyll's and a root-relative href would 404 on a site
    // published under a path. The renderer must not escape it.
    const html = renderTodoListing(
      [item({ id: "x", target: { page: "p", node: "n", label: "sec:p-n" } })],
      { pageHref: (page, node) => `{{ '/${page}.html' | relative_url }}#${node}` },
    );
    expect(html).toContain(`href="{{ '/p.html' | relative_url }}#n"`);
    // SINGLE quotes inside a double-quoted attribute. The first version of
    // the generator used double quotes and produced `href="{{ "` — valid
    // Liquid, an attribute terminated after two characters.
    expect(html).not.toContain(`href="{{ "`);
  });
});
