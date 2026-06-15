//! Phase R5-minimal: Wedderburn-block PSD-cone verifier.
//!
//! For a candidate Hecke element T_w (e.g. the proton's Borromean
//! braid), poses
//!
//!     find  α* := max{α ∈ [0, 1] :
//!         α · ρ_λ(T_w) + (1 − α) · I_{d_λ}  ⪰ 0  ∀ λ ⊢ n}
//!
//! and returns α*.
//!
//! - α* = 1 ⇒ T_w is on/inside the Wedderburn-block PSD cone for
//!   every partition λ — i.e. a feasible candidate for the joint-
//!   tower SDP without modification.
//! - α* < 1 ⇒ at least one block is NOT PSD; (1 − α*) is the gap
//!   from the PSD cone boundary in the α-direction.
//!
//! Implementation: bisection on α with eigenvalue check at each step.
//! Equivalent to the SDP value function (Clarabel would yield the
//! same α*) without needing system BLAS/LAPACK.  Each eigenvalue
//! evaluation reuses [`wedderburn_psd::evaluate_all_blocks`] machinery.
//!
//! When system BLAS becomes available, this can be swapped for a
//! native Clarabel.rs SDP call (the design spec is unchanged).
//!
//! See [RUST_INTEGRATION.md](../../RUST_INTEGRATION.md) §"Phase R5".

use crate::gb_nf_reducer::BraidLetter;
use crate::wedderburn_psd::{evaluate_all_blocks, evaluate_all_blocks_letters_capped};

/// Result of the PSD-cone verifier.
#[derive(Debug, Clone)]
pub struct SdpVerifierReport {
    pub n: usize,
    pub q0: f64,
    /// Optimal mixing α* ∈ [0, 1].
    pub alpha_star: f64,
    pub solver_status: String,
    pub n_blocks: usize,
    pub block_dims: Vec<usize>,
    pub iterations: u32,
    /// Min eigenvalue across all blocks at α = α*.
    pub min_eigenvalue_at_alpha_star: f64,
}

/// Compute min eigenvalue of α · ρ + (1−α) · I across all Wedderburn
/// blocks of a given braid in H_n at substrate q.
fn min_eig_at_alpha(n: usize, braid_word: &[i32], q: f64, alpha: f64) -> f64 {
    if n < 2 {
        return 1.0;
    }
    let blocks = evaluate_all_blocks(n, braid_word, q);
    let mut global_min = f64::INFINITY;
    for b in &blocks {
        // For block of dim d_λ with eigenvalues ε_i of ρ:
        //   α ρ + (1 − α) I  has eigenvalues  α · ε_i + (1 − α).
        // Minimum over i:
        let block_min = b
            .matrix_at_q_0_sym_eigvals
            .iter()
            .map(|&e| alpha * e + (1.0 - alpha))
            .fold(f64::INFINITY, f64::min);
        if block_min < global_min {
            global_min = block_min;
        }
    }
    global_min
}

