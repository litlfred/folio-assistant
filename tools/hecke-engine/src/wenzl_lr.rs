//! Wenzl Littlewood–Richardson character factorization.
//!
//! Computes Hecke characters `χ^λ(β_1 ⊗ β_2 ⊗ ... ⊗ β_k)` of tensor-
//! product braids via the LR decomposition
//!
//!   χ^λ(β_1 ⊗ β_2) = Σ_{μ, ν} c^λ_{μν} · χ^μ(β_1) · χ^ν(β_2)
//!
//! where `c^λ_{μν}` is the Littlewood–Richardson coefficient (see
//! `littlewood_richardson::lr_coefficient`).
//!
//! This is the **Wenzl bridge**: it avoids computing `χ^λ` at the
//! full strand count `n = n_1 + n_2`, where `dim_q(λ)` may exceed
//! 10⁴ for `n ≥ 12`.  Instead we cache `χ^μ(β_1)` at `n_1 strands`
//! and `χ^ν(β_2)` at `n_2 strands`, then combine via LR.  For ⁴He
//! at H_12, this reduces an intractable Hoefsmit evaluation
//! (p(12) = 77 partitions × dim 7700 × 47 crossings ≈ 10^13 ops)
//! to a sum over 11 × 7 = 77 sub-character pairs × LR cost.
//!
//! ## API
//!
//! - [`chi_via_lr_2way`] — 2-way factorization (β_1 ⊗ β_2).  This
//!   is the structural primitive.
//! - [`chi_via_lr_kway`] — recursive k-way factorization
//!   (β_1 ⊗ β_2 ⊗ ... ⊗ β_k), built by left-associative reduction
//!   `((β_1 ⊗ β_2) ⊗ β_3) ⊗ ...`.
//! - [`tr_m_via_lr`] — combine `χ_via_lr` with the Markov-trace
//!   weights `y_λ` to produce `|tr_M(β_1 ⊗ ... ⊗ β_k)|` at the
//!   substrate parameter.  This is the consumer-side entry point
//!   for atomic braid words such as `⁴He = p ⊗ p ⊗ n ⊗ n`.
//!
//! ## Parallelization
//!
//! [`chi_via_lr_2way`] uses `rayon::par_iter` over the outer
//! partition `λ ⊢ n_1 + n_2`.  Each `λ` contributes an independent
//! sum `Σ_{μ, ν} c^λ_{μν} · χ^μ · χ^ν`; no shared mutable state.
//! For ⁴He at H_12, rayon over `p(12) = 77` partitions saturates
//! ≥ 16 cores without contention.
//!
//! ## References
//!
//! - Wenzl 1988, "Hecke algebras of type A_n and subfactors",
//!   Invent. Math. 92, §3 (LR branching for `H_n ↪ H_{n_1} ⊗ H_{n_2}`).
//! - Macdonald 1995, "Symmetric Functions and Hall Polynomials",
//!   §I.9 (LR rule).
//! - QOU manuscript: `hecke-branching-trace-decomposition.md`
//!   (categorical Wenzl bridge), `docs/audits/2026-05-17-p4tt-migration-triage.md`
//!   (motivation: ⁴He at H_12 intractable for direct Hoefsmit).

use crate::laurent_poly_q::LaurentPolyQ;
use crate::littlewood_richardson::lr_coefficient;
use crate::seminormal::{chi_lambda_braid, partitions_of};
use crate::seminormal_mn::chi_lambda_braid_qdef;
use crate::seminormal_mpfr::chi_lambda_braid_mpfr;
use rayon::prelude::*;

/// Crossing type for a Hecke-algebra factor word.
///
/// The canonical atomic-braid decomposition
/// (`canonical_braid_crossings.atom_canonical_crossings`) produces
/// three crossing types: `Sigma` (positive), `SigmaInv` (negative),
/// and `Averaged` (half-sum `0.5·(σ + σ⁻¹)`, used on inter-nucleon
/// arcs in the canonical Z+N convention).
///
/// Wire encoding (binary CLI):
/// - `(+1, gen)` = `Sigma`
/// - `(-1, gen)` = `SigmaInv`
/// - `( 0, gen)` = `Averaged`
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Crossing {
    Sigma,
    SigmaInv,
    Averaged,
}

