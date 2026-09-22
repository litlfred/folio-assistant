import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { readFolioGraph, projection, viewerHtml } from "../gen-folio-viz.ts";
import { MARKER } from "../folio-mount.ts";
import { repoRootFor, siteDirFor } from "../../schemas/cat-harness.ts";

/**
 * The folio graph has a view of its own. Bean `7ofc`.
 *
 * Owner, 2026-09-22: *"folio must be in cat-harness and visualizer owned by
 * it."* `folio` is the only `renderable` kind — its CONTENT already renders
 * as the landing board — so what was missing was a view of the GRAPH, and
 * `check:subgraph-coverage` never asked for it because `owesVisualiser`
 * exempts the kind. The obligation is `2krx`'s: a directory nobody can see
 * is one nobody checks.
 */

const ROOT = join(import.meta.dir, "..", "..");
const REPO = repoRootFor(ROOT);
const SITE = join(ROOT, siteDirFor(ROOT));

describe("the graph is read, not guessed", () => {
  const g = readFolioGraph([ROOT, REPO]);

  test("it finds the declared folio directory and its nodes", () => {
    expect(g).not.toBeNull();
    expect(g!.directories.length).toBeGreaterThan(0);
    expect(g!.nodes.length).toBeGreaterThan(0);
  });

  test("every node carries the fields the view shows", () => {
    for (const n of g!.nodes) {
      expect(typeof n.id).toBe("string");
      expect(n.id.length).toBeGreaterThan(0);
      expect(typeof n.chars).toBe("number");
      expect(Array.isArray(n.links)).toBe(true);
    }
  });

  test("a declared directory is reported with its PRESENCE, not silently skipped", () => {
    // `dh4f`, and the author of this file re-enacted it on 2026-09-22 by
    // measuring an instance-relative path from the repo root (bean `8mbk`,
    // scrapped). A consumer that scans nothing and reports clean is worse
    // than one that says it found nothing.
    for (const d of g!.directories) expect(typeof d.present).toBe("boolean");
  });

  test("the projection declares its own count, so a wrong one is visible", () => {
    // `tis1`: a count nobody can see is a count nobody checks — and a badge
    // also makes a WRONG count visible, which is how the voices tile was
    // caught saying 5 over a graph of 6.
    const p = projection(g!) as { tile: { folio: { count: number } }; nodes: unknown[] };
    expect(p.tile.folio.count).toBe(p.nodes.length);
  });
});

describe("the page", () => {
  test("carries the folio mount, like every other library surface", () => {
    expect(viewerHtml("../../assets/folio/index.json", `<script ${MARKER}></script>`))
      .toContain(MARKER);
  });

  test("and emits NO mount when the caller passes none — absent is a real state", () => {
    expect(viewerHtml("x.json")).not.toContain(MARKER);
  });

  test("NO BACKTICK reaches the emitted page — `bmr0`, and it caught this author", () => {
    // gen-library-viz's header states the rule; the author of this file broke
    // it there on 2026-09-22 by writing a bean id in backticks inside a
    // comment, and the generator failed to parse. Asserted rather than
    // remembered.
    expect(viewerHtml("x.json")).not.toContain("`");
  });
});

describe("the generated artefacts are the ones declared", () => {
  const page = join(SITE, "cat-harness", "folio", "index.html");
  const data = join(SITE, "assets", "folio", "index.json");

  test("both exist — run `bun run folio:viz` if not", () => {
    expect(existsSync(page), `${page} missing`).toBe(true);
    expect(existsSync(data), `${data} missing`).toBe(true);
  });

  test("the declaration's `visualiser` points at the page that exists", () => {
    // A declared path that resolves to nothing is `pb04` aimed at a
    // declaration: the coverage reads as met and the link is dead.
    const decl = JSON.parse(readFileSync(join(ROOT, "cat-harness.json"), "utf-8")) as {
      directories: Array<{ id: string; coverage?: Record<string, unknown> }>;
    };
    const folio = decl.directories.find((d) => d.id === "folio");
    expect(folio).toBeDefined();
    const vis = folio!.coverage?.visualiser as string | undefined;
    expect(vis).toBeDefined();
    expect(existsSync(join(REPO, vis!)), `${vis} does not resolve`).toBe(true);
  });

  test("the page really carries the mount, not just the function", () => {
    expect(readFileSync(page, "utf-8")).toContain(MARKER);
  });
});
