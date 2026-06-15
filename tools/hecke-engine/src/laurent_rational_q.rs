//! Laurent polynomial in `q` with `BigRational` coefficients.
//!
//! Port of the Python `LaurentQ` class
//! (`folio-assistant/computations/laurent_q.py`) — the inner
//! arithmetic kernel of the Markov-peel reduce loop on atomic
//! braids in `H_{3A}(q)`.  Tier 1.A from
//! [`docs/audits/2026-05-20-compute-optimization-roadmap.md`].
//!
//! Why a new type instead of extending [`crate::laurent_poly_q::LaurentPolyQ`]?
//!
//! - `LaurentPolyQ` keeps `BigInt` coefficients and uses `i32` keys
//!   encoded as `2 × q_exp` to support half-integer `q` powers
//!   (q-MN / Ram–Wenzl character recursion needs `q^{1/2}`).
//! - `LaurentRationalQ` keeps `BigRational` coefficients and uses
//!   ordinary integer `q` exponents.  The Hecke reduce loop on
//!   atomic braids generates exact rationals (`1/2` from the
//!   averaged crossing `(σ + σ⁻¹)/2 = σ − h/2`), and only integer
//!   `q` powers — so `BigInt` would force a per-multiplication
//!   denominator-clearing pass.
//!
//! Both types coexist in the same crate so module boundaries can
//! convert between them when needed.
//!
//! Per CLAUDE.md §Precision goals L1 (50-dps compute floor): every
//! coefficient is an exact `BigRational`; no `f64` anywhere in the
//! arithmetic kernel.

use num_bigint::BigInt;
use num_rational::BigRational;
use num_traits::{One, Zero};
use std::collections::BTreeMap;
use std::ops::{Add, AddAssign, Mul, MulAssign, Neg, Sub, SubAssign};

/// Sparse Laurent polynomial in `q` with `BigRational` coefficients.
///
/// Internal representation: `BTreeMap<i32, BigRational>` keyed by
/// integer `q`-exponent.  Zero coefficients are stripped on every
/// operation so [`is_zero`](Self::is_zero) is `O(1)` and equality
/// of canonical forms is just `BTreeMap` equality.
#[derive(Clone, Debug, Default)]
pub struct LaurentRationalQ {
    pub coefs: BTreeMap<i32, BigRational>,
}

impl LaurentRationalQ {
    pub fn zero() -> Self {
        Self {
            coefs: BTreeMap::new(),
        }
    }

    pub fn one() -> Self {
        let mut coefs = BTreeMap::new();
        coefs.insert(0, BigRational::one());
        Self { coefs }
    }

    /// Constant polynomial from a `BigRational`.
    pub fn from_rational(c: BigRational) -> Self {
        if c.is_zero() {
            return Self::zero();
        }
        let mut coefs = BTreeMap::new();
        coefs.insert(0, c);
        Self { coefs }
    }

    /// Constant polynomial from an integer.
    pub fn from_int<T: Into<BigInt>>(c: T) -> Self {
        let bi: BigInt = c.into();
        if bi.is_zero() {
            return Self::zero();
        }
        Self::from_rational(BigRational::from_integer(bi))
    }

    /// Constant polynomial `numer / denom`.  Panics if `denom == 0`.
    pub fn from_ratio<N: Into<BigInt>, D: Into<BigInt>>(numer: N, denom: D) -> Self {
        let n: BigInt = numer.into();
        let d: BigInt = denom.into();
        if n.is_zero() {
            return Self::zero();
        }
        Self::from_rational(BigRational::new(n, d))
    }

    /// Build from `(q_exponent, coefficient)` pairs.  Identical
    /// exponents are summed; zero coefficients are dropped.
    pub fn from_terms<I>(iter: I) -> Self
    where
        I: IntoIterator<Item = (i32, BigRational)>,
    {
        let mut coefs: BTreeMap<i32, BigRational> = BTreeMap::new();
        for (e, c) in iter {
            if c.is_zero() {
                continue;
            }
            let entry = coefs.entry(e).or_insert_with(BigRational::zero);
            *entry += c;
        }
        coefs.retain(|_, v| !v.is_zero());
        Self { coefs }
    }

