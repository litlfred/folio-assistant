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
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { compose, docsLayers, treeDigest } from "../compose-docs.ts";

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
  { id: "docs", path: "docs/", dependents: "reproduce", graphs: ["docs"] },
  { id: "root-docs", path: "docs/", scope: "repository", dependents: "skip", graphs: ["docs"] },
  // A non-docs entry, so the filter is doing something rather than happening
  // to match everything.
  { id: "schemas", path: "schemas/", dependents: "skip", graphs: ["schemas"] },
] as const;

const layerDir = (root: string, id: string): string => {
  const e = ENTRIES.find((x) => x.id === id)!;
  return join("scope" in e && e.scope === "repository" ? root : join(root, INSTANCE), e.path);
};

/** A repository with a base layer under the instance and a root overlay. */
function fixture(base: Record<string, string>, overlay: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), "composedocs-"));
  mkdirSync(join(root, INSTANCE), { recursive: true });
  writeFileSync(join(root, INSTANCE, "harness.json"), JSON.stringify({ name: INSTANCE, directories: ENTRIES }));
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
    expect(after.size).toBe(before.size);
    const differing = [...before].filter(([p, h]) => after.get(p) !== h).map(([p]) => p);
    expect(differing).toEqual([]);
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

describe("a Jekyll config is refused rather than shadowed", () => {
  test("the overlay's _config.yml does not replace the base's", () => {
    // Shadowing it would replace every plugin, collection and theme setting
    // while reading in the report as one added page. Two configs want MERGING
    // and the owner has not said with what precedence, so this refuses.
    const root = fixture({ "_config.yml": "title: BASE", "p.md": "x" }, { "_config.yml": "title: OVERLAY" });
    const r = compose(out(root), root);
    expect(Bun.file(join(out(root), "_config.yml")).text()).resolves.toBe("title: BASE");
    expect(r.refused.map((f) => f.path)).toEqual(["_config.yml"]);
    expect(r.overrides).toEqual([]);
    rmSync(root, { recursive: true, force: true });
  });

  test("...but a config only the BASE has is composed normally", () => {
    // The refusal is about shadowing, not about the filename. Without this,
    // a composer that simply dropped every `_config.yml` would pass above and
    // publish a site with no configuration at all.
    const root = fixture({ "_config.yml": "title: BASE" }, {});
    const r = compose(out(root), root);
    expect(Bun.file(join(out(root), "_config.yml")).text()).resolves.toBe("title: BASE");
    expect(r.refused).toEqual([]);
    rmSync(root, { recursive: true, force: true });
  });
});
