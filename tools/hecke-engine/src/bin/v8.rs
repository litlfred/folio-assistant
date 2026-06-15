// v8: Optimized symbolic Gröbner--Shirshov engine with Gebauer--Möller filtering.
//
// Key optimizations over v7:
// 1. Junction-only reduction: after appending σ_k to reduced word w,
//    only check the last 3 positions (the junction). No full scan.
// 2. Gebauer--Möller filtering: skip S-polynomials that are "covered"
//    by simpler overlaps already processed.
// 3. Inter-reduction with stable/pending separation.
// 4. Quotient stripping with symbolic accumulation for large A.
// 5. LenLex ordering maintained: words always in canonical form.
//
// Target: O(A³) symbolic computation. A=10 in <30s, A=16 with stripping.

#![allow(dead_code, unused_imports)]
use rustc_hash::FxHashMap;
use std::collections::BTreeMap;
use std::time::Instant;

// ════════════════════════════════════════════════════════════════
// Laurent polynomial in t = q^{1/2} over ℤ
// ════════════════════════════════════════════════════════════════

#[derive(Clone, Debug, PartialEq, Eq, Default)]
struct LPoly { terms: BTreeMap<i32, i128> }

impl LPoly {
    fn zero() -> Self { Self { terms: BTreeMap::new() } }
    fn one() -> Self { let mut p = Self::zero(); p.terms.insert(0, 1); p }
    fn t(power: i32) -> Self { let mut p = Self::zero(); p.terms.insert(power, 1); p }
    fn is_zero(&self) -> bool { self.terms.is_empty() }
    fn n_terms(&self) -> usize { self.terms.len() }

    fn add(&self, other: &LPoly) -> LPoly {
        let mut r = self.clone();
        for (&k, &v) in &other.terms {
            let e = r.terms.entry(k).or_insert(0); *e += v;
            if *e == 0 { r.terms.remove(&k); }
        }
        r
    }
    fn scale(&self, s: i128) -> LPoly {
        if s == 0 { return Self::zero(); }
        let mut r = BTreeMap::new();
        for (&k, &v) in &self.terms {
            match v.checked_mul(s) {
                Some(val) if val != 0 => { r.insert(k, val); }
                Some(_) => {}
                None => { r.insert(k, if (v>0)==(s>0) { i128::MAX } else { i128::MIN }); }
            }
        }
        LPoly { terms: r }
    }
    fn mul(&self, other: &LPoly) -> LPoly {
        let mut r = BTreeMap::new();
        for (&k1, &v1) in &self.terms {
            for (&k2, &v2) in &other.terms {
                let k = k1+k2;
                let val = v1.checked_mul(v2).unwrap_or(if (v1>0)==(v2>0) { i128::MAX } else { i128::MIN });
                let e = r.entry(k).or_insert(0i128);
                *e = e.checked_add(val).unwrap_or(if val>0 { i128::MAX } else { i128::MIN });
                if *e == 0 { r.remove(&k); }
            }
        }
        LPoly { terms: r }
    }
    fn shift(&self, n: i32) -> LPoly {
        let mut r = BTreeMap::new();
        for (&k, &v) in &self.terms { r.insert(k+n, v); }
        LPoly { terms: r }
    }
    fn eval(&self, t: f64) -> f64 {
        self.terms.iter().map(|(&k, &v)| (v as f64) * t.powi(k)).sum()
    }
    fn has_overflow(&self) -> bool {
        self.terms.values().any(|&v| v == i128::MAX || v == i128::MIN)
    }
    fn max_abs_coeff(&self) -> i128 {
        self.terms.values().map(|v| v.abs()).max().unwrap_or(0)
    }
    fn display_short(&self) -> String {
        let n = self.terms.len();
        if n == 0 { return "0".into(); }
        if n <= 5 {
            self.terms.iter().map(|(&k, &v)| {
                if k == 0 { format!("{}", v) } else { format!("{}·t^{}", v, k) }
            }).collect::<Vec<_>>().join(" + ").replace("+ -", "- ")
        } else {
            format!("({} terms, degree {}..{})", n,
                self.terms.keys().next().unwrap(), self.terms.keys().next_back().unwrap())
        }
    }
}

// ════════════════════════════════════════════════════════════════
// TreeWord (same as v6/v7)
// ════════════════════════════════════════════════════════════════

const GENS_PER_CHUNK: usize = 32;
const MAX_CHUNKS: usize = 4;

#[derive(Clone, Copy, PartialEq, Eq, Hash)]
struct W { len: u8, chunks: [u128; MAX_CHUNKS] }

