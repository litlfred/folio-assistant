/**
 * lean-render's staging half, on a miniature doc-gen4 render. The rail pass
 * itself is the platform's (`rail-standalone-pages.ts`) and is tested there;
 * what is pinned here is what this layer adds before it runs.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import {
  DEFAULT_EXTERNAL_BASE,
  NAVBAR_NONE,
  isBuildBookkeeping,
  moduleRootOf,
  rewriteDroppedLinks,
  shouldDeclineRail,
  stageLeanRender,
  withRailDeclined,
  withRailOffset,
} from "./lean-render";

const page = (body: string, head = "") => `<html lang="en"><head><meta charset="UTF-8">${head}</head><body>${body}</body></html>`;

/** The smallest tree `isDocGen4Render` accepts, with one kept and one dropped module. */
function render(): string {
  const root = mkdtempSync(join(tmpdir(), "lean-render-"));
  const files: Record<string, string> = {
    "index.html": page(`<a href="./QOU.html">QOU</a>`),
    "navbar.html": page(`<a href="./Mathlib/Algebra.html">M</a><a href="./QOU.html">Q</a>`, `<base target="_parent">`),
    "find/index.html": page(""),
    "declarations/declaration-data.bmp": "bmp",
    "declarations/declaration-data.bmp.hash": "1",
    "QOU.html": page(`<a href="./QOU/Basic.html">B</a>`),
    "QOU.html.hash": "1",
    "QOU.html.trace": "{}",
    "QOU/Basic.html": page(`<a href="../Mathlib/Algebra.html#Monoid">Monoid</a> <a href="../QOU.html">up</a> <a href="#x">x</a> <a href="https://e.org/">e</a>`),
    "Mathlib.html": page("m"),
    "Mathlib/Algebra.html": page("a"),
    "style.css": "body{}",
  };
  for (const [rel, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, rel)), { recursive: true });
    writeFileSync(join(root, rel), text);
  }
  return root;
}

describe("the pieces", () => {
  test("Lake bookkeeping is recognised", () => {
    expect(isBuildBookkeeping("QOU.html.hash")).toBe(true);
    expect(isBuildBookkeeping("QOU.html.trace")).toBe(true);
    expect(isBuildBookkeeping("QOU.html")).toBe(false);
  });

  test("a module root is the upper-case first segment, bookkeeping included", () => {
    expect(moduleRootOf("Mathlib/Algebra/Group.html")).toBe("Mathlib");
    expect(moduleRootOf("Mathlib.html")).toBe("Mathlib");
    expect(moduleRootOf("QOU.html.hash")).toBe("QOU");
    expect(moduleRootOf("declarations/declaration-data.bmp")).toBeUndefined();
    expect(moduleRootOf("navbar.html")).toBeUndefined();
  });

  test("an iframe page and an empty-bodied redirect decline the rail; a module page does not", () => {
    expect(shouldDeclineRail(page("x", `<base target="_parent">`))).toBe(true);
    expect(shouldDeclineRail(page(""))).toBe(true);
    expect(shouldDeclineRail(page("<main>decls</main>"))).toBe(false);
  });

  test("the opt-out is the platform's meta, written once", () => {
    const once = withRailDeclined(page(""));
    expect(once).toContain(NAVBAR_NONE);
    expect(withRailDeclined(once)).toBe(once);
  });

  test("the layout shim is keyed on the rail and written once", () => {
    const once = withRailOffset(page("x"));
    expect(once).toContain("body:has(nav.fa-nav)>nav.nav");
    expect(withRailOffset(once)).toBe(once);
  });

  test("a link into a dropped module goes to the external docs; kept, fragment-only and absolute links do not move", () => {
    const html = `<a href="../Mathlib/Algebra.html#Monoid">m</a><a href="../QOU.html">q</a><a href="#x">x</a><a href="https://e.org/">e</a>`;
    const r = rewriteDroppedLinks(html, "QOU/Basic.html", new Set(["QOU"]), DEFAULT_EXTERNAL_BASE);
    expect(r.rewritten).toBe(1);
    expect(r.html).toContain(`href="${DEFAULT_EXTERNAL_BASE}Mathlib/Algebra.html#Monoid"`);
    expect(r.html).toContain(`href="../QOU.html"`);
    expect(r.html).toContain(`href="#x"`);
    expect(r.html).toContain(`href="https://e.org/"`);
  });
});

describe("stageLeanRender", () => {
  test("full fidelity by default: everything but Lake's bookkeeping, with the two rail-declining pages marked", () => {
    const site = mkdtempSync(join(tmpdir(), "lean-site-"));
    const r = stageLeanRender({ docs: render(), site });
    expect(r.dest).toBe(join(site, "lean"));
    expect(r.bookkeepingSkipped).toBe(3);
    expect(existsSync(join(site, "lean/QOU.html.hash"))).toBe(false);
    expect(existsSync(join(site, "lean/Mathlib/Algebra.html"))).toBe(true);
    expect(r.declined.sort()).toEqual(["find/index.html", "navbar.html"]);
    expect(readFileSync(join(site, "lean/navbar.html"), "utf-8")).toContain(NAVBAR_NONE);
    expect(readFileSync(join(site, "lean/QOU/Basic.html"), "utf-8")).toContain(`data-lean-render="rail-offset"`);
    expect(r.droppedModules).toEqual([]);
  });

  test("--modules prunes the rest and repoints every link into it, the iframe navbar included", () => {
    const site = mkdtempSync(join(tmpdir(), "lean-site-"));
    // By PACKAGE name, lower case: matched to the module root `QOU`.
    const r = stageLeanRender({ docs: render(), site, route: "docs/lean", modules: ["qou"] });
    expect(r.droppedModules).toEqual(["Mathlib"]);
    expect(existsSync(join(site, "docs/lean/Mathlib"))).toBe(false);
    expect(existsSync(join(site, "docs/lean/QOU/Basic.html"))).toBe(true);
    expect(r.linksRewritten).toBe(2);
    expect(readFileSync(join(site, "docs/lean/navbar.html"), "utf-8")).toContain(`${DEFAULT_EXTERNAL_BASE}Mathlib/Algebra.html`);
  });

  test("an input that is not a doc-gen4 render is refused, never staged as nothing", () => {
    const empty = mkdtempSync(join(tmpdir(), "not-a-render-"));
    expect(() => stageLeanRender({ docs: empty, site: mkdtempSync(join(tmpdir(), "s-")) })).toThrow(/not a doc-gen4 render/);
  });

  test("a route that leaves the site is refused", () => {
    expect(() => stageLeanRender({ docs: render(), site: mkdtempSync(join(tmpdir(), "s-")), route: "../x" })).toThrow(/--route/);
  });
});
