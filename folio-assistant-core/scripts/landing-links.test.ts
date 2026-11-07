/**
 * `landingLinks` — what a folio's landing page lists besides its documents:
 * the visualisations its instance declares, when they resolve.
 */
import { describe, expect, test } from "bun:test";
import type { CatHarnessDeclaration } from "@litlfred/cat-harness-tools/schemas/kg/cat-harness.js";
import { landingLinks, landingPage } from "./build-document-site.js";
import { unescapeRaw } from "@litlfred/cat-harness-tools/scripts/lib/liquid-raw.ts";

const decl = (directories: unknown[]) => ({ name: "f", directories }) as unknown as CatHarnessDeclaration;
const dir = (id: string, visualiser: unknown) => ({ id, path: `${id}/`, graphTypologies: ["archimate"], coverage: { visualiser } });

describe("landingLinks", () => {
  test("a page built at publish by a writer that exists is linked, as its directory", () => {
    const d = decl([dir("archimate", [{ ref: "archimate/index.html", title: "ArchiMate models", writer: ["p/gen.ts"] }])]);
    expect(landingLinks(d, (p) => p === "p/gen.ts")).toEqual([{ title: "ArchiMate models", href: "archimate/" }]);
  });

  test("a page that neither exists nor has a writer that exists is not linked", () => {
    const d = decl([dir("archimate", [{ ref: "archimate/index.html", writer: ["p/gen.ts"] }])]);
    expect(landingLinks(d, () => false)).toEqual([]);
  });

  test("staging-only, absolute and climbing refs are never linked from the landing", () => {
    const d = decl([
      dir("a", [{ ref: "a/index.html", publish: "staging-only" }]),
      dir("b", "/b/index.html"),
      dir("c", "../c/index.html"),
    ]);
    expect(landingLinks(d, () => true)).toEqual([]);
  });

  test("a bare string visualiser takes the directory id as its title; markdown maps to its served page", () => {
    expect(landingLinks(decl([dir("notes", "notes/overview.md")]), () => true)).toEqual([{ title: "notes", href: "notes/overview.html" }]);
  });

  test("no declaration, no links", () => {
    expect(landingLinks(undefined, () => true)).toEqual([]);
  });
});

describe("landingPage", () => {
  test("is a Jekyll page in the named layout, its body held raw", () => {
    const p = landingPage("default", "Documents", "<p>{{ not liquid }}</p>");
    expect(p.startsWith("---\nlayout: default\ntitle: \"Documents\"\nnav_order: 1\n---\n")).toBe(true);
    expect(p).toContain("{% raw %}\n<p>{{ not liquid }}</p>\n{% endraw %}");
  });

  test("an endraw inside the body cannot close the raw block early, and renders unchanged", () => {
    const body = "a {% endraw %} b";
    const p = landingPage("default", "D", body);
    const inner = p.slice(p.indexOf("{% raw %}\n") + "{% raw %}\n".length, p.lastIndexOf("\n{% endraw %}"));
    expect(unescapeRaw(inner)).toBe(body);
  });

  test("a layout that is not a bare name is refused", () => {
    expect(() => landingPage("default\ntitle: x", "D", "")).toThrow();
  });
});
