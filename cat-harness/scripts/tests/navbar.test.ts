/**
 * The shared navbar — its three regions, and the rail as an adapter over it.
 *
 * Owner, 2026-09-21: *"we should have same navbar across all folios though.
 * presented same way. need to comine the two."*
 *
 * This replaces `harness-rail.test.ts`, which tested a rail that owned its own
 * markup. It does not any more: `lib/navbar.ts` renders, `harness-rail.ts`
 * builds a model, and `mount-instance-docs.ts` injects. **The assertions that
 * matter moved with the code** — they are now about the REGIONS, because the
 * regions are what the owner specified and what a second caller (the Jekyll
 * sidebar, after #791 lands) has to be able to satisfy.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  NAV_COLLAPSED_PX,
  NAV_GLYPH_PX,
  NAV_OPEN_PX,
  NAV_PAD_PX,
  injectNavbar,
  navbarCss,
  navbarHtml,
  type NavbarModel,
} from "../lib/navbar.js";
import { injectRail, railModel } from "../lib/harness-rail.js";
import { documentIndexOf } from "../lib/navbar.js";
import {
  BEGIN,
  END,
  NAVBAR_GEOMETRY_MARKER_ERROR,
  navbarGeometryCssPath,
  renderNavbarGeometryCss,
  withGeometry,
} from "../gen-navbar-geometry-css.js";
import { publishedUrlOf, solveCrop } from "../harness-tiles.js";
import { instanceRootFor, siteDirFor } from "../../schemas/cat-harness.js";
import { declaredGraphs, toRootFor, visualiserHref } from "../mount-instance-docs.js";

const model: NavbarModel = {
  instance: "who-iris",
  root: { href: "../who-iris/", label: "who-iris", icon: "◆", current: true },
  graphs: {
    label: "Graphs",
    items: [
      { href: "../docs/who-iris/", label: "docs", icon: "D" },
      // Declared with no published viewer — a GAP, drawn as a non-link, and
      // now SAYING which of the four reasons applies. The wording is the
      // generator's (`inertNote`); nothing in the renderer chooses it.
      { label: "catalogue", icon: "C", note: "no viewer yet" },
    ],
    collapsible: true,
    open: true,
  },
  harnesses: {
    label: "Harnesses",
    items: [
      { href: "../who-iris/", label: "who-iris" },
      { href: "../", label: "cat-harness", avatar: { src: "../assets/img/icons/cat-mark.svg" }, tone: 268 },
      { label: "bootstrap", tone: 96 },
    ],
    collapsible: true,
  },
  home: { href: "../", label: "folio-assistant", icon: "⌂" },
};

/**
 * Everything between a region's opening div and the NEXT REGION's.
 *
 * Bound to the three region names rather than to "the next `fa-nav-` div".
 * The first version did the latter and cut `fa-nav-top` short at the
 * `fa-nav-sub` inside its own `<details>` — reporting the document index as
 * missing from the region it was sitting in. A helper that is almost right
 * fails the code, not itself.
 */
const REGIONS = ["fa-nav-top", "fa-nav-graphs", "fa-nav-bottom"] as const;
const region = (html: string, cls: (typeof REGIONS)[number]): string => {
  const at = html.indexOf(`<div class="${cls}">`);
  expect({ cls, found: at > -1 }).toEqual({ cls, found: true });
  const next = REGIONS.map((r) => html.indexOf(`<div class="${r}">`, at + 1))
    .filter((i) => i > -1)
    .sort((a, b) => a - b)[0];
  return html.slice(at, next ?? html.length);
};

