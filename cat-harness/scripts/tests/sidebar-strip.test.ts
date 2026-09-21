/**
 * The sidebar rests as an icon strip — and the two files that agree about it.
 *
 * Owner, 2026-09-21, on the round this replaces: *"clicking it away completelt
 * disappeared in who-iris. i expected the same behaviour as was in who-iris,
 * that it slides to the far left, icon width thick."*
 *
 * **CLOSED IS NOT GONE.** Asked to "have it start hidden", the previous version
 * removed the strip entirely and put a launcher on the glass, and this file
 * asserted — at length, and correctly for that design — that the launcher had
 * to live OUTSIDE the sidebar, since anything inside a hidden element is
 * hidden with it. That invariant was real and is now moot: the strip is always
 * on screen, so the controls belong in the sidebar and `footer_custom.html` is
 * clean again.
 *
 * Worth keeping as a caution: a test can be rigorous, falsifiable, and
 * defending the wrong design. Three of these assertions passed every
 * falsification and still had to go.
 *
 * The rendered result is NOT checked and cannot be: `remote_theme` resolves on
 * the runner, so the theme's compiled selectors are not in this checkout, and
 * the published site is refused at this environment's proxy.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const REPO = resolve(import.meta.dir, "..", "..", "..");
const read = (p: string) => readFileSync(join(REPO, p), "utf-8");

const css = read("cat-harness/docs/assets/css/docs-ui.css");
/** Inside `.side-bar` — where all three controls now live. */
const inside = read("cat-harness/docs/_includes/nav_footer_custom.html");
/** Inside `.main` — which should carry none of them any more. */
const outside = read("cat-harness/docs/_includes/footer_custom.html");

/**
 * The slice that owns this behaviour, WITH COMMENTS STRIPPED.
 *
 * Not fussiness: an earlier version matched the raw slice and reported a rule
 * as carrying `display: none` — which appeared in the COMMENT above it,
 * explaining why it is not used. A stylesheet that documents the declaration
 * it avoids fails any test that greps for the declaration.
 */
const block = css
  .slice(css.indexOf("The sidebar rests as an icon strip"), css.indexOf("Edit-the-source affordance"))
  .replace(/\/\*[\s\S]*?\*\//g, "");

/** One rule's text, found by a declaration only that rule carries. */
const ruleWith = (needle: string): string => {
  const at = block.indexOf(needle);
  expect({ needle, found: at > -1 }).toEqual({ needle, found: true });
  return block.slice(block.slice(0, at).lastIndexOf("}") + 1, block.indexOf("}", at) + 1);
};

describe("at rest it is a strip, not an absence", () => {
  it("keeps a visible width — the regression this file exists for", () => {
    // The previous design hid it outright. `width: var(--fa-nav-collapsed)`
    // and no `visibility: hidden` anywhere is what "slides to the far left,
    // icon width thick" means.
    expect(ruleWith("width: var(--fa-nav-collapsed)")).toBeTruthy();
    expect(block).not.toContain("visibility: hidden");
    expect(block).not.toContain("translateX(-100%)");
  });

  it("pads `.main` by THE SAME property it sizes the strip with", () => {
    // Two numbers that must agree, failing silently either way: too wide and
    // the nav overlaps the text, too narrow and the text floats.
    expect(block).toContain("width: var(--fa-nav-collapsed)");
    expect(block).toContain("margin-left: var(--fa-nav-collapsed)");
  });

  it("clips from the LEFT, or the strip shows the end of every label", () => {
    // The theme sets `align-items: flex-end` on this flex column. With a
    // narrow parent and wide children that puts the labels' right-hand ends in
    // the strip — which reads as mojibake rather than as a clip.
    expect(ruleWith("width: var(--fa-nav-collapsed)")).toContain("align-items: flex-start");
  });

  it("scrolls its CONTENTS, because the bar is fixed to the glass", () => {
    expect(ruleWith("width: var(--fa-nav-collapsed)")).toContain("overflow-y: auto");
  });

  it("is scoped above the theme's breakpoint, never applied to the phone", () => {
    // Below 50rem the theme is not `fixed` and has its own hamburger. Bound to
    // the RULE, not to the presence of the string: a later
    // `prefers-reduced-motion` block carries the same media text, so a
    // substring check went on passing when the collapse was unscoped.
    const at = block.indexOf("width: var(--fa-nav-collapsed)");
    const enclosing = block.slice(0, at).lastIndexOf("@media");
    expect(block.slice(enclosing, block.indexOf("{", enclosing))).toContain("min-width: 50rem");
  });

  it("carries no script", () => {
    expect(block.toLowerCase()).not.toContain("<script");
  });
});

describe("three ways in, one way back", () => {
  /** The one rule that widens the sidebar. */
  const opener = ruleWith("width: var(--fa-nav-open);\n    \n    z-index");

  it("opens on hover, on keyboard focus, and on the pinned checkbox", () => {
    // A pointer is not the only input: a tablet is ABOVE this breakpoint, so
    // it gets the strip and has no hover at all.
    expect(opener).toContain(".side-bar:hover");
    expect(opener).toContain(".side-bar:focus-within");
    expect(opener).toContain(".side-bar:has(.fa-nav-open:checked)");
  });

  it("overlays the page rather than reflowing it", () => {
    expect(opener).toMatch(/z-index:\s*\d+/);
  });

  it("shows the [x] only while pinned — never alone in the strip", () => {
    // An `[x]` as the only thing in a 3.5rem strip reads as a close button for
    // the page.
    expect(block).toContain(".fa-nav-close { display: none; }");
    expect(block).toContain(".side-bar:has(.fa-nav-open:checked) .fa-nav-close");
  });

  it("hides the ☰ once pinned — two controls for one state is one too many", () => {
    expect(block).toContain(".side-bar:has(.fa-nav-open:checked) .fa-nav-toggle { display: none; }");
  });
});

describe("the controls live inside the sidebar now", () => {
  it("all three are in the sidebar's own include", () => {
    for (const cls of ["fa-nav-open", "fa-nav-close", "fa-nav-toggle"]) {
      expect({ cls, present: inside.includes(cls) }).toEqual({ cls, present: true });
    }
  });

  it("and `footer_custom.html` carries none of them", () => {
    // It held the launcher only while the sidebar was hidden. Leaving a stray
    // fixed-position control there would put a ☰ on the glass beside a strip
    // that already opens.
    expect(outside).not.toContain("fa-nav");
  });

  it("both labels drive the same checkbox", () => {
    const id = /<input[^>]*class="fa-nav-open"[^>]*id="([^"]+)"/.exec(inside)?.[1];
    expect(id).toBeDefined();
    expect([...inside.matchAll(new RegExp(`for="${id}"`, "g"))]).toHaveLength(2);
  });

  it("the checkbox is focusable, not `display: none`", () => {
    expect(ruleWith("left: -9999px")).not.toContain("display: none");
  });

  it("both controls have an accessible name — this is navigation", () => {
    for (const cls of ["fa-nav-close", "fa-nav-toggle"]) {
      const label = new RegExp(`<label[^>]*class="${cls}"[^>]*>([\\s\\S]*?)</label>`).exec(inside)?.[1] ?? "";
      const named = label.includes("fa-sr-only") || label.includes("fa-nav-text");
      expect({ cls, named }).toEqual({ cls, named: true });
    }
  });
});
