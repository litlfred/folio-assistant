/**
 * @module @folio-assistant/schemas
 * @description Core TypeScript schema definitions for the agent skills framework.
 *
 * Aligned with FHIR R5 resource model (ActorDefinition, Requirements, CapabilityStatement).
 * TypeScript is the authoritative schema; JSON Schema is a generated artifact.
 *
 * @see {@link https://hl7.org/fhir/R5/actordefinition.html} FHIR R5 ActorDefinition
 * @see {@link https://hl7.org/fhir/R5/requirements.html} FHIR R5 Requirements
 */

// ─── Enumerations ────────────────────────────────────────────────────────────

/** Actor classification: human user or automated system. */
export type ActorType = "person" | "system";

/** FHIR R5 conformance verbs for requirement statements. */
export type Conformance = "SHALL" | "SHOULD" | "MAY" | "SHALL NOT";

/** Behavior when a required capability is absent at runtime. */
export type DegradationStrategy = "fail" | "warn" | "skip" | "fallback";

/** Script execution runtimes. */
export type ScriptRuntime = "bash" | "python" | "typescript" | "bun";

/** Lifecycle phase in which a script runs. */
export type ScriptPhase = "pre" | "execute" | "validate" | "post";

/** Scope of a validator's operation. */
export type ValidatorScope = "file" | "block" | "chapter" | "project";

/** Hook events that trigger session lifecycle actions. */
export type HookEvent =
  | "SessionStart"
  | "PostToolUse"
  | "PreCommit"
  | "PostCommit"
  | "UserPromptSubmit";

/** Identity source for role assignment. */
export type IdentitySource =
  | "git-config"
  | "github-oauth"
  | "google-oauth"
  | "env-var"
  | "bearer-token"
  | "default";

/** What satisfies a requirement statement. */
export type SatisfiedByKind = "skill" | "capability" | "requirement-statement";

/** Dependency target kind. */
export type DependencyKind = "skill" | "requirement";

// ─── Content Lifecycle ───────────────────────────────────────────────────────

/** Stages in the content development lifecycle. */
export type LifecycleStage =
  | "plan"
  | "author"
  | "validate"
  | "review"
  | "test"
  | "publish"
  | "feedback"
  | "retire";

// ─── Capability Detection ────────────────────────────────────────────────────

/** How to probe whether a capability is available in the environment. */
export type CapabilityDetection =
  | { method: "command"; command: string; expectExitCode?: number }
  | { method: "env-var"; variable: string }
  | { method: "file-exists"; path: string }
  | { method: "mcp-probe"; endpoint: string; healthPath?: string }
  | { method: "always" };

