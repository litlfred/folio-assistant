//! GB-NF reducer for the Iwahori-Hecke algebra H_n(q).
//!
//! Rust port of the Python proof-of-concept
//! [`gb_filtration_jet_tracker.py`](../../../folio-assistant/computations/gb_filtration_jet_tracker.py).
//!
//! Generators T_1, ..., T_{n-1} satisfy:
//!   T_i^2 = (q - q^{-1}) T_i + 1                       (Hecke quadratic)
//!   T_i T_{i+1} T_i = T_{i+1} T_i T_{i+1}              (braid 1)
//!   T_i T_j = T_j T_i  for |i - j| ≥ 2                 (braid 2)
//!
//! Inverse rule: T_i^{-1} = T_i - (q - q^{-1}).
//!
//! Right-multiplication GB-NF rule:
//!   T_w · T_i =  T_{ws_i}                if ℓ(ws_i) > ℓ(w)
//!             =  (q - q^{-1}) T_w + T_{ws_i}     otherwise.
//!
//! See [RUST_INTEGRATION.md](../../RUST_INTEGRATION.md) §"Phase R2".

use crate::joint_tower_sdp_certificate as cert;
use num_rational::BigRational;
use num_traits::{One, Zero};
use std::collections::BTreeMap;

// ───────────────────────────────────────────────────────────────────
// Laurent polynomial in q with BigRational coefficients.
// Sparse representation: BTreeMap<exponent, coefficient>.
// ───────────────────────────────────────────────────────────────────

/// Laurent polynomial in q.  Sparse: terms with zero coefficient
/// are absent.  Supports exponents in ℤ.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct LaurentQ {
    pub terms: BTreeMap<i32, BigRational>,
}

impl LaurentQ {
    pub fn zero() -> Self {
        Self {
            terms: BTreeMap::new(),
        }
    }

    pub fn one() -> Self {
        let mut t = BTreeMap::new();
        t.insert(0, BigRational::one());
        Self { terms: t }
    }

    /// Monomial c · q^e.
    pub fn monomial(c: BigRational, e: i32) -> Self {
        if c.is_zero() {
            return Self::zero();
        }
        let mut t = BTreeMap::new();
        t.insert(e, c);
        Self { terms: t }
    }

    /// h := q − q^{-1}.
    pub fn h_param() -> Self {
        let mut t = BTreeMap::new();
        t.insert(1, BigRational::one());
        t.insert(-1, -BigRational::one());
        Self { terms: t }
    }

    pub fn is_zero(&self) -> bool {
        self.terms.is_empty()
    }

    pub fn add_assign(&mut self, other: &Self) {
        for (&e, c) in &other.terms {
            let entry = self.terms.entry(e).or_insert_with(BigRational::zero);
            *entry += c;
            if entry.is_zero() {
                self.terms.remove(&e);
            }
        }
    }

    pub fn neg(&self) -> Self {
        Self {
            terms: self.terms.iter().map(|(&e, c)| (e, -c)).collect(),
        }
    }

    pub fn mul(&self, other: &Self) -> Self {
        let mut out = Self::zero();
        for (&e1, c1) in &self.terms {
            for (&e2, c2) in &other.terms {
                let e = e1 + e2;
                let c = c1 * c2;
                let entry = out.terms.entry(e).or_insert_with(BigRational::zero);
                *entry += &c;
                if entry.is_zero() {
                    out.terms.remove(&e);
                }
            }
        }
        out
    }

    /// Pretty-print as a SymPy-equivalent string.  Matches Python
    /// output to ease cross-validation.
    pub fn to_sympy_str(&self) -> String {
        if self.terms.is_empty() {
            return "0".to_string();
        }
        let mut parts: Vec<String> = Vec::new();
        // Iterate ascending in exponent for stable output.
        for (&e, c) in &self.terms {
            let sign = if c >= &BigRational::zero() { "+" } else { "-" };
            let abs_c = if c >= &BigRational::zero() {
                c.clone()
            } else {
                -c.clone()
            };
            let coef_str = if abs_c == BigRational::one() && e != 0 {
                String::new()
            } else if abs_c.denom() == &num_bigint::BigInt::from(1) {
                abs_c.numer().to_string()
            } else {
                format!("({}/{})", abs_c.numer(), abs_c.denom())
            };
            let exp_str = match e {
                0 => "1".to_string(),
                1 => "q".to_string(),
                -1 => "1/q".to_string(),
                _ if e > 0 => format!("q**{}", e),
                _ => format!("q**({})", e),
            };
            let term = if coef_str.is_empty() {
                exp_str
            } else if exp_str == "1" {
                coef_str
            } else {
                format!("{}*{}", coef_str, exp_str)
            };
            if parts.is_empty() {
                parts.push(if sign == "-" {
                    format!("-{}", term)
                } else {
                    term
                });
            } else {
                parts.push(format!(" {} {}", sign, term));
            }
        }
        parts.concat()
    }
}

