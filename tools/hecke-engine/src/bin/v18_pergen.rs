// v18_pergenerator: Per-generator Wedderburn vertex volumes on full tower.
//
// The correct functional (matching the nuclear mass formula):
//   Φ₁ = Σ_i ln|V̂_i^full|
// where
//   V̂_i^full = Σ_λ w_λ × eigenvalue_product_λ(gen_i)
//
// At each generator i, the crossings (c_j, d_j) at that generator
// produce per-irrep eigenvalue products:
//   sym channel: Π_j (c_j × q + d_j)
//   alt channel: Π_j (-c_j/q + d_j)
//   For each irrep λ: the trace of the crossing product in ρ_λ
//
// For 2-row irreps with dim_λ > 1, the per-generator "eigenvalue product"
// is the trace of the matrix product of all crossings at generator i
// in the seminormal representation ρ_λ.
//
// V̂_i^full = Σ_λ w_λ × tr(Π_j T_λ(c_j, d_j) at gen i)

use std::collections::HashMap;

const VOL_FIGURE_EIGHT: f64 = 2.029883212819307;
const MASS_RATIO_MU_E: f64 = 206.7682830;

fn compute_q0() -> f64 {
    let hbar_q = (VOL_FIGURE_EIGHT / MASS_RATIO_MU_E).sqrt();
    1.0 / (1.0 - hbar_q)
}

// Young tableaux (from v17)
fn generate_syt_general(shape: &[usize]) -> Vec<Vec<(usize,usize)>> {
    let n: usize = shape.iter().sum();
    let mut result = Vec::new();
    let mut fill = vec![0usize; shape.len()];
    let mut placement = Vec::with_capacity(n);
    fn recurse(v:usize,n:usize,s:&[usize],f:&mut Vec<usize>,p:&mut Vec<(usize,usize)>,r:&mut Vec<Vec<(usize,usize)>>){
        if v>n{r.push(p.clone());return;}
        for row in 0..s.len(){
            if f[row]>=s[row]{continue;}
            let col=f[row];
            if row>0&&f[row-1]<=col{continue;}
            p.push((row,col));f[row]+=1;
            recurse(v+1,n,s,f,p,r);
            f[row]-=1;p.pop();
        }
    }
    recurse(1,n,shape,&mut fill,&mut placement,&mut result);
    result
}

fn content(tab: &[(usize,usize)], v: usize) -> i32 {
    let (r,c) = tab[v-1]; c as i32 - r as i32
}

fn swap_values(tab: &[(usize,usize)], k: usize) -> Option<Vec<(usize,usize)>> {
    let n=tab.len(); if k>=n{return None;}
    let mut nt=tab.to_vec(); nt[k-1]=tab[k]; nt[k]=tab[k-1];
    for v in 1..=n{
        let(rv,cv)=nt[v-1];
        for w in 1..v{
            let(rw,cw)=nt[w-1];
            if rw==rv&&cw>=cv{return None;}
            if cw==cv&&rw>=rv{return None;}
        }
    }
    Some(nt)
}

fn seminormal_entry(tab: &[(usize,usize)], k: usize, q: f64) -> (f64, Option<f64>) {
    let qi=1.0/q; let ha=q-qi;
    let d=content(tab,k+1)-content(tab,k);
    if d==0{panic!("d=0");}
    if d==1{(q,None)} else if d==-1{(-qi,None)}
    else{let qd=q.powi(d);let qdi=q.powi(-d);let diag=ha/(qd-qdi);let off=(1.0-diag*diag).max(0.0).sqrt();(diag,Some(off))}
}

/// Apply one crossing at generator `gen` with coefficient d_coeff to vector.
fn apply_crossing(
    vec: &mut [f64], tabs: &[Vec<(usize,usize)>],
    tab_idx: &HashMap<Vec<(usize,usize)>, usize>,
    gen: usize, d_coeff: f64, q: f64,
) {
    let dim=vec.len();
    let mut processed=vec![false;dim];
    for j in 0..dim{
        if processed[j]{continue;}
        let(diag,off)=seminormal_entry(&tabs[j],gen+1,q);
        let dj=diag+d_coeff;
        if let Some(ov)=off{
            if let Some(sw)=swap_values(&tabs[j],gen+1){
                if let Some(&j2)=tab_idx.get(&sw){
                    if !processed[j2]{
                        let(d2,_)=seminormal_entry(&tabs[j2],gen+1,q);
                        let dj2=d2+d_coeff;
                        let ov2=seminormal_entry(&tabs[j2],gen+1,q).1.unwrap_or(0.0);
                        let vj=vec[j];let vj2=vec[j2];
                        vec[j]=vj*dj+vj2*ov2;vec[j2]=vj*ov+vj2*dj2;
                        processed[j]=true;processed[j2]=true;continue;
                    }
                }
            }
        }
        if !processed[j]{vec[j]*=dj;processed[j]=true;}
    }
}

