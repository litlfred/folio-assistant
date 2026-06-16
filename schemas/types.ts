export { isCrossPaperRef, KNOWN_LABEL_PREFIXES } from "./constraints.js";
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


// ── Lean linkage ─────────────────────────────────────────────────

/**
 * Reference to a Lean 4 declaration, addressed by a package-qualified URI.
 *
 * Format of `ref`: `"<package>:<Decl.Path>"`, where:
 *   - `<package>` is the Lake package short-name as declared in the
 *     root `lakefile.toml` (see `lean-packages.ts`).  Examples: `qou`,
 *     `ugb`, `fred2005`.
 *   - `<Decl.Path>` is the fully qualified Lean 4 declaration
 *     (namespace + name), e.g. `QOU.Torsion.lifting_exists`.
 *
 * Examples:
 *   - `"qou:QOU.CategoricalTransferMatrix"`
 *   - `"ugb:UGB.GrobnerShirshov.Basis"`
 *   - `"fred2005:Fred2005.FormalGroups.FormalGroupLaw"`
 *
 * The pipeline resolves `ref` to a `.lean` source file by:
 *   1. Looking up the package in `LEAN_PACKAGES` (→ paper directory,
 *      Lake root).
 *   2. Falling back to the sibling `.lean` file next to the block's
 *      `.ts` / `.md` when present.
 *
 * Rationale: a single URI is addressable in JSON Schema, cross-paper
 * references, and Lake build commands without encoding filesystem
 * paths into content.
 */
export interface LeanRef {
  /**
   * Package-qualified Lean 4 declaration URI
   * (e.g. `"qou:QOU.QuantumUniverse"`).  See module docstring above
   * for grammar.  Parse with `parseLeanRef` from `lean-packages.ts`.
   */
  ref: string;
  /** Whether the declaration is sorry-free. */
  sorryFree?: boolean;
  /** Related mathlib4 declaration names. */
  mathlibLinks?: string[];
  /** Validation status of the Lean code. */
  validation?: LeanValidation;
  /**
   * SHA-256 hash (12-char hex prefix) of the .lean file content.
   * Computed at export time. Used for witness-based cache invalidation:
   * if a `<block>.lean.<hash>.witness` file exists, Lean validation
   * can be skipped.
   */
  leanHash?: string;
  /**
   * Whether a valid witness file exists for the current leanHash.
   * True = `.lean.<hash>.witness` file found, Lean build was cached.
   * Populated at export time; displayed in the viewer as a cache badge.
   */
  witnessed?: boolean;
}

/**
 * Detailed Lean validation status.
 *
 * Distinguishes between stub declarations, trivially-true lemmas,
 * externally-sourced proofs, and fully validated code.
 */
export type LeanValidation =
  | "not_checked"      // .lean file exists but not yet validated
  | "stub"             // declaration stated but body is `sorry` or `_`
  | "trivial"          // proof is `by trivial`, `by simp`, `by rfl`, etc.
  | "external"         // proof references external resource (mathlib, etc.)
  | "validated"        // built and type-checked successfully
  | "error"            // build error
  | "leanok"           // sorry-free, built successfully
  | "axioms_only";     // type-checks but uses axioms (no sorry)

// ── Computational verification ───────────────────────────────────

/**
 * Computation engine identifier.
 *
 * Each engine has a known reproducibility profile:
 * - snappea: SnapPy/snappy for hyperbolic 3-manifold volumes, Dehn filling
 * - sympy: Symbolic algebra (identities, polynomial evaluation)
 * - mpmath: Arbitrary-precision floating-point (Clausen functions, dilogarithms)
 * - sage: SageMath for number theory, algebraic geometry
 */
export type ComputationEngine =
  | "snappea"
  | "sympy"
  | "mpmath"
  | "sage"
  | "python"
  | "numpy"
  | "scipy"
  | "closed-form"
  | "python+mpmath"
  | "python+numpy+cvxpy";

/**
 * Status of a computational verification.
 */
export type ComputationStatus =
  | "not_run"       // script exists but has not been executed
  | "verified"      // script ran, witness matches expected values within tolerance
  | "failed"        // script ran, witness does NOT match expected values
  | "error"         // script crashed or could not run
  | "stale"         // witness exists but is older than script or inputs
  | "experimental"; // exploratory probe, not yet validated against expected values

/**
 * A single assertion in a computation witness.
 *
 * Each assertion is a named claim with a computed value, an expected value,
 * and an error bound.  The CI pipeline checks `|computed - expected| ≤ tolerance`.
 */
