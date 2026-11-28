/**
 * A msgid holding TeX (`\tau`, `\nabla`, `\theta`) must round-trip through the
 * .po escape: the extractor writes `\\tau`, and the injector must read back `\tau`,
 * not a backslash, a tab and "au". Found translating the QOU front matter
 * (2026-11-28): 29 of its 233 strings were never looked up.
 */
import { describe, expect, it } from "bun:test";
import { injectMarkdown, parsePo, unescapePo } from "./po-inject.js";

describe("unescapePo", () => {
  it("reads an escaped backslash before t or n as a backslash", () => {
    expect(unescapePo("$\\\\hat{\\\\tau}$ and $\\\\nabla$")).toBe("$\\hat{\\tau}$ and $\\nabla$");
  });
  it("still reads the gettext escapes", () => {
    expect(unescapePo('a\\tb\\nc \\"d\\" e\\\\f')).toBe('a\tb\nc "d" e\\f');
  });
  it("lets a paragraph with TeX be translated", () => {
    const po = 'msgid ""\nmsgstr ""\n\nmsgid "The involution $\\\\hat{\\\\tau}$ splits it."\nmsgstr "L\'involution $\\\\hat{\\\\tau}$ la scinde."\n';
    const out = injectMarkdown("The involution $\\hat{\\tau}$ splits it.\n", parsePo(po)).translated;
    expect(out).toBe("L'involution $\\hat{\\tau}$ la scinde.\n");
  });
});
