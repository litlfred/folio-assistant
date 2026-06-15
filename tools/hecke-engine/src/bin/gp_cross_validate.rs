//! Cross-validate `chi_lambda_via_gp_hoefsmit` (Geck-Pfeiffer basis
//! expansion path) against `chi_lambda_braid` (Hoefsmit seminormal
//! direct path) at f64 precision.
//!
//! Purpose: gate the larger Geck-Pfeiffer implementation work
//! (candidates C-full and D per the Hoefsmit optimization audit) by
//! verifying that the existing GP scaffold produces correct χ^λ
//! values on test atomic braid words.
//!
//! **Averaged-crossing handling (C-full Step 1, 2026-05-18)**: GP's
//! `braid_to_hecke_with_avg` now handles averaged crossings (sign ==
//! 0) via the doubled half-sum
//! `(σ + σ⁻¹) · x = 2 σ x − h x` (computed as a single Hecke element,
//! no 2^k basis branching) plus a deferred `2^k` divisor applied at
//! the χ^λ output step.  This binary covers averaged-crossing test
//! cases (n=3, 4) and confirms GP matches the Hoefsmit seminormal
//! `chi_lambda_braid` (which uses direct `σ − h/2 · I` substitution).
//!
//! Test cases (covered by the `cases` vector in `main`):
//!   - n=3: σ_1; σ_1 σ_2; σ_1 σ_2 σ_1; mixed σ_1 σ_2⁻¹
//!   - n=3: averaged-only words (1 avg, 3 avgs)
//!   - n=4: 5-crossing positive word
//!   - n=4: mixed pos/neg/avg word (5 crossings, 2 avgs)
//!   - n=6: 10-crossing alternating σ / σ⁻¹ word
//!
//! Output: JSON to stdout with per-(partition, atom-word) rows:
//!   `{ "n": N, "lambda": [...], "word": [...],
//!     "chi_via_seminormal": f64, "chi_via_gp": f64,
//!     "abs_diff": f64, "rel_diff": f64 }`
//!
//! Exit 0 if all `rel_diff < 1e-12`; exit 1 if any partition exceeds
//! that tolerance.  Tolerance chosen at f64 precision floor; GP and
//! seminormal share the same `chi_lambda_braid` primitive for per-T_w
//! evaluation, so they should match to round-off.
//!
//! Reference: `docs/audits/2026-05-18-hoefsmit-matrix-product-optimization.md`
//! §C "Geck-Pfeiffer factorization (already scaffolded — biggest potential)".

use hecke_engine::geck_pfeiffer::{
    braid_to_hecke, chi_lambda_via_gp_hoefsmit, chi_lambda_via_gp_hoefsmit_all_partitions_mpfr,
    chi_lambda_via_gp_hoefsmit_mpfr,
};
use hecke_engine::seminormal::{chi_lambda_braid, partitions_of};
use hecke_engine::seminormal_mpfr::chi_lambda_braid_mpfr;

/// f64 representation of the substrate parameter `q_0` (calibrated
/// per `prop:three-calibration-inputs`).  The canonical 50-dps
/// decimal lives in
/// `folio-assistant/computations/q_parameter.py::Q_50_DIGIT_STR`; this
/// literal is the f64 truncation (Python `float(Q_50_DIGIT_STR)`).
///
/// **Bug fix (2026-05-18, PR #725 Copilot review)**: the original
/// literal `1.10977…` was a typo (transposed digits, wrong suffix).
/// Cross-validation tautologically passed at the wrong q because both
/// seminormal and GP used the same wrong literal. Corrected to match
/// the f64 cast of Q_50_DIGIT_STR:
/// - Canonical 50-dps: `1.10997859555418057528159407960950937799328227995870`
/// - f64 cast:         `1.1099785955541805`
///
/// **Drift discipline**: if Q_50_DIGIT_STR's leading f64-representable
/// digits drift, update this literal in lock-step. There is no
/// shared Rust constant module for substrate parameters yet (flagged
/// as future C-full follow-up).
const Q0_F64: f64 = 1.1099785955541805;