export interface ComputationAssertion {
  /** Human-readable name (e.g. "Vol(4_1)"). */
  name: string;
  /** Computed value from the script. */
  computed: number | string;
  /** Expected value from the paper / CODATA / etc. */
  expected: number | string;
  /** Absolute error tolerance.  Assertion passes if |computed - expected| ≤ tolerance. */
  tolerance?: number;
  /** Unit or context (e.g. "MeV", "dimensionless", "volume"). */
  unit?: string;
  /** Source of expected value (e.g. "CODATA 2022", "OEIS A091518"). */
  source?: string;
}

/**
 * Computation witness — the JSON output of a verification script.
 *
 * Stored as a `.witness.json` sibling file alongside the proof's `.py` script.
 * Committed to the repo for reproducibility.
 */
export interface ComputationWitness {
  /** Engine that produced this witness. */
  engine: ComputationEngine;
  /** Engine version string (e.g. "snappy 3.3.2", "sympy 1.13"). */
  engineVersion: string;
  /** ISO 8601 timestamp of computation. */
  computedAt: string;
  /** Git commit SHA at time of computation. */
  commitSha?: string;
  /** Assertions verified by this computation. */
  assertions: ComputationAssertion[];
  /** Whether all assertions passed. */
  allPassed: boolean;
  /** Script execution time in milliseconds. */
  durationMs?: number;
  /**
   * Optional: content-block label this witness was authored for
   * (e.g. ``"prop:foo"``).  Set by ``WitnessBuilder.set_content_block``.
   *
   * This is a **self-claim** by the script author; it does not, on its
   * own, constitute a wire — the named content block must reference the
   * witness back via ``computation.witness`` for the witness to count
   * as "wired".  See ``scripts/audit-wiring.ts``.
   */
  contentBlock?: string;
  /**
   * Optional: marks the witness as **audit-only** — produced by an
   * audit/probe whose report lives at ``docs/audits/<file>.md`` and
   * which is *not* expected to wire to a content block.
   *
   * Set by ``WitnessBuilder.set_audit_only``.  Recognised by
   * ``scripts/audit-wiring.ts``, which excludes audit-only witnesses
   * from the orphan tally.
   *
   * Value is the path to the audit report, relative to repo root
   * (e.g. ``"docs/audits/2026-05-06-path-b-evacuation.md"``).
   */
  auditOnly?: string;
}

/**
 * Computational verification attached to a proof block.
 *
 * The proof's .md file contains the narrative proof.  The computation
 * field adds a reproducible script that independently verifies
 * numerical/algebraic claims made in the proof.
 *
 * Trust chain: Python script (reproducible) → JSON witness → Lean axiom.
 *
 * The Lean sibling uses:
 *   axiom vol_figure_eight : |Vol(4₁) - 2.02988321281931| < 1e-14
 *   -- Ref: [computation] computations/knot-volumes.py
 *   -- Witness: computations/knot-volumes.witness.json
 */
export interface Computation {
  /** Computation engine. */
  engine: ComputationEngine;
  /** Path to the Python (or other) script, relative to paper root. */
  script: string;
  /**
   * Path(s) to the witness JSON file(s) produced by the script,
   * relative to the repo root (e.g. `folio-assistant/computations/foo.witness.json`).
   *
   * A proof may legitimately depend on more than one witness (for
   * example, a derivation that combines a SnapPy volume computation
   * with a high-precision substrate-pinning registry); in that case
   * declare them as an array.  The auto-link advisory in
   * `validate-value.ts` checks `:val[…]` references against the
   * union of declared witnesses.
   */
  witness?: string | string[];
  /** Current verification status. */
  status: ComputationStatus;
  /** Python package dependencies (e.g. ["snappy>=3.3", "mpmath"]). */
  requires?: string[];
}

// ── Pre-rendered content ─────────────────────────────────────────

/**
 * Reference to a pre-rendered asset (e.g. tikzcd → SVG).
 *
 * When a .md file contains ```tex blocks that cannot be rendered
 * client-side (tikzcd, complex align environments), the build pipeline
 * renders them server-side and records the output here.
 *
 * The HTML viewer checks `rendered[]` and displays the pre-rendered
 * asset instead of attempting client-side rendering.
 */
export interface RenderedAsset {
  /** MIME type of the rendered output. */
  mime: "image/svg+xml" | "image/png" | "application/pdf" | (string & {});
  /** URL or relative path to the rendered file. */
  url: string;
  /** 0-based index of the ```tex block this replaces in the .md file. */
  blockIndex: number;
  /** Content hash for cache invalidation. */
  hash?: string;
}

// ── Companion file references ────────────────────────────────────

/**
 * References to companion files, resolved by pipeline from root name.
 *
 * For `content/objects/quantum-universe.ts`:
 *   md   → "quantum-universe.md"
 *   lean → "quantum-universe.lean"
 *   test → "quantum-universe.test.ts"
 *
 * Explicit paths override the convention.
 */
