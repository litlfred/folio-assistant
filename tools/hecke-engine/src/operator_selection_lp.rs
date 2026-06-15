//! Operator-selection LP — generic over the Clarabel scalar.
//!
//! Mirrors `pyhecke.lp_dual_solver.solve_operator_selection_lp`
//! (`prop:operator-selection-lp`) but solves with Clarabel.  **Production
//! uses `MpfrFloat`** (167 bits ≈ 50 dps, the QOU L1 floor) — there is no
//! `f64` in production.  The function is generic over `F: FloatT` for ONE
//! reason: it lets a unit test solve the *same* LP with `f64` and with
//! `MpfrFloat` in-process and assert they agree, validating that the MPFR
//! backend introduces no discrepancy versus an independent float solve.
//!
//! Primal:
//! ```text
//!     min  t · x
//!     s.t. 1ᵀ x = n_target          (net constraint)
//!          G x ≥ 0                   (Frobenius positivity)
//!          x_i ≥ -M                  (boundedness)
//! ```
//! Dual variables are the binding-energy shadow prices: `y0` (net) and
//! `y_i ≥ 0` (Frobenius), with the active set `{ i : y_i > tol }`.
//!
//! ## Clarabel cone layout (this module's convention)
//!
//! Clarabel solves `min ½xᵀPx + qᵀx  s.t.  A x + s = b,  s ∈ K`.
//! We set `P = 0`, `q = t`, and stack three cone blocks in this order:
//!
//! | block | rows | `A` rows | `b` | cone |
//! |-------|------|----------|-----|------|
//! | net (eq)        | 1   | `1ᵀ`  | `n_target` | `ZeroConeT(1)` |
//! | Frobenius `Gx≥0`| `d` | `-G`  | `0`        | `NonnegativeConeT(d)` |
//! | bounds `x≥-M`   | `d` | `-I`  | `M·1`      | `NonnegativeConeT(d)` |
//!
//! KKT stationarity `q + Aᵀ z = 0` then reads
//! `t = -z_eq·1 + Gᵀ z_G + z_bound`, so the Python conventions map to
//! Clarabel's `z` as **`y0 = -z_eq`** and **`y_i = z_G[i]`**.  These
//! sign choices are *proved* by the `kkt_*` / `complementary_slackness`
//! unit tests below, not assumed.
//!
//! Required feature: `clarabel-mpfr`.

use clarabel::algebra::{set_mpfr_default_precision, CscMatrix, FloatT, MpfrFloat};
use clarabel::solver::*;
use num_traits::{FromPrimitive, Signed, Zero};
use std::fmt::Display;

/// Production scalar: a run-time-precision MPFR float (≈50 dps). The CLI and
/// every production caller use this. `f64` is used ONLY by the validation
/// tests, to confirm the MPFR solve agrees with an independent float solve.
pub type T = MpfrFloat;

/// 167 bits ≈ 50 decimal places — the QOU L1 compute floor.
pub const DEFAULT_PREC_BITS: u32 = 167;

/// Both sides of the operator-selection LP plus the strong-duality check.
/// Field names match `pyhecke.lp_dual_solver.LpDualResult.to_dict()`.
#[derive(Debug, Clone)]
pub struct OpSelLpResult<F> {
    pub x_star: Vec<F>,
    pub y0_star: F,
    pub y_star: Vec<F>,
    pub active_set: Vec<usize>,
    pub primal_obj: F,
    pub dual_obj: F,
    pub duality_gap: F,
    pub feasible: bool,
    pub status: String,
}

