// v16_tensor: Molecular binding via tensor product of Hecke algebras.
//
// Construction (same for nucleons and molecules):
//   1. Atom A lives in H_{n₁}(q) — compute per-irrep Garside traces
//   2. Atom B lives in H_{n₂}(q) — compute per-irrep Garside traces
//   3. The tensor product H_{n₁} ⊗ H_{n₂} ↪ H_{n₁+n₂} decomposes
//      via the Littlewood-Richardson rule
//   4. Bond operator acts in the intertwiner space
//
// For H₂: each H atom is in H_2(q) (1 proton + 1 electron = 2 strands).
// The tensor product H_2 ⊗ H_2 ↪ H_4 has well-known branching.
//
// The key insight: the atoms are SEPARATE systems whose irreps combine.
// The "unbonded" molecular trace = product of atom traces (factorized).
// The bond operator modifies this by coupling irreps across the boundary.
//
// Usage:
//   hecke-tensor 1,0 1,0 --scan 6

use std::time::Instant;
use std::collections::HashMap;

const VOL_FIGURE_EIGHT: f64 = 2.029883212819307;
const MASS_RATIO_MU_E: f64 = 206.7682830;

fn compute_q0() -> f64 {
    let hbar_q = (VOL_FIGURE_EIGHT / MASS_RATIO_MU_E).sqrt();
    1.0 / (1.0 - hbar_q)
}

// ════════════════════════════════════════════════════════════════
// Young tableaux (from v14)
// ════════════════════════════════════════════════════════════════

fn generate_syt(a: usize, b: usize) -> Vec<Vec<bool>> {
    let n = a + b;
    let mut result = Vec::new();
    let mut current = Vec::with_capacity(n);
    fn recurse(c: &mut Vec<bool>, a: usize, b: usize, r1: usize, r2: usize, res: &mut Vec<Vec<bool>>) {
        if c.len() == a+b { res.push(c.clone()); return; }
        if r1 < a { c.push(true); recurse(c,a,b,r1+1,r2,res); c.pop(); }
        if r2 < b && r2 < r1 { c.push(false); recurse(c,a,b,r1,r2+1,res); c.pop(); }
    }
    recurse(&mut current, a, b, 0, 0, &mut result);
    result
}

fn syt_content(tab: &[bool], v: usize) -> i32 {
    let mut r1=0; let mut r2=0;
    for i in 0..v { if tab[i] {r1+=1;} else {r2+=1;} }
    if tab[v-1] {(r1-1) as i32} else {(r2-1) as i32 - 1}
}

fn syt_swap(tab: &[bool], k: usize) -> Option<Vec<bool>> {
    if tab[k-1]==tab[k] { return None; }
    let mut nt=tab.to_vec(); nt[k-1]=tab[k]; nt[k]=tab[k-1];
    let mut r1=0i32; let mut r2=0i32;
    for &in_row1 in &nt { if in_row1{r1+=1;}else{r2+=1;} if r2>r1{return None;} }
    Some(nt)
}

fn seminormal_entry(tab: &[bool], gen_k: usize, q: f64) -> (f64, Option<f64>) {
    let k=gen_k+1; let qi=1.0/q; let ha=q-qi;
    let d=syt_content(tab,k+1)-syt_content(tab,k);
    if d==0 { panic!("d=0"); }
    if d==1 { (q, None) }
    else if d==-1 { (-qi, None) }
    else {
        let qd=q.powi(d); let qdi=q.powi(-d);
        let diag=ha/(qd-qdi);
        let off=(1.0-diag*diag).max(0.0).sqrt();
        (diag, Some(off))
    }
}

