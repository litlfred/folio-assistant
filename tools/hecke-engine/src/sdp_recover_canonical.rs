//! Phase R5.4: Multi-variable SDP for canonical T_w recovery.
//!
//! Up to R5.3 the SDP had ONE variable α — used to quantify the
//! PSD-cone gap of a *fixed* candidate Hecke element.  This module
//! poses the genuinely multi-variable problem: given a set of basis
//! generators (T_w for w ∈ S_n with filtration cutoff L), find
//! coefficients c_w(q_0) ∈ ℝ such that
//!
//!     ρ_λ(T(c)) ⪰ 0    for every λ ⊢ n
//!
//! where T(c) := Σ_w c_w T_w.  This is the joint-tower SDP at one
//! atom (cross-level constraints come in R5.5).
//!
//! For R5.4 we run the **proton recovery test**: with the known
//! Borromean braid β = (σ_1 σ_2^{-1})^3 ∈ B_3, the GB-NF reduction
//! yields specific coefficients c_w (computed by gb_nf_reducer).
//! The SDP poses
//!
//!     minimize  Σ_w (c_w − c_w_target)^2     (as an SOC equivalent)
//!     subject to  ρ_λ(T(c)) ⪰ 0  ∀ λ
//!
//! with c_w_target := the Borromean GB-NF coefficients.  Any
//! feasible solution must respect Wedderburn-block PSD; if c_w_target
//! itself is feasible (which it is — Borromean is on the cone interior),
//! the SDP returns c = c_target with zero objective.
//!
//! **Note for R5.5**: replacing the SOC anchor with an L1-norm
//! minimization + an AME-anchor constraint is what produces canonical
//! T_w for *unknown* atoms (⁶Li, ⁷Li).  R5.4 establishes the
//! solver-call infrastructure on a known case where we can verify
//! the answer.
//!
//! See [R5_FULL_PLAN.md](../../R5_FULL_PLAN.md) §"R5.4".

use crate::gb_nf_reducer::{HeckeElement, LaurentQ};
use crate::seminormal::{partitions_of, seminormal_matrices};
use clarabel::algebra::CscMatrix;
use clarabel::solver::*;
use std::collections::BTreeMap;

#[derive(Debug, Clone)]
pub struct RecoveryReport {
    pub n: usize,
    pub q0: f64,
    pub n_variables: usize,
    pub n_psd_blocks: usize,
    pub block_dims: Vec<usize>,
    /// Recovered coefficients (per perm) at q_0 numerically.
    pub c_recovered: BTreeMap<Vec<usize>, f64>,
    /// Target coefficients (per perm) at q_0.
    pub c_target: BTreeMap<Vec<usize>, f64>,
    pub max_residual: f64,
    pub solver_status: String,
    pub iterations: u32,
}

fn sparse_to_dense(sparse: &[Vec<(usize, f64)>], dim: usize) -> Vec<Vec<f64>> {
    let mut out = vec![vec![0.0f64; dim]; dim];
    for (i, row) in sparse.iter().enumerate() {
        for &(j, v) in row {
            out[i][j] = v;
        }
    }
    out
}

fn dense_dense_mul(a: &[Vec<f64>], b: &[Vec<f64>]) -> Vec<Vec<f64>> {
    let n = a.len();
    let m = b[0].len();
    let k = b.len();
    let mut out = vec![vec![0.0f64; m]; n];
    for i in 0..n {
        for kk in 0..k {
            let aik = a[i][kk];
            if aik == 0.0 {
                continue;
            }
            for j in 0..m {
                out[i][j] += aik * b[kk][j];
            }
        }
    }
    out
}

/// Build ρ_λ(T_w) for a single basis element T_w.  Walks w's
/// canonical reduced word and applies the seminormal generator
/// matrices.
fn build_rho_lambda_for_basis_element(
    shape: &[usize],
    canonical_word: &[u32],
    q: f64,
) -> Vec<Vec<f64>> {
    let sparse_gens = seminormal_matrices(shape, q);
    let dim = if sparse_gens.is_empty() {
        1
    } else {
        sparse_gens[0].len()
    };
    let mut prod = vec![vec![0.0f64; dim]; dim];
    for i in 0..dim {
        prod[i][i] = 1.0;
    }
    let dense_gens: Vec<Vec<Vec<f64>>> = sparse_gens
        .iter()
        .map(|sg| sparse_to_dense(sg, dim))
        .collect();
    for &g in canonical_word {
        let idx = g as usize - 1;
        if idx >= dense_gens.len() {
            continue;
        }
        prod = dense_dense_mul(&prod, &dense_gens[idx]);
    }
    prod
}

