//! §S9.1 — Local Stern–Brocot continued-fraction rationalisation.
//!
//! Given an `f64` and a denominator bound `q_max`, produce the
//! best rational approximation `p/q` with `|q| ≤ q_max`.  Algorithm:
//! the standard semi-convergent / Stern-Brocot continued-fraction
//! recursion.
//!
//! Exists as a hecke-engine-local replacement for the upstream
//! `clarabel::algebra::tighten_scalar` because that helper sits
//! behind the `clarabel-bigrational` feature flag, which is
//! mutually exclusive with `clarabel-sdp` (see
//! [`docs/audits/exact-sdp-feasibility.md`](../../docs/audits/exact-sdp-feasibility.md)).
//! §S9 needs to round f64 SDP solutions to rationals, so the
//! tightening must live on the SDP side of the mutex.
//!
//! Per workplan
//! [`CLARABEL_PRECISION_PLAN.md`](../CLARABEL_PRECISION_PLAN.md) §S9.1.

use num_bigint::BigInt;
use num_traits::{One, Zero};

/// Round an `f64` to the closest rational `p/q` with `|q| ≤ q_max`,
/// returned as a `(num, den)` `BigInt` pair with `den > 0`.
///
/// Algorithm: continued-fraction expansion of `|x|` truncated to
/// `q_max`, then sign reattached.  Returns `(0, 1)` for `x = 0`,
/// panics on non-finite input.
pub fn tighten_f64(x: f64, q_max: u64) -> (BigInt, BigInt) {
    if !x.is_finite() {
        panic!("tighten_f64: non-finite input ({x})");
    }
    if x == 0.0 {
        return (BigInt::zero(), BigInt::one());
    }
    let sign = if x < 0.0 { -1 } else { 1 };
    let x_orig = x;
    let mut x = x.abs();

    // Convergents (h_{k-2}, h_{k-1}) → h_k = a_k h_{k-1} + h_{k-2}
    // and similarly for k_k.  Stop when k_k > q_max; back off to
    // the previous convergent or a semi-convergent that's still
    // within bound.
    let mut h_prev2: BigInt = BigInt::zero();
    let mut h_prev: BigInt = BigInt::one();
    let mut k_prev2: BigInt = BigInt::one();
    let mut k_prev: BigInt = BigInt::zero();
    let q_max_bi = BigInt::from(q_max);

    // 30 iterations is enough for any f64 (the partial-quotient
    // sequence of an f64 has length bounded by O(log denom)).
    for _ in 0..40 {
        let a = x.trunc();
        if a < 0.0 {
            break;
        }
        let a_bi = BigInt::from(a as u64);
        let h_new: BigInt = &a_bi * &h_prev + &h_prev2;
        let k_new: BigInt = &a_bi * &k_prev + &k_prev2;
        if k_new > q_max_bi {
            // Out-of-budget: candidate convergents are
            //   (h_prev / k_prev)        — the previous full convergent
            //   (h_semi / k_semi)        — best semi-convergent within q_max
            // Pick whichever is closer to the original `x`.  This
            // matches the standard "best rational approximation under
            // a denominator bound" definition (see Khinchin 1964 §16).
            let a_max_num: BigInt = &q_max_bi - &k_prev2;
            let a_max = if k_prev > BigInt::zero() {
                &a_max_num / &k_prev
            } else {
                BigInt::zero()
            };
            // Always-available candidate: the prior convergent.
            let mut best_h = h_prev.clone();
            let mut best_k = k_prev.clone();
            // Compute its approximation error vs original |x|.
            let orig = x_orig.abs();
            let err_prev = approx_error(&best_h, &best_k, orig);
            let mut best_err = err_prev;
            if a_max > BigInt::zero() && a_max < a_bi {
                let h_semi: BigInt = &a_max * &h_prev + &h_prev2;
                let k_semi: BigInt = &a_max * &k_prev + &k_prev2;
                if k_semi > BigInt::zero() && k_semi <= q_max_bi {
                    let err_semi = approx_error(&h_semi, &k_semi, orig);
                    if err_semi < best_err {
                        best_err = err_semi;
                        best_h = h_semi;
                        best_k = k_semi;
                    }
                }
            }
            let sign_bi = if sign < 0 {
                -BigInt::one()
            } else {
                BigInt::one()
            };
            return (sign_bi * best_h, best_k);
        }
        h_prev2 = h_prev;
        h_prev = h_new;
        k_prev2 = k_prev;
        k_prev = k_new;
        let frac = x - a;
        if frac.abs() < f64::EPSILON {
            break;
        }
        x = 1.0 / frac;
    }

    let sign_bi = if sign < 0 {
        -BigInt::one()
    } else {
        BigInt::one()
    };
    (sign_bi * h_prev, k_prev)
}

