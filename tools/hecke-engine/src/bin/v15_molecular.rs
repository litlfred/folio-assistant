// v15_molecular: Molecular binding via per-irrep Garside on full tower.
//
// Combines two atoms A and B with bond crossings between them.
// The molecular braid lives in H_n(q) where n = n_A + n_B.
//
// For H₂: n = 2 (1 proton + 1 proton, each 1 strand as nucleons).
// But with electrons: n = 4 (2 protons + 2 electrons).
//
// The computation:
//   1. Build molecular ordering: [A nucleons, A electrons, B nucleons, B electrons]
//   2. Garside staircase for the full molecular ordering
//   3. Insert bond crossings (inverse trefoil etc.) at the boundary
//   4. Per-irrep trace → Wedderburn sum → Φ₁
//
// Usage:
//   hecke-molecular ATOM_A ATOM_B [--bond BRAID] [--scan]

use std::time::Instant;
use std::collections::HashMap;

const VOL_FIGURE_EIGHT: f64 = 2.029883212819307;
const MASS_RATIO_MU_E: f64 = 206.7682830;
const M_E_MEV: f64 = 0.51099895000;

fn compute_q0() -> f64 {
    let hbar_q = (VOL_FIGURE_EIGHT / MASS_RATIO_MU_E).sqrt();
    1.0 / (1.0 - hbar_q)
}

// ════════════════════════════════════════════════════════════════
// Young tableaux (same as v14_irrep)
// ════════════════════════════════════════════════════════════════

fn generate_syt(a: usize, b: usize) -> Vec<Vec<bool>> {
    let n = a + b;
    let mut result = Vec::new();
    let mut current = Vec::with_capacity(n);
    fn recurse(current: &mut Vec<bool>, a: usize, b: usize, r1: usize, r2: usize, result: &mut Vec<Vec<bool>>) {
        let n = a + b;
        if current.len() == n { result.push(current.clone()); return; }
        if r1 < a { current.push(true); recurse(current, a, b, r1+1, r2, result); current.pop(); }
        if r2 < b && r2 < r1 { current.push(false); recurse(current, a, b, r1, r2+1, result); current.pop(); }
    }
    recurse(&mut current, a, b, 0, 0, &mut result);
    result
}

fn syt_content(tab: &[bool], v: usize) -> i32 {
    let mut r1 = 0; let mut r2 = 0;
    for i in 0..v { if tab[i] { r1 += 1; } else { r2 += 1; } }
    if tab[v-1] { (r1-1) as i32 } else { (r2-1) as i32 - 1 }
}

fn syt_swap(tab: &[bool], k: usize) -> Option<Vec<bool>> {
    if tab[k-1] == tab[k] { return None; }
    let mut new_tab = tab.to_vec();
    new_tab[k-1] = tab[k]; new_tab[k] = tab[k-1];
    let mut r1 = 0i32; let mut r2 = 0i32;
    for &in_row1 in &new_tab {
        if in_row1 { r1 += 1; } else { r2 += 1; }
        if r2 > r1 { return None; }
    }
    Some(new_tab)
}

fn seminormal_entry(tab: &[bool], gen_k: usize, q: f64) -> (f64, Option<f64>) {
    let k = gen_k + 1;
    let qi = 1.0 / q;
    let ha = q - qi;
    let d = syt_content(tab, k+1) - syt_content(tab, k);
    if d == 0 { panic!("d=0 at gen_k={}", gen_k); }
    if d == 1 { (q, None) }
    else if d == -1 { (-qi, None) }
    else {
        let qd = q.powi(d); let qdi = q.powi(-d);
        let diag = ha / (qd - qdi);
        let off = (1.0 - diag*diag).max(0.0).sqrt();
        (diag, Some(off))
    }
}

// ════════════════════════════════════════════════════════════════
// Crossing application (from v14)
// ════════════════════════════════════════════════════════════════

