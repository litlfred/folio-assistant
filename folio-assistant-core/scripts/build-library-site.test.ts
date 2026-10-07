/**
 * A folio's library on its own site (bean zcak): the Document view, with
 * [source] and [feedback] on the library's own files and [edit] on the folio
 * block each section was materialised as (owner, 2026-10-07: "if viewing in
 * library, edit -> materialized version in folio/'s edit").
 */
import { describe, expect, test } from "bun:test";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { buildLibrarySite, entryContents, entryView, HANDLER, materialisedEdits, siteReads } from "./build-library-site.js";

const ENTRY = "review-v1";
const FIXTURE = join(import.meta.dir, "test-fixtures", "library-structure.json");

/** A folio with a library entry (a trimmed DPI-H structure) and the document made from it. */
function scaffold(): string {
  const d = mkdtempSync(join(tmpdir(), "libsite-"));
  writeFileSync(
    join(d, "doc.json"),
    JSON.stringify({ name: "doc", directories: [{ id: "folio", path: "folio/", graphTypologies: ["folio"] }, { id: "library", path: "library/", graphTypologies: ["library"] }] }),
  );
  mkdirSync(join(d, "library", ENTRY), { recursive: true });
  copyFileSync(FIXTURE, join(d, "library", ENTRY, "structure.json"));
  const doc = join(d, "folio", "doc");
  mkdirSync(join(doc, "ch1"), { recursive: true });
  writeFileSync(join(doc, "doc.ts"), `export default { title: "The Handbook", chapters: [] };\n`);
  writeFileSync(join(doc, "ch1", "p-1-1.md"), "About.\n");
  writeFileSync(join(doc, "ch1", "p-1-1-1.md"), "What is.\n");
  writeFileSync(
    join(doc, "review-anchors.json"),
    JSON.stringify({
      $schema: "folio-review-anchors/v1",
      document: "doc",
      library: ENTRY,
      sections: [
        { label: "sec:1-1", number: "1.1", title: "About" },
        { label: "sec:1-1-1", number: "1.1.1", title: "What is a reference architecture" },
      ],
      blocks: [
        { label: "prose:1-1", chapter: "ch1", root: "p-1-1", sections: ["sec:1-1"] },
        { label: "prose:1-1-1", chapter: "ch1", root: "p-1-1-1", sections: ["sec:1-1-1"] },
      ],
    }),
  );
  return d;
}

describe("build-library-site (bean zcak)", () => {
  test("a section maps to the first folio block of the section with its number; one with no counterpart maps to nothing", () => {
    const d = scaffold();
    const editFor = materialisedEdits(d, ENTRY)!;
    expect(editFor({ id: "x", number: "1.1.1", title: "anything" })).toEqual({ path: "folio/doc/ch1/p-1-1-1.md", label: "prose:1-1-1" });
    expect(editFor({ id: "x", number: null, title: "About" })?.path).toBe("folio/doc/ch1/p-1-1.md");
    expect(editFor({ id: "x", number: null, title: "Front matter" })).toBeUndefined();
    expect(materialisedEdits(d, "some-other-entry")).toBeUndefined();
  });

  test("the entry page is published under the handler route, with links to the library's files and edits into the folio", () => {
    const d = scaffold();
    const out = join(d, "_site");
    const r = buildLibrarySite(d, out, { repo: "o/r" });
    expect(r.entries).toEqual([expect.objectContaining({ id: ENTRY, sections: 3, editable: 2 })]);
    const at = join(out, HANDLER, "library", ENTRY);
    const view = JSON.parse(readFileSync(join(at, "entries", `${ENTRY}.doc.json`), "utf-8"));
    // The document's own title, never the page-1 guess.
    expect(view.title).toContain("The Handbook");
    expect(view.links).toEqual({ repo: "o/r", branch: "main", dir: `library/${ENTRY}` });
    const edits = view.sections.map((s: { edit?: { path: string } }) => s.edit?.path ?? null);
    expect(edits).toEqual(["folio/doc/ch1/p-1-1.md", "folio/doc/ch1/p-1-1-1.md", null]);
    const html = readFileSync(join(at, "index.html"), "utf-8");
    expect(html).toContain("function faBlockUrls");
    expect(html).toContain("loadDocument(");
    expect(readFileSync(join(out, HANDLER, "library", "index.html"), "utf-8")).toContain(`href="${ENTRY}/"`);
  });

  test("it says what it reads: the library and the folio", () => {
    const d = scaffold();
    expect(siteReads(d)).toEqual(["library", "folio"]);
  });

  test("the page declares its sections to the rail: top level as rows, the next level as their children", () => {
    const d = scaffold();
    const view = entryView(d, join(d, "library", ENTRY), "o/r")!;
    const decl = entryContents(view);
    const json = JSON.parse(/<script[^>]*data-fa-visualiser-nav[^>]*>([\s\S]*?)<\/script>/.exec(decl)![1]!);
    expect(json.length).toBeGreaterThanOrEqual(1);
    expect(json[0].href).toMatch(/^#sec-/);
    buildLibrarySite(d, join(d, "_s"), { repo: "o/r" });
    expect(readFileSync(join(d, "_s", HANDLER, "library", ENTRY, "index.html"), "utf-8")).toContain("data-fa-visualiser-nav");
  });
});
