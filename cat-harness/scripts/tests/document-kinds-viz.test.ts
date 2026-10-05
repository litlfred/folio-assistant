/**
 * The document-kinds viewer draws what a kind declares, and refuses an invalid one.
 *
 * Calibrated: rendering only `k.sections.slice(1)` in `kindCard` fails the
 * "every section" test.
 */
import { describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { pageHtml, readDocumentKinds } from "../gen-document-kinds-viz.ts";

const REPO = resolve(import.meta.dir, "..", "..", "..");

describe("the committed DAK kind, drawn", () => {
  const { kinds } = readDocumentKinds(REPO);
  const dak = kinds.find((k) => k.instance === "smart-base" && k.kind.id === "dak");

  it("smart-base declares the DAK kind", () => {
    expect(dak).toBeDefined();
  });

  it("every section title appears, and the structure and sources are stated", () => {
    const html = pageHtml([dak!]);
    for (const s of dak!.kind.sections) expect(html).toContain(s.title.replace(/&/g, "&amp;"));
    expect(html).toContain("<b>fixed</b> structure");
    for (const s of dak!.kind.sources) expect(html).toContain(s.ref);
  });
});

describe("an invalid kind is refused, not drawn", () => {
  it("throws naming the file", () => {
    const repo = mkdtempSync(join(REPO, "doc-kinds-scratch-"));
    try {
      writeFileSync(join(repo, "scratch.json"), JSON.stringify({ name: "scratch", directories: [{ id: "k", path: "kinds/", graphTypologies: ["document-kinds"] }] }));
      mkdirSync(join(repo, "kinds"));
      writeFileSync(join(repo, "kinds", "bad.json"), JSON.stringify({ $schema: "folio-document-kind/v1", id: "bad", title: "Bad", description: "x", structure: "fixed", sections: [], sources: [] }));
      expect(() => readDocumentKinds(REPO)).toThrow(/bad\.json/);
    } finally {
      rmSync(repo, { recursive: true, force: true });
    }
  });
});
