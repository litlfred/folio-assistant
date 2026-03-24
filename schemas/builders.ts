/**
 * @module @folio-assistant/schemas/builders
 * @description Builder functions for constructing validated framework objects.
 *
 * Each builder validates the input against its Zod schema and returns
 * the typed object, providing compile-time AND runtime safety.
 */

import type {
  ActorDefinition,
  CapabilityDefinition,
  SkillDefinition,
  Requirement,
  SkillRegistry,
  RoleAssignment,
  DockerRequirements,
  SkillPackageManifest,
  RemotePackageRef,
} from "./types.js";

import {
  ActorDefinitionSchema,
  CapabilityDefinitionSchema,
  SkillDefinitionSchema,
  RequirementSchema,
  SkillRegistrySchema,
  RoleAssignmentSchema,
  DockerRequirementsSchema,
  SkillPackageManifestSchema,
  RemotePackageRefSchema,
} from "./constraints.js";

export function actor(def: ActorDefinition): ActorDefinition {
  return ActorDefinitionSchema.parse(def);
}

export function capability(def: CapabilityDefinition): CapabilityDefinition {
  return CapabilityDefinitionSchema.parse(def);
}

export function skill(def: SkillDefinition): SkillDefinition {
  return SkillDefinitionSchema.parse(def);
}

export function requirement(def: Requirement): Requirement {
  return RequirementSchema.parse(def);
}

export function registry(def: SkillRegistry): SkillRegistry {
  return SkillRegistrySchema.parse(def);
}

export function roleAssignment(def: RoleAssignment): RoleAssignment {
  return RoleAssignmentSchema.parse(def);
}

export function dockerRequirements(def: DockerRequirements): DockerRequirements {
  return DockerRequirementsSchema.parse(def);
}

export function packageManifest(def: SkillPackageManifest): SkillPackageManifest {
  return SkillPackageManifestSchema.parse(def);
}

export function remotePackage(def: RemotePackageRef): RemotePackageRef {
  return RemotePackageRefSchema.parse(def);
}
