//! Minimal H_5 SDP test: single FREE variable c_e, anchor c_e = 1,
//! PSD constraint per Wedderburn block.  No sparsity objective, no
//! c⁺/c⁻ split, no nonneg cones.  Tests whether the
//! sparsity-split formulation introduces the H_5 infeasibility, or
//! whether Clarabel's sdp-netlib backend struggles with this problem
//! shape regardless.

use clarabel::algebra::CscMatrix;
use clarabel::solver::*;
use hecke_engine::seminormal::{partitions_of, seminormal_matrices};

fn build_identity_dense(d: usize) -> Vec<Vec<f64>> {
    let mut out = vec![vec![0.0f64; d]; d];
    for i in 0..d {
        out[i][i] = 1.0;
    }
    out
}

fn svec_pack(m: &[Vec<f64>]) -> Vec<f64> {
    // Clarabel PSDTriangleConeT: upper-triangular column-major with
    // √2 off-diag scaling.  Diagonal M_{k,k} at index k(k+3)/2.
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

fn main() {
    let q = 1.1097;
    println!("══════════════════════════════════════════════════════════════════════");
    println!("  Minimal H_5 SDP test — single free var c_e, no objective");
    println!("══════════════════════════════════════════════════════════════════════");

    // Now try with DENSE PSD matrix J_d = ones(d,d) instead of I_d.
    // J_d has eigenvalue d (rank 1) > 0 so c·J_d ⪰ 0 ⇔ c ≥ 0.
    println!("\n──── DENSE PSD check: c · J_d (all-ones) ⪰ 0 ────");
    for d in [2usize, 3, 4, 5, 6, 7, 8] {
        let j = vec![vec![1.0f64; d]; d];  // all-ones matrix
        let svec_j = svec_pack(&j);
        let cone_dim = d * (d + 1) / 2;
        let n_vars = 1usize;
        let p = CscMatrix::zeros((n_vars, n_vars));
        let q_vec = vec![-1.0f64];
        let mut a_rows: Vec<usize> = Vec::new();
        let mut a_cols: Vec<usize> = Vec::new();
        let mut a_vals: Vec<f64> = Vec::new();
        let mut b: Vec<f64> = Vec::new();
        let mut cones: Vec<SupportedConeT<f64>> = Vec::new();
        for k in 0..cone_dim {
            a_rows.push(k);
            a_cols.push(0);
            a_vals.push(-svec_j[k]);
            b.push(0.0);
        }
        cones.push(SupportedConeT::PSDTriangleConeT(d));
        a_rows.push(cone_dim);
        a_cols.push(0);
        a_vals.push(1.0);
        b.push(1.0);
        cones.push(SupportedConeT::NonnegativeConeT(1));
        let mut col_entries: Vec<Vec<(usize, f64)>> = vec![Vec::new(); n_vars];
        for ((&r, &c), &v) in a_rows.iter().zip(a_cols.iter()).zip(a_vals.iter()) {
            col_entries[c].push((r, v));
        }
        for col in &mut col_entries {
            col.sort_by_key(|&(r, _)| r);
        }
        let mut indptr = vec![0];
        let mut rows = Vec::new();
        let mut vals = Vec::new();
        for col in &col_entries {
            for &(r, v) in col {
                rows.push(r);
                vals.push(v);
            }
            indptr.push(rows.len());
        }
        let m_rows = cone_dim + 1;
        let a_csc = CscMatrix::new(m_rows, n_vars, indptr, rows, vals);
        let settings = DefaultSettingsBuilder::default().verbose(false).build().unwrap();
        let mut solver = DefaultSolver::new(&p, &q_vec, &a_csc, &b, &cones, settings).unwrap();
        solver.solve();
        println!(
            "  d={}: c·J_d, status={:?}, c={:.6}",
            d, solver.solution.status, solver.solution.x[0]
        );
    }
    println!();

    // Standalone PSD check: for d ∈ {4, 6}, pose `find c s.t. c·I_d ⪰ 0`
    // with c FREE (no anchor).  This should always be feasible at c ≥ 0.
    println!("\n──── standalone PSD check c · I_d ⪰ 0 (sparse) ────");
    for d in [2usize, 3, 4, 5, 6, 7, 8] {
        let id = build_identity_dense(d);
        let svec = svec_pack(&id);  // col-major lower (Clarabel's documented convention)
        let cone_dim = d * (d + 1) / 2;
        let n_vars = 1usize;
        let p = CscMatrix::zeros((n_vars, n_vars));
        let q_vec = vec![-1.0f64]; // minimize -c → maximize c
        let mut a_rows: Vec<usize> = Vec::new();
        let mut a_cols: Vec<usize> = Vec::new();
        let mut a_vals: Vec<f64> = Vec::new();
        let mut b: Vec<f64> = Vec::new();
        let mut cones: Vec<SupportedConeT<f64>> = Vec::new();
        // Force diagonal entries explicitly via the PSD cone.
        for k in 0..cone_dim {
            let coef = svec[k];
            a_rows.push(k);
            a_cols.push(0);
            a_vals.push(-coef);
            b.push(0.0);
        }
        cones.push(SupportedConeT::PSDTriangleConeT(d));
        // Also add: c ≤ 1 explicitly via NN
        a_rows.push(cone_dim);
        a_cols.push(0);
        a_vals.push(1.0);
        b.push(1.0);
        cones.push(SupportedConeT::NonnegativeConeT(1));
        let mut col_entries: Vec<Vec<(usize, f64)>> = vec![Vec::new(); n_vars];
        for ((&r, &c), &v) in a_rows.iter().zip(a_cols.iter()).zip(a_vals.iter()) {
            col_entries[c].push((r, v));
        }
        for col in &mut col_entries {
            col.sort_by_key(|&(r, _)| r);
        }
        let mut indptr = vec![0];
        let mut rows = Vec::new();
        let mut vals = Vec::new();
        for col in &col_entries {
            for &(r, v) in col {
                rows.push(r);
                vals.push(v);
            }
            indptr.push(rows.len());
        }
        let m_rows = cone_dim + 1;
        let a_csc = CscMatrix::new(m_rows, n_vars, indptr, rows, vals);
        let settings = DefaultSettingsBuilder::default().verbose(false).build().unwrap();
        let mut solver = DefaultSolver::new(&p, &q_vec, &a_csc, &b, &cones, settings).unwrap();
        solver.solve();
        println!(
            "  d={}: status={:?}, c={:.6}",
            d, solver.solution.status, solver.solution.x[0]
        );
    }
    println!();

    // Per-block H_5 isolation: try each block alone with c_e anchor.
    println!("\n──── H_5 per-block isolation ────");
    let parts5_iso = partitions_of(5);
    for shape in &parts5_iso {
        let sg = seminormal_matrices(shape, q);
        let d = if sg.is_empty() { 1 } else { sg[0].len() };
        let id = build_identity_dense(d);
        let svec = svec_pack(&id);
        let cone_dim = d * (d + 1) / 2;
        let n_vars = 1usize;
        let p = CscMatrix::zeros((n_vars, n_vars));
        let q_vec = vec![0.0f64; n_vars];
        let mut a_rows: Vec<usize> = Vec::new();
        let mut a_cols: Vec<usize> = Vec::new();
        let mut a_vals: Vec<f64> = Vec::new();
        let mut b: Vec<f64> = Vec::new();
        let mut cones: Vec<SupportedConeT<f64>> = Vec::new();
        for k in 0..cone_dim {
            a_rows.push(k);
            a_cols.push(0);
            a_vals.push(-svec[k]);
            b.push(0.0);
        }
        cones.push(SupportedConeT::PSDTriangleConeT(d));
        a_rows.push(cone_dim);
        a_cols.push(0);
        a_vals.push(1.0);
        b.push(1.0);
        cones.push(SupportedConeT::ZeroConeT(1));
        let mut col_entries: Vec<Vec<(usize, f64)>> = vec![Vec::new(); n_vars];
        for ((&r, &c), &v) in a_rows.iter().zip(a_cols.iter()).zip(a_vals.iter()) {
            col_entries[c].push((r, v));
        }
        for col in &mut col_entries {
            col.sort_by_key(|&(r, _)| r);
        }
        let mut indptr = vec![0];
        let mut rows = Vec::new();
        let mut vals = Vec::new();
        for col in &col_entries {
            for &(r, v) in col {
                rows.push(r);
                vals.push(v);
            }
            indptr.push(rows.len());
        }
        let m_rows = cone_dim + 1;
        let a_csc = CscMatrix::new(m_rows, n_vars, indptr, rows, vals);
        let settings = DefaultSettingsBuilder::default().verbose(false).build().unwrap();
        let mut solver = DefaultSolver::new(&p, &q_vec, &a_csc, &b, &cones, settings).unwrap();
        solver.solve();
        println!(
            "  λ={:?} (d={}, svec={}): status={:?}, iters={}, c_e={:.6}",
            shape, d, cone_dim, solver.solution.status, solver.solution.iterations,
            solver.solution.x[0]
        );
    }
    println!();

    for n in 3..=7 {
        let parts = partitions_of(n);
        let block_dims: Vec<usize> = parts
            .iter()
            .map(|sh| {
                let sg = seminormal_matrices(sh, q);
                if sg.is_empty() { 1 } else { sg[0].len() }
            })
            .collect();

        // Single SDP variable: c_e (free).
        let n_vars = 1usize;
        let p = CscMatrix::zeros((n_vars, n_vars));
        let q_vec = vec![0.0f64; n_vars]; // no objective

        let mut a_rows: Vec<usize> = Vec::new();
        let mut a_cols: Vec<usize> = Vec::new();
        let mut a_vals: Vec<f64> = Vec::new();
        let mut b: Vec<f64> = Vec::new();
        let mut cones: Vec<SupportedConeT<f64>> = Vec::new();
        let mut row = 0usize;

        // PSD per block: c_e · svec(I_{d_λ}) ⪰ 0
        // Push EXPLICIT entries (including zero) for every row, so CSC
        // encoding has uniform sparsity pattern.
        for (i, _shape) in parts.iter().enumerate() {
            let d = block_dims[i];
            let id = build_identity_dense(d);
            let svec = svec_pack(&id);
            let cone_dim = d * (d + 1) / 2;
            for k in 0..cone_dim {
                let coef = svec[k];
                a_rows.push(row + k);
                a_cols.push(0);
                a_vals.push(-coef);
                b.push(0.0);
            }
            cones.push(SupportedConeT::PSDTriangleConeT(d));
            row += cone_dim;
        }

        // Anchor: c_e = 1
        a_rows.push(row);
        a_cols.push(0);
        a_vals.push(1.0);
        b.push(1.0);
        row += 1;
        cones.push(SupportedConeT::ZeroConeT(1));

        let m_rows = row;
        let mut col_entries: Vec<Vec<(usize, f64)>> = vec![Vec::new(); n_vars];
        for ((&r, &c), &v) in a_rows.iter().zip(a_cols.iter()).zip(a_vals.iter()) {
            col_entries[c].push((r, v));
        }
        for col in &mut col_entries {
            col.sort_by_key(|&(r, _)| r);
        }
        let mut indptr = vec![0];
        let mut rows = Vec::new();
        let mut vals = Vec::new();
        for col in &col_entries {
            for &(r, v) in col {
                rows.push(r);
                vals.push(v);
            }
            indptr.push(rows.len());
        }
        let a_csc = CscMatrix::new(m_rows, n_vars, indptr, rows, vals);

        let settings = DefaultSettingsBuilder::default()
            .verbose(false)
            .max_iter(500)
            .build()
            .unwrap();

        let mut solver = DefaultSolver::new(&p, &q_vec, &a_csc, &b, &cones, settings).unwrap();
        solver.solve();

        let max_d = block_dims.iter().max().copied().unwrap_or(0);
        let c_e = solver.solution.x[0];
        println!(
            "  H_{} : n_blocks={}, max d_λ={}, status={:?}, iters={}, c_e={:.6}",
            n,
            parts.len(),
            max_d,
            solver.solution.status,
            solver.solution.iterations,
            c_e
        );
    }
}
