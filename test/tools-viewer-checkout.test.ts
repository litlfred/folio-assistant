/**
 * `tools-viewer` tests about the WHOLE CHECKOUT, moved here from
 * `cat-harness/scripts/tests/tools-viewer.test.ts` (bean `7zz1`, owner ruling
 * 2026-10-06 "Top-level instance"): each joins every Tool to the skills of
 * every instance in the checkout, which only the checkout holds. Standing
 * alone, cat-harness has none of it, and `check:cat-harness-standalone`
 * collects every test in that layer. The rest of that file's tests stay there;
 * every path here is composed from ORIGIN_DIR, the directory they were written
 * in, so nothing they read changed.
 */
import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { declarationPathIn } from "../cat-harness/schemas/cat-harness.js";
import { docsLayers } from "../cat-harness/scripts/compose-docs.js";
import { docsPages, documentingPages } from "../cat-harness/scripts/docs-declarations.js";
import { page, publishedPage, pageRelPath, skillIds, toolRows } from "../cat-harness/scripts/gen-tools-viz.js";

/** The directory these tests were written in (`cat-harness/scripts/tests/`): every path below is composed from it exactly as it was before the move, so nothing they read changed. */
const ORIGIN_DIR = join(import.meta.dir, "../cat-harness/scripts/tests");

const REPO = resolve(ORIGIN_DIR, "..", "..", "..");
/**
 * The base docs layer — asked, never spelled.
 *
 * It was `join(REPO, "cat-harness", "docs")`, and `site-dir-single-answer`
 * refused it. Rightly: the site root has moved twice (beans `x4a6`, `wggr`),
 * and a test carrying its own copy keeps checking where the site used to be
 * while reporting a pass.
 *
 * Worth noting HOW this reached CI. The pre-push checks that caught the other
 * two failures were named gate scripts, and this guard is a UNIT TEST — so a
 * targeted run of `check:*` scripts skipped it entirely. `bun test` is itself
 * a gate, and a subset of the gate set is not the gate set.
 */
const DOCS = docsLayers(REPO).layers.find((l) => !l.repositoryScoped)!.dir;

const decl = JSON.parse(readFileSync(declarationPathIn(join(REPO, "cat-harness"))!, "utf-8")) as {
  directories?: { id?: string; graphTypologies?: string[]; coverage?: { docs?: string; visualiser?: unknown } }[];
};
const entryFor = (kind: string) => (decl.directories ?? []).find((e) => (e.graphTypologies ?? []).includes(kind));

// Since #1168 B7c the PAGE declares what it documents (`documents:`), so the
// tools graph's page is found by asking the pages, not the directory entry.
const docsPagesFor = (kind: string): string[] => {
  const e = entryFor(kind)!;
  const tracked = Bun.spawnSync(["git", "ls-files", "*.md", "*.html"], { cwd: REPO }).stdout.toString().split("\n").filter(Boolean);
  return documentingPages(
    { instance: "cat-harness", id: e.id ?? "", graphTypologies: e.graphTypologies ?? [] },
    docsPages(REPO, tracked),
    REPO,
    [join(REPO, "cat-harness")],
  );
};

const { tools } = (await import("../cat-harness/tools/index.js")) as { tools: () => unknown[] };
const rows = toolRows(tools());

describe("the tools graph is not documented by the skills page", () => {
  it("has a corpus at all", () => {
    // Vacuity guard — every assertion below is over `rows`.
    expect(rows.length).toBeGreaterThan(0);
  });

  it("declares a docs page", () => {
    expect(docsPagesFor("tools")).toHaveLength(1);
  });

  /**
   * A CHECK THAT IS NOT HERE, AND WHY — so it is not built a third time.
   *
   * While fixing this defect I recorded a hypothesis on bean `yunp`: *"a `docs`
   * page shared by two entries whose graph typologies are disjoint is at least
   * suspicious, and that is computable."* It was written as the weaker,
   * mechanisable form of "is this page about this graph".
   *
   * IT WAS BUILT AND THE CORPUS FALSIFIED IT IMMEDIATELY. Three hits, all
   * legitimate:
   *
   * | page | shared by | why it is fine |
   * |---|---|---|
   * | `beans-and-todos.md` | `beans`, `todos` | one page about both, and its name says so |
   * | `document-ingestion.md` | `uploads`, `library` | the two ends of one process |
   * | `subgraph-viewers.md` | `schemas`, `library` | a page about the viewer mechanism itself |
   *
   * Three of three false positives — and it would not have caught the defect
   * it was written for either, because `skills.md` was never another entry's
   * DECLARED docs. `tools` pointed at a page that merely describes skills.
   *
   * So "disjoint graph typologies" does not imply "unrelated subjects", and a check
   * that fires only on legitimate cases is worse than none: it trains a reader
   * to skip it. The guard that does work is the vocabulary approximation
   * below, which is honest about approximating.
   */

  it("and it resolves", () => {
    const d = docsPagesFor("tools")[0]!;
    expect(existsSync(join(REPO, d))).toBe(true);
  });

  it("and it is about tools — approximated, and the approximation is stated", () => {
    // "Is this page about this subject" is not mechanically decidable. What IS
    // checkable: the page uses the graph's own vocabulary. A page that never
    // says `defineTool` or `satisfies` is not documentation of this graph
    // whatever its title claims, which is the property that failed before.
    const d = docsPagesFor("tools")[0]!;
    const text = readFileSync(join(REPO, d), "utf-8");
    expect(text).toContain("defineTool");
    expect(text).toContain("satisfies");
    expect(text.toLowerCase()).toContain("tool");
  });

  it("the skills page is NOT silently repurposed as the tools page", () => {
    // Guards the fix from being undone by editing skills.md instead: even if
    // somebody added a tools section there, the declaration must still name a
    // page of its own.
    expect(docsPagesFor("tools").some((p) => p.endsWith("skills.md"))).toBe(false);
  });
});

describe("every satisfies names a skill that exists", () => {
  const known = skillIds(REPO);

  it("the skill corpus is non-empty", () => {
    // Without this the join below passes vacuously — the `dh4f` shape, where a
    // probe sweeps nothing and reports a clean run.
    expect(known.size).toBeGreaterThan(0);
  });

  it("no tool advertises a capability the graph cannot locate", () => {
    const refs = [...new Set(rows.flatMap((r) => r.satisfies))];
    expect(refs.length).toBeGreaterThan(0);
    expect(refs.filter((s) => !known.has(s))).toEqual([]);
  });

  it("and every tool says what it satisfies", () => {
    // A different gap from a dangling ref: the tool exists and nothing says
    // what capability it is a way of exercising.
    expect(rows.filter((r) => r.satisfies.length === 0).map((r) => r.id)).toEqual([]);
  });
});

describe("the page reports the join in both directions", () => {
  it("states that all resolve, rather than only warning when they do not", () => {
    // "Nothing unresolved" and "the check did not run" are different facts,
    // and a section that appeared only on failure could not tell them apart.
    const html = page(rows, skillIds(REPO));
    expect(html).toContain("Does every `satisfies` name a skill that exists?");
    expect(html).toMatch(/Yes — all \*\*\d+\*\*/);
  });
});

describe("the generator writes where the declaration says", () => {

  it("and the committed page is current", () => {
    // The gate runs this too; asserting it here means a stale page fails the
    // unit suite rather than only the gate, which is where it is noticed first.
    const rel = pageRelPath(REPO)!;
    expect(readFileSync(join(DOCS, rel), "utf-8")).toBe(publishedPage(rows, skillIds(REPO)));
  });
});