// ───────────────────────────────────────────────────────────────────
// Symmetric group S_n: permutations as Vec<usize> (1-based image).
// ───────────────────────────────────────────────────────────────────

/// Apply transposition s_i = (i, i+1) on the right: w · s_i.
pub fn perm_apply_s(perm: &[usize], i: usize) -> Vec<usize> {
    let mut p = perm.to_vec();
    p.swap(i - 1, i);
    p
}

/// Coxeter length = number of inversions.
pub fn coxeter_length(perm: &[usize]) -> u32 {
    let n = perm.len();
    let mut inversions = 0u32;
    for a in 0..n {
        for b in (a + 1)..n {
            if perm[a] > perm[b] {
                inversions += 1;
            }
        }
    }
    inversions
}

/// Greedy reduced word for `perm`: scan left-to-right for descents,
/// apply transpositions, return word in 1-based generator indices.
pub fn perm_to_canonical_word(perm: &[usize]) -> Vec<u32> {
    let mut p = perm.to_vec();
    let mut word: Vec<u32> = Vec::new();
    let n = p.len();
    loop {
        let mut found: Option<usize> = None;
        for k in 1..n {
            if p[k - 1] > p[k] {
                found = Some(k);
                break;
            }
        }
        match found {
            None => break,
            Some(i) => {
                word.push(i as u32);
                p.swap(i - 1, i);
            }
        }
    }
    word.reverse();
    word
}

/// Identity permutation of S_n (1-based: [1, 2, ..., n]).
pub fn perm_identity(n: usize) -> Vec<usize> {
    (1..=n).collect()
}

// ───────────────────────────────────────────────────────────────────
// Hecke element: dict { perm → LaurentQ }.
// ───────────────────────────────────────────────────────────────────

/// Element of H_n(q) as a sparse map perm → coefficient.
/// Tracks reduction history (jet log) optionally.
#[derive(Clone, Debug)]
pub struct HeckeElement {
    pub n: usize,
    pub terms: BTreeMap<Vec<usize>, LaurentQ>,
    pub jet_log: Vec<cert::JetEvent>,
    pub step_counter: u64,
}

/// Symbolic braid letter for the canonical atom-braid alphabet.
///
/// Supports the 3 crossing types in `atom_braid_word_3A`:
/// - `Pos(i)`: positive crossing σ_i
/// - `Inv(i)`: negative crossing σ_i^{-1} = σ_i − h
/// - `Avg(i)`: averaged crossing σ_avg_i = (σ_i + σ_i^{-1})/2 = σ_i − h/2
///   (bar-invariant projection P_avg(σ_i))
#[derive(Clone, Copy, Debug)]
pub enum BraidLetter {
    Pos(usize),
    Inv(usize),
    Avg(usize),
}

impl HeckeElement {
    /// Identity element T_e ∈ H_n(q).
    pub fn identity(n: usize) -> Self {
        let mut terms = BTreeMap::new();
        terms.insert(perm_identity(n), LaurentQ::one());
        Self {
            n,
            terms,
            jet_log: Vec::new(),
            step_counter: 0,
        }
    }

    pub fn is_zero(&self) -> bool {
        self.terms.is_empty()
    }

    /// In-place add `c · other` to self.
    pub fn add_scaled(&mut self, scale: &LaurentQ, other: &Self) {
        for (perm, c) in &other.terms {
            let prod = scale.mul(c);
            if prod.is_zero() {
                continue;
            }
            let entry = self.terms.entry(perm.clone()).or_insert_with(LaurentQ::zero);
            entry.add_assign(&prod);
            if entry.is_zero() {
                self.terms.remove(perm);
            }
        }
    }

