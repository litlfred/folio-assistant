/**
 * The harness rail's markup and the depth arithmetic that broke first.
 *
 * The rail exists because a mounted page gets no Jekyll layout and therefore
 * no sidebar — measured on the published site, where the root `index.html`
 * carries `side-bar` and `/who-iris/` and `/smart-trust/` carry nothing.
 */
import { describe, expect, it } from "bun:test";

import { RAIL_COLLAPSED_PX, RAIL_OPEN_PX, injectRail, railCss, railHtml } from "../lib/harness-rail.js";
import { toRootFor } from "../mount-instance-docs.js";

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