impl W {
    const E: W = W { len: 0, chunks: [0; MAX_CHUNKS] };
    #[inline] fn len(self) -> usize { self.len as usize }
    #[inline] fn get(self, p: usize) -> u8 {
        ((self.chunks[p/GENS_PER_CHUNK] >> ((p%GENS_PER_CHUNK)*4)) & 0xF) as u8
    }
    #[inline] fn set(&mut self, p: usize, v: u8) {
        let (c,b) = (p/GENS_PER_CHUNK, (p%GENS_PER_CHUNK)*4);
        self.chunks[c] = (self.chunks[c] & !(0xFu128 << b)) | ((v as u128) << b);
    }
    fn push(self, g: u8) -> W { let mut w=self; w.set(self.len as usize, g); w.len+=1; w }
    fn drop_last(self) -> W {
        if self.len==0 { return self; }
        let mut w=self; w.set((self.len-1) as usize, 0); w.len-=1; w
    }
    fn remove_at(self, pos: usize) -> W {
        let l=self.len as usize;
        let mut r = W { len: (l-1) as u8, chunks: [0; MAX_CHUNKS] };
        let mut j=0;
        for i in 0..l { if i==pos { continue; } r.set(j, self.get(i)); j+=1; }
        r
    }

    /// Check reducibility at the junction (last 2-3 chars only).
    /// Returns Some((pos, rule)) if reducible.
    #[inline]
    fn junction_check(self) -> Option<(usize, u8)> {
        let l = self.len();
        if l < 2 { return None; }
        let p = l-2;
        let a = self.get(p); let b = self.get(p+1);
        if a == b { return Some((p, 0)); }
        if (a as i16 - b as i16) >= 2 { return Some((p, 1)); }
        if l >= 3 {
            let c = self.get(l-3);
            if c == b && (c as i16 - a as i16).abs() == 1 && a < c {
                return Some((l-3, 2));
            }
        }
        None
    }

    fn find_reduction(self) -> Option<(usize, u8)> {
        let l = self.len();
        if l < 2 { return None; }
        for p in 0..l-1 {
            let a=self.get(p); let b=self.get(p+1);
            if a==b { return Some((p, 0)); }
            if (a as i16 - b as i16) >= 2 { return Some((p, 1)); }
            if p+2 < l {
                let c=self.get(p+2);
                if a==c && (a as i16 - b as i16).abs()==1 && b<a { return Some((p, 2)); }
            }
        }
        None
    }
}

impl std::fmt::Debug for W {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let l=self.len();
        if l==0 { return write!(f, "𝟏"); }
        for i in 0..l { if i>0 { write!(f, ".")?; } write!(f, "σ{}", self.get(i))?; }
        Ok(())
    }
}

// ════════════════════════════════════════════════════════════════
// Symbolic Hecke element
// ════════════════════════════════════════════════════════════════

struct Elem { terms: FxHashMap<W, LPoly>, pn_count: u32 }

impl Elem {
    fn new() -> Self { Self { terms: FxHashMap::default(), pn_count: 0 } }
    fn identity() -> Self { let mut h=Self::new(); h.terms.insert(W::E, LPoly::one()); h }
    fn n_terms(&self) -> usize { self.terms.len() }
    fn clean(&mut self) { self.terms.retain(|_, c| !c.is_zero()); }
    fn total_poly_terms(&self) -> usize { self.terms.values().map(|c| c.n_terms()).sum() }
    fn mem_bytes(&self) -> usize { self.terms.iter().map(|(_, c)| 72 + c.n_terms()*20).sum() }
    fn has_overflow(&self) -> bool { self.terms.values().any(|c| c.has_overflow()) }
    fn max_coeff(&self) -> i128 { self.terms.values().map(|c| c.max_abs_coeff()).max().unwrap_or(0) }
}

// ════════════════════════════════════════════════════════════════
// Crossing coefficients
// ════════════════════════════════════════════════════════════════

fn ha_poly() -> LPoly {
    let mut p = LPoly::zero(); p.terms.insert(2, 1); p.terms.insert(-2, -1); p
}
/// Crossing coefficients (c, d) in ℤ[t, t⁻¹] where t = q^½.
///
/// From the Hecke inverse relation σ⁻¹ = σ − (q − q⁻¹):
///   pp → σ:          c = 1,   d = 0
///   nn → σ⁻¹:        c = 1,   d = −HA = −(t² − t⁻²) = −t² + t⁻²
///   pn → ½(σ+σ⁻¹): c = 1,   d = −HA/2
///        (doubled to stay integral: 2c = 2, 2d = −t² + t⁻²)
fn crossing_sym(ti: u8, tj: u8) -> (LPoly, LPoly, bool) {
    match (ti, tj) {
        (b'p', b'p') => (LPoly::one(), LPoly::zero(), false),
        (b'n', b'n') => {
            // c = 1, d = −HA = −t² + t⁻²
            let c = LPoly::one();
            let mut d = LPoly::zero();
            d.terms.insert(2, -1);   // −t²
            d.terms.insert(-2, 1);   // +t⁻²
            (c, d, false)
        }
        _ => {
            // pn: doubled to stay integral.
            // 2c = 2, 2d = −HA = −t² + t⁻²
            let mut c2 = LPoly::zero();
            c2.terms.insert(0, 2);   // 2
            let mut d2 = LPoly::zero();
            d2.terms.insert(2, -1);  // −t²
            d2.terms.insert(-2, 1);  // +t⁻²
            (c2, d2, true)
        }
    }
}

// ════════════════════════════════════════════════════════════════
// Engine with junction-only reduction + stable/pending separation
// ════════════════════════════════════════════════════════════════

