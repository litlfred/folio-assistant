// v6: Aggressive stripping at 30K threshold, fires inside multiply.
//
// Key insight: if all words in the element are already in canonical
// (reduced) form, then multiplying by (c·σ_k + d) only creates
// reducible pairs at the JUNCTION — the last char of w and the new σ_k.
//
// Instead of multiply-then-reduce-all, we:
// 1. For each word w, compute w·σ_k
// 2. Reduce ONLY at the junction (last 3 chars)
// 3. If a reduction produces a new word that's ALSO reducible at its
//    junction, propagate LEFT until stable
//
// This is O(L) per word (propagate at most L positions left) instead of
// O(n × L × passes) for the global reduce_all.
//
// For 30K words of length 30: v4 = 50s, v5 estimate = 0.5s (100× faster).

#![allow(unused_imports, dead_code)]
pub use rustc_hash::FxHashMap;
use std::time::Instant;

const GENS_PER_CHUNK: usize = 32;
const MAX_CHUNKS: usize = 4;
const MAX_WORD_LEN: usize = GENS_PER_CHUNK * MAX_CHUNKS;

#[derive(Clone, Copy, PartialEq, Eq, Hash)]
struct TreeWord {
    len: u8,
    chunks: [u128; MAX_CHUNKS],
}

impl TreeWord {
    const EMPTY: TreeWord = TreeWord { len: 0, chunks: [0; MAX_CHUNKS] };

    #[inline] fn len(self) -> usize { self.len as usize }

    #[inline]
    fn get(self, pos: usize) -> u8 {
        let (chunk, bit) = (pos / GENS_PER_CHUNK, (pos % GENS_PER_CHUNK) * 4);
        ((self.chunks[chunk] >> bit) & 0xF) as u8
    }

    #[inline]
    fn set(&mut self, pos: usize, val: u8) {
        let (chunk, bit) = (pos / GENS_PER_CHUNK, (pos % GENS_PER_CHUNK) * 4);
        self.chunks[chunk] = (self.chunks[chunk] & !(0xFu128 << bit)) | ((val as u128) << bit);
    }

    #[inline]
    fn push(self, gen: u8) -> TreeWord {
        let mut w = self; let l = self.len as usize;
        w.set(l, gen); w.len = (l + 1) as u8; w
    }

    fn drop_last(self) -> TreeWord {
        if self.len == 0 { return self; }
        let mut w = self; let l = self.len as usize;
        w.set(l - 1, 0); w.len = (l - 1) as u8; w
    }

    /// Remove generator at position pos, shifting everything after left.
    fn remove_at(self, pos: usize) -> TreeWord {
        let l = self.len as usize;
        let mut result = TreeWord { len: (l - 1) as u8, chunks: [0; MAX_CHUNKS] };
        let mut j = 0;
        for i in 0..l {
            if i == pos { continue; }
            result.set(j, self.get(i));
            j += 1;
        }
        result
    }

    /// Append σ_k to word w, then reduce at junction by propagating left.
    /// Returns a list of (word, coefficient_multiplier) pairs.
    /// Normally returns 1 pair; Hecke reduction returns 2.
    /// The key: reduction only propagates LEFT from the junction.
    fn push_and_reduce(self, gen: u8, ha: f64) -> Vec<(TreeWord, f64)> {
        let mut w = self.push(gen);
        let mut results = Vec::new();
        Self::reduce_from_right(&mut w, ha, &mut results, 1.0);
        results
    }