#[derive(serde::Serialize)]
struct Row {
    n: usize,
    lambda: Vec<usize>,
    word_str: String,
    word_len: usize,
    chi_via_seminormal: f64,
    chi_via_gp: f64,
    abs_diff: f64,
    rel_diff: f64,
}

/// MPFR cross-validation row (C-full Step 2): compares GP and
/// seminormal at MPFR precision via decimal-string output.
#[derive(serde::Serialize)]
struct MpfrRow {
    n: usize,
    lambda: Vec<usize>,
    word_str: String,
    chi_via_seminormal_mpfr: String,
    chi_via_gp_mpfr: String,
    /// abs diff at MPFR precision, as decimal string.
    abs_diff_mpfr: String,
    /// abs diff cast to f64 for quick numeric comparison.
    abs_diff_f64: f64,
}

#[derive(serde::Serialize, Clone)]
struct SparsityRow {
    n: usize,
    word_str: String,
    word_len: usize,
    /// |basis expansion of T_β| — number of distinct S_n basis elements
    /// with non-zero coefficient in T_β = Σ c_w T_w.
    basis_size: usize,
    /// n! = upper bound on basis size.
    n_factorial: usize,
    /// Sparsity factor = n! / basis_size; higher = better GP win.
    sparsity_factor: f64,
}

fn word_str(word: &[(i32, u32)]) -> String {
    let parts: Vec<String> = word
        .iter()
        .map(|&(s, g)| {
            let suffix = match s {
                1 => "".to_string(),
                -1 => "⁻¹".to_string(),
                _ => format!("^{}", s),
            };
            format!("σ_{}{}", g, suffix)
        })
        .collect();
    parts.join(" ")
}

fn validate(n: usize, word: &[(i32, u32)], q: f64) -> Vec<Row> {
    let mut rows = Vec::new();
    for lambda in partitions_of(n) {
        let chi_semi = chi_lambda_braid(&lambda, word, q);
        let chi_gp = chi_lambda_via_gp_hoefsmit(&lambda, n, word, q);
        let abs_diff = (chi_semi - chi_gp).abs();
        let denom = chi_semi.abs().max(1.0);
        let rel_diff = abs_diff / denom;
        rows.push(Row {
            n,
            lambda,
            word_str: word_str(word),
            word_len: word.len(),
            chi_via_seminormal: chi_semi,
            chi_via_gp: chi_gp,
            abs_diff,
            rel_diff,
        });
    }
    rows
}

/// MPFR cross-validation: compares the MPFR GP path
/// (`chi_lambda_via_gp_hoefsmit_mpfr`) against the MPFR Hoefsmit
/// seminormal path (`chi_lambda_braid_mpfr`) at the same dps.
fn validate_mpfr(
    n: usize,
    word: &[(i32, u32)],
    q_str: &str,
    dps: u32,
) -> Vec<MpfrRow> {
    use rug::Float;
    let prec = (dps as f64 * 3.322 + 16.0) as u32;
    let mut rows = Vec::new();
    for lambda in partitions_of(n) {
        let chi_semi_str = chi_lambda_braid_mpfr(&lambda, word, q_str, dps);
        let chi_gp_str = chi_lambda_via_gp_hoefsmit_mpfr(
            &lambda, n, word, q_str, dps,
        );
        // Compute |chi_semi - chi_gp| at MPFR precision. Parse
        // failures here would silently corrupt the diff to 0 and
        // mask real disagreements — fail loudly instead (per Copilot
        // review on PR #725).
        let chi_semi = Float::parse(&chi_semi_str)
            .map(|p| Float::with_val(prec, p))
            .unwrap_or_else(|_| {
                panic!(
                    "validate_mpfr: chi_semi_str is not a valid MPFR decimal: {chi_semi_str:?}"
                )
            });
        let chi_gp = Float::parse(&chi_gp_str)
            .map(|p| Float::with_val(prec, p))
            .unwrap_or_else(|_| {
                panic!(
                    "validate_mpfr: chi_gp_str is not a valid MPFR decimal: {chi_gp_str:?}"
                )
            });
        let diff = Float::with_val(prec, &chi_semi - &chi_gp);
        let abs_diff = Float::with_val(prec, diff.abs());
        let abs_diff_f64: f64 = abs_diff.to_f64();
        rows.push(MpfrRow {
            n,
            lambda,
            word_str: word_str(word),
            chi_via_seminormal_mpfr: chi_semi_str,
            chi_via_gp_mpfr: chi_gp_str,
            abs_diff_mpfr: abs_diff.to_string_radix(10, Some(dps as usize)),
            abs_diff_f64,
        });
    }
    rows
}

