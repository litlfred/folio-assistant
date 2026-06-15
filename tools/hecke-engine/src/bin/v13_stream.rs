// v13: Streaming reduction engine — reduce DURING multiplication.
//
// Instead of: multiply ALL words, THEN reduce (peak = 2N words)
// Do:         multiply ONE word, immediately reduce, merge into stable
//             (peak = N + small buffer)
//
// This halves peak memory by avoiding the full doubled intermediate.
// Combined with in-place consolidation, enables exact NF for B-11+.
//
// Usage: hecke-stream Z N [ordering]

use rustc_hash::FxHashMap;
use std::time::Instant;

const P: u128 = 170_141_183_460_469_231_731_687_303_715_884_105_727;

fn ma(a: u128, b: u128) -> u128 {
    let s = a.wrapping_add(b);
    if s >= P || s < a { s.wrapping_sub(P) } else { s }
}
fn ms(a: u128, b: u128) -> u128 { if a >= b { a - b } else { P - b + a } }
fn reduce(x: u128) -> u128 {
    let r = (x >> 127) + (x & P);
    if r >= P { r - P } else { r }
}
fn mm(a: u128, b: u128) -> u128 {
    let a = a % P; let b = b % P;
    let a0 = a & 0xFFFF_FFFF_FFFF_FFFF; let a1 = a >> 64;
    let b0 = b & 0xFFFF_FFFF_FFFF_FFFF; let b1 = b >> 64;
    let p00 = a0*b0; let p01 = a0*b1; let p10 = a1*b0; let p11 = a1*b1;
    let mut r = reduce(p00);
    let mid = ma(reduce(p01), reduce(p10));
    r = ma(r, reduce((mid >> 64) << 1));
    r = ma(r, reduce((mid & 0xFFFF_FFFF_FFFF_FFFF) << 64));
    r = ma(r, reduce(p11 << 1));
    r
}

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
    fn set(&mut self, deg: i32, val: u128) {
        if self.c.is_empty() { if val == 0 { return; } self.min_deg = deg; self.c.push(val); return; }
        let idx = deg - self.min_deg;
        if idx < 0 {
            let n = (-idx) as usize;
            let mut nc = vec![0u128; n]; nc.extend_from_slice(&self.c);
            self.c = nc; self.min_deg = deg; self.c[0] = val;
        } else if (idx as usize) >= self.c.len() {
            self.c.resize(idx as usize + 1, 0); self.c[idx as usize] = val;
        } else { self.c[idx as usize] = val; }
    }
    fn add(&self, o: &L) -> L {
        if self.c.is_empty() { return o.clone(); }
        if o.c.is_empty() { return self.clone(); }
        let lo = self.min_deg.min(o.min_deg);
        let hi = (self.min_deg + self.c.len() as i32).max(o.min_deg + o.c.len() as i32);
        let mut c = vec![0u128; (hi-lo) as usize];
        for i in 0..self.c.len() { c[(self.min_deg-lo) as usize + i] = self.c[i]; }
        for i in 0..o.c.len() { let j = (o.min_deg-lo) as usize + i; c[j] = ma(c[j], o.c[i]); }
        let mut r = L { min_deg: lo, c }; r.trim(); r
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
                c[i+j] = ma(c[i+j], mm(a, b));
            }
        }
        let mut r = L { min_deg: lo, c }; r.trim(); r
    }
    fn eval_f64(&self, t: f64) -> f64 {
        let hp = P / 2;
        self.c.iter().enumerate().map(|(i, &v)| {
            if v == 0 { return 0.0; }
            let deg = self.min_deg + i as i32;
            let c = if v > hp { -((P-v) as f64) } else { v as f64 };
            c * t.powi(deg)
        }).sum()
    }
    fn scale_sign(&self, neg: bool) -> L {
        if !neg { return self.clone(); }
        L { min_deg: self.min_deg, c: self.c.iter().map(|&v| ms(0, v)).collect() }
    }
    fn shift(&self, s: i32) -> L { L { min_deg: self.min_deg + s, c: self.c.clone() } }
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
    fn word_str(&self) -> String {
        if self.len() == 0 { return "𝟏".to_string(); }
        (0..self.len()).map(|i| format!("σ{}", self.get(i))).collect::<Vec<_>>().join(".")
    }
}

fn ha() -> L { let mut h = L::zero(); h.set(2, 1u128); h.set(-2, P-1); h }

fn crossing(ti: u8, tj: u8) -> (L, L, bool) {
    let pair = if ti <= tj { (ti, tj) } else { (tj, ti) };
    match pair {
        (b'p', b'p') => (L::one(), L::zero(), false),
        (b'n', b'n') => { let mut d = L::zero(); d.set(2, P-1); d.set(-2, 1u128); (L::one(), d, false) }
        (b'n', b'p') | (b'p', b'n') => {
            let mut c = L::zero(); c.set(0, 2u128);
            let mut d = L::zero(); d.set(2, P-1); d.set(-2, 1u128);
            (c, d, true)
        }
        (b'e', b'p') | (b'p', b'e') => { let mut d = L::zero(); d.set(2, P-1); d.set(-2, 1u128); (L::one(), d, false) }
        (b'e', b'e') => (L::one(), L::zero(), false),
        (b'e', b'n') | (b'n', b'e') => (L::zero(), L::one(), false),
        _ => (L::zero(), L::one(), false),
    }
}

