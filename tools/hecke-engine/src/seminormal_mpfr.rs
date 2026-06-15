//! High-precision MPFR variant of the Hoefsmit seminormal-form
//! character kernel.
//!
//! Mirrors the algorithm of [`crate::seminormal::chi_lambda_braid`]
//! but uses [`rug::Float`] (MPFR-backed arbitrary precision) instead
//! of `f64`.  Default precision is 167 bits ≈ 50 decimal digits;
//! callers may request higher.
//!
//! API:
//!  - [`chi_lambda_braid_mpfr`] — character `χ_λ(β)` at MPFR precision.
//!
//! The MPFR path is significantly slower than the `f64` path
//! (~10–30× per character) but obeys the user requirement of
//! "no shortcuts, no approximations" — characters are computed
//! at requested precision (≥ 50 dps default), with the result
//! returned as a decimal string (the caller decides the float
//! type to deserialize into).

use crate::seminormal::standard_young_tableaux;
use rayon::prelude::*;
use rug::{ops::Pow, Assign, Float};

/// Convert a decimal-precision (dps) request to MPFR bit-precision.
/// MPFR rounds up to the nearest precision; we round up `bits = ceil(dps · log₂(10))`.
#[inline]
pub fn dps_to_bits(dps: u32) -> u32 {
    // log₂(10) ≈ 3.3219..., +2 buffer for guard bits.
    ((dps as f64) * 3.32193 + 2.0).ceil() as u32
}

#[derive(Clone, Debug)]
enum BlockMpfr {
    One { i: usize, a: Float },
    Two { i: usize, j: usize, a: Float, ap: Float, b: Float },
}

fn build_blocks_mpfr(shape: &[usize], q: &Float, prec: u32) -> (usize, Vec<Vec<BlockMpfr>>) {
    let n: usize = shape.iter().sum();
    let syts = standard_young_tableaux(shape);
    let dim = syts.len();
    // h = q − q⁻¹.
    let h = Float::with_val(prec, q) - Float::with_val(prec, q.clone().recip());

    // SYT lookup: cell list → index.
    use std::collections::HashMap;
    let mut syt_index: HashMap<Vec<(usize, usize)>, usize> = HashMap::with_capacity(dim);
    for (idx, syt) in syts.iter().enumerate() {
        syt_index.insert(syt.clone(), idx);
    }

    let mut all_blocks: Vec<Vec<BlockMpfr>> = Vec::with_capacity(n.saturating_sub(1));
    for k in 1..n {
        let mut blocks: Vec<BlockMpfr> = Vec::with_capacity(dim);
        let mut processed = vec![false; dim];
        for i in 0..dim {
            if processed[i] {
                continue;
            }
            let cell_k = syts[i][k - 1];
            let cell_k1 = syts[i][k];
            let rho = (cell_k1.1 as i32 - cell_k1.0 as i32)
                - (cell_k.1 as i32 - cell_k.0 as i32);

            // a = h / (1 − q^{-2ρ}).
            let q_pow = q.clone().pow(-2 * rho);
            let denom = Float::with_val(prec, 1) - q_pow;
            let a = Float::with_val(prec, &h) / denom;

            let mut swapped = syts[i].clone();
            swapped[k - 1] = cell_k1;
            swapped[k] = cell_k;
            let partner = syt_index.get(&swapped).copied().filter(|&j| j != i);

            match partner {
                None => {
                    blocks.push(BlockMpfr::One { i, a });
                    processed[i] = true;
                }
                Some(j) => {
                    let q_pow_pos = q.clone().pow(2 * rho);
                    let denom_p = Float::with_val(prec, 1) - q_pow_pos;
                    let a_prime = Float::with_val(prec, &h) / denom_p;
                    // b² = a · a' + 1.
                    let b_sq: Float =
                        Float::with_val(prec, &a) * &a_prime + Float::with_val(prec, 1);
                    let b = b_sq.abs().sqrt();
                    let (ii, jj) = (i.min(j), i.max(j));
                    let (a_lo, a_hi) = if i < j {
                        (a.clone(), a_prime.clone())
                    } else {
                        (a_prime.clone(), a.clone())
                    };
                    blocks.push(BlockMpfr::Two {
                        i: ii,
                        j: jj,
                        a: a_lo,
                        ap: a_hi,
                        b,
                    });
                    processed[i] = true;
                    processed[j] = true;
                }
            }
        }
        all_blocks.push(blocks);
    }

    (dim, all_blocks)
}

