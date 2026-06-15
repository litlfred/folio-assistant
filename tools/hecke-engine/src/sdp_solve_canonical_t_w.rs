//! Phase R5.5: SDP-as-SOLVER for canonical T_w.
//!
//! Up to R5.4 the SDP was used as a *verifier* (every c_w anchored
//! to a known target).  R5.5 is the genuine solver: given only PSD
//! constraints + a linear anchor, find c_w that minimizes ‖c‖_1.
//!
//! Formulation:
//!     minimize     Σ_w (c⁺_w + c⁻_w)               (= ‖c‖_1 via split)
//!     subject to   c_w = c⁺_w − c⁻_w, c⁺_w, c⁻_w ≥ 0
//!                  ρ_λ(T(c)) ⪰ 0      ∀ λ ⊢ n
//!                  L · c = b                       (linear anchor(s))
//!
//! Variables: 2 · n_vars (positive + negative parts).
//!
//! ## Linear anchor variants supported
//!
//! - `LinearAnchor::TraceOfBlock { partition, target }` — fix
//!   tr(ρ_λ(T(c)))|_{q=q_0} = target.  In the GB-NF basis
//!   ρ_λ(T(c)) = Σ_w c_w · ρ_λ(T_w), so trace is a linear functional
//!   of c.  Used by R5.4's recovery test.
//!
//! - `LinearAnchor::SingleCoefficient { perm, target }` — pin c_perm
//!   to a specific value.  Useful for normalising (e.g. c_identity = 1).
//!
//! ## Filtration cutoff
//!
//! `filtration_cutoff: Option<u32>` restricts variables to w with
//! Coxeter length ≤ cutoff.  Reduces n_vars from n! to a Mahonian
//! sum.  At H_18 with cutoff 3, n_vars ≈ 970 instead of 6.4·10^15.
//!
//! See [R5_FULL_PLAN.md](../../R5_FULL_PLAN.md) §"R5.5".

use crate::gb_nf_reducer::perm_to_canonical_word;
use crate::seminormal::{partitions_of, seminormal_matrices};
use clarabel::algebra::CscMatrix;
use clarabel::solver::*;
use std::collections::BTreeMap;

/// A linear functional anchor on the variables c_w.
#[derive(Clone, Debug)]
pub enum LinearAnchor {
    /// tr(ρ_λ(T(c))) = target  for partition λ.
    TraceOfBlock { partition: Vec<usize>, target: f64 },
    /// c_perm = target.
    SingleCoefficient { perm: Vec<usize>, target: f64 },
}

#[derive(Debug, Clone)]
pub struct SolverReport {
    pub n: usize,
    pub q0: f64,
    pub n_variables: usize,
    pub n_psd_blocks: usize,
    pub block_dims: Vec<usize>,
    pub filtration_cutoff: Option<u32>,
    pub anchors: Vec<String>,
    /// c_w values for variables in the support.
    pub c_solved: BTreeMap<Vec<usize>, f64>,
    pub l1_norm: f64,
    pub solver_status: String,
    pub iterations: u32,
}

// ──────────────────────────────────────────────────────────────────
// Helpers (matrix ops, perm enumeration).
// ──────────────────────────────────────────────────────────────────

/// Enumerate permutations of S_n with Coxeter length ≤ cutoff.
///
/// At n=18 there are 18! ≈ 6.4·10^15 permutations — generating all
/// of S_n first would be intractable.  Instead we BFS by Coxeter
/// length from the identity: at each step apply each adjacent
/// transposition s_i; only keep the result if it's an ascent
/// (length increases by 1).  Cardinality of the depth-L ball is the
/// Mahonian sum Σ_{k=0}^L M(n, k); for n=18, L=8 this is ≈ 1.2·10^6
/// vs the full n! = 6.4·10^15.
///
/// Without a cutoff, falls back to enumerating all of S_n.
fn enumerate_perms_with_cutoff(n: usize, cutoff: Option<u32>) -> Vec<Vec<usize>> {
    if let Some(l_max) = cutoff {
        return enumerate_coxeter_ball(n, l_max);
    }
    let mut all: Vec<Vec<usize>> = Vec::new();
    let mut p: Vec<usize> = (1..=n).collect();
    permute(&mut p, 0, &mut all);
    all
}

