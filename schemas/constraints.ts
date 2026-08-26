/**
 * @module @folio-assistant/schemas/constraints
 * @description Zod validation schemas for all framework types.
 *
 * These schemas provide runtime validation and are used by the
 * schema generation scripts to produce JSON Schema files.
 */

import { z } from "zod";

import { LEAN_REF_PATTERN, leanPackageByName, parseLeanRef } from "./lean-packages.js";
import type { Block } from "./types.js";
// Leaf module — importing the kind list from `types.js` would be a runtime
// cycle, and `appliesTo` is built at module init, exactly when that bites.
import { BLOCK_KINDS, DAK_LABEL_PREFIXES } from "./block-kinds.js";


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



/**
 * Every recognised label prefix, with its colon.
 *
 * The paper and structural prefixes are written out; the `dak` adapter's are
 * derived from `DAK_LABEL_PREFIXES` so that this list and `KIND_PREFIXES` in
 * `jsonld.ts` cannot drift as kinds are added. Their agreement is asserted by
 * `assertPrefixesInSync`.
 */
export const KNOWN_LABEL_PREFIXES: readonly string[] = [
  "def:", "thm:", "lem:", "prop:", "cor:", "rem:", "ex:", "conj:",
  "prf:", "sim:", "eq:", "fig:", "tbl:",
  "sec:", "chap:", "app:", "bib:",
  ...Object.values(DAK_LABEL_PREFIXES).map((p) => `${p}:`),
];

export function isCrossPaperRef(label: string): boolean {
  return label.includes(":") && !KNOWN_LABEL_PREFIXES.some(p => label.startsWith(p));
}

// ── Label patterns ───────────────────────────────────────────────

/** Label prefix must match object kind. */
const LABEL_PREFIXES: Record<string, string> = {
  definition: "def:",
  theorem: "thm:",
  lemma: "lem:",
  proposition: "prop:",
  corollary: "cor:",
  algorithm: "alg:",
  conjecture: "conj:",
  example: "ex:",
  remark: "rem:",
  proof: "prf:",
  simulator: "sim:",
  equation: "eq:",
  diagram: "fig:",
  table: "tbl:",
};

/**
 * Provable-label prefixes — used by AlgorithmSchema to enforce that
 * every `algorithm` block cites at least one upstream provable in
 * `uses[]`. Algorithms are downstream of math: an algorithm without
 * a citation to a definition / proposition / theorem / lemma /
 * corollary / conjecture cannot be justified.
 */
const PROVABLE_LABEL_PREFIXES = [
  "def:",
  "prop:",
  "thm:",
  "lem:",
  "cor:",
  "conj:",
] as const;

function labelForKind(kind: string) {
  const prefix = LABEL_PREFIXES[kind];
  if (!prefix) return z.string().min(1);
  return z.string().startsWith(prefix, {
    message: `Label for ${kind} must start with "${prefix}"`,
  });
}

// ── Lean reference ───────────────────────────────────────────────

const LeanValidationSchema = z.enum([
  "not_checked", "stub", "trivial", "external", "validated", "error",
  "leanok",        // sorry-free, built successfully
  "axioms_only",   // type-checks but uses axioms (no sorry)
]);

export const LeanRefSchema = z.object({
  ref: z
    .string()
    .min(1, "Lean ref is required")
    .regex(
      LEAN_REF_PATTERN,
      // Error message doubles as migration guidance for agents
      // rebasing across the `lean.decl` → `lean.ref` URI change.
      "Lean ref must be \"<package>:<Decl.Path>\" (e.g. \"qou:QOU.Foo\"). " +
        "If this branch still uses the legacy { decl, file } shape, " +
        "run `cd content && bun run migrate-lean-refs` to convert it.",
    ),
  sorryFree: z.boolean().optional(),
  mathlibLinks: z.array(z.string()).optional(),
  validation: LeanValidationSchema.optional(),
  leanHash: z.string().optional(),
  witnessed: z.boolean().optional(),
});

// ── Companions ───────────────────────────────────────────────────

