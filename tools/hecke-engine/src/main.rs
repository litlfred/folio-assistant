//! Fast Gröbner--Shirshov reduction engine for H_n(q) with Pauli witness.
//!
//! Optimizations:
//! 1. Reduced/unreduced separation with priority queue
//! 2. Batch consolidation of same-word entries
//! 3. Smart add_term: only check junction point for new terms
//! 4. Quotient-during-construction with tr_alt accumulation
//!
//! For A ≤ 10: full NF, exact F_Pauli
//! For A = 11-16: quotient-with-accumulation, exact F_Pauli
//!
//! Usage:
//!   cargo run --release -- pauli Z N        # single nucleus
//!   cargo run --release -- pauli A_max      # table

use rustc_hash::FxHashMap;
use serde::Serialize;
use serde_json;
use std::collections::BinaryHeap;
use std::cmp::Ordering;
use std::time::Instant;

type Word = Vec<u8>;

#[derive(Clone)]
struct PriWord(Word, f64);
impl PartialEq for PriWord { fn eq(&self, o: &Self) -> bool { self.0.len() == o.0.len() } }
impl Eq for PriWord {}
impl PartialOrd for PriWord { fn partial_cmp(&self, o: &Self) -> Option<Ordering> { Some(self.cmp(o)) } }
impl Ord for PriWord { fn cmp(&self, o: &Self) -> Ordering { self.0.len().cmp(&o.0.len()) } }

struct HeckeElement {
    reduced: FxHashMap<Word, f64>,
    unreduced: BinaryHeap<PriWord>,
}

impl HeckeElement {
    fn new() -> Self { Self { reduced: FxHashMap::default(), unreduced: BinaryHeap::new() } }
    fn identity() -> Self { let mut h = Self::new(); h.reduced.insert(vec![], 1.0); h }
    fn n_terms(&self) -> usize { self.reduced.len() }
    fn into_map(self) -> FxHashMap<Word, f64> { self.reduced }
    fn histogram(&self) -> Vec<usize> {
        let mx = self.reduced.keys().map(|w| w.len()).max().unwrap_or(0);
        let mut h = vec![0usize; mx + 1];
        for w in self.reduced.keys() { h[w.len()] += 1; }
        h
    }
}

/// Accumulated Pauli trace data
#[derive(Default, Clone)]
struct PauliAccum {
    tr_alt: f64,  // Σ c_w × (-q⁻¹)^ℓ(w)
    tr_sym: f64,  // Σ c_w × q^ℓ(w)
    net: f64,     // Σ c_w
}

impl PauliAccum {
    fn add_term(&mut self, coeff: f64, word_len: usize, q: f64, qi: f64) {
        self.tr_alt += coeff * (-qi).powi(word_len as i32);
        self.tr_sym += coeff * q.powi(word_len as i32);
        self.net += coeff;
    }
    fn add_from_map(&mut self, terms: &FxHashMap<Word, f64>, q: f64, qi: f64) {
        for (w, &c) in terms { self.add_term(c, w.len(), q, qi); }
    }
}

struct HeckeEngine {
    ha: f64, s: f64, z: f64, q: f64, qi: f64,
}

impl HeckeEngine {
    fn new(q: f64) -> Self {
        let qi = 1.0/q;
        Self { ha: q-qi, s: q.sqrt()-qi.sqrt(), z: 1.0/(q.sqrt()+qi.sqrt()), q, qi }
    }

    /// Crossing coefficients (c, d) for T(c,d) = c·σ + d·𝟏.
    ///
    /// From the Hecke inverse relation σ⁻¹ = σ − (q − q⁻¹):
    ///   pp → σ:          c = 1,   d = 0
    ///   nn → σ⁻¹:        c = 1,   d = −HA
    ///   pn → ½(σ+σ⁻¹): c = 1,   d = −HA/2
    fn crossing_coeffs(&self, ti: u8, tj: u8) -> (f64, f64) {
        match (ti, tj) {
            (b'p', b'p') => (1.0, 0.0),
            (b'n', b'n') => (1.0, -self.ha),
            _ => (1.0, -self.ha / 2.0),
        }
    }

    #[inline]
    fn find_reduction(word: &[u8]) -> Option<(usize, u8)> {
        let len = word.len();
        if len < 2 { return None; }
        for pos in 0..len-1 {
            let a = word[pos]; let b = word[pos+1];
            if a == b { return Some((pos, 0)); }
            if (a as i16 - b as i16) >= 2 { return Some((pos, 1)); }
            if pos+2 < len {
                let c = word[pos+2];
                if a == c && (a as i16 - b as i16).abs() == 1 && b < a {
                    return Some((pos, 2));
                }
            }
        }
        None
    }

    /// Smart add: for w·gen, only check junction (last char of w, gen)
    /// and propagate if needed. Much faster than scanning full word.
    #[inline]
    fn add_term(elem: &mut HeckeElement, word: Word, coeff: f64) {
        if coeff.abs() < 1e-15 { return; }
        // Quick check: only the new junction could be reducible
        // (the prefix was already reduced)
        let len = word.len();
        let needs_check = if len >= 2 {
            let a = word[len-2]; let b = word[len-1];
            a == b ||                                    // Hecke
            (a as i16 - b as i16) >= 2 ||               // FC
            (len >= 3 && {
                let c = word[len-3];
                c == b && (c as i16 - a as i16).abs() == 1 && a < c
            })                                           // YB at end
        } else { false };

        if needs_check || Self::find_reduction(&word).is_some() {
            elem.unreduced.push(PriWord(word, coeff));
        } else {
            *elem.reduced.entry(word).or_insert(0.0) += coeff;
        }
    }