impl Crossing {
    /// Decode a wire-format `(sign, _)` into a `Crossing`.
    pub fn from_sign(sign: i32) -> Self {
        match sign {
            s if s > 0 => Crossing::Sigma,
            s if s < 0 => Crossing::SigmaInv,
            _ => Crossing::Averaged,
        }
    }
}

/// A single crossing in a factor word: `(crossing-type, gen_1based)`.
pub type CrossingPair = (Crossing, u32);

/// Tensor factor for a Wenzl decomposition: a braid word (with
/// `Crossing` types per generator) together with its strand count.
#[derive(Clone, Debug)]
pub struct WenzlFactor {
    /// Number of strands this factor lives on.
    pub n_strands: usize,
    /// Braid word `[(Crossing, generator_1based), ...]`.
    pub word: Vec<CrossingPair>,
    /// Optional human-readable label for diagnostics
    /// (e.g. `"proton"`, `"neutron"`).
    pub label: String,
}

/// Convert a factor word to a plain Hecke `[(sign, gen)]` word
/// assuming no `Averaged` crossings (panics otherwise).  Used for
/// the base case of `chi_factor` after averaging expansion.
fn to_plain_word(word: &[CrossingPair]) -> Vec<(i32, u32)> {
    word.iter()
        .map(|(c, g)| match c {
            Crossing::Sigma => (1i32, *g),
            Crossing::SigmaInv => (-1i32, *g),
            Crossing::Averaged => panic!(
                "to_plain_word: averaged crossing must be expanded \
                 by chi_factor before reaching the plain-word path"
            ),
        })
        .collect()
}

/// Evaluate `χ^λ(β)` for a factor whose word may include `Averaged`
/// crossings.  Expands each averaged crossing into the half-sum
/// `0.5·(σ + σ⁻¹)`, producing `2^k` sub-words (where `k` = number
/// of averaged crossings), evaluates `chi_lambda_braid_qdef` on each
/// sub-word, and averages with weight `1/2^k`.
///
/// At `k = 0` this is exactly `chi_lambda_braid_qdef`.
///
/// **Cost**: `O(2^k)` sub-evaluations.  In the QOU pipeline, per-
/// nucleon factors at H_3 have `k ∈ {2, 5, ...}`; for ⁴He at H_12
/// the per-factor `k = 2` (proton or neutron at H_3), so 4 sub-
/// evals per factor.  The full ⁴He LR factorisation involves
/// 4 nucleons × 4 sub-evals × 3 partitions of 3 + LR combine —
/// negligible vs the >30-min Hoefsmit at H_12.
pub fn chi_factor(lambda: &[usize], factor: &WenzlFactor) -> LaurentPolyQ {
    // Locate averaged-crossing positions.
    let avg_positions: Vec<usize> = factor
        .word
        .iter()
        .enumerate()
        .filter(|(_, (c, _))| *c == Crossing::Averaged)
        .map(|(i, _)| i)
        .collect();
    let k = avg_positions.len();
    if k == 0 {
        let plain = to_plain_word(&factor.word);
        return chi_lambda_braid_qdef(lambda, factor.n_strands, &plain);
    }
    if k > 20 {
        // 2^20 ≈ 10^6 sub-evaluations cap (same as
        // chi_lambda_braid_qdef's n_neg cap).  Avoid silent
        // intractability.
        panic!(
            "chi_factor: {} averaged crossings (> 20 cap = 2^20 ≈ \
             10^6 sub-words); factor `{}` exceeds the practical \
             expansion limit",
            k, factor.label
        );
    }
    // Enumerate the 2^k sub-words and sum their χ values.
    let total = 1usize << k;
    let chi_sum: LaurentPolyQ = (0..total)
        .into_par_iter()
        .map(|mask| {
            let mut sub_word = factor.word.clone();
            for (bit, &pos) in avg_positions.iter().enumerate() {
                let take_positive = (mask >> bit) & 1 == 0;
                sub_word[pos].0 = if take_positive {
                    Crossing::Sigma
                } else {
                    Crossing::SigmaInv
                };
            }
            let plain = to_plain_word(&sub_word);
            chi_lambda_braid_qdef(lambda, factor.n_strands, &plain)
        })
        .reduce(LaurentPolyQ::zero, |a, b| a + b);
    // Divide by 2^k.  Since LaurentPolyQ has integer coefficients
    // (BigInt), we represent the average as a polynomial scaled
    // by 2^k (i.e. omit the division): the LR composer sees the
    // unnormalised `Σ_{sub-words} χ^λ`.  To recover the genuine
    // averaged value, the caller must divide the final
    // `tr_M = Σ_λ y_λ · ∏ χ^{μ_i}(factor_i)` by `∏ 2^{k_i}`.
    //
    // Returning the unnormalised sum here keeps integer arithmetic
    // exact end-to-end; the normalisation factor is reported by
    // [`averaging_denominator`] for the caller to divide out at
    // the witness layer (where rational arithmetic is acceptable).
    chi_sum
}