/// Compute the TRACE of a crossing product applied to a representation.
/// Applies crossings sequentially, then returns trace of resulting matrix.
fn crossing_product_trace(
    tabs: &[Vec<(usize,usize)>],
    tab_idx: &HashMap<Vec<(usize,usize)>, usize>,
    gen: usize, crossings: &[(f64, f64)], q: f64,
) -> f64 {
    let dim = tabs.len();
    if dim == 0 { return 0.0; }
    let ha = q - 1.0/q;
    let mut trace = 0.0;
    for j in 0..dim {
        let mut v = vec![0.0f64; dim];
        v[j] = 1.0;
        for &(_c, d) in crossings {
            // Each crossing is (c, d) where the Hecke action is c*σ + d*I
            // In seminormal form: diagonal = c*ρ(σ)_jj + d, off-diag = c*ρ(σ)_jk
            // But our apply_crossing uses d_coeff where the action is σ + d_coeff*I
            // i.e. c=1 always. The d_coeff = d from the crossing coefficient.
            apply_crossing(&mut v, tabs, tab_idx, gen, d, q);
        }
        trace += v[j];
    }
    trace
}

fn partitions_of(n: usize) -> Vec<Vec<usize>> {
    let mut result = Vec::new();
    let mut current = Vec::new();
    fn recurse(rem:usize,max:usize,cur:&mut Vec<usize>,res:&mut Vec<Vec<usize>>){
        if rem==0{res.push(cur.clone());return;}
        for p in (1..=rem.min(max)).rev(){cur.push(p);recurse(rem-p,p,cur,res);cur.pop();}
    }
    recurse(n,n,&mut current,&mut result);
    result
}

fn hook_lengths(shape: &[usize]) -> Vec<usize> {
    let mut hooks = Vec::new();
    for (r, &row_len) in shape.iter().enumerate() {
        for c in 0..row_len {
            let arm = row_len - c - 1;
            let leg: usize = (r+1..shape.len()).filter(|&r2| c < shape[r2]).count();
            hooks.push(arm + leg + 1);
        }
    }
    hooks
}

fn atom_strands(z: usize, nn: usize) -> Vec<u8> {
    let a=z+nn; let mut s=Vec::new();
    let mut pc=0;let mut nc=0;
    for k in 0..a{
        if k%2==0&&pc<z{s.push(b'p');pc+=1;}
        else if nc<nn{s.push(b'n');nc+=1;}
        else{s.push(b'p');pc+=1;}
    }
    for _ in 0..z{s.push(b'e');}
    s
}

fn is_identity(ti:u8,tj:u8)->bool{(ti==b'n'&&tj==b'e')||(ti==b'e'&&tj==b'n')}

fn cross_coeff(ti:u8,tj:u8,ha:f64)->f64{
    match(ti,tj){
        (b'p',b'p')=>0.0,(b'n',b'n')=>-ha,
        (b'p',b'n')|(b'n',b'p')=>-ha/2.0,
        (b'p',b'e')|(b'e',b'p')=>-ha,
        (b'e',b'e')=>0.0, _=>0.0
    }
}

