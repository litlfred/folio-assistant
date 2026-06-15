//! Canonical χ^λ CLI for atomic braids.
//!
//! Computes `χ^λ(β_canonical(Z, N))` for every partition `λ ⊢ n`
//! at a single braid word, using
//! [`hecke_engine::wenzl_lr::chi_lambda_canonical_h_n_f64`] (f64
//! Hoefsmit seminormal evaluation with averaged-crossing
//! expansion).
//!
//! Unlike `hecke-tr-m-wenzl-lr` (which factors via LR and computes
//! a *tensor-product* `β_1 ⊗ β_2 ⊗ ...` — wrong for canonical
//! atomic braids per the 2026-05-17 audit), this binary takes the
//! FULL canonical word at H_n and evaluates χ^λ directly. The
//! averaged-crossing expansion is the only "non-trivial" step.
//!
//! Used by the canonical |tr_M| consumer (Σ_λ y_λ · χ^λ) to bypass
//! the broken tensor-product path. Reference:
//! `docs/audits/2026-05-17-knot-fusion-step1-audit.md`.
//!
//! Input (stdin or `--in PATH`): JSON
//!
//! ```json
//! {
//!   "n_strands": 12,
//!   "q": 1.1099785955541805,
//!   "label": "helium-4",
//!   "word": [[1, 1], [-1, 2], [0, 3], ...]
//! }
//! ```
//!
//! `word`: `[(sign, gen_1based), ...]`; sign ∈ {-1, 0, +1};
//! 0 = averaged half-sum `0.5·(σ + σ⁻¹)`.
//!
//! Output: per-partition χ^λ values (unnormalised — caller divides
//! by `averaging_denominator = 2^k` for `k` averaged crossings).
//!
//! Usage:
//! ```text
//! hecke-canonical-chi --in spec.json --out witness.json
//! cat spec.json | hecke-canonical-chi > witness.json
//! ```

use clap::Parser;
use hecke_engine::wenzl_lr::{
    averaging_denominator, chi_lambda_canonical_all_partitions_f64,
    chi_lambda_canonical_all_partitions_mpfr,
    Crossing, CrossingPair, WenzlFactor,
};
use serde::{Deserialize, Serialize};
use std::fs;
use std::io::{self, Read};
use std::path::PathBuf;
use std::time::Instant;

#[derive(Parser, Debug)]
#[command(name = "hecke-canonical-chi", version)]
struct Args {
    /// Path to the input JSON spec; if absent, reads stdin.
    #[arg(long)]
    r#in: Option<PathBuf>,
    /// Path to the output JSON; if absent, writes to stdout.
    #[arg(long)]
    out: Option<PathBuf>,
    /// MPFR precision in decimal digits.  Default 50 (matches the
    /// canonical QOU mpfr-50dps convention; per user direction
    /// "only do arbitrary precision w/ ≥ 50 dps").  Set to 0 to
    /// fall back to the f64 path (legacy / fast prototyping only).
    #[arg(long, default_value_t = 50)]
    dps: u32,
}

#[derive(Serialize, Deserialize, Debug)]
struct InputSpec {
    n_strands: usize,
    /// f64 q value (used only on the legacy `--dps 0` fallback path).
    #[serde(default)]
    q: f64,
    /// 50+-dps decimal-string q value (used on the default MPFR path).
    /// Required when `--dps > 0` (default 50).
    #[serde(default)]
    q_str: String,
    label: String,
    /// `[(sign, gen_1based), ...]` with sign ∈ {-1, 0, +1}
    /// (0 = averaged half-sum).
    word: Vec<(i32, u32)>,
}

#[derive(Serialize)]
struct ChiTerm {
    lambda: Vec<usize>,
    /// Decimal string at `dps` precision (MPFR path) or
    /// `format!("{}", f64)` (legacy f64 path).
    chi_q_normalised: String,
    chi_q_unnormalised: String,
    precision_dps: u32,
}

