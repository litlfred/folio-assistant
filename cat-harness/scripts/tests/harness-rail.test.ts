/**
 * The harness rail's markup and the depth arithmetic that broke first.
 *
 * The rail exists because a mounted page gets no Jekyll layout and therefore
 * no sidebar — measured on the published site, where the root `index.html`
 * carries `side-bar` and `/who-iris/` and `/smart-trust/` carry nothing.
 */
import { describe, expect, it } from "bun:test";

import {
  RAIL_COLLAPSED_PX,
  RAIL_GLYPH_PX,
  RAIL_OPEN_PX,
  RAIL_PAD_PX,
  injectRail,
  railCss,
  railHtml,
} from "../lib/harness-rail.js";
import { toRootFor, visualiserHref } from "../mount-instance-docs.js";

const opts = {
  instance: "who-iris",
  toRoot: "..",
  links: [
    { href: "../who-iris/", label: "who-iris", icon: "◆", current: true },
    { href: "../docs/who-iris/", label: "docs", icon: "D" },
  ],
};

describe("the harness rail", () => {
  it("opens on hover, on keyboard focus, and on a click that pins it", () => {
    // Three mechanisms, and the owner asked for two of them: "it can start
    // collapsed (so only icon width wide), hovering/clicking on it will open".
    // `:focus-within` is the third, because a rail reachable only by pointer
    // is navigation a keyboard cannot use.
    const css = railCss();
    expect(css).toContain(".fa-rail:hover");
    expect(css).toContain(":focus-within");
    expect(css).toContain(".fa-rail-pin:checked");
  });

  it("collapses to exactly the width it pads the page by", () => {
    // The rail is fixed, so the page is padded to sit beside it. Two numbers
    // that must agree: if they drift the rail either overlaps the content or
    // floats off it, and both look like a styling accident rather than a bug.
    const css = railCss();
    expect(css).toContain(`body{padding-left:${RAIL_COLLAPSED_PX}px}`);
    expect(css).toContain(`width:${RAIL_COLLAPSED_PX}px`);
    expect(RAIL_OPEN_PX).toBeGreaterThan(RAIL_COLLAPSED_PX);
  });

  it("collapses to the glyph column and its two gutters — nothing else fits", () => {
    // The owner photographed the rail collapsed and called it "too wide": at a
    // bare 48 the clip was wider than the glyph column inside it, so the first
    // few pixels of every label sat in view and each row showed a sliver of a
    // word. Deriving the width from the column is what stops that recurring.
    expect(RAIL_COLLAPSED_PX).toBe(RAIL_PAD_PX * 2 + RAIL_GLYPH_PX);
    expect(railCss()).toContain(`flex:0 0 ${RAIL_GLYPH_PX}px`);
  });

  it("holds EVERY label invisible while collapsed, not just clipped", () => {
    // The arithmetic above is a geometry argument, and a host stylesheet is
    // one inherited `letter-spacing` away from moving where a label starts
    // while the constants stay put. So the labels are held at `opacity:0`
    // too — and this binds to the MARKUP, so a label span added later without
    // the class fails here rather than bleeding into the collapsed strip.
    const html = railHtml(opts);
    const visible = [...html.matchAll(/<span(?![^>]*aria-hidden)[^>]*>/g)].map((m) => m[0]);
    expect(visible.length).toBeGreaterThan(0);
    for (const span of visible) expect(span).toContain("fa-rail-label");
    expect(railCss()).toContain(".fa-rail-label{white-space:nowrap;opacity:0");
    // ...and revealed by all three mechanisms, not only by hover.
    const css = railCss();
    expect(css).toContain(".fa-rail:hover .fa-rail-label");
    expect(css).toContain(".fa-rail:focus-within .fa-rail-label");
    expect(css).toContain(".fa-rail-pin:checked~.fa-rail-in .fa-rail-label");
  });

  it("carries no script", () => {
    // These pages are copied verbatim from instances the harness does not
    // control. Injecting a nav into somebody else's document is one claim;
    // injecting script into it is a larger one.
    const html = railHtml(opts);
    expect(html.toLowerCase()).not.toContain("<script");
    expect(html.toLowerCase()).not.toContain("onclick");
  });

  it("marks the route the page belongs to", () => {
    expect(railHtml(opts)).toContain('aria-current="page"');
  });

  it("escapes what it is given", () => {
    const html = railHtml({ ...opts, instance: '<img src=x onerror="pwn">' });
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });

  describe("injection", () => {
    const page = "<!doctype html><html><body><nav class=\"main\">IRIS</nav><p>x</p></body></html>";

    it("puts the rail first in the DOM and leaves the page intact", () => {
      const out = injectRail(page, opts)!;
      expect(out).toBeDefined();
      expect(out).toContain('<nav class="main">'); // the host's own chrome survives
      expect(out.indexOf("fa-rail")).toBeLessThan(out.indexOf('nav class="main"'));
    });

    it("REFUSES a document with no body rather than passing it through", () => {
      // A fragment, a redirect stub or a file that is HTML only by extension
      // is not a page this rail belongs on. Returning the input unchanged
      // would make "injected" and "left alone" indistinguishable to a caller
      // that reports a count.
      expect(injectRail("<p>just a fragment</p>", opts)).toBeUndefined();
    });

    it("refuses a page that already carries a rail", () => {
      // Mounting twice into the same site directory is a real sequence — the
      // workflows re-run — and a second rail would stack on the first.
      const once = injectRail(page, opts)!;
      expect(injectRail(once, opts)).toBeUndefined();
    });
  });
});

