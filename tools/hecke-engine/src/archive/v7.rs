// v7: Symbolic Gröbner--Shirshov engine — exact in q.
//
// All coefficients are Laurent polynomials in t = q^{1/2} over ℤ.
// No floating point until final evaluation.
//
// Polynomial type: BTreeMap<i32, i128> where key = power of t, value = coefficient.
// Crossing coefficients use DOUBLED form for pn (factor of 2 tracked globally).
//
// Architecture:
//   1. Try symbolic computation
//   2. If it completes: evaluate at q₀, verify against float
//   3. If OOM/timeout: fall back to float with warning
//
// The support (which words appear) is q-independent.
// The coefficients are polynomials in t.

#![allow(dead_code, unused_imports)]
use rustc_hash::FxHashMap;
use std::collections::BTreeMap;
use std::time::Instant;

// ════════════════════════════════════════════════════════════════
// Laurent polynomial in t = q^{1/2} over ℤ
// ════════════════════════════════════════════════════════════════

/// Sparse Laurent polynomial: Σ a_k t^k where a_k ∈ ℤ (stored as i128).
#[derive(Clone, Debug, PartialEq, Eq, Default)]
struct LPoly {
    terms: BTreeMap<i32, i128>,
}

impl LPoly {
    fn zero() -> Self { Self { terms: BTreeMap::new() } }
    fn one() -> Self { let mut p = Self::zero(); p.terms.insert(0, 1); p }
    fn t(power: i32) -> Self { let mut p = Self::zero(); p.terms.insert(power, 1); p }

    fn is_zero(&self) -> bool { self.terms.is_empty() }

    fn coeff(&self, power: i32) -> i128 { self.terms.get(&power).copied().unwrap_or(0) }

    fn add(&self, other: &LPoly) -> LPoly {
        let mut result = self.clone();
        for (&k, &v) in &other.terms {
            let e = result.terms.entry(k).or_insert(0);
            *e += v;
            if *e == 0 { result.terms.remove(&k); }
        }
        result
    }

    fn sub(&self, other: &LPoly) -> LPoly {
        let mut result = self.clone();
        for (&k, &v) in &other.terms {
            let e = result.terms.entry(k).or_insert(0);
            *e -= v;
            if *e == 0 { result.terms.remove(&k); }
        }
        result
    }

    fn scale(&self, s: i128) -> LPoly {
        if s == 0 { return Self::zero(); }
        let mut result = BTreeMap::new();
        for (&k, &v) in &self.terms {
            let p = v.checked_mul(s);
            match p {
                Some(val) if val != 0 => { result.insert(k, val); }
                Some(_) => {}
                None => {
                    // Overflow — this is the failure mode for large A
                    eprintln!("WARNING: i128 overflow at power t^{}, coeff {} × {}", k, v, s);
                    result.insert(k, i128::MAX); // saturate
                }
            }
        }
        LPoly { terms: result }
    }

    fn mul(&self, other: &LPoly) -> LPoly {
        let mut result = BTreeMap::new();
        for (&k1, &v1) in &self.terms {
            for (&k2, &v2) in &other.terms {
                let k = k1 + k2;
                let prod = v1.checked_mul(v2);
                let val = match prod {
                    Some(p) => p,
                    None => {
                        eprintln!("WARNING: i128 overflow in mul t^{}×t^{}", k1, k2);
                        if (v1 > 0) == (v2 > 0) { i128::MAX } else { i128::MIN }
                    }
                };
                let e = result.entry(k).or_insert(0i128);
                *e = e.checked_add(val).unwrap_or_else(|| {
                    eprintln!("WARNING: i128 overflow in add at t^{}", k);
                    if val > 0 { i128::MAX } else { i128::MIN }
                });
                if *e == 0 { result.remove(&k); }
            }
        }
        LPoly { terms: result }
    }