export const CompanionsSchema = z.record(z.string(), z.string().optional());

// ── Todo schema ──────────────────────────────────────────────

export const TodoItemSchema = z.object({
  id: z.string().min(1),
  summary: z.string().min(1),
  comment: z.string(),
  status: z.enum(["open", "in_progress", "blocked", "resolved", "wontfix"]),
  priority: z.enum(["critical", "high", "medium", "low"]),
  origin: z.enum(["agent", "human", "qc", "extracted"]),
  targetLabel: z.string().optional(),
  assignee: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
  updatedBy: z.string().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
  related: z.array(z.string()).optional(),
});

// ── Feedback schema ──────────────────────────────────────────

export const FeedbackItemSchema = TodoItemSchema.extend({
  author: z.string().optional(),
  authorEmail: z.string().optional(),
});

// ── Block schemas ────────────────────────────────────────────────

const RenderedAssetSchema = z.object({
  mime: z.string(),
  url: z.string(),
  blockIndex: z.number().int().nonnegative(),
  hash: z.string().optional(),
});

const SimulatorRefSchema = z.object({
  ref: z.string().startsWith("sim:", { message: "Simulator ref must start with 'sim:'" }),
  view: z.string().optional(),
});

const SimulatorViewSchema = z.object({
  name: z.string().min(1),
  title: z.string().optional(),
  params: z.record(z.string(), z.union([z.number(), z.string(), z.boolean()])),
});

/**
 * Author-tracking notes attached to a content block (see
 * `BlockBase.authorNotes` in folio-assistant/schemas/types.ts +
 * CLAUDE.md §4d). Validates the shape of `authorNotes` entries
 * with the 5 allowed `kind` values.
 */
export const AuthorNoteSchema = z.object({
  kind: z.enum(["status", "caveat", "note", "refined-framing", "deprecated"]),
  date: z.string().optional(),
  body: z.string(),
  see: z.string().optional(),
});

/**
 * Shared block fields, exported so the `dak` adapter's schemas in
 * `dak-blocks.ts` extend the same base rather than restating it.
 */
export const BlockBaseSchema = z.object({
  title: z.string().optional(),
  uses: z.array(z.string()).optional(),
  foreshadows: z.array(z.string()).optional(),
  cites: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  companions: CompanionsSchema.optional(),
  rendered: z.array(RenderedAssetSchema).optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
  simulator: SimulatorRefSchema.optional(),
  authorNotes: z.array(AuthorNoteSchema).optional(),
  /**
   * Glossary term slugs introduced by this block. See `BlockBase.defines`
   * in folio-assistant/schemas/types.ts for the authoring contract. Slugs
   * must be lowercase, hyphen-separated identifiers (no spaces, no `:`).
   */
  defines: z
    .array(z.string().regex(/^[a-z0-9][a-z0-9-]*$/, "term slug must be lowercase, hyphen-separated"))
    .optional(),
  // Forward reference: ComputationSchema is declared further down in the
  // same module.  z.lazy keeps the cyclic reference safe.
  computation: z.lazy(() => ComputationSchema).optional(),
});

export const DefinitionSchema = BlockBaseSchema.extend({
  kind: z.literal("definition"),
  label: labelForKind("definition"),
  lean: LeanRefSchema,
  examples: z.array(z.string()).optional(),
});

const ProvableBaseSchema = BlockBaseSchema.extend({
  // TS `ProvableBase` declares `lean?: LeanRef`; only `DefinitionSchema`
  // declared it here, so a theorem / lemma / proposition / corollary /
  // algorithm writing `lean: { ref: … }` had it SILENTLY STRIPPED at the
  // validation boundary — the link into Lean, on exactly the kinds whose
  // whole point is to carry one. Optional, matching TS: `DefinitionSchema`
  // keeps its own required override.
  lean: LeanRefSchema.optional(),
  proofs: z.array(z.string()).optional(),
  examples: z.array(z.string()).optional(),
});

