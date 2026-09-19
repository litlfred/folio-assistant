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

const ROOT = resolve(import.meta.dir, "../..");

/** An instance with a declared kg directory and some package subdirectories. */
function instance(pkgs: Record<string, string>, kgPath = "skills"): string {
  const root = mkdtempSync(join(tmpdir(), "pkgs-"));
  writeFileSync(
    join(root, "harness.json"),
    JSON.stringify({
      name: "t",
      directories: [{ id: "cat-harness", path: kgPath, graphs: ["cat-harness"] }],
    }),
  );
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

  test("the co-located package is present although discovery cannot see it", () => {
    // `src/skills/` holds one skill beside the .ts that implements it and is
    // NOT a declared kg directory. Declaring it was measured: it makes
    // discovery exactly reproduce the old table AND trips `declared-paths`'
    // ratchet in three scripts, so it stays a named exception for now.
    expect(LOCAL_PACKAGES["folio-assistant"]).toBeDefined();
    expect(discoverLocalPackages(ROOT)["folio-assistant"]).toBeUndefined();
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
    writeFileSync(
      join(root, "harness.config.json"),
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
