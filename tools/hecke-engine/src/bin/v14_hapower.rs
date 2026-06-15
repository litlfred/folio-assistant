// v14: HA-power ring engine for pp...nn ordering.
//
// All NF coefficients are sparse sums of c_i × HA^{k_i} where
// c_i are integers mod P and k_i are non-negative integers.
// HA = q - q⁻¹ = t² - t⁻² (Hecke parameter).
//
// Storage: Vec<(u128, u16)> per word = (coeff mod P, HA power)
// ~20 bytes per term, ~10 terms per word = ~200 bytes/word
// (similar to dense poly, but MERGE is O(#terms) not O(degree))
//
// Key operations:
//   mul_by_HA: shift all powers by +1
//   σ² reduction: split into HA·σ (power+1) and 1 (same power)
//   add: merge sorted (power, coeff) lists
//
// Restricted to pp...nn ordering (verified: produces pure HA^k finals)
//
// Usage: hecke-hapower Z N

use rustc_hash::FxHashMap;
use std::time::Instant;

const P: u128 = 170_141_183_460_469_231_731_687_303_715_884_105_727;

fn ma(a: u128, b: u128) -> u128 {
    let s = a.wrapping_add(b);
    if s >= P || s < a { s.wrapping_sub(P) } else { s }
}
fn ms(a: u128, b: u128) -> u128 { if a >= b { a - b } else { P - b + a } }
fn reduce_mod(x: u128) -> u128 {
    let r = (x >> 127) + (x & P);
    if r >= P { r - P } else { r }
}
fn mm(a: u128, b: u128) -> u128 {
    let a = a % P; let b = b % P;
    let a0 = a & 0xFFFF_FFFF_FFFF_FFFF; let a1 = a >> 64;
    let b0 = b & 0xFFFF_FFFF_FFFF_FFFF; let b1 = b >> 64;
    let p00 = a0*b0; let p01 = a0*b1; let p10 = a1*b0; let p11 = a1*b1;
    let mut r = reduce_mod(p00);
    let mid = ma(reduce_mod(p01), reduce_mod(p10));
    r = ma(r, reduce_mod((mid >> 64) << 1));
    r = ma(r, reduce_mod((mid & 0xFFFF_FFFF_FFFF_FFFF) << 64));
    r = ma(r, reduce_mod(p11 << 1));
    r
}

/// Sparse HA-power polynomial: Σ c_i × HA^{k_i}
/// Stored as sorted Vec<(k, c)> where k = HA power, c = coeff mod P.
#[derive(Clone)]
struct H { terms: Vec<(u16, u128)> } // (power, coeff)
impl H {
    fn zero() -> Self { H { terms: Vec::new() } }
    fn one() -> Self { H { terms: vec![(0, 1u128)] } }
    fn from_ha_power(k: u16, c: u128) -> Self {
        if c == 0 { return Self::zero(); }
        H { terms: vec![(k, c)] }
    }
    fn is_zero(&self) -> bool { self.terms.is_empty() }

    fn add(&self, o: &H) -> H {
        if self.terms.is_empty() { return o.clone(); }
        if o.terms.is_empty() { return self.clone(); }
        let mut result: Vec<(u16, u128)> = Vec::with_capacity(self.terms.len() + o.terms.len());
        let (mut i, mut j) = (0, 0);
        while i < self.terms.len() && j < o.terms.len() {
            let (ka, ca) = self.terms[i];
            let (kb, cb) = o.terms[j];
            if ka == kb {
                let s = ma(ca, cb);
                if s != 0 { result.push((ka, s)); }
                i += 1; j += 1;
            } else if ka < kb {
                result.push((ka, ca)); i += 1;
            } else {
                result.push((kb, cb)); j += 1;
            }
        }
        while i < self.terms.len() { result.push(self.terms[i]); i += 1; }
        while j < o.terms.len() { result.push(o.terms[j]); j += 1; }
        H { terms: result }
    }

    fn mul_scalar(&self, c: u128) -> H {
        if c == 0 { return H::zero(); }
        if c == 1 { return self.clone(); }
        let terms: Vec<(u16, u128)> = self.terms.iter()
            .map(|&(k, v)| (k, mm(v, c)))
            .filter(|&(_, v)| v != 0)
            .collect();
        H { terms }
    }

    fn mul_ha(&self) -> H {
        // Multiply by HA: shift all powers by +1
        let terms: Vec<(u16, u128)> = self.terms.iter()
            .map(|&(k, c)| (k + 1, c))
            .collect();
        H { terms }
    }

    fn negate(&self) -> H {
        let terms: Vec<(u16, u128)> = self.terms.iter()
            .map(|&(k, c)| (k, ms(0, c)))
            .collect();
        H { terms }
    }

    fn scale_sign(&self, neg: bool) -> H {
        if !neg { self.clone() } else { self.negate() }
    }

