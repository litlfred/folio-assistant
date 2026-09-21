/**
 * Skill packages are discovered from declarations, including a dependency's.
 *
 * @module src/tools/skill-fetch.test
 */
import { describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { LOCAL_PACKAGES, discoverLocalPackages } from "./skill-fetch.js";
import { writeInstanceConfig } from "../../test/support/instance-fixture.js";
import {  } from "../../schemas/cat-harness.js";
import { writeDeclaration } from "../../test/support/instance-fixture.js";

const ROOT = resolve(import.meta.dir, "../..");

/** An instance with a declared kg directory and some package subdirectories. */
function instance(pkgs: Record<string, string>, kgPath = "skills"): string {
  const root = mkdtempSync(join(tmpdir(), "pkgs-"));
  writeDeclaration(root, JSON.stringify({
      name: "t",
      directories: [{ id: "cat-harness", path: kgPath, dependents: "reproduce", graphs: ["cat-harness"] }],
    }));
  for (const [name, body] of Object.entries(pkgs)) {
    mkdirSync(join(root, kgPath, name), { recursive: true });
    writeFileSync(join(root, kgPath, name, "a.md"), body);
  }
  return root;
}

const SKILL = "---\nname: a\nsummary: does a thing\n---\n\n# A\n";
const NOT_A_SKILL = "---\n$schema: agent-memory/v1\n---\n\n# Not a skill\n";

describe("the live table", () => {
  test("every package resolves to a directory that exists", () => {
    // `content-lifecycle` was missing from the hand-written table until
    // 2026-09-18 while 52 `<folio:skill ref>` activities named its skills, so
    // `skill_fetch` answered "package not found" for every step of every
    // content-lifecycle process.
    expect(Object.keys(LOCAL_PACKAGES).length).toBeGreaterThan(0);
    for (const dir of Object.values(LOCAL_PACKAGES)) {
      expect(existsSync(dir)).toBe(true);
    }
  });

  test("the co-located package is DISCOVERED, not hand-written", () => {
    // This test asserted the opposite until 2026-09-19, and the assertion was
    // correct then: `src/skills/` was an undeclared kg directory, so discovery
    // could not see the one skill it holds and `LOCAL_PACKAGES` carried a
    // hand-written exception for it.
    //
    // Bean `osbo` declared it. The exception is gone, and the package now
    // falls out of the declaration like every other — so the old assertion is
    // kept here inverted rather than deleted, because "discovery cannot see
    // it" was a real limitation and this is the record of it ending.
    expect(LOCAL_PACKAGES["cat-harness"]).toBeDefined();
    expect(discoverLocalPackages(ROOT)["cat-harness"]).toBeDefined();
  });

  test("a directly-held kg directory is named after its INSTANCE", () => {
    // There is no subdirectory name to take: `src/skills/` holds
    // `corpus-grep.md` at its root. The declaration's `name` is what the
    // package is, because that is whose skills they are.
    //
    // `cat-harness`, not `folio-assistant`, since 2026-09-20: the owner ruled
    // the three instances distinct, and the harness layer stopped sharing the
    // repository's name. THE TEST'S CLAIM IS UNCHANGED — the package is named
    // after whoever declares the directory — which is why this moved with the
    // declaration rather than being pinned to a string.
    expect(discoverLocalPackages(ROOT)["cat-harness"]).toContain("src/skills");
  });
});

describe("what discovery includes, and what it refuses", () => {
  test("a directory holding a skill is a package", () => {
    const root = instance({ alpha: SKILL });
    expect(Object.keys(discoverLocalPackages(root))).toEqual(["alpha"]);
    rmSync(root, { recursive: true, force: true });
  });

  test("a directory whose .md declares `$schema` is NOT a package", () => {
    // Declaration over location. Taken plainly, a scan of `skills/` adds seven
    // non-package directories, and `memory/` is the one already on record for
    // making `kg-audit` write 25 bogus sidecars against agent-memory nodes
    // that are not instruction bodies.
    const root = instance({ memory: NOT_A_SKILL });
    expect(discoverLocalPackages(root)).toEqual({});
    rmSync(root, { recursive: true, force: true });
  });

  test("a directory with no markdown at all is NOT a package", () => {
    // `skills/remote-packages/` holds two .json manifests and no body.
    const root = instance({});
    mkdirSync(join(root, "skills", "remote-packages"), { recursive: true });
    writeFileSync(join(root, "skills", "remote-packages", "x.json"), "{}");
    expect(discoverLocalPackages(root)).toEqual({});
    rmSync(root, { recursive: true, force: true });
  });

  test("a kg directory NOT at skills/ still yields its packages", () => {
    // The hardcoded `join(root, "skills")` this replaces could not do it.
    const root = instance({ alpha: SKILL }, "kg");
    expect(Object.keys(discoverLocalPackages(root))).toEqual(["alpha"]);
    rmSync(root, { recursive: true, force: true });
  });
});

describe("a dependency's packages are served — the overlay", () => {
  test("a dependency contributes, and the root overrides by name", () => {
    // The point of the exercise: `AGENTS.md` records that a dependency's
    // skills are not reachable today. This is what reachable looks like.
    const dep = instance({ shared: SKILL, "dep-only": SKILL });
    const root = instance({ shared: SKILL });
    // `root` is a FIXTURE instance root; its config belongs IN it, under the
    // name `root` declares. The sweep sent this to the fixture's parent —
    // `/tmp` — and the name half is newer still: there is no global config
    // filename to join on any more.
    writeInstanceConfig(
      root,
      JSON.stringify({ dependencies: { folioAssistant: [{ name: "dep", path: dep }] } }),
    );

    const found = discoverLocalPackages(root);
    expect(Object.keys(found).sort()).toEqual(["dep-only", "shared"]);
    // Root last in overlay order, so the root's `shared` wins.
    expect(found["shared"]).toBe(join(root, "skills", "shared"));
    expect(found["dep-only"]).toBe(join(dep, "skills", "dep-only"));

    rmSync(dep, { recursive: true, force: true });
    rmSync(root, { recursive: true, force: true });
  });
});

describe("a directly-held set is named by ITS instance, not by the caller's root", () => {
  test("two directly-held directories do not collapse onto one name", () => {
    // The defect: the name came from `readDeclaration(root)` — the root passed
    // IN — so every directly-held kg directory got the same key regardless of
    // which instance contributed it. With one such directory that is
    // indistinguishable from correct; with two, the later assignment wins and
    // the earlier package is found and then silently dropped. No collision is
    // reported, nothing throws, and `skill_fetch` answers "package not found"
    // for a package discovery had in hand. `dh4f` one layer up from the scope
    // defect that hid `cat-bootstrap/skills/` in the first place.
    const repo = mkdtempSync(join(tmpdir(), "held-"));

    // The sibling, with its OWN declaration — this is what makes it nameable.
    mkdirSync(join(repo, "sibling", "skills"), { recursive: true });
    writeDeclaration(join(repo, "sibling"), JSON.stringify({
        name: "sibling",
        directories: [{ id: "cat-harness", path: "skills", dependents: "reproduce", graphs: ["cat-harness"] }],
      }));
    writeFileSync(join(repo, "sibling", "skills", "s.md"), SKILL);

    // The instance, declaring its own kg directory AND the sibling's, the
    // second at repository scope — the `cat-bootstrap/skills/` shape.
    const inst = join(repo, "inst");
    mkdirSync(join(inst, "kg"), { recursive: true });
    writeFileSync(join(inst, "kg", "i.md"), SKILL);
    writeDeclaration(inst, JSON.stringify({
        name: "inst",
        directories: [
          { id: "sib", path: "sibling/skills", dependents: "reproduce", graphs: ["cat-harness"], scope: "repository" },
          { id: "cat-harness", path: "kg", dependents: "reproduce", graphs: ["cat-harness"] },
        ],
      }));

    const found = discoverLocalPackages(inst);
    expect(Object.keys(found).sort()).toEqual(["inst", "sibling"]);
    expect(found["sibling"]).toBe(join(repo, "sibling", "skills"));
    expect(found["inst"]).toBe(join(inst, "kg"));

    rmSync(repo, { recursive: true, force: true });
  });

  test("FOUR directly-held directories in one instance, and none is dropped", () => {
    // The within-instance half of the same collision, which the test above
    // does not reach: it has one directly-held directory per instance, so
    // "named by its instance" and "named by first-wins" agree there.
    //
    // `cat-harness` really declares four — `src/skills/`, `methodologies/crdm/`
    // and `methodologies/raci/` — and until bean `1hvo`
    // all four resolved to the name `folio-assistant` with the last winning.
    // Three packages were found and silently dropped: `kg:audit` reported six
    // `manifest-skill-exists` CRITICALs for theming and 27 MAJORs for CRDM
    // activities whose skills nothing could serve.
    const repo = mkdtempSync(join(tmpdir(), "four-"));
    const inst = join(repo, "inst");
    for (const d of ["src/skills", "theming", "a", "b"]) {
      mkdirSync(join(inst, d), { recursive: true });
      writeFileSync(join(inst, d, "s.md"), SKILL);
    }
    writeDeclaration(inst, JSON.stringify({
        name: "inst",
        directories: ["src/skills", "theming", "a", "b"].map((path, i) => ({
          id: `d${i}`,
          path,
          dependents: "reproduce",
          graphs: ["cat-harness"],
        })),
      }));

    const found = discoverLocalPackages(inst);
    // `skills` takes the instance name; the other three take their basenames.
    // Four in, four out — the property is that NOTHING is dropped.
    expect(Object.keys(found).sort()).toEqual(["a", "b", "inst", "theming"]);
    expect(found["inst"]).toBe(join(inst, "src", "skills"));
    expect(found["theming"]).toBe(join(inst, "theming"));

    rmSync(repo, { recursive: true, force: true });
  });

  test("the rule is UNIQUENESS, not order — reversing the declaration changes nothing", () => {
    // First-wins was the defect, so "last one declared takes the name" would
    // pass every assertion above while remaining order-dependent. This is the
    // falsifier: the same four directories, declared backwards.
    const repo = mkdtempSync(join(tmpdir(), "rev-"));
    const inst = join(repo, "inst");
    for (const d of ["src/skills", "theming", "a", "b"]) {
      mkdirSync(join(inst, d), { recursive: true });
      writeFileSync(join(inst, d, "s.md"), SKILL);
    }
    writeDeclaration(inst, JSON.stringify({
        name: "inst",
        directories: ["b", "a", "theming", "src/skills"].map((path, i) => ({
          id: `d${i}`,
          path,
          dependents: "reproduce",
          graphs: ["cat-harness"],
        })),
      }));
    const found = discoverLocalPackages(inst);
    expect(Object.keys(found).sort()).toEqual(["a", "b", "inst", "theming"]);
    expect(found["inst"]).toBe(join(inst, "src", "skills"));
    rmSync(repo, { recursive: true, force: true });
  });

  test("a SOLE directly-held directory still takes the instance name, whatever it is called", () => {
    // Rule 2, and the reason the fixture above names its directory `kg`: with
    // nothing to disambiguate from, the instance's name is the better one.
    const repo = mkdtempSync(join(tmpdir(), "sole-"));
    const inst = join(repo, "inst");
    mkdirSync(join(inst, "kg"), { recursive: true });
    writeFileSync(join(inst, "kg", "s.md"), SKILL);
    writeDeclaration(inst, JSON.stringify({
        name: "inst",
        directories: [{ id: "cat-harness", path: "kg", dependents: "reproduce", graphs: ["cat-harness"] }],
      }));
    expect(Object.keys(discoverLocalPackages(inst))).toEqual(["inst"]);
    rmSync(repo, { recursive: true, force: true });
  });

  test("the live table still names src/skills after its declaring instance", () => {
    // The falsifier for the change above, stated as its own test because the
    // whole claim is that this is a refactor: the name is now derived from
    // where the skills LIVE rather than from who asked, and for `src/skills/`
    // the nearest enclosing declaration is this instance's, so the answer must
    // be the same one the hand-written table gave. If this goes red the change
    // is a behaviour break, not a refactor.
    //
    // The title said `folio-assistant` until the owner's 2026-09-20 ruling
    // made the three instances distinct. A title naming the expected STRING
    // goes stale on a rename that is not a behaviour change; one naming the
    // RULE does not.
    expect(discoverLocalPackages(ROOT)["cat-harness"]).toContain("src/skills");
  });
});