describe("three regions, and only the middle one scrolls", () => {
  const css = navbarCss();

  it("the middle grows and scrolls; the other two do neither", () => {
    // "KG libraries is a scrollable stacks between fixed top an bottom parts".
    expect(css).toContain(".fa-nav-top{flex:0 0 auto}");
    expect(css).toContain(".fa-nav-graphs{flex:1 1 auto;min-height:0;overflow-y:auto");
    expect(css).toContain(".fa-nav-bottom{flex:0 0 auto");
  });

  it("the middle declares `min-height:0`, or the fixed bottom scrolls away", () => {
    // NOT a tidy-up. A flex child defaults to `min-height:auto`, which refuses
    // to shrink below its content — so the column grows past the viewport and
    // the bottom region goes off-screen, taking the harnesses and home with
    // it. The failure looks like "the navbar lost its footer", not like a
    // layout bug.
    const rule = css.slice(css.indexOf(".fa-nav-graphs{"), css.indexOf("}", css.indexOf(".fa-nav-graphs{")));
    expect(rule).toContain("min-height:0");
  });

  it("renders the regions in the owner's order", () => {
    const html = navbarHtml(model);
    expect(html.indexOf("fa-nav-top")).toBeLessThan(html.indexOf("fa-nav-graphs"));
    expect(html.indexOf("fa-nav-graphs")).toBeLessThan(html.indexOf("fa-nav-bottom"));
  });

  it("puts the graphs in the MIDDLE and the harnesses and home in the BOTTOM", () => {
    // The regions are structural, so an item in the wrong one is a real
    // defect: a harness in the scrollable middle scrolls away, and a graph in
    // the fixed bottom eats the space the middle needs.
    const html = navbarHtml(model);
    expect(region(html, "fa-nav-graphs")).toContain("../docs/who-iris/");
    const bottom = html.slice(html.indexOf('<div class="fa-nav-bottom">'));
    expect(bottom).toContain("Harnesses");
    expect(bottom).toContain("folio-assistant");
    expect(region(html, "fa-nav-graphs")).not.toContain("Harnesses");
  });

  it("the instance's ROOT is in the fixed top, not inside the graphs group", () => {
    // A group labelled "Graphs" containing the instance itself is a label that
    // does not tell the truth — and the root is the one destination that must
    // stay reachable when the graphs are folded away, since the `☰` beside it
    // is a toggle rather than a link.
    const html = navbarHtml(model);
    expect(region(html, "fa-nav-top")).toContain('aria-current="page"');
    expect(region(html, "fa-nav-graphs")).not.toContain("../who-iris/");
  });

  it("the graphs FOLD IN ONE CLICK, and arrive open", () => {
    // Owner: "librarues should be in hambuger menu so can collase all". Open
    // by default, because a navbar whose content arrives folded looks empty.
    const html = navbarHtml(model);
    expect(region(html, "fa-nav-graphs")).toContain('<details class="fa-nav-group" open>');
  });

  it("an inert row SAYS why, in text a screen reader gets for free", () => {
    // THIS IS THE ASSERTION THAT WAS MISSING, and its absence is what let the
    // two navbars diverge. The Jekyll sidebar said why with
    // `title="declared, with no published viewer"` on a `<span>` — hover-only,
    // no keyboard path, not reliably announced — and this rail said nothing
    // whatever: `opacity:.55` and no words, state carried by contrast alone.
    // Both are `gjli`; the fix for both is that the reason is CONTENT.
    const graphs = region(navbarHtml(model), "fa-nav-graphs");
    expect(graphs).toContain('<span class="fa-nav-note">no viewer yet</span>');
    // Inside the same element as the label, so it is read as one row rather
    // than as a label and a detached aside.
    expect(graphs).toMatch(/<span class="fa-nav-dead">.*?catalogue.*?no viewer yet.*?<\/span>/s);
    // NOT `aria-disabled`, and this is the owner's "so it does not read as a
    // control": nothing here is disabled, because nothing here is a control.
    // Marking a `<span>` disabled announces a widget that does not exist.
    expect(graphs).not.toContain("aria-disabled");
    // And not `title` either — the thing that was already tried.
    expect(graphs).not.toContain("title=");
  });

  it("a row that OPENS carries no note — only an inert row owes a reason", () => {
    const graphs = region(navbarHtml(model), "fa-nav-graphs");
    const docs = graphs.slice(graphs.indexOf("../docs/who-iris/"));
    expect(docs.slice(0, docs.indexOf("</a>"))).not.toContain("fa-nav-note");
  });

  it("a declared graph with NO viewer is listed, as a non-link", () => {
    // "there shuold be all the harness controlled dirs/graphs". Omitting the
    // unpublished ones answers "what is in this KG" with a shorter and wronger
    // list than the declaration gives. `harness-tiles` words it exactly right:
    // declared and not rendered is a GAP, not a dead link — and `pb04` is why
    // it must not be drawn as a link.
    const graphs = region(navbarHtml(model), "fa-nav-graphs");
    expect(graphs).toContain("catalogue");
    expect(graphs).toContain('<span class="fa-nav-dead">');
    expect(graphs).not.toContain('href="undefined"');
  });

  it("home is LAST in the bottom — the owner asked for it there by name", () => {
    // "keep home at bottom for who iris."
    const bottom = navbarHtml(model).slice(navbarHtml(model).indexOf('<div class="fa-nav-bottom">'));
    expect(bottom.indexOf("Harnesses")).toBeLessThan(bottom.lastIndexOf("folio-assistant"));
  });
});

