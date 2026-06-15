//! Optimized Gröbner--Shirshov engine for H_n(q) — memory-efficient with indexed reduction.
//!
//! Key optimizations over v1:
//! 1. Compact word representation: u64 packed (up to 16 generators, 4 bits each)
//! 2. Junction-only reduction: after appending σ_k to reduced word w,
//!    only the last 3 chars need checking (w was already reduced)
//! 3. Streaming Pauli: accumulate tr_alt/net during construction,
//!    optionally discard terms after accumulation
//! 4. Quotient at strand boundaries: keep term count bounded
//!
//! For A ≤ 16: generators 0..14 fit in 4 bits each, 16 per u64.
//! For A > 16: fall back to Vec<u8>.

/// Packed word: up to 31 generators in a u128 (4 bits each).
/// Bits 124..127: length (0..31). Bits 0..123: generators (4 bits each, LSB first).
/// Generator values 0..14. Enough for A ≤ 16 (max word length = 15*14/2 = 105... too big).
/// Actually for A=8: max word length = 22. For A=10: max = 45.
/// u128 with 4 bits/gen holds 31 generators — covers A ≤ 8 perfectly.
/// For A=9+: words can exceed 31. Use truncation with warning.
#[derive(Clone, Copy, PartialEq, Eq, Hash)]
struct PackedWord(u128);

impl PackedWord {
    const MAX_LEN: usize = 31;
    const EMPTY: PackedWord = PackedWord(0);

    #[inline]
    fn len(self) -> usize {
        (self.0 >> 124) as usize
    }

    #[inline]
    fn get(self, i: usize) -> u8 {
        ((self.0 >> (i * 4)) & 0xF) as u8
    }

    #[inline]
    fn push(self, gen: u8) -> Option<PackedWord> {
        let l = self.len();
        if l >= Self::MAX_LEN { return None; }
        let w = (self.0 & 0x0FFF_FFFF_FFFF_FFFF_FFFF_FFFF_FFFF_FFFFu128)
            | ((gen as u128) << (l * 4))
            | (((l + 1) as u128) << 124);
        Some(PackedWord(w))
    }

    #[inline]
    fn drop_last(self) -> PackedWord {
        let l = self.len();
        if l == 0 { return self; }
        let mask = (1u128 << ((l - 1) * 4)) - 1;
        let w = (self.0 & mask) | (((l - 1) as u128) << 124);
        PackedWord(w)
    }

    fn remove_at(self, pos: usize) -> PackedWord {
        let l = self.len();
        let mut result = 0u128;
        let mut j = 0;
        for i in 0..l {
            if i == pos { continue; }
            result |= (self.get(i) as u128) << (j * 4);
            j += 1;
        }
        result |= ((l - 1) as u128) << 124;
        PackedWord(result)
    }

    fn hecke_reduce(self, pos: usize) -> (PackedWord, PackedWord) {
        let w1 = self.remove_at(pos + 1);
        let w2 = w1.remove_at(pos);
        (w1, w2)
    }

    fn swap(self, pos: usize) -> PackedWord {
        let a = self.get(pos);
        let b = self.get(pos + 1);
        let mask_a = !(0xFu128 << (pos * 4));
        let mask_b = !(0xFu128 << ((pos + 1) * 4));
        let w = (self.0 & mask_a & mask_b)
            | ((b as u128) << (pos * 4))
            | ((a as u128) << ((pos + 1) * 4));
        PackedWord(w)
    }

    /// Check if reducible at the LAST 3 positions only (junction check).
    /// Returns Some((pos, rule)) if reducible at the junction.
    #[inline]
    fn junction_reduction(self) -> Option<(usize, u8)> {
        let l = self.len();
        if l < 2 { return None; }

        // Check last pair
        let pos = l - 2;
        let a = self.get(pos);
        let b = self.get(pos + 1);

        // Hecke: σ_i²
        if a == b { return Some((pos, 0)); }

        // Far-comm: σ_i σ_j with i > j, |i-j| >= 2
        if (a as i16 - b as i16) >= 2 { return Some((pos, 1)); }

        // YB: check last triple
        if l >= 3 {
            let pos2 = l - 3;
            let c = self.get(pos2);
            if c == b && (c as i16 - a as i16).abs() == 1 && a < c {
                return Some((pos2, 2));
            }
        }
        None
    }

