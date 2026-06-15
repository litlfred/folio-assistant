//! Wenzl-bridge Markov-trace CLI.
//!
//! Computes `χ^λ(β_1 ⊗ β_2 ⊗ ... ⊗ β_k)` (Hecke character of a
//! tensor-product braid) via the LR decomposition implemented in
//! [`hecke_engine::wenzl_lr`].  This is the bridge that makes
//! `|tr_M(⁴He)|` at H_12 tractable: instead of evaluating
//! Hoefsmit seminormal at strand count 12 (`p(12) = 77` partitions
//! × dim 7700 × 47 crossings ≈ 10^13 ops), we evaluate each
//! sub-character at its native (lower) strand count and combine
//! via LR.
//!
//! Input (stdin or `--in PATH`): JSON of the form
//!
//! ```json
//! {
//!   "lambda": [3, 3, 3, 2, 1],
//!   "factors": [
//!     {"label": "proton",  "n_strands": 3, "word": [[1, 1], [-1, 2]]},
//!     {"label": "proton",  "n_strands": 3, "word": [[1, 1], [-1, 2]]},
//!     {"label": "neutron", "n_strands": 3, "word": [[-1, 1], [1, 2]]},
//!     {"label": "neutron", "n_strands": 3, "word": [[-1, 1], [1, 2]]}
//!   ]
//! }
//! ```
//!
//! Output: JSON with the Laurent polynomial in `q`, plus the
//! per-partition contribution (`chi_lambda_terms`) for diagnostics.
//!
//! Usage:
//! ```text
//! hecke-tr-m-wenzl-lr --in spec.json --out witness.json
//! cat spec.json | hecke-tr-m-wenzl-lr > witness.json
//! ```

use clap::Parser;
use hecke_engine::laurent_poly_q::LaurentPolyQ;
use hecke_engine::seminormal::partitions_of;
use hecke_engine::wenzl_lr::{
    averaging_denominator, chi_via_lr_kway, Crossing, WenzlFactor,
};
use serde::{Deserialize, Serialize};
use std::fs;
use std::io::{self, Read};
use std::path::PathBuf;
use std::time::Instant;

#[derive(Parser, Debug)]
#[command(name = "hecke-tr-m-wenzl-lr", version)]
struct Args {
    /// Path to the input JSON spec; if absent, reads stdin.
    #[arg(long)]
    r#in: Option<PathBuf>,
    /// Path to the output JSON; if absent, writes to stdout.
    #[arg(long)]
    out: Option<PathBuf>,
    /// If set, compute `χ^λ` for *every* partition `λ ⊢ n` where
    /// `n = Σ n_strands(factor)`, not just the `lambda` in the
    /// spec.  Useful for computing the full Markov trace
    /// `tr_M = Σ_λ y_λ · χ^λ` downstream.
    #[arg(long)]
    all_partitions: bool,
}

#[derive(Serialize, Deserialize, Debug)]
struct FactorSpec {
    label: String,
    n_strands: usize,
    /// `[(sign, generator_1based), ...]` where sign ∈ {-1, 0, +1}:
    /// +1 = σ (positive), -1 = σ⁻¹, 0 = averaged half-sum
    /// `0.5·(σ + σ⁻¹)`.  Averaged crossings appear in the canonical
    /// atomic-braid decomposition on inter-nucleon arcs.
    word: Vec<(i32, u32)>,
}

#[derive(Serialize, Deserialize, Debug)]
struct InputSpec {
    /// Single-target partition (ignored when `--all-partitions`).
    #[serde(default)]
    lambda: Vec<usize>,
    factors: Vec<FactorSpec>,
}

#[derive(Serialize)]
struct ChiTerm {
    lambda: Vec<usize>,
    chi_polynomial: String,
    chi_q_one: String,
    duration_ms: u128,
}

#[derive(Serialize)]
struct Output {
    computation: &'static str,
    description: &'static str,
    schema_version: u32,
    total_strands: usize,
    n_factors: usize,
    factor_labels: Vec<String>,
    all_partitions: bool,
    /// `2^Σ k_i` where `k_i` is the count of averaged crossings in
    /// factor `i`.  The `chi_polynomial` values below are the
    /// **unnormalised** 2^k sum; the genuine averaged Markov trace
    /// is `Σ_λ y_λ · chi_polynomial(λ) / averaging_denominator`.
    averaging_denominator: String,
    chi_lambda_terms: Vec<ChiTerm>,
}

fn read_input(args: &Args) -> io::Result<InputSpec> {
    let raw = match &args.r#in {
        Some(p) => fs::read_to_string(p)?,
        None => {
            let mut buf = String::new();
            io::stdin().read_to_string(&mut buf)?;
            buf
        }
    };
    serde_json::from_str(&raw).map_err(|e| {
        io::Error::new(io::ErrorKind::InvalidData, format!("JSON parse: {}", e))
    })
}

fn run(args: Args) -> io::Result<()> {
    let spec = read_input(&args)?;
    let factors: Vec<WenzlFactor> = spec
        .factors
        .iter()
        .map(|f| WenzlFactor {
            label: f.label.clone(),
            n_strands: f.n_strands,
            word: f
                .word
                .iter()
                .map(|(s, g)| (Crossing::from_sign(*s), *g))
                .collect(),
        })
        .collect();
    let total: usize = factors.iter().map(|f| f.n_strands).sum();
    let labels: Vec<String> = factors.iter().map(|f| f.label.clone()).collect();
    let avg_denom = averaging_denominator(&factors);

    let lambdas: Vec<Vec<usize>> = if args.all_partitions {
        partitions_of(total)
    } else {
        vec![spec.lambda.clone()]
    };

    let chi_terms: Vec<ChiTerm> = lambdas
        .iter()
        .map(|lambda| {
            let t0 = Instant::now();
            let chi = chi_via_lr_kway(lambda, &factors);
            let dt = t0.elapsed().as_millis();
            let q1 = chi.evaluate_at_one();
            ChiTerm {
                lambda: lambda.clone(),
                chi_polynomial: chi.pretty(),
                chi_q_one: q1.to_string(),
                duration_ms: dt,
            }
        })
        .collect();

    let out = Output {
        computation: "hecke-tr-m-wenzl-lr",
        description:
            "Wenzl LR bridge: χ^λ(β_1 ⊗ ... ⊗ β_k) computed via \
             Σ c^λ_{...} · χ^μ(β_1) · χ^ν(β_2) · ... at each \
             factor's native strand count.  Avoids the full \
             Hoefsmit evaluation at H_{Σ n_i}.",
        schema_version: 1,
        total_strands: total,
        n_factors: factors.len(),
        factor_labels: labels,
        all_partitions: args.all_partitions,
        averaging_denominator: avg_denom.to_string(),
        chi_lambda_terms: chi_terms,
    };
    let json = serde_json::to_string_pretty(&out).map_err(|e| {
        io::Error::new(io::ErrorKind::Other, format!("JSON ser: {}", e))
    })?;
    match args.out {
        Some(p) => fs::write(p, json)?,
        None => println!("{}", json),
    }
    Ok(())
}

fn main() {
    let args = Args::parse();
    if let Err(e) = run(args) {
        eprintln!("hecke-tr-m-wenzl-lr: {}", e);
        std::process::exit(1);
    }
}

// Suppress the dead-code allow LaurentPolyQ might give us.
#[allow(dead_code)]
fn _force_link() -> LaurentPolyQ {
    LaurentPolyQ::zero()
}
