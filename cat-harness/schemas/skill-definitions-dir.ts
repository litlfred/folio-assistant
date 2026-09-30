/**
 * Where the JSON workflow-skill definitions and the conventions live.
 *
 * Both were under `.claude/skills/` (`local/` and `conventions/`), a
 * vendor-named directory no declaration reached. The owner split them BY
 * THEME across the harnesses that own the subject (2026-09-30, bean `rqao`):
 * WHO SMART / FHIR to `smart-base` and `fhir-harness`, the content lifecycle
 * and document authoring to `folio-assistant-core`, mathematical papers to
 * `folio-assistant-sci`, BPMN/DMN authoring and the conventions to
 * `cat-harness`. So there is no single directory: each instance keeps its own
 * `skill-definitions/` inside a declared `skills` directory, and every reader
 * asks this module for all of them.
 *
 * @module schemas/skill-definitions-dir
 * @graphNode schema
 */
import { existsSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { instanceDirectoriesForGraph, instanceRootsIn, ownDirectoryById } from "./cat-harness.js";
import { CONVENTION_GROUP } from "./convention.js";

/** The subdirectory of a declared `skills` graph that holds JSON `SkillDefinition`s. */
export const SKILL_DEFINITIONS_DIRNAME = "skill-definitions";

/**
 * Every `skill-definitions/` directory in the checkout at `repoRoot`: a
 * declared `skills` directory named so, or one found inside a declared
 * `skills` directory. Sorted and de-duplicated; empty when none exists.
 */
export function skillDefinitionDirs(repoRoot: string): string[] {
  const out = new Set<string>();
  for (const root of instanceRootsIn(repoRoot)) {
    for (const dir of instanceDirectoriesForGraph(root, "skills")) {
      const clean = dir.replace(/\/+$/, "");
      if (basename(clean) === SKILL_DEFINITIONS_DIRNAME) {
        if (existsSync(clean)) out.add(resolve(clean));
      } else {
        const inner = join(clean, SKILL_DEFINITIONS_DIRNAME);
        if (existsSync(inner)) out.add(resolve(inner));
      }
    }
  }
  return [...out].sort();
}

/**
 * The conventions directory: `conventions/` in the platform's declared
 * `skills` graph, or `undefined` when there is none.
 */
export function conventionsDir(repoRoot: string): string | undefined {
  // declared-path-literal: the platform instance, as role-graph.ts's
  // scenariosSubdir names it; its skills directory by id, since several
  // directories declare the `skills` kind.
  const skills = ownDirectoryById(join(repoRoot, "cat-harness"), "skills", "skills");
  const dir = join(skills, CONVENTION_GROUP);
  return existsSync(dir) ? dir : undefined;
}
