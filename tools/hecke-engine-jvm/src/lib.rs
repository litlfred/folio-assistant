//! hecke-engine-jvm — UniFFI bindings for hecke-engine's gram
//! primitives, consumed from Kotlin / Java / Swift / Ruby / Python.
//!
//! Tier-3 wrapper per workplan v2 §3.6. Sibling of:
//!   - pyhecke-native (PyO3 → Python; production)
//!   - hecke-engine-node (napi-rs → Node.js; PR #1106 merged)
//!   - hecke-engine-wasm (wasm-bindgen → browser; PR #1094 merged)
//!
//! UniFFI generates the foreign-language glue from
//! `src/hecke_engine_jvm.udl`. The Rust functions here implement the
//! interface defined there; one declaration in two places (.udl +
//! .rs) is the cost of getting Kotlin, Swift, Python, Ruby, etc. all
//! from one Rust crate.
//!
//! Build:
//!   cargo build --release
//!
//! Generate Kotlin bindings:
//!   cargo run --bin uniffi-bindgen generate \
//!     --library target/release/libhecke_engine_jvm.so \
//!     --language kotlin --out-dir bindings/kotlin/
//!
//! Generate Swift bindings:
//!   cargo run --bin uniffi-bindgen generate \
//!     --library target/release/libhecke_engine_jvm.so \
//!     --language swift --out-dir bindings/swift/

use hecke_engine::gram;
use hecke_engine::seminormal;
use hecke_engine::littlewood_richardson;
use hecke_engine::tr_m_atomic_mpfr as trmpfr;

uniffi::include_scaffolding!("hecke_engine_jvm");

#[derive(Debug, thiserror::Error)]
pub enum HeckeError {
    #[error("engine error: {msg}")]
    EngineError { msg: String },
    #[error("invalid input: {msg}")]
    InvalidInput { msg: String },
}

/// Engine version (matches `Cargo.toml`).
pub fn version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

/// Markov parameter `z = 1 / (q^{1/2} + q^{-1/2})`.
pub fn markov_z(q: f64) -> f64 {
    gram::markov_z(q)
}

/// Hecke relation coefficient `h = q − q⁻¹`.
pub fn hecke_h(q: f64) -> f64 {
    gram::hecke_h(q)
}

/// Markov-trace weights on the NF basis (length-6 vector).
pub fn trace_weights(q: f64) -> Vec<f64> {
    gram::trace_weights(q).to_vec()
}

/// Gram matrix flattened to a length-36 row-major vector.
/// (UniFFI doesn't support `[[f64; 6]; 6]` natively; consumers reshape.)
pub fn gram_matrix_flat(q: f64) -> Vec<f64> {
    let m = gram::gram_matrix(q);
    let mut out = Vec::with_capacity(36);
    for row in &m {
        out.extend_from_slice(row);
    }
    out
}

/// Gram determinant — delegates to `hecke_engine::gram::det_6x6`.
pub fn gram_det(q: f64) -> f64 {
    gram::det_6x6(&gram::gram_matrix(q))
}

// ── Phase B — full surface ──

/// Hecke character `χ_λ(β)` of partition `shape` on braid word `word` at `q`.
pub fn chi_lambda_braid(shape: Vec<u32>, word: Vec<Vec<i32>>, q: f64)
    -> Result<f64, HeckeError>
{
    let shape_u: Vec<usize> = shape.into_iter().map(|x| x as usize).collect();
    let mut word_pairs: Vec<(i32, u32)> = Vec::with_capacity(word.len());
    for pair in word.iter() {
        if pair.len() != 2 {
            return Err(HeckeError::InvalidInput {
                msg: "chi_lambda_braid: each word entry must be a 2-element [gen, exp]".into(),
            });
        }
        if pair[1] < 0 {
            return Err(HeckeError::InvalidInput {
                msg: "chi_lambda_braid: exponent must be non-negative".into(),
            });
        }
        word_pairs.push((pair[0], pair[1] as u32));
    }
    Ok(seminormal::chi_lambda_braid(&shape_u, &word_pairs, q))
}

/// Littlewood–Richardson coefficient `c^λ_{μν}`.
pub fn lr_coefficient(lambda: Vec<u32>, mu: Vec<u32>, nu: Vec<u32>) -> i64 {
    let lam: Vec<usize> = lambda.into_iter().map(|x| x as usize).collect();
    let m:   Vec<usize> = mu.into_iter().map(|x| x as usize).collect();
    let n:   Vec<usize> = nu.into_iter().map(|x| x as usize).collect();
    littlewood_richardson::lr_coefficient(&lam, &m, &n)
}

/// Arbitrary-precision Markov trace `tr_M(β)` at `q` (string for precision).
pub fn tr_m_atomic_mpfr(
    word: Vec<Vec<i32>>,
    n_strands: u32,
    q_str: String,
    dps: u32,
) -> Result<String, HeckeError> {
    let mut word_pairs: Vec<(i8, i32)> = Vec::with_capacity(word.len());
    for pair in word.iter() {
        if pair.len() != 2 {
            return Err(HeckeError::InvalidInput {
                msg: "tr_m_atomic_mpfr: each word entry must be a 2-element [sign, gen]".into(),
            });
        }
        if pair[0] != -1 && pair[0] != 1 {
            return Err(HeckeError::InvalidInput {
                msg: "tr_m_atomic_mpfr: sign must be -1 or +1".into(),
            });
        }
        word_pairs.push((pair[0] as i8, pair[1]));
    }
    trmpfr::tr_m_atomic_mpfr(&word_pairs, n_strands as usize, &q_str, dps)
        .map_err(|e| HeckeError::EngineError { msg: e })
}

