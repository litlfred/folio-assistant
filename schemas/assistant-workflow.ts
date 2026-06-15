/**
 * Assistant Workflow — Content lifecycle state machine.
 *
 * Defines the general content development lifecycle that applies
 * across repositories (qou math authoring, WHO SMART guidelines, etc.).
 * Each skill package realizes this lifecycle with domain-specific
 * skill assignments.
 *
 * ## Lifecycle stages
 *
 * ```
 * ┌─────────┐     ┌──────────┐     ┌──────────┐     ┌──────┐
 * │ DEVELOP │────▶│ VALIDATE │────▶│  REVIEW  │────▶│ TEST │
 * └─────────┘     └──────────┘     └──────────┘     └──────┘
 *       ▲               │                │               │
 *       │               ▼                ▼               ▼
 *       │          ┌─────────┐     ┌─────────┐     ┌─────────┐
 *       └──────────│ REVISE  │◀────│ REVISE  │◀────│ REVISE  │
 *                  └─────────┘     └─────────┘     └─────────┘
 *                                                        │
 *                                                        ▼
 *                  ┌──────────┐     ┌──────────┐
 *                  │ FEEDBACK │◀────│ PUBLISH  │
 *                  └──────────┘     └──────────┘
 *                       │
 *                       ▼
 *                  ┌─────────┐
 *                  │ DEVELOP │  (new cycle)
 *                  └─────────┘
 * ```
 *
 * @module assistant-workflow
 */

import type { Conformance } from "./assistant-types";

// ---------------------------------------------------------------------------
// Lifecycle stages
// ---------------------------------------------------------------------------

/**
 * The stages of the content development lifecycle.
 *
 * | Stage | Description | Key activities |
 * |-------|-------------|----------------|
 * | `develop` | Create or modify content | Authoring, formalization, editing |
 * | `validate` | Automated checks | Schema, AST, constraint, type checking |
 * | `review` | Human or agent review | Accuracy, style, proof correctness |
 * | `test` | Integration testing | Build, CI, regression, proof compilation |
 * | `publish` | Release to audience | PDF, HTML, gh-pages, IG Publisher |
 * | `feedback` | Collect responses | Todos, issues, comments, annotations |
 * | `revise` | Address feedback | Bug fixes, proof corrections, edits |
 */
export type LifecycleStage =
  | "develop"
  | "validate"
  | "review"
  | "test"
  | "publish"
  | "feedback"
  | "revise";

/**
 * A transition between lifecycle stages.
 */
export interface StageTransition {
  /** Stage transitioning from. */
  from: LifecycleStage;
  /** Stage transitioning to. */
  to: LifecycleStage;
  /** What triggers this transition. */
  trigger: "auto" | "manual" | "ci";
  /** Gate conditions that must be met (requirement statement keys). */
  gates?: string[];
}

/**
 * Maps a lifecycle stage to the skills that execute during that stage.
 */
export interface StageSkillBinding {
  /** The lifecycle stage. */
  stage: LifecycleStage;
  /** Skills that run during this stage, with conformance. */
  skills: {
    skillId: string;
    conformance: Conformance;
    /** Brief description of what this skill does at this stage. */
    role: string;
  }[];
}

/**
 * A complete workflow definition: lifecycle stages, transitions,
 * and skill bindings for a specific content domain.
 *
 * @example
 * ```ts
 * const mathWorkflow: WorkflowDefinition = {
 *   id: "authoring-math",
 *   name: "Formal Mathematics Authoring",
 *   stages: ["develop", "validate", "review", "test", "publish", "feedback"],
 *   transitions: [
 *     { from: "develop", to: "validate", trigger: "auto" },
 *     { from: "validate", to: "review", trigger: "auto",
 *       gates: ["REQ-CCR-1"] },
 *   ],
 *   bindings: [
 *     { stage: "develop", skills: [
 *       { skillId: "formalizer", conformance: "SHALL",
 *         role: "Generate Lean proofs" },
 *     ]},
 *   ],
 * };
 * ```
 */
export interface WorkflowDefinition {
  /** Unique workflow identifier. */
  id: string;
  /** Human-readable name. */
  name: string;
  /** Description of this workflow. */
  description: string;
  /** Ordered lifecycle stages used by this workflow. */
  stages: LifecycleStage[];
  /** Allowed transitions between stages. */
  transitions: StageTransition[];
  /** Skill assignments per stage. */
  bindings: StageSkillBinding[];
}