fn apply_crossing_to_vec(
    vec: &mut [f64], tabs: &[Vec<bool>],
    tab_idx: &HashMap<Vec<bool>, usize>,
    sweep: usize, d_coeff: f64, q: f64,
) {
    let dim = vec.len();
    let mut processed = vec![false; dim];
    for j in 0..dim {
        if processed[j] { continue; }
        let (diag_j, off_j) = seminormal_entry(&tabs[j], sweep, q);
        let dj = diag_j + d_coeff;
        if let Some(off_val) = off_j {
            if let Some(swapped) = syt_swap(&tabs[j], sweep+1) {
                if let Some(&j2) = tab_idx.get(&swapped) {
                    if !processed[j2] {
                        let (diag_j2, _) = seminormal_entry(&tabs[j2], sweep, q);
                        let dj2 = diag_j2 + d_coeff;
                        let off_val_j2 = seminormal_entry(&tabs[j2], sweep, q).1.unwrap_or(0.0);
                        let vj = vec[j]; let vj2 = vec[j2];
                        vec[j] = vj*dj + vj2*off_val_j2;
                        vec[j2] = vj*off_val + vj2*dj2;
                        processed[j] = true; processed[j2] = true;
                        continue;
                    }
                }
            }
        }
        if !processed[j] { vec[j] *= dj; processed[j] = true; }
    }
}

// ════════════════════════════════════════════════════════════════
// Molecular computation
// ════════════════════════════════════════════════════════════════

/// Build molecular strand ordering.
/// Each atom contributes: nucleons (interleaved p/n) + electrons (e).
/// Returns Vec<u8> where b'p' = proton, b'n' = neutron, b'e' = electron.
fn atom_strands(z: usize, n: usize) -> Vec<u8> {
    let a = z + n;
    let mut strands = Vec::new();
    let mut pc = 0usize; let mut nc = 0usize;
    for k in 0..a {
        if k % 2 == 0 && pc < z { strands.push(b'p'); pc += 1; }
        else if nc < n { strands.push(b'n'); nc += 1; }
        else { strands.push(b'p'); pc += 1; }
    }
    for _ in 0..z { strands.push(b'e'); }
    strands
}

/// Crossing coefficient for strand pair.
fn crossing_coeff(ti: u8, tj: u8, ha: f64) -> f64 {
    match (ti, tj) {
        (b'p', b'p') => 0.0,           // pp: σ (d=0)
        (b'n', b'n') => -ha,            // nn: σ⁻¹ (d=-h)
        (b'p', b'n') | (b'n', b'p') => -ha / 2.0,  // pn: mixed
        (b'p', b'e') | (b'e', b'p') => -ha,  // pe: σ⁻¹ (EM attraction)
        (b'e', b'e') => 0.0,            // ee: σ (EM repulsion)
        _ => 0.0,  // ne: identity (skip — handled by not adding crossing)
    }
}

fn is_identity_crossing(ti: u8, tj: u8) -> bool {
    (ti == b'n' && tj == b'e') || (ti == b'e' && tj == b'n')
}