    /// Reduce a word starting from position `pos` and propagating left.
    /// Appends (word, coeff_scale) to results for each fully-reduced output.
    fn reduce_from_right(w: &mut TreeWord, ha: f64, results: &mut Vec<(TreeWord, f64)>, scale: f64) {
        let l = w.len();
        if l < 2 {
            results.push((*w, scale));
            return;
        }

        // Scan from right to left for the first reducible pair
        let mut pos = l - 2;
        loop {
            let a = w.get(pos);
            let b = w.get(pos + 1);

            // Hecke: σ_i²
            if a == b {
                // w1 = w with one copy removed (length - 1), scaled by ha
                let w1 = w.remove_at(pos + 1);
                // w2 = w with both removed (length - 2), scaled by 1
                let w2 = w1.remove_at(pos);
                // Recurse on both (they might have new reducible pairs)
                let mut w1m = w1;
                Self::reduce_from_right(&mut w1m, ha, results, scale * ha);
                let mut w2m = w2;
                Self::reduce_from_right(&mut w2m, ha, results, scale);
                return;
            }

            // Far-comm: σ_i σ_j with i > j, |i-j| >= 2 → swap
            if (a as i16 - b as i16) >= 2 {
                w.set(pos, b);
                w.set(pos + 1, a);
                // After swap, check if the swapped position creates a new pair to the LEFT
                if pos > 0 {
                    // Continue scanning left
                    pos -= 1;
                    continue;
                } else {
                    // At the leftmost position, done
                    results.push((*w, scale));
                    return;
                }
            }

            // YB: σ_i σ_j σ_i with j < i, |i-j| = 1 → (j,i,j)
            if pos + 2 < l {
                let c = w.get(pos + 2);
                if a == c && (a as i16 - b as i16).abs() == 1 && b < a {
                    w.set(pos, b);
                    w.set(pos + 1, a);
                    w.set(pos + 2, b);
                    // After YB, the leftmost of the triple might create new pair
                    if pos > 0 {
                        pos -= 1;
                        continue;
                    } else {
                        results.push((*w, scale));
                        return;
                    }
                }
            }

            // No reduction at this position. Check further left.
            if pos == 0 { break; }
            pos -= 1;
        }

        // Fully reduced
        results.push((*w, scale));
    }

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

impl std::fmt::Debug for TreeWord {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let l = self.len();
        if l == 0 { return write!(f, "𝟏"); }
        for i in 0..l { if i > 0 { write!(f, ".")?; } write!(f, "σ{}", self.get(i))?; }
        Ok(())
    }
}

struct HeckeElem {
    terms: FxHashMap<TreeWord, f64>,
}

impl HeckeElem {
    fn new() -> Self { Self { terms: FxHashMap::default() } }
    fn identity() -> Self { let mut h = Self::new(); h.terms.insert(TreeWord::EMPTY, 1.0); h }
    fn n_terms(&self) -> usize { self.terms.len() }
    fn clean(&mut self) { self.terms.retain(|_, c| c.abs() > 1e-15); }
    fn histogram(&self) -> Vec<usize> {
        let mx = self.terms.keys().map(|w| w.len()).max().unwrap_or(0);
        let mut h = vec![0usize; mx + 1];
        for w in self.terms.keys() { h[w.len()] += 1; }
        h
    }
    fn memory_bytes(&self) -> usize { self.terms.len() * 96 }
}

#[derive(Default, Clone)]
struct PauliAcc {
    tr_alt: f64, tr_sym: f64, net: f64,
    per_length_net: Vec<f64>,
    per_length_abs: Vec<f64>,
    per_length_count: Vec<u64>,
}

impl PauliAcc {
    fn add(&mut self, coeff: f64, word_len: usize, q: f64, qi: f64) {
        self.tr_alt += coeff * (-qi).powi(word_len as i32);
        self.tr_sym += coeff * q.powi(word_len as i32);
        self.net += coeff;
        while self.per_length_net.len() <= word_len {
            self.per_length_net.push(0.0);
            self.per_length_abs.push(0.0);
            self.per_length_count.push(0);
        }
        self.per_length_net[word_len] += coeff;
        self.per_length_abs[word_len] += coeff.abs();
        self.per_length_count[word_len] += 1;
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
        for (i, (&n, &a)) in other.per_length_net.iter().zip(other.per_length_abs.iter()).enumerate() {
            while self.per_length_net.len() <= i {
                self.per_length_net.push(0.0); self.per_length_abs.push(0.0); self.per_length_count.push(0);
            }
            self.per_length_net[i] += n;
            self.per_length_abs[i] += a;
            self.per_length_count[i] += other.per_length_count.get(i).copied().unwrap_or(0);
        }
    }
    fn shell_factor(&self) -> f64 {
        let w_opt: f64 = self.per_length_abs.iter().take(2).sum();
        let w_total: f64 = self.per_length_abs.iter().sum();
        if w_total > 0.0 { w_opt / w_total } else { 0.0 }
    }
    fn palindromic_defect(&self) -> f64 {
        let n = self.per_length_abs.len();
        if n == 0 { return 0.0; }
        let total: f64 = self.per_length_abs.iter().sum();
        if total < 1e-30 { return 0.0; }
        let defect: f64 = (0..n).map(|i| {
            let dual = n - 1 - i;
            (self.per_length_abs[i] - self.per_length_abs.get(dual).copied().unwrap_or(0.0)).abs()
        }).sum();
        defect / total
    }
}

