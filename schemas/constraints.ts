/**
 * @module @folio-assistant/schemas/constraints
 * @description Zod validation schemas for all framework types.
 *
 * These schemas provide runtime validation and are used by the
 * schema generation scripts to produce JSON Schema files.
 */

import { z } from "zod";

// ─── Enumerations ────────────────────────────────────────────────────────────

export const ActorTypeSchema = z.enum(["person", "system"]);
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
  name: z.string().min(1),
  type: ActorTypeSchema,
  description: z.string(),
  inherits: z.array(z.string()),
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

export const SkillRegistrySchema = z.object({
  schemaVersion: z.literal("1.0"),
  repository: z.string(),
  actors: z.array(ActorDefinitionSchema),
  capabilities: z.array(CapabilityDefinitionSchema),
  skills: z.array(SkillDefinitionSchema),
  requirements: z.array(RequirementSchema),
  packages: z.array(SkillPackageRefSchema),
  hooks: z.array(SessionHookSchema),
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
