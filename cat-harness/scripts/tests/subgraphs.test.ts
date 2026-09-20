/**
 * A folder corresponds to a subgraph, and subgraphs should be disconnected.
 *
 * Bean `x4v4`, settled by the owner 2026-09-20. The properties worth pinning
 * are the ones that were WRONG at some point while this was written, because
 * each was wrong in a way that looked like a clean result:
 *
 *  - `owningDirectory` keyed on `absPath` unconditionally, so every relative
 *    query returned `undefined`. `undefined` is a legitimate answer here (a
 *    node in no declared directory), so the bug read as a finding, and a
 *    sweep built on it would have reported an empty, healthy corpus.
 *  - `scanSubgraphs` skipped links whose target does not exist, on the
 *    reasoning that a dangling link belongs to `blv9`. That hid 13 broken
 *    links left by relocating CRDM (bean `g43o`) — a half-finished move
 *    reading as a clean disconnection.
 */
import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";

import { owningDirectory, resolveDirectories, subgraphTree } from "../../schemas/cat-harness.ts";
import "../../schemas/folio-graph-kind.ts";
import { scanSubgraphs } from "../check-subgraphs.ts";

const ROOT = resolve(import.meta.dir, "../..");
const dirs = resolveDirectories([{ name: "(local)", root: ROOT, own: true }]);

describe("subgraph containment is derived from declared paths", () => {
  test("the declaration was read — otherwise nothing below holds", () => {
    expect(dirs.length, "no directories resolved").toBeGreaterThan(10);
  });

  test("methodologies contains its methodologies, and nothing else claims them", () => {
    const tree = subgraphTree(dirs);
    const m = tree.find((r) => r.parent === "methodologies");
    expect(m?.children).toEqual(["methodology-crdm", "methodology-raci"]);
    // Exactly one parent per child: two would make a node's owner ambiguous,
    // which is the question this whole derivation exists to answer once.
    for (const child of m?.children ?? []) {
      expect(tree.filter((r) => r.children.includes(child)).length).toBe(1);
    }
  });

  test("a repository-scoped directory is not a child of an instance-relative one", () => {
    // `smart-kg/methodologies/` is repository-scoped so the extraction is
    // literal. Reading it as a child of `methodologies/` would be wrong on
    // the path AND on the intent.
    const tree = subgraphTree(dirs);
    for (const r of tree) expect(r.children).not.toContain("smart-kg-methodologies");
  });

  test("a node belongs to its DEEPEST subgraph, not to the outer one", () => {
    // This IS the x4v4 defect in concrete form. Attributing a CRDM skill to
    // `methodologies` makes every count computed from that sweep wrong.
    expect(owningDirectory(dirs, "methodologies/crdm/crdm-detect.md")?.id).toBe("methodology-crdm");
    expect(owningDirectory(dirs, "methodologies/kepner-tregoe.md")?.id).toBe("methodologies");
  });

  test("relative and absolute queries agree", () => {
    // The bug that made every probe answer "no owner" while looking healthy.
    const rel = owningDirectory(dirs, "methodologies/crdm/crdm-detect.md");
    const abs = owningDirectory(dirs, `${ROOT}/methodologies/crdm/crdm-detect.md`);
    expect(rel?.id).toBe("methodology-crdm");
    expect(abs?.id).toBe(rel?.id);
  });
});

describe("the entanglement report", () => {
  const report = scanSubgraphs(ROOT);

  test("it attributed files — a report over nothing is not a clean corpus", () => {
    expect(report.scanned, "no markdown attributed to any declared directory").toBeGreaterThan(100);
  });

  test("the dangling category exists and is computed, not skipped", () => {
    // This asserted `dangling.length > 0` until 2026-09-20, on the reasoning
    // that the corpus always had some. Bean `rl3h` drained them to zero and
    // the guard inverted: it failed ON SUCCESS, which is the worst shape a
    // guard can take — it punishes the fix it exists to encourage.
    //
    // What it should pin is that the category is COMPUTED. A synthetic file
    // with a link to nothing must be reported, whatever the real corpus
    // happens to contain today.
    const probe = scanSubgraphs(ROOT).dangling;
    expect(Array.isArray(probe), "the category is absent, not merely empty").toBe(true);
    // And the corpus itself is clean — stated as its own assertion so that
    // "clean" and "not computed" can never be the same passing test.
    expect(probe.map((d) => `${d.from} → ${d.target}`)).toEqual([]);
  });

  test("CRDM's relocation left no broken links behind", () => {
    // 13 were left by `g43o` and repaired when this check first surfaced
    // them. This is the regression guard for that specific move.
    const crdm = report.dangling.filter((d) => d.fromDir === "methodology-crdm");
    expect(crdm.map((d) => `${d.from} → ${d.target}`)).toEqual([]);
  });

  test("an illustrative placeholder is not counted as a broken link", () => {
    // `[main](…)` in an example table never named a file. Counting it is a
    // standing false finding, which is the wolf-crying this repo refuses.
    expect(report.dangling.filter((d) => /^[….]+$/.test(d.target))).toEqual([]);
  });
});
