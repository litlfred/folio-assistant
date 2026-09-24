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
import {
  RequirementFields,
  RequirementLevelSchema,
  RequirementStatementFields,
  refineRequirement,
  refineStatement,
} from "./requirement.ts";
import { NETWORK_REACHES } from "./cat-harness";

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
/** The requirement level — the bootstrap base's, so a harness cannot drift from it. */
export const ConformanceSchema = RequirementLevelSchema;
export const DegradationStrategySchema = z.enum(["fail", "warn", "skip", "fallback"]);
/**
 * The lifecycle points a hook can bind to.
 *
 * `PreToolUse` was MISSING until 2026-09-20 and its absence was not academic:
 * `interaction-modality` §4.1 is a STRICT rule about how a question is put to
 * a person, and the one moment it certainly applies is the instant before
 * `AskUserQuestion` is invoked. With only `PostToolUse` here, the rule could be
 * reminded of *after* the question had already been asked, which is no
 * reminder at all.
 *
 * The general shape is worth naming, because this enum will grow again: an
 * event the host supports and this schema does not is a class of enforcement
 * the instance cannot express, and it fails at the REGISTRY rather than at the
 * hook — `.claude/settings.json` accepted the entry and the generated skill
 * registry refused it. That is the right order (the gate caught it) and it is
 * still a gap: the hook was live and unrepresentable at the same time.
 */
export const HookEventSchema = z.enum([
  "SessionStart", "PreToolUse", "PostToolUse", "PreCommit", "PostCommit", "UserPromptSubmit",
]);
export const IdentitySourceSchema = z.enum([
  "git-config", "github-oauth", "google-oauth", "env-var", "bearer-token", "default",
]);
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
  // used to live here now lives in `scenarios/roles.json`. Kept optional so
  // an unmigrated registry still validates; `kg:audit` reports any entry that
  // still carries it (`actor-is-not-a-role`).
  inherits: z.array(z.string()).optional().default([]),
  /** Roles (BPMN swimlanes) this actor may take on. */
  roles: z.array(z.string()).optional(),
  /** Permission ids — what it may do, regardless of lane. See `skills/permissions/`. */
  permissions: z.array(z.string()).optional(),
  capabilities: z.array(z.string()),
  /**
   * Network reach — see `ActorDefinition.reach` in `assistant-types.ts`, and
   * `schemas/actor-reach.ts` for how it composes with the deployment's.
   */
  reach: z.enum(NETWORK_REACHES).optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

// ─── CapabilityDefinition ────────────────────────────────────────────────────

export const CapabilityDefinitionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  detection: CapabilityDetectionSchema,
  requires: z.array(z.string()).optional(),
  /**
   * The capability that stands in for this one when it is absent.
   *
   * Declared HERE and not on each skill that needs it. What substitutes for
   * `lean-toolchain` is a property of `lean-toolchain`, not of the five
   * skills that happened to say so — bean `folio-assistant-sym3`, on the
   * owner's standing objection to duplicate data maintenance. A sixth Lean
   * skill had to remember to repeat it, and a change of substitute had to be
   * made five times and could be made four.
   *
   * **It must not transitively `requires` the capability it replaces.** A
   * substitute that needs the missing thing is absent in exactly the case it
   * exists for — `probeAll` computes `present = requiresMet && probe(…)`, so
   * the fallback never fires. `check:fallback-roles` reports that.
   */
  fallbackTo: z.string().min(1).optional(),
  /**
   * The requirement statements this capability discharges. See
   * {@link RequirementStatementRefSchema}.
   */
  satisfies: z.array(z.lazy(() => RequirementStatementRefSchema)).optional(),
});

// ─── SkillDefinition ─────────────────────────────────────────────────────────

export const SkillCapabilityRefSchema = z.object({
  capabilityId: z.string(),
  degradation: DegradationStrategySchema,
  // NEITHER fallback field lives here any more, and for two different
  // reasons — both 2026-09-20.
  //
  // `fallbackRole` was DERIVABLE: the BPMN already carried it executably, so
  // declaring it was a cached copy with nothing asserting the two agreed
  // (bean `85e8`).
  //
  // `fallbackCapabilityId` was not derivable but was DUPLICATED: one fact,
  // `lean-toolchain → lean-mcp`, written in five modules. It is
  // `CapabilityDefinition.fallbackTo` now, declared once on the capability
  // it is a property of (bean `sym3`).
  //
  // What stays is `degradation` — the SKILL's business, what it does when a
  // capability is missing, as against the capability's, what stands in for
  // it.
});