/// Solve the operator-selection LP, generic over the Clarabel scalar `F`
/// (`MpfrFloat` in production; `f64` only for cross-validation).
///
/// * `t`        — objective / Markov traces, length `d`.
/// * `g`        — Frobenius Gram, `d × d`, row-major (`g[i][j]`).
/// * `n_target` — net-constraint right-hand side.
/// * `m_bound`  — lower bound `-M` on each `x_i` (pass a large positive `M`).
/// * `dual_tol` — threshold above which a dual `y_i` counts as active.
/// * `prec_bits`— MPFR working precision in bits (167 ≈ 50 dps). Sets the
///   thread-local MPFR default; ignored (harmless) for non-MPFR `F`.
///
/// Returns primal `x*`, dual `(y0, y)`, the active set, both objectives,
/// the duality gap, and a feasibility flag + raw solver status string.
pub fn solve_operator_selection_lp<F: FloatT>(
    t: &[F],
    g: &[Vec<F>],
    n_target: &F,
    m_bound: &F,
    dual_tol: &F,
    prec_bits: u32,
) -> OpSelLpResult<F> {
    set_mpfr_default_precision(prec_bits);
    let d = t.len();
    assert_eq!(g.len(), d, "Gram row count {} != d {}", g.len(), d);
    for (i, row) in g.iter().enumerate() {
        assert_eq!(row.len(), d, "Gram row {i} has length {} != d {}", row.len(), d);
    }

    // P = 0 (linear program).
    let p_zero: CscMatrix<F> = CscMatrix::<F>::zeros((d, d));
    // q = t.
    let q_vec: Vec<F> = t.to_vec();

    // Row index ranges.
    //   row 0                : net equality
    //   rows 1 ..= d         : Frobenius  Gx ≥ 0   (A = -G)
    //   rows 1+d ..= 2d      : bounds     x ≥ -M   (A = -I)
    let m_rows = 1 + 2 * d;

    // Build A column-by-column (CSC). For column c the nonzeros are, in
    // ascending row order:
    //   (0,           +1)            — net
    //   (1+i,         -g[i][c])      — Frobenius, all i
    //   (1+d+c,       -1)            — bound (diagonal)
    let mut indptr: Vec<usize> = vec![0];
    let mut rows_csc: Vec<usize> = Vec::new();
    let mut vals_csc: Vec<F> = Vec::new();
    for c in 0..d {
        // net
        rows_csc.push(0);
        vals_csc.push(F::from_i64(1).unwrap());
        // Frobenius -g[i][c]
        for i in 0..d {
            rows_csc.push(1 + i);
            vals_csc.push(-g[i][c].clone());
        }
        // bound -1 (diagonal)
        rows_csc.push(1 + d + c);
        vals_csc.push(F::from_i64(-1).unwrap());
        indptr.push(rows_csc.len());
    }
    let a_csc = CscMatrix::new(m_rows, d, indptr, rows_csc, vals_csc);

    // b = [n_target, 0×d, M×d].
    let mut b_vec: Vec<F> = Vec::with_capacity(m_rows);
    b_vec.push(n_target.clone());
    for _ in 0..d {
        b_vec.push(F::zero());
    }
    for _ in 0..d {
        b_vec.push(m_bound.clone());
    }

    let cones: Vec<SupportedConeT<F>> = vec![
        SupportedConeT::ZeroConeT(1),
        SupportedConeT::NonnegativeConeT(d), // Gx ≥ 0
        SupportedConeT::NonnegativeConeT(d), // x ≥ -M
    ];

    // Tolerances: 1e-12 is achievable by BOTH the f64 and the MPFR IPM on
    // a well-conditioned LP (so the cross-validation test converges on
    // both), while still 4 orders tighter than SciPy HiGHS' f64 default
    // (~1e-8). MPFR can be pushed tighter via a custom settings build.
    let eps = F::from_f64(1e-12).unwrap();
    let eps_red = F::from_f64(1e-8).unwrap();
    let settings = DefaultSettingsBuilder::default()
        .verbose(false)
        .max_iter(200)
        .tol_gap_abs(eps.clone())
        .tol_gap_rel(eps.clone())
        .tol_feas(eps.clone())
        .reduced_tol_gap_abs(eps_red.clone())
        .reduced_tol_gap_rel(eps_red.clone())
        .reduced_tol_feas(eps_red)
        .build()
        .unwrap();

    let mut solver =
        DefaultSolver::new(&p_zero, &q_vec, &a_csc, &b_vec, &cones, settings).unwrap();
    solver.solve();

    let status = format!("{:?}", solver.solution.status);
    let feasible = matches!(
        solver.solution.status,
        SolverStatus::Solved | SolverStatus::AlmostSolved
    );

    let x_star: Vec<F> = solver.solution.x.clone();
    let z = &solver.solution.z;

    // Dual extraction per the cone layout above.
    let y0_star = -z[0].clone(); // y0 = -z_eq
    let y_star: Vec<F> = (0..d).map(|i| z[1 + i].clone()).collect(); // y_i = z_G[i]
    let active_set: Vec<usize> = (0..d).filter(|&i| y_star[i] > *dual_tol).collect();

    // primal_obj = t·x  (== solver.solution.obj_val).
    let mut primal_obj = F::zero();
    for c in 0..d {
        primal_obj = primal_obj + t[c].clone() * x_star[c].clone();
    }
    // dual_obj = n_target · y0  (matches the Python LpDualResult).
    let dual_obj = n_target.clone() * y0_star.clone();
    let duality_gap = (primal_obj.clone() - dual_obj.clone()).abs();

    OpSelLpResult {
        x_star,
        y0_star,
        y_star,
        active_set,
        primal_obj,
        dual_obj,
        duality_gap,
        feasible,
        status,
    }
}