/// Bisect for largest α ∈ [0, 1] keeping all blocks PSD.
pub fn solve_alpha_psd(n: usize, braid_word: &[i32], q: f64) -> SdpVerifierReport {
    let parts = crate::seminormal::partitions_of(n);
    let block_dims: Vec<usize> = parts
        .iter()
        .map(|sh| {
            let sg = crate::seminormal::seminormal_matrices(sh, q);
            if sg.is_empty() {
                1
            } else {
                sg[0].len()
            }
        })
        .collect();

    // Test α = 1 first
    let min_at_one = min_eig_at_alpha(n, braid_word, q, 1.0);
    if min_at_one >= -1e-9 {
        return SdpVerifierReport {
            n,
            q0: q,
            alpha_star: 1.0,
            solver_status: "feasible at α = 1".to_string(),
            n_blocks: parts.len(),
            block_dims,
            iterations: 1,
            min_eigenvalue_at_alpha_star: min_at_one,
        };
    }

    // Test α = 0 (must be PSD: identity is PSD)
    let min_at_zero = min_eig_at_alpha(n, braid_word, q, 0.0);
    if min_at_zero < -1e-9 {
        // Should never happen — identity is PSD.
        return SdpVerifierReport {
            n,
            q0: q,
            alpha_star: 0.0,
            solver_status: format!(
                "BUG: identity not PSD? min_eig at α=0 = {:.4e}",
                min_at_zero
            ),
            n_blocks: parts.len(),
            block_dims,
            iterations: 1,
            min_eigenvalue_at_alpha_star: min_at_zero,
        };
    }

    // Bisect on [0, 1]
    let mut lo = 0.0f64;
    let mut hi = 1.0f64;
    let mut iters = 0u32;
    let max_iters = 64u32; // ~10^-19 precision
    while hi - lo > 1e-12 && iters < max_iters {
        let mid = 0.5 * (lo + hi);
        let m = min_eig_at_alpha(n, braid_word, q, mid);
        if m >= -1e-12 {
            lo = mid;
        } else {
            hi = mid;
        }
        iters += 1;
    }
    let alpha_star = lo;
    let min_at_star = min_eig_at_alpha(n, braid_word, q, alpha_star);
    SdpVerifierReport {
        n,
        q0: q,
        alpha_star,
        solver_status: format!(
            "bisection converged in {} iters; gap (1 − α*) = {:.4e}",
            iters,
            1.0 - alpha_star
        ),
        n_blocks: parts.len(),
        block_dims,
        iterations: iters,
        min_eigenvalue_at_alpha_star: min_at_star,
    }
}

/// Minimum eigenvalue across all Wedderburn-block PSD cones at
/// blending parameter α for a `BraidLetter` braid word.
fn min_eig_at_alpha_letters(
    n: usize,
    braid_word: &[BraidLetter],
    q: f64,
    alpha: f64,
    max_dim: usize,
) -> f64 {
    if n < 2 {
        return 1.0;
    }
    let blocks = evaluate_all_blocks_letters_capped(n, braid_word, q, max_dim);
    let mut global_min = f64::INFINITY;
    for b in &blocks {
        // Skip placeholder blocks (no eigvals — d_λ > max_dim)
        if b.matrix_at_q_0_sym_eigvals.is_empty() {
            continue;
        }
        let block_min = b
            .matrix_at_q_0_sym_eigvals
            .iter()
            .map(|&e| alpha * e + (1.0 - alpha))
            .fold(f64::INFINITY, f64::min);
        if block_min < global_min {
            global_min = block_min;
        }
    }
    global_min
}

