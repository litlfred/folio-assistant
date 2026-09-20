/**
 * The skill overlay reads declarations and keeps every instance's contribution.
 *
 * @module schemas/skill-overlay.test
 *
 * **These need a synthetic fixture and that is the point.** This repository
 * declares no dependencies, so every assertion here would pass vacuously
 * against the broken version if it ran on the real tree. A two-instance
 * fixture is the only way to observe the behaviour at all.
 */
import { afterAll, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { ownDirectories, isKgOnlyDirectory, resolveDirectories } from "./cat-harness.js";
import { resolveSkillDirs } from "./harness-config.js";

const roots: string[] = [];
afterAll(() => roots.forEach((r) => rmSync(r, { recursive: true, force: true })));

/** An instance whose knowledge graph sits at `kgPath` — deliberately NOT always "skills". */
function instance(name: string, kgPath: string): string {
  const root = mkdtempSync(join(tmpdir(), `overlay-${name}-`));
  roots.push(root);
  mkdirSync(join(root, kgPath), { recursive: true });
  writeFileSync(
    join(root, "harness.json"),
    JSON.stringify({
      name,
      directories: [{ id: "cat-harness", path: kgPath, graphs: ["cat-harness"] }],
    }),
  );
  return root;
}

function dependsOn(root: string, dep: string, provides?: string[]): void {
  writeFileSync(
    // `root` is a FIXTURE instance root; its config belongs IN it.
    join(root, "harness.config.json"),
    JSON.stringify({
      dependencies: { folioAssistant: [{ name: "dep", path: dep, ...(provides ? { provides } : {}) }] },
    }),
  );
}

describe("the overlay is read from declarations, not from a literal", () => {
  test("a knowledge graph NOT at skills/ is still found", () => {
    // The whole reason the old `join(root, "skills")` was wrong. An instance
    // may declare its kg anywhere; here the id is `cat-harness` and the path
    // is `kg/`, which is exactly the id/path split the declaration absorbs.
    const root = instance("solo", "kg");
    expect(resolveSkillDirs(root)).toEqual([join(root, "kg")]);
  });

  test("a dependency's graph AND the root's both survive — deepest first", () => {
    // The defect `resolveDirectories` would have introduced: it overrides by
    // id, so a dependency and a root both declaring `cat-harness` collapse to
    // the root alone and the dependency's skills vanish silently.
    const dep = instance("dep", "skills");
    const root = instance("root", "skills");
    dependsOn(root, dep);

    expect(resolveSkillDirs(root)).toEqual([join(dep, "skills"), join(root, "skills")]);
  });

  test("resolveDirectories WOULD have collapsed them — this is why it is not used", () => {
    // Pinning the reason, not just the behaviour. If someone later "simplifies"
    // resolveSkillDirs to use resolveDirectories, the test above goes red and
    // this one says what they broke.
    const dep = instance("dep2", "skills");
    const root = instance("root2", "skills");
    const collapsed = resolveDirectories([
      { name: "dep", root: dep },
      { name: "(root)", root, own: true },
    ]).filter(isKgOnlyDirectory);

    expect(collapsed).toHaveLength(1);
    expect(collapsed[0]!.absPath).toBe(join(root, "skills"));
  });

  test("`provides` without 'skills' opts a dependency out", () => {
    // The only way to depend on another instance for content or translations
    // without inheriting its skills.
    const dep = instance("dep3", "skills");
    const root = instance("root3", "skills");
    dependsOn(root, dep, ["content"]);

    expect(resolveSkillDirs(root)).toEqual([join(root, "skills")]);
  });

  test("a directory declared but absent is not returned", () => {
    // `AGENTS.md`: a declared-but-absent directory is the `dh4f` defect, where
    // a consumer scans nothing and reports a clean run over it.
    const root = mkdtempSync(join(tmpdir(), "overlay-absent-"));
    roots.push(root);
    writeFileSync(
      join(root, "harness.json"),
      JSON.stringify({
        name: "absent",
        directories: [{ id: "cat-harness", path: "nope", graphs: ["cat-harness"] }],
      }),
    );
    expect(resolveSkillDirs(root)).toEqual([]);
  });

  test("an UNDECLARED instance still falls back to the conventions", () => {
    // A regression I introduced and the existing suite caught: the first
    // version returned [] for an instance with no `harness.json`, which
    // silently dropped every unmigrated dependency's skills.
    //
    // `AGENTS.md`: "Absent declaration is fine — an unmigrated instance falls
    // back to today's conventions." Reading a declaration is the improvement;
    // REQUIRING one would be a breaking change wearing its clothes.
    const root = mkdtempSync(join(tmpdir(), "overlay-undeclared-"));
    roots.push(root);
    mkdirSync(join(root, "skills"), { recursive: true });

    expect(resolveSkillDirs(root)).toEqual([join(root, "skills")]);
    expect(ownDirectories({ name: "x", root }).map((d) => d.declaredBy)).toContain("(default)");
  });

  test("an undeclared instance with NO conventional directory yields nothing", () => {
    // Existence-filtered: a default that is not there is the `dh4f` defect,
    // where a consumer scans nothing and reports a clean run over it.
    const root = mkdtempSync(join(tmpdir(), "overlay-bare-"));
    roots.push(root);
    expect(resolveSkillDirs(root)).toEqual([]);
  });

  test("a directory holding more than the kg is excluded", () => {
    // `schemas/` declares ["schemas", "cat-harness"]: its .md files are
    // READMEs, so including it put 150 skills where the corpus has 149.
    const root = mkdtempSync(join(tmpdir(), "overlay-mixed-"));
    roots.push(root);
    mkdirSync(join(root, "schemas"), { recursive: true });
    writeFileSync(
      join(root, "harness.json"),
      JSON.stringify({
        name: "mixed",
        directories: [{ id: "schemas", path: "schemas", graphs: ["schemas", "cat-harness"] }],
      }),
    );
    expect(resolveSkillDirs(root)).toEqual([]);
  });
});

describe("a REPOSITORY-scoped directory resolves against the repository", () => {
  /**
   * An instance nested one level inside a checkout, declaring a kg directory
   * that lives BESIDE it rather than inside it — the `bootstrap/skills/` shape,
   * as a fixture, because the real tree has exactly one instance of it and an
   * assertion against the real tree would pin today's layout rather than the
   * rule.
   */
  function nested(kgPath: string, scope?: "repository"): { repo: string; inst: string } {
    const repo = mkdtempSync(join(tmpdir(), "overlay-scoped-"));
    roots.push(repo);
    const inst = join(repo, "inst");
    mkdirSync(join(repo, kgPath), { recursive: true });
    mkdirSync(inst, { recursive: true });
    writeFileSync(
      join(inst, "harness.json"),
      JSON.stringify({
        name: "inst",
        directories: [{ id: "cat-harness", path: kgPath, graphs: ["cat-harness"], ...(scope ? { scope } : {}) }],
      }),
    );
    return { repo, inst };
  }

  test("ownDirectories resolves `scope: repository` one level out", () => {
    // The defect this suite exists for. `ownDirectories` composed
    // `resolve(link.root, dir.path)` and never called `rootForScope`, so a
    // repository-scoped entry pointed INSIDE the instance — at a directory
    // that is not there. Nothing threw: `resolveSkillDirs` existence-filters,
    // so the graph was dropped and the run reported clean over it. That is
    // `dh4f`, and in the real tree it is why `skill_fetch` answered "package
    // not found" for every skill in `bootstrap/skills/` while the declaration
    // naming them was present and correct.
    const { repo, inst } = nested("sibling", "repository");
    const dirs = ownDirectories({ name: "inst", root: inst, own: true });
    expect(dirs.map((d) => d.absPath)).toEqual([join(repo, "sibling")]);
    expect(resolveSkillDirs(inst)).toEqual([join(repo, "sibling")]);
  });

  test("...and WITHOUT the scope the same declaration resolves inside", () => {
    // The other half of the measurement: the fix must not relocate an entry
    // that never asked to be relocated. Same fixture, same path, no `scope` —
    // and the directory it names is not there, so nothing is returned.
    const { inst } = nested("sibling");
    expect(ownDirectories({ name: "inst", root: inst, own: true }).map((d) => d.absPath)).toEqual([
      join(inst, "sibling"),
    ]);
    expect(resolveSkillDirs(inst)).toEqual([]);
  });

  test("a DEPENDENCY's repository-scoped entry is not inherited", () => {
    // `resolveDirectories` already refused this and said why: a dependency's
    // repository is a different checkout, so inheriting its entry points every
    // consumer at somebody else's store. Honouring the scope in
    // `ownDirectories` without honouring the refusal would have reached into
    // the dependency's checkout for the first time.
    const { repo, inst } = nested("sibling", "repository");
    const root = instance("scoped-root", "skills");
    writeFileSync(
      join(root, "harness.config.json"),
      JSON.stringify({ dependencies: { folioAssistant: [{ name: "dep", path: inst }] } }),
    );
    expect(resolveSkillDirs(root)).toEqual([join(root, "skills")]);
    expect(resolveSkillDirs(root)).not.toContain(join(repo, "sibling"));
  });
});