fn apply_sigma_mpfr(v: &mut [Float], blocks: &[BlockMpfr], prec: u32) {
    for block in blocks {
        match block {
            BlockMpfr::One { i, a } => {
                let new_v = Float::with_val(prec, &v[*i]) * a;
                v[*i] = new_v;
            }
            BlockMpfr::Two { i, j, a, ap, b } => {
                let vi = v[*i].clone();
                let vj = v[*j].clone();
                v[*i] = Float::with_val(prec, &vi) * a + Float::with_val(prec, &vj) * b;
                v[*j] = Float::with_val(prec, &vi) * b + Float::with_val(prec, &vj) * ap;
            }
        }
    }
}

fn apply_sigma_inv_mpfr(v: &mut [Float], blocks: &[BlockMpfr], h: &Float, prec: u32) {
    for block in blocks {
        match block {
            BlockMpfr::One { i, a } => {
                let coef = Float::with_val(prec, a) - h;
                let new_v = Float::with_val(prec, &v[*i]) * coef;
                v[*i] = new_v;
            }
            BlockMpfr::Two { i, j, a, ap, b } => {
                let am = Float::with_val(prec, a) - h;
                let apm = Float::with_val(prec, ap) - h;
                let vi = v[*i].clone();
                let vj = v[*j].clone();
                v[*i] = Float::with_val(prec, &vi) * &am + Float::with_val(prec, &vj) * b;
                v[*j] = Float::with_val(prec, &vi) * b + Float::with_val(prec, &vj) * &apm;
            }
        }
    }
}

/// Apply `v ← (σ_i + σ_i⁻¹)/2 · v = (σ_i - h/2) · v` in-place at MPFR
/// precision. MPFR analogue of [`crate::seminormal::apply_sigma_averaged_left`].
/// See that function for the math derivation.
fn apply_sigma_averaged_mpfr(v: &mut [Float], blocks: &[BlockMpfr], h: &Float, prec: u32) {
    let half_h = Float::with_val(prec, h) / 2;
    for block in blocks {
        match block {
            BlockMpfr::One { i, a } => {
                let coef = Float::with_val(prec, a) - &half_h;
                let new_v = Float::with_val(prec, &v[*i]) * coef;
                v[*i] = new_v;
            }
            BlockMpfr::Two { i, j, a, ap, b } => {
                let am = Float::with_val(prec, a) - &half_h;
                let apm = Float::with_val(prec, ap) - &half_h;
                let vi = v[*i].clone();
                let vj = v[*j].clone();
                v[*i] = Float::with_val(prec, &vi) * &am + Float::with_val(prec, &vj) * b;
                v[*j] = Float::with_val(prec, &vi) * b + Float::with_val(prec, &vj) * &apm;
            }
        }
    }
}

/// MPFR-precision character `χ_λ(β)` at decimal precision `dps`.
///
/// `q_str` is the substrate parameter as a decimal string (use a string
/// to avoid lossy `f64` conversion at the boundary).  Returns the
/// character as a decimal string with `dps` significant digits.
///
/// Example: `chi_lambda_braid_mpfr(&[3], &[(1, 1)], "1.10998", 50)` returns
/// `"1.10998..."` (because χ_(3)(σ₁) = q on the trivial representation).
/// **Batch MPFR character evaluation across many partitions.**
///
/// Like [`chi_lambda_braid_mpfr`] but evaluates a list of partitions
/// in rayon-parallel.  Returns one decimal-string result per input
/// shape.
pub fn chi_lambdas_braid_mpfr(
    shapes: &[Vec<usize>],
    word: &[(i32, u32)],
    q_str: &str,
    dps: u32,
) -> Vec<String> {
    use rayon::prelude::*;
    shapes
        .par_iter()
        .map(|shape| chi_lambda_braid_mpfr(shape, word, q_str, dps))
        .collect()
}

