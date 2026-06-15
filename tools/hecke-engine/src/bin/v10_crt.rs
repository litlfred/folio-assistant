// v10: Single-prime modular engine with sorted reduction tree.
//
// ONE prime, u64 arithmetic. No CRT, no consistency issues.
// BTreeMap<Word, u64> sorted by LenLex for efficient reduction.
//
// f_pauli computed by evaluating tr_alt(q₀)/net(q₀) mod p,
// splitting even/odd powers to avoid needing √q mod p.
//
// Usage:
//   hecke-crt Z N [threshold]

use rustc_hash::FxHashMap;
use std::collections::BTreeMap;
use std::time::Instant;

// Prime for modular arithmetic. For A > 12, use multiple primes
// via the --prime flag and reconstruct via CRT externally.
const P: u64 = 1_000_000_007;

type C = u64; // coefficient type

fn ma(a: C, b: C) -> C { ((a as u128 + b as u128) % P as u128) as C }
fn ms(a: C, b: C) -> C { if a >= b { a - b } else { (P as C) - b + a } }
fn mm(a: C, b: C) -> C { ((a as u128 * b as u128) % P as u128) as C }
fn mi(a: C) -> C {
    let mut r: C = 1; let mut base = a; let mut e = P - 2;
    while e > 0 { if e & 1 == 1 { r = mm(r, base); } e >>= 1; base = mm(base, base); }
    r
}

// ════════════════════════════════════════════════════════════════
// Laurent polynomial mod P — coefficients are single u64
// ════════════════════════════════════════════════════════════════

#[derive(Clone)]
struct LP { t: BTreeMap<i32, u64> }
impl LP {
    fn zero() -> Self { Self { t: BTreeMap::new() } }
    fn one() -> Self { let mut m = Self::zero(); m.t.insert(0, 1); m }
    fn is_zero(&self) -> bool { self.t.is_empty() }
    fn n(&self) -> usize { self.t.len() }

    fn add(&self, o: &LP) -> LP {
        let mut r = self.t.clone();
        for (k, v) in &o.t {
            let e = r.entry(*k).or_insert(0);
            *e = ma(*e, *v);
            if *e == 0 { r.remove(k); }
        }
        LP { t: r }
    }
    fn sub(&self, o: &LP) -> LP {
        let mut r = self.t.clone();
        for (k, v) in &o.t {
            let e = r.entry(*k).or_insert(0);
            *e = ms(*e, *v);
            if *e == 0 { r.remove(k); }
        }
        LP { t: r }
    }
    fn mul(&self, o: &LP) -> LP {
        let mut r: BTreeMap<i32, u64> = BTreeMap::new();
        for (k1, v1) in &self.t {
            for (k2, v2) in &o.t {
                let k = k1 + k2;
                let val = mm(*v1, *v2);
                let e = r.entry(k).or_insert(0);
                *e = ma(*e, val);
                if *e == 0 { r.remove(&k); }
            }
        }
        LP { t: r }
    }
    fn neg(&self) -> LP {
        let mut r = BTreeMap::new();
        for (k, v) in &self.t { r.insert(*k, ms(0, *v)); }
        LP { t: r }
    }

    // Evaluate at q₀ = 111/100 via even/odd power split.
    // P(t) = P_even(q) + √q · P_odd(q)
    // where q = t², so t^{2k} = q^k, t^{2k+1} = q^k · t
    // We evaluate P_even(q) and P_odd(q) separately mod P,
    // then combine as floats.
    fn eval_split(&self) -> (u64, u64) {
        // q_mod = 111 * inv(100) mod P
        let q_mod = mm(111, mi(100));
        let mut even_val: u64 = 0;  // Σ c_{2k} q^k mod P
        let mut odd_val: u64 = 0;   // Σ c_{2k+1} q^k mod P
        for (&power, &coeff) in &self.t {
            if power >= 0 {
                let k = power / 2;
                let qk = {
                    let mut r = 1u64; let mut b = q_mod; let mut e = k as u64;
                    while e > 0 { if e & 1 == 1 { r = mm(r, b); } e >>= 1; b = mm(b, b); }
                    r
                };
                let term = mm(coeff, qk);
                if power % 2 == 0 { even_val = ma(even_val, term); }
                else { odd_val = ma(odd_val, term); }
            } else {
                // Negative power: t^{-n} = q^{-n/2} or q^{-(n-1)/2} / t
                let abs_p = (-power) as u64;
                let k = abs_p / 2;
                let qi_mod = mi(q_mod);
                let qk = {
                    let mut r = 1u64; let mut b = qi_mod; let mut e = k;
                    while e > 0 { if e & 1 == 1 { r = mm(r, b); } e >>= 1; b = mm(b, b); }
                    r
                };
                let term = mm(coeff, qk);
                if abs_p % 2 == 0 { even_val = ma(even_val, term); }
                else { odd_val = ma(odd_val, term); }
            }
        }
        (even_val, odd_val)
    }
}

