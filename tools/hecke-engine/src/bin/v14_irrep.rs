// v14_irrep: Per-irrep Garside computation via Young's seminormal form.
//
// For typed quark orderings with 2-letter alphabet {u,d}, only
// 2-row partitions of S_n contribute (Schur-Weyl duality).
// This reduces 385 irreps of S_18 to just 10.
//
// Each irrep λ = (a,b) has dimension d_λ. The Garside element Δ_n
// is computed as a product of 153 crossing matrices (for n=18),
// each d_λ × d_λ. Only 2 matrices in memory at once (result + crossing).
//
// Memory: 2 × d² × 8 bytes. For d=13260: 2.8 GB.
// Time: d² × n_crossings per irrep, parallelizable across irreps.
//
// Usage:
//   hecke-irrep ORDERING [max_dim]

use std::time::Instant;
use rayon::prelude::*;

// ════════════════════════════════════════════════════════════════
// CODATA (same as v13)
// ════════════════════════════════════════════════════════════════

const VOL_FIGURE_EIGHT: f64 = 2.029883212819307;
const MASS_RATIO_MU_E: f64 = 206.7682830;
const M_E_MEV: f64 = 0.51099895000;

fn compute_q0() -> f64 {
    let hbar_q = (VOL_FIGURE_EIGHT / MASS_RATIO_MU_E).sqrt();
    1.0 / (1.0 - hbar_q)
}

// ════════════════════════════════════════════════════════════════
// Standard Young tableaux for 2-row partitions
// ════════════════════════════════════════════════════════════════

/// A standard Young tableau for shape (a,b) is encoded as a Vec<bool>
/// of length n = a+b. entry[i] = true means value i+1 is in row 1.
/// This is valid iff at every prefix, #row1 ≥ #row2 (ballot condition)
/// AND #row1 ≤ a, #row2 ≤ b.
fn generate_syt(a: usize, b: usize) -> Vec<Vec<bool>> {
    let n = a + b;
    let mut result = Vec::new();
    let mut current = Vec::with_capacity(n);

    fn recurse(current: &mut Vec<bool>, a: usize, b: usize, r1: usize, r2: usize, result: &mut Vec<Vec<bool>>) {
        let n = a + b;
        if current.len() == n {
            result.push(current.clone());
            return;
        }
        // Try row 1
        if r1 < a {
            current.push(true);
            recurse(current, a, b, r1 + 1, r2, result);
            current.pop();
        }
        // Try row 2 (must have r2 < r1 for standardness)
        if r2 < b && r2 < r1 {
            current.push(false);
            recurse(current, a, b, r1, r2 + 1, result);
            current.pop();
        }
    }

    recurse(&mut current, a, b, 0, 0, &mut result);
    result
}

/// Content of value v (1-indexed) in tableau T: col - row.
fn syt_content(tab: &[bool], v: usize) -> i32 {
    // v is 1-indexed, tab[v-1] gives the row
    let mut r1_count = 0;
    let mut r2_count = 0;
    for i in 0..v {
        if tab[i] { r1_count += 1; } else { r2_count += 1; }
    }
    // Position of v: if in row 1, it's at column r1_count-1, row 0
    // if in row 2, it's at column r2_count-1, row 1
    if tab[v - 1] {
        (r1_count - 1) as i32 // col - row = col - 0
    } else {
        (r2_count - 1) as i32 - 1 // col - row = col - 1
    }
}

/// Swap values k and k+1 in tableau. Returns None if result is not standard.
fn syt_swap(tab: &[bool], k: usize) -> Option<Vec<bool>> {
    // k is 1-indexed. Swap entries at positions k-1 and k.
    // They must be in different rows for the swap to potentially be standard.
    if tab[k - 1] == tab[k] { return None; } // same row, swap is identity in SYT terms

    let mut new_tab = tab.to_vec();
    new_tab[k - 1] = tab[k];
    new_tab[k] = tab[k - 1];

    // Check ballot condition: at every prefix, #row1 >= #row2
    let mut r1 = 0i32;
    let mut r2 = 0i32;
    for &in_row1 in &new_tab {
        if in_row1 { r1 += 1; } else { r2 += 1; }
        if r2 > r1 { return None; }
    }
    Some(new_tab)
}

