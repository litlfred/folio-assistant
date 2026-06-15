//! hecke-engine-r — extendr bindings for hecke-engine's gram primitives,
//! consumed from R.
//!
//! Tier-3 wrapper per workplan v2 §3.6. Sibling of:
//!   - pyhecke-native       (PyO3 → Python; production on PyPI)
//!   - hecke-engine-node    (napi-rs → Node.js; merged)
//!   - hecke-engine-wasm    (wasm-bindgen → browser; merged)
//!   - hecke-engine-jvm     (UniFFI → Kotlin/Swift/Java; merged)
//!   - hecke-engine-r       (extendr → R; this PR)
//!
//! Phase A surface mirrors the other 4 wrappers intentionally — an R
//! consumer can switch runtimes without API changes.
//!
//! Build (from R, via the `rextendr` package):
//!   library(rextendr)
//!   rextendr::document("tools/hecke-engine-r")
//!   # → generates R/extendr-wrappers.R + man/ pages + NAMESPACE
//!
//! Or via cargo:
//!   cd tools/hecke-engine-r
//!   cargo build --release

use extendr_api::prelude::*;
use hecke_engine::gram;
use hecke_engine::seminormal;
use hecke_engine::littlewood_richardson;
use hecke_engine::tr_m_atomic_mpfr as trmpfr;

/// Engine version (matches Cargo.toml).
/// @export
#[extendr]
fn qou_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

/// Markov parameter z = 1 / (q^{1/2} + q^{-1/2}).
/// @param q substrate parameter (numeric)
/// @return z (numeric)
/// @export
#[extendr]
fn qou_markov_z(q: f64) -> f64 {
    gram::markov_z(q)
}

/// Hecke relation coefficient h = q - q^{-1}.
/// @param q substrate parameter (numeric)
/// @return h (numeric)
/// @export
#[extendr]
fn qou_hecke_h(q: f64) -> f64 {
    gram::hecke_h(q)
}

/// Markov-trace weights on the NF basis (length-6 numeric vector).
/// @param q substrate parameter (numeric)
/// @return [1, z, z, z^2, z^2, z^3]
/// @export
#[extendr]
fn qou_trace_weights(q: f64) -> Vec<f64> {
    gram::trace_weights(q).to_vec()
}

/// Gram matrix G_ij = tr_M(b_i * b_j), returned as a 6x6 R matrix.
/// @param q substrate parameter (numeric)
/// @return 6x6 numeric matrix
/// @export
#[extendr]
fn qou_gram_matrix(q: f64) -> RMatrix<f64> {
    let m = gram::gram_matrix(q);
    let mut flat = Vec::with_capacity(36);
    // R is column-major; flatten accordingly so the matrix indexes correctly.
    for j in 0..6 {
        for i in 0..6 {
            flat.push(m[i][j]);
        }
    }
    RMatrix::new_matrix(6, 6, |r, c| flat[c * 6 + r])
}

/// Gram determinant.
/// @param q substrate parameter (numeric)
/// @return det(G(q)) (numeric)
/// @export
#[extendr]
fn qou_gram_det(q: f64) -> f64 {
    gram::det_6x6(&gram::gram_matrix(q))
}

// ── Phase B ──

/// Hecke character chi_lambda(beta) of partition `shape` on braid word `word` at q.
/// @param shape integer vector — partition (weakly decreasing, non-negative).
///              An empty vector returns 1.0.
/// @param word_gens integer vector — braid letter generator indices.
/// @param word_exps integer vector — braid letter exponents (non-negative,
///                                   same length as word_gens).
/// @param q substrate parameter (numeric).
/// @return chi (numeric)
/// @export
#[extendr]
fn qou_chi_lambda_braid(shape: Vec<i32>, word_gens: Vec<i32>, word_exps: Vec<i32>, q: f64)
    -> std::result::Result<f64, String>
{
    let shape_u: Vec<usize> = shape.into_iter().map(|x| {
        if x < 0 { panic!("shape parts must be non-negative") }
        x as usize
    }).collect();
    if word_gens.len() != word_exps.len() {
        return Err(format!(
            "word_gens and word_exps must have the same length (got {} and {})",
            word_gens.len(), word_exps.len()));
    }
    let mut word: Vec<(i32, u32)> = Vec::with_capacity(word_gens.len());
    for (g, e) in word_gens.into_iter().zip(word_exps.into_iter()) {
        if e < 0 { return Err("word exponents must be non-negative".to_string()); }
        word.push((g, e as u32));
    }
    Ok(seminormal::chi_lambda_braid(&shape_u, &word, q))
}

/// Littlewood-Richardson coefficient c^lambda_{mu nu}.
/// @param lambda integer vector — outer partition.
/// @param mu integer vector — inner partition 1.
/// @param nu integer vector — inner partition 2.
/// @return integer coefficient (0 if |lambda| != |mu| + |nu| or mu not contained in lambda).
/// @export
#[extendr]
fn qou_lr_coefficient(lambda: Vec<i32>, mu: Vec<i32>, nu: Vec<i32>) -> i64 {
    let to_u = |v: Vec<i32>| -> Vec<usize> {
        v.into_iter().map(|x| if x < 0 { 0 } else { x as usize }).collect()
    };
    littlewood_richardson::lr_coefficient(&to_u(lambda), &to_u(mu), &to_u(nu))
}

/// Arbitrary-precision Markov trace tr_M(beta) at q (string for precision).
/// @param word_signs integer vector — sign of each braid letter (-1 or +1).
/// @param word_gens integer vector — generator index (1-based).
/// @param n_strands integer — n in B_n.
/// @param q_str character — decimal representation of q.
/// @param dps integer — decimal digits of precision.
/// @return character — decimal-string trace value.
/// @export
#[extendr]
fn qou_tr_m_atomic_mpfr(
    word_signs: Vec<i32>,
    word_gens: Vec<i32>,
    n_strands: i32,
    q_str: String,
    dps: i32,
) -> std::result::Result<String, String> {
    if word_signs.len() != word_gens.len() {
        return Err(format!(
            "word_signs and word_gens must have the same length (got {} and {})",
            word_signs.len(), word_gens.len()));
    }
    if n_strands < 1 { return Err("n_strands must be >= 1".to_string()); }
    if dps < 1 { return Err("dps must be >= 1".to_string()); }
    let mut word: Vec<(i8, i32)> = Vec::with_capacity(word_signs.len());
    for (s, g) in word_signs.into_iter().zip(word_gens.into_iter()) {
        if s != -1 && s != 1 {
            return Err("word_signs entries must be -1 or +1".to_string());
        }
        word.push((s as i8, g));
    }
    trmpfr::tr_m_atomic_mpfr(&word, n_strands as usize, &q_str, dps as u32)
        .map_err(|e| format!("tr_m_atomic_mpfr: {}", e))
}

// extendr macro that generates the R package boilerplate
// (wrapper.so registration + NAMESPACE entries).
extendr_module! {
    mod heckeengine;
    fn qou_version;
    fn qou_markov_z;
    fn qou_hecke_h;
    fn qou_trace_weights;
    fn qou_gram_matrix;
    fn qou_gram_det;
    fn qou_chi_lambda_braid;
    fn qou_lr_coefficient;
    fn qou_tr_m_atomic_mpfr;
}