export interface Companions {
  /** Markdown content file. Resolved from sibling by default. */
  md?: string;
  /** Lean formalization file (relative to lean/ dir, or sibling). */
  lean?: string;
  /** Test report reference (e.g. test ID or file). */
  test?: string;
  /** Additional companion files by role. */
  [role: string]: string | undefined;
}

// ── Formalization constraints ────────────────────────────────────

/**
 * Formalization status — derived at build time from .lean file content.
 * NOT stored in content block .ts manifests.
 * Used only by CI scripts and proof-objects.json.
 */
export type FormalizationStatus =
  | "not_started"
  | "stated"
  | "has_sorry"
  | "proved"
  | "mathlib_ok";

export type ObjectKind =
  | "definition"
  | "theorem"
  | "lemma"
  | "proposition"
  | "corollary"
  | "conjecture"
  | "example"
  | "remark"
  | "proof"
  | "simulator";

/**
 * Author-tracking note attached to a content block. See the
 * `authorNotes?` field on `BlockBase` for the full rationale.
 *
 * Default render behavior: SKIP. Pipeline flag (`--with-author-notes`)
 * exposes these for working drafts.
 */
export interface AuthorNote {
  /** Note kind for filtering / styling. See BlockBase.authorNotes docs. */
  kind: "status" | "caveat" | "note" | "refined-framing" | "deprecated";
  /**
   * Human-readable date when the note was authored. Free-form string;
   * recommended ISO YYYY-MM-DD.
   */
  date?: string;
  /**
   * The note body, in markdown. Treat the same way as block prose
   * (math, links, lists supported). KEEP IT SHORT — author notes that
   * exceed ~5 lines should probably be a `remark` block instead.
   */
  body: string;
  /**
   * Optional cross-link to a follow-up: an audit doc, a successor
   * block, a PR, etc. Rendered as a clickable link when notes are
   * surfaced.
   */
  see?: string;
}

// ── Block types (discriminated union on `kind`) ──────────────────

/** Base fields shared by all environment blocks. */
interface BlockBase {
  /** Label following project convention (e.g. "def:quantum-universe"). */
  label: string;
  /** Optional display title. */
  title?: string;
  /**
   * Labels of **immediate** dependencies (\uses{} in LaTeX).
   *
   * List only direct neighbors — not the full transitive chain.
   * If A→B and B→C, then A lists only B; C is derived by walking
   * the graph. Run `bun run pipeline/prune-transitive-deps.ts` to
   * enforce this.
   *
   * Within the same paper: bare label (e.g. "def:quantum-universe").
   * Cross-paper (same folio): qualified "paper-dir:label"
   *   (e.g. "unital-groebner-bases:cor:pbw").
   * Cross-folio (external): full URL
   *   (e.g. "https://folio.example.org/papers/foo#def:bar").
   */
  uses?: string[];
  /**
   * Bibliography keys cited by this block (e.g. ["kock2004", "atiyah1988"]).
   *
   * These are reference ids from content/schema/references.ts.
   * The build pipeline auto-extracts from \cite{} in .md files,
   * but explicit values here take precedence.
   */
  cites?: string[];
  /**
   * Thematic tags for filtering and grouping.
   * Examples: "archimedean", "complex", "p-adic", "su2", "representation-theory"
   */
  tags?: string[];
  /** Override companion file resolution (normally by root-name convention). */
  companions?: Companions;
  /** Pre-rendered assets for ```tex blocks that can't be rendered client-side. */
  rendered?: RenderedAsset[];
  /** Freeform metadata (chapter assignment, tags, etc.). */
  meta?: Record<string, unknown>;
  /**
   * Author-tracking notes attached to this block — status snapshots,
   * caveats, refinement-framing comments, and other meta-commentary
   * that should NOT appear in the scholarly prose body of the block.
   *
   * Per CLAUDE.md §"User accessibility" + `local/one-voice-audit`
   * conventions: status leaks (TODO, WIP, "added 2026-05-09",
   * "refined-framing", "status: open / closed / theorem", etc.) in
   * prose are a one-voice violation. Migrate them to this field
   * instead.
   *
   * Default render behavior: SKIP author notes from the final paper
   * (clean publication voice). The render pipeline (`render-latex.ts`)
   * accepts a `--with-author-notes` flag for working drafts that
   * exposes them as marginal notes or appendix sections.
   *
   * `kind` taxonomy (extend as needed):
   *   - "status"           — current state of work on this block
   *   - "caveat"           — author's caveat about scope / overshoot
   *   - "note"             — generic author note
   *   - "refined-framing"  — note added when the block was promoted
   *                          from one kind to another (remark → prop,
   *                          falsified → reduced, etc.)
   *   - "deprecated"       — block superseded by another (with link)
   *
   * EXCEPTION: `**Theorem (conditional on conj:X)**` banners required
   * by CLAUDE.md §3b-cond are STRUCTURAL parts of the theorem
   * statement, NOT author notes. They stay in the `.md` prose.
   */
  authorNotes?: AuthorNote[];
  /** Reference to an interactive simulator (opens overlay with [simulate] button). */
  simulator?: SimulatorRef;
  /**
   * Glossary terms *defined* by this block. Each entry is a slug used to
   * mint the LaTeX label `\label{term:<slug>}` and the HTML id `term-<slug>`.
   *
   * Authors mark the defining occurrence in the `.md` body with the remark
   * directive `:defterm[<slug>]`, and every subsequent reference (in any
   * block) with `:refterm[<slug>]`. Phase B validation will check that every
   * `defines[]` entry has at least one `:defterm[<slug>]` in this block's
   * markdown, and that every `:refterm[X]` resolves to some block's
   * `defines[]`.
   *
   * Slugs should be lowercase, hyphen-separated; the visible label is the
   * directive's bracket text and may differ from the slug only via the
   * long-form `:refterm[Visible]{#slug}`.
   */
  defines?: string[];
  /**
   * Optional computational verification (Python/SnapPea/sympy/etc.).
   *
   * Available on every block kind: definitions / propositions /
   * conjectures may attach a witness script that exercises the
   * construction or empirically supports the claim.  See the
   * `Computation` interface for the field shape and
   * `folio-assistant/computations/witness_base.py` for the Python
   * helper that emits matching `*.witness.json` files.
   */
  computation?: Computation;
}

