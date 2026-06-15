/**
 * @litlfred/witness-schema — Zod schemas for the QOU witness JSON format.
 *
 * The canonical schema is `tools/witness-schema/schema/witness.schema.json`.
 * This file ships Zod schemas that validate against the same shape, so any
 * TypeScript / JavaScript consumer can parse + type-check a `*.witness.json`
 * file produced by `qou_substrate.witness.WitnessBuilder`.
 *
 * @example
 * ```ts
 * import { ComputationWitness } from "@litlfred/witness-schema";
 * import { readFileSync } from "fs";
 *
 * const raw = JSON.parse(readFileSync("hyperbolic-volumes.witness.json", "utf-8"));
 * const witness = ComputationWitness.parse(raw);
 *
 * console.log(witness.engineVersion, witness.commitSha);
 * for (const a of witness.assertions) {
 *   console.log(a.name, "→", a.computed, "vs", a.expected, "→", a.passed);
 * }
 * ```
 */

import { z } from "zod";

export const ComputationEngine = z.enum([
  "snappea",
  // `snappy` is the legacy name for `snappea`; accepted for back-compat.
  // New witnesses should prefer `snappea`.
  "snappy",
  "sympy",
  "mpmath",
  "sage",
  "python",
  "numpy",
  "scipy",
  "closed-form",
  "python+mpmath",
  "python+numpy+cvxpy",
]);
export type ComputationEngine = z.infer<typeof ComputationEngine>;

const ComputedOrExpected = z.union([z.number(), z.string()]);

export const ComputationAssertion = z
  .object({
    name: z.string(),
    computed: ComputedOrExpected,
    expected: ComputedOrExpected,
    passed: z.boolean().optional(),
    tolerance: z.number().optional(),
    unit: z.string().optional(),
    source: z.string().optional(),
  })
  .passthrough();
export type ComputationAssertion = z.infer<typeof ComputationAssertion>;

// Real witnesses carry `null` for unknown optional fields (e.g.
// `scriptCommitSha: null`, `computedAt: null` in
// canonical-isotope-witness-*.witness.json), so optional string
// fields are `nullable().optional()` — accepts string | null | missing.
export const UpstreamWitnessHash = z
  .object({
    path: z.string(),
    sha256: z.string(),
    size_bytes: z.number().int().nullable().optional(),
    commitSha: z.string().nullable().optional(),
    scriptCommitSha: z.string().nullable().optional(),
    computedAt: z.string().nullable().optional(),
  })
  .passthrough();
export type UpstreamWitnessHash = z.infer<typeof UpstreamWitnessHash>;

// Added 2026-05-24 (in-repo commit 146f3aeac). Substrate-precision
// parameters used to produce the witness. Optional but recommended
// on substrate-precision compute paths (mpmath / Decimal / rug).
// `truncation_bound` is intentionally a string (e.g. "1e-40") to
// avoid float round-trip loss for the bound itself.
export const PrecisionMetadata = z
  .object({
    compute_dps: z.number().int().optional(),
    output_dps: z.number().int().optional(),
    guard_digits: z.number().int().optional(),
    truncation_bound: z.string().optional(),
  })
  .passthrough();
export type PrecisionMetadata = z.infer<typeof PrecisionMetadata>;

// `upstream_witness_hashes` lives under `data` (per the in-repo
// convention), not at the top level. Callers reach it via
// `witness.data?.upstream_witness_hashes`.
export const ComputationWitness = z
  .object({
    engine: ComputationEngine,
    engineVersion: z.string(),
    computedAt: z.string(),
    assertions: z.array(ComputationAssertion),

    commitSha: z.string().optional(),
    scriptCommitSha: z.string().optional(),
    scriptHash: z.string().optional(),
    scriptFile: z.string().optional(),
    name: z.string().optional(),
    description: z.string().optional(),
    contentBlock: z.string().optional(),
    auditOnly: z.string().optional(),
    durationMs: z.number().optional(),
    allPassed: z.boolean().optional(),
    parameters: z.record(z.string(), z.unknown()).optional(),
    data: z.record(z.string(), z.unknown()).optional(),
    caveats: z.array(z.string()).optional(),
    precisionMetadata: PrecisionMetadata.optional(),
  })
  .passthrough();
export type ComputationWitness = z.infer<typeof ComputationWitness>;

export const VERSION = "0.1.1";