export const SkillDependencySchema = z.object({
  ref: z.string(),
  kind: DependencyKindSchema,
  conformance: ConformanceSchema,
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
  /**
   * RETIRED 2026-09-20 (bean `y1w9`) — optional, and read by nothing.
   *
   * Required until today, which is why making it optional is part of the
   * retirement rather than a separate tidy: removing the 23 declarations
   * without this makes `skill()` throw on every definition.
   *
   * Record: `fsh-guts/retired/skill-definition-roles.md`. Short version — it
   * mixed an HTTP access tier (`owner`, `collaborator`, and `reader`, which
   * is not even a `UserRole`) with BPMN roles, and `src/core/rbac.ts` never
   * consulted it: routes hardcoded `hasRole(req, "collaborator")` (they name an
   * ODRL action since issue #1207). A field
   * that reads as enforcement and enforces nothing is worse than an absent
   * one. Reinstating it means writing the consumer first, and deciding which
   * of the two vocabularies it speaks.
   */
  roles: z.array(z.string()).optional(),
  requiredCapabilities: z.array(SkillCapabilityRefSchema),
  dependsOn: z.array(SkillDependencySchema).optional(),
  allowedTools: z.array(z.string()).optional(),
  // No `scripts`, `mcpServices` or `validators` (#1168, B3). Each named a
  // mechanism FROM the skill, the general node pointing at its dependents:
  // a new script meant editing the skill, and nothing read any of the three.
  // A mechanism is a Tool that names the skill it `satisfies`
  // (`schemas/tool.ts`); a Tool reachable only over MCP is refused there.
  routingPatterns: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  package: z.string().optional(),
  // `schemas` was here until 2026-09-20, added because the interface had it
  // and Zod was stripping it — a real defect, correctly fixed at the time.
  //
  // Both halves are gone now, and the fix is the reason worth keeping: the
  // field reached no reader in EITHER state. Adding the counterpart made the
  // value survive `.parse()` and travel to exactly one consumer,
  // `generate-docs.ts`, which had never run since the root commit and is
  // retired (`folio-assistant-3w0i`). Fixing a field's plumbing is not
  // evidence that anything is on the other end — this one was two years of
  // declaration with no destination (`folio-assistant-t2yg`).
  lifecycleStages: z.array(LifecycleStageSchema).optional(),
  // No `schemaRef` (#1168, B3b). It named a directory and was read only by a
  // retired generator. A skill names its contracts in its front matter —
  // `input:` and `output:`, a path into the instance or an https IRI — and
  // `scripts/skill-contracts.ts` is the one reader.
});

// ─── Requirement ─────────────────────────────────────────────────────────────

/**
 * A pointer AT one requirement statement: `req:<requirement id>#<statement key>`.
 *
 * Held by what SATISFIES the statement — a skill in its front matter
 * (`satisfies:`), a capability in its JSON — never by the statement (#1168,
 * B3). A requirement is the general node: it is written once, and skills and
 * capabilities come to discharge it later, so a statement listing its
 * satisfiers had to be edited every time one was added. FHIR R5's
 * `Requirements.statement.satisfiedBy` is the inverse of this relation and is
 * derivable from it for a projection that needs it.
 *
 * @ref RequirementStatementSchema
 */