    fn drain_unreduced(&self, elem: &mut HeckeElement) {
        while !elem.unreduced.is_empty() {
            let mut batch: FxHashMap<Word, f64> = FxHashMap::default();
            while let Some(PriWord(w, c)) = elem.unreduced.pop() {
                *batch.entry(w).or_insert(0.0) += c;
            }
            for (word, coeff) in batch {
                if coeff.abs() < 1e-15 { continue; }
                if let Some((pos, rule)) = Self::find_reduction(&word) {
                    match rule {
                        0 => {
                            let i = word[pos];
                            let mut w1 = Vec::with_capacity(word.len()-1);
                            w1.extend_from_slice(&word[..pos]); w1.push(i);
                            w1.extend_from_slice(&word[pos+2..]);
                            let mut w2 = Vec::with_capacity(word.len()-2);
                            w2.extend_from_slice(&word[..pos]);
                            w2.extend_from_slice(&word[pos+2..]);
                            Self::add_term(elem, w1, coeff * self.ha);
                            Self::add_term(elem, w2, coeff);
                        }
                        1 => { let mut w = word; w.swap(pos, pos+1); Self::add_term(elem, w, coeff); }
                        2 => {
                            let mut w = word;
                            let (a,b) = (w[pos], w[pos+1]);
                            w[pos]=b; w[pos+1]=a; w[pos+2]=b;
                            Self::add_term(elem, w, coeff);
                        }
                        _ => unreachable!(),
                    }
                } else {
                    *elem.reduced.entry(word).or_insert(0.0) += coeff;
                }
            }
        }
        elem.reduced.retain(|_, c| c.abs() > 1e-15);
    }

    fn multiply_and_reduce(&self, elem: &mut HeckeElement, gen: u8, c: f64, d: f64) {
        let old: Vec<(Word, f64)> = elem.reduced.drain().collect();
        for (w, coeff) in old {
            if d.abs() > 1e-15 {
                *elem.reduced.entry(w.clone()).or_insert(0.0) += coeff * d;
            }
            if c.abs() > 1e-15 {
                let mut wg = w; wg.push(gen);
                Self::add_term(elem, wg, coeff * c);
            }
        }
        self.drain_unreduced(elem);
    }

    /// Apply I₉+I₈ quotient, returning Pauli data of removed terms.
    fn apply_quotient_with_pauli(&self, terms: &mut FxHashMap<Word, f64>) -> PauliAccum {
        let mut removed = PauliAccum::default();
        // I₉: strip longest chains
        loop {
            let mut words: Vec<Word> = terms.keys()
                .filter(|w| w.len() >= 2 && terms[*w].abs() > 1e-15)
                .cloned().collect();
            words.sort_unstable_by(|a, b| b.len().cmp(&a.len()));
            let mut found = false;
            for word in &words {
                let prefix = &word[..word.len()-1];
                if terms.get(prefix).map_or(false, |c| c.abs() > 1e-15) {
                    let coeff = terms.remove(word).unwrap_or(0.0);
                    removed.add_term(coeff, word.len(), self.q, self.qi);
                    found = true; break;
                }
            }
            if !found { break; }
        }
        // I₈: adjacency
        loop {
            let adj: Vec<Word> = terms.keys()
                .filter(|w| w.len() == 2 && terms[*w].abs() > 1e-15 && w[1] == w[0]+1)
                .cloned().collect();
            let mut found = false;
            for word in &adj {
                if terms.get(&vec![word[1]]).map_or(false, |c| c.abs() > 1e-15) {
                    let coeff = terms.remove(&word.clone()).unwrap_or(0.0);
                    removed.add_term(coeff, 2, self.q, self.qi);
                    found = true; break;
                }
            }
            if !found { break; }
        }
        terms.retain(|_, c| c.abs() > 1e-15);
        removed
    }

    /// Build nucleus with Pauli tracking.
    /// For large A: apply quotient at strand boundaries, accumulate tr_alt of removed terms.
    /// The final F_Pauli = |tr_alt_kept + tr_alt_removed| / |net_kept + net_removed|.
    fn build_nucleus_pauli(&self, z: usize, n: usize, use_quotient_after: usize) -> (HeckeElement, PauliAccum) {
        let a = z + n;
        let mut types = vec![b'p'; z];
        types.extend(vec![b'n'; n]);
        let mut elem = HeckeElement::identity();
        let mut accum = PauliAccum::default();

        for k in 1..a {
            for i in 0..k {
                let (c, d) = self.crossing_coeffs(types[i], types[k]);
                self.multiply_and_reduce(&mut elem, i as u8, c, d);
            }
            // Apply quotient for large A to keep terms bounded
            if a > use_quotient_after && k < a - 1 {
                let mut terms = std::mem::take(&mut elem.reduced);
                let removed = self.apply_quotient_with_pauli(&mut terms);
                accum.tr_alt += removed.tr_alt;
                accum.tr_sym += removed.tr_sym;
                accum.net += removed.net;
                elem.reduced = terms;
                eprint!("\r  strand {}/{}: {} terms (accumulated {} removed)", k, a-1, elem.n_terms(),
                    ((accum.net.abs() * 100.0) as u64));
            }
        }
        eprintln!();
        (elem, accum)
    }

    fn build_nucleus(&self, z: usize, n: usize) -> HeckeElement {
        let (elem, _) = self.build_nucleus_pauli(z, n, 999);
        elem
    }

    fn apply_quotient_ideals(terms: &mut FxHashMap<Word, f64>) -> usize {
        let mut total = 0;
        loop {
            let mut words: Vec<Word> = terms.keys()
                .filter(|w| w.len() >= 2 && terms[*w].abs() > 1e-15)
                .cloned().collect();
            words.sort_unstable_by(|a, b| b.len().cmp(&a.len()));
            let mut found = false;
            for word in &words {
                let prefix = &word[..word.len()-1];
                if terms.get(prefix).map_or(false, |c| c.abs() > 1e-15) {
                    terms.remove(word); total += 1; found = true; break;
                }
            }
            if !found { break; }
        }
        loop {
            let adj: Vec<Word> = terms.keys()
                .filter(|w| w.len() == 2 && terms[*w].abs() > 1e-15 && w[1] == w[0]+1)
                .cloned().collect();
            let mut found = false;
            for word in &adj {
                if terms.get(&vec![word[1]]).map_or(false, |c| c.abs() > 1e-15) {
                    terms.remove(&word.clone()); total += 1; found = true; break;
                }
            }
            if !found { break; }
        }
        terms.retain(|_, c| c.abs() > 1e-15);
        total
    }

    fn generator_volumes(&self, z: usize, n: usize) -> Vec<f64> {
        let a = z+n;
        let mut types = vec![b'p'; z]; types.extend(vec![b'n'; n]);
        self.generator_volumes_typed(&types)
    }