/// Compute per-irrep Garside trace for molecular ordering.
/// The ordering includes strands from both atoms.
/// Bond crossings are inserted at generators between the two atoms.
fn molecular_garside_trace(
    a_part: usize, b_part: usize,  // partition shape
    mol_ordering: &[u8],           // full molecular strand ordering
    bond_generators: &[(usize, f64)],  // (generator_index, d_coeff) for bond crossings
    q: f64,
) -> f64 {
    let n = a_part + b_part;
    assert_eq!(n, mol_ordering.len());
    let ha = q - 1.0 / q;

    let tabs = generate_syt(a_part, b_part);
    let dim = tabs.len();
    if dim == 0 { return 0.0; }

    let mut tab_idx = HashMap::new();
    for (i, t) in tabs.iter().enumerate() { tab_idx.insert(t.clone(), i); }

    // Start with identity vector (trace = sum of diagonal elements)
    // We compute trace by summing diagonal of product matrix.
    // For each basis vector e_j, compute (product * e_j)[j] and sum over j.
    let mut total_trace = 0.0f64;

    for j in 0..dim {
        let mut v = vec![0.0f64; dim];
        v[j] = 1.0;

        // Apply Garside staircase crossings
        for level in 0..n-1 {
            for sweep in (0..=level).rev() {
                let ti = mol_ordering[sweep];
                let tj = mol_ordering[level + 1];

                if is_identity_crossing(ti, tj) { continue; }

                let d_coeff = crossing_coeff(ti, tj, ha);
                apply_crossing_to_vec(&mut v, &tabs, &tab_idx, sweep, d_coeff, q);
            }
        }

        // Apply bond crossings (additional crossings at specific generators)
        for &(gen, d_coeff) in bond_generators {
            apply_crossing_to_vec(&mut v, &tabs, &tab_idx, gen, d_coeff, q);
        }

        total_trace += v[j];
    }

    total_trace
}

// ════════════════════════════════════════════════════════════════
// Main
// ════════════════════════════════════════════════════════════════

