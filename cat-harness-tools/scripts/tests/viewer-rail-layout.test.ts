/**
 * The viewer rail's LAYOUT criteria (#1757, bean `0w7q`) — the QA flags
 * `check-viewer-nav.ts` grades, and the two producers they hold to account.
 */
import { HARNESS_ROOT } from "../lib/roots.ts";
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { siteDirFor } from "../../../cat-harness/schemas/cat-harness.ts";
import { layoutFlags, stripFlags, untippedControls } from "../check-viewer-nav.ts";
import { injectRail } from "../../../cat-harness/scripts/lib/harness-rail.ts";
import { withHeadingIds } from "../../../cat-harness/scripts/viewer-page.ts";

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

/* bean `ob3m` finding 1 — the owner's ruling, 2026-10-01, option 1 of 4:
 * *"Make ▦ Harnesses visible on the landing page too, and show each icon's
 * name as a tooltip on hover or keyboard focus."* Each case below FAILED
 * against #1762's head (644d04b9959): `rail-tips` and `harnesses-at-rest`
 * did not exist, `stripFlags` was not exported, and the rail's `⚙` carried
 * no tooltip. */
describe("ob3m finding 1 — tooltips on icon-only controls, ▦ Harnesses at rest", () => {
  const real = (): string => rail(`<h2 id="a">A</h2><h2 id="b">B</h2>`, "todos");
  const gear = (extra: string): string =>
    `<button type="button" class="fa-nav-action" data-fa-harness-config="x" aria-label="Configuration of X"${extra}>⚙︎</button>`;
  const withControl = (html: string, control: string): string => html.replace("</nav>", control + "</nav>");

  it("passes the real rail: every icon-only control is tipped and ▦ Harnesses shows at rest", () => {
    expect(layoutFlags(real())).toEqual([]);
    expect(layoutFlags(withControl(real(), gear(` data-fa-tip="Configuration of X"`)))).toEqual([]);
  });

  it("flags an icon-only control with no tooltip", () => {
    expect(layoutFlags(withControl(real(), gear("")))).toEqual(["rail-tips"]);
  });

  it("flags a tooltip that says something other than the control's name", () => {
    // Two names for one control: the one a sighted keyboard user reads is not
    // the one their screen reader speaks.
    expect(layoutFlags(withControl(real(), gear(` data-fa-tip="Settings"`)))).toEqual(["rail-tips"]);
  });

  it("does NOT ask a labelled row for a tooltip — opening the rail shows its label beside the mark", () => {
    const nav = /<nav class="fa-nav"[\s\S]*?<\/nav>/.exec(real())![0];
    expect(nav).toContain('class="fa-nav-label"');
    expect(untippedControls(nav)).toEqual([]);
  });

  it("flags a tipped control on a page whose stylesheet paints no tooltip on focus", () => {
    const html = withControl(real(), gear(` data-fa-tip="Configuration of X"`)).replace(
      /\.fa-nav \[data-fa-tip\]:hover::after,\.fa-nav \[data-fa-tip\]:focus-visible::after/,
      ".fa-nav [data-fa-tip]:hover::after",
    );
    expect(layoutFlags(html)).toEqual(["rail-tips"]);
  });

  it("the rail's own ⚙ carries the tooltip, equal to its aria-label", async () => {
    const { navbarHtml } = await import("../../../cat-harness/scripts/lib/navbar.ts");
    const nav = navbarHtml({
      instance: "cat-harness",
      harnesses: {
        label: "Harnesses",
        icon: "▦",
        collapsible: true,
        items: [
          {
            label: "WHO IRIS",
            href: "who-iris/",
            action: { data: "data-fa-harness-config", value: "who-iris", label: "Configuration of WHO IRIS", glyph: "⚙︎" },
          },
        ],
      },
    });
    expect(nav).toContain('aria-label="Configuration of WHO IRIS" data-fa-tip="Configuration of WHO IRIS"');
    expect(untippedControls(nav)).toEqual([]);
  });

  it("flags ▦ Harnesses hidden at rest, and not a rule conditioned on another state", () => {
    const hide = (rule: string): string => real().replace("</head>", `<style>${rule}</style></head>`);
    expect(layoutFlags(hide(".fa-nav-group>summary{opacity:0}"))).toEqual(["harnesses-at-rest"]);
    expect(layoutFlags(hide(".x .fa-nav-group > summary{max-height:0;overflow:hidden}"))).toEqual(["harnesses-at-rest"]);
    // Another state, and a pseudo-element: neither is the summary at rest.
    expect(layoutFlags(hide(".fa-nav:hover .fa-nav-group>summary{opacity:0}"))).toEqual([]);
    expect(layoutFlags(hide(".fa-nav-group>summary::marker{display:none}"))).toEqual([]);
  });

  it("flags a rail with no ▦ Harnesses disclosure at all", () => {
    const gone = real().replace(/<details class="fa-nav-group"><summary><span class="fa-nav-glyph"[^>]*>[^<]*<\/span><span class="fa-nav-label">Harnesses<\/span>/, "<details><summary>");
    expect(gone).not.toBe(real());
    expect(layoutFlags(gone)).toContain("harnesses-at-rest");
  });
});