fn apply_crossing_to_vec(
    vec: &mut [f64], tabs: &[Vec<bool>],
    tab_idx: &HashMap<Vec<bool>, usize>,
    sweep: usize, d_coeff: f64, q: f64,
) {
    let dim=vec.len();
    let mut processed=vec![false;dim];
    for j in 0..dim {
        if processed[j] { continue; }
        let (diag_j,off_j)=seminormal_entry(&tabs[j],sweep,q);
        let dj=diag_j+d_coeff;
        if let Some(ov)=off_j {
            if let Some(sw)=syt_swap(&tabs[j],sweep+1) {
                if let Some(&j2)=tab_idx.get(&sw) {
                    if !processed[j2] {
                        let (dj2_raw,_)=seminormal_entry(&tabs[j2],sweep,q);
                        let dj2=dj2_raw+d_coeff;
                        let ov2=seminormal_entry(&tabs[j2],sweep,q).1.unwrap_or(0.0);
                        let vj=vec[j]; let vj2=vec[j2];
                        vec[j]=vj*dj+vj2*ov2; vec[j2]=vj*ov+vj2*dj2;
                        processed[j]=true; processed[j2]=true; continue;
                    }
                }
            }
        }
        if !processed[j] { vec[j]*=dj; processed[j]=true; }
    }
}

// ════════════════════════════════════════════════════════════════
// Per-atom Garside trace
// ════════════════════════════════════════════════════════════════

fn atom_strands(z: usize, n: usize) -> Vec<u8> {
    let a=z+n;
    let mut s=Vec::new();
    let mut pc=0usize; let mut nc=0usize;
    for k in 0..a {
        if k%2==0 && pc<z { s.push(b'p'); pc+=1; }
        else if nc<n { s.push(b'n'); nc+=1; }
        else { s.push(b'p'); pc+=1; }
    }
    for _ in 0..z { s.push(b'e'); }
    s
}

fn is_identity_crossing(ti: u8, tj: u8) -> bool {
    (ti==b'n'&&tj==b'e') || (ti==b'e'&&tj==b'n')
}

fn crossing_coeff(ti: u8, tj: u8, ha: f64) -> f64 {
    match (ti,tj) {
        (b'p',b'p')=>(0.0), (b'n',b'n')=>(-ha),
        (b'p',b'n')|(b'n',b'p')=>(-ha/2.0),
        (b'p',b'e')|(b'e',b'p')=>(-ha), // pe
        (b'e',b'e')=>(0.0), // ee
        _=>(0.0) // ne=identity (handled by skip)
    }
}

/// Compute per-irrep Garside trace for a single atom.
/// Returns vec of (partition, trace) for all 2-row irreps.
fn atom_garside_traces(z: usize, n_neut: usize, q: f64) -> Vec<((usize,usize), f64)> {
    let strands = atom_strands(z, n_neut);
    let n = strands.len();
    let ha = q - 1.0/q;

    let mut results = Vec::new();
    for b in 0..=n/2 {
        let a = n - b;
        let tabs = generate_syt(a, b);
        let dim = tabs.len();
        if dim == 0 { continue; }

        let mut tab_idx = HashMap::new();
        for (i,t) in tabs.iter().enumerate() { tab_idx.insert(t.clone(),i); }

        // Garside staircase: compute trace
        let mut total_trace = 0.0f64;
        for j in 0..dim {
            let mut v = vec![0.0f64; dim];
            v[j] = 1.0;

            for level in 0..n-1 {
                for sweep in (0..=level).rev() {
                    let ti = strands[sweep];
                    let tj = strands[level+1];
                    if is_identity_crossing(ti,tj) { continue; }
                    let dc = crossing_coeff(ti,tj,ha);
                    apply_crossing_to_vec(&mut v, &tabs, &tab_idx, sweep, dc, q);
                }
            }
            total_trace += v[j];
        }

        results.push(((a,b), total_trace));
    }
    results
}

// ════════════════════════════════════════════════════════════════
// Tensor product: atom A ⊗ atom B → molecular system
// ════════════════════════════════════════════════════════════════