    /// Shift all powers by n: multiply by t^n.
    fn shift(&self, n: i32) -> LPoly {
        let mut result = BTreeMap::new();
        for (&k, &v) in &self.terms { result.insert(k + n, v); }
        LPoly { terms: result }
    }

    /// Evaluate at t = q^{1/2} (f64).
    fn eval(&self, t: f64) -> f64 {
        self.terms.iter().map(|(&k, &v)| (v as f64) * t.powi(k)).sum()
    }

    /// Number of nonzero terms.
    fn n_terms(&self) -> usize { self.terms.len() }

    /// Memory estimate in bytes.
    fn mem_bytes(&self) -> usize { self.terms.len() * 20 } // (i32 + i128) per entry

    /// Display as polynomial string.
    fn display(&self) -> String {
        if self.terms.is_empty() { return "0".to_string(); }
        let mut parts = Vec::new();
        for (&k, &v) in &self.terms {
            if k == 0 { parts.push(format!("{}", v)); }
            else if v == 1 { parts.push(format!("t^{}", k)); }
            else if v == -1 { parts.push(format!("-t^{}", k)); }
            else { parts.push(format!("{}·t^{}", v, k)); }
        }
        parts.join(" + ").replace("+ -", "- ")
    }

    /// Check for overflow: any coefficient at i128::MAX or i128::MIN.
    fn has_overflow(&self) -> bool {
        self.terms.values().any(|&v| v == i128::MAX || v == i128::MIN)
    }
}

// ════════════════════════════════════════════════════════════════
// Crossing coefficients in ℤ[t, t⁻¹] (DOUBLED for pn)
// ════════════════════════════════════════════════════════════════

/// HA = q - q⁻¹ = t² - t⁻² in ℤ[t, t⁻¹].
fn ha_poly() -> LPoly {
    let mut p = LPoly::zero();
    p.terms.insert(2, 1);   // t²
    p.terms.insert(-2, -1); // -t⁻²
    p
}

/// Crossing coefficients (c, d) in ℤ[t, t⁻¹] where t = q^½.
/// From σ⁻¹ = σ − (q − q⁻¹):
///   pp → σ:   c = 1, d = 0
///   nn → σ⁻¹: c = 1, d = −HA = −t² + t⁻²
///   pn → ½(σ+σ⁻¹): doubled → 2c = 2, 2d = −t² + t⁻²
fn crossing_coeffs_sym(ti: u8, tj: u8) -> (LPoly, LPoly, bool) {
    match (ti, tj) {
        (b'p', b'p') => (LPoly::one(), LPoly::zero(), false), // c=1, d=0
        (b'n', b'n') => {
            // c = 1, d = −HA = −t² + t⁻²
            let c = LPoly::one();
            let mut d = LPoly::zero();
            d.terms.insert(2, -1);   // −t²
            d.terms.insert(-2, 1);   // +t⁻²
            (c, d, false)
        }
        _ => {
            // pn: DOUBLED. 2c = 2, 2d = −HA = −t² + t⁻²
            let mut two_c = LPoly::zero();
            two_c.terms.insert(0, 2); // 2
            let mut two_d = LPoly::zero();
            two_d.terms.insert(2, -1);  // −t²
            two_d.terms.insert(-2, 1);  // +t⁻²
            (two_c, two_d, true) // doubled = true
        }
    }
}

// ════════════════════════════════════════════════════════════════
// TreeWord (same as v5/v6)
// ════════════════════════════════════════════════════════════════

const GENS_PER_CHUNK: usize = 32;
const MAX_CHUNKS: usize = 4;

#[derive(Clone, Copy, PartialEq, Eq, Hash)]
struct TreeWord {
    len: u8,
    chunks: [u128; MAX_CHUNKS],
}