// ---------------------------------------------------------------------------
// QOU math authoring workflow (concrete realization)
// ---------------------------------------------------------------------------

/**
 * The formal mathematics authoring workflow for the QOU paper.
 *
 * This is the **concrete realization** of the generic lifecycle
 * for the `authoring-math` skill package.
 */
export const mathAuthoringWorkflow: WorkflowDefinition = {
  id: "authoring-math",
  name: "Formal Mathematics Authoring",
  description:
    "Content development lifecycle for formal mathematics papers: " +
    "Lean 4 formalization, LaTeX rendering, proof review, and publication.",
  stages: ["develop", "validate", "review", "test", "publish", "feedback", "revise"],
  transitions: [
    { from: "develop", to: "validate", trigger: "auto" },
    { from: "validate", to: "review", trigger: "auto", gates: ["REQ-CCR-1", "REQ-CCR-2"] },
    { from: "review", to: "test", trigger: "manual" },
    { from: "test", to: "publish", trigger: "ci", gates: ["REQ-CH-1"] },
    { from: "publish", to: "feedback", trigger: "auto" },
    { from: "feedback", to: "revise", trigger: "manual" },
    { from: "revise", to: "develop", trigger: "manual" },
    // Short-circuit: validation failures go back to develop
    { from: "validate", to: "revise", trigger: "auto" },
    { from: "review", to: "revise", trigger: "manual" },
    { from: "test", to: "revise", trigger: "auto" },
  ],
  bindings: [
    {
      stage: "develop",
      skills: [
        { skillId: "editor", conformance: "SHALL", role: "Coordinate session, triage tasks" },
        { skillId: "formalizer", conformance: "SHALL", role: "Generate/complete Lean proofs" },
        { skillId: "category-theory", conformance: "SHOULD", role: "Diagram chasing, monoidal reasoning" },
        { skillId: "lean-generation", conformance: "SHOULD", role: "Extract Lean stubs from LaTeX" },
        { skillId: "ontologist", conformance: "MAY", role: "Term disambiguation, glossary" },
        { skillId: "paper-importer", conformance: "MAY", role: "Import from arXiv" },
      ],
    },
    {
      stage: "validate",
      skills: [
        { skillId: "content-validation", conformance: "SHALL", role: "Schema + constraint + AST checks" },
        { skillId: "latex-validation", conformance: "SHALL", role: "LaTeX syntax verification" },
        { skillId: "scientific-accuracy", conformance: "SHOULD", role: "Mathematical intent verification" },
      ],
    },
    {
      stage: "review",
      skills: [
        { skillId: "lean-proof-review", conformance: "SHALL", role: "Proof rigor and sorry audit" },
        { skillId: "content-block-review", conformance: "SHALL", role: "Block-level consistency audit" },
        { skillId: "readability-editing", conformance: "SHOULD", role: "Prose style review" },
        { skillId: "critical-path-analysis", conformance: "MAY", role: "Dependency impact analysis" },
      ],
    },
    {
      stage: "test",
      skills: [
        { skillId: "test-engineer", conformance: "SHALL", role: "Unit tests, CI validation" },
        { skillId: "proof-status-tracking", conformance: "SHALL", role: "Update proof-objects.json" },
        { skillId: "proof-triage", conformance: "SHOULD", role: "Prioritize remaining sorrys" },
      ],
    },
    {
      stage: "publish",
      skills: [
        { skillId: "docs-generation", conformance: "SHALL", role: "TypeDoc, PDF, HTML, gh-pages" },
        { skillId: "deployment-auth", conformance: "MAY", role: "Remote MCP server update" },
      ],
    },
    {
      stage: "feedback",
      skills: [
        { skillId: "todo-review", conformance: "SHALL", role: "Process feedback into TodoItems" },
      ],
    },
    {
      stage: "revise",
      skills: [
        { skillId: "editor", conformance: "SHALL", role: "Triage revision tasks" },
        { skillId: "proof-simplifier", conformance: "MAY", role: "Streamline completed proofs" },
        { skillId: "chapter-analysis", conformance: "MAY", role: "Structural review" },
      ],
    },
  ],
};
