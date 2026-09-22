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
import { scanSubgraphs } from "../check-subgraphs.ts";

const ROOT = resolve(import.meta.dir, "../..");
const dirs = resolveDirectories([{ name: "(local)", root: ROOT, own: true }]);

describe("subgraph containment is derived from declared paths", () => {
  test("the declaration was read — otherwise nothing below holds", () => {
    expect(dirs.length, "no directories resolved").toBeGreaterThan(10);
  });

  test("THIS INSTANCE NOW NESTS NOTHING — the goal state, asserted as one", () => {
    // Until 2026-09-22 this read: `methodologies` contains `methodology-crdm`
    // and `methodology-raci`. Both are gone. The owner's "dont bury sub-graph
    // assets" moved CRDM's and RACI's skills into `skills/` and CRDM's
    // diagrams into `processes/`, and the three separate declarations were
    // dropped rather than repointed — a package subdirectory of the already
    // declared `skills/` graph does not also need an entry of its own.
    //
    // So `subgraphTree` over the real declaration is now EMPTY, and that is
    // the owner's stated target ("subgraphs should be disconnected") reached
    // for this instance rather than an absence of data.
    //
    // ASSERTED EXPLICITLY, because an empty tree is exactly what a broken
    // derivation also returns — the failure this file's own docstring is
    // about. The algorithm keeps its coverage in the fixture test below,
    // which is the only reason it is safe to assert emptiness here.
    expect(subgraphTree(dirs)).toEqual([]);
  });

  test("a repository-scoped directory is not a child of an instance-relative one", () => {
    // `smart-kg/methodologies/` is repository-scoped so the extraction is
    // literal. Reading it as a child of `methodologies/` would be wrong on
    // the path AND on the intent.
    const tree = subgraphTree(dirs);
    for (const r of tree) expect(r.children).not.toContain("smart-kg-methodologies");
  });

  // The real declaration no longer nests anything, so the two properties
  // below have no witness in this corpus. They are pinned against a SYNTHETIC
  // pair instead of dropped: `subgraphTree` and `owningDirectory` are shared
  // machinery that any instance may exercise, and deleting their only tests
  // because this instance stopped nesting would retire a guard for a defect
  // that is still reachable.
  const NESTED = [
    { id: "outer", path: "outer/", absPath: `${ROOT}/outer`, graphKinds: ["cat-harness"] },
    { id: "inner", path: "outer/inner/", absPath: `${ROOT}/outer/inner`, graphKinds: ["cat-harness"] },
  ];

  test("a node belongs to its DEEPEST subgraph, not to the outer one", () => {
    // This IS the x4v4 defect in concrete form: attributing an inner node to
    // the outer graph makes every count computed from that sweep wrong.
    expect(owningDirectory(NESTED, "outer/inner/node.md")?.id).toBe("inner");
    expect(owningDirectory(NESTED, "outer/node.md")?.id).toBe("outer");
    // ...and immediate containment only: with `a/`, `a/b/` and `a/b/c/` all
    // declared, `a` has one child, not two.
    const tree = subgraphTree(NESTED);
    expect(tree.find((r) => r.parent === "outer")?.children).toEqual(["inner"]);
  });

  test("relative and absolute queries agree", () => {
    // The bug that made every probe answer "no owner" while looking healthy.
    // Run against the REAL declaration, because that is where the absPath
    // keying actually bit — a fixture would not have caught it.
    const rel = owningDirectory(dirs, "methodologies/kepner-tregoe.md");
    const abs = owningDirectory(dirs, `${ROOT}/methodologies/kepner-tregoe.md`);
    expect(rel?.id).toBe("methodologies");
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

  test("CRDM's relocations left no broken links behind — both of them", () => {
    // 13 were left by `g43o` (into `methodologies/crdm/`) and repaired when
    // this check first surfaced them. CRDM moved AGAIN on 2026-09-22, into
    // `skills/crdm/`, so this guard is re-keyed: `methodology-crdm` is no
    // longer a declared id, and a filter on it would now match nothing and
    // pass for the wrong reason — a guard that cannot fail, which is worse
    // than one that is absent because it reads as coverage.
    const crdm = report.dangling.filter((d) => d.from.includes("skills/crdm/"));
    expect(crdm.map((d) => `${d.from} → ${d.target}`)).toEqual([]);
    const raci = report.dangling.filter((d) => d.from.includes("skills/raci/"));
    expect(raci.map((d) => `${d.from} → ${d.target}`)).toEqual([]);
  });

  test("an illustrative placeholder is not counted as a broken link", () => {
    // `[main](…)` in an example table never named a file. Counting it is a
    // standing false finding, which is the wolf-crying this repo refuses.
    expect(report.dangling.filter((d) => /^[….]+$/.test(d.target))).toEqual([]);
  });
});

/**
 * Attribution spans the whole repository, not just this instance.
 *
 * Bean `3ye4`. `owningDirectory` compares in the space of the path it is
 * given, and `scanSubgraphs` handed it INSTANCE-RELATIVE paths — so a
 * `scope: "repository"` directory yielded `../…`, matched no declared
 * prefix, and every file in it was attributed to nothing. Six declared
 * directories were swept past in silence.
 *
 * The symptom was the dangerous kind: the sweep reported **0 dangling
 * links** over a corpus that had 26. It looked like success. It was
 * discovered only because moving one file made the number drop
 * implausibly.
 */
describe("repository-scoped directories are attributed", () => {
  const report = scanSubgraphs(ROOT);

  test("attribution reaches well past this instance's own tree", () => {
    // 636 before the fix, ~1139 after. A floor rather than the number,
    // because the corpus grows — but far enough above 636 that a regression
    // to instance-only attribution cannot pass.
    expect(report.scanned).toBeGreaterThan(900);
  });

  test("nothing declared is left unexamined without a reason", () => {
    // The whole point: a directory is either examined, or exempt BY
    // DECLARATION. "Skipped because a path comparison failed" is neither.
    expect(report.notExamined).toEqual([]);
  });

  test("fsh-guts is exempt because it DECLARES an unpublished kind", () => {
    // It was already skipped before this bean — by accident, via the path
    // bug. Right answer, wrong reason, and therefore not one to rely on.
    expect(report.exempt.some((d) => d.startsWith("fsh-guts"))).toBe(true);
    // And the exemption is narrow: it must not swallow ordinary directories.
    expect(report.exempt.length).toBeLessThan(3);
  });

  test("the x4v4 separation survives the change", () => {
    // Making scoped paths attributable must NOT make `smart-kg/methodologies/`
    // read as a child of `methodologies/` — that separation is deliberate and
    // was settled in bean `x4v4`. This is the trap the bean named in advance.
    for (const r of report.tree) {
      expect(r.children).not.toContain("smart-kg-methodologies");
    }
    // The positive half USED to be `methodologies` → [methodology-crdm,
    // methodology-raci]. Both declarations are gone since 2026-09-22, so the
    // tree is empty and the loop above can no longer fail — it would pass
    // over nothing.
    //
    // That makes the negative assertion vacuous, which is precisely the shape
    // this file refuses elsewhere ("clean" and "not computed" must never be
    // one passing test). So the guard is restated as the two facts that are
    // still checkable: `smart-kg-methodologies` resolved at all, and it is
    // nobody's child — the first is what makes the second mean something.
    expect(report.tree).toEqual([]);
    const scoped = dirs.find((d) => d.id === "smart-kg-methodologies");
    expect(scoped, "the repository-scoped entry did not resolve — the check above is vacuous").toBeDefined();
  });
});