struct Engine { ha: f64, q: f64, qi: f64 }

impl Engine {
    fn new(q: f64) -> Self { let qi = 1.0/q; Self { ha: q-qi, q, qi } }

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

    /// Multiply element by (c·σ_gen + d) using push_and_reduce.
    /// No global reduce_all — each word is reduced locally at the junction.
    fn multiply_canonical(&self, elem: &mut HeckeElem, gen: u8, c: f64, d: f64) {
        let old: Vec<(TreeWord, f64)> = elem.terms.drain().collect();
        for (w, coeff) in old {
            if d.abs() > 1e-15 {
                // d·w — same word, already canonical
                *elem.terms.entry(w).or_insert(0.0) += coeff * d;
            }
            if c.abs() > 1e-15 {
                // c·(w·σ_gen) — push and reduce at junction
                let outputs = w.push_and_reduce(gen, self.ha);
                for (w_out, scale) in outputs {
                    *elem.terms.entry(w_out).or_insert(0.0) += coeff * c * scale;
                }
            }
        }
        elem.clean();
    }

    /// Multiply with mid-step quotient if terms exceed threshold.
    fn multiply_canonical_bounded(&self, elem: &mut HeckeElem, gen: u8, c: f64, d: f64,
                                   accum: &mut PauliAcc, max_terms: usize) {
        self.multiply_canonical(elem, gen, c, d);
        if elem.n_terms() > max_terms {
            // Accumulate ALL per-length data before stripping
            let all_data = PauliAcc::from_elem(elem, self.q, self.qi);
            accum.merge(&all_data);
            self.apply_quotient_strip_only(&mut elem.terms);
        }
    }

    fn apply_quotient_with_pauli(&self, terms: &mut FxHashMap<TreeWord, f64>) -> PauliAcc {
        let mut removed = PauliAcc::default();
        // I₉: strip ALL terms whose prefix exists, in one pass per length level.
        // Process from longest to shortest: remove length L terms whose
        // length L-1 prefix exists, then L-1 terms whose L-2 prefix exists, etc.
        let max_len = terms.keys().map(|w| w.len()).max().unwrap_or(0);
        for target_len in (2..=max_len).rev() {
            let to_remove: Vec<TreeWord> = terms.keys()
                .filter(|w| w.len() == target_len && terms[*w].abs() > 1e-15)
                .filter(|w| {
                    let prefix = w.drop_last();
                    terms.get(&prefix).map_or(false, |c| c.abs() > 1e-15)
                })
                .cloned()
                .collect();
            for word in to_remove {
                let coeff = terms.remove(&word).unwrap_or(0.0);
                removed.add(coeff, word.len(), self.q, self.qi);
            }
        }
        // I₈: strip adjacency pairs in one pass
        let adj_remove: Vec<TreeWord> = terms.keys()
            .filter(|w| w.len() == 2 && terms[*w].abs() > 1e-15 && w.get(1) == w.get(0) + 1)
            .filter(|w| {
                let sigma_j = TreeWord::EMPTY.push(w.get(1));
                terms.get(&sigma_j).map_or(false, |c| c.abs() > 1e-15)
            })
            .cloned()
            .collect();
        for word in adj_remove {
            let coeff = terms.remove(&word).unwrap_or(0.0);
            removed.add(coeff, 2, self.q, self.qi);
        }
        terms.retain(|_, c| c.abs() > 1e-15);
        removed
    }

