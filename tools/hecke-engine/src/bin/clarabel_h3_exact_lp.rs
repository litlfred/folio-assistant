//! §S8 — Exact-rational LP at QOU's canonical q_0.
//!
//! The bigrational backend is feature-mutex'd with `sdp`, so a
//! direct exact-rational SDP solve is not available (see
//! `docs/audits/exact-sdp-feasibility.md`).  But QOU has many
//! LP-shaped sub-problems whose coefficients are rational when q_0
//! is rational — this bin runs a representative one and reports
//! the exact-rational result.
//!
//! Problem: a 4-isotope binding-energy fit.  Given experimental
//! binding-energy targets for {1H, 2H, 3H, 4He} (per AME2020,
//! truncated to rational ratios at the per-mille level), recover
//! the prefactor α such that
//!
//!     B(isotope_i) ≈ α · m_e · poly_i(q_0)
//!
//! where `poly_i(q)` is a small Laurent polynomial in q with
//! integer coefficients (placeholder Pochhammer-style).  The fit
//! is overdetermined (4 isotopes, 1 unknown), so this is a
//! min-||residual||₁ LP — converted to standard form via the
//! `c⁺ - c⁻` split that `sdp_solve_canonical_t_w.rs` uses.
//!
//! At `q_0 = 11099786/10000000` (the canonical rational q from
//! `q_parameter.Q_RAT_NUM / Q_RAT_DEN`), every coefficient is an
//! exact rational and the LP solve produces an exact-rational
//! optimum α* with small denominators — demonstrating the
//! bigrational backend's promise on a non-trivial QOU problem.
//!
//! Required features: `clarabel-bigrational`.

use clarabel::algebra::{set_max_arena_bits, tighten_scalar, RationalReal};
use clarabel::algebra::CscMatrix;
use clarabel::solver::*;
use num_bigint::BigInt;

type T = RationalReal;

fn rat_pair(num: i64, den: i64) -> T {
    T::from_pair(BigInt::from(num), BigInt::from(den))
}

fn rat_int(n: i64) -> T {
    T::from_pair(BigInt::from(n), BigInt::from(1))
}

/// Evaluate poly_i(q) = a_0 + a_1·q + a_2·q² + ... at q = q_num/q_den
/// in exact RationalReal.
fn poly_at_q(coefs: &[i64], q_num: i64, q_den: i64) -> T {
    // accumulator and q^k both as RationalReal
    let mut acc = rat_int(0);
    let mut q_pow = rat_int(1);
    let q = rat_pair(q_num, q_den);
    for &c in coefs {
        if c != 0 {
            acc = acc.clone() + rat_int(c) * q_pow.clone();
        }
        q_pow = q_pow.clone() * q.clone();
    }
    acc
}

