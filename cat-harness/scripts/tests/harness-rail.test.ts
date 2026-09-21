/**
 * The harness rail's markup and the depth arithmetic that broke first.
 *
 * The rail exists because a mounted page gets no Jekyll layout and therefore
 * no sidebar — measured on the published site, where the root `index.html`
 * carries `side-bar` and `/who-iris/` and `/smart-trust/` carry nothing.
 */
import { describe, expect, it } from "bun:test";

import { RAIL_COLLAPSED_PX, RAIL_GLYPH_PX, RAIL_OPEN_PX, RAIL_PAD_PX, injectRail, railCss, railHtml } from "../lib/harness-rail.js";
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
  it("RESTS as a strip — closed is not gone", () => {
    // Owner, 2026-09-21: "clicking it away completelt disappeared in
    // who-iris. i expected the same behaviour as was in who-iris, that it
    // slides to the far left, icon width thick." The round before this one
    // hid it outright and put a launcher on the glass; `hidden` meant CLOSED.
    const css = railCss();
    expect(css).toContain(`width:${RAIL_COLLAPSED_PX}px`);
    expect(css).toContain(`body{padding-left:${RAIL_COLLAPSED_PX}px}`);
    expect(css).not.toContain("visibility:hidden");
    expect(css).not.toContain("translateX(-100%)");
  });

  it("is exactly the glyph column and its gutters", () => {
    // Derived, so no label can bleed into the strip — the "hidden width too
    // wide" report, where a sliver of a word per row read as a rail that had
    // failed to collapse.
    expect(RAIL_COLLAPSED_PX).toBe(RAIL_PAD_PX * 2 + RAIL_GLYPH_PX);
    expect(railCss()).toContain(`flex:0 0 ${RAIL_GLYPH_PX}px`);
  });

  it("opens on hover, on keyboard focus, and on the pinned checkbox", () => {
    expect(railCss()).toContain(
      `.fa-rail:hover,.fa-rail:focus-within,.fa-rail:has(.fa-rail-open:checked){width:${RAIL_OPEN_PX}px}`,
    );
  });

  it("scrolls its CONTENTS, because the rail is fixed to the glass", () => {
    const css = railCss();
    expect(css).toContain("position:fixed");
    expect(css).toContain("overflow-y:auto");
  });

  it("shows the [x] only while pinned — never alone in the strip", () => {
    // An `[x]` as the only thing in a 40px strip reads as a close button for
    // the page rather than for the rail.
    const css = railCss();
    expect(css).toContain(".fa-rail-close{display:none}");
    expect(css).toContain(".fa-rail:has(.fa-rail-open:checked) .fa-rail-close");
  });

  it("holds EVERY label invisible at rest, not just clipped", () => {
    // Clipping is a geometry argument and a host stylesheet can move where a
    // label starts without touching these numbers. Bound to the MARKUP, so a
    // label added later without the class fails here rather than bleeding.
    const html = railHtml(opts);
    const visible = [...html.matchAll(/<span(?![^>]*aria-hidden)[^>]*>/g)].map((m) => m[0]);
    expect(visible.length).toBeGreaterThan(0);
    for (const span of visible) {
      expect(span).toMatch(/fa-rail-label|fa-rail-sr/);
    }
    expect(railCss()).toContain(".fa-rail-label{white-space:nowrap;opacity:0");
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

  describe("open and close are ONE toggle", () => {
    const html = railHtml(opts);

    it("all three parts sit inside the rail — the strip IS the launcher", () => {
      // They were outside while the rail was hidden, which was right then and
      // wrong now: the rail is always on screen, so there is nothing for a
      // separate launcher to solve.
      const nav = html.indexOf('<nav class="fa-rail"');
      expect(nav).toBe(0);
      for (const cls of ["fa-rail-open", "fa-rail-close", "fa-rail-top"]) {
        expect({ cls, inside: html.indexOf(cls) > nav }).toEqual({ cls, inside: true });
      }
    });

    it("both labels drive the same checkbox", () => {
      const id = /<input[^>]*class="fa-rail-open"[^>]*id="([^"]+)"/.exec(html)?.[1];
      expect(id).toBeDefined();
      expect([...html.matchAll(new RegExp(`for="${id}"`, "g"))]).toHaveLength(2);
    });

    it("the close control has an accessible name", () => {
      const label = /<label class="fa-rail-close"[\s\S]*?<\/label>/.exec(html)?.[0] ?? "";
      expect(label).toContain("fa-rail-sr");
    });
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
