//! Rule-loop reducer for `LaurentHeckeElement` — port of
//! `reduce_laurent_rules`
//! (`folio-assistant/computations/hecke_laurent_fast.py:119`).
//!
//! Applies three rewriting rules to fixpoint:
//!
//! - **R1 (Hecke quadratic)**:
//!   `σ_i² → h·σ_i + 1`,  with `h = q − q⁻¹`.
//!   Splits one term into two.
//!
//! - **R2 (far-comm)**:
//!   `σ_i σ_j → σ_j σ_i`  when `|i − j| ≥ 2` and `i > j`
//!   (canonicalise to ascending-where-far-apart order).
//!   Plus the "formal variable" rule: a negative-index generator
//!   `j < 0` bubbles left past any non-negative `i ≥ 0` it follows.
//!
//! - **R3 (Yang-Baxter braid)**:
//!   `σ_i σ_{i±1} σ_i → σ_{i±1} σ_i σ_{i±1}`,
//!   applied only when the new triple is lex-smaller than the old
//!   (this guard guarantees fixpoint termination).
//!
//! R4 (quotient ideal / whole-atom folding) is intentionally **not**
//! implemented — see `hecke_laurent_fast.py:230-246` for the reason:
//! at LaurentQ-arithmetic speeds, the unfolded reduce is fast enough
//! and the R4-via-sympy round-trip was empirically 0.36-0.80× slower
//! than the unfolded path on every atom up to ⁴He.  Revisit only if
//! Tier 1.A benches show the rule loop is no longer the bottleneck.
//!
//! Per CLAUDE.md §Precision goals L1 (50-dps compute floor): every
//! coefficient is exact `BigRational` throughout the reduce loop.

use crate::laurent_hecke_element::LaurentHeckeElement;
use crate::laurent_rational_q::LaurentRationalQ;
use rustc_hash::FxHashMap;
use std::collections::BTreeMap;

// `hecke_h` is no longer constructed per R1 fire — the
// `LaurentRationalQ::add_h_times` fast path bypasses the `coeff * h`
// allocation entirely, doing the shift-and-sign-flip in place.
// Kept commented for reference: prior implementation built
// `let hecke_h = LaurentRationalQ::hecke_h();` once per reduce call
// and threaded it through R1.
//
// Inner-loop storage: `FxHashMap<Vec<i32>, LaurentRationalQ>` for
// the per-pass `new_terms` builder.  `BTreeMap` has O(log n)
// insertion (Vec<i32> key compare per node); `FxHashMap` (a fast
// non-cryptographic hash from rustc-hash) gives O(1) expected.
// Output is converted back to `BTreeMap` at the function boundary
// so `LaurentHeckeElement.terms` retains its deterministic
// iteration order for FFI and equality tests.

