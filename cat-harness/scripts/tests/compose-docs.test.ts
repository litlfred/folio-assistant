/**
 * `compose-docs.ts` — bean `n0nf`, issue #638, the owner's compose ruling.
 *
 * @module scripts/tests/compose-docs
 * @graphNode none — a test
 *
 * ## The assertion this file exists for
 *
 * **An empty overlay must compose to a byte-identical tree.** `docs-site.yml`
 * publishes the real site, so changing its `source:` changes what readers get.
 * If composing with nothing in the overlay is provably the same bytes as the
 * base alone, wiring the composition in is a no-op until somebody deliberately
 * authors an override — and the risk is bounded to that moment rather than to
 * the commit that rewires the publish path.
 *
 * That property is checked against the REAL tree, not a fixture, because a
 * fixture proves the algorithm and the publish path runs on the real one.
 *
 * ## Everything else is checked on fixtures, and both directions
 *
 * An overlay that silently shadows a page is `dh4f`: a consumer reads the
 * composed tree, sees one file, and cannot tell an override from the only
 * copy. So "it overrode" and "it SAID it overrode" are separate assertions,
 * and a composer that did the first without the second would pass one of them.
 */
import { describe, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import {
  carriedInstances,
  compose,
  docsLayers,
  instanceStub,
  isWithheld,
  mergeConfig,
  treeDigest,
  type ComposedInstance,
} from "../compose-docs.ts";
import {  } from "../../schemas/cat-harness.js";
import { parse as parseYaml } from "yaml";
import { writeDeclaration } from "../../test/support/instance-fixture.js";

const REPO = resolve(import.meta.dir, "..", "..", "..");

/** The instance that owns the base layer in these fixtures. */
const INSTANCE = "cat-harness";
/**
 * The fixture's declared entries, written into `harness.json` AND used to
 * place the directories — one answer, not two.
 *
 * Restating the paths when creating the directories would be a second copy of
 * the site root free to disagree with the declaration, which is the very thing
 * `site-dir-single-answer.test.ts` guards against. The fixture derives them.
 */
const ENTRIES = [
  { id: "docs", path: "docs/", dependents: "reproduce", graphKinds: ["docs"] },
  { id: "root-docs", path: "docs/", scope: "repository", dependents: "skip", graphKinds: ["docs"] },
  // A non-docs entry, so the filter is doing something rather than happening
  // to match everything.
  { id: "schemas", path: "schemas/", dependents: "skip", graphKinds: ["schemas"] },
] as const;

const layerDir = (root: string, id: string): string => {
  const e = ENTRIES.find((x) => x.id === id)!;
  return join("scope" in e && e.scope === "repository" ? root : join(root, INSTANCE), e.path);
};

/** A repository with a base layer under the instance and a root overlay. */
function fixture(base: Record<string, string>, overlay: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), "composedocs-"));
  mkdirSync(join(root, INSTANCE), { recursive: true });
  writeDeclaration(join(root, INSTANCE), JSON.stringify({ name: INSTANCE, directories: ENTRIES }));
  for (const [where, files] of [
    [layerDir(root, "docs"), base],
    [layerDir(root, "root-docs"), overlay],
  ] as const) {
    mkdirSync(where, { recursive: true });
    for (const [rel, body] of Object.entries(files)) {
      mkdirSync(join(where, rel, ".."), { recursive: true });
      writeFileSync(join(where, rel), body);
    }
  }
  return root;
}

const out = (root: string) => join(root, "_composed");