fn main() {
    let args: Vec<String> = std::env::args().collect();
    if args.len() < 3 {
        eprintln!("hecke-molecular v15 — Molecular binding on full tower");
        eprintln!("Usage:");
        eprintln!("  hecke-molecular Z1,N1 Z2,N2 [--bond CROSSINGS] [--scan N]");
        eprintln!("Example:");
        eprintln!("  hecke-molecular 1,0 1,0                    # H₂ unbonded");
        eprintln!("  hecke-molecular 1,0 1,0 --bond -1,-2,-1    # H₂ with inv trefoil");
        eprintln!("  hecke-molecular 1,0 1,0 --scan 6           # H₂ scan 1-6 inv crossings");
        eprintln!("  hecke-molecular 6,6 1,0 --scan 6           # C-H scan");
        std::process::exit(1);
    }

    let q0 = compute_q0();
    let ha = q0 - 1.0 / q0;

    // Parse atoms
    let parse_atom = |s: &str| -> (usize, usize) {
        let parts: Vec<&str> = s.split(',').collect();
        (parts[0].parse().unwrap(), parts[1].parse().unwrap())
    };

    let (z1, n1) = parse_atom(&args[1]);
    let (z2, n2) = parse_atom(&args[2]);

    // Build molecular ordering
    let strands_a = atom_strands(z1, n1);
    let strands_b = atom_strands(z2, n2);
    let mol_ordering: Vec<u8> = strands_a.iter().chain(strands_b.iter()).copied().collect();
    let n_total = mol_ordering.len();
    let n_a = strands_a.len();

    eprintln!("hecke-molecular v15");
    eprintln!("  Atom A: Z={}, N={} ({} strands)", z1, n1, n_a);
    eprintln!("  Atom B: Z={}, N={} ({} strands)", z2, n2, strands_b.len());
    eprintln!("  Molecular: {} total strands", n_total);
    eprintln!("  q₀ = {:.15}", q0);

    // Bond generator: the generator at position n_a - 1 connects the last
    // strand of A to the first strand of B.
    let bond_gen = n_a - 1;
    eprintln!("  Bond generator: σ_{}", bond_gen);

    // Parse bond or scan mode
    let scan_mode = args.iter().position(|a| a == "--scan");
    let bond_arg = args.iter().position(|a| a == "--bond");

    // Wedderburn weights
    let q_int = |k: i32| -> f64 { (q0.powi(k) - q0.powi(-k)) / ha };
    let nf3 = q_int(1) * q_int(2) * q_int(3);
    let dim_std = q_int(2);
    let w_s = 1.0 / nf3;
    let w_d = dim_std * dim_std / nf3;
    let w_a = 1.0 / nf3;
    let w_total = w_s + w_d + w_a;

    let alpha_em = (1.0/q0) / (q_int(9) * q_int(10));
    let e_hartree = 511000.0 * alpha_em * alpha_em;
    let two_q = q0 + 1.0/q0;
    let e_mol = e_hartree / (two_q * two_q);

    eprintln!("  E_mol = {:.4} eV", e_mol);

    // Compute per-irrep traces
    let partitions: Vec<(usize, usize)> = (0..=n_total/2).map(|b| (n_total - b, b)).collect();
    let max_dim: usize = 5000;  // limit for feasibility

    if let Some(scan_pos) = scan_mode {
        let max_k: usize = args.get(scan_pos + 1).and_then(|s| s.parse().ok()).unwrap_or(6);

        eprintln!("\n  Scanning k = 0..{} inverse crossings at bond gen {}", max_k, bond_gen);

        // Compute unbonded trace first
        let t0 = Instant::now();

        for k in 0..=max_k {
            let bond_crossings: Vec<(usize, f64)> = (0..k).map(|_| (bond_gen, -ha)).collect();

            let mut total_weighted = 0.0f64;

            for &(a, b) in &partitions {
                let dim = generate_syt(a, b).len();
                if dim == 0 || dim > max_dim { continue; }

                let tr = molecular_garside_trace(a, b, &mol_ordering, &bond_crossings, q0);

                // Wedderburn weight for this irrep
                // For 2-row partition (a,b): qdim = [a-b+1]_q × ... / hook lengths
                // Simplified: weight ∝ dim²
                let w = (dim * dim) as f64;
                total_weighted += w * tr;
            }

            eprintln!("  k={}: weighted_tr = {:.6e}", k, total_weighted);
        }

        // Simpler: just report raw per-irrep traces
        eprintln!("\n  Per-irrep detail for each k:");
        for k in 0..=max_k {
            let bond_crossings: Vec<(usize, f64)> = (0..k).map(|_| (bond_gen, -ha)).collect();

            let mut phi1 = 0.0f64;
            let mut ok = true;

            for &(a, b) in &partitions {
                let dim = generate_syt(a, b).len();
                if dim == 0 || dim > max_dim { continue; }

                let tr = molecular_garside_trace(a, b, &mol_ordering, &bond_crossings, q0);
                if tr.abs() > 1e-300 {
                    phi1 += tr.abs().ln();
                }

                if k == 0 || k == 1 || k == 3 {
                    eprintln!("    k={}, λ=({},{}): dim={}, tr={:.6e}", k, a, b, dim, tr);
                }
            }

            println!("{{\"k\":{},\"phi1\":{:.10},\"e_mol\":{:.4}}}", k, phi1, e_mol);
        }

        let elapsed = t0.elapsed().as_secs_f64();
        eprintln!("\n  Total: {:.1}s", elapsed);
    } else {
        // Single computation
        let bond_crossings: Vec<(usize, f64)> = if let Some(bp) = bond_arg {
            args.get(bp + 1).map(|s| {
                s.split(',').map(|g| {
                    let gi: i32 = g.parse().unwrap();
                    if gi >= 0 { (gi as usize, 0.0) }
                    else { ((-gi - 1) as usize, -ha) }
                }).collect()
            }).unwrap_or_default()
        } else {
            vec![]
        };

        eprintln!("  Bond crossings: {} at gen {}", bond_crossings.len(), bond_gen);

        let t0 = Instant::now();
        for &(a, b) in &partitions {
            let dim = generate_syt(a, b).len();
            if dim == 0 || dim > max_dim { continue; }

            let tr = molecular_garside_trace(a, b, &mol_ordering, &bond_crossings, q0);
            eprintln!("  λ=({},{}): dim={}, tr={:.6e}", a, b, dim, tr);
        }
        let elapsed = t0.elapsed().as_secs_f64();
        eprintln!("  Total: {:.1}s", elapsed);
    }
}