export const TheoremSchema = ProvableBaseSchema.extend({
  kind: z.literal("theorem"),
  label: labelForKind("theorem"),
});

export const LemmaSchema = ProvableBaseSchema.extend({
  kind: z.literal("lemma"),
  label: labelForKind("lemma"),
});

export const PropositionSchema = ProvableBaseSchema.extend({
  kind: z.literal("proposition"),
  label: labelForKind("proposition"),
});

export const CorollarySchema = ProvableBaseSchema.extend({
  kind: z.literal("corollary"),
  label: labelForKind("corollary"),
});

/**
 * Algorithm — specialised proposition, must cite at least one
 * upstream provable in `uses[]`. The "downstream of math"
 * invariant is enforced by `BlockSchema.superRefine` below (kept
 * out of the per-kind schema so the discriminated union sees a
 * ZodObject, which is required by `z.discriminatedUnion`).
 */
export const AlgorithmSchema = ProvableBaseSchema.extend({
  kind: z.literal("algorithm"),
  label: labelForKind("algorithm"),
  // Forward reference: ComputationSchema is declared further down in
  // the same module (mirrors BlockBaseSchema's `computation` field).
  computation: z.lazy(() => ComputationSchema).optional(),
  interprets: z.string().min(1).optional(),
});

/**
 * Returns true iff at least one entry in `uses` references a
 * provable block — accepts both same-paper labels (e.g.
 * `"prop:foo"`) and cross-paper qualified labels (e.g.
 * `"unital-groebner-bases:thm:bar"`).
 */
export function citesProvable(uses: string[] | undefined): boolean {
  if (!uses || uses.length === 0) return false;
  return uses.some((u) => {
    if (u.startsWith("http")) return false;
    return PROVABLE_LABEL_PREFIXES.some((prefix) => {
      // Accept same-paper labels ("prop:foo") and any cross-paper /
      // namespaced qualifier ("paper-dir:prop:foo",
      // "namespace:paper-dir:prop:foo"). Per Gemini review on
      // PR #1724: scan for the prefix anywhere after a colon, not
      // just after the first colon, to handle nested namespaces.
      return u.startsWith(prefix) || u.includes(":" + prefix);
    });
  });
}

export const ConjectureSchema = BlockBaseSchema.extend({
  kind: z.literal("conjecture"),
  label: labelForKind("conjecture"),
  lean: LeanRefSchema.optional(),
});

export const ExampleSchema = BlockBaseSchema.extend({
  kind: z.literal("example"),
  label: labelForKind("example"),
  /** Label of the provable block this example interprets. Declared on TS
   *  `ExampleBlock` and missing here, unlike its `algorithm` and `remark`
   *  siblings — so it was silently stripped. `.min(1)` matches theirs. */
  interprets: z.string().min(1).optional(),
  lean: LeanRefSchema.optional(),
});

export const RemarkSchema = BlockBaseSchema.extend({
  kind: z.literal("remark"),
  label: labelForKind("remark"),
  lean: LeanRefSchema.optional(),
  /** Label of the provable block this remark interprets. */
  interprets: z.string().min(1).optional(),
});

// Keep in sync with the `ComputationEngine` union in `types.ts`.
const ComputationEngineSchema = z.enum([
  "snappea", "sympy", "mpmath", "sage", "python", "numpy", "scipy",
  "closed-form", "python+mpmath", "python+numpy+cvxpy",
  "rust", "python+rust",
]);

const ComputationStatusSchema = z.enum([
  "not_run", "verified", "failed", "error", "stale", "experimental",
]);

export const ComputationSchema = z.object({
  engine: ComputationEngineSchema,
  script: z.string().min(1, "Script path is required"),
  witness: z.union([z.string(), z.array(z.string()).min(1)]).optional(),
  status: ComputationStatusSchema,
  requires: z.array(z.string()).optional(),
});

