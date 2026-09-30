/**
 * A skill reference — `name` or `package/name` — names exactly one skill
 * (#1168 B8, owner 2026-09-30: "both; qualify if ambiguous").
 *
 * The schema checks a reference's SHAPE; this checks that it resolves, and
 * that a bare name is not one two packages hold. A bare name that became
 * ambiguous would otherwise resolve to whichever package a scan met first.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { Glob } from "bun";

import { resolvableSkillIndex, resolveSkillRef } from "../known-skills.js";
import { tools } from "../../tools/discover.js";

const REPO = resolve(import.meta.dir, "..", "..", "..");
const ROOT = join(REPO, "cat-harness");

describe("resolveSkillRef", () => {
  const index = new Map<string, string[]>([
    ["solo", ["folio-core"]],
    ["twice", ["folio-core", "crdm"]],
  ]);

  test("a bare name one package holds resolves to it", () => {
    expect(resolveSkillRef("solo", index)).toEqual({ kind: "ok", name: "solo", package: "folio-core" });
  });

  test("a bare name two packages hold is ambiguous, never picked", () => {
    expect(resolveSkillRef("twice", index)).toEqual({ kind: "ambiguous", ref: "twice", packages: ["crdm", "folio-core"] });
  });

  test("qualifying it resolves it", () => {
    expect(resolveSkillRef("crdm/twice", index)).toEqual({ kind: "ok", name: "twice", package: "crdm" });
  });

  test("a name nothing holds, or a package that does not hold it, is missing", () => {
    expect(resolveSkillRef("nope", index).kind).toBe("missing");
    expect(resolveSkillRef("crdm/solo", index).kind).toBe("missing");
  });
});

describe("the corpus: every skill reference resolves to one skill", () => {
  // Own skills plus the `needs` chain, as kg-audit and check-tools resolve.
  const index = resolvableSkillIndex(ROOT);

  const refs: { where: string; ref: string }[] = [];
  for (const t of tools()) for (const s of t.satisfies) refs.push({ where: `tool ${t.id} satisfies`, ref: s });
  const roles = (JSON.parse(readFileSync(join(ROOT, "scenarios", "roles.json"), "utf-8")) as {
    roles: { id: string; skills?: string[] }[];
  }).roles;
  for (const r of roles) for (const s of r.skills ?? []) refs.push({ where: `role ${r.id}`, ref: s });
  // A skill's `inherits:` names the skill it shares mechanics with (#1168 B10d,
  // owner 2026-09-30: "Typed SkillRef"). It was `local/integration-watcher`,
  // which named no package, in six of seven files.
  for (const rel of new Glob("skills/**/*.md").scanSync({ cwd: ROOT })) {
    const fm = /^---\n([\s\S]*?)\n---/.exec(readFileSync(join(ROOT, rel), "utf-8"))?.[1] ?? "";
    const m = /^inherits:\s*(\S+)\s*$/m.exec(fm);
    if (m) refs.push({ where: `${rel} inherits`, ref: m[1]! });
  }
  for (const rel of new Glob("**/summaries.json").scanSync({ cwd: join(ROOT, "library") })) {
    const text = readFileSync(join(ROOT, "library", rel), "utf-8");
    for (const m of text.matchAll(/"skill":\s*"([^"]+)"/g)) refs.push({ where: `library/${rel}`, ref: m[1]! });
  }

  test("the corpus is non-empty, so the assertions below are not vacuous", () => {
    expect(index.size).toBeGreaterThan(100);
    expect(refs.some((r) => r.ref.includes("/"))).toBe(true);
    expect(refs.some((r) => !r.ref.includes("/"))).toBe(true);
  });

  test("no bare name is held by two packages", () => {
    const shared = [...index].filter(([, pkgs]) => pkgs.length > 1).map(([n, pkgs]) => `${n}: ${pkgs.join(", ")}`);
    expect(shared).toEqual([]);
  });

  test("skill inherits: is counted, so its resolution below is not vacuous", () => {
    expect(refs.filter((r) => r.where.endsWith(" inherits")).length).toBeGreaterThanOrEqual(7);
  });

  test("every reference resolves", () => {
    const bad = refs
      .map((r) => ({ ...r, res: resolveSkillRef(r.ref, index) }))
      .filter((r) => r.res.kind !== "ok")
      .map((r) => `${r.where} → ${r.ref} (${r.res.kind})`);
    expect([...new Set(bad)]).toEqual([]);
  });
});
