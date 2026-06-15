//! Matrix-M block-restricted χ^λ at substrate q_0 — Rust port of the
//! mpmath backend ([PR #1993](https://github.com/litlfred/qou/pull/1993))
//! and the consumer wire-in ([PR #2000](https://github.com/litlfred/qou/pull/2000)).
//!
//! Per the optimization audit
//! `docs/audits/2026-06-08-matrix-m-optimization-A-8-9-path.md` Tier 2,
//! porting the Phase-1.2 μ_p decomposition path to Rust gives a
//! ~100-1000× per-multiply speedup over `mpmath.mpf` (replaces Python
//! object dispatch with native `rug::Float` arithmetic), bringing ⁹Be
//! from minutes to seconds.
//!
//! ## What this module does
//!
//! For an atom braid β = β_left · σ_{k_split}^{bridge_sign} · β_right
//! (parabolic-shaped, see Python `chi_lambda_via_mu_p_decomposition`):
//!
//! 1. **Precompute per-μ_p block tables** at the substrate q_0:
//!    - For each μ_p ⊢ k_split grouping of the SYT basis of V_λ
//!    - Extract σ_g restricted to the block, for g = 1..k_split-1
//!      (left H_{k_split} generators preserve μ_p)
//!    - Extract σ_g restricted to the block, for g = k_split+1..n-1
//!      (right H_{n-k_split} generators preserve μ_p)
//!    - Extract the DIAGONAL block of σ_{k_split} (the bridge — off-
//!      diagonals don't enter the trace)
//!    - Full dim_V_λ × dim_V_λ matrices are built ONCE then dropped.
//!
//! 2. **At call time**: per μ_p, build
//!      B_p = ∏ block_σ_left[g]^{sign}   (signs encode inverse via h)
//!      B_n = ∏ block_σ_right[g]^{sign}
//!      M = block_σ_{k_split}^{bridge_sign}
//!    Sum Tr[B_p · M · B_n] over μ_p — that's χ^λ(T_β)(q_0).
//!
//! ## NO f64 in compute path
//!
//! `rug::Float` at `dps_to_bits(dps)` precision throughout. Mirrors
//! `seminormal_mpfr.rs` conventions exactly. The substrate q comes in
//! as a decimal string (no f64 round-trip at the boundary).
//!
//! ## Δ_λ-gate
//!
//! Pure Rust port of the trace identity from PR #1980/#1985/#1987/
//! #1993/#2000. No new ansatz, no fit, no calibration parameter.

use std::collections::HashMap;

use rug::Float;

use crate::seminormal::standard_young_tableaux;
use crate::seminormal_mpfr::{dps_to_bits, seminormal_matrices_mpfr, SparseMatrixMpfr};

/// Dense block matrix at mpfr precision — row-major `Vec<Vec<Float>>`.
/// Block sizes here are small (≤ dim V_λ for parabolic, ≤ ~100 in
/// practice for the deuteron through ⁴He range). For the per-(μ_p)
/// blocks the typical size is ≤ ~25.
pub type DenseBlockMpfr = Vec<Vec<Float>>;

/// Per-μ_p block data for the matrix-M trace formula at substrate q.
#[derive(Clone, Debug)]
pub struct BlockDataMpfr {
    pub mu_p: Vec<usize>,
    pub indices: Vec<usize>,
    pub size: usize,
    /// `sigmas_left[g]` = σ_g restricted to this μ_p-block, for
    /// `g = 1..k_split-1` (left parabolic generators preserve μ_p).
    pub sigmas_left: HashMap<usize, DenseBlockMpfr>,
    /// `sigmas_right[g]` = σ_g restricted to this μ_p-block, for
    /// `g = k_split+1..n-1` (right parabolic generators also preserve μ_p).
    pub sigmas_right: HashMap<usize, DenseBlockMpfr>,
    /// Diagonal-μ_p block of σ_{k_split} (the bridge). Only the
    /// diagonal block contributes to the trace formula.
    pub m_pp: DenseBlockMpfr,
}

