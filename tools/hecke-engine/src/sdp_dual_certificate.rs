//! §S9.2 — Dual-certificate verification (Peyrl–Parrilo recipe).
//!
//! Take a Clarabel-rs **f64** SDP solution, tighten each
//! Wedderburn-block dual matrix to nearby small-denom rationals via
//! the §S9.1 Stern–Brocot helper, and emit a [`CertifiedSdpReport`]
//! that carries the rational dual + a per-block summary.
//!
//! `tighten_solution` is hard-wired to `DefaultSolution<f64>` —
//! upstream `dual_psd_block` returns f64 entries which §S9.1's
//! Stern-Brocot helper rounds to BigInt rationals.  An MpfrFloat
//! variant would need a separate `dual_psd_block_mpfr` accessor +
//! a different Stern-Brocot kernel; not in scope here.  Per the
//! `clarabel-mpfr ⊥ clarabel-sdp` mutex documented in
//! [`docs/audits/exact-sdp-feasibility.md`](../../docs/audits/exact-sdp-feasibility.md),
//! a single binary cannot mix MpfrFloat and SDP cones in any case.
//!
//! This is the post-IPM rationalisation pipeline described in
//! [`docs/audits/exact-sdp-feasibility.md`](../../docs/audits/exact-sdp-feasibility.md):
//! exact-rational IPM doesn't scale (extension-tower blowup), but
//! rationalising the *output* dual is finite and the
//! Wedderburn-block decomposition keeps each per-block
//! verification at degree `d_λ`, not `n_0!`.
//!
//! This v0 emits the rationalised dual and reports per-block
//! min/max diagonal entries.  Full Sturm-chain PSD verification on
//! the rational characteristic polynomial is §S9.3 (deferred).
//!
//! Per workplan
//! [`CLARABEL_PRECISION_PLAN.md`](../CLARABEL_PRECISION_PLAN.md) §S9.2.

use crate::rational_round::{rational_to_f64, tighten_f64};
use clarabel::solver::DefaultSolution;
use num_bigint::BigInt;
use num_traits::Zero;
use serde::{Deserialize, Serialize};

/// One Wedderburn-block dual matrix tightened to rationals.
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct CertifiedDualBlock {
    /// Index into Clarabel's *internal* cone-block list (the
    /// collapsed `cone_specs`, not the user-supplied cone list).
    /// Clarabel collapses adjacent same-type cones — e.g. two
    /// `NonnegativeConeT(1)` become one `NonnegativeConeT(2)` in
    /// the internal layout — so `idx` here is not the same as the
    /// caller's input-cone index.
    pub idx: usize,
    /// Block dimension `d_λ`.
    pub d: usize,
    /// Rationalised dual entries as `(num_str, den_str)` strings —
    /// stringified so the witness JSON serialises cleanly without
    /// requiring a custom serde impl for `BigInt`.
    pub entries: Vec<Vec<(String, String)>>,
    /// `true` iff every diagonal entry is non-negative.  A hard
    /// PSD precondition (necessary; not sufficient — full PSD
    /// verification needs Sturm-chain via `crate::sturm_psd`).
    /// Computed from the BigInt numerator sign directly (since
    /// `den > 0`), so this flag never corrupts on f64 over/underflow.
    pub all_diag_nonneg: bool,
    /// Min diagonal entry as f64 projection — for human display
    /// and quick screening only.  May be `f64::INFINITY` if all
    /// diagonals f64-projected to NaN/overflow.  For correctness
    /// checks, use `all_diag_nonneg` (computed via exact integer
    /// sign tests on the rational numerators).
    pub min_diag_f64: f64,
    /// Max absolute entry across the matrix.  Useful for spotting
    /// numerical anomalies in the f64 solve before tightening.
    pub max_abs_f64: f64,
    /// Maximum denominator bit-length across all entries —
    /// reports how "small-denom" the rationalised block is.
    pub max_denom_bits: u64,
}