    /// Strip only — no accumulation (data already captured).
    fn apply_quotient_strip_only(&self, terms: &mut FxHashMap<TreeWord, f64>) {
        let max_len = terms.keys().map(|w| w.len()).max().unwrap_or(0);
        for target_len in (2..=max_len).rev() {
            let to_remove: Vec<TreeWord> = terms.keys()
                .filter(|w| w.len() == target_len && terms[*w].abs() > 1e-15)
                .filter(|w| {
                    let prefix = w.drop_last();
                    terms.get(&prefix).map_or(false, |c| c.abs() > 1e-15)
                })
                .cloned().collect();
            for word in to_remove { terms.remove(&word); }
        }
        let adj_remove: Vec<TreeWord> = terms.keys()
            .filter(|w| w.len() == 2 && terms[*w].abs() > 1e-15 && w.get(1) == w.get(0) + 1)
            .filter(|w| {
                let sigma_j = TreeWord::EMPTY.push(w.get(1));
                terms.get(&sigma_j).map_or(false, |c| c.abs() > 1e-15)
            })
            .cloned().collect();
        for word in adj_remove { terms.remove(&word); }
        terms.retain(|_, c| c.abs() > 1e-15);
    }

    fn analyze_patterns(terms: &FxHashMap<TreeWord, f64>, top_n: usize) -> Vec<(Vec<u8>, usize, f64)> {
        let mut suffix_counts: FxHashMap<Vec<u8>, (usize, f64)> = FxHashMap::default();
        for (word, &coeff) in terms {
            let l = word.len();
            for pat_len in 2..=std::cmp::min(4, l) {
                let mut suffix = Vec::with_capacity(pat_len);
                for j in (l - pat_len)..l { suffix.push(word.get(j)); }
                let entry = suffix_counts.entry(suffix).or_insert((0, 0.0));
                entry.0 += 1; entry.1 += coeff.abs();
            }
        }
        let mut patterns: Vec<(Vec<u8>, usize, f64)> = suffix_counts.into_iter()
            .map(|(pat, (count, weight))| (pat, count, weight)).collect();
        patterns.sort_by(|a, b| b.1.cmp(&a.1));
        patterns.truncate(top_n);
        patterns
    }

    fn build_nucleus_pauli(&self, z: usize, n: usize, quotient_after: usize)
        -> (HeckeElem, PauliAcc)
    {
        let a = z + n;
        let mut types = vec![b'p'; z];
        types.extend(vec![b'n'; n]);
        let mut elem = HeckeElem::identity();
        let mut accum = PauliAcc::default();
        let t_start = Instant::now();
        let max_terms = if a > quotient_after { 30_000 } else { usize::MAX };

        for k in 1..a {
            let _t_strand = Instant::now();
            for i in 0..k {
                let t_cross = Instant::now();
                let n_before = elem.n_terms();
                let (c, d) = self.crossing_coeffs(types[i], types[k]);
                self.multiply_canonical_bounded(&mut elem, i as u8, c, d, &mut accum, max_terms);
                let cross_ms = t_cross.elapsed().as_millis();
                if cross_ms > 200 || elem.n_terms() > 10000 {
                    let stripped = if elem.n_terms() < n_before * 2 / 3 { " [stripped]" } else { "" };
                    eprintln!("    crossing ({},{}) {}-{}: {} → {} terms, {}ms{}",
                        i, k, types[i] as char, types[k] as char,
                        n_before, elem.n_terms(), cross_ms, stripped);
                }
            }

            let n_before = elem.n_terms();
            if a > quotient_after && k < a - 1 {
                // Accumulate ALL terms' per-length data BEFORE stripping.
                // This ensures short-length terms (lengths 0, 1) that survive
                // stripping are still captured in the per-length distribution.
                let all_terms_acc = PauliAcc::from_elem(&elem, self.q, self.qi);
                accum.merge(&all_terms_acc);

                if n_before > 1000 {
                    let patterns = Self::analyze_patterns(&elem.terms, 5);
                    eprintln!("    top suffixes: {}",
                        patterns.iter().map(|(pat, cnt, wt)| {
                            let ps: String = pat.iter().map(|g| format!("σ{}", g)).collect::<Vec<_>>().join("·");
                            format!("{}(×{}, w={:.2})", ps, cnt, wt)
                        }).collect::<Vec<_>>().join("  "));
                }
                let mut terms = std::mem::take(&mut elem.terms);
                // Strip but DON'T accumulate again (already accumulated above)
                self.apply_quotient_strip_only(&mut terms);
                elem.terms = terms;
            }

            let mem_mb = elem.memory_bytes() as f64 / 1_048_576.0;
            let elapsed = t_start.elapsed().as_secs_f64();
            // For running estimate: accum has data from all STRIPPED strands.
            // Add current elem (not yet stripped) for the running total.
            // Don't double-count: if this strand was just accumulated+stripped,
            // accum already has it, and elem has only the kept terms.
            let mut running = accum.clone();
            // Only add elem terms if they weren't just accumulated
            if !(a > quotient_after && k < a - 1) {
                for (w, &c) in &elem.terms { running.add(c, w.len(), self.q, self.qi); }
            }
            let f_running = if running.net.abs() > 1e-30 { running.tr_alt.abs() / running.net.abs() } else { 0.0 };

            if n_before != elem.n_terms() {
                eprintln!("  strand {}/{}: {} → {} terms, {:.0}MB, {:.1}s total  F≈{:.4}",
                    k, a-1, n_before, elem.n_terms(), mem_mb, elapsed, f_running);
            } else {
                eprintln!("  strand {}/{}: {} terms, {:.0}MB, {:.1}s total  F≈{:.4}",
                    k, a-1, elem.n_terms(), mem_mb, elapsed, f_running);
            }
        }

        // Verify all terms are reduced
        let unreduced: usize = elem.terms.keys().filter(|w| w.find_reduction().is_some()).count();
        if unreduced > 0 {
            eprintln!("  WARNING: {} unreduced terms remain!", unreduced);
        }

        (elem, accum)
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
        eprintln!("Usage: v5 pauli Z N | pauli A_max | bench A");
        std::process::exit(1);
    }

