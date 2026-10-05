import { describe, expect, test } from "bun:test";
import { darkRules } from "../../../cat-harness/scripts/lib/scheme-css.ts";

/** Issue #2208: one sheet, two deciders — the OS until the reader picks, then the reader. */
describe("darkRules", () => {
  const css = darkRules(":root { --bg: #161616; } ins, del { color: #fff; }");

  test("the OS decides only when the reader has not picked light", () => {
    expect(css).toContain(`@media (prefers-color-scheme: dark) { :root:not([data-fa-scheme="light"]) { --bg: #161616; }`);
    expect(css).toContain(`:root:not([data-fa-scheme="light"]) ins, :root:not([data-fa-scheme="light"]) del { color: #fff; }`);
  });

  test("a reader who picked dark gets it on any OS", () => {
    const outside = css.slice(css.indexOf("} }") + 3);
    expect(outside).toContain(`:root[data-fa-scheme="dark"] { --bg: #161616; }`);
    expect(outside).toContain(`:root[data-fa-scheme="dark"] ins, :root[data-fa-scheme="dark"] del { color: #fff; }`);
  });

  test("the native controls follow the pick too", () => {
    expect(css).toContain(`:root[data-fa-scheme="light"] { color-scheme: light; }`);
    expect(css).toContain(`:root[data-fa-scheme="dark"] { color-scheme: dark; }`);
  });

  test("a nested block is refused, not half-copied", () => {
    expect(() => darkRules("@supports (x: y) { a { color: red; } }")).toThrow(/flat rules only/);
  });
});