/// Leading-term-cancel mul_reduce: consolidate BEFORE reduction.
/// 1. Multiply all words (d-term to stable, c-term to pending)
/// 2. CONSOLIDATE pending by word → cancellations happen here
/// 3. Remove zeros (words that fully cancelled)
/// 4. THEN reduce remaining words
/// This eliminates words that cancel before any reduction work.
fn mul_reduce_stream(terms: &mut FxHashMap<W, L>, gen: u8, c: &L, d: &L, h: &L) {
    let old: Vec<(W, L)> = terms.drain().collect();
    let mut stable: FxHashMap<W, L> = FxHashMap::default();

    // Phase 1: multiply all words, consolidate into stable (d-terms) and pending (c-terms)
    let mut pending_map: FxHashMap<W, L> = FxHashMap::default();
    for (w, co) in &old {
        if !d.is_zero() {
            let e = stable.entry(*w).or_insert(L::zero());
            *e = e.add(&co.mul(d));
        }
        if !c.is_zero() {
            let new_w = w.push(gen);
            let e = pending_map.entry(new_w).or_insert(L::zero());
            *e = e.add(&co.mul(c));
        }
    }
    drop(old); // free memory immediately

    // Phase 2: leading term cancellation — remove zeros from pending
    pending_map.retain(|_, c| !c.is_zero());
    let n_before = pending_map.len();

    // Phase 3: reduce remaining words
    let mut pending: Vec<(W, L)> = pending_map.into_iter().collect();
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
        // Consolidate next → leading term cancellation at each iteration
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
        let ml = terms.keys().map(|w| w.len()).max().unwrap_or(0);
        for tl in (2..=ml).rev() {
            let rm: Vec<W> = terms.keys()
                .filter(|w| w.len() == tl && !terms[*w].is_zero())
                .filter(|w| terms.get(&w.drop_last()).map_or(false, |c| !c.is_zero()))
                .cloned().collect();
            for w in &rm {
                if let Some(c) = terms.remove(w) {
                    let wl = w.len() as i32; let neg = wl % 2 != 0;
                    alt = alt.add(&c.scale_sign(neg).shift(-2 * wl));
                    net = net.add(&c); any = true;
                }
            }
        }
        let adj: Vec<W> = terms.keys()
            .filter(|w| w.len() == 2 && !terms[*w].is_zero() && w.get(1) == w.get(0) + 1)
            .filter(|w| terms.get(&W::E.push(w.get(1))).map_or(false, |c| !c.is_zero()))
            .cloned().collect();
        for w in &adj {
            if let Some(c) = terms.remove(w) {
                let wl = w.len() as i32; let neg = wl % 2 != 0;
                alt = alt.add(&c.scale_sign(neg).shift(-2 * wl));
                net = net.add(&c); any = true;
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
    let types: Vec<u8> = if let Some(ord) = args.get(3) {
        ord.bytes().collect()
    } else {
        let mut t = vec![b'p'; z]; t.extend(vec![b'n'; n]); t
    };
    let total = types.len();
    let ordering_str: String = types.iter().map(|&t| t as char).collect();

    eprintln!("hecke-stream v13 — STREAMING reduction, exact NF");
    eprintln!("  ordering: {} ({} strands)", ordering_str, total);

    let h = ha();
    let mut terms: FxHashMap<W, L> = FxHashMap::default();
    terms.insert(W::E, L::one());
    let mut pn: u32 = 0;
    let t0 = Instant::now();

    for k in 1..total {
        for i in 0..k {
            let (c, d, dbl) = crossing(types[i], types[k]);
            if dbl { pn += 1; }
            if c.is_zero() && !d.is_zero() { continue; }
            mul_reduce_stream(&mut terms, i as u8, &c, &d, &h);
        }
        eprintln!("  strand {}/{}: {} words, {:.1}s",
            k, total-1, terms.len(), t0.elapsed().as_secs_f64());
    }

    let (ta, tn) = strip(&mut terms);
    let (ra, rn) = accumulate(&terms);
    let acc_alt = ta.add(&ra);
    let acc_net = tn.add(&rn);

    let elapsed = t0.elapsed().as_secs_f64();
    let t_val = 1.10998_f64.sqrt();
    let div = 2.0_f64.powi(pn as i32);
    let alt_f = acc_alt.eval_f64(t_val) / div;
    let net_f = acc_net.eval_f64(t_val) / div;
    let fp = if net_f.abs() > 1e-30 { (alt_f / net_f).abs() } else { 0.0 };

    println!("f_pauli = {:.10}", fp);
    println!("  tr_alt = {:.10e}, net = {:.10e}", alt_f, net_f);
    println!("  {} NF words, pn_dbl={}, {:.2}s", terms.len(), pn, elapsed);

    if terms.len() <= 50 {
        println!("\nNF words:");
        let mut sorted: Vec<_> = terms.iter().collect();
        sorted.sort_by_key(|(w, _)| { let mut k = vec![w.len() as i32]; for i in 0..w.len() { k.push(w.get(i) as i32); } k });
        for (w, _c) in &sorted { println!("  {}", w.word_str()); }
    }
}
