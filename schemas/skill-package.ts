/**
 * The SKILL-FRAMEWORK vocabulary — actors, capabilities, skills, requirements,
 * the package registry and its Docker and remote-package machinery.
 *
 * @module @folio-assistant/schemas/skill-package
 *
 * ## Why this is its own module
 *
 * It was the first 240 lines of `constraints.ts`, above the content model that
 * file is named for. Nothing in it is about a folio's content: an actor, a
 * capability probe, a skill's validator list and a package's Docker
 * requirements describe the HARNESS — who is working, on what machine, with
 * which skills installed — and they were in that file because it was where
 * Zod schemas went, not because they belong beside `LeanRefSchema`.
 *
 * The cost was measured. Four harness modules imported `constraints.ts` or
 * `types.ts` for these symbols alone — `scripts/validate-skills.ts`,
 * `scripts/generate-registry.ts`, `schemas/assistant-types.ts`,
 * `schemas/assistant-workflow.ts` — and every one of those reads, in the
 * repository split, as the harness depending on the content layer. It does
 * not: it is the harness depending on its own vocabulary, filed in the
 * content layer's drawer.
 *
 * ## Direction
 *
 * The harness is the base repository: core may import it, it may not import
 * core. So this module must not grow a dependency on `types.ts`,
 * `block-kinds.ts` or anything else that describes content — and today it has
 * none, importing only `zod`. `constraints.ts` re-exports everything here, so
 * existing importers are unaffected; new harness code should import this
 * module directly, which is what keeps the edge from coming back.
 * @graphNode schema
 */

import { z } from "zod";

// ─── Enumerations ────────────────────────────────────────────────────────────

/**
 * What kind of thing an actor is — **human, agentic or mechanical**, plus
 * `external` for a participant outside this instance entirely.
 *
 * `person` names the human, `agent` the agentic and `system` the mechanical.
 * The prose reading, the table and the argument for the split live on the
 * re-export in `schemas/role-graph.ts`; the values live HERE, because this
 * module is the dependency-free base (zod only) that both the registry schema
 * and the role graph can import.
 *
 * **It is one vocabulary because it was two, and that is what broke.** This
 * enum read `["person", "system"]` until 2026-09-19 while `ACTOR_KINDS` in the
 * role graph read all four — two spellings of one concept, in the one place
 * where the difference decides what a task may be handed to. The narrower of
 * the two was what `.claude/skills/actors/*.json` validated against, so an LLM
 * agent and a CI runner were both recorded `system` and no consumer could tell
 * a participant that exercises judgement from one that runs a program.
 */
export const ACTOR_KINDS = ["person", "agent", "system", "external"] as const;
export const ActorKindSchema = z.enum(ACTOR_KINDS);
export const ConformanceSchema = z.enum(["SHALL", "SHOULD", "MAY", "SHALL NOT"]);
export const DegradationStrategySchema = z.enum(["fail", "warn", "skip", "fallback"]);
export const ScriptRuntimeSchema = z.enum(["bash", "python", "typescript", "bun"]);
export const ScriptPhaseSchema = z.enum(["pre", "execute", "validate", "post"]);
export const ValidatorScopeSchema = z.enum(["file", "block", "chapter", "project"]);
export const HookEventSchema = z.enum([
  "SessionStart", "PostToolUse", "PreCommit", "PostCommit", "UserPromptSubmit",
]);
export const IdentitySourceSchema = z.enum([
  "git-config", "github-oauth", "google-oauth", "env-var", "bearer-token", "default",
]);
export const SatisfiedByKindSchema = z.enum(["skill", "capability", "requirement-statement"]);
export const DependencyKindSchema = z.enum(["skill", "requirement"]);
export const LifecycleStageSchema = z.enum([
  "plan", "author", "validate", "review", "test", "publish", "feedback", "retire",
]);

// ─── Capability Detection ────────────────────────────────────────────────────

export const CapabilityDetectionSchema = z.discriminatedUnion("method", [
  z.object({ method: z.literal("command"), command: z.string(), expectExitCode: z.number().optional() }),
  z.object({ method: z.literal("env-var"), variable: z.string() }),
  z.object({ method: z.literal("file-exists"), path: z.string() }),
  z.object({ method: z.literal("mcp-probe"), endpoint: z.string(), healthPath: z.string().optional() }),
  z.object({ method: z.literal("always") }),
]);

// ─── ActorDefinition ─────────────────────────────────────────────────────────