// ════════════════════════════════════════════════════════════════
// Word representation
// ════════════════════════════════════════════════════════════════

#[derive(Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
struct W { len: u8, data: [u8; 63] }
impl W {
    const E: W = W { len: 0, data: [0; 63] };
    fn len(self) -> usize { self.len as usize }
    fn get(self, i: usize) -> u8 { self.data[i] }
    fn set(&mut self, i: usize, v: u8) { self.data[i] = v; }
    fn push(mut self, v: u8) -> W {
        let i = self.len as usize;
        if i >= 63 { return self; }
        self.data[i] = v; self.len += 1; self
    }
    fn remove_at(self, pos: usize) -> W {
        let mut r = W::E;
        for i in 0..self.len() { if i != pos { r = r.push(self.get(i)); } }
        r
    }
    fn drop_last(self) -> W {
        let mut r = self;
        r.data[(r.len - 1) as usize] = 0;
        r.len -= 1;
        r
    }

    fn find_red(self) -> Option<(usize, u8)> {
        let n = self.len();
        for p in 0..n.saturating_sub(1) {
            let a = self.get(p); let b = self.get(p+1);
            if a == b { return Some((p, 0)); }
            if p+2 < n {
                let c = self.get(p+2);
                if a == c && (a as i8 - b as i8).unsigned_abs() == 1 {
                    if (b,a,b) < (a,b,a) { return Some((p, 2)); }
                }
            }
            if (a as i8 - b as i8).unsigned_abs() >= 2 && a > b { return Some((p, 1)); }
        }
        None
    }
    fn junction(self) -> Option<(usize, u8)> {
        let n = self.len();
        if n < 2 { return None; }
        let p = n - 2;
        let (a, b) = (self.get(p), self.get(p+1));
        if a == b { return Some((p, 0)); }
        if n >= 3 {
            let c = self.get(p-1);
            if c == b && (a as i8 - c as i8).unsigned_abs() == 1 { return Some((p-1, 2)); }
        }
        if (a as i8 - b as i8).unsigned_abs() >= 2 && a > b { return Some((p, 1)); }
        None
    }
}

// ════════════════════════════════════════════════════════════════
// Hecke engine — sorted BTreeMap for ordered reduction
// ════════════════════════════════════════════════════════════════

fn ha() -> LP { let mut h = LP::zero(); h.t.insert(2, 1); h.t.insert(-2, P-1); h }

fn cx(ti: u8, tj: u8) -> (LP, LP, bool) {
    let h = ha();
    match (ti, tj) {
        (b'p', b'p') => (LP::one(), LP::zero(), false),
        (b'n', b'n') => (LP::one(), h.neg(), false),
        _ => { let mut c = LP::zero(); c.t.insert(0, 2); (c, h.neg(), true) }
    }
}

// Use BTreeMap<W, LP> — sorted by word (LenLex via derived Ord)
// This keeps the tree ordered: shortest words first, lex within length.
type Tree = BTreeMap<W, LP>;

