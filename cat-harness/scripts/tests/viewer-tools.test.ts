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
import { join, resolve } from "node:path";

import { instanceRootsIn, declarationPathIn, isPublishedGraphKind } from "../../schemas/cat-harness.js";
import { tools } from "../../tools/index.js";

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

  it("every directory declaring a viewer has a Tool rendering one of its kinds", () => {
    // Kinds whose viewer is not a cat-harness Tool, each for a stated reason:
    // fsh-guts is never published (UNPUBLISHED_GRAPH_KINDS), and `catalogue`
    // and `glossary` are rendered by their own instances' generators
    // (who-iris, folio-assistant-core), which declare no tools graph yet.
    const elsewhere = new Set(["catalogue", "glossary"]);
    const missing = dirs
      .filter(({ dir }) => dir.coverage?.visualiser !== undefined)
      .filter(({ dir }) => (dir.graphKinds ?? []).every((k) => isPublishedGraphKind(k)))
      .filter(({ dir }) => !(dir.graphKinds ?? []).some((k) => rendered.has(k) || elsewhere.has(k)))
      .map(({ instance, dir }) => `${join(instance).split("/").pop()}/${dir.id}`);
    expect(missing).toEqual([]);
  });

  it("every rendered kind is declared by some directory", () => {
    const declared = new Set(dirs.flatMap(({ dir }) => dir.graphKinds ?? []));
    expect([...rendered].filter((k) => !declared.has(k))).toEqual([]);
  });

  it("no Tool renders an unpublished kind — the Tool graph is published", () => {
    expect([...rendered].filter((k) => !isPublishedGraphKind(k))).toEqual([]);
  });
});
