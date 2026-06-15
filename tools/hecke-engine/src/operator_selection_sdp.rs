//! Genuine **dense-PSD** operator-selection SDP — Clarabel PSD cone (f64).
//!
//! Unlike the diagonal lift `M(x) = diag(Gx)` (which is LP-equivalent and
//! handled by [`operator_selection_lp`](crate::operator_selection_lp)), this
//! solves an SDP with a genuine dense positive-semidefinite constraint that
//! captures off-diagonal correlations:
//!
//! ```text
//!     min  t · x
//!     s.t. 1ᵀ x = n_target
//!          M₀ + Σ_k x_k M_k  ⪰ 0        (dense PSD cone, p × p)
//! ```
//!
//! The PSD cone requires an eigen-step, which Clarabel implements via
//! LAPACK — so this path is **`f64`** (the MPFR backend has no PSD cone).
//! It is still a strict upgrade over cvxpy/SCS: Clarabel emits a proper
//! dual PSD certificate and the strong-duality gap.
//!
//! Clarabel encodes a PSD block in **svec** form (column-major upper
//! triangle, off-diagonal entries scaled by √2).  With `A x + s = b`,
//! `s ∈ PSDTriangleCone`, we set `b = svec(M₀)` and column `k` of `A` to
//! `-svec(M_k)`, so `s = svec(M₀ + Σ_k x_k M_k) ⪰ 0`.
//!
//! Required feature: `clarabel-sdp`.

use clarabel::algebra::CscMatrix;
use clarabel::solver::*;

/// Result of the dense-PSD operator-selection SDP.
#[derive(Debug, Clone)]
pub struct SdpDenseResult {
    pub x_star: Vec<f64>,
    /// Optimal slack matrix `S = M₀ + Σ_k x_k M_k` (should be PSD).
    pub slack_matrix: Vec<Vec<f64>>,
    pub primal_obj: f64,
    pub dual_obj: f64,
    pub duality_gap: f64,
    /// Minimum diagonal entry of `S` — a necessary PSD witness (≥ −tol).
    pub min_diag: f64,
    pub feasible: bool,
    pub status: String,
}

/// Solve `min t·x  s.t.  1ᵀx = n_target,  M₀ + Σ_k x_k M_k ⪰ 0`.
///
/// * `t`          — objective, length `d`.
/// * `psd_const`  — `M₀`, a `p × p` symmetric matrix (row-major).
/// * `psd_slices` — exactly `d` matrices `M_0, …, M_{d-1}` (one per
///   variable; `psd_slices.len()` must equal `d = t.len()`), each `p × p`.
/// * `n_target`   — net-constraint RHS.
pub fn solve_operator_selection_sdp_dense(
    t: &[f64],
    psd_const: &[Vec<f64>],
    psd_slices: &[Vec<Vec<f64>>],
    n_target: f64,
) -> SdpDenseResult {
    let d = t.len();
    assert_eq!(psd_slices.len(), d, "psd_slices len {} != d {}", psd_slices.len(), d);
    let p = psd_const.len();
    assert!(p > 0, "PSD matrix must be non-empty");
    // Validate squareness of every matrix (rows AND columns) so a ragged
    // input fails with a clear message instead of an out-of-bounds panic.
    for (i, row) in psd_const.iter().enumerate() {
        assert_eq!(row.len(), p, "psd_const row {i} has {} cols != p {}", row.len(), p);
    }
    for (k, m) in psd_slices.iter().enumerate() {
        assert_eq!(m.len(), p, "psd_slices[{k}] has {} rows != p {}", m.len(), p);
        for (i, row) in m.iter().enumerate() {
            assert_eq!(row.len(), p, "psd_slices[{k}] row {i} has {} cols != p {}", row.len(), p);
        }
    }
    let sqrt2 = 2f64.sqrt();

    // P = 0 (linear objective), q = t.
    let p_zero: CscMatrix<f64> = CscMatrix::<f64>::zeros((d, d));
    let q_vec = t.to_vec();

    // Rows: 0 = net equality (ZeroCone); 1.. = svec PSD block (PSDTriangleCone).
    let n_tri = p * (p + 1) / 2;
    let m_rows = 1 + n_tri;

    // A in CSC: column k holds the net coefficient (1) plus -svec(M_k).
    let mut indptr = vec![0usize];
    let mut rows_csc: Vec<usize> = Vec::new();
    let mut vals_csc: Vec<f64> = Vec::new();
    for k in 0..d {
        rows_csc.push(0);
        vals_csc.push(1.0); // net: Σ x_k = n_target
        let mut r = 1usize;
        for col in 0..p {
            for row_idx in 0..=col {
                let scale = if row_idx == col { 1.0 } else { sqrt2 };
                rows_csc.push(r);
                vals_csc.push(-psd_slices[k][row_idx][col] * scale);
                r += 1;
            }
        }
        indptr.push(rows_csc.len());
    }
    let a_csc = CscMatrix::new(m_rows, d, indptr, rows_csc, vals_csc);

    // b = [n_target, svec(M₀)].
    let mut b_vec = vec![n_target];
    for col in 0..p {
        for row_idx in 0..=col {
            let scale = if row_idx == col { 1.0 } else { sqrt2 };
            b_vec.push(psd_const[row_idx][col] * scale);
        }
    }

    let cones: Vec<SupportedConeT<f64>> = vec![
        SupportedConeT::ZeroConeT(1),
        SupportedConeT::PSDTriangleConeT(p),
    ];

    let settings = DefaultSettingsBuilder::default()
        .verbose(false)
        .max_iter(200)
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
    let x_star = solver.solution.x.clone();

    // Reconstruct S = M₀ + Σ_k x_k M_k from the primal (more robust than
    // un-svec'ing the slack, and gives a direct PSD witness).
    let mut s = vec![vec![0.0; p]; p];
    for (i, srow) in s.iter_mut().enumerate() {
        for (j, sij) in srow.iter_mut().enumerate() {
            let mut v = psd_const[i][j];
            for k in 0..d {
                v += x_star[k] * psd_slices[k][i][j];
            }
            *sij = v;
        }
    }
    let min_diag = (0..p).map(|i| s[i][i]).fold(f64::INFINITY, f64::min);

    let primal_obj: f64 = t.iter().zip(&x_star).map(|(ti, xi)| ti * xi).sum();
    let dual_obj = solver.solution.obj_val_dual;
    let duality_gap = (primal_obj - dual_obj).abs();

    SdpDenseResult {
        x_star,
        slack_matrix: s,
        primal_obj,
        dual_obj,
        duality_gap,
        min_diag,
        feasible,
        status,
    }
}

