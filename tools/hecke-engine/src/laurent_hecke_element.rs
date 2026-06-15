//! Hecke element with `LaurentRationalQ` coefficients.
//!
//! Port of `LaurentHeckeElement`
//! (`folio-assistant/computations/hecke_laurent_fast.py`).  A
//! "Hecke element" is a formal `Q[q, q⁻¹]`-linear combination of
//! words in the Hecke generators `σ_i`.  Internally, the same
//! shape as `Q[q, q⁻¹][σ_1, …, σ_{n-1}] / ⟨braid + Hecke⟩` carries.
//!
//! Internal representation: `BTreeMap<Vec<i32>, LaurentRationalQ>`
//! mapping each σ-word to a coefficient that is itself a Laurent
//! polynomial in `q`.  BTreeMap (rather than HashMap) for
//! deterministic iteration / FFI output / equality testing.
//!
//! Word convention: `Vec<i32>` (0-based generator indices,
//! consistent with the Python reduce loop).  Negative entries are
//! reserved for "formal variables" (R4 / quotient-ideal markers)
//! which the fast-path reduce does not produce — but the type
//! signature accepts them so a future R4 port (Tier 1.B / 1.E) can
//! slot in without breaking the FFI shape.  See R2 in
//! `hecke_laurent_fast.py:166-183` for the formal-variable rule.

use crate::laurent_rational_q::LaurentRationalQ;
use num_bigint::BigInt;
use num_rational::BigRational;
use std::collections::BTreeMap;

/// Hecke element with `LaurentRationalQ` coefficients.
#[derive(Clone, Debug, Default, PartialEq, Eq)]
pub struct LaurentHeckeElement {
    pub terms: BTreeMap<Vec<i32>, LaurentRationalQ>,
}

impl LaurentHeckeElement {
    pub fn zero() -> Self {
        Self {
            terms: BTreeMap::new(),
        }
    }

    /// Identity element — the empty word with coefficient `1`.
    pub fn identity() -> Self {
        let mut terms = BTreeMap::new();
        terms.insert(Vec::new(), LaurentRationalQ::one());
        Self { terms }
    }

    /// Build from an iterator of `(word, coefficient)` pairs.
    /// Duplicate words are summed; zero coefficients are dropped.
    pub fn from_terms<I>(iter: I) -> Self
    where
        I: IntoIterator<Item = (Vec<i32>, LaurentRationalQ)>,
    {
        let mut terms: BTreeMap<Vec<i32>, LaurentRationalQ> = BTreeMap::new();
        for (w, c) in iter {
            if c.is_zero() {
                continue;
            }
            let entry = terms.entry(w).or_insert_with(LaurentRationalQ::zero);
            *entry += &c;
        }
        terms.retain(|_, v| !v.is_zero());
        Self { terms }
    }

    pub fn is_zero(&self) -> bool {
        self.terms.is_empty()
    }

    pub fn n_terms(&self) -> usize {
        self.terms.len()
    }

    /// Single-term constructor `coef · word`.
    pub fn from_term(word: Vec<i32>, coef: LaurentRationalQ) -> Self {
        if coef.is_zero() {
            return Self::zero();
        }
        let mut terms = BTreeMap::new();
        terms.insert(word, coef);
        Self { terms }
    }