/// Convert a Clarabel scalar to `f64` via its decimal `Display` (lossy —
/// for summary / JSON fields only; the full-precision value stays in `F`).
pub fn to_f64<F: Display>(v: &F) -> f64 {
    format!("{}", v).parse::<f64>().unwrap_or(f64::NAN)
}

/// JSON/FFI-ready result: `f64` summary fields PLUS full-precision decimal
/// strings.  This is what the JSON CLI and the PyO3 binding return, so
/// neither has to handle Clarabel scalar types directly.
#[derive(Debug, Clone)]
pub struct OpSelLpStringResult {
    pub x_star: Vec<f64>,
    pub y0_star: f64,
    pub y_star: Vec<f64>,
    pub active_set: Vec<usize>,
    pub primal_obj: f64,
    pub dual_obj: f64,
    pub duality_gap: f64,
    pub feasible: bool,
    pub status: String,
    pub x_star_str: Vec<String>,
    pub y0_star_str: String,
    pub y_star_str: Vec<String>,
    pub primal_obj_str: String,
    pub dual_obj_str: String,
    pub duality_gap_str: String,
    pub precision_bits: u32,
}

/// Parse a decimal string into an `MpfrFloat` at the current MPFR default
/// precision via the crate's `Deserialize` impl (wire format `(prec, s)`;
/// `prec = 0` means "use the thread-local default", set by the caller).
/// `rug::Float::parse` accepts plain decimals and `1e6` / `1e-9` forms.
fn parse_mpfr(s: &str) -> Result<MpfrFloat, String> {
    serde_json::from_value::<MpfrFloat>(serde_json::json!([0, s]))
        .map_err(|e| format!("cannot parse MPFR scalar {s:?}: {e}"))
}

