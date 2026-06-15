//! hecke-engine-wasm — wasm-bindgen exports of hecke-engine's
//! pure-Rust canonical surface.
//!
//! What this crate exposes:
//!   * `qou_quantum_integer(n, q_num, q_den)`   → `[m]_q` as a rational string
//!   * `qou_partitions_of(n)`                    → JSON array of partitions of n
//!   * `qou_lr_coefficient(lambda, mu, nu)`      → Littlewood-Richardson c^ν_{λμ}
//!   * `qou_engine_version()`                    → version string
//!
//! What this crate does NOT expose (Tier-A out-of-scope for WASM):
//!   * Anything that requires `rug` / MPFR — multi-precision floats
//!     (`seminormal_mpfr`, `dense_la_mpfr`, `tr_m_atomic_mpfr`, …)
//!   * Clarabel-rs SDP solver (needs OpenBLAS / LAPACK / gfortran)
//!   * Binaries (CLI tools)
//!
//! Phase A scope: scaffolding + proof of concept. Phase B will add
//! the Gram matrix construction (`gram::canonical_gram_h3`), Wenzl
//! LR decomposition (after it migrates off `laurent_poly_q`), and
//! the canonical normal-form reduction (`gb_nf_reducer`). Phase B
//! will also centralise `partitions_of` (currently duplicated here
//! from `hecke_engine::seminormal_mn::partitions_of` because that
//! module is gated behind the `mpfr` feature and unavailable in
//! `--no-default-features` WASM builds) into a shared rug-free
//! utility module in `hecke-engine`.
//!
//! Build: `wasm-pack build --release` (see ../README.md for npm
//! consumer setup).

use wasm_bindgen::prelude::*;

#[cfg(feature = "console_error_panic_hook")]
#[wasm_bindgen(start)]
pub fn init() {
    console_error_panic_hook::set_once();
}

/// Engine version string — useful for downstream consumers that want
/// to assert a minimum version.
#[wasm_bindgen]
pub fn qou_engine_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

/// Quantum integer `[n]_q = (q^n - q^{-n}) / (q - q^{-1})` evaluated
/// at a rational `q = q_num / q_den`. Returned as an exact rational
/// in the form `"numerator/denominator"`. Use this to verify
/// substrate-discipline `q_int` values from the browser.
///
/// Panics if `q_den == 0` or `q = ±1` (i.e. `q_num == q_den` or
/// `q_num == -q_den`) — at those values `q − q⁻¹ = 0` so the
/// quantum-integer formula has a removable singularity that the
/// rational-arithmetic path can't evaluate.
#[wasm_bindgen]
pub fn qou_quantum_integer(n: i32, q_num: i64, q_den: i64) -> String {
    use num_bigint::BigInt;
    use num_rational::BigRational;

    assert!(q_den != 0, "q_den must be nonzero");
    // q = ±1 ⇔ |q_num| == |q_den| (after reduction). Reject explicitly:
    // q − q⁻¹ = 0 at q = ±1, so [n]_q is undefined here.
    assert!(
        q_num.unsigned_abs() != q_den.unsigned_abs(),
        "q must not be ±1 (q − q⁻¹ = 0 at q = ±1; [n]_q is undefined)"
    );
    let q = BigRational::new(BigInt::from(q_num), BigInt::from(q_den));
    let q_inv = q.recip();
    let qmqi = &q - &q_inv;

    // Use `unsigned_abs()` to safely handle `i32::MIN` (whose `abs()`
    // would panic in debug mode and wrap in release).
    let n_abs = n.unsigned_abs();
    let q_n = pow_rational(&q, n_abs);
    let q_n_inv = pow_rational(&q_inv, n_abs);
    let numer = if n >= 0 { q_n - q_n_inv } else { q_n_inv - q_n };
    let result = numer / qmqi;
    format!("{}", result)
}

fn pow_rational(q: &num_rational::BigRational, n: u32) -> num_rational::BigRational {
    use num_traits::One;
    let mut acc = num_rational::BigRational::one();
    for _ in 0..n {
        acc = &acc * q;
    }
    acc
}

/// Enumerate partitions of `n` as a JSON array of integer arrays.
/// E.g. `qou_partitions_of(4)` → `"[[4],[3,1],[2,2],[2,1,1],[1,1,1,1]]"`.
///
/// Used as a sanity check that the WASM surface can produce the
/// canonical partition enumeration QOU's Wedderburn step depends on.
///
/// Phase B will pull this from a centralised rug-free utility in
/// `hecke-engine` (the existing `partitions_of` lives in
/// `seminormal_mn`, which is in the mpfr cone).
#[wasm_bindgen]
pub fn qou_partitions_of(n: usize) -> String {
    let parts = partitions_of(n);
    // `Vec<Vec<usize>>` serialisation is infallible; `expect` here would
    // only fire on a `Vec`-level allocator failure, which we'd want to
    // see surfaced rather than silently masked as `[]`.
    serde_json::to_string(&parts).expect("infallible serialisation of Vec<Vec<usize>>")
}

