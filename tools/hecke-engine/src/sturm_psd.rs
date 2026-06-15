//! §S9.3 — Sturm-chain exact-PSD verification on rational matrices.
//!
//! Given an `n × n` symmetric matrix with `BigRational` entries,
//! decide whether all eigenvalues are non-negative (i.e. the matrix
//! is positive-semidefinite) **without floating-point**: compute
//! the characteristic polynomial via Faddeev-LeVerrier, then run
//! Sturm's theorem to count real roots in `(-∞, 0)`.  Zero negative
//! roots ⇒ PSD; one or more negative roots ⇒ definitely-not-PSD.
//!
//! This is the missing piece of §S9 — the post-IPM rationalisation
//! pipeline produces a rational dual via [`crate::sdp_dual_certificate`],
//! and this module verifies that dual is exactly PSD with no
//! floating-point uncertainty.  Together they implement the full
//! Peyrl-Parrilo dual-certificate recipe.
//!
//! Per the audit in
//! [`docs/audits/exact-sdp-feasibility.md`](../../docs/audits/exact-sdp-feasibility.md):
//! Wedderburn-block decomposition keeps each per-block verification
//! at degree `d_λ`, not `n_0!`.  At QOU's largest blocks
//! (`d_λ ~ low thousands` at H_18) this is still tractable —
//! Faddeev-LeVerrier is `O(d_λ^4)` per block in rational arithmetic.
//!
//! Per workplan
//! [`CLARABEL_PRECISION_PLAN.md`](../CLARABEL_PRECISION_PLAN.md) §S9.3.

use num_bigint::BigInt;
use num_rational::BigRational;
use num_traits::{One, Signed, Zero};

/// Compute the characteristic polynomial of a square rational
/// matrix `M`, returned as coefficients `[c_0, c_1, …, c_n]` with
/// `c_n = 1` (monic).  Algorithm: Faddeev-LeVerrier,
/// `O(n^4)` ops, exact in `BigRational`.
///
/// `det(λI - M) = λ^n + c_{n-1} λ^{n-1} + … + c_0`
///
/// (Note the sign convention: this returns the coefficients of the
/// MONIC polynomial in the variable `λ` — `c_0` is the constant
/// term, `c_n = 1` is the leading coefficient.)
pub fn char_poly_rational(m: &[Vec<BigRational>]) -> Vec<BigRational> {
    let n = m.len();
    if n == 0 {
        return vec![BigRational::one()];
    }
    debug_assert!(m.iter().all(|row| row.len() == n));

    // Faddeev-LeVerrier:
    //   M_1 = M
    //   c_{n-1} = -tr(M_1)
    //   M_{k+1} = M·(M_k + c_{n-k} I)
    //   c_{n-k-1} = -tr(M_{k+1})/(k+1)
    //
    // Char poly is λ^n + c_{n-1} λ^{n-1} + ... + c_0.
    //
    // Result vector indexed by polynomial degree: result[k] = c_k.
    let mut coefs: Vec<BigRational> = vec![BigRational::zero(); n + 1];
    coefs[n] = BigRational::one(); // monic

    let mut cur: Vec<Vec<BigRational>> = m.to_vec();
    let tr1 = trace(&cur);
    coefs[n - 1] = -&tr1;

    for k in 1..n {
        // Add coefs[n - k] · I to cur
        let mut shifted = cur.clone();
        for i in 0..n {
            shifted[i][i] = &shifted[i][i] + &coefs[n - k];
        }
        // cur = M · shifted
        cur = mat_mul_rational(m, &shifted);
        let trk = trace(&cur);
        let kp1 = BigRational::from_integer(BigInt::from((k + 1) as u64));
        coefs[n - k - 1] = -(trk / kp1);
    }

    coefs
}

fn trace(m: &[Vec<BigRational>]) -> BigRational {
    let n = m.len();
    let mut s = BigRational::zero();
    for i in 0..n {
        s += &m[i][i];
    }
    s
}

fn mat_mul_rational(
    a: &[Vec<BigRational>],
    b: &[Vec<BigRational>],
) -> Vec<Vec<BigRational>> {
    let n = a.len();
    let m = if b.is_empty() { 0 } else { b[0].len() };
    let k_dim = b.len();
    let mut out: Vec<Vec<BigRational>> =
        (0..n).map(|_| (0..m).map(|_| BigRational::zero()).collect()).collect();
    for i in 0..n {
        for kk in 0..k_dim {
            if a[i][kk].is_zero() {
                continue;
            }
            for j in 0..m {
                out[i][j] += &a[i][kk] * &b[kk][j];
            }
        }
    }
    out
}