/// **Canonical χ^λ for a single braid at H_n** (numerical q, f64).
///
/// Unlike [`chi_factor`] / [`chi_via_lr_kway`] — which compute
/// χ^λ for a *tensor-product* braid via LR decomposition — this
/// function computes χ^λ(β) directly for an arbitrary single
/// braid β ∈ H_n via the Hoefsmit seminormal evaluation
/// ([`seminormal::chi_lambda_braid`]), at numerical q.  The
/// `seminormal::chi_lambda_braid` path has no negative-generator
/// bailout (it works in f64 throughout), so it scales to atomic
/// braids at H_12 (⁴He) and beyond where the symbolic-q path
/// [`chi_lambda_braid_qdef`] would panic.
///
/// `word_with_averaged` is the canonical-decomposition wire
/// format: `[(Crossing, gen_1based), ...]`.  Averaged crossings
/// are expanded into 2^k pure-σ/σ⁻¹ sub-words via [`chi_factor`]'s
/// same recipe; per-sub-word f64 χ^λ values are summed (caller
/// divides by [`averaging_denominator`] to recover the averaged
/// value).
///
/// **Use case:** computing canonical |tr_M(β_atomic(Z, N))| at H_{3A}
/// without the broken tensor-product LR factorisation.  Combined
/// with `wedderburn_jones_markov.y_lambda_at(n, q_0)` in a
/// downstream Σ_λ y_λ · χ^λ combiner, this yields the canonical
/// Markov trace at the substrate parameter.
///
/// Reference: `docs/audits/2026-05-17-knot-fusion-step1-audit.md`
/// §"Gap to canonical |tr_M| at 1 ppb".
pub fn chi_lambda_canonical_h_n_f64(
    lambda: &[usize],
    n_strands: usize,
    word_with_averaged: &[CrossingPair],
    q: f64,
) -> f64 {
    // **Direct averaging path (2026-05-18, PR #682).** From the Hecke
    // relation `σ_g² = h · σ_g + I` with `h = q - q⁻¹`, the half-sum
    // `(σ_g + σ_g⁻¹)/2 = σ_g - h/2 · I` is a single matrix. Substitute
    // this directly into the seminormal matrix product instead of
    // enumerating `2^k` sub-words. For ⁴He (k ≈ 20), the speedup is
    // ~10⁶× (sub-millisecond instead of >10 minutes at MPFR-50dps).
    //
    // The 2^k expansion path below is retained as `_legacy_sub_word_expand`
    // for cross-validation testing only — `chi_lambda_braid` now handles
    // sign == 0 as the averaged dispatch.
    let _ = n_strands; // shape encodes n; kept for API parity
    let word_signed: Vec<(i32, u32)> = word_with_averaged
        .iter()
        .map(|&(c, g)| {
            let sign = match c {
                Crossing::Sigma => 1,
                Crossing::SigmaInv => -1,
                Crossing::Averaged => 0,
            };
            (sign, g)
        })
        .collect();
    chi_lambda_braid(lambda, &word_signed, q)
}