export const ProofSchema = BlockBaseSchema.extend({
  kind: z.literal("proof"),
  label: labelForKind("proof"),
  // The canonical reverse link to the provable this proof establishes
  // (`ProvableBase.proofs[]` is the forward one). Declared on TS
  // `ProofBlock`, missing here — so it was silently stripped. Eight proof
  // blocks in qou carry it.
  of: z.string().optional(),
  lean: LeanRefSchema.optional(),
  computation: ComputationSchema.optional(),
});

export const SimulatorSchema = BlockBaseSchema.extend({
  kind: z.literal("simulator"),
  label: labelForKind("simulator"),
  html: z.string().min(1, "Path to simulator HTML file is required"),
  defaultView: SimulatorViewSchema,
  views: z.array(SimulatorViewSchema).optional(),
});

export const ProseSchema = z.object({
  kind: z.literal("prose"),
  label: z.string().optional(),
  title: z.string().optional(),
  cites: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  uses: z.array(z.string()).optional(),
  foreshadows: z.array(z.string()).optional(),
  companions: CompanionsSchema.optional(),
  rendered: z.array(RenderedAssetSchema).optional(),
  meta: z.record(z.string(), z.unknown()).optional(),

});

export const EquationSchema = z.object({
  kind: z.literal("equation"),
  label: labelForKind("equation").optional(),
  title: z.string().optional(),
  tex: z.string().optional(),
  tags: z.array(z.string()).optional(),
  uses: z.array(z.string()).optional(),
  foreshadows: z.array(z.string()).optional(),
  companions: CompanionsSchema.optional(),
  rendered: z.array(RenderedAssetSchema).optional(),
  meta: z.record(z.string(), z.unknown()).optional(),

});

export const DiagramSchema = z.object({
  kind: z.literal("diagram"),
  label: labelForKind("diagram").optional(),
  title: z.string().optional(),
  tex: z.string().optional(),
  caption: z.string().optional(),
  tags: z.array(z.string()).optional(),
  uses: z.array(z.string()).optional(),
  foreshadows: z.array(z.string()).optional(),
  companions: CompanionsSchema.optional(),
  rendered: z.array(RenderedAssetSchema).optional(),
  meta: z.record(z.string(), z.unknown()).optional(),

});

export const TableSchema = z.object({
  kind: z.literal("table"),
  label: labelForKind("table").optional(),
  tex: z.string().optional(),
  caption: z.string().optional(),
  title: z.string().optional(),
  tags: z.array(z.string()).optional(),
  uses: z.array(z.string()).optional(),
  foreshadows: z.array(z.string()).optional(),
  computation: ComputationSchema.optional(),
  companions: CompanionsSchema.optional(),
  rendered: z.array(RenderedAssetSchema).optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

/** Discriminated union — validates any Block. */
export const BlockSchema = z
  .discriminatedUnion("kind", [
    DefinitionSchema,
    TheoremSchema,
    LemmaSchema,
    PropositionSchema,
    CorollarySchema,
    AlgorithmSchema,
    ConjectureSchema,
    ExampleSchema,
    RemarkSchema,
    ProofSchema,
    SimulatorSchema,
    ProseSchema,
    EquationSchema,
    DiagramSchema,
    TableSchema,
  ])
  .superRefine((block, ctx) => {
    // Cross-kind invariant: an `algorithm` block must cite at least
    // one upstream provable in `uses[]` (algorithms are downstream
    // of math). Encoded here rather than inside `AlgorithmSchema`
    // so the discriminated union still sees ZodObjects.
    if (block.kind === "algorithm" && !citesProvable(block.uses)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["uses"],
        message:
          "An `algorithm` block must cite at least one provable " +
          "(def:/prop:/thm:/lem:/cor:/conj:) in `uses[]` — " +
          "algorithms are downstream of math.",
      });
    }
  });

// ── Chapter / Document schemas ───────────────────────────────────

export const SectionSchema = z.object({
  title: z.string().min(1),
  label: z.string().optional(),
  blocks: z.array(z.string().min(1)),
}).passthrough();

export const SectionRefSchema = z.object({
  name: z.string().min(1),
  uri: z.string().optional(),
});

