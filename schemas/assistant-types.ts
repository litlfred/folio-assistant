/**
 * Assistant Framework — Schema definitions for the agent skills system.
 *
 * Defines the typed registry model: actors, capabilities, skills,
 * requirements, and their relationships. This is the **authoritative**
 * schema source; `.claude/skills/framework/types.ts` re-exports from here.
 *
 * ## Concept overview
 *
 * ```
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                        SkillRegistry                           │
 * │  (central manifest — one per repository)                       │
 * ├─────────────────────────────────────────────────────────────────┤
 * │                                                                │
 * │  ActorDefinition ──inherits──▶ ActorDefinition (DAG)           │
 * │    │                                                           │
 * │    └──capabilities──▶ CapabilityDefinition                     │
 * │                          │                                     │
 * │                          └──requires──▶ CapabilityDefinition   │
 * │                                                                │
 * │  SkillDefinition                                               │
 * │    ├──roles──▶ ActorDefinition.id                              │
 * │    ├──requiredCapabilities──▶ CapabilityDefinition.id          │
 * │    │     (with degradation: fail | warn | skip | fallback)     │
 * │    ├──dependsOn──▶ SkillDefinition | Requirement               │
 * │    └──implementation──▶ scripts, mcpServices, validators       │
 * │                                                                │
 * │  Requirement (FHIR R5–aligned)                                 │
 * │    ├──actors──▶ ActorDefinition.id                             │
 * │    └──statements[]                                             │
 * │         └──satisfiedBy──▶ Skill | Capability | Requirement     │
 * │                                                                │
 * └─────────────────────────────────────────────────────────────────┘
 * ```
 *
 * ## Relationship to FHIR R5
 *
 * The `Requirement` type mirrors the
 * [FHIR R5 Requirements](https://hl7.org/fhir/R5/requirements.html)
 * resource model: each requirement contains statements with conformance
 * verbs (SHALL/SHOULD/MAY) and `satisfiedBy` references. This enables
 * cross-repository interoperability with WHO SMART Guidelines (smart-base).
 *
 * @module assistant-types
 */

// ---------------------------------------------------------------------------
// Actors
// ---------------------------------------------------------------------------

/**
 * Whether the actor is a human user or a system process.
 *
 * - `person` — A human with an identity (git config, OAuth, etc.)
 * - `system` — An automated process (MCP server, CI runner, etc.)
 */
export type ActorType = "person" | "system";

/**
 * FHIR conformance verbs for requirement statements.
 *
 * | Verb | Meaning |
 * |------|---------|
 * | `SHALL` | Absolute requirement |
 * | `SHOULD` | Recommended |
 * | `MAY` | Optional |
 * | `SHALL NOT` | Absolute prohibition |
 */
export type Conformance = "SHALL" | "SHOULD" | "MAY" | "SHALL NOT";

/**
 * An actor represents a role or persona in the system.
 *
 * Actors form a **directed acyclic graph** via `inherits` — a collaborator
 * inherits all reader capabilities, an owner inherits all collaborator
 * capabilities, etc.
 *
 * @example
 * ```ts
 * const collaborator: ActorDefinition = {
 *   id: "collaborator",
 *   name: "Collaborator",
 *   type: "person",
 *   description: "Authenticated via GitHub OAuth",
 *   inherits: ["reader"],
 *   capabilities: ["git-read", "git-push", "lean-toolchain"],
 * };
 * ```
 */