export const ActorDefinitionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  kind: ActorKindSchema,
  description: z.string(),
  // DEPRECATED. An actor does not inherit — a ROLE does, and the lattice that
  // used to live here now lives in `skills/roles/roles.json`. Kept optional so
  // an unmigrated registry still validates; `kg:audit` reports any entry that
  // still carries it (`actor-is-not-a-role`).
  inherits: z.array(z.string()).optional().default([]),
  /** Roles (BPMN swimlanes) this actor may take on. */
  roles: z.array(z.string()).optional(),
  /** Permission ids — what it may do, regardless of lane. See `skills/permissions/`. */
  permissions: z.array(z.string()).optional(),
  capabilities: z.array(z.string()),
  meta: z.record(z.unknown()).optional(),
});

// ─── CapabilityDefinition ────────────────────────────────────────────────────

export const CapabilityDefinitionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  detection: CapabilityDetectionSchema,
  requires: z.array(z.string()).optional(),
});

// ─── SkillDefinition ─────────────────────────────────────────────────────────

export const SkillCapabilityRefSchema = z.object({
  capabilityId: z.string(),
  degradation: DegradationStrategySchema,
  fallbackCapabilityId: z.string().optional(),
});

export const SkillDependencySchema = z.object({
  ref: z.string(),
  kind: DependencyKindSchema,
  conformance: ConformanceSchema,
});

export const SkillScriptSchema = z.object({
  path: z.string(),
  runtime: ScriptRuntimeSchema,
  phase: ScriptPhaseSchema,
  args: z.array(z.string()).optional(),
});

export const SkillValidatorSchema = z.object({
  id: z.string(),
  path: z.string(),
  runtime: ScriptRuntimeSchema,
  scope: ValidatorScopeSchema,
});

/** Mirrors `SkillSchemaRef` — a TS module + the type names a skill touches. */
export const SkillSchemaRefSchema = z.object({
  module: z.string().min(1),
  types: z.array(z.string()),
  access: z.enum(["read", "write", "read-write"]),
});

export const SkillDefinitionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  roles: z.array(z.string()),
  requiredCapabilities: z.array(SkillCapabilityRefSchema),
  dependsOn: z.array(SkillDependencySchema).optional(),
  allowedTools: z.array(z.string()).optional(),
  scripts: z.array(SkillScriptSchema).optional(),
  mcpServices: z.array(z.string()).optional(),
  validators: z.array(SkillValidatorSchema).optional(),
  routingPatterns: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  package: z.string().optional(),
  // `SkillDefinition.schemas` is documented and appears in the interface's own
  // example, but had no counterpart here — so `.parse()` stripped it off any
  // skill that used one. Same defect as `lean` on the provable blocks.
  schemas: z.array(SkillSchemaRefSchema).optional(),
  lifecycleStages: z.array(LifecycleStageSchema).optional(),
  schemaRef: z.string().optional(),
});

// ─── Requirement ─────────────────────────────────────────────────────────────

export const SatisfiedByRefSchema = z.object({
  kind: SatisfiedByKindSchema,
  ref: z.string(),
});

export const RequirementStatementSchema = z.object({
  key: z.string().min(1),
  label: z.string(),
  conformance: ConformanceSchema,
  requirement: z.string(),
  actors: z.array(z.string()).optional(),
  satisfiedBy: z.array(SatisfiedByRefSchema).optional(),
  dependsOn: z.array(z.string()).optional(),
});

export const RequirementSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  description: z.string(),
  derivedFrom: z.array(z.string()).optional(),
  actors: z.array(z.string()),
  statements: z.array(RequirementStatementSchema),
  tags: z.array(z.string()).optional(),
});

// ─── Registry ────────────────────────────────────────────────────────────────

export const SkillPackageRefSchema = z.object({
  name: z.string(),
  repo: z.string(),
  path: z.string(),
  ref: z.string(),
  skills: z.array(z.string()),
});

export const HookCommandSchema = z.object({
  type: z.literal("command"),
  command: z.string(),
  timeout: z.number().optional(),
});

export const SessionHookSchema = z.object({
  event: HookEventSchema,
  matcher: z.string().optional(),
  commands: z.array(HookCommandSchema),
});

export const RoleAssignmentSchema = z.object({
  userPattern: z.string(),
  identitySource: IdentitySourceSchema,
  actorId: z.string(),
  priority: z.number(),
});

// ─── Docker Requirements ─────────────────────────────────────────────────────

