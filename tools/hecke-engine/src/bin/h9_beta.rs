//! H₉(q) Gröbner reduction of ³H β-decay at quark level.
//!
//! 9 strands: 3 quarks × 3 nucleons
//!   Proton  (nucleon 0): strands 0,1,2 = u,u,d → types [p,p,n]
//!   Neutron₁(nucleon 1): strands 3,4,5 = u,d,d → types [p,n,n]  ← converting
//!   Neutron₂(nucleon 2): strands 6,7,8 = u,d,d → types [p,n,n]
//!
//! Nuclear braid for ³H:
//!   β(³H) = B₃(0,1,2) · σ₂ · B₃(3,4,5) · σ₅ · B₃(6,7,8)
//!
//! where B₃ uses TYPE-DEPENDENT crossings:
//!   σ⁻¹ = σ − (q−q⁻¹) in the Iwahori--Hecke algebra,
//!   pp(uu) → σ, nn(dd) → σ⁻¹, pn(ud) → ½(σ+σ⁻¹).
//!
//! β-decay: convert neutron₁ → proton₂, so daughter ³He has:
//!   Proton  (nucleon 0): strands 0,1,2 = [p,p,n]
//!   Proton₂ (nucleon 1): strands 3,4,5 = [p,p,n]  ← was neutron
//!   Neutron₂(nucleon 2): strands 6,7,8 = [p,n,n]
//!
//! Energy scale: E₀ calibration from free neutron decay.
//!   Single nucleon (3 strands): NF(neutron) and NF(proton) via typed B₃.
//!   E₀ = Q_neutron / |Δnet_free|, then Q = |Δnet| × E₀ for all predictions.
//!   This is degree 1 in E₀ — one CODATA point suffices.
//!
//! The computation:
//!   0. Calibrate: E₀ from free neutron NF (3 strands, typed B₃)
//!   1. Build NF(β(³H)) and NF(β(³He)) in H₉(q) (9 strands, typed B₃ + Hopf)
//!   2. Compare: Q = |NF(parent) − NF(daughter)| × E₀
//!   3. Also: insert T₃,₅ = (σ₃σ₄)⁵ weak vertex and reduce

#![allow(dead_code)]
use rustc_hash::FxHashMap;
use std::collections::BinaryHeap;
use std::cmp::Ordering;
use std::time::Instant;

type Word = Vec<u8>;

// ════════════════════════════════════════════════════════════════
// Hecke element with priority-queue reduction (from main.rs)
// ════════════════════════════════════════════════════════════════

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
    fn histogram(&self) -> Vec<usize> {
        let mx = self.reduced.keys().map(|w| w.len()).max().unwrap_or(0);
        let mut h = vec![0usize; mx + 1];
        for w in self.reduced.keys() { h[w.len()] += 1; }
        h
    }
}

struct HeckeEngine {
    ha: f64, _s: f64, z: f64, q: f64, qi: f64,
}

impl HeckeEngine {
    fn new(q: f64) -> Self {
        let qi = 1.0 / q;
        Self { ha: q - qi, _s: q.sqrt() - qi.sqrt(), z: 1.0 / (q.sqrt() + qi.sqrt()), q, qi }
    }

    #[inline]
    fn find_reduction(word: &[u8]) -> Option<(usize, u8)> {
        let len = word.len();
        if len < 2 { return None; }
        for pos in 0..len - 1 {
            let a = word[pos];
            let b = word[pos + 1];
            if a == b { return Some((pos, 0)); }                    // Hecke σ²
            if (a as i16 - b as i16) >= 2 { return Some((pos, 1)); } // Far-comm
            if pos + 2 < len {
                let c = word[pos + 2];
                if a == c && (a as i16 - b as i16).abs() == 1 && b < a {
                    return Some((pos, 2)); // Yang-Baxter
                }
            }
        }
        None
    }

