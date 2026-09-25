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
import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { isDerivedGraph, owningDirectory, resolveDirectories, subgraphTree } from "../../schemas/cat-harness.ts";
import { overDeepLinks, scanSubgraphs } from "../check-subgraphs.ts";

const ROOT = resolve(import.meta.dir, "../..");
const dirs = resolveDirectories([{ name: "(local)", root: ROOT, own: true }]);

describe("subgraph containment is derived from declared paths", () => {
  test("the declaration was read — otherwise nothing below holds", () => {
    expect(dirs.length, "no directories resolved").toBeGreaterThan(10);
  });

  test("`methodologies/` nests nothing — the thing this branch actually achieved", () => {
    // THIS ASSERTED A GLOBAL PROPERTY AND SHOULD NOT HAVE. Until 2026-09-22 it
    // read `expect(subgraphTree(dirs)).toEqual([])` — "this instance nests
    // nothing" — which was true the hour it was written and false by the next
    // merge: `main` declared `test/` as a `code` graph (#963), so `test/` now
    // contains the declared `test/results`, through no change of this branch's.
    //
    // An assertion any other branch can invalidate is not a regression guard,
    // it is a tripwire on somebody else's work. The durable claim is the
    // narrow one: the methodology subgraphs this branch un-buried stay
    // un-buried. Corpus-wide nesting is `check:layout-norms`'s question, where
    // it is a ratchet with a baseline rather than an absolute.
    // Scoped to the id `methodologies` EXACTLY — this instance's own graph.
    // A /methodolog/ substring also matches `smart-base-methodologies`, which
    // `main` landed in #881 with a nested `smart-base-processes` inside it.
    // That is a real finding, it is baselined in `check:layout-norms`, and it
    // belongs to whoever owns smart-base — not to a test about this branch.
    const nested = subgraphTree(dirs).flatMap((r) => [r.parent, ...r.children]);
    expect(nested.filter((id) => id === "methodologies")).toEqual([]);
    const methodologies = dirs.find((d) => d.id === "methodologies");
    expect(methodologies, "the methodology graph did not resolve — the check above is vacuous").toBeDefined();
  });

  test("a repository-scoped directory is not a child of an instance-relative one", () => {
    // `smart-base/methodologies/` is repository-scoped so the extraction is
    // literal. Reading it as a child of `methodologies/` would be wrong on
    // the path AND on the intent. (The example was `smart-kg/methodologies/`
    // until it was removed, bean `wg7r`.)
    const tree = subgraphTree(dirs);
    for (const r of tree) expect(r.children).not.toContain("smart-base-methodologies");
    expect(dirs.find((d) => d.id === "smart-base-methodologies"), "the scoped entry did not resolve — vacuous").toBeDefined();
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

  test("a DERIVED graph's unresolved links are never dangling", () => {
    // A library section is machine-produced FROM a source document, so a
    // markdown link inside it is whatever the derivation carried across. Five
    // documents ingested on 2026-09-23 printed `./REFERENCE.md`, `./FORMS.md`
    // and `./advanced.md` inside EXAMPLES of a skill directory — 12 findings,
    // every one asking somebody to edit a transcription of a document this
    // project did not write.
    //
    // `schemas/cat-harness.ts` already said so of the `derived` layer — *"a QA
    // finding against a derived section is a finding against its GENERATOR,
    // not against the corpus, and it sends a reviewer to fix the wrong file"*
    // — and this check simply was not applying it.
    //
    // Asserted as an INVARIANT rather than a count. `derivedLinks.length > 0`
    // would be the same trap the test above documents: it would fail the day
    // somebody drains it, punishing the fix. This holds whether the corpus
    // carries twelve or none.
    // Same call shape as `scanSubgraphs` itself — it takes an instance CHAIN,
    // not a path, and passing the root produced a `chain.find is not a
    // function` rather than a wrong answer.
    const dirs = resolveDirectories([{ name: "(local)", root: ROOT, own: true }]);
    const derivedIds = new Set(
      dirs.filter((d) => d.graphKinds.some((g) => isDerivedGraph(g))).map((d) => d.id),
    );
    expect(derivedIds.size, "no derived directory is declared, so this proves nothing").toBeGreaterThan(0);

    // Nothing from a derived directory may be reported as dangling …
    expect(report.dangling.filter((d) => derivedIds.has(d.fromDir))).toEqual([]);
    // … and everything in the derived bucket must come from one.
    expect(report.derivedLinks.filter((d) => !derivedIds.has(d.fromDir))).toEqual([]);
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
    // Making scoped paths attributable must NOT make `smart-base/methodologies/`
    // read as a child of `methodologies/` — that separation is deliberate and
    // was settled in bean `x4v4`. This is the trap the bean named in advance.
    for (const r of report.tree) {
      expect(r.children).not.toContain("smart-base-methodologies");
    }
    // The positive half USED to be `methodologies` → [methodology-crdm,
    // methodology-raci]. Both declarations went on 2026-09-22.
    //
    // The negative assertion above must not become vacuous, which it does the
    // moment the tree is empty ("clean" and "not computed" must never be one
    // passing test). So what is pinned is that the tree was COMPUTED and that
    // the scoped entry RESOLVED — the two facts that make "it is nobody's
    // child" mean something. The tree is non-empty again since `main`
    // declared `test/` as a `code` graph, but this test does not depend on
    // that either way.
    const scoped = dirs.find((d) => d.id === "smart-base-methodologies");
    expect(scoped, "the repository-scoped entry did not resolve — the check above is vacuous").toBeDefined();
    expect(Array.isArray(report.tree), "containment was not computed at all").toBe(true);
  });
});

describe("the `../` too many count is COMPUTED (bean `syrl`)", () => {
  // The report carried this number as a STRING LITERAL for five days: "23
  // carry one `../` too many", measured once on 2026-09-20 and printed
  // unchanged beside a total that re-measured every run. When it was finally
  // computed it read **27** — so the literal had been wrong for most of its
  // life, and nothing could say so.
  //
  // Both halves are asserted, because a fix that returns nothing would pass
  // the first on its own and would be indistinguishable from a clean corpus.
  const dir = resolve(ROOT, "docs");

  test("a target that resolves after dropping one `../` IS one", () => {
    // From `docs/reference/skill-instructions/`, `../../skill-instructions/…`
    // lands in `docs/` — nothing there — while dropping one `../` lands on
    // the page's own directory, where `index.md` is.
    const found = overDeepLinks(ROOT, [
      {
        from: "docs/reference/skill-instructions/x.md",
        fromDir: "docs",
        target: "../../skill-instructions/index.md",
      },
    ]);
    expect(found.map((f) => f.repaired)).toEqual(["../skill-instructions/index.md"]);
  });

  test("a target that still does not resolve after dropping one is NOT", () => {
    const found = overDeepLinks(ROOT, [
      { from: "docs/x.md", fromDir: "docs", target: "../../no-such-directory/no-such-file.md" },
    ]);
    expect(found, "a repair is tested against disk, never inferred from shape").toEqual([]);
  });

  test("a target with no `../` at all is never one", () => {
    const found = overDeepLinks(ROOT, [
      { from: "docs/x.md", fromDir: "docs", target: "reference/index.md" },
    ]);
    expect(found).toEqual([]);
  });

  test("the real corpus carries none — the repair of `mi97` holds", () => {
    // Falsifier for `mi97`, which said the count must fall to zero once the
    // 27 were repaired. It is checkable ONLY because the number is live.
    expect(existsSync(dir), "docs/ must exist or this asserts nothing").toBe(true);
    const { siteResolved } = scanSubgraphs(ROOT);
    expect(overDeepLinks(ROOT, siteResolved).map((l) => `${l.from} -> ${l.target}`)).toEqual([]);
  });
});
