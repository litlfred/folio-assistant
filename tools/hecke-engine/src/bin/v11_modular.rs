// v11: Minimal modular f_pauli engine.
// Direct port of v9's NF computation with u64 mod p coefficients.
// ONLY computes f_pauli = |tr_alt/net| — no full polynomial output.
// For A ≤ 12: exact (coefficients fit in u64).
// For A > 12: use multiple primes + CRT.

use rustc_hash::FxHashMap;
use std::time::Instant;

// Mersenne prime 2^127 - 1. a+b ≤ 2*(P-1) < 2^128, fits in u128.
const P: u128 = 170_141_183_460_469_231_731_687_303_715_884_105_727;

fn ma(a: u128, b: u128) -> u128 {
    let s = a.wrapping_add(b);
    if s >= P || s < a { s.wrapping_sub(P) } else { s }
}
fn ms(a: u128, b: u128) -> u128 { if a >= b { a - b } else { P - b + a } }
fn reduce(x: u128) -> u128 {
    // Fast Mersenne reduction: x mod (2^127 - 1)
    let r = (x >> 127) + (x & P);
    if r >= P { r - P } else { r }
}

fn mm(a: u128, b: u128) -> u128 {
    // Fast u128 × u128 mod P for Mersenne prime P = 2^127 - 1.
    // Uses 4 u64×u64→u128 multiplications instead of 128 doublings.
    // Key: 2^128 ≡ 2 (mod P), 2^127 ≡ 1 (mod P).
    let a = a % P;
    let b = b % P;
    let a0 = a & 0xFFFF_FFFF_FFFF_FFFF;   // lower 64 bits
    let a1 = a >> 64;                        // upper 63 bits (< 2^63)
    let b0 = b & 0xFFFF_FFFF_FFFF_FFFF;
    let b1 = b >> 64;

    // Four partial products (each u128)
    let p00 = a0 * b0;          // < 2^128
    let p01 = a0 * b1;          // < 2^127 (a0 < 2^64, b1 < 2^63)
    let p10 = a1 * b0;          // < 2^127
    let p11 = a1 * b1;          // < 2^126

    // Product = p00 + (p01 + p10) × 2^64 + p11 × 2^128
    // mod P: 2^128 ≡ 2, so p11 × 2^128 ≡ 2 × p11
    // For (p01 + p10) × 2^64: split into high/low parts

    // Step 1: p00 mod P
    let mut r = reduce(p00);

    // Step 2: (p01 + p10) × 2^64 mod P
    let mid = ma(reduce(p01), reduce(p10)); // < P
    // mid × 2^64 = mid_hi × 2^128 + mid_lo × 2^64
    // ≡ 2 × mid_hi + mid_lo × 2^64 (mod P)
    let mid_hi = mid >> 64;                 // < 2^63
    let mid_lo = mid & 0xFFFF_FFFF_FFFF_FFFF; // < 2^64
    r = ma(r, reduce(mid_hi << 1));         // + 2 × mid_hi
    r = ma(r, reduce(mid_lo << 64));        // + mid_lo × 2^64

    // Step 3: 2 × p11 mod P (p11 < 2^126, so 2×p11 < 2^127 < 2P)
    r = ma(r, reduce(p11 << 1));

    r
}