/// **MPFR variant of [`chi_lambda_canonical_h_n_f64`]** at arbitrary
/// precision (≥ 50 dps recommended).
///
/// Returns the **averaged** χ^λ value as a decimal string. Each averaged
/// crossing in the input is substituted directly as `σ - h/2 · I`
/// (equivalent to `(σ + σ⁻¹)/2` via the Hecke relation), so the
/// returned value is **already** the half-sum-averaged χ^λ — the
/// caller does NOT need to divide by `2^k` (the historical
/// `averaging_denominator`). The Rust binary `hecke-canonical-chi`
/// reflects this by reporting `averaging_denominator = "1"` to its
/// downstream Python consumer.
///
/// Pre-2026-05-18 docstring described the predecessor (deleted)
/// implementation which returned the UNNORMALISED 2^k sub-word sum and
/// required caller-side division by `averaging_denominator`; the
/// direct-averaging implementation (PR #682) replaced that path
/// because at ⁴He / H_12 the 2^k expansion took >10 min wall, vs ~tens
/// of ms with direct substitution.
///
/// The MPFR `rug::Float` is not `Send`/`Copy`-friendly for rayon
/// `reduce`, so we serialise the result via a decimal string. The
/// substrate parameter `q` is passed as a decimal string to preserve
/// arbitrary precision through the FFI; the caller substitutes the
/// canonical 50-dps `q_0` value from `q_parameter.Q_50_DIGIT_STR`.
///
/// Cost: O(dim² · word_len) at MPFR precision `dps` per partition.
pub fn chi_lambda_canonical_h_n_mpfr(
    lambda: &[usize],
    n_strands: usize,
    word_with_averaged: &[CrossingPair],
    q_str: &str,
    dps: u32,
) -> String {
    // **Direct averaging path (2026-05-18, PR #682).** See
    // `chi_lambda_canonical_h_n_f64` for the math derivation:
    // `(σ_g + σ_g⁻¹)/2 = σ_g - h/2 · I`, single matrix per averaged
    // crossing instead of `2^k` sub-words. For ⁴He at MPFR-50dps
    // (k ≈ 20), wall time drops from >10 min to ~tens of ms.
    let _ = n_strands;
    let word_signed: Vec<(i32, u32)> = word_with_averaged
        .iter()
        .map(|&(c, g)| {
            let sign = match c {
                Crossing::Sigma => 1,
                Crossing::SigmaInv => -1,
                Crossing::Averaged => 0,
            };
            (sign, g)
        })
        .collect();
    chi_lambda_braid_mpfr(lambda, &word_signed, q_str, dps)
}

/// All χ^λ values at H_n for λ ⊢ n, computed in parallel via
/// [`chi_lambda_canonical_h_n_mpfr`].  Returns decimal-string values
/// at `dps` precision.
pub fn chi_lambda_canonical_all_partitions_mpfr(
    n_strands: usize,
    word_with_averaged: &[CrossingPair],
    q_str: &str,
    dps: u32,
) -> Vec<(Vec<usize>, String)> {
    let parts = partitions_of(n_strands);
    parts
        .par_iter()
        .map(|lambda| {
            let chi = chi_lambda_canonical_h_n_mpfr(
                lambda, n_strands, word_with_averaged, q_str, dps,
            );
            (lambda.clone(), chi)
        })
        .collect()
}

/// All χ^λ values at H_n for λ ⊢ n, computed in parallel via
/// [`chi_lambda_canonical_h_n_f64`].
///
/// Returns `Vec<(partition, chi_value_unnormalised)>` where the
/// values are the UNNORMALISED 2^k sums (averaging_denominator
/// applied by caller).
pub fn chi_lambda_canonical_all_partitions_f64(
    n_strands: usize,
    word_with_averaged: &[CrossingPair],
    q: f64,
) -> Vec<(Vec<usize>, f64)> {
    let parts = partitions_of(n_strands);
    parts
        .par_iter()
        .map(|lambda| {
            let chi = chi_lambda_canonical_h_n_f64(
                lambda, n_strands, word_with_averaged, q,
            );
            (lambda.clone(), chi)
        })
        .collect()
}