describe("stripFlags — the same two questions of the docs site's strip", () => {
  const INSTANCE = HARNESS_ROOT;
  const DOCS = join(INSTANCE, siteDirFor(INSTANCE));
  const JS = readFileSync(join(DOCS, "assets", "js", "docs-ui.js"), "utf-8");
  const CSS = readFileSync(join(DOCS, "assets", "css", "docs-ui.css"), "utf-8");
  const ROW = readFileSync(join(DOCS, "assets", "js", "navbar-row.js"), "utf-8");

  it("passes the shipped docs-ui.js, navbar-row.js and docs-ui.css", () => {
    expect(stripFlags(JS, CSS, ROW)).toEqual([]);
  });

  it("flags a row control built without data-fa-tip", () => {
    const row = ROW.replace(/, "data-fa-tip": LABELS\.launcher/, "");
    expect(row).not.toBe(ROW);
    expect(stripFlags(JS, CSS, row)).toEqual(["rail-tips"]);
  });

  it("flags the light/dark switch when its painter stops writing the tooltip", () => {
    const js = JS.replace(/\s*scheme\.setAttribute\("data-fa-tip", said\);/, "");
    expect(js).not.toBe(JS);
    expect(stripFlags(js, CSS, ROW)).toEqual(["rail-tips"]);
  });

  it("flags a stylesheet that shows the tooltip on hover only", () => {
    const css = CSS.replace(/,\s*\.side-bar \[data-fa-tip\]:focus-visible::after/, "");
    expect(css).not.toBe(CSS);
    expect(stripFlags(JS, css, ROW)).toEqual(["rail-tips"]);
  });

  it("flags ▦ Harnesses left to the at-rest lists, which hide it", () => {
    // The rule may be a selector LIST: #1808 adds the rail's
    // `.fa-nav-harness-group` beside the footer's group in one rule.
    const css = CSS.replace(/\.side-bar \.fa-nav-bottom > \.fa-nav-group > summary(?:,\s*[^{,]+)* \{[^}]*\}/, "");
    expect(css).not.toBe(CSS);
    expect(stripFlags(JS, css, ROW)).toEqual(["harnesses-at-rest"]);
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
    const { navbarCss } = await import("../../../cat-harness/scripts/lib/navbar.ts");
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

describe("a declared mark is drawn, never replaced by the letter — bean `2vpn`", () => {
  // Owner, 2026-10-04: *"who-iris is missing top icon on LHS navbar"*. The
  // header drew "W" while who-iris's row carried a mark, and the letter
  // passed `clickable-mark` because a letter is the floor.
  const headed = (mark?: Record<string, unknown>): string =>
    injectRail(page(`<h2 id="a">A</h2><h2 id="b">B</h2>`), {
      instance: "WHO IRIS",
      toRoot: "..",
      links: [{ label: "beans", href: "../beans/" }],
      harnesses: [{ label: "WHO IRIS", href: "../who-iris/" }],
      visualiserLabel: "todos",
      ...(mark ? { mark } : {}),
    })!;

  it("a glyph mark renders as an <svg> in the header", () => {
    const html = headed({ glyphPath: "M3 18h18", tone: 199 });
    const head = /<label class="fa-nav-head"[\s\S]*?<\/label>/.exec(html)![0];
    expect(head).toContain("<svg");
    expect(layoutFlags(html, new Set(["WHO IRIS"]))).toEqual([]);
  });

  it("a LETTER for a harness that has a mark is the `declared-mark` finding", () => {
    expect(layoutFlags(headed(), new Set(["WHO IRIS"]))).toContain("declared-mark");
  });

  it("a letter for a harness with NO mark is still the floor, not a finding", () => {
    expect(layoutFlags(headed(), new Set())).not.toContain("declared-mark");
  });
});
