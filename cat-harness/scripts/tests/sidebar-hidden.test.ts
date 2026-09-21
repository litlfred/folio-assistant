/**
 * The sidebar starts hidden, and the three files that have to agree about it.
 *
 * Owner, 2026-09-21: *"have it start hidden. it is attached to
 * screen/window/glass. it does not scroll. need easy way to close it. [x]"*
 *
 * This replaces `sidebar-collapse.test.ts`, which tested a sidebar that
 * collapsed to an icon strip and opened on `:hover`. **Hidden removes hover as
 * the opener** — there is nothing on screen to put a pointer on — so the whole
 * mechanism changed and so did what is worth asserting.
 *
 * The state spans THREE files: the stylesheet, the launcher's template
 * (`footer_custom.html`, outside the sidebar) and the close control's
 * (`nav_footer_custom.html`, inside it). One checkbox drives both labels. A
 * class name or an id spanning a `.css` and two `.html` files is an agreement
 * nothing else checks: break one side and the nav becomes unreachable on a
 * page that still renders and still passes every other gate.
 *
 * The rendered result is NOT checked and cannot be: `remote_theme` resolves on
 * the runner, so the theme's compiled selectors are not in this checkout, and
 * the published site is refused at this environment's proxy. These assert what
 * is checkable rather than dressing an unverifiable claim as a test.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const REPO = resolve(import.meta.dir, "..", "..", "..");
const read = (p: string) => readFileSync(join(REPO, p), "utf-8");

const css = read("cat-harness/docs/assets/css/docs-ui.css");
/** Rendered inside `.main` — where the launcher must be. */
const outside = read("cat-harness/docs/_includes/footer_custom.html");
/** Rendered inside `.side-bar` — where the close control must be. */
const inside = read("cat-harness/docs/_includes/nav_footer_custom.html");

/**
 * The slice of the stylesheet that owns this behaviour, WITH ITS COMMENTS
 * STRIPPED.
 *
 * Not fussiness: the first version matched against the raw slice and reported
 * `.fa-nav-open` as carrying `display: none` — which appears in the comment
 * ABOVE that rule, explaining why it is not used. A stylesheet that documents
 * the declaration it avoids will fail any test that greps for the declaration.
 */
const block = css
  .slice(css.indexOf("The sidebar starts HIDDEN"), css.indexOf("Edit-the-source affordance"))
  .replace(/\/\*[\s\S]*?\*\//g, "");

/** One rule's text, found by a declaration only that rule carries. */
const ruleWith = (needle: string): string => {
  const at = block.indexOf(needle);
  expect({ needle, found: at > -1 }).toEqual({ needle, found: true });
  const start = block.slice(0, at).lastIndexOf("}") + 1;
  return block.slice(start, block.indexOf("}", at) + 1);
};

describe("hidden by default", () => {
  it("hides it from the KEYBOARD too, not just from the eye", () => {
    // `transform` alone moves the sidebar off-screen and leaves every link
    // focusable, so tabbing walks an invisible nav and the focus ring vanishes
    // off the edge of the window. `visibility: hidden` takes it out of the tab
    // order and the accessibility tree.
    const rule = ruleWith("transform: translateX(-100%)");
    expect(rule).toContain("visibility: hidden");
  });

  it("gives `.main` the whole page while the nav is away", () => {
    expect(block).toContain("margin-left: 0");
  });

  it("restores BOTH on open — visibility and position", () => {
    // Reversing only the transform leaves a visible sidebar that a screen
    // reader cannot see; reversing only the visibility leaves an announced
    // sidebar sitting off-screen. Both, or neither.
    const rule = ruleWith("transform: none");
    expect(rule).toContain("visibility: visible");
    expect(rule).toContain("body:has(.fa-nav-open:checked)");
  });

  it("raises the open sidebar above the page instead of reflowing it", () => {
    expect(ruleWith("transform: none")).toMatch(/z-index:\s*\d+/);
  });

  it("scrolls its CONTENTS, because the bar itself is fixed to the glass", () => {
    // "it is attached to screen/window/glass. it does not scroll." The bar is
    // `position: fixed` (the theme's), so the page moves under it. What it
    // lacked is an inner scroll: a nav taller than the window had items no one
    // could reach and no scrollbar to say so.
    expect(ruleWith("transform: translateX(-100%)")).toContain("overflow-y: auto");
  });

  it("carries no script", () => {
    expect(block.toLowerCase()).not.toContain("<script");
  });
});

describe("the launcher is OUTSIDE the sidebar — the invariant the design turns on", () => {
  it("lives in the template rendered inside `.main`, never in the sidebar's", () => {
    // Anything inside a hidden element is hidden with it. Move this control
    // into `nav_footer_custom.html` and the nav becomes unreachable, on a page
    // that renders perfectly and passes every other check.
    expect(outside).toContain('class="fa-nav-launcher"');
    expect(inside).not.toContain("fa-nav-launcher");
  });

  it("and the close control is INSIDE it, never on screen alone", () => {
    // An `[x]` floating over the page with no sidebar behind it reads as a
    // close button for the page.
    expect(inside).toContain('class="fa-nav-close"');
    expect(outside).not.toContain("fa-nav-close");
    expect(block).toContain("body:not(:has(.fa-nav-open:checked)) .fa-nav-close");
  });

  it("the checkbox is focusable, not `display: none`", () => {
    // A `display: none` control is not focusable, and the keyboard would lose
    // the nav entirely. Off-screen positioning keeps it in the tab order.
    const rule = ruleWith("left: -9999px");
    expect(rule).not.toContain("display: none");
  });
});

describe("one toggle, not two states that can disagree", () => {
  const id = /<input[^>]*class="fa-nav-open"[^>]*id="([^"]+)"/.exec(outside)?.[1];

  it("the checkbox exists and both labels target it", () => {
    // Vacuity guard first: every assertion here is satisfied by templates that
    // emit nothing at all.
    expect(id).toBeDefined();
    expect(outside).toContain(`for="${id}"`);
    expect(inside).toContain(`for="${id}"`);
  });

  it("the stylesheet reads the SAME class the input carries", () => {
    expect(block).toContain(".fa-nav-open:checked");
    expect(outside).toContain('class="fa-nav-open"');
  });

  it("both controls have an accessible name — this is navigation", () => {
    for (const [what, tpl] of [["launcher", outside], ["close", inside]] as const) {
      const cls = what === "launcher" ? "fa-nav-launcher" : "fa-nav-close";
      const label = new RegExp(`<label[^>]*class="${cls}"[^>]*>([\\s\\S]*?)</label>`).exec(tpl)?.[1] ?? "";
      const named = label.includes("fa-sr-only") || /aria-label=/.test(label);
      expect({ what, named }).toEqual({ what, named: true });
    }
  });

  it("the retired PIN is gone from every file, not left inert", () => {
    // It held open a sidebar that collapsed on hover; with hover gone it has
    // nothing to pin. A control that no longer does anything is worse than no
    // control — it invites a click and then reads as broken.
    expect(css).not.toContain("fa-nav-pin");
    expect(inside).not.toContain("fa-nav-pin");
    expect(outside).not.toContain("fa-nav-pin");
  });
});
