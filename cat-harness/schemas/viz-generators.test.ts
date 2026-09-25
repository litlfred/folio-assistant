/**
 * The two visualiser generators produce a page, and it is a whole one.
 *
 * @module schemas/viz-generators.test
 * @graphNode none — a test over the generators, not a schema itself
 *
 * ## The failure this exists for, which cost a push
 *
 * Both viewers are authored as a TypeScript **template literal** holding a
 * whole HTML document, and a backtick anywhere inside it — including inside a
 * JavaScript comment in the embedded script — silently terminates the string.
 * That happened here: a comment reading *"the intake's own `files[]`"* turned
 * the rest of the page into TypeScript, and the generator exited 1 at a line
 * number 200 lines from the mistake.
 *
 * Nothing caught it but running the generator by hand. Importing the module
 * is enough to catch the parse error, and asserting the page's shape catches
 * the subtler version — a truncated document that still parses.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { basename, join } from "node:path";

import { viewerHtml as schemaViewer, viewerPlacement } from "../scripts/gen-schema-viz.ts";
import { viewerHtml as libraryViewer } from "../scripts/gen-library-viz.ts";
import { readSchemaGraph } from "../scripts/schema-graph.ts";
import { readLibraryGraph } from "../scripts/library-graph.ts";
import { directoriesForGraph, repoRootFor, siteDirFor } from "./cat-harness.ts";

const ROOT = join(import.meta.dir, "..");

/**
 * THE GRAPHS ARE READ ONCE, HERE — not inside the tests that assert on them.
 *
 * Bean `vxho`. Both readers walk the REAL repository, and `bun test` applies
 * its 5000ms timeout PER TEST. Read inside a test, that filesystem work sits
 * inside the budget: measured at ~150ms warm in a quiet process, and **5683ms**
 * under the full suite, where hundreds of files contend for the same disk. So
 * the gate's colour depended on what else the machine was doing — the red that
 * clears on re-run and teaches everybody to re-run.
 *
 * At module scope the same work happens once per FILE, before any test starts,
 * and no test's budget contains it. That is not a trick to get under the
 * number: these graphs are a FIXTURE — every test here asserts about the same
 * repository, and reading it four times was four answers to one question that
 * were only ever equal by luck.
 *
 * `readLibraryGraph` was called twice and `readSchemaGraph` twice; now each is
 * read once.
 */
const SCHEMA_GRAPH = readSchemaGraph(ROOT);
const LIBRARY_GRAPH = readLibraryGraph([ROOT, repoRootFor(ROOT)]);

/** The href a page two levels down uses — what `viewerPlacement` computes. */
const DATA = "../../assets/schemas/index.json";

describe.each([
  ["schema", (h: string) => schemaViewer(h)],
  ["library", (h: string) => libraryViewer(h)],
])("the %s viewer", (_name, viewer) => {
  const html = (): string => viewer(DATA);
  const dataPath = DATA;
  test("is a complete HTML document", () => {
    const page = html();
    expect(page.startsWith("<!doctype html>")).toBe(true);
    expect(page.trimEnd().endsWith("</html>")).toBe(true);
    expect(page).toContain("</script>");
    expect(page).toContain("</style>");
  });

  test("fetches its projection RELATIVE to its own location, with no base URL", () => {
    // `kg-viewer`'s rule: the same bytes must be correct at the canonical base
    // and at a staging slug. A base URL in the page would break the second.
    const page = html();
    expect(page).toContain(dataPath);
    expect(page).not.toContain("https://litlfred.github.io");
  });

  test("renders both colour schemes, and gives body an explicit background", () => {
    const page = html();
    expect(page).toContain("prefers-color-scheme: dark");
    expect(page).toContain('data-theme="dark"');
    expect(page).toMatch(/body\s*\{[^}]*background:\s*var\(--bg\)/);
  });

  test("says so when the projection cannot be read, rather than showing nothing", () => {
    // "could not load" and "there is nothing" are different answers, and this
    // repository's rule is that rendering them alike reports a clean run over
    // something never looked at.
    expect(html()).toContain("could not");
  });
});

