/**
 * `scripts/generate-registry.ts` writes `.claude/skills/registry.json`, whose
 * contract is `SkillRegistrySchema`. Nothing ever checked that it satisfied it,
 * and it did not:
 *
 *   INVALID — 15 issues
 *     packages.0.repo  Required
 *     packages.0.path  Required
 *     packages.0.ref   Required   … × 5 packages
 *
 * The generator's own output type declared all six collections as `any[]`, so
 * `packages` was filled with `skills/<name>/package-manifest.json` files while
 * the schema asked for `SkillPackageRef` — a reference to an *external* package
 * in another repo. On top of that the generator never emitted
 * `roleAssignments` at all, though `.claude/skills/roles/role-assignments.json`
 * has three rules in it and the field is required.
 *
 * This runs the generator and validates its output. It is the check whose
 * absence let a registry that could not be parsed ship as the framework's
 * machine-readable manifest.
 */
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { existsSync, readdirSync, readFileSync, renameSync, unlinkSync } from "fs";
import { join } from "path";
import { spawnSync } from "child_process";
import { SkillRegistrySchema } from "../../schemas/constraints.ts";

const ROOT = join(import.meta.dir, "..", "..");
const OUT = join(ROOT, ".claude", "skills", "registry.json");
const SAVED = `${OUT}.testbak`;

// The generator writes to a fixed path in the working tree. Preserve whatever
// is there so a developer's copy is not clobbered by running the suite.
let hadExisting = false;
beforeAll(() => {
  hadExisting = existsSync(OUT);
  if (hadExisting) renameSync(OUT, SAVED);
  const r = spawnSync("bun", ["run", join(ROOT, "scripts", "generate-registry.ts")], {
    cwd: ROOT, stdio: "pipe",
  });
  if (r.status !== 0) throw new Error(`generate-registry failed: ${r.stderr?.toString()}`);
});
afterAll(() => {
  try {
    if (hadExisting) renameSync(SAVED, OUT);
    else if (existsSync(OUT)) unlinkSync(OUT);
  } catch {}
});

describe("generated skill registry", () => {
  test("satisfies SkillRegistrySchema", () => {
    const raw: unknown = JSON.parse(readFileSync(OUT, "utf-8"));
    const parsed = SkillRegistrySchema.safeParse(raw);
    const detail = parsed.success
      ? ""
      : parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n");
    expect(detail).toBe("");
    expect(parsed.success).toBe(true);
  });

  test("carries the role rules that are on disk", () => {
    // Required by the schema, and never populated before: the registry
    // advertised no role assignments while three sat in
    // `.claude/skills/roles/role-assignments.json`.
    const reg = SkillRegistrySchema.parse(JSON.parse(readFileSync(OUT, "utf-8")));
    expect(reg.roleAssignments.length).toBeGreaterThan(0);
    // Highest priority first — the evaluation order the type documents.
    const priorities = reg.roleAssignments.map((r) => r.priority);
    expect([...priorities].sort((a, b) => b - a)).toEqual(priorities);
  });

  test("hooks are HookCommands, not raw settings entries", () => {
    // `.claude/settings.json` nests `{ matcher, hooks: [...] }` inside each
    // event; the old mapping put that object into `commands[]` verbatim.
    const reg = SkillRegistrySchema.parse(JSON.parse(readFileSync(OUT, "utf-8")));
    for (const h of reg.hooks) {
      for (const c of h.commands) {
        expect(c.type).toBe("command");
        expect(typeof c.command).toBe("string");
      }
    }
  });

  test("every package manifest on disk is in the registry", () => {
    const reg = SkillRegistrySchema.parse(JSON.parse(readFileSync(OUT, "utf-8")));
    const onDisk = readdirSync(join(ROOT, "skills"), { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .filter((d) => existsSync(join(ROOT, "skills", d.name, "package-manifest.json")))
      .map((d) => d.name);
    expect(onDisk.length).toBeGreaterThan(0);
    expect(reg.packages.map((p) => p.name).sort()).toEqual([...onDisk].sort());
  });
});
