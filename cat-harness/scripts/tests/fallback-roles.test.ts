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
  declaredCapabilityFacts,
  declaredRoles,
  fallbackRoleFor,
  fallbackUses,
  transitivelyRequires,
} from "../check-fallback-roles.ts";

const ROOT = resolve(import.meta.dir, "../..");

describe("the registries it resolves against", () => {
  test("both are non-empty, or every resolution below is vacuous", () => {
    expect(declaredRoles(ROOT).size).toBeGreaterThan(10);
    expect(declaredCapabilities(ROOT).size).toBeGreaterThan(5);
  });

  test("roles are read through the declaration, so relocating the kg graph cannot blind it", () => {
    // `check:declared-paths` refused a hardcoded `scenarios/roles.json`
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

  test("finds a fallback and the capability it is for", () => {
    const root = fixture({
      "skills/a.ts": `const x = { capabilityId: "c1", degradation: "fallback" };\n`,
      "skills/b.ts": `const y = { capabilityId: "c3", degradation: "fail" };\n`,
    });
    try {
      expect(fallbackUses(root, ["skills"]).map((u) => [u.skill, u.capabilityId])).toEqual([
        ["a", "c1"],
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

describe("the capability-level fallback, and the contradiction it exposed", () => {
  const facts = declaredCapabilityFacts(ROOT);

  test("`fallbackTo` is declared ONCE, on the capability it is a property of", () => {
    // Five skill modules each carried `fallbackCapabilityId: "lean-mcp"`.
    // What substitutes for `lean-toolchain` is a fact about
    // `lean-toolchain`, so a sixth Lean skill no longer has to remember it.
    expect(facts.get("lean-toolchain")?.fallbackTo).toBe("lean-mcp");
    for (const u of fallbackUses(ROOT, SCANNED)) {
      expect(u).not.toHaveProperty("fallbackCapabilityId");
    }
  });

  test("the fallback CAN fire — inverted 2026-09-20, and that is the point", () => {
    // This test asserted the DEFECT for a few hours: `lean-mcp` declared
    // `requires: ["lean-toolchain"]`, so `probeAll`'s
    // `present = requiresMet && probe(…)` made it absent in exactly the case
    // the fallback existed for.
    //
    // The owner resolved it — `lean-mcp`'s Lean runs server-side, detection
    // is an `mcp-probe`, so the requirement was wrong — and the test is
    // INVERTED rather than deleted. Deleting it would leave no evidence the
    // finding was ever real, and the next person to add that `requires` back
    // would get a green suite and a dead fallback.
    expect(facts.get("lean-mcp")?.requires ?? []).not.toContain("lean-toolchain");
    expect(transitivelyRequires(facts, "lean-mcp", "lean-toolchain")).toBe(false);
  });

  test("no declared fallback anywhere needs the thing it replaces", () => {
    // The general form, now that the corpus is clean and the check gates on
    // it. Written over every capability rather than the one pair, so a new
    // `fallbackTo` cannot reintroduce the shape without failing here first.
    for (const [id, c] of facts) {
      if (!c.fallbackTo) continue;
      expect(`${id} → ${c.fallbackTo}: ${transitivelyRequires(facts, c.fallbackTo, id)}`).toBe(
        `${id} → ${c.fallbackTo}: false`,
      );
    }
  });

  test("the predicate is not vacuously false — it fires on a real chain", () => {
    // With the corpus clean, every assertion above expects `false`, which a
    // predicate that ALWAYS returns false would satisfy. This is the guard
    // against that, on a constructed chain rather than the corpus.
    const m = new Map([
      ["missing", { id: "missing", requires: [] }],
      ["substitute", { id: "substitute", requires: ["missing"] }],
    ]);
    expect(transitivelyRequires(m, "substitute", "missing")).toBe(true);
  });

  test("transitivity is followed, and a cycle terminates", () => {
    const m = new Map([
      ["a", { id: "a", requires: ["b"] }],
      ["b", { id: "b", requires: ["c"] }],
      ["c", { id: "c", requires: [] }],
      ["x", { id: "x", requires: ["y"] }],
      ["y", { id: "y", requires: ["x"] }],
    ]);
    expect(transitivelyRequires(m, "a", "c")).toBe(true);
    expect(transitivelyRequires(m, "a", "z")).toBe(false);
    // Same reading `probeAll` takes: on the stack is unmet, not infinite.
    expect(transitivelyRequires(m, "x", "z")).toBe(false);
  });

  test("the id-set helper still agrees with the facts map", () => {
    expect(declaredCapabilities(ROOT)).toEqual(new Set(facts.keys()));
  });
});
