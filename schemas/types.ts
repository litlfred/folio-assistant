/**
 * @module @folio-assistant/schemas
 * @description Core TypeScript type definitions for the agent skills framework.
 *
 * ALL types are inferred from Zod schemas in constraints.ts, which is the
 * single source of truth. This eliminates drift between types and validation.
 *
 * Aligned with FHIR R5 resource model (ActorDefinition, Requirements, CapabilityStatement).
 * TypeScript is the authoritative schema; JSON Schema is a generated artifact.
 *
 * @see {@link https://hl7.org/fhir/R5/actordefinition.html} FHIR R5 ActorDefinition
 * @see {@link https://hl7.org/fhir/R5/requirements.html} FHIR R5 Requirements
 */

import { z } from "zod";

import {
  ActorTypeSchema,
  ConformanceSchema,
  DegradationStrategySchema,
  ScriptRuntimeSchema,
  ScriptPhaseSchema,
  ValidatorScopeSchema,
  HookEventSchema,
  IdentitySourceSchema,
  SatisfiedByKindSchema,
  DependencyKindSchema,
  LifecycleStageSchema,
  RemoteSyncStrategySchema,
  CapabilityDetectionSchema,
  ActorDefinitionSchema,
  CapabilityDefinitionSchema,
  SkillCapabilityRefSchema,
  SkillDependencySchema,
  SkillScriptSchema,
  SkillValidatorSchema,
  SkillDefinitionSchema,
  SatisfiedByRefSchema,
  RequirementStatementSchema,
  RequirementSchema,
  SkillPackageRefSchema,
  HookCommandSchema,
  SessionHookSchema,
  SkillRegistrySchema,
  RoleAssignmentSchema,
  DockerRequirementsSchema,
  SkillPackageManifestSchema,
  RemoteSyncConfigSchema,
  RemotePackageRefSchema,
} from "./constraints.js";

// ─── Enumerations ────────────────────────────────────────────────────────────

/** Actor classification: human user or automated system. */
export type ActorType = z.infer<typeof ActorTypeSchema>;

/** FHIR R5 conformance verbs for requirement statements. */
export type Conformance = z.infer<typeof ConformanceSchema>;

/** Behavior when a required capability is absent at runtime. */
export type DegradationStrategy = z.infer<typeof DegradationStrategySchema>;

/** Script execution runtimes. */
export type ScriptRuntime = z.infer<typeof ScriptRuntimeSchema>;

/** Lifecycle phase in which a script runs. */
export type ScriptPhase = z.infer<typeof ScriptPhaseSchema>;

/** Scope of a validator's operation. */
export type ValidatorScope = z.infer<typeof ValidatorScopeSchema>;

/** Hook events that trigger session lifecycle actions. */
export type HookEvent = z.infer<typeof HookEventSchema>;

/** Identity source for role assignment. */
export type IdentitySource = z.infer<typeof IdentitySourceSchema>;

/** What satisfies a requirement statement. */
export type SatisfiedByKind = z.infer<typeof SatisfiedByKindSchema>;

/** Dependency target kind. */
export type DependencyKind = z.infer<typeof DependencyKindSchema>;

// ─── Content Lifecycle ───────────────────────────────────────────────────────

/** Stages in the content development lifecycle. */
export type LifecycleStage = z.infer<typeof LifecycleStageSchema>;

// ─── Remote Package ──────────────────────────────────────────────────────────

/** Sync strategy for remote packages. */
export type RemoteSyncStrategy = z.infer<typeof RemoteSyncStrategySchema>;

// ─── Capability Detection ────────────────────────────────────────────────────

/** How to probe whether a capability is available in the environment. */
export type CapabilityDetection = z.infer<typeof CapabilityDetectionSchema>;

// ─── Core Types ──────────────────────────────────────────────────────────────

/**
 * A human role or system service.
 * Maps to FHIR R5 `ActorDefinition`.
 *
 * @example
 * ```typescript
 * const businessAnalyst: ActorDefinition = {
 *   id: "business-analyst",
 *   name: "Business Analyst",
 *   type: "person",
 *   description: "L2 DAK component author",
 *   inherits: ["viewer"],
 *   capabilities: ["git-push", "bpmn-authoring"],
 * };
 * ```
 */
export type ActorDefinition = z.infer<typeof ActorDefinitionSchema>;

/** A concrete capability that tools, services, or environments provide. */
export type CapabilityDefinition = z.infer<typeof CapabilityDefinitionSchema>;

export type SkillCapabilityRef = z.infer<typeof SkillCapabilityRefSchema>;
export type SkillDependency = z.infer<typeof SkillDependencySchema>;
export type SkillScript = z.infer<typeof SkillScriptSchema>;
export type SkillValidator = z.infer<typeof SkillValidatorSchema>;

/**
 * The core type. A skill has typed metadata (who can invoke it, what it needs,
 * what it validates) and a companion markdown file with instructions the agent reads.
 */
export type SkillDefinition = z.infer<typeof SkillDefinitionSchema>;

// ─── Requirement ─────────────────────────────────────────────────────────────

export type SatisfiedByRef = z.infer<typeof SatisfiedByRefSchema>;
export type RequirementStatement = z.infer<typeof RequirementStatementSchema>;

/**
 * Models workflow rules agents must follow.
 * Maps to FHIR R5 `Requirements` resource.
 */
export type Requirement = z.infer<typeof RequirementSchema>;

// ─── Registry ────────────────────────────────────────────────────────────────

export type SkillPackageRef = z.infer<typeof SkillPackageRefSchema>;
export type HookCommand = z.infer<typeof HookCommandSchema>;
export type SessionHook = z.infer<typeof SessionHookSchema>;

/** Central manifest listing all skills, actors, capabilities, and requirements. */
export type SkillRegistry = z.infer<typeof SkillRegistrySchema>;

/** Maps user identities to actor roles. Evaluated at session start. */
export type RoleAssignment = z.infer<typeof RoleAssignmentSchema>;

// ─── Docker Requirements ─────────────────────────────────────────────────────

/**
 * Docker packaging requirements for a skill package.
 * Uses OCI image spec labels convention.
 *
 * @see {@link https://github.com/opencontainers/image-spec/blob/main/annotations.md}
 */
export type DockerRequirements = z.infer<typeof DockerRequirementsSchema>;

/**
 * Manifest for a skill package — the standard way for each package
 * to declare its Docker/system requirements.
 *
 * Every skill package directory MUST contain a `package-manifest.json`
 * conforming to this type.
 */
export type SkillPackageManifest = z.infer<typeof SkillPackageManifestSchema>;

// ─── Remote Package Reference ────────────────────────────────────────────────

/** Sync configuration for a remote package. */
export type RemoteSyncConfig = z.infer<typeof RemoteSyncConfigSchema>;

/**
 * Reference to an external skill package maintained in another repository.
 * Each remote package gets a light wrapper in `skills/remote-packages/`
 * that provides `SkillPackageManifest`-compatible Docker requirements.
 */
export type RemotePackageRef = z.infer<typeof RemotePackageRefSchema>;