#[cfg(test)]
mod tests {
    use super::*;

    const Q_SUBSTRATE: f64 = 1.10998;

    #[test]
    fn version_is_set() {
        assert_eq!(version(), env!("CARGO_PKG_VERSION"));
    }

    #[test]
    fn markov_z_positive() {
        assert!(markov_z(Q_SUBSTRATE) > 0.0);
    }

    #[test]
    fn hecke_h_matches_formula() {
        let h = hecke_h(Q_SUBSTRATE);
        let expected = Q_SUBSTRATE - 1.0 / Q_SUBSTRATE;
        assert!((h - expected).abs() < 1e-12);
    }

    #[test]
    fn trace_weights_shape() {
        // 6 NF-basis Markov-trace weights: [1, z, z, z², z², z³]
        // where z = 1/(q^{1/2} + q^{-1/2}). NOT a probability —
        // it's a Markov-trace tuple. Just verify the shape + the
        // first element is identically 1.0.
        let w = trace_weights(Q_SUBSTRATE);
        assert_eq!(w.len(), 6);
        assert!((w[0] - 1.0).abs() < 1e-12);
        // w[1] == w[2] == markov_z(q); w[3] == w[4] == z²; w[5] == z³
        let z = markov_z(Q_SUBSTRATE);
        assert!((w[1] - z).abs() < 1e-12);
        assert!((w[5] - z * z * z).abs() < 1e-12);
    }

    #[test]
    fn gram_matrix_flat_is_36_elements() {
        // Just verify the flatten contract — 6×6 → 36 row-major.
        // The Gram matrix is NOT required to be symmetric by the
        // hecke-engine implementation (which uses a directional
        // Markov-trace product b_i · b_j, not the symmetrized
        // average). Consumers requiring symmetry must explicitly
        // average G + G^T / 2 themselves.
        let flat = gram_matrix_flat(Q_SUBSTRATE);
        assert_eq!(flat.len(), 36);
        for &v in &flat {
            assert!(v.is_finite(), "non-finite Gram entry");
        }
    }

    #[test]
    fn gram_det_finite() {
        // The Gram matrix at the substrate q_0 is INDEFINITE (has
        // negative eigenvalues in some Wedderburn blocks). The
        // determinant is non-zero but its sign isn't constrained.
        // Just verify the call returns a finite non-zero value.
        let d = gram_det(Q_SUBSTRATE);
        assert!(d.is_finite(), "gram_det non-finite: {d}");
        assert!(d.abs() > 1e-30, "gram_det too close to zero: {d}");
    }

    // ── Phase B ──

    #[test]
    fn chi_lambda_braid_identity_returns_one() {
        // Empty word on partition [3] → 1.0 (trivial-character convention).
        let chi = chi_lambda_braid(vec![3], vec![], Q_SUBSTRATE).unwrap();
        assert!((chi - 1.0).abs() < 1e-12, "chi(id) = {chi}, expected 1.0");
    }

    #[test]
    fn chi_lambda_braid_empty_shape_returns_one() {
        let chi = chi_lambda_braid(vec![], vec![vec![1, 1]], Q_SUBSTRATE).unwrap();
        assert!((chi - 1.0).abs() < 1e-12, "chi(empty) = {chi}, expected 1.0");
    }

    #[test]
    fn lr_coefficient_pieri_basic() {
        // c^[2]_{[1],[1]} = 1 (Pieri rule: single horizontal strip).
        assert_eq!(lr_coefficient(vec![2], vec![1], vec![1]), 1);
    }

    #[test]
    fn lr_coefficient_size_mismatch_zero() {
        // |[3]| = 3 ≠ |[2]| + |[2]| = 4 → 0.
        assert_eq!(lr_coefficient(vec![3], vec![2], vec![2]), 0);
    }

    #[test]
    fn tr_m_atomic_mpfr_smoke() {
        // Single positive σ_1 on B_3 at 20-dps. Markov-Ocneanu-Wenzl
        // trace of a Hecke generator is z = 1/(q^{1/2} + q^{-1/2}),
        // so the string should start with "4.99…" at q_0. n=3 chosen
        // over n=2 because B_2 trips an upstream edge case in
        // tr_m_word_lq's recursion.
        let s = tr_m_atomic_mpfr(
            vec![vec![1, 1]],
            3,
            "1.10998".to_string(),
            20,
        ).expect("tr_m_atomic_mpfr smoke");
        assert!(s.starts_with("4.99"), "expected '4.99...', got '{s}'");
    }

    #[test]
    fn chi_lambda_braid_rejects_malformed_word() {
        // Word entry must be length-2 [gen, exp]; length-1 should error.
        assert!(chi_lambda_braid(vec![3], vec![vec![1]], Q_SUBSTRATE).is_err());
    }
}
