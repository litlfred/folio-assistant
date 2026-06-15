//! Laurent polynomial in `q^{1/2}` with `BigInt` coefficients.
//!
//! Used by F3.2 (q-deformed Murnaghan-Nakayama / Ram-Wenzl character
//! recursion).  Half-integer exponents are stored as `i32` keys equal
//! to `2 × (q-exponent)`, so monomial `q^{n/2}` has key `n`.
//!
//! Sparse representation (BTreeMap keyed by exponent) — most q-MN
//! intermediate polynomials have few non-zero terms (≤ n).

use num_bigint::BigInt;
use num_traits::{One, ToPrimitive, Zero};
use std::collections::BTreeMap;
use std::ops::{Add, AddAssign, Mul, MulAssign, Neg, Sub, SubAssign};

/// Laurent polynomial in `q^{1/2}` with `BigInt` coefficients.
///
/// Internally a `BTreeMap<i32, BigInt>` where the key `2k` represents
/// the monomial `q^{k}` and key `2k+1` represents `q^{(2k+1)/2}`.
///
/// ```ignore
/// use hecke_engine::laurent_poly_q::LaurentPolyQ;
/// // q + q^{-1}
/// let p = LaurentPolyQ::from_terms(vec![(2, 1), (-2, 1)]);
/// // q^{1/2}
/// let q_half = LaurentPolyQ::q_half_pow(1);
/// ```
#[derive(Clone, Debug, Default)]
pub struct LaurentPolyQ {
    pub terms: BTreeMap<i32, BigInt>,
}

impl LaurentPolyQ {
    pub fn zero() -> Self {
        Self { terms: BTreeMap::new() }
    }

    pub fn one() -> Self {
        let mut terms = BTreeMap::new();
        terms.insert(0, BigInt::one());
        Self { terms }
    }

    /// Constant polynomial (BigInt scalar).
    pub fn from_scalar<T: Into<BigInt>>(c: T) -> Self {
        let bi: BigInt = c.into();
        if bi.is_zero() {
            return Self::zero();
        }
        let mut terms = BTreeMap::new();
        terms.insert(0, bi);
        Self { terms }
    }

    /// Build from a list of (half_exponent, coefficient) terms.
    /// `half_exponent = 2 × (q-exponent)`.
    pub fn from_terms<T: Into<BigInt>>(pairs: Vec<(i32, T)>) -> Self {
        let mut terms = BTreeMap::new();
        for (he, c) in pairs {
            let bi: BigInt = c.into();
            if !bi.is_zero() {
                *terms.entry(he).or_insert_with(BigInt::zero) += bi;
            }
        }
        // Strip zero entries.
        terms.retain(|_, v| !v.is_zero());
        Self { terms }
    }

    /// `q^{n/2}` for integer n (n=2 gives q, n=-2 gives q^{-1}, etc.).
    pub fn q_half_pow(half_exp: i32) -> Self {
        let mut terms = BTreeMap::new();
        terms.insert(half_exp, BigInt::one());
        Self { terms }
    }

    /// `q^n` for integer n.
    pub fn q_pow(n: i32) -> Self {
        Self::q_half_pow(2 * n)
    }

    /// `h := q − q^{-1}`, the Hecke parameter.
    pub fn hecke_h() -> Self {
        Self::from_terms(vec![(2, 1), (-2, -1)])
    }

    pub fn is_zero(&self) -> bool {
        self.terms.is_empty()
    }

    /// Multiply in place by an integer.
    pub fn scalar_mul_assign<T: Into<BigInt>>(&mut self, c: T) {
        let bi: BigInt = c.into();
        if bi.is_zero() {
            self.terms.clear();
            return;
        }
        for v in self.terms.values_mut() {
            *v *= &bi;
        }
    }

    /// Substitute q = 1 (set every q^? = 1) and return the resulting
    /// integer.  Returns the sum of coefficients.
    pub fn evaluate_at_one(&self) -> BigInt {
        let mut total = BigInt::zero();
        for v in self.terms.values() {
            total += v;
        }
        total
    }