// ════════════════════════════════════════════════════════════════
// Per-irrep Garside computation
// ════════════════════════════════════════════════════════════════

/// Compute σ_{gen_k} matrix element for two tableaux in seminormal form.
/// Returns (diagonal, off_diagonal_to_swapped).
fn seminormal_entry(tab: &[bool], gen_k: usize, q: f64) -> (f64, Option<f64>) {
    let k = gen_k + 1; // values to swap (1-indexed)
    let qi = 1.0 / q;
    let ha = q - qi;

    let d = syt_content(tab, k + 1) - syt_content(tab, k);

    if d == 0 { panic!("d=0 at gen_k={}", gen_k); }

    if d == 1 {
        (q, None)
    } else if d == -1 {
        (-qi, None)
    } else {
        let qd = q.powi(d);
        let qdi = q.powi(-d);
        let diag = ha / (qd - qdi);
        let off = (1.0 - diag * diag).max(0.0).sqrt();
        (diag, Some(off))
    }
}

/// Build the crossing list for the Garside staircase.
/// Returns Vec of (sweep, level+1) pairs.
fn garside_crossings(n: usize) -> Vec<(usize, usize)> {
    let mut crossings = Vec::new();
    for level in 0..n-1 {
        for sweep in (0..=level).rev() {
            crossings.push((sweep, level + 1));
        }
    }
    crossings
}

/// Compute tr(ρ_λ(Δ_n)) for BOTH parent and daughter orderings
/// with common-prefix optimization.
///
/// Splits the Garside staircase into prefix / branch / suffix.
/// Prefix and suffix are computed once (shared crossings).
/// Branch is computed separately for parent and daughter.
fn garside_trace_pair(
    a: usize, b: usize,
    par_ordering: &[u8], dau_ordering: &[u8],
    q: f64,
) -> (f64, f64) {
    let n = a + b;
    assert_eq!(n, par_ordering.len());
    assert_eq!(n, dau_ordering.len());

    let ha = q - 1.0 / q;
    let tabs = generate_syt(a, b);
    let dim = tabs.len();
    if dim == 0 { return (0.0, 0.0); }

    let mut tab_idx: std::collections::HashMap<Vec<bool>, usize> = std::collections::HashMap::new();
    for (i, t) in tabs.iter().enumerate() {
        tab_idx.insert(t.clone(), i);
    }

    let crossings = garside_crossings(n);

    // Find which crossings differ
    let differs: Vec<bool> = crossings.iter().map(|&(s, l)| {
        par_ordering[s] != dau_ordering[s] || par_ordering[l] != dau_ordering[l]
    }).collect();

    let first_diff = differs.iter().position(|&d| d).unwrap_or(crossings.len());
    let last_diff = differs.iter().rposition(|&d| d).unwrap_or(0);

    // Helper: apply one crossing to matrix
    let apply_crossing = |result: &mut Vec<f64>, sweep: usize, ordering: &[u8]| {
        let ti = ordering[sweep];
        let tj = ordering[crossings.iter().find(|&&(s,_)| s == sweep).map(|&(_,l)| l).unwrap_or(0)];
        // Actually we need the specific (sweep, level) pair, not just sweep
        // This closure needs the level too. Let me restructure.
    };

    // Simpler: just split into prefix, branch_par, branch_dau, suffix
    // and use the existing garside_trace logic for each section.

    let apply_section = |result: &mut Vec<f64>, crossings_slice: &[(usize, usize)], ordering: &[u8]| {
        for &(sweep, level_plus_1) in crossings_slice {
            let ti = ordering[sweep];
            let tj = ordering[level_plus_1];
            let d_coeff = match (ti, tj) {
                (b'p', b'p') | (b'u', b'u') => 0.0,
                (b'n', b'n') | (b'd', b'd') => -ha,
                _ => -ha / 2.0,
            };

            let mut new_result = vec![0.0f64; dim * dim];
            for j in 0..dim {
                let (diag, off) = seminormal_entry(&tabs[j], sweep, q);
                let diag_total = diag + d_coeff;
                let swap_info = if let Some(off_val) = off {
                    if let Some(swapped) = syt_swap(&tabs[j], sweep + 1) {
                        tab_idx.get(&swapped).map(|&j2| (j2, off_val))
                    } else { None }
                } else { None };
                for i in 0..dim {
                    let r_ij = result[i * dim + j];
                    if r_ij.abs() < 1e-300 { continue; }
                    new_result[i * dim + j] += r_ij * diag_total;
                    if let Some((j2, off_val)) = swap_info {
                        new_result[i * dim + j2] += r_ij * off_val;
                    }
                }
            }
            *result = new_result;
        }
    };

    // Prefix: identical for parent and daughter
    let prefix = &crossings[..first_diff];
    let mut prefix_result = vec![0.0f64; dim * dim];
    for i in 0..dim { prefix_result[i * dim + i] = 1.0; }
    apply_section(&mut prefix_result, prefix, par_ordering); // same for both

    // Branch: different for parent and daughter
    let branch = &crossings[first_diff..=last_diff.min(crossings.len()-1)];
    let mut par_result = prefix_result.clone();
    let mut dau_result = prefix_result;
    apply_section(&mut par_result, branch, par_ordering);
    apply_section(&mut dau_result, branch, dau_ordering);

    // Suffix: identical again
    let suffix = &crossings[last_diff+1..];
    apply_section(&mut par_result, suffix, par_ordering);
    apply_section(&mut dau_result, suffix, dau_ordering);

    // Traces
    let tr_par: f64 = (0..dim).map(|i| par_result[i * dim + i]).sum();
    let tr_dau: f64 = (0..dim).map(|i| dau_result[i * dim + i]).sum();

    (tr_par, tr_dau)
}