// ── Blocks that REQUIRE Lean ─────────────────────────────────────

/**
 * Definition — MUST have a Lean declaration.
 *
 * Pipeline validates:
 *   - .lean sibling exists (or companions.lean resolves)
 *   - lean.decl is a valid Lean identifier
 */
export interface DefinitionBlock extends BlockBase {
  kind: "definition";
  /** Required: every definition must be formalized. */
  lean: LeanRef;
  /** Labels of example blocks illustrating this definition. */
  examples?: string[];
}

// ── Blocks where Lean is expected but may be WIP ─────────────────

/**
 * Base interface for provable blocks (theorems, lemmas, propositions, corollaries).
 * Lean is expected but may be WIP — missing lean triggers a warning, not an error.
 */
interface ProvableBase extends BlockBase {
  /** Optional Lean formalization of the result. */
  lean?: LeanRef;
  /** Labels of proof blocks for this result (like examples[]). */
  proofs?: string[];
  /** Labels of example blocks illustrating this result. */
  examples?: string[];
}

/** Theorem — a major result. Lean expected; proof may be inline or in .lean. */
export interface TheoremBlock extends ProvableBase {
  kind: "theorem";
}

/** Lemma — auxiliary result supporting a theorem. */
export interface LemmaBlock extends ProvableBase {
  kind: "lemma";
}

/** Proposition — a result of moderate significance. */
export interface PropositionBlock extends ProvableBase {
  kind: "proposition";
}

/** Corollary — a consequence of a theorem or proposition. */
export interface CorollaryBlock extends ProvableBase {
  kind: "corollary";
}

/**
 * Algorithm — a specialised proposition that realises a chain of
 * propositions in executable compute.
 *
 * Algorithms are downstream of mathematics: every algorithm block
 * MUST cite at least one provable block (definition, proposition,
 * theorem, lemma, corollary, or conjecture) in its `uses[]` field.
 * The validator enforces this invariant via `AlgorithmSchema`.
 *
 * An algorithm block typically names:
 *  - the input / output contract,
 *  - the propositions whose correctness it depends on (`uses[]`),
 *  - the canonical compute entry point (`computation`),
 *  - optionally, a Lean formalisation of the correctness statement.
 *
 * Renders as a numbered theorem-like environment (`algorithmblock`)
 * to avoid colliding with the LaTeX `algorithm` float package.
 */
export interface AlgorithmBlock extends ProvableBase {
  kind: "algorithm";
  /** Optional computational realisation (Python / Rust / ...). */
  computation?: Computation;
  /**
   * Optional label of an upstream definition this algorithm
   * realises (parallel to `RemarkBlock.interprets`).
   *
   * Use when the algorithm is the canonical compute for a single
   * named construction (e.g. `interprets: "def:markov-trace"`).
   * For multi-proposition algorithms, leave unset and cite all
   * propositions in `uses[]`.
   */
  interprets?: string;
}

/** Conjecture — an unproven statement. Lean stub optional. */
export interface ConjectureBlock extends BlockBase {
  kind: "conjecture";
  /** Optional Lean stub for the conjecture statement. */
  lean?: LeanRef;
}

// ── Blocks where Lean is optional ────────────────────────────────

