/**
 * The harness rail's markup and the depth arithmetic that broke first.
 *
 * The rail exists because a mounted page gets no Jekyll layout and therefore
 * no sidebar — measured on the published site, where the root `index.html`
 * carries `side-bar` and `/who-iris/` and `/smart-trust/` carry nothing.
 */
import { describe, expect, it } from "bun:test";

import { RAIL_OPEN_PX, injectRail, railCss, railHtml } from "../lib/harness-rail.js";
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
  it("starts HIDDEN, and hidden from the keyboard too", () => {
    // Owner, 2026-09-21: "have it start hidden ... need easy way to close it.
    // [x]". `transform` alone moves the rail off-screen and leaves every link
    // focusable, so tabbing walks an invisible nav on somebody else's page.
    const css = railCss();
    expect(css).toContain("transform:translateX(-100%)");
    expect(css).toContain("visibility:hidden");
    expect(css).toContain(".fa-rail:has(.fa-rail-open:checked){transform:none;visibility:visible}");
  });

  it("does NOT open on hover any more — hidden has nothing to hover", () => {
    // The mechanism changed, and leaving the hover rule in would mean a rail
    // that opens when the pointer crosses a 1px sliver nobody can see.
    expect(railCss()).not.toContain(".fa-rail:hover{");
    expect(railCss()).not.toContain(".fa-rail:focus-within{");
  });

  it("declares an open width, and the page gets none of it while closed", () => {
    expect(RAIL_OPEN_PX).toBeGreaterThan(0);
    expect(railCss()).toContain(`width:${RAIL_OPEN_PX}px`);
  });

  it("gives the page its full width while away", () => {
    // It overlays when open. A rail that reflowed the page would move every
    // line the reader was looking at.
    expect(railCss()).toContain("body{padding-left:0}");
  });

  it("scrolls its CONTENTS, because the rail is fixed to the glass", () => {
    // "it is attached to screen/window/glass. it does not scroll." The bar
    // stays put; a rail taller than the window must still be reachable.
    const css = railCss();
    expect(css).toContain("position:fixed");
    expect(css).toContain("overflow-y:auto");
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

    it("the launcher sits OUTSIDE the rail — the invariant this turns on", () => {
      // Anything inside a hidden element is hidden with it. A launcher in
      // there could never be clicked, on a page that renders perfectly.
      const nav = html.indexOf('<nav class="fa-rail"');
      expect(html.indexOf("fa-rail-launcher")).toBeLessThan(nav);
      expect(html.indexOf('class="fa-rail-open"')).toBeLessThan(nav);
    });

    it("the close control sits INSIDE it, never on screen alone", () => {
      // An `[x]` over the page with no rail behind it reads as a close button
      // for the page.
      const nav = html.indexOf('<nav class="fa-rail"');
      expect(html.indexOf("fa-rail-close")).toBeGreaterThan(nav);
    });

    it("both labels drive the same checkbox", () => {
      const id = /<input[^>]*class="fa-rail-open"[^>]*id="([^"]+)"/.exec(html)?.[1];
      expect(id).toBeDefined();
      expect([...html.matchAll(new RegExp(`for="${id}"`, "g"))]).toHaveLength(2);
    });

    it("both controls have an accessible name", () => {
      // `aria-hidden` on the glyph means the name has to come from somewhere,
      // and a control announced as "checkbox" alone is not navigation.
      for (const cls of ["fa-rail-launcher", "fa-rail-close"]) {
        const label = new RegExp(`<label class="${cls}"[\\s\\S]*?</label>`).exec(html)?.[0] ?? "";
        expect({ cls, named: label.includes("fa-rail-sr") }).toEqual({ cls, named: true });
      }
    });

    it("the retired PIN is gone, not left inert", () => {
      // It held open a rail that collapsed on hover. With hover gone it pins
      // nothing, and a control that does nothing invites a click and then
      // reads as broken.
      expect(html).not.toContain("fa-rail-pin");
      expect(railCss()).not.toContain("fa-rail-pin");
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
