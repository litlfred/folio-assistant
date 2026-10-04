/**
 * Placement PR1 (bean `ybwt`): the content-type skill packages moved UP out of
 * `cat-harness/skills/` to the instance that owns them, and the role edges
 * naming them moved with them as extensions by id (PR0b).
 *
 * Pinned against the live checkout, because the claim IS about this checkout:
 *
 * 1. every moved package is held by its owner, in a concern group there;
 * 2. the harness, resolved ALONE, holds none of their skills — and the
 *    checkout still knows every one (`knownSkills(checkout)` unchanged);
 * 3. `cat-harness/scenarios/roles.json` names none of them — each edge lives
 *    in the owner's `scenarios/roles.json` `extensions`, and the role resolved
 *    from the checkout still carries it.
 *
 * @module scripts/tests/placement-pr1-content-up
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { knownSkills, roleGraphFor } from "../known-skills.js";
import { packageDirsIn } from "../skill-topics.js";

const REPO = resolve(import.meta.dir, "../../..");
const PLATFORM = join(REPO, "cat-harness");

/** Package → the instance-relative directory it lives in now. */
const MOVED: Record<string, { instance: string; dir: string }> = {
  "folio-paper-adapter": { instance: "folio-assistant-sci", dir: "skills/content/folio-paper-adapter" },
  "authoring-math": { instance: "folio-assistant-sci", dir: "skills/content/authoring-math" },
  "hypothesis-generation": { instance: "folio-assistant-sci", dir: "skills/content/hypothesis-generation" },
  "scientific-critical-thinking": { instance: "folio-assistant-sci", dir: "skills/content/scientific-critical-thinking" },
  "scientific-visualization": { instance: "folio-assistant-sci", dir: "skills/content/scientific-visualization" },
  "folio-document-adapter": { instance: "folio-assistant-core", dir: "skills/content/folio-document-adapter" },
  "content-lifecycle-ext": { instance: "folio-assistant-core", dir: "skills/content/content-lifecycle-ext" },
  // `ingestion` (document-intake) was here until bean mlux: the owner moved it
  // back DOWN to cat-harness library-core on 2026-10-03, because ingestion is a
  // harness capability and six cat-harness diagrams bind it.
  "authoring-who-smart-guidelines": { instance: "smart-base", dir: "skills/content/authoring-who-smart-guidelines" },
  "fhir-ig-authoring": { instance: "fhir-harness", dir: "skills/content/fhir-ig-authoring" },
};

/** A skill from each package, and one that changed package on the way up. */
const SAMPLE: Record<string, string> = {
  formalizer: "folio-paper-adapter",
  "latex-authoring": "authoring-math",
  "scientific-visualization": "scientific-visualization",
  "document-structure": "folio-document-adapter",
  "quality-control": "content-lifecycle-ext",
  grade: "authoring-who-smart-guidelines",
  "fhir-validation": "fhir-ig-authoring",
};

describe("placement PR1: content-type packages are held by their owner", () => {
  test("each moved package sits in a concern group of its owning instance", () => {
    for (const [pkg, { instance, dir }] of Object.entries(MOVED)) {
      const skillsDir = join(REPO, instance, "skills");
      const found = packageDirsIn(skillsDir).find((d) => d.name === pkg);
      expect(found?.dir, `${pkg} is not a package of ${instance}/skills/`).toBe(join(REPO, instance, dir));
      expect(found?.topic, `${pkg} sits in no concern group`).toBeDefined();
    }
  });

  test("the harness's own skills directory holds none of them", () => {
    const names = new Set(packageDirsIn(join(PLATFORM, "skills")).map((d) => d.name));
    for (const pkg of Object.keys(MOVED)) expect(names.has(pkg), `${pkg} is still under cat-harness/skills/`).toBe(false);
  });

  test("the harness alone knows none of their skills; the checkout knows all of them", () => {
    const alone = knownSkills(PLATFORM, "instance");
    const checkout = knownSkills(PLATFORM, "checkout");
    for (const skill of Object.keys(SAMPLE)) {
      expect(alone.has(skill), `${skill} is still visible from cat-harness alone`).toBe(false);
      expect(checkout.has(skill), `${skill} vanished from the checkout`).toBe(true);
    }
  });
});

describe("placement PR1: role edges point down", () => {
  const harnessRoles = JSON.parse(readFileSync(join(PLATFORM, "scenarios", "roles.json"), "utf-8")) as {
    roles: Array<{ id: string; skills?: string[] }>;
  };

  test("cat-harness/scenarios/roles.json names no skill a moved package holds", () => {
    const moved = new Set<string>();
    for (const { instance, dir } of Object.values(MOVED)) {
      const manifest = join(REPO, instance, dir, "package-manifest.json");
      if (!existsSync(manifest)) continue;
      for (const s of (JSON.parse(readFileSync(manifest, "utf-8")) as { skills?: string[] }).skills ?? []) moved.add(s);
    }
    expect(moved.size).toBeGreaterThan(60);
    const upward = harnessRoles.roles.flatMap((r) => (r.skills ?? []).filter((s) => moved.has(s)).map((s) => `${r.id} → ${s}`));
    expect(upward).toEqual([]);
  });

  test("the checkout's role graph still carries each edge, through the owner's extension", () => {
    const g = roleGraphFor(PLATFORM, "checkout")!;
    const skillsOf = (id: string): string[] => g.roles.find((r) => r.id === id)?.skills ?? [];
    expect(skillsOf("lean-authoring-agent")).toContain("formalizer");
    expect(skillsOf("reviewer")).toContain("document-intake");
    expect(skillsOf("build-pipeline")).toContain("fhir-validation");
    expect(skillsOf("business-analyst")).toContain("l2-dak-authoring");
    expect(skillsOf("qc-reviewer")).toContain("quality-control");
  });
});