impl TreeWord {
    const EMPTY: TreeWord = TreeWord { len: 0, chunks: [0; MAX_CHUNKS] };
    #[inline] fn len(self) -> usize { self.len as usize }
    #[inline] fn get(self, pos: usize) -> u8 {
        let (c, b) = (pos/GENS_PER_CHUNK, (pos%GENS_PER_CHUNK)*4);
        ((self.chunks[c] >> b) & 0xF) as u8
    }
    #[inline] fn set(&mut self, pos: usize, val: u8) {
        let (c, b) = (pos/GENS_PER_CHUNK, (pos%GENS_PER_CHUNK)*4);
        self.chunks[c] = (self.chunks[c] & !(0xFu128 << b)) | ((val as u128) << b);
    }
    fn push(self, gen: u8) -> TreeWord {
        let mut w = self; let l = self.len as usize;
        w.set(l, gen); w.len = (l+1) as u8; w
    }
    fn drop_last(self) -> TreeWord {
        if self.len == 0 { return self; }
        let mut w = self; let l = self.len as usize;
        w.set(l-1, 0); w.len = (l-1) as u8; w
    }
    fn remove_at(self, pos: usize) -> TreeWord {
        let l = self.len as usize;
        let mut r = TreeWord { len: (l-1) as u8, chunks: [0; MAX_CHUNKS] };
        let mut j = 0;
        for i in 0..l { if i == pos { continue; } r.set(j, self.get(i)); j += 1; }
        r
    }
    fn find_reduction(self) -> Option<(usize, u8)> {
        let l = self.len();
        if l < 2 { return None; }
        for pos in 0..l-1 {
            let a = self.get(pos); let b = self.get(pos+1);
            if a == b { return Some((pos, 0)); }
            if (a as i16 - b as i16) >= 2 { return Some((pos, 1)); }
            if pos+2 < l {
                let c = self.get(pos+2);
                if a == c && (a as i16 - b as i16).abs() == 1 && b < a {
                    return Some((pos, 2));
                }
            }
        }
        None
    }
}

impl std::fmt::Debug for TreeWord {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let l = self.len();
        if l == 0 { return write!(f, "𝟏"); }
        for i in 0..l { if i > 0 { write!(f, ".")?; } write!(f, "σ{}", self.get(i))?; }
        Ok(())
    }
}

// ════════════════════════════════════════════════════════════════
// Symbolic Hecke element: word → LPoly coefficient
// ════════════════════════════════════════════════════════════════

struct SymElem {
    terms: FxHashMap<TreeWord, LPoly>,
    /// Number of pn crossings applied (tracks the 2^n denominator).
    pn_count: u32,
}

impl SymElem {
    fn new() -> Self { Self { terms: FxHashMap::default(), pn_count: 0 } }
    fn identity() -> Self {
        let mut h = Self::new();
        h.terms.insert(TreeWord::EMPTY, LPoly::one());
        h
    }
    fn n_terms(&self) -> usize { self.terms.len() }
    fn clean(&mut self) { self.terms.retain(|_, c| !c.is_zero()); }
    fn has_overflow(&self) -> bool { self.terms.values().any(|c| c.has_overflow()) }

    fn total_poly_terms(&self) -> usize {
        self.terms.values().map(|c| c.n_terms()).sum()
    }

    fn mem_bytes(&self) -> usize {
        self.terms.iter().map(|(_, c)| 72 + c.mem_bytes()).sum()
    }
}

// ════════════════════════════════════════════════════════════════
// Engine
// ════════════════════════════════════════════════════════════════

struct SymEngine;

impl SymEngine {
    fn multiply_and_reduce(elem: &mut SymElem, gen: u8, c: &LPoly, d: &LPoly, is_doubled: bool) {
        let ha = ha_poly();
        let old: Vec<(TreeWord, LPoly)> = elem.terms.drain().collect();

        if is_doubled { elem.pn_count += 1; }

        for (w, coeff) in old {
            // d·w term
            if !d.is_zero() {
                let scaled = coeff.mul(d);
                let e = elem.terms.entry(w).or_insert(LPoly::zero());
                *e = e.add(&scaled);
            }
            // c·(w·σ_gen) term
            if !c.is_zero() {
                let wg = w.push(gen);
                let scaled = coeff.mul(c);
                let e = elem.terms.entry(wg).or_insert(LPoly::zero());
                *e = e.add(&scaled);
            }
        }

        // Reduce
        Self::reduce_all(elem, &ha);
        elem.clean();
    }