/// Sturm sequence of a univariate rational polynomial:
///     p_0 = p
///     p_1 = p'
///     p_{k+1} = -rem(p_{k-1}, p_k)   (until p_k is constant)
///
/// Returns the sequence in order [p_0, p_1, …, p_m].  `p` must be
/// non-zero; behaviour on the zero polynomial is undefined.
pub fn sturm_sequence(p: &[BigRational]) -> Vec<Vec<BigRational>> {
    let mut chain: Vec<Vec<BigRational>> = Vec::new();
    let p0: Vec<BigRational> = trim_trailing_zeros(p.to_vec());
    let p1: Vec<BigRational> = derivative(&p0);
    chain.push(p0);
    chain.push(p1);
    while {
        let last_idx = chain.len() - 1;
        chain[last_idx].len() > 1
    } {
        let i = chain.len() - 1;
        let r = poly_rem(&chain[i - 1], &chain[i]);
        let neg_r: Vec<BigRational> = r.into_iter().map(|c| -c).collect();
        let trimmed = trim_trailing_zeros(neg_r);
        if trimmed.is_empty() {
            break;
        }
        chain.push(trimmed);
    }
    chain
}

fn trim_trailing_zeros(mut p: Vec<BigRational>) -> Vec<BigRational> {
    while p.len() > 1 && p.last().map(|c| c.is_zero()).unwrap_or(false) {
        p.pop();
    }
    if p.len() == 1 && p[0].is_zero() {
        return Vec::new();
    }
    p
}

fn derivative(p: &[BigRational]) -> Vec<BigRational> {
    if p.len() <= 1 {
        return vec![BigRational::zero()];
    }
    let n = p.len();
    let mut d: Vec<BigRational> = Vec::with_capacity(n - 1);
    for k in 1..n {
        d.push(BigRational::from_integer(BigInt::from(k as u64)) * &p[k]);
    }
    trim_trailing_zeros(d)
}

/// Polynomial remainder: a mod b, both in coefficient-vector form
/// (lowest degree first).  `b` must be non-zero.
fn poly_rem(a: &[BigRational], b: &[BigRational]) -> Vec<BigRational> {
    let mut r: Vec<BigRational> = a.to_vec();
    let b_deg = b.len() - 1;
    let lead_b = b[b_deg].clone();
    while r.len() > b_deg && !r.last().map(|c| c.is_zero()).unwrap_or(true) {
        let r_deg = r.len() - 1;
        if r_deg < b_deg {
            break;
        }
        let coef = &r[r_deg] / &lead_b;
        let shift = r_deg - b_deg;
        for k in 0..=b_deg {
            r[shift + k] = &r[shift + k] - &coef * &b[k];
        }
        r = trim_trailing_zeros(r);
        if r.is_empty() {
            break;
        }
    }
    r
}

/// Evaluate a rational polynomial `p` at `x`.
fn poly_eval(p: &[BigRational], x: &BigRational) -> BigRational {
    let mut acc = BigRational::zero();
    let mut x_pow = BigRational::one();
    for c in p {
        acc += c * &x_pow;
        x_pow *= x;
    }
    acc
}

/// Count sign changes in a Sturm chain at the rational point `x`.
/// Zero terms are skipped (Sturm's theorem skips them in the sign-
/// change count).
fn sturm_sign_changes_at(chain: &[Vec<BigRational>], x: &BigRational) -> usize {
    let mut prev_sign: i32 = 0;
    let mut changes = 0_usize;
    for poly in chain {
        let v = poly_eval(poly, x);
        let s = if v.is_positive() {
            1
        } else if v.is_negative() {
            -1
        } else {
            0
        };
        if s != 0 && prev_sign != 0 && s != prev_sign {
            changes += 1;
        }
        if s != 0 {
            prev_sign = s;
        }
    }
    changes
}

/// Count sign changes at "−∞" — equivalent to the sign of each
/// polynomial's leading coefficient with the parity of its degree
/// folded in (if degree odd, sign flips at −∞).
fn sturm_sign_changes_at_neg_inf(chain: &[Vec<BigRational>]) -> usize {
    let mut prev_sign: i32 = 0;
    let mut changes = 0_usize;
    for poly in chain {
        if poly.is_empty() {
            continue;
        }
        let lead = poly.last().unwrap();
        let mut s = if lead.is_positive() {
            1
        } else if lead.is_negative() {
            -1
        } else {
            0
        };
        // At −∞, sign of `c · x^d` is sign(c) · (-1)^d
        let deg = poly.len() - 1;
        if deg % 2 == 1 {
            s = -s;
        }
        if s != 0 && prev_sign != 0 && s != prev_sign {
            changes += 1;
        }
        if s != 0 {
            prev_sign = s;
        }
    }
    changes
}