    /// Right multiply by T_i.  Tracks each term's reduction event.
    pub fn right_mul_t(&self, i: usize) -> Self {
        let mut out: BTreeMap<Vec<usize>, LaurentQ> = BTreeMap::new();
        let mut jet_log = self.jet_log.clone();
        let mut step_counter = self.step_counter;
        let h = LaurentQ::h_param();

        for (w, c) in &self.terms {
            step_counter += 1;
            let wsi = perm_apply_s(w, i);
            let l_w = coxeter_length(w);
            let l_wsi = coxeter_length(&wsi);

            let event;
            if l_wsi > l_w {
                // Ascending: T_w · T_i = T_{ws_i}
                let entry = out.entry(wsi.clone()).or_insert_with(LaurentQ::zero);
                entry.add_assign(c);
                if entry.is_zero() {
                    out.remove(&wsi);
                }
                event = cert::JetEvent {
                    step: step_counter,
                    multiplier: i as i32,
                    predecessor: w.clone(),
                    successor: wsi.clone(),
                    filtration_before: l_w,
                    filtration_after: l_wsi,
                    relation: "ascending".to_string(),
                    coefficient_change: c.to_sympy_str(),
                };
            } else {
                // Descending: T_w · T_i = h T_w + T_{ws_i}
                let h_c = h.mul(c);
                {
                    let entry = out.entry(w.clone()).or_insert_with(LaurentQ::zero);
                    entry.add_assign(&h_c);
                    if entry.is_zero() {
                        out.remove(w);
                    }
                }
                {
                    let entry = out.entry(wsi.clone()).or_insert_with(LaurentQ::zero);
                    entry.add_assign(c);
                    if entry.is_zero() {
                        out.remove(&wsi);
                    }
                }
                event = cert::JetEvent {
                    step: step_counter,
                    multiplier: i as i32,
                    predecessor: w.clone(),
                    successor: wsi.clone(),
                    filtration_before: l_w,
                    filtration_after: l_wsi,
                    relation: "hecke-quadratic".to_string(),
                    coefficient_change: format!(
                        "+= {} * (h * T_{:?} + T_{:?})",
                        c.to_sympy_str(),
                        w,
                        wsi
                    ),
                };
            }
            jet_log.push(event);
        }

        // Strip zero coefficients (already done above on entry/insert).
        Self {
            n: self.n,
            terms: out,
            jet_log,
            step_counter,
        }
    }

    /// Right multiply by T_i^{-1} = T_i − h.
    pub fn right_mul_t_inv(&self, i: usize) -> Self {
        let e_ti = self.right_mul_t(i);
        let neg_h = LaurentQ::h_param().neg();
        let mut e_minus_h = self.clone();
        // Multiply each coefficient by -h
        let mut new_terms: BTreeMap<Vec<usize>, LaurentQ> = BTreeMap::new();
        for (perm, c) in &e_minus_h.terms {
            let prod = neg_h.mul(c);
            if !prod.is_zero() {
                new_terms.insert(perm.clone(), prod);
            }
        }
        e_minus_h.terms = new_terms;
        // Sum: e_ti + e_minus_h
        let mut out = e_ti;
        let one = LaurentQ::one();
        out.add_scaled(&one, &e_minus_h);
        out
    }

    /// Right multiply by the averaged crossing
    /// `σ_avg = (σ_i + σ_i^{-1})/2 = σ_i − h/2`.
    ///
    /// The averaged crossing is the bar-invariant projection
    /// `P_avg(σ_i)`. It appears in the canonical atomic-braid recipe
    /// `atom_braid_word_3A(Z, N)` for the QOU mass-formula at
    /// `n_0 = 3·A`, where each nucleon's intra-G0 / intra-G1 pattern
    /// includes σ_avg crossings at specific positions (see
    /// `folio-assistant/computations/mass_at_3A_proper.py:_PROTON_G0`).
    ///
    /// Without this method, the Rust SDP solver couldn't represent
    /// the canonical ⁴He braid (9 of its 47 crossings are σ_avg);
    /// this opens R5-full certification at H_12.
    pub fn right_mul_t_avg(&self, i: usize) -> Self {
        // x · σ_avg = x · σ_i − (h/2) · x
        let e_ti = self.right_mul_t(i);
        let half = LaurentQ::monomial(
            BigRational::new(1.into(), 2.into()),
            0,
        );
        let neg_h_half = LaurentQ::h_param().neg().mul(&half);
        let mut out = e_ti;
        out.add_scaled(&neg_h_half, self);
        out
    }

    /// Reduce a symbolic braid letter sequence supporting σ_i, σ_i^{-1},
    /// AND the averaged crossing σ_avg = (σ_i + σ_i^{-1})/2 = σ_i − h/2.
    ///
    /// This is the canonical 3-letter alphabet of `atom_braid_word_3A`
    /// (intra-nucleon G0/G1 patterns); the σ_avg letters carry the
    /// bar-invariant content essential for ⁴He's R5-full SDP certificate
    /// at H_12 (9 of 47 crossings in the canonical ⁴He braid).
    pub fn reduce_braid_letters(n: usize, word: &[BraidLetter]) -> Self {
        let mut e = Self::identity(n);
        for &letter in word {
            e = match letter {
                BraidLetter::Pos(i) => e.right_mul_t(i),
                BraidLetter::Inv(i) => e.right_mul_t_inv(i),
                BraidLetter::Avg(i) => e.right_mul_t_avg(i),
            };
        }
        e
    }