fn partitions_of(n: usize) -> Vec<Vec<usize>> {
    if n == 0 {
        return vec![vec![]];
    }
    let mut out = Vec::new();
    fn helper(n: usize, max: usize, prefix: &mut Vec<usize>, out: &mut Vec<Vec<usize>>) {
        if n == 0 {
            out.push(prefix.clone());
            return;
        }
        let upper = n.min(max);
        for first in (1..=upper).rev() {
            prefix.push(first);
            helper(n - first, first, prefix, out);
            prefix.pop();
        }
    }
    helper(n, n, &mut Vec::new(), &mut out);
    out
}

/// Littlewood-Richardson coefficient `c^nu_{lambda,mu}`. Wraps
/// `hecke_engine::littlewood_richardson::lr_coefficient` (a pure-Rust
/// function with no rug dependency, hence WASM-targetable).
///
/// Inputs are JSON-serialized partition arrays (e.g. `"[2,1]"`).
/// Returns the integer coefficient.
#[wasm_bindgen]
pub fn qou_lr_coefficient(lambda_json: &str, mu_json: &str, nu_json: &str) -> Result<i64, JsValue> {
    let lambda: Vec<usize> = serde_json::from_str(lambda_json)
        .map_err(|e| JsValue::from_str(&format!("lambda parse: {}", e)))?;
    let mu: Vec<usize> = serde_json::from_str(mu_json)
        .map_err(|e| JsValue::from_str(&format!("mu parse: {}", e)))?;
    let nu: Vec<usize> = serde_json::from_str(nu_json)
        .map_err(|e| JsValue::from_str(&format!("nu parse: {}", e)))?;
    Ok(hecke_engine::littlewood_richardson::lr_coefficient(&lambda, &mu, &nu))
}

// ── Phase B — pure-Rust (no MPFR) surface ──
//
// These mirror the canonical Gram/character primitives that
// hecke-engine-{c,node,jvm} all expose. WASM uses double-precision
// throughout (no MPFR available in browser sandbox); the
// `tr_m_atomic_mpfr` arbitrary-precision evaluator is deliberately
// omitted for this build target. Browser consumers needing
// > double precision can still serialise the braid word and POST
// it to a server-side endpoint backed by the native crate.

/// Markov parameter `z = 1 / (q^{1/2} + q^{-1/2})`.
#[wasm_bindgen]
pub fn qou_markov_z(q: f64) -> f64 {
    hecke_engine::gram::markov_z(q)
}

/// Hecke relation coefficient `h = q − q⁻¹`.
#[wasm_bindgen]
pub fn qou_hecke_h(q: f64) -> f64 {
    hecke_engine::gram::hecke_h(q)
}

/// Markov-trace weights on the NF basis as a JSON array of 6 floats.
/// JSON-string return to avoid pulling in `serde-wasm-bindgen`
/// for a single small array; browser consumers `JSON.parse()` once.
#[wasm_bindgen]
pub fn qou_trace_weights(q: f64) -> String {
    let w = hecke_engine::gram::trace_weights(q);
    serde_json::to_string(&w.to_vec())
        .expect("infallible serialisation of Vec<f64>")
}

/// Gram matrix `G_ij = tr_M(b_i · b_j)` as a JSON 6×6 array of floats.
#[wasm_bindgen]
pub fn qou_gram_matrix(q: f64) -> String {
    let m = hecke_engine::gram::gram_matrix(q);
    let rows: Vec<Vec<f64>> = m.iter().map(|r| r.to_vec()).collect();
    serde_json::to_string(&rows)
        .expect("infallible serialisation of Vec<Vec<f64>>")
}

/// Gram determinant — delegates to `hecke_engine::gram::det_6x6`.
#[wasm_bindgen]
pub fn qou_gram_det(q: f64) -> f64 {
    hecke_engine::gram::det_6x6(&hecke_engine::gram::gram_matrix(q))
}