describe("toRoot depth — the arithmetic that broke first", () => {
  // IMPORTED, not restated. The first version of this block defined its own
  // copy of the expression "so the test would not share the buggy one" — and
  // when the bug was planted back into `mount-instance-docs.ts`, all twelve
  // tests went on passing while 57 rail links broke. A test that restates the
  // code it checks is documentation wearing a test's clothes.

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

describe("where a kind's rail link actually goes", () => {
  // The owner, on the deployed rail: "clicking on doc/ or library/ under
  // who-iris navbar did nothing … under library/ the 3 assets listed. are
  // those interfaces not done?" They were done. `/library/who-iris/` mounts
  // `who-iris/library/` verbatim, whose `index.html` is the IRIS replica home
  // — the page `/who-iris/` already serves. The link navigated correctly to a
  // byte-identical document, which a reader cannot tell from a dead link.

  it("an index under the published tree addresses as its directory", () => {
    expect(visualiserHref("cat-harness/docs/cat-harness/library/who-iris/index.html", "cat-harness/docs")).toBe(
      "cat-harness/library/who-iris/",
    );
  });

  it("a page that is NOT an index addresses as itself", () => {
    // Appending a slash to `a/b.html` would invent a directory that is not
    // there, and the 404 would read as a missing visualiser rather than as a
    // composed URL.
    expect(visualiserHref("cat-harness/docs/qa/axes.html", "cat-harness/docs")).toBe("qa/axes.html");
  });

  it("the prefix's own index is the site root", () => {
    expect(visualiserHref("cat-harness/docs/index.html", "cat-harness/docs")).toBe("");
  });

  it("REFUSES a visualiser outside the published tree rather than composing a URL", () => {
    // A visualiser can be declared and real without being published — it is
    // then a finding, and the caller names it and falls back to the mount
    // route. Quietly linking somewhere plausible is how the dead-looking link
    // above survived a review in the first place.
    expect(visualiserHref("who-iris/library/index.html", "cat-harness/docs")).toBeUndefined();
    expect(visualiserHref("cat-harness/docs-extra/x/index.html", "cat-harness/docs")).toBeUndefined();
  });

  it("tolerates a declared prefix written with a trailing slash", () => {
    expect(visualiserHref("cat-harness/docs/a/index.html", "cat-harness/docs/")).toBe("a/");
  });
});
