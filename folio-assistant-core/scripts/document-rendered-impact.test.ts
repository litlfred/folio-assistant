/**
 * The document folio's rendered impact (bean `bnjs`), read from a ChangeSet and
 * an outline as the staging build publishes them, never from source. The
 * real-folio acceptance case is recorded in the bean: litlfred/smart-ra, one
 * block sentence plus one chapter title, predicted 2 / measured 2 / 0 missed.
 */
import { afterAll, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { reviewList } from "../../cat-harness/schemas/rendered-impact.js";
import { CHANGESET_SCHEMA, type ChangeSet } from "../schemas/changeset.js";
import {
  documentRenderedImpact,
  DOCUMENT_RENDERER,
  PUBLIC_COMMENT_RENDERER,
  buildSteps,
  siteMayRead,
  siteReadsOf,
  type SiteReads,
} from "./document-rendered-impact.js";

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

describe("documentRenderedImpact — a file no builder of the site reads (bean ehh6)", () => {
  // smart-ra#26, the first real run: the branch's bean was "may change any
  // page", and an undetermined input holds the coverage gate shut.
  const reads: SiteReads = { reads: ["folio/", "library/", "review/public-comment/"], submodules: ["folio-assistant"] };
  const changed = ["beans/dpi-h-ra-7ss8--verify.md", "README.md", "input/fsh/x.fsh", "folio-assistant", "dpi-h-ra.json", "library/a.pdf", ".github/workflows/staging.yml"];

  test("an undeclared directory or a root Markdown note is an input that reaches no page", () => {
    const [doc] = documentRenderedImpact({ changed, changeset, outline, reads });
    expect(doc.inputs).toEqual([...changed].sort());
    expect(doc.files).toEqual([]);
    expect(doc.undetermined.map((u) => u.input).sort()).toEqual([".github/workflows/staging.yml", "dpi-h-ra.json", "folio-assistant", "library/a.pdf"]);
  });

  test("the platform, a declared graph, the build definition and a root config stay any page", () => {
    for (const f of ["folio-assistant", "folio-assistant/cat-harness/x.ts", "library/a.pdf", ".github/x.yml", "package.json", "bun.lock"]) expect(siteMayRead(f, reads)).toBe(true);
    for (const f of ["beans/x.md", "AGENTS.md", "test/results/block-qa/x.json"]) expect(siteMayRead(f, reads)).toBe(false);
  });

  test("with nothing declared to read, nothing is excluded: doubt carries", () => {
    expect(siteMayRead("beans/x.md", undefined)).toBe(true);
    expect(documentRenderedImpact({ changed: ["beans/x.md"], changeset, outline })[0].undetermined.map((u) => u.input)).toEqual(["beans/x.md"]);
  });

  describe("siteReadsOf: what the build command's builders say they read", () => {
    // smart-ra#26's second run: it DECLARED beans/ and todos/, so "declared"
    // read as "read", yet the site renders todos and never beans.
    const T = mkdtempSync(join(tmpdir(), "site-reads-"));
    afterAll(() => rmSync(T, { recursive: true, force: true }));
    const repo = (name: string, builders: Record<string, string> = {}) => {
      const r = join(T, name);
      mkdirSync(join(r, "b"), { recursive: true });
      writeFileSync(join(r, "x.json"), JSON.stringify({ name: "x", directories: [{ id: "folio", path: "folio/", graphTypologies: ["folio"] }, { id: "beans", path: "beans/", graphTypologies: ["bean-defs"] }] }));
      writeFileSync(join(r, ".gitmodules"), '[submodule "folio-assistant"]\n\tpath = folio-assistant\n\turl = https://example.invalid/fa.git\n');
      for (const [f, body] of Object.entries(builders)) writeFileSync(join(r, "b", f), body);
      return r;
    };

    test("each step's script and its arguments; a step that runs no script is undefined", () => {
      expect(buildSteps("bun run a/x.ts --out _site && bun run y.ts --root . ; jekyll build")).toEqual([
        { script: "a/x.ts", args: ["--out", "_site"] },
        { script: "y.ts", args: ["--root", "."] },
        undefined,
      ]);
    });

    test("with a command: the union of its builders' reads, and a declared directory no builder reads is not read", async () => {
      const r = repo("a", {
        "doc.ts": "export const siteReads = () => ['folio'];",
        "todo.ts": "export const siteReads = async (_r, args) => (args.includes('--todos') ? ['todos/items'] : []);",
      });
      const got = await siteReadsOf(r, "bun run b/doc.ts --out _site && bun run b/todo.ts --todos");
      expect(got).toEqual({ reads: ["folio", "todos/items"], submodules: ["folio-assistant"] });
      expect(siteMayRead("beans/x.md", got)).toBe(false);
      expect(siteMayRead("todos/items/a.md", got)).toBe(true);
    });

    test("a step that is not a builder exporting siteReads, or a missing script: nothing excluded", async () => {
      const r = repo("b", { "dumb.ts": "export const x = 1;", "doc.ts": "export const siteReads = () => ['folio'];" });
      expect(await siteReadsOf(r, "bun run b/doc.ts && bun run b/dumb.ts")).toBeUndefined();
      expect(await siteReadsOf(r, "bun run b/doc.ts && jekyll build")).toBeUndefined();
      expect(await siteReadsOf(r, "bun run b/gone.ts")).toBeUndefined();
    });

    test("no command: the declared directories stand in", async () => {
      expect(await siteReadsOf(repo("c"))).toEqual({ reads: ["folio/", "beans/"], submodules: ["folio-assistant"] });
    });

    test("no declaration: undefined, so nothing is excluded", async () => {
      const r = join(T, "none");
      mkdirSync(r);
      expect(await siteReadsOf(r, "bun run x.ts")).toBeUndefined();
    });
  });
});

describe("documentRenderedImpact — a lazy page (bean v433)", () => {
  // `doc` is lazy: three chunks, the edited block in the first, the added one in the second.
  const lazyOutline = { documents: [{ slug: "doc", lazy: { hydrated: "doc/index.hydrated.html", chunks: 3, of: { "prose:edited": 0, "prose:new": 1 } } }, { slug: "other" }] };
  const runLazy = (changed: string[]) => documentRenderedImpact({ changed, changeset, outline: lazyOutline })[0];

  test("a text edit is its chunk and the hydrated page, not the shell", () => {
    expect(runLazy(["folio/doc/ch1/p-1.md"]).files.map(line)).toEqual(["data:doc/blocks/000.json", "content:doc/index.hydrated.html#prose:edited"]);
  });

  test("an added block reshapes the shell and shifts every chunk from its own on", () => {
    expect(runLazy(["folio/doc/ch1/p-2.ts"]).files.map(line)).toEqual([
      "data:doc/blocks/001.json",
      "data:doc/blocks/002.json",
      "content:doc/index.html",
      "content:doc/index.hydrated.html#prose:new",
    ]);
  });

  test("a page that is not lazy is unchanged by any of this", () => {
    expect(runLazy(["folio/other/ch1/p-9.ts"]).files.map(line)).toEqual(["content:other/index.html#prose:gone"]);
  });

  test("the comment store also reaches the lazy page's notes and its hydrated page", () => {
    const pc = documentRenderedImpact({ changed: ["review/public-comment/comments/PC-1.json"], changeset, outline: lazyOutline })[1];
    expect(pc.files.map(line)).toContain("data:doc/pc-notes.json");
    expect(pc.files.map(line)).toContain("content:doc/index.hydrated.html");
  });
});