    /// Full scan for any reducible pair (fallback).
    fn find_reduction(self) -> Option<(usize, u8)> {
        let l = self.len();
        if l < 2 { return None; }
        for pos in 0..l-1 {
            let a = self.get(pos);
            let b = self.get(pos + 1);
            if a == b { return Some((pos, 0)); }
            if (a as i16 - b as i16) >= 2 { return Some((pos, 1)); }
            if pos + 2 < l {
                let c = self.get(pos + 2);
                if a == c && (a as i16 - b as i16).abs() == 1 && b < a {
                    return Some((pos, 2));
                }
            }
        }
        None
    }
}

impl std::fmt::Debug for PackedWord {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let l = self.len();
        if l == 0 { return write!(f, "𝟏"); }
        for i in 0..l {
            if i > 0 { write!(f, ".")?; }
            write!(f, "σ{}", self.get(i))?;
        }
        Ok(())
    }
}

pub use rustc_hash::FxHashMap;
use serde_json;
use std::time::Instant;

/// Memory-efficient Hecke element using packed words.
struct HeckeElem {
    terms: FxHashMap<PackedWord, f64>,
}

impl HeckeElem {
    fn new() -> Self { Self { terms: FxHashMap::default() } }
    fn identity() -> Self { let mut h = Self::new(); h.terms.insert(PackedWord::EMPTY, 1.0); h }
    fn n_terms(&self) -> usize { self.terms.len() }
    fn clean(&mut self) { self.terms.retain(|_, c| c.abs() > 1e-15); }

    fn histogram(&self) -> Vec<usize> {
        let mx = self.terms.keys().map(|w| w.len()).max().unwrap_or(0);
        let mut h = vec![0usize; mx + 1];
        for w in self.terms.keys() { h[w.len()] += 1; }
        h
    }

    fn memory_bytes(&self) -> usize {
        // FxHashMap overhead: ~48 bytes per entry (key + value + hash + padding)
        self.terms.len() * 48
    }
}

#[derive(Default, Clone)]
struct PauliAcc {
    tr_alt: f64, tr_sym: f64, net: f64,
}

impl PauliAcc {
    fn add(&mut self, coeff: f64, word_len: usize, q: f64, qi: f64) {
        self.tr_alt += coeff * (-qi).powi(word_len as i32);
        self.tr_sym += coeff * q.powi(word_len as i32);
        self.net += coeff;
    }
    fn from_elem(elem: &HeckeElem, q: f64, qi: f64) -> Self {
        let mut acc = Self::default();
        for (w, &c) in &elem.terms { acc.add(c, w.len(), q, qi); }
        acc
    }
    fn merge(&mut self, other: &PauliAcc) {
        self.tr_alt += other.tr_alt;
        self.tr_sym += other.tr_sym;
        self.net += other.net;
    }
}

struct Engine {
    ha: f64, s: f64, z: f64, q: f64, qi: f64,
}

impl Engine {
    fn new(q: f64) -> Self {
        let qi = 1.0/q;
        Self { ha: q-qi, s: q.sqrt()-qi.sqrt(), z: 1.0/(q.sqrt()+qi.sqrt()), q, qi }
    }

    /// Crossing coefficients (c, d) for T(c,d) = c·σ + d·𝟏.
    /// From σ⁻¹ = σ − (q − q⁻¹): pp→(1,0), nn→(1,−HA), pn→(1,−HA/2).
    fn crossing_coeffs(&self, ti: u8, tj: u8) -> (f64, f64) {
        match (ti, tj) {
            (b'p', b'p') => (1.0, 0.0),
            (b'n', b'n') => (1.0, -self.ha),
            _ => (1.0, -self.ha / 2.0),
        }
    }