export const DockerRequirementsSchema = z.object({
  baseImage: z.string().default("ubuntu:24.04"),
  aptPackages: z.array(z.string()),
  pipPackages: z.array(z.string()).optional(),
  npmPackages: z.array(z.string()).optional(),
  setupCommands: z.array(z.string()).optional(),
  exposePorts: z.array(z.number()).optional(),
  env: z.record(z.string()).optional(),
  labels: z.record(z.string()).optional(),
});

export const SkillPackageManifestSchema = z.object({
  name: z.string().min(1),
  version: z.string(),
  description: z.string(),
  skills: z.array(z.string()),
  docker: DockerRequirementsSchema,
  providesCapabilities: z.array(z.string()).optional(),
  requiresCapabilities: z.array(z.string()).optional(),
  lifecycleStages: z.array(LifecycleStageSchema).optional(),
  schemas: z.array(z.string()).optional(),
});

export const SkillRegistrySchema = z.object({
  schemaVersion: z.literal("1.0"),
  repository: z.string(),
  actors: z.array(ActorDefinitionSchema),
  capabilities: z.array(CapabilityDefinitionSchema),
  skills: z.array(SkillDefinitionSchema),
  requirements: z.array(RequirementSchema),
  // Local `skills/<name>/package-manifest.json` files, which is what the
  // generator has always written here — not `SkillPackageRefSchema`, whose
  // required `repo`/`path`/`ref` made every generated registry invalid.
  packages: z.array(SkillPackageManifestSchema),
  hooks: z.array(SessionHookSchema),
  // `SkillRegistry.roleAssignments` is required by the TS interface but was
  // absent here, so the field was stripped by `.parse()` — on top of the
  // generator never populating it in the first place.
  roleAssignments: z.array(RoleAssignmentSchema),
});

// ─── Remote Package Reference ────────────────────────────────────────────────

export const RemoteSyncStrategySchema = z.enum(["shallow-clone", "sparse-checkout", "subtree"]);

export const RemoteSyncConfigSchema = z.object({
  strategy: RemoteSyncStrategySchema,
  frequency: z.enum(["daily", "weekly", "monthly", "manual"]),
  autoUpdate: z.boolean(),
});

export const RemotePackageRefSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  repo: z.string().url(),
  ref: z.string(),
  path: z.string(),
  maintainer: z.string(),
  sync: RemoteSyncConfigSchema,
  wrapper: z.object({
    description: z.string(),
    docker: DockerRequirementsSchema,
    providesCapabilities: z.array(z.string()).optional(),
    skills: z.array(z.string()),
    lifecycleStages: z.array(LifecycleStageSchema).optional(),
  }),
});

// ─── Inferred types ──────────────────────────────────────────────────────────
//
// These lived in `types.ts` as `z.infer<>` aliases over the schemas above.
// They move with the schemas: an alias separated from what it infers from is
// a second place to look for one fact, and it was the alias rather than the
// schema that four harness modules were importing.

/** Actor classification: human user or automated system. */
export type ActorKind = z.infer<typeof ActorKindSchema>;

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

/** Stages in the content development lifecycle. */
export type LifecycleStage = z.infer<typeof LifecycleStageSchema>;

/** Sync strategy for remote packages. */
export type RemoteSyncStrategy = z.infer<typeof RemoteSyncStrategySchema>;

/** How to probe whether a capability is available in the environment. */
export type CapabilityDetection = z.infer<typeof CapabilityDetectionSchema>;

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

export type SatisfiedByRef = z.infer<typeof SatisfiedByRefSchema>;

export type RequirementStatement = z.infer<typeof RequirementStatementSchema>;

/**
 * Models workflow rules agents must follow.
 * Maps to FHIR R5 `Requirements` resource.
 */
export type Requirement = z.infer<typeof RequirementSchema>;

export type SkillPackageRef = z.infer<typeof SkillPackageRefSchema>;

export type HookCommand = z.infer<typeof HookCommandSchema>;

export type SessionHook = z.infer<typeof SessionHookSchema>;

/** Central manifest listing all skills, actors, capabilities, and requirements. */
export type SkillRegistry = z.infer<typeof SkillRegistrySchema>;

/** Maps user identities to actor roles. Evaluated at session start. */
export type RoleAssignment = z.infer<typeof RoleAssignmentSchema>;

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

/** Sync configuration for a remote package. */
export type RemoteSyncConfig = z.infer<typeof RemoteSyncConfigSchema>;

/**
 * Reference to an external skill package maintained in another repository.
 * Each remote package gets a light wrapper in `skills/remote-packages/`
 * that provides `SkillPackageManifest`-compatible Docker requirements.
 */
export type RemotePackageRef = z.infer<typeof RemotePackageRefSchema>;