/// Full certificate for an SDP solution.
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct CertifiedSdpReport {
    /// Dimension of the Hecke algebra `H_n` for the parent problem.
    pub n: usize,
    /// q_0 as a decimal string (round-trip via the
    /// [`PrecisionScalar`](crate::precision_scalar) envelope is
    /// recommended for the canonical witness JSON).
    pub q_str: String,
    /// Denominator bound used for tightening.  Smaller bounds give
    /// crisper rationals but larger projection drift; larger bounds
    /// are more faithful to the f64 solver output.  Recommended:
    /// 10_000 for "easily-readable" certificates, 10^12 for
    /// faithful round-tripping of the f64 solution.
    pub q_max: u64,
    /// One entry per cone in Clarabel's *internal* (collapsed)
    /// cone-block list.  PSD blocks have `Some(CertifiedDualBlock)`;
    /// non-PSD cones have `None`.  The length of this vector
    /// matches `solution.primal_residual_per_block().len()`, NOT
    /// the user's input-cone count.
    pub blocks: Vec<Option<CertifiedDualBlock>>,
    /// Aggregate verdict — true iff every PSD block has all-
    /// non-negative diagonals (computed via exact BigInt sign
    /// tests).  Necessary condition for PSD; sufficient
    /// verification needs Sturm chains (`crate::sturm_psd`).
    pub all_diags_nonneg: bool,
}