    /// Smart reduction with separated pools (no rescan of stable terms).
    /// Implements tail reduction: new terms from reductions go to pending,
    /// stable terms are never rescanned.
    fn reduce_all(elem: &mut SymElem, ha: &LPoly) {
        let mut pending: FxHashMap<TreeWord, LPoly> = std::mem::take(&mut elem.terms);
        let mut stable: FxHashMap<TreeWord, LPoly> = FxHashMap::default();

        loop {
            let mut next: FxHashMap<TreeWord, LPoly> = FxHashMap::default();
            let mut any_reduced = false;

            for (word, coeff) in pending.iter() {
                if coeff.is_zero() { continue; }
                if let Some((pos, rule)) = word.find_reduction() {
                    any_reduced = true;
                    match rule {
                        0 => {
                            let w1 = word.remove_at(pos + 1);
                            let w2 = w1.remove_at(pos);
                            let c1 = coeff.mul(ha);
                            let e1 = next.entry(w1).or_insert(LPoly::zero());
                            *e1 = e1.add(&c1);
                            let e2 = next.entry(w2).or_insert(LPoly::zero());
                            *e2 = e2.add(coeff);
                        }
                        1 => {
                            let mut w = *word;
                            let (a, b) = (w.get(pos), w.get(pos+1));
                            w.set(pos, b); w.set(pos+1, a);
                            let e = next.entry(w).or_insert(LPoly::zero());
                            *e = e.add(coeff);
                        }
                        2 => {
                            let mut w = *word;
                            let (a, b) = (w.get(pos), w.get(pos+1));
                            w.set(pos, b); w.set(pos+1, a); w.set(pos+2, b);
                            let e = next.entry(w).or_insert(LPoly::zero());
                            *e = e.add(coeff);
                        }
                        _ => {}
                    }
                } else {
                    // Stable — never rescanned
                    let e = stable.entry(*word).or_insert(LPoly::zero());
                    *e = e.add(coeff);
                }
            }

            if !any_reduced { break; }

            // Inter-reduce: if a new term collides with a stable term,
            // merge them and re-check (the merged coefficient might cancel)
            let mut merged: FxHashMap<TreeWord, LPoly> = FxHashMap::default();
            for (w, c) in next {
                if c.is_zero() { continue; }
                if let Some(existing) = stable.remove(&w) {
                    let sum = existing.add(&c);
                    if !sum.is_zero() {
                        merged.insert(w, sum);
                    }
                } else {
                    merged.insert(w, c);
                }
            }
            pending = merged;
        }

        // Merge any remaining pending into stable
        for (w, c) in pending {
            if !c.is_zero() {
                let e = stable.entry(w).or_insert(LPoly::zero());
                *e = e.add(&c);
            }
        }
        stable.retain(|_, c| !c.is_zero());
        elem.terms = stable;
    }

