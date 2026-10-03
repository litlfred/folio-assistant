/**
 * A field retired from `SkillDefinition` does not quietly come back.
 *
 * ## Why this exists at all
 *
 * Two fields were retired from `SkillDefinition` on 2026-09-20 — `schemaRefs`
 * (beans `3w0i`, `t2yg`) and `roles` (bean `y1w9`) — and both were retired
 * the same way: the property stayed **optional and deprecated** so a
 * downstream instance still validates, while every declaration in this
 * instance was removed. `roles` was then deleted outright in #1168 B8 (the
 * schema is not strict, so data still carrying it still validates); the
 * guard below holds either way.
 *
 * That shape has a hole in it. An optional property re-declared typechecks
 * cleanly, so nothing fails, nothing warns outside an editor, and the field
 * is back with no reader — which is the state it was retired from.
 *
 * The cost of not pinning a decision is already measured here. `dhol`: the
 * `*.test.ts` exclusion in `check-declared-paths` was written and never
 * argued, and survived three breakages because there was nothing to disagree
 * with. This is the cheapest possible way not to repeat that.
 *
 * **This is not a ban.** Reinstating either field is fine — the rule both
 * retirement records state is *write the consumer first*. Do that, and
 * update this test in the same change; the diff is then a decision somebody
 * reviewed rather than a line that reappeared.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { Glob } from "bun";

import { fshGutsDirectory } from "../../schemas/fsh-guts.js";
import { kgRoots } from "../known-skills.js";

const ROOT = resolve(import.meta.dir, "../..");

/**
 * Retired property → the record that says why, and how to bring it back.
 *
 * The two records live in different places on purpose, and neither is wrong:
 * `roles` earned a standalone note because the measurement is long and the
 * first reading of it was mistaken, while `schemaRefs` is documented inline
 * on the {@link SchemaRef} type it belongs to. What matters is that each path
 * RESOLVES — asserted below, because the first draft of this very registry
 * pointed at an `fsh-guts/retired/schema-refs.md` that was never written.
 */
const RETIRED: Record<string, string> = {
  // Inside the DECLARED trashcan, never a spelled `fsh-guts/` (bean `gz47`):
  // the trashcan is moving to its own branch (`9c7h`).
  roles: join(relative(resolve(ROOT, ".."), fshGutsDirectory(resolve(ROOT, ".."))), "retired", "skill-definition-roles.md"),
  schemaRefs: "cat-harness/schemas/assistant-types.ts",
};

function skillDefinitionFiles(): string[] {
  const out: string[] = [];
  // The harness's own trees, plus every skills root the checkout resolves:
  // the paper adapter's fourteen definitions moved up to sci with their
  // skills (placement PR1, bean `ybwt`), and they still type as
  // `SkillDefinition` from the harness's framework.
  const dirs = new Set([...["skills", "adapters", "src"].map((d) => resolve(ROOT, d)), ...kgRoots(ROOT).map((d) => resolve(d))]);
  for (const dir of dirs) {
    for (const rel of new Glob("**/*.ts").scanSync({ cwd: dir })) {
      const abs = resolve(dir, rel);
      if (out.includes(abs)) continue;
      if (abs.endsWith(".test.ts")) continue;
      const text = readFileSync(abs, "utf-8");
      // The literals, not the schema that defines the shape.
      if (/:\s*SkillDefinition\s*=/.test(text)) out.push(abs);
    }
  }
  return out;
}

describe("retired SkillDefinition fields", () => {
  const files = skillDefinitionFiles();

  test("the sweep found the skill definitions — otherwise nothing below holds", () => {
    // Vacuity first. A rename of the annotation, or a move of these trees,
    // turns every assertion below into a pass over an empty list.
    expect(files.length, "no `: SkillDefinition =` literals found at all").toBeGreaterThan(15);
  });

  test("every record named here dereferences", () => {
    // A link-shaped value that does not dereference is the `blv9` class, and
    // a retirement note is the one place it hurts most: the reader who most
    // needs it is the one about to reinstate the field.
    const repo = resolve(ROOT, "..");
    const dead = Object.entries(RETIRED)
      .filter(([, record]) => !existsSync(resolve(repo, record)))
      .map(([field, record]) => `${field} → ${record}`);
    expect(dead, "a retirement record was named but never written").toEqual([]);
  });

  for (const [field, record] of Object.entries(RETIRED)) {
    test(`no SkillDefinition declares \`${field}\``, () => {
      const declaring = files
        .filter((f) => new RegExp(`^\\s*${field}:`, "m").test(readFileSync(f, "utf-8")))
        .map((f) => f.slice(ROOT.length + 1));
      expect(
        declaring,
        `\`${field}\` is retired and read by nothing — see ${record}. ` +
          "Reinstating it means writing the consumer FIRST, then updating this test.",
      ).toEqual([]);
    });
  }
});
