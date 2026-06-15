//! Smoke test for the Round 4 SDP-side new APIs:
//!   1. `BlockDiagPSDConeT { block_dims: Vec<usize> }` — sugar for a
//!      direct sum of `PSDTriangleConeT(d_i)` cones, matching QOU's
//!      Wedderburn-block decomposition pattern.
//!   2. Structured per-cone accessors on `Solution<T>`:
//!      - `dual_psd_block(idx) -> Option<Vec<Vec<T>>>`
//!      - `primal_psd_block(idx) -> Option<Vec<Vec<T>>>`
//!      - `primal_residual_per_block() -> Vec<T>`
//!
//! Two parallel solves of the same problem — once via flat
//! `PSDTriangleConeT` cones, once via the `BlockDiagPSDConeT` sugar —
//! and asserts that both paths produce numerically identical `α*` to
//! within solver tolerance.  This validates that QOU can express the
//! Wedderburn-block decomposition natively without juggling N cone
//! objects.
//!
//! Required features: `clarabel-sdp`.

use clarabel::algebra::CscMatrix;
use clarabel::solver::*;

/// Pack a `d × d` symmetric matrix into Clarabel's PSD-triangle svec
/// (upper-tri column-major, off-diagonals scaled by √2).  Same
/// convention as `sdp_solver_clarabel::svec_pack` in this crate.
fn svec_pack(m: &[Vec<f64>]) -> Vec<f64> {
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

/// Build the smoke SDP:
///     maximize α
///     subject to  α · (B_λ - I_λ) + I_λ  ⪰ 0    for λ ∈ {[3], [2,1]}
///     0 ≤ α ≤ 1
///
/// where the two PSD blocks have dimensions 3 and 2 (deliberately
/// distinct so any cone-mixup would fail).  The B_λ matrices are
/// hand-chosen positive matrices; the optimum is α* = 1.
fn build_problem(
) -> (CscMatrix<f64>, Vec<f64>, Vec<usize>, Vec<f64>, Vec<Vec<Vec<f64>>>) {
    // Variables: just α (1 column).  P = 0 (LP-shaped objective).
    let _p: CscMatrix<f64> = CscMatrix::<f64>::zeros((1, 1));
    let q_vec = vec![-1.0_f64]; // minimize -α  ⇔  maximize α

    // Two PSD blocks
    let block_dims = vec![3, 2];

    // Block λ = [3]: I_3 (positive)
    let b_3 = vec![
        vec![1.0, 0.0, 0.0],
        vec![0.0, 1.0, 0.0],
        vec![0.0, 0.0, 1.0],
    ];
    // Block λ = [2,1]: 2·I_2 (positive, distinct from b_3)
    let b_21 = vec![vec![2.0, 0.0], vec![0.0, 2.0]];

    let blocks = vec![b_3, b_21];

    // Constraints in Clarabel A·x + s = b form:
    //   (1) α ≤ 1            → +α + s = 1, s ≥ 0
    //   (2) α ≥ 0            → -α + s = 0, s ≥ 0
    //   (3) per block λ:
    //       svec(α (B_λ-I) + I) = -svec(B_λ-I) · α + svec(I) ⪰ 0
    //       → A_block = -svec(B_λ-I), b_block = svec(I_λ)
    let mut a_rows: Vec<usize> = Vec::new();
    let mut a_vals: Vec<f64> = Vec::new();
    let mut b: Vec<f64> = Vec::new();
    let mut row = 0usize;

    a_rows.push(row);
    a_vals.push(1.0);
    b.push(1.0);
    row += 1;
    a_rows.push(row);
    a_vals.push(-1.0);
    b.push(0.0);
    row += 1;

    for block in &blocks {
        let d = block.len();
        // Build (B - I) and svec it
        let mut bmi = vec![vec![0.0; d]; d];
        for i in 0..d {
            for j in 0..d {
                bmi[i][j] = block[i][j] - if i == j { 1.0 } else { 0.0 };
            }
        }
        let mut id = vec![vec![0.0; d]; d];
        for i in 0..d {
            id[i][i] = 1.0;
        }
        let svec_a = svec_pack(&bmi);
        let svec_b = svec_pack(&id);
        for k in 0..svec_a.len() {
            a_rows.push(row + k);
            a_vals.push(-svec_a[k]);
            b.push(svec_b[k]);
        }
        row += svec_a.len();
    }

    let m_rows = row;
    let nnz = a_rows.len();
    let a_csc = CscMatrix::new(m_rows, 1, vec![0, nnz], a_rows, a_vals);

    (a_csc, b, block_dims, q_vec, blocks)
}

fn build_cones_flat(block_dims: &[usize]) -> Vec<SupportedConeT<f64>> {
    let mut cones: Vec<SupportedConeT<f64>> = Vec::new();
    cones.push(SupportedConeT::NonnegativeConeT(1));
    cones.push(SupportedConeT::NonnegativeConeT(1));
    for &d in block_dims {
        cones.push(SupportedConeT::PSDTriangleConeT(d));
    }
    cones
}

fn build_cones_blockdiag(block_dims: &[usize]) -> Vec<SupportedConeT<f64>> {
    let mut cones: Vec<SupportedConeT<f64>> = Vec::new();
    cones.push(SupportedConeT::NonnegativeConeT(1));
    cones.push(SupportedConeT::NonnegativeConeT(1));
    cones.push(SupportedConeT::BlockDiagPSDConeT {
        block_dims: block_dims.to_vec(),
    });
    cones
}

fn solve_with(cones: Vec<SupportedConeT<f64>>) -> DefaultSolution<f64> {
    let (a_csc, b, _bd, q_vec, _blocks) = build_problem();
    let p: CscMatrix<f64> = CscMatrix::<f64>::zeros((1, 1));
    let settings = DefaultSettingsBuilder::default()
        .verbose(false)
        .max_iter(200)
        .build()
        .unwrap();
    let mut solver = DefaultSolver::new(&p, &q_vec, &a_csc, &b, &cones, settings).unwrap();
    solver.solve();
    solver.solution
}

fn main() {
    println!("clarabel_round4_sdp_smoke — Round 4 SDP-side new APIs");
    println!("=====================================================\n");

    // ── Test 1: BlockDiagPSDConeT vs flat PSDTriangleConeT ─────────
    let (_a, _b, block_dims, _q, _blocks) = build_problem();
    let sol_flat = solve_with(build_cones_flat(&block_dims));
    let sol_block = solve_with(build_cones_blockdiag(&block_dims));

    let alpha_flat = -sol_flat.obj_val;
    let alpha_block = -sol_block.obj_val;
    println!("Test 1 — BlockDiagPSDConeT sugar variant");
    println!("  α* (flat PSDTriangleConeT × 2): {:.10}", alpha_flat);
    println!("  α* (BlockDiagPSDConeT [3, 2]):  {:.10}", alpha_block);
    let diff = (alpha_flat - alpha_block).abs();
    println!("  |Δ| = {:.2e}", diff);
    assert!(
        diff < 1e-6,
        "BlockDiagPSDConeT and flat PSDTriangleConeT disagree by {diff}"
    );
    println!("  ✓ identical α* to within solver tolerance\n");

    // ── Test 2: Structured per-cone accessors on Solution<T> ─────
    println!("Test 2 — Solution<T> per-cone accessors");
    // Probe by index: collect every PSD block returned, then assert
    // dimensions.  Cones may be reordered/collapsed internally so we
    // don't hard-code positions — just walk the index space.
    let mut psd_blocks: Vec<Vec<Vec<f64>>> = Vec::new();
    for i in 0..16 {
        if let Some(b) = sol_flat.dual_psd_block(i) {
            println!("  dual_psd_block({}): {}×{} matrix", i, b.len(), b[0].len());
            psd_blocks.push(b);
        }
    }
    assert_eq!(psd_blocks.len(), 2, "expected exactly 2 PSD blocks");
    let dims: Vec<usize> = psd_blocks.iter().map(|b| b.len()).collect();
    let mut sorted = dims.clone();
    sorted.sort();
    assert_eq!(sorted, vec![2, 3], "PSD block dims should be {{2, 3}} (any order)");
    println!("  ✓ found 2 PSD blocks with dims {{{}, {}}}", sorted[0], sorted[1]);

    // The first cone (idx 0) is a NonnegativeCone — accessor returns None.
    let dual_nn = sol_flat.dual_psd_block(0);
    assert!(dual_nn.is_none(), "expected None for cone idx 0 (NonnegativeCone)");
    println!("  ✓ returns None on non-PSD cone idx");

    let primal_resids = sol_flat.primal_residual_per_block();
    println!(
        "  primal_residual_per_block: {} entries, max = {:.2e}",
        primal_resids.len(),
        primal_resids.iter().cloned().fold(0f64, f64::max)
    );
    // Clarabel collapses adjacent same-type cones internally (the two
    // NonnegativeConeT(1) become one entry), so we get >= 3 not exactly 4.
    assert!(primal_resids.len() >= 3, "expected >= 3 cone-block entries");

    println!("\nAll tests passed.");
}
