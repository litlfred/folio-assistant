/**
 * Which viewer page renders a directory is read from the pages (#1168 B7a-2).
 *
 * Two halves: the reader and writer functions, on fixtures; and the corpus
 * grounding — while `coverage.visualiser` still exists, every page it names
 * that exists must be one the generators say draws that directory.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

import { declarationPathIn, instanceRootsIn } from "../../schemas/cat-harness.js";
import {
  metaRenders,
  pagesRendering,
  renderedPath,
  viewerPages,
  withRenders,
  withRendersFrontMatter,
} from "../viewer-declarations.js";

describe("writing and reading the declaration", () => {
  test("HTML: inserted after <head>, replaced not duplicated, sorted and deduplicated", () => {
    const once = withRenders("<html><head><title>t</title></head></html>", ["b/x", "a/y", "b/x"]);
    expect(metaRenders(once)).toEqual(["a/y", "b/x"]);
    const twice = withRenders(once, ["c/z"]);
    expect(metaRenders(twice)).toEqual(["c/z"]);
    expect(twice.match(/name="renders"/g)).toHaveLength(1);
  });

  test("HTML: an empty list writes nothing, and removes an earlier one", () => {
    const html = "<html><head></head></html>";
    expect(withRenders(html, [])).toBe(html);
    expect(metaRenders(withRenders(withRenders(html, ["a"]), []))).toEqual([]);
  });

  test("markdown: into the front matter, replaced not duplicated", () => {
    const md = "---\ntitle: T\n---\nbody\n";
    const once = withRendersFrontMatter(md, ["a/b"]);
    expect(once).toBe("---\ntitle: T\nrenders:\n  - a/b\n---\nbody\n");
    expect(withRendersFrontMatter(once, ["c"])).toBe("---\ntitle: T\nrenders:\n  - c\n---\nbody\n");
    expect(withRendersFrontMatter("no front matter", ["a"])).toBe("no front matter");
  });

  test("a directory is named repository-relative, with no trailing slash", () => {
    expect(renderedPath("/r", "/r/who-iris/library/")).toBe("who-iris/library");
  });

  test("pages are found by the directory they declare", () => {
    const root = mkdtempSync(join(tmpdir(), "viewer-decl-"));
    const files: Record<string, string> = {
      "site/lib/index.html": withRenders("<html><head></head></html>", ["x/library", "y/library"]),
      "site/tools/index.md": withRendersFrontMatter("---\ntitle: T\n---\n", ["x/tools"]),
      "site/plain/index.html": "<html><head></head></html>",
    };
    for (const [f, body] of Object.entries(files)) {
      mkdirSync(join(root, dirname(f)), { recursive: true });
      writeFileSync(join(root, f), body);
    }
    const pages = viewerPages(root, Object.keys(files));
    expect(pages.map((p) => p.page).sort()).toEqual(["site/lib/index.html", "site/tools/index.md"]);
    expect(pagesRendering("y/library/", pages)).toEqual(["site/lib/index.html"]);
    expect(pagesRendering("x/tools", pages)).toEqual(["site/tools/index.md"]);
    expect(pagesRendering("z", pages)).toEqual([]);
  });
});

describe("the corpus: every declared viewer page that exists declares that it draws the directory", () => {
  const REPO = resolve(import.meta.dir, "..", "..", "..");
  const tracked = Bun.spawnSync(["git", "ls-files", "*.md", "*.html"], { cwd: REPO })
    .stdout.toString().split("\n").filter(Boolean);
  const pages = viewerPages(REPO, tracked);

  /**
   * The directories whose viewer is not drawn by a platform generator that
   * declares, each for its reason. They keep a directory-side declaration
   * (owner, 2026-09-24: "split: page derived").
   */
  const ELSEWHERE: Record<string, string> = {
    "fsh-guts": "never published — no published artefact may carry a path to it",
    "who-iris/catalogue": "drawn by who-iris's own generator, which declares no tools graph",
    "folio-assistant-core/glossary": "drawn by folio-assistant-core's own generator",
  };

  const rows: { dir: string; ref: string }[] = [];
  for (const root of instanceRootsIn(REPO)) {
    const p = declarationPathIn(root);
    if (!p) continue;
    const decl = JSON.parse(readFileSync(p, "utf-8")) as {
      directories?: { path: string; scope?: string; coverage?: { visualiser?: string | { ref: string }[] } }[];
    };
    for (const e of decl.directories ?? []) {
      const v = e.coverage?.visualiser;
      if (v === undefined) continue;
      const dir = renderedPath(REPO, join(e.scope === "repository" ? REPO : root, e.path));
      for (const ref of typeof v === "string" ? [v] : v.map((x) => x.ref)) rows.push({ dir, ref });
    }
  }

  test("the corpus is non-empty, so the assertion below is not vacuous", () => {
    expect(pages.length).toBeGreaterThan(0);
    expect(rows.length).toBeGreaterThan(0);
  });

  test("each existing declared page draws its directory", () => {
    const missed = rows
      .filter((r) => !(r.dir in ELSEWHERE))
      .filter((r) => existsSync(join(REPO, r.ref)))
      .filter((r) => !pagesRendering(r.dir, pages).includes(r.ref))
      .map((r) => `${r.dir} → ${r.ref}`);
    expect(missed).toEqual([]);
  });
});