/** Example — a concrete instance illustrating a definition or theorem. */
export interface ExampleBlock extends BlockBase {
  kind: "example";
  /** Optional Lean formalization of the example. */
  lean?: LeanRef;
  /**
   * Label of the provable block this example illustrates.
   *
   * Parallel to `RemarkBlock.interprets` — when an example concretely
   * instantiates a definition/proposition/theorem, link it here so
   * the viewer can cross-reference bidirectionally.
   */
  interprets?: string;
}

/**
 * Remark — interprets a provable block (definition, proposition, theorem, etc.).
 *
 * Every remark should either:
 * 1. Set `interprets` to the label of the block it interprets, or
 * 2. Be a glossary remark (tagged "glossary", Ch 8 only), or
 * 3. Be flagged as "dangling" by the remark-audit constraint.
 *
 * Remarks without `interprets` that make mathematical claims should be
 * promoted to propositions/lemmas with their own Lean formalization.
 */
export interface RemarkBlock extends BlockBase {
  kind: "remark";
  /** Optional Lean reference (unusual but allowed). */
  lean?: LeanRef;
  /**
   * Label of the provable block this remark interprets.
   *
   * Links the remark to its formal backing: the definition, proposition,
   * theorem, or lemma whose physical/mathematical meaning this remark
   * explains. The referenced block should have Lean formalization.
   */
  interprets?: string;
  /** Optional computational verification (Python/SnapPea/sympy/etc.). */
  computation?: Computation;
}

/**
 * Proof — a standalone proof of a theorem/lemma/proposition/corollary.
 *
 * Multiple proofs can be linked to a single provable block via its
 * `proofs: ["prf:foo", "prf:bar"]` field, similar to how examples work.
 * Each proof is its own content object with .ts + .md + optional .lean files.
 *
 * A proof can optionally include a `computation` field for claims that
 * are verified by running an external script (SnapPea, sympy, mpmath, etc.).
 * The script produces a JSON witness file with inputs, outputs, and error
 * bounds.  Lean accepts these as axioms with `-- Ref: [computation]`.
 */
export interface ProofBlock extends BlockBase {
  kind: "proof";
  /**
   * Label of the provable block this proof establishes (reverse link of
   * `ProvableBase.proofs[]`). Canonical field name — use in preference to
   * `proves`.
   */
  of?: string;
  /** Optional Lean formalization of the proof. */
  lean?: LeanRef;
  /** Optional computational verification (Python/SnapPea/sympy/etc.). */
  computation?: Computation;
}

// ── Simulators ───────────────────────────────────────────────────

/**
 * A named parameter set for a simulator.
 *
 * Each view defines a specific configuration — e.g. "default" snapshot
 * for paper figures, or "bach-2013" matching experimental data.
 * Parameters are passed to the simulator HTML via URL query params
 * or postMessage.
 */
export interface SimulatorView {
  /** View name (e.g. "default", "bach-2013", "fullerene"). */
  name: string;
  /** Display title for this view. */
  title?: string;
  /** Parameter values for this view. */
  params: Record<string, number | string | boolean>;
}

/**
 * Reference from a block to a simulator with an optional named view.
 *
 * Multiple blocks (remarks, examples, etc.) can reference the same
 * simulator with different views. The viewer renders a [simulate]
 * button that opens the simulator overlay with the specified params.
 */
export interface SimulatorRef {
  /** Label of the simulator block (e.g. "sim:q-double-slit"). */
  ref: string;
  /** Named view to use (defaults to "default"). */
  view?: string;
}

/**
 * Simulator — an interactive HTML visualization.
 *
 * Content triple: `.ts` (manifest + params) + `.md` (documentation) + `.html` (app).
 * The `.md` explains the simulator and its default view; it is distinct from
 * the `.md` of any remark that references this simulator.
 *
 * Pipeline validates:
 *   - .html companion exists (or companions.html resolves)
 *   - defaultView is present with at least one param
 */
export interface SimulatorBlock extends BlockBase {
  kind: "simulator";
  /** Path to the standalone HTML simulator file (relative to repo root). */
  html: string;
  /** Default parameter values — used for snapshot generation. */
  defaultView: SimulatorView;
  /** Additional named views with different parameter sets. */
  views?: SimulatorView[];
}

// ── Prose (non-environment content) ──────────────────────────────

/**
 * Freeform narrative text between environments.
 * Content lives entirely in the sibling .md file.
 */
export interface ProseBlock {
  kind: "prose";
  /** Optional label for cross-referencing. */
  label?: string;
  /** Optional section-style title rendered as a paragraph heading. */
  title?: string;
  /** Labels of content blocks this prose depends on (for the dependency graph). */
  uses?: string[];
  /** Bibliography keys cited by this block. */
  cites?: string[];
  tags?: string[];
  companions?: Companions;
  /** Pre-rendered assets for ```tex blocks. */
  rendered?: RenderedAsset[];
  meta?: Record<string, unknown>;

}

