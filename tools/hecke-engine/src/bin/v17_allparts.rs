// v17_allparts: Full partition decomposition for H_n(q).
//
// Extends v16 tensor to ALL partitions, not just 2-row.
// Atoms with 3 strand types (p, n, e) need 3+ row partitions.
//
// Partitions of n: all λ = (λ₁ ≥ λ₂ ≥ ... ≥ λ_k > 0) with Σλᵢ = n.
// Each partition gives an irrep of H_n(q) via Young's seminormal form.
//
// Usage: hecke-allparts Z1,N1 Z2,N2 --scan K

use std::time::Instant;
use std::collections::HashMap;

const VOL_FIGURE_EIGHT: f64 = 2.029883212819307;
const MASS_RATIO_MU_E: f64 = 206.7682830;

fn compute_q0() -> f64 {
    let hbar_q = (VOL_FIGURE_EIGHT / MASS_RATIO_MU_E).sqrt();
    1.0 / (1.0 - hbar_q)
}

// ════════════════════════════════════════════════════════════════
// General partitions and SYT
// ════════════════════════════════════════════════════════════════

/// Generate all partitions of n.
fn partitions_of(n: usize) -> Vec<Vec<usize>> {
    let mut result = Vec::new();
    let mut current = Vec::new();
    fn recurse(remaining: usize, max_part: usize, current: &mut Vec<usize>, result: &mut Vec<Vec<usize>>) {
        if remaining == 0 { result.push(current.clone()); return; }
        for p in (1..=remaining.min(max_part)).rev() {
            current.push(p);
            recurse(remaining - p, p, current, result);
            current.pop();
        }
    }
    recurse(n, n, &mut current, &mut result);
    result
}

/// Standard Young tableau for general shape λ.
/// Encoded as Vec<(usize, usize)> where entry[i] = (row, col) of value i+1.
#[derive(Clone, Debug, PartialEq, Eq, Hash)]
struct SYT {
    placement: Vec<(usize, usize)>,  // placement[i] = (row, col) for value i+1
    shape: Vec<usize>,
}

/// Generate all SYT for shape λ.
fn generate_syt_general(shape: &[usize]) -> Vec<SYT> {
    let n: usize = shape.iter().sum();
    let mut result = Vec::new();
    let mut current_fill = vec![0usize; shape.len()]; // how many cells filled in each row
    let mut placement = Vec::with_capacity(n);

    fn recurse(
        val: usize, n: usize, shape: &[usize],
        current_fill: &mut Vec<usize>, placement: &mut Vec<(usize, usize)>,
        result: &mut Vec<SYT>,
    ) {
        if val > n {
            result.push(SYT { placement: placement.clone(), shape: shape.to_vec() });
            return;
        }
        for row in 0..shape.len() {
            if current_fill[row] >= shape[row] { continue; }
            // Check: placing val in (row, current_fill[row]) must maintain column-strict
            // i.e., if row > 0, the cell above (row-1, current_fill[row]) must be filled
            let col = current_fill[row];
            if row > 0 && current_fill[row - 1] <= col { continue; }

            placement.push((row, col));
            current_fill[row] += 1;
            recurse(val + 1, n, shape, current_fill, placement, result);
            current_fill[row] -= 1;
            placement.pop();
        }
    }

    recurse(1, n, shape, &mut current_fill, &mut placement, &mut result);
    result
}

/// Content of value v (1-indexed) in tableau: col - row.
fn content(tab: &SYT, v: usize) -> i32 {
    let (row, col) = tab.placement[v - 1];
    col as i32 - row as i32
}

