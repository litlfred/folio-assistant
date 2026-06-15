//! §S7 — `PrecisionScalar` envelope for round-tripping high-precision
//! values through witness JSON without going through `f64`.
//!
//! The Clarabel-rs MPFR / bigrational backends produce values with
//! more precision than IEEE `f64` can carry — typically 50 dps from
//! `MpfrFloat` at 167-bit precision, or arbitrary from `RationalReal`
//! under `set_max_arena_bits`.  Witness JSON files have historically
//! used `number` (f64) for these values, capping every consumer at
//! ~16 dps regardless of how the producer ran.
//!
//! `PrecisionScalar` round-trips a value through a decimal-string
//! representation with an explicit `dps` tag.  The wire format is
//! recognised by:
//!  - the TypeScript Zod schema in
//!    [`folio-assistant/schemas/precision-scalar.ts`](../../folio-assistant/schemas/precision-scalar.ts);
//!  - the Python consumer
//!    [`folio-assistant/computations/precision_scalar.py`](../../folio-assistant/computations/precision_scalar.py).
//!
//! Per workplan
//! [`CLARABEL_PRECISION_PLAN.md`](../CLARABEL_PRECISION_PLAN.md) §S7.1.

use serde::{Deserialize, Serialize};

/// A scalar value carried as a decimal string with explicit
/// significant-decimal-digits (`dps`) precision.  Avoids the
/// f64 round-trip when serialising MPFR / BigRational values
/// to JSON.
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub struct PrecisionScalar {
    /// Canonical decimal representation: signed, with optional
    /// fractional part and optional `e<int>` / `E<int>` exponent.
    /// Regex: `^-?\d+(\.\d+)?([eE][+-]?\d+)?$`.
    pub value: String,
    /// Significant decimal digits encoded in `value`.  Callers
    /// consuming `value` should treat it as accurate to this many
    /// digits and not extrapolate past.
    pub dps: u32,
}

impl PrecisionScalar {
    /// Build from a `rug::Float` at the given decimal precision.
    /// Reuses the same string conversion as `seminormal_mpfr.rs` —
    /// `Float::to_string_radix(10, Some(dps))`.
    pub fn from_rug(f: &rug::Float, dps: u32) -> Self {
        Self {
            value: f.to_string_radix(10, Some(dps as usize)),
            dps,
        }
    }

    /// Parse the decimal string back to a `rug::Float` at the
    /// requested precision (≥ this scalar's source precision).
    /// Adds 8 buffer bits for safe rounding.
    pub fn to_rug(&self, dps: u32) -> rug::Float {
        // bits = ceil(dps · log₂(10)) + 8 buffer
        let bits = (dps as f64 * std::f64::consts::LOG2_10 + 8.0).ceil() as u32;
        rug::Float::parse(&self.value)
            .map(|p| rug::Float::with_val(bits, p))
            .unwrap_or_else(|e| {
                panic!(
                    "PrecisionScalar::to_rug: invalid decimal {:?}: {}",
                    self.value, e
                )
            })
    }

    /// Lossy projection to `f64`.  Only call from a code site that
    /// explicitly accepts the precision drop (logging, charts,
    /// sanity checks).  For witness JSON or downstream HP
    /// computations, prefer [`Self::to_rug`].
    pub fn to_f64_lossy(&self) -> f64 {
        self.value.parse().unwrap_or_else(|e| {
            panic!(
                "PrecisionScalar::to_f64_lossy: invalid decimal {:?}: {}",
                self.value, e
            )
        })
    }

    /// Build directly from an `f64`, recording the source precision
    /// as 16 dps (IEEE double's full envelope).  Useful when the
    /// producer is an existing `f64` solver but the consumer wants
    /// the wire-level uniformity of the `PrecisionScalar` envelope.
    pub fn from_f64(v: f64) -> Self {
        Self {
            value: format!("{:.16e}", v),
            dps: 16,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use rug::ops::Pow;
    use rug::Float;

    #[test]
    fn round_trip_50_dps() {
        // 50-dps PI via mpfr, round-trip through PrecisionScalar.
        let prec = 167; // 50 dps + buffer
        let pi = rug::float::Constant::Pi;
        let pi_50 = Float::with_val(prec, pi);
        let ps = PrecisionScalar::from_rug(&pi_50, 50);
        assert_eq!(ps.dps, 50);
        // First digits should match canonical π
        assert!(
            ps.value.starts_with("3.14159265358979323846264338327950288")
                || ps.value.starts_with("3.1415926535897932384626433832795028"),
            "wrong π prefix: {}",
            ps.value
        );
        // Round trip back to rug::Float
        let back = ps.to_rug(50);
        let diff = (Float::with_val(prec, &pi_50) - back).abs();
        let tol = Float::with_val(prec, 10).pow(-48); // 1e-48 — within 50 dps
        assert!(diff < tol, "round-trip drift exceeded 1e-48");
    }

    #[test]
    fn from_f64_records_16_dps() {
        let ps = PrecisionScalar::from_f64(1.10997859555418057);
        assert_eq!(ps.dps, 16);
        assert!(ps.value.starts_with("1.1099785955541805"));
    }

    #[test]
    fn lossy_f64_is_an_escape_hatch() {
        let ps = PrecisionScalar {
            value: "1.10997859555418057".to_string(),
            dps: 50,
        };
        let f = ps.to_f64_lossy();
        // f64 can carry ~16 sig figs, dps=50 gets truncated
        assert!((f - 1.10997859555418057f64).abs() < 1e-15);
    }

    #[test]
    fn serde_round_trip() {
        let ps = PrecisionScalar {
            value: "1.10997859555418057528".to_string(),
            dps: 20,
        };
        let json = serde_json::to_string(&ps).unwrap();
        assert!(json.contains("\"value\""));
        assert!(json.contains("\"dps\""));
        assert!(json.contains("20"));
        let back: PrecisionScalar = serde_json::from_str(&json).unwrap();
        assert_eq!(back, ps);
    }
}