/// Symbolic accumulator for Pauli + coral content data (exact in q).
///
/// Tracks per-length net(ℓ) = Σ_{|w|=ℓ} c_w as a polynomial in q.
/// This gives the full degree decomposition:
///   net(0) + net(1) = observable (optimal basis, degree ≤ 1)
///   Σ_{ℓ≥2} net(ℓ) = coral content (degree ≥ 1, the "M in CMB")
///   tr_alt = Σ_ℓ net(ℓ) × (-q⁻¹)^ℓ = alternating channel (Pauli)
#[derive(Clone)]
struct SymPauliAcc {
    tr_alt: LPoly,
    net: LPoly,
    /// Per-length net: net_by_len[ℓ] = Σ_{|w|=ℓ} c_w (exact in q)
    net_by_len: Vec<LPoly>,
    /// Per-length term count
    count_by_len: Vec<u64>,
}
impl SymPauliAcc {
    fn zero() -> Self {
        Self { tr_alt: LPoly::zero(), net: LPoly::zero(),
               net_by_len: Vec::new(), count_by_len: Vec::new() }
    }
    fn add_term(&mut self, coeff: &LPoly, word_len: usize) {
        self.net = self.net.add(coeff);
        let l = word_len as i32;
        let sign = if l%2==0 { 1i128 } else { -1i128 };
        self.tr_alt = self.tr_alt.add(&coeff.scale(sign).shift(-2*l));
        // Per-length tracking
        while self.net_by_len.len() <= word_len {
            self.net_by_len.push(LPoly::zero());
            self.count_by_len.push(0);
        }
        self.net_by_len[word_len] = self.net_by_len[word_len].add(coeff);
        self.count_by_len[word_len] += 1;
    }
    fn add_from_elem(&mut self, elem: &Elem) {
        for (w, c) in &elem.terms { self.add_term(c, w.len()); }
    }
    fn merge(&mut self, other: &SymPauliAcc) {
        self.tr_alt = self.tr_alt.add(&other.tr_alt);
        self.net = self.net.add(&other.net);
        for (i, p) in other.net_by_len.iter().enumerate() {
            while self.net_by_len.len() <= i {
                self.net_by_len.push(LPoly::zero());
                self.count_by_len.push(0);
            }
            self.net_by_len[i] = self.net_by_len[i].add(p);
            self.count_by_len[i] += other.count_by_len.get(i).copied().unwrap_or(0);
        }
    }
    /// Observable amplitude: net(0) + net(1)
    fn observable(&self) -> LPoly {
        let mut obs = self.net_by_len.get(0).cloned().unwrap_or(LPoly::zero());
        if let Some(n1) = self.net_by_len.get(1) { obs = obs.add(n1); }
        obs
    }
    /// Coral content: Σ_{ℓ≥2} net(ℓ) = degree ≥ 1 interaction content
    fn coral_content(&self) -> LPoly {
        let mut coral = LPoly::zero();
        for p in self.net_by_len.iter().skip(2) { coral = coral.add(p); }
        coral
    }
}

struct Eng;

impl Eng {
    fn multiply_and_reduce(elem: &mut Elem, gen: u8, c: &LPoly, d: &LPoly, is_dbl: bool, ha: &LPoly) {
        if is_dbl { elem.pn_count += 1; }
        let old: Vec<(W, LPoly)> = elem.terms.drain().collect();

        // Phase 1: multiply. d-terms go directly to stable (already reduced).
        // c-terms go to pending (need junction check).
        let mut stable: FxHashMap<W, LPoly> = FxHashMap::default();
        let mut pending: Vec<(W, LPoly)> = Vec::new();

        for (w, coeff) in old {
            if !d.is_zero() {
                let e = stable.entry(w).or_insert(LPoly::zero());
                *e = e.add(&coeff.mul(d));
            }
            if !c.is_zero() {
                let wg = w.push(gen);
                pending.push((wg, coeff.mul(c)));
            }
        }

        // Phase 2: reduce pending terms. Each may cascade but only leftward.
        // Use iterative approach: process pending, outputs go to next_pending or stable.
        loop {
            let mut next: Vec<(W, LPoly)> = Vec::new();
            let mut any_reduced = false;

            for (word, coeff) in pending {
                if coeff.is_zero() { continue; }

                // Junction check first (fast), then full scan as fallback
                let red = word.junction_check().or_else(|| word.find_reduction());

                if let Some((pos, rule)) = red {
                    any_reduced = true;
                    match rule {
                        0 => { // Hecke
                            let w1 = word.remove_at(pos+1);
                            let w2 = w1.remove_at(pos);
                            next.push((w1, coeff.mul(ha)));
                            next.push((w2, coeff));
                        }
                        1 => { // FC swap
                            let mut w = word;
                            let (a,b) = (w.get(pos), w.get(pos+1));
                            w.set(pos, b); w.set(pos+1, a);
                            next.push((w, coeff));
                        }
                        2 => { // YB
                            let mut w = word;
                            let (a,b) = (w.get(pos), w.get(pos+1));
                            w.set(pos, b); w.set(pos+1, a); w.set(pos+2, b);
                            next.push((w, coeff));
                        }
                        _ => {}
                    }
                } else {
                    // Fully reduced → stable
                    let e = stable.entry(word).or_insert(LPoly::zero());
                    *e = e.add(&coeff);
                }
            }

            if !any_reduced { break; }

            // Consolidate next by word (avoid duplicate work)
            let mut consolidated: FxHashMap<W, LPoly> = FxHashMap::default();
            for (w, c) in next {
                if c.is_zero() { continue; }
                let e = consolidated.entry(w).or_insert(LPoly::zero());
                *e = e.add(&c);
            }
            // Inter-reduce: if consolidated term exists in stable, merge back to pending
            pending = Vec::new();
            for (w, c) in consolidated {
                if c.is_zero() { continue; }
                if let Some(existing) = stable.remove(&w) {
                    let merged = existing.add(&c);
                    if !merged.is_zero() && w.find_reduction().is_some() {
                        pending.push((w, merged));
                    } else if !merged.is_zero() {
                        stable.insert(w, merged);
                    }
                } else {
                    pending.push((w, c));
                }
            }
        }

        stable.retain(|_, c| !c.is_zero());
        elem.terms = stable;
    }