pub fn chi_lambda_braid_mpfr(
    shape: &[usize],
    word: &[(i32, u32)],
    q_str: &str,
    dps: u32,
) -> String {
    let prec = dps_to_bits(dps);
    let n: usize = shape.iter().sum();
    if n == 0 {
        return Float::with_val(prec, 1).to_string_radix(10, Some(dps as usize));
    }

    let q = Float::parse(q_str)
        .map(|p| Float::with_val(prec, p))
        .unwrap_or_else(|_| Float::with_val(prec, 1));

    let (dim, all_blocks) = build_blocks_mpfr(shape, &q, prec);
    if dim == 0 {
        return Float::with_val(prec, 0).to_string_radix(10, Some(dps as usize));
    }
    if all_blocks.is_empty() {
        let v = if word.is_empty() { 1 } else { 0 };
        return Float::with_val(prec, v).to_string_radix(10, Some(dps as usize));
    }

    let h = Float::with_val(prec, &q) - Float::with_val(prec, q.clone().recip());

    let resolved: Vec<(i32, &[BlockMpfr])> = word
        .iter()
        .map(|&(sign, gen)| {
            assert!(
                gen != 0 && (gen as usize) <= all_blocks.len(),
                "chi_lambda_braid_mpfr: invalid generator index {} for n = {} (valid range: 1..={})",
                gen, n, all_blocks.len()
            );
            let idx = gen as usize - 1;
            (sign, all_blocks[idx].as_slice())
        })
        .collect();

    // §S0-MPFR-PERF (gap-4 of PR #1741, landed in PR #1748): the
    // `for i in 0..dim` outer loop is embarrassingly parallel — each
    // i contributes v[i] to the trace and uses its own `v`.  Inner
    // rayon over basis vectors saturates idle cores while the outer
    // per-partition rayon (`wenzl_lr.rs:311`) saturates the partition
    // axis.
    //
    // Allocation-reuse pattern (PR #1748 follow-up commit): naive
    // `.map(|i| { let mut v = (0..dim).map(...).collect(); ... })`
    // allocates a fresh `Vec<Float>` per i — for ⁴He at dim=7700
    // that's 59 M Float allocations per chi-cache build (~3 GB
    // traffic).  Using `.fold()` with per-worker init gives each
    // rayon worker its OWN buffer that is reset in-place (via
    // `Float::assign`) between iterations.  At dim=7700 on 4 cores
    // this drops allocation from `dim × dim` = 59 M to
    // `n_workers × dim` ≈ 30,800 (1925× reduction).
    //
    // Observed ⁴He wall: 624.9 s (10.4 min) with the naive map →
    // expected ~150-200 s with this fold pattern.
    let trace = (0..dim)
        .into_par_iter()
        .fold(
            || {
                // Per-worker init: buffer (allocated once per worker)
                // + partial trace accumulator.
                let buf: Vec<Float> = (0..dim)
                    .map(|_| Float::with_val(prec, 0))
                    .collect();
                (buf, Float::with_val(prec, 0))
            },
            |(mut buf, mut partial), i| {
                // Reset buf in-place (no realloc — Float keeps its
                // mantissa storage, just zeroes the value).
                for k in 0..dim {
                    buf[k].assign(0u32);
                }
                buf[i].assign(1u32);
                // Sign convention (matches f64 chi_lambda_braid):
                //   sign > 0  → σ_g           (positive crossing)
                //   sign < 0  → σ_g - h·I     (σ_g⁻¹ via Hecke relation)
                //   sign == 0 → σ_g - h/2·I   (averaged crossing, direct
                //                              substitution, no 2^k expansion)
                for &(sign, blocks) in resolved.iter().rev() {
                    if sign > 0 {
                        apply_sigma_mpfr(&mut buf, blocks, prec);
                    } else if sign < 0 {
                        apply_sigma_inv_mpfr(&mut buf, blocks, &h, prec);
                    } else {
                        apply_sigma_averaged_mpfr(&mut buf, blocks, &h, prec);
                    }
                }
                partial += &buf[i];
                (buf, partial)
            },
        )
        .map(|(_, p)| p)
        // In-place accumulation (Copilot review PR #1748): `|a, b| a + b`
        // allocates a fresh Float on every reduction step; `+=` mutates
        // the accumulator's mantissa in place — for ⁴He at 50 dps and
        // ~log₂(7700) ≈ 13 reduction levels this is a real allocator-
        // pressure win at zero math cost.
        .reduce(|| Float::with_val(prec, 0), |mut a, b| { a += b; a });
    trace.to_string_radix(10, Some(dps as usize))
}