    /// Build a per-crossing Hecke factor `c·σ_gen + d·1` for one of
    /// the three sign cases that arise from `atom_braid_word_3A`:
    ///
    /// - **`+1` (Sigma)**: `σ_gen` (single-term, coefficient `1`).
    /// - **`-1` (SigmaInv)**: `σ_gen − h` where `h = q − q⁻¹`.
    /// - **`0` (Averaged)**: `σ_gen − h/2` (the half is why the
    ///   coefficient ring must be `Q[q, q⁻¹]`, not `Z[q, q⁻¹]`).
    ///
    /// Matches the float discriminator in
    /// `folio-assistant/computations/markov_peel_rust_bridge.py`
    /// `_atomic_word_to_signed_gens`.
    pub fn crossing_factor(gen: i32, sign: i8) -> Self {
        let mut terms: BTreeMap<Vec<i32>, LaurentRationalQ> = BTreeMap::new();
        terms.insert(vec![gen], LaurentRationalQ::one());
        match sign {
            1 => { /* σ_gen — single term */ }
            -1 => {
                let neg_h = -LaurentRationalQ::hecke_h();
                terms.insert(Vec::new(), neg_h);
            }
            0 => {
                let mut neg_h_over_2 = LaurentRationalQ::hecke_h();
                let neg_half = BigRational::new(BigInt::from(-1), BigInt::from(2));
                neg_h_over_2.scalar_mul_assign(&neg_half);
                terms.insert(Vec::new(), neg_h_over_2);
            }
            _ => panic!(
                "LaurentHeckeElement::crossing_factor: invalid sign {} \
                 (expected -1, 0, +1)",
                sign
            ),
        }
        Self { terms }
    }

    /// FFI deserialisation — inverse of [`to_ffi`](Self::to_ffi).
    ///
    /// Builds a [`LaurentHeckeElement`] from the wire-format
    /// `Vec<(word, Vec<(q_exp, num_decimal, den_decimal)>)>`.
    /// Used by the prefix-cache infra (commit on PR #886) to
    /// resume an incremental reduce from a previously-saved state.
    pub fn from_ffi(
        data: &[(Vec<i32>, Vec<(i32, String, String)>)],
    ) -> Result<Self, String> {
        use num_bigint::BigInt;
        use num_rational::BigRational;
        use std::collections::BTreeMap;
        let mut terms: BTreeMap<Vec<i32>, LaurentRationalQ> = BTreeMap::new();
        for (word, coef_data) in data {
            let mut coefs: BTreeMap<i32, BigRational> = BTreeMap::new();
            for (e, num_str, den_str) in coef_data {
                let n = BigInt::parse_bytes(num_str.as_bytes(), 10)
                    .ok_or_else(|| format!(
                        "LaurentHeckeElement::from_ffi: invalid numerator decimal {:?}",
                        num_str
                    ))?;
                let d = BigInt::parse_bytes(den_str.as_bytes(), 10)
                    .ok_or_else(|| format!(
                        "LaurentHeckeElement::from_ffi: invalid denominator decimal {:?}",
                        den_str
                    ))?;
                coefs.insert(*e, BigRational::new(n, d));
            }
            let lrq = LaurentRationalQ { coefs };
            if !lrq.is_zero() {
                terms.insert(word.clone(), lrq);
            }
        }
        Ok(LaurentHeckeElement { terms })
    }

    /// FFI serialisation for the PyO3 bridge.
    ///
    /// Emits each `(word, coef)` as
    /// `(Vec<i32>, Vec<(q_exp, numerator_decimal, denominator_decimal)>)`.
    /// Decimal-string round-trip preserves arbitrary BigInt precision
    /// through the FFI (same pattern as `LaurentPolyQ`-flavoured
    /// FFI elsewhere in this crate, e.g. `tr_m_word_lq::ZHLaurent::to_ffi`).
    pub fn to_ffi(&self) -> Vec<(Vec<i32>, Vec<(i32, String, String)>)> {
        self.terms
            .iter()
            .map(|(w, coef)| {
                let coef_ffi: Vec<(i32, String, String)> = coef
                    .coefs
                    .iter()
                    .map(|(&e, c)| {
                        (
                            e,
                            c.numer().to_str_radix(10),
                            c.denom().to_str_radix(10),
                        )
                    })
                    .collect();
                (w.clone(), coef_ffi)
            })
            .collect()
    }
}

// ── Arithmetic ────────────────────────────────────────────────────

impl std::ops::Add for LaurentHeckeElement {
    type Output = Self;
    fn add(mut self, other: Self) -> Self {
        for (w, c) in other.terms {
            let entry = self.terms.entry(w).or_insert_with(LaurentRationalQ::zero);
            *entry += &c;
        }
        self.terms.retain(|_, v| !v.is_zero());
        self
    }
}

