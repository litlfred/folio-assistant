//! Dump per-Wedderburn-block ρ_λ(T_w) matrices for an atom's braid
//! word at q_0. Lets us audit the d_λ ≥ 4 sign-convention question
//! flagged in `docs/audits/h3-alpha-star-investigation.md` (the
//! ³H/8_11 anomaly).
//!
//! Usage:
//!   cargo run --release --bin dump-block-matrices -- --atom tritium-3H
//!   cargo run --release --bin dump-block-matrices -- --atom proton
//!
//! Atoms (registry below):
//!   proton       — Borromean σ_1 σ_2^{-1} σ_1 σ_2^{-1} on B_3
//!   neutron      — Borromean σ_1 σ_2^{-1} σ_1 σ_2^{-1} on B_3
//!   helium3-3He  — Borromean σ_1^{-1} σ_2 (×3) on B_3
//!   tritium-3H   — 14-letter word on B_5 (see joint-tower-sdp-rust witness)
//!
//! Output: pretty-printed JSON to stdout, one block per partition λ.

use hecke_engine::seminormal::{partitions_of, seminormal_matrices};
use hecke_engine::wedderburn_psd::evaluate_all_blocks;

const Q_0: f64 = 1.1099785955541806;

/// Sparse-times-dense matmul. `sparse[i]` is `Vec<(j, val)>` for row i.
fn sparse_to_dense(sparse: &[Vec<(usize, f64)>], dim: usize) -> Vec<Vec<f64>> {
    let mut out = vec![vec![0.0f64; dim]; dim];
    for (i, row) in sparse.iter().enumerate() {
        for &(j, v) in row {
            out[i][j] = v;
        }
    }
    out
}

fn invert_matrix(m: &[Vec<f64>], h: f64) -> Vec<Vec<f64>> {
    // Hecke quadratic: σ^{-1} = σ - h
    m.iter()
        .enumerate()
        .map(|(i, row)| {
            row.iter()
                .enumerate()
                .map(|(j, &v)| if i == j { v - h } else { v })
                .collect()
        })
        .collect()
}

fn dense_dense_mul(a: &[Vec<f64>], b: &[Vec<f64>]) -> Vec<Vec<f64>> {
    let n = a.len();
    let mut out = vec![vec![0.0f64; n]; n];
    for i in 0..n {
        for k in 0..n {
            let aik = a[i][k];
            if aik == 0.0 {
                continue;
            }
            for j in 0..n {
                out[i][j] += aik * b[k][j];
            }
        }
    }
    out
}

fn build_block_matrix(
    n_strands: usize,
    braid_word: &[i32],
    shape: &[usize],
    q: f64,
) -> Vec<Vec<f64>> {
    let h = q - 1.0 / q;
    let sparse_gens = seminormal_matrices(shape, q);
    let dim = if sparse_gens.is_empty() {
        1
    } else {
        sparse_gens[0].len()
    };
    let dense_gens: Vec<Vec<Vec<f64>>> = sparse_gens
        .iter()
        .map(|sg| sparse_to_dense(sg, dim))
        .collect();
    let dense_inv_gens: Vec<Vec<Vec<f64>>> = dense_gens
        .iter()
        .map(|d| invert_matrix(d, h))
        .collect();

    let mut prod = vec![vec![0.0f64; dim]; dim];
    for i in 0..dim {
        prod[i][i] = 1.0;
    }
    let _ = n_strands;
    for &gen in braid_word {
        let idx = gen.unsigned_abs() as usize - 1;
        if idx >= dense_gens.len() {
            continue;
        }
        let g = if gen > 0 {
            &dense_gens[idx]
        } else {
            &dense_inv_gens[idx]
        };
        prod = dense_dense_mul(&prod, g);
    }
    prod
}