/// Evaluate a LaurentQ polynomial at numerical q.
///
/// Uses `num_traits::ToPrimitive` for the BigRational → f64 conversion
/// so overflow / NaN is reported via `Option::None` rather than silently
/// substituting 0.0/1.0 (which would corrupt target coefficients).
/// At q_0 ≈ 1.1097 the LaurentQ coefficients we encounter are bounded
/// rationals with small numerators/denominators, so overflow is not
/// expected; if it happens we panic with a diagnostic.
fn eval_laurent_at(p: &LaurentQ, q: f64) -> f64 {
    use num_traits::ToPrimitive;
    let mut acc = 0.0f64;
    for (&e, c) in &p.terms {
        let coef = c.to_f64().unwrap_or_else(|| {
            panic!(
                "LaurentQ coefficient overflow → f64 at q_e={}: {}/{}",
                e,
                c.numer(),
                c.denom()
            )
        });
        acc += coef * q.powi(e);
    }
    acc
}

fn enumerate_perms(n: usize) -> Vec<Vec<usize>> {
    use itertools_perms::permutations;
    permutations(n)
}

/// Standalone tiny permutation enumerator (avoid extra dep).
mod itertools_perms {
    pub fn permutations(n: usize) -> Vec<Vec<usize>> {
        let mut out = Vec::new();
        let mut p: Vec<usize> = (1..=n).collect();
        permute(&mut p, 0, &mut out);
        out
    }
    fn permute(p: &mut Vec<usize>, i: usize, out: &mut Vec<Vec<usize>>) {
        if i == p.len() {
            out.push(p.clone());
            return;
        }
        for k in i..p.len() {
            p.swap(i, k);
            permute(p, i + 1, out);
            p.swap(i, k);
        }
    }
}

fn perm_to_canonical(perm: &[usize]) -> Vec<u32> {
    let mut p = perm.to_vec();
    let mut word = Vec::new();
    let n = p.len();
    loop {
        let mut found = None;
        for k in 1..n {
            if p[k - 1] > p[k] {
                found = Some(k);
                break;
            }
        }
        match found {
            None => break,
            Some(i) => {
                word.push(i as u32);
                p.swap(i - 1, i);
            }
        }
    }
    word.reverse();
    word
}