/// Internal: |x − num/den| as f64 (sufficient for the candidate
/// comparison since both candidates are within Stern-Brocot's
/// guaranteed envelope of f64's representable rationals).
fn approx_error(num: &BigInt, den: &BigInt, x_abs: f64) -> f64 {
    let p = rational_to_f64(num, den);
    (x_abs - p).abs()
}

/// Element-wise [`tighten_f64`] over an `f64` slice.
pub fn tighten_vec(xs: &[f64], q_max: u64) -> Vec<(BigInt, BigInt)> {
    xs.iter().map(|&x| tighten_f64(x, q_max)).collect()
}

/// Project a tightened `(num, den)` rational back to `f64`.
/// Lossy by construction; used for displaying / cross-checking.
pub fn rational_to_f64(num: &BigInt, den: &BigInt) -> f64 {
    use num_traits::ToPrimitive;
    let n = num.to_f64().unwrap_or(f64::NAN);
    let d = den.to_f64().unwrap_or(f64::NAN);
    n / d
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn tighten_zero_is_zero_over_one() {
        let (n, d) = tighten_f64(0.0, 100);
        assert_eq!(n, BigInt::zero());
        assert_eq!(d, BigInt::one());
    }

    #[test]
    fn tighten_half_is_one_over_two() {
        let (n, d) = tighten_f64(0.5, 100);
        assert_eq!(n, BigInt::from(1));
        assert_eq!(d, BigInt::from(2));
    }

    #[test]
    fn tighten_one_third_is_one_over_three() {
        let (n, d) = tighten_f64(1.0_f64 / 3.0_f64, 100);
        assert_eq!(n, BigInt::from(1));
        assert_eq!(d, BigInt::from(3));
    }

    #[test]
    fn tighten_negative_two_thirds() {
        let (n, d) = tighten_f64(-2.0_f64 / 3.0_f64, 100);
        assert_eq!(n, BigInt::from(-2));
        assert_eq!(d, BigInt::from(3));
    }

    #[test]
    fn tighten_pi_at_denom_113_picks_355_113() {
        // Best rational approximation of π with denom ≤ 113 is the
        // Milü 355/113 (Zu Chongzhi).
        let (n, d) = tighten_f64(std::f64::consts::PI, 113);
        assert_eq!(n, BigInt::from(355));
        assert_eq!(d, BigInt::from(113));
    }

    #[test]
    fn tighten_qou_q0_at_denom_10000() {
        // q_0 ≈ 1.10997859555418057.  Stern-Brocot at denom ≤ 10_000
        // should give a nice small-denom approximation.
        let q0 = 1.10997859555418057_f64;
        let (n, d) = tighten_f64(q0, 10_000);
        // At denom ≤ 10_000 we expect a good approximation; sanity
        // check the round-trip drift is small.
        let drift = (rational_to_f64(&n, &d) - q0).abs();
        assert!(
            drift < 1e-7,
            "drift too large: {drift} (got {n}/{d})"
        );
        // Denominator bound respected
        assert!(
            d.to_string().parse::<u64>().unwrap() <= 10_000,
            "denominator exceeded bound: {d}"
        );
    }

    #[test]
    fn tighten_vec_preserves_signs() {
        let xs = [0.5, -0.5, 1.0, -2.0];
        let qs = tighten_vec(&xs, 100);
        for (x, (n, d)) in xs.iter().zip(qs.iter()) {
            assert_eq!(
                x.signum() * (rational_to_f64(n, d).abs()),
                *x,
                "sign mismatch at x={x}"
            );
        }
    }
}