    /// Substitute q = exact value (as f64) and return the result.
    /// Internal arithmetic done via repeated f64 multiplication —
    /// for high precision use `evaluate_mpfr`.
    ///
    /// **Panics** if any coefficient is not representable in f64
    /// (overflows the f64 range or `BigInt::to_f64` returns `None`).
    /// Convenience wrapper around [`Self::try_evaluate_f64`] for
    /// callers that treat overflow as a programming bug.  For library
    /// usage where overflow may be a routine condition, use
    /// `try_evaluate_f64` and handle `None` (Gemini #r3143786237).
    pub fn evaluate_f64(&self, q: f64) -> f64 {
        self.try_evaluate_f64(q).unwrap_or_else(|| {
            panic!(
                "LaurentPolyQ::evaluate_f64: a coefficient is not representable \
                 in f64 — call try_evaluate_f64 to handle overflow gracefully, \
                 or use the mpfr path for full precision"
            )
        })
    }

    /// Substitute q = exact value (as f64) and return the result, or
    /// `None` if any coefficient overflows the f64 range.  Library-
    /// friendly variant of `evaluate_f64` (Gemini #r3143786237).
    pub fn try_evaluate_f64(&self, q: f64) -> Option<f64> {
        let mut total = 0.0f64;
        for (&he, c) in &self.terms {
            // q^{he/2}: use sqrt + powi pattern.
            let exponent_doubled = he as f64 / 2.0;
            let term = q.powf(exponent_doubled);
            // BigInt → f64 via num_traits::ToPrimitive.
            let cf = c.to_f64()?;
            total += cf * term;
        }
        Some(total)
    }

    /// Substitute `q` at MPFR precision and return the result as a
    /// `rug::Float` at the precision of `q`.
    ///
    /// Used by [`crate::geck_pfeiffer::chi_lambda_via_gp_hoefsmit_mpfr`]
    /// (C-full Step 2, 2026-05-18) for high-precision evaluation of
    /// the per-T_w basis-coefficient polynomials `c_w(q)` at the
    /// canonical substrate `q_0` to ≥50 dps.
    ///
    /// Half-integer exponents `he` are evaluated as `q^{he/2}` via
    /// `q.sqrt().pow(he)` for `he` odd, or `q.pow(he/2)` for `he`
    /// even — both stable at MPFR precision.
    ///
    /// BigInt coefficients are converted via decimal-string
    /// round-trip (preserves arbitrary precision through the GMP/MPFR
    /// FFI; `BigInt::to_f64` would cap at f64 mantissa, which is
    /// inadequate for the ≥50 dps target).
    pub fn evaluate_mpfr(&self, q: &rug::Float) -> rug::Float {
        use rug::ops::Pow;
        let prec = q.prec();
        let mut total = rug::Float::with_val(prec, 0);
        // Pre-compute q^{1/2} once if any odd half-exponent is present;
        // otherwise skip the sqrt to keep the pure-integer-exp path
        // exact.
        let needs_sqrt = self.terms.keys().any(|he| he % 2 != 0);
        let q_half = if needs_sqrt {
            Some(rug::Float::with_val(prec, q.clone().sqrt()))
        } else {
            None
        };
        for (&he, c) in &self.terms {
            // q^{he/2} at MPFR precision.
            let monomial: rug::Float = if he == 0 {
                rug::Float::with_val(prec, 1)
            } else if he % 2 == 0 {
                let e = he / 2;
                rug::Float::with_val(prec, q.clone().pow(e))
            } else {
                // q^{he/2} = (q^{1/2})^he.
                rug::Float::with_val(
                    prec,
                    q_half.as_ref().unwrap().clone().pow(he),
                )
            };
            // BigInt → MPFR via decimal string (preserves precision
            // beyond f64 cap). Parse failure here would indicate a
            // BigInt → decimal-string corruption — a programming bug,
            // not a recoverable error (per Gemini review on #725).
            let c_str = c.to_str_radix(10);
            let c_float = rug::Float::parse(&c_str)
                .map(|p| rug::Float::with_val(prec, p))
                .expect(
                    "LaurentPolyQ::evaluate_mpfr: BigInt → decimal \
                     string → Float round-trip failed; this is a bug",
                );
            total += rug::Float::with_val(prec, c_float * monomial);
        }
        total
    }

    /// Format as a string, useful for tests.
    pub fn pretty(&self) -> String {
        if self.is_zero() {
            return "0".to_string();
        }
        let mut parts = Vec::new();
        for (&he, c) in &self.terms {
            let coeff_str = c.to_string();
            let mono = if he == 0 {
                String::new()
            } else if he % 2 == 0 {
                let e = he / 2;
                if e == 1 { "q".to_string() } else { format!("q^{}", e) }
            } else {
                format!("q^({}/2)", he)
            };
            parts.push(if mono.is_empty() {
                coeff_str
            } else if coeff_str == "1" {
                mono
            } else if coeff_str == "-1" {
                format!("-{}", mono)
            } else {
                format!("{}*{}", coeff_str, mono)
            });
        }
        parts.join(" + ")
    }
}