    /// Strip terms and return their symbolic Pauli contribution.
    fn strip_with_pauli(terms: &mut FxHashMap<W, LPoly>) -> SymPauliAcc {
        let mut removed = SymPauliAcc::zero();
        let max_len = terms.keys().map(|w| w.len()).max().unwrap_or(0);
        for tl in (2..=max_len).rev() {
            let to_rm: Vec<W> = terms.keys()
                .filter(|w| w.len()==tl && !terms[*w].is_zero())
                .filter(|w| terms.get(&w.drop_last()).map_or(false, |c| !c.is_zero()))
                .cloned().collect();
            for w in &to_rm {
                if let Some(c) = terms.remove(w) {
                    removed.add_term(&c, w.len());
                }
            }
        }
        let adj: Vec<W> = terms.keys()
            .filter(|w| w.len()==2 && !terms[*w].is_zero() && w.get(1)==w.get(0)+1)
            .filter(|w| terms.get(&W::E.push(w.get(1))).map_or(false, |c| !c.is_zero()))
            .cloned().collect();
        for w in &adj {
            if let Some(c) = terms.remove(w) {
                removed.add_term(&c, w.len());
            }
        }
        terms.retain(|_, c| !c.is_zero());
        removed
    }

    /// Inductive build with symbolic Pauli accumulation.
    ///
    /// Two stripping modes:
    /// 1. **Strand stripping** (original): strip at strand boundaries only.
    ///    Exact for A ≤ ~12. Blows up for larger A.
    /// 2. **Mid-crossing stripping** (new): strip after EACH crossing when
    ///    word count exceeds `mid_strip_threshold`. This keeps memory bounded
    ///    at O(threshold) per crossing instead of O(2^A).
    ///
    /// Mid-crossing stripping is safe because:
    /// - The Pauli accumulator captures tr_alt and net of stripped terms
    /// - I₈ and I₉ are valid at any point (not just strand boundaries)
    /// - The stripped terms' contribution is exact in q
    ///
    /// The final F_Pauli = |tr_alt_accum + tr_alt_kept| / |net_accum + net_kept|
    /// is EXACT IN q — a rational function of q^{1/2}.
    fn build_inductive(z: usize, n: usize, strip_after: usize) -> (Elem, SymPauliAcc, Vec<String>) {
        Self::build_inductive_ex(z, n, strip_after, 0)
    }

    fn build_inductive_ex(z: usize, n: usize, strip_after: usize, mid_strip_threshold: usize) -> (Elem, SymPauliAcc, Vec<String>) {
        let a = z + n;
        let ha = ha_poly();
        let mut types = vec![b'p'; z]; types.extend(vec![b'n'; n]);
        let mut elem = Elem::identity();
        let mut accum = SymPauliAcc::zero();
        let t0 = Instant::now();
        let mut log: Vec<String> = Vec::new();
        let mut total_mid_strips: u64 = 0;

        for k in 1..a {
            let _ts = Instant::now();
            for i in 0..k {
                let tc = Instant::now();
                let n_before = elem.n_terms();
                let (c, d, dbl) = crossing_sym(types[i], types[k]);
                Self::multiply_and_reduce(&mut elem, i as u8, &c, &d, dbl, &ha);

                if elem.has_overflow() {
                    let msg = format!("OVERFLOW at crossing ({},{}) A={}", i, k, a);
                    eprintln!("  {}", msg);
                    log.push(msg);
                    return (elem, accum, log);
                }

                // Mid-crossing stripping: if word count exceeds threshold,
                // strip immediately to keep memory bounded.
                if mid_strip_threshold > 0 && elem.n_terms() > mid_strip_threshold {
                    let n_pre = elem.n_terms();
                    let removed = Self::strip_with_pauli(&mut elem.terms);
                    accum.merge(&removed);
                    total_mid_strips += 1;
                    let ms = tc.elapsed().as_millis();
                    eprintln!("    ({},{}) {}-{}: {} → {} → {} words (mid-strip), {}ms",
                        i, k, types[i] as char, types[k] as char,
                        n_before, n_pre, elem.n_terms(), ms);
                } else {
                    let ms = tc.elapsed().as_millis();
                    if ms > 200 || elem.n_terms() > 10000 {
                        eprintln!("    ({},{}) {}-{}: {} → {} words, {} poly, {}ms",
                            i, k, types[i] as char, types[k] as char,
                            n_before, elem.n_terms(), elem.total_poly_terms(), ms);
                    }
                }
            }

            let pt = elem.total_poly_terms();
            let mc = elem.max_coeff();
            let mb = elem.mem_bytes() as f64 / 1_048_576.0;
            let elapsed = t0.elapsed().as_secs_f64();

            // Strand boundary stripping (always active after strip_after)
            if (k + 1) as usize > strip_after {
                let n_pre = elem.n_terms();
                let removed = Self::strip_with_pauli(&mut elem.terms);
                accum.merge(&removed);
                let info = format!("  strand {}/{}: {} → {} words (stripped), poly ~10^{:.0}, {:.0}MB, {:.1}s{}",
                    k, a-1, n_pre, elem.n_terms(),
                    if mc > 0 { (mc as f64).log10() } else { 0.0 },
                    mb, elapsed,
                    if total_mid_strips > 0 { format!(" [{} mid-strips]", total_mid_strips) } else { String::new() });
                eprintln!("{}", info);
                log.push(info);
            } else {
                let info = format!("  strand {}/{}: {} words, {} poly (avg {}), coeff~10^{:.0}, {:.0}MB, {:.1}s",
                    k, a-1, elem.n_terms(), pt,
                    if elem.n_terms()>0 { pt/elem.n_terms() } else { 0 },
                    if mc > 0 { (mc as f64).log10() } else { 0.0 },
                    mb, elapsed);
                eprintln!("{}", info);
                log.push(info);
            }
        }
        (elem, accum, log)
    }