/// Hecke character `χ_λ(β)` of partition `shape` on braid word `word` at `q`.
///
/// `word_json` is a JSON 2D array `[[gen, exp], ...]`; empty `shape`
/// returns 1.0 (trivial-character convention).
#[wasm_bindgen]
pub fn qou_chi_lambda_braid(shape_json: &str, word_json: &str, q: f64)
    -> Result<f64, JsValue>
{
    let shape: Vec<usize> = serde_json::from_str(shape_json)
        .map_err(|e| JsValue::from_str(&format!("shape parse: {}", e)))?;
    let word_raw: Vec<Vec<i64>> = serde_json::from_str(word_json)
        .map_err(|e| JsValue::from_str(&format!("word parse: {}", e)))?;
    let mut word_pairs: Vec<(i32, u32)> = Vec::with_capacity(word_raw.len());
    for pair in word_raw.iter() {
        if pair.len() != 2 {
            return Err(JsValue::from_str(
                "qou_chi_lambda_braid: each word entry must be a 2-element [gen, exp] array",
            ));
        }
        if pair[1] < 0 {
            return Err(JsValue::from_str(
                "qou_chi_lambda_braid: exponent must be non-negative",
            ));
        }
        word_pairs.push((pair[0] as i32, pair[1] as u32));
    }
    Ok(hecke_engine::seminormal::chi_lambda_braid(&shape, &word_pairs, q))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn version_matches_cargo_package() {
        // Compare against env!() rather than a hard-coded literal so
        // version bumps don't break the test (per PR #1094 review).
        assert_eq!(qou_engine_version(), env!("CARGO_PKG_VERSION"));
        assert!(!qou_engine_version().is_empty());
    }

    #[test]
    fn quantum_integer_basic() {
        // [1]_q = 1 for any q ≠ ±1
        assert_eq!(qou_quantum_integer(1, 3, 2), "1");
        // [2]_q = q + q^-1
        // At q = 2/1: q + 1/q = 2 + 1/2 = 5/2
        assert_eq!(qou_quantum_integer(2, 2, 1), "5/2");
    }

    #[test]
    #[should_panic(expected = "q must not be ±1")]
    fn quantum_integer_q_eq_minus_one_rejected() {
        let _ = qou_quantum_integer(2, -1, 1);
    }

    #[test]
    #[should_panic(expected = "q must not be ±1")]
    fn quantum_integer_q_eq_one_rejected() {
        let _ = qou_quantum_integer(2, 1, 1);
    }

    #[test]
    fn partitions_of_4() {
        let p = qou_partitions_of(4);
        let v: Vec<Vec<usize>> = serde_json::from_str(&p).unwrap();
        let expected: Vec<Vec<usize>> = vec![
            vec![4],
            vec![3, 1],
            vec![2, 2],
            vec![2, 1, 1],
            vec![1, 1, 1, 1],
        ];
        assert_eq!(v, expected);
    }

    // ── Phase B ──

    #[test]
    fn markov_z_positive() {
        assert!(qou_markov_z(1.10998) > 0.0);
    }

    #[test]
    fn hecke_h_formula() {
        let q = 1.10998_f64;
        let h = qou_hecke_h(q);
        assert!((h - (q - 1.0 / q)).abs() < 1e-12);
    }

    #[test]
    fn trace_weights_shape() {
        let s = qou_trace_weights(1.10998);
        let v: Vec<f64> = serde_json::from_str(&s).unwrap();
        assert_eq!(v.len(), 6);
        assert!((v[0] - 1.0).abs() < 1e-12);
    }

    #[test]
    fn gram_matrix_shape() {
        let s = qou_gram_matrix(1.10998);
        let m: Vec<Vec<f64>> = serde_json::from_str(&s).unwrap();
        assert_eq!(m.len(), 6);
        for row in &m {
            assert_eq!(row.len(), 6);
            for &v in row { assert!(v.is_finite()); }
        }
    }

    #[test]
    fn gram_det_finite() {
        let d = qou_gram_det(1.10998);
        assert!(d.is_finite() && d.abs() > 1e-30);
    }

    #[test]
    fn chi_lambda_braid_identity() {
        // Empty word on partition [3] → 1.0.
        let chi = qou_chi_lambda_braid("[3]", "[]", 1.10998).unwrap();
        assert!((chi - 1.0).abs() < 1e-12);
    }

    #[test]
    fn chi_lambda_braid_empty_shape() {
        // Empty partition → 1.0 by convention.
        let chi = qou_chi_lambda_braid("[]", "[[1, 1]]", 1.10998).unwrap();
        assert!((chi - 1.0).abs() < 1e-12);
    }

    #[test]
    fn partitions_of_0_is_empty_partition() {
        let p = qou_partitions_of(0);
        let v: Vec<Vec<usize>> = serde_json::from_str(&p).unwrap();
        assert_eq!(v, vec![Vec::<usize>::new()]);
    }

    // Note: `qou_lr_coefficient` is not exercised here because its
    // signature returns `Result<i64, JsValue>` — `JsValue` panics on
    // non-wasm32 targets ("function not implemented on non-wasm32
    // targets"). The wrapper's compile-time correctness is verified
    // by `wasm-pack build`; the underlying `lr_coefficient` is pinned
    // by hecke-engine's own test suite.
}
