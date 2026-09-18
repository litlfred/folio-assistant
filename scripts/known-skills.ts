/**
 * Where a skill lives, and therefore what "this skill exists" means.
 *
 * Extracted from `check-workflow-refs.ts` so that the reference checker and
 * `kg-audit.ts` cannot disagree about it. Two checkers with two copies of this
 * list is how one of them ends up reporting a wall of false dangling refs —
 * and a check that cries wolf is a check somebody switches off.
 *
 * Kept in step with `GROUPS` in `gen-skill-docs.ts`, plus the two homes that
 * file does not generate from: `schemas/skills/<name>/` (a directory of JSON
 * schemas) and `.claude/skills/<group>/`.
 *
 * @module scripts/known-skills
 */
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

/** Directories holding one `<skill>.md` per skill. */
export const SKILL_MD_DIRS = [
  ["skills", "content-lifecycle"],
  ["skills", "folio-core"],
  ["skills", "folio-document-adapter"],
  ["skills", "folio-paper-adapter"],
  ["src", "skills"],
] as const;

/**
 * Groups under `.claude/skills/` that hold something other than skills.
 *
 * Each one is a different kind of node in the knowledge graph — participants,
 * environment probes, an assignment table, a shell hook, conformance
 * requirements — and none of them is an instruction body an activity can name.
 *
 * `scripts/generate-registry.ts` states the same taxonomy and is the reason to
 * trust this list rather than the directory's name: it loads `actors/` as
 * `ActorDefinition`, `capabilities/` as `CapabilityDefinition`, `requirements/`
 * as `Requirement` and **only `local/` as `SkillDefinition`**.
 *
 * `requirements/` is the one that looks most like skills and is least like
 * them. Its entries are `{ id: "req:commit-hygiene", statements: [{ conformance:
 * "SHALL", … }], satisfiedBy: [{ kind: "skill", ref: "content-plan" }] }` — a
 * requirement points **at** a skill; it is not one. Reading the four of them as
 * skills is what made `commit-hygiene`, `content-lifecycle`, `lean-verification`
 * and `session-start` appear as reachable skill names with nothing behind them.
 */
export const NON_SKILL_GROUPS = new Set(["actors", "capabilities", "roles", "hooks", "requirements"]);

/** Every skill name this instance can resolve. */
export function knownSkills(root: string): Set<string> {
  const names = new Set<string>();

  for (const parts of SKILL_MD_DIRS) {
    const dir = join(root, ...parts);
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)) {
      if (f.endsWith(".md")) names.add(f.slice(0, -3));
    }
  }

  // `schemas/skills/<name>/` — a directory per skill, beside loose .json files.
  const schemaDir = join(root, "schemas", "skills");
  if (existsSync(schemaDir)) {
    for (const e of readdirSync(schemaDir, { withFileTypes: true })) {
      if (e.isDirectory()) names.add(e.name);
    }
  }

  // `.claude/skills/<group>/<name>.{md,json}` — but only the groups that hold
  // skills.
  //
  // This directory is NOT uniformly skills, and reading it as though it were
  // was a live defect: `actors/` holds eighteen participants, `capabilities/`
  // holds environment probes (`docker`, `pandoc`, `python3`), `roles/` holds an
  // assignment table and `hooks/` holds a shell script. Scanning all of them
  // put 46 non-skills into the skill set — which means a diagram could have
  // referenced `<folio:skill ref="viewer"/>` or `ref="latex-compiler"` and the
  // reference checker would have called it resolved.
  //
  // The list is a deny-list of the groups that are known not to be skills
  // rather than an allow-list of `local/`, so that a NEW group of real skills
  // is picked up automatically and a new group of something else is a one-line
  // addition here.
  const localRoot = join(root, ".claude", "skills");
  if (existsSync(localRoot)) {
    for (const g of readdirSync(localRoot, { withFileTypes: true })) {
      if (!g.isDirectory() || NON_SKILL_GROUPS.has(g.name)) continue;
      for (const f of readdirSync(join(localRoot, g.name))) {
        if (f.endsWith(".md")) names.add(f.slice(0, -3));
        else if (f.endsWith(".json")) names.add(f.slice(0, -5));
      }
    }
  }

  return names;
}