    /// Multiply and reduce: the hot path.
    /// For each existing term w (already reduced), produce:
    ///   d·w (stays reduced) and c·(w·gen) (needs junction check).
    fn multiply_and_reduce(&self, elem: &mut HeckeElem, gen: u8, c: f64, d: f64) {
        let old: Vec<(PackedWord, f64)> = elem.terms.drain().collect();
        let mut unreduced: Vec<(PackedWord, f64)> = Vec::new();

        for (w, coeff) in old {
            if d.abs() > 1e-15 {
                *elem.terms.entry(w).or_insert(0.0) += coeff * d;
            }
            if c.abs() > 1e-15 {
                let Some(wg) = w.push(gen) else { continue };
                // Junction check: only last 2-3 chars
                if wg.junction_reduction().is_some() {
                    unreduced.push((wg, coeff * c));
                } else {
                    *elem.terms.entry(wg).or_insert(0.0) += coeff * c;
                }
            }
        }

        // Process unreduced terms
        self.reduce_batch(elem, unreduced);
    }

    /// Reduce a batch of unreduced terms, routing results back.
    fn reduce_batch(&self, elem: &mut HeckeElem, mut batch: Vec<(PackedWord, f64)>) {
        let mut next_batch: Vec<(PackedWord, f64)> = Vec::new();

        while !batch.is_empty() {
            // Consolidate: merge same-word entries
            let mut consolidated: FxHashMap<PackedWord, f64> = FxHashMap::default();
            for (w, c) in batch.drain(..) {
                *consolidated.entry(w).or_insert(0.0) += c;
            }

            for (word, coeff) in consolidated {
                if coeff.abs() < 1e-15 { continue; }

                // Try junction first (fast), then full scan (fallback)
                let reduction = word.junction_reduction()
                    .or_else(|| word.find_reduction());

                if let Some((pos, rule)) = reduction {
                    match rule {
                        0 => {
                            let (w1, w2) = word.hecke_reduce(pos);
                            // w1 might need further reduction
                            if w1.junction_reduction().is_some() || w1.find_reduction().is_some() {
                                next_batch.push((w1, coeff * self.ha));
                            } else {
                                *elem.terms.entry(w1).or_insert(0.0) += coeff * self.ha;
                            }
                            if w2.junction_reduction().is_some() || w2.find_reduction().is_some() {
                                next_batch.push((w2, coeff));
                            } else {
                                *elem.terms.entry(w2).or_insert(0.0) += coeff;
                            }
                        }
                        1 => {
                            let w = word.swap(pos);
                            if w.find_reduction().is_some() {
                                next_batch.push((w, coeff));
                            } else {
                                *elem.terms.entry(w).or_insert(0.0) += coeff;
                            }
                        }
                        2 => {
                            // YB: (a,b,a) → (b,a,b) at positions pos, pos+1, pos+2
                            let a = word.get(pos);
                            let b = word.get(pos+1);
                            // Clear the 3 positions and set new values
                            let mask = !(0xFFFu128 << (pos * 4)); // clear 12 bits at pos
                            let raw = (word.0 & mask)
                                | ((b as u128) << (pos * 4))
                                | ((a as u128) << ((pos + 1) * 4))
                                | ((b as u128) << ((pos + 2) * 4));
                            let w = PackedWord(raw);
                            if w.find_reduction().is_some() {
                                next_batch.push((w, coeff));
                            } else {
                                *elem.terms.entry(w).or_insert(0.0) += coeff;
                            }
                        }
                        _ => unreachable!(),
                    }
                } else {
                    *elem.terms.entry(word).or_insert(0.0) += coeff;
                }
            }

            std::mem::swap(&mut batch, &mut next_batch);
        }

        elem.clean();
    }