/// For the unbonded molecule: tr(A⊗B) = tr(A) × tr(B)
/// This is exact when the two atoms don't interact.
///
/// For the bonded molecule: we need to compute how the bond operator
/// modifies the tensor product. The bond acts on the generator σ_{n₁-1}
/// which connects the last strand of A to the first strand of B.
///
/// In the tensor product basis, this crossing mixes irreps of A and B.
/// The Littlewood-Richardson rule determines the branching.
///
/// SIMPLIFICATION for now: compute the full molecular Garside trace
/// in H_{n₁+n₂}(q) but with the FACTORED reference:
///   binding = Σ_λ w_λ ln|tr_λ(A)| + Σ_μ w_μ ln|tr_μ(B)| - Σ_ν w_ν ln|tr_ν(A⊗bond⊗B)|
///
/// This uses the atom traces as reference and the full molecular
/// trace (with bond) as the bonded state.
fn molecular_trace_with_bond(
    strands_a: &[u8], strands_b: &[u8],
    bond_crossings: &[i32],  // positive = σ, negative = σ⁻¹
    q: f64,
) -> Vec<((usize,usize), f64)> {
    let ha = q - 1.0/q;
    let n_a = strands_a.len();

    // Full molecular ordering
    let mut mol: Vec<u8> = Vec::new();
    mol.extend_from_slice(strands_a);
    mol.extend_from_slice(strands_b);
    let n = mol.len();

    let mut results = Vec::new();
    let max_dim = 5000;

    for b in 0..=n/2 {
        let a = n - b;
        let tabs = generate_syt(a, b);
        let dim = tabs.len();
        if dim == 0 || dim > max_dim { continue; }

        let mut tab_idx = HashMap::new();
        for (i,t) in tabs.iter().enumerate() { tab_idx.insert(t.clone(),i); }

        let mut total_trace = 0.0f64;
        for j in 0..dim {
            let mut v = vec![0.0f64; dim];
            v[j] = 1.0;

            // Atom A Garside: only crossings within A's strands
            let n_a_strands = strands_a.len();
            for level in 0..n_a_strands-1 {
                for sweep in (0..=level).rev() {
                    let ti = mol[sweep]; let tj = mol[level+1];
                    if is_identity_crossing(ti,tj) { continue; }
                    let dc = crossing_coeff(ti,tj,ha);
                    apply_crossing_to_vec(&mut v, &tabs, &tab_idx, sweep, dc, q);
                }
            }

            // Bond crossings at the boundary
            for &gen in bond_crossings {
                let (sweep, dc) = if gen >= 0 {
                    (n_a - 1 + gen as usize, 0.0)
                } else {
                    (n_a - 1 + (-gen-1) as usize, -ha)
                };
                if sweep < n-1 {
                    apply_crossing_to_vec(&mut v, &tabs, &tab_idx, sweep, dc, q);
                }
            }

            // Atom B Garside: crossings within B's strands
            // But in the molecular basis, B's strands start at index n_a
            let n_b = strands_b.len();
            for level in 0..n_b-1 {
                for sweep in (0..=level).rev() {
                    let global_sweep = n_a + sweep;
                    let global_level = n_a + level + 1;
                    let ti = mol[global_sweep]; let tj = mol[global_level];
                    if is_identity_crossing(ti,tj) { continue; }
                    let dc = crossing_coeff(ti,tj,ha);
                    apply_crossing_to_vec(&mut v, &tabs, &tab_idx, global_sweep, dc, q);
                }
            }

            total_trace += v[j];
        }
        results.push(((a,b), total_trace));
    }
    results
}

// ════════════════════════════════════════════════════════════════
// Main
// ════════════════════════════════════════════════════════════════