/// Total averaging denominator for a list of factors: the product
/// of `2^{k_i}` where `k_i` is the number of `Averaged` crossings
/// in factor `i`.  The unnormalised `tr_M` returned by
/// [`tr_m_via_lr`] should be divided by this denominator to obtain
/// the genuine averaged Markov trace.
pub fn averaging_denominator(factors: &[WenzlFactor]) -> u128 {
    let mut d: u128 = 1;
    for f in factors {
        let k = f
            .word
            .iter()
            .filter(|(c, _)| *c == Crossing::Averaged)
            .count();
        d = d.checked_shl(k as u32).unwrap_or_else(|| {
            panic!(
                "averaging_denominator: total averaged-crossing \
                 count exceeds 127 (denominator would overflow u128)"
            )
        });
    }
    d
}

/// Two-way Wenzl LR character factorization (sorry-free,
/// q-deformed).
///
/// Returns `χ^λ(β_1 ⊗ β_2) = Σ_{μ ⊢ n_1, ν ⊢ n_2} c^λ_{μν} · χ^μ(β_1) · χ^ν(β_2)`
/// as a `LaurentPolyQ` in `q`.
///
/// Strand counts: `lambda` must have weight `n_1 + n_2` where
/// `n_1 = factor1.n_strands`, `n_2 = factor2.n_strands`.
///
/// **Parallelization**: each `(μ, ν)` pair is independent; we
/// par-iter over the outer product `μ × ν`.
pub fn chi_via_lr_2way(
    lambda: &[usize],
    factor1: &WenzlFactor,
    factor2: &WenzlFactor,
) -> LaurentPolyQ {
    let n_1 = factor1.n_strands;
    let n_2 = factor2.n_strands;
    let n_lambda: usize = lambda.iter().sum();
    if n_lambda != n_1 + n_2 {
        return LaurentPolyQ::zero();
    }
    let mus = partitions_of(n_1);
    let nus = partitions_of(n_2);
    // Build the (μ, ν) work list as a flat vector so rayon
    // par_iter chunks evenly.
    let pairs: Vec<(&Vec<usize>, &Vec<usize>)> =
        mus.iter().flat_map(|m| nus.iter().map(move |n| (m, n))).collect();
    pairs
        .par_iter()
        .map(|(mu, nu)| {
            let c = lr_coefficient(lambda, mu, nu);
            if c == 0 {
                return LaurentPolyQ::zero();
            }
            // chi_factor handles averaged-crossing expansion internally
            // (returning the unnormalised 2^k sum; caller divides by
            // averaging_denominator at the end).
            let chi_mu = chi_factor(mu, factor1);
            let chi_nu = chi_factor(nu, factor2);
            let mut term = chi_mu * chi_nu;
            term.scalar_mul_assign(c);
            term
        })
        .reduce(LaurentPolyQ::zero, |a, b| a + b)
}