    fn mul(&self, o: &H) -> H {
        // HA^a × HA^b = HA^{a+b}
        // (Σ c_i HA^{k_i}) × (Σ d_j HA^{l_j}) = Σ c_i d_j HA^{k_i+l_j}
        if self.terms.is_empty() || o.terms.is_empty() { return H::zero(); }
        let mut map: FxHashMap<u16, u128> = FxHashMap::default();
        for &(ka, ca) in &self.terms {
            for &(kb, cb) in &o.terms {
                let k = ka + kb;
                let v = mm(ca, cb);
                let e = map.entry(k).or_insert(0u128);
                *e = ma(*e, v);
            }
        }
        let mut terms: Vec<(u16, u128)> = map.into_iter()
            .filter(|&(_, v)| v != 0)
            .collect();
        terms.sort_by_key(|&(k, _)| k);
        H { terms }
    }

    fn eval_f64(&self, ha_val: f64) -> f64 {
        let hp = P / 2;
        self.terms.iter().map(|&(k, v)| {
            let c = if v > hp { -((P - v) as f64) } else { v as f64 };
            c * ha_val.powi(k as i32)
        }).sum()
    }

    fn n_terms(&self) -> usize { self.terms.len() }
}

#[derive(Clone, Copy, PartialEq, Eq, Hash)]
struct W { d: [u128; 4], n: u8 }
impl W {
    const E: W = W { d: [0; 4], n: 0 };
    fn len(self) -> usize { self.n as usize }
    fn get(self, i: usize) -> u8 { ((self.d[i/16] >> ((i%16)*8)) & 0xFF) as u8 }
    fn set(&mut self, i: usize, v: u8) {
        self.d[i/16] &= !(0xFF << ((i%16)*8));
        self.d[i/16] |= (v as u128) << ((i%16)*8);
    }
    fn push(mut self, v: u8) -> W {
        if self.n >= 64 { return self; }
        let i = self.n as usize; self.set(i, v); self.n += 1; self
    }
    fn remove_at(self, pos: usize) -> W {
        let mut r = W::E;
        for i in 0..self.len() { if i != pos { r = r.push(self.get(i)); } }
        r
    }
    fn drop_last(self) -> W {
        let mut r = self; let i = (r.n-1) as usize; r.set(i, 0); r.n -= 1; r
    }
    fn junction(self) -> Option<(usize, u8)> {
        let n = self.len(); if n < 2 { return None; }
        let p = n-2; let (a, b) = (self.get(p), self.get(p+1));
        if a == b { return Some((p, 0)); }
        if n >= 3 { let c = self.get(p-1);
            if c == b && (a as i8 - c as i8).unsigned_abs() == 1 && a < c { return Some((p-1, 2)); } }
        if (a as i8 - b as i8).unsigned_abs() >= 2 && a > b { return Some((p, 1)); }
        None
    }
    fn find_red(self) -> Option<(usize, u8)> {
        let n = self.len();
        for p in 0..n.saturating_sub(1) {
            let (a, b) = (self.get(p), self.get(p+1));
            if a == b { return Some((p, 0)); }
            if p+2 < n { let c = self.get(p+2);
                if a == c && (a as i8 - b as i8).unsigned_abs() == 1 {
                    if (b,a,b) < (a,b,a) { return Some((p, 2)); } } }
            if (a as i8 - b as i8).unsigned_abs() >= 2 && a > b { return Some((p, 1)); }
        }
        None
    }
}

/// Crossing coefficients as HA-power polynomials.
/// pp: c = 1 (HA^0), d = 0
/// nn: c = 1 (HA^0), d = -HA^1
/// pn: c = 2 (2×HA^0), d = -HA^1 (doubled → pn_count tracks this)
fn crossing_ha(ti: u8, tj: u8) -> (H, H, bool) {
    match (ti, tj) {
        (b'p', b'p') => (H::one(), H::zero(), false),
        (b'n', b'n') => (H::one(), H::from_ha_power(1, P - 1), false), // d = -HA
        _ => { // pn
            let c = H::from_ha_power(0, 2u128); // c = 2
            let d = H::from_ha_power(1, P - 1);  // d = -HA
            (c, d, true)
        }
    }
}

