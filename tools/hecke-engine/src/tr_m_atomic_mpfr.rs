//! End-to-end MPFR evaluation of `tr_M(β_atomic(Z, N), q₀)`.
//!
//! Combines:
//! - Tier 1.A reduce ([`crate::reduce_laurent::incremental_reduce`])
//! - Phase-2 trace recursion ([`crate::tr_m_word_lq::tr_m_word_lq`])
//! - MPFR-precision substitution at `q₀`
//!
//! into ONE Rust function callable through ONE PyO3 binding.  The
//! caller ships `(signed_word, n_strands, q_str, dps)` and gets back
//! a single decimal string for `mpmath.mpf` to parse on the Python
//! side.  No per-word PyO3 calls; no Python mpmath combine loop;
//! no Python ↔ Rust shuttling of BigInt decimal strings per
//! coefficient.
//!
//! This is the user-directed "put all that in rust" / "stop back
//! and forth rust and python of data" closure of Tier 1.A.
//!
//! Per CLAUDE.md §Precision goals L1 (50-dps compute floor): every
//! intermediate quantity is exact (BigRational / BigInt) up to the
//! final MPFR substitution; precision is set by the `dps` argument
//! (production default 50, research-grade 100+).

use crate::atomic_reduce_cache;
use crate::laurent_hecke_element::LaurentHeckeElement;
use crate::reduce_laurent;
use crate::tr_m_word_lq;
use rug::ops::Pow;
use rug::Float;

/// Decimal precision (`dps`) → MPFR binary precision (bits).
///
/// `bits = ⌈dps · log₂10⌉ + 32 guard bits` — log₂(10) ≈ 3.3219.
/// Using `3.4` as the slope is conservative (an upper bound) but
/// integer-truncation (`as u32`) would still under-allocate by
/// one bit at small `dps` (e.g. `dps = 2` → `6.8` truncates to
/// `6`, but `⌈2 · log₂10⌉ = 7`).  `ceil()` enforces the
/// documented bound at every `dps`.
fn dps_to_prec(dps: u32) -> u32 {
    ((dps as f64 * 3.4).ceil() as u32) + 32
}

/// **Tier 1.A entry point — full pipeline in Rust + MPFR.**
///
/// Pipeline (all Rust, no Python crossings between stages):
///
/// 1. Reduce ([`reduce_laurent::incremental_reduce`]) — R1+R2+R3
///    fixpoint with exact BigRational coefficients.
/// 2. For each reduced σ-word:
///    a. Evaluate the BigRational coefficient at `q` via MPFR
///       string round-trip (preserves precision past f64 cap).
///    b. Compute `tr_M(word)` ZHLaurent via
///       [`tr_m_word_lq::tr_m_word_lq`] (already Rust-native).
///    c. Evaluate the ZHLaurent at `(q, z, h)` via MPFR, where
///       `z = 1/(q^{1/2}+q^{-1/2})`, `h = q − q^{-1}`.
///    d. Accumulate into the running total.
/// 3. Return `total.to_string_radix(10, Some(dps + 5))` so the
///    Python caller can parse a single decimal string via
///    `mpmath.mpf(result_str)`.
///
/// `q_str`: substrate parameter as a decimal string (avoids f64
/// lossy conversion at the boundary; matches the existing
/// `chi_lambda_*_mpfr` API convention).
///
/// `dps`: working precision in decimal places.  Production floor
/// is 50 (CLAUDE.md §Precision goals L1); use 100+ for substrate-
/// derivation cross-checks.
///
/// Returns `Err(message)` if the trace recursion hits Case C
/// (multiple top-1 in segment) on any reduced word — caller routes
/// to the sympy ocneanu fallback, same contract as
/// `tr_m_word_lq::tr_m_word_lq`.
pub fn tr_m_atomic_mpfr(
    signed_word: &[(i8, i32)],
    n_strands: usize,
    q_str: &str,
    dps: u32,
) -> Result<String, String> {
    let (val, _final) = tr_m_atomic_mpfr_with_state(
        signed_word,
        n_strands,
        q_str,
        dps,
        crate::laurent_hecke_element::LaurentHeckeElement::identity(),
    )?;
    Ok(val)
}