fn main() {
    // Substrate q_0 — see Q0_F64 module-level const above for
    // provenance and drift discipline.
    let q0: f64 = Q0_F64;

    // Test cases — covers positive, mixed σ-σ⁻¹, and (after C-full
    // Step 1) averaged crossings via `hecke_mul_ts_averaged_right`.
    let cases: Vec<(usize, Vec<(i32, u32)>, &str)> = vec![
        (3, vec![(1, 1)], "σ_1 at n=3"),
        (3, vec![(1, 1), (1, 2)], "σ_1 σ_2 at n=3"),
        (3, vec![(1, 1), (1, 2), (1, 1)], "σ_1 σ_2 σ_1 at n=3"),
        (3, vec![(1, 1), (-1, 2)], "σ_1 σ_2⁻¹ at n=3 (mixed)"),
        (4, vec![(1, 1), (1, 2), (1, 3), (1, 1), (1, 2)], "5-crossing at n=4"),
        (
            6,
            vec![
                (1, 1), (1, 2), (1, 3), (1, 4), (1, 5),
                (-1, 1), (-1, 2), (-1, 3), (-1, 4), (-1, 5),
            ],
            "alt σ/σ⁻¹ at n=6 (10 crossings)",
        ),
        // ── C-full Step 1 averaged-crossing tests ──
        // Single averaged crossing — basic sanity for the
        // half-sum extension.
        (3, vec![(0, 1)], "(σ_1+σ_1⁻¹)/2 at n=3 (1 avg)"),
        // Averaged + positive interleave.
        (3, vec![(1, 1), (0, 2)], "σ_1 · avg(σ_2) at n=3"),
        // Multiple averages — tests the 2^k normalisation.
        (
            3,
            vec![(0, 1), (0, 2), (0, 1)],
            "avg(σ_1) avg(σ_2) avg(σ_1) at n=3 (3 avgs)",
        ),
        // Mixed positive / negative / averaged at n=4.
        (
            4,
            vec![(1, 1), (0, 2), (-1, 3), (0, 1), (1, 2)],
            "mixed-w-avg at n=4 (2 avgs in 5 crossings)",
        ),
    ];

    let mut all_rows = Vec::new();
    let mut sparsity_rows = Vec::new();
    let mut mpfr_rows = Vec::new();
    let tolerance = 1.0e-12_f64;
    // C-full Step 2: MPFR cross-validation tolerance.  At dps=50 the
    // round-off floor is ~10⁻⁵⁰; we use 10⁻⁴⁵ to allow for accumulated
    // error across the per-T_w sum + 2^k normalisation.
    let mpfr_tolerance = 1.0e-45_f64;
    let mpfr_dps = 50_u32;
    // Canonical 50-dps substrate q_0 from
    // folio-assistant/computations/q_parameter.py::Q_50_DIGIT_STR
    // (fixed in PR #725 per Copilot review: prior `1.10977…` literal
    // was a typo, making cross-validation tautologically agree at
    // the wrong q.)
    let q_str_50dps = "1.10997859555418057528159407960950937799328227995870";
    let mut worst: f64 = 0.0;
    let mut worst_mpfr: f64 = 0.0;
    let mut failures = 0_usize;
    let mut mpfr_failures = 0_usize;

    fn n_factorial(n: usize) -> usize {
        (1..=n).product()
    }

    for (n, word, label) in &cases {
        eprintln!("→ validating: {}", label);
        let rows = validate(*n, word, q0);
        for r in &rows {
            if r.rel_diff > worst {
                worst = r.rel_diff;
            }
            if r.rel_diff > tolerance {
                failures += 1;
                eprintln!(
                    "  FAIL λ={:?}: chi_semi={:.6e}  chi_gp={:.6e}  rel_diff={:.3e}",
                    r.lambda, r.chi_via_seminormal, r.chi_via_gp, r.rel_diff
                );
            }
        }
        // Sparsity probe: how many basis elements in the T_β expansion?
        // This is the key cost driver for GP (vs n! upper bound).
        let basis = braid_to_hecke(*n, word);
        let basis_size = basis.len();
        let nf = n_factorial(*n);
        let sparsity = nf as f64 / basis_size.max(1) as f64;
        sparsity_rows.push(SparsityRow {
            n: *n,
            word_str: word_str(word),
            word_len: word.len(),
            basis_size,
            n_factorial: nf,
            sparsity_factor: sparsity,
        });
        eprintln!(
            "  sparsity: |T_β basis| = {}  vs  n! = {}  →  factor {:.2}×",
            basis_size, nf, sparsity
        );
        all_rows.extend(rows);

        // C-full Step 3: also cross-validate the all-partitions
        // GP path against per-partition GP MPFR.  This confirms the
        // basis-expansion + per-T_w cache (built once per λ) gives
        // bit-identical output to the simpler per-partition loop.
        let gp_all = chi_lambda_via_gp_hoefsmit_all_partitions_mpfr(
            *n, word, q_str_50dps, mpfr_dps,
        );
        for (lam, chi_all_str) in &gp_all {
            let chi_solo_str = chi_lambda_via_gp_hoefsmit_mpfr(
                lam, *n, word, q_str_50dps, mpfr_dps,
            );
            if chi_all_str != &chi_solo_str {
                eprintln!(
                    "  GP-all-partitions MISMATCH λ={:?}: solo={} all={}",
                    lam, chi_solo_str, chi_all_str
                );
                mpfr_failures += 1;
            }
        }

        // C-full Step 2: also cross-validate at MPFR precision.
        // This exercises chi_lambda_via_gp_hoefsmit_mpfr against
        // chi_lambda_braid_mpfr (both at dps=50).
        let mpfr_case = validate_mpfr(*n, word, q_str_50dps, mpfr_dps);
        for r in &mpfr_case {
            if r.abs_diff_f64 > worst_mpfr {
                worst_mpfr = r.abs_diff_f64;
            }
            if r.abs_diff_f64 > mpfr_tolerance {
                mpfr_failures += 1;
                eprintln!(
                    "  MPFR FAIL λ={:?}: abs_diff_f64 = {:.3e}",
                    r.lambda, r.abs_diff_f64
                );
            }
        }
        mpfr_rows.extend(mpfr_case);
    }

    let summary = serde_json::json!({
        "binary": "gp-cross-validate",
        "purpose": "C-gate + C-full Step 2: cross-validate Geck-Pfeiffer χ^λ against Hoefsmit seminormal (f64 + MPFR-50dps)",
        "tolerance_rel_diff": tolerance,
        "worst_rel_diff": worst,
        "n_cases": cases.len(),
        "n_partition_rows": all_rows.len(),
        "n_failures": failures,
        "mpfr_dps": mpfr_dps,
        "mpfr_tolerance_abs": mpfr_tolerance,
        "mpfr_worst_abs": worst_mpfr,
        "mpfr_n_failures": mpfr_failures,
        "mpfr_q_str": q_str_50dps,
        "q": q0,
        "rows": all_rows,
        "mpfr_rows": mpfr_rows,
        "sparsity_rows": sparsity_rows,
    });

    println!("{}", serde_json::to_string_pretty(&summary).unwrap());

    if failures > 0 || mpfr_failures > 0 {
        eprintln!(
            "✗ f64: {} failures / {} rows (worst rel_diff = {:.3e}); \
             MPFR: {} failures / {} rows (worst abs_diff = {:.3e})",
            failures,
            all_rows.len(),
            worst,
            mpfr_failures,
            mpfr_rows.len(),
            worst_mpfr,
        );
        std::process::exit(1);
    } else {
        eprintln!(
            "✓ f64: all {} rows ≤ {:.0e} rel (worst {:.3e})",
            all_rows.len(),
            tolerance,
            worst
        );
        eprintln!(
            "✓ MPFR-{}dps: all {} rows ≤ {:.0e} abs (worst {:.3e})",
            mpfr_dps,
            mpfr_rows.len(),
            mpfr_tolerance,
            worst_mpfr
        );
    }
}