// Laurent polynomial mod P — dense array representation.
// Stores coefficients for degrees [min_deg, min_deg + len).
// ~16 bytes per term vs ~80 for BTreeMap, enabling 216k+ words in <1GB.
#[derive(Clone)]
struct L { min_deg: i32, c: Vec<u128> }
impl L {
    fn zero() -> Self { Self { min_deg: 0, c: Vec::new() } }
    fn one() -> Self { Self { min_deg: 0, c: vec![1u128] } }
    fn is_zero(&self) -> bool { self.c.iter().all(|&v| v == 0) }
    fn trim(&mut self) {
        while self.c.last() == Some(&0) { self.c.pop(); }
        while self.c.first() == Some(&0) && !self.c.is_empty() {
            self.c.remove(0); self.min_deg += 1;
        }
    }
    fn get(&self, deg: i32) -> u128 {
        let idx = deg - self.min_deg;
        if idx < 0 || idx as usize >= self.c.len() { 0 } else { self.c[idx as usize] }
    }
    fn set(&mut self, deg: i32, val: u128) {
        if self.c.is_empty() {
            if val == 0 { return; }
            self.min_deg = deg; self.c.push(val); return;
        }
        let idx = deg - self.min_deg;
        if idx < 0 {
            let prepend = (-idx) as usize;
            let mut new_c = vec![0u128; prepend];
            new_c.extend_from_slice(&self.c);
            self.c = new_c;
            self.min_deg = deg;
            self.c[0] = val;
        } else if (idx as usize) >= self.c.len() {
            self.c.resize(idx as usize + 1, 0);
            self.c[idx as usize] = val;
        } else {
            self.c[idx as usize] = val;
        }
    }
    fn add(&self, o: &L) -> L {
        if self.c.is_empty() { return o.clone(); }
        if o.c.is_empty() { return self.clone(); }
        let lo = self.min_deg.min(o.min_deg);
        let hi_s = self.min_deg + self.c.len() as i32;
        let hi_o = o.min_deg + o.c.len() as i32;
        let hi = hi_s.max(hi_o);
        let len = (hi - lo) as usize;
        let mut c = vec![0u128; len];
        for i in 0..self.c.len() {
            c[(self.min_deg - lo) as usize + i] = self.c[i];
        }
        for i in 0..o.c.len() {
            let j = (o.min_deg - lo) as usize + i;
            c[j] = ma(c[j], o.c[i]);
        }
        let mut r = L { min_deg: lo, c };
        r.trim();
        r
    }
    fn mul(&self, o: &L) -> L {
        if self.c.is_empty() || o.c.is_empty() { return L::zero(); }
        let lo = self.min_deg + o.min_deg;
        let len = self.c.len() + o.c.len() - 1;
        let mut c = vec![0u128; len];
        for (i, &a) in self.c.iter().enumerate() {
            if a == 0 { continue; }
            for (j, &b) in o.c.iter().enumerate() {
                if b == 0 { continue; }
                c[i + j] = ma(c[i + j], mm(a, b));
            }
        }
        let mut r = L { min_deg: lo, c };
        r.trim();
        r
    }
    fn eval_f64(&self, t: f64) -> f64 {
        let hp = P / 2;
        let mut sum = 0.0_f64;
        for (i, &v) in self.c.iter().enumerate() {
            if v == 0 { continue; }
            let deg = self.min_deg + i as i32;
            let coeff = if v > hp { -((P - v) as f64) } else { v as f64 };
            sum += coeff * t.powi(deg);
        }
        sum
    }
    fn scale_sign(&self, neg: bool) -> L {
        if !neg { return self.clone(); }
        let c: Vec<u128> = self.c.iter().map(|&v| ms(0, v)).collect();
        L { min_deg: self.min_deg, c }
    }
    fn shift(&self, s: i32) -> L {
        L { min_deg: self.min_deg + s, c: self.c.clone() }
    }
}