/// **Resume-from-state variant of [`tr_m_atomic_mpfr`].**
///
/// Takes an `initial_state` (a pre-reduced
/// [`crate::laurent_hecke_element::LaurentHeckeElement`]) and the
/// `signed_word` *suffix* to apply on top of it.  Returns
/// `(mpf_decimal_string, final_reduced_state)` so the caller can
/// persist the final state as a cache entry for future resumes.
///
/// Use case (per `markov_peel_rust_bridge` prefix-cache wiring):
/// computing `tr_M(β_{6Li})` after `β_{5Li}` is already cached.
/// Since the 5Li signed word is a strict prefix of the 6Li one,
/// the 5Li reduced state is the correct initial accumulator —
/// only the extra 12 crossings need to be applied (the part where
/// term-count growth would otherwise blow up).
///
/// Identity-state input (the `tr_m_atomic_mpfr` wrapper above)
/// reproduces the from-scratch path exactly.
pub fn tr_m_atomic_mpfr_with_state(
    signed_word_suffix: &[(i8, i32)],
    n_strands: usize,
    q_str: &str,
    dps: u32,
    initial_state: crate::laurent_hecke_element::LaurentHeckeElement,
) -> Result<(String, crate::laurent_hecke_element::LaurentHeckeElement), String> {
    let reduced = reduce_laurent::incremental_reduce_from_state(
        initial_state,
        signed_word_suffix,
        10_000,
    );
    let val = eval_reduced_to_mpfr(&reduced, n_strands, q_str, dps)?;
    Ok((val, reduced))
}

/// **Rust-side cached variant of [`tr_m_atomic_mpfr`].**
///
/// Looks up the longest cached prefix of `signed_word` in the
/// in-process [`atomic_reduce_cache`], resumes the reduce from
/// that state, applies the suffix, and caches the final state
/// under the full signed-word's hash for future calls.
///
/// **Zero FFI marshalling on cache hit.**  The cached
/// [`LaurentHeckeElement`] never crosses the Python ↔ Rust
/// boundary — Python passes only the signed word, hash + lookup
/// happen entirely in Rust.  This is the productive variant of
/// the prefix-cache infra (the disk-resident JSON path in
/// `_prefix_cache.py` is a net loss per
/// `docs/audits/2026-05-22-prefix-cache-negative-bench.md`).
pub fn tr_m_atomic_mpfr_cached(
    signed_word: &[(i8, i32)],
    n_strands: usize,
    q_str: &str,
    dps: u32,
) -> Result<String, String> {
    let (prefix_len, initial_state_opt) =
        atomic_reduce_cache::find_longest_cached_prefix(signed_word);
    let initial = initial_state_opt.unwrap_or_else(LaurentHeckeElement::identity);
    let suffix = &signed_word[prefix_len..];
    let reduced =
        reduce_laurent::incremental_reduce_from_state(initial, suffix, 10_000);
    atomic_reduce_cache::save_prefix_state(signed_word, &reduced);
    eval_reduced_to_mpfr(&reduced, n_strands, q_str, dps)
}