fn main() {
    let args: Vec<String> = std::env::args().collect();
    if args.len() < 3 {
        eprintln!("v18: Per-generator Wedderburn vertex volumes");
        eprintln!("Usage: hecke-pergen Z1,N1 Z2,N2 [--scan K] [--maxdim D]");
        std::process::exit(1);
    }

    let q0 = compute_q0();
    let ha = q0 - 1.0/q0;

    let parse=|s:&str|->(usize,usize){let p:Vec<&str>=s.split(',').collect();(p[0].parse().unwrap(),p[1].parse().unwrap())};
    let (z1,n1)=parse(&args[1]);
    let (z2,n2)=parse(&args[2]);

    let sa=atom_strands(z1,n1); let sb=atom_strands(z2,n2);
    let mut mol:Vec<u8>=Vec::new(); mol.extend(&sa); mol.extend(&sb);
    let n=mol.len(); let na=sa.len();

    let q_int=|k:i32|->f64{(q0.powi(k)-q0.powi(-k))/ha};
    let alpha_em=(1.0/q0)/(q_int(9)*q_int(10));
    let e_mol=511000.0*alpha_em*alpha_em/(q0+1.0/q0).powi(2);

    let max_k:usize=args.iter().position(|a|a=="--scan").and_then(|p|args.get(p+1)).and_then(|s|s.parse().ok()).unwrap_or(6);
    let max_dim:usize=args.iter().position(|a|a=="--maxdim").and_then(|p|args.get(p+1)).and_then(|s|s.parse().ok()).unwrap_or(500);

    eprintln!("v18: per-generator vertex volumes");
    eprintln!("  A: Z={},N={} ({} strands)", z1,n1,na);
    eprintln!("  B: Z={},N={} ({} strands)", z2,n2,sb.len());
    eprintln!("  Molecular: {} strands, E_mol={:.4} eV", n, e_mol);

    // Build per-generator crossing lists for the molecule
    // Generator i: all crossings from strand i to strands j>i
    let a_nuc = z1+n1;
    let b_nuc = z2+n2;

    // Build crossing lists per generator for each k
    // Atom A generators: 0..na-2
    // Bond generator: na-1
    // Atom B generators: na..na+nb-2

    let all_parts = partitions_of(n);

    // Precompute SYT and weights
    let mut irreps: Vec<(Vec<usize>, Vec<Vec<(usize,usize)>>, f64)> = Vec::new();
    let mut total_dsq = 0.0f64;
    for p in &all_parts {
        let tabs = generate_syt_general(p);
        let dim = tabs.len();
        if dim == 0 || dim > max_dim { continue; }
        let dsq = (dim*dim) as f64;
        total_dsq += dsq;
        irreps.push((p.clone(), tabs, dsq));
    }
    // Normalize weights
    let irreps: Vec<(Vec<usize>, Vec<Vec<(usize,usize)>>, f64)> = irreps.into_iter()
        .map(|(p,t,dsq)| (p, t, dsq/total_dsq))
        .collect();

    eprintln!("  {} feasible irreps (dim ≤ {})", irreps.len(), max_dim);

    // Scan bond crossings
    eprintln!("\n  {:>4} {:>12} {:>12} {:>10}", "k", "Phi_pergen", "binding", "E(eV)");
    eprintln!("  {}", "-".repeat(42));

    let mut phi_ref = 0.0f64;

    for k in 0..=max_k {
        // Build per-generator crossing lists
        let n_gens = n - 1;
        let mut gen_crossings: Vec<Vec<(f64, f64)>> = vec![Vec::new(); n_gens];

        // Atom A: generator i gets crossings from strand i to all j>i within A
        for i in 0..na.saturating_sub(1) {
            // Gluon
            if i < a_nuc {
                let ng = if mol[i]==b'p'{2}else{4};
                for _ in 0..ng { gen_crossings[i].push((1.0, 0.0)); }
            }
            for j in (i+1)..na {
                if is_identity(mol[i],mol[j]){continue;}
                gen_crossings[i].push((1.0, cross_coeff(mol[i],mol[j],ha)));
            }
        }

        // Bond: k inverse crossings at generator na-1
        for _ in 0..k {
            gen_crossings[na-1].push((1.0, -ha));
        }

        // Atom B: generator na+i gets crossings from strand na+i to na+j within B
        let nb = sb.len();
        for i in 0..nb.saturating_sub(1) {
            let gi = na + i;
            if i < b_nuc {
                let ng = if mol[gi]==b'p'{2}else{4};
                for _ in 0..ng { gen_crossings[gi].push((1.0, 0.0)); }
            }
            for j in (i+1)..nb {
                let gj = na + j;
                if is_identity(mol[gi],mol[gj]){continue;}
                gen_crossings[gi].push((1.0, cross_coeff(mol[gi],mol[gj],ha)));
            }
        }

        // Compute per-generator vertex volumes
        let mut phi_total = 0.0f64;

        for gen in 0..n_gens {
            if gen_crossings[gen].is_empty() { continue; }

            // V̂_gen = Σ_λ w_λ × tr_λ(crossing product at gen)
            let mut v_gen = 0.0f64;

            for (_, tabs, w) in &irreps {
                let dim = tabs.len();
                let mut tab_idx = HashMap::new();
                for (i,t) in tabs.iter().enumerate() { tab_idx.insert(t.clone(),i); }

                let tr = crossing_product_trace(tabs, &tab_idx, gen, &gen_crossings[gen], q0);
                v_gen += w * tr;
            }

            if v_gen.abs() > 1e-300 {
                phi_total += v_gen.abs().ln();
            }
        }

        if k == 0 { phi_ref = phi_total; }
        let binding = phi_ref - phi_total;
        let e_ev = binding * e_mol;
        let marker = if (e_ev - 4.478).abs() < 0.5 { " <--" } else { "" };

        eprintln!("  {:>4} {:>12.6} {:>12.6} {:>10.4}{}",
            k, phi_total, binding, e_ev, marker);

        println!("{{\"k\":{},\"phi\":{:.10},\"binding\":{:.10},\"e_ev\":{:.6}}}",
            k, phi_total, binding, e_ev);
    }
}
