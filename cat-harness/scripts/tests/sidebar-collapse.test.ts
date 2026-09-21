/**
 * The sidebar starts closed — and the two files that have to agree about it.
 *
 * Owner, 2026-09-21: *"i want navbar to be collasable and start closed
 * everywhere, not just who-iris."*
 *
 * The behaviour lives in `docs-ui.css`; the pin control lives in
 * `nav_footer_custom.html`, because that is just-the-docs' own extension point
 * inside `.side-bar`. **A class name spanning a stylesheet and a Liquid
 * template is the kind of agreement nothing else checks**: rename it on one
 * side and the pin becomes an unstyled checkbox that toggles nothing, on a
 * page that still renders and still passes every other gate.
 *
 * The rendered result is NOT checked here and cannot be: `remote_theme` is
 * resolved on the runner, so the theme's compiled selectors are not in this
 * checkout, and the published site is refused at this environment's proxy.
 * What is checkable is the agreement between our own two files and the
 * breakpoint scoping — so that is what these assert, rather than dressing an
 * unverifiable claim as a test.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const REPO = resolve(import.meta.dir, "..", "..", "..");
const css = readFileSync(join(REPO, "cat-harness/docs/assets/css/docs-ui.css"), "utf-8");
const tpl = readFileSync(join(REPO, "cat-harness/docs/_includes/nav_footer_custom.html"), "utf-8");

/** The slice of the stylesheet that owns the collapse. */
const block = css.slice(css.indexOf("The sidebar starts CLOSED"));

describe("the sidebar's collapsed state", () => {
  it("declares the two widths as custom properties rather than inline numbers", () => {
    expect(block).toContain("--fa-nav-collapsed:");
    expect(block).toContain("--fa-nav-open:");
  });

  it("collapses `.side-bar` and pads `.main` by THE SAME property", () => {
    // Two numbers that must agree, and the failure is silent either way: too
    // wide and the nav overlaps the text, too narrow and the text floats. One
    // property means they cannot drift.
    expect(block).toContain("width: var(--fa-nav-collapsed)");
    expect(block).toContain("margin-left: var(--fa-nav-collapsed)");
  });

  it("is scoped above the theme's breakpoint, never applied to the phone layout", () => {
    // Below 50rem the theme is not `fixed` and has its own hamburger. An
    // unscoped rule here breaks the phone and looks like a theme bug.
    //
    // BOUND TO THE RULE, not to the presence of the string. The first version
    // asserted `block.toContain("@media (min-width: 50rem)")` and went on
    // passing when the collapse was changed to `@media all` — because a LATER
    // `prefers-reduced-motion` block still carried the same text. A substring
    // that also occurs elsewhere guards nothing.
    const at = block.indexOf("width: var(--fa-nav-collapsed)");
    expect(at).toBeGreaterThan(-1);
    const enclosing = block.slice(0, at).lastIndexOf("@media");
    expect(enclosing).toBeGreaterThan(-1);
    const query = block.slice(enclosing, block.indexOf("{", enclosing));
    expect(query).toContain("min-width: 50rem");
  });

  /** The one rule that widens the sidebar, as its own text. */
  const opener = (): string => {
    const at = block.indexOf("width: var(--fa-nav-open);\n    /* Above `.main`");
    expect(at).toBeGreaterThan(-1);
    const start = block.slice(0, at).lastIndexOf("\n\n") + 2;
    return block.slice(start, block.indexOf("}", at) + 1);
  };

  it("opens on all three mechanisms, not only on hover", () => {
    // A pointer is not the only input. `:hover` does nothing on a tablet,
    // which is ABOVE this breakpoint and therefore gets the collapsed nav.
    //
    // Read off THE OPENING RULE. The first version searched the whole block,
    // where `:focus-within` also appears in the label-reveal rules — so
    // deleting it from the selector that actually widens the sidebar left the
    // test green and the nav unreachable by keyboard.
    const rule = opener();
    expect(rule).toContain(".side-bar:hover");
    expect(rule).toContain(".side-bar:focus-within");
    expect(rule).toContain(".side-bar:has(.fa-nav-pin:checked)");
  });

  it("raises the open sidebar above the page instead of reflowing it", () => {
    // `.main` is positioned and later in tree order, so without this the
    // sidebar opens BEHIND the content and reads as a rendering bug.
    expect(opener()).toMatch(/z-index:\s*\d+/);
  });

  it("carries no script — the same rule the rail keeps", () => {
    expect(block.toLowerCase()).not.toContain("<script");
  });
});

describe("the pin control spans two files, so the two files are checked together", () => {
  /** Every `fa-nav-*` class the stylesheet styles. */
  const styled = new Set([...block.matchAll(/\.(fa-nav-[a-z-]+)/g)].map((m) => m[1]!));
  /** Every `fa-nav-*` class the template emits. */
  const emitted = new Set([...tpl.matchAll(/class="(fa-nav-[a-z-]+)"/g)].map((m) => m[1]!));

  it("the template emits a pin at all", () => {
    // Vacuity guard: every assertion below is satisfied by a template that
    // emits nothing.
    expect(emitted.size).toBeGreaterThan(0);
    expect(emitted.has("fa-nav-pin")).toBe(true);
  });

  it("every class the template emits is one the stylesheet styles", () => {
    const unstyled = [...emitted].filter((c) => !styled.has(c));
    expect(unstyled).toEqual([]);
  });

  it("the checkbox and its label are wired by id, or the pin toggles nothing", () => {
    const id = /<input[^>]*class="fa-nav-pin"[^>]*id="([^"]+)"/.exec(tpl)?.[1];
    expect(id).toBeDefined();
    expect(tpl).toContain(`for="${id}"`);
  });

  it("the pin has an accessible name — it is navigation, not decoration", () => {
    // The name comes from the label's text via `for=`, so an empty label would
    // leave a screen reader announcing an unnamed checkbox.
    const label = /<label[^>]*class="fa-nav-pin-toggle"[^>]*>([\s\S]*?)<\/label>/.exec(tpl)?.[1] ?? "";
    const visible = label.replace(/<[^>]*aria-hidden="true"[^>]*>[\s\S]*?<\/span>/g, "").replace(/<[^>]*>/g, "").trim();
    expect(visible.length).toBeGreaterThan(0);
  });
});
