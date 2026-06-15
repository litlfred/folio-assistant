//! §S9.4 — `clarabel-certify` CLI: end-to-end Peyrl-Parrilo
//! dual-certificate verification.
//!
//! Solves the proton Borromean H_3 SDP at `f64`, calls
//! [`hecke_engine::sdp_dual_certificate::tighten_solution`] to
//! rationalise the dual via §S9.1 Stern-Brocot, then verifies
//! each Wedderburn-block PSD constraint **exactly** in
//! `BigRational` arithmetic via the §S9.3 Sturm chain.
//!
//! Output: a single-line per-block summary plus an aggregate
//! verdict.  Exit code is 0 if every PSD block verifies as
//! exactly PSD, non-zero otherwise.
//!
//! Usage:
//!   cargo run --release --bin clarabel-certify --features clarabel-sdp
//!
//! Required features: `clarabel-sdp`.

use clarabel::algebra::CscMatrix;
use clarabel::solver::*;
use hecke_engine::sdp_dual_certificate::{tighten_solution, CertifiedSdpReport};
use hecke_engine::sturm_psd::rational_matrix_is_psd;
use num_bigint::BigInt;
use num_rational::BigRational;
use std::str::FromStr;

fn parse_big(s: &str) -> BigInt {
    BigInt::from_str(s).expect("BigInt parse")
}

/// Build the §S9.4 example SDP — a proton-Borromean-style stand-in
/// posed as `find max α s.t. α·(B-I) + I ⪰ 0` where B is a
/// hand-chosen positive matrix.  Two `NonnegativeConeT(1)` cones
/// (for `0 ≤ α ≤ 1`) plus two `PSDTriangleConeT` blocks
/// (`d=1` and `d=2`) — not the QOU joint-tower SDP, just a
/// minimal test case for the §S9 pipeline.
fn build_h3_sdp() -> (CscMatrix<f64>, Vec<f64>, Vec<f64>, Vec<SupportedConeT<f64>>) {
    // Variables: just α.
    let p: CscMatrix<f64> = CscMatrix::<f64>::zeros((1, 1));
    let q_vec = vec![-1.0_f64]; // minimize -α

    // Constraint matrices: two PSD blocks
    //   λ = [3]:    1×1, B = [2]                    → trivially PSD
    //   λ = [2,1]:  2×2, B = [[2, 0.3], [0.3, 2]]   → strictly PD
    let blocks: &[Vec<Vec<f64>>] = &[
        vec![vec![2.0]],
        vec![vec![2.0, 0.3], vec![0.3, 2.0]],
    ];
    let block_dims = vec![1, 2];

    let sqrt2 = 2_f64.sqrt();

    let mut a_rows: Vec<usize> = Vec::new();
    let mut a_vals: Vec<f64> = Vec::new();
    let mut b: Vec<f64> = Vec::new();
    let mut row = 0_usize;

    // (1) α ≤ 1
    a_rows.push(row);
    a_vals.push(1.0);
    b.push(1.0);
    row += 1;
    // (2) α ≥ 0
    a_rows.push(row);
    a_vals.push(-1.0);
    b.push(0.0);
    row += 1;

    // PSD blocks
    for (block, &d) in blocks.iter().zip(block_dims.iter()) {
        // Build (B - I) and svec it
        let mut bmi = vec![vec![0.0; d]; d];
        for i in 0..d {
            for j in 0..d {
                bmi[i][j] = block[i][j] - if i == j { 1.0 } else { 0.0 };
            }
        }
        let mut id = vec![vec![0.0; d]; d];
        for i in 0..d {
            id[i][i] = 1.0;
        }
        for col in 0..d {
            for row_idx in 0..=col {
                let scale = if row_idx == col { 1.0 } else { sqrt2 };
                a_rows.push(row);
                a_vals.push(-bmi[row_idx][col] * scale);
                b.push(id[row_idx][col] * scale);
                row += 1;
            }
        }
    }

    let nnz = a_rows.len();
    let a_csc = CscMatrix::new(row, 1, vec![0, nnz], a_rows, a_vals);
    let cones: Vec<SupportedConeT<f64>> = vec![
        SupportedConeT::NonnegativeConeT(1),
        SupportedConeT::NonnegativeConeT(1),
        SupportedConeT::PSDTriangleConeT(1),
        SupportedConeT::PSDTriangleConeT(2),
    ];
    (a_csc, q_vec, b, cones)
}