describe("compose-docs reads its layers from the declaration", () => {
  test("base first, overlay last — and the non-docs entry is not a layer", () => {
    const root = fixture({ "a.md": "base" }, {});
    const { layers, missing } = docsLayers(root);
    expect(layers.map((l) => l.id)).toEqual(["docs", "root-docs"]);
    expect(layers.map((l) => l.repositoryScoped)).toEqual([false, true]);
    expect(missing).toEqual([]);
    rmSync(root, { recursive: true, force: true });
  });

  test("a declared layer with NO directory is reported, never silently empty", () => {
    // `dh4f`: the declaration says to look, there is nothing there, and a
    // composer that shrugged would report a clean run over it.
    const root = fixture({ "a.md": "base" }, {});
    rmSync(layerDir(root, "root-docs"), { recursive: true, force: true });
    const { layers, missing } = docsLayers(root);
    expect(layers.map((l) => l.id)).toEqual(["docs"]);
    expect(missing.map((l) => l.id)).toEqual(["root-docs"]);
    rmSync(root, { recursive: true, force: true });
  });

  test("the REAL repository declares exactly the two layers this is built on", () => {
    // Vacuity guard: every fixture test below would pass against a repository
    // that had no layers at all.
    const { layers, missing } = docsLayers(REPO);
    expect(missing).toEqual([]);
    expect(layers.map((l) => l.id)).toEqual(["docs", "root-docs"]);
  });
});

describe("an EMPTY overlay composes byte-identically — the safety property", () => {
  test("on the real tree, every file and every byte matches the base", () => {
    // The one that licenses rewiring `docs-site.yml`. Checked on the real tree
    // rather than a fixture, because that is what the publish path builds.
    const { layers } = docsLayers(REPO);
    const base = layers.find((l) => !l.repositoryScoped)!;

    const dest = join(mkdtempSync(join(tmpdir(), "composereal-")), "site");
    const report = compose(dest, REPO);

    // ...and it actually composed something. A byte-identity assertion over
    // two empty trees is satisfied by a composer that does nothing.
    expect(Object.keys(report.suppliedBy).length).toBeGreaterThan(100);
    expect(report.overrides).toEqual([]);

    const before = treeDigest(base.dir);
    const after = treeDigest(dest);

    // THE PROPERTY IS "COMPOSITION NEVER CHANGES A BASE FILE", not "the tree
    // has the same number of files in it". Those were the same assertion until
    // instances could be composed (`jut3`), and the size check is the half
    // that stopped being true: `smart-trust/docs/` now lands under
    // `smart-trust/`, so the composed tree is base PLUS that.
    //
    // Weakening it to "the base files match" alone would license a composer
    // that scattered files anywhere, so the additions are checked too: every
    // path the composed tree adds must sit under a composed instance's own
    // prefix. That is strictly stronger than the count it replaces, which
    // said nothing about WHERE a new file could appear.
    // WITHHELD PATHS ARE ABSENT ON PURPOSE, so the property is stated against
    // the base MINUS them rather than against the base. Added 2026-09-21 with
    // `publish: "staging-only"`.
    //
    // This is the one weakening in this file that had to be argued rather than
    // just made. The property licenses pointing `docs-site.yml`'s `source:` at
    // the composed tree, and it did so by saying composition changes NOTHING.
    // A canonical compose now deliberately omits a page, so that sentence is
    // no longer true as written.
    //
    // What replaces it is not "nothing changes except what changed" — that
    // would license anything. It is two separate claims, and the second is why
    // this is still a safety property:
    //
    //   1. every base file that is NOT withheld is byte-identical, and
    //   2. the withheld set is exactly what the declarations asked for,
    //      which `staging-only-publish.test.ts` asserts against the real
    //      declaration (`["fsh-guts/"]`) rather than against whatever the
    //      composer happened to drop.
    //
    // Without (2) this assertion would pass for a composer that silently lost
    // files, since it would simply report them as withheld. The two tests are
    // load-bearing together and neither is sufficient alone.
    const withheld = report.withheld;
    const differing = [...before]
      .filter(([p]) => !isWithheld(p, withheld))
      .filter(([p, h]) => after.get(p) !== h)
      .map(([p]) => p);
    expect(differing).toEqual([]);

    // And the omissions are ONLY the withheld ones — a base file missing for
    // any other reason is the failure this property exists to catch.
    const missingFromComposed = [...before.keys()].filter((p) => !after.has(p));
    expect(missingFromComposed.sort()).toEqual([...withheld].sort());

    const prefixes = report.composed.map((c) => `${c.under}/`);
    const strays = [...after.keys()].filter(
      (p) => !before.has(p) && !prefixes.some((pre) => p.startsWith(pre)),
    );
    expect(strays).toEqual([]);

    // ...and the composition actually happened. Both checks above are
    // satisfied by a composer that emitted nothing: no base file differs and
    // there are no strays if there are no new files at all. The line this
    // replaces read `expect(after.size).toBe(before.size + (after.size -
    // before.size))`, which is an identity and guarded nothing — the same
    // defect as a test that restates the expression it checks.
    expect(report.composed.length).toBeGreaterThan(0);
    const added = [...after.keys()].filter((p) => !before.has(p));
    expect(added.length).toBeGreaterThan(0);
    rmSync(join(dest, ".."), { recursive: true, force: true });
  });

  test("the overlay's own dotfile does NOT become a published page", () => {
    // `docs/.gitkeep` carries the overlay's documentation. Jekyll ignores
    // dotfiles and so must this, or the byte-identity above would be false the
    // moment somebody explained what the directory is for.
    const root = fixture({ "a.md": "base" }, { ".gitkeep": "# notes", ".hidden/x.md": "no" });
    const r = compose(out(root), root);
    expect(Object.keys(r.suppliedBy)).toEqual(["a.md"]);
    expect(existsSync(join(out(root), ".gitkeep"))).toBe(false);
    rmSync(root, { recursive: true, force: true });
  });
});