// ── Arithmetic ────────────────────────────────────────────────────

impl AddAssign<&LaurentPolyQ> for LaurentPolyQ {
    fn add_assign(&mut self, other: &LaurentPolyQ) {
        for (&he, c) in &other.terms {
            let entry = self.terms.entry(he).or_insert_with(BigInt::zero);
            *entry += c;
            if entry.is_zero() {
                self.terms.remove(&he);
            }
        }
    }
}

impl SubAssign<&LaurentPolyQ> for LaurentPolyQ {
    fn sub_assign(&mut self, other: &LaurentPolyQ) {
        for (&he, c) in &other.terms {
            let entry = self.terms.entry(he).or_insert_with(BigInt::zero);
            *entry -= c;
            if entry.is_zero() {
                self.terms.remove(&he);
            }
        }
    }
}

impl Add for LaurentPolyQ {
    type Output = Self;
    fn add(mut self, other: Self) -> Self {
        self += &other;
        self
    }
}

impl Sub for LaurentPolyQ {
    type Output = Self;
    fn sub(mut self, other: Self) -> Self {
        self -= &other;
        self
    }
}

impl Neg for LaurentPolyQ {
    type Output = Self;
    fn neg(self) -> Self {
        let mut out = self;
        for v in out.terms.values_mut() {
            *v = -std::mem::replace(v, BigInt::zero());
        }
        out
    }
}

impl Mul for LaurentPolyQ {
    type Output = Self;
    fn mul(self, other: Self) -> Self {
        if self.is_zero() || other.is_zero() {
            return Self::zero();
        }
        let mut result = BTreeMap::<i32, BigInt>::new();
        for (&he1, c1) in &self.terms {
            for (&he2, c2) in &other.terms {
                let key = he1 + he2;
                let prod = c1 * c2;
                let entry = result.entry(key).or_insert_with(BigInt::zero);
                *entry += prod;
            }
        }
        result.retain(|_, v| !v.is_zero());
        Self { terms: result }
    }
}

impl MulAssign for LaurentPolyQ {
    fn mul_assign(&mut self, other: Self) {
        let result = std::mem::take(self) * other;
        *self = result;
    }
}