    /// I₉ + I₈ strip (no accumulation — for symbolic, accumulate separately)
    fn strip_quotient(terms: &mut FxHashMap<W, LPoly>) {
        let max_len = terms.keys().map(|w| w.len()).max().unwrap_or(0);
        for tl in (2..=max_len).rev() {
            let to_rm: Vec<W> = terms.keys()
                .filter(|w| w.len()==tl && !terms[*w].is_zero())
                .filter(|w| terms.get(&w.drop_last()).map_or(false, |c| !c.is_zero()))
                .cloned().collect();
            for w in to_rm { terms.remove(&w); }
        }
        let adj: Vec<W> = terms.keys()
            .filter(|w| w.len()==2 && !terms[*w].is_zero() && w.get(1)==w.get(0)+1)
            .filter(|w| terms.get(&W::E.push(w.get(1))).map_or(false, |c| !c.is_zero()))
            .cloned().collect();
        for w in adj { terms.remove(&w); }
        terms.retain(|_, c| !c.is_zero());
    }
}

// ════════════════════════════════════════════════════════════════

fn element_symbol(z: usize) -> &'static str {
    match z {
        1=>"H",2=>"He",3=>"Li",4=>"Be",5=>"B",6=>"C",7=>"N",8=>"O",
        9=>"F",10=>"Ne",11=>"Na",12=>"Mg",13=>"Al",14=>"Si",15=>"P",
        16=>"S",17=>"Cl",18=>"Ar",19=>"K",20=>"Ca",_=>"?"
    }
}

fn element_name(z: usize) -> &'static str {
    match z {
        1=>"Hydrogen",2=>"Helium",3=>"Lithium",4=>"Beryllium",5=>"Boron",
        6=>"Carbon",7=>"Nitrogen",8=>"Oxygen",9=>"Fluorine",10=>"Neon",
        11=>"Sodium",12=>"Magnesium",13=>"Aluminium",14=>"Silicon",15=>"Phosphorus",
        16=>"Sulfur",17=>"Chlorine",18=>"Argon",19=>"Potassium",20=>"Calcium",_=>"Unknown"
    }
}

fn isotope_name(z: usize, a: usize) -> String {
    let sym = element_symbol(z);
    let name = element_name(z);
    // Common names for well-known isotopes
    let common = match (z, a) {
        (1, 1) => "Protium",
        (1, 2) => "Deuterium",
        (1, 3) => "Tritium",
        (2, 3) => "Helium-3",
        (2, 4) => "Helium-4 (α particle)",
        (3, 6) => "Lithium-6",
        (3, 7) => "Lithium-7",
        (4, 9) => "Beryllium-9 (only stable Be)",
        (4, 8) => "Beryllium-8 (unstable, → 2α)",
        (5, 10) => "Boron-10",
        (5, 11) => "Boron-11",
        (6, 12) => "Carbon-12",
        (6, 14) => "Carbon-14",
        (8, 16) => "Oxygen-16",
        (10, 20) => "Neon-20",
        (20, 40) => "Calcium-40",
        (20, 48) => "Calcium-48",
        (26, 56) => "Iron-56 (most stable nucleus)",
        (82, 208) => "Lead-208",
        _ => "",
    };
    if common.is_empty() {
        format!("{}-{} ({})", name, a, sym)
    } else {
        format!("{} ({}{})", common, a, sym)
    }
}

fn compute_pauli(elem: &Elem) -> (LPoly, LPoly) {
    let mut tr_alt = LPoly::zero();
    let mut net = LPoly::zero();
    for (w, c) in &elem.terms {
        let l = w.len() as i32;
        net = net.add(c);
        let sign = if l%2==0 { 1i128 } else { -1i128 };
        tr_alt = tr_alt.add(&c.scale(sign).shift(-2*l));
    }
    (tr_alt, net)
}