describe("an override is applied AND reported", () => {
  test("the overlay's bytes win", () => {
    const root = fixture({ "p.md": "BASE", "keep.md": "untouched" }, { "p.md": "OVERLAY" });
    compose(out(root), root);
    expect(Bun.file(join(out(root), "p.md")).text()).resolves.toBe("OVERLAY");
    expect(Bun.file(join(out(root), "keep.md")).text()).resolves.toBe("untouched");
    rmSync(root, { recursive: true, force: true });
  });

  test("...and BOTH layers are named, which is the ruling's actual requirement", () => {
    // Doing it silently is `dh4f`: one file in the tree, and no way to tell an
    // override from the only copy. A composer that overrode correctly and said
    // nothing would pass the test above and fail the requirement.
    const root = fixture({ "p.md": "BASE" }, { "p.md": "OVERLAY" });
    const r = compose(out(root), root);
    expect(r.overrides).toEqual([{ path: "p.md", baseLayer: "docs", by: "root-docs" }]);
    rmSync(root, { recursive: true, force: true });
  });

  test("a path only the overlay has is ADDED, not an override", () => {
    // Two different facts. Collapsing them would make "how many pages does the
    // root change" unanswerable from the report.
    const root = fixture({ "p.md": "BASE" }, { "new.md": "ONLY HERE" });
    const r = compose(out(root), root);
    expect(r.overrides).toEqual([]);
    expect(r.added).toEqual(["new.md"]);
    expect(r.suppliedBy["new.md"]).toBe("root-docs");
    expect(r.suppliedBy["p.md"]).toBe("docs");
    rmSync(root, { recursive: true, force: true });
  });

  test("nested paths override at the right path, not by basename", () => {
    const root = fixture(
      { "guides/a.md": "BASE A", "b.md": "BASE B" },
      { "guides/a.md": "OVERLAY A" },
    );
    const r = compose(out(root), root);
    expect(r.overrides.map((o) => o.path)).toEqual(["guides/a.md"]);
    expect(Bun.file(join(out(root), "b.md")).text()).resolves.toBe("BASE B");
    rmSync(root, { recursive: true, force: true });
  });
});