export const ChapterSchema = z.object({
  number: z.number().int().positive().optional(),
  tabLabel: z.string().max(3).optional(),
  title: z.string().min(1),
  label: z.string().optional(),
  sections: z.array(z.union([SectionSchema, SectionRefSchema])),
  meta: z.record(z.string(), z.unknown()).optional(),

});

export const ChapterRefSchema = z.object({
  uri: z.string().optional(),
  dir: z.string().min(1),
  partTitle: z.string().trim().min(1).optional(),
});

const PaperMacroSchema = z.object({
  tex: z.string().min(1),
  unicode: z.string().optional(),
});

export const PaperSchema = z.object({
  title: z.string().min(1),
  authors: z.array(z.string().min(1)).min(1),
  affiliations: z.array(z.string()).optional(),
  emails: z.array(z.string().email()).optional(),
  urls: z.array(z.string().url()).optional(),
  date: z.string().optional(),
  abstract: z.string().optional(),
  chapters: z.array(ChapterRefSchema),
  macros: z.record(z.string(), PaperMacroSchema).optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

/** @deprecated Use PaperSchema. */
export const DocumentSchema = z.object({
  title: z.string().min(1),
  authors: z.array(z.string().min(1)).min(1),
  date: z.string().optional(),
  chapters: z.array(ChapterSchema),
  meta: z.record(z.string(), z.unknown()).optional(),
});

// ── Folio schemas ─────────────────────────────────────────────

export const PaperRefSchema = z.object({
  dir: z.string().min(1),
  title: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const FolioSchema = z.object({
  title: z.string().min(1),
  papers: z.array(PaperRefSchema).min(1),
  meta: z.record(z.string(), z.unknown()).optional(),
});

// ── Constraint rules (beyond schema shape) ───────────────────────

export interface ConstraintRule {
  id: string;
  description: string;
  /** Which block kinds this rule applies to. */
  appliesTo: string[];
  /** Check function — returns error message or null. */
  check: (block: Block, context: ConstraintContext) => string | null;
}

export interface ConstraintContext {
  /** Root name of the .ts file. */
  rootName: string;
  /** Directory containing the object files. */
  dir: string;
  /** Set of all labels in the document (for cross-ref validation). */
  allLabels: Set<string>;
  /** Set of all bibliography keys (for citation validation). */
  allRefIds?: Set<string>;
  /** File existence checker. */
  fileExists: (path: string) => boolean;
  /** Basename lookup under a Lake package root (for lean.ref fallback). */
  lakeTreeContainsBasename?: (lakeRoot: string, basename: string) => boolean;
  /** Markdown content of the companion .md file (for cross-ref scanning). */
  mdContent?: string;
  /** Lean sibling stub content (for §3b-cond kind-check), if the file exists. */
  leanContent?: string;
}

/**
 * Built-in constraint rules.
 *
 * Pipeline runs these after Zod schema validation.
 * Add custom rules by appending to this array.
 */
export const CONSTRAINT_RULES: ConstraintRule[] = [
  {
    id: "foreshadows-resolve",
    description:
      "All labels in foreshadows[] must exist in the document (or be " +
      "qualified cross-paper refs)",
    // Universal: any block that can carry `uses[]` can carry a foreshadow, so
    // this must not narrow as new kinds appear.
    appliesTo: [...BLOCK_KINDS],
    // Replaces `foreshadows-subset-of-uses` (removed 2026-08-10, owner
    // ruling). That rule required every foreshadow to also appear in `uses[]`,
    // which made the field an ANNOTATION ON an edge and nothing more. It
    // therefore could not express the case it was most wanted for: a chapter
    // overview (§0) naming results it previews but does not depend on. Under
    // the old rule, recording such a pointer meant first asserting a
    // dependency that is not real — see the eight `overview-source` rows in
    // qou's `docs/audits/uses-edge-rejections.json`.
    //
    // `foreshadows[]` is now INDEPENDENT of `uses[]`. An entry may be:
    //   - also in `uses[]` → a real prerequisite the paper states later on
    //     purpose ("we will need X, proved in chapter 9"). Exempt from the
    //     ordering-COST metrics; still counted for cycles, cones and depth.
    //   - not in `uses[]` → a pure forward pointer. Never enters the
    //     dependency graph at all, so it is zero-cost by construction.
    //
    // The old rule was also carrying referential integrity: it caught a
    // foreshadow whose target had been renamed or deleted, because `uses[]`
    // validation rejected the same label. With the subset requirement gone
    // that protection would vanish too, so this rule takes it over directly.
    // Same reference forms as `uses-resolve`.
    check: (block, ctx) => {
      const fs = (block as { foreshadows?: string[] }).foreshadows;
      if (!fs?.length) return null;
      const missing = fs.filter((f: string) => {
        // Cross-paper qualified ref ("paper-dir:label") — resolved at folio
        // level, not here. Mirrors uses-resolve.
        if (/^([a-z0-9-]+):([a-z]+:.+)$/.test(f)) return false;
        if (f.startsWith("https://") || f.startsWith("http://")) return false;
        return !ctx.allLabels.has(f);
      });
      return missing.length === 0 ? null
        : `Unresolved foreshadows: ${missing.join(", ")}`;
    },
  },
  {
    id: "foreshadows-not-self",
    description: "A block may not foreshadow itself",
    appliesTo: [...BLOCK_KINDS],
    // Cheap, but worth stating: with the subset rule gone nothing else
    // rejects it. A self-reference would be silently zero-cost and would read
    // as a deliberate pointer.
    check: (block) => {
      const fs = (block as { foreshadows?: string[] }).foreshadows;
      if (!fs?.length) return null;
      const self = (block as { label?: string }).label;
      if (!self) return null;
      return fs.includes(self)
        ? `foreshadows[] contains the block's own label: ${self}`
        : null;
    },
  },
  {
    id: "md-exists",
    description: "Every block must have a companion .md file",
    appliesTo: [
      "definition", "theorem", "lemma", "proposition", "corollary",
      "conjecture", "example", "remark", "simulator", "prose",
    ],
    check: (_block, ctx) => {
      const mdPath = `${ctx.dir}/${ctx.rootName}.md`;
      return ctx.fileExists(mdPath) ? null : `Missing companion: ${mdPath}`;
    },
  },
  {
    id: "lean-file-exists",
    description: "Definitions must have a Lean formalization: sibling .lean OR a resolvable Lake-tree file via lean.ref",
    appliesTo: ["definition"],
    check: (block, ctx) => {
      const siblingPath = `${ctx.dir}/${ctx.rootName}.lean`;
      if (ctx.fileExists(siblingPath)) return null;

      // Per CLAUDE.md §0a, the resolver chain is:
      // (1) sibling <rootName>.lean — checked above,
      // (2) <lakeRoot>/<module-as-path>.lean under the package's Lake root
      //     (when the Lean module path matches the lean.ref decl prefix), or
      // (3) any <name>.lean under <lakeRoot>/ that matches the parsed ref's
      //     bare declaration name (covers the cluster-migration case where
      //     the module path was renamed but the lean.ref decl was kept —
      //     e.g. lean.ref qou:QOU.Braiding.HeckeMassElement points at
      //     lean/QOU/Torsion/HeckeMassElement.lean per the wire-in note).
      const ref = (block as { lean?: { ref?: string } }).lean?.ref;
      if (ref) {
        try {
          const parsed = parseLeanRef(ref);
          const pkg = leanPackageByName(parsed.package);
          if (pkg) {
            // (2) Direct module-path resolution.
            const modulePath = parsed.module.replace(/\./g, "/");
            if (ctx.fileExists(`${pkg.lakeRoot}/${modulePath}.lean`)) return null;
            // (3) Basename fallback under the lake tree.
            if (ctx.lakeTreeContainsBasename?.(pkg.lakeRoot, `${parsed.name}.lean`)) {
              return null;
            }
          }
        } catch {
          // parseLeanRef threw — fall through to the failure message.
        }
      }

      return `Definition "${block.label}" requires Lean formalization. Expected sibling file: ${siblingPath}` +
        (ref ? ` (or Lake-tree resolution from lean.ref "${ref}")` : "");
    },
  },
  {
    id: "simulator-html-exists",
    description: "Simulators must have a companion .html file",
    appliesTo: ["simulator"],
    check: (block, _ctx) => {
      if ("html" in block && block.html) return null;
      return `Simulator "${block.label}" requires an html field pointing to the simulator HTML file`;
    },
  },
  {
    id: "simulator-ref-resolve",
    description: "Blocks with simulator refs must reference an existing simulator label",
    appliesTo: [
      // `simulator` is a BlockBase field, so ANY kind can carry one. The
      // check below returns null when the field is absent, so listing
      // fewer kinds only creates blind spots — `validate.ts` skips an
      // unlisted kind without a word.
      ...BLOCK_KINDS,
    ],
    check: (block, ctx) => {
      if (!("simulator" in block) || !block.simulator) return null;
      const ref = (block.simulator as { ref: string }).ref;
      if (!ctx.allLabels.has(ref)) {
        return `Simulator ref "${ref}" not found in document labels`;
      }
      return null;
    },
  },
  {
    id: "uses-resolve",
    description: "All labels in uses[] must exist in the document (or be qualified cross-paper refs)",
    appliesTo: [
      "definition", "theorem", "lemma", "proposition", "corollary",
      "conjecture", "example", "remark", "simulator",
      "algorithm", "proof", "prose", "equation", "diagram", "table",
    ],
    check: (block, ctx) => {
      if (!("uses" in block) || !block.uses) return null;
      const missing = block.uses.filter((u: string) => {
        // An empty entry is never resolvable and must be reported as one —
        // not skipped. Ten `*-table-data` blocks in qou carry `uses: [""]`
        // beside `title: "Data table N from "`, an extraction generator that
        // failed to substitute its source label.
        if (u.trim() === "") return true;
        // Cross-paper qualified ref: "paper-dir:label" (contains exactly
        // one colon-delimited paper prefix before the label-kind prefix).
        // Pattern: non-label chars, colon, then a standard label.
        // e.g. "unital-groebner-bases:cor:pbw"
        const crossPaperMatch = u.match(/^([a-z0-9-]+):([a-z]+:.+)$/);
        if (crossPaperMatch) return false;  // skip — resolved at folio level
        // Full URL cross-folio ref
        if (u.startsWith("https://") || u.startsWith("http://")) return false;
        // Same-paper ref — must exist in allLabels
        return !ctx.allLabels.has(u);
      });
      // Quote each label: an empty entry rendered bare produced
      // "Unresolved uses: " with nothing after it, which reads as a checker
      // bug rather than as the content defect it is.
      return missing.length === 0 ? null
        : `Unresolved uses: ${missing.map((u: string) => JSON.stringify(u)).join(", ")}`;
    },
  },
  {
    id: "provable-lean-warning",
    description: "Theorems/lemmas/propositions/corollaries should have Lean (warning)",
    appliesTo: ["theorem", "lemma", "proposition", "corollary"],
    check: (block, _ctx) => {
      if ("lean" in block && block.lean) return null;
      // Return as warning-level message (prefix convention)
      return `[warning] ${block.label}: no Lean declaration yet`;
    },
  },
  {
    id: "cites-resolve",
    description: "All citation keys in cites[] must exist in references.ts",
    appliesTo: [
      // `cites` is a BlockBase field — every kind can carry one. An
      // `algorithm` or `table` block citing a key absent from
      // references.ts used to pass by never being looked at.
      ...BLOCK_KINDS,
    ],
    check: (block, ctx) => {
      if (!("cites" in block) || !block.cites || !ctx.allRefIds) return null;
      const missing = (block.cites as string[]).filter((c: string) => !ctx.allRefIds!.has(c));
      return missing.length === 0 ? null
        : `Unresolved citations: ${missing.join(", ")}`;
    },
  },
  {
    id: "remark-interprets",
    description: "Remarks should have an `interprets` field linking to a provable block, or be glossary entries",
    appliesTo: ["remark"],
    check: (block, _ctx) => {
      // Glossary remarks (Ch 8) are exempt — they wrap Mathlib types
      if ("tags" in block && Array.isArray(block.tags) && block.tags.includes("glossary")) {
        return null;
      }
      if ("interprets" in block && block.interprets) return null;
      return `[warning] ${block.label}: remark has no \`interprets\` field — dangling remark (no formal backing)`;
    },
  },
  {
    id: "interprets-resolve",
    description: "The `interprets` label must exist in the document",
    appliesTo: ["remark"],
    check: (block, ctx) => {
      if (!("interprets" in block) || !block.interprets) return null;
      const target = block.interprets as string;
      // Allow cross-paper refs
      if (target.includes(":") && !target.startsWith("rem:") && !target.startsWith("def:") &&
          !target.startsWith("thm:") && !target.startsWith("lem:") && !target.startsWith("prop:") &&
          !target.startsWith("cor:") && !target.startsWith("conj:") && !target.startsWith("ex:")) {
        return null;
      }
      if (target.startsWith("https://") || target.startsWith("http://")) return null;
      return ctx.allLabels.has(target) ? null
        : `interprets label "${target}" not found in document`;
    },
  },
  {
    id: "md-crossref-resolve",
    description: "All [text](#label) cross-references in .md content must resolve to existing labels",
    appliesTo: [
      // Guarded on `ctx.mdContent` below, so kinds without an .md are
      // already no-ops. A `proof` block's .md with a broken
      // `[text](#label)` was simply never checked.
      ...BLOCK_KINDS,
    ],
    check: (_block, ctx) => {
      if (!ctx.mdContent) return null;
      const matches = ctx.mdContent.matchAll(/\[([^\]]*)\]\(#([^)]+)\)/g);
      const missing: string[] = [];
      for (const match of matches) {
        const label = match[2];
        // Skip cross-paper references and URLs
        if (isCrossPaperRef(label)) continue;
        if (label.startsWith("https://") || label.startsWith("http://")) continue;
        if (!ctx.allLabels.has(label)) {
          missing.push(label);
        }
      }
      return missing.length === 0 ? null
        : `[warning] Undefined cross-reference(s) in .md: ${missing.join(", ")}`;
    },
  },
  {
    id: "lean-stub-conjecture-kind-check",
    description:
      "If the sibling .lean stub is a §3b-cond conjectural class axiomatisation, " +
      "the block kind must be conjecture() — not proposition()/theorem()/lemma()/corollary(). " +
      "This catches the bigbang-heatdeath / appendix-surreals pattern (PR #1496, #1519) " +
      "where the .ts declares a provable kind but the Lean side encodes the content as a " +
      "sorry-as-conjecture class instance per CLAUDE.md §3b-cond.",
    appliesTo: ["proposition", "theorem", "lemma", "corollary"],
    check: (block, ctx) => {
      if (!ctx.leanContent) return null;
      // Match the §3b-cond stub signature.  Any of these three signals
      // is sufficient on its own; the generator-emitted phrase
      // "conjectural sibling stub" is the most reliable marker.
      const signals = [
        /\bconjectural sibling stub\b/,
        /\bsorry\s*=\s*conjecture\b/,
        /\*\*CONJECTURE\.\*\*/,
      ];
      const hit = signals.find((re) => re.test(ctx.leanContent!));
      if (!hit) return null;
      return `Kind mismatch: ${block.label} declares ${block.kind}() but the ` +
        `sibling .lean stub is a §3b-cond conjectural class ` +
        `(matched: ${hit.source}). ` +
        `Demote to conjecture() and rename label prop:/thm:/lem:/cor: → conj: ` +
        `per CLAUDE.md §3b-cond. See PR #1519 commit fix(appendix): ` +
        `demote 5 propositions → conjectures for the migration pattern.`;
    },
  },
];