/// k-way Wenzl LR character factorization.
///
/// Reduces `χ^λ(β_1 ⊗ β_2 ⊗ ... ⊗ β_k)` left-associatively:
///
///   χ^λ((β_1 ⊗ β_2) ⊗ β_3 ⊗ ... ⊗ β_k)
///     = Σ_{τ ⊢ n_1+n_2} c^λ_{τ τ'} · χ^τ(β_1 ⊗ β_2) · χ^{τ'}(β_3 ⊗ ... ⊗ β_k)
///
/// and recurses on the right-hand side until `k = 2`.  The cached
/// intermediate `χ^τ(β_1 ⊗ β_2)` values are reused across `λ`.
///
/// For `k = 1` returns `chi_lambda_braid_qdef(lambda, n_1, &factor1.word)`.
/// For `k = 0` returns the empty-character convention `δ_{λ, ()}`.
pub fn chi_via_lr_kway(lambda: &[usize], factors: &[WenzlFactor]) -> LaurentPolyQ {
    match factors.len() {
        0 => {
            if lambda.is_empty() {
                LaurentPolyQ::from_scalar(1)
            } else {
                LaurentPolyQ::zero()
            }
        }
        1 => chi_factor(lambda, &factors[0]),
        2 => chi_via_lr_2way(lambda, &factors[0], &factors[1]),
        _ => {
            // Recursive: split (factor_0 ⊗ factor_1) | rest.
            let head_n = factors[0].n_strands + factors[1].n_strands;
            let tail_n: usize =
                factors[2..].iter().map(|f| f.n_strands).sum();
            let n_lambda: usize = lambda.iter().sum();
            if n_lambda != head_n + tail_n {
                return LaurentPolyQ::zero();
            }
            // Build a "synthetic head factor" by computing its
            // character on the fly inside the LR sum below; cache
            // the χ^τ(head) and χ^τ'(tail) values per partition.
            let head_partitions = partitions_of(head_n);
            let tail_partitions = partitions_of(tail_n);
            // Pre-compute χ^τ(head) via 2-way LR for τ ⊢ head_n.
            let chi_head: Vec<(Vec<usize>, LaurentPolyQ)> = head_partitions
                .par_iter()
                .map(|tau| {
                    let val = chi_via_lr_2way(tau, &factors[0], &factors[1]);
                    (tau.clone(), val)
                })
                .collect();
            // Pre-compute χ^τ'(tail) recursively.
            let chi_tail: Vec<(Vec<usize>, LaurentPolyQ)> = tail_partitions
                .par_iter()
                .map(|tau_prime| {
                    let val = chi_via_lr_kway(tau_prime, &factors[2..]);
                    (tau_prime.clone(), val)
                })
                .collect();
            // Now combine: χ^λ(head ⊗ tail) =
            //   Σ_{τ, τ'} c^λ_{τ τ'} · χ^τ(head) · χ^τ'(tail).
            let pairs: Vec<(&Vec<usize>, &LaurentPolyQ, &Vec<usize>, &LaurentPolyQ)> =
                chi_head
                    .iter()
                    .flat_map(|(t, ct)| {
                        chi_tail
                            .iter()
                            .map(move |(tp, ctp)| (t, ct, tp, ctp))
                    })
                    .collect();
            pairs
                .par_iter()
                .map(|(tau, chi_tau, tau_prime, chi_tau_prime)| {
                    let c = lr_coefficient(lambda, tau, tau_prime);
                    if c == 0 {
                        return LaurentPolyQ::zero();
                    }
                    let mut term =
                        (*chi_tau).clone() * (*chi_tau_prime).clone();
                    term.scalar_mul_assign(c);
                    term
                })
                .reduce(LaurentPolyQ::zero, |a, b| a + b)
        }
    }
}