fn mul_reduce(tree: &mut Tree, gen: u8, c: &LP, d: &LP, h: &LP) {
    let old: Vec<(W, LP)> = tree.iter().map(|(w,l)| (*w, l.clone())).collect();
    tree.clear();
    let mut pending: Vec<(W, LP)> = Vec::new();

    for (w, coeff) in old {
        if !d.is_zero() {
            let e = tree.entry(w).or_insert(LP::zero());
            *e = e.add(&coeff.mul(d));
        }
        if !c.is_zero() { pending.push((w.push(gen), coeff.mul(c))); }
    }

    for _ in 0..500000 {
        let mut next: Vec<(W, LP)> = Vec::new();
        let mut any = false;
        for (w, co) in pending {
            if co.is_zero() { continue; }
            let red = w.junction().or_else(|| w.find_red());
            if let Some((pos, rule)) = red {
                any = true;
                match rule {
                    0 => {
                        let w1 = w.remove_at(pos+1); let w2 = w1.remove_at(pos);
                        next.push((w1, co.mul(h))); next.push((w2, co));
                    }
                    1 => {
                        let mut ww = w;
                        let (a,b) = (ww.get(pos), ww.get(pos+1));
                        ww.set(pos, b); ww.set(pos+1, a);
                        next.push((ww, co));
                    }
                    2 => {
                        let mut ww = w;
                        let (a,b) = (ww.get(pos), ww.get(pos+1));
                        ww.set(pos, b); ww.set(pos+1, a); ww.set(pos+2, b);
                        next.push((ww, co));
                    }
                    _ => {}
                }
            } else {
                let e = tree.entry(w).or_insert(LP::zero());
                *e = e.add(&co);
            }
        }
        if !any { break; }
        // Consolidate
        let mut cons: BTreeMap<W, LP> = BTreeMap::new();
        for (w, c) in next {
            if c.is_zero() { continue; }
            let e = cons.entry(w).or_insert(LP::zero());
            *e = e.add(&c);
        }
        pending = Vec::new();
        for (w, c) in cons {
            if c.is_zero() { continue; }
            if let Some(ex) = tree.remove(&w) {
                let m = ex.add(&c);
                if !m.is_zero() && w.find_red().is_some() { pending.push((w, m)); }
                else if !m.is_zero() { tree.insert(w, m); }
            } else { pending.push((w, c)); }
        }
    }
    tree.retain(|_, c| !c.is_zero());
}

fn strip_tree(tree: &mut Tree) -> (LP, LP) {
    let mut alt = LP::zero();
    let mut net = LP::zero();
    for _ in 0..500 {
        let mut any = false;
        // Strip longest words whose prefix exists (tree is sorted, iterate in reverse)
        let words: Vec<W> = tree.keys().rev().cloned().collect();
        for w in &words {
            if w.len() < 2 { continue; }
            if tree.get(w).map_or(true, |c| c.is_zero()) { continue; }
            let prefix = w.drop_last();
            if tree.get(&prefix).map_or(true, |c| c.is_zero()) { continue; }
            if let Some(c) = tree.remove(w) {
                // Alternating character: (-1)^ℓ × t^{-2ℓ} × coeff
                let wl = w.len() as i32;
                let shifted = LP { t: c.t.iter().map(|(k,v)| (k - 2*wl, *v)).collect() };
                if wl % 2 == 0 { alt = alt.add(&shifted); }
                else { alt = alt.sub(&shifted); }
                net = net.add(&c);
                any = true;
            }
        }
        if !any { break; }
    }
    tree.retain(|_, c| !c.is_zero());
    (alt, net)
}

// ════════════════════════════════════════════════════════════════
// Build + evaluate
// ════════════════════════════════════════════════════════════════