/// Perform the proton recovery SDP at H_n via Clarabel.
///
/// Variables: c_w for every w ∈ S_n.
/// Constraints:
///   per λ ⊢ n:  Σ_w c_w · ρ_λ(T_w)  ⪰ 0
///   anchor:  c_w == c_target_w  for every w  (so the SDP is purely
///            a feasibility check on the target's PSD-cone membership)
///
/// In a proper recovery test (R5.5+) the anchor would be replaced
/// by an objective and selected hard constraints (AME anchor + LR
/// cross-level + sparsity).  R5.4 is the smoke test: confirm the
/// solver path returns the target coefficients to ≤ 1e-6 when fed
/// the known Borromean.
pub fn solve_recovery_h_n(
    n: usize,
    target_braid_word: &[i32],
    q: f64,
) -> RecoveryReport {
    // 1. Compute target coefficients via GB-NF reduction.
    let e = HeckeElement::reduce_braid(n, target_braid_word);
    let mut c_target: BTreeMap<Vec<usize>, f64> = BTreeMap::new();
    for (perm, c_lq) in &e.terms {
        c_target.insert(perm.clone(), eval_laurent_at(c_lq, q));
    }

    // 2. Enumerate variables: every w ∈ S_n.
    let perms = enumerate_perms(n);
    let n_vars = perms.len();
    let mut perm_to_idx: BTreeMap<Vec<usize>, usize> = BTreeMap::new();
    for (i, p) in perms.iter().enumerate() {
        perm_to_idx.insert(p.clone(), i);
    }

    // 3. Build per-block ρ_λ(T_w) for every (λ, w).
    let parts = partitions_of(n);
    let mut block_dims: Vec<usize> = Vec::new();
    // For each partition λ, store [vec of per-w svec(ρ_λ(T_w)) ].
    let mut svec_per_block_per_var: Vec<Vec<Vec<f64>>> = Vec::with_capacity(parts.len());
    for shape in &parts {
        let sg = seminormal_matrices(shape, q);
        let d = if sg.is_empty() { 1 } else { sg[0].len() };
        block_dims.push(d);
        let mut per_var: Vec<Vec<f64>> = Vec::with_capacity(n_vars);
        for perm in &perms {
            let canonical = perm_to_canonical(perm);
            let m = build_rho_lambda_for_basis_element(shape, &canonical, q);
            // Symmetrize then svec.  Clarabel's PSDTriangleConeT
            // expects upper-triangular column-major with √2 off-diag scaling.
            let sqrt2 = 2f64.sqrt();
            let mut svec = Vec::with_capacity(d * (d + 1) / 2);
            for col in 0..d {
                for row in 0..=col {
                    let v = 0.5 * (m[row][col] + m[col][row]);
                    let scale = if row == col { 1.0 } else { sqrt2 };
                    svec.push(v * scale);
                }
            }
            per_var.push(svec);
        }
        svec_per_block_per_var.push(per_var);
    }

    // 4. Build the SDP.
    //    Variables c_0, ..., c_{n_vars-1}.
    //    Constraints:
    //      - For each (λ): Σ_w c_w · svec(ρ_λ(T_w)) ∈ PSDᶜ
    //        Clarabel form: A x + s = b with s ∈ PSDᶜ.
    //        Set b = 0, A_row = -svec_per_block_per_var[block][var]
    //        ⇒ s = -A x = Σ c_w · svec(...) which we want ⪰ 0. ✓
    //      - Anchor: c_w == c_target_w  ⇒  ZeroConeT(1) per variable
    //        Clarabel: A x + s = b, s ∈ {0}  ⇒ A x = b
    //        i.e. the equality constraint c_w - c_target_w = 0.
    let mut a_rows: Vec<usize> = Vec::new();
    let mut a_cols: Vec<usize> = Vec::new();
    let mut a_vals: Vec<f64> = Vec::new();
    let mut b: Vec<f64> = Vec::new();
    let mut cones: Vec<SupportedConeT<f64>> = Vec::new();
    let mut row = 0usize;

    // PSD constraints (per block)
    for (b_idx, _shape) in parts.iter().enumerate() {
        let d = block_dims[b_idx];
        let cone_dim = d * (d + 1) / 2;
        for k in 0..cone_dim {
            for v in 0..n_vars {
                let coef = svec_per_block_per_var[b_idx][v][k];
                if coef.abs() > 1e-18 {
                    a_rows.push(row + k);
                    a_cols.push(v);
                    a_vals.push(-coef);
                }
            }
            b.push(0.0);
        }
        cones.push(SupportedConeT::PSDTriangleConeT(d));
        row += cone_dim;
    }

    // Anchor: c_w = target_w for every w.  Use ZeroConeT.
    for (i, perm) in perms.iter().enumerate() {
        let target = c_target.get(perm).copied().unwrap_or(0.0);
        a_rows.push(row);
        a_cols.push(i);
        a_vals.push(1.0);
        b.push(target);
        row += 1;
    }
    cones.push(SupportedConeT::ZeroConeT(n_vars));

    // Build CSC A matrix from triplets.
    let m_rows = row;
    let mut col_entries: Vec<Vec<(usize, f64)>> = vec![Vec::new(); n_vars];
    for ((&r, &c), &v) in a_rows.iter().zip(a_cols.iter()).zip(a_vals.iter()) {
        col_entries[c].push((r, v));
    }
    for col in &mut col_entries {
        col.sort_by_key(|&(r, _)| r);
    }
    let mut indptr: Vec<usize> = vec![0];
    let mut rows_csc: Vec<usize> = Vec::new();
    let mut vals_csc: Vec<f64> = Vec::new();
    for col in &col_entries {
        for &(r, v) in col {
            rows_csc.push(r);
            vals_csc.push(v);
        }
        indptr.push(rows_csc.len());
    }
    let a_csc = CscMatrix::new(m_rows, n_vars, indptr, rows_csc, vals_csc);

    // P = 0, q = 0 (feasibility only)
    let p = CscMatrix::zeros((n_vars, n_vars));
    let q_vec = vec![0.0f64; n_vars];

    let settings = DefaultSettingsBuilder::default()
        .verbose(false)
        .max_iter(200)
        .build()
        .unwrap();

    let mut solver = DefaultSolver::new(&p, &q_vec, &a_csc, &b, &cones, settings).unwrap();
    solver.solve();

    let status = solver.solution.status;
    let solver_status = format!("{:?}", status);
    let iterations = solver.solution.iterations;
    // CLAUDE.md rule: fail explicitly on non-success.  When the solver
    // returns Infeasible / MaxIterations / NumericalError / etc, the x
    // vector is not meaningful — leave c_recovered empty + max_residual
    // = ∞ so the caller's assertion-style test fails informatively.
    let mut c_recovered: BTreeMap<Vec<usize>, f64> = BTreeMap::new();
    let max_residual = if matches!(status, SolverStatus::Solved | SolverStatus::AlmostSolved) {
        let x = solver.solution.x.clone();
        for (i, perm) in perms.iter().enumerate() {
            c_recovered.insert(perm.clone(), x[i]);
        }
        c_recovered
            .iter()
            .map(|(p, &v)| (v - c_target.get(p).copied().unwrap_or(0.0)).abs())
            .fold(0.0f64, f64::max)
    } else {
        f64::INFINITY
    };

    RecoveryReport {
        n,
        q0: q,
        n_variables: n_vars,
        n_psd_blocks: parts.len(),
        block_dims,
        c_recovered,
        c_target,
        max_residual,
        solver_status,
        iterations,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn proton_borromean_recovery_at_h3() {
        // Pose the recovery SDP for proton (Borromean braid) at H_3.
        // Anchor constraints fix c_w = c_target_w, so feasibility ⇔
        // c_target is on the PSD cone (which it is — Borromean is
        // confined).  Solver returns c = c_target to ≤ 1e-6.
        let q = 1.1097;
        let report = solve_recovery_h_n(3, &[1, -2, 1, -2, 1, -2], q);
        assert_eq!(report.n_variables, 6); // |S_3| = 6
        assert_eq!(report.n_psd_blocks, 3); // partitions of 3
        assert!(
            report.max_residual < 1e-5,
            "Borromean recovery max residual = {:.4e}; expected < 1e-5; status: {}",
            report.max_residual,
            report.solver_status
        );
    }
}
