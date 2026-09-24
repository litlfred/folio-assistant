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

import { cpSync, existsSync, mkdirSync, mkdtempSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

import { WITHHELD_FILE, resolve_, withRoutes, withheldFilter, withheldPaths } from "../mount-instance-docs.js";

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

describe("both handlers register: the kind's, and the instance's own", () => {
  it("an instance root and its kind route are DISTINCT, so neither refuses the other", () => {
    // Owner, 2026-09-20: "/docs/who-iris/ should be the cat-harness handler
    // default for docs. who-iris themed at /who-iris/." Two handlers, two
    // routes -- the walk never has to choose between them.
    const { mounts, refused } = resolve_([r("docs/who-iris"), r("who-iris")]);
    expect(mounts.map((m) => m.route).sort()).toEqual(["docs/who-iris", "who-iris"]);
    expect(refused).toEqual([]);
  });

  it("but an instance root DOES own its own subtree", () => {
    // `/who-iris/` is a claim on everything beneath it, like any other mount.
    const { mounts, refused } = resolve_([r("who-iris"), r("who-iris/extra")]);
    expect(mounts.map((m) => m.route)).toEqual(["who-iris"]);
    expect(refused.map((x) => x.ownedBy)).toEqual(["who-iris"]);
  });

  it("an instance root does NOT own a same-prefixed sibling instance", () => {
    const { mounts, refused } = resolve_([r("who-iris"), r("who-iris-extra")]);
    expect(mounts).toHaveLength(2);
    expect(refused).toEqual([]);
  });
});

describe("which kind answers at the instance's own route", () => {
  const m = (name: string, kind: string, instanceRoot = false) => ({
    name,
    kind,
    dir: `/repo/${name}/${kind}`,
    instanceRoot,
  });

  it("ONE renderable kind needs no choosing", () => {
    const { candidates, undetermined } = withRoutes([m("who-iris", "docs")]);
    expect(candidates.map((c) => c.route).sort()).toEqual(["docs/who-iris", "who-iris"]);
    expect(undetermined).toEqual([]);
  });

  it("the DECLARED kind takes the root, not the one that sorts first", () => {
    // The defect this field exists for. `docs` sorts before `library`, so the
    // themed root served the documentation — contradicting the ruling that
    // puts the themed replica there. Order is deliberately docs-first here so
    // the test fails if the declaration stops being consulted.
    const { candidates, undetermined } = withRoutes([
      m("who-iris", "docs"),
      m("who-iris", "library", true),
    ]);
    const root = candidates.find((c) => c.route === "who-iris");
    expect(root?.kind).toBe("library");
    expect(undetermined).toEqual([]);
  });

  it("every kind still gets its own route, declared root or not", () => {
    const { candidates } = withRoutes([m("who-iris", "docs"), m("who-iris", "library", true)]);
    expect(candidates.map((c) => c.route).sort()).toEqual([
      "docs/who-iris",
      "library/who-iris",
      "who-iris",
    ]);
  });

  it("the root is emitted ONCE, however many kinds are declared", () => {
    const { candidates } = withRoutes([
      m("who-iris", "docs"),
      m("who-iris", "library", true),
      m("who-iris", "catalogue"),
    ]);
    expect(candidates.filter((c) => c.route === "who-iris")).toHaveLength(1);
  });

  it("several kinds and NONE declared is UNDETERMINED, and still serves something", () => {
    // Could-not-determine is not a choice, and not a crash either: a site has
    // to answer at that URL. The caller reports it rather than letting a
    // silent pick read as a decision.
    const { candidates, undetermined } = withRoutes([m("x", "docs"), m("x", "library")]);
    expect(undetermined).toEqual([{ name: "x", kinds: ["docs", "library"], serving: "docs" }]);
    expect(candidates.filter((c) => c.route === "x")).toHaveLength(1);
  });

  it("one instance being undetermined does not implicate another", () => {
    const { undetermined } = withRoutes([
      m("x", "docs"),
      m("x", "library"),
      m("y", "docs"),
      m("y", "library", true),
    ]);
    expect(undetermined.map((u) => u.name)).toEqual(["x"]);
  });
});

describe("a mounted directory's withheld.json is honoured — bean cw35", () => {
  const tree = () => {
    const d = mkdtempSync(join(tmpdir(), "withheld-"));
    mkdirSync(join(d, "refused", "sections"), { recursive: true });
    mkdirSync(join(d, "kept"), { recursive: true });
    writeFileSync(join(d, "refused", "sections", "p1.md"), "text of a work whose licence refuses redistribution");
    writeFileSync(join(d, "refused-cover.png"), "x");
    writeFileSync(join(d, "refused-covers-are-not-a-prefix.png"), "x");
    writeFileSync(join(d, "kept", "p1.md"), "fine");
    writeFileSync(join(d, "index.html"), "<html></html>");
    return d;
  };

  it("absent → nothing withheld", () => {
    expect(withheldPaths(tree())).toEqual([]);
  });

  it("copies everything EXCEPT the listed paths, and a directory takes its whole subtree", () => {
    const d = tree();
    writeFileSync(
      join(d, WITHHELD_FILE),
      JSON.stringify({ paths: [{ path: "refused/", reason: "copyright refused" }, { path: "refused-cover.png", reason: "copyright refused" }] }),
    );
    const out = mkdtempSync(join(tmpdir(), "site-"));
    cpSync(d, out, { recursive: true, filter: withheldFilter(d, withheldPaths(d)) });
    expect(existsSync(join(out, "refused"))).toBe(false);
    expect(existsSync(join(out, "refused", "sections", "p1.md"))).toBe(false);
    expect(existsSync(join(out, "refused-cover.png"))).toBe(false);
    // a sibling whose NAME merely starts with a withheld path is not withheld
    expect(existsSync(join(out, "refused-covers-are-not-a-prefix.png"))).toBe(true);
    expect(existsSync(join(out, "kept", "p1.md"))).toBe(true);
    expect(existsSync(join(out, "index.html"))).toBe(true);
  });

  it("a withheld.json it cannot read REFUSES to mount — never 'publish everything'", () => {
    const d = tree();
    writeFileSync(join(d, WITHHELD_FILE), "{ not json");
    expect(() => withheldPaths(d)).toThrow(/refusing to mount/);
    writeFileSync(join(d, WITHHELD_FILE), JSON.stringify({ paths: [{ nope: 1 }] }));
    expect(() => withheldPaths(d)).toThrow(/refusing to mount/);
  });
});