/// Wenzl-bridge Markov trace: combine `χ^λ` values via LR
/// decomposition with externally-supplied Markov weights `y_λ`.
///
/// The Markov trace at the substrate parameter satisfies
///
///   tr_M(β) = Σ_λ y_λ · χ^λ(β)
///
/// (cf. `wedderburn_jones_markov.y_lambda_at(...)` in the Python
/// pipeline).  This function evaluates the χ^λ values via LR
/// (cheap) and asks the caller for the `y_λ` numbers (specific to
/// the substrate parameter, computed once per substrate).
///
/// Returns `Σ_λ y_λ · χ^λ` as a `LaurentPolyQ` in `q`.  Caller
/// substitutes `q = q_0` to get the absolute value of the Markov
/// trace at the substrate.
pub fn tr_m_via_lr(
    factors: &[WenzlFactor],
    y_lambda: &[(Vec<usize>, LaurentPolyQ)],
) -> LaurentPolyQ {
    y_lambda
        .par_iter()
        .map(|(lambda, y)| {
            let chi = chi_via_lr_kway(lambda, factors);
            chi * y.clone()
        })
        .reduce(LaurentPolyQ::zero, |a, b| a + b)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn factor_2way_identity_at_h_2() {
        // Trivial case: β_1 = identity on 1 strand, β_2 = identity
        // on 1 strand.  Then λ = (2): χ^(2)(id ⊗ id) =
        //   c^(2)_{(1),(1)} · χ^(1)(id) · χ^(1)(id) = 1 · 1 · 1 = 1.
        let f1 = WenzlFactor { n_strands: 1, word: vec![], label: "id1".into() };
        let f2 = WenzlFactor { n_strands: 1, word: vec![], label: "id1".into() };
        let chi = chi_via_lr_2way(&[2], &f1, &f2);
        // χ^(2)(id) should be a constant 1.
        let direct = chi_lambda_braid_qdef(&[2], 2, &[]);
        assert_eq!(chi.pretty(), direct.pretty(),
                   "2-way LR identity mismatch: chi_LR={}, chi_direct={}",
                   chi.pretty(), direct.pretty());
    }

    #[test]
    fn factor_2way_sign_rep_at_h_2() {
        let f1 = WenzlFactor { n_strands: 1, word: vec![], label: "id1".into() };
        let f2 = WenzlFactor { n_strands: 1, word: vec![], label: "id1".into() };
        let chi = chi_via_lr_2way(&[1, 1], &f1, &f2);
        let direct = chi_lambda_braid_qdef(&[1, 1], 2, &[]);
        assert_eq!(chi.pretty(), direct.pretty(),
                   "2-way LR sign-rep mismatch: chi_LR={}, chi_direct={}",
                   chi.pretty(), direct.pretty());
    }

    #[test]
    fn averaged_denominator_counts_correctly() {
        let f = WenzlFactor {
            n_strands: 3,
            word: vec![
                (Crossing::Sigma, 1),
                (Crossing::Averaged, 2),
                (Crossing::Averaged, 1),
                (Crossing::SigmaInv, 2),
            ],
            label: "test".into(),
        };
        // 2 averaged crossings → denominator = 4
        assert_eq!(averaging_denominator(&[f.clone()]), 4);
        // Two such factors → 16
        assert_eq!(averaging_denominator(&[f.clone(), f]), 16);
    }

    #[test]
    fn canonical_chi_f64_matches_seminormal_on_empty_word() {
        // χ^(2)(identity) should equal dim S^(2) = 1.
        let chi = chi_lambda_canonical_h_n_f64(&[2], 2, &[], 1.5);
        assert!((chi - 1.0).abs() < 1e-12,
                "χ^(2)(id) at H_2 = {}, expected 1.0", chi);
        // χ^(1,1)(identity) = 1.
        let chi2 = chi_lambda_canonical_h_n_f64(&[1, 1], 2, &[], 1.5);
        assert!((chi2 - 1.0).abs() < 1e-12,
                "χ^(1,1)(id) at H_2 = {}, expected 1.0", chi2);
    }

    #[test]
    fn averaged_chi_expansion_matches_sum_of_pure_words() {
        // Single averaged crossing on H_2: word = [averaged σ_1].
        // chi_factor returns the unnormalised sum
        //   chi_lambda([σ_1]) + chi_lambda([σ_1^{-1}])
        // which we verify by direct call.
        let f = WenzlFactor {
            n_strands: 2,
            word: vec![(Crossing::Averaged, 1)],
            label: "h2_avg".into(),
        };
        // χ^(2) (trivial rep) at q-deformed σ_1 = q, σ_1^{-1} = q^{-1}
        // Sum = q + q^{-1}.
        let chi_via_factor = chi_factor(&[2], &f);
        let chi_sigma = chi_lambda_braid_qdef(&[2], 2, &[(1, 1)]);
        let chi_sigma_inv = chi_lambda_braid_qdef(&[2], 2, &[(-1, 1)]);
        let expected = chi_sigma + chi_sigma_inv;
        assert_eq!(
            chi_via_factor.pretty(), expected.pretty(),
            "averaged expansion mismatch: factor={}, direct sum={}",
            chi_via_factor.pretty(), expected.pretty()
        );
    }
}