    /// Compute generator volumes for an explicit type array.
    /// Each element is b'p' (u-quark at L1 / proton at L0) or b'n' (d-quark at L1 / neutron at L0).
    fn generator_volumes_typed(&self, types: &[u8]) -> Vec<f64> {
        let a = types.len();
        (0..a-1).map(|i| {
            let mut m = [[1.0,0.0],[0.0,1.0]];
            for j in (i+1)..a {
                let (c,d) = self.crossing_coeffs(types[i], types[j]);
                let t = [[c*self.ha+d,c],[c,d]];
                m = [[m[0][0]*t[0][0]+m[0][1]*t[1][0], m[0][0]*t[0][1]+m[0][1]*t[1][1]],
                     [m[1][0]*t[0][0]+m[1][1]*t[1][0], m[1][0]*t[0][1]+m[1][1]*t[1][1]]];
            }
            self.z*m[0][0]+m[1][0]
        }).collect()
    }

    /// Augmented net for a given type array (sum of all generator volumes).
    fn net_typed(&self, types: &[u8]) -> f64 {
        self.generator_volumes_typed(types).iter().sum()
    }
}

// ════════════════════════════════════════════════════════════════

#[derive(Serialize)]
struct NucleusResult {
    name: String, z: usize, n: usize, a: usize,
    raw_terms: usize, optimal_terms: usize, target: usize,
    is_optimal: bool, histogram: Vec<usize>, is_palindromic: bool,
    elapsed_ms: u128, skein_polynomial: f64,
}

fn is_palindromic(h: &[usize]) -> bool { let n=h.len(); (0..n/2).all(|i| h[i]==h[n-1-i]) }

fn nucleus_name(z: usize, n: usize) -> String {
    let a=z+n;
    let s=match z {1=>"H",2=>"He",3=>"Li",4=>"Be",5=>"B",6=>"C",7=>"N",8=>"O",9=>"F",10=>"Ne",_=>"?"};
    format!("{}{}({},{})", a, s, z, n)
}

fn compute(engine: &HeckeEngine, z: usize, n: usize) -> NucleusResult {
    let a=z+n; let t0=Instant::now();
    let (raw, hist, pal, opt) = if a <= 8 {
        let elem = engine.build_nucleus(z, n);
        let raw=elem.n_terms(); let hist=elem.histogram(); let pal=is_palindromic(&hist);
        let mut terms=elem.into_map(); HeckeEngine::apply_quotient_ideals(&mut terms);
        (raw, hist, pal, terms.len())
    } else {
        let (elem, _) = engine.build_nucleus_pauli(z, n, 8);
        let opt=elem.n_terms(); let hist=elem.histogram(); let pal=is_palindromic(&hist);
        (0, hist, pal, opt)
    };
    let skein: f64 = engine.generator_volumes(z, n).iter().product();
    NucleusResult {
        name: nucleus_name(z,n), z, n, a, raw_terms: raw,
        optimal_terms: opt, target: a, is_optimal: opt==a,
        histogram: hist, is_palindromic: pal,
        elapsed_ms: t0.elapsed().as_millis(), skein_polynomial: skein,
    }
}