/// Top-level matrix-M cache for one (shape, k_split, q) configuration.
#[derive(Clone, Debug)]
pub struct MatrixMCacheMpfr {
    pub shape: Vec<usize>,
    pub k_split: usize,
    pub dim: usize,
    pub prec: u32,
    pub h: Float,
    pub blocks: HashMap<Vec<usize>, BlockDataMpfr>,
}

// ── SYT grouping by μ_p ────────────────────────────────────────────

/// Group SYT indices of `shape` by μ_p = shape of first-k_split cells.
///
/// Returns a map μ_p (as partition tuple) → sorted Vec of SYT indices
/// whose first `k_split` entries form a sub-tableau of shape μ_p.
///
/// `k_split = 0` is rejected: a 0-cell μ_p has no meaning under the
/// parabolic split (and would silently drop every SYT into the empty-
/// partition group, masking caller bugs).
pub fn group_syts_by_mu_p(shape: &[usize], k_split: usize) -> HashMap<Vec<usize>, Vec<usize>> {
    assert!(
        k_split >= 1,
        "group_syts_by_mu_p: k_split must be ≥ 1 (the 1-based bridge index); got 0 — every SYT would silently drop into an empty μ_p group",
    );
    let n: usize = shape.iter().sum();
    assert!(
        k_split <= n,
        "group_syts_by_mu_p: k_split={} > shape sum {}: no SYT has that many cells to restrict to",
        k_split,
        n,
    );
    let syts = standard_young_tableaux(shape);
    let mut groups: HashMap<Vec<usize>, Vec<usize>> = HashMap::new();
    for (i, syt) in syts.iter().enumerate() {
        // Count cells per row among the first k_split SYT entries.
        let mut row_counts: HashMap<usize, usize> = HashMap::new();
        for k in 0..k_split.min(syt.len()) {
            let row = syt[k].0;
            *row_counts.entry(row).or_insert(0) += 1;
        }
        // With k_split ≥ 1 (asserted above) and syt.len() ≥ k_split
        // (every SYT of a partition of n ≥ k_split has at least k_split
        // cells), row_counts is always non-empty here.
        debug_assert!(!row_counts.is_empty());
        let max_row = row_counts.keys().max().copied().unwrap_or(0);
        // max_row is the highest row index that received an entry,
        // so row_counts[max_row] ≥ 1 — no trailing-zero strip needed.
        let mu_p: Vec<usize> = (0..=max_row)
            .map(|r| row_counts.get(&r).copied().unwrap_or(0))
            .collect();
        groups.entry(mu_p).or_default().push(i);
    }
    groups
}

// ── Dense matrix helpers (mpfr) ────────────────────────────────────

fn dense_zero(size: usize, prec: u32) -> DenseBlockMpfr {
    (0..size)
        .map(|_| (0..size).map(|_| Float::with_val(prec, 0)).collect())
        .collect()
}

fn dense_eye(size: usize, prec: u32) -> DenseBlockMpfr {
    let mut m = dense_zero(size, prec);
    for i in 0..size {
        m[i][i] = Float::with_val(prec, 1);
    }
    m
}

/// Extract sub-matrix at `indices × indices` from a sparse mpfr
/// representation. Result is dense.
///
/// Uses a `Vec<Option<usize>>` lookup sized to `sparse.len()` (the
/// full dim) for the (full-col → sub-col) map. The sparse rows have
/// only 1–2 entries each (per `seminormal_matrices_mpfr`), so the
/// inner loop is cheap; HashMap probing per cell would dominate.
fn extract_block_from_sparse(
    sparse: &SparseMatrixMpfr,
    indices: &[usize],
    prec: u32,
) -> DenseBlockMpfr {
    let size = indices.len();
    let dim = sparse.len();
    // Build a (full-col index → sub-col index) lookup as a Vec keyed by
    // full index. Allocation-predictable, no hashing per cell.
    let mut inv: Vec<Option<usize>> = vec![None; dim];
    for (sub_i, &full_i) in indices.iter().enumerate() {
        inv[full_i] = Some(sub_i);
    }
    let mut out = dense_zero(size, prec);
    for (sub_i, &full_i) in indices.iter().enumerate() {
        for (full_j, val) in &sparse[full_i] {
            if let Some(sub_j) = inv[*full_j] {
                out[sub_i][sub_j] = Float::with_val(prec, val);
            }
        }
    }
    out
}

