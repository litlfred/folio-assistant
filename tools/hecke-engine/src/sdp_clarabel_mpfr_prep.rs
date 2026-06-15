//! §S4-MPFR (pivoted) — MPFR-precision constraint preparation for
//! the f64 Clarabel SDP path.
//!
//! Architectural background.  The originally-sketched §S4-MPFR was
//! a direct port of [`crate::sdp_solver_clarabel`] to
//! `T = MpfrFloat`.  That's not implementable: upstream Clarabel-rs
//! defines `MaybeBlasFloatT: Copy` under `cfg(feature = "sdp")`,
//! and `MpfrFloat` is not `Copy`.  See
//! [`docs/audits/exact-sdp-feasibility.md`](../../docs/audits/exact-sdp-feasibility.md).
//!
//! What we *can* do is build the constraint matrices at MPFR
//! precision (using [`crate::seminormal_mpfr::seminormal_matrices_mpfr`]
//! from §S1, and the [`crate::dense_la_mpfr`] helpers from §S2/§S3),
//! then project to `f64` only at the Clarabel boundary.  This
//! avoids the f64 round-trip in the matrix-arithmetic core that
//! the existing [`crate::sdp_solver_clarabel::build_rho_lambda`]
//! incurs at every generator multiplication, while still using
//! Clarabel's f64 SDP solver downstream.
//!
//! The win.  At QOU's q_0 ≈ 1.1097, the existing f64 ρ_λ build
//! accumulates IEEE rounding error across `ℓ(braid_word)` matrix
//! multiplications.  At H_18 (⁶Li) with braid words around
//! length ~30, this approaches the f64 limit and risks PSD-edge
//! sign flips.  Building the same product at 50 dps and
//! projecting only at the very end gives the f64 IPM a
//! constraint matrix accurate to f64 limits, not to f64⁻¹⁵.
//!
//! Per workplan
//! [`CLARABEL_PRECISION_PLAN.md`](../CLARABEL_PRECISION_PLAN.md) §S4-MPFR.

use crate::dense_la_mpfr::{
    dense_dense_mul_mpfr, invert_matrix_h_mpfr, sparse_to_dense_mpfr, symmetrize_mpfr,
};
use crate::seminormal_mpfr::{dps_to_bits, seminormal_matrices_mpfr};
use rug::Float;

/// Build ρ_λ(T_w) at MPFR precision, then project to f64 at the
/// very end.  MPFR-precision analogue of
/// [`crate::sdp_solver_clarabel::build_rho_lambda`] (private).
///
/// Used by callers who want to feed the f64 Clarabel SDP solver
/// constraint matrices that don't carry accumulated f64 rounding
/// error from `ℓ(braid_word)` matrix multiplications.
///
/// `q_str` — substrate parameter as a decimal string.
/// `dps`   — MPFR working precision in decimal digits.
pub fn build_rho_lambda_mpfr_to_f64(
    shape: &[usize],
    braid_word: &[i32],
    q_str: &str,
    dps: u32,
) -> Vec<Vec<f64>> {
    let prec = dps_to_bits(dps);

    // §S1 — sparse generator matrices at MPFR precision.
    let sparse_gens = seminormal_matrices_mpfr(shape, q_str, dps);
    let dim = if sparse_gens.is_empty() {
        1
    } else {
        sparse_gens[0].len()
    };

    // h = q − q⁻¹ at MPFR precision.
    let q_mpfr = Float::parse(q_str)
        .map(|p| Float::with_val(prec, p))
        .unwrap_or_else(|e| panic!("build_rho_lambda_mpfr_to_f64: invalid q_str {q_str:?}: {e}"));
    let h = Float::with_val(prec, &q_mpfr) - Float::with_val(prec, q_mpfr.clone().recip());

    // §S2 — densify each sparse generator and pre-build inverses.
    let dense_gens: Vec<Vec<Vec<Float>>> = sparse_gens
        .iter()
        .map(|sg| sparse_to_dense_mpfr(sg, dim, prec))
        .collect();
    let dense_inv: Vec<Vec<Vec<Float>>> = dense_gens
        .iter()
        .map(|dg| invert_matrix_h_mpfr(dg, &h, prec))
        .collect();

    // Identity initialiser.
    let mut prod: Vec<Vec<Float>> = (0..dim)
        .map(|i| {
            (0..dim)
                .map(|j| Float::with_val(prec, if i == j { 1 } else { 0 }))
                .collect()
        })
        .collect();

    // Walk the braid word, multiplying generators (or their
    // Hecke-relation inverses) at MPFR precision.
    for &gen in braid_word {
        assert!(
            gen != 0,
            "build_rho_lambda_mpfr_to_f64: braid generator 0 is invalid \
             (generators are 1-indexed σ_1, σ_2, ...)"
        );
        let idx = gen.unsigned_abs() as usize - 1;
        assert!(
            idx < dense_gens.len(),
            "build_rho_lambda_mpfr_to_f64: braid generator {} out of range \
             for {} available generators (shape requires |gen| ≤ n-1)",
            gen,
            dense_gens.len()
        );
        let g = if gen > 0 {
            &dense_gens[idx]
        } else {
            &dense_inv[idx]
        };
        prod = dense_dense_mul_mpfr(&prod, g, prec);
    }

    // Symmetrise at MPFR precision before projecting.
    let sym = symmetrize_mpfr(&prod, prec);

    // §S4-MPFR specific: project to f64 only at the boundary.  The
    // accumulated arithmetic ran at 50+ dps; the projection is
    // the only IEEE rounding step in the entire ρ_λ build.
    sym.iter()
        .map(|row| row.iter().map(|v| v.to_f64()).collect())
        .collect()
}