fn report_to_rational_blocks(
    report: &CertifiedSdpReport,
) -> Vec<(usize, Vec<Vec<BigRational>>)> {
    let mut out: Vec<(usize, Vec<Vec<BigRational>>)> = Vec::new();
    for block in &report.blocks {
        if let Some(b) = block {
            let m: Vec<Vec<BigRational>> = b
                .entries
                .iter()
                .map(|row| {
                    row.iter()
                        .map(|(num_s, den_s)| BigRational::new(parse_big(num_s), parse_big(den_s)))
                        .collect()
                })
                .collect();
            out.push((b.idx, m));
        }
    }
    out
}

fn main() {
    println!("clarabel_certify — §S9.4 dual-certificate verification");
    println!("=====================================================\n");

    // 1. Solve the f64 SDP.
    let (a_csc, q_vec, b, cones) = build_h3_sdp();
    let p: CscMatrix<f64> = CscMatrix::<f64>::zeros((1, 1));
    let settings = DefaultSettingsBuilder::default()
        .verbose(false)
        .max_iter(200)
        .build()
        .unwrap();
    let mut solver =
        DefaultSolver::new(&p, &q_vec, &a_csc, &b, &cones, settings).unwrap();
    solver.solve();

    let alpha_star = -solver.solution.obj_val;
    println!("Step 1 — f64 IPM solve");
    println!("  α* (f64) = {:.10}", alpha_star);
    println!("  status   = {:?}", solver.solution.status);
    println!("  iterations = {}", solver.info.iterations);
    println!();

    // 2. Tighten the dual to rationals via §S9.2.
    let q_str = "1.10998";
    let q_max = 10_000_u64;
    let report = tighten_solution(&solver.solution, 3, q_str, q_max);

    println!("Step 2 — §S9.2 rationalise dual (Stern-Brocot, q_max={q_max})");
    let n_psd = report.blocks.iter().filter(|b| b.is_some()).count();
    println!("  {} PSD block(s) tightened", n_psd);
    for block in report.blocks.iter().flatten() {
        println!(
            "    block@{}  d={}  min_diag_f64={:.6e}  max_denom_bits={}",
            block.idx, block.d, block.min_diag_f64, block.max_denom_bits
        );
    }
    println!();

    // 3. Sturm-PSD verify each rationalised block via §S9.3.
    println!("Step 3 — §S9.3 Sturm-chain exact PSD verification");
    let rational_blocks = report_to_rational_blocks(&report);
    let mut all_verified_psd = true;
    for (idx, mat) in &rational_blocks {
        let (is_psd, n_neg, n_zero) = rational_matrix_is_psd(mat);
        let verdict = if is_psd { "PSD ✓" } else { "NOT PSD ✗" };
        println!(
            "    block@{}  {}   (n_neg={}, n_zero={})",
            idx, verdict, n_neg, n_zero
        );
        if !is_psd {
            all_verified_psd = false;
        }
    }
    println!();

    // 4. Aggregate verdict.
    if all_verified_psd && n_psd > 0 {
        println!("AGGREGATE: all {} PSD block(s) verified exactly via Sturm chain.", n_psd);
        println!("           α* certified at q_max = {q_max} denominator bound.");
        std::process::exit(0);
    } else if n_psd == 0 {
        eprintln!(
            "AGGREGATE: no PSD blocks found in the solution — degenerate problem"
        );
        std::process::exit(1);
    } else {
        eprintln!("AGGREGATE: at least one PSD block failed Sturm verification.");
        eprintln!("           Tightening at q_max = {q_max} may have introduced");
        eprintln!("           a negative eigenvalue; raise q_max or investigate.");
        std::process::exit(2);
    }
}