// ── Display math / equations ─────────────────────────────────────

/** Standalone display equation. Short TeX can live inline; complex in .md. */
export interface EquationBlock {
  kind: "equation";
  /** Equation label (e.g. "eq:snake-identities"). */
  label?: string;
  /** Inline TeX for the equation (short enough to live in .ts). */
  tex?: string;
  companions?: Companions;
  /** Pre-rendered equation (e.g. SVG from MathJax/KaTeX server). */
  rendered?: RenderedAsset[];
  meta?: Record<string, unknown>;

}

// ── Diagrams ─────────────────────────────────────────────────────

/** Commutative diagram or figure. Source is tikzcd or other diagram TeX. */
export interface DiagramBlock {
  kind: "diagram";
  /** Diagram label (e.g. "fig:monoidal-structure"). */
  label?: string;
  /** Optional display title (rendered as a figure heading). */
  title?: string;
  /** tikzcd or diagram TeX source (can live inline for short diagrams). */
  tex?: string;
  /** Caption text (rendered below diagram in LaTeX). */
  caption?: string;
  tags?: string[];
  /** Labels of content blocks this diagram depends on (for the dependency graph). */
  uses?: string[];
  companions?: Companions;
  /** Pre-rendered diagram (e.g. SVG from tikzcd server-side render). */
  rendered?: RenderedAsset[];
  meta?: Record<string, unknown>;

}

/**
 * Table block — standalone data table extracted from a remark or
 * proposition.  Tables with more than 5–6 rows MUST be their own block
 * rather than inlined in a remark or proposition, so they can be
 * labelled and cross-referenced independently.
 */
export interface TableBlock {
  kind: "table";
  /** Table label (e.g. "tbl:mass-predictions"). */
  label?: string;
  /** LaTeX tabular/longtable source (optional; can also live in .md). */
  tex?: string;
  /** Caption text (rendered above table in LaTeX). */
  caption?: string;
  /** Title for the table (rendered as bold header). */
  title?: string;
  tags?: string[];
  /** Blocks that this table summarises data from. */
  uses?: string[];
  /** Witness/script the table values are derived from (mirrors RemarkBlock).
   *  Lets tables that cite `:val[…]` literals declare the upstream witness
   *  dep, same as remark/proof/definition blocks. */
  computation?: Computation;
  companions?: Companions;
  rendered?: RenderedAsset[];
  meta?: Record<string, unknown>;
}

// ── The discriminated union ──────────────────────────────────────

export type Block =
  | DefinitionBlock
  | TheoremBlock
  | LemmaBlock
  | PropositionBlock
  | CorollaryBlock
  | AlgorithmBlock
  | ConjectureBlock
  | ExampleBlock
  | RemarkBlock
  | ProofBlock
  | SimulatorBlock
  | ProseBlock
  | EquationBlock
  | DiagramBlock
  | TableBlock;

/** Blocks that represent theorem-like environments. */
export type EnvironmentBlock =
  | DefinitionBlock
  | TheoremBlock
  | LemmaBlock
  | PropositionBlock
  | CorollaryBlock
  | AlgorithmBlock
  | ConjectureBlock
  | ExampleBlock
  | RemarkBlock
  | ProofBlock
  | SimulatorBlock;

/** Blocks that can (or must) have Lean declarations. */
export type FormalizableBlock =
  | DefinitionBlock
  | ProofBlock;

// ── Cross-reference helpers ─────────────────────────────────────

/**
 * All known label prefixes used in content objects.
 *
 * Used to distinguish same-paper references (e.g. "def:foo") from
 * cross-paper qualified references (e.g. "unital-groebner-bases:def:foo").
 * A label that contains ":" but doesn't start with one of these prefixes
 * is treated as a cross-paper reference.
 */

/**
 * Test whether a label is a cross-paper qualified reference.
 *
 * Cross-paper refs use "paper-dir:label" syntax (e.g.
 * "unital-groebner-bases:def:foo"). They contain a colon but don't
 * start with a known label prefix.
 */

/**
 * Extract the label from a Block, regardless of block kind.
 *
 * Environment blocks (definition, theorem, etc.) always have `label`.
 * Non-environment blocks (prose, equation, diagram, table) may have
 * an optional `label`. Returns `undefined` if no label is set.
 */
export function extractBlockLabel(block: Block): string | undefined {
  return "label" in block ? block.label : undefined;
}

// ── Document structure ───────────────────────────────────────────

export interface Section {
  title: string;
  label?: string;
  /** Ordered list of block root names (resolved to .ts files in section/chapter dir). */
  blocks: string[];
  /** Subsections (inline or referenced). */
  subsections?: (Section | SectionRef)[];
}