describe("the exploding menu", () => {
  it("is a <details>, so it works with no script and announces its state", () => {
    // The reason `nav_footer_custom.html` already gives: this IS navigation,
    // and a scripted disclosure is one a keyboard and a screen reader have to
    // be told about separately.
    const html = navbarHtml(model);
    expect(html).toContain('<details class="fa-nav-group"');
    expect(html).toContain("<summary>");
    expect(html.toLowerCase()).not.toContain("<script");
    expect(html.toLowerCase()).not.toContain("onclick");
  });

  it("uses a harness's AVATAR when it has one and its initial when it does not", () => {
    // `603s`/#791 is landing the avatars; they arrive through the model and
    // nothing in the renderer changes. Until then an item falls back to an
    // initial — not a question mark, because a navbar is not the place to
    // render a gap as a glyph.
    const html = navbarHtml(model);
    expect(html).toContain('<img src="../assets/img/icons/cat-mark.svg"');
    expect(html).toContain(">B</span>"); // bootstrap, no avatar declared
  });

  it("carries a declared tone through to the mark", () => {
    expect(navbarHtml(model)).toContain("hsl(268 45% 28%)");
  });

  it("an item with nowhere to go is NOT a link", () => {
    // `pb04`: a dead link is worse than no link, because it invites a click
    // and then reads as "this site is broken". `bootstrap` has href null.
    const html = navbarHtml(model);
    expect(html).toContain('<span class="fa-nav-dead">');
    expect(html).not.toContain('<a href="undefined"');
  });
});

describe("at rest it is a strip, and opens three ways", () => {
  const css = navbarCss();

  it("rests at exactly the glyph column and its gutters", () => {
    expect(NAV_COLLAPSED_PX).toBe(NAV_PAD_PX * 2 + NAV_GLYPH_PX);
    expect(css).toContain(`width:${NAV_COLLAPSED_PX}px`);
    expect(css).toContain(`body{padding-left:${NAV_COLLAPSED_PX}px}`);
  });

  it("is CLOSED, not gone", () => {
    // The correction that cost a round: "clicking it away completelt
    // disappeared … i expected … that it slides to the far left, icon width
    // thick."
    expect(css).not.toContain("visibility:hidden");
    expect(css).not.toContain("translateX(-100%)");
  });

  it("opens on hover, on keyboard focus, and on the pinned checkbox", () => {
    expect(css).toContain(
      `.fa-nav:hover,.fa-nav:focus-within,.fa-nav:has(.fa-nav-open:checked){width:${NAV_OPEN_PX}px}`,
    );
  });

  it("shows the [x] only while pinned", () => {
    expect(css).toContain(".fa-nav-close{display:none}");
    expect(css).toContain(".fa-nav:has(.fa-nav-open:checked) .fa-nav-close");
  });

  it("both controls drive ONE checkbox", () => {
    const html = navbarHtml(model);
    const id = /<input[^>]*class="fa-nav-open"[^>]*id="([^"]+)"/.exec(html)?.[1];
    expect(id).toBeDefined();
    expect([...html.matchAll(new RegExp(`for="${id}"`, "g"))]).toHaveLength(2);
  });

  it("escapes what it is given", () => {
    const html = navbarHtml({ ...model, instance: '<img src=x onerror="pwn">' });
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;img");
  });
});

describe("the document index sits in the FIXED top", () => {
  it("appears there when a document is open", () => {
    // "when a document or other indexed object is opened, the document
    // index/idices are shown in a navbar tab/menu." In the fixed top, because
    // it is about the thing the reader is looking at rather than about the
    // graph they are in — so it must not scroll away with the graphs.
    const html = navbarHtml({
      ...model,
      documentIndex: { label: "Contents", items: [{ href: "#s1", label: "Introduction" }], collapsible: true },
    });
    expect(region(html, "fa-nav-top")).toContain("Introduction");
  });

  it("is ABSENT when nothing is open, not empty", () => {
    // An empty disclosure labelled "Contents" invites a click that does
    // nothing.
    expect(navbarHtml(model)).not.toContain("Contents");
  });
});

