/**
 * Skill framework types — re-export from the authoritative schemas/ directory.
 *
 * The canonical definitions live in `schemas/assistant-types.ts`. This shim lets
 * skill-definition modules under `skills/<bundle>/` import `SkillDefinition`
 * (and the rest of the framework types) from a sibling relative path without
 * reaching across the repo, mirroring the convention the skills were authored
 * against.
 *
 * @module skills/framework/types
 */
export type * from "../../schemas/assistant-types.js";