/**
 * Section reference — used by chapter .ts to locate section .ts files.
 *
 * Sections can be:
 *   - Inline (Section object directly in the chapter)
 *   - Referenced by name (resolved to `<name>/<name>.ts` in chapter dir)
 *   - Referenced by explicit URI
 */
export interface SectionRef {
  /** Root name of the section dir/file. */
  name: string;
  /** URI override (defaults to `./<name>/<name>.ts`). */
  uri?: string;
}

/**
 * Chapter reference — used by the paper manifest to locate chapter .ts files.
 *
 * The `uri` defaults to a relative local path based on directory convention:
 *   `./<chapter-dir>/<chapter-dir>.ts`
 *
 * Can be overridden to point to a remote URI for multi-repo setups.
 */
export interface ChapterRef {
  /** URI to the chapter .ts manifest (default: relative local). */
  uri?: string;
  /** Directory name under the paper root (e.g. "quantum-universes"). */
  dir: string;
  /**
   * Optional Part banner emitted before this chapter in the rendered
   * paper.  When set, the LaTeX renderer emits `\part{<partTitle>}`
   * immediately before this chapter's `\input{}` line, grouping it
   * with subsequent chapters until the next chapterRef with its own
   * `partTitle` (or end of paper).
   *
   * LaTeX supplies the "Part N" prefix automatically — `partTitle`
   * should contain only the title text (e.g. "Knots, Braids, and
   * Particles"), not "Part II: ...". The renderer escapes the value
   * via `escapeLatex()`, so inline `$...$` math is preserved but
   * raw control characters (`\`, `{`, `}`, `^`, `~`) are escaped.
   */
  partTitle?: string;
}

export interface Chapter {
  /** Chapter number. Omit for unnumbered chapters (e.g. Introduction). */
  number?: number;
  /**
   * Short label shown in collapsed sidebar tab (e.g. "I" for Introduction,
   * "G" for Glossary). Defaults to `String(number)` when omitted.
   */
  tabLabel?: string;
  title: string;
  label?: string;
  /** Sections can be inline Section objects or SectionRef references. */
  sections: (Section | SectionRef)[];
  meta?: Record<string, unknown>;
}

/**
 * Paper manifest — top-level document.
 *
 * The paper .ts is authoritative for where chapter .ts files live.
 * Each entry in `chapters` is either:
 *   - A ChapterRef (with optional URI override)
 *   - An inline Chapter (for simple cases)
 */
/**
 * A custom macro defined at the paper level.
 *
 * Used by all renderers: KaTeX (viewer), LaTeX (PDF), and plain-text (search).
 */
export interface PaperMacro {
  /** LaTeX expansion (e.g. "\\mathfrak{p}"). Used by KaTeX and LaTeX. */
  tex: string;
  /** UTF-8 display string for plain-text contexts (e.g. "𝔭"). */
  unicode?: string;
}

export interface Paper {
  title: string;
  authors: string[];
  affiliations?: string[];
  /** Author email addresses (parallel to authors array). */
  emails?: string[];
  /** Author URLs / homepages (parallel to authors array). */
  urls?: string[];
  date?: string;
  /** Paper abstract (plain text or markdown). */
  abstract?: string;
  /** Chapter references — URIs to chapter .ts manifests. */
  chapters: ChapterRef[];
  /**
   * Custom LaTeX macros for this paper.
   *
   * Keys are macro names WITHOUT backslash (e.g. "pp" for \pp).
   * Values define the TeX expansion and optional Unicode fallback.
   *
   * All renderers consume these:
   * - KaTeX: passed as `macros` option
   * - LaTeX pipeline: emitted as \newcommand in preamble
   * - Plain-text/search: uses `unicode` field
   */
  macros?: Record<string, PaperMacro>;
  meta?: Record<string, unknown>;
}

/**
 * @deprecated Use Paper instead. Kept for backward compatibility.
 */
export interface Document {
  title: string;
  authors: string[];
  date?: string;
  chapters: Chapter[];
  meta?: Record<string, unknown>;
}

// ── Todo items ───────────────────────────────────────────────

/**
 * Priority level for a todo item.
 * Agents and humans use these to triage work.
 */
export type TodoPriority = "critical" | "high" | "medium" | "low";

/**
 * Status of a todo item through its lifecycle.
 */
export type TodoStatus =
  | "open"          // newly created, awaiting triage
  | "in_progress"   // actively being worked on
  | "blocked"       // waiting on external input (author, upstream change)
  | "resolved"      // completed successfully
  | "wontfix";      // closed without resolution

/**
 * Origin of a todo — who/what created it.
 */