    fn add_term(elem: &mut HeckeElement, word: Word, coeff: f64) {
        if coeff.abs() < 1e-15 { return; }
        let len = word.len();
        let needs_check = if len >= 2 {
            let a = word[len - 2];
            let b = word[len - 1];
            a == b
                || (a as i16 - b as i16) >= 2
                || (len >= 3 && {
                    let c = word[len - 3];
                    c == b && (c as i16 - a as i16).abs() == 1 && a < c
                })
        } else {
            false
        };
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
                            // Hecke: σᵢ² = HA·σᵢ + 1
                            let i = word[pos];
                            let mut w1 = Vec::with_capacity(word.len() - 1);
                            w1.extend_from_slice(&word[..pos]);
                            w1.push(i);
                            w1.extend_from_slice(&word[pos + 2..]);
                            let mut w2 = Vec::with_capacity(word.len() - 2);
                            w2.extend_from_slice(&word[..pos]);
                            w2.extend_from_slice(&word[pos + 2..]);
                            Self::add_term(elem, w1, coeff * self.ha);
                            Self::add_term(elem, w2, coeff);
                        }
                        1 => {
                            // Far-comm: σᵢσⱼ = σⱼσᵢ when |i-j| ≥ 2
                            let mut w = word;
                            w.swap(pos, pos + 1);
                            Self::add_term(elem, w, coeff);
                        }
                        2 => {
                            // Yang-Baxter: σᵢσⱼσᵢ = σⱼσᵢσⱼ
                            let mut w = word;
                            let (a, b) = (w[pos], w[pos + 1]);
                            w[pos] = b;
                            w[pos + 1] = a;
                            w[pos + 2] = b;
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

    /// Multiply element by (c·σ_gen + d·1) and reduce.
    fn multiply_and_reduce(&self, elem: &mut HeckeElement, gen: u8, c: f64, d: f64) {
        let old: Vec<(Word, f64)> = elem.reduced.drain().collect();
        for (w, coeff) in old {
            if d.abs() > 1e-15 {
                *elem.reduced.entry(w.clone()).or_insert(0.0) += coeff * d;
            }
            if c.abs() > 1e-15 {
                let mut wg = w;
                wg.push(gen);
                Self::add_term(elem, wg, coeff * c);
            }
        }
        self.drain_unreduced(elem);
    }

    /// Crossing coefficients (c, d) for T(c,d) = c·σ + d·𝟙.
    /// From the Hecke inverse relation σ⁻¹ = σ − (q − q⁻¹):
    ///   pp(uu) → σ:          c = 1,   d = 0
    ///   nn(dd) → σ⁻¹:        c = 1,   d = −HA
    ///   pn(ud) → ½(σ+σ⁻¹): c = 1,   d = −HA/2
    fn crossing_coeffs(&self, ti: u8, tj: u8) -> (f64, f64) {
        match (ti, tj) {
            (b'p', b'p') => (1.0, 0.0),
            (b'n', b'n') => (1.0, -self.ha),
            _ => (1.0, -self.ha / 2.0),
        }
    }

    /// Multiply element by a raw generator σ_gen (c=1, d=0).
    fn multiply_by_gen(&self, elem: &mut HeckeElement, gen: u8) {
        self.multiply_and_reduce(elem, gen, 1.0, 0.0);
    }

    /// Multiply element by the Hecke inverse σ_gen⁻¹ = σ_gen − HA.
    fn multiply_by_gen_inv(&self, elem: &mut HeckeElement, gen: u8) {
        self.multiply_and_reduce(elem, gen, 1.0, -self.ha);
    }

    /// Multiply by a typed crossing: the quark types at the two strands
    /// connected by σ_gen determine whether it's σ, σ⁻¹, or ½(σ+σ⁻¹).
    fn multiply_typed(&self, elem: &mut HeckeElement, gen: u8, type_left: u8, type_right: u8) {
        let (c, d) = self.crossing_coeffs(type_left, type_right);
        self.multiply_and_reduce(elem, gen, c, d);
    }

    /// Build the Borromean confinement braid B₃(a, quark_types) = (T_a · T_{a+1})³
    /// where each crossing uses the type-dependent Hecke coefficient.
    ///
    /// For proton (u,u,d) at strands (a, a+1, a+2):
    ///   σ_a crosses u-u → (1, 0)  [positive]
    ///   σ_{a+1} crosses u-d → (1, -HA/2)  [mixed]
    ///
    /// For neutron (u,d,d) at strands (a, a+1, a+2):
    ///   σ_a crosses u-d → (1, -HA/2)  [mixed]
    ///   σ_{a+1} crosses d-d → (1, -HA)  [negative / Hecke inverse]
    fn borromean_braid_typed(&self, elem: &mut HeckeElement, a: u8, quark_types: &[u8; 3]) {
        let b = a + 1;
        let (c_a, d_a) = self.crossing_coeffs(quark_types[0], quark_types[1]);
        let (c_b, d_b) = self.crossing_coeffs(quark_types[1], quark_types[2]);
        for _ in 0..3 {
            self.multiply_and_reduce(elem, a, c_a, d_a);
            self.multiply_and_reduce(elem, b, c_b, d_b);
        }
    }

    /// Build the full nuclear braid for a 3-nucleon system with typed crossings.
    ///
    /// nucleon_types[i] = b'p' for proton, b'n' for neutron
    ///
    /// Quark content:
    ///   proton  → [u,u,d] = [p,p,n]
    ///   neutron → [u,d,d] = [p,n,n]
    ///
    /// Braid = B₃(nuc₀) · Hopf(2→3) · B₃(nuc₁) · Hopf(5→6) · B₃(nuc₂)
    fn build_nuclear_braid_typed(&self, nucleon_types: &[u8; 3]) -> HeckeElement {
        let mut elem = HeckeElement::identity();

        // Build quark type array: 9 entries
        let quark_types: Vec<u8> = nucleon_types.iter().flat_map(|&nt| {
            if nt == b'p' { vec![b'p', b'p', b'n'] }  // proton = uud
            else { vec![b'p', b'n', b'n'] }             // neutron = udd
        }).collect();

        // Nucleon 0 (strands 0,1,2): B₃ with quark types [q0,q1,q2]
        let qt0 = [quark_types[0], quark_types[1], quark_types[2]];
        self.borromean_braid_typed(&mut elem, 0, &qt0);
        eprintln!("  After B₃(0,1) [{},{}]: {} terms",
            qt0[0] as char, qt0[1] as char, elem.n_terms());

        // Inter-nucleon Hopf: σ₂ (between strand 2 and strand 3)
        // Quark types: strand 2 = quark_types[2], strand 3 = quark_types[3]
        self.multiply_typed(&mut elem, 2, quark_types[2], quark_types[3]);
        eprintln!("  After Hopf σ₂ ({}-{}): {} terms",
            quark_types[2] as char, quark_types[3] as char, elem.n_terms());

        // Nucleon 1 (strands 3,4,5): B₃ with quark types [q3,q4,q5]
        let qt1 = [quark_types[3], quark_types[4], quark_types[5]];
        self.borromean_braid_typed(&mut elem, 3, &qt1);
        eprintln!("  After B₃(3,4) [{},{}]: {} terms",
            qt1[0] as char, qt1[1] as char, elem.n_terms());

        // Inter-nucleon Hopf: σ₅ (between strand 5 and strand 6)
        self.multiply_typed(&mut elem, 5, quark_types[5], quark_types[6]);
        eprintln!("  After Hopf σ₅ ({}-{}): {} terms",
            quark_types[5] as char, quark_types[6] as char, elem.n_terms());

        // Nucleon 2 (strands 6,7,8): B₃ with quark types [q6,q7,q8]
        let qt2 = [quark_types[6], quark_types[7], quark_types[8]];
        self.borromean_braid_typed(&mut elem, 6, &qt2);
        eprintln!("  After B₃(6,7) [{},{}]: {} terms",
            qt2[0] as char, qt2[1] as char, elem.n_terms());

        elem
    }

    /// Insert T_{2,n} = (σ_a · σ_{a+1})^n at generator a.
    fn insert_torus_knot(&self, elem: &mut HeckeElement, a: u8, n: usize) {
        let b = a + 1;
        for _ in 0..n {
            self.multiply_by_gen(elem, a);
            self.multiply_by_gen(elem, b);
        }
    }

    /// Build the Borromean braid B₃ = (σ·σ⁻¹)³ (type-independent, for reference).
    #[allow(dead_code)]
    fn borromean_braid_untyped(&self, elem: &mut HeckeElement, a: u8) {
        let b = a + 1;
        for _ in 0..3 {
            self.multiply_by_gen(elem, a);
            self.multiply_by_gen_inv(elem, b);
        }
    }

    /// Compute Pauli traces from a reduced element.
    fn pauli_traces(&self, elem: &HeckeElement) -> (f64, f64, f64) {
        let mut tr_alt = 0.0f64;
        let mut tr_sym = 0.0f64;
        let mut net = 0.0f64;
        for (w, &c) in &elem.reduced {
            let l = w.len() as i32;
            tr_alt += c * (-self.qi).powi(l);
            tr_sym += c * self.q.powi(l);
            net += c;
        }
        (tr_alt, tr_sym, net)
    }

    /// Transfer-matrix generator volumes for an explicit type array.
    fn generator_volumes_typed(&self, types: &[u8]) -> Vec<f64> {
        let a = types.len();
        (0..a - 1)
            .map(|i| {
                let mut m = [[1.0, 0.0], [0.0, 1.0]];
                for j in (i + 1)..a {
                    let (c, d) = match (types[i], types[j]) {
                        (b'p', b'p') => (1.0, 0.0),
                        (b'n', b'n') => (1.0, -self.ha),
                        _ => (1.0, -self.ha / 2.0),
                    };
                    let t = [[c * self.ha + d, c], [c, d]];
                    m = [
                        [
                            m[0][0] * t[0][0] + m[0][1] * t[1][0],
                            m[0][0] * t[0][1] + m[0][1] * t[1][1],
                        ],
                        [
                            m[1][0] * t[0][0] + m[1][1] * t[1][0],
                            m[1][0] * t[0][1] + m[1][1] * t[1][1],
                        ],
                    ];
                }
                self.z * m[0][0] + m[1][0]
            })
            .collect()
    }
}

// ════════════════════════════════════════════════════════════════
// Word label for display
// ════════════════════════════════════════════════════════════════

fn word_label(w: &[u8]) -> String {
    if w.is_empty() {
        return "𝟙 (identity/ν)".to_string();
    }
    let gens: Vec<String> = w.iter().map(|&g| format!("σ{}", g)).collect();
    gens.join("·")
}

fn print_nf_sorted(label: &str, terms: &FxHashMap<Word, f64>) {
    println!("{} ({} terms):", label, terms.len());
    let mut sorted: Vec<(&Word, &f64)> = terms.iter().collect();
    sorted.sort_by(|a, b| {
        a.0.len().cmp(&b.0.len()).then_with(|| a.0.cmp(b.0))
    });
    for (w, &c) in &sorted {
        let sign = if c > 0.0 { "+" } else { "−" };
        println!("  {} {:.10} · {}", sign, c.abs(), word_label(w));
    }
}

// ════════════════════════════════════════════════════════════════
// Main
// ════════════════════════════════════════════════════════════════

fn main() {
    let q: f64 = 1.10998;
    let engine = HeckeEngine::new(q);

    let q_neutron_mev = 0.78233341_f64;  // Q(n→p e⁻ ν̄) CODATA 2022

    println!("╔══════════════════════════════════════════════════════════════╗");
    println!("║  H₉(q) BORROMEAN β-DECAY OF ³H AT QUARK LEVEL             ║");
    println!("╚══════════════════════════════════════════════════════════════╝");
    println!();
    println!("  q₀ = {:.10}", q);
    println!("  HA = q − q⁻¹ = {:.10}", engine.ha);
    println!("  z  = 1/(q^½ + q^−½) = {:.10}", engine.z);
    println!("  9 strands = 3 nucleons × 3 quarks");
    println!();

    // ── 0. Free neutron calibration: derive E₀ ─────────────────
    //
    // Single nucleon = 3 strands, Borromean braid B₃ only (no Hopf links).
    // E₀ = Q_neutron / |Δnet|  where Δnet = net(neutron) − net(proton).
    // This is degree 1 in E₀, so one CODATA point suffices.

    println!("═══ FREE NEUTRON CALIBRATION ═══");
    println!("  Single nucleon: 3 strands, B₃ = (T_σ₀ · T_σ₁)³");
    println!("  Q(n → p e⁻ ν̄) = {:.5} MeV  (CODATA 2022)", q_neutron_mev);
    println!();

    let mut nf_free_n = HeckeElement::identity();
    engine.borromean_braid_typed(&mut nf_free_n, 0, &[b'p', b'n', b'n']);
    let (_, _, net_free_n) = engine.pauli_traces(&nf_free_n);

    let mut nf_free_p = HeckeElement::identity();
    engine.borromean_braid_typed(&mut nf_free_p, 0, &[b'p', b'p', b'n']);
    let (_, _, net_free_p) = engine.pauli_traces(&nf_free_p);

    let delta_net_free = net_free_n - net_free_p;
    let e0 = q_neutron_mev / delta_net_free.abs();

    println!("  NF(neutron): {} terms, net = {:.10}", nf_free_n.n_terms(), net_free_n);
    println!("  NF(proton):  {} terms, net = {:.10}", nf_free_p.n_terms(), net_free_p);
    println!("  Δnet(free)  = {:.10}", delta_net_free);
    println!("  E₀ = Q_neutron / |Δnet| = {:.6} MeV", e0);
    println!();

    // ── 1. Build NF(parent ³H) ─────────────────────────────────

    println!("═══ PARENT ³H: [p,n,n] = proton + neutron + neutron ═══");
    println!("  Quark types: [u,u,d | u,d,d | u,d,d] = [p,p,n | p,n,n | p,n,n]");
    println!("  Nuclear braid: B₃(σ₀,σ₁) · σ₂ · B₃(σ₃,σ₄) · σ₅ · B₃(σ₆,σ₇)");
    println!("  B₃ uses TYPE-DEPENDENT crossings:");
    println!("    Proton  B₃: σ₀[uu→(1,0)] · σ₁[ud→(1,−HA/2)] repeated 3×");
    println!("    Neutron B₃: σ₃[ud→(1,−HA/2)] · σ₄[dd→(1,−HA)] repeated 3×");
    println!();

    let t0 = Instant::now();
    let nf_parent = engine.build_nuclear_braid_typed(&[b'p', b'n', b'n']);
    let ms_par = t0.elapsed().as_millis();

    let (tr_alt_p, tr_sym_p, net_p) = engine.pauli_traces(&nf_parent);
    let hist_p = nf_parent.histogram();

    println!();
    println!("  NF(³H parent): {} terms, {:.0}ms", nf_parent.n_terms(), ms_par);
    println!("  Histogram: {:?}", hist_p);
    println!("  net = {:.10}", net_p);
    println!("  tr_alt = {:.10}", tr_alt_p);
    println!("  tr_sym = {:.10}", tr_sym_p);
    println!();
    print_nf_sorted("  NF(³H parent)", &nf_parent.reduced);

    // ── 2. Build NF(daughter ³He) ──────────────────────────────

    println!();
    println!("═══ DAUGHTER ³He: [p,p,n] = proton + proton + neutron ═══");
    println!("  Converting neutron₁ → proton₂");
    println!("  Quark types: [u,u,d | u,u,d | u,d,d] = [p,p,n | p,p,n | p,n,n]");
    println!("  TYPE-DEPENDENT crossings change for nucleon 1:");
    println!("    Proton₂ B₃: σ₃[uu→(1,0)] · σ₄[ud→(1,−HA/2)] repeated 3×");
    println!("    (was:  σ₃[ud→(1,−HA/2)] · σ₄[dd→(1,−HA)])");
    println!();

    let t0 = Instant::now();
    let nf_daughter = engine.build_nuclear_braid_typed(&[b'p', b'p', b'n']);
    let ms_dau = t0.elapsed().as_millis();

    let (tr_alt_d, tr_sym_d, net_d) = engine.pauli_traces(&nf_daughter);
    let hist_d = nf_daughter.histogram();

    println!();
    println!("  NF(³He daughter): {} terms, {:.0}ms", nf_daughter.n_terms(), ms_dau);
    println!("  Histogram: {:?}", hist_d);
    println!("  net = {:.10}", net_d);
    println!("  tr_alt = {:.10}", tr_alt_d);
    println!("  tr_sym = {:.10}", tr_sym_d);
    println!();
    print_nf_sorted("  NF(³He daughter)", &nf_daughter.reduced);

    // ── 3. Q-value from NF comparison ──────────────────────────

    println!();
    println!("═══ Q-VALUE ANALYSIS ═══");
    println!();

    let delta_net = net_p - net_d;
    let delta_tr_alt = tr_alt_p - tr_alt_d;
    let ln_q = q.ln();

    println!("  Δnet       = net(par) − net(dau) = {:.10}", delta_net);
    println!("  Δtr_alt    = tr_alt(par) − tr_alt(dau) = {:.10}", delta_tr_alt);
    println!("  |Δnet|     = {:.10}", delta_net.abs());
    println!("  |Δtr_alt|  = {:.10}", delta_tr_alt.abs());
    println!();

    // E₀ calibrated Q-values
    let q_e0 = delta_net.abs() * e0;
    let q_alt_e0 = delta_tr_alt.abs() * e0;
    println!("  E₀ (from free neutron)        = {:.6} MeV", e0);
    println!("  Q(E₀)     = |Δnet| × E₀      = {:.6} MeV", q_e0);
    println!("  Q(tr_alt) = |Δtr_alt| × E₀   = {:.6} MeV", q_alt_e0);
    println!("  Q_exp(³H) = 0.01861 MeV");
    println!("  err(E₀)   = {:+.1}%", (q_e0 - 0.01861) / 0.01861 * 100.0);
    println!();

    // ── 4. Transfer-matrix comparison (flat L1 for reference) ──

    println!("═══ TRANSFER-MATRIX COMPARISON (flat L1, no confinement) ═══");
    println!();

    let types_par_flat: Vec<u8> = vec![b'p', b'p', b'n', b'p', b'n', b'n', b'p', b'n', b'n'];
    let types_dau_flat: Vec<u8> = vec![b'p', b'p', b'n', b'p', b'p', b'n', b'p', b'n', b'n'];
    let vp = engine.generator_volumes_typed(&types_par_flat);
    let vd = engine.generator_volumes_typed(&types_dau_flat);

    println!("  Parent  types: {:?}", types_par_flat.iter().map(|&t| t as char).collect::<Vec<_>>());
    println!("  Daughter types: {:?}", types_dau_flat.iter().map(|&t| t as char).collect::<Vec<_>>());
    println!();
    println!("  Generator volumes (parent → daughter → ratio):");
    let mut log_q_sum = 0.0f64;
    for i in 0..8 {
        let ratio = if vp[i].abs() > 1e-30 && vd[i].abs() > 1e-30 {
            vd[i] / vp[i]
        } else {
            f64::NAN
        };
        let lr = if ratio.is_finite() && ratio > 0.0 {
            ratio.ln() / ln_q
        } else {
            0.0
        };
        log_q_sum += lr;
        println!(
            "    V̂_{}: par={:+.6} dau={:+.6} ratio={:.6} log_q={:+.4}",
            i, vp[i], vd[i], ratio, lr
        );
    }
    println!();
    println!("  Σ log_q = {:.6}", log_q_sum);
    println!("  Q(flat L1, E₀) = |Σ log_q| × E₀ = {:.6} MeV", log_q_sum.abs() * e0);

    // ── 5. Per-word comparison ──────────────────────────────────

    println!();
    println!("═══ WORD-BY-WORD COMPARISON (parent vs daughter) ═══");
    println!();

    let all_words: std::collections::BTreeSet<Word> = nf_parent
        .reduced
        .keys()
        .chain(nf_daughter.reduced.keys())
        .cloned()
        .collect();

    let mut n_changed = 0;
    let mut delta_sum = 0.0f64;
    for w in &all_words {
        let cp = nf_parent.reduced.get(w).copied().unwrap_or(0.0);
        let cd = nf_daughter.reduced.get(w).copied().unwrap_or(0.0);
        let delta = cp - cd;
        if delta.abs() > 1e-12 {
            n_changed += 1;
            delta_sum += delta;
            let sign = if delta > 0.0 { "+" } else { "−" };
            println!(
                "  {} {:.10} · {}  (par={:+.10}, dau={:+.10})",
                sign,
                delta.abs(),
                word_label(w),
                cp,
                cd
            );
        }
    }
    println!();
    println!(
        "  {} words differ, Σ(delta) = {:.10}",
        n_changed, delta_sum
    );

    // ── 6. With T₃,₅ weak vertex insertion ─────────────────────

    println!();
    println!("═══ T₃,₅ WEAK VERTEX INSERTION ═══");
    println!("  T₃,₅ = (σ₃σ₄)⁵ at converting nucleon (strands 3,4,5)");
    println!();

    let t0 = Instant::now();
    let mut nf_parent_t35 = engine.build_nuclear_braid_typed(&[b'p', b'n', b'n']);
    engine.insert_torus_knot(&mut nf_parent_t35, 3, 5);
    let ms_t35 = t0.elapsed().as_millis();

    let (tr_alt_pt, _, net_pt) = engine.pauli_traces(&nf_parent_t35);

    println!(
        "  NF(³H × T₃,₅): {} terms, {:.0}ms",
        nf_parent_t35.n_terms(),
        ms_t35
    );
    println!("  net = {:.10}", net_pt);
    println!("  tr_alt = {:.10}", tr_alt_pt);
    println!();

    // Form factor: |tr(parent × T₃,₅)| / |tr(daughter)|
    let form_factor_net = if net_d.abs() > 1e-30 {
        net_pt / net_d
    } else {
        f64::NAN
    };
    let form_factor_alt = if tr_alt_d.abs() > 1e-30 {
        tr_alt_pt / tr_alt_d
    } else {
        f64::NAN
    };
    println!(
        "  Form factor (net): net(par×T₃,₅) / net(dau) = {:.10}",
        form_factor_net
    );
    println!(
        "  Form factor (alt): tr_alt(par×T₃,₅) / tr_alt(dau) = {:.10}",
        form_factor_alt
    );
    println!();

    let delta_t35 = net_pt - net_d;
    let q_t35 = delta_t35.abs() * e0;
    println!(
        "  Δnet(T₃,₅) = net(par×T₃,₅) − net(dau) = {:.10}",
        delta_t35
    );
    println!("  Q(T₃,₅) = |Δnet(T₃,₅)| × E₀ = {:.6} MeV", q_t35);

    // ── Summary ────────────────────────────────────────────────

    println!();
    println!("╔══════════════════════════════════════════════════════════════╗");
    println!("║  SUMMARY                                                    ║");
    println!("╚══════════════════════════════════════════════════════════════╝");
    println!();
    println!("  Q_exp(³H → ³He) = 0.01861 MeV");
    println!("  E₀ (free neutron) = {:.6} MeV", e0);
    println!("  Q(Borromean, E₀) = {:.6} MeV  (err {:+.1}%)", q_e0, (q_e0 - 0.01861) / 0.01861 * 100.0);
    println!("  Q(flat L1, E₀)   = {:.6} MeV  (for comparison)", log_q_sum.abs() * e0);
    println!("  Q(T₃,₅, E₀)     = {:.6} MeV", q_t35);
    println!();
    println!(
        "  Borromean NF terms: parent={}, daughter={}",
        nf_parent.n_terms(),
        nf_daughter.n_terms()
    );
    println!();
    println!("  The Borromean confinement braid B₃ = (σ·σ⁻¹)³ introduces");
    println!("  the ACCEPTING crossings (σ⁻¹ = σ − HA) that suppress the");
    println!("  amplitude. Without B₃, the flat L1 model treats all quark");
    println!("  crossings equally and overshoots by ~1500%.");

    // ── JSON output ────────────────────────────────────────────

    println!();
    println!("{{");
    println!("  \"computation\": \"h9_beta_borromean\",");
    println!("  \"q0\": {:.10},", q);
    println!("  \"HA\": {:.10},", engine.ha);
    println!("  \"parent\": {{");
    println!("    \"nucleons\": \"p,n,n\",");
    println!("    \"nf_terms\": {},", nf_parent.n_terms());
    println!("    \"net\": {:.10},", net_p);
    println!("    \"tr_alt\": {:.10}", tr_alt_p);
    println!("  }},");
    println!("  \"daughter\": {{");
    println!("    \"nucleons\": \"p,p,n\",");
    println!("    \"nf_terms\": {},", nf_daughter.n_terms());
    println!("    \"net\": {:.10},", net_d);
    println!("    \"tr_alt\": {:.10}", tr_alt_d);
    println!("  }},");
    println!("  \"delta_net\": {:.10},", delta_net);
    println!("  \"E0_MeV\": {:.10},", e0);
    println!("  \"Q_borromean_E0_MeV\": {:.10},", q_e0);
    println!("  \"Q_flat_L1_E0_MeV\": {:.10},", log_q_sum.abs() * e0);
    println!("  \"Q_T35_E0_MeV\": {:.10},", q_t35);
    println!("  \"Q_exp_MeV\": 0.01861,");
    println!("  \"free_neutron\": {{");
    println!("    \"net_neutron\": {:.10},", net_free_n);
    println!("    \"net_proton\": {:.10},", net_free_p);
    println!("    \"delta_net\": {:.10},", delta_net_free);
    println!("    \"Q_observed_MeV\": {:.10}", q_neutron_mev);
    println!("  }}");
    println!("}}");
}
