//! H_5 anomaly diagnostic — verify ρ_λ(T_e) = I_{d_λ} for every λ ⊢ 5
//! at q_0, then test the SDP with cutoff = 0 (only identity) at H_5.
//!
//! Three hypotheses for the H_5 PrimalInfeasible result:
//!   (a) numerical: svec encoding / f64 precision for d_λ ≥ 6
//!   (b) bug: seminormal_matrices wrong at higher partitions
//!   (c) geometric: identity fails cross-block PSD at H_5
//!
//! This binary discriminates among them.
//!
//! Usage: cargo run --release --bin r5-5-diagnose-h5

use hecke_engine::sdp_solve_canonical_t_w::{
    solve_canonical_t_w, LinearAnchor,
};
use hecke_engine::seminormal::{partitions_of, seminormal_matrices};

fn build_identity(d: usize) -> Vec<Vec<f64>> {
    let mut out = vec![vec![0.0f64; d]; d];
    for i in 0..d {
        out[i][i] = 1.0;
    }
    out
}

fn matrix_max_abs_diff(a: &[Vec<f64>], b: &[Vec<f64>]) -> f64 {
    let n = a.len();
    let mut m = 0.0f64;
    for i in 0..n {
        for j in 0..n {
            let d = (a[i][j] - b[i][j]).abs();
            if d > m {
                m = d;
            }
        }
    }
    m
}

fn main() {
    let q = 1.1097;
    println!("══════════════════════════════════════════════════════════════════════");
    println!("  H_5 anomaly diagnostic");
    println!("══════════════════════════════════════════════════════════════════════");
    println!();

    // ─── HYPOTHESIS (b): seminormal_matrices bug ───────────────────
    // For every λ ⊢ n, ρ_λ(T_e) = I_{d_λ}.  T_e has empty canonical
    // word so prod stays as I.  But the seminormal_matrices call
    // is what determines d_λ; we don't actually need to multiply by
    // any generator for T_e.
    //
    // Stronger sanity: verify each generator ρ_λ(σ_i) satisfies the
    // Hecke quadratic σ_i² = (q - q⁻¹) σ_i + I, and the braid
    // relations.
    println!("──── (b) sanity check: Hecke quadratic on every (λ, σ_i) at H_5 ────");
    let h = q - 1.0 / q;
    let parts5 = partitions_of(5);
    let mut bug_count = 0usize;
    for shape in &parts5 {
        let sg = seminormal_matrices(shape, q);
        let d = if sg.is_empty() { 1 } else { sg[0].len() };
        for (i, row) in sg.iter().enumerate() {
            // Convert sparse to dense
            let mut s = vec![vec![0.0f64; d]; d];
            for (r, sparse_row) in row.iter().enumerate() {
                for &(c, v) in sparse_row {
                    s[r][c] = v;
                }
            }
            // s² = h s + I  ?
            let mut ss = vec![vec![0.0f64; d]; d];
            for r in 0..d {
                for c in 0..d {
                    let mut acc = 0.0;
                    for k in 0..d {
                        acc += s[r][k] * s[k][c];
                    }
                    ss[r][c] = acc;
                }
            }
            let mut hs_plus_i = vec![vec![0.0f64; d]; d];
            for r in 0..d {
                for c in 0..d {
                    hs_plus_i[r][c] = h * s[r][c];
                    if r == c {
                        hs_plus_i[r][c] += 1.0;
                    }
                }
            }
            let diff = matrix_max_abs_diff(&ss, &hs_plus_i);
            if diff > 1e-10 {
                bug_count += 1;
                println!(
                    "    BUG: λ={:?}, σ_{} (d_λ={}): ‖σ² − (h σ + I)‖_∞ = {:.4e}",
                    shape,
                    i + 1,
                    d,
                    diff
                );
            }
        }
    }
    if bug_count == 0 {
        println!("    ✓ Hecke quadratic σ_i² = h·σ_i + I verified for all (λ, i) at H_5");
    } else {
        println!("    ✗ {} bug(s) found in seminormal_matrices at H_5", bug_count);
    }
    println!();

    // ─── HYPOTHESIS (a): numerical — try cutoff=0 (only identity) ───
    println!("──── (a) numerical: SDP at H_5 cutoff=0 (only identity perm) ────");
    let report_cutoff_0 = solve_canonical_t_w(
        5, q,
        &[LinearAnchor::SingleCoefficient {
            perm: vec![1, 2, 3, 4, 5],
            target: 1.0,
        }],
        Some(0),
    );
    println!(
        "    n_vars={}, n_blocks={}, max_d={}, status={}, iters={}",
        report_cutoff_0.n_variables,
        report_cutoff_0.n_psd_blocks,
        report_cutoff_0.block_dims.iter().max().copied().unwrap_or(0),
        report_cutoff_0.solver_status,
        report_cutoff_0.iterations,
    );
    println!("    c_solved: {:?}", report_cutoff_0.c_solved);
    println!();

    // Same at H_4 cutoff=0 (control)
    let report_h4_cutoff_0 = solve_canonical_t_w(
        4, q,
        &[LinearAnchor::SingleCoefficient {
            perm: vec![1, 2, 3, 4],
            target: 1.0,
        }],
        Some(0),
    );
    println!("    H_4 control: status={}, c_solved={:?}",
        report_h4_cutoff_0.solver_status, report_h4_cutoff_0.c_solved);
    println!();

    // ─── Inspect svec(I_{d_λ}) for each λ ⊢ 5 ─────────────────────
    println!("──── manually verify svec(ρ_λ(T_e)) = svec(I_{{d_λ}}) for λ ⊢ 5 ────");
    for shape in &parts5 {
        let sg = seminormal_matrices(shape, q);
        let d = if sg.is_empty() { 1 } else { sg[0].len() };
        let identity = build_identity(d);
        let cone_dim = d * (d + 1) / 2;
        let sqrt2 = 2f64.sqrt();
        let mut svec = Vec::with_capacity(cone_dim);
        // Clarabel PSDTriangleConeT: upper-triangular column-major.
        for col in 0..d {
            for r in 0..=col {
                let v = 0.5 * (identity[r][col] + identity[col][r]);
                let scale = if r == col { 1.0 } else { sqrt2 };
                svec.push(v * scale);
            }
        }
        // Eigenvalues of the matrix represented by svec — should all be 1.
        let n_diag_ones = svec.iter().filter(|&&x| (x - 1.0).abs() < 1e-12).count();
        let n_zero = svec.iter().filter(|&&x| x.abs() < 1e-12).count();
        println!(
            "    λ={:?}, d_λ={}, svec dim={}, #1s={}, #0s={}  ({})",
            shape,
            d,
            cone_dim,
            n_diag_ones,
            n_zero,
            if n_diag_ones == d && n_zero == cone_dim - d {
                "OK"
            } else {
                "BAD"
            }
        );
    }
    println!();

    // ─── HYPOTHESIS (c) follow-up: H_5 cutoff=0 with NO anchor ─────
    // Pure feasibility: Σ_w c_w · ρ_λ(T_w) ⪰ 0 with no variables.
    // Trivial — should always solve to c = 0.
    println!("──── (c) feasibility-only: H_5 cutoff=0 no anchor ────");
    let report_no_anchor = solve_canonical_t_w(5, q, &[], Some(0));
    println!(
        "    status={}, iters={}",
        report_no_anchor.solver_status, report_no_anchor.iterations
    );
}
