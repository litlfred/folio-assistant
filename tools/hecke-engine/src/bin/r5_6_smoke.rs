//! R5.6 Wedderburn-block decomposition smoke test.
//!
//! Compares `solve_per_block` (Strategy A) against the monolithic
//! `solve_canonical_t_w` at H_3 and H_4.  Both should agree to
//! numerical precision (≤ 1e-4 absolute).
//!
//! Pass criteria:
//!   1. Both solvers report Solved / AlmostSolved status.
//!   2. Every recovered c_w agrees within 1e-4.
//!   3. `l1_norm` agrees within 1e-3.
//!
//! See `R5_6_DECOMPOSITION_PLAN.md` §"Smoke-test plan".

use hecke_engine::sdp_per_block::solve_per_block;
use hecke_engine::sdp_solve_canonical_t_w::{LinearAnchor, solve_canonical_t_w};
use std::collections::BTreeMap;

fn compare_reports(
    label: &str,
    mono: &hecke_engine::sdp_solve_canonical_t_w::SolverReport,
    perb: &hecke_engine::sdp_solve_canonical_t_w::SolverReport,
    abs_tol: f64,
) -> bool {
    println!("\n──── {} ────", label);
    println!("  monolithic  : status={}  iter={}  l1={:.6}  |support|={}",
             mono.solver_status, mono.iterations, mono.l1_norm, mono.c_solved.len());
    println!("  per-block   : status={}  iter={}  l1={:.6}  |support|={}",
             perb.solver_status, perb.iterations, perb.l1_norm, perb.c_solved.len());

    let mono_ok = mono.solver_status.contains("Solved");
    let perb_ok = perb.solver_status.contains("Solved");
    if !mono_ok {
        println!("  ✗ monolithic FAILED to solve");
        return false;
    }
    if !perb_ok {
        println!("  ✗ per-block  FAILED to solve");
        return false;
    }

    // Compare c_w entries
    let mut all_perms: BTreeMap<Vec<usize>, ()> = BTreeMap::new();
    for k in mono.c_solved.keys() { all_perms.insert(k.clone(), ()); }
    for k in perb.c_solved.keys() { all_perms.insert(k.clone(), ()); }

    let mut max_diff: f64 = 0.0;
    let mut worst_perm: Vec<usize> = Vec::new();
    for perm in all_perms.keys() {
        let m = mono.c_solved.get(perm).copied().unwrap_or(0.0);
        let p = perb.c_solved.get(perm).copied().unwrap_or(0.0);
        let d = (m - p).abs();
        if d > max_diff {
            max_diff = d;
            worst_perm = perm.clone();
        }
    }
    println!("  max |Δc_w|  : {:.3e}  at perm {:?}", max_diff, worst_perm);

    let l1_diff = (mono.l1_norm - perb.l1_norm).abs();
    println!("  Δ‖c‖_1     : {:.3e}", l1_diff);

    if max_diff < abs_tol && l1_diff < 10.0 * abs_tol {
        println!("  ✓ PASS");
        true
    } else {
        println!("  ✗ FAIL  (tol = {:.0e})", abs_tol);
        false
    }
}

fn main() {
    let q = 1.1097;
    let abs_tol = 1e-4;
    println!("══════════════════════════════════════════════════════════════════════");
    println!("  R5.6 smoke: per-block ≡ monolithic at q = {}", q);
    println!("══════════════════════════════════════════════════════════════════════");

    let mut all_pass = true;

    // ─── H_3, c_id = 1 ───
    {
        let anchors = [LinearAnchor::SingleCoefficient {
            perm: vec![1, 2, 3],
            target: 1.0,
        }];
        let mono = solve_canonical_t_w(3, q, &anchors, None);
        let perb = solve_per_block(3, q, &anchors, None);
        if !compare_reports("H_3, c_id=1, all perms", &mono, &perb, abs_tol) {
            all_pass = false;
        }
    }

    // ─── H_3 with cutoff L=2 ───
    {
        let anchors = [LinearAnchor::SingleCoefficient {
            perm: vec![1, 2, 3],
            target: 1.0,
        }];
        let mono = solve_canonical_t_w(3, q, &anchors, Some(2));
        let perb = solve_per_block(3, q, &anchors, Some(2));
        if !compare_reports("H_3, c_id=1, cutoff L=2", &mono, &perb, abs_tol) {
            all_pass = false;
        }
    }

    // ─── H_4, c_id = 1 ───
    {
        let anchors = [LinearAnchor::SingleCoefficient {
            perm: vec![1, 2, 3, 4],
            target: 1.0,
        }];
        let mono = solve_canonical_t_w(4, q, &anchors, None);
        let perb = solve_per_block(4, q, &anchors, None);
        if !compare_reports("H_4, c_id=1, all perms", &mono, &perb, abs_tol) {
            all_pass = false;
        }
    }

    // ─── H_4 with cutoff L=3 ───
    {
        let anchors = [LinearAnchor::SingleCoefficient {
            perm: vec![1, 2, 3, 4],
            target: 1.0,
        }];
        let mono = solve_canonical_t_w(4, q, &anchors, Some(3));
        let perb = solve_per_block(4, q, &anchors, Some(3));
        if !compare_reports("H_4, c_id=1, cutoff L=3", &mono, &perb, abs_tol) {
            all_pass = false;
        }
    }

    println!("\n══════════════════════════════════════════════════════════════════════");
    if all_pass {
        println!("  ✓ R5.6 smoke: ALL PASS");
        std::process::exit(0);
    } else {
        println!("  ✗ R5.6 smoke: FAIL");
        std::process::exit(1);
    }
}