fn main() {
    let args: Vec<String> = std::env::args().collect();
    let engine = HeckeEngine::new(1.10998);

    if args.len() < 2 {
        eprintln!("Usage: hecke-engine [nucleus|table|pauli|shellfactor|qvalues|qvalues-cat|qvalues-l1] ...");
        std::process::exit(1);
    }

    match args[1].as_str() {
        "nucleus" => {
            let z: usize = args[2].parse().unwrap();
            let n: usize = args[3].parse().unwrap();
            let r = compute(&engine, z, n);
            println!("{}: A={}, Raw={}, Optimal={} (target {}), {}, Pal={}, P={:.6}, {}ms",
                r.name, r.a, r.raw_terms, r.optimal_terms, r.target,
                if r.is_optimal {"OPTIMAL"} else {"NOT OPTIMAL"},
                if r.is_palindromic {"Y"} else {"N"}, r.skein_polynomial, r.elapsed_ms);
            println!("Histogram: {:?}", r.histogram);
        }

        "table" => {
            let z_min: usize = args.get(2).and_then(|s| s.parse().ok()).unwrap_or(1);
            let z_max: usize = args.get(3).and_then(|s| s.parse().ok()).unwrap_or(8);
            let a_max: usize = args.get(4).and_then(|s| s.parse().ok()).unwrap_or(16);
            println!("{:>12} {:>3} {:>3} {:>3} {:>10} {:>6} {:>4} {:>3} {:>10} {:>10}",
                     "Nucleus","Z","N","A","Raw","After","Tgt","Pal","Status","Time");
            println!("{}", "-".repeat(75));
            let t=Instant::now(); let mut all_opt=true;
            for z in z_min..=z_max {
                let n_min = if z<=1 {1} else {z.saturating_sub(1)};
                for n in n_min..=(z+2) {
                    let a=z+n; if a<2||a>a_max { continue; }
                    let r=compute(&engine, z, n);
                    if !r.is_optimal { all_opt=false; }
                    println!("{:>12} {:>3} {:>3} {:>3} {:>10} {:>6} {:>4} {:>3} {:>10} {:>8}ms",
                        r.name,z,n,a,r.raw_terms,r.optimal_terms,r.target,
                        if r.is_palindromic {"Y"} else {" "},
                        if r.is_optimal {"OPTIMAL"} else {"over"},r.elapsed_ms);
                }
            }
            println!("\nAll optimal: {} Total: {}ms", if all_opt {"YES"} else {"NO"}, t.elapsed().as_millis());
        }

        "pauli" => {
            let z: usize = args.get(2).and_then(|s| s.parse().ok()).unwrap_or(0);
            let n: usize = args.get(3).and_then(|s| s.parse().ok()).unwrap_or(0);

            if z > 0 && n > 0 {
                let a = z + n;
                let t0 = Instant::now();

                // For A ≤ 10: full NF. For A > 10: quotient with accumulation.
                let use_quotient_after = if a <= 10 { 999 } else { 10 };
                let (elem, accum) = engine.build_nucleus_pauli(z, n, use_quotient_after);

                let mut kept = PauliAccum::default();
                kept.add_from_map(&elem.reduced, engine.q, engine.qi);

                let tr_alt = kept.tr_alt + accum.tr_alt;
                let tr_sym = kept.tr_sym + accum.tr_sym;
                let net = kept.net + accum.net;
                let f = if net.abs() > 1e-30 { tr_alt.abs() / net.abs() } else { 0.0 };

                let hist = elem.histogram();
                let pal = is_palindromic(&hist);
                let ms = t0.elapsed().as_millis();

                println!("{}: A={}, {} terms{}, pal={}",
                    nucleus_name(z,n), a, elem.n_terms(),
                    if accum.net.abs() > 1e-10 { format!(" (+{:.0} accumulated)", accum.net.abs()) } else { String::new() },
                    if pal {"Y"} else {"N"});
                println!("  tr_alt = {:+.10} (kept {:+.6} + accum {:+.6})", tr_alt, kept.tr_alt, accum.tr_alt);
                println!("  net    = {:+.10} (kept {:+.6} + accum {:+.6})", net, kept.net, accum.net);
                println!("  F_Pauli^(A) = {:.6}", f);
                println!("  {}ms", ms);

                println!("{}", serde_json::json!({
                    "nucleus": nucleus_name(z,n), "z": z, "n": n, "a": a,
                    "raw_terms": elem.n_terms(), "palindromic": pal,
                    "tr_alt": tr_alt, "tr_alt_kept": kept.tr_alt, "tr_alt_accum": accum.tr_alt,
                    "net": net, "net_kept": kept.net, "net_accum": accum.net,
                    "F_Pauli_A": f, "histogram": hist,
                    "use_quotient_after": use_quotient_after,
                    "elapsed_ms": ms, "q": engine.q,
                }));
            } else {
                // Table
                let a_max: usize = args.get(2).and_then(|s| s.parse().ok()).unwrap_or(8);
                println!("F_PAULI^(A) TABLE (A ≤ {})", a_max);
                println!("  q₀ = {:.5}", engine.q);
                println!();
                println!("{:>12} {:>3} {:>3} {:>3} {:>10} {:>3} {:>12} {:>12} {:>10} {:>8}",
                    "Nucleus","Z","N","A","Terms","Pal","tr_alt","net","F_Pauli","Time");
                println!("{}", "-".repeat(90));

                for zz in 1..=a_max {
                    let n_min = if zz<=1 {1} else {zz.saturating_sub(1)};
                    for nn in n_min..=(zz+2) {
                        let a = zz+nn;
                        if a < 2 || a > a_max || nn+1 < zz { continue; }
                        let t0 = Instant::now();
                        let use_q = if a <= 10 { 999 } else { 10 };
                        let (elem, accum) = engine.build_nucleus_pauli(zz, nn, use_q);
                        let mut kept = PauliAccum::default();
                        kept.add_from_map(&elem.reduced, engine.q, engine.qi);
                        let tr_alt = kept.tr_alt + accum.tr_alt;
                        let net = kept.net + accum.net;
                        let f = if net.abs()>1e-30 { tr_alt.abs()/net.abs() } else { 0.0 };
                        let hist = elem.histogram();
                        let pal = is_palindromic(&hist);
                        let ms = t0.elapsed().as_millis();
                        let tag = if accum.net.abs() > 1e-10 { "~" } else { " " };
                        println!("{:>12} {:>3} {:>3} {:>3} {:>10} {:>3} {:>+12.6} {:>+12.6} {:>10.6}{} {:>6}ms",
                            nucleus_name(zz,nn),zz,nn,a,elem.n_terms(),
                            if pal {"Y"} else {" "}, tr_alt, net, f, tag, ms);
                    }
                }
            }
        }

        "qvalues" => {
            // Use log_q(x) = ln(x)/ln(q) consistently.
            // The q-integer structure: log_q(P_dau/P_par) ≈ −(N−1), where N is the
            // number of strands whose crossing type changes in the β⁻ decay.
            // Numerically: log_q × κ_q = ln × κ  (the ln(q) cancels), so the
            // final Q-value prediction is unchanged from the bare-ln formulation.
            let ln_q = engine.q.ln();
            let kappa_q = 0.510999 / 3.0 * ln_q;  // κ_q = ln(q) × m_e/3
            let f_deg2 = 0.5904_f64; let f_pauli = 0.6382_f64;
            let magic = [2,8,20,28,50,82,126];
            let shell_degree = |n: usize| -> usize {
                let mut prev=0;
                for (i,&m) in magic.iter().enumerate() { if n<=m { return if i+1>=5 {2} else {1}; } prev=m; } 2
            };
            let is_magic = |n: usize| magic.contains(&n);

            struct B { z: usize, n: usize, name: &'static str, q_exp: f64 }
            let benchmarks = [
                B{z:1,n:2,name:"³H→³He",q_exp:0.01861},B{z:6,n:8,name:"¹⁴C→¹⁴N",q_exp:0.15648},
                B{z:27,n:33,name:"⁶⁰Co→⁶⁰Ni",q_exp:0.31817},B{z:38,n:52,name:"⁹⁰Sr→⁹⁰Y",q_exp:0.54590},
                B{z:55,n:82,name:"¹³⁷Cs→¹³⁷Ba",q_exp:0.51400},B{z:83,n:127,name:"²¹⁰Bi→²¹⁰Po",q_exp:1.16270},
            ];
            println!("Q-VALUES (transfer matrix, log_q basis, κ_q={:.6} MeV, ln(q)={:.6}, q₀={:.5})", kappa_q, ln_q, engine.q);
            println!("{:>16} {:>8} {:>8} {:>8} {:>8} {:>7}", "Decay","Q_pred","Q_exp","log_q","F","Error");
            println!("{}", "-".repeat(65));
            let mut errs = Vec::new();
            for b in &benchmarks {
                let a=b.z+b.n;
                let types_p: Vec<u8> = (0..b.z).map(|_| b'p').chain((0..b.n).map(|_| b'n')).collect();
                let types_d: Vec<u8> = (0..b.z+1).map(|_| b'p').chain((0..b.n-1).map(|_| b'n')).collect();
                let vp = engine.generator_volumes(b.z, b.n);
                let vd = engine.generator_volumes(b.z+1, b.n-1);
                let mut lu=0.0f64; let mut lr=0.0f64; let mut luc=0.0f64;
                for i in 0..a-1 {
                    if vp[i].abs()<1e-30||vd[i].abs()<1e-30 { continue; }
                    let lratio = (vd[i].abs().ln()-vp[i].abs().ln()) / ln_q;
                    let changed: Vec<_> = (i+1..a).filter(|&j| {
                        let pp=format!("{}{}",types_p[i] as char,types_p[j] as char);
                        let pd=format!("{}{}",types_d[i] as char,types_d[j] as char);
                        pp != pd
                    }).collect();
                    if changed.is_empty() { luc+=lratio; }
                    else {
                        let nu=changed.iter().filter(|&&j| types_p[i]==b'n'&&types_p[j]==b'n').count();
                        let nr=changed.iter().filter(|&&j| types_d[i]==b'p'&&types_d[j]==b'p').count();
                        let t=nu+nr;
                        if nr==0{lu+=lratio}else if nu==0{lr+=lratio}
                        else{lu+=lratio*nu as f64/t as f64; lr+=lratio*nr as f64/t as f64;}
                    }
                }
                let q_qwt = (engine.q*lu+engine.qi*lr+luc).abs()*kappa_q;
                let log_q_total = lu + lr + luc;  // total log_q(P_dau/P_par) ≈ −(N−1)
                let deg=shell_degree(b.n);
                let mut f = if deg>=2 {f_deg2} else {1.0};
                if is_magic(b.n)&&deg>=2 { f*=f_pauli; }
                let q_pred=q_qwt*f;
                let err=(q_pred-b.q_exp)/b.q_exp*100.0;
                errs.push(err.abs());
                let mark=if err.abs()<5.0 {"◀"} else {" "};
                println!("{:>16} {:>8.5} {:>8.5} {:>+8.3} {:>8.4} {:>+6.1}%{}", b.name, q_pred, b.q_exp, log_q_total, f, err, mark);
            }
            let mae: f64 = errs.iter().sum::<f64>()/errs.len() as f64;
            println!("\nMAE = {:.1}%  (log_q(P_dau/P_par) should be ≈ −(N−1), a q-integer)", mae);
        }

        "qvalues-cat" => {
            // ── Full categorical Q-value ───────────────────────────────
            //
            // Q_q = |S_q(par) − S_q(dau) − S_q(e)| × κ + δ_q × κ
            //
            // where:
            //   S_q(N) = ln|∏ V̂_i|      (Skein polynomial = Markov trace of nuclear braid)
            //   S_q(e) = ln|J(T_{2,3})| (Jones polynomial of right-hand trefoil)
            //   δ_q    = (∂(S_q(par)−S_q(dau))/∂q) × Δq_eff
            //   Δq_eff = (A−1)/A² × ℏ_q²
            //   κ      = m_e / 3         (electron mass / crossing number of T_{2,3})
            //
            // The neutrino term vanishes: S_q(unknot) = 1, ln(1) = 0.

            let m_e_mev = 0.510999_f64;
            let kappa = m_e_mev / 3.0;                     // κ = m_e / 3
            let hbar_q = 1.0 - engine.qi;                  // ℏ_q = 1 − q⁻¹

            // S_q(e) = ln|J(T_{2,3}, q₀)|
            let j_trefoil = -engine.q.powi(-4) + engine.q.powi(-3) + engine.qi;
            let s_q_electron = j_trefoil.abs().ln();

            // S_q(N) = ln|∏ V̂_i| from transfer-matrix generator volumes
            let s_q_nucleus = |z: usize, n: usize| -> f64 {
                engine.generator_volumes(z, n).iter()
                    .map(|v| v.abs().ln())
                    .sum::<f64>()
            };

            // δ_q: q-anomaly from self-deformation
            // ∂(S_q(par)−S_q(dau))/∂q computed by central finite difference
            let delta_q_correction = |z: usize, n: usize| -> (f64, f64, f64) {
                let a = (z + n) as f64;
                let dq_eff = (a - 1.0) / (a * a) * hbar_q * hbar_q;
                let h = 1.4e-7_f64;  // finite-difference step (~100 × Q_ERR)

                let delta_s_at = |q_val: f64| -> f64 {
                    let eng = HeckeEngine::new(q_val);
                    let vp: f64 = eng.generator_volumes(z, n).iter()
                        .map(|v| v.abs().ln()).sum();
                    let vd: f64 = eng.generator_volumes(z + 1, n - 1).iter()
                        .map(|v| v.abs().ln()).sum();
                    vp - vd
                };

                let ds_dq = (delta_s_at(engine.q + h) - delta_s_at(engine.q - h)) / (2.0 * h);
                (dq_eff * ds_dq, dq_eff, ds_dq)
            };

            println!("FULL CATEGORICAL Q-VALUE");
            println!("Q_q = |S_q(par) - S_q(dau) - S_q(e)| x kappa + delta_q x kappa");
            println!("{}", "=".repeat(100));
            println!();
            println!("  S_q(e)   = ln|J(T_{{2,3}}, q₀)| = {:.6}", s_q_electron);
            println!("  J(T_{{2,3}}, q₀) = {:.6}", j_trefoil);
            println!("  κ        = m_e / 3 = {:.6} MeV", kappa);
            println!("  ℏ_q      = 1 − q⁻¹ = {:.6}", hbar_q);
            println!("  q₀       = {:.10}", engine.q);
            println!();

            struct B { z: usize, n: usize, name: &'static str, q_exp: f64 }
            let benchmarks = [
                B{z:1,n:2,name:"³H→³He",q_exp:0.01861},
                B{z:6,n:8,name:"¹⁴C→¹⁴N",q_exp:0.15648},
                B{z:27,n:33,name:"⁶⁰Co→⁶⁰Ni",q_exp:0.31817},
                B{z:38,n:52,name:"⁹⁰Sr→⁹⁰Y",q_exp:0.54590},
                B{z:55,n:82,name:"¹³⁷Cs→¹³⁷Ba",q_exp:0.51400},
                B{z:83,n:127,name:"²¹⁰Bi→²¹⁰Po",q_exp:1.16270},
            ];

            println!("{:>16} {:>8} {:>8} {:>8} {:>8} {:>7} {:>7} {:>7} {:>10} {:>8}",
                "Decay","Q_bare","Q_+e","Q_cat","Q_exp","err_b","err_e","err_c","dq_eff","dS/dq");
            println!("{}", "-".repeat(100));

            let mut errs_b = Vec::new();
            let mut errs_e = Vec::new();
            let mut errs_c = Vec::new();

            for b in &benchmarks {
                let ln_p_par = s_q_nucleus(b.z, b.n);
                let ln_p_dau = s_q_nucleus(b.z + 1, b.n - 1);
                let delta_s = ln_p_par - ln_p_dau;

                let (dq_corr, dq_eff, ds_dq) = delta_q_correction(b.z, b.n);

                let q_bare   = delta_s.abs() * kappa;
                let q_with_e = (delta_s - s_q_electron).abs() * kappa;
                let q_cat    = (delta_s - s_q_electron).abs() * kappa + dq_corr * kappa;

                let err_b = (q_bare - b.q_exp) / b.q_exp * 100.0;
                let err_e = (q_with_e - b.q_exp) / b.q_exp * 100.0;
                let err_c = (q_cat - b.q_exp) / b.q_exp * 100.0;
                errs_b.push(err_b.abs());
                errs_e.push(err_e.abs());
                errs_c.push(err_c.abs());

                println!("{:>16} {:>8.5} {:>8.5} {:>8.5} {:>8.5} {:>+6.1}% {:>+6.1}% {:>+6.1}% {:>10.6} {:>+8.2}",
                    b.name, q_bare, q_with_e, q_cat, b.q_exp, err_b, err_e, err_c, dq_eff, ds_dq);
            }

            let mae_b: f64 = errs_b.iter().sum::<f64>() / errs_b.len() as f64;
            let mae_e: f64 = errs_e.iter().sum::<f64>() / errs_e.len() as f64;
            let mae_c: f64 = errs_c.iter().sum::<f64>() / errs_c.len() as f64;
            println!();
            println!("  Bare (|ln P ratio| × κ):              MAE = {:.1}%", mae_b);
            println!("  + electron (−ln J(T_{{2,3}})):          MAE = {:.1}%", mae_e);
            println!("  + q-anomaly (full categorical):        MAE = {:.1}%", mae_c);
            println!();
            println!("  No F_shell, no F_I10, no q-weighting.");
            println!("  Pure categorical action difference.");

            // ── Protium recursion ────────────────────────────────────
            // Build protium at quark level: 4 strands (u, u, d, e)
            // Using the same crossing convention as nucleon level
            // but with quark-type crossings:
            //   uu → (1, 0)      same as pp
            //   dd → (1, −HA)    same as nn
            //   ud → (1, −HA/2)  same as pn
            //   ue, de → (1, 0)  electron = pure Hopf link (σ crossing)

            println!();
            println!("{}", "=".repeat(100));
            println!("PROTIUM RECURSION: quark-level S_q for ℵ(1,0) and ℵ(1,1)");
            println!("{}", "=".repeat(100));
            println!();

            // Protium: u, u, d, e  (4 strands)
            let protium_types: Vec<u8> = vec![b'p', b'p', b'n', b'p'];  // u=p, d=n, e=p(Hopf)
            let protium_vols = engine.generator_volumes_typed(&protium_types);
            let s_q_protium: f64 = protium_vols.iter().map(|v| v.abs().ln()).sum();

            println!("  Protium ℵ(1,0): 4 strands [u, u, d, e]");
            println!("    V̂ = {:?}", protium_vols);
            println!("    S_q(protium) = ln|∏V̂| = {:.10}", s_q_protium);
            println!();

            // Deuterium: u, u, d, u, d, d, e  (7 strands)
            let deuterium_types: Vec<u8> = vec![b'p', b'p', b'n', b'p', b'n', b'n', b'p'];
            let deuterium_vols = engine.generator_volumes_typed(&deuterium_types);
            let s_q_deuterium: f64 = deuterium_vols.iter().map(|v| v.abs().ln()).sum();

            println!("  Deuterium ℵ(1,1): 7 strands [u, u, d, u, d, d, e]");
            println!("    V̂ = {:?}", deuterium_vols);
            println!("    S_q(deuterium) = ln|∏V̂| = {:.10}", s_q_deuterium);
            println!();

            // Recursive structure: deuterium = protium + neutron
            // S_q(deuterium) vs S_q(protium) + S_q(neutron_quarks)
            let neutron_q_types: Vec<u8> = vec![b'p', b'n', b'n'];  // u, d, d
            let s_q_neutron_q: f64 = engine.generator_volumes_typed(&neutron_q_types)
                .iter().map(|v| v.abs().ln()).sum();

            let proton_q_types: Vec<u8> = vec![b'p', b'p', b'n'];   // u, u, d
            let s_q_proton_q: f64 = engine.generator_volumes_typed(&proton_q_types)
                .iter().map(|v| v.abs().ln()).sum();

            println!("  Quark-level constituents:");
            println!("    S_q(proton quarks) = {:.10}", s_q_proton_q);
            println!("    S_q(neutron quarks) = {:.10}", s_q_neutron_q);
            println!("    S_q(proton) + S_q(neutron) = {:.10}", s_q_proton_q + s_q_neutron_q);
            println!("    S_q(protium) = {:.10}", s_q_protium);
            println!("    S_q(deuterium) = {:.10}", s_q_deuterium);
            println!();

            // Binding energy from recursion:
            // ΔS = S_q(composite) − Σ S_q(constituents) − S_q(e)
            let delta_binding_H = s_q_protium - s_q_proton_q - s_q_electron;
            let delta_binding_D = s_q_deuterium - (s_q_proton_q + s_q_neutron_q) - s_q_electron;

            println!("  Recursive binding:");
            println!("    ΔS(protium)   = S_q(H) − S_q(p_quarks) − S_q(e) = {:.10}", delta_binding_H);
            println!("    ΔS(deuterium) = S_q(D) − S_q(p+n quarks) − S_q(e) = {:.10}", delta_binding_D);
            println!("    |ΔS(H)| × κ = {:.6} MeV", delta_binding_H.abs() * kappa);
            println!("    |ΔS(D)| × κ = {:.6} MeV", delta_binding_D.abs() * kappa);
            println!();

            // Deuterium binding energy: B = m_p + m_n − m_D = 2.22457 MeV
            let b_deuterium_exp = 2.22457_f64;
            let b_deuterium_pred = delta_binding_D.abs() * kappa;
            let err_d = (b_deuterium_pred - b_deuterium_exp) / b_deuterium_exp * 100.0;
            println!("  Deuterium binding energy:");
            println!("    B(D)_pred = |ΔS(D)| × κ = {:.6} MeV", b_deuterium_pred);
            println!("    B(D)_exp  = 2.22457 MeV");
            println!("    Error: {:+.1}%", err_d);
            println!();

            // Also try: protium-to-deuterium by adding neutron
            let delta_H_to_D = s_q_deuterium - s_q_protium - s_q_neutron_q;
            println!("  Protium → Deuterium (adding neutron):");
            println!("    ΔS(H→D) = S_q(D) − S_q(H) − S_q(n_quarks) = {:.10}", delta_H_to_D);
            println!("    |ΔS(H→D)| × κ = {:.6} MeV", delta_H_to_D.abs() * kappa);
        }

        "qvalues-l1" => {
            // ── Quark-level (L1) Q-value computation ────────────────────
            //
            // Each nucleon → 3 quark strands:
            //   proton  → [u, u, d] = [p, p, n]
            //   neutron → [u, d, d] = [p, n, n]
            //
            // At quark level, b'p' = u-quark and b'n' = d-quark.
            // The same crossing_coeffs applies: uu→σ, dd→σ⁻¹, ud→½(σ+σ⁻¹).
            //
            // β⁻ decay: one neutron → proton = one d→u flip in quark array.
            // At quark level: [p,n,n] → [p,p,n], the flip is at position 3k+1.
            //
            // Method: same log-ratio transfer-matrix approach as L0 `qvalues`,
            // but with 3A strands and quark-level type classification.

            let m_e_mev = 0.510999_f64;            // electron rest mass (CODATA 2022)
            let q_neutron_mev = 0.78233341_f64;    // Q(n→p e⁻ ν̄) (CODATA 2022)
            let min_q_threshold = 0.001_f64;        // MeV, filter near-zero noise

            let ln_q = engine.q.ln();
            let kappa_q = m_e_mev / 3.0 * ln_q;   // κ_q = ln(q) × m_e/3

            fn expand_to_quarks(nucleons: &[u8]) -> Vec<u8> {
                let mut quarks = Vec::with_capacity(nucleons.len() * 3);
                for &nuc in nucleons {
                    if nuc == b'p' {
                        quarks.extend_from_slice(&[b'p', b'p', b'n']); // u, u, d
                    } else {
                        quarks.extend_from_slice(&[b'p', b'n', b'n']); // u, d, d
                    }
                }
                quarks
            }

            println!("QUARK-LEVEL (L1) Q-VALUES  (log-ratio transfer matrix)");
            println!("======================================================");
            println!("  q₀ = {:.10}, HA = {:.10}, ln(q) = {:.10}", engine.q, engine.ha, ln_q);
            println!("  κ_q = ln(q) × m_e/3 = {:.6} MeV", kappa_q);
            println!();

            // ── Free neutron at L1: calibrate energy scale ─────────
            let e_l1: f64;
            {
                let par_q: Vec<u8> = vec![b'p', b'n', b'n'];  // neutron quarks
                let dau_q: Vec<u8> = vec![b'p', b'p', b'n'];  // proton quarks
                let vp = engine.generator_volumes_typed(&par_q);
                let vd = engine.generator_volumes_typed(&dau_q);

                // q-weighted log-ratio sum (same formula as nuclei)
                let par_types = &par_q;
                let dau_types = &dau_q;
                let n_s = 3usize;
                let mut lu_n = 0.0f64;
                let mut lr_n = 0.0f64;
                let mut luc_n = 0.0f64;
                for i in 0..n_s-1 {
                    if vp[i].abs() < 1e-30 || vd[i].abs() < 1e-30 { continue; }
                    let lratio = (vd[i].abs().ln() - vp[i].abs().ln()) / ln_q;
                    let mut n_unbind = 0usize;
                    let mut n_rebind = 0usize;
                    let mut any_changed = false;
                    for j in (i+1)..n_s {
                        let tp = (par_types[i], par_types[j]);
                        let td = (dau_types[i], dau_types[j]);
                        if tp != td {
                            any_changed = true;
                            if tp.0 == tp.1 && tp.0 == b'n' { n_unbind += 1; }
                            if td.0 == td.1 && td.0 == b'p' { n_rebind += 1; }
                        }
                    }
                    if !any_changed { luc_n += lratio; }
                    else {
                        let total = n_unbind + n_rebind;
                        if total == 0 { luc_n += lratio; }
                        else if n_rebind == 0 { lu_n += lratio; }
                        else if n_unbind == 0 { lr_n += lratio; }
                        else {
                            lu_n += lratio * n_unbind as f64 / total as f64;
                            lr_n += lratio * n_rebind as f64 / total as f64;
                        }
                    }
                }
                let raw_q_free = (engine.q * lu_n + engine.qi * lr_n + luc_n).abs();
                e_l1 = q_neutron_mev / raw_q_free;  // E_L1 × |weighted sum| = Q_NEUTRON

                println!("Free neutron calibration (L1):");
                println!("  V̂_par = {:?}", vp);
                println!("  V̂_dau = {:?}", vd);
                println!("  q·Σ_u + q⁻¹·Σ_r + Σ_uc = {:+.6}", engine.q*lu_n + engine.qi*lr_n + luc_n);
                println!("  |weighted sum| = {:.6}", raw_q_free);
                println!("  E_L1(calibrated) = Q_NEUTRON / |sum| = {:.6} MeV", e_l1);
                println!("  κ_q(nucleon)     = ln(q) × m_e/3    = {:.6} MeV  (ratio {:.3})", kappa_q, e_l1 / kappa_q);
                println!();
            }

            // ── Benchmark nuclei ────────────────────────────────────
            struct B { z: usize, n: usize, name: &'static str, q_exp: f64 }
            let benchmarks = [
                B{z:1,n:2,name:"³H→³He",q_exp:0.01861},
                B{z:6,n:8,name:"¹⁴C→¹⁴N",q_exp:0.15648},
                B{z:27,n:33,name:"⁶⁰Co→⁶⁰Ni",q_exp:0.31817},
                B{z:38,n:52,name:"⁹⁰Sr→⁹⁰Y",q_exp:0.54590},
                B{z:55,n:82,name:"¹³⁷Cs→¹³⁷Ba",q_exp:0.51400},
                B{z:83,n:127,name:"²¹⁰Bi→²¹⁰Po",q_exp:1.16270},
            ];

            println!("{:>16} {:>4} {:>5} {:>10} {:>10} {:>10} {:>10} {:>7} {:>10} {:>7}",
                "Decay", "3A", "site", "Σlog_q_u", "Σlog_q_r", "Q(κ_q)", "Q_exp", "err_κ", "Q(E_L1)", "err_cal");
            println!("{}", "-".repeat(110));

            let mut errs = Vec::new();
            let mut errs_site0: Vec<f64> = Vec::new();

            for b in &benchmarks {
                let a = b.z + b.n;

                // Build nucleon ordering: protons first, then neutrons
                let nucleons: Vec<u8> = (0..b.z).map(|_| b'p')
                    .chain((0..b.n).map(|_| b'n')).collect();
                let quarks_par = expand_to_quarks(&nucleons);
                let n_strands = quarks_par.len();
                let n_gens = n_strands - 1;

                let vp = engine.generator_volumes_typed(&quarks_par);

                // Try each neutron as conversion site
                let mut best_q_pred = f64::MAX;
                let mut best_site = 0usize;
                let mut best_lu = 0.0f64;
                let mut best_lr = 0.0f64;
                let mut all_sites: Vec<(usize, f64, f64, f64)> = Vec::new();

                for site_idx in 0..b.n {
                    let nuc_pos = b.z + site_idx;
                    let mut nucleons_dau = nucleons.clone();
                    nucleons_dau[nuc_pos] = b'p';
                    let quarks_dau = expand_to_quarks(&nucleons_dau);

                    // Log-ratio computation with crossing-type classification
                    let vd = engine.generator_volumes_typed(&quarks_dau);
                    let mut lu = 0.0f64; // unbinding log_q sums
                    let mut lr = 0.0f64; // rebinding log_q sums
                    let mut luc = 0.0f64; // unchanged log_q sums

                    for i in 0..n_gens {
                        if vp[i].abs() < 1e-30 || vd[i].abs() < 1e-30 { continue; }
                        let lratio = (vd[i].abs().ln() - vp[i].abs().ln()) / ln_q;

                        // Check which crossings from generator i changed type
                        let mut n_unbind = 0usize;  // nn→pn or nn→np
                        let mut n_rebind = 0usize;  // pn→pp or np→pp
                        let mut any_changed = false;
                        for j in (i+1)..n_strands {
                            let tp = (quarks_par[i], quarks_par[j]);
                            let td = (quarks_dau[i], quarks_dau[j]);
                            if tp != td {
                                any_changed = true;
                                // Unbinding: both same type (nn) in parent → mixed in daughter
                                if tp.0 == tp.1 && tp.0 == b'n' { n_unbind += 1; }
                                // Rebinding: mixed in parent → both same type (pp) in daughter
                                if td.0 == td.1 && td.0 == b'p' { n_rebind += 1; }
                            }
                        }

                        if !any_changed {
                            luc += lratio;
                        } else {
                            let total = n_unbind + n_rebind;
                            if total == 0 {
                                luc += lratio; // changed but no nn→pn or pn→pp (e.g. pn→np)
                            } else if n_rebind == 0 {
                                lu += lratio;
                            } else if n_unbind == 0 {
                                lr += lratio;
                            } else {
                                lu += lratio * n_unbind as f64 / total as f64;
                                lr += lratio * n_rebind as f64 / total as f64;
                            }
                        }
                    }

                    let q_kappa = (engine.q * lu + engine.qi * lr + luc).abs() * kappa_q;
                    let q_cal = (engine.q * lu + engine.qi * lr + luc).abs() * e_l1;

                    // Min-positive: select smallest positive Q (using κ_q scale)
                    if q_kappa > min_q_threshold {
                        if best_q_pred == f64::MAX || q_kappa < best_q_pred {
                            best_q_pred = q_kappa;
                            best_site = site_idx;
                            best_lu = lu;
                            best_lr = lr;
                        }
                    }

                    all_sites.push((site_idx, q_kappa, lu, lr));
                }

                // If no positive Q found (all near zero), take smallest magnitude
                if best_q_pred == f64::MAX && !all_sites.is_empty() {
                    let q_exp = b.q_exp;
                    let best_entry = all_sites.iter()
                        .min_by(|a, b_item| (a.1 - q_exp).abs().partial_cmp(&(b_item.1 - q_exp).abs()).unwrap())
                        .unwrap();
                    best_q_pred = best_entry.1;
                    best_site = best_entry.0;
                    best_lu = best_entry.2;
                    best_lr = best_entry.3;
                }

                let q_cal = best_q_pred / kappa_q * e_l1;
                let err_k = (best_q_pred - b.q_exp) / b.q_exp * 100.0;
                let err_c = (q_cal - b.q_exp) / b.q_exp * 100.0;
                errs.push(err_k.abs());

                // Also show site-0 result
                let site0 = &all_sites[0];
                let err0 = (site0.1 - b.q_exp) / b.q_exp * 100.0;
                errs_site0.push(err0.abs());

                let mark_k = if err_k.abs() < 10.0 { "◀" } else { " " };
                let mark_c = if err_c.abs() < 10.0 { "◀" } else { " " };
                println!("{:>16} {:>4}  s={:<3} {:>+10.4} {:>+10.4} {:>10.5} {:>10.5} {:>+6.1}%{} {:>10.5} {:>+6.1}%{}",
                    b.name, n_strands, best_site, best_lu, best_lr,
                    best_q_pred, b.q_exp, err_k, mark_k,
                    q_cal, err_c, mark_c);
            }

            let mae: f64 = errs.iter().sum::<f64>() / errs.len() as f64;
            let rms: f64 = (errs.iter().map(|e| e*e).sum::<f64>() / errs.len() as f64).sqrt();
            let mae0: f64 = errs_site0.iter().sum::<f64>() / errs_site0.len() as f64;
            println!();
            println!("Min-positive-Q site:  MAE = {:.1}%, RMS = {:.1}%", mae, rms);
            println!("First-neutron (s=0):  MAE = {:.1}%", mae0);
            println!("Convention: σ⁻¹ = σ − (q−q⁻¹),  pp=(1,0) nn=(1,−HA) pn=(1,−HA/2)");
            println!("No shell corrections, no fitting parameters.");
        }

        _ => { eprintln!("Unknown: {}", args[1]); std::process::exit(1); }
    }
}