fn registry(name: &str) -> Option<(usize, Vec<i32>)> {
    match name {
        "electron" => {
            // T_{2,3} = σ_1³ in B_2; closure = right-handed trefoil 3_1.
            Some((2, vec![1, 1, 1]))
        }
        "deuteron-2H" | "deuteron" => {
            // 6-letter word in B_3 from joint-tower-sdp-rust.witness.json:
            // σ_1 σ_2^{-1} σ_1 σ_1 σ_1 σ_2^{-1}
            Some((3, vec![1, -2, 1, 1, 1, -2]))
        }
        "proton" | "neutron" => {
            // 6-letter Borromean from joint-tower-sdp-rust.witness.json:
            // σ_1 σ_2^{-1} σ_1 σ_2^{-1} σ_1 σ_2^{-1}
            Some((3, vec![1, -2, 1, -2, 1, -2]))
        }
        "proton-H5" | "neutron-H5" => {
            // Same Borromean, Markov-stabilized H_3 → H_5 by appending
            // σ_3 σ_4. The Markov closure is unchanged; the
            // representation lives in H_5. Used to discriminate the
            // d_λ ≥ 4 H2 hypothesis from the ³H investigation.
            Some((5, vec![1, -2, 1, -2, 1, -2, 3, 4]))
        }
        "helium3-3He" | "3He" => {
            // L_6a4 alternating: σ_1^{-1} σ_2 σ_1^{-1} σ_2 σ_1^{-1} σ_2
            Some((3, vec![-1, 2, -1, 2, -1, 2]))
        }
        "tritium-3H" | "3H" => {
            // 14-letter word from joint-tower-sdp-rust.witness.json
            Some((5, vec![-1, 2, -3, 2, 1, -3, -3, 4, -3, -2, -3, -4, -3, 2]))
        }
        "natural-h5-cycle" => {
            // A "natural" 5-strand cycle that doesn't factor through any
            // H_{n-1}: σ_1 σ_2 σ_3 σ_4 σ_3 σ_2 σ_1. Discriminates
            // H2 (general d >= 4 Hoefsmit issue) from a stabilisation-
            // specific effect.
            Some((5, vec![1, 2, 3, 4, 3, 2, 1]))
        }
        "natural-h5-positive-half-twist" => {
            // The full positive half-twist Δ_5 of B_5:
            //    Δ_5 = (σ_1 σ_2 σ_3 σ_4)(σ_1 σ_2 σ_3)(σ_1 σ_2)(σ_1)
            // Δ^2 is central in B_n; Δ itself has a known PSD profile
            // in published Hoefsmit tables.
            Some((
                5,
                vec![1, 2, 3, 4, 1, 2, 3, 1, 2, 1],
            ))
        }
        _ => None,
    }
}

fn print_matrix(prefix: &str, m: &[Vec<f64>]) {
    for (i, row) in m.iter().enumerate() {
        print!("{prefix}row {i}: [");
        for (j, &v) in row.iter().enumerate() {
            if j > 0 {
                print!(", ");
            }
            print!("{:>10.6}", v);
        }
        println!("]");
    }
}

fn main() {
    let args: Vec<String> = std::env::args().collect();
    let atom_name = args
        .iter()
        .position(|a| a == "--atom")
        .and_then(|i| args.get(i + 1))
        .map(String::as_str)
        .unwrap_or("tritium-3H");

    let (n_strands, braid_word) = match registry(atom_name) {
        Some(r) => r,
        None => {
            eprintln!(
                "Unknown atom '{atom_name}'. Try: proton, neutron, helium3-3He, tritium-3H"
            );
            std::process::exit(2);
        }
    };

    println!("# atom: {atom_name}");
    println!("# n_strands: {n_strands}");
    println!("# q_0: {Q_0}");
    println!("# braid_word: {braid_word:?}");
    println!();

    // PSD report (symmetric-part min eigenvalue per block, same as
    // sdp_verifier uses).
    let reports = evaluate_all_blocks(n_strands, &braid_word, Q_0);
    println!("## Wedderburn PSD report (symmetric-part eigenvalues)");
    println!("  λ                     d_λ  min eig (sym)  max eig (sym)  PSD?");
    let mut all_psd = true;
    for r in &reports {
        let mark = if r.psd_symmetric_part { "✓" } else { "✗" };
        if !r.psd_symmetric_part {
            all_psd = false;
        }
        println!(
            "  {:<22} {:>3}  {:>13.6}  {:>13.6}  {}",
            format!("{:?}", r.partition),
            r.d_lambda,
            r.min_eigenvalue,
            r.max_eigenvalue,
            mark,
        );
    }
    println!(
        "  ALL PSD: {}",
        if all_psd { "YES (α* = 1)" } else { "NO" }
    );
    println!();

    for shape in partitions_of(n_strands) {
        let m = build_block_matrix(n_strands, &braid_word, &shape, Q_0);
        let dim = m.len();
        println!("## λ = {shape:?},  d_λ = {dim}");
        if dim > 8 {
            println!("(matrix omitted — d_λ > 8; use --dim-limit override)");
        } else {
            print_matrix("  ", &m);
        }
        // Compute trace and Frobenius norm for quick audit.
        let trace: f64 = (0..dim).map(|i| m[i][i]).sum();
        let frob: f64 = m
            .iter()
            .flat_map(|r| r.iter())
            .map(|v| v * v)
            .sum::<f64>()
            .sqrt();
        println!("  trace = {trace:.6}, Frobenius norm = {frob:.6}");
        // Min/max diagonal.
        let diag_min = (0..dim).map(|i| m[i][i]).fold(f64::INFINITY, f64::min);
        let diag_max = (0..dim)
            .map(|i| m[i][i])
            .fold(f64::NEG_INFINITY, f64::max);
        println!("  diag min = {diag_min:.6}, diag max = {diag_max:.6}");
        println!();
    }
}