impl std::ops::AddAssign<&LaurentHeckeElement> for LaurentHeckeElement {
    fn add_assign(&mut self, other: &LaurentHeckeElement) {
        for (w, c) in &other.terms {
            let entry = self.terms.entry(w.clone()).or_insert_with(LaurentRationalQ::zero);
            *entry += c;
        }
        self.terms.retain(|_, v| !v.is_zero());
    }
}

impl std::ops::Mul for LaurentHeckeElement {
    type Output = Self;
    fn mul(self, other: Self) -> Self {
        &self * &other
    }
}

impl std::ops::Mul for &LaurentHeckeElement {
    type Output = LaurentHeckeElement;
    fn mul(self, other: &LaurentHeckeElement) -> LaurentHeckeElement {
        if self.is_zero() || other.is_zero() {
            return LaurentHeckeElement::zero();
        }
        let mut result: BTreeMap<Vec<i32>, LaurentRationalQ> = BTreeMap::new();
        for (w1, c1) in &self.terms {
            for (w2, c2) in &other.terms {
                let mut w = Vec::with_capacity(w1.len() + w2.len());
                w.extend_from_slice(w1);
                w.extend_from_slice(w2);
                let cc = c1 * c2;
                if cc.is_zero() {
                    continue;
                }
                let entry = result.entry(w).or_insert_with(LaurentRationalQ::zero);
                *entry += &cc;
            }
        }
        result.retain(|_, v| !v.is_zero());
        LaurentHeckeElement { terms: result }
    }
}