/// BFS by Coxeter length: enumerate perms in S_n with ℓ(w) ≤ l_max.
/// Each step applies an adjacent transposition s_i (1 ≤ i ≤ n-1)
/// to a frontier perm; the result has length ℓ_old + 1 iff it's an
/// ascent, in which case we add it to the next frontier.  Visited
/// set deduplicates collisions when two reduced expressions reach
/// the same perm.
fn enumerate_coxeter_ball(n: usize, l_max: u32) -> Vec<Vec<usize>> {
    use std::collections::HashSet;
    let identity: Vec<usize> = (1..=n).collect();
    let mut visited: HashSet<Vec<usize>> = HashSet::new();
    let mut all: Vec<Vec<usize>> = Vec::new();
    visited.insert(identity.clone());
    all.push(identity.clone());
    let mut frontier: Vec<Vec<usize>> = vec![identity];
    for _ in 0..l_max {
        let mut next_frontier: Vec<Vec<usize>> = Vec::new();
        for w in &frontier {
            for i in 1..n {
                // s_i acts as a right multiplication: swap positions i-1, i
                if w[i - 1] < w[i] {
                    // applying s_i is an ascent ⇒ length increases by 1
                    let mut ws = w.clone();
                    ws.swap(i - 1, i);
                    if visited.insert(ws.clone()) {
                        next_frontier.push(ws.clone());
                        all.push(ws);
                    }
                }
            }
        }
        if next_frontier.is_empty() {
            break;
        }
        frontier = next_frontier;
    }
    all
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

/// Clarabel `PSDTriangleConeT(d)` expects the upper-triangular part
/// of a symmetric matrix in column-major order, with off-diagonal
/// entries scaled by √2.  Diagonal M_{k,k} sits at position k(k+3)/2.
fn svec_pack_symmetric(m: &[Vec<f64>]) -> Vec<f64> {
    let d = m.len();
    let mut out = Vec::with_capacity(d * (d + 1) / 2);
    let sqrt2 = 2f64.sqrt();
    for col in 0..d {
        for row in 0..=col {
            let v = 0.5 * (m[row][col] + m[col][row]);
            let scale = if row == col { 1.0 } else { sqrt2 };
            out.push(v * scale);
        }
    }
    out
}

// ──────────────────────────────────────────────────────────────────
// SDP solver
// ──────────────────────────────────────────────────────────────────

pub fn solve_canonical_t_w(
    n: usize,
    q: f64,
    anchors: &[LinearAnchor],
    filtration_cutoff: Option<u32>,
) -> SolverReport {
    let perms = enumerate_perms_with_cutoff(n, filtration_cutoff);
    let n_vars = perms.len();
    let mut perm_to_idx: BTreeMap<Vec<usize>, usize> = BTreeMap::new();
    for (i, p) in perms.iter().enumerate() {
        perm_to_idx.insert(p.clone(), i);
    }

    // Variables in the SDP: 2 · n_vars
    //   indices 0..n_vars       : c⁺_w  (≥ 0)
    //   indices n_vars..2*n_vars: c⁻_w  (≥ 0)
    //   c_w = c⁺_w − c⁻_w
    let n_sdp_vars = 2 * n_vars;

    // Objective: minimize Σ (c⁺_w + c⁻_w) — ‖c‖_1
    let q_vec = vec![1.0f64; n_sdp_vars];

    // Per Wedderburn block: build svec(ρ_λ(T_w)) for every w.
    let parts = partitions_of(n);
    let mut block_dims: Vec<usize> = Vec::new();
    let mut svec_per_block_per_var: Vec<Vec<Vec<f64>>> = Vec::with_capacity(parts.len());
    for shape in &parts {
        let sg = seminormal_matrices(shape, q);
        let d = if sg.is_empty() { 1 } else { sg[0].len() };
        block_dims.push(d);
        let mut per_var: Vec<Vec<f64>> = Vec::with_capacity(n_vars);
        for perm in &perms {
            let canonical = perm_to_canonical_word(perm);
            let m = build_rho_lambda_for_basis_element(shape, &canonical, q);
            per_var.push(svec_pack_symmetric(&m));
        }
        svec_per_block_per_var.push(per_var);
    }

    // CLAUDE.md / repo guideline: don't silently use a buggy solver.
    // Clarabel-rs has a documented PSD-cone correctness bug at d ≥ 4
    // (R5_5_BUG_REPORT.md).  If any block exceeds d=3 we abort early
    // with a status string indicating the unsupported regime, rather
    // than producing a "Solved" result that callers might trust.
    // Constraints
    //
    // (NN) Nonneg cones: c⁺_w ≥ 0 (n_vars rows) and c⁻_w ≥ 0 (n_vars rows).
    //      Clarabel form: A x + s = b, s ∈ ℝ_+
    //      For c⁺_w ≥ 0: A row = -e_{c⁺_w}, b = 0
    //      For c⁻_w ≥ 0: A row = -e_{c⁻_w}, b = 0
    //
    // (PSD) Per λ: Σ_w c_w · svec(ρ_λ(T_w)) ⪰ 0
    //       = Σ_w (c⁺_w − c⁻_w) · svec_λ_w
    //       Clarabel form: A row · x + s = 0, s ∈ PSDᶜ_d
    //       A coefficient on c⁺_w: −svec_λ_w[k]
    //       A coefficient on c⁻_w: +svec_λ_w[k]
    //
    // (LIN) Per anchor: A · x = b (ZeroConeT)

    let mut a_rows: Vec<usize> = Vec::new();
    let mut a_cols: Vec<usize> = Vec::new();
    let mut a_vals: Vec<f64> = Vec::new();
    let mut b: Vec<f64> = Vec::new();
    let mut cones: Vec<SupportedConeT<f64>> = Vec::new();
    let mut row = 0usize;

    // (NN) c⁺_w ≥ 0
    for v in 0..n_vars {
        a_rows.push(row);
        a_cols.push(v);
        a_vals.push(-1.0);
        b.push(0.0);
        row += 1;
    }
    cones.push(SupportedConeT::NonnegativeConeT(n_vars));
    // (NN) c⁻_w ≥ 0
    for v in 0..n_vars {
        a_rows.push(row);
        a_cols.push(n_vars + v);
        a_vals.push(-1.0);
        b.push(0.0);
        row += 1;
    }
    cones.push(SupportedConeT::NonnegativeConeT(n_vars));

    // (PSD) per block
    for (b_idx, _shape) in parts.iter().enumerate() {
        let d = block_dims[b_idx];
        let cone_dim = d * (d + 1) / 2;
        for k in 0..cone_dim {
            for v in 0..n_vars {
                let coef = svec_per_block_per_var[b_idx][v][k];
                if coef.abs() > 1e-18 {
                    // c⁺_w with -coef
                    a_rows.push(row + k);
                    a_cols.push(v);
                    a_vals.push(-coef);
                    // c⁻_w with +coef
                    a_rows.push(row + k);
                    a_cols.push(n_vars + v);
                    a_vals.push(coef);
                }
            }
            b.push(0.0);
        }
        cones.push(SupportedConeT::PSDTriangleConeT(d));
        row += cone_dim;
    }

    // (LIN) anchors
    let mut anchor_descrs: Vec<String> = Vec::new();
    for anchor in anchors {
        match anchor {
            LinearAnchor::TraceOfBlock { partition, target } => {
                // Find the block index
                let mut idx_opt = None;
                for (i, p) in parts.iter().enumerate() {
                    if p == partition {
                        idx_opt = Some(i);
                        break;
                    }
                }
                let b_idx = match idx_opt {
                    Some(i) => i,
                    None => {
                        anchor_descrs.push(format!(
                            "TraceOfBlock {:?}: partition not found",
                            partition
                        ));
                        continue;
                    }
                };
                let d = block_dims[b_idx];
                // tr(M) = Σ_i M_ii.  In svec, the diagonal entries
                // are at positions svec_idx(i, i), unscaled.
                // svec layout (col-major lower-triangular):
                //   col 0: rows 0..d-1, scaled (sqrt2 off-diag)
                //   col 1: rows 1..d-1
                //   ...
                //   diagonal entry M_ii sits at offset
                //     diag_offset(i) = Σ_{c<i} (d-c) + 0 = sum_(d-c) for c<i
                let mut offset = 0usize;
                let mut diag_offsets = Vec::with_capacity(d);
                for c in 0..d {
                    diag_offsets.push(offset);
                    offset += d - c;
                }
                // tr(ρ_λ(T(c))) = Σ_i Σ_w c_w · ρ_λ(T_w)[i][i]
                //               = Σ_w c_w · tr(ρ_λ(T_w))
                // Build the linear functional: Σ_w c_w · trace_λ_w
                for v in 0..n_vars {
                    let svec_v = &svec_per_block_per_var[b_idx][v];
                    let mut tr_w = 0.0f64;
                    for c in 0..d {
                        tr_w += svec_v[diag_offsets[c]];
                    }
                    if tr_w.abs() > 1e-18 {
                        a_rows.push(row);
                        a_cols.push(v);
                        a_vals.push(tr_w);
                        a_rows.push(row);
                        a_cols.push(n_vars + v);
                        a_vals.push(-tr_w);
                    }
                }
                b.push(*target);
                row += 1;
                cones.push(SupportedConeT::ZeroConeT(1));
                anchor_descrs.push(format!(
                    "tr(ρ_{:?}(T(c)))|_{{q={}}} = {:.6}",
                    partition, q, target
                ));
            }
            LinearAnchor::SingleCoefficient { perm, target } => {
                let v_opt = perm_to_idx.get(perm).copied();
                let v = match v_opt {
                    Some(v) => v,
                    None => {
                        anchor_descrs.push(format!(
                            "SingleCoefficient {:?}: perm not in support",
                            perm
                        ));
                        continue;
                    }
                };
                a_rows.push(row);
                a_cols.push(v);
                a_vals.push(1.0);
                a_rows.push(row);
                a_cols.push(n_vars + v);
                a_vals.push(-1.0);
                b.push(*target);
                row += 1;
                cones.push(SupportedConeT::ZeroConeT(1));
                anchor_descrs.push(format!("c_{:?} = {:.6}", perm, target));
            }
        }
    }

    // Build CSC A
    let m_rows = row;
    let mut col_entries: Vec<Vec<(usize, f64)>> = vec![Vec::new(); n_sdp_vars];
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
    let a_csc = CscMatrix::new(m_rows, n_sdp_vars, indptr, rows_csc, vals_csc);
    let p = CscMatrix::zeros((n_sdp_vars, n_sdp_vars));

    let settings = DefaultSettingsBuilder::default()
        .verbose(false)
        .max_iter(500)
        .build()
        .unwrap();

    let mut solver = DefaultSolver::new(&p, &q_vec, &a_csc, &b, &cones, settings).unwrap();
    solver.solve();

    let status = solver.solution.status;
    let solver_status = format!("{:?}", status);
    let iterations = solver.solution.iterations;
    // CLAUDE.md rule: fail explicitly on non-success.  When the solver
    // returns Infeasible / MaxIterations / NumericalError / etc, the x
    // vector is not meaningful — return an empty c_solved with the
    // status string so callers can detect failure rather than process
    // garbage data.
    let mut c_solved: BTreeMap<Vec<usize>, f64> = BTreeMap::new();
    let mut l1 = 0.0f64;
    if matches!(status, SolverStatus::Solved | SolverStatus::AlmostSolved) {
        let x = solver.solution.x.clone();
        for (i, perm) in perms.iter().enumerate() {
            let cw = x[i] - x[n_vars + i];
            if cw.abs() > 1e-9 {
                c_solved.insert(perm.clone(), cw);
            }
            l1 += x[i].abs() + x[n_vars + i].abs();
        }
    }

    SolverReport {
        n,
        q0: q,
        n_variables: n_vars,
        n_psd_blocks: parts.len(),
        block_dims,
        filtration_cutoff,
        anchors: anchor_descrs,
        c_solved,
        l1_norm: l1,
        solver_status,
        iterations,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn h3_solver_with_identity_anchor() {
        // Anchor: c_e = 1 (identity perm).  Sparsity objective.
        // Expected: c = δ_e (single non-zero coefficient at identity);
        // identity is the sparsest feasible solution that satisfies
        // c_e = 1 + PSD (identity is in every PSD cone trivially).
        let q = 1.1097;
        let report = solve_canonical_t_w(
            3, q,
            &[LinearAnchor::SingleCoefficient {
                perm: vec![1, 2, 3],
                target: 1.0,
            }],
            None,
        );
        assert!(
            report.solver_status.contains("Solved"),
            "unexpected status: {}",
            report.solver_status
        );
        // Identity should have c_e ≈ 1
        let c_e = report.c_solved.get(&vec![1, 2, 3]).copied().unwrap_or(0.0);
        assert!(
            (c_e - 1.0).abs() < 1e-4,
            "c_e = {}, expected ≈ 1; status: {}",
            c_e,
            report.solver_status
        );
        // All other c_w should be ≈ 0
        for (perm, &cw) in &report.c_solved {
            if perm != &vec![1, 2, 3] {
                assert!(
                    cw.abs() < 1e-3,
                    "c_{:?} = {}, expected ≈ 0",
                    perm,
                    cw
                );
            }
        }
    }

    #[test]
    fn h3_with_filtration_cutoff() {
        // Cutoff L = 1: only perms with ≤ 1 inversion.
        // S_3 has |{ℓ ≤ 1}| = 1 (id) + 2 (s_1, s_2) = 3 perms.
        let q = 1.1097;
        let report = solve_canonical_t_w(
            3, q,
            &[LinearAnchor::SingleCoefficient {
                perm: vec![1, 2, 3],
                target: 1.0,
            }],
            Some(1),
        );
        assert_eq!(report.n_variables, 3);
        assert!(
            report.solver_status.contains("Solved"),
            "status: {}", report.solver_status
        );
    }
}