/// Reduce `elem` to fixpoint under R1 / R2 / R3.
///
/// Returns `(reduced, iteration_count)`.  `iteration_count` is the
/// number of outer fixpoint passes; `max_iterations` is the safety
/// cap (well above typical atomic-braid usage — empirically the
/// fast path terminates in < 50 iterations even for ⁵Li).
pub fn reduce_laurent_rules(
    elem: &LaurentHeckeElement,
    max_iterations: u32,
) -> (LaurentHeckeElement, u32) {
    // Copy the input BTreeMap into a FxHashMap for fast inner-loop
    // access.  Convert back to BTreeMap at the function boundary.
    //
    // GCD-deferral *hypothesis*: per-add BigRational normalisation
    // would be a meaningful fraction of inner-loop wall on ⁶Li,
    // recoverable by using *_unreduced ops during the pass and
    // `reduce_in_place` once per coef at end-of-pass.
    //
    // Bench result (commit b8dfee21, audit doc
    // `2026-05-22-rust-laurent-q-reduce-results.md`): flat /
    // slightly negative on ⁶Li (79.85 s vs 79.17 s baseline).
    // Denominator growth in unreduced intermediates offsets the
    // saved GCD work.  The *_unreduced path is kept for the
    // smaller-atom win (⁵Li: 7.31 → 6.74 s, -8%) and as
    // scaffolding for future BigInt-arena optimisation.
    // Per CLAUDE.md §Precision goals L1, correctness is preserved
    // bit-for-bit (1e-49 cross-check vs Python LaurentQ).
    let mut terms: FxHashMap<Vec<i32>, LaurentRationalQ> = elem
        .terms
        .iter()
        .map(|(k, v)| (k.clone(), v.clone()))
        .collect();
    let mut iteration: u32 = 0;
    let mut changed = true;
    while changed && iteration < max_iterations {
        changed = false;
        let mut new_terms: FxHashMap<Vec<i32>, LaurentRationalQ> = FxHashMap::default();

        for (word, coeff) in &terms {
            if coeff.is_zero() {
                continue;
            }

            // ── R1: Hecke σ_i² → h · σ_i + 1 ───────────────────────
            if let Some(pos) = find_r1_pattern(word) {
                let i = word[pos];
                let prefix = &word[..pos];
                let suffix = &word[pos + 2..];

                let mut w1: Vec<i32> = Vec::with_capacity(prefix.len() + 1 + suffix.len());
                w1.extend_from_slice(prefix);
                w1.push(i);
                w1.extend_from_slice(suffix);

                let mut w2: Vec<i32> = Vec::with_capacity(prefix.len() + suffix.len());
                w2.extend_from_slice(prefix);
                w2.extend_from_slice(suffix);

                // R1 hot-path: write coeff·h directly into new_terms[w1]
                // via LaurentRationalQ::add_h_times_unreduced — avoids
                // the fresh `coeff * &hecke_h` LRQ allocation, the two
                // BigRational multiplications per q-coefficient, AND
                // the GCD that `+=` would run on every constituent
                // add.  Final canonicalisation happens at end-of-pass.
                {
                    let entry = new_terms
                        .entry(w1)
                        .or_insert_with(LaurentRationalQ::zero);
                    entry.add_h_times_unreduced(coeff);
                }
                add_to(&mut new_terms, w2, coeff);
                changed = true;
                continue;
            }

            // ── R2: far-comm + formal-variable bubble ──────────────
            if let Some(pos) = find_r2_pattern(word) {
                let ig = word[pos];
                let jg = word[pos + 1];
                let mut nw: Vec<i32> = Vec::with_capacity(word.len());
                nw.extend_from_slice(&word[..pos]);
                nw.push(jg);
                nw.push(ig);
                nw.extend_from_slice(&word[pos + 2..]);
                add_to(&mut new_terms, nw, coeff);
                changed = true;
                continue;
            }

            // ── R3: Yang-Baxter braid (lex-guard) ──────────────────
            if let Some(pos) = find_r3_pattern(word) {
                let a = word[pos];
                let b = word[pos + 1];
                let mut nw: Vec<i32> = Vec::with_capacity(word.len());
                nw.extend_from_slice(&word[..pos]);
                nw.push(b);
                nw.push(a);
                nw.push(b);
                nw.extend_from_slice(&word[pos + 3..]);
                add_to(&mut new_terms, nw, coeff);
                changed = true;
                continue;
            }

            // No rule fired — passthrough.
            add_to(&mut new_terms, word.clone(), coeff);
        }

        // End-of-pass: canonicalise (a single GCD reduce per
        // coefficient, amortising over all the unreduced adds that
        // happened during the pass) then strip any newly-zero
        // entries (multiple contributions that summed to zero).
        for v in new_terms.values_mut() {
            v.reduce_in_place();
        }
        new_terms.retain(|_, v| !v.is_zero());

        terms = new_terms;
        iteration += 1;
    }

    // Convert FxHashMap → BTreeMap so the returned LaurentHeckeElement
    // has deterministic key order (for FFI and equality tests).
    let terms_btree: BTreeMap<Vec<i32>, LaurentRationalQ> =
        terms.into_iter().collect();
    (LaurentHeckeElement { terms: terms_btree }, iteration)
}