#[derive(Serialize)]
struct Output {
    computation: &'static str,
    description: &'static str,
    schema_version: u32,
    label: String,
    n_strands: usize,
    n_crossings: usize,
    n_averaged_crossings: usize,
    averaging_denominator: String,
    q: f64,
    n_partitions: usize,
    duration_ms: u128,
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
    let word: Vec<CrossingPair> = spec
        .word
        .iter()
        .map(|(s, g)| (Crossing::from_sign(*s), *g))
        .collect();
    // Wrap as a single-factor "WenzlFactor" to reuse the
    // averaging_denominator helper.
    let factor = WenzlFactor {
        label: spec.label.clone(),
        n_strands: spec.n_strands,
        word: word.clone(),
    };
    // **Direct-averaging path (2026-05-18, PR #682)**: the underlying
    // `chi_lambda_canonical_h_n_{f64,mpfr}` now substitutes the averaged
    // matrix `(σ + σ⁻¹)/2 = σ - h/2 · I` directly per crossing, so the
    // χ value returned is ALREADY the half-sum-averaged χ^λ. The
    // legacy 2^k sub-word enumeration would have returned the
    // *unnormalised* sum and required a downstream divide by
    // `averaging_denominator = 2^k`; with direct substitution that
    // post-hoc division is no longer needed.
    //
    // We report `averaging_denominator = "1"` so downstream consumers
    // (canonical_tr_m_via_rust.py: `tr_M = ... / averaging_denom`)
    // divide by 1 (a no-op). `n_averaged_crossings` is kept as
    // informational metadata.
    let _legacy_avg_denom = averaging_denominator(&[factor]);
    let avg_denom: u64 = 1;
    let n_avg = word.iter().filter(|(c, _)| *c == Crossing::Averaged).count();
    let t0 = Instant::now();
    // Branch: MPFR path (default, dps >= 50) vs f64 fallback (--dps 0).
    let dps = args.dps;
    let chi_terms: Vec<ChiTerm> = if dps == 0 {
        let chi_results = chi_lambda_canonical_all_partitions_f64(
            spec.n_strands, &word, spec.q,
        );
        let denom_f = avg_denom as f64;
        chi_results
            .iter()
            .map(|(lam, chi)| ChiTerm {
                lambda: lam.clone(),
                chi_q_unnormalised: chi.to_string(),
                chi_q_normalised: (chi / denom_f).to_string(),
                precision_dps: 17,  // f64 ~15-17 sig figs
            })
            .collect()
    } else {
        // MPFR path: q passed as decimal string; preserves the
        // canonical 50-dps q_0 precision through the FFI.
        let q_str = if spec.q_str.is_empty() {
            // Per CLAUDE.md "only do arbitrary precision w/ >= 50 dps":
            // if MPFR mode (--dps > 0) is requested but no decimal
            // string was provided, refuse to silently downgrade to
            // f64 (which would cap precision at ~15-17 digits).
            // Re-run with `--dps 0` for the f64 fallback path or
            // pass `q_str` to keep MPFR precision.
            eprintln!(
                "hecke-canonical-chi: MPFR mode (--dps {dps}) requires \
                 `q_str` in the JSON spec to preserve the requested \
                 precision. Pass `q_str` (decimal string), or re-run \
                 with `--dps 0` for the f64 fallback path."
            );
            std::process::exit(2);
        } else {
            spec.q_str.clone()
        };
        let chi_results = chi_lambda_canonical_all_partitions_mpfr(
            spec.n_strands, &word, &q_str, dps,
        );
        // Normalise by averaging_denominator at MPFR precision.
        let denom_str = avg_denom.to_string();
        let prec = (dps as f64 * 3.322 + 16.0) as u32;
        chi_results
            .iter()
            .map(|(lam, chi_str)| {
                use rug::Float;
                // Parse failures here would corrupt the χ^λ output
                // (returning 0 silently misrepresents non-zero values
                // as zero downstream). Fail explicitly per
                // CLAUDE.md "fail explicitly rather than returning a
                // default value like zero".
                let chi = Float::parse(chi_str)
                    .map(|p| Float::with_val(prec, p))
                    .unwrap_or_else(|e| {
                        panic!(
                            "hecke-canonical-chi: failed to parse chi value \
                             {chi_str:?} for partition {lam:?}: {e}"
                        )
                    });
                let denom = Float::parse(&denom_str)
                    .map(|p| Float::with_val(prec, p))
                    .unwrap_or_else(|e| {
                        panic!(
                            "hecke-canonical-chi: failed to parse averaging \
                             denominator {denom_str:?}: {e}"
                        )
                    });
                let normalised = Float::with_val(prec, &chi / &denom);
                ChiTerm {
                    lambda: lam.clone(),
                    chi_q_unnormalised: chi_str.clone(),
                    chi_q_normalised: normalised
                        .to_string_radix(10, Some(dps as usize)),
                    precision_dps: dps,
                }
            })
            .collect()
    };
    let dt = t0.elapsed().as_millis();
    let out = Output {
        computation: "hecke-canonical-chi",
        description:
            "Canonical χ^λ at H_n for an atomic braid via direct \
             Hoefsmit seminormal evaluation with averaged-crossing \
             expansion.  Default path is MPFR at `--dps` (>=50 per \
             the QOU mpfr-50dps convention); legacy f64 fallback \
             available via `--dps 0`.  Avoids the broken tensor- \
             product LR composition of `hecke-tr-m-wenzl-lr`; this \
             is the primitive used by the canonical |tr_M| consumer. \
             Reference: docs/audits/2026-05-17-knot-fusion-step1-audit.md.",
        schema_version: 1,
        label: spec.label,
        n_strands: spec.n_strands,
        n_crossings: word.len(),
        n_averaged_crossings: n_avg,
        averaging_denominator: avg_denom.to_string(),
        q: spec.q,
        n_partitions: chi_terms.len(),
        duration_ms: dt,
        chi_lambda_terms: chi_terms,
    };
    let json = serde_json::to_string_pretty(&out)
        .map_err(|e| io::Error::new(io::ErrorKind::Other, format!("JSON ser: {}", e)))?;
    match args.out {
        Some(p) => fs::write(p, json)?,
        None => println!("{}", json),
    }
    Ok(())
}

fn main() {
    let args = Args::parse();
    if let Err(e) = run(args) {
        eprintln!("hecke-canonical-chi: {}", e);
        std::process::exit(1);
    }
}