/// Compute tr(ρ_λ(Δ_n)) for a typed quark ordering (single).
/// Only builds ONE matrix at a time (the accumulated result).
/// The crossing matrix is applied row-by-row without materializing it.
fn garside_trace(a: usize, b: usize, quark_ordering: &[u8], q: f64) -> f64 {
    let n = a + b;
    assert_eq!(n, quark_ordering.len());

    let ha = q - 1.0 / q;
    let tabs = generate_syt(a, b);
    let dim = tabs.len();
    if dim == 0 { return 0.0; }

    // Index lookup for swapped tableaux
    let mut tab_idx: std::collections::HashMap<Vec<bool>, usize> = std::collections::HashMap::new();
    for (i, t) in tabs.iter().enumerate() {
        tab_idx.insert(t.clone(), i);
    }

    // Result matrix: start with identity
    let mut result = vec![0.0f64; dim * dim];
    for i in 0..dim { result[i * dim + i] = 1.0; }

    // Apply each crossing in Garside order (right-to-left sweep)
    for level in 0..n - 1 {
        for sweep in (0..=level).rev() {
            // Typed crossing coefficient
            let ti = quark_ordering[sweep];
            let tj = quark_ordering[level + 1];
            let d_coeff = match (ti, tj) {
                (b'u', b'u') | (b'p', b'p') => 0.0,
                (b'd', b'd') | (b'n', b'n') => -ha,
                _ => -ha / 2.0,
            };

            // SPARSE IN-PLACE: each crossing is a 2×2 block on column pairs.
            // Precompute the crossing structure for this generator.
            // Process swap pairs together, unpaired columns just scale.
            // NO allocation — update result in place.

            let mut processed = vec![false; dim];
            for j in 0..dim {
                if processed[j] { continue; }
                let (diag_j, off_j) = seminormal_entry(&tabs[j], sweep, q);
                let dj = diag_j + d_coeff;

                if let Some(off_val_j) = off_j {
                    // j has a swap partner — find it
                    if let Some(swapped) = syt_swap(&tabs[j], sweep + 1) {
                        if let Some(&j2) = tab_idx.get(&swapped) {
                            if !processed[j2] {
                                // Process pair (j, j2) as a 2×2 block
                                let (diag_j2, _) = seminormal_entry(&tabs[j2], sweep, q);
                                let dj2 = diag_j2 + d_coeff;
                                // The off-diagonal from j2 to j
                                let off_val_j2 = if let Some(sw2) = syt_swap(&tabs[j2], sweep + 1) {
                                    if tab_idx.get(&sw2) == Some(&j) {
                                        seminormal_entry(&tabs[j2], sweep, q).1.unwrap_or(0.0)
                                    } else { 0.0 }
                                } else { 0.0 };

                                // In-place 2×2: for each row i:
                                //   result[i,j]  = old[i,j]*dj + old[i,j2]*off_j2
                                //   result[i,j2] = old[i,j]*off_j + old[i,j2]*dj2
                                for i in 0..dim {
                                    let rj = result[i * dim + j];
                                    let rj2 = result[i * dim + j2];
                                    result[i * dim + j]  = rj * dj  + rj2 * off_val_j2;
                                    result[i * dim + j2] = rj * off_val_j + rj2 * dj2;
                                }
                                processed[j] = true;
                                processed[j2] = true;
                                continue;
                            }
                        }
                    }
                }

                // Unpaired or partner already processed: just scale column j
                if !processed[j] {
                    for i in 0..dim {
                        result[i * dim + j] *= dj;
                    }
                    processed[j] = true;
                }
            }
        }
    }

    // Trace
    let mut tr = 0.0;
    for i in 0..dim { tr += result[i * dim + i]; }
    tr
}

