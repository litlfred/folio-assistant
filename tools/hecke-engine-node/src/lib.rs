//! hecke-engine-node — napi-rs Node.js native bindings for hecke-engine.
//!
//! Re-exposes the same Gram + trace primitives as `pyhecke-native`'s
//! PyO3 layer, but for Node.js consumers via N-API. Tier-3 wrapper
//! per workplan v2 §3.6.
//!
//! Surface mirrors pyhecke-native intentionally: a Node consumer can
//! read pyhecke's docstrings to understand the API. Differences are
//! cosmetic (camelCase per JS convention).
//!
//! Phase A scope: the same handful of Gram + trace primitives that
//! pyhecke-native exposes today. Phase B adds the higher-level
//! `chi_lambda_braid` + `lr_coefficient` + `tr_m_atomic_mpfr` paths.
//!
//! Build:
//!   cd tools/hecke-engine-node
//!   npm install
//!   npm run build      # napi build → hecke-engine-node.<platform>.node
//!                      #              + index.js (loader) + index.d.ts
//!   npm test           # `pretest` rebuilds, then `node --test test/`

use hecke_engine::gram;
use hecke_engine::seminormal;
use hecke_engine::littlewood_richardson;
use hecke_engine::tr_m_atomic_mpfr as trmpfr;
use napi_derive::napi;

/// Markov parameter `z = 1 / (q^{1/2} + q^{-1/2})`.
#[napi]
pub fn markov_z(q: f64) -> f64 {
    gram::markov_z(q)
}

/// Hecke relation coefficient `h = q − q⁻¹`.
#[napi]
pub fn hecke_h(q: f64) -> f64 {
    gram::hecke_h(q)
}

/// Markov-trace weights on the NF basis as a length-6 array.
#[napi]
pub fn trace_weights(q: f64) -> Vec<f64> {
    gram::trace_weights(q).to_vec()
}

/// Gram matrix `G_ij = tr_M(b_i · b_j)` as a 6×6 array.
#[napi]
pub fn gram_matrix(q: f64) -> Vec<Vec<f64>> {
    gram::gram_matrix(q).iter().map(|r| r.to_vec()).collect()
}

/// Gram determinant — delegates to `hecke_engine::gram::det_6x6`.
#[napi]
pub fn gram_det(q: f64) -> f64 {
    gram::det_6x6(&gram::gram_matrix(q))
}

/// Package version string (matches Cargo.toml + package.json).
#[napi]
pub fn version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

// ── Phase B — full surface ──

/// Hecke character `χ_λ(β)` of partition `shape` on braid word `word` at `q`.
///
/// `word` is an Array of `[gen, exp]` JS tuples; each pair encodes a braid
/// letter `σ_gen ^ exp`. Empty `shape` returns 1.0 (trivial-character
/// convention).
#[napi]
pub fn chi_lambda_braid(shape: Vec<u32>, word: Vec<Vec<i32>>, q: f64) -> napi::Result<f64> {
    let shape_u: Vec<usize> = shape.into_iter().map(|x| x as usize).collect();
    let mut word_pairs: Vec<(i32, u32)> = Vec::with_capacity(word.len());
    for pair in word.iter() {
        if pair.len() != 2 {
            return Err(napi::Error::from_reason(
                "chi_lambda_braid: each word entry must be a 2-element [gen, exp] array".to_string()
            ));
        }
        if pair[1] < 0 {
            return Err(napi::Error::from_reason(
                "chi_lambda_braid: exponent must be non-negative".to_string()
            ));
        }
        word_pairs.push((pair[0], pair[1] as u32));
    }
    Ok(seminormal::chi_lambda_braid(&shape_u, &word_pairs, q))
}

/// Littlewood–Richardson coefficient `c^λ_{μν}`.
///
/// Returns 0 if `|λ| ≠ |μ| + |ν|` or `μ ⊄ λ` (per the Rust API contract).
#[napi]
pub fn lr_coefficient(lambda: Vec<u32>, mu: Vec<u32>, nu: Vec<u32>) -> i64 {
    let lam: Vec<usize> = lambda.into_iter().map(|x| x as usize).collect();
    let m:   Vec<usize> = mu.into_iter().map(|x| x as usize).collect();
    let n:   Vec<usize> = nu.into_iter().map(|x| x as usize).collect();
    littlewood_richardson::lr_coefficient(&lam, &m, &n)
}

/// Arbitrary-precision Markov trace `tr_M(β)` at `q` (passed as decimal
/// string for parser-level precision). Returns the decimal-string
/// representation at `dps` digits of precision.
///
/// `word` is an Array of `[sign, gen]` pairs with `sign ∈ {-1, +1}`.
///
/// Throws on engine errors (e.g. malformed braid word).
#[napi]
pub fn tr_m_atomic_mpfr(
    word: Vec<Vec<i32>>,
    n_strands: u32,
    q_str: String,
    dps: u32,
) -> napi::Result<String> {
    let mut word_pairs: Vec<(i8, i32)> = Vec::with_capacity(word.len());
    for pair in word.iter() {
        if pair.len() != 2 {
            return Err(napi::Error::from_reason(
                "tr_m_atomic_mpfr: each word entry must be a 2-element [sign, gen] array".to_string()
            ));
        }
        if pair[0] != -1 && pair[0] != 1 {
            return Err(napi::Error::from_reason(
                "tr_m_atomic_mpfr: sign must be -1 or +1".to_string()
            ));
        }
        word_pairs.push((pair[0] as i8, pair[1]));
    }
    trmpfr::tr_m_atomic_mpfr(&word_pairs, n_strands as usize, &q_str, dps)
        .map_err(|e| napi::Error::from_reason(format!("tr_m_atomic_mpfr: {}", e)))
}