// Word: same as v9 (u128 packed, 4 words)
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
        let mut r = self;
        let i = (r.n - 1) as usize;
        r.set(i, 0);  // zero the byte for correct hash/eq
        r.n -= 1; r
    }
    fn junction(self) -> Option<(usize, u8)> {
        let n = self.len(); if n < 2 { return None; }
        let p = n - 2; let (a, b) = (self.get(p), self.get(p+1));
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

fn ha() -> L {
    // HA = t² - t⁻²
    let mut h = L::zero();
    h.set(2, 1u128);
    h.set(-2, P - 1);  // -1 mod P
    h
}

fn crossing(ti: u8, tj: u8) -> (L, L, bool) {
    match (ti, tj) {
        (b'p', b'p') => (L::one(), L::zero(), false),
        (b'n', b'n') => {
            // c = 1, d = -HA = -t² + t⁻²
            let mut d = L::zero();
            d.set(2, P - 1);  // -1
            d.set(-2, 1u128); // +1
            (L::one(), d, false)
        }
        _ => {
            // pn: doubled to stay integral. 2c = 2, 2d = -HA
            let mut c = L::zero();
            c.set(0, 2u128);
            let mut d = L::zero();
            d.set(2, P - 1);
            d.set(-2, 1u128);
            (c, d, true)
        }
    }
}

fn mul_reduce(terms: &mut FxHashMap<W, L>, gen: u8, c: &L, d: &L, h: &L) {
    let old: Vec<(W, L)> = terms.drain().collect();
    let mut stable: FxHashMap<W, L> = FxHashMap::default();
    let mut pending: Vec<(W, L)> = Vec::new();
    for (w, co) in old {
        if !d.is_zero() { let e = stable.entry(w).or_insert(L::zero()); *e = e.add(&co.mul(d)); }
        if !c.is_zero() { pending.push((w.push(gen), co.mul(c))); }
    }
    for _ in 0..500000 {
        let mut next: Vec<(W, L)> = Vec::new();
        let mut any = false;
        for (w, co) in pending {
            if co.is_zero() { continue; }
            let red = w.junction().or_else(|| w.find_red());
            if let Some((pos, rule)) = red {
                any = true;
                match rule {
                    0 => { let w1 = w.remove_at(pos+1); let w2 = w1.remove_at(pos);
                           next.push((w1, co.mul(h))); next.push((w2, co)); }
                    1 => { let mut ww = w; let (a,b) = (ww.get(pos), ww.get(pos+1));
                           ww.set(pos, b); ww.set(pos+1, a); next.push((ww, co)); }
                    2 => { let mut ww = w; let (a,b) = (ww.get(pos), ww.get(pos+1));
                           ww.set(pos, b); ww.set(pos+1, a); ww.set(pos+2, b);
                           next.push((ww, co)); }
                    _ => {}
                }
            } else { let e = stable.entry(w).or_insert(L::zero()); *e = e.add(&co); }
        }
        if !any { break; }
        let mut cons: FxHashMap<W, L> = FxHashMap::default();
        for (w, c) in next { if c.is_zero() { continue; }
            let e = cons.entry(w).or_insert(L::zero()); *e = e.add(&c); }
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

// Pauli accumulator: same formula as v9
fn accumulate(terms: &FxHashMap<W, L>) -> (L, L) {
    let mut tr_alt = L::zero();
    let mut net = L::zero();
    for (w, c) in terms {
        net = net.add(c);
        let wl = w.len() as i32;
        let neg = wl % 2 != 0;
        tr_alt = tr_alt.add(&c.scale_sign(neg).shift(-2 * wl));
    }
    (tr_alt, net)
}

fn strip(terms: &mut FxHashMap<W, L>) -> (L, L) {
    let mut alt = L::zero(); let mut net = L::zero();
    loop {
        let mut any = false;
        // I9: strip words whose prefix (drop_last) is also present, longest first
        let ml = terms.keys().map(|w| w.len()).max().unwrap_or(0);
        for tl in (2..=ml).rev() {
            let rm: Vec<W> = terms.keys()
                .filter(|w| w.len() == tl && !terms[*w].is_zero())
                .filter(|w| terms.get(&w.drop_last()).map_or(false, |c| !c.is_zero()))
                .cloned().collect();
            for w in &rm {
                if let Some(c) = terms.remove(w) {
                    let wl = w.len() as i32;
                    let neg = wl % 2 != 0;
                    alt = alt.add(&c.scale_sign(neg).shift(-2 * wl));
                    net = net.add(&c);
                    any = true;
                }
            }
        }
        // I8: strip 2-letter words [i, i+1] where single-letter [i+1] is present
        let adj: Vec<W> = terms.keys()
            .filter(|w| w.len() == 2 && !terms[*w].is_zero() && w.get(1) == w.get(0) + 1)
            .filter(|w| terms.get(&W::E.push(w.get(1))).map_or(false, |c| !c.is_zero()))
            .cloned().collect();
        for w in &adj {
            if let Some(c) = terms.remove(w) {
                let wl = w.len() as i32;
                let neg = wl % 2 != 0;
                alt = alt.add(&c.scale_sign(neg).shift(-2 * wl));
                net = net.add(&c);
                any = true;
            }
        }
        if !any { break; }
    }
    terms.retain(|_, c| !c.is_zero());
    (alt, net)
}

fn main() {
    let args: Vec<String> = std::env::args().collect();
    let z: usize = args.get(1).and_then(|s| s.parse().ok()).unwrap_or(2);
    let n: usize = args.get(2).and_then(|s| s.parse().ok()).unwrap_or(2);
    let a = z + n;
    let h = ha();
    let mut types = vec![b'p'; z]; types.extend(vec![b'n'; n]);
    let mut terms: FxHashMap<W, L> = FxHashMap::default();
    terms.insert(W::E, L::one());
    let mut pn: u32 = 0;
    let mut acc_alt = L::zero(); let mut acc_net = L::zero();
    let t0 = Instant::now();

    // Parse optional strip threshold (0 = no mid-stripping, default = 200000)
    let strip_threshold: usize = args.get(3).and_then(|s| s.parse().ok()).unwrap_or(200000);
    let no_strip = strip_threshold == 0;
    eprintln!("  A={} (Z={}, N={}), strip: {}",
        a, z, n, if no_strip { "NONE (exact)".to_string() } else { format!("threshold {}", strip_threshold) });

    for k in 1..a {
        for i in 0..k {
            let (c, d, dbl) = crossing(types[i], types[k]);
            if dbl { pn += 1; }
            mul_reduce(&mut terms, i as u8, &c, &d, &h);
            if !no_strip && terms.len() > strip_threshold {
                let (ta, tn) = strip(&mut terms);
                acc_alt = acc_alt.add(&ta); acc_net = acc_net.add(&tn);
                eprintln!("    ({},{}) stripped → {} words", i, k, terms.len());
            }
        }
        eprintln!("  strand {}/{}: {} words, {:.1}s", k, a-1, terms.len(), t0.elapsed().as_secs_f64());
    }
    // Final strip
    let (ta, tn) = strip(&mut terms);
    acc_alt = acc_alt.add(&ta); acc_net = acc_net.add(&tn);
    // Add remaining survivors
    let (ra, rn) = accumulate(&terms);
    acc_alt = acc_alt.add(&ra); acc_net = acc_net.add(&rn);

    let elapsed = t0.elapsed().as_secs_f64();
    let t_val = 1.10998_f64.sqrt();
    let div = 2.0_f64.powi(pn as i32);
    let alt_f = acc_alt.eval_f64(t_val) / div;
    let net_f = acc_net.eval_f64(t_val) / div;
    let fp = if net_f.abs() > 1e-30 { (alt_f / net_f).abs() } else { 0.0 };

    // L¹ norm: Σ|c_w(q₀)| — evaluate each word's coefficient and take absolute value
    let mut l1_norm: f64 = 0.0;
    for (_w, c) in &terms {
        l1_norm += c.eval_f64(t_val).abs();
    }
    l1_norm /= div;

    let sym = match z { 1=>"h",2=>"he",3=>"li",4=>"be",5=>"b",6=>"c",7=>"n",8=>"o",
        9=>"f",10=>"ne",11=>"na",12=>"mg",13=>"al",14=>"si",15=>"p",16=>"s",
        17=>"cl",18=>"ar",19=>"k",20=>"ca",_=>"?" };
    println!("f_pauli({}{}) = {:.10}", a, sym, fp);
    println!("  tr_alt = {:.10e}, net = {:.10e}", alt_f, net_f);
    println!("  l1_norm = {:.10e}", l1_norm);
    println!("  {} words, pn={}, {:.2}s", terms.len(), pn, elapsed);

    // Write minimal cert
    let cert = serde_json::json!({
        "isotope": {"z": z, "n": n, "a": a, "symbol": sym},
        "engine": {"name": "hecke-modular", "version": "0.11.0"},
        "f_pauli_f64": fp, "tr_alt_f64": alt_f, "net_f64": net_f, "l1_norm_f64": l1_norm,
        "elapsed_seconds": elapsed,
    });
    let fname = format!("certificate-{}{}.json", a, sym);
    std::fs::write(&fname, serde_json::to_string_pretty(&cert).unwrap()).unwrap();
    eprintln!("  Certificate: {}", fname);
}