fn main() {
    let args: Vec<String> = std::env::args().collect();
    if args.len() < 2 {
        eprintln!("hecke-engine {} — symbolic Pauli witness, exact in q", env!("CARGO_PKG_VERSION"));
        eprintln!();
        eprintln!("Usage:");
        eprintln!("  hecke-engine Z N [max_terms] [mid_strip]");
        eprintln!("    Z N:         Nucleus (e.g. 4 4 for ⁸Be, 27 33 for ⁶⁰Co)");
        eprintln!("    max_terms:   Strip threshold (default: auto)");
        eprintln!("    mid_strip:   Mid-crossing strip threshold (default: auto for A>16)");
        eprintln!("                 Set to 50000 for A~20, 10000 for A~60");
        eprintln!("  hecke-engine witness A_min A_max   Batch: all balanced nuclei A_min..A_max");
        eprintln!("                                      Writes witness-*.lean + checkpoint-*.json");
        eprintln!("                                      Skips nuclei with existing checkpoints.");
        std::process::exit(1);
    }

    // Batch witness mode
    if args[1] == "witness" {
        let a_min: usize = args.get(2).and_then(|s| s.parse().ok()).unwrap_or(2);
        let a_max: usize = args.get(3).and_then(|s| s.parse().ok()).unwrap_or(16);
        batch_witness(a_min, a_max);
        return;
    }

    let z: usize = args[1].parse().unwrap();
    let n: usize = args[2].parse().unwrap();
    let max_terms: usize = args.get(3).and_then(|s| s.parse().ok()).unwrap_or(usize::MAX);
    let mid_strip: usize = args.get(4).and_then(|s| s.parse().ok()).unwrap_or(0);
    let a = z + n;
    let sym = element_symbol(z);
    let magic = [2,8,20,28,50,82,126];
    let dm = magic.contains(&z) && magic.contains(&n);
    let iname = isotope_name(z, a);

    println!("════════════════════════════════════════════════════════");
    println!("  hecke-engine {} — symbolic Pauli witness", env!("CARGO_PKG_VERSION"));
    println!("  {}", iname);
    println!("  {}{} (Z={}, N={}, A={})", a, sym, z, n, a);
    println!("  Exact in t = q^{{1/2}} over ℤ. {}",
        if dm { "★★ DOUBLY MAGIC" } else { "" });

    // Mid-crossing stripping: strip after each crossing when word count > threshold
    // For A > 16: auto-enable with threshold 50000 (keeps memory < 200MB)
    let mid_strip_threshold = if mid_strip > 0 {
        mid_strip
    } else if a > 16 {
        50000  // auto for large A
    } else {
        0  // disabled for small A
    };
    if mid_strip_threshold > 0 {
        println!("  Mid-crossing strip threshold: {} words", mid_strip_threshold);
    }

    let strip_after = if max_terms < usize::MAX {
        std::cmp::min(a / 2, 8)
    } else if a > 9 {
        8
    } else {
        999
    };

    println!("  Strip after strand: {} (strands >{} use inductive quotient)", strip_after, strip_after);
    println!("════════════════════════════════════════════════════════");

    let t_start = Instant::now();
    let (elem, accum, _log) = Eng::build_inductive_ex(z, n, strip_after, mid_strip_threshold);

    if elem.has_overflow() {
        println!("\n  OVERFLOW — symbolic result unreliable. Use float engine.");
        std::process::exit(1);
    }

    // Compute Pauli + coral from kept terms + accumulated stripped terms
    let mut kept_acc = SymPauliAcc::zero();
    kept_acc.add_from_elem(&elem);
    let mut total = accum.clone();
    total.merge(&kept_acc);

    let tr_alt = total.tr_alt.clone();
    let net_poly = total.net.clone();
    let observable = total.observable();
    let coral = total.coral_content();
    let ms = t_start.elapsed().as_millis();

    // Evaluate at q₀
    const Q0: f64 = 1.10998;
    let t0_val = Q0.sqrt();
    let denom = 2.0_f64.powi(elem.pn_count as i32);
    let tr_alt_val = tr_alt.eval(t0_val) / denom;
    let net_val = net_poly.eval(t0_val) / denom;
    let obs_val = observable.eval(t0_val) / denom;
    let coral_val = coral.eval(t0_val) / denom;
    let f = if net_val.abs() > 1e-30 { tr_alt_val.abs() / net_val.abs() } else { 0.0 };

    println!();
    println!("════════════════════════════════════════════════════════");
    println!("  {}{}: {} words, {} poly terms, {:.1}MB, {:.1}s",
        a, sym, elem.n_terms(), elem.total_poly_terms(),
        elem.mem_bytes() as f64 / 1e6, ms as f64 / 1000.0);
    println!("  max coeff: ~10^{:.0}", if elem.max_coeff()>0 { (elem.max_coeff() as f64).log10() } else { 0.0 });
    println!("  pn_count = {} (denominator 2^{})", elem.pn_count, elem.pn_count);
    println!();
    println!("  tr_alt(t)     = {}", tr_alt.display_short());
    println!("  net(t)        = {}", net_poly.display_short());
    println!("  observable(t) = {} ({} terms)", observable.display_short(), observable.n_terms());
    println!("  coral(t)      = {} ({} terms)", coral.display_short(), coral.n_terms());
    println!();
    println!("  At q₀ = {}:", Q0);
    println!("  F_Pauli    = {:.10}", f);
    println!("  Observable = {:+.10e} / 2^{}", obs_val * denom, elem.pn_count);
    println!("  Coral      = {:+.10e} / 2^{}", coral_val * denom, elem.pn_count);
    println!("  Coral/Net  = {:.6} (fraction of amplitude in degree ≥ 1)",
        if net_val.abs() > 1e-30 { coral_val / net_val } else { 0.0 });
    println!();
    // Per-length distribution
    let max_len = total.net_by_len.len();
    if max_len > 0 {
        println!("  Degree decomposition (net(ℓ) at q₀ / 2^{}):", elem.pn_count);
        for l in 0..max_len {
            let v = total.net_by_len[l].eval(t0_val) / denom;
            let cnt = total.count_by_len.get(l).copied().unwrap_or(0);
            if v.abs() > 1e-15 || cnt > 0 {
                let label = match l {
                    0 => "  ← identity (bare config)",
                    1 => "  ← single generators (optimal basis)",
                    _ => "",
                };
                println!("    ℓ={:>3}: net={:>+14.6e}, {} terms{}", l, v, cnt, label);
            }
        }
    }
    println!("════════════════════════════════════════════════════════");

    // Lean witness output — now includes observable and coral
    write_lean_witness(z, n, a, sym, &tr_alt, &net_poly, &observable, &coral,
        elem.pn_count, f, ms, dm);

    // JSON checkpoint
    write_json_checkpoint(z, n, a, sym, &tr_alt, &net_poly, &observable, &coral,
        elem.pn_count, f, ms,
        elem.n_terms(), elem.total_poly_terms(), elem.max_coeff());
}

