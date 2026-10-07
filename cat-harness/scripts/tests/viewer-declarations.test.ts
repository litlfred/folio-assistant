/**
 * Which viewer page renders a directory is read from the pages (#1168 B7a-2).
 *
 * Two halves: the reader and writer functions, on fixtures; and the corpus
 * grounding — while `coverage.visualiser` still exists, every page it names
 * that exists must be one the generators say draws that directory.
 *
 * The tests of this file that read the whole checkout (reads every instance's
 * declared viewers) live in `test/viewer-declarations-checkout.test.ts` (bean
 * `7zz1`): standing alone, cat-harness has none of it.
 */
import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import {
  metaRenders,
  pagesRendering,
  renderedPath,
  viewerPageFor,
  viewerPages,
  withRenders,
  withRendersFrontMatter,
} from "../viewer-declarations.js";

describe("writing and reading the declaration", () => {
  test("HTML: inserted after <head>, replaced not duplicated, sorted and deduplicated", () => {
    const once = withRenders("<html><head><title>t</title></head></html>", ["b/x", "a/y", "b/x"], "t");
    expect(metaRenders(once)).toEqual(["a/y", "b/x"]);
    const twice = withRenders(once, ["c/z"], "t");
    expect(metaRenders(twice)).toEqual(["c/z"]);
    expect(twice.match(/name="renders"/g)).toHaveLength(1);
  });

  test("HTML: an empty list writes nothing, and removes an earlier one", () => {
    const html = "<html><head></head></html>";
    expect(withRenders(html, [], "t")).toBe(html);
    expect(metaRenders(withRenders(withRenders(html, ["a"], "t"), [], "t"))).toEqual([]);
  });

  test("markdown: into the front matter, replaced not duplicated", () => {
    const md = "---\ntitle: T\n---\nbody\n";
    const once = withRendersFrontMatter(md, ["a/b"], "t");
    expect(once).toBe("---\ntitle: T\nrenders:\n  - a/b\nrendered-by: t\n---\nbody\n");
    expect(withRendersFrontMatter(once, ["c"], "u")).toBe("---\ntitle: T\nrenders:\n  - c\nrendered-by: u\n---\nbody\n");
    expect(withRendersFrontMatter("no front matter", ["a"], "t")).toBe("no front matter");
  });

  test("a directory is named repository-relative, with no trailing slash", () => {
    expect(renderedPath("/r", "/r/who-iris/library/")).toBe("who-iris/library");
  });

  test("pages are found by the directory they declare", () => {
    const root = mkdtempSync(join(tmpdir(), "viewer-decl-"));
    const files: Record<string, string> = {
      "site/lib/index.html": withRenders("<html><head></head></html>", ["x/library", "y/library"], "library-viewer"),
      "site/tools/index.md": withRendersFrontMatter("---\ntitle: T\n---\n", ["x/tools"], "tools-viewer"),
      "site/plain/index.html": "<html><head></head></html>",
    };
    for (const [f, body] of Object.entries(files)) {
      mkdirSync(join(root, dirname(f)), { recursive: true });
      writeFileSync(join(root, f), body);
    }
    const pages = viewerPages(root, Object.keys(files));
    expect(pages.map((p) => p.page).sort()).toEqual(["site/lib/index.html", "site/tools/index.md"]);
    expect(pages.map((p) => p.renderedBy).sort()).toEqual(["library-viewer", "tools-viewer"]);
    expect(pagesRendering("y/library/", pages)).toEqual(["site/lib/index.html"]);
    expect(pagesRendering("x/tools", pages)).toEqual(["site/tools/index.md"]);
    expect(pagesRendering("z", pages)).toEqual([]);
  });
});

describe("choosing the page a directory's tile opens", () => {
  const kinds = new Map<string, readonly string[]>([
    ["library-viewer", ["library"]],
    ["auto-docs-viewer", ["skills"]],
  ]);
  const pages = [
    { page: "site/library/index.html", renders: ["a/library", "b/library"], renderedBy: "library-viewer" },
    { page: "site/library/a/index.html", renders: ["a/library"], renderedBy: "library-viewer" },
    { page: "site/index/library/a/index.html", renders: ["a/library"], renderedBy: "auto-docs-viewer" },
    { page: "site/unsigned/index.html", renders: ["a/library"] },
  ];

  test("the most specific page drawn by a Tool that renders the directory's kind", () => {
    expect(viewerPageFor("a/library", ["library"], pages, kinds)).toBe("site/library/a/index.html");
    expect(viewerPageFor("b/library", ["library"], pages, kinds)).toBe("site/library/index.html");
  });

  test("a page by a Tool that does not render the kind, or by no Tool, is not the viewer", () => {
    expect(viewerPageFor("a/library", ["voices"], pages, kinds)).toBeUndefined();
    expect(viewerPageFor("a/library", ["skills"], pages, kinds)).toBe("site/index/library/a/index.html");
    expect(viewerPageFor("c/library", ["library"], pages, kinds)).toBeUndefined();
  });

  test("on a tie in specificity, the deeper page", () => {
    const tie = [
      { page: "site/g/index.html", renders: ["g"], renderedBy: "library-viewer" },
      { page: "site/g/g/index.html", renders: ["g"], renderedBy: "library-viewer" },
    ];
    expect(viewerPageFor("g", ["library"], tie, kinds)).toBe("site/g/g/index.html");
  });
});