/// Swap values k and k+1. Returns None if result is not standard.
fn swap_values(tab: &SYT, k: usize) -> Option<SYT> {
    let n = tab.placement.len();
    if k >= n { return None; }
    // k and k+1 are 1-indexed; placement indices are k-1 and k
    let (r1, c1) = tab.placement[k - 1];
    let (r2, c2) = tab.placement[k]; // value k+1

    let mut new_tab = tab.clone();
    new_tab.placement[k - 1] = (r2, c2);
    new_tab.placement[k] = (r1, c1);

    // Check standardness: for every row, values must increase left-to-right
    // and for every column, values must increase top-to-bottom
    // Faster: only check the two swapped values
    // Value k is now at (r2, c2), value k+1 is now at (r1, c1)
    // k < k+1, so k must be in an earlier position (up-left) than k+1 (down-right)
    // Standard: row-reading is increasing along rows and columns
    // Just verify the full tableau
    for v in 1..=n {
        let (rv, cv) = new_tab.placement[v - 1];
        // Check: any value v' < v in the same row must have col < cv
        // Any value v' < v in the same col must have row < rv
        for w in 1..v {
            let (rw, cw) = new_tab.placement[w - 1];
            if rw == rv && cw >= cv { return None; }
            if cw == cv && rw >= rv { return None; }
        }
    }

    Some(new_tab)
}

/// Seminormal form entry for transposition (k, k+1) in tableau tab.
fn seminormal_entry_gen(tab: &SYT, k: usize, q: f64) -> (f64, Option<f64>) {
    let qi = 1.0 / q;
    let ha = q - qi;
    let d = content(tab, k + 1) - content(tab, k);
    if d == 0 { panic!("d=0"); }
    if d == 1 { (q, None) }
    else if d == -1 { (-qi, None) }
    else {
        let qd = q.powi(d);
        let qdi = q.powi(-d);
        let diag = ha / (qd - qdi);
        let off = (1.0 - diag * diag).max(0.0).sqrt();
        (diag, Some(off))
    }
}

// ════════════════════════════════════════════════════════════════
// Crossing application
// ════════════════════════════════════════════════════════════════

fn apply_crossing(
    vec: &mut [f64], tabs: &[SYT],
    tab_idx: &HashMap<SYT, usize>,
    sweep: usize, d_coeff: f64, q: f64,
) {
    let dim = vec.len();
    let mut processed = vec![false; dim];
    for j in 0..dim {
        if processed[j] { continue; }
        let (diag, off) = seminormal_entry_gen(&tabs[j], sweep + 1, q);
        let dj = diag + d_coeff;
        if let Some(ov) = off {
            if let Some(sw) = swap_values(&tabs[j], sweep + 1) {
                if let Some(&j2) = tab_idx.get(&sw) {
                    if !processed[j2] {
                        let (d2, _) = seminormal_entry_gen(&tabs[j2], sweep + 1, q);
                        let dj2 = d2 + d_coeff;
                        let ov2 = seminormal_entry_gen(&tabs[j2], sweep + 1, q).1.unwrap_or(0.0);
                        let vj = vec[j]; let vj2 = vec[j2];
                        vec[j] = vj*dj + vj2*ov2;
                        vec[j2] = vj*ov + vj2*dj2;
                        processed[j] = true; processed[j2] = true; continue;
                    }
                }
            }
        }
        if !processed[j] { vec[j] *= dj; processed[j] = true; }
    }
}

// ════════════════════════════════════════════════════════════════
// Atom and molecular computation
// ════════════════════════════════════════════════════════════════

fn atom_strands(z: usize, nn: usize) -> Vec<u8> {
    let a = z + nn;
    let mut s = Vec::new();
    let mut pc = 0; let mut nc = 0;
    for k in 0..a {
        if k%2==0 && pc<z { s.push(b'p'); pc+=1; }
        else if nc<nn { s.push(b'n'); nc+=1; }
        else { s.push(b'p'); pc+=1; }
    }
    for _ in 0..z { s.push(b'e'); }
    s
}

fn is_identity(ti: u8, tj: u8) -> bool {
    (ti==b'n'&&tj==b'e')||(ti==b'e'&&tj==b'n')
}

fn cross_coeff(ti: u8, tj: u8, ha: f64) -> f64 {
    match (ti,tj) {
        (b'p',b'p')=>0.0, (b'n',b'n')=>-ha,
        (b'p',b'n')|(b'n',b'p')=>-ha/2.0,
        (b'p',b'e')|(b'e',b'p')=>-ha,
        (b'e',b'e')=>0.0,
        _=>0.0
    }
}