export interface ActorDefinition {
  /** Unique identifier (used as reference key). */
  id: string;
  /** Human-readable name. */
  name: string;
  /** Person or system actor. */
  type: ActorType;
  /** What this actor can do. */
  description: string;
  /** Actor IDs this role inherits from (DAG — no cycles). */
  inherits: string[];
  /** Capability IDs directly granted to this actor. */
  capabilities: string[];
  /** Arbitrary metadata (e.g., MCP endpoint, config path). */
  meta?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Capabilities
// ---------------------------------------------------------------------------

/**
 * How to detect whether a capability is available at runtime.
 *
 * | Method | Check |
 * |--------|-------|
 * | `command` | Run a shell command, check exit code |
 * | `env-var` | Check if an environment variable is set |
 * | `file-exists` | Check if a file/directory exists |
 * | `mcp-probe` | HTTP health check against an MCP endpoint |
 * | `always` | Capability is always available |
 */
export type CapabilityDetection =
  | { method: "command"; command: string; expectExitCode?: number }
  | { method: "env-var"; variable: string }
  | { method: "file-exists"; path: string }
  | { method: "mcp-probe"; endpoint: string; healthPath?: string }
  | { method: "always" };

/**
 * A concrete capability that can be probed at session start.
 *
 * Capabilities represent environmental prerequisites: is Lean installed?
 * Is the MCP server reachable? Can we push to git?
 *
 * @example
 * ```ts
 * const leanToolchain: CapabilityDefinition = {
 *   id: "lean-toolchain",
 *   name: "Lean 4 Toolchain",
 *   description: "Lean 4 compiler and Lake build system",
 *   detection: { method: "command", command: "lean --version" },
 * };
 * ```
 */
export interface CapabilityDefinition {
  id: string;
  name: string;
  description: string;
  /** How to detect this capability at runtime. */
  detection: CapabilityDetection;
  /** Other capability IDs this one depends on. */
  requires?: string[];
}

// ---------------------------------------------------------------------------
// Skills
// ---------------------------------------------------------------------------

/**
 * A reference from a skill to a required capability, with a
 * degradation strategy when the capability is unavailable.
 *
 * | Strategy | Behavior |
 * |----------|----------|
 * | `fail` | Skill cannot execute — abort with error |
 * | `warn` | Log a warning but continue |
 * | `skip` | Silently skip this skill |
 * | `fallback` | Use `fallbackCapabilityId` instead |
 */
export interface SkillCapabilityRef {
  /** The capability this skill needs. */
  capabilityId: string;
  /** What to do when the capability is unavailable. */
  degradation: "fail" | "warn" | "skip" | "fallback";
  /** Alternative capability to use in fallback mode. */
  fallbackCapabilityId?: string;
}

/**
 * A dependency from one skill to another skill or requirement.
 */
export interface SkillDependency {
  /** Target skill ID or requirement ID. */
  ref: string;
  /** Whether the dependency is on a skill or a requirement. */
  kind: "skill" | "requirement";
  /** How strongly this dependency is required. */
  conformance: Conformance;
}

/**
 * A script that a skill can execute at different lifecycle phases.
 */
export interface SkillScript {
  /** Path to the script (relative to repo root). */
  path: string;
  /** Script runtime. */
  runtime: "bash" | "python" | "typescript" | "bun";
  /** When in the skill lifecycle to run this script. */
  phase: "pre" | "execute" | "validate" | "post";
  /** Additional CLI arguments. */
  args?: string[];
}

/**
 * A validator that checks skill output correctness.
 */
export interface SkillValidator {
  id: string;
  /** Path to the validator script. */
  path: string;
  runtime: "bash" | "python" | "typescript" | "bun";
  /** What scope this validator checks. */
  scope: "file" | "block" | "chapter" | "project";
}

/**
 * Reference to a schema type that this skill operates on.
 *
 * Links a skill to the TypeScript/Zod schemas it reads or writes,
 * enabling auto-generated documentation to cross-reference skills
 * with their data models.
 */
export interface SkillSchemaRef {
  /** Schema module (e.g., "schemas/types", "schemas/formalization-types"). */
  module: string;
  /** Type name(s) within the module. */
  types: string[];
  /** Whether this skill reads or writes these types. */
  access: "read" | "write" | "read-write";
}

/**
 * A skill is a named unit of agent capability with role-based access
 * control, capability requirements, and optional script implementations.
 *
 * Each skill has a companion `.md` file (agent instructions) and a
 * `.ts` file (structured metadata). The `.md` is for the agent to read;
 * the `.ts` is for programmatic registry, routing, and validation.
 *
 * @example
 * ```ts
 * const formalizer: SkillDefinition = {
 *   id: "formalizer",
 *   name: "Formalizer",
 *   description: "Lean proof generation and sorry-removal",
 *   roles: ["collaborator", "owner"],
 *   requiredCapabilities: [
 *     { capabilityId: "lean-toolchain", degradation: "fallback",
 *       fallbackCapabilityId: "lean-mcp" },
 *   ],
 *   mcpServices: ["lean-lsp"],
 *   schemas: [
 *     { module: "schemas/types", types: ["Block", "LeanRef"],
 *       access: "read-write" },
 *   ],
 * };
 * ```
 */
export interface SkillDefinition {
  /** Unique skill identifier. */
  id: string;
  /** Human-readable name. */
  name: string;
  /** What this skill does. */
  description: string;
  /** Actor IDs (roles) that may invoke this skill. */
  roles: string[];
  /** Capabilities this skill needs to function. */
  requiredCapabilities: SkillCapabilityRef[];
  /** Dependencies on other skills or requirements. */
  dependsOn?: SkillDependency[];
  /** Tools the agent is allowed to use when this skill is active. */
  allowedTools?: string[];
  /** Scripts executed during skill lifecycle phases. */
  scripts?: SkillScript[];
  /** MCP service names this skill interacts with. */
  mcpServices?: string[];
  /** Validators that check skill output. */
  validators?: SkillValidator[];
  /** Regex patterns for routing user requests to this skill. */
  routingPatterns?: string[];
  /** Searchable tags. */
  tags?: string[];
  /** External package this skill belongs to (undefined = local). */
  package?: string;
  /** Schema types this skill reads/writes — for doc cross-referencing. */
  schemas?: SkillSchemaRef[];
}

// ---------------------------------------------------------------------------
// Requirements (FHIR R5–aligned)
// ---------------------------------------------------------------------------

/**
 * A reference to what satisfies a requirement statement.
 *
 * Mirrors FHIR R5 `Requirements.statement.satisfiedBy`.
 */
export interface SatisfiedByRef {
  /** What kind of thing satisfies this statement. */
  kind: "skill" | "capability" | "requirement-statement";
  /** ID of the satisfying skill, capability, or requirement-statement key. */
  ref: string;
}

/**
 * A single testable statement within a requirement.
 *
 * Each statement has a conformance verb (SHALL/SHOULD/MAY) and
 * optional `satisfiedBy` references that trace to skills, capabilities,
 * or other requirement statements.
 *
 * @example
 * ```ts
 * {
 *   key: "REQ-SS-1",
 *   label: "Identity detection",
 *   conformance: "SHALL",
 *   requirement: "Detect user identity via git config or OAuth",
 *   satisfiedBy: [{ kind: "capability", ref: "git-read" }],
 * }
 * ```
 */
export interface RequirementStatement {
  /** Unique key within this requirement (e.g., "REQ-SS-1"). */
  key: string;
  /** Short human-readable label. */
  label: string;
  /** FHIR conformance verb. */
  conformance: Conformance;
  /** Full requirement text. */
  requirement: string;
  /** Actors this statement applies to (defaults to parent's actors). */
  actors?: string[];
  /** What satisfies this statement. */
  satisfiedBy?: SatisfiedByRef[];
  /** Keys of other statements this one depends on. */
  dependsOn?: string[];
}

/**
 * A requirement is a group of related testable statements that
 * constrain workflow behavior.
 *
 * Modeled after the
 * [FHIR R5 Requirements resource](https://hl7.org/fhir/R5/requirements.html):
 * each requirement has actors, statements with conformance verbs,
 * and traceability via `satisfiedBy` and `derivedFrom`.
 *
 * @example
 * ```ts
 * const sorryCitation: Requirement = {
 *   id: "req-sorry-citation",
 *   title: "Sorry Citation Requirement",
 *   description: "Every sorry must have a bibliographic citation",
 *   actors: ["collaborator", "owner"],
 *   statements: [{
 *     key: "REQ-SC-1",
 *     conformance: "SHALL",
 *     requirement: "sorry preceded by -- Ref: [key] <url>",
 *     satisfiedBy: [{ kind: "skill", ref: "formalizer" }],
 *   }],
 * };
 * ```
 */
export interface Requirement {
  /** Unique requirement identifier. */
  id: string;
  /** Human-readable title. */
  title: string;
  /** What this requirement governs. */
  description: string;
  /** IDs of requirements this one derives from. */
  derivedFrom?: string[];
  /** Actor IDs this requirement applies to. */
  actors: string[];
  /** Testable statements within this requirement. */
  statements: RequirementStatement[];
  /** Searchable tags. */
  tags?: string[];
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

/**
 * Reference to an external skill package synced into `.claude/skills/<name>/`.
 */
export interface SkillPackageRef {
  /** Package name (matches directory under `.claude/skills/`). */
  name: string;
  /** Source repository (e.g., "K-Dense-AI/claude-scientific-skills"). */
  repo: string;
  /** Path within the source repo. */
  path: string;
  /** Git ref to sync from (commit hash preferred). */
  ref: string;
  /** Skill IDs provided by this package. */
  skills: string[];
  /** Path to the package's `PackageManifest` for Docker deps. */
  manifestPath?: string;
}

/**
 * A lifecycle hook that runs shell commands on specific events.
 */
export interface SessionHook {
  /** The event that triggers this hook. */
  event:
    | "SessionStart"
    | "PostToolUse"
    | "PreCommit"
    | "PostCommit"
    | "UserPromptSubmit";
  /** Tool name regex matcher (for PostToolUse). */
  matcher?: string;
  /** Commands to execute when the event fires. */
  commands: HookCommand[];
}

/**
 * A single command within a session hook.
 */
export interface HookCommand {
  type: "command";
  /** Shell command to execute. */
  command: string;
  /** Timeout in seconds. */
  timeout?: number;
}

/**
 * Maps a user identity pattern to an actor (role assignment).
 *
 * Evaluated in priority order (highest first). The first matching
 * rule determines the user's actor.
 */
export interface RoleAssignment {
  /** Glob pattern matched against the user identifier. */
  userPattern: string;
  /** How the user's identity was determined. */
  identitySource:
    | "git-config"
    | "github-oauth"
    | "google-oauth"
    | "env-var"
    | "bearer-token"
    | "default";
  /** Actor ID to assign. */
  actorId: string;
  /** Higher priority wins. */
  priority: number;
}

/**
 * The top-level registry: one per repository.
 *
 * Aggregates all actors, capabilities, skills, requirements, external
 * packages, and lifecycle hooks into a single typed manifest.
 *
 * The registry is the **root object** for the assistant framework.
 * It is defined in TypeScript (`.claude/skills/registry.ts`) and can
 * be serialized to JSON (`registry.json`) for tooling consumption.
 */
export interface SkillRegistry {
  /** Schema version for forward compatibility. */
  schemaVersion: "1.0";
  /** Repository identifier (e.g., "litlfred/qou"). */
  repository: string;
  /** All actor/role definitions. */
  actors: ActorDefinition[];
  /** All capability definitions. */
  capabilities: CapabilityDefinition[];
  /** All skill definitions (local + packaged). */
  skills: SkillDefinition[];
  /** All workflow requirements. */
  requirements: Requirement[];
  /** External skill package references. */
  packages: SkillPackageRef[];
  /** Lifecycle hooks. */
  hooks: SessionHook[];
  /** Identity-source → actor mapping rules, evaluated by priority (highest first). */
  roleAssignments: RoleAssignment[];
}