describe("the rail is an adapter, not a second navbar", () => {
  const opts = { instance: "who-iris", toRoot: "..", links: model.graphs.items };

  it("builds a model rather than markup", () => {
    const m = railModel(opts);
    expect(m.instance).toBe("who-iris");
    expect(m.graphs.items).toEqual(model.graphs.items);
    expect(m.graphs.collapsible).toBe(true);
    expect(m.home?.href).toBe("../");
  });

  it("OMITS the harnesses region when it could not be read", () => {
    // Third state, said by absence: `[]` would render an empty "Harnesses"
    // disclosure, which reads as a site with no harnesses rather than as a
    // navbar that could not find out.
    expect(railModel(opts).harnesses).toBeUndefined();
    expect(railModel({ ...opts, harnesses: [{ label: "x" }] }).harnesses?.items).toHaveLength(1);
  });

  describe("injection", () => {
    const page = '<!doctype html><html><body><nav class="main">IRIS</nav><p>x</p></body></html>';

    it("puts the navbar first in the DOM and leaves the page intact", () => {
      const out = injectRail(page, opts)!;
      expect(out).toContain('<nav class="main">'); // the host's own chrome survives
      expect(out.indexOf("fa-nav")).toBeLessThan(out.indexOf('nav class="main"'));
    });

    it("REFUSES a document with no body rather than passing it through", () => {
      // A fragment, a redirect stub or a file that is HTML only by extension
      // is not a page this belongs on. Returning the input unchanged would
      // make "injected" and "left alone" indistinguishable to a caller that
      // reports a count.
      expect(injectRail("<p>just a fragment</p>", opts)).toBeUndefined();
    });

    it("refuses a page that already carries one", () => {
      // Mounting twice into the same site directory is a real sequence — the
      // workflows re-run — and a second navbar would stack on the first.
      expect(injectNavbar(injectRail(page, opts)!, model)).toBeUndefined();
    });
  });
});

describe("toRoot depth — the arithmetic that broke first", () => {
  // IMPORTED, not restated. The first version of this block defined its own
  // copy "so the test would not share the buggy one" — and when the bug was
  // planted back into `mount-instance-docs.ts`, all twelve tests went on
  // passing while 57 rail links broke.

  it("a mount index at depth 1 reaches the root with one hop", () => {
    expect(toRootFor("smart-trust", "index.html")).toBe("..");
  });

  it("a page NESTED in that mount needs one more", () => {
    expect(toRootFor("smart-trust", "artifact/ValueSet-X.html")).toBe("../..");
  });

  it("a two-segment route at depth 2 reaches the root with two", () => {
    expect(toRootFor("library/who-iris", "index.html")).toBe("../..");
  });

  it("and nested inside THAT, three", () => {
    expect(toRootFor("library/who-iris", "a/b.html")).toBe("../../..");
  });
});

describe("where a kind's navbar link actually goes", () => {
  it("an index under the published tree addresses as its directory", () => {
    expect(visualiserHref("cat-harness/docs/cat-harness/library/who-iris/index.html", "cat-harness/docs")).toBe(
      "cat-harness/library/who-iris/",
    );
  });

  it("a page that is NOT an index addresses as itself", () => {
    expect(visualiserHref("cat-harness/docs/qa/axes.html", "cat-harness/docs")).toBe("qa/axes.html");
  });

  it("REFUSES a visualiser outside the published tree rather than composing a URL", () => {
    expect(visualiserHref("who-iris/library/index.html", "cat-harness/docs")).toBeUndefined();
  });
});