impl PartialEq for LaurentPolyQ {
    fn eq(&self, other: &Self) -> bool {
        self.terms == other.terms
    }
}
impl Eq for LaurentPolyQ {}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn zero_one() {
        let z = LaurentPolyQ::zero();
        let o = LaurentPolyQ::one();
        assert!(z.is_zero());
        assert!(!o.is_zero());
        assert_eq!(z.evaluate_at_one(), BigInt::zero());
        assert_eq!(o.evaluate_at_one(), BigInt::one());
    }

    #[test]
    fn q_pow() {
        let q = LaurentPolyQ::q_pow(1);
        let q_inv = LaurentPolyQ::q_pow(-1);
        let h = LaurentPolyQ::hecke_h();
        // q − q^{-1}.
        assert_eq!(h, q.clone() - q_inv.clone());
        // h evaluated at q=1 is 0.
        assert_eq!(h.evaluate_at_one(), BigInt::zero());
        // q · q^{-1} = 1.
        let one = q * q_inv;
        assert_eq!(one, LaurentPolyQ::one());
    }

    #[test]
    fn add_sub() {
        let a = LaurentPolyQ::from_terms(vec![(2, 3), (-2, 5)]);
        let b = LaurentPolyQ::from_terms(vec![(2, 4)]);
        let c = a.clone() + b.clone();
        // Should be 7q + 5q^{-1}.
        assert_eq!(c, LaurentPolyQ::from_terms(vec![(2, 7), (-2, 5)]));
        let d = a - b;
        // Should be -q + 5q^{-1}.
        assert_eq!(d, LaurentPolyQ::from_terms(vec![(2, -1), (-2, 5)]));
    }

    #[test]
    fn mul() {
        let q = LaurentPolyQ::q_pow(1);
        let q_inv = LaurentPolyQ::q_pow(-1);
        let h = LaurentPolyQ::hecke_h();
        // h · h = q² − 2 + q^{-2}.
        let h_sq = h.clone() * h;
        assert_eq!(
            h_sq,
            LaurentPolyQ::from_terms(vec![(4, 1), (0, -2), (-4, 1)])
        );
        // (q + q^{-1}) · (q − q^{-1}) = q² − q^{-2}.
        let plus = q.clone() + q_inv.clone();
        let minus = q.clone() - q_inv.clone();
        let prod = plus * minus;
        assert_eq!(prod, LaurentPolyQ::from_terms(vec![(4, 1), (-4, -1)]));
    }

    #[test]
    fn evaluate_f64() {
        // (q + q^{-1}) at q=2 should be 2.5.
        let p = LaurentPolyQ::q_pow(1) + LaurentPolyQ::q_pow(-1);
        assert!((p.evaluate_f64(2.0) - 2.5).abs() < 1e-12);
    }

    #[test]
    fn half_integer_exponents() {
        // q^{1/2} · q^{1/2} = q.
        let qh = LaurentPolyQ::q_half_pow(1);
        let q_full = qh.clone() * qh;
        assert_eq!(q_full, LaurentPolyQ::q_pow(1));
    }

    // Direct unit tests for `evaluate_mpfr` (per Copilot review on
    // PR #725 line 164): the GP cross-validation only exercises the
    // aggregate path, so a regression in this primitive could be hard
    // to isolate.  These tests cover the precision-sensitive cases:
    // pure-integer exponents, odd half-exponents, negative
    // exponents, and coefficients beyond the f64 mantissa width.

    #[test]
    fn evaluate_mpfr_pure_integer_exponents() {
        // (q + q^{-1}) at q = 2 (50dps precision).
        let p = LaurentPolyQ::q_pow(1) + LaurentPolyQ::q_pow(-1);
        let q = rug::Float::with_val(180, 2);
        let v = p.evaluate_mpfr(&q);
        let v_f64: f64 = v.to_f64();
        // Expected: 2 + 0.5 = 2.5.
        assert!((v_f64 - 2.5).abs() < 1e-50);
    }

    #[test]
    fn evaluate_mpfr_hecke_h_at_q0() {
        // h = q − q^{-1} at the canonical substrate q_0 =
        // 1.10997859555418057528159407960950937799328227995870.
        let h = LaurentPolyQ::hecke_h();
        let q_str = "1.10997859555418057528159407960950937799328227995870";
        let q = rug::Float::with_val(180, rug::Float::parse(q_str).unwrap());
        let h_at_q0 = h.evaluate_mpfr(&q);
        // h = q − 1/q. At q_0 = 1.10998 → 1/q_0 ≈ 0.90091.
        // Expected: ≈ 0.20906.
        let h_f64: f64 = h_at_q0.to_f64();
        assert!(
            (h_f64 - 0.20906).abs() < 1e-4,
            "h at q_0 ≈ 0.20906, got {h_f64}"
        );
    }

    #[test]
    fn evaluate_mpfr_odd_half_exponent() {
        // q^{1/2} at q = 4 → 2.
        let p = LaurentPolyQ::q_half_pow(1);
        let q = rug::Float::with_val(180, 4);
        let v = p.evaluate_mpfr(&q);
        let v_f64: f64 = v.to_f64();
        assert!((v_f64 - 2.0).abs() < 1e-50);
    }

    #[test]
    fn evaluate_mpfr_negative_half_exponent() {
        // q^{-3/2} at q = 4 → 1/8 = 0.125.
        let p = LaurentPolyQ::q_half_pow(-3);
        let q = rug::Float::with_val(180, 4);
        let v = p.evaluate_mpfr(&q);
        let v_f64: f64 = v.to_f64();
        assert!((v_f64 - 0.125).abs() < 1e-50);
    }

    #[test]
    fn evaluate_mpfr_bigint_coefficient_beyond_f64() {
        // Coefficient 2^100 is well beyond f64 mantissa (53 bits).
        // The BigInt → decimal-string → MPFR round-trip must
        // preserve full precision.
        let big: BigInt = BigInt::from(1u128) << 100u32;
        let p = LaurentPolyQ::from_terms(vec![(0, big.clone())]);
        let q = rug::Float::with_val(180, 7); // q value doesn't matter for he=0
        let v = p.evaluate_mpfr(&q);
        // Expected: exactly 2^100 = 1267650600228229401496703205376.
        let expected = rug::Float::with_val(180, rug::Float::parse(
            "1267650600228229401496703205376"
        ).unwrap());
        let diff = rug::Float::with_val(180, &v - &expected);
        // Full-precision equality at 180 bits.
        let diff_f64: f64 = diff.abs().to_f64();
        assert!(
            diff_f64 < 1e-100,
            "2^100 coefficient lost precision through round-trip: diff = {diff_f64}"
        );
    }
}
