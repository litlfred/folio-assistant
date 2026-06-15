//! §S2 — MPFR siblings of the dense linear-algebra helpers.
//!
//! Mirrors the four f64 helpers in [`crate::sdp_solver_clarabel`]
//! (`sparse_to_dense`, `dense_dense_mul`, `invert_matrix_h`,
//! `symmetrize`) at MPFR precision via [`rug::Float`].  Used by
//! §S4-MPFR / §S5-MPFR (`sdp_solver_clarabel_mpfr` and the
//! canonical-T_w solver siblings) to avoid the f64 round-trip
//! that capped the existing SDP path at IEEE precision.
//!
//! The helpers take an explicit `prec: u32` (MPFR bit-precision)
//! since `rug::Float` carries its precision in the value rather
//! than the type.  Callers should derive `prec` once via
//! [`crate::seminormal_mpfr::dps_to_bits`] and pass it
//! consistently.
//!
//! Per workplan [`CLARABEL_PRECISION_PLAN.md`] §S2.  The originally-
//! sketched fully-generic-over-`Scalar` design is deferred — the
//! upstream Clarabel-rs `FloatT` trait already provides a usable
//! abstraction once we instantiate `T = MpfrFloat` in §S4-MPFR;
//! the helpers here are the minimum viable middle-ground that
//! lets §S4-MPFR consume `seminormal_matrices_mpfr` outputs
//! without rewriting the matrix-arithmetic core.

use rug::Float;

/// Sparse → dense conversion at MPFR precision.  Mirrors
/// [`crate::sdp_solver_clarabel::sparse_to_dense`] (private).
pub fn sparse_to_dense_mpfr(
    sparse: &[Vec<(usize, Float)>],
    dim: usize,
    prec: u32,
) -> Vec<Vec<Float>> {
    let mut out: Vec<Vec<Float>> = (0..dim)
        .map(|_| (0..dim).map(|_| Float::with_val(prec, 0)).collect())
        .collect();
    for (i, row) in sparse.iter().enumerate() {
        for (j, v) in row.iter() {
            out[i][*j] = Float::with_val(prec, v);
        }
    }
    out
}

/// Dense × dense matrix product at MPFR precision.  Mirrors
/// [`crate::sdp_solver_clarabel::dense_dense_mul`] (private).
/// `a` is `n × k`, `b` is `k × m`, result is `n × m`.
pub fn dense_dense_mul_mpfr(
    a: &[Vec<Float>],
    b: &[Vec<Float>],
    prec: u32,
) -> Vec<Vec<Float>> {
    let n = a.len();
    let m = if b.is_empty() { 0 } else { b[0].len() };
    let k = b.len();
    let mut out: Vec<Vec<Float>> = (0..n)
        .map(|_| (0..m).map(|_| Float::with_val(prec, 0)).collect())
        .collect();
    for i in 0..n {
        for kk in 0..k {
            // Skip if a[i][kk] is zero — the rug::Float `is_zero`
            // call returns false on rounded-near-zero values, so
            // this matches the f64 path's `aik == 0.0` shortcut
            // semantics as closely as possible.
            if a[i][kk].is_zero() {
                continue;
            }
            let aik = Float::with_val(prec, &a[i][kk]);
            for j in 0..m {
                let prod = Float::with_val(prec, &aik) * &b[kk][j];
                out[i][j] = Float::with_val(prec, &out[i][j]) + &prod;
            }
        }
    }
    out
}

/// Subtract `h` from each diagonal entry — used to convert
/// ρ_λ(σ_i) into ρ_λ(σ_i⁻¹) via the Hecke relation
/// `σ⁻¹ = σ − h`.  Mirrors
/// [`crate::sdp_solver_clarabel::invert_matrix_h`] (private).
pub fn invert_matrix_h_mpfr(
    m: &[Vec<Float>],
    h: &Float,
    prec: u32,
) -> Vec<Vec<Float>> {
    let n = m.len();
    let mut out: Vec<Vec<Float>> = (0..n)
        .map(|_| (0..n).map(|_| Float::with_val(prec, 0)).collect())
        .collect();
    for (i, row) in m.iter().enumerate() {
        for (j, v) in row.iter().enumerate() {
            out[i][j] = if i == j {
                Float::with_val(prec, v) - h
            } else {
                Float::with_val(prec, v)
            };
        }
    }
    out
}