// ════════════════════════════════════════════════════════════════
// Vector action: O(dim) per crossing instead of O(dim²)
// ════════════════════════════════════════════════════════════════

/// Apply one crossing to a vector (not matrix). O(dim) per crossing.
fn apply_crossing_to_vec(
    vec: &mut [f64],
    tabs: &[Vec<bool>],
    tab_idx: &std::collections::HashMap<Vec<bool>, usize>,
    sweep: usize,
    d_coeff: f64,
    q: f64,
) {
    let dim = vec.len();
    let mut processed = vec![false; dim];
    for j in 0..dim {
        if processed[j] { continue; }
        let (diag_j, off_j) = seminormal_entry(&tabs[j], sweep, q);
        let dj = diag_j + d_coeff;

        if let Some(off_val) = off_j {
            if let Some(swapped) = syt_swap(&tabs[j], sweep + 1) {
                if let Some(&j2) = tab_idx.get(&swapped) {
                    if !processed[j2] {
                        let (diag_j2, _) = seminormal_entry(&tabs[j2], sweep, q);
                        let dj2 = diag_j2 + d_coeff;
                        let off_val_j2 = seminormal_entry(&tabs[j2], sweep, q).1.unwrap_or(0.0);
                        let vj = vec[j];
                        let vj2 = vec[j2];
                        vec[j]  = vj * dj  + vj2 * off_val_j2;
                        vec[j2] = vj * off_val + vj2 * dj2;
                        processed[j] = true;
                        processed[j2] = true;
                        continue;
                    }
                }
            }
        }
        if !processed[j] {
            vec[j] *= dj;
            processed[j] = true;
        }
    }
}

/// Apply full Garside staircase to a vector. Returns the resulting vector.
fn garside_vec_action(
    a: usize, b: usize,
    quark_ordering: &[u8],
    initial: &[f64],
    q: f64,
) -> Vec<f64> {
    let n = a + b;
    let ha = q - 1.0 / q;
    let tabs = generate_syt(a, b);
    let dim = tabs.len();

    let mut tab_idx: std::collections::HashMap<Vec<bool>, usize> = std::collections::HashMap::new();
    for (i, t) in tabs.iter().enumerate() {
        tab_idx.insert(t.clone(), i);
    }

    let mut vec = initial.to_vec();
    for level in 0..n-1 {
        for sweep in (0..=level).rev() {
            let ti = quark_ordering[sweep];
            let tj = quark_ordering[level + 1];
            let d_coeff = match (ti, tj) {
                (b'u', b'u') | (b'p', b'p') => 0.0,
                (b'd', b'd') | (b'n', b'n') => -ha,
                _ => -ha / 2.0,
            };
            apply_crossing_to_vec(&mut vec, &tabs, &tab_idx, sweep, d_coeff, q);
        }
    }
    vec
}