// ─── ActorDefinition ─────────────────────────────────────────────────────────

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
 *   description: "L2 DAK component author who translates clinical guidelines into structured digital artifacts",
 *   inherits: ["viewer"],
 *   capabilities: ["git-push", "bpmn-authoring", "dmn-authoring"],
 * };
 * ```
 */
export interface ActorDefinition {
  id: string;
  name: string;
  type: ActorType;
  description: string;
  /** Actor IDs this role inherits from (DAG). */
  inherits: string[];
  /** Capability IDs this actor possesses. */
  capabilities: string[];
  /** Domain-specific metadata. */
  meta?: Record<string, unknown>;
}

// ─── CapabilityDefinition ────────────────────────────────────────────────────

/**
 * A concrete capability that tools, services, or environments provide.
 * Skills declare which capabilities they require; actors declare which they possess.
 */
export interface CapabilityDefinition {
  id: string;
  name: string;
  description: string;
  detection: CapabilityDetection;
  /** Other capability IDs this depends on. */
  requires?: string[];
}

// ─── SkillDefinition ─────────────────────────────────────────────────────────

/**
 * The core type. A skill has typed metadata (who can invoke it, what it needs,
 * what it validates) and a companion markdown file with instructions the agent reads.
 */
export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  /** Actor IDs that may invoke this skill (inheritance applies). */
  roles: string[];
  /** Capabilities required from the environment. */
  requiredCapabilities: SkillCapabilityRef[];
  /** Dependencies on other skills or requirements. */
  dependsOn?: SkillDependency[];
  /** Agent tools this skill may use. */
  allowedTools?: string[];
  /** Scripts this skill invokes. */
  scripts?: SkillScript[];
  /** MCP service IDs this skill uses. */
  mcpServices?: string[];
  /** Validators to run when this skill makes changes. */
  validators?: SkillValidator[];
  /** Request patterns for auto-routing. */
  routingPatterns?: string[];
  /** Tags for grouping/filtering. */
  tags?: string[];
  /** Source package (undefined = local). */
  package?: string;
  /** Content lifecycle stage(s) this skill operates in. */
  lifecycleStages?: LifecycleStage[];
  /** JSON Schema ID associated with this skill's input/output (if any). */
  schemaRef?: string;
}

export interface SkillCapabilityRef {
  capabilityId: string;
  degradation: DegradationStrategy;
  fallbackCapabilityId?: string;
}

export interface SkillDependency {
  ref: string;
  kind: DependencyKind;
  conformance: Conformance;
}

export interface SkillScript {
  /** Path relative to repo root. */
  path: string;
  runtime: ScriptRuntime;
  phase: ScriptPhase;
  args?: string[];
}

export interface SkillValidator {
  id: string;
  path: string;
  runtime: ScriptRuntime;
  scope: ValidatorScope;
}

// ─── Requirement ─────────────────────────────────────────────────────────────

/**
 * Models workflow rules agents must follow.
 * Maps to FHIR R5 `Requirements` resource.
 */
export interface Requirement {
  id: string;
  title: string;
  description: string;
  /** Parent requirement IDs (hierarchy). */
  derivedFrom?: string[];
  /** Actor IDs involved. */
  actors: string[];
  statements: RequirementStatement[];
  tags?: string[];
}

export interface RequirementStatement {
  key: string;
  label: string;
  conformance: Conformance;
  requirement: string;
  actors?: string[];
  /** What satisfies this statement (traceable). */
  satisfiedBy?: SatisfiedByRef[];
  /** Other statement keys this depends on (ordering). */
  dependsOn?: string[];
}

export interface SatisfiedByRef {
  kind: SatisfiedByKind;
  ref: string;
}

// ─── SkillRegistry ───────────────────────────────────────────────────────────

/** Central manifest listing all skills, actors, capabilities, and requirements. */
export interface SkillRegistry {
  schemaVersion: "1.0";
  repository: string;
  actors: ActorDefinition[];
  capabilities: CapabilityDefinition[];
  skills: SkillDefinition[];
  requirements: Requirement[];
  packages: SkillPackageRef[];
  hooks: SessionHook[];
}

export interface SkillPackageRef {
  name: string;
  repo: string;
  path: string;
  ref: string;
  skills: string[];
}

export interface SessionHook {
  event: HookEvent;
  matcher?: string;
  commands: HookCommand[];
}

export interface HookCommand {
  type: "command";
  command: string;
  timeout?: number;
}

// ─── RoleAssignment ──────────────────────────────────────────────────────────

/** Maps user identities to actor roles. Evaluated at session start. */
export interface RoleAssignment {
  userPattern: string;
  identitySource: IdentitySource;
  actorId: string;
  /** Higher priority wins when multiple patterns match. */
  priority: number;
}

// ─── Docker Requirements ─────────────────────────────────────────────────────

/**
 * Docker packaging requirements for a skill package.
 * Uses OCI image spec labels convention.
 *
 * @see {@link https://github.com/opencontainers/image-spec/blob/main/annotations.md} OCI Annotations
 */
export interface DockerRequirements {
  /** Base image (default: ubuntu:24.04). */
  baseImage: string;
  /** APT packages required. */
  aptPackages: string[];
  /** pip packages required. */
  pipPackages?: string[];
  /** npm packages required (global). */
  npmPackages?: string[];
  /** Additional setup commands. */
  setupCommands?: string[];
  /** Ports to expose. */
  exposePorts?: number[];
  /** Environment variables to set. */
  env?: Record<string, string>;
  /** OCI image labels. */
  labels?: Record<string, string>;
}

// ─── Skill Package Manifest ──────────────────────────────────────────────────

/**
 * Manifest for a skill package — the standard way for each package
 * to declare its Docker/system requirements.
 *
 * Every skill package directory MUST contain a `package-manifest.json`
 * conforming to this interface.
 */
export interface SkillPackageManifest {
  name: string;
  version: string;
  description: string;
  /** Skills provided by this package. */
  skills: string[];
  /** Docker packaging requirements. */
  docker: DockerRequirements;
  /** Capabilities this package provides. */
  providesCapabilities?: string[];
  /** Capabilities this package requires from the host. */
  requiresCapabilities?: string[];
  /** Content lifecycle stages this package covers. */
  lifecycleStages?: LifecycleStage[];
  /** Schema files associated with this package. */
  schemas?: string[];
}

// ─── Remote Package Reference ────────────────────────────────────────────────

/** Sync strategy for remote packages. */
export type RemoteSyncStrategy = "shallow-clone" | "sparse-checkout" | "subtree";

/** Sync configuration for a remote package. */
export interface RemoteSyncConfig {
  strategy: RemoteSyncStrategy;
  /** How often to check for updates. */
  frequency: "daily" | "weekly" | "monthly" | "manual";
  /** Whether agents can auto-update the local copy. */
  autoUpdate: boolean;
}

/**
 * Reference to an external skill package maintained in another repository.
 * The agent can sync and update the local wrapper while the upstream
 * package is maintained independently.
 *
 * Each remote package gets a light wrapper in `skills/remote-packages/`
 * that provides `SkillPackageManifest`-compatible Docker requirements.
 */
export interface RemotePackageRef {
  name: string;
  description: string;
  /** Git repository URL. */
  repo: string;
  /** Git ref to track (branch, tag, or commit). */
  ref: string;
  /** Path within the repo (default: "/"). */
  path: string;
  /** Upstream maintainer (org or user). */
  maintainer: string;
  /** Sync configuration. */
  sync: RemoteSyncConfig;
  /** Light wrapper providing SkillPackageManifest compliance. */
  wrapper: {
    description: string;
    docker: DockerRequirements;
    providesCapabilities?: string[];
    skills: string[];
    lifecycleStages?: LifecycleStage[];
  };
}