/// Symmetrize: out[i][j] = ½ · (m[i][j] + m[j][i]).  Mirrors
/// [`crate::sdp_solver_clarabel::symmetrize`] (private).
pub fn symmetrize_mpfr(m: &[Vec<Float>], prec: u32) -> Vec<Vec<Float>> {
    let n = m.len();
    let half = Float::with_val(prec, 1) / Float::with_val(prec, 2);
    let mut out: Vec<Vec<Float>> = (0..n)
        .map(|_| (0..n).map(|_| Float::with_val(prec, 0)).collect())
        .collect();
    for i in 0..n {
        for j in 0..n {
            let sum = Float::with_val(prec, &m[i][j]) + &m[j][i];
            out[i][j] = Float::with_val(prec, &half) * sum;
        }
    }
    out
}

/// §S3 — MPFR analogue of [`crate::sdp_solver_clarabel`]'s
/// `svec_pack`: pack a `d × d` symmetric matrix into Clarabel's
/// `PSDTriangleConeT(d)` svec convention — **upper-triangular**
/// column-major with **off-diagonal entries scaled by √2**.
///
/// Diagonal entry M_{k,k} sits at position k(k+3)/2.  Total
/// length is `d(d+1)/2`.  Symmetrising side: this version
/// computes `½ · (M[r][c] + M[c][r])` per off-diagonal element
/// (matching `svec_pack_symmetric` in `sdp_solve_canonical_t_w`),
/// so the input does not need to be exactly symmetric.
pub fn svec_pack_mpfr(m: &[Vec<Float>], prec: u32) -> Vec<Float> {
    let d = m.len();
    let mut out: Vec<Float> = Vec::with_capacity(d * (d + 1) / 2);
    let two = Float::with_val(prec, 2);
    let sqrt2 = Float::with_val(prec, two).sqrt();
    let half = Float::with_val(prec, 1) / Float::with_val(prec, 2);
    for col in 0..d {
        for row in 0..=col {
            let avg = if row == col {
                Float::with_val(prec, &m[row][col])
            } else {
                let sum = Float::with_val(prec, &m[row][col]) + &m[col][row];
                Float::with_val(prec, &half) * sum
            };
            let scaled = if row == col {
                avg
            } else {
                Float::with_val(prec, &avg) * &sqrt2
            };
            out.push(scaled);
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::seminormal_mpfr::dps_to_bits;

    fn float(prec: u32, v: f64) -> Float {
        Float::with_val(prec, v)
    }

    #[test]
    fn sparse_to_dense_mpfr_basic() {
        let prec = dps_to_bits(50);
        let sparse: Vec<Vec<(usize, Float)>> = vec![
            vec![(0, float(prec, 1.0)), (2, float(prec, 3.0))],
            vec![(1, float(prec, 2.0))],
            vec![],
        ];
        let dense = sparse_to_dense_mpfr(&sparse, 3, prec);
        assert_eq!(dense.len(), 3);
        assert_eq!(dense[0][0].to_f64(), 1.0);
        assert_eq!(dense[0][1].to_f64(), 0.0);
        assert_eq!(dense[0][2].to_f64(), 3.0);
        assert_eq!(dense[1][1].to_f64(), 2.0);
        assert_eq!(dense[2][0].to_f64(), 0.0);
    }

    #[test]
    fn dense_dense_mul_mpfr_identity_2x2() {
        let prec = dps_to_bits(50);
        // A · I = A
        let a = vec![
            vec![float(prec, 1.0), float(prec, 2.0)],
            vec![float(prec, 3.0), float(prec, 4.0)],
        ];
        let id: Vec<Vec<Float>> = vec![
            vec![float(prec, 1.0), float(prec, 0.0)],
            vec![float(prec, 0.0), float(prec, 1.0)],
        ];
        let prod = dense_dense_mul_mpfr(&a, &id, prec);
        assert_eq!(prod[0][0].to_f64(), 1.0);
        assert_eq!(prod[0][1].to_f64(), 2.0);
        assert_eq!(prod[1][0].to_f64(), 3.0);
        assert_eq!(prod[1][1].to_f64(), 4.0);
    }

    #[test]
    fn invert_matrix_h_mpfr_subtracts_diagonal() {
        let prec = dps_to_bits(50);
        let m = vec![
            vec![float(prec, 5.0), float(prec, 1.0)],
            vec![float(prec, 1.0), float(prec, 7.0)],
        ];
        let h = float(prec, 2.0);
        let out = invert_matrix_h_mpfr(&m, &h, prec);
        assert_eq!(out[0][0].to_f64(), 3.0); // 5 - 2
        assert_eq!(out[0][1].to_f64(), 1.0);
        assert_eq!(out[1][0].to_f64(), 1.0);
        assert_eq!(out[1][1].to_f64(), 5.0); // 7 - 2
    }

    #[test]
    fn symmetrize_mpfr_basic() {
        let prec = dps_to_bits(50);
        // [[1, 4], [2, 3]] → [[1, 3], [3, 3]]
        let m = vec![
            vec![float(prec, 1.0), float(prec, 4.0)],
            vec![float(prec, 2.0), float(prec, 3.0)],
        ];
        let s = symmetrize_mpfr(&m, prec);
        assert_eq!(s[0][0].to_f64(), 1.0);
        assert_eq!(s[0][1].to_f64(), 3.0); // (4 + 2) / 2
        assert_eq!(s[1][0].to_f64(), 3.0);
        assert_eq!(s[1][1].to_f64(), 3.0);
    }

    #[test]
    fn svec_pack_mpfr_shape_and_layout() {
        let prec = dps_to_bits(50);
        // 3×3 symmetric matrix:
        //   [ 1   2   4 ]
        //   [ 2   3   5 ]
        //   [ 4   5   6 ]
        // svec (upper-tri col-major, √2 off-diag):
        //   col 0 row 0:        1
        //   col 1 row 0: √2 ·   2  ;  col 1 row 1: 3
        //   col 2 row 0: √2 ·   4  ;  col 2 row 1: √2·5  ;  col 2 row 2: 6
        let m = vec![
            vec![float(prec, 1.0), float(prec, 2.0), float(prec, 4.0)],
            vec![float(prec, 2.0), float(prec, 3.0), float(prec, 5.0)],
            vec![float(prec, 4.0), float(prec, 5.0), float(prec, 6.0)],
        ];
        let v = svec_pack_mpfr(&m, prec);
        assert_eq!(v.len(), 6);
        let sqrt2: f64 = 2f64.sqrt();
        assert!((v[0].to_f64() - 1.0).abs() < 1e-15);
        assert!((v[1].to_f64() - sqrt2 * 2.0).abs() < 1e-15);
        assert!((v[2].to_f64() - 3.0).abs() < 1e-15);
        assert!((v[3].to_f64() - sqrt2 * 4.0).abs() < 1e-15);
        assert!((v[4].to_f64() - sqrt2 * 5.0).abs() < 1e-15);
        assert!((v[5].to_f64() - 6.0).abs() < 1e-15);
    }

    #[test]
    fn svec_pack_mpfr_symmetrises_asymmetric_input() {
        let prec = dps_to_bits(50);
        // Asymmetric 2×2:  [[1, 4], [2, 3]]
        // ½·(4+2) = 3, then × √2 = 3√2
        let m = vec![
            vec![float(prec, 1.0), float(prec, 4.0)],
            vec![float(prec, 2.0), float(prec, 3.0)],
        ];
        let v = svec_pack_mpfr(&m, prec);
        assert_eq!(v.len(), 3);
        let sqrt2: f64 = 2f64.sqrt();
        assert!((v[0].to_f64() - 1.0).abs() < 1e-15);
        assert!((v[1].to_f64() - sqrt2 * 3.0).abs() < 1e-15);
        assert!((v[2].to_f64() - 3.0).abs() < 1e-15);
    }
}