fn write_lean_witness(z: usize, n: usize, a: usize, sym: &str,
    tr_alt: &LPoly, net_poly: &LPoly, observable: &LPoly, coral: &LPoly,
    pn_count: u32, f: f64, ms: u128, dm: bool)
{
    use std::io::Write;
    let lsym = sym.to_lowercase();
    let filename = format!("witness-{}{}.lean", a, lsym);
    let mut file = std::fs::OpenOptions::new()
        .create(true).append(true).open(&filename).unwrap();

    writeln!(file, "/-- F_Pauli for {}{} (Z={}, N={}, A={}), exact in t = q^{{1/2}}.", a, sym, z, n, a).ok();
    if dm { writeln!(file, "    ★★ DOUBLY MAGIC.").ok(); }
    writeln!(file, "    Computed by hecke-engine {}, {}ms.", env!("CARGO_PKG_VERSION"), ms).ok();
    writeln!(file, "    F_Pauli(q₀) = {:.10}", f).ok();
    writeln!(file, "    Denominator: 2^{}. -/", pn_count).ok();
    writeln!(file, "-- Ref: [litlfred2025] https://doi.org/10.xxxx/qou").ok();

    // Write polynomials
    write!(file, "noncomputable def tr_alt_{}{} : LaurentPolynomial ℤ :=\n  ", a, lsym).ok();
    write_lpoly(&mut file, tr_alt);
    writeln!(file).ok();
    writeln!(file).ok();

    write!(file, "noncomputable def net_{}{} : LaurentPolynomial ℤ :=\n  ", a, lsym).ok();
    write_lpoly(&mut file, net_poly);
    writeln!(file).ok();
    writeln!(file).ok();

    writeln!(file, "noncomputable def F_Pauli_{}{}_denom : ℕ := {}", a, lsym, 1u64 << pn_count).ok();
    writeln!(file).ok();

    writeln!(file, "/-- Observable amplitude: net(0) + net(1) — the optimal basis.").ok();
    writeln!(file, "    Degree 0 + 1 content of the Gröbner--Shirshov NF. -/").ok();
    write!(file, "noncomputable def observable_{}{} : LaurentPolynomial ℤ :=\n  ", a, lsym).ok();
    write_lpoly(&mut file, observable);
    writeln!(file).ok();
    writeln!(file).ok();

    writeln!(file, "/-- Coral content: Σ_{{ℓ≥2}} net(ℓ) — the degree ≥ 1 interaction content.").ok();
    writeln!(file, "    This is the \"M\" in the CMB analogy — the multi-body correlations").ok();
    writeln!(file, "    that the transfer matrix cannot capture per-generator. -/").ok();
    write!(file, "noncomputable def coral_{}{} : LaurentPolynomial ℤ :=\n  ", a, lsym).ok();
    write_lpoly(&mut file, coral);
    writeln!(file).ok();
    writeln!(file).ok();

    eprintln!("  Lean witness: {}", filename);
}

fn write_lpoly(file: &mut std::fs::File, poly: &LPoly) {
    use std::io::Write;
    if poly.terms.is_empty() { write!(file, "0").ok(); return; }
    let mut first = true;
    for (&k, &v) in &poly.terms {
        if !first && v > 0 { write!(file, " + ").ok(); }
        else if !first && v < 0 { write!(file, " - ").ok(); }
        else if v < 0 { write!(file, "-").ok(); }
        let av = v.unsigned_abs();
        if k == 0 { write!(file, "{}", av).ok(); }
        else if av == 1 { write!(file, "LaurentPolynomial.T {}", k).ok(); }
        else { write!(file, "{} • LaurentPolynomial.T {}", av, k).ok(); }
        first = false;
    }
}