describe("every declared graph reaches the navbar, linked or not", () => {
  // The owner's report: "there shuold be all the harness controlled
  // dirs/graphs". The navbar listed two of who-iris's six.
  //
  // THIS IS BOUND TO `declaredGraphs`, not to a hand-built model. The
  // renderer's handling of a non-link is tested above against a fixture, and
  // that fixture went on passing while the PRODUCER emitted only the mounted
  // kinds — the regression was visible only by building a site. A test that
  // cannot see the producer cannot see this defect.
  const kinds = (linked: Record<string, string> = {}) =>
    declaredGraphs("who-iris", new Map(Object.entries(linked))).map((i) => i.label);

  it("lists every kind the instance declares, not only the published ones", () => {
    // Six declared: library, catalogue, uploads, skills, themes, docs.
    expect(kinds()).toEqual(["catalogue", "docs", "library", "skills", "themes", "uploads"]);
  });

  it("links exactly the kinds it was told are published", () => {
    const got = declaredGraphs("who-iris", new Map([["docs", "../docs/who-iris/"]]));
    expect(got.find((i) => i.label === "docs")?.href).toBe("../docs/who-iris/");
    // ...and everything else carries no href, which the renderer draws as a
    // non-link. `harness-tiles`: declared and not rendered is a GAP.
    expect(got.filter((i) => i.href === undefined).map((i) => i.label)).toEqual([
      "catalogue",
      "library",
      "skills",
      "themes",
      "uploads",
    ]);
  });

  it("is sorted, so the order is a function of the declaration", () => {
    expect(kinds()).toEqual([...kinds()].sort());
  });

  it("carries the generator's REASON onto the rows that have no href", () => {
    const got = declaredGraphs(
      "who-iris",
      new Map([["docs", "../docs/who-iris/"]]),
      new Map([
        ["catalogue", "no viewer yet"],
        ["themes", "staging only"],
      ]),
    );
    expect(got.find((i) => i.label === "catalogue")?.note).toBe("no viewer yet");
    // TWO ROWS, TWO REASONS. One wording for every inert row is the defect
    // this replaced — `title="declared, with no published viewer"` was wrong
    // for the staging-only and render-exempt cases, which are not gaps.
    expect(got.find((i) => i.label === "themes")?.note).toBe("staging only");
    // A kind the generator said nothing about renders as it always did: grey,
    // and making no claim about why. The honest third state.
    expect(got.find((i) => i.label === "skills")?.note).toBeUndefined();
  });

  it("never labels a row that OPENS, even if a stale reason is passed for it", () => {
    // The href wins. A `note` left behind for a kind whose viewer has since
    // been published would otherwise caption a working link "no viewer yet" —
    // and the note's whole job is to be true.
    const got = declaredGraphs(
      "who-iris",
      new Map([["docs", "../docs/who-iris/"]]),
      new Map([["docs", "no viewer yet"]]),
    );
    expect(got.find((i) => i.label === "docs")?.note).toBeUndefined();
  });

  it("returns EMPTY for an instance that declares nothing readable", () => {
    // Not a throw and not a guess. An unparseable declaration is
    // `kg:schema:check`'s finding, not this script's; here it is an empty
    // middle, and the caller still renders the root and the harnesses.
    expect(declaredGraphs("does-not-exist", new Map())).toEqual([]);
  });
});

