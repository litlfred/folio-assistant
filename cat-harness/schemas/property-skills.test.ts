/**
 * The edit-skill map is TOTAL (issue #1146). Owner: *"it is a QA in and of
 * itself if there are missing"*, so a declaration key with no row fails here,
 * and so does a row naming a skill that does not exist.
 */
import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";
import { Glob } from "bun";

import { CatHarnessDeclarationSchema } from "./cat-harness.ts";
import { PROPERTY_SKILLS } from "./property-skills.ts";

const REPO = resolve(import.meta.dir, "../..");

function declarationKeys(): string[] {
  const s = CatHarnessDeclarationSchema as unknown as { _def: { schema?: { shape: object } }; shape?: object };
  const shape = s._def.schema?.shape ?? s.shape;
  return Object.keys(shape ?? {});
}

/** Every skill stem in the tree: `<instance>/skills/**\/<name>.md`, and `SKILL.md` packages by directory. */
function skillNames(): Set<string> {
  const out = new Set<string>();
  for (const p of new Glob("*/skills/**/*.md").scanSync({ cwd: REPO, onlyFiles: true })) {
    if (p.includes("node_modules")) continue;
    const parts = p.split("/");
    const file = parts[parts.length - 1];
    out.add(file === "SKILL.md" ? parts[parts.length - 2] : file.replace(/\.md$/, ""));
  }
  return out;
}

describe("PROPERTY_SKILLS", () => {
  test("the schema has keys to check (vacuity guard)", () => {
    expect(declarationKeys().length).toBeGreaterThan(10);
  });

  test("every declaration key has a row: a skill or a recorded gap", () => {
    const missing = declarationKeys().filter((k) => !(k in PROPERTY_SKILLS));
    expect(missing).toEqual([]);
  });

  test("no row for a key the schema does not have", () => {
    const keys = new Set(declarationKeys());
    expect(Object.keys(PROPERTY_SKILLS).filter((k) => !keys.has(k))).toEqual([]);
  });

  test("every skill named exists", () => {
    const have = skillNames();
    const bad = Object.entries(PROPERTY_SKILLS).flatMap(([k, r]) =>
      (r.skills as readonly string[]).filter((s) => !have.has(s)).map((s) => `${k}: ${s}`),
    );
    expect(bad).toEqual([]);
  });

  test("a row with no skill says why", () => {
    for (const [, r] of Object.entries(PROPERTY_SKILLS)) {
      const row = r as { skills: readonly string[]; gap?: string };
      if (row.skills.length === 0) expect((row.gap ?? "").length).toBeGreaterThan(0);
    }
  });
});