    match args[1].as_str() {
        "bench" => {
            // Quick benchmark: build N(Z,Z) for Z = A/2
            let a: usize = args[2].parse().unwrap();
            let z = a / 2; let n = a - z;
            eprintln!("Benchmark: N({},{}) A={}", z, n, a);
            let t0 = Instant::now();
            let (elem, _) = engine.build_nucleus_pauli(z, n, if a <= 8 { 999 } else { 8 });
            eprintln!("  {} terms, {}ms", elem.n_terms(), t0.elapsed().as_millis());
        }

        "pauli" => {
            let z: usize = args.get(2).and_then(|s| s.parse().ok()).unwrap_or(0);
            let n: usize = args.get(3).and_then(|s| s.parse().ok()).unwrap_or(0);

            if z > 0 && n > 0 {
                let a = z + n;
                let sym = match z {1=>"H",2=>"He",3=>"Li",4=>"Be",5=>"B",6=>"C",7=>"N",8=>"O",9=>"F",10=>"Ne",_=>"?"};
                let magic = [2,8,20,28,50,82,126];
                let z_magic = magic.contains(&z);
                let n_magic = magic.contains(&n);
                let doubly_magic = z_magic && n_magic;
                let parity = match (z % 2, n % 2) { (0,0)=>"even-even", (1,1)=>"odd-odd", _=>"mixed" };

                println!("════════════════════════════════════════════════════════");
                println!("  Pauli witness for {}{}  (Z={}, N={}, A={})", a, sym, z, n, a);
                println!("  Parity: {}{}", parity,
                    if doubly_magic { " ★★ DOUBLY MAGIC" }
                    else if z_magic { " (Z magic)" }
                    else if n_magic { " (N magic)" }
                    else { "" });
                println!("  v5: canonical-form maintenance (no global reduction)");
                println!("════════════════════════════════════════════════════════");
                println!();

                let t0 = Instant::now();
                let use_q = if a <= 8 { 999 } else { 8 };
                let (elem, accum) = engine.build_nucleus_pauli(z, n, use_q);

                let kept = PauliAcc::from_elem(&elem, engine.q, engine.qi);
                let mut total_acc = accum.clone();
                total_acc.merge(&kept);
                let tr_alt = total_acc.tr_alt;
                let net = total_acc.net;
                let f = if net.abs() > 1e-30 { tr_alt.abs() / net.abs() } else { 0.0 };
                let _pal = is_palindromic(&elem.histogram());
                let ms = t0.elapsed().as_millis();
                let mem = elem.memory_bytes() as f64 / 1_048_576.0;

                println!();
                println!("════════════════════════════════════════════════════════");
                println!("  RESULT: {}{}  (Z={}, N={}, A={})", a, sym, z, n, a);
                println!("  Terms: {}, {:.1}MB, {:.1}s", elem.n_terms(), mem, ms as f64 / 1000.0);
                println!("  tr_alt = {:+.10}", tr_alt);
                println!("  net    = {:+.10}", net);
                println!("  F_Pauli^({}) = {:.6}", a, f);
                println!("  Shell factor = {:.6}", total_acc.shell_factor());
                println!("  Palindromic defect = {:.6}", total_acc.palindromic_defect());
                println!("════════════════════════════════════════════════════════");

                // Lean witness output
                let lean_sym = sym.to_lowercase();
                println!();
                println!("-- LEAN WITNESS (QOU/Descartes/PauliWitness.lean)");
                println!("-- NUMERICAL witness at q₀ = {:.5} (f64, not symbolic in q).", engine.q);
                println!("-- For symbolic (exact in q): use pauli-witness.py (A ≤ 7).");
                println!("-- {} terms, {:.1}MB, {:.1}s", elem.n_terms(), mem, ms as f64 / 1000.0);
                println!();
                println!("/-- F_Pauli for {}{} (Z={}, N={}) evaluated at q₀ = {:.5}.", a, sym, z, n, engine.q);
                if doubly_magic { println!("    Doubly magic nucleus (Z and N both magic)."); }
                println!("    This is a NUMERICAL witness. The exact value is a");
                println!("    rational function of q, computable symbolically for A ≤ 7.");
                println!("    tr_alt(q₀) = {:+.10e}", tr_alt);
                println!("    net(q₀)    = {:+.10e}", net);
                println!("    F_Pauli(q₀) = |tr_alt/net| = {:.10} -/", f);
                println!("-- Ref: [litlfred2025] https://doi.org/10.xxxx/qou");
                println!("noncomputable def F_Pauli_{}{}_at_q0 : Float := {:.10}", a, lean_sym, f);
                println!();
                println!("/-- Shell factor for {}{}: W(ℓ≤1)/W(total). -/", a, sym);
                println!("noncomputable def shell_factor_{}{} : Float := {:.10}", a, lean_sym, total_acc.shell_factor());
                println!();
                println!("/-- Palindromic defect for {}{}: δ = Σ|W(ℓ)−W(L−ℓ)|/ΣW(ℓ). -/", a, sym);
                println!("noncomputable def pal_defect_{}{} : Float := {:.10}", a, lean_sym, total_acc.palindromic_defect());
                println!();
                // Per-length weight as a list
                let max_disp = total_acc.per_length_abs.len();
                if max_disp > 0 && max_disp <= 200 {
                    println!("/-- Per-length weight distribution W(ℓ) for {}{}.", a, sym);
                    println!("    W(ℓ) = Σ_{{|w|=ℓ}} |c_w| at q₀. -/");
                    print!("noncomputable def weight_dist_{}{} : List Float := [", a, lean_sym);
                    for (i, w) in total_acc.per_length_abs.iter().enumerate() {
                        if i > 0 { print!(", "); }
                        print!("{:.6e}", w);
                    }
                    println!("]");
                }
            } else {
                let a_max: usize = args.get(2).and_then(|s| s.parse().ok()).unwrap_or(8);
                println!("F_PAULI TABLE (A ≤ {}, v5 canonical)", a_max);
                for zz in 1..=a_max {
                    let n_min = if zz<=1 {1} else {zz.saturating_sub(1)};
                    for nn in n_min..=(zz+2) {
                        let a = zz+nn;
                        if a < 2 || a > a_max || nn+1 < zz { continue; }
                        let t0 = Instant::now();
                        let use_q = if a <= 8 { 999 } else { 8 };
                        let (elem, accum) = engine.build_nucleus_pauli(zz, nn, use_q);
                        let kept = PauliAcc::from_elem(&elem, engine.q, engine.qi);
                        let mut total = accum.clone(); total.merge(&kept);
                        let f = if total.net.abs()>1e-30 { total.tr_alt.abs()/total.net.abs() } else { 0.0 };
                        let _pal = is_palindromic(&elem.histogram());
                        println!("{:>12} {:>3} {:>10.6} {:>3} {:>8}ms",
                            nucleus_name(zz,nn), a, f,
                            if _pal {"Y"} else {" "}, t0.elapsed().as_millis());
                    }
                }
            }
        }

        _ => { eprintln!("Unknown: {}", args[1]); std::process::exit(1); }
    }
}