    /// `q^n` for integer `n`.
    pub fn q_pow(n: i32) -> Self {
        let mut coefs = BTreeMap::new();
        coefs.insert(n, BigRational::one());
        Self { coefs }
    }

    /// `h := q − q⁻¹` — the Hecke parameter that appears in
    /// R1 (`σ_i² → h σ_i + 1`).
    pub fn hecke_h() -> Self {
        let mut coefs = BTreeMap::new();
        coefs.insert(1, BigRational::one());
        coefs.insert(-1, -BigRational::one());
        Self { coefs }
    }

    pub fn is_zero(&self) -> bool {
        self.coefs.is_empty()
    }

    pub fn is_one(&self) -> bool {
        self.coefs.len() == 1
            && self
                .coefs
                .get(&0)
                .map(|c| c.is_one())
                .unwrap_or(false)
    }

    pub fn n_terms(&self) -> usize {
        self.coefs.len()
    }

    /// Evaluate at `q = 1` — sum of all coefficients.
    pub fn evaluate_at_one(&self) -> BigRational {
        let mut total = BigRational::zero();
        for v in self.coefs.values() {
            total += v;
        }
        total
    }

    /// Evaluate at an MPFR `q` and return the result at the
    /// precision of `q`.
    ///
    /// Mirrors [`crate::laurent_poly_q::LaurentPolyQ::evaluate_mpfr`]
    /// but uses BigRational coefficients (converted via decimal
    /// string for both numerator and denominator to preserve
    /// arbitrary precision through the MPFR FFI).
    pub fn evaluate_mpfr(&self, q: &rug::Float) -> rug::Float {
        use rug::ops::Pow;
        let prec = q.prec();
        let mut total = rug::Float::with_val(prec, 0);
        for (&e, c) in &self.coefs {
            let monomial: rug::Float = if e == 0 {
                rug::Float::with_val(prec, 1)
            } else {
                rug::Float::with_val(prec, q.clone().pow(e))
            };
            // BigRational → MPFR via two BigInt decimal-string round-trips.
            // BigInt::to_f64 would cap at the f64 mantissa; the string
            // round-trip preserves arbitrary precision (same pattern as
            // LaurentPolyQ::evaluate_mpfr).
            let n_str = c.numer().to_str_radix(10);
            let d_str = c.denom().to_str_radix(10);
            let n_f = rug::Float::with_val(
                prec,
                rug::Float::parse(&n_str).expect(
                    "LaurentRationalQ::evaluate_mpfr: BigInt numerator → \
                     decimal string parse failed; this is a bug",
                ),
            );
            let d_f = rug::Float::with_val(
                prec,
                rug::Float::parse(&d_str).expect(
                    "LaurentRationalQ::evaluate_mpfr: BigInt denominator \
                     → decimal string parse failed; this is a bug",
                ),
            );
            let c_f = rug::Float::with_val(prec, &n_f / &d_f);
            total += rug::Float::with_val(prec, &c_f * &monomial);
        }
        total
    }