/// Result of the Lasserre moment-matrix SDP (the canonical QOU dense lift).
#[derive(Debug, Clone)]
pub struct MomentSdpResult {
    pub x_star: Vec<f64>,
    /// `xᵀ G x` on the SDP solution (the quadratic Frobenius value).
    pub xtgx: f64,
    /// `tr(G·X)` — the moment-matrix Frobenius trace (constrained `≥ 0`).
    pub tr_gx: f64,
    pub objective: f64,
    pub feasible: bool,
    pub status: String,
}

/// Lasserre moment-matrix SDP — the canonical QOU **dense lift** of the
/// operator-selection LP (`prop:confinement-sdp`, mirrors the cvxpy
/// reference in `folio-assistant/computations/sdp_moment_lift.py`).
///
/// At q₀ the Gram `G` has a negative eigenvalue, so the componentwise LP
/// `G x ≥ 0` is strictly weaker than the quadratic Frobenius positivity
/// `xᵀ G x ≥ 0`.  The moment relaxation adds a symmetric matrix variable
/// `X` and the moment matrix `M = [[1, xᵀ], [x, X]]`:
///
/// ```text
///     min  c·x
///     s.t. 1ᵀ x = n_target,  G x ≥ 0,  tr(G·X) ≥ 0,
///          M = [[1, xᵀ], [x, X]] ⪰ 0,  X ⪰ 0,  lo ≤ x ≤ hi
/// ```
///
/// `f64` (the PSD cone needs LAPACK).  Variables are `x (n)` followed by the
/// upper-triangular `svec(X)` (n(n+1)/2 entries); the moment matrix `M`
/// links them.  Required feature: `clarabel-sdp`.
pub fn solve_confinement_moment_sdp(
    c: &[f64],
    g: &[Vec<f64>],
    n_target: f64,
    lo: f64,
    hi: f64,
) -> MomentSdpResult {
    let n = c.len();
    assert_eq!(g.len(), n, "G has {} rows != n {}", g.len(), n);
    for (i, row) in g.iter().enumerate() {
        assert_eq!(row.len(), n, "G row {i} has {} cols != n {}", row.len(), n);
    }
    let sqrt2 = 2f64.sqrt();

    // Variable layout: x_0..x_{n-1}, then svec(X) in column-major upper-tri
    // order. xvar(r,c) (r<=c) → n + c*(c+1)/2 + r.
    let tri = |p: usize| p * (p + 1) / 2;
    let xvar = |r: usize, col: usize| -> usize { n + tri(col) + r };
    let nvars = n + tri(n);

    let p_zero: CscMatrix<f64> = CscMatrix::<f64>::zeros((nvars, nvars));
    let mut q_vec = vec![0.0_f64; nvars];
    q_vec[..n].copy_from_slice(c);

    // Build A as triplets (row, col, val) + b, then convert to CSC.
    let mut trip: Vec<(usize, usize, f64)> = Vec::new();
    let mut b_vec: Vec<f64> = Vec::new();
    let mut row = 0usize;
    let mut cones: Vec<SupportedConeT<f64>> = Vec::new();

    // (1) equality 1ᵀx = n_target  → ZeroCone(1)
    for j in 0..n {
        trip.push((row, j, 1.0));
    }
    b_vec.push(n_target);
    row += 1;
    cones.push(SupportedConeT::ZeroConeT(1));

    // (2) G x ≥ 0  → Nonneg(n);  s_i = (Gx)_i  ⇒  A coef on x_j = -G[i][j]
    for i in 0..n {
        for j in 0..n {
            if g[i][j] != 0.0 {
                trip.push((row, j, -g[i][j]));
            }
        }
        b_vec.push(0.0);
        row += 1;
    }
    cones.push(SupportedConeT::NonnegativeConeT(n));

    // (3) tr(G·X) ≥ 0  → Nonneg(1).  tr = Σ_i G_ii X_ii + 2 Σ_{i<j} G_ij X_ij.
    for col in 0..n {
        for r in 0..=col {
            let coef = if r == col { g[r][col] } else { 2.0 * g[r][col] };
            if coef != 0.0 {
                trip.push((row, xvar(r, col), -coef));
            }
        }
    }
    b_vec.push(0.0);
    row += 1;
    cones.push(SupportedConeT::NonnegativeConeT(1));

    // (4) x ≥ lo  → Nonneg(n);  s_i = x_i - lo
    for j in 0..n {
        trip.push((row, j, -1.0));
        b_vec.push(-lo);
        row += 1;
    }
    cones.push(SupportedConeT::NonnegativeConeT(n));

    // (5) x ≤ hi  → Nonneg(n);  s_i = hi - x_i
    for j in 0..n {
        trip.push((row, j, 1.0));
        b_vec.push(hi);
        row += 1;
    }
    cones.push(SupportedConeT::NonnegativeConeT(n));

    // (6) M = [[1, xᵀ],[x, X]] ⪰ 0  → PSDTriangle(n+1).  svec column-major
    // upper-tri, off-diagonal × √2. Index M with 0..=n.
    for col in 0..=n {
        for r in 0..=col {
            let scale = if r == col { 1.0 } else { sqrt2 };
            if r == 0 && col == 0 {
                // constant 1
                b_vec.push(scale); // scale==1
            } else if r == 0 {
                // M[0][col] = x_{col-1}
                trip.push((row, col - 1, -scale));
                b_vec.push(0.0);
            } else {
                // M[r][col] = X[r-1][col-1]
                trip.push((row, xvar(r - 1, col - 1), -scale));
                b_vec.push(0.0);
            }
            row += 1;
        }
    }
    cones.push(SupportedConeT::PSDTriangleConeT(n + 1));

    // (7) X ⪰ 0  → PSDTriangle(n).
    for col in 0..n {
        for r in 0..=col {
            let scale = if r == col { 1.0 } else { sqrt2 };
            trip.push((row, xvar(r, col), -scale));
            b_vec.push(0.0);
            row += 1;
        }
    }
    cones.push(SupportedConeT::PSDTriangleConeT(n));

    // Triplets → CSC (column-major).
    let m_rows = row;
    let mut cols: Vec<Vec<(usize, f64)>> = vec![Vec::new(); nvars];
    for (r, col_idx, v) in trip {
        cols[col_idx].push((r, v));
    }
    let mut indptr = vec![0usize];
    let mut rows_csc: Vec<usize> = Vec::new();
    let mut vals_csc: Vec<f64> = Vec::new();
    for col in cols.iter_mut() {
        col.sort_by_key(|&(r, _)| r);
        for &(r, v) in col.iter() {
            rows_csc.push(r);
            vals_csc.push(v);
        }
        indptr.push(rows_csc.len());
    }
    let a_csc = CscMatrix::new(m_rows, nvars, indptr, rows_csc, vals_csc);

    let settings = DefaultSettingsBuilder::default()
        .verbose(false)
        .max_iter(300)
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
    let sol = &solver.solution.x;
    let x_star: Vec<f64> = sol[..n].to_vec();

    // Reconstruct X from the svec variables for the reported tr(G·X).
    let mut xmat = vec![vec![0.0; n]; n];
    for col in 0..n {
        for r in 0..=col {
            let v = sol[xvar(r, col)];
            xmat[r][col] = v;
            xmat[col][r] = v;
        }
    }
    let mut tr_gx = 0.0;
    for i in 0..n {
        for j in 0..n {
            tr_gx += g[i][j] * xmat[i][j];
        }
    }
    let mut xtgx = 0.0;
    for i in 0..n {
        for j in 0..n {
            xtgx += x_star[i] * g[i][j] * x_star[j];
        }
    }
    let objective: f64 = c.iter().zip(&x_star).map(|(ci, xi)| ci * xi).sum();

    MomentSdpResult {
        x_star,
        xtgx,
        tr_gx,
        objective,
        feasible,
        status,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Known SDP: `min x₁ + x₂  s.t.  x₁ + x₂ = 2,  [[x₁,1],[1,x₂]] ⪰ 0`.
    /// The PSD constraint forces `x₁x₂ ≥ 1`; with `x₁+x₂=2` and AM–GM the
    /// only feasible point is `x* = (1,1)`, objective `2`.
    #[test]
    fn dense_psd_known_optimum() {
        let t = vec![1.0, 1.0];
        // M₀ = [[0,1],[1,0]]; M₁ = [[1,0],[0,0]]; M₂ = [[0,0],[0,1]].
        let m0 = vec![vec![0.0, 1.0], vec![1.0, 0.0]];
        let m1 = vec![vec![1.0, 0.0], vec![0.0, 0.0]];
        let m2 = vec![vec![0.0, 0.0], vec![0.0, 1.0]];
        let r = solve_operator_selection_sdp_dense(&t, &m0, &[m1, m2], 2.0);

        assert!(r.feasible, "status = {}", r.status);
        assert!(
            (r.x_star[0] - 1.0).abs() < 1e-4 && (r.x_star[1] - 1.0).abs() < 1e-4,
            "x* = {:?}, expected ~(1,1)",
            r.x_star
        );
        assert!((r.primal_obj - 2.0).abs() < 1e-4, "obj = {}, expected 2", r.primal_obj);
        // Strong duality: primal_obj ≈ dual_obj.
        assert!(r.duality_gap < 1e-5, "duality gap {} too large", r.duality_gap);
        // Slack matrix PSD (diagonal entries ≥ 0 is necessary; both ≈ 1).
        assert!(r.min_diag > -1e-6, "min diagonal {} negative — not PSD", r.min_diag);
    }

    /// Off-diagonal correlation actually binds: with a larger off-diagonal in
    /// `M₀` the PSD constraint is stricter than the diagonal (LP) lift, so the
    /// optimum differs from the componentwise `Gx ≥ 0` relaxation.
    #[test]
    fn dense_psd_offdiagonal_binds() {
        // [[x₁, 1.5],[1.5, x₂]] ⪰ 0 needs x₁x₂ ≥ 2.25; with x₁+x₂=3 the
        // feasible set is x₁x₂ ≥ 2.25 ⇒ x₁,x₂ ∈ [1.5, 1.5] only at equality,
        // i.e. x* = (1.5, 1.5), obj = 3.
        let t = vec![1.0, 1.0];
        let m0 = vec![vec![0.0, 1.5], vec![1.5, 0.0]];
        let m1 = vec![vec![1.0, 0.0], vec![0.0, 0.0]];
        let m2 = vec![vec![0.0, 0.0], vec![0.0, 1.0]];
        let r = solve_operator_selection_sdp_dense(&t, &m0, &[m1, m2], 3.0);
        assert!(r.feasible, "status = {}", r.status);
        assert!(
            (r.x_star[0] - 1.5).abs() < 1e-3 && (r.x_star[1] - 1.5).abs() < 1e-3,
            "x* = {:?}, expected ~(1.5,1.5)",
            r.x_star
        );
        assert!(r.duality_gap < 1e-5, "gap {}", r.duality_gap);
        assert!(r.min_diag > -1e-6, "min diag {}", r.min_diag);
    }

    /// Lasserre moment SDP (canonical QOU dense lift) on a Gram with a
    /// negative eigenvalue. Optimum cross-checked against the cvxpy
    /// reference (sdp_moment_lift.py): obj = -4, x* = (-9, 10, 0).
    #[test]
    fn moment_sdp_known_case() {
        let g = vec![
            vec![1.0, 0.9, 0.1],
            vec![0.9, 1.0, 0.9],
            vec![0.1, 0.9, 1.0],
        ];
        let c = vec![1.0, 0.5, 0.3];
        let r = solve_confinement_moment_sdp(&c, &g, 1.0, -10.0, 10.0);
        assert!(r.feasible, "status {}", r.status);
        assert!((r.objective + 4.0).abs() < 1e-4, "obj {} != -4", r.objective);
        assert!(
            (r.x_star[0] + 9.0).abs() < 1e-3 && (r.x_star[1] - 10.0).abs() < 1e-3,
            "x* = {:?}, expected ~(-9, 10, 0)",
            r.x_star
        );
        let s: f64 = r.x_star.iter().sum();
        assert!((s - 1.0).abs() < 1e-5, "1ᵀx = {} != n_target", s);
        // The moment-relaxation constraint tr(G·X) ≥ 0 holds.
        assert!(r.tr_gx > -1e-6, "tr(G·X) = {} < 0", r.tr_gx);
    }
}