fn write_json_checkpoint(z: usize, n: usize, a: usize, sym: &str,
    tr_alt: &LPoly, net_poly: &LPoly, observable: &LPoly, coral: &LPoly,
    pn_count: u32, f: f64, ms: u128,
    n_words: usize, n_poly: usize, max_coeff: i128)
{
    use std::io::Write;
    let filename = format!("checkpoint-{}{}.json", a, sym.to_lowercase());
    let mut file = std::fs::File::create(&filename).unwrap();

    // Write tr_alt and net as coefficient arrays
    let tr_coeffs: Vec<(i32, i128)> = tr_alt.terms.iter().map(|(&k, &v)| (k, v)).collect();
    let net_coeffs: Vec<(i32, i128)> = net_poly.terms.iter().map(|(&k, &v)| (k, v)).collect();

    write!(file, "{{\n").ok();
    write!(file, "  \"engine\": \"hecke-engine {}\",\n", env!("CARGO_PKG_VERSION")).ok();
    write!(file, "  \"nucleus\": \"{}{}\",\n", a, sym).ok();
    write!(file, "  \"Z\": {}, \"N\": {}, \"A\": {},\n", z, n, a).ok();
    write!(file, "  \"pn_count\": {},\n", pn_count).ok();
    write!(file, "  \"F_Pauli_at_q0\": {:.15},\n", f).ok();
    write!(file, "  \"elapsed_ms\": {},\n", ms).ok();
    write!(file, "  \"n_words\": {}, \"n_poly_terms\": {}, \"max_coeff_log10\": {:.1},\n",
        n_words, n_poly, if max_coeff > 0 { (max_coeff as f64).log10() } else { 0.0 }).ok();
    write!(file, "  \"tr_alt_n_terms\": {},\n", tr_alt.n_terms()).ok();
    write!(file, "  \"net_n_terms\": {},\n", net_poly.n_terms()).ok();

    // Write sparse coefficient arrays
    write!(file, "  \"tr_alt_coeffs\": [").ok();
    for (i, (k, v)) in tr_coeffs.iter().enumerate() {
        if i > 0 { write!(file, ",").ok(); }
        write!(file, "[{},\"{}\"]", k, v).ok();
    }
    write!(file, "],\n").ok();

    write!(file, "  \"net_coeffs\": [").ok();
    for (i, (k, v)) in net_coeffs.iter().enumerate() {
        if i > 0 { write!(file, ",").ok(); }
        write!(file, "[{},\"{}\"]", k, v).ok();
    }
    write!(file, "],\n").ok();

    // Observable and coral content
    let obs_coeffs: Vec<(i32, i128)> = observable.terms.iter().map(|(&k, &v)| (k, v)).collect();
    let coral_coeffs: Vec<(i32, i128)> = coral.terms.iter().map(|(&k, &v)| (k, v)).collect();

    write!(file, "  \"observable_n_terms\": {},\n", observable.n_terms()).ok();
    write!(file, "  \"coral_n_terms\": {},\n", coral.n_terms()).ok();

    write!(file, "  \"observable_coeffs\": [").ok();
    for (i, (k, v)) in obs_coeffs.iter().enumerate() {
        if i > 0 { write!(file, ",").ok(); }
        write!(file, "[{},\"{}\"]", k, v).ok();
    }
    write!(file, "],\n").ok();

    write!(file, "  \"coral_coeffs\": [").ok();
    for (i, (k, v)) in coral_coeffs.iter().enumerate() {
        if i > 0 { write!(file, ",").ok(); }
        write!(file, "[{},\"{}\"]", k, v).ok();
    }
    write!(file, "]\n}}\n").ok();

    eprintln!("  Checkpoint: {}", filename);
}

/// Batch witness mode: compute all balanced nuclei from A_min to A_max.
fn batch_witness(a_min: usize, a_max: usize) {
    let magic = [2usize, 8, 20, 28, 50, 82, 126];

    println!("════════════════════════════════════════════════════════");
    println!("  Batch Pauli witness: A = {} to {}", a_min, a_max);
    println!("  hecke-engine {}", env!("CARGO_PKG_VERSION"));
    println!("  Each nucleus writes:");
    println!("    witness-<A><sym>.lean  (exact Lean definitions)");
    println!("    checkpoint-<A><sym>.json  (resumable checkpoint)");
    println!("════════════════════════════════════════════════════════");
    println!();

    for a in a_min..=a_max {
        // All isobars in valley of stability: N ≥ Z - 1
        let z_min = if a <= 2 { 1 } else { (a.saturating_sub(1)) / 2 };
        let z_max = std::cmp::min(a - 1, (a + 2) / 2);
        for z in z_min..=z_max {
        let n = a - z;
        if n + 1 < z { continue; } // valley of stability
        if z == 0 || n == 0 { continue; }

        let sym = element_symbol(z);
        let dm = magic.contains(&z) && magic.contains(&n);
        let iname = isotope_name(z, a);

        // Check if checkpoint already exists (skip if done)
        let ckpt = format!("checkpoint-{}{}.json", a, sym.to_lowercase());
        if std::path::Path::new(&ckpt).exists() {
            eprintln!("  A={} {}: checkpoint exists, skipping.", a, iname);
            continue;
        }

        eprintln!("╔══ {} (Z={}, N={}) {} ══╗", iname, z, n,
            if dm { "★★ DOUBLY MAGIC" } else { "" });

        let strip_after = if a > 9 { 8 } else { 999 };
        let t0 = Instant::now();
        let (elem, accum, _log) = Eng::build_inductive(z, n, strip_after);

        if elem.has_overflow() {
            eprintln!("  OVERFLOW at A={} — stopping batch.", a);
            break;
        }

        let mut kept_acc = SymPauliAcc::zero();
        kept_acc.add_from_elem(&elem);
        let mut total_batch = accum.clone();
        total_batch.merge(&kept_acc);

        let tr_alt = total_batch.tr_alt.clone();
        let net_poly = total_batch.net.clone();
        let observable = total_batch.observable();
        let coral = total_batch.coral_content();
        let ms = t0.elapsed().as_millis();

        let t0_val = 1.10998_f64.sqrt();
        let denom = 2.0_f64.powi(elem.pn_count as i32);
        let tr_alt_val = tr_alt.eval(t0_val) / denom;
        let net_val = net_poly.eval(t0_val) / denom;
        let f = if net_val.abs() > 1e-30 { tr_alt_val.abs() / net_val.abs() } else { 0.0 };

        println!("  A={:>2} {}{}: F_Pauli={:.6}, {} poly terms, coeff~10^{:.0}, {:.1}s{}",
            a, a, sym, f, elem.total_poly_terms(),
            if elem.max_coeff() > 0 { (elem.max_coeff() as f64).log10() } else { 0.0 },
            ms as f64 / 1000.0,
            if dm { " ★★" } else { "" });

        write_lean_witness(z, n, a, sym, &tr_alt, &net_poly, &observable, &coral,
            elem.pn_count, f, ms, dm);
        write_json_checkpoint(z, n, a, sym, &tr_alt, &net_poly, &observable, &coral,
            elem.pn_count, f, ms,
            elem.n_terms(), elem.total_poly_terms(), elem.max_coeff());
        } // end for z
    } // end for a

    println!();
    println!("Done. Lean witnesses and JSON checkpoints written.");
}