/// §S5-MPFR — basis-element variant.  Walks a canonical reduced
/// word (1-indexed positive generators only — no inverses, no
/// signs) and builds ρ_λ(T_w) at MPFR precision, projecting to
/// f64 only at the boundary.
///
/// Mirrors `build_rho_lambda_for_basis_element` (the duplicated
/// f64 helper in [`crate::sdp_solve_canonical_t_w`] and
/// [`crate::sdp_recover_canonical`]).  Used by the §S5-MPFR
/// callers to build `Σ_w c_w · ρ_λ(T_w)` constraint matrices
/// without the all-f64 round-trip in the matrix-arithmetic core.
///
/// Note: canonical words have no negative generators (all `T_w`
/// in the GB-NF basis are positive products), so this function
/// does NOT use the inverse generators from §S4-MPFR.  Matches
/// the f64 helper's signature semantically.
pub fn build_rho_lambda_for_basis_element_mpfr_to_f64(
    shape: &[usize],
    canonical_word: &[u32],
    q_str: &str,
    dps: u32,
) -> Vec<Vec<f64>> {
    let prec = dps_to_bits(dps);

    let sparse_gens = seminormal_matrices_mpfr(shape, q_str, dps);
    let dim = if sparse_gens.is_empty() {
        1
    } else {
        sparse_gens[0].len()
    };

    let dense_gens: Vec<Vec<Vec<Float>>> = sparse_gens
        .iter()
        .map(|sg| sparse_to_dense_mpfr(sg, dim, prec))
        .collect();

    let mut prod: Vec<Vec<Float>> = (0..dim)
        .map(|i| {
            (0..dim)
                .map(|j| Float::with_val(prec, if i == j { 1 } else { 0 }))
                .collect()
        })
        .collect();

    for &g in canonical_word {
        assert!(
            g >= 1,
            "build_rho_lambda_for_basis_element_mpfr_to_f64: canonical-word \
             generator {} is invalid (canonical words use positive 1-indexed \
             generators only — no zero, no negatives)",
            g
        );
        let idx = g as usize - 1;
        assert!(
            idx < dense_gens.len(),
            "build_rho_lambda_for_basis_element_mpfr_to_f64: canonical-word \
             generator {} out of range for {} available generators \
             (likely word/shape mismatch)",
            g,
            dense_gens.len()
        );
        prod = dense_dense_mul_mpfr(&prod, &dense_gens[idx], prec);
    }

    // Note: callers project to f64 *without* symmetrising, since the
    // basis-element ρ_λ(T_w) is not generally symmetric — the
    // symmetrisation happens later when building the full
    // Σ_w c_w · ρ_λ(T_w) for the PSD constraint.  This matches the
    // f64 helper.
    prod.iter()
        .map(|row| row.iter().map(|v| v.to_f64()).collect())
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::sdp_solver_clarabel::solve_alpha_psd_clarabel;
    use crate::seminormal::seminormal_matrices;

    /// Cross-validate: building ρ_λ via MPFR-then-project should
    /// match the existing f64-throughout build to within f64
    /// precision on a problem where the braid word is short (so
    /// f64 hasn't yet accumulated meaningful rounding error).
    #[test]
    fn mpfr_prep_matches_f64_short_braid_h3() {
        let shape = vec![2, 1]; // λ = [2,1], dim 2
        let braid = vec![1, -2, 1, -2, 1, -2]; // proton Borromean
        let q_str = "1.10998";
        let q_f64: f64 = q_str.parse().unwrap();

        let mpfr_proj = build_rho_lambda_mpfr_to_f64(&shape, &braid, q_str, 50);

        // Replicate the f64 build from build_rho_lambda (private)
        // by re-running the same algorithm on the public sparse
        // matrices.
        let sparse_gens = seminormal_matrices(&shape, q_f64);
        let dim = sparse_gens[0].len();
        let h = q_f64 - 1.0 / q_f64;
        let mut dense_gens: Vec<Vec<Vec<f64>>> = sparse_gens
            .iter()
            .map(|sg| {
                let mut m = vec![vec![0.0; dim]; dim];
                for (i, row) in sg.iter().enumerate() {
                    for &(j, v) in row {
                        m[i][j] = v;
                    }
                }
                m
            })
            .collect();
        let dense_inv: Vec<Vec<Vec<f64>>> = dense_gens
            .iter()
            .map(|dg| {
                let mut m = dg.clone();
                for i in 0..dim {
                    m[i][i] -= h;
                }
                m
            })
            .collect();
        let mut prod = vec![vec![0.0_f64; dim]; dim];
        for i in 0..dim {
            prod[i][i] = 1.0;
        }
        for &g in &braid {
            let idx = g.unsigned_abs() as usize - 1;
            if idx >= dense_gens.len() {
                continue;
            }
            let m = if g > 0 {
                &dense_gens[idx]
            } else {
                &dense_inv[idx]
            };
            let mut next = vec![vec![0.0_f64; dim]; dim];
            for i in 0..dim {
                for k in 0..dim {
                    if prod[i][k] == 0.0 {
                        continue;
                    }
                    let aik = prod[i][k];
                    for j in 0..dim {
                        next[i][j] += aik * m[k][j];
                    }
                }
            }
            prod = next;
        }
        // Symmetrise
        let mut f64_path = vec![vec![0.0_f64; dim]; dim];
        for i in 0..dim {
            for j in 0..dim {
                f64_path[i][j] = 0.5 * (prod[i][j] + prod[j][i]);
            }
        }

        // The two paths should match to within f64's rounding
        // envelope (~1e-13 for 6 generator multiplications).  At
        // longer words the MPFR path will diverge in the FAVOURABLE
        // direction (less accumulated error).
        let _ = dense_gens; // silence borrow
        for i in 0..dim {
            for j in 0..dim {
                let diff = (mpfr_proj[i][j] - f64_path[i][j]).abs();
                assert!(
                    diff < 1e-12,
                    "mpfr-then-f64 vs all-f64 disagree at ({i},{j}): {} vs {} (diff {:.2e})",
                    mpfr_proj[i][j],
                    f64_path[i][j],
                    diff
                );
            }
        }
    }

    /// §S5-MPFR — basis-element variant cross-validates against
    /// the existing f64 helper (replicated inline since the f64
    /// version is module-private).  Canonical word multiplication
    /// without inverses.
    #[test]
    fn mpfr_prep_basis_element_matches_f64_h3() {
        let shape = vec![2, 1];
        // canonical word: σ_1 σ_2 σ_1 → represents w = (1 3 2) ∈ S_3
        let word: Vec<u32> = vec![1, 2, 1];
        let q_str = "1.10998";
        let q_f64: f64 = q_str.parse().unwrap();

        let mpfr_proj = build_rho_lambda_for_basis_element_mpfr_to_f64(
            &shape, &word, q_str, 50,
        );

        // f64 reference computation
        let sparse_gens = seminormal_matrices(&shape, q_f64);
        let dim = sparse_gens[0].len();
        let dense_gens: Vec<Vec<Vec<f64>>> = sparse_gens
            .iter()
            .map(|sg| {
                let mut m = vec![vec![0.0; dim]; dim];
                for (i, row) in sg.iter().enumerate() {
                    for &(j, v) in row {
                        m[i][j] = v;
                    }
                }
                m
            })
            .collect();
        let mut prod = vec![vec![0.0_f64; dim]; dim];
        for i in 0..dim {
            prod[i][i] = 1.0;
        }
        for &g in &word {
            let idx = g as usize - 1;
            if idx >= dense_gens.len() {
                continue;
            }
            let m = &dense_gens[idx];
            let mut next = vec![vec![0.0_f64; dim]; dim];
            for i in 0..dim {
                for k in 0..dim {
                    if prod[i][k] == 0.0 {
                        continue;
                    }
                    let aik = prod[i][k];
                    for j in 0..dim {
                        next[i][j] += aik * m[k][j];
                    }
                }
            }
            prod = next;
        }

        for i in 0..dim {
            for j in 0..dim {
                let diff = (mpfr_proj[i][j] - prod[i][j]).abs();
                assert!(
                    diff < 1e-12,
                    "mpfr-then-f64 vs all-f64 (basis-element) disagree at ({i},{j}): \
                     {} vs {} (diff {:.2e})",
                    mpfr_proj[i][j],
                    prod[i][j],
                    diff
                );
            }
        }
    }

    /// Sanity: feeding the MPFR-prep ρ_λ matrices into the
    /// existing f64 SDP solver should still produce the canonical
    /// answer (α* ≈ 1 on the proton Borromean, Borromean is on
    /// the PSD-cone interior).
    #[test]
    fn mpfr_prep_existing_sdp_solver_agreement_h3() {
        let q_str = "1.10998";
        let q_f64: f64 = q_str.parse().unwrap();
        // The existing f64 solver does its own ρ_λ build internally,
        // so we can't directly inject the MPFR-prep version yet —
        // that would need a second public entry-point on
        // sdp_solver_clarabel.  This test instead just confirms the
        // existing solver still returns α* ≈ 1 at the same q —
        // a regression check that §S4-MPFR additions don't perturb
        // the existing path.
        let report = solve_alpha_psd_clarabel(3, &[1, -2, 1, -2, 1, -2], q_f64);
        assert!(
            report.alpha_star > 0.999,
            "α* = {} expected ≈ 1.0; status: {}",
            report.alpha_star,
            report.solver_status
        );
    }
}
