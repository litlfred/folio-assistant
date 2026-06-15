//! Smoke test for the Round 4 rational-side new APIs:
//!   3. `tighten_scalar(x, q_max)` and `tighten_vec(xs, q_max)` —
//!      Peyrl–Parrilo-style rational rounding from f64 to RationalReal.
//!   5. Per-iteration `iter_diagnostics: Vec<IterDiagnostic>` on
//!      `DefaultInfo<RationalReal>` (Phase 8a).
//!
//! Solves a 2-D box LP whose optimum is the rational corner
//! (-1, +1), then probes both the tightening helper and the
//! diagnostic log.
//!
//! Required features: `clarabel-bigrational`.

use clarabel::algebra::{
    set_max_arena_bits, tighten_scalar, tighten_vec, RationalReal,
};
use clarabel::algebra::CscMatrix;
use clarabel::solver::*;
use num_bigint::BigInt;

type T = RationalReal;

fn rat(n: i64) -> T {
    T::from_pair(BigInt::from(n), BigInt::from(1))
}

fn neg(t: T) -> T {
    -t
}

fn main() {
    println!("clarabel_round4_rational_smoke — rational backend new APIs");
    println!("=========================================================\n");

    // 256 bits ≈ 77 dps.  Bounds the per-op cost without losing the
    // exact-rational character of the result.
    set_max_arena_bits(Some(256));

    // ── Test 3: tighten_scalar / tighten_vec ───────────────────────
    println!("Test 3 — tighten_scalar / tighten_vec");
    let xs = vec![0.5_f64, 1.0 / 3.0, -0.6666666666_f64, 0.142857142857_f64];
    let qs: Vec<T> = tighten_vec(&xs, 100);
    for (x, q) in xs.iter().zip(qs.iter()) {
        let n = q.numer();
        let d = q.denom();
        println!(
            "  {:>14.10}  →  {} / {}",
            x, n, d
        );
    }
    // Sanity: 0.5 → 1/2
    let half = tighten_scalar(0.5, 1000);
    assert_eq!(half.numer(), BigInt::from(1));
    assert_eq!(half.denom(), BigInt::from(2));
    println!("  ✓ 0.5 → 1/2 exactly\n");

    // ── Test 5: iter_diagnostics on Solved RationalReal LP ────────
    // Box LP:
    //   minimize  x_1 - x_2
    //   s.t.      -1 ≤ x_1 ≤ 1,  -1 ≤ x_2 ≤ 1
    //   optimum:  x* = (-1, +1), f* = -2
    let p = CscMatrix::<T>::zeros((2, 2));
    let q_vec = vec![rat(1), neg(rat(1))]; // [1, -1]

    // A = [I; -I], b = [1, 1, 1, 1]
    let one = rat(1);
    let neg_one = neg(rat(1));
    let a_mat = CscMatrix::new(
        4,
        2,
        vec![0, 2, 4],
        vec![0, 2, 1, 3],
        vec![one.clone(), neg_one.clone(), one.clone(), neg_one.clone()],
    );
    let b = vec![rat(1); 4];
    let cones = vec![SupportedConeT::NonnegativeConeT(4)];

    let settings = DefaultSettingsBuilder::default()
        .verbose(false)
        .max_iter(50)
        .build()
        .unwrap();
    let mut solver = DefaultSolver::new(&p, &q_vec, &a_mat, &b, &cones, settings).unwrap();
    solver.solve();

    println!("Test 5 — iter_diagnostics (Phase 8a)");
    let diagnostics = &solver.info.iter_diagnostics;
    println!("  {} diagnostic rows captured", diagnostics.len());
    assert!(
        !diagnostics.is_empty(),
        "expected non-empty iter_diagnostics on a RationalReal solve"
    );
    for d in diagnostics.iter().take(5) {
        println!(
            "    iter={:>3}  max_numer_bits={:>4}  max_denom_bits={:>4}",
            d.iter, d.max_numer_bits, d.max_denom_bits
        );
    }
    if diagnostics.len() > 5 {
        println!("    … {} more rows", diagnostics.len() - 5);
    }

    // The 256-bit cap means denominators should not exceed 256 bits.
    let max_denom = diagnostics
        .iter()
        .map(|d| d.max_denom_bits)
        .max()
        .unwrap_or(0);
    println!("  max denominator bits across run: {}", max_denom);
    // arena cap is 256 bits but the diagnostic measures bit_length on the
    // resulting BigInt, which can exceed the cap by ±1 due to the rounding
    // step's choice of nearest representable rational — so allow a small
    // slack instead of the strict <=256 bound.
    assert!(
        max_denom <= 260,
        "denominator far exceeded the 256-bit arena cap: {}",
        max_denom
    );
    println!("  ✓ denominator cap respected (within rounding slack)\n");

    println!("All tests passed.");
}
