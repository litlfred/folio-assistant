/**
 * A `fallback` resolves to something real, and the derivation is exact.
 *
 * The property worth pinning is not "the check finds a bad string" — the
 * old version of this file did that, over a field that no longer exists.
 * It is that **the fallback role is recoverable from the diagram**, which
 * is the whole argument for having removed the declaration (bean
 * `folio-assistant-85e8`, on the owner's question about duplicate data).
 * If that derivation ever stops returning `publication-manager` for
 * `qa-report-signing`, the removal was wrong and this says so.
 *
 * @module scripts/tests/fallback-roles.test
 */
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import { describe, expect, test } from "bun:test";

import {
  SCANNED,
  declaredCapabilities,
  declaredRoles,
  fallbackRoleFor,
  fallbackUses,
} from "../check-fallback-roles.ts";

const ROOT = resolve(import.meta.dir, "../..");

describe("the registries it resolves against", () => {
  test("both are non-empty, or every resolution below is vacuous", () => {
    expect(declaredRoles(ROOT).size).toBeGreaterThan(10);
    expect(declaredCapabilities(ROOT).size).toBeGreaterThan(5);
  });

  test("roles are read through the declaration, so relocating the kg graph cannot blind it", () => {
    // `check:declared-paths` refused a hardcoded `skills/roles/roles.json`
    // in the first draft. Asserting a known id is present is what makes the
    // declaration-reading path testable at all.
    expect(declaredRoles(ROOT).has("publication-manager")).toBe(true);
  });
});

describe("the derivation that replaced the declaration", () => {
  test("qa-report-signing falls back to publication-manager, from the DIAGRAM", async () => {
    // The exact value `fallbackRole` used to declare. `Task_HumanSign` is a
    // `userTask` in `Lane_Human`, which binds `publication-manager`; the
    // declaration was a second copy of this with nothing asserting they
    // agreed.
    expect(await fallbackRoleFor(ROOT, "qa-report-signing")).toEqual(["publication-manager"]);
  });

  test("a skill with no human-only lane derives nothing, rather than guessing", async () => {
    // The failure that would make the whole approach unsafe is a derivation
    // that returns SOMETHING for every skill — then a fallback with no
    // route would silently resolve.
    expect(await fallbackRoleFor(ROOT, "formalizer")).toEqual([]);
    expect(await fallbackRoleFor(ROOT, "no-such-skill-anywhere")).toEqual([]);
  });

  test("the retired field is gone from both declarations and from the corpus", async () => {
    // A field removed from the type but left in a module would still be
    // read by nothing AND invisible to the type checker, since the schema
    // is not applied to these modules at build time.
    const { readFileSync } = await import("node:fs");
    for (const f of ["schemas/assistant-types.ts", "schemas/skill-package.ts"]) {
      const src = readFileSync(resolve(ROOT, f), "utf-8");
      // Mentioned in prose (the record of why it went), never re-declared.
      expect(src).not.toMatch(/^\s*fallbackRole[?]?:/m);
    }
    const uses = fallbackUses(ROOT, SCANNED);
    expect(uses.length).toBeGreaterThan(0);
    for (const u of uses) expect(u).not.toHaveProperty("fallbackRole");
  });
});

describe("the scan", () => {
  function fixture(files: Record<string, string>): string {
    const root = mkdtempSync(resolve(tmpdir(), "fallback-"));
    for (const [rel, body] of Object.entries(files)) {
      const abs = resolve(root, rel);
      mkdirSync(resolve(abs, ".."), { recursive: true });
      writeFileSync(abs, body);
    }
    return root;
  }

  test("finds a fallback and carries its capability ids", () => {
    const root = fixture({
      "skills/a.ts": `const x = { capabilityId: "c1", degradation: "fallback", fallbackCapabilityId: "c2" };\n`,
      "skills/b.ts": `const y = { capabilityId: "c3", degradation: "fail" };\n`,
    });
    try {
      const uses = fallbackUses(root, ["skills"]);
      expect(uses.map((u) => [u.skill, u.capabilityId, u.fallbackCapabilityId])).toEqual([
        ["a", "c1", "c2"],
      ]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("does NOT read its own documentation as corpus", () => {
    // The first run of the rewritten check reported `assistant-types.ts` as
    // a skill with an unresolvable fallback: it had matched a JSDoc table
    // describing the very field being removed. A scanner that reads prose
    // as declarations is this repo's "measured the wrong thing" in
    // miniature.
    const root = fixture({
      "skills/a.ts":
        `/**\n * | \`fallback\` | see below |\n * A ref reads degradation: "fallback" and resolves.\n */\n` +
        `// const dead = { capabilityId: "old", degradation: "fallback" };\n` +
        `export const real = 1;\n`,
    });
    try {
      expect(fallbackUses(root, ["skills"])).toEqual([]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("a .test.ts file is not corpus", () => {
    const root = fixture({
      "skills/a.test.ts": `const x = { capabilityId: "c", degradation: "fallback" };\n`,
    });
    try {
      expect(fallbackUses(root, ["skills"])).toEqual([]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