fn mul_reduce_ha(terms: &mut FxHashMap<W, H>, gen: u8, c: &H, d: &H, ha: &H) {
    let old: Vec<(W, H)> = terms.drain().collect();
    let mut stable: FxHashMap<W, H> = FxHashMap::default();
    let mut pending: Vec<(W, H)> = Vec::new();

    // Phase 1: multiply
    for (w, co) in old {
        if !d.is_zero() {
            let term = co.mul(d);
            let e = stable.entry(w).or_insert(H::zero());
            *e = e.add(&term);
        }
        if !c.is_zero() {
            pending.push((w.push(gen), co.mul(c)));
        }
    }

    // Phase 2: consolidate pending (leading-term cancellation)
    let mut pmap: FxHashMap<W, H> = FxHashMap::default();
    for (w, co) in pending {
        let e = pmap.entry(w).or_insert(H::zero());
        *e = e.add(&co);
    }
    pmap.retain(|_, c| !c.is_zero());
    let mut pending: Vec<(W, H)> = pmap.into_iter().collect();

    // Phase 3: reduce
    for _ in 0..500000 {
        let mut next: Vec<(W, H)> = Vec::new();
        let mut any = false;
        for (w, co) in pending {
            if co.is_zero() { continue; }
            let red = w.junction().or_else(|| w.find_red());
            if let Some((pos, rule)) = red {
                any = true;
                match rule {
                    0 => {
                        let w1 = w.remove_at(pos+1);
                        let w2 = w1.remove_at(pos);
                        // σ² → HA·σ + 1: coeff splits into co×HA (for σ) and co (for 1)
                        next.push((w1, co.mul_ha())); // co × HA
                        next.push((w2, co));           // co × 1
                    }
                    1 => { let mut ww = w; let (a,b) = (ww.get(pos), ww.get(pos+1));
                           ww.set(pos, b); ww.set(pos+1, a); next.push((ww, co)); }
                    2 => { let mut ww = w; let (a,b) = (ww.get(pos), ww.get(pos+1));
                           ww.set(pos, b); ww.set(pos+1, a); ww.set(pos+2, b);
                           next.push((ww, co)); }
                    _ => {}
                }
            } else {
                let e = stable.entry(w).or_insert(H::zero());
                *e = e.add(&co);
            }
        }
        if !any { break; }
        let mut cons: FxHashMap<W, H> = FxHashMap::default();
        for (w, c) in next { if c.is_zero() { continue; }
            let e = cons.entry(w).or_insert(H::zero()); *e = e.add(&c); }
        pending = Vec::new();
        for (w, c) in cons { if c.is_zero() { continue; }
            if let Some(ex) = stable.remove(&w) {
                let m = ex.add(&c);
                if !m.is_zero() && w.find_red().is_some() { pending.push((w, m)); }
                else if !m.is_zero() { stable.insert(w, m); }
            } else { pending.push((w, c)); } }
    }
    stable.retain(|_, c| !c.is_zero());
    *terms = stable;
}

fn main() {
    let args: Vec<String> = std::env::args().collect();
    let z: usize = args.get(1).and_then(|s| s.parse().ok()).unwrap_or(2);
    let n: usize = args.get(2).and_then(|s| s.parse().ok()).unwrap_or(2);
    let a = z + n;

    // pp...nn ordering (required for HA-power ring)
    let mut types = vec![b'p'; z]; types.extend(vec![b'n'; n]);
    let ordering_str: String = types.iter().map(|&t| t as char).collect();

    eprintln!("hecke-hapower v14 — HA-power ring, pp...nn ordering");
    eprintln!("  A={} (Z={}, N={}), ordering: {}", a, z, n, ordering_str);

    let ha = H::from_ha_power(1, 1u128); // HA = 1×HA^1
    let mut terms: FxHashMap<W, H> = FxHashMap::default();
    terms.insert(W::E, H::one());
    let mut pn_count: u32 = 0;
    let t0 = Instant::now();

    for k in 1..a {
        for i in 0..k {
            let (c, d, dbl) = crossing_ha(types[i], types[k]);
            if dbl { pn_count += 1; }
            mul_reduce_ha(&mut terms, i as u8, &c, &d, &ha);
        }
        // Memory stats
        let total_terms: usize = terms.values().map(|h| h.n_terms()).sum();
        let avg_terms = if terms.len() > 0 { total_terms as f64 / terms.len() as f64 } else { 0.0 };
        let mem_kb = (terms.len() * (33 + 8) + total_terms * 18) / 1024; // rough
        eprintln!("  strand {}/{}: {} words, {:.1} terms/word, ~{}KB, {:.1}s",
            k, a-1, terms.len(), avg_terms, mem_kb, t0.elapsed().as_secs_f64());
    }

    // Evaluate F_Pauli
    let q0: f64 = 1.10998;
    let ha_val = q0 - 1.0/q0;
    let div = 2.0_f64.powi(pn_count as i32);

    let mut tr_alt_val = 0.0_f64;
    let mut net_val = 0.0_f64;
    for (w, h) in &terms {
        let c_val = h.eval_f64(ha_val);
        net_val += c_val;
        let wl = w.len() as i32;
        let sign = if wl % 2 != 0 { -1.0 } else { 1.0 };
        // For HA-power eval: need t^{-2ℓ} factor
        let t = q0.sqrt();
        tr_alt_val += sign * c_val * t.powi(-2 * wl);
    }
    tr_alt_val /= div;
    net_val /= div;
    let fp = if net_val.abs() > 1e-30 { (tr_alt_val / net_val).abs() } else { 0.0 };

    // Strip + accumulate
    let elapsed = t0.elapsed().as_secs_f64();
    println!("f_pauli = {:.10}", fp);
    println!("  tr_alt = {:.10e}, net = {:.10e}", tr_alt_val, net_val);
    println!("  {} NF words, pn_dbl={}, {:.2}s", terms.len(), pn_count, elapsed);
}
