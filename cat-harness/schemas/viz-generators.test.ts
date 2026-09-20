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
import { join } from "node:path";

import { viewerHtml as schemaViewer } from "../scripts/gen-schema-viz.ts";
import { viewerHtml as libraryViewer } from "../scripts/gen-library-viz.ts";
import { readSchemaGraph } from "../scripts/schema-graph.ts";
import { readLibraryGraph } from "../scripts/library-graph.ts";
import { repoRootFor } from "./cat-harness.ts";

const ROOT = join(import.meta.dir, "..");

describe.each([
  ["schema", schemaViewer, "../assets/schemas/index.json"],
  ["library", libraryViewer, "../assets/library/index.json"],
])("the %s viewer", (_name, html, dataPath) => {
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

describe("the readers agree with what the generators publish", () => {
  test("the schema graph spans every DECLARED schemas directory, not one", () => {
    // `directoryForGraph` throws when several directories declare a graph —
    // the `wggr` guard — and four instances declare `schemas` here. Asking for
    // one was the bug; this locks in the plural answer.
    const g = readSchemaGraph(ROOT);
    expect(g).not.toBeNull();
    expect(g!.roots.length).toBeGreaterThan(1);
    expect(new Set(g!.modules.map((m) => m.instance)).size).toBeGreaterThan(1);
  });

  test("a queue's declared intake is ONE unit, not one per file it carries", () => {
    // An `intake.json` declares the capture's files. Counting them
    // individually made a four-file capture read as four documents waiting.
    const g = readLibraryGraph([ROOT, repoRootFor(ROOT)]);
    expect(g).not.toBeNull();
    const intakes = g!.uploads.filter((u) => u.kind === "intake");
    for (const i of intakes) {
      expect(i.declaredFiles).toBeGreaterThan(0);
      // One row, however many files it declares.
      expect(g!.uploads.filter((u) => u.path === i.path)).toHaveLength(1);
    }
  });

  test("every queue's uningested count is total minus ingested, and never negative", () => {
    const g = readLibraryGraph([ROOT, repoRootFor(ROOT)])!;
    for (const q of g.queues) {
      expect(q.uningested).toBe(q.total - q.ingested);
      expect(q.uningested).toBeGreaterThanOrEqual(0);
    }
  });
});