/// `new_terms[key] += coef` via the GCD-deferred unreduced add.
/// End-of-pass `reduce_in_place` canonicalises the accumulator.
///
/// Takes `coef` by reference to avoid the per-call clone that the
/// previous by-value signature required.
#[inline]
fn add_to(
    new_terms: &mut FxHashMap<Vec<i32>, LaurentRationalQ>,
    key: Vec<i32>,
    coef: &LaurentRationalQ,
) {
    let entry = new_terms.entry(key).or_insert_with(LaurentRationalQ::zero);
    entry.add_assign_unreduced(coef);
}

/// Incremental reduce — **resume-from-state variant**.
///
/// Takes a pre-reduced [`LaurentHeckeElement`] as the starting
/// accumulator, applies the crossings in `suffix` one at a time
/// (multiply by `crossing_factor` + reduce), and returns the
/// final reduced element.
///
/// Used by the prefix-cache infra: when computing
/// `tr_M(β_{Z',N'})` for an atomic braid whose signed word starts
/// with `β_{Z,N}`'s signed word (e.g., 5Li ⊂ 6Li), the cached
/// reduced state for 5Li is loaded, and only the SUFFIX (the
/// extra crossings) needs to be reduced.  This collapses the
/// exponential reduce-work growth that dominates ⁵Li → ⁶Li
/// → ⁷Li → ... compute chains (verified by the prefix-structure
/// check in `markov_peel_rust_bridge`).
pub fn incremental_reduce_from_state(
    initial_state: LaurentHeckeElement,
    suffix: &[(i8, i32)],
    max_iterations_per_step: u32,
) -> LaurentHeckeElement {
    let mut elem = initial_state;
    for &(sign, gen) in suffix {
        let factor = LaurentHeckeElement::crossing_factor(gen, sign);
        elem = &elem * &factor;
        let (reduced, _) = reduce_laurent_rules(&elem, max_iterations_per_step);
        elem = reduced;
    }
    elem
}

/// Incremental reduce — mirror of `incremental_reduced_element_fast`
/// from `folio-assistant/computations/hecke_laurent_fast.py:219`.
///
/// Multiplies factors one at a time (via [`LaurentHeckeElement::Mul`])
/// and reduces after each step (via [`reduce_laurent_rules`]).
/// Returns the final reduced [`LaurentHeckeElement`].
///
/// `signed_word`: list of `(sign, gen_0based)` pairs.  Each pair
/// constructs a [`LaurentHeckeElement::crossing_factor`] which is
/// then multiplied into the accumulating element.
///
/// `max_iterations_per_step`: passed straight through to
/// [`reduce_laurent_rules`] for the per-step fixpoint loop.  The
/// Python default is `5000`; production calls pass `10000`.
pub fn incremental_reduce(
    signed_word: &[(i8, i32)],
    max_iterations_per_step: u32,
) -> LaurentHeckeElement {
    let mut elem = LaurentHeckeElement::identity();
    for &(sign, gen) in signed_word {
        let factor = LaurentHeckeElement::crossing_factor(gen, sign);
        elem = &elem * &factor;
        let (reduced, _) = reduce_laurent_rules(&elem, max_iterations_per_step);
        elem = reduced;
    }
    elem
}

/// R1 finder: first position `pos` with `word[pos] == word[pos+1] >= 0`.
/// Returns `None` if no σ² pattern is present.
#[inline]
fn find_r1_pattern(word: &[i32]) -> Option<usize> {
    if word.len() < 2 {
        return None;
    }
    for pos in 0..(word.len() - 1) {
        if word[pos] == word[pos + 1] && word[pos] >= 0 {
            return Some(pos);
        }
    }
    None
}

/// R2 finder: first position `pos` where adjacent generators should
/// be swapped — either a non-negative gen followed by a formal
/// variable (`< 0`), or `i > j` with `|i - j| >= 2` (both ≥ 0).
#[inline]
fn find_r2_pattern(word: &[i32]) -> Option<usize> {
    if word.len() < 2 {
        return None;
    }
    for pos in 0..(word.len() - 1) {
        let ig = word[pos];
        let jg = word[pos + 1];
        let formal_bubble = ig >= 0 && jg < 0;
        let far_comm = ig >= 0 && jg >= 0 && (ig - jg).abs() >= 2 && ig > jg;
        if formal_bubble || far_comm {
            return Some(pos);
        }
    }
    None
}

