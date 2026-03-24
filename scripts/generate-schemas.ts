#!/usr/bin/env ts-node
/**
 * @module generate-schemas
 * @description Generates JSON Schema files from Zod schemas.
 *
 * Reads all Zod schemas from schemas/constraints.ts and writes
 * corresponding JSON Schema files to schemas/generated/.
 *
 * Usage: npx ts-node scripts/generate-schemas.ts
 */

import { zodToJsonSchema } from "zod-to-json-schema";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

import {
  ActorDefinitionSchema,
  CapabilityDefinitionSchema,
  SkillDefinitionSchema,
  RequirementSchema,
  SkillRegistrySchema,
  RoleAssignmentSchema,
  DockerRequirementsSchema,
  SkillPackageManifestSchema,
  SkillCapabilityRefSchema,
  SkillDependencySchema,
  SkillScriptSchema,
  SkillValidatorSchema,
  RequirementStatementSchema,
  SatisfiedByRefSchema,
  SessionHookSchema,
  HookCommandSchema,
  SkillPackageRefSchema,
  RemotePackageRefSchema,
  RemoteSyncConfigSchema,
} from "../schemas/constraints.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "schemas", "generated");

mkdirSync(outDir, { recursive: true });

const schemas = {
  "ActorDefinition": ActorDefinitionSchema,
  "CapabilityDefinition": CapabilityDefinitionSchema,
  "SkillDefinition": SkillDefinitionSchema,
  "SkillCapabilityRef": SkillCapabilityRefSchema,
  "SkillDependency": SkillDependencySchema,
  "SkillScript": SkillScriptSchema,
  "SkillValidator": SkillValidatorSchema,
  "Requirement": RequirementSchema,
  "RequirementStatement": RequirementStatementSchema,
  "SatisfiedByRef": SatisfiedByRefSchema,
  "SkillRegistry": SkillRegistrySchema,
  "SkillPackageRef": SkillPackageRefSchema,
  "SessionHook": SessionHookSchema,
  "HookCommand": HookCommandSchema,
  "RoleAssignment": RoleAssignmentSchema,
  "DockerRequirements": DockerRequirementsSchema,
  "SkillPackageManifest": SkillPackageManifestSchema,
  "RemotePackageRef": RemotePackageRefSchema,
  "RemoteSyncConfig": RemoteSyncConfigSchema,
};

console.log("Generating JSON Schemas...\n");

for (const [name, schema] of Object.entries(schemas)) {
  const jsonSchema = zodToJsonSchema(schema, {
    name,
    $refStrategy: "none",
  });

  const filePath = join(outDir, `${name}.schema.json`);
  writeFileSync(filePath, JSON.stringify(jsonSchema, null, 2) + "\n");
  console.log(`  ✓ ${name}.schema.json`);
}

console.log(`\nGenerated ${Object.keys(schemas).length} JSON Schema files in schemas/generated/`);