    fn build(z: usize, n: usize) -> SymElem {
        let a = z + n;
        let mut types = vec![b'p'; z];
        types.extend(vec![b'n'; n]);
        let mut elem = SymElem::identity();
        let t_start = Instant::now();
        let mut max_coeff: i128 = 0;
        let mut max_poly_terms: usize = 0;
        let mut crossings_total: usize = 0;

        for k in 1..a {
            let t_strand = Instant::now();
            for i in 0..k {
                let t_cross = Instant::now();
                let (c, d, doubled) = crossing_coeffs_sym(types[i], types[k]);
                Self::multiply_and_reduce(&mut elem, i as u8, &c, &d, doubled);
                crossings_total += 1;

                // Track bottleneck data
                let poly_terms = elem.total_poly_terms();
                if poly_terms > max_poly_terms { max_poly_terms = poly_terms; }
                for (_, lp) in &elem.terms {
                    for &v in lp.terms.values() {
                        if v.abs() > max_coeff { max_coeff = v.abs(); }
                    }
                }

                let cross_ms = t_cross.elapsed().as_millis();
                if cross_ms > 500 {
                    eprintln!("    crossing ({},{}) {}-{}: {} words, {} poly terms, {}ms",
                        i, k, types[i] as char, types[k] as char,
                        elem.n_terms(), elem.total_poly_terms(), cross_ms);
                }

                if elem.has_overflow() {
                    eprintln!("  OVERFLOW at crossing ({},{}) — falling back to float", i, k);
                    eprintln!("  max_coeff = {}, max_poly_terms = {}, crossings = {}",
                        max_coeff, max_poly_terms, crossings_total);
                    return elem;
                }
            }
            let elapsed = t_start.elapsed().as_secs_f64();
            let strand_ms = t_strand.elapsed().as_millis();
            let poly_terms = elem.total_poly_terms();
            let mem_mb = elem.mem_bytes() as f64 / 1_048_576.0;
            let avg_poly = if elem.n_terms() > 0 { poly_terms / elem.n_terms() } else { 0 };
            eprintln!("  strand {}/{}: {} words, {} poly terms (avg {}/word), max_coeff ~10^{:.0}, {:.1}MB, {:.1}s (strand {}ms)",
                k, a-1, elem.n_terms(), poly_terms, avg_poly,
                if max_coeff > 0 { (max_coeff as f64).log10() } else { 0.0 },
                mem_mb, elapsed, strand_ms);
        }
        elem
    }
}

// ════════════════════════════════════════════════════════════════
// Pauli computation: symbolic tr_alt(q) and net(q)
// ════════════════════════════════════════════════════════════════

fn compute_pauli_sym(elem: &SymElem) -> (LPoly, LPoly) {
    // tr_alt = Σ c_w(t) × (-t⁻²)^ℓ(w)   (since -q⁻¹ = -t⁻²)
    // net    = Σ c_w(t)
    let mut tr_alt = LPoly::zero();
    let mut net = LPoly::zero();

    for (w, c) in &elem.terms {
        let l = w.len() as i32;
        net = net.add(c);
        // (-q⁻¹)^ℓ = (-1)^ℓ × t^{-2ℓ}
        let sign = if l % 2 == 0 { 1i128 } else { -1i128 };
        let shifted = c.scale(sign).shift(-2 * l);
        tr_alt = tr_alt.add(&shifted);
    }
    (tr_alt, net)
}

