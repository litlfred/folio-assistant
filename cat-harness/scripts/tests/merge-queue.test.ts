/**
 * The overlap PARTITION — four kinds of collision, and a train is the right
 * answer to exactly one of them.
 *
 * @module scripts/tests/merge-queue
 *
 * Bean `hfag`. `merge:overlap` measured the gap on 2026-10-02 across all 36
 * open PRs (459 pairs): **#1907 × #1909 have `authored_overlap = 0` yet
 * `independent: false`**, because they collide only on generated regions and
 * on a shared declaration. A steward that reads those two cases alike builds
 * trains nobody needed.
 *
 * The property under test is not "it returns a string" — it is that **four
 * kinds stay four kinds**, and in particular that the two cheap kinds
 * (`generated-only`, `shared-declaration`) never render as the expensive one.
 * The order matters too, and it is tested rather than assumed: a PR holding
 * both an authored collision and a generated one is `authored`, because
 * regeneration cannot resolve the authored half.
 */
import { describe, expect, test } from "bun:test";

import { deriveFacts, isSharedDeclaration, type FactContext, type LivePr } from "../merge-queue.js";

/** A PR with just enough shape to derive facts from. */
const pr = (n: number, files: string[]): LivePr => ({
  pr: n,
  files,
  additions: 1,
  deletions: 0,
  beans: [],
  labels: [],
});

const ctx: FactContext = { parentOf: () => undefined, refused: new Set() };

/** `overlapKind` for each PR, by number. */
const kinds = (prs: LivePr[], c: FactContext = ctx) =>
  new Map(deriveFacts(prs, c).map((f) => [f.pr, f.overlapKind]));

// An authored, non-declaration path: `refuse` strategy, not a shared
// declaration. Measured 2026-10-02 — this is the only kind a train is for.
const AUTHORED = "cat-harness/skills/sdlc/sdlc-core/merge-queue.md";
// `refuse` AND a shared declaration, which is why the partition needs four
// values rather than three.
const DECLARATION = "package.json";
// Resolved by a declared pattern, so invisible to `authoredPaths`.
const GENERATED = "beans/README.md";

describe("the premises the partition rests on", () => {
  test("a shared declaration is a SUBSET of an authored path, not a sibling", () => {
    // If this ever flips, `shared-declaration` collapses into `generated-only`
    // and the four-value partition is the wrong shape rather than merely stale.
    expect(isSharedDeclaration(DECLARATION)).toBe(true);
    expect(isSharedDeclaration(AUTHORED)).toBe(false);
  });
});

describe("deriveFacts — overlapKind", () => {
  test("no shared path at all is `none`", () => {
    const k = kinds([pr(1, [AUTHORED]), pr(2, ["cat-harness/skills/ui/ui-core/board-windows.md"])]);
    expect(k.get(1)).toBe("none");
    expect(k.get(2)).toBe("none");
  });

  test("a generated-only collision is `generated-only`, and NOT `none`", () => {
    // The case `authoredPaths` cannot see: it needs a regeneration, so it must
    // not read as "nothing shared".
    const k = kinds([pr(1, [GENERATED]), pr(2, [GENERATED])]);
    expect(k.get(1)).toBe("generated-only");
    expect(k.get(2)).toBe("generated-only");
  });

  test("sharing only a shared declaration is `shared-declaration`, not `authored`", () => {
    // #1907 × #1909. A three-value partition files this under `authored` on
    // the strength of `package.json` alone — the train nobody needed.
    const k = kinds([pr(1907, [DECLARATION, GENERATED]), pr(1909, [DECLARATION, GENERATED])]);
    expect(k.get(1907)).toBe("shared-declaration");
    expect(k.get(1909)).toBe("shared-declaration");
  });

  test("sharing an authored non-declaration path is `authored`", () => {
    const k = kinds([pr(1, [AUTHORED]), pr(2, [AUTHORED])]);
    expect(k.get(1)).toBe("authored");
    expect(k.get(2)).toBe("authored");
  });

  test("`authored` outranks both cheaper kinds when they hold together", () => {
    // Order is a claim about which remedy is insufficient, so it is tested.
    const k = kinds([
      pr(1, [AUTHORED, DECLARATION, GENERATED]),
      pr(2, [AUTHORED, DECLARATION, GENERATED]),
    ]);
    expect(k.get(1)).toBe("authored");
  });

  test("a REFUSED member cannot be the other side of a collision", () => {
    // A refused PR never enters a train, so it cannot conflict in one.
    const prs = [pr(1, [AUTHORED]), pr(2, [AUTHORED])];
    const k = kinds(prs, { ...ctx, refused: new Set([2]) });
    expect(k.get(1)).toBe("none");
  });

  test("conflictRisk and overlapKind are computed from one pass and cannot disagree", () => {
    const facts = deriveFacts(
      [pr(1, [AUTHORED]), pr(2, [AUTHORED]), pr(3, [GENERATED]), pr(4, [GENERATED])],
      ctx,
    );
    for (const f of facts) {
      const authoredish = f.overlapKind === "authored" || f.overlapKind === "shared-declaration";
      expect(f.conflictRisk === "high").toBe(authoredish);
    }
  });
});