describe("the geometry is stated ONCE — `sjic`", () => {
  // The defect this guards was invisible to a suite that had a test on each
  // side: `navbar.ts` asserted its own numbers and `sidebar-strip.test.ts`
  // asserted `docs-ui.css`'s, and they were 40px against 56px at rest.
  // DERIVED, not spelled out. `site-dir-single-answer` refuses a literal site
  // root anywhere in source, including here — and it caught this file's first
  // draft, which is the gate working: a test that hardcodes `docs/` is a
  // second answer to the question `siteDirFor` exists to answer, and it goes
  // on passing against a path nothing serves.
  const INSTANCE = instanceRootFor(import.meta.dir);
  const uiCss = readFileSync(join(INSTANCE, navbarGeometryCssPath(INSTANCE)), "utf8");
  // The generated REGION, sliced out of the authored stylesheet it now lives
  // in. See the "self-sufficient" spec below for why it is a region rather
  // than a second file.
  const geometryCss = uiCss.slice(uiCss.indexOf(BEGIN), uiCss.indexOf(END) + END.length);

  it("the generated stylesheet carries the module's own numbers", () => {
    expect(geometryCss).toBe(renderNavbarGeometryCss());
  });

  it("the rail's px and the sidebar's rem are THE SAME LENGTH", () => {
    // The whole bean in one assertion. Read the rem out of the generated file
    // rather than restating it, or this test becomes a third copy.
    const rem = (name: string): number => {
      const m = new RegExp(`--fa-nav-${name}:\\s*([0-9.]+)rem`).exec(geometryCss);
      expect({ name, found: m !== null }).toEqual({ name, found: true });
      return Number(m![1]) * 16;
    };
    expect(rem("collapsed")).toBe(NAV_COLLAPSED_PX);
    expect(rem("open")).toBe(NAV_OPEN_PX);
    expect(rem("mark")).toBe(NAV_GLYPH_PX);
  });

  it("defines every width ONLY inside the generated region", () => {
    // The duplication this bean exists to end, checked from the other side: a
    // hand-authored definition anywhere outside the fences is the second copy
    // coming back.
    //
    // NOT "exactly once" — the first draft asserted that and was wrong about
    // the CSS rather than finding a bug in it. `--fa-nav-open` is defined
    // TWICE on purpose, at `:root` and again inside the wide media query,
    // because the theme widens its own sidebar there. The invariant is about
    // WHERE a definition may appear, not how many there are.
    const authored = uiCss.slice(0, uiCss.indexOf(BEGIN)) + uiCss.slice(uiCss.indexOf(END));
    for (const prop of ["--fa-nav-collapsed", "--fa-nav-open", "--fa-nav-mark", "--fa-nav-pad"]) {
      expect({ prop, definedOutsideTheRegion: new RegExp(`${prop}:\\s*[0-9]`).test(authored) }).toEqual({
        prop,
        definedOutsideTheRegion: false,
      });
      expect({ prop, definedInside: new RegExp(`${prop}:\\s*[0-9]`).test(geometryCss) }).toEqual({
        prop,
        definedInside: true,
      });
    }
    expect(uiCss).toContain("var(--fa-nav-collapsed)");
  });

  it("docs-ui.css is SELF-SUFFICIENT — the region travels with it", () => {
    // WHY A REGION AND NOT A SECOND FILE, and it cost a debugging session.
    //
    // The first version generated `navbar-geometry.css` beside docs-ui.css and
    // linked it from `head_custom.html`. That made docs-ui.css depend on a
    // file 23 sources inline it WITHOUT — every e2e fixture that builds a page
    // from `readFileSync(docs-ui.css)`. Those pages got
    // `width: var(--fa-nav-collapsed)` with the property undefined, which is
    // INVALID AT COMPUTED-VALUE TIME and therefore silent: the sidebar took
    // `auto` width, `.side-bar + .main` lost its margin, the main column
    // landed on top of the fixed sidebar, and a11y clicks timed out against a
    // button that was visible, enabled and stable throughout.
    //
    // Patching 23 fixtures would have been 23 places to forget. One
    // self-sufficient stylesheet is none.
    expect(uiCss.indexOf(BEGIN)).toBeGreaterThanOrEqual(0);
    expect(uiCss.indexOf(END)).toBeGreaterThan(uiCss.indexOf(BEGIN));
    // Before every rule that reads it, or the cascade order stops being true.
    expect(uiCss.indexOf(END)).toBeLessThan(uiCss.indexOf("var(--fa-nav-collapsed)"));
  });

  it("refuses an unterminated region rather than guessing where it ends", () => {
    // A wrong guess eats authored CSS, which is the one outcome a generator
    // over a hand-written file must never have.
    expect(() => withGeometry(`${BEGIN}\n:root{}\n/* no end */`)).toThrow(
      NAVBAR_GEOMETRY_MARKER_ERROR,
    );
  });

  it("is idempotent — regenerating replaces the region, never stacks it", () => {
    const once = withGeometry("body{}");
    expect(withGeometry(once)).toBe(once);
    expect([...withGeometry(once).matchAll(/navbar-geometry:begin/g)]).toHaveLength(1);
  });

  it("the strip is the mark and its two gutters, derived either way", () => {
    expect(NAV_COLLAPSED_PX).toBe(NAV_PAD_PX * 2 + NAV_GLYPH_PX);
  });
});

