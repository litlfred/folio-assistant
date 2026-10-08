/**
 * The change-size rule: thresholds, basis, and prose/KG versus code weighting.
 *
 * ## What this module is
 *
 * Owner ruling (2026-10-07, issue #754 / FR-009):
 * "The change-size rule should be a report-only advisory limit initially at ~400
 * lines of non-generated/non-lockfile code, weighting prose and KG documentation
 * lower, transitioning to a blocking CI gate once calibrated against PR history."
 *
 * This module defines the structured contract for change sizing, modeled after
 * `test/health/` thresholds. Every threshold structurally carries its basis
 * (source and reasoning) so that a check cannot ship a bare constant.
 *
 * ## Prose & Knowledge Graph vs Code
 *
 * A 600-line skill or documentation change and a 600-line logic refactor have
 * vastly different adjudication complexities. Code carries branching logic,
 * invariants, type constraints, and execution side-effects. Prose and KG
 * documentation read linearly with lower defect density.
 *
 * Therefore, prose and KG changes are weighted at 0.25x (or 4x the allowance):
 * 1 line of prose/KG documentation = 0.25 effective lines.
 *
 * ## Mechanical and Generated Exemptions
 *
 * A change that is large but uniform and mechanical is not hard to adjudicate:
 * - Lockfiles (`bun.lock`, `package-lock.json`)
 * - Machine-generated files / build artifacts (`*.jsonld`, `*.qa.json`, etc.)
 * - File renames and migrations with recorded justification
 *
 * These are excluded from the effective line count.
 *
 * ## SC-005 Reporting Format
 *
 * SC-005 requires reporting as a count with its denominator, never as a bare
 * percentage (e.g., "4 of 32 PRs (12.5%) exceeded the threshold").
 *
 * @module schemas/change-size
 * @graphNode schema
 */

import { z } from "zod";

/** Schema identifier. */
export const CHANGE_SIZE_SCHEMA = "folio-change-size/v1";

/** Modes for the change size gate. */
export const CHANGE_SIZE_MODES = ["report", "block"] as const;
export type ChangeSizeMode = (typeof CHANGE_SIZE_MODES)[number];

/** Classification of file diff categories. */
export const CHANGE_CATEGORIES = ["code", "prose_kg", "exempt"] as const;
export type ChangeCategory = (typeof CHANGE_CATEGORIES)[number];

/**
 * Structured threshold schema for change sizing.
 * Basis is REQUIRED structurally, matching HealthThresholdSchema.
 */
export const ChangeSizeThresholdSchema = z.object({
  metric: z.literal("effective_lines"),
  /** Numerical limit in effective lines. */
  limit: z.number().positive(),
  unit: z.literal("effective_lines"),
  /** Source and rationale behind the limit. */
  basis: z.string().min(1),
  /** Current enforcement mode: advisory reporting vs blocking gate. */
  mode: z.enum(CHANGE_SIZE_MODES),
  /** Weights per file category. */
  weights: z.object({
    code: z.number().positive(),
    prose_kg: z.number().positive(),
  }),
  /** Patterns or categories treated as exempt. */
  exemptions: z.array(z.string()).min(1),
});

export type ChangeSizeThreshold = z.infer<typeof ChangeSizeThresholdSchema>;

/**
 * Default change-size threshold configuration based on owner rulings and empirical studies.
 */
export const DEFAULT_CHANGE_SIZE_THRESHOLD: ChangeSizeThreshold = {
  metric: "effective_lines",
  limit: 400,
  unit: "effective_lines",
  basis:
    "Cisco/SmartBear study (Cohen et al., 2006): defect detection effectiveness drops sharply above 200-400 changed lines, and reviewer cognitive attention degrades after ~60 minutes. Google Modern Code Review (Sadowski et al., ICSE-SEIP 2018): small changelists are the primary operational mechanism preserving review quality and turnaround latency. Calibrated with 0.25x weighting for prose/KG documentation to reflect lower cognitive adjudication load relative to executable code.",
  mode: "report", // Advisory initially, transitioning to blocking after PR calibration
  weights: {
    code: 1.0,
    prose_kg: 0.25,
  },
  exemptions: [
    "lockfiles (bun.lock, package-lock.json, etc.)",
    "generated artifacts (*.jsonld, *.doc.json, *.qa.json, *.script-qa.json)",
    "build and staging artifacts (dist/, _site/, STAGING/)",
    "uniform mechanical migrations with recorded justification",
  ],
};

