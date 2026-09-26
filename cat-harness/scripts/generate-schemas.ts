#!/usr/bin/env ts-node
/**
 * @module generate-schemas
 * @description Generates JSON Schema files from Zod schemas.
 *
 * Reads all Zod schemas from schemas/constraints.ts and writes
 * corresponding JSON Schema files to schemas/generated/.
 *
 * Usage: npx ts-node cat-harness/scripts/generate-schemas.ts
 */

import { namedJsonSchema } from "../schemas/to-json-schema.ts";
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
  RequirementStatementSchema,
  RequirementStatementRefSchema,
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
  "Requirement": RequirementSchema,
  "RequirementStatement": RequirementStatementSchema,
  "RequirementStatementRef": RequirementStatementRefSchema,
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
  const jsonSchema = namedJsonSchema(schema, name);

  const filePath = join(outDir, `${name}.schema.json`);
  writeFileSync(filePath, JSON.stringify(jsonSchema, null, 2) + "\n");
  console.log(`  ✓ ${name}.schema.json`);
}

console.log(`\nGenerated ${Object.keys(schemas).length} JSON Schema files in schemas/generated/`);