// ──────────────────────────────────────────────────────────────────
// §S1 — Materialised generator matrices at MPFR precision.
//
// `seminormal_matrices_mpfr` is the MPFR analogue of
// `crate::seminormal::seminormal_matrices` (f64): it returns one
// sparse matrix per Hecke generator σ_i (1-indexed), populated via
// the same Hoefsmit block-form recursion that drives the character
// path, but with `rug::Float` entries at the requested precision.
//
// Used by §S4-MPFR (`sdp_solver_clarabel_mpfr`) and §S5-MPFR (the
// canonical-T_w solver siblings) to feed Wedderburn-block PSD
// constraints into Clarabel-rs's MPFR backend without the
// f64 round-trip that capped the existing `sdp_solver_clarabel.rs`
// path at IEEE precision.
// ──────────────────────────────────────────────────────────────────

/// MPFR analogue of [`crate::seminormal::SparseMatrix`] — a sparse
/// matrix as a vector of (column-index, entry) pairs per row.
pub type SparseMatrixMpfr = Vec<Vec<(usize, Float)>>;

/// MPFR analogue of [`crate::seminormal::seminormal_matrices`] —
/// build the Hoefsmit seminormal generators ρ_λ(σ_i) as sparse
/// matrices at MPFR precision.
///
/// `q_str` is the substrate parameter as a decimal string (avoids
/// the f64 round-trip at the boundary).  Returns one
/// `SparseMatrixMpfr` per generator σ_1, …, σ_{n-1}.
pub fn seminormal_matrices_mpfr(
    shape: &[usize],
    q_str: &str,
    dps: u32,
) -> Vec<SparseMatrixMpfr> {
    let prec = dps_to_bits(dps);
    let q = Float::parse(q_str)
        .map(|p| Float::with_val(prec, p))
        .unwrap_or_else(|e| {
            panic!(
                "seminormal_matrices_mpfr: invalid q_str {:?}: {} \
                 (a silent fallback to q=1 would trigger divide-by-zero \
                 in the Hoefsmit coefficients via 1 - q^{{-2ρ}} = 0)",
                q_str, e
            )
        });

    let (dim, all_blocks) = build_blocks_mpfr(shape, &q, prec);
    if dim == 0 {
        return Vec::new();
    }

    all_blocks
        .into_iter()
        .map(|blocks| {
            let mut rows: SparseMatrixMpfr = (0..dim).map(|_| Vec::new()).collect();
            for block in blocks {
                match block {
                    BlockMpfr::One { i, a } => {
                        rows[i].push((i, a));
                    }
                    BlockMpfr::Two { i, j, a, ap, b } => {
                        // Mirror the f64 version's row layout:
                        //   rows[i] gets (i, a), (j, b)
                        //   rows[j] gets (i, b), (j, a')
                        let b2 = Float::with_val(prec, &b);
                        rows[i].push((i, a));
                        rows[i].push((j, b));
                        rows[j].push((i, b2));
                        rows[j].push((j, ap));
                    }
                }
            }
            for row in &mut rows {
                row.sort_by_key(|&(jj, _)| jj);
            }
            rows
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn dps_to_bits_50() {
        let bits = dps_to_bits(50);
        // 50 dps × log₂(10) ≈ 166.1, +2 buffer → 169.
        assert!(bits >= 165 && bits <= 175, "bits = {}", bits);
    }

    #[test]
    fn trivial_rep_mpfr() {
        // χ_(3)(σ₁) = q on the trivial rep at any q.
        let q = "1.10998";
        let chi = chi_lambda_braid_mpfr(&[3], &[(1, 1)], q, 50);
        // First few digits should match "1.10998".
        assert!(chi.starts_with("1.10998"), "chi = {}", chi);
    }

    #[test]
    fn trivial_rep_inverse_mpfr() {
        // χ_(3)(σ₁⁻¹) = 1/q on the trivial rep.
        let chi = chi_lambda_braid_mpfr(&[3], &[(-1, 1)], "1.10998", 50);
        // 1/1.10998 ≈ 0.9009...
        assert!(chi.starts_with("0.9009") || chi.starts_with("9.009"),
                "chi = {}", chi);
    }

    #[test]
    fn seminormal_matrices_mpfr_trivial_rep_h2() {
        // λ = [2], n = 2 ⇒ trivial rep, σ_1 acts as multiplication
        // by q.  So the single 1×1 generator should have entry q.
        let mats = seminormal_matrices_mpfr(&[2], "1.10998", 50);
        assert_eq!(mats.len(), 1, "λ=[2] has one generator σ_1");
        let m = &mats[0];
        assert_eq!(m.len(), 1, "1-dim trivial rep: 1 row");
        assert_eq!(m[0].len(), 1, "1-dim trivial rep: 1 entry");
        let (col, ref entry) = m[0][0];
        assert_eq!(col, 0);
        let s = entry.to_string_radix(10, Some(8));
        assert!(
            s.starts_with("1.10998") || s.starts_with("1.1099"),
            "expected entry ≈ q = 1.10998…, got {}",
            s
        );
    }

    #[test]
    fn seminormal_matrices_mpfr_matches_f64_h3() {
        // Cross-validate the MPFR matrix entries against the f64
        // version on a reasonable q.  At λ=[3], n=3, dim=1 trivial.
        // λ=[2,1], n=3, dim=2 — two distinct generators σ_1, σ_2.
        let q_str = "1.10998";
        let q_f64: f64 = q_str.parse().unwrap();
        let mats_mpfr = seminormal_matrices_mpfr(&[2, 1], q_str, 50);
        let mats_f64 = crate::seminormal::seminormal_matrices(&[2, 1], q_f64);
        assert_eq!(mats_mpfr.len(), mats_f64.len(), "same generator count");
        for (g_idx, (mm, mf)) in mats_mpfr.iter().zip(mats_f64.iter()).enumerate() {
            assert_eq!(mm.len(), mf.len(), "generator {} dim", g_idx);
            for (row_idx, (rm, rf)) in mm.iter().zip(mf.iter()).enumerate() {
                assert_eq!(rm.len(), rf.len(), "generator {} row {} sparsity", g_idx, row_idx);
                for (em, ef) in rm.iter().zip(rf.iter()) {
                    assert_eq!(em.0, ef.0, "column index mismatch");
                    let mpfr_as_f64: f64 = em.1.to_f64();
                    assert!(
                        (mpfr_as_f64 - ef.1).abs() < 1e-10,
                        "entry mismatch: f64={} vs mpfr→f64={}",
                        ef.1,
                        mpfr_as_f64
                    );
                }
            }
        }
    }
}