    /// Reduce a braid word [i_1, i_2, ...]: positive = T_i, negative = T_i^{-1}.
    pub fn reduce_braid(n: usize, word: &[i32]) -> Self {
        let mut e = Self::identity(n);
        for &i in word {
            if i > 0 {
                e = e.right_mul_t(i as usize);
            } else if i < 0 {
                e = e.right_mul_t_inv((-i) as usize);
            }
        }
        e
    }

    /// Build the filtration certificate.
    pub fn filtration_certificate(&self) -> cert::FiltrationCertificate {
        let mut by_grade: BTreeMap<u32, Vec<cert::FiltrationTerm>> = BTreeMap::new();
        for (w, c) in &self.terms {
            let grade = coxeter_length(w);
            let term = cert::FiltrationTerm {
                perm: w.clone(),
                canonical_word: perm_to_canonical_word(w),
                coefficient_in_q: c.to_sympy_str(),
            };
            by_grade.entry(grade).or_default().push(term);
        }
        let shape: BTreeMap<u32, usize> =
            by_grade.iter().map(|(&g, v)| (g, v.len())).collect();
        let max_grade = by_grade.keys().max().copied().unwrap_or(0);
        cert::FiltrationCertificate {
            by_grade,
            shape,
            max_grade,
        }
    }
}

// ───────────────────────────────────────────────────────────────────
// Tests against the Python proof-of-concept ground truth.
// ───────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_perm_apply_s() {
        // s_1 on identity [1,2,3] → [2,1,3]
        let id = vec![1, 2, 3];
        assert_eq!(perm_apply_s(&id, 1), vec![2, 1, 3]);
        // s_2 on [2,1,3] → [2,3,1]
        let p = vec![2, 1, 3];
        assert_eq!(perm_apply_s(&p, 2), vec![2, 3, 1]);
    }

    #[test]
    fn test_coxeter_length() {
        assert_eq!(coxeter_length(&[1, 2, 3]), 0);
        assert_eq!(coxeter_length(&[2, 1, 3]), 1);
        assert_eq!(coxeter_length(&[3, 2, 1]), 3);
    }

    #[test]
    fn test_canonical_word_longest_S3() {
        // [3,2,1] = w_0 ∈ S_3, reduced word σ_1 σ_2 σ_1 (or σ_2 σ_1 σ_2)
        let w0 = vec![3, 2, 1];
        let word = perm_to_canonical_word(&w0);
        assert_eq!(word.len(), 3);
        // Verify it's actually a reduced word.
        let mut p = vec![1, 2, 3];
        for &g in &word {
            p = perm_apply_s(&p, g as usize);
        }
        assert_eq!(p, w0);
    }

    #[test]
    fn test_electron_sigma1_cubed_in_h2() {
        // σ_1^3 in H_2: matches Python PoC ground truth.
        // Filtration: {grade 0: q-1/q, grade 1: q^2 - 1 + q^-2}.
        let e = HeckeElement::reduce_braid(2, &[1, 1, 1]);
        let cert = e.filtration_certificate();
        assert_eq!(cert.shape.get(&0), Some(&1));
        assert_eq!(cert.shape.get(&1), Some(&1));
        assert_eq!(cert.max_grade, 1);
    }

    #[test]
    fn test_proton_borromean_in_h3() {
        // (σ_1 σ_2^{-1})^3 in H_3: Python PoC says
        //   filtration shape {0: 1, 1: 2, 2: 2}
        //   16 jet steps, 6 Hecke firings.
        let e = HeckeElement::reduce_braid(3, &[1, -2, 1, -2, 1, -2]);
        let cert = e.filtration_certificate();
        assert_eq!(cert.shape.get(&0), Some(&1));
        assert_eq!(cert.shape.get(&1), Some(&2));
        assert_eq!(cert.shape.get(&2), Some(&2));
        assert_eq!(e.jet_log.len(), 16);
        let n_hecke = e
            .jet_log
            .iter()
            .filter(|ev| ev.relation == "hecke-quadratic")
            .count();
        assert_eq!(n_hecke, 6);
    }

    #[test]
    fn test_pure_ascending_in_h3() {
        // σ_1 σ_2 σ_1 = w_0: pure ascending → single grade-3 term.
        let e = HeckeElement::reduce_braid(3, &[1, 2, 1]);
        let cert = e.filtration_certificate();
        assert_eq!(cert.shape, [(3, 1)].into_iter().collect());
        assert_eq!(e.jet_log.len(), 3);
    }
}
