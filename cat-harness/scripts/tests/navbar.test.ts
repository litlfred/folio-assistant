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
import { declaredGraphs, toRootFor, visualiserHref } from "../mount-instance-docs.js";

const model: NavbarModel = {
  instance: "who-iris",
  root: { href: "../who-iris/", label: "who-iris", icon: "◆", current: true },
  graphs: {
    label: "Graphs",
    items: [
      { href: "../docs/who-iris/", label: "docs", icon: "D" },
      // Declared with no published viewer — a GAP, drawn as a non-link.
      { label: "catalogue", icon: "C" },
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

  it("returns EMPTY for an instance that declares nothing readable", () => {
    // Not a throw and not a guess. An unparseable declaration is
    // `kg:schema:check`'s finding, not this script's; here it is an empty
    // middle, and the caller still renders the root and the harnesses.
    expect(declaredGraphs("does-not-exist", new Map())).toEqual([]);
  });
});