export type TodoOrigin =
  | "agent"         // created by an editor/proof agent
  | "human"         // created by author via feedback UI
  | "qc"            // created by QC/validation pipeline
  | "extracted";    // extracted from existing proof-objects/comments

/**
 * A todo item attached to a content block or section.
 *
 * Serves as the unit of agent-to-agent and human-to-agent communication.
 * Each todo lives in the `todos` field of a block manifest (.ts) or in a
 * standalone todos manifest for section/chapter-level items.
 *
 * The `comment` field is a quick markdown narrative.  The optional `data`
 * field carries structured context at the discretion of the creating
 * agent or user.
 */
export interface TodoItem {
  /** Unique ID (e.g. "todo-001" or a nanoid). */
  id: string;
  /** Short summary (one line). */
  summary: string;
  /** Markdown narrative with context, rationale, questions. */
  comment: string;
  /** Current lifecycle status. */
  status: TodoStatus;
  /** Triage priority. */
  priority: TodoPriority;
  /** Who/what created this todo. */
  origin: TodoOrigin;
  /** Label of the block this todo is attached to (e.g. "def:rigid-monoidal-category"). */
  targetLabel?: string;
  /** Who this is assigned to (agent name or "author"). */
  assignee?: string;
  /** ISO 8601 timestamp of creation. */
  createdAt: string;
  /** ISO 8601 timestamp of last update. */
  updatedAt?: string;
  /** Agent/user who last updated. */
  updatedBy?: string;
  /** Structured data — schema is at agent/user discretion. */
  data?: Record<string, unknown>;
  /** Labels of related todos (for threading). */
  related?: string[];
}

// ── Feedback (committed to main via worktree) ────────────────

/**
 * A feedback item submitted by a user or agent against a content block.
 *
 * Feedback lives in `feedback/<paper-dir>/<rootName>.ts` and is committed
 * to main immediately via a git worktree, so it persists across branches.
 *
 * Extends TodoItem with authorship fields from the feedback UI.
 */
export interface FeedbackItem extends TodoItem {
  /** Display name of the submitter (from OAuth or local config). */
  author?: string;
  /** Email of the submitter (from OAuth or local config). */
  authorEmail?: string;
}

// ── Folio (collection of papers) ─────────────────────────────

/**
 * Reference to a paper within the folio.
 *
 * The `dir` is the paper's directory name under content/.
 * The pipeline resolves `<dir>/<dir>.ts` by convention.
 */
export interface PaperRef {
  /** Directory name under content/ (e.g. "quantum-observable-universe"). */
  dir: string;
  /** Optional display title override (otherwise read from paper manifest). */
  title?: string;
  /** Optional description shown on the landing page. */
  description?: string;
  /** Tags for filtering on the landing page. */
  tags?: string[];
  /**
   * Folio viewer URL for this paper.  Used for:
   * - Cross-paper dependency resolution (qualified `uses` refs)
   * - BibTeX `folio-url` field for folio-hosted citations
   * - Read-only import of external papers for commenting/referencing
   *
   * Local papers use the viewer hash route: "/viewer/#/view/{paper-id}".
   * To link to a specific block: append the label fragment
   *   (e.g. "/viewer/#/view/unital-groebner-bases" then "#cor:pbw").
   * External folios use full URLs:
   *   "https://folio.example.org/viewer/#/view/paper-id".
   */
  url?: string;
}

/**
 * Folio — a collection of papers in this repository.
 *
 * Lives at `content/folio.ts` by convention.  The assistant landing
 * page reads this to discover all papers and render the folio view.
 */
export interface Folio {
  /** Display name for the folio (e.g. "litlfred's Papers"). */
  title: string;
  /** Papers in the folio, ordered by display preference. */
  papers: PaperRef[];
  meta?: Record<string, unknown>;
}

// ── Print modes ──────────────────────────────────────────────────

/**
 * Print mode controls document rendering density.
 *
 * - `"formal"` — Full academic layout with author affiliations,
 *   page breaks between chapters, and expanded headings.
 * - `"compact"` — Dense layout (current default): no page breaks,
 *   normal-size headings, affiliations omitted. Referenced examples
 *   and remarks are included unless `compactInlineRefs` is false.
 */
export type PrintMode = "formal" | "compact";

/**
 * Options that control what the rendering pipeline includes.
 *
 * Passed through build → renderChapter → renderSection.
 */
export interface RenderOptions {
  /** Print mode (default: "compact"). */
  printMode?: PrintMode;
  /**
   * In compact mode, include example/remark blocks that are directly
   * referenced via `examples[]` on definitions/theorems in the same view.
   * Default: true.  Set to false for a minimal compact output.
   */
  compactInlineRefs?: boolean;
}

// ── Validation result ────────────────────────────────────────────

export interface ValidationIssue {
  level: "error" | "warning" | "info";
  block: string;
  message: string;
  file?: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}