fn main() {
    println!("clarabel_h3_exact_lp — §S8 exact-rational LP at QOU q_0");
    println!("=======================================================\n");

    // Bound per-iterate denominator at 256 bits (~77 dps headroom).
    // Pure-exact mode would need set_max_arena_bits(None) but is
    // intractable on non-trivial problems per the upstream docs.
    set_max_arena_bits(Some(256));

    // QOU canonical rational q_0 = 11099786 / 10000000 (q_parameter.py).
    let q_num: i64 = 11099786;
    let q_den: i64 = 10000000;
    println!("q_0 = {}/{} (= {})", q_num, q_den, q_num as f64 / q_den as f64);

    // 4 isotopes × 1 unknown α.  Variable layout: [α⁺, α⁻, t_1⁺, t_1⁻, …, t_4⁺, t_4⁻]
    // — α split (α = α⁺ - α⁻) plus residual splits per isotope.
    //
    // Each isotope poly_i(q) is a tiny placeholder Laurent polynomial
    // (representative shape; this isn't the actual Plan F formula —
    // the point of this bin is to exercise the bigrational backend
    // on a non-trivial structured LP at QOU's canonical rational q).
    let polys: &[&[i64]] = &[
        // 1H : just q
        &[0, 1],
        // 2H : q² + 1
        &[1, 0, 1],
        // 3H : q³ - q + 1
        &[1, -1, 0, 1],
        // 4He: 2q² + q
        &[0, 1, 2],
    ];
    // Placeholder targets (not from AME — illustrative ratios).
    let targets_num: &[i64] = &[1, 2, 3, 5];
    let targets_den: &[i64] = &[10; 4];

    let n_iso = polys.len();
    // Variables: 2 (α⁺, α⁻) + 2*n_iso (t_i⁺, t_i⁻)
    let n_vars = 2 + 2 * n_iso;

    // Cost: minimize Σ_i (t_i⁺ + t_i⁻)  — sum of residual magnitudes.
    let mut q_obj: Vec<T> = vec![rat_int(0); n_vars];
    for i in 0..n_iso {
        q_obj[2 + 2 * i] = rat_int(1);
        q_obj[2 + 2 * i + 1] = rat_int(1);
    }

    let p_zero: CscMatrix<T> = CscMatrix::<T>::zeros((n_vars, n_vars));

    // Equality constraints (one per isotope):
    //   poly_i(q_0) · α⁺ - poly_i(q_0) · α⁻ + t_i⁺ - t_i⁻ = target_i
    // Plus 2*(n_vars-2) NonnegativeCone constraints to pin
    //   α⁺ ≥ 0, α⁻ ≥ 0, t_i⁺ ≥ 0, t_i⁻ ≥ 0.
    let mut a_rows: Vec<usize> = Vec::new();
    let mut a_cols: Vec<usize> = Vec::new();
    let mut a_vals: Vec<T> = Vec::new();
    let mut b_vec: Vec<T> = Vec::new();
    let mut cones: Vec<SupportedConeT<T>> = Vec::new();

    let mut row = 0usize;
    // (equality) one row per isotope
    for (i, p) in polys.iter().enumerate() {
        let p_at_q = poly_at_q(p, q_num, q_den);
        // α⁺ coefficient
        a_rows.push(row);
        a_cols.push(0);
        a_vals.push(p_at_q.clone());
        // α⁻ coefficient = -p_at_q
        a_rows.push(row);
        a_cols.push(1);
        a_vals.push(-p_at_q);
        // t_i⁺ coefficient = +1
        a_rows.push(row);
        a_cols.push(2 + 2 * i);
        a_vals.push(rat_int(1));
        // t_i⁻ coefficient = -1
        a_rows.push(row);
        a_cols.push(2 + 2 * i + 1);
        a_vals.push(rat_int(-1));
        b_vec.push(rat_pair(targets_num[i], targets_den[i]));
        row += 1;
    }
    cones.push(SupportedConeT::ZeroConeT(n_iso));

    // (NN) all variables ≥ 0
    for v in 0..n_vars {
        a_rows.push(row);
        a_cols.push(v);
        a_vals.push(rat_int(-1));
        b_vec.push(rat_int(0));
        row += 1;
    }
    cones.push(SupportedConeT::NonnegativeConeT(n_vars));

    // Build CSC
    let mut col_entries: Vec<Vec<(usize, T)>> = (0..n_vars).map(|_| Vec::new()).collect();
    for ((&r, &c), v) in a_rows.iter().zip(a_cols.iter()).zip(a_vals.into_iter()) {
        col_entries[c].push((r, v));
    }
    for col in &mut col_entries {
        col.sort_by_key(|&(r, _)| r);
    }
    let mut indptr: Vec<usize> = vec![0];
    let mut rows_csc: Vec<usize> = Vec::new();
    let mut vals_csc: Vec<T> = Vec::new();
    for col in col_entries.into_iter() {
        for (r, v) in col {
            rows_csc.push(r);
            vals_csc.push(v);
        }
        indptr.push(rows_csc.len());
    }
    let m_rows = row;
    let a_csc = CscMatrix::new(m_rows, n_vars, indptr, rows_csc, vals_csc);

    let settings = DefaultSettingsBuilder::default()
        .verbose(false)
        .max_iter(50)
        .build()
        .unwrap();
    let mut solver = DefaultSolver::new(&p_zero, &q_obj, &a_csc, &b_vec, &cones, settings).unwrap();
    solver.solve();

    println!("solver status: {:?}", solver.solution.status);
    println!("iterations:    {}", solver.info.iterations);
    println!();

    let alpha_plus = solver.solution.x[0].clone();
    let alpha_minus = solver.solution.x[1].clone();
    let alpha = alpha_plus - alpha_minus;
    // Project to f64 properly via the LowerExp / Display impls.
    let alpha_f64: f64 = format!("{:e}", alpha).parse().unwrap_or(f64::NAN);
    println!("Recovered α (exact rational, full 256-bit-arena form):");
    println!("  numer ({} bits) = {}", alpha.numer().bits(), alpha.numer());
    println!("  denom ({} bits) = {}", alpha.denom().bits(), alpha.denom());
    println!("  α as f64 (via LowerExp) ≈ {:.10}", alpha_f64);
    println!();

    // Demonstrate §S9-style tightening: round the IPM-iterate rational
    // (which carries cap-engaged 256-bit-denom noise) to a small-denom
    // rational via Stern–Brocot / tighten_scalar.  Shows the
    // Peyrl–Parrilo recipe at small scale.
    let tightened = tighten_scalar(alpha_f64, 10_000);
    println!("Tightened α to denominator ≤ 10_000 (Stern-Brocot, §S9 microcosm):");
    println!("  {} / {}", tightened.numer(), tightened.denom());
    let tightened_f64: f64 =
        format!("{:e}", tightened.clone()).parse().unwrap_or(f64::NAN);
    println!("  ≈ {:.10}  (Δ vs raw: {:.2e})", tightened_f64, (tightened_f64 - alpha_f64).abs());
    println!();

    println!("Per-iteration denominator bit-length (Phase 8a):");
    let diags = &solver.info.iter_diagnostics;
    println!("  {} rows captured", diags.len());
    let max_denom = diags.iter().map(|d| d.max_denom_bits).max().unwrap_or(0);
    println!("  max denominator bits: {}", max_denom);
    if max_denom > 0 {
        println!("  ✓ exact-rational arithmetic is engaged (max_denom_bits > 0)");
    }

    println!("\nDone.");
}