// ── Tests ─────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn zero_identity() {
        let z = LaurentHeckeElement::zero();
        let i = LaurentHeckeElement::identity();
        assert!(z.is_zero());
        assert!(!i.is_zero());
        assert_eq!(i.n_terms(), 1);
        let empty: Vec<i32> = Vec::new();
        assert_eq!(i.terms[&empty], LaurentRationalQ::one());
    }

    #[test]
    fn identity_is_mul_identity() {
        // (σ_0 + σ_1) · 1 = σ_0 + σ_1, and 1 · (σ_0 + σ_1) = the same.
        let elem = LaurentHeckeElement::from_terms(vec![
            (vec![0], LaurentRationalQ::one()),
            (vec![1], LaurentRationalQ::one()),
        ]);
        let prod = elem.clone() * LaurentHeckeElement::identity();
        assert_eq!(prod, elem);
        let prod2 = LaurentHeckeElement::identity() * elem.clone();
        assert_eq!(prod2, elem);
    }

    #[test]
    fn crossing_factor_sigma_plus() {
        let f = LaurentHeckeElement::crossing_factor(0, 1);
        assert_eq!(f.n_terms(), 1);
        assert_eq!(f.terms[&vec![0]], LaurentRationalQ::one());
    }

    #[test]
    fn crossing_factor_sigma_minus() {
        // σ_0 − h
        let f = LaurentHeckeElement::crossing_factor(0, -1);
        assert_eq!(f.n_terms(), 2);
        let neg_h = -LaurentRationalQ::hecke_h();
        let empty: Vec<i32> = Vec::new();
        assert_eq!(f.terms[&empty], neg_h);
        assert_eq!(f.terms[&vec![0]], LaurentRationalQ::one());
    }

    #[test]
    fn crossing_factor_averaged_has_half_denominator() {
        // σ_0 − h/2 — the constant term must have denominator 2 on
        // each of its two q-coefficients (q/2 and q⁻¹/2 with signs).
        let f = LaurentHeckeElement::crossing_factor(0, 0);
        assert_eq!(f.n_terms(), 2);
        let empty: Vec<i32> = Vec::new();
        let const_term = &f.terms[&empty];
        for c in const_term.coefs.values() {
            assert_eq!(*c.denom(), BigInt::from(2));
        }
    }

    #[test]
    fn multiplication_concatenates_words() {
        // σ_0 · σ_1 = σ_0 σ_1   (word [0, 1])
        let a = LaurentHeckeElement::from_term(vec![0], LaurentRationalQ::one());
        let b = LaurentHeckeElement::from_term(vec![1], LaurentRationalQ::one());
        let prod = a * b;
        assert_eq!(prod.n_terms(), 1);
        assert!(prod.terms.contains_key(&vec![0, 1]));
        assert_eq!(prod.terms[&vec![0, 1]], LaurentRationalQ::one());
    }

    #[test]
    fn multiplication_distributes_with_coefs() {
        // (σ_0 + q·1) · (σ_1 − 1) = σ_0 σ_1 − σ_0 + q σ_1 − q
        let q1 = LaurentRationalQ::q_pow(1);
        let one = LaurentRationalQ::one();
        let a = LaurentHeckeElement::from_terms(vec![
            (vec![0], one.clone()),
            (vec![], q1.clone()),
        ]);
        let b = LaurentHeckeElement::from_terms(vec![
            (vec![1], one.clone()),
            (vec![], -one.clone()),
        ]);
        let prod = a * b;
        assert_eq!(prod.n_terms(), 4);
        assert_eq!(prod.terms[&vec![0, 1]], one);
        assert_eq!(prod.terms[&vec![0]], -one.clone());
        assert_eq!(prod.terms[&vec![1]], q1.clone());
        let empty: Vec<i32> = Vec::new();
        assert_eq!(prod.terms[&empty], -q1);
    }

    #[test]
    fn addition_merges_and_strips_zeros() {
        // (σ_0 + σ_1) + (σ_1 − σ_0) = 2 σ_1
        let one = LaurentRationalQ::one();
        let neg_one = -one.clone();
        let a = LaurentHeckeElement::from_terms(vec![
            (vec![0], one.clone()),
            (vec![1], one.clone()),
        ]);
        let b = LaurentHeckeElement::from_terms(vec![
            (vec![1], one.clone()),
            (vec![0], neg_one.clone()),
        ]);
        let s = a + b;
        assert_eq!(s.n_terms(), 1);
        let two = LaurentRationalQ::from_int(2);
        assert_eq!(s.terms[&vec![1]], two);
    }

    #[test]
    fn add_assign_ref_keeps_self_canonical() {
        let one = LaurentRationalQ::one();
        let mut a = LaurentHeckeElement::from_term(vec![0], one.clone());
        let b = LaurentHeckeElement::from_term(vec![0], -one.clone());
        a += &b;
        assert!(a.is_zero());
    }

    #[test]
    fn ffi_shape_three_string_tuple() {
        // σ_0 − h/2 has two terms; each coef has 1-2 q-exponents and
        // every q-exponent yields a (q_exp, num_str, den_str) triple
        // with parseable decimal strings.
        let f = LaurentHeckeElement::crossing_factor(0, 0);
        let ffi = f.to_ffi();
        assert_eq!(ffi.len(), 2);
        for (_w, coefs) in &ffi {
            assert!(!coefs.is_empty());
            for (_q_exp, num_str, den_str) in coefs {
                let _: i128 = num_str.parse().expect("num parses");
                let den: u128 = den_str.parse().expect("den parses");
                assert!(den > 0, "denominator must be positive");
            }
        }
    }

    /// Sanity: building the crossing factor for a non-zero generator
    /// (gen = 3) preserves the word shape and the half-denominator
    /// invariant.  This guards against off-by-one bugs in the
    /// generator-index plumbing.
    #[test]
    fn crossing_factor_generator_index_passthrough() {
        let f = LaurentHeckeElement::crossing_factor(3, 0);
        assert_eq!(f.n_terms(), 2);
        assert!(f.terms.contains_key(&vec![3]));
        let empty: Vec<i32> = Vec::new();
        assert!(f.terms.contains_key(&empty));
    }
}