fn main() {
    let args: Vec<String> = std::env::args().collect();
    if args.len() < 3 {
        eprintln!("hecke-tensor v16 — Molecular binding via tensor product");
        eprintln!("Usage: hecke-tensor Z1,N1 Z2,N2 [--scan N]");
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

    let strands_a = atom_strands(z1, n1);
    let strands_b = atom_strands(z2, n2);

    let q_int = |k: i32| -> f64 { (q0.powi(k) - q0.powi(-k)) / ha };
    let alpha_em = (1.0/q0) / (q_int(9) * q_int(10));
    let e_hartree = 511000.0 * alpha_em * alpha_em;
    let two_q = q0 + 1.0/q0;
    let e_mol = e_hartree / (two_q * two_q);

    eprintln!("hecke-tensor v16");
    eprintln!("  A: Z={},N={} ({} strands)", z1, n1, strands_a.len());
    eprintln!("  B: Z={},N={} ({} strands)", z2, n2, strands_b.len());
    eprintln!("  E_mol = {:.4} eV", e_mol);

    // Compute atom traces
    let t0 = Instant::now();
    let traces_a = atom_garside_traces(z1, n1, q0);
    let traces_b = atom_garside_traces(z2, n2, q0);

    eprintln!("\n  Atom A irreps:");
    for &((a,b), tr) in &traces_a {
        let dim = generate_syt(a,b).len();
        eprintln!("    ({},{}): dim={}, tr={:.6e}", a, b, dim, tr);
    }
    eprintln!("  Atom B irreps:");
    for &((a,b), tr) in &traces_b {
        let dim = generate_syt(a,b).len();
        eprintln!("    ({},{}): dim={}, tr={:.6e}", a, b, dim, tr);
    }

    // Unbonded reference: factored traces
    let phi_a: f64 = traces_a.iter().map(|&(_,tr)| if tr.abs() > 1e-300 { tr.abs().ln() } else { 0.0 }).sum();
    let phi_b: f64 = traces_b.iter().map(|&(_,tr)| if tr.abs() > 1e-300 { tr.abs().ln() } else { 0.0 }).sum();
    let phi_sep = phi_a + phi_b;
    eprintln!("\n  Φ₁(A) = {:.6}, Φ₁(B) = {:.6}, Φ₁(sep) = {:.6}", phi_a, phi_b, phi_sep);

    // Scan bond crossings
    let max_k: usize = args.iter().position(|a| a == "--scan")
        .and_then(|p| args.get(p+1))
        .and_then(|s| s.parse().ok())
        .unwrap_or(6);

    eprintln!("\n  Scanning k = 0..{} inverse crossings", max_k);
    eprintln!("  {:>4} {:>12} {:>12} {:>10}", "k", "Φ₁(mol)", "binding", "E(eV)");
    eprintln!("  {}", "-".repeat(42));

    for k in 0..=max_k {
        // k inverse crossings at the boundary: σ_{n_a-1}⁻¹ each
        let bond: Vec<i32> = (0..k).map(|_| -1i32).collect();  // -1 = σ₀⁻¹ at bond gen

        let mol_traces = molecular_trace_with_bond(&strands_a, &strands_b, &bond, q0);

        let phi_mol: f64 = mol_traces.iter()
            .map(|&(_,tr)| if tr.abs() > 1e-300 { tr.abs().ln() } else { 0.0 })
            .sum();

        // Also compute unbonded in the SAME basis (k=0)
        let phi_ref = if k == 0 { phi_mol } else {
            let ref_traces = molecular_trace_with_bond(&strands_a, &strands_b, &[], q0);
            ref_traces.iter().map(|&(_,tr)| if tr.abs()>1e-300 {tr.abs().ln()} else {0.0}).sum()
        };

        let binding = phi_ref - phi_mol;
        let e_ev = binding * e_mol;

        let marker = if (e_ev - 4.478).abs() < 0.5 { " <--" } else { "" };
        eprintln!("  {:>4} {:>12.6} {:>12.6} {:>10.4}{}",
            k, phi_mol, binding, e_ev, marker);

        // Per-irrep detail for k=0 and k=3
        if k == 0 || k == 3 {
            for &((a,b), tr) in &mol_traces {
                let dim = generate_syt(a,b).len();
                if dim > 0 {
                    eprintln!("       ({},{}): dim={}, tr={:.6e}", a, b, dim, tr);
                }
            }
        }
    }

    let elapsed = t0.elapsed().as_secs_f64();
    eprintln!("\n  Total: {:.1}s", elapsed);
}