describe("the document index — `documentIndexOf`", () => {
  const page = (body: string) => `<html><body>${body}</body></html>`;

  it("takes h2 and h3 that carry an id, nesting the h3s", () => {
    const g = documentIndexOf(
      page(`<h2 id="a">Alpha</h2><h3 id="b">Beta</h3><h2 id="c">Gamma</h2>`),
    );
    expect(g?.items.map((i) => [i.href, i.label, i.depth ?? 0])).toEqual([
      ["#a", "Alpha", 0],
      ["#b", "Beta", 1],
      ["#c", "Gamma", 0],
    ]);
  });

  it("SKIPS a heading with no id — it is not a destination", () => {
    // `pb04` one layer in: a fragment link to a heading with no id goes
    // nowhere, and a dead row invites a click and then reads as broken.
    const g = documentIndexOf(page(`<h2 id="a">Alpha</h2><h2>Nowhere</h2><h2 id="c">Gamma</h2>`));
    expect(g?.items.map((i) => i.label)).toEqual(["Alpha", "Gamma"]);
  });

  it("ignores h1 and h4 — the title, and past where an index helps", () => {
    const g = documentIndexOf(
      page(`<h1 id="t">Title</h1><h2 id="a">A</h2><h4 id="d">D</h4><h2 id="b">B</h2>`),
    );
    expect(g?.items.map((i) => i.label)).toEqual(["A", "B"]);
  });

  it("strips markup and entities out of a heading's text", () => {
    const g = documentIndexOf(page(`<h2 id="a">A <code>b&amp;c</code></h2><h2 id="z">Z</h2>`));
    expect(g?.items[0]!.label).toBe("A b&c");
  });

  it("is ABSENT below two rows, never an empty or one-row menu", () => {
    // Same rule as the harnesses region: an empty disclosure invites a click
    // that does nothing, and a "Contents" holding the one section the reader
    // is looking at is that defect with a row in it.
    expect(documentIndexOf(page(`<p>no headings</p>`))).toBeUndefined();
    expect(documentIndexOf(page(`<h2 id="a">Only</h2>`))).toBeUndefined();
  });

  it("`injectRail` reads it off the page it is given", () => {
    // Not passed in: the mount loops over hundreds of files, and the other
    // shape invites the right nav carrying the previous page's contents.
    const html = injectRail(page(`<h2 id="a">Alpha</h2><h2 id="b">Beta</h2>`), {
      instance: "who-iris",
      toRoot: "..",
      links: [],
    });
    expect(html).toContain("Alpha");
    expect(html).toContain('href="#b"');
  });

  it("a page with nothing to index gets NO index region", () => {
    const html = injectRail(page(`<p>flat</p>`), { instance: "who-iris", toRoot: "..", links: [] })!;
    // Asserted on the FIXED TOP, not on the page: `fa-nav-group` is also the
    // graphs group's class and that region always renders. The first draft of
    // this test checked the whole document and failed for that reason — which
    // is the assertion being wrong, not the code.
    expect(region(html, "fa-nav-top")).not.toContain("fa-nav-group");
    expect(html).toContain("fa-nav-graphs");
  });

  it("sits in the FIXED top, with the instance", () => {
    const html = injectRail(page(`<h2 id="a">A</h2><h2 id="b">B</h2>`), {
      instance: "who-iris",
      toRoot: "..",
      links: [],
    });
    expect(region(html!, "fa-nav-top")).toContain('href="#a"');
    expect(region(html!, "fa-nav-graphs")).not.toContain('href="#a"');
  });
});

describe("a declared avatar region crops the mark — `603s`", () => {
  const withRegion = (region?: { x: number; y: number; w: number; h: number }) =>
    navbarHtml({
      instance: "i",
      graphs: { label: "Graphs", items: [] },
      harnesses: {
        label: "Harnesses",
        items: [{ href: "/x", label: "X", avatar: { src: "/a.png", ...(region ? { region } : {}) } }],
      },
    });

  it("an avatar with NO region is the plain image it always was", () => {
    const h = withRegion();
    expect(h).toContain('<img src="/a.png"');
    expect(h).not.toContain("fa-nav-crop");
  });

  it("scales by 1/w and 1/h and offsets by -x and -y of the SCALED image", () => {
    // `603s`'s arithmetic. A half-width, half-height box at (0, 0.46) — the
    // measured `landing-card` crop — doubles the image and lifts it 92%.
    const h = withRegion({ x: 0, y: 0.46, w: 0.5, h: 0.5 });
    expect(h).toContain("width:200%");
    expect(h).toContain("height:200%");
    expect(h).toContain("left:0%");
    expect(h).toContain("top:-92%");
  });

  it("clips, and the frame is a positioning context", () => {
    const css = navbarCss();
    expect(css).toContain(".fa-nav-crop{position:relative;overflow:hidden");
    // Without these the `img` rule's fixed width and height fight the inline
    // percentages and the crop silently does nothing.
    expect(css).toContain(".fa-nav-crop img{position:absolute;width:auto;height:auto;max-width:none}");
  });

  it("the region is stated in PERCENTAGES, so it survives a mark resize", () => {
    const h = withRegion({ x: 0.25, y: 0.25, w: 0.25, h: 0.25 });
    expect(h).not.toContain("px;");
    expect(h).toContain("width:400%");
    expect(h).toContain("left:-100%");
  });
});