/// R3 finder: first position `pos` with `word[pos..pos+3] = (a, b, a)`
/// where `a, b >= 0`, `|a - b| == 1`, and the lex-canonical rewrite
/// `(b, a, b) < (a, b, a)` is strictly smaller.
#[inline]
fn find_r3_pattern(word: &[i32]) -> Option<usize> {
    if word.len() < 3 {
        return None;
    }
    for pos in 0..(word.len() - 2) {
        let a = word[pos];
        let b = word[pos + 1];
        let c = word[pos + 2];
        if a == c && a >= 0 && b >= 0 && (a - b).abs() == 1 {
            // Lex-smaller guard: only rewrite if new triple sorts
            // strictly before the old.  Together with R1's word-
            // length strict-decrease, this guarantees fixpoint
            // termination.
            let new_trip = [b, a, b];
            let old_trip = [a, b, a];
            if new_trip < old_trip {
                return Some(pos);
            }
        }
    }
    None
}

// ── Tests ─────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use num_bigint::BigInt;
    use num_rational::BigRational;

    fn one() -> LaurentRationalQ {
        LaurentRationalQ::one()
    }

    #[test]
    fn empty_word_passthrough() {
        let id = LaurentHeckeElement::identity();
        let (reduced, iters) = reduce_laurent_rules(&id, 100);
        assert_eq!(reduced, id);
        // No rule fires → exit after one no-op pass.
        assert!(iters <= 2);
    }

    #[test]
    fn r1_sigma_squared_at_zero() {
        // σ_0² → h·σ_0 + 1
        let elem = LaurentHeckeElement::from_term(vec![0, 0], one());
        let (reduced, _) = reduce_laurent_rules(&elem, 100);
        // Expect two terms: word [0] with coef h, and word [] with coef 1.
        assert_eq!(reduced.n_terms(), 2);
        let h = LaurentRationalQ::hecke_h();
        let empty: Vec<i32> = Vec::new();
        assert_eq!(reduced.terms[&vec![0]], h);
        assert_eq!(reduced.terms[&empty], one());
    }

    #[test]
    fn r1_with_prefix_and_suffix() {
        // σ_1 · σ_0² · σ_2 → σ_1 · (h·σ_0 + 1) · σ_2
        //                  → h · σ_1 σ_0 σ_2 + σ_1 σ_2
        // The reduce loop is rule-by-rule so we don't pre-commute;
        // we only verify the immediate post-R1 shape.  After one
        // R1 pass: words {[1,0,2], [1,2]} with coefs {h, 1}.
        // BUT: R2 may also fire on subsequent iterations to swap
        // (1, 0) → (0, 1) and to swap (1, 2) ... actually
        // (1, 0): ig=1, jg=0, |i-j|=1 — NOT far-comm.  No swap.
        // So after the full fixpoint we still have {[1,0,2], [1,2]}.
        // BUT then R3 may apply to [1, 0, 2]:  a=1, b=0, c=2 — no,
        // a != c.  So no R3.  Final terms: {[1,0,2]: h, [1,2]: 1}.
        let elem = LaurentHeckeElement::from_term(vec![1, 0, 0, 2], one());
        let (reduced, _) = reduce_laurent_rules(&elem, 100);
        let h = LaurentRationalQ::hecke_h();
        assert_eq!(reduced.terms[&vec![1, 0, 2]], h);
        assert_eq!(reduced.terms[&vec![1, 2]], one());
        assert_eq!(reduced.n_terms(), 2);
    }

    #[test]
    fn r2_far_comm_swaps_descending() {
        // σ_2 · σ_0 → σ_0 · σ_2  (|2-0| = 2, 2 > 0)
        let elem = LaurentHeckeElement::from_term(vec![2, 0], one());
        let (reduced, _) = reduce_laurent_rules(&elem, 100);
        assert_eq!(reduced.n_terms(), 1);
        assert_eq!(reduced.terms[&vec![0, 2]], one());
    }

    #[test]
    fn r2_does_not_swap_adjacent_generators() {
        // σ_1 · σ_0:  |i-j| = 1, NOT far-comm.  No rewrite.
        let elem = LaurentHeckeElement::from_term(vec![1, 0], one());
        let (reduced, _) = reduce_laurent_rules(&elem, 100);
        assert_eq!(reduced.terms[&vec![1, 0]], one());
    }

    #[test]
    fn r2_formal_variable_bubbles_left() {
        // σ_3 · (formal -1)  →  (formal -1) · σ_3
        let elem = LaurentHeckeElement::from_term(vec![3, -1], one());
        let (reduced, _) = reduce_laurent_rules(&elem, 100);
        assert_eq!(reduced.n_terms(), 1);
        assert_eq!(reduced.terms[&vec![-1, 3]], one());
    }

    #[test]
    fn r3_canonicalises_braid_to_lex_smallest() {
        // σ_1 σ_0 σ_1 — old triple (1, 0, 1), new triple (0, 1, 0).
        // (0, 1, 0) < (1, 0, 1) — rewrite fires.
        let elem = LaurentHeckeElement::from_term(vec![1, 0, 1], one());
        let (reduced, _) = reduce_laurent_rules(&elem, 100);
        assert_eq!(reduced.n_terms(), 1);
        assert_eq!(reduced.terms[&vec![0, 1, 0]], one());
    }

    #[test]
    fn r3_does_not_rewrite_already_canonical_braid() {
        // σ_0 σ_1 σ_0 — old (0, 1, 0), new (1, 0, 1).
        // (1, 0, 1) > (0, 1, 0) — rewrite suppressed by lex guard.
        let elem = LaurentHeckeElement::from_term(vec![0, 1, 0], one());
        let (reduced, _) = reduce_laurent_rules(&elem, 100);
        assert_eq!(reduced.n_terms(), 1);
        assert_eq!(reduced.terms[&vec![0, 1, 0]], one());
    }

    #[test]
    fn r1_after_r3_chain() {
        // σ_1 σ_0 σ_1 σ_1 σ_0 σ_1
        // R3 may apply to either braid-triple; R1 to the σ_1²
        // pattern in the middle.  The reduce loop should converge.
        // Just check it doesn't loop forever and stays canonical.
        let elem = LaurentHeckeElement::from_term(
            vec![1, 0, 1, 1, 0, 1],
            one(),
        );
        let (reduced, iters) = reduce_laurent_rules(&elem, 1000);
        assert!(iters < 1000, "should converge in well under 1000 iters");
        // No element of `reduced` may still contain a σ_i² pattern
        // (R1 not at fixpoint) or a swappable far-comm pair (R2).
        for word in reduced.terms.keys() {
            assert!(find_r1_pattern(word).is_none(),
                    "R1 not at fixpoint: word {:?}", word);
            assert!(find_r2_pattern(word).is_none(),
                    "R2 not at fixpoint: word {:?}", word);
            assert!(find_r3_pattern(word).is_none(),
                    "R3 not at fixpoint: word {:?}", word);
        }
    }

    #[test]
    fn coefficient_rational_propagates_through_r1() {
        // (1/2) · σ_0² → (h/2) σ_0 + (1/2)
        let half = LaurentRationalQ::from_rational(BigRational::new(
            BigInt::from(1),
            BigInt::from(2),
        ));
        let elem = LaurentHeckeElement::from_term(vec![0, 0], half.clone());
        let (reduced, _) = reduce_laurent_rules(&elem, 100);
        assert_eq!(reduced.n_terms(), 2);
        // h/2 has coefficients ±1/2 at q^±1.
        let h_over_2 = {
            let mut h = LaurentRationalQ::hecke_h();
            h.scalar_mul_assign(&BigRational::new(BigInt::from(1), BigInt::from(2)));
            h
        };
        assert_eq!(reduced.terms[&vec![0]], h_over_2);
        let empty: Vec<i32> = Vec::new();
        assert_eq!(reduced.terms[&empty], half);
    }

    #[test]
    fn zero_coefficient_does_not_appear_in_output() {
        // (σ_0 + σ_1) - σ_0 should reduce to σ_1 with no leftover [0] term.
        let one_lq = one();
        let elem = LaurentHeckeElement::from_terms(vec![
            (vec![0], one_lq.clone()),
            (vec![1], one_lq.clone()),
            (vec![0], -one_lq.clone()),
        ]);
        let (reduced, _) = reduce_laurent_rules(&elem, 100);
        assert_eq!(reduced.n_terms(), 1);
        assert!(reduced.terms.contains_key(&vec![1]));
        assert!(!reduced.terms.contains_key(&vec![0]));
    }

    #[test]
    fn incremental_reduce_proton_like_pair() {
        // A two-crossing braid: σ_0 then σ_0 (two positive crossings
        // at the same generator).  Should reduce to the same
        // h·σ_0 + 1 form as σ_0² directly.
        let signed_word = vec![(1i8, 0i32), (1i8, 0i32)];
        let reduced = incremental_reduce(&signed_word, 10000);
        assert_eq!(reduced.n_terms(), 2);
        let h = LaurentRationalQ::hecke_h();
        let empty: Vec<i32> = Vec::new();
        assert_eq!(reduced.terms[&vec![0]], h);
        assert_eq!(reduced.terms[&empty], one());
    }

    #[test]
    fn incremental_reduce_averaged_squared() {
        // ((σ_0 − h/2) · (σ_0 − h/2))
        // = σ_0² − h σ_0 + h²/4
        // After R1 on σ_0²: (h σ_0 + 1) − h σ_0 + h²/4
        // = 1 + h²/4
        // h² = q² − 2 + q⁻², so h²/4 = q²/4 − 1/2 + q⁻²/4.
        // Total: 1/2 + q²/4 + q⁻²/4 on the constant word [].
        let signed_word = vec![(0i8, 0i32), (0i8, 0i32)];
        let reduced = incremental_reduce(&signed_word, 10000);
        assert_eq!(reduced.n_terms(), 1, "expected only the constant word, got {:?}", reduced.terms.keys().collect::<Vec<_>>());
        let empty: Vec<i32> = Vec::new();
        // Expected: q²/4 + 1/2 + q⁻²/4
        let expected = LaurentRationalQ::from_terms(vec![
            (2, BigRational::new(BigInt::from(1), BigInt::from(4))),
            (0, BigRational::new(BigInt::from(1), BigInt::from(2))),
            (-2, BigRational::new(BigInt::from(1), BigInt::from(4))),
        ]);
        assert_eq!(reduced.terms[&empty], expected,
                   "got {}", reduced.terms[&empty].pretty());
    }

    /// End-to-end smoke: a small atomic-like word reduces to a
    /// stable canonical form with rational coefficients.  This
    /// tests R1 + R3 + coefficient bookkeeping in concert.
    #[test]
    fn small_combined_smoke() {
        // (σ_0 − h/2) · σ_0 = σ_0² − (h/2) σ_0
        //                   = (h σ_0 + 1) − (h/2) σ_0     [after R1]
        //                   = (h − h/2) σ_0 + 1
        //                   = (h/2) σ_0 + 1
        let factor = LaurentHeckeElement::crossing_factor(0, 0); // σ_0 − h/2
        let sigma0 = LaurentHeckeElement::from_term(vec![0], one());
        let product = factor * sigma0;
        let (reduced, _) = reduce_laurent_rules(&product, 100);
        assert_eq!(reduced.n_terms(), 2);
        let h_over_2 = {
            let mut h = LaurentRationalQ::hecke_h();
            h.scalar_mul_assign(&BigRational::new(BigInt::from(1), BigInt::from(2)));
            h
        };
        assert_eq!(reduced.terms[&vec![0]], h_over_2);
        let empty: Vec<i32> = Vec::new();
        assert_eq!(reduced.terms[&empty], one());
    }
}
