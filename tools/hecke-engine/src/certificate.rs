//! Witness certificate: the canonical output format for Pauli witnesses.
//!
//! Each certificate records:
//! - The isotope (Z, N, A)
//! - The engine version and git commit that produced it
//! - The 4 summary polynomials (tr_alt, net, observable, coral)
//!   as sparse Laurent polynomial coefficients
//! - Per-strand metadata (word counts, timing)
//! - F_Pauli evaluated at q₀ (when computable)
//!
//! Format: JSON (human-readable) + optional binary (compact).
//! The certificate is the input for:
//! - Lean witness verification (strand-by-strand replay)
//! - Δ-chain computation (difference between parent and daughter)
//! - F_Pauli evaluation at arbitrary precision

use serde::Serialize;
use std::collections::BTreeMap;

/// Sparse Laurent polynomial: list of (exponent, coefficient_string) pairs.
/// Coefficients are stored as decimal strings to preserve BigInt precision.
#[derive(Serialize, Clone)]
pub struct SparsePoly {
    /// Sorted (exponent, coefficient) pairs. Coefficient is decimal string.
    pub terms: Vec<(i32, String)>,
}

impl SparsePoly {
    pub fn new() -> Self { Self { terms: Vec::new() } }

    pub fn from_btree(map: &BTreeMap<i32, impl ToString>) -> Self {
        Self {
            terms: map.iter()
                .filter(|(_, v)| v.to_string() != "0")
                .map(|(k, v)| (*k, v.to_string()))
                .collect()
        }
    }

    pub fn n_terms(&self) -> usize { self.terms.len() }

    pub fn max_abs_coeff_log10(&self) -> f64 {
        self.terms.iter()
            .map(|(_, s)| {
                let s = s.trim_start_matches('-');
                if s.is_empty() || s == "0" { return 0.0; }
                s.len() as f64 - 1.0
            })
            .fold(0.0f64, f64::max)
    }
}

/// Per-strand metadata for verification.
#[derive(Serialize, Clone)]
pub struct StrandInfo {
    pub strand: usize,
    pub words_before_strip: usize,
    pub words_after_strip: usize,
    pub mid_strips: u64,
    pub elapsed_ms: u128,
    pub max_coeff_log10: f64,
}

/// The complete witness certificate.
#[derive(Serialize)]
pub struct WitnessCertificate {
    // Identification
    pub isotope: IsotopeInfo,
    pub engine: EngineInfo,

    // The 4 summary polynomials (exact in t = q^{1/2} over ℤ)
    pub tr_alt: SparsePoly,
    pub net: SparsePoly,
    pub observable: SparsePoly,
    pub coral: SparsePoly,

    // Jet bundle: net_by_len[ℓ] = Σ c_w for words of length ℓ
    pub jets: Vec<SparsePoly>,

    // Denominator: true value = poly(t) / 2^pn_count
    pub pn_count: u32,

    // Evaluation at q₀ (if computable without overflow)
    pub f_pauli_f64: Option<f64>,
    pub tr_alt_f64: Option<f64>,
    pub net_f64: Option<f64>,
    pub tr_markov_f64: Option<f64>,        // Markov trace of full NF at q₀
    pub tr_markov_cleared: SparsePoly,     // tr_M × (t+t⁻¹)^L — symbolic in t
    pub tr_markov_denom_power: usize,      // L: divide by (t+t⁻¹)^L to get tr_M

    // Per-strand build metadata
    pub strands: Vec<StrandInfo>,

    // Summary
    pub total_words: usize,
    pub max_coeff_log10: f64,
    pub elapsed_seconds: f64,
    pub computed_at: String,
}

#[derive(Serialize)]
pub struct IsotopeInfo {
    pub z: usize,
    pub n: usize,
    pub a: usize,
    pub symbol: String,
    pub name: String,
    pub parity: String,
}

#[derive(Serialize)]
pub struct EngineInfo {
    pub name: String,
    pub version: String,
    pub commit: String,
    pub binary: String,
}

impl EngineInfo {
    pub fn current(binary: &str) -> Self {
        Self {
            name: "hecke-engine".to_string(),
            version: env!("CARGO_PKG_VERSION").to_string(),
            commit: option_env!("GIT_SHA").unwrap_or("unknown").to_string(),
            binary: binary.to_string(),
        }
    }
}
