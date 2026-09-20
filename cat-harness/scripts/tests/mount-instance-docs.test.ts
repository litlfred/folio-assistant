/**
 * The mount-point resolution rule.
 *
 * Owner, 2026-09-20: *"an instance can also register 'new' sub-pages. name
 * collsion can occur potentially. need resolution rule: walk path to see which
 * instantiated handler wants to process the path then stop."*
 *
 * Asserted against `resolve_` directly rather than through `cpSync`, because a
 * routing rule tested only by copying files is a rule whose failing case
 * nobody writes down — and the failing case is the whole point: two handlers
 * wanting one path must produce a REFUSAL, not a silent overwrite.
 *
 * @module scripts/tests/mount-instance-docs.test
 */
import { describe, expect, it } from "bun:test";

import { resolve_ } from "../mount-instance-docs.js";

const r = (route: string) => ({ route });

describe("the walk stops at the first handler that wants the path", () => {
  it("mounts non-overlapping routes, all of them", () => {
    const { mounts, refused } = resolve_([r("docs/who-iris"), r("library/who-iris")]);
    expect(mounts.map((m) => m.route)).toEqual(["docs/who-iris", "library/who-iris"]);
    expect(refused).toEqual([]);
  });

  it("OUTERMOST wins: a handler at `docs` owns `docs/who-iris`", () => {
    // The direction that matters, and the opposite of longest-prefix routing.
    // A mount point is a claim on a SUBTREE: if a deeper handler could punch
    // through, the outer instance's own index could not be trusted to describe
    // what sits under it.
    const { mounts, refused } = resolve_([r("docs/who-iris"), r("docs")]);
    expect(mounts.map((m) => m.route)).toEqual(["docs"]);
    expect(refused.map((x) => [x.route, x.ownedBy])).toEqual([["docs/who-iris", "docs"]]);
  });

  it("refuses regardless of the order the claims arrive in", () => {
    // Directory-read order varies by filesystem. A collision report that
    // depended on it would be irreproducible, and the two runs would disagree
    // about which instance is at fault.
    const a = resolve_([r("docs"), r("docs/who-iris")]);
    const b = resolve_([r("docs/who-iris"), r("docs")]);
    expect(a.mounts.map((m) => m.route)).toEqual(b.mounts.map((m) => m.route));
    expect(a.refused.map((x) => x.route)).toEqual(b.refused.map((x) => x.route));
  });

  it("an exact duplicate is a collision too, not a harmless re-mount", () => {
    // Two instances declaring the same name is not hypothetical here: #477
    // records TWO silent name collisions in one merge, and `instanceRoots` is
    // keyed on the declared name, so "the stub won" with nothing reported.
    const { mounts, refused } = resolve_([r("docs/who-iris"), r("docs/who-iris")]);
    expect(mounts).toHaveLength(1);
    expect(refused.map((x) => [x.route, x.ownedBy])).toEqual([["docs/who-iris", "docs/who-iris"]]);
  });

  it("a shared PREFIX that is not a path segment is not a collision", () => {
    // `docs/who-iris` must not be treated as owning `docs/who-iris-extra`.
    // A naive `startsWith` says it does, and the site would then refuse a
    // perfectly distinct instance on a string coincidence.
    const { mounts, refused } = resolve_([r("docs/who-iris"), r("docs/who-iris-extra")]);
    expect(mounts.map((m) => m.route)).toEqual(["docs/who-iris", "docs/who-iris-extra"]);
    expect(refused).toEqual([]);
  });

  it("owns the whole subtree, not just the next segment down", () => {
    const { mounts, refused } = resolve_([r("library"), r("library/who-iris/items/x")]);
    expect(mounts.map((m) => m.route)).toEqual(["library"]);
    expect(refused.map((x) => x.ownedBy)).toEqual(["library"]);
  });

  it("a refused claim is carried out with its owner named, never dropped", () => {
    // The property that makes the non-zero exit actionable: a report saying
    // "something collided" and not WITH WHAT is a report somebody switches off.
    const { refused } = resolve_([r("docs"), r("docs/a"), r("docs/b")]);
    expect(refused).toHaveLength(2);
    for (const x of refused) expect(x.ownedBy).toBe("docs");
  });

  it("returns every claim exactly once, across the two lists", () => {
    // The partition property. Without it a claim could go missing from both
    // and the site would be short a page with nothing saying so.
    const claims = [r("docs"), r("docs/a"), r("library/x"), r("library"), r("uploads/y")];
    const { mounts, refused } = resolve_(claims);
    expect([...mounts, ...refused]).toHaveLength(claims.length);
    expect(new Set([...mounts, ...refused].map((x) => x.route)).size).toBe(claims.length);
    // And the split is the one the rule dictates: `docs` and `library` each
    // swallow their child, `uploads/y` stands alone.
    expect(mounts.map((m) => m.route).sort()).toEqual(["docs", "library", "uploads/y"]);
    expect(refused.map((x) => x.route).sort()).toEqual(["docs/a", "library/x"]);
  });
});