describe("a Jekyll config is MERGED, overlay keys winning", () => {
  test("the overlay's keys win and the base's survive", () => {
    // The owner's rule, 2026-09-21. Shadowing would have dropped `plugins`
    // entirely while reading in the report as one added page.
    const root = fixture(
      { "_config.yml": "title: BASE\nplugins:\n  - jekyll-feed\n" },
      { "_config.yml": "title: OVERLAY\n" },
    );
    const r = compose(out(root), root);
    const cfg = parseYaml(readFileSync(join(out(root), "_config.yml"), "utf-8"));
    expect(cfg.title).toBe("OVERLAY");
    expect(cfg.plugins).toEqual(["jekyll-feed"]);
    expect(r.overrides).toEqual([]);
    expect(r.added).toEqual([]);
    rmSync(root, { recursive: true, force: true });
  });

  test("...and the CHANGED KEYS are named, not counted", () => {
    // `dh4f` again: "merged 1 file" leaves a reader unable to tell which
    // settings the overlay moved, which is the whole question it raises.
    const root = fixture(
      { "_config.yml": "title: BASE\ncolor: red\n" },
      { "_config.yml": "title: OVERLAY\n" },
    );
    const r = compose(out(root), root);
    expect(r.merged).toEqual([
      { path: "_config.yml", baseLayer: "docs", by: "root-docs", keys: ["title"] },
    ]);
    rmSync(root, { recursive: true, force: true });
  });

  test("a config only the BASE has passes through with its BYTES untouched", () => {
    // The property the conditional merge exists for. A YAML round trip strips
    // comments and may reorder keys, so merging unconditionally would rewrite
    // the published config on a tree whose overlay carries none — and that is
    // exactly the live publish path today.
    const body = "# a comment the round trip would eat\ntitle: BASE\nplugins:\n  - jekyll-feed\n";
    const root = fixture({ "_config.yml": body }, {});
    const r = compose(out(root), root);
    expect(readFileSync(join(out(root), "_config.yml"), "utf-8")).toBe(body);
    expect(r.merged).toEqual([]);
    rmSync(root, { recursive: true, force: true });
  });
});

describe("the merge rule itself", () => {
  test("objects merge RECURSIVELY — one token does not drop the theme", () => {
    const { merged } = mergeConfig(
      { theme: { color: "red", font: "serif" } },
      { theme: { color: "blue" } },
    );
    expect(merged).toEqual({ theme: { color: "blue", font: "serif" } });
  });

  test("lists REPLACE rather than concatenate", () => {
    // The clause worth a test of its own, because concatenation is the more
    // common default. Concatenating leaves an overlay no way to REMOVE an
    // inherited entry, which is the same reason the file overlay is last-wins.
    const { merged } = mergeConfig({ nav: ["a", "b", "c"] }, { nav: ["a"] });
    expect(merged).toEqual({ nav: ["a"] });
  });

  test("a nested change is reported by its DOTTED path", () => {
    const { changed } = mergeConfig(
      { theme: { color: "red", font: "serif" }, title: "x" },
      { theme: { color: "blue" } },
    );
    expect(changed).toEqual(["theme.color"]);
  });

  test("an overlay may deliberately null a key out", () => {
    // `null` is a value, not an absence. Treating it as "unset" would make a
    // key impossible to clear from an overlay.
    const { merged, changed } = mergeConfig({ analytics: "UA-1" }, { analytics: null });
    expect(merged).toEqual({ analytics: null });
    expect(changed).toEqual(["analytics"]);
  });

  test("a key only the base has is untouched", () => {
    const { merged, changed } = mergeConfig({ a: 1, b: 2 }, { a: 9 });
    expect(merged).toEqual({ a: 9, b: 2 });
    expect(changed).toEqual(["a"]);
  });
});