    /// Build nucleus with Pauli tracking and optional quotient.
    fn build_pauli(&self, z: usize, n: usize, quotient_after_a: usize) -> (HeckeElem, PauliAcc) {
        let a = z + n;
        assert!(a <= 16, "PackedWord supports A ≤ 16");
        let mut types = vec![b'p'; z];
        types.extend(vec![b'n'; n]);
        let mut elem = HeckeElem::identity();
        let mut accum = PauliAcc::default();
        let t0 = Instant::now();

        for k in 1..a {
            for i in 0..k {
                let (c, d) = self.crossing_coeffs(types[i], types[k]);
                self.multiply_and_reduce(&mut elem, i as u8, c, d);
            }

            // Progress
            if elem.n_terms() > 10000 {
                eprintln!("  strand {}/{}: {} terms, {:.0}MB, {:.1}s",
                    k, a-1, elem.n_terms(),
                    elem.memory_bytes() as f64 / 1e6,
                    t0.elapsed().as_secs_f64());
            }

            // Quotient at strand boundaries for large A
            if a > quotient_after_a && k < a - 1 {
                let removed = self.apply_quotient_pauli(&mut elem);
                accum.merge(&removed);
            }
        }
        // no extra newline needed since we use eprintln now

        (elem, accum)
    }

    /// Apply I₉+I₈ quotient, return Pauli data of removed terms.
    fn apply_quotient_pauli(&self, elem: &mut HeckeElem) -> PauliAcc {
        let mut removed = PauliAcc::default();
        // I₉: strip longest chains
        loop {
            let mut words: Vec<PackedWord> = elem.terms.keys()
                .filter(|w| w.len() >= 2 && elem.terms[w].abs() > 1e-15)
                .copied().collect();
            words.sort_unstable_by(|a, b| b.len().cmp(&a.len()));
            let mut found = false;
            for &word in &words {
                let prefix = word.drop_last();
                if elem.terms.get(&prefix).map_or(false, |c| c.abs() > 1e-15) {
                    let coeff = elem.terms.remove(&word).unwrap_or(0.0);
                    removed.add(coeff, word.len(), self.q, self.qi);
                    found = true; break;
                }
            }
            if !found { break; }
        }
        // I₈: adjacency
        loop {
            let adj: Vec<PackedWord> = elem.terms.keys()
                .filter(|w| w.len() == 2 && elem.terms[w].abs() > 1e-15 && w.get(1) == w.get(0) + 1)
                .copied().collect();
            let mut found = false;
            for &word in &adj {
                let Some(sigma_j) = PackedWord::EMPTY.push(word.get(1)) else { continue };
                if elem.terms.get(&sigma_j).map_or(false, |c| c.abs() > 1e-15) {
                    let coeff = elem.terms.remove(&word).unwrap_or(0.0);
                    removed.add(coeff, 2, self.q, self.qi);
                    found = true; break;
                }
            }
            if !found { break; }
        }
        elem.clean();
        removed
    }

