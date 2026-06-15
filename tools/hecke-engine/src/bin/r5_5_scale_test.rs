//! R5.5 scaling sanity-check binary: run the canonical-T_w solver
//! at increasing n with filtration cutoff and identity anchor.
//! Reports SDP scale + solver status + run time per (n, L) pair.
//!
//! Usage:
//!   cargo run --release --bin r5-5-scale-test

use hecke_engine::sdp_solve_canonical_t_w::{
    solve_canonical_t_w, LinearAnchor,
};
use std::time::Instant;

fn main() {
    let q = 1.1097;
    println!("══════════════════════════════════════════════════════════════════════");
    println!("  R5.5 scaling sanity check (canonical-T_w SDP, identity anchor)");
    println!("══════════════════════════════════════════════════════════════════════");
    println!();

    // Each row: (n, optional cutoff, max_secs)
    let cases: Vec<(usize, Option<u32>, f64)> = vec![
        (3, None, 5.0),
        (3, Some(2), 5.0),
        (4, Some(2), 30.0),
        (4, Some(3), 60.0),
        (5, Some(2), 60.0),
        (5, Some(3), 120.0),
        (6, Some(2), 60.0),
        (8, Some(2), 60.0),
        (10, Some(2), 120.0),
        (12, Some(2), 300.0),
    ];

    for (n, cutoff, max_secs) in cases {
        let identity: Vec<usize> = (1..=n).collect();
        let anchors = vec![LinearAnchor::SingleCoefficient {
            perm: identity.clone(),
            target: 1.0,
        }];
        let label = format!(
            "H_{} cutoff={}",
            n,
            cutoff.map_or("∞".to_string(), |c| c.to_string())
        );
        let t0 = Instant::now();
        let report = solve_canonical_t_w(n, q, &anchors, cutoff);
        let dt = t0.elapsed().as_secs_f64();
        let truncated = if dt > max_secs {
            "  (over budget!)"
        } else {
            ""
        };
        println!(
            "  {:18} n_vars={:5}  n_blocks={:3}  max_d={:5}  iters={:3}  status={:<32}  time={:.3}s{}",
            label,
            report.n_variables,
            report.n_psd_blocks,
            report.block_dims.iter().max().copied().unwrap_or(0),
            report.iterations,
            report.solver_status,
            dt,
            truncated,
        );
    }
}