fn matmul(a: &DenseBlockMpfr, b: &DenseBlockMpfr, prec: u32) -> DenseBlockMpfr {
    let n = a.len();
    let mut out = dense_zero(n, prec);
    for i in 0..n {
        for k in 0..n {
            let aik = &a[i][k];
            if aik.is_zero() {
                continue;
            }
            for j in 0..n {
                let term = Float::with_val(prec, aik) * &b[k][j];
                let new_val = Float::with_val(prec, &out[i][j]) + &term;
                out[i][j] = new_val;
            }
        }
    }
    out
}

/// Compute `M - h·I` in place (used for the Hecke-inverse formula
/// σ_g⁻¹ = σ_g - h · I extending linearly to blocks).
fn dense_sub_h_eye(m: &DenseBlockMpfr, h: &Float, prec: u32) -> DenseBlockMpfr {
    let n = m.len();
    let mut out = m.clone();
    for i in 0..n {
        out[i][i] = Float::with_val(prec, &out[i][i]) - h;
    }
    out
}

fn trace(m: &DenseBlockMpfr, prec: u32) -> Float {
    let mut total = Float::with_val(prec, 0);
    for i in 0..m.len() {
        total += &m[i][i];
    }
    total
}

// ── Top-level: precompute + chi compute ────────────────────────────

/// Build the matrix-M cache for (shape, k_split) at substrate q.
///
/// The full dim_V_λ × dim_V_λ seminormal matrices are built ONCE then
/// dropped after sub-block extraction; only the small per-μ_p blocks
/// are retained.
pub fn precompute_block_tables_mpfr(
    shape: &[usize],
    k_split: usize,
    q_str: &str,
    dps: u32,
) -> MatrixMCacheMpfr {
    let n: usize = shape.iter().sum();
    // k_split is the 1-based bridge generator index; valid range is
    // 1 ≤ k_split < n (so σ_{k_split} = sigmas[k_split - 1] exists).
    // Without the lower bound, k_split = 0 underflows `sigmas[k_split - 1]`
    // in the bridge extraction below.
    assert!(
        k_split >= 1,
        "k_split must be ≥ 1 (it is the 1-based bridge generator index), got {}",
        k_split,
    );
    assert!(
        k_split < n,
        "k_split = {} ≥ shape sum {} — no σ_{{k_split}} generator (need k_split < n)",
        k_split,
        n,
    );
    let prec = dps_to_bits(dps);
    let q = Float::parse(q_str)
        .map(|p| Float::with_val(prec, p))
        .unwrap_or_else(|e| panic!("invalid q_str {q_str:?}: {e}"));
    let h: Float = Float::with_val(prec, &q) - q.clone().recip();

    let sigmas = seminormal_matrices_mpfr(shape, q_str, dps);
    let groups = group_syts_by_mu_p(shape, k_split);

    let mut blocks: HashMap<Vec<usize>, BlockDataMpfr> = HashMap::new();
    for (mu_p, indices) in groups.into_iter() {
        let size = indices.len();
        let mut sigmas_left: HashMap<usize, DenseBlockMpfr> = HashMap::new();
        for g in 1..k_split {
            // σ_g is sigmas[g-1] (1-based index).
            sigmas_left.insert(g, extract_block_from_sparse(&sigmas[g - 1], &indices, prec));
        }
        let mut sigmas_right: HashMap<usize, DenseBlockMpfr> = HashMap::new();
        for g in (k_split + 1)..n {
            sigmas_right.insert(g, extract_block_from_sparse(&sigmas[g - 1], &indices, prec));
        }
        let m_pp = extract_block_from_sparse(&sigmas[k_split - 1], &indices, prec);
        blocks.insert(
            mu_p.clone(),
            BlockDataMpfr {
                mu_p,
                indices,
                size,
                sigmas_left,
                sigmas_right,
                m_pp,
            },
        );
    }

    let dim = sigmas[0].len();
    MatrixMCacheMpfr {
        shape: shape.to_vec(),
        k_split,
        dim,
        prec,
        h,
        blocks,
    }
}