/// Tighten a single Clarabel solution into a [`CertifiedSdpReport`].
///
/// Walks `solution.dual_psd_block(idx)` for each `idx` until the
/// underlying `cone_specs` are exhausted.  Each PSD cone yields a
/// `Some(CertifiedDualBlock)` whose entries are tightened to
/// rationals via the §S9.1 [`tighten_f64`] helper.  Non-PSD
/// `cone_specs` indices yield `None` in the corresponding
/// `blocks` slot.  `cone_specs` may be shorter than the
/// user-input cone list because Clarabel internally collapses
/// adjacent same-type cones (e.g. two `NonnegativeConeT(1)` →
/// one `NonnegativeConeT(2)`).
pub fn tighten_solution(
    solution: &DefaultSolution<f64>,
    n: usize,
    q_str: &str,
    q_max: u64,
) -> CertifiedSdpReport {
    let mut blocks: Vec<Option<CertifiedDualBlock>> = Vec::new();
    let mut all_diags_nonneg = true;

    // Walk solution.cone_specs by trying dual_psd_block at every
    // index until we run out (None for out-of-range OR non-PSD).
    // We use `primal_residual_per_block().len()` as a proxy for
    // the cone count since `cone_specs` itself isn't part of the
    // public API.
    let n_cones = solution.primal_residual_per_block().len();
    for idx in 0..n_cones {
        let dual_mat = match solution.dual_psd_block(idx) {
            Some(m) => m,
            None => {
                blocks.push(None);
                continue;
            }
        };
        let d = dual_mat.len();
        // Track exact-rational non-negativity via BigInt sign tests
        // (num >= 0 since den > 0 by construction).  Fall back to
        // f64 projection for the human-readable min_diag_f64 only.
        // Tighten every entry; track stats.
        let mut entries: Vec<Vec<(String, String)>> =
            Vec::with_capacity(d);
        let mut min_diag_f64 = f64::INFINITY;
        let mut max_abs_f64 = 0.0_f64;
        let mut max_denom_bits = 0_u64;
        let mut block_diag_nonneg = true;
        let zero = BigInt::zero();
        for (i, row) in dual_mat.iter().enumerate() {
            let mut row_out: Vec<(String, String)> = Vec::with_capacity(d);
            for (j, &v) in row.iter().enumerate() {
                let abs_v = v.abs();
                if abs_v > max_abs_f64 {
                    max_abs_f64 = abs_v;
                }
                let (num, den) = tighten_f64(v, q_max);
                let bits = den.bits();
                if bits > max_denom_bits {
                    max_denom_bits = bits;
                }
                if i == j {
                    // Exact-rational non-negativity: den > 0 by
                    // construction in tighten_f64, so the sign of
                    // (num/den) equals the sign of num.  Avoids
                    // any f64 over/underflow corrupting the
                    // verdict.
                    if num < zero {
                        block_diag_nonneg = false;
                    }
                    // Filter only NaN — let `-INFINITY` through so an
                    // overflow on a huge negative numerator still
                    // surfaces as the most-extreme negative value.
                    // The PSD verdict itself runs on `block_diag_nonneg`
                    // (exact BigInt sign test), so this f64 path is
                    // for human display only.
                    let proj = rational_to_f64(&num, &den);
                    if !proj.is_nan() && proj < min_diag_f64 {
                        min_diag_f64 = proj;
                    }
                }
                row_out.push((num.to_string(), den.to_string()));
            }
            entries.push(row_out);
        }
        if !block_diag_nonneg {
            all_diags_nonneg = false;
        }
        blocks.push(Some(CertifiedDualBlock {
            idx,
            d,
            entries,
            all_diag_nonneg: block_diag_nonneg,
            min_diag_f64,
            max_abs_f64,
            max_denom_bits,
        }));
    }

    CertifiedSdpReport {
        n,
        q_str: q_str.to_string(),
        q_max,
        blocks,
        all_diags_nonneg,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use clarabel::algebra::CscMatrix;
    use clarabel::solver::*;

    /// Build the §S9 example SDP — a tiny PSD-feasibility problem
    /// with a known-PSD dual.  Two NonnegativeCone constraints +
    /// one PSDTriangleConeT(2) — minimise α subject to
    /// `α · (B - I) + I  ⪰ 0` for B = 2·I.
    /// Optimum is α = 1, dual block = I_2 (positive definite).
    fn solve_tiny_sdp() -> (DefaultSolution<f64>, Vec<SupportedConeT<f64>>) {
        let p: CscMatrix<f64> = CscMatrix::<f64>::zeros((1, 1));
        let q_vec = vec![-1.0_f64];

        let sqrt2 = 2f64.sqrt();
        // svec(2I-I) = svec(I) = [1, 0, 1] (col-major upper-tri √2-scaled)
        // We pose `α · (B-I) + I ⪰ 0` with B = 2I
        //   svec((B-I)) = svec(I) = [1, 0, 1]
        //   svec(I)     = [1, 0, 1]
        //   A row k entries: -svec(B-I)[k]
        //   b row k entries: +svec(I)[k]
        let svec_id = vec![1.0_f64, 0.0_f64 * sqrt2, 1.0_f64];
        let mut a_rows: Vec<usize> = Vec::new();
        let mut a_vals: Vec<f64> = Vec::new();
        let mut b: Vec<f64> = Vec::new();
        let mut row = 0_usize;
        // (1) α ≤ 1
        a_rows.push(row);
        a_vals.push(1.0);
        b.push(1.0);
        row += 1;
        // (2) α ≥ 0
        a_rows.push(row);
        a_vals.push(-1.0);
        b.push(0.0);
        row += 1;
        // (3) PSDTriangleConeT(2)
        for k in 0..3 {
            a_rows.push(row + k);
            a_vals.push(-svec_id[k]);
            b.push(svec_id[k]);
        }
        row += 3;

        let nnz = a_rows.len();
        let a_csc = CscMatrix::new(row, 1, vec![0, nnz], a_rows, a_vals);
        let cones: Vec<SupportedConeT<f64>> = vec![
            SupportedConeT::NonnegativeConeT(1),
            SupportedConeT::NonnegativeConeT(1),
            SupportedConeT::PSDTriangleConeT(2),
        ];
        let settings = DefaultSettingsBuilder::default()
            .verbose(false)
            .max_iter(200)
            .build()
            .unwrap();
        let mut solver = DefaultSolver::new(&p, &q_vec, &a_csc, &b, &cones, settings).unwrap();
        solver.solve();
        (solver.solution, cones)
    }

    #[test]
    fn tighten_solution_psd_dual_passes_diag_screen() {
        let (sol, _cones) = solve_tiny_sdp();
        let report = tighten_solution(&sol, 3, "1.10998", 10_000);
        let psd = report
            .blocks
            .iter()
            .filter_map(|b| b.as_ref())
            .next()
            .expect("expected at least one PSD block");
        assert_eq!(psd.d, 2);
        assert_eq!(psd.entries.len(), 2);
        assert_eq!(psd.entries[0].len(), 2);
        // Min diagonal should be non-negative for this PSD problem.
        // Allow tiny solver-tolerance slack.
        assert!(
            psd.min_diag_f64 >= -1e-6,
            "expected PSD diag, got min_diag={}",
            psd.min_diag_f64
        );
    }

    #[test]
    fn tighten_solution_serialises_to_json() {
        let (sol, _cones) = solve_tiny_sdp();
        let report = tighten_solution(&sol, 3, "1.10998", 10_000);
        let json = serde_json::to_string_pretty(&report).expect("serialises");
        assert!(json.contains("\"q_str\""));
        assert!(json.contains("\"q_max\""));
        assert!(json.contains("\"blocks\""));
        // Round-trip
        let back: CertifiedSdpReport =
            serde_json::from_str(&json).expect("deserialises");
        assert_eq!(back.q_str, "1.10998");
        assert_eq!(back.q_max, 10_000);
    }
}