describe("viewerPlacement — the URL is the directory's path, not a composition", () => {
  // Owner, 2026-09-20: "<baseurl>/<path to kind in knowledge graph>" or
  // "<path to dir handled>/<optional subject>".
  test("a directory publishes at its own repo-relative path", () => {
    const { pageDir } = viewerPlacement("/site", "cat-harness/schemas", "schemas");
    expect(pageDir).toBe(join("/site", "cat-harness", "schemas"));
  });

  test("a directory NOT at owner/kind is addressed by its path, not by the renderer", () => {
    // The composition this replaced would have said `cat-harness/library` for
    // this one — naming the machinery where the rule names the data.
    const { pageDir } = viewerPlacement("/site", "who-iris/library", "library");
    expect(pageDir).toBe(join("/site", "who-iris", "library"));
    expect(pageDir).not.toContain("cat-harness");
  });

  test("the data href is relative to the page's own depth", () => {
    // A literal `../assets/...` kept parsing and fetched nothing once the page
    // moved two levels down.
    expect(viewerPlacement("/site", "cat-harness/schemas", "schemas").dataHref)
      .toBe("../../assets/schemas/index.json");
    expect(viewerPlacement("/site", "deep/er/still", "schemas").dataHref)
      .toBe("../../../assets/schemas/index.json");
  });
});

describe("the readers agree with what the generators publish", () => {
  test("the schema graph spans every DECLARED schemas directory, not one", () => {
    // `directoryForGraph` throws when several directories declare a graph —
    // the `wggr` guard — and four instances declare `schemas` here. Asking for
    // one was the bug; this locks in the plural answer.
    const g = SCHEMA_GRAPH;
    expect(g).not.toBeNull();
    expect(g!.roots.length).toBeGreaterThan(1);
    expect(new Set(g!.modules.map((m) => m.instance)).size).toBeGreaterThan(1);
  });

  test("a queue's declared intake is ONE unit, not one per file it carries", () => {
    // An `intake.json` declares the capture's files. Counting them
    // individually made a four-file capture read as four documents waiting.
    const g = LIBRARY_GRAPH;
    expect(g).not.toBeNull();
    const intakes = g!.uploads.filter((u) => u.kind === "intake");
    for (const i of intakes) {
      expect(i.declaredFiles).toBeGreaterThan(0);
      // One row, however many files it declares.
      expect(g!.uploads.filter((u) => u.path === i.path)).toHaveLength(1);
    }
  });

  test("every queue's uningested count is total minus ingested, and never negative", () => {
    const g = LIBRARY_GRAPH!;
    for (const q of g.queues) {
      expect(q.uningested).toBe(q.total - q.ingested);
      expect(q.uningested).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("the projection is stable under edits that do not change the graph", () => {
  test("no declaration carries a line number", () => {
    // A line number is an editor coordinate, not a property of a declaration.
    // Carrying it made the staleness gate fire whenever anything ABOVE a
    // declaration moved: merging main shifted two declarations in
    // `cat-harness.ts` by 36 lines, and the gate went red over two integers
    // with nothing else in 895 KB different.
    //
    // A gate whose red means "somebody added a blank line" teaches
    // contributors to regenerate reflexively instead of reading the finding,
    // which is the opposite of what a gate is for.
    // Both path halves are RESOLVED, not spelled out. `site-dir-single-answer`
    // fails any source file that hardcodes the site root, and it caught the
    // first draft of this test doing exactly that — the gate working on the
    // test written to guard another gate. The published segment is the
    // declared directory's own name, the same rule the generator follows.
    const site = join(ROOT, siteDirFor(ROOT));
    const own = directoriesForGraph(ROOT, "schemas").find((d) => d.startsWith(`${ROOT}/`));
    expect(own).toBeDefined();
    const published = JSON.parse(
      readFileSync(join(site, "assets", basename(own!), "index.json"), "utf-8"),
    ) as { decls: Array<Record<string, unknown>> };
    expect(published.decls.length).toBeGreaterThan(0);
    expect(published.decls.filter((d) => "line" in d)).toEqual([]);
  });

  test("the reader still knows the line, so a consumer that wants one can have it", () => {
    // Dropped from the PROJECTION, kept on the reader. The two are different
    // artefacts and conflating them would remove the information entirely.
    const g = SCHEMA_GRAPH!;
    expect(g.decls.every((d) => typeof d.line === "number" && d.line > 0)).toBe(true);
  });
});