/// Compute χ^λ(T_β)(q_0) via the matrix-M trace formula on the
/// pre-computed per-μ_p block tables.
///
/// `word_left` and `word_right` are slices of `(sign, gen_1based)`
/// pairs:
///   - `sign = +1`  → σ_g (the generator)
///   - `sign = -1`  → σ_g⁻¹ = σ_g - h·I (Hecke inverse, extends to blocks)
///
/// `word_left` generators must satisfy `g < k_split`; `word_right`
/// must satisfy `g > k_split`. The bridge is `σ_{k_split}^{bridge_sign}`.
///
/// **Sign convention** (matters because `seminormal.rs` /
/// `seminormal_mpfr.rs` define `sign == 0` to mean "averaged crossing
/// σ_g − h/2·I"): this API uses sign-only crossings and explicitly
/// REJECTS `sign == 0` (and any value other than ±1) with an assert.
/// Averaged crossings are not part of the matrix-M parabolic trace
/// identity proved in PR #1980/#1985/#1987/#1993/#2000. If you need
/// averaged-crossing characters, use `chi_lambda_braid_mpfr` instead.
pub fn chi_via_matrix_m_mpfr(
    cache: &MatrixMCacheMpfr,
    word_left: &[(i32, usize)],
    bridge_sign: i32,
    word_right: &[(i32, usize)],
) -> Float {
    let prec = cache.prec;
    let h = &cache.h;
    assert!(
        bridge_sign == 1 || bridge_sign == -1,
        "chi_via_matrix_m_mpfr: bridge_sign must be +1 or -1 (sign-only convention); got {} — averaged crossings (sign=0, σ_g − h/2·I) are NOT supported by the matrix-M parabolic identity",
        bridge_sign,
    );
    for &(sign, g) in word_left {
        assert!(
            sign == 1 || sign == -1,
            "chi_via_matrix_m_mpfr: word_left sign at σ_{} must be +1 or -1; got {} — averaged (sign=0) NOT supported",
            g, sign,
        );
    }
    for &(sign, g) in word_right {
        assert!(
            sign == 1 || sign == -1,
            "chi_via_matrix_m_mpfr: word_right sign at σ_{} must be +1 or -1; got {} — averaged (sign=0) NOT supported",
            g, sign,
        );
    }
    let mut total = Float::with_val(prec, 0);

    for block in cache.blocks.values() {
        let size = block.size;

        let mut b_p = dense_eye(size, prec);
        for &(sign, g) in word_left {
            let sigma = block
                .sigmas_left
                .get(&g)
                .expect("word_left generator not in sigmas_left");
            // sign is asserted ±1 above, so sign == 1 means positive
            // and sign == -1 means the Hecke inverse. Using ` > 0`
            // explicitly (not >= 0) so an off-spec sign=0 would have
            // been caught by the assert above rather than silently
            // taking the positive branch here.
            let sigma_signed = if sign > 0 {
                sigma.clone()
            } else {
                dense_sub_h_eye(sigma, h, prec)
            };
            b_p = matmul(&b_p, &sigma_signed, prec);
        }

        let mut b_n = dense_eye(size, prec);
        for &(sign, g) in word_right {
            let sigma = block
                .sigmas_right
                .get(&g)
                .expect("word_right generator not in sigmas_right");
            // See word_left branch above for why ` > 0` not `>= 0`.
            let sigma_signed = if sign > 0 {
                sigma.clone()
            } else {
                dense_sub_h_eye(sigma, h, prec)
            };
            b_n = matmul(&b_n, &sigma_signed, prec);
        }

        let m = if bridge_sign > 0 {
            block.m_pp.clone()
        } else {
            dense_sub_h_eye(&block.m_pp, h, prec)
        };

        let prod = matmul(&matmul(&b_p, &m, prec), &b_n, prec);
        total += trace(&prod, prec);
    }
    total
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::seminormal_mpfr::chi_lambda_braid_mpfr;
    use rug::ops::Pow;

    /// 50 dps q ≈ 1.11 substrate string (matches `Q_50_DIGIT_STR`).
    const Q_50: &str = "1.1099785827513808075916690956107688798744991218736";

    /// Deuteron-shape probe on n=6: β = σ_1 · σ_3 · σ_5.
    /// This is the same shape used in `derived_chi_catalogue_matrix_m`
    /// Test 4 (PR #1980), so the matrix-M output must reproduce the
    /// existing chi_lambda_braid_mpfr value.
    #[test]
    fn matrix_m_matches_seminormal_chi_deuteron_probe() {
        let dps: u32 = 50;
        let prec = dps_to_bits(dps);
        // Word in seminormal_mpfr convention: (sign, gen_1based).
        let word: Vec<(i32, u32)> = vec![(1, 1), (1, 3), (1, 5)];
        // Word in matrix_m convention is the same; the bridge is σ_3
        // (k_split=3), so left = [(1,1)], right = [(1,5)], bridge_sign = +1.
        let left: Vec<(i32, usize)> = vec![(1, 1)];
        let right: Vec<(i32, usize)> = vec![(1, 5)];

        // Test on every partition of 6.
        let shapes: Vec<Vec<usize>> = vec![
            vec![6],
            vec![5, 1],
            vec![4, 2],
            vec![4, 1, 1],
            vec![3, 3],
            vec![3, 2, 1],
            vec![3, 1, 1, 1],
            vec![2, 2, 2],
            vec![2, 2, 1, 1],
            vec![2, 1, 1, 1, 1],
            vec![1, 1, 1, 1, 1, 1],
        ];
        let tol = Float::with_val(prec, 10).pow(-(dps as i32 - 5));

        for shape in &shapes {
            // Reference: existing seminormal-direct path. Returns
            // String (decimal at the working precision).
            let chi_ref_str = chi_lambda_braid_mpfr(shape, &word, Q_50, dps);
            let chi_ref = Float::parse(&chi_ref_str)
                .map(|p| Float::with_val(prec, p))
                .expect("chi_lambda_braid_mpfr returned an unparsable Float");
            // New: matrix-M block path.
            let cache = precompute_block_tables_mpfr(shape, 3, Q_50, dps);
            let chi_m = chi_via_matrix_m_mpfr(&cache, &left, 1, &right);
            let delta: Float =
                Float::with_val(prec, &chi_ref) - Float::with_val(prec, &chi_m);
            let delta_abs = delta.abs();
            assert!(
                delta_abs <= tol,
                "shape={:?}: chi_ref={} chi_matrix_m={} delta={} > tol={}",
                shape,
                chi_ref,
                chi_m,
                delta_abs,
                tol,
            );
        }
    }

    #[test]
    fn mu_p_grouping_sums_to_full_dim() {
        // λ ⊢ 6 with several shapes — total SYT count per shape should
        // equal the sum of μ_p-block sizes at k_split = 3.
        for shape in &[vec![6], vec![4, 2], vec![3, 2, 1], vec![1, 1, 1, 1, 1, 1]] {
            let syts = standard_young_tableaux(shape);
            let groups = group_syts_by_mu_p(shape, 3);
            let group_total: usize = groups.values().map(|g| g.len()).sum();
            assert_eq!(
                group_total,
                syts.len(),
                "shape={:?}: group_total={} != #SYT={}",
                shape,
                group_total,
                syts.len(),
            );
        }
    }
}
