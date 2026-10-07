/**
 * The viewer Tools' `renders` declarations, grounded against the corpus
 * (#1168 B7a, bean `w91p`).
 *
 * Until `coverage.visualiser` is derived from the Tools, both exist, so the
 * two are checked against each other: a directory that declares a viewer and
 * whose kinds no Tool renders is a viewer with no declared renderer, and a
 * rendered kind no directory declares is a claim about nothing.
 *
 * Moved here from `cat-harness/scripts/tests/viewer-tools.test.ts` to the
 * checkout's own test home `test/` (bean `7zz1`, owner ruling 2026-10-06
 * "Top-level instance"): every test in it reads every viewer page and every
 * directory that declares the kind it renders, across the checkout, which only
 * the whole checkout holds. Standing alone, cat-harness has none of it, and
 * `check:cat-harness-standalone` collects every test in that layer. Paths are
 * composed from ORIGIN_DIR, the directory it was written in, so nothing it
 * reads changed.
 */
import { describe, expect, it } from "bun:test";
import { resolve, join } from "node:path";

import { instanceRootsIn, instanceDirectories, isPublishedGraphTypology } from "../cat-harness/schemas/cat-harness.js";
// Every instance's Tools, as `viewer-declarations` reads them: a viewer Tool
// may live in a dependency's `tools` graph (fhir-harness's `ig-pages`), and the
// cat-harness barrel alone would report its pages as naming no renderer.
import { tools } from "../cat-harness/tools/discover.js";
import { viewerPages } from "../cat-harness/scripts/viewer-declarations.js";

/** The directory this test was written in (`cat-harness/scripts/tests/`): every path below is composed from it exactly as it was before the move to the checkout's test home (bean `7zz1`). */
const ORIGIN_DIR = join(import.meta.dir, "../cat-harness/scripts/tests");


const REPO = resolve(ORIGIN_DIR, "..", "..", "..");

interface Dir { id: string; graphTypologies?: string[]; coverage?: { visualiser?: unknown } }

const dirs: { instance: string; dir: Dir }[] = [];
// Own entries AND those declared from within (bean `cmsl`): `voices` is
// declared only from `skills/skills.json` now.
for (const root of instanceRootsIn(REPO)) {
  for (const dir of instanceDirectories(root)) dirs.push({ instance: root, dir });
}

const renderers = tools().filter((t) => (t.renders ?? []).length > 0);
const rendered = new Set(renderers.flatMap((t) => t.renders ?? []));

describe("viewer Tools declare what they render", () => {
  it("there are viewer Tools at all", () => {
    expect(renderers.length).toBeGreaterThan(0);
  });

  it("every viewer page names a Tool that declares what it renders", () => {
    // Since #1168 B7a-2b a directory's viewer is read from the pages, and a
    // page counts only when the Tool it names renders the directory's kind.
    // A page naming no such Tool would silently never be anybody's viewer.
    const tracked = Bun.spawnSync(["git", "ls-files", "*.md", "*.html"], { cwd: REPO })
      .stdout.toString().split("\n").filter(Boolean);
    const pages = viewerPages(REPO, tracked);
    expect(pages.length).toBeGreaterThan(0);
    const ids = new Set(renderers.map((t) => t.id));
    expect(pages.filter((p) => p.renderedBy === undefined || !ids.has(p.renderedBy)).map((p) => p.page)).toEqual([]);
  });

  it("every rendered kind is declared by some directory", () => {
    const declared = new Set(dirs.flatMap(({ dir }) => dir.graphTypologies ?? []));
    expect([...rendered].filter((k) => !declared.has(k))).toEqual([]);
  });

  it("no Tool renders an unpublished kind — the Tool graph is published", () => {
    expect([...rendered].filter((k) => !isPublishedGraphTypology(k))).toEqual([]);
  });
});
