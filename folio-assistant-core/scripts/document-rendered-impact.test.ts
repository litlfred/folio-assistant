/**
 * The document folio's rendered impact (bean `bnjs`), read from a ChangeSet and
 * an outline as the staging build publishes them, never from source. The
 * real-folio acceptance case is recorded in the bean: litlfred/smart-ra, one
 * block sentence plus one chapter title, predicted 2 / measured 2 / 0 missed.
 */
import { describe, expect, test } from "bun:test";

import { reviewList } from "../../cat-harness/schemas/rendered-impact.js";
import { CHANGESET_SCHEMA, type ChangeSet } from "../schemas/changeset.js";
import { documentRenderedImpact, DOCUMENT_RENDERER, PUBLIC_COMMENT_RENDERER } from "./document-rendered-impact.js";

const at = (file: string) => ({ file, kind: "prose", section: "doc/ch1::s1", index: 0 });
const changeset: ChangeSet = {
  $schema: CHANGESET_SCHEMA,
  folio: "folio",
  base: { ref: "main", commit: "a".repeat(40) },
  head: { ref: "HEAD", commit: "b".repeat(40) },
  summary: { added: 1, removed: 1, changed: 1, unchanged: 9, renamed: 0, prose: 1, manifest: 0, moved: 0 },
  changes: [
    { change: "changed", label: "prose:edited", aspects: ["prose"], base: at("doc/ch1/p-1.ts"), head: at("doc/ch1/p-1.ts") },
    { change: "added", label: "prose:new", head: at("doc/ch1/p-2.ts") },
    { change: "removed", label: "prose:gone", base: at("other/ch1/p-9.ts") },
  ],
};
const outline = { documents: [{ slug: "doc" }, { slug: "other" }] };
const run = (changed: string[], site?: string) => documentRenderedImpact({ changed, changeset, outline, ...(site ? { site } : {}) });
const line = (f: { role: string; path: string; anchors?: string[] }) => `${f.role}:${f.path}${f.anchors ? "#" + f.anchors.join(",") : ""}`;

describe("documentRenderedImpact — blocks, from the ChangeSet", () => {
  test("an edited, an added and a removed block each land on their own document's page, anchored at the label", () => {
    const [doc] = run(["folio/doc/ch1/p-1.md", "folio/doc/ch1/p-2.ts", "folio/other/ch1/p-9.ts"]);
    expect(doc.renderer).toBe(DOCUMENT_RENDERER);
    expect(doc.files.map(line)).toEqual(["content:doc/index.html#prose:edited,prose:new", "content:other/index.html#prose:gone"]);
    expect(doc.undetermined).toEqual([]);
  });

  test("the review list links each changed block", () => {
    expect(reviewList(run(["folio/doc/ch1/p-1.md"])[0]).map(line)).toEqual(["content:doc/index.html#prose:edited"]);
  });

  test("the site prefix places the pages where the preview serves them", () => {
    expect(run(["folio/doc/ch1/p-1.ts"], "smart-ra")[0].files.map((f) => f.path)).toEqual(["smart-ra/doc/index.html"]);
  });
});

describe("documentRenderedImpact — files the ChangeSet does not name", () => {
  test("a chapter manifest moves the page and the outline; the document manifest also the document list", () => {
    expect(run(["folio/doc/ch1/ch1.ts"])[0].files.map(line)).toEqual(["content:doc/index.html", "index:outline.json"]);
    expect(run(["folio/doc/doc.ts"])[0].files.map(line)).toEqual(["content:doc/index.html", "index:index.html", "index:outline.json"]);
  });

  test("a media file is the copied file and the page that shows it", () => {
    expect(run(["folio/doc/media/fig1.png"])[0].files.map(line)).toEqual(["content:doc/index.html", "data:doc/media/fig1.png"]);
  });

  test("the comment store is the public-comment renderer's: the dashboard and every document page", () => {
    const out = run(["review/public-comment/comments/PC-0001.json"]);
    expect(out.map((i) => i.renderer)).toEqual([DOCUMENT_RENDERER, PUBLIC_COMMENT_RENDERER]);
    expect(out[1].files.map(line)).toEqual(["content:doc/index.html", "content:other/index.html", "content:public-comments/index.html"]);
  });

  test("anything else is undetermined with scope all, never no change", () => {
    const [doc] = run(["dpi-h-ra.config.json", "folio-assistant"]);
    expect(doc.files).toEqual([]);
    expect(doc.undetermined.map((u) => [u.input, u.scope])).toEqual([["dpi-h-ra.config.json", "all"], ["folio-assistant", "all"]]);
  });
});