/**
 * Bean `ga8a` — a composed instance is carried only when the branch touches it.
 *
 * `tebu` cut `reference/` and `api/` from a preview whose branch cannot have
 * changed them. This is the same cut one directory over, and by 2026-09-23 the
 * bigger one: measured across `origin/gh-pages`, `smart-trust/` was **776.6 MB
 * over 13 previews, 37 % of a 2.10 GB `STAGING/` tree**, against `reference/`'s
 * 464.7 MB — because `smart-trust/docs/` is 3.2 MB of markdown that Jekyll
 * inflates to 111.6 MB of themed HTML across 681 pages.
 *
 * ## What is asserted
 *
 * **The decision, not the size.** A test that pinned megabytes would fail every
 * time somebody added a page, and the number it guarded would be this repo's
 * own `dh4f` shape: a figure in a test rather than a measurement. The saving is
 * measured against the real tree below as a RATIO with a floor, which fails if
 * the cut stops working and survives the corpus growing.
 *
 * **Both directions of the doubt rule.** "No list" and "an empty list" are
 * different facts — one is a failed lookup, the other a determined zero — and
 * conflating them is exactly the failure this family of bugs keeps making.
 */
describe("carriedInstances — what a preview must carry (bean `ga8a`)", () => {
  /** A composed instance shaped like the real one, without touching disk. */
  const inst = (root: string, under = root): ComposedInstance => ({
    instance: under,
    dir: `/nowhere/${root}/docs`,
    under,
    root,
  });

  test("NO list carries everything — any doubt keeps the pages under review", () => {
    // The asymmetry that decides the default: a preview that is too big is a
    // threshold finding somebody reads; a preview missing the pages under
    // review is a reviewer misled.
    const d = carriedInstances([inst("smart-trust"), inst("who-iris")], undefined);
    expect(d.map((x) => x.carry)).toEqual([true, true]);
    for (const x of d) expect(x.why).toContain("no readable file list");
  });

  test("an EMPTY list is a determined zero, and it stubs", () => {
    // A pull request that genuinely changes nothing touches no instance. If
    // this fell through to "carry everything", the flag would be unable to
    // distinguish a failed API call from a real answer — the `dh4f` shape.
    const d = carriedInstances([inst("smart-trust")], []);
    expect(d[0]!.carry).toBe(false);
  });

  test("a file under the instance carries it, and the reason NAMES that file", () => {
    // Named rather than counted: a build log saying "carried" without saying
    // what triggered it leaves nobody able to check the predicate.
    const d = carriedInstances([inst("smart-trust")], [
      "cat-harness/docs/index.md",
      "smart-trust/fhir-artifact-index/dak/x.json",
    ]);
    expect(d[0]!.carry).toBe(true);
    expect(d[0]!.why).toContain("smart-trust/fhir-artifact-index/dak/x.json");
  });

  test("the predicate is the INSTANCE, not its composed directory", () => {
    // `smart-trust/docs/` is GENERATED from `fhir-artifact-index/` by
    // `scripts/`. A branch that changes the generator and regenerates in the
    // same commit must still get the rebuilt pages, so matching `docs/` alone
    // would drop exactly the review that needed them.
    expect(carriedInstances([inst("smart-trust")], ["smart-trust/scripts/gen.ts"])[0]!.carry).toBe(
      true,
    );
  });

  test("a branch touching nothing of the instance's stubs it", () => {
    const d = carriedInstances([inst("smart-trust")], ["cat-harness/schemas/types.ts"]);
    expect(d[0]!.carry).toBe(false);
    expect(d[0]!.why).toContain("smart-trust/");
  });

  test("a SIBLING sharing the name's prefix does not count as a touch", () => {
    // `startsWith("smart-trust")` without the separator would carry the whole
    // IG for a branch that only edited `smart-trust-notes/`. Cheap to get
    // wrong, silent when wrong, and it inflates rather than truncates — so
    // nothing downstream would ever notice.
    expect(
      carriedInstances([inst("smart-trust")], ["smart-trust-notes/readme.md"])[0]!.carry,
    ).toBe(false);
  });

  test("a `./`-prefixed path still matches", () => {
    // Some diff tools spell it that way. A miss here reads as "this branch
    // touches nothing", which is the failure direction that loses pages.
    expect(carriedInstances([inst("smart-trust")], ["./smart-trust/docs/x.md"])[0]!.carry).toBe(
      true,
    );
  });

  test("the match is on the DIRECTORY, not the declaration's name", () => {
    // `under` is what a URL carries; `root` is where the files sit. They
    // coincide today and are free to diverge, and matching the wrong one would
    // fail silently the day somebody renames a declaration.
    const renamed = inst("smart-trust", "WHO SMART Trust");
    expect(carriedInstances([renamed], ["smart-trust/docs/x.md"])[0]!.carry).toBe(true);
    expect(carriedInstances([renamed], ["WHO SMART Trust/x.md"])[0]!.carry).toBe(false);
  });

  test("the stub says where the full copy is — `pb04`", () => {
    // The navbar's harness tiles address `/<instance>/`. Removing the tree
    // outright turns a working link into a 404 a reviewer has to diagnose.
    const s = instanceStub(inst("smart-trust"));
    expect(s).toContain("https://litlfred.github.io/folio-assistant/smart-trust/");
    expect(s).toContain("smart-trust/");
    expect(s.startsWith("---\n")).toBe(true);
  });
});