describe("a coverage path is a SOURCE file, not a URL — `publishedUrlOf`", () => {
  // Owner, 2026-09-22: *"fix the .md paths in the harness tabs too."*
  //
  // Swept with a HEAD request per link against a local build: 3 of 31 distinct
  // harness-tab links 404'd, all three `index.md`. The conversion had handled
  // `.html` and passed `.md` through untouched.

  it("an index leaf addresses as its directory — either extension", () => {
    expect(publishedUrlOf("processes/index.md")).toBe("/processes/");
    expect(publishedUrlOf("processes/index.html")).toBe("/processes/");
  });

  it("any OTHER page addresses as itself, with `.html`", () => {
    // This is the row that stops the obvious fix from being right. Stripping
    // `.md` would give `/tool-graph/`, which is a 404 — measured against the
    // built site, where `/tool-graph.html` is 200 and `/tool-graph/` is not.
    expect(publishedUrlOf("tool-graph.md")).toBe("/tool-graph.html");
    expect(publishedUrlOf("subgraph-viewers.md")).toBe("/subgraph-viewers.html");
  });

  it("a directory is already a URL and is left alone", () => {
    expect(publishedUrlOf("cat-harness/library/cat-harness/")).toBe("/cat-harness/library/cat-harness/");
  });

  it("does not mistake a mid-path `index` for the leaf", () => {
    // `.../index/skills/...` is a real shape here — the docs-auto tree — and a
    // rule anchored anywhere but the end would eat a directory called `index`.
    expect(publishedUrlOf("cat-harness/docs-auto/index/skills/")).toBe(
      "/cat-harness/docs-auto/index/skills/",
    );
  });

  it("no harness tab link ends in `.md`, over the REAL committed data", () => {
    // The regression guard, run over what actually ships rather than over a
    // fixture: a fixture would have passed throughout the defect.
    // Derived, never spelled out — `site-dir-single-answer` refuses a literal
    // site root anywhere in source, and it caught this file once already.
    const root = instanceRootFor(import.meta.dir);
    const data = JSON.parse(
      readFileSync(join(root, siteDirFor(root), "_data", "harness.json"), "utf8"),
    ) as { harnesses: { name: string; visualisations?: { kind: string; path?: string }[] }[] };
    const offenders = data.harnesses.flatMap((h) =>
      (h.visualisations ?? [])
        .filter((v) => v.path?.endsWith(".md"))
        .map((v) => `${h.name}:${v.kind} -> ${v.path}`),
    );
    expect(offenders).toEqual([]);
  });
});

describe("the crop is ONE sum, and two renderers do it", () => {
  /**
   * `solveCrop` solves a declared `avatarRegion` for the Jekyll sidebar, where
   * the consumer is Liquid; `mark()` solves the same region inline for a
   * mounted page. The arithmetic is `603s`'s and it is written out twice,
   * which is the shape that let the navbar widths be stated twice with a test
   * per copy — both green, and disagreeing (`sjic`).
   *
   * Nothing here says the arithmetic is RIGHT; `schemas/avatar-region.test.ts`
   * owns the declaration and this file's other tests own the markup. What it
   * says is that the two surfaces cannot drift apart silently, which is the
   * failure neither of those would notice.
   */
  const regions = [
    // who-iris: the WHO emblem cut out of a 581x178 emblem-and-wordmark.
    { x: 0, y: 0, w: 0.3064, h: 1 },
    { x: 0, y: 0, w: 1, h: 1 },
    { x: 0.25, y: 0.46, w: 0.5, h: 0.5 },
    // A third that divides badly on purpose: 1/0.3 is not representable, and
    // agreement has to survive the rounding rather than dodge it.
    { x: 0.1, y: 0.1, w: 0.3, h: 0.3 },
  ];

  /** What the rail actually writes, read back off its own markup. */
  function railCrop(r: { x: number; y: number; w: number; h: number }) {
    const html = navbarHtml({
      instance: "x",
      root: { href: "./", label: "x", avatar: { src: "m.svg", region: r } },
      graphs: { label: "Graphs", items: [] },
      harnesses: { label: "Harnesses", items: [] },
    });
    const style = /style="(width:[^"]+)"/.exec(html)?.[1] ?? "";
    const num = (k: string) => Number(new RegExp(k + ":([-0-9.]+)%").exec(style)?.[1]);
    return { width: num("width"), height: num("height"), left: num("left"), top: num("top") };
  }

  for (const r of regions) {
    it(`agrees on ${JSON.stringify(r)}`, () => {
      expect(railCrop(r)).toEqual(solveCrop(r));
    });
  }

  it("the whole image is the identity crop, not a no-op that skips the branch", () => {
    // A renderer that treated w=h=1 as "no crop" would agree with the other by
    // accident on every other case and diverge on this one.
    expect(solveCrop({ x: 0, y: 0, w: 1, h: 1 })).toEqual({
      width: 100,
      height: 100,
      left: 0,
      top: 0,
    });
  });
});