fn build_and_eval(z: usize, n: usize, threshold: usize) -> (f64, f64, f64, f64) {
    let a = z + n;
    let h = ha();
    let mut types = vec![b'p'; z];
    types.extend(vec![b'n'; n]);
    let mut tree: Tree = BTreeMap::new();
    tree.insert(W::E, LP::one());
    let mut pn_count = 0u32;
    let mut acc_alt = LP::zero();
    let mut acc_net = LP::zero();
    let strip_from = 999usize; // NO stripping — compute full NF

    for k in 1..a {
        for i in 0..k {
            let (c, d, dbl) = cx(types[i], types[k]);
            if dbl { pn_count += 1; }
            mul_reduce(&mut tree, i as u8, &c, &d, &h);
            if a > 16 || (k >= strip_from && tree.len() > threshold) {
                let (ta, tn) = strip_tree(&mut tree);
                acc_alt = acc_alt.add(&ta); acc_net = acc_net.add(&tn);
            }
        }
        if k + 1 > strip_from {
            let (ta, tn) = strip_tree(&mut tree);
            acc_alt = acc_alt.add(&ta); acc_net = acc_net.add(&tn);
        }
        eprintln!("  strand {}/{}: {} words, {} alt terms", k, a-1, tree.len(), acc_alt.n());
    }

    // Dump PRE-strip NF
    {
        let hp = P / 2;
        eprintln!("  PRE-STRIP NF ({} words):", tree.len());
        for (w, c) in &tree {
            let ws: String = (0..w.len()).map(|i| format!("σ{}", w.get(i))).collect::<Vec<_>>().join("·");
            let ws = if ws.is_empty() { "𝟙".to_string() } else { ws };
            let terms: Vec<String> = c.t.iter().map(|(&k, &v)| {
                let cv = if v > hp { -((P-v) as i64) } else { v as i64 };
                format!("{}·t^{}", cv, k)
            }).collect();
            eprintln!("    {} = {}", ws, terms.join(" + "));
        }
    }
    // Final strip with logging
    {
        let hp = P / 2;
        for _ in 0..500 {
            let mut any = false;
            let words: Vec<W> = tree.keys().rev().cloned().collect();
            for w in &words {
                if w.len() < 2 { continue; }
                if tree.get(w).map_or(true, |c| c.is_zero()) { continue; }
                let prefix = w.drop_last();
                if tree.get(&prefix).map_or(true, |c| c.is_zero()) { continue; }
                if let Some(c) = tree.remove(w) {
                    let wl = w.len() as i32;
                    let ws: String = (0..w.len()).map(|i| format!("σ{}", w.get(i))).collect::<Vec<_>>().join("·");
                    let shifted = LP { t: c.t.iter().map(|(k,v)| (k - 2*wl, *v)).collect() };
                    if wl % 2 == 0 { acc_alt = acc_alt.add(&shifted); }
                    else { acc_alt = acc_alt.sub(&shifted); }
                    acc_net = acc_net.add(&c);
                    eprintln!("    STRIP {} (len={}): {} coeff terms, shift={}", ws, wl, c.n(), -2*wl);
                    any = true;
                }
            }
            if !any { break; }
        }
    }

    eprintln!("  After final strip: {} words", tree.len());
    for (w, c) in &tree {
        let ws: String = (0..w.len()).map(|i| format!("σ{}", w.get(i))).collect::<Vec<_>>().join("·");
        let ws = if ws.is_empty() { "𝟙".to_string() } else { ws };
        eprintln!("    {} : {} terms", ws, c.n());
    }

    // Accumulate remaining (unstrippable) words
    for (w, c) in &tree {
        let wl = w.len() as i32;
        let shifted = LP { t: c.t.iter().map(|(k,v)| (k - 2*wl, *v)).collect() };
        if wl % 2 == 0 { acc_alt = acc_alt.add(&shifted); }
        else { acc_alt = acc_alt.sub(&shifted); }
        acc_net = acc_net.add(c);
    }

    // Dump final polynomials for debugging
    let hp = P / 2;
    eprintln!("  FINAL acc_alt ({} terms):", acc_alt.n());
    for (&k, &v) in &acc_alt.t {
        let c = if v > hp { -((P - v) as i64) } else { v as i64 };
        eprintln!("    t^{}: {}", k, c);
    }
    eprintln!("  FINAL acc_net ({} terms):", acc_net.n());
    for (&k, &v) in &acc_net.t {
        let c = if v > hp { -((P - v) as i64) } else { v as i64 };
        eprintln!("    t^{}: {}", k, c);
    }

    // Evaluate: split even/odd powers, compute mod P
    let (alt_e, alt_o) = acc_alt.eval_split();
    let (net_e, net_o) = acc_net.eval_split();

    // f_pauli = |tr_alt(q₀) / net(q₀)|
    // tr_alt(q₀) = alt_even + √q₀ · alt_odd
    // net(q₀) = net_even + √q₀ · net_odd
    //
    // In mod P: we can't compute √q₀, but we can compute the ratio
    // IF both have the same √q₀ structure. Check if odd parts are zero.
    //
    // For the float evaluation: use the mod-p residues as signed integers
    // and compute the ratio directly. Since we have the EXACT polynomial
    // coefficients (no BigInt overflow for single u64 prime), the evaluation
    // is just polynomial evaluation at a float point.

    // Actually: just evaluate the polynomial at t₀ = √q₀ as a float
    // using the exact mod-p coefficients interpreted as signed integers.
    let q0: f64 = 1.1099785955541805;
    let t0 = q0.sqrt();
    let half_p = P / 2;
    let divisor = 2.0_f64.powi(pn_count as i32);

    // Evaluate mod-p polynomial at t₀ as float.
    // For correct sign recovery: the TRUE coefficient c satisfies
    // c ≡ v (mod P). Since |c| < P for A ≤ 12 (coefficients small),
    // we can safely interpret v > P/2 as negative.
    // For A > 12: coefficients can exceed P, making sign recovery wrong.
    // In that case, use the Pauli accumulator's per-length data.
    let eval_float = |lp: &LP| -> f64 {
        lp.t.iter().map(|(&k, &v)| {
            let c = if v > half_p { -((P - v) as f64) } else { v as f64 };
            c * t0.powi(k)
        }).sum::<f64>() / divisor
    };

    let tr_alt_f = eval_float(&acc_alt);
    let net_f = eval_float(&acc_net);
    let f_pauli = if net_f.abs() > 1e-30 { (tr_alt_f / net_f).abs() } else { 0.0 };

    (f_pauli, tr_alt_f, net_f, tree.len() as f64)
}

