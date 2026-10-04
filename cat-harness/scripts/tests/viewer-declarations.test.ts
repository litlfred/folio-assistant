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
import { tools } from "../../tools/discover.js";
import {
  metaRenders,
  pagesRendering,
  renderedPath,
  viewerPageFor,
  viewerPages,
  viewersOf,
  withRenders,
  withRendersFrontMatter,
  type ViewedDirectory,
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

describe("the corpus: viewers are read from the pages (#1168 B7a-2b)", () => {
  const REPO = resolve(import.meta.dir, "..", "..", "..");
  const kindsByTool = new Map(
    tools().flatMap((t) => (t.renders && t.renders.length > 0 ? [[t.id, t.renders] as const] : [])),
  );

  type Dir = ViewedDirectory;
  const dirs: { root: string; instance: string; dir: Dir }[] = [];
  for (const root of instanceRootsIn(REPO)) {
    const p = declarationPathIn(root);
    if (!p) continue;
    const decl = JSON.parse(readFileSync(p, "utf-8")) as { name?: string; directories?: Dir[] };
    // The DECLARED name, not the directory's: the checkout's root instance
    // (placement PR0) sits in a directory named after the clone.
    for (const dir of decl.directories ?? []) dirs.push({ root, instance: decl.name ?? root.split("/").pop()!, dir });
  }

  test("the corpus is non-empty, so the assertions below are not vacuous", () => {
    expect(dirs.length).toBeGreaterThan(0);
    expect(kindsByTool.size).toBeGreaterThan(0);
  });

  test("a directory declares its viewer only where no platform page draws it", () => {
    // The directory pointing at its viewer is the wrong-way arrow B7 removed.
    // It survives only where a page the platform draws cannot say it — each
    // with its reason — and an entry anywhere else is the arrow coming back.
    const ELSEWHERE: Record<string, string> = {
      // Declared by the checkout's ROOT instance since placement PR0 (bean `ejye`).
      "folio-assistant/fsh-guts": "never published — no published artefact may carry a path to it",
      "who-iris/who-iris-catalogue": "drawn by who-iris's own generator, which declares no tools graph",
      "folio-assistant-core/glossary": "drawn by folio-assistant-core's own generator",
    };
    const declaring = dirs
      .filter(({ dir }) => dir.coverage?.visualiser !== undefined)
      .map(({ instance, dir }) => `${instance}/${dir.id}`)
      .sort();
    expect(declaring).toEqual(Object.keys(ELSEWHERE).sort());
  });

  test("known directories resolve to the page their generator draws for them", () => {
    const resolveFor = (instance: string, id: string): string | undefined => {
      const row = dirs.find((d) => d.instance === instance && d.dir.id === id)!;
      return viewersOf(row.dir, row.root, REPO)[0]?.ref;
    };
    expect(resolveFor("cat-harness", "tools")).toBe("cat-harness/docs/tools/index.md");
    expect(resolveFor("cat-harness", "processes")).toBe("cat-harness/docs/processes/index.md");
    // `who-iris-library` was cat-harness's MIRROR of who-iris's own entry; the
    // mirror is gone (placement PR0) and the owner's entry resolves the same page.
    expect(resolveFor("who-iris", "library")).toBe("cat-harness/docs/cat-harness/library/who-iris/index.html");
    expect(resolveFor("cat-harness", "skills")).toBe("cat-harness/docs/cat-harness/auto-docs/index/skills/skills/index.html");
    expect(resolveFor("folio-assistant", "beans")).toBe("cat-harness/docs/beans/index.html");
    // An index page that merely LISTS a directory is not its viewer: the
    // auto-docs processes pages draw `cat-harness/processes` too, and lose.
    expect(resolveFor("folio-assistant", "fsh-guts")).toBe("cat-harness/docs/fsh-guts/index.md");
  });

  test("every resolved page exists", () => {
    const missing = dirs.flatMap(({ root, instance, dir }) =>
      viewersOf(dir, root, REPO)
        .filter((v) => !existsSync(join(REPO, v.ref)))
        .map((v) => `${instance}/${dir.id} → ${v.ref}`),
    );
    expect(missing).toEqual([]);
  });
});