/// MPFR evaluation of a reduced `LaurentHeckeElement` at `q₀`.
/// Shared by `tr_m_atomic_mpfr*` entry points (factored out so
/// the from-scratch / resume / cached paths reuse it bit-for-bit).
fn eval_reduced_to_mpfr(
    reduced: &LaurentHeckeElement,
    n_strands: usize,
    q_str: &str,
    dps: u32,
) -> Result<String, String> {
    let prec = dps_to_prec(dps);
    let q = Float::with_val(
        prec,
        Float::parse(q_str)
            .map_err(|e| format!("tr_m_atomic_mpfr: q_str parse error: {}", e))?,
    );
    let q_half = Float::with_val(prec, q.clone().sqrt());
    let q_inv = Float::with_val(prec, q.clone().recip());
    let q_half_inv = Float::with_val(prec, q_half.clone().recip());
    // z = 1 / (q^{1/2} + q^{-1/2})
    let z = Float::with_val(prec, Float::with_val(prec, &q_half + &q_half_inv).recip());
    // h = q − q^{-1}
    let h = Float::with_val(prec, &q - &q_inv);

    let mut total = Float::with_val(prec, 0);
    for (word, coef) in &reduced.terms {
        // Skip formal-variable (negative gen) entries — they make
        // no contribution to the Markov trace (matches the Python
        // convention in `tr_M_element`).
        if word.iter().any(|&g| g < 0) {
            continue;
        }
        let coef_mpfr = coef.evaluate_mpfr(&q);
        if coef_mpfr.is_zero() {
            continue;
        }
        // Re-cast non-negative i32 → u32 for the trace API.  Bit-
        // identical for non-negative values; the filter above
        // guarantees safety.
        let word_u32: Vec<u32> = word.iter().map(|&g| g as u32).collect();
        let zh = tr_m_word_lq::tr_m_word_lq(&word_u32, n_strands, 200)?;
        let mut zh_val = Float::with_val(prec, 0);
        for (&(z_exp, h_exp), poly) in &zh.terms {
            let c_zh = poly.evaluate_mpfr(&q);
            let z_pow: Float = Float::with_val(prec, z.clone().pow(z_exp));
            let h_pow: Float = Float::with_val(prec, h.clone().pow(h_exp));
            let mut term = Float::with_val(prec, &c_zh * &z_pow);
            term *= &h_pow;
            zh_val += term;
        }
        total += Float::with_val(prec, &coef_mpfr * &zh_val);
    }

    // Emit at full precision so mpmath.mpf can reconstruct without
    // loss.  `Some(dps + 5)` gives a small over-precision buffer
    // so the decimal representation is unambiguous to `dps` places.
    Ok(total.to_string_radix(10, Some((dps + 5) as usize)))
}

// ── Tests ─────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    /// `q₀` — the canonical substrate value.
    const Q0_STR: &str = "1.10997859555418057528159407960950937799328227995870";

    #[test]
    fn proton_word_smoke() {
        // The proton atom is a non-trivial atomic braid; here we
        // exercise the smallest non-empty signed word — a single
        // Sigma+ crossing at gen 0 — and verify the result is
        // finite and parseable as a Float.
        let signed_word = vec![(1i8, 0i32)];
        let result_str = tr_m_atomic_mpfr(&signed_word, 3, Q0_STR, 50).unwrap();
        let parsed = Float::parse(&result_str)
            .expect("result string must parse as Float");
        let _: Float = Float::with_val(180, parsed);
    }

    #[test]
    fn empty_word_is_one() {
        // tr_M(identity) = 1 at any q.
        let signed_word: Vec<(i8, i32)> = vec![];
        let result_str = tr_m_atomic_mpfr(&signed_word, 3, Q0_STR, 50).unwrap();
        let parsed = Float::parse(&result_str).unwrap();
        let v = Float::with_val(180, parsed);
        let one = Float::with_val(180, 1);
        let diff = Float::with_val(180, &v - &one);
        let diff_f64: f64 = diff.to_f64().abs();
        assert!(diff_f64 < 1e-40, "tr_M(identity) should be 1, got {}", result_str);
    }

    #[test]
    fn averaged_squared_at_q0() {
        // (σ_0 − h/2)² as derived in reduce_laurent::tests::
        //     incremental_reduce_averaged_squared:
        // reduces to q²/4 + 1/2 + q⁻²/4  on the empty word.
        // Markov trace of empty word is 1, so the contribution is
        // 1·(q²/4 + 1/2 + q⁻²/4).
        let signed_word = vec![(0i8, 0i32), (0i8, 0i32)];
        let result_str = tr_m_atomic_mpfr(&signed_word, 3, Q0_STR, 50).unwrap();
        let parsed = Float::parse(&result_str).unwrap();
        let v = Float::with_val(180, parsed);
        // Expected: q²/4 + 1/2 + q⁻²/4 at q₀.
        let q = Float::with_val(180, Float::parse(Q0_STR).unwrap());
        let q_sq = Float::with_val(180, q.clone() * &q);
        let q_inv_sq = Float::with_val(180, q_sq.clone().recip());
        let expected = Float::with_val(
            180,
            Float::with_val(180, &q_sq / 4)
                + Float::with_val(180, 1) / 2
                + Float::with_val(180, &q_inv_sq / 4),
        );
        let diff = Float::with_val(180, &v - &expected);
        let diff_f64: f64 = diff.to_f64().abs();
        assert!(
            diff_f64 < 1e-40,
            "averaged-squared mismatch at q₀: got {}, expected {}",
            result_str,
            expected.to_string_radix(10, Some(55))
        );
    }
}
