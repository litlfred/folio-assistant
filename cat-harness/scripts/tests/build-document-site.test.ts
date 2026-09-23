/**
 * build-document-site (bean fyu2) over a folio `init-folio` actually
 * scaffolds, with the platform linked the way a folio links it. Not a
 * hand-made fixture: the point is that the command a new folio's staging
 * workflow runs works on what that folio starts as.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { appendFileSync, existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { buildDocumentSite, documentManifests, type Outline } from "../build-document-site.js";
import { readPositions } from "../../../folio-assistant-core/schemas/changeset.js";
import { initFolio } from "../init-folio.js";

const REPO_ROOT = resolve(import.meta.dir, "../../..");

let roots: string[] = [];
afterEach(() => {
  for (const r of roots) rmSync(r, { recursive: true, force: true });
  roots = [];
});

function scaffold(): string {
  const d = mkdtempSync(join(tmpdir(), "docsite-"));
  roots.push(d);
  initFolio({ targetDir: d, slug: "handbook", title: "Handbook", authors: ["A"], contentType: "document", skipVcs: true, link: "submodule" } as Parameters<typeof initFolio>[0]);
  symlinkSync(REPO_ROOT, join(d, "folio-assistant"));
  return d;
}

describe("build-document-site", () => {
  test("a freshly scaffolded document folio builds: index, one page per document, block anchors intact", async () => {
    const d = scaffold();
    const out = join(d, "_site");
    const r = await buildDocumentSite(d, out);
    expect(r.errors).toEqual([]);
    expect(r.documents.map((x) => x.slug)).toEqual(["handbook"]);
    expect(existsSync(join(out, "index.html"))).toBe(true);
    const html = readFileSync(join(out, "handbook", "index.html"), "utf-8");
    // The anchors the review page and the ChangeSet link to, by label.
    expect(html).toContain('<a id="prose:overview"></a>');
    expect(html).toContain('<a id="chap:introduction"></a>');
    expect(readFileSync(join(out, "index.html"), "utf-8")).toContain('href="handbook/index.html"');
  });

  test("a Markdown table in a block renders as a <table>, not raw pipes (fz39)", async () => {
    const d = scaffold();
    appendFileSync(join(d, "folio", "handbook", "introduction", "overview.md"), "\n\n| Role | who |\n|---|---|\n| Initiator | you |\n");
    const out = join(d, "_site");
    await buildDocumentSite(d, out);
    const html = readFileSync(join(out, "handbook", "index.html"), "utf-8");
    expect(html).toContain("<table>");
    expect(html).toContain("<td>Initiator</td>");
    expect(html).not.toContain("| Initiator |");
  });

  test("outline.json lists sections in manifest order, keyed exactly as the ChangeSet keys them (eb4l)", async () => {
    const d = scaffold();
    const out = join(d, "_site");
    await buildDocumentSite(d, out);
    const outline = JSON.parse(readFileSync(join(out, "outline.json"), "utf-8")) as Outline;
    expect(outline.$schema).toBe("folio-outline/v1");
    const sections = outline.documents.flatMap((doc) => doc.chapters.flatMap((c) => c.sections));
    expect(sections.map((s) => s.blocks)).toEqual([["prose:overview"]]);
    // The join the review page relies on: every section the ChangeSet can name is in the outline.
    const csKeys = new Set([...readPositions(join(d, "folio")).values()].map((p) => p.section));
    expect(new Set(sections.map((s) => s.key))).toEqual(csKeys);
  });

  test("a folio with no document is an error, not an empty site", async () => {
    const d = mkdtempSync(join(tmpdir(), "docsite-empty-"));
    roots.push(d);
    expect(documentManifests(d)).toEqual([]);
    const r = await buildDocumentSite(d, join(d, "_site"));
    expect(r.errors[0]).toContain("no document manifest");
    expect(existsSync(join(d, "_site", "index.html"))).toBe(false);
  });
});
