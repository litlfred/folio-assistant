import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { declOf, docsFromIndex, kgIndex, linkFromPage, pagesUrlOf, readDocsIndex, staticIndex } from "./block-lean.ts";

describe("block-lean: the ∀ icon's facts (owner, 2026-11-19)", () => {
  test("a lean.ref names its declaration, package prefix or not", () => {
    expect(declOf("qou:QOU.Torsion.lifting_exists")).toBe("QOU.Torsion.lifting_exists");
    expect(declOf("QOU.A.b")).toBe("QOU.A.b");
    expect(declOf(undefined)).toBeUndefined();
    expect(declOf("qou:has space")).toBeUndefined();
  });

  test("the KG viewer is opened at the declaration, in its module", () => {
    const idx = kgIndex({ modules: [{ name: "QOU.A" }, { name: "QOU.B" }] }, [["QOU.A.x", 0, 0], ["QOU.B.y", 1, 2]]);
    const m = docsFromIndex(idx, "lean", new Set(["QOU.B.y", "QOU.Missing"]));
    expect(m.get("QOU.B.y")).toBe("lean/#/m/QOU.B/QOU.B.y");
    expect(m.has("QOU.Missing")).toBe(false);
  });

  test("doc-gen4's static HTML is the fallback, and a link out of the render is refused", () => {
    const idx = staticIndex({ declarations: { "A.b": { docLink: "./A.html#A.b" }, "A.c": { docLink: "../x.html" }, "A.d": { docLink: "https://x" } } });
    const m = docsFromIndex(idx, "lean", new Set(["A.b", "A.c", "A.d"]));
    expect([...m]).toEqual([["A.b", "lean/A.html#A.b"]]);
  });

  test("a site-root link is made relative to the page, keeping its fragment", () => {
    expect(linkFromPage("en/qou", "lean/#/m/QOU.B/QOU.B.y")).toBe("../../lean/#/m/QOU.B/QOU.B.y");
    expect(linkFromPage("en/qou", "lean/A.html#A.b")).toBe("../../lean/A.html#A.b");
  });

  test("the mounted render is read first, and its KG form before its static one", async () => {
    const mount = mkdtempSync(join(tmpdir(), "block-lean-"));
    try {
      expect(await readDocsIndex({ route: "lean", mount })).toBeUndefined();
      mkdirSync(join(mount, "declarations"), { recursive: true });
      writeFileSync(join(mount, "declarations", "declaration-data.bmp"), JSON.stringify({ declarations: { "A.b": { docLink: "./A.html#A.b" } } }));
      expect((await readDocsIndex({ route: "lean", mount }))?.kind).toBe("static");
      mkdirSync(join(mount, "data"), { recursive: true });
      writeFileSync(join(mount, "data", "index.json"), JSON.stringify({ modules: [{ name: "A" }] }));
      writeFileSync(join(mount, "data", "names.json"), JSON.stringify([["A.b", 0, 0]]));
      expect((await readDocsIndex({ route: "lean", mount }))?.kind).toBe("kg");
    } finally {
      rmSync(mount, { recursive: true, force: true });
    }
  });

  test("a project site's address is derived from owner/repo, never written", () => {
    expect(pagesUrlOf("Some-Owner/some.repo")).toBe("https://some-owner.github.io/some.repo");
    expect(pagesUrlOf(undefined)).toBeUndefined();
    expect(pagesUrlOf("not a repo")).toBeUndefined();
  });
});