// ════════════════════════════════════════════════════════════════
// Knot operator eigenvectors (confinement)
// ════════════════════════════════════════════════════════════════

/// Knot operator braid words.
fn knot_braid(name: &str) -> Vec<i32> {
    match name {
        "T23" | "trefoil" => vec![0, 1, 0],
        "T25" | "cinquefoil" => vec![0, 1, 0, 1, 0],
        "T34" => vec![0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2],
        "T35" | "weak" => vec![0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2],
        "borromean" | "B3" => vec![0, -2, 0, -2, 0, -2],  // σ₀σ₁⁻¹σ₀σ₁⁻¹σ₀σ₁⁻¹
        "figure8" | "41" => vec![0, -2, 0, -2],  // σ₀σ₁⁻¹σ₀σ₁⁻¹
        _ => vec![0, 1, 0],  // default: trefoil
    }
}

/// Apply a knot operator (braid word) to a vector.
fn apply_knot_to_vec(
    vec: &mut [f64],
    tabs: &[Vec<bool>],
    tab_idx: &std::collections::HashMap<Vec<bool>, usize>,
    braid: &[i32],
    q: f64,
) {
    let ha = q - 1.0 / q;
    for &gen in braid {
        let (sweep, d_coeff) = if gen >= 0 {
            (gen as usize, 0.0)  // positive crossing: σ
        } else {
            ((-gen - 1) as usize, -ha)  // negative crossing: σ⁻¹ = σ - h
        };
        apply_crossing_to_vec(vec, tabs, tab_idx, sweep, d_coeff, q);
    }
}

/// Find min-eigenvalue eigenvector of a knot operator via shift-and-invert.
/// Power iteration on (λ_max·I - K) finds the vector with smallest eigenvalue of K.
fn knot_eigenvector_min(
    a: usize, b: usize, knot_name: &str, q: f64, n_iter: usize,
) -> (Vec<f64>, f64) {
    let tabs = generate_syt(a, b);
    let dim = tabs.len();
    if dim == 0 { return (vec![], 0.0); }

    let mut tab_idx: std::collections::HashMap<Vec<bool>, usize> = std::collections::HashMap::new();
    for (i, t) in tabs.iter().enumerate() {
        tab_idx.insert(t.clone(), i);
    }

    let braid = knot_braid(knot_name);

    // First find λ_max via power iteration
    let mut v = vec![1.0 / (dim as f64).sqrt(); dim];
    let mut lambda_max = 0.0f64;
    for _ in 0..n_iter {
        apply_knot_to_vec(&mut v, &tabs, &tab_idx, &braid, q);
        let norm: f64 = v.iter().map(|x| x * x).sum::<f64>().sqrt();
        if norm < 1e-300 { break; }
        lambda_max = norm * v.iter().sum::<f64>().signum();  // signed
        for x in v.iter_mut() { *x /= norm; }
    }
    lambda_max = lambda_max.abs() * 1.1;  // shift slightly above max

    // Now power iteration on (λ_max·I - K) to find min eigenvalue of K
    let mut v = vec![1.0 / (dim as f64).sqrt(); dim];
    let mut lambda_shifted = 0.0f64;
    for _ in 0..n_iter {
        // Apply K
        let mut kv = v.clone();
        apply_knot_to_vec(&mut kv, &tabs, &tab_idx, &braid, q);
        // shifted = λ_max * v - Kv
        for j in 0..dim {
            v[j] = lambda_max * v[j] - kv[j];
        }
        let norm: f64 = v.iter().map(|x| x * x).sum::<f64>().sqrt();
        if norm < 1e-300 { break; }
        lambda_shifted = norm;
        for x in v.iter_mut() { *x /= norm; }
    }
    let lambda_min = lambda_max - lambda_shifted;

    (v, lambda_min)
}

