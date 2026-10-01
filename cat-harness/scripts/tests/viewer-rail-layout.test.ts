/**
 * The viewer rail's LAYOUT criteria (#1757, bean `0w7q`) — the QA flags
 * `check-viewer-nav.ts` grades, and the two producers they hold to account.
 */
import { describe, expect, it } from "bun:test";

import { layoutFlags } from "../check-viewer-nav.ts";
import { injectRail } from "../lib/harness-rail.ts";
import { todoListing } from "../state-visualizer.ts";
import { withHeadingIds } from "../viewer-page.ts";

const page = (body: string): string => `<!doctype html><html><head></head><body>${body}</body></html>`;
const rail = (body: string, label?: string): string =>
  injectRail(page(body), {
    instance: "cat-harness",
    toRoot: "..",
    links: [{ label: "beans", href: "../beans/" }],
    harnesses: [{ label: "WHO IRIS", href: "../who-iris/" }],
    ...(label ? { visualiserLabel: label } : {}),
  })!;

describe("layoutFlags", () => {
  it("passes a rail with a marked header and one open section of its own", () => {
    expect(layoutFlags(rail(`<h2 id="a">A</h2><h2 id="b">B</h2>`, "todos"))).toEqual([]);
  });

  it("flags a page with no section of its own, and Graphs open instead", () => {
    expect(layoutFlags(rail(`<h1>only a title</h1>`))).toEqual(["visualiser-nav", "single-open"]);
  });

  it("flags the old ☰ header and its [x]", () => {
    const old =
      `<nav class="fa-nav"><label class="fa-nav-close" for="fa-nav-open">x</label>` +
      `<label class="fa-nav-head" for="fa-nav-open"><span class="fa-nav-glyph" aria-hidden="true">&#9776;</span></label></nav>`;
    const f = layoutFlags(page(old));
    expect(f).toContain("clickable-mark");
    expect(f).toContain("no-redundant-toggle");
  });

  it("flags a hamburger-SHAPED group glyph, which reads as the toggle that was removed", () => {
    const real = rail(`<h2 id="a">A</h2><h2 id="b">B</h2>`, "todos");
    expect(real).not.toMatch(/fa-nav-glyph[^>]*>≡</);
    const burger = real.replace(/(<details class="fa-nav-group" open><summary><span class="fa-nav-glyph"[^>]*>)[^<]*/, "$1≡");
    expect(burger).not.toBe(real);
    expect(layoutFlags(burger)).toEqual(["no-redundant-toggle"]);
  });

  it("flags a rail with no header at all", () => {
    expect(layoutFlags(page(`<nav class="fa-nav"></nav>`))).toContain("header");
  });

  it("grades nothing on a page with no rail — that is `missing`, not five flags", () => {
    expect(layoutFlags(page("<p>x</p>"))).toEqual([]);
  });
});

describe("todoListing", () => {
  const items = [
    { id: "a", summary: "first", target: { page: "beans-and-todos" } },
    { id: "b", summary: "second", target: { page: "publication-workflow" } },
    { id: "c", summary: "loose" },
  ];

  it("groups by the node a todo is attached to, unattached last", () => {
    const { html } = todoListing(items);
    const order = [...html.matchAll(/<h3>([^<]*)<\/h3>/g)].map((m) => m[1]);
    expect(order).toEqual(["beans-and-todos", "publication-workflow", "attached to no node"]);
  });

  it("links every nav row to an id the listing carries", () => {
    const { html, nav } = todoListing(items);
    for (const m of nav.matchAll(/"href":"#([^"]+)"/g)) expect(html).toContain(`id="${m[1]}"`);
  });

  it("cannot close its own script element", () => {
    const { nav } = todoListing([{ id: "x", summary: "</script><b>" }]);
    expect(nav.indexOf("</script>")).toBe(nav.length - "</script>".length);
  });
});

describe("withHeadingIds", () => {
  it("mints ids for bare headings, keeping existing ones and avoiding collisions", () => {
    const out = withHeadingIds(`<h2 id="sec-a">x</h2><h2>A</h2><h3>A</h3>`);
    expect(out).toContain(`<h2 id="sec-a">x</h2>`);
    expect(out).toContain(`<h2 id="sec-a-2">A</h2>`);
    expect(out).toContain(`<h3 id="sec-a-3">A</h3>`);
  });

  it("never edits a heading inside a script", () => {
    const js = `<script>var s = "<h2>" + t + "</h2>";</script>`;
    expect(withHeadingIds(js)).toBe(js);
  });
});

describe("sibling rows in a group share one indent (owner, 2026-10-01)", () => {
  // The schemas rail put a label-only `all` one step LEFT of the linked
  // subjects beside it: `.fa-nav-dead` took the bare pad while a sub-group
  // link took pad + one glyph step. Same depth must mean same indent.
  it("a label-only row is indented like a linked one; a kind row stays flush", async () => {
    const { navbarCss } = await import("../lib/navbar.ts");
    const css = navbarCss();
    const pad = (selector: string): string | undefined =>
      new RegExp(`${selector.replace(/[.]/g, "\\.")}\\{padding-left:(\\d+)px`).exec(css)?.[1];
    const link = pad(".fa-nav-group .fa-nav-sub a");
    const dead = pad(".fa-nav-group .fa-nav-sub .fa-nav-dead");
    expect(link).toBeDefined();
    expect(dead).toBe(link);
    expect(css).toContain(".fa-nav-group .fa-nav-sub .fa-nav-dead.fa-nav-kind{");
  });
});
