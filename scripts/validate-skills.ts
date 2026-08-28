#!/usr/bin/env ts-node
/**
 * @module validate-skills
 * @description Validates all skill package manifests against SkillPackageManifest schema
 * and all .claude/skills/ JSON files against their respective schemas.
 *
 * Usage: npx ts-node scripts/validate-skills.ts
 */

import type { z } from "zod";
import { readFileSync, readdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

import {
  SkillPackageManifestSchema,
  ActorDefinitionSchema,
  CapabilityDefinitionSchema,
  RequirementSchema,
  SkillDefinitionSchema,
} from "../schemas/constraints.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");

let errors = 0;
let validated = 0;

function validateDir(dir: string, schema: z.ZodType<unknown>, label: string): void {
  if (!existsSync(dir)) return;
  for (const file of readdirSync(dir).filter(f => f.endsWith(".json"))) {
    const path = join(dir, file);
    try {
      const data = JSON.parse(readFileSync(path, "utf-8"));
      schema.parse(data);
      console.log(`  ✓ ${label}/${file}`);
      validated++;
    } catch (e) {
      console.error(`  ✗ ${label}/${file}: ${e instanceof Error ? e.message : String(e)}`);
      errors++;
    }
  }
}

console.log("Validating skill framework files...\n");

// Validate actors
validateDir(
  join(rootDir, ".claude", "skills", "actors"),
  ActorDefinitionSchema,
  "actors",
);

// Validate capabilities
validateDir(
  join(rootDir, ".claude", "skills", "capabilities"),
  CapabilityDefinitionSchema,
  "capabilities",
);

// Validate requirements
validateDir(
  join(rootDir, ".claude", "skills", "requirements"),
  RequirementSchema,
  "requirements",
);

// Validate skill definitions.
//
// `.claude/skills/local/` was the one JSON directory this script's own
// docstring claimed to cover and did not, so a definition could name a
// nonexistent conformance keyword, a stray field, or a missing `roles` and
// nothing would say so until something tried to load it. Only `.json` here —
// the directory also holds `.md` instruction bodies, which `validateDir`
// already filters out.
validateDir(
  join(rootDir, ".claude", "skills", "local"),
  SkillDefinitionSchema,
  "local",
);

// Validate skill package manifests
const skillsDir = join(rootDir, "skills");
if (existsSync(skillsDir)) {
  for (const pkg of readdirSync(skillsDir, { withFileTypes: true }).filter(d => d.isDirectory())) {
    const manifestPath = join(skillsDir, pkg.name, "package-manifest.json");
    if (existsSync(manifestPath)) {
      try {
        const data = JSON.parse(readFileSync(manifestPath, "utf-8"));
        SkillPackageManifestSchema.parse(data);
        console.log(`  ✓ skills/${pkg.name}/package-manifest.json`);
        validated++;
      } catch (e) {
        console.error(`  ✗ skills/${pkg.name}/package-manifest.json: ${e instanceof Error ? e.message : String(e)}`);
        errors++;
      }
    }
  }
}

console.log(`\nValidated: ${validated}, Errors: ${errors}`);
process.exit(errors > 0 ? 1 : 0);
