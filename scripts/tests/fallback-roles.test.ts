/**
 * A `fallbackRole` resolves, and an empty scan is not reported as a pass.
 *
 * Bean `folio-assistant-85e8`. Two properties, and the second is the one
 * this repository keeps paying to relearn.
 *
 * @module scripts/tests/fallback-roles.test
 */
import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { SCANNED, declaredRoles, fallbackRoleUses } from "../check-fallback-roles.ts";

const ROOT = resolve(import.meta.dir, "../..");

/** A throwaway tree with one scanned dir holding `files`. */
function fixture(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), "fallback-roles-"));
  for (const [rel, body] of Object.entries(files)) {
    const p = join(dir, rel);
    mkdirSync(join(p, ".."), { recursive: true });
    writeFileSync(p, body);
  }
  return dir;
}

describe("the roles it checks against are the real registry", () => {
  test("reads skills/roles/roles.json and finds a substantial set", () => {
    const r = declaredRoles(ROOT);
    // A floor, not a pinned count — pinning would make every added role a
    // failing test, which is the hand-maintained-list defect one level up.
    expect(r.size).toBeGreaterThan(10);
    expect(r.has("code-reviewer")).toBe(true);
    expect(r.has("collaborator")).toBe(false); // a tier word, not a role — qif9
  });
});

describe("finding uses", () => {
  test("a literal fallbackRole is found, with its file", () => {
    const dir = fixture({
      "skills/a.ts": `export default { requiredCapabilities: [\n` +
        `  { capabilityId: "x", degradation: "fallback", fallbackRole: "reviewer" },\n] };\n`,
    });
    try {
      const uses = fallbackRoleUses(dir, ["skills"]);
      expect(uses).toHaveLength(1);
      expect(uses[0]!.role).toBe("reviewer");
      expect(uses[0]!.file).toBe("skills/a.ts");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("test files are skipped — a fixture is not a declaration", () => {
    const dir = fixture({
      "skills/a.test.ts": `const x = { fallbackRole: "not-a-real-role" };\n`,
    });
    try {
      expect(fallbackRoleUses(dir, ["skills"])).toEqual([]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("dot-directories are skipped at EVERY segment, not just the first", () => {
    const dir = fixture({
      "skills/.hidden/a.ts": `const x = { fallbackRole: "reviewer" };\n`,
      "skills/ok/b.ts": `const x = { fallbackRole: "editor" };\n`,
    });
    try {
      const uses = fallbackRoleUses(dir, ["skills"]);
      expect(uses.map((u) => u.role)).toEqual(["editor"]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("several uses in one file are all found", () => {
    const dir = fixture({
      "skills/a.ts":
        `const a = { fallbackRole: "reviewer" };\nconst b = { fallbackRole: "editor" };\n`,
    });
    try {
      expect(fallbackRoleUses(dir, ["skills"]).map((u) => u.role)).toEqual([
        "reviewer",
        "editor",
      ]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("an empty scan is not a pass — the vacuity guard", () => {
  test("a tree with no uses yields an empty list, distinguishably", () => {
    // `fallbackRoleUses` reports what it found; the CLI is what decides an
    // empty result is worth SAYING. Splitting them keeps the reader usable
    // for asking "does anything use this yet".
    const dir = fixture({ "skills/a.ts": `export const x = 1;\n` });
    try {
      expect(fallbackRoleUses(dir, ["skills"])).toEqual([]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("a missing scanned directory does not throw — it contributes nothing", () => {
    // A tree that is not there and a tree with nothing in it are the same
    // to this reader, and neither may crash the sweep.
    const dir = fixture({ "skills/a.ts": `const x = { fallbackRole: "author" };\n` });
    try {
      expect(fallbackRoleUses(dir, ["skills", "does-not-exist"]).map((u) => u.role)).toEqual([
        "author",
      ]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("the real repository", () => {
  test("every fallbackRole in the tree resolves, or there are none yet", () => {
    // The live assertion. Today it is the second case, and the CLI says so
    // rather than printing a tick.
    const roles = declaredRoles(ROOT);
    const bad = fallbackRoleUses(ROOT, SCANNED).filter((u) => !roles.has(u.role));
    expect(bad).toEqual([]);
  });
});
