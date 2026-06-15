/**
 * §S7 — `PrecisionScalar` envelope for round-tripping high-precision
 * values through witness JSON without going through `f64`.
 *
 * Wire-format twin of the Rust struct in
 * `tools/hecke-engine/src/precision_scalar.rs` and the Python helper
 * `folio-assistant/computations/precision_scalar.py`.
 *
 * Shape:
 *   { "value": "1.10997859555418057528...", "dps": 50 }
 *
 * - `value`: signed decimal, with optional fractional part and
 *   optional `e<int>` / `E<int>` exponent.  Regex below permits
 *   both `1.23e10` (positive sign implicit), `1.23e+10`,
 *   `1.23E-10`, `1.23E+10`.
 * - `dps`: source-emitter's significant-decimal-digit precision.
 *   Consumers downstream should not extrapolate past `dps`.
 *
 * Witness JSON consumers may carry plain numbers (legacy) OR
 * `PrecisionScalar` envelopes — the canonical Zod schema for
 * scalar fields is `precisionScalarOrNumber` below.
 *
 * Per workplan
 * `tools/hecke-engine/CLARABEL_PRECISION_PLAN.md` §S7.3.
 */

import { z } from "zod";

/** Decimal-string + dps-tag envelope. */
export const precisionScalar = z.object({
  /**
   * Signed decimal: optional `-`, integer part, optional `.<frac>`,
   * optional `[eE][+-]?<int>` exponent.  Includes uppercase `E`
   * and explicit positive sign on the exponent — both produced by
   * various MPFR / mpmath formatting paths.
   */
  value: z.string().regex(/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/),
  /** Significant decimal digits in `value`. */
  dps: z.number().int().positive(),
});

/** Convenience type for downstream consumers. */
export type PrecisionScalar = z.infer<typeof precisionScalar>;

/**
 * Witness JSON scalar fields should accept either the legacy
 * plain `number` (f64) or the new `precisionScalar` envelope.
 * Use this in Zod schemas for fields like
 * `wedderburn_block_psd_at_q_0.min_eigenvalue` etc.
 */
export const precisionScalarOrNumber = z.union([z.number(), precisionScalar]);

export type PrecisionScalarOrNumber = z.infer<typeof precisionScalarOrNumber>;

/**
 * Type guard — true if a value is a `PrecisionScalar` envelope
 * (vs. a plain f64 number).  Use this in consumer code that
 * routes via `mpmath` / `BigInt` for HP scalars and `Number()`
 * for legacy plain numbers.
 */
export function isPrecisionScalar(v: unknown): v is PrecisionScalar {
  return (
    typeof v === "object" &&
    v !== null &&
    "value" in v &&
    "dps" in v &&
    typeof (v as { value: unknown }).value === "string" &&
    typeof (v as { dps: unknown }).dps === "number"
  );
}