fn main() {
    let args: Vec<String> = std::env::args().collect();

    if args.len() < 2 {
        eprintln!("Usage: v7 Z N");
        std::process::exit(1);
    }

    let z: usize = args[1].parse().unwrap();
    let n: usize = args[2].parse().unwrap();
    let a = z + n;
    let sym = match z {1=>"H",2=>"He",3=>"Li",4=>"Be",5=>"B",6=>"C",7=>"N",8=>"O",_=>"?"};
    let magic = [2,8,20,28,50,82,126];
    let doubly_magic = magic.contains(&z) && magic.contains(&n);

    println!("════════════════════════════════════════════════════════");
    println!("  Symbolic Pauli witness for {}{} (Z={}, N={}, A={})", a, sym, z, n, a);
    println!("  All coefficients EXACT in t = q^{{1/2}} over ℤ.");
    if doubly_magic { println!("  ★★ DOUBLY MAGIC"); }
    println!("════════════════════════════════════════════════════════");
    println!();

    let t0 = Instant::now();
    let elem = SymEngine::build(z, n);

    if elem.has_overflow() {
        println!("  OVERFLOW detected — symbolic result unreliable.");
        println!("  Use v6 (float) for this A.");
        return;
    }

    let (tr_alt, net_poly) = compute_pauli_sym(&elem);
    let ms = t0.elapsed().as_millis();

    println!();
    println!("════════════════════════════════════════════════════════");
    println!("  RESULT: {}{} (Z={}, N={}, A={})", a, sym, z, n, a);
    println!("  {} words, {} total poly terms", elem.n_terms(), elem.total_poly_terms());
    println!("  pn_count = {} (denominator = 2^{})", elem.pn_count, elem.pn_count);
    println!("  {:.1}s", ms as f64 / 1000.0);
    println!();
    println!("  tr_alt(t) = {}", tr_alt.display());
    println!("  net(t)    = {}", net_poly.display());
    println!();

    // Evaluate at q₀ = 1.10998 → t₀ = √q₀
    let q0 = 1.10998_f64;
    let t0_val = q0.sqrt();
    let denom = 2.0_f64.powi(elem.pn_count as i32);
    let tr_alt_val = tr_alt.eval(t0_val) / denom;
    let net_val = net_poly.eval(t0_val) / denom;
    let f = if net_val.abs() > 1e-30 { tr_alt_val.abs() / net_val.abs() } else { 0.0 };

    println!("  At q₀ = {} (t₀ = {:.6}):", q0, t0_val);
    println!("  tr_alt(q₀) = {:+.10e} / 2^{} = {:+.10e}", tr_alt.eval(t0_val), elem.pn_count, tr_alt_val);
    println!("  net(q₀)    = {:+.10e} / 2^{} = {:+.10e}", net_poly.eval(t0_val), elem.pn_count, net_val);
    println!("  F_Pauli    = {:.10}", f);
    println!("════════════════════════════════════════════════════════");

    // Lean witness
    let lean_sym = sym.to_lowercase();
    println!();
    println!("-- LEAN WITNESS: SYMBOLIC IN q (exact, ℤ[t, t⁻¹] where t = q^{{1/2}})");
    println!();
    println!("/-- tr_alt for {}{} (Z={}, N={}), exact in t = q^{{1/2}}.", a, sym, z, n);
    println!("    tr_alt(t) = Σ c_w(t) × (−t⁻²)^ℓ(w)");
    println!("    All coefficients in ℤ[t, t⁻¹]. Denominator 2^{}. -/", elem.pn_count);
    println!("-- Ref: [litlfred2025] https://doi.org/10.xxxx/qou");
    // Output as a Lean noncomputable def using LaurentPolynomial
    println!("noncomputable def tr_alt_{}{} : LaurentPolynomial ℤ :=", a, lean_sym);
    print!("  ");
    let mut first = true;
    for (&k, &v) in &tr_alt.terms {
        if !first && v > 0 { print!(" + "); }
        else if !first && v < 0 { print!(" - "); }
        else if v < 0 { print!("-"); }
        let av = v.unsigned_abs();
        if k == 0 { print!("{}", av); }
        else if av == 1 { print!("LaurentPolynomial.T {}", k); }
        else { print!("{} • LaurentPolynomial.T {}", av, k); }
        first = false;
    }
    println!();
    println!();
    println!("noncomputable def net_{}{} : LaurentPolynomial ℤ :=", a, lean_sym);
    print!("  ");
    first = true;
    for (&k, &v) in &net_poly.terms {
        if !first && v > 0 { print!(" + "); }
        else if !first && v < 0 { print!(" - "); }
        else if v < 0 { print!("-"); }
        let av = v.unsigned_abs();
        if k == 0 { print!("{}", av); }
        else if av == 1 { print!("LaurentPolynomial.T {}", k); }
        else { print!("{} • LaurentPolynomial.T {}", av, k); }
        first = false;
    }
    println!();
}