export const RequirementStatementRefSchema = z
  .string()
  .regex(/^req:[a-z0-9-]+#[a-z0-9-]+$/, "a requirement statement ref is req:<requirement>#<statement key>");

/*
 * BUILT ON THE BOOTSTRAP BASE (issue #1164, owner: "1 + 2"). The base in
 * `bootstrap/schemas/requirement.schema.json` (Zod source: `cat-harness/schemas/requirement.ts`) is what every harness gets — the
 * statement, its level, the functional and non-functional fields. Neither
 * lists what satisfies a statement: that pointer is held by the satisfier
 * (`satisfies:`, above). The base's refinements are re-applied, because a
 * refined schema cannot be extended and the rules must not be lost.
 */
export const RequirementStatementSchema = RequirementStatementFields.superRefine(refineStatement);

export const RequirementSchema = RequirementFields.extend({
  statements: z.array(RequirementStatementSchema).min(1),
}).superRefine(refineRequirement);

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
  env: z.record(z.string(), z.string()).optional(),
  labels: z.record(z.string(), z.string()).optional(),
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

/**
 * How a remote package's skills are brought in — PERFORMED since 2026-09-24
 * (issue #556, bean `wlqd`) by `scripts/sync-remote-skills.ts`
 * (`bun run sync:remote-skills`).
 *
 * Until then this was declared intent that nothing performed: `shallow-clone`
 * appeared only as a value in {@link RemoteSyncStrategySchema}, and both
 * wrappers pinned `ref: "main"` with `autoUpdate: true`. The owner chose to
 * implement it, **committed, pinned and read-only**:
 *
 * - the sync copies each declared skill at the wrapper's `ref` into its own
 *   package under the instance's skills directory, with a sha256 fixity record
 *   per file, so `check:materialized-fixity` fails an edit in place;
 * - a wrapper that declares `sync` must pin a full commit SHA and may not
 *   `autoUpdate` — a skill body is a prompt an agent follows, so an unpinned
 *   one is an unreviewed prompt. {@link RemotePackageRefSchema} refuses both;
 * - `bun run check:remote-skills` fails, offline, when a declared skill is
 *   not materialized at its wrapper's pin.
 *
 * The synced skills resolve as LOCAL skills, so `manifest-skill-exists` needs
 * no remote allowance (bean `nup0`) — it sees them as it sees any other.
 */
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
  /**
   * OPTIONAL, because a wrapper whose only job is to supply Docker requirements
   * should not have to claim a sync strategy to be valid. Required until
   * 2026-09-19, which is why both wrappers carry one.
   */
  sync: RemoteSyncConfigSchema.optional(),
  wrapper: z.object({
    description: z.string(),
    docker: DockerRequirementsSchema,
    providesCapabilities: z.array(z.string()).optional(),
    skills: z.array(z.string()),
    lifecycleStages: z.array(LifecycleStageSchema).optional(),
  }),
}).superRefine((w, ctx) => {
  // PINNED, OR NOT SYNCED (issue #556). A synced skill is a prompt an agent
  // follows, so it moves only by a reviewed change to this pin.
  if (!w.sync) return;
  if (!/^[0-9a-f]{40}$/.test(w.ref)) {
    ctx.addIssue({ code: "custom", path: ["ref"],
      message: "a wrapper that syncs pins a full 40-character commit SHA, never a branch or tag" });
  }
  if (w.sync.autoUpdate) {
    ctx.addIssue({ code: "custom", path: ["sync", "autoUpdate"],
      message: "a pinned sync never updates itself; move the pin in a reviewed change instead" });
  }
});

/**
 * The record `sync-remote-skills.ts` writes beside a synced skill
 * (`materialization.json`, tag `folio-remote-skill/v1`, issue #556).
 *
 * Each file's `materialization` is the shape `check:materialized-fixity`
 * walks. It is restated narrowly here rather than imported, because the full
 * `MaterializationSchema` belongs to a layer above this one; this is the
 * subset a synced skill always carries — materialized, pinned, with sha256.
 */
export const RemoteSkillRecordSchema = z.object({
  $schema: z.literal("folio-remote-skill/v1"),
  skill: z.string().min(1),
  package: z.string().min(1),
  repo: z.string().url(),
  ref: z.string().regex(/^[0-9a-f]{40}$/, "a synced skill is pinned to a full commit SHA"),
  wrapper: z.string().min(1),
  note: z.string().min(1),
  files: z.array(z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    materialization: z.object({
      state: z.literal("materialized"),
      provenance: z.object({ upstream: z.string().url() }),
      localPath: z.string().min(1),
      bytes: z.number().int().nonnegative(),
      purpose: z.literal("archival"),
      fixity: z.object({ algorithm: z.literal("sha256"), digest: z.string().regex(/^[0-9a-f]{64}$/) }),
      materializedAt: z.string().min(1),
      upstreamVersion: z.string().regex(/^[0-9a-f]{40}$/),
    }),
  })).min(1),
});

// ─── Inferred types ──────────────────────────────────────────────────────────
//
// These lived in `types.ts` as `z.infer<>` aliases over the schemas above.
// They move with the schemas: an alias separated from what it infers from is
// a second place to look for one fact, and it was the alias rather than the
// schema that four harness modules were importing.

/** Actor classification: human user or automated system. */
export type ActorKind = z.infer<typeof ActorKindSchema>;

/** How strongly a requirement statement binds. */
export type Conformance = z.infer<typeof ConformanceSchema>;

/** Behavior when a required capability is absent at runtime. */
export type DegradationStrategy = z.infer<typeof DegradationStrategySchema>;

/** Script execution runtimes. */

/** Lifecycle phase in which a script runs. */

/** Scope of a validator's operation. */

/** Hook events that trigger session lifecycle actions. */
export type HookEvent = z.infer<typeof HookEventSchema>;

/** Identity source for role assignment. */
export type IdentitySource = z.infer<typeof IdentitySourceSchema>;

/** What satisfies a requirement statement. */

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



/**
 * The core type. A skill has typed metadata (who can invoke it, what it needs,
 * what it validates) and a companion markdown file with instructions the agent reads.
 */
export type SkillDefinition = z.infer<typeof SkillDefinitionSchema>;

export type RequirementStatementRef = z.infer<typeof RequirementStatementRefSchema>;

export type RequirementStatement = z.infer<typeof RequirementStatementSchema>;

/** Models workflow rules agents must follow — the bootstrap `Requirement`, narrowed. */
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