/// Decide whether a rational symmetric matrix is positive-
/// semidefinite **exactly**: count the number of negative real
/// roots of its characteristic polynomial via Sturm's theorem.
/// Zero negative roots ⇒ PSD; non-zero ⇒ definitely not PSD.
///
/// Returns `(is_psd, n_negative_roots, n_zero_at_origin)`.
/// `n_zero_at_origin` is the multiplicity of `λ = 0` as a root —
/// useful for distinguishing positive-definite (no zero
/// eigenvalues) from positive-semidefinite (zero eigenvalues
/// allowed).
pub fn rational_matrix_is_psd(m: &[Vec<BigRational>]) -> (bool, usize, usize) {
    let n = m.len();
    if n == 0 {
        return (true, 0, 0);
    }
    let cp = char_poly_rational(m);
    // Multiplicity of 0 as a root = number of leading zero
    // coefficients (lowest-degree first).
    let mut zero_mult = 0_usize;
    for c in &cp {
        if c.is_zero() {
            zero_mult += 1;
        } else {
            break;
        }
    }
    // For Sturm sign-counting, work with the squarefree part:
    // strip the λ^zero_mult factor.
    let cp_strip: Vec<BigRational> = cp[zero_mult..].to_vec();
    if cp_strip.len() <= 1 {
        // All roots are at zero.  Trivially PSD.
        return (true, 0, zero_mult);
    }
    let chain = sturm_sequence(&cp_strip);
    let v_neg_inf = sturm_sign_changes_at_neg_inf(&chain);
    let v_zero = sturm_sign_changes_at(&chain, &BigRational::zero());
    // Negative real roots of cp_strip = V(−∞) − V(0).
    // V(−∞) is at least V(0), so this is non-negative.
    let n_neg = v_neg_inf.saturating_sub(v_zero);
    (n_neg == 0, n_neg, zero_mult)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn r(n: i64, d: i64) -> BigRational {
        BigRational::new(BigInt::from(n), BigInt::from(d))
    }

    fn ri(n: i64) -> BigRational {
        r(n, 1)
    }

    #[test]
    fn char_poly_2x2_identity() {
        // I_2: char poly = (λ - 1)^2 = λ^2 - 2λ + 1
        let m = vec![vec![ri(1), ri(0)], vec![ri(0), ri(1)]];
        let cp = char_poly_rational(&m);
        assert_eq!(cp, vec![ri(1), -ri(2), ri(1)]);
    }

    #[test]
    fn char_poly_2x2_diagonal_2_3() {
        // diag(2, 3): char poly = (λ-2)(λ-3) = λ² - 5λ + 6
        let m = vec![vec![ri(2), ri(0)], vec![ri(0), ri(3)]];
        let cp = char_poly_rational(&m);
        assert_eq!(cp, vec![ri(6), -ri(5), ri(1)]);
    }

    #[test]
    fn char_poly_2x2_indef() {
        // [[1, 2], [2, 1]]: tr = 2, det = 1 - 4 = -3
        // char poly = λ^2 - 2λ - 3 (eigenvalues 3 and -1)
        let m = vec![vec![ri(1), ri(2)], vec![ri(2), ri(1)]];
        let cp = char_poly_rational(&m);
        assert_eq!(cp, vec![-ri(3), -ri(2), ri(1)]);
    }

    #[test]
    fn psd_2x2_identity() {
        let m = vec![vec![ri(1), ri(0)], vec![ri(0), ri(1)]];
        let (is_psd, n_neg, _) = rational_matrix_is_psd(&m);
        assert!(is_psd);
        assert_eq!(n_neg, 0);
    }

    #[test]
    fn psd_2x2_with_zero_eigenvalue() {
        // [[1, 1], [1, 1]] eigenvalues 0, 2 → PSD with one zero eig
        let m = vec![vec![ri(1), ri(1)], vec![ri(1), ri(1)]];
        let (is_psd, n_neg, n_zero) = rational_matrix_is_psd(&m);
        assert!(is_psd, "[[1,1],[1,1]] should be PSD");
        assert_eq!(n_neg, 0);
        assert_eq!(n_zero, 1, "expected one zero eigenvalue");
    }

    #[test]
    fn not_psd_2x2_indef() {
        // [[1, 2], [2, 1]]: eigenvalues 3 and -1 → NOT PSD
        let m = vec![vec![ri(1), ri(2)], vec![ri(2), ri(1)]];
        let (is_psd, n_neg, _) = rational_matrix_is_psd(&m);
        assert!(!is_psd, "[[1,2],[2,1]] should NOT be PSD");
        assert_eq!(n_neg, 1);
    }

    #[test]
    fn psd_3x3_diagonal() {
        // diag(1, 2, 3) → PSD
        let m = vec![
            vec![ri(1), ri(0), ri(0)],
            vec![ri(0), ri(2), ri(0)],
            vec![ri(0), ri(0), ri(3)],
        ];
        let (is_psd, _, _) = rational_matrix_is_psd(&m);
        assert!(is_psd);
    }

    #[test]
    fn not_psd_3x3_negative_eigval() {
        // diag(1, 2, -1) → NOT PSD (one negative eig)
        let m = vec![
            vec![ri(1), ri(0), ri(0)],
            vec![ri(0), ri(2), ri(0)],
            vec![ri(0), ri(0), -ri(1)],
        ];
        let (is_psd, n_neg, _) = rational_matrix_is_psd(&m);
        assert!(!is_psd);
        assert_eq!(n_neg, 1);
    }

    #[test]
    fn psd_with_rational_entries() {
        // [[1/2, 1/3], [1/3, 1/2]]
        // tr = 1, det = 1/4 - 1/9 = 5/36 > 0 → PSD
        let m = vec![vec![r(1, 2), r(1, 3)], vec![r(1, 3), r(1, 2)]];
        let (is_psd, n_neg, _) = rational_matrix_is_psd(&m);
        assert!(is_psd);
        assert_eq!(n_neg, 0);
    }
}