/** Breakdown of a change size diff. */
export interface ChangeSizeBreakdown {
  codeLines: number;
  proseKgLines: number;
  exemptLines: number;
  effectiveLines: number;
  threshold: ChangeSizeThreshold;
  exceedsThreshold: boolean;
  fileDetails: Array<{
    path: string;
    category: ChangeCategory;
    linesChanged: number;
    effectiveLines: number;
  }>;
}

/** Formatter for SC-005 compliance metrics (count with denominator). */
export function formatSc005Metric(oversizedCount: number, totalCount: number): string {
  if (totalCount === 0) return "0 of 0 PRs (0%)";
  const percentage = ((oversizedCount / totalCount) * 100).toFixed(1);
  return `${oversizedCount} of ${totalCount} PRs (${percentage}%)`;
}

/**
 * Classify a file path into code, prose_kg, or exempt.
 */
export function classifyFilePath(path: string): ChangeCategory {
  const norm = path.replace(/\\/g, "/");

  // Exempt: lockfiles
  if (
    norm.endsWith("bun.lock") ||
    norm.endsWith("bun.lockb") ||
    norm.endsWith("package-lock.json") ||
    norm.endsWith("yarn.lock")
  ) {
    return "exempt";
  }

  // Exempt: generated QA sidecars, build artifacts, compiled outputs
  if (
    norm.endsWith(".qa.json") ||
    norm.endsWith(".script-qa.json") ||
    norm.endsWith(".kg-qa.json") ||
    norm.endsWith(".jsonld") ||
    norm.endsWith(".doc.json") ||
    norm.includes("test/health/results/") ||
    norm.includes("test/results/") ||
    norm.startsWith("_site/") ||
    norm.startsWith("dist/")
  ) {
    return "exempt";
  }

  // Prose & Knowledge Graph: markdown, text, skills, docs, schemas documentation
  if (
    norm.endsWith(".md") ||
    norm.endsWith(".txt") ||
    norm.endsWith(".rst") ||
    norm.startsWith("skills/") ||
    norm.startsWith("cat-harness/skills/") ||
    norm.startsWith("docs/") ||
    norm.startsWith("cat-harness/docs/")
  ) {
    return "prose_kg";
  }

  // Default: code (ts, js, py, sh, yaml, json, etc.)
  return "code";
}

/**
 * Compute change size breakdown from list of changed files with line counts.
 */
export function calculateChangeSize(
  files: Array<{ path: string; linesChanged: number }>,
  threshold: ChangeSizeThreshold = DEFAULT_CHANGE_SIZE_THRESHOLD
): ChangeSizeBreakdown {
  let codeLines = 0;
  let proseKgLines = 0;
  let exemptLines = 0;

  const fileDetails = files.map((f) => {
    const category = classifyFilePath(f.path);
    let effective = 0;
    if (category === "code") {
      codeLines += f.linesChanged;
      effective = f.linesChanged * threshold.weights.code;
    } else if (category === "prose_kg") {
      proseKgLines += f.linesChanged;
      effective = f.linesChanged * threshold.weights.prose_kg;
    } else {
      exemptLines += f.linesChanged;
      effective = 0;
    }
    return {
      path: f.path,
      category,
      linesChanged: f.linesChanged,
      effectiveLines: Math.round(effective * 10) / 10,
    };
  });

  const effectiveLines = Math.round(
    (codeLines * threshold.weights.code + proseKgLines * threshold.weights.prose_kg) * 10
  ) / 10;

  return {
    codeLines,
    proseKgLines,
    exemptLines,
    effectiveLines,
    threshold,
    exceedsThreshold: effectiveLines > threshold.limit,
    fileDetails,
  };
}