// ════════════════════════════════════════════════════════════════
// Main
// ════════════════════════════════════════════════════════════════

fn main() {
    let args: Vec<String> = std::env::args().collect();
    if args.len() < 2 {
        eprintln!("hecke-irrep v14 — Per-irrep Garside via Young's seminormal form");
        eprintln!("Usage:");
        eprintln!("  hecke-irrep PARENT DAUGHTER [max_dim]     # matrix mode (full trace)");
        eprintln!("  hecke-irrep --vector PARENT DAUGHTER      # vector mode (all diagonals)");
        eprintln!("  hecke-irrep --confine PARENT DAUGHTER [KNOT]  # confinement eigenvector");
        eprintln!("  hecke-irrep --knots PARENT DAUGHTER       # all 6 knot operators");
        std::process::exit(1);
    }

    // Check for mode flags
    let mode = if args[1] == "--vector" { "vector" }
        else if args[1] == "--confine" { "confine" }
        else if args[1] == "--knots" { "knots" }
        else { "matrix" };

    let arg_offset = if mode != "matrix" { 1 } else { 0 };

    let q0 = compute_q0();
    let ha = q0 - 1.0 / q0;

    let par_str = &args[1 + arg_offset];
    let dau_str = if args.len() > 2 + arg_offset { &args[2 + arg_offset] } else { par_str };
    let max_dim: usize = args.get(3 + arg_offset).and_then(|s| s.parse().ok()).unwrap_or(usize::MAX);

    let par_types: Vec<u8> = par_str.chars().map(|c| match c {
        'u' | 'p' | '1' => b'p', _ => b'n',
    }).collect();
    let dau_types: Vec<u8> = dau_str.chars().map(|c| match c {
        'u' | 'p' | '1' => b'p', _ => b'n',
    }).collect();

    let n = par_types.len();
    assert_eq!(n, dau_types.len(), "Parent and daughter must have same length");

    eprintln!("hecke-irrep v14 — q₀ = {:.15} (mode: {})", q0, mode);
    eprintln!("  parent:   {} (n={})", par_str, n);
    eprintln!("  daughter: {}", dau_str);

    // ── Confine mode: single knot operator, min-eigenvalue ──────
    if mode == "confine" || mode == "knots" {
        // Filter knot operators by strand count (max generator index + 1 ≤ n)
        let all_knots = vec!["trefoil", "cinquefoil", "T34", "weak", "borromean", "figure8"];
        let knot_names: Vec<&str> = if mode == "knots" {
            all_knots.into_iter().filter(|kn| {
                let max_gen = knot_braid(kn).iter().map(|g| if *g >= 0 { *g } else { -g - 1 }).max().unwrap_or(0);
                (max_gen as usize + 1) < n  // need at least max_gen+2 strands
            }).collect()
        } else {
            let kn = args.get(3 + arg_offset).map(|s| s.as_str()).unwrap_or("borromean");
            vec![kn]
        };

        let partitions: Vec<(usize, usize)> = (0..=n/2).map(|b| (n - b, b)).collect();
        let t_total = Instant::now();

        for knot_name in &knot_names {
            let mut total_dme = 0.0f64;
            eprintln!("\n  Knot: {} ({})", knot_name, knot_braid(knot_name).iter()
                .map(|g| if *g >= 0 { format!("σ{}", g) } else { format!("σ{}⁻¹", -g-1) })
                .collect::<Vec<_>>().join("·"));

            for &(a, b) in &partitions {
                let tabs = generate_syt(a, b);
                let dim = tabs.len();
                if dim == 0 || dim > max_dim { continue; }

                let t0 = Instant::now();

                // Find min-eigenvalue eigenvector for this knot in this irrep
                // Use 3-strand knot in the first 3 strands of n-strand rep
                let (eigvec, lambda_min) = knot_eigenvector_min(a, b, knot_name, q0, 50);
                if eigvec.is_empty() { continue; }

                // Apply Garside to eigenvector for parent and daughter
                let v_par = garside_vec_action(a, b, &par_types, &eigvec, q0);
                let v_dau = garside_vec_action(a, b, &dau_types, &eigvec, q0);

                // Matrix elements
                let me_par: f64 = eigvec.iter().zip(v_par.iter()).map(|(a, b)| a * b).sum();
                let me_dau: f64 = eigvec.iter().zip(v_dau.iter()).map(|(a, b)| a * b).sum();
                let dme = me_par - me_dau;
                total_dme += dme;

                let elapsed = t0.elapsed().as_secs_f64();
                eprintln!("    λ=({},{}): dim={:>6}, λ_min={:>+.4}, Δme={:>+.6e}, {:.3}s",
                    a, b, dim, lambda_min, dme, elapsed);
            }

            let q_pred = total_dme.abs() * M_E_MEV;
            eprintln!("  {} → Q = {:.4} MeV (Σ Δme = {:+.6e})", knot_name, q_pred, total_dme);

            // JSON line
            println!("{{\"knot\":\"{}\",\"total_dme\":{:.10e},\"q_mev\":{:.6}}}",
                knot_name, total_dme, q_pred);
        }

        let elapsed_total = t_total.elapsed().as_secs_f64();
        eprintln!("\n  Total: {:.1}s", elapsed_total);
        return;
    }

    // ── Vector mode: all diagonal elements ──────────────────────
    if mode == "vector" {
        let partitions: Vec<(usize, usize)> = (0..=n/2).map(|b| (n - b, b)).collect();
        let t_total = Instant::now();
        let mut total_dtr = 0.0f64;

        for &(a, b) in &partitions {
            let tabs = generate_syt(a, b);
            let dim = tabs.len();
            if dim == 0 || dim > max_dim { continue; }

            let t0 = Instant::now();
            let mut sum_dme = 0.0f64;

            // For each basis vector, compute diagonal matrix element
            for j in 0..dim {
                let mut e_j = vec![0.0f64; dim];
                e_j[j] = 1.0;

                let v_par = garside_vec_action(a, b, &par_types, &e_j, q0);
                let v_dau = garside_vec_action(a, b, &dau_types, &e_j, q0);

                sum_dme += v_par[j] - v_dau[j];
            }
            total_dtr += sum_dme;

            let elapsed = t0.elapsed().as_secs_f64();
            eprintln!("  λ=({},{}): dim={:>6}, Δtr={:>+.6e}, {:.1}s", a, b, dim, sum_dme, elapsed);
        }

        let q_pred = total_dtr.abs() * M_E_MEV;
        let elapsed_total = t_total.elapsed().as_secs_f64();
        eprintln!("\n  Σ Δtr = {:+.10e}", total_dtr);
        eprintln!("  Q = |Σ Δtr| × m_e = {:.4} MeV", q_pred);
        eprintln!("  Total: {:.1}s", elapsed_total);
        println!("{{\"mode\":\"vector\",\"total_dtr\":{:.10e},\"q_mev\":{:.6},\"elapsed_s\":{:.3}}}",
            total_dtr, q_pred, elapsed_total);
        return;
    }

    // ── Matrix mode (original) ──────────────────────────────────
    // 2-row partitions of n
    let partitions: Vec<(usize, usize)> = (0..=n/2).map(|b| (n - b, b)).collect();

    eprintln!("  {} two-row irreps", partitions.len());

    let t_total = Instant::now();

    // Memory-aware scheduling: parallel for small irreps, sequential for large
    // Each irrep needs 2 × dim² × 8 bytes of working memory
    let mem_limit: usize = 2 * 1024 * 1024 * 1024; // 2 GB budget
    let dim_threshold = ((mem_limit / 16) as f64).sqrt() as usize; // max dim for parallel

    eprintln!("  Memory budget: {} GB, parallel threshold: dim ≤ {}", mem_limit / (1024*1024*1024), dim_threshold);

    // Split into small (parallel) and large (sequential)
    let mut small_parts: Vec<(usize, usize)> = Vec::new();
    let mut large_parts: Vec<(usize, usize)> = Vec::new();

    for &(a, b) in &partitions {
        let dim = generate_syt(a, b).len();
        if dim > max_dim { continue; }
        if dim <= dim_threshold { small_parts.push((a, b)); }
        else { large_parts.push((a, b)); }
    }

    eprintln!("  {} small irreps (parallel), {} large irreps (sequential)",
        small_parts.len(), large_parts.len());

    // Small irreps in parallel — use pair optimization
    let small_results: Vec<(usize, usize, usize, f64, f64, f64, f64)> = small_parts.par_iter()
        .map(|&(a, b)| {
            let dim = generate_syt(a, b).len();
            let t0 = Instant::now();
            let (tr_par, tr_dau) = garside_trace_pair(a, b, &par_types, &dau_types, q0);
            let dtr = tr_par - tr_dau;
            let elapsed = t0.elapsed().as_secs_f64();
            eprintln!("  λ=({},{}): dim={:>6}, Δtr={:>+14.6e}, {:.1}s", a, b, dim, dtr, elapsed);
            (a, b, dim, tr_par, tr_dau, dtr, elapsed)
        })
        .collect();

    // Large irreps sequentially — use pair optimization
    let mut large_results: Vec<(usize, usize, usize, f64, f64, f64, f64)> = Vec::new();
    for &(a, b) in &large_parts {
        let dim = generate_syt(a, b).len();
        let mem_mb = 3 * dim * dim * 8 / (1024 * 1024); // prefix + par + dau
        eprintln!("  λ=({},{}): dim={:>6} ({} MB, prefix/branch/suffix) ...", a, b, dim, mem_mb);
        let t0 = Instant::now();
        let (tr_par, tr_dau) = garside_trace_pair(a, b, &par_types, &dau_types, q0);
        let dtr = tr_par - tr_dau;
        let elapsed = t0.elapsed().as_secs_f64();
        eprintln!("    Δtr={:>+14.6e}, {:.1}s", dtr, elapsed);
        large_results.push((a, b, dim, tr_par, tr_dau, dtr, elapsed));
    }

    let mut results: Vec<(usize, usize, usize, f64, f64, f64, f64)> = small_results;
    results.extend(large_results);
    results.sort_by_key(|r| r.1); // sort by b (second part of partition)

    let total_dtr: f64 = results.iter().map(|r| r.5).sum();
    let q_pred = total_dtr.abs() * M_E_MEV;
    let elapsed_total = t_total.elapsed().as_secs_f64();

    eprintln!("\n  Σ Δtr = {:+.10e}", total_dtr);
    eprintln!("  Q = |Σ Δtr| × m_e = {:.4} MeV", q_pred);
    eprintln!("  Total: {:.1}s", elapsed_total);

    // JSON output
    print!("{{\"parent\":\"{}\",\"daughter\":\"{}\",\"n\":{},\"n_irreps\":{}", par_str, dau_str, n, results.len());
    print!(",\"irreps\":[");
    for (i, (a, b, dim, tr_p, tr_d, dtr, t)) in results.iter().enumerate() {
        if i > 0 { print!(","); }
        print!("{{\"a\":{},\"b\":{},\"dim\":{},\"tr_par\":{:.10e},\"tr_dau\":{:.10e},\"dtr\":{:.10e},\"time\":{:.3}}}",
            a, b, dim, tr_p, tr_d, dtr, t);
    }
    println!("],\"total_dtr\":{:.10e},\"q_mev\":{:.6},\"q0\":{:.15},\"m_e_mev\":{},\"elapsed_s\":{:.3}}}",
        total_dtr, q_pred, q0, M_E_MEV, elapsed_total);
}