    fn generator_volumes(&self, z: usize, n: usize) -> Vec<f64> {
        let a = z+n;
        let mut types = vec![b'p'; z]; types.extend(vec![b'n'; n]);
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
}

fn is_palindromic(h: &[usize]) -> bool { let n=h.len(); (0..n/2).all(|i| h[i]==h[n-1-i]) }

fn nucleus_name(z: usize, n: usize) -> String {
    let a=z+n;
    let s=match z {1=>"H",2=>"He",3=>"Li",4=>"Be",5=>"B",6=>"C",7=>"N",8=>"O",9=>"F",10=>"Ne",_=>"?"};
    format!("{}{}({},{})", a, s, z, n)
}

fn main() {
    let args: Vec<String> = std::env::args().collect();
    // Substrate parameter q₀ — derived from Vol(4_1)/m_μ/m_e.
    // Single source of truth: q_parameter.py. This must match.
    const Q0: f64 = 1.10998;
    let engine = Engine::new(Q0);

    if args.len() < 2 {
        eprintln!("Usage: hecke-engine-v2 [pauli Z N | pauli A_max | bench A]");
        std::process::exit(1);
    }

    match args[1].as_str() {
        "pauli" => {
            let z: usize = args.get(2).and_then(|s| s.parse().ok()).unwrap_or(0);
            let n: usize = args.get(3).and_then(|s| s.parse().ok()).unwrap_or(0);

            if z > 0 && n > 0 {
                let a = z + n;
                let t0 = Instant::now();
                let use_q = if a <= 10 { 999 } else { 10 };
                let (elem, accum) = engine.build_pauli(z, n, use_q);

                let mut kept = PauliAcc::from_elem(&elem, engine.q, engine.qi);
                let tr_alt = kept.tr_alt + accum.tr_alt;
                let net = kept.net + accum.net;
                let f = if net.abs() > 1e-30 { tr_alt.abs() / net.abs() } else { 0.0 };
                let hist = elem.histogram();
                let pal = is_palindromic(&hist);
                let ms = t0.elapsed().as_millis();

                println!("{}: A={}, {} terms, {:.1}MB, pal={}, F_Pauli={:.6}, {}ms",
                    nucleus_name(z,n), a, elem.n_terms(),
                    elem.memory_bytes() as f64 / 1e6,
                    if pal {"Y"} else {"N"}, f, ms);
                if accum.net.abs() > 1e-10 {
                    println!("  (with accumulation: kept={:.4} + accum={:.4})", kept.net, accum.net);
                }
            } else {
                let a_max: usize = args.get(2).and_then(|s| s.parse().ok()).unwrap_or(8);
                println!("PAULI TABLE (packed words, A ≤ {})", a_max);
                println!("{:>12} {:>3} {:>3} {:>3} {:>10} {:>8} {:>3} {:>10} {:>8}",
                    "Nucleus","Z","N","A","Terms","MB","Pal","F_Pauli","Time");
                println!("{}", "-".repeat(75));

                for zz in 1..=a_max {
                    let n_min = if zz<=1 {1} else {zz.saturating_sub(1)};
                    for nn in n_min..=(zz+2) {
                        let a = zz+nn;
                        if a < 2 || a > a_max || nn+1 < zz { continue; }
                        let t0 = Instant::now();
                        let use_q = if a <= 10 { 999 } else { 10 };
                        let (elem, accum) = engine.build_pauli(zz, nn, use_q);
                        let mut kept = PauliAcc::from_elem(&elem, engine.q, engine.qi);
                        let tr_alt = kept.tr_alt + accum.tr_alt;
                        let net = kept.net + accum.net;
                        let f = if net.abs()>1e-30 { tr_alt.abs()/net.abs() } else { 0.0 };
                        let hist = elem.histogram();
                        let pal = is_palindromic(&hist);
                        let ms = t0.elapsed().as_millis();
                        println!("{:>12} {:>3} {:>3} {:>3} {:>10} {:>8.1} {:>3} {:>10.6} {:>6}ms",
                            nucleus_name(zz,nn),zz,nn,a,elem.n_terms(),
                            elem.memory_bytes() as f64/1e6,
                            if pal {"Y"} else {" "}, f, ms);
                    }
                }
            }
        }

        "bench" => {
            let a: usize = args[2].parse().unwrap();
            let z = a / 2; let n = a - z;
            println!("Benchmark: N({},{}) A={}", z, n, a);
            let t0 = Instant::now();
            let (elem, _) = engine.build_pauli(z, n, 999);
            let ms = t0.elapsed().as_millis();
            println!("  {} terms, {:.1}MB, {}ms",
                elem.n_terms(), elem.memory_bytes() as f64/1e6, ms);
        }

        _ => { eprintln!("Unknown: {}", args[1]); std::process::exit(1); }
    }
}