/// String-in / string-out operator-selection LP — the production MPFR path
/// with decimal-string IO, so callers (the JSON CLI, the PyO3 wheel binding)
/// need no Clarabel types.  Inputs are decimal strings (carry full 50-dps
/// precision, not f64); `prec_bits` sets the MPFR working precision.
pub fn solve_operator_selection_lp_from_strings(
    t: &[String],
    g: &[Vec<String>],
    n_target: &str,
    m_bound: &str,
    dual_tol: &str,
    prec_bits: u32,
) -> Result<OpSelLpStringResult, String> {
    set_mpfr_default_precision(prec_bits);
    let t_m: Vec<MpfrFloat> = t.iter().map(|s| parse_mpfr(s)).collect::<Result<_, _>>()?;
    let g_m: Vec<Vec<MpfrFloat>> = g
        .iter()
        .map(|row| row.iter().map(|s| parse_mpfr(s)).collect::<Result<_, _>>())
        .collect::<Result<_, _>>()?;
    let n_m = parse_mpfr(n_target)?;
    let mb = parse_mpfr(m_bound)?;
    let dt = parse_mpfr(dual_tol)?;

    let r = solve_operator_selection_lp(&t_m, &g_m, &n_m, &mb, &dt, prec_bits);

    Ok(OpSelLpStringResult {
        x_star: r.x_star.iter().map(to_f64).collect(),
        y0_star: to_f64(&r.y0_star),
        y_star: r.y_star.iter().map(to_f64).collect(),
        active_set: r.active_set.clone(),
        primal_obj: to_f64(&r.primal_obj),
        dual_obj: to_f64(&r.dual_obj),
        duality_gap: to_f64(&r.duality_gap),
        feasible: r.feasible,
        status: r.status.clone(),
        x_star_str: r.x_star.iter().map(|x| format!("{x}")).collect(),
        y0_star_str: format!("{}", r.y0_star),
        y_star_str: r.y_star.iter().map(|y| format!("{y}")).collect(),
        primal_obj_str: format!("{}", r.primal_obj),
        dual_obj_str: format!("{}", r.dual_obj),
        duality_gap_str: format!("{}", r.duality_gap),
        precision_bits: prec_bits,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    /// The 3-channel dummy LP from `lp_dual_solver.py`'s smoke test, over `F`.
    fn dummy<F: FloatT>() -> (Vec<F>, Vec<Vec<F>>, F) {
        let f = |x: f64| F::from_f64(x).unwrap();
        let t = vec![f(1.0), f(0.5), f(0.3)];
        let g = vec![
            vec![f(1.0), f(0.2), f(0.1)],
            vec![f(0.2), f(1.0), f(0.3)],
            vec![f(0.1), f(0.3), f(1.0)],
        ];
        (t, g, f(1.0))
    }

    fn solve_dummy<F: FloatT>() -> OpSelLpResult<F> {
        set_mpfr_default_precision(DEFAULT_PREC_BITS);
        let (t, g, n) = dummy::<F>();
        let big = F::from_f64(1e6).unwrap();
        let tol = F::from_f64(1e-9).unwrap();
        solve_operator_selection_lp(&t, &g, &n, &big, &tol, DEFAULT_PREC_BITS)
    }

    #[test]
    fn solves_and_is_feasible() {
        let r = solve_dummy::<MpfrFloat>();
        assert!(r.feasible, "status = {}", r.status);
        assert_eq!(r.x_star.len(), 3);
        assert_eq!(r.y_star.len(), 3);
    }

    #[test]
    fn strong_duality_gap_is_zero() {
        let r = solve_dummy::<MpfrFloat>();
        let tol = MpfrFloat::from_f64(1e-6).unwrap();
        // primal_obj == dual_obj == n_target · y0  ⇒ the y0 sign is right.
        assert!(
            r.duality_gap < tol,
            "duality gap {} too large (primal {}, dual {})",
            to_f64(&r.duality_gap),
            to_f64(&r.primal_obj),
            to_f64(&r.dual_obj),
        );
    }

    #[test]
    fn kkt_stationarity_holds() {
        // t = y0·1 + Gᵀy + z_bound, with y0 = -z_eq, y_i = z_G[i].
        let (t, g, _) = dummy::<MpfrFloat>();
        let r = solve_dummy::<MpfrFloat>();
        let tol = MpfrFloat::from_f64(1e-5).unwrap();
        for c in 0..t.len() {
            let mut recon = r.y0_star.clone();
            for i in 0..t.len() {
                recon = recon + g[i][c].clone() * r.y_star[i].clone();
            }
            let resid = (t[c].clone() - recon).abs();
            assert!(resid < tol, "KKT residual at c={c} is {}", to_f64(&resid));
        }
    }

    #[test]
    fn complementary_slackness_holds() {
        // y_i · (Gx)_i ≈ 0 for every channel.
        let (_, g, _) = dummy::<MpfrFloat>();
        let r = solve_dummy::<MpfrFloat>();
        let d = g.len();
        let tol = MpfrFloat::from_f64(1e-5).unwrap();
        for i in 0..d {
            let mut gx_i = MpfrFloat::zero();
            for c in 0..d {
                gx_i = gx_i + g[i][c].clone() * r.x_star[c].clone();
            }
            let cs = (r.y_star[i].clone() * gx_i).abs();
            assert!(cs < tol, "complementary slackness at i={i}: {}", to_f64(&cs));
        }
    }

    #[test]
    fn dual_multipliers_are_nonnegative() {
        let r = solve_dummy::<MpfrFloat>();
        let neg = MpfrFloat::from_f64(-1e-6).unwrap();
        for (i, y) in r.y_star.iter().enumerate() {
            assert!(*y > neg, "y_star[{i}] = {} is significantly negative", to_f64(y));
        }
    }

    /// **The owner's validation:** the MPFR solve agrees with an independent
    /// `f64` (float) solve of the *same* LP.  Both use the identical Clarabel
    /// kernel; only the scalar precision differs.  Agreement to the f64 IPM
    /// floor confirms the MPFR backend introduces no discrepancy vs float —
    /// f64 is used here ONLY for this check (production is MPFR-only).
    #[test]
    fn mpfr_agrees_with_f64() {
        let rf = solve_dummy::<f64>();
        let rm = solve_dummy::<MpfrFloat>();
        assert!(
            rf.feasible && rm.feasible,
            "feasibility differs: f64={} mpfr={}",
            rf.status, rm.status
        );

        // Objective agrees to the f64 floor.
        let pf = rf.primal_obj;
        let pm = to_f64(&rm.primal_obj);
        let rel = (pf - pm).abs() / pf.abs().max(1e-30);
        assert!(rel < 1e-6, "primal_obj: f64={pf} mpfr={pm} rel={rel:e}");

        // Same active set (which Frobenius channels are tight).
        assert_eq!(
            rf.active_set, rm.active_set,
            "active sets differ: f64={:?} mpfr={:?}",
            rf.active_set, rm.active_set
        );

        // Each dual shadow price agrees.
        for i in 0..rf.y_star.len() {
            let yf = rf.y_star[i];
            let ym = to_f64(&rm.y_star[i]);
            let drel = (yf - ym).abs() / yf.abs().max(1e-9);
            assert!(drel < 1e-5, "y_star[{i}]: f64={yf} mpfr={ym} rel={drel:e}");
        }
    }

    /// The string-in/string-out entry point (used by the CLI and the PyO3
    /// wheel binding) solves the dummy LP via decimal-string IO.
    #[test]
    fn from_strings_solves_dummy() {
        let t = vec!["1.0".to_string(), "0.5".to_string(), "0.3".to_string()];
        let g = vec![
            vec!["1.0".into(), "0.2".into(), "0.1".into()],
            vec!["0.2".into(), "1.0".into(), "0.3".into()],
            vec!["0.1".into(), "0.3".into(), "1.0".into()],
        ];
        let r = solve_operator_selection_lp_from_strings(
            &t, &g, "1.0", "1e6", "1e-9", DEFAULT_PREC_BITS,
        )
        .expect("solve");
        assert!(r.feasible, "status {}", r.status);
        assert_eq!(r.x_star.len(), 3);
        assert!((r.primal_obj - 0.16875).abs() < 1e-4, "primal {}", r.primal_obj);
        assert_eq!(r.active_set, vec![0, 1]);
        assert!(r.primal_obj_str.len() >= 20, "str too short: {}", r.primal_obj_str);
    }
}