/// q-dimension of partition λ via hook length formula.
fn q_dim(shape: &[usize], q: f64) -> f64 {
    let ha = q - 1.0/q;
    let q_int = |k: i32| -> f64 { (q.powi(k) - q.powi(-k)) / ha };
    let q_fact = |n: usize| -> f64 {
        let mut r = 1.0;
        for k in 1..=n { r *= q_int(k as i32); }
        r
    };

    let n: usize = shape.iter().sum();
    let numer = q_fact(n);

    // Hook lengths
    let mut denom = 1.0;
    for (r, &row_len) in shape.iter().enumerate() {
        for c in 0..row_len {
            let arm = row_len - c - 1;
            let mut leg = 0;
            for r2 in (r+1)..shape.len() {
                if c < shape[r2] { leg += 1; }
            }
            let hook = arm + leg + 1;
            denom *= q_int(hook as i32);
        }
    }
    numer / denom
}

fn main() {
    let args: Vec<String> = std::env::args().collect();
    if args.len() < 3 {
        eprintln!("hecke-allparts v17 — Full partition molecular binding");
        eprintln!("Usage: hecke-allparts Z1,N1 Z2,N2 [--scan K]");
        std::process::exit(1);
    }

    let q0 = compute_q0();
    let ha = q0 - 1.0/q0;

    let parse = |s: &str| -> (usize,usize) {
        let p: Vec<&str> = s.split(',').collect();
        (p[0].parse().unwrap(), p[1].parse().unwrap())
    };
    let (z1,n1) = parse(&args[1]);
    let (z2,n2) = parse(&args[2]);

    let sa = atom_strands(z1,n1);
    let sb = atom_strands(z2,n2);
    let mut mol: Vec<u8> = Vec::new();
    mol.extend(&sa); mol.extend(&sb);
    let n = mol.len();
    let na = sa.len();

    let q_int_f = |k: i32| -> f64 { (q0.powi(k) - q0.powi(-k)) / ha };
    let alpha_em = (1.0/q0) / (q_int_f(9) * q_int_f(10));
    let e_mol = 511000.0 * alpha_em * alpha_em / (q0 + 1.0/q0).powi(2);

    eprintln!("hecke-allparts v17");
    eprintln!("  A: Z={},N={} ({} strands)", z1, n1, na);
    eprintln!("  B: Z={},N={} ({} strands)", z2, n2, sb.len());
    eprintln!("  Molecular: {} strands", n);
    eprintln!("  E_mol = {:.4} eV", e_mol);

    let max_k: usize = args.iter().position(|a| a == "--scan")
        .and_then(|p| args.get(p+1))
        .and_then(|s| s.parse().ok())
        .unwrap_or(6);

    let max_dim: usize = args.iter().position(|a| a == "--maxdim")
        .and_then(|p| args.get(p+1))
        .and_then(|s| s.parse().ok())
        .unwrap_or(1000);

    // All partitions of n
    let all_parts = partitions_of(n);
    eprintln!("  {} total partitions of {}", all_parts.len(), n);

    // Filter by dimension
    let mut parts_with_dim: Vec<(Vec<usize>, usize, f64)> = Vec::new();
    let mut total_dsq = 0.0f64;
    for p in &all_parts {
        let tabs = generate_syt_general(p);
        let dim = tabs.len();
        if dim == 0 || dim > max_dim { continue; }
        let dq = q_dim(p, q0);
        let dsq = dq * dq;
        total_dsq += dsq;
        parts_with_dim.push((p.clone(), dim, dq));
    }

    eprintln!("  {} feasible partitions (dim ≤ {})", parts_with_dim.len(), max_dim);

    // Wedderburn weights
    let weights: Vec<(Vec<usize>, usize, f64)> = parts_with_dim.iter()
        .map(|(p, dim, dq)| (p.clone(), *dim, dq*dq / total_dsq))
        .collect();

    for (p, dim, w) in &weights {
        eprintln!("    {:?}: dim={}, w={:.6}", p, dim, w);
    }

    let t0 = Instant::now();

    // Scan bond crossings
    eprintln!("\n  {:>4} {:>14} {:>14} {:>10}", "k", "weighted_tr", "Phi_w", "E(eV)");
    eprintln!("  {}", "-".repeat(46));

    let mut phi_ref = 0.0f64;

    for k in 0..=max_k {
        let mut weighted_tr = 0.0f64;

        for (part, _dim, w) in &weights {
            let tabs = generate_syt_general(part);
            let dim = tabs.len();
            let mut tab_idx = HashMap::new();
            for (i, t) in tabs.iter().enumerate() { tab_idx.insert(t.clone(), i); }

            let mut trace = 0.0f64;
            for j in 0..dim {
                let mut v = vec![0.0f64; dim];
                v[j] = 1.0;

                // Atom A: physical braid from transfer matrix chain.
                //
                // At each generator i (i = 0..n_A-2):
                //   - Gluon crossings (if nucleon)
                //   - Typed crossing with EVERY strand j > i
                //     (accumulated at generator i, same as all-nuclei-transfer-matrix.py)
                //
                // This matches the per-generator vertex volume V̂_i = z·a + b
                // where (a,b) is the 2×2 chain product of all crossings at gen i.
                //
                // In the per-irrep basis, each crossing at generator i acts
                // via the seminormal matrix for σ_i with coefficient d.
                let a_nucleons = z1 + n1;
                for i in 0..na.saturating_sub(1) {
                    // Gluon for nucleon at position i
                    if i < a_nucleons {
                        let n_gluon = if mol[i] == b'p' { 2 } else { 4 };
                        for _ in 0..n_gluon {
                            apply_crossing(&mut v, &tabs, &tab_idx, i, 0.0, q0);
                        }
                    }
                    // ALL crossings from strand i to strands j > i (within atom A)
                    for jj in (i+1)..na {
                        let ti = mol[i]; let tj = mol[jj];
                        if is_identity(ti,tj) { continue; }
                        let dc = cross_coeff(ti,tj,ha);
                        apply_crossing(&mut v, &tabs, &tab_idx, i, dc, q0);
                    }
                }

                // Bond: k inverse crossings at generator na-1
                for _ in 0..k {
                    apply_crossing(&mut v, &tabs, &tab_idx, na-1, -ha, q0);
                }

                // Atom B: same chain structure
                let b_nucleons = z2 + n2;
                let nb = sb.len();
                for i in 0..nb.saturating_sub(1) {
                    let gi = na + i;
                    // Gluon
                    if i < b_nucleons {
                        let n_gluon = if mol[gi] == b'p' { 2 } else { 4 };
                        for _ in 0..n_gluon {
                            apply_crossing(&mut v, &tabs, &tab_idx, gi, 0.0, q0);
                        }
                    }
                    // ALL crossings from strand gi to strands gj > gi (within atom B)
                    for jj in (i+1)..nb {
                        let gj = na + jj;
                        let ti = mol[gi]; let tj = mol[gj];
                        if is_identity(ti,tj) { continue; }
                        let dc = cross_coeff(ti,tj,ha);
                        apply_crossing(&mut v, &tabs, &tab_idx, gi, dc, q0);
                    }
                }

                trace += v[j];
            }

            weighted_tr += w * trace;
        }

        let phi_w = if weighted_tr.abs() > 1e-300 { weighted_tr.abs().ln() } else { -999.0 };
        if k == 0 { phi_ref = phi_w; }
        let binding = phi_ref - phi_w;
        let e_ev = binding * e_mol;

        let marker = if (e_ev - 4.478).abs() < 0.5 { " <--" } else { "" };
        eprintln!("  {:>4} {:>14.6e} {:>14.6} {:>10.4}{}",
            k, weighted_tr, phi_w, e_ev, marker);

        println!("{{\"k\":{},\"weighted_tr\":{:.10e},\"phi\":{:.10},\"e_ev\":{:.6}}}",
            k, weighted_tr, phi_w, e_ev);
    }

    let elapsed = t0.elapsed().as_secs_f64();
    eprintln!("\n  Total: {:.1}s", elapsed);
}