fn sym(z: usize) -> &'static str {
    match z {
        1=>"h",2=>"he",3=>"li",4=>"be",5=>"b",6=>"c",7=>"n",8=>"o",
        9=>"f",10=>"ne",11=>"na",12=>"mg",13=>"al",14=>"si",15=>"p",
        16=>"s",17=>"cl",18=>"ar",19=>"k",20=>"ca",_=>"?"
    }
}

fn main() {
    let args: Vec<String> = std::env::args().collect();
    let z: usize = args.get(1).and_then(|s| s.parse().ok()).unwrap_or(2);
    let n: usize = args.get(2).and_then(|s| s.parse().ok()).unwrap_or(2);
    let threshold: usize = args.get(3).and_then(|s| s.parse().ok()).unwrap_or(500);
    let a = z + n;

    eprintln!("hecke-crt v10 — single-prime u64 + sorted tree");
    eprintln!("  {}{} (Z={}, N={}, A={}), threshold={}", a, sym(z), z, n, a, threshold);

    let t0 = Instant::now();
    let (fp, ta, nt, nw) = build_and_eval(z, n, threshold);
    let elapsed = t0.elapsed().as_secs_f64();

    eprintln!("  f_pauli = {:.10}", fp);
    eprintln!("  tr_alt = {:.6e}, net = {:.6e}", ta, nt);
    eprintln!("  {} words, {:.2}s", nw, elapsed);

    // Write certificate
    let cert = serde_json::json!({
        "isotope": { "z": z, "n": n, "a": a, "symbol": sym(z) },
        "engine": { "name": "hecke-crt", "version": "0.10.1" },
        "f_pauli_f64": fp,
        "tr_alt_f64": ta,
        "net_f64": nt,
        "elapsed_seconds": elapsed,
    });
    let fname = format!("certificate-{}{}.json", a, sym(z));
    std::fs::write(&fname, serde_json::to_string_pretty(&cert).unwrap()).unwrap();
    eprintln!("  Certificate: {}", fname);
}
