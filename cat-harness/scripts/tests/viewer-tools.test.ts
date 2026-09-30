/**
 * The viewer Tools' `renders` declarations, grounded against the corpus
 * (#1168 B7a, bean `w91p`).
 *
 * Until `coverage.visualiser` is derived from the Tools, both exist, so the
 * two are checked against each other: a directory that declares a viewer and
 * whose kinds no Tool renders is a viewer with no declared renderer, and a
 * rendered kind no directory declares is a claim about nothing.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { instanceRootsIn, declarationPathIn, isPublishedGraphKind } from "../../schemas/cat-harness.js";
import { tools } from "../../tools/index.js";
import { viewerPages } from "../viewer-declarations.js";

const REPO = resolve(import.meta.dir, "..", "..", "..");

interface Dir { id: string; graphKinds?: string[]; coverage?: { visualiser?: unknown } }

const dirs: { instance: string; dir: Dir }[] = [];
for (const root of instanceRootsIn(REPO)) {
  const p = declarationPathIn(root);
  if (!p) continue;
  const decl = JSON.parse(readFileSync(p, "utf-8")) as { directories?: Dir[] };
  for (const dir of decl.directories ?? []) dirs.push({ instance: root, dir });
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
    const declared = new Set(dirs.flatMap(({ dir }) => dir.graphKinds ?? []));
    expect([...rendered].filter((k) => !declared.has(k))).toEqual([]);
  });

  it("no Tool renders an unpublished kind — the Tool graph is published", () => {
    expect([...rendered].filter((k) => !isPublishedGraphKind(k))).toEqual([]);
  });
});