/// **BraidLetter variant of `solve_alpha_psd`** (R5.7 extension).
///
/// Evaluates the per-partition Wedderburn-block eigenvalues **ONCE**
/// (via the expensive [`evaluate_all_blocks_letters_capped`] call),
/// then bisects on α using only the cached eigvals. This is critical
/// for ⁴He at H_12: the naive recompute-per-bisection-iter approach
/// would require ~64 evaluations × ~30s each = ~32 minutes; with
/// caching it's ~30s total.
///
/// Skips blocks with `d_λ > max_dim`.
pub fn solve_alpha_psd_letters(
    n: usize,
    braid_word: &[BraidLetter],
    q: f64,
    max_dim: usize,
) -> SdpVerifierReport {
    let parts = crate::seminormal::partitions_of(n);
    let block_dims: Vec<usize> = parts
        .iter()
        .map(|sh| {
            let sg = crate::seminormal::seminormal_matrices(sh, q);
            if sg.is_empty() {
                1
            } else {
                sg[0].len()
            }
        })
        .collect();

    // EVALUATE ONCE — get all per-block eigenvalues for the braid.
    let blocks = evaluate_all_blocks_letters_capped(n, braid_word, q, max_dim);

    // Collect the per-block eigenvalue vectors (skip placeholder blocks
    // where d_λ > max_dim → empty eigvals).
    let eigval_vecs: Vec<Vec<f64>> = blocks
        .iter()
        .filter(|b| !b.matrix_at_q_0_sym_eigvals.is_empty())
        .map(|b| b.matrix_at_q_0_sym_eigvals.clone())
        .collect();

    // Helper: min_eig at α from cached eigvals (O(sum of d_λ) per call).
    let min_eig_at_alpha = |alpha: f64| -> f64 {
        let mut global_min = f64::INFINITY;
        for evs in &eigval_vecs {
            for &e in evs {
                let v = alpha * e + (1.0 - alpha);
                if v < global_min {
                    global_min = v;
                }
            }
        }
        global_min
    };

    let min_at_one = min_eig_at_alpha(1.0);
    if min_at_one >= -1e-9 {
        return SdpVerifierReport {
            n,
            q0: q,
            alpha_star: 1.0,
            solver_status: "feasible at α = 1 (BraidLetter, cached eigvals)".to_string(),
            n_blocks: parts.len(),
            block_dims,
            iterations: 1,
            min_eigenvalue_at_alpha_star: min_at_one,
        };
    }
    let min_at_zero = min_eig_at_alpha(0.0);
    if min_at_zero < -1e-9 {
        return SdpVerifierReport {
            n,
            q0: q,
            alpha_star: 0.0,
            solver_status: format!(
                "BUG: identity not PSD? min_eig at α=0 = {:.4e}",
                min_at_zero
            ),
            n_blocks: parts.len(),
            block_dims,
            iterations: 1,
            min_eigenvalue_at_alpha_star: min_at_zero,
        };
    }
    let mut lo = 0.0f64;
    let mut hi = 1.0f64;
    let mut iters = 0u32;
    let max_iters = 64u32;
    while hi - lo > 1e-12 && iters < max_iters {
        let mid = 0.5 * (lo + hi);
        let m = min_eig_at_alpha(mid);
        if m >= -1e-12 {
            lo = mid;
        } else {
            hi = mid;
        }
        iters += 1;
    }
    let alpha_star = lo;
    let min_at_star = min_eig_at_alpha(alpha_star);
    SdpVerifierReport {
        n,
        q0: q,
        alpha_star,
        solver_status: format!(
            "bisection cached (BraidLetter, max_dim={}) {} iters; gap = {:.4e}",
            max_dim,
            iters,
            1.0 - alpha_star
        ),
        n_blocks: parts.len(),
        block_dims,
        iterations: iters,
        min_eigenvalue_at_alpha_star: min_at_star,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn proton_borromean_alpha_one() {
        // Borromean braid in H_3 — all Wedderburn blocks PSD ⇒ α* = 1.
        let q = 1.1097;
        let report = solve_alpha_psd(3, &[1, -2, 1, -2, 1, -2], q);
        assert!(
            report.alpha_star > 0.999,
            "α* = {} expected ≈ 1.0",
            report.alpha_star
        );
        assert_eq!(report.n_blocks, 3);
    }

    #[test]
    fn deuteron_alpha_quantifies_gap() {
        // 6_2 braid in B_3 — standard (2,1) block NOT PSD ⇒ α* < 1.
        let q = 1.1097;
        let report = solve_alpha_psd(3, &[1, -2, 1, 1, 1, -2], q);
        assert_eq!(report.n_blocks, 3);
        assert!(
            report.alpha_star >= 0.0 && report.alpha_star <= 1.0,
            "α* = {} should be in [0,1]",
            report.alpha_star
        );
        // Expect strictly < 1 since standard block is NOT PSD
        assert!(
            report.alpha_star < 0.9999,
            "α* = {} expected < 1 since standard block NOT PSD",
            report.alpha_star
        );
        // Min eigenvalue at α* should be ≈ 0 (we sit on the boundary).
        assert!(
            report.min_eigenvalue_at_alpha_star.abs() < 1e-6,
            "min eig at α* = {} should be ≈ 0 (on PSD boundary)",
            report.min_eigenvalue_at_alpha_star
        );
    }
}