    /// Pretty-print for tests / debugging.  Highest exponent first.
    pub fn pretty(&self) -> String {
        if self.is_zero() {
            return "0".to_string();
        }
        let mut parts = Vec::new();
        for (&e, c) in self.coefs.iter().rev() {
            let coeff_str = c.to_string();
            let mono = match e {
                0 => String::new(),
                1 => "q".to_string(),
                _ => format!("q^{}", e),
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

impl AddAssign<&LaurentRationalQ> for LaurentRationalQ {
    fn add_assign(&mut self, other: &LaurentRationalQ) {
        for (&e, c) in &other.coefs {
            let entry = self.coefs.entry(e).or_insert_with(BigRational::zero);
            *entry += c;
            if entry.is_zero() {
                self.coefs.remove(&e);
            }
        }
    }
}

impl SubAssign<&LaurentRationalQ> for LaurentRationalQ {
    fn sub_assign(&mut self, other: &LaurentRationalQ) {
        for (&e, c) in &other.coefs {
            let entry = self.coefs.entry(e).or_insert_with(BigRational::zero);
            *entry -= c;
            if entry.is_zero() {
                self.coefs.remove(&e);
            }
        }
    }
}

impl Add for LaurentRationalQ {
    type Output = Self;
    fn add(mut self, other: Self) -> Self {
        self += &other;
        self
    }
}

impl Sub for LaurentRationalQ {
    type Output = Self;
    fn sub(mut self, other: Self) -> Self {
        self -= &other;
        self
    }
}

impl Neg for LaurentRationalQ {
    type Output = Self;
    fn neg(mut self) -> Self {
        for v in self.coefs.values_mut() {
            *v = -std::mem::replace(v, BigRational::zero());
        }
        self
    }
}

impl Mul for LaurentRationalQ {
    type Output = Self;
    fn mul(self, other: Self) -> Self {
        if self.is_zero() || other.is_zero() {
            return Self::zero();
        }
        let mut result: BTreeMap<i32, BigRational> = BTreeMap::new();
        for (&e1, c1) in &self.coefs {
            for (&e2, c2) in &other.coefs {
                let e = e1 + e2;
                let prod = c1 * c2;
                let entry = result.entry(e).or_insert_with(BigRational::zero);
                *entry += prod;
            }
        }
        result.retain(|_, v| !v.is_zero());
        Self { coefs: result }
    }
}

impl Mul<&LaurentRationalQ> for &LaurentRationalQ {
    type Output = LaurentRationalQ;
    fn mul(self, other: &LaurentRationalQ) -> LaurentRationalQ {
        if self.is_zero() || other.is_zero() {
            return LaurentRationalQ::zero();
        }
        let mut result: BTreeMap<i32, BigRational> = BTreeMap::new();
        for (&e1, c1) in &self.coefs {
            for (&e2, c2) in &other.coefs {
                let e = e1 + e2;
                let prod = c1 * c2;
                let entry = result.entry(e).or_insert_with(BigRational::zero);
                *entry += prod;
            }
        }
        result.retain(|_, v| !v.is_zero());
        LaurentRationalQ { coefs: result }
    }
}

impl MulAssign for LaurentRationalQ {
    fn mul_assign(&mut self, other: Self) {
        let result = std::mem::take(self) * other;
        *self = result;
    }
}

/// Scalar multiplication by `BigRational` in place.
impl LaurentRationalQ {
    pub fn scalar_mul_assign(&mut self, c: &BigRational) {
        if c.is_zero() {
            self.coefs.clear();
            return;
        }
        if c.is_one() {
            return;
        }
        for v in self.coefs.values_mut() {
            *v *= c;
        }
        // Multiplying by a nonzero rational cannot introduce zero
        // coefficients, so no retain pass needed.
    }

    /// **R1 hot-path: `self += other · h` where `h = q − q⁻¹`.**
    ///
    /// Skips the [`Mul`] route — `other * &hecke_h()` would allocate
    /// a fresh BTreeMap and run a BigRational multiplication + GCD
    /// per `(coef × ±1)` pair, even though `h`'s coefficients are
    /// integers ±1 and the result is just the input with each
    /// exponent shifted ±1 (with a sign flip on the `q⁻¹` shift).
    ///
    /// This method writes those shifted contributions directly into
    /// `self.coefs`, doing only the BigRational additions that
    /// `+= (other · h)` would have done anyway.  Net savings: two
    /// BigRational multiplications + GCDs per coefficient per R1
    /// fire — the dominant cost of the Markov-peel reduce loop on
    /// large atomic braids.
    ///
    /// Algebraic identity (verified by the `add_h_times_matches_mul`
    /// test):
    /// ```text
    ///   self + other · h
    ///     = self + other · (q − q⁻¹)
    ///     = self + Σ_(e,c) ∈ other:  (e+1, +c) + (e−1, −c)
    /// ```
    pub fn add_h_times(&mut self, other: &LaurentRationalQ) {
        for (&e, c) in &other.coefs {
            let entry = self.coefs.entry(e + 1).or_insert_with(BigRational::zero);
            *entry += c;
            let entry = self.coefs.entry(e - 1).or_insert_with(BigRational::zero);
            *entry -= c;
        }
        // Zero coefs can appear when an additive contribution cancels
        // an existing entry (e.g. R1 cascading into a sibling word).
        self.coefs.retain(|_, v| !v.is_zero());
    }

    /// **`Ratio::new_raw` add-assign — defers GCD.**
    ///
    /// Like `+= other` but builds the result via `Ratio::new_raw`
    /// (no GCD-reduction).  Coefficients become non-canonical
    /// (denominators grow as products of the operand denoms);
    /// callers MUST follow up with [`reduce_in_place`](Self::reduce_in_place)
    /// before any cross-LaurentRationalQ equality comparison or
    /// MPFR evaluation.
    ///
    /// Used inside the Markov-peel reduce fixpoint loop where the
    /// GCD per add is ~30-50% of inner-loop wall on ⁶Li.  See
    /// [`reduce_in_place`](Self::reduce_in_place) for the
    /// end-of-pass canonicalisation pattern.
    pub fn add_assign_unreduced(&mut self, other: &LaurentRationalQ) {
        for (&e, c) in &other.coefs {
            let entry = self.coefs.entry(e).or_insert_with(BigRational::zero);
            // (a/b) + (c/d) = (a·d + c·b) / (b·d)  — no GCD reduce.
            let new_num = entry.numer() * c.denom() + c.numer() * entry.denom();
            if new_num.is_zero() {
                self.coefs.remove(&e);
            } else {
                let new_den = entry.denom() * c.denom();
                *entry = BigRational::new_raw(new_num, new_den);
            }
        }
    }

    /// **`Ratio::new_raw` variant of [`add_h_times`](Self::add_h_times).**
    ///
    /// Skips GCD-reduction on every constituent add.  Callers MUST
    /// follow up with [`reduce_in_place`](Self::reduce_in_place)
    /// before observing any coefficient externally.
    pub fn add_h_times_unreduced(&mut self, other: &LaurentRationalQ) {
        for (&e, c) in &other.coefs {
            // +c at q^{e+1}
            let entry = self.coefs.entry(e + 1).or_insert_with(BigRational::zero);
            let new_num = entry.numer() * c.denom() + c.numer() * entry.denom();
            if new_num.is_zero() {
                self.coefs.remove(&(e + 1));
            } else {
                let new_den = entry.denom() * c.denom();
                *entry = BigRational::new_raw(new_num, new_den);
            }
            // -c at q^{e-1}
            let entry = self.coefs.entry(e - 1).or_insert_with(BigRational::zero);
            let new_num = entry.numer() * c.denom() - c.numer() * entry.denom();
            if new_num.is_zero() {
                self.coefs.remove(&(e - 1));
            } else {
                let new_den = entry.denom() * c.denom();
                *entry = BigRational::new_raw(new_num, new_den);
            }
        }
    }

    /// Canonicalise each coefficient via `Ratio::new` (does the GCD
    /// reduction).  Call after a batch of `*_unreduced` adds, before
    /// any cross-LaurentRationalQ equality comparison or MPFR
    /// evaluation.
    ///
    /// num-rational doesn't expose a public `reduce()` method on
    /// `Ratio`; round-tripping through `Ratio::new` forces the GCD.
    pub fn reduce_in_place(&mut self) {
        for v in self.coefs.values_mut() {
            let n = v.numer().clone();
            let d = v.denom().clone();
            *v = BigRational::new(n, d);
        }
    }
}

impl PartialEq for LaurentRationalQ {
    fn eq(&self, other: &Self) -> bool {
        self.coefs == other.coefs
    }
}
impl Eq for LaurentRationalQ {}

// ── Tests ─────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use num_bigint::BigInt;

    fn br<N: Into<BigInt>, D: Into<BigInt>>(n: N, d: D) -> BigRational {
        BigRational::new(n.into(), d.into())
    }

    #[test]
    fn zero_one() {
        let z = LaurentRationalQ::zero();
        let o = LaurentRationalQ::one();
        assert!(z.is_zero());
        assert!(!o.is_zero());
        assert!(o.is_one());
        assert_eq!(z.evaluate_at_one(), BigRational::zero());
        assert_eq!(o.evaluate_at_one(), BigRational::one());
    }

    #[test]
    fn from_rational_strips_zero() {
        let p = LaurentRationalQ::from_rational(BigRational::zero());
        assert!(p.is_zero());
    }

    #[test]
    fn from_terms_combines_duplicates() {
        // 3q + 4q - 7q → 0
        let p = LaurentRationalQ::from_terms(vec![
            (1, br(3, 1)),
            (1, br(4, 1)),
            (1, br(-7, 1)),
        ]);
        assert!(p.is_zero());
    }

    #[test]
    fn q_pow_and_one() {
        let q = LaurentRationalQ::q_pow(1);
        let q_inv = LaurentRationalQ::q_pow(-1);
        let prod = q.clone() * q_inv.clone();
        assert_eq!(prod, LaurentRationalQ::one());
        // q^0 = 1
        assert_eq!(LaurentRationalQ::q_pow(0), LaurentRationalQ::one());
    }

    #[test]
    fn hecke_h() {
        // h = q − q⁻¹.  At q=1 → 0; at q=2 → 3/2.
        let h = LaurentRationalQ::hecke_h();
        assert_eq!(h.evaluate_at_one(), BigRational::zero());
        // Build manually and compare.
        let manual = LaurentRationalQ::q_pow(1) - LaurentRationalQ::q_pow(-1);
        assert_eq!(h, manual);
    }

    #[test]
    fn add_sub() {
        // (3q + 5q⁻¹) + (4q) = 7q + 5q⁻¹
        let a = LaurentRationalQ::from_terms(vec![(1, br(3, 1)), (-1, br(5, 1))]);
        let b = LaurentRationalQ::from_terms(vec![(1, br(4, 1))]);
        let s = a.clone() + b.clone();
        assert_eq!(
            s,
            LaurentRationalQ::from_terms(vec![(1, br(7, 1)), (-1, br(5, 1))])
        );
        // (3q + 5q⁻¹) − (4q) = −q + 5q⁻¹
        let d = a - b;
        assert_eq!(
            d,
            LaurentRationalQ::from_terms(vec![(1, br(-1, 1)), (-1, br(5, 1))])
        );
    }

    #[test]
    fn mul_hecke_h_squared() {
        // h · h = (q − q⁻¹)² = q² − 2 + q⁻²
        let h = LaurentRationalQ::hecke_h();
        let h_sq = h.clone() * h;
        assert_eq!(
            h_sq,
            LaurentRationalQ::from_terms(vec![
                (2, br(1, 1)),
                (0, br(-2, 1)),
                (-2, br(1, 1)),
            ])
        );
    }

    #[test]
    fn mul_with_rational_coefs() {
        // (q − q⁻¹) · (1/2) = q/2 − q⁻¹/2
        // Verify the rational coefficient propagates correctly.
        let h = LaurentRationalQ::hecke_h();
        let half = LaurentRationalQ::from_rational(br(1, 2));
        let prod = h * half;
        assert_eq!(
            prod,
            LaurentRationalQ::from_terms(vec![
                (1, br(1, 2)),
                (-1, br(-1, 2)),
            ])
        );
    }

    #[test]
    fn mul_averaged_factor_constant() {
        // The averaged-crossing constant is −h/2 = −(q − q⁻¹)/2
        //                                     = −q/2 + q⁻¹/2
        // Then (−h/2)² = h²/4 = q²/4 − 1/2 + q⁻²/4
        let neg_h_over_2 = LaurentRationalQ::from_terms(vec![
            (1, br(-1, 2)),
            (-1, br(1, 2)),
        ]);
        let sq = neg_h_over_2.clone() * neg_h_over_2;
        assert_eq!(
            sq,
            LaurentRationalQ::from_terms(vec![
                (2, br(1, 4)),
                (0, br(-1, 2)),
                (-2, br(1, 4)),
            ])
        );
    }

    #[test]
    fn neg() {
        let p = LaurentRationalQ::from_terms(vec![(1, br(3, 1)), (-1, br(-5, 1))]);
        let n = -p.clone();
        let s = p + n;
        assert!(s.is_zero());
    }

    #[test]
    fn scalar_mul_assign_by_half() {
        let mut p = LaurentRationalQ::hecke_h();
        p.scalar_mul_assign(&br(1, 2));
        assert_eq!(
            p,
            LaurentRationalQ::from_terms(vec![
                (1, br(1, 2)),
                (-1, br(-1, 2)),
            ])
        );
    }

    #[test]
    fn scalar_mul_assign_by_zero_clears() {
        let mut p = LaurentRationalQ::hecke_h();
        p.scalar_mul_assign(&BigRational::zero());
        assert!(p.is_zero());
    }

    #[test]
    fn equality_canonical_form() {
        // (q + q⁻¹) + 0 = q + q⁻¹ regardless of construction path.
        let a = LaurentRationalQ::q_pow(1) + LaurentRationalQ::q_pow(-1);
        let b = LaurentRationalQ::from_terms(vec![(1, br(1, 1)), (-1, br(1, 1))]);
        assert_eq!(a, b);
        // Adding zero-coef terms in from_terms doesn't change identity.
        let c = LaurentRationalQ::from_terms(vec![
            (1, br(1, 1)),
            (-1, br(1, 1)),
            (5, br(0, 1)),
        ]);
        assert_eq!(a, c);
    }

    #[test]
    fn evaluate_mpfr_hecke_h_at_q0() {
        // h = q − q⁻¹ at q₀ ≈ 1.10997859555418057528 — same canonical
        // substrate as the LaurentPolyQ test.  Expected ≈ 0.20906.
        let h = LaurentRationalQ::hecke_h();
        let q_str = "1.10997859555418057528159407960950937799328227995870";
        let q = rug::Float::with_val(180, rug::Float::parse(q_str).unwrap());
        let val = h.evaluate_mpfr(&q);
        let v_f64: f64 = val.to_f64();
        assert!(
            (v_f64 - 0.20906).abs() < 1e-4,
            "h at q_0 ≈ 0.20906, got {v_f64}"
        );
    }

    #[test]
    fn evaluate_mpfr_rational_coefficient() {
        // (q/2 + q⁻¹/3) at q = 6 → 6/2 + 1/(6·3) = 3 + 1/18 ≈ 3.05555…
        let p = LaurentRationalQ::from_terms(vec![
            (1, br(1, 2)),
            (-1, br(1, 3)),
        ]);
        let q = rug::Float::with_val(180, 6);
        let v = p.evaluate_mpfr(&q);
        let expected = 3.0 + 1.0 / 18.0;
        let v_f64: f64 = v.to_f64();
        assert!(
            (v_f64 - expected).abs() < 1e-12,
            "(q/2 + q⁻¹/3) at q=6 expected {expected}, got {v_f64}"
        );
    }

    #[test]
    fn add_h_times_matches_mul() {
        // self + other · h  ≡  self + (other · hecke_h())  via the
        // general Mul path.  Compare bit-for-bit on a non-trivial
        // mix of rational coefs + multiple exponents.
        let other = LaurentRationalQ::from_terms(vec![
            (2, br(1, 2)),
            (0, br(-3, 5)),
            (-1, br(7, 1)),
        ]);
        let self_init = LaurentRationalQ::from_terms(vec![
            (3, br(1, 1)),
            (-2, br(1, 3)),
        ]);
        let expected = self_init.clone()
            + (other.clone() * LaurentRationalQ::hecke_h());
        let mut a = self_init;
        a.add_h_times(&other);
        assert_eq!(a, expected);
    }

    #[test]
    fn add_h_times_zero_into_self_no_change() {
        let self_init = LaurentRationalQ::from_terms(vec![(2, br(1, 1))]);
        let zero = LaurentRationalQ::zero();
        let before = self_init.clone();
        let mut a = self_init;
        a.add_h_times(&zero);
        assert_eq!(a, before);
    }

    #[test]
    fn add_assign_unreduced_then_reduce_matches_canonical() {
        // Build a chain of adds that would normally each do a GCD;
        // the unreduced path defers, then reduce_in_place catches up.
        // Result must equal the canonical += chain bit-for-bit.
        let parts: Vec<LaurentRationalQ> = (0i32..10)
            .map(|i| {
                LaurentRationalQ::from_terms(vec![
                    (i, br(1, 1i32 << (i.unsigned_abs() % 5))),
                    (i + 1, br(-1, 3)),
                ])
            })
            .collect();
        // Canonical accumulator.
        let mut canonical = LaurentRationalQ::zero();
        for p in &parts {
            canonical += p;
        }
        // Unreduced accumulator + final reduce.
        let mut unreduced = LaurentRationalQ::zero();
        for p in &parts {
            unreduced.add_assign_unreduced(p);
        }
        unreduced.reduce_in_place();
        assert_eq!(canonical, unreduced);
    }

    #[test]
    fn add_h_times_unreduced_then_reduce_matches_canonical() {
        // self + Σ_i other_i · h via both paths must agree.
        let self_init = LaurentRationalQ::from_terms(vec![
            (3, br(5, 6)),
            (-2, br(1, 4)),
        ]);
        let others: Vec<LaurentRationalQ> = vec![
            LaurentRationalQ::from_terms(vec![(2, br(1, 2)), (0, br(-3, 7))]),
            LaurentRationalQ::from_terms(vec![(0, br(7, 5)), (-1, br(2, 3))]),
            LaurentRationalQ::from_terms(vec![(1, br(-1, 6))]),
        ];
        // Canonical: + Σ other_i · h
        let mut canonical = self_init.clone();
        for o in &others {
            canonical.add_h_times(o);
        }
        // Unreduced: same with deferred GCDs.
        let mut unreduced = self_init.clone();
        for o in &others {
            unreduced.add_h_times_unreduced(o);
        }
        unreduced.reduce_in_place();
        assert_eq!(canonical, unreduced);
    }

    #[test]
    fn add_h_times_strips_cancelling_terms() {
        // Construct self s.t. self + other·h has a vanishing coef.
        // other = q^0 with coef 1; other·h = q¹ − q⁻¹.
        // self = q⁻¹ with coef 1 → self + other·h = q¹ + 0·q⁻¹
        //   → after strip: only q¹ remains.
        let other = LaurentRationalQ::q_pow(0);
        let mut a = LaurentRationalQ::q_pow(-1);
        a.add_h_times(&other);
        assert_eq!(a, LaurentRationalQ::q_pow(1));
        // No stray zero entries:
        assert!(!a.coefs.contains_key(&(-1)));
    }

    #[test]
    fn pretty_smoke() {
        // Render a small polynomial as a sanity check (exact format
        // is not part of the contract — just must not panic).
        let p = LaurentRationalQ::from_terms(vec![
            (2, br(3, 1)),
            (0, br(-1, 1)),
            (-1, br(1, 2)),
        ]);
        let s = p.pretty();
        assert!(s.contains("q^2"));
        assert!(s.contains("q^-1") || s.contains("q^{-1}") || s.contains("/q") || s.contains("q^-1"));
    }
}
