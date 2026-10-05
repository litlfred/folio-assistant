import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";

import { navbarCssFile, navbarCssPath } from "../gen-navbar-css.ts";

/**
 * The published `assets/css/navbar.css` IS `navbarCss()` — bean `lnoy`.
 *
 * A thin page links this file instead of inlining the rail's style. If the two
 * drifted, a linked page and an inlined one would draw the same rail
 * differently, and nothing else would notice.
 */
describe("assets/css/navbar.css is generated from navbarCss()", () => {
  test("the file exists", () => {
    expect(existsSync(navbarCssPath())).toBe(true);
  });

  test("and is byte-for-byte what the generator writes — run `bun run navbar:css` if not", () => {
    expect(readFileSync(navbarCssPath(), "utf-8")).toBe(navbarCssFile());
  });
});