describe("the cut, on the REAL tree", () => {
  test("every composed instance gets exactly one decision", () => {
    // Reported rather than inferred: a tree quietly missing an instance's
    // pages must be distinguishable from an instance that failed to read.
    const dest = join(mkdtempSync(join(tmpdir(), "composecarry-")), "site");
    const r = compose(dest, REPO, { changedFiles: ["cat-harness/docs/index.md"] });
    expect(r.composed.length).toBeGreaterThan(0);
    expect(r.carried.map((d) => d.instance.under).sort()).toEqual(
      r.composed.map((c) => c.under).sort(),
    );
    rmSync(join(dest, ".."), { recursive: true, force: true });
  });

  test("a branch touching no instance composes MATERIALLY fewer files", () => {
    // The saving, measured rather than projected — bean `ga8a`'s fourth
    // Done-when. Stated as a ratio with a floor rather than as megabytes: a
    // pinned byte count would fail on every added page while saying nothing
    // about whether the cut still fires.
    const a = join(mkdtempSync(join(tmpdir(), "composeall-")), "site");
    const b = join(mkdtempSync(join(tmpdir(), "composecut-")), "site");
    const all = compose(a, REPO);
    const cut = compose(b, REPO, { changedFiles: ["cat-harness/docs/index.md"] });

    const nAll = Object.keys(all.suppliedBy).length;
    const nCut = Object.keys(cut.suppliedBy).length;
    // The cut fired at all, and on something worth cutting. Without the second
    // claim this passes for a composer that dropped a single page.
    expect(cut.carried.some((d) => !d.carry)).toBe(true);
    expect(nCut).toBeLessThan(nAll * 0.75);

    // ...and what remains in place of each stubbed instance is its stub, not a
    // hole. A 404 where a tile links is the `pb04` defect this replaces.
    for (const d of cut.carried.filter((x) => !x.carry)) {
      const stub = join(b, d.instance.under, "index.md");
      expect(existsSync(stub)).toBe(true);
      expect(readFileSync(stub, "utf-8")).toContain("not built into this preview");
    }
    rmSync(join(a, ".."), { recursive: true, force: true });
    rmSync(join(b, ".."), { recursive: true, force: true });
  });

  test("with no list, the real tree carries every instance in full", () => {
    // The canonical publisher passes nothing, so this is the property that
    // keeps `docs-site.yml` unaffected by the flag.
    const dest = join(mkdtempSync(join(tmpdir(), "composefull-")), "site");
    const r = compose(dest, REPO);
    expect(r.carried.every((d) => d.carry)).toBe(true);
    rmSync(join(dest, ".."), { recursive: true, force: true });
  });
});
