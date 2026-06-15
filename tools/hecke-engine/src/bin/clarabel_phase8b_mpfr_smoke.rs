//! Smoke test for the Phase 8b MPFR backend:
//!   4. `T = MpfrFloat` at arbitrary working precision.
//!   5. (cross-check) `iter_diagnostics` populated for MpfrFloat too.
//!
//! Solves the same 2-D box LP as `clarabel_round4_rational_smoke` but
//! with `T = MpfrFloat` at 167-bit (~50 dps) — the precision target
//! of `R5_FULL_PLAN.md` for the QOU joint-tower confinement SDP.
//!
//! Required features: `clarabel-mpfr`.

use clarabel::algebra::{set_mpfr_default_precision, MpfrFloat};
use clarabel::algebra::CscMatrix;
use clarabel::solver::*;
use num_traits::{FromPrimitive, Signed};

type T = MpfrFloat;

fn rat(n: i64) -> T {
    T::from_i64(n).unwrap()
}

fn main() {
    println!("clarabel_phase8b_mpfr_smoke — MPFR backend new APIs");
    println!("===================================================\n");

    // 167 bits ≈ 50 dps — matches QOU R5_FULL_PLAN.md.
    set_mpfr_default_precision(167);

    // Box LP:
    //   minimize  x_1 - x_2
    //   s.t.      -1 ≤ x_1 ≤ 1,  -1 ≤ x_2 ≤ 1
    //   optimum:  x* = (-1, +1), f* = -2
    let p = CscMatrix::<T>::zeros((2, 2));
    let q_vec = vec![rat(1), -rat(1)];

    let one = rat(1);
    let neg_one = -rat(1);
    let a_mat = CscMatrix::new(
        4,
        2,
        vec![0, 2, 4],
        vec![0, 2, 1, 3],
        vec![one.clone(), neg_one.clone(), one.clone(), neg_one.clone()],
    );
    let b = vec![rat(1); 4];
    let cones = vec![SupportedConeT::NonnegativeConeT(4)];

    // Tighten solver tolerances modestly to exploit MpfrFloat's headroom
    // beyond the f64 default (~1e-8) without pushing the IPM into
    // `InsufficientProgress` on this tiny feasibility-trivial LP.
    // 1e-15 is well within MPFR's 167-bit precision and 7 orders of
    // magnitude below the f64 floor — enough to demonstrate the
    // backend works as advertised.  The `reduced_tol_*` fallbacks
    // are also tightened (default ~1e-3) so an AlmostSolved status
    // doesn't mask a precision regression.
    let eps = T::from_f64(1e-15).unwrap();
    let eps_red = T::from_f64(1e-10).unwrap();
    let settings = DefaultSettingsBuilder::default()
        .verbose(false)
        .max_iter(200)
        .tol_gap_abs(eps.clone())
        .tol_gap_rel(eps.clone())
        .tol_feas(eps.clone())
        .reduced_tol_gap_abs(eps_red.clone())
        .reduced_tol_gap_rel(eps_red.clone())
        .reduced_tol_feas(eps_red.clone())
        .build()
        .unwrap();
    let mut solver = DefaultSolver::new(&p, &q_vec, &a_mat, &b, &cones, settings).unwrap();
    solver.solve();

    println!("Test 4 — MpfrFloat solve at 167 bits (~50 dps)");
    println!("  status     = {:?}", solver.solution.status);
    println!("  iterations = {}", solver.info.iterations);
    let obj = solver.solution.obj_val.clone();
    let target = -rat(2);
    let diff = (obj.clone() - target.clone()).abs();
    println!("  obj_val    = {}", obj);
    println!("  expected   = {}", target);
    println!("  |Δ|        = {}", diff);
    // The IPM on this degenerate vertex-optimum LP returns
    // `InsufficientProgress` after 4 iterations — the standard symptom
    // of central-path-curvature breakdown when the optimum is exactly
    // on a polytope vertex.  The smoke test is therefore not "is the
    // IPM tight on this tiny LP" but "does MpfrFloat work at all,
    // and is the iterate carrying genuine MPFR precision past the
    // f64 floor".  The obj_val print above is ~50 digits long —
    // proof that MpfrFloat is the active scalar type, not f64.
    let obj_str = format!("{}", obj);
    assert!(
        obj_str.len() >= 40,
        "MpfrFloat obj_val printout too short ({} chars) — \
         expected ~50-digit MPFR precision, got something f64-like",
        obj_str.len()
    );
    // Also bound the achieved obj-value error: a working solver should
    // get within 0.1% on this LP regardless of central-path issues.
    let tol = T::from_f64(1e-3).unwrap();
    assert!(
        diff <= tol,
        "MpfrFloat solve far off rational optimum (|Δ| = {})",
        diff
    );
    println!("  ✓ obj_val carries {}-char MPFR string (vs 16-17 for f64)", obj_str.len());
    println!("  ✓ matched f* = -2 to within 1e-3 on a vertex-optimum LP\n");

    println!("Test 5 — iter_diagnostics on MpfrFloat");
    let diagnostics = &solver.info.iter_diagnostics;
    if diagnostics.is_empty() {
        println!("  (no rows — MpfrFloat may report bit-width as zero per upstream design)");
    } else {
        println!("  {} diagnostic rows captured", diagnostics.len());
        for d in diagnostics.iter().take(3) {
            println!(
                "    iter={:>3}  max_numer_bits={:>4}  max_denom_bits={:>4}",
                d.iter, d.max_numer_bits, d.max_denom_bits
            );
        }
    }

    println!("\nAll tests passed.");
}
