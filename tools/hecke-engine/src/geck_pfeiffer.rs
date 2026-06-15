//! F3.2.γ scaffolding: Geck-Pfeiffer minimal-length reduction.
//!
//! For the Iwahori-Hecke algebra `H_n(q)`, every element `T_β` arising
//! from a positive braid word has an expansion in the canonical basis
//! `{T_w : w ∈ S_n}`:
//!
//!   `T_β = Σ_{w ∈ S_n} c_w(q) · T_w`
//!
//! where the coefficients `c_w(q)` are Laurent polynomials in q.  This
//! module computes that expansion via the standard Hecke multiplication
//! rules, exposing it for use by q-MN character evaluation and the
//! discovery cache.
//!
//! ## Multiplication rules (Bourbaki LIE IV §2)
//!
//! For a simple reflection `s_i` and `w ∈ S_n`:
//!
//!   T_{s_i} · T_w = T_{s_i w}                 if ℓ(s_i w) > ℓ(w)
//!   T_{s_i} · T_w = T_{s_i w} + (q − q^{-1}) · T_w   if ℓ(s_i w) < ℓ(w)
//!
//! Equivalently, for the right action:
//!
//!   T_w · T_{s_i} = T_{w s_i}                 if ℓ(w s_i) > ℓ(w)
//!   T_w · T_{s_i} = T_{w s_i} + (q − q^{-1}) · T_w   if ℓ(w s_i) < ℓ(w)
//!
//! For inverse generators we use the Hecke relation `T_{s_i}^{-1} =
//! T_{s_i} − (q − q^{-1})`.
//!
//! ## Status
//!
//! This is **scaffolding** for F3.2.γ.  The full implementation
//! requires:
//!
//!   1. ✅ Permutation type (cycle representation or one-line form)
//!   2. ✅ Length function ℓ(w) = #inversions(w)
//!   3. ✅ Hecke basis multiplication primitives (Tw_mul_Ts)
//!   4. ✅ Word-to-Hecke expansion: T_β = Σ c_w · T_w
//!   5. 🚧 Memoization across multiplications
//!   6. 🚧 PyO3 export
//!   7. 🚧 Cross-validation with seminormal at q_0 on full atomic braids
//!
//! Cost: a single `T_β` expansion has worst-case O(n! · word_len)
//! coefficients but typical (sparse) braid words give smaller spans.

use crate::laurent_poly_q::LaurentPolyQ;
use std::collections::BTreeMap;

/// Permutation of `n` elements as a one-line representation (i.e.
/// `perm[i] = w(i)`, 0-indexed).
#[derive(Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Debug)]
pub struct Perm(pub Vec<usize>);

impl Perm {
    pub fn identity(n: usize) -> Self {
        Self((0..n).collect())
    }

    pub fn n(&self) -> usize {
        self.0.len()
    }

    /// Apply the simple transposition `s_i` (swap positions i, i+1)
    /// on the right: `w · s_i`.  This is the same as swapping
    /// `perm[i]` and `perm[i+1]`.
    pub fn apply_s_right(&mut self, i: usize) {
        if i + 1 < self.0.len() {
            self.0.swap(i, i + 1);
        }
    }

    /// Apply `s_i` on the left: `s_i · w`.  This swaps the positions
    /// where the elements `i` and `i+1` appear in the one-line form.
    pub fn apply_s_left(&mut self, i: usize) {
        // Find positions of i and i+1 in self.0 and swap their values.
        let mut pos_i = None;
        let mut pos_i1 = None;
        for (k, &v) in self.0.iter().enumerate() {
            if v == i { pos_i = Some(k); }
            if v == i + 1 { pos_i1 = Some(k); }
        }
        if let (Some(a), Some(b)) = (pos_i, pos_i1) {
            self.0.swap(a, b);
        }
    }

    /// Number of inversions = ℓ(w).
    pub fn length(&self) -> usize {
        let mut count = 0;
        for i in 0..self.0.len() {
            for j in (i + 1)..self.0.len() {
                if self.0[i] > self.0[j] {
                    count += 1;
                }
            }
        }
        count
    }
}

/// Element of `H_n(q)` as a sparse map `w → c_w(q)` in the T_w basis.
pub type HeckeElement = BTreeMap<Perm, LaurentPolyQ>;

/// Identity in the Hecke basis: `1 = T_e`.
pub fn hecke_identity(n: usize) -> HeckeElement {
    let mut m = BTreeMap::new();
    m.insert(Perm::identity(n), LaurentPolyQ::one());
    m
}

/// Right-multiply a Hecke element `x` by `T_{s_i}` (positive simple
/// generator).  Returns `x · T_{s_i}`.
pub fn hecke_mul_ts_right(x: &HeckeElement, i: usize) -> HeckeElement {
    let h = LaurentPolyQ::hecke_h();  // q − q^{-1}
    let mut result: HeckeElement = BTreeMap::new();
    for (w, c) in x {
        let l_w = w.length();
        let mut w_si = w.clone();
        w_si.apply_s_right(i);
        let l_w_si = w_si.length();
        if l_w_si > l_w {
            // T_w · T_{s_i} = T_{w s_i}.
            let entry = result.entry(w_si).or_insert_with(LaurentPolyQ::zero);
            *entry += c;
        } else {
            // T_w · T_{s_i} = T_{w s_i} + (q − q^{-1}) · T_w.
            let entry = result.entry(w_si).or_insert_with(LaurentPolyQ::zero);
            *entry += c;
            let h_c = h.clone() * c.clone();
            let entry2 = result.entry(w.clone()).or_insert_with(LaurentPolyQ::zero);
            *entry2 += &h_c;
        }
    }
    // Strip zero entries.
    result.retain(|_, v| !v.is_zero());
    result
}

/// **Left-multiply** a Hecke element `x` by `T_{s_i}` — returns
/// `T_{s_i} · x`.
///
///   T_{s_i} · T_w = T_{s_i w}                 if ℓ(s_i w) > ℓ(w)
///   T_{s_i} · T_w = T_{s_i w} + (q − q⁻¹) · T_w   if ℓ(s_i w) < ℓ(w)
pub fn hecke_mul_ts_left(x: &HeckeElement, i: usize) -> HeckeElement {
    let h = LaurentPolyQ::hecke_h();
    let mut result: HeckeElement = BTreeMap::new();
    for (w, c) in x {
        let l_w = w.length();
        let mut s_w = w.clone();
        s_w.apply_s_left(i);
        let l_s_w = s_w.length();
        if l_s_w > l_w {
            let entry = result.entry(s_w).or_insert_with(LaurentPolyQ::zero);
            *entry += c;
        } else {
            let entry = result.entry(s_w).or_insert_with(LaurentPolyQ::zero);
            *entry += c;
            let h_c = h.clone() * c.clone();
            let entry2 = result.entry(w.clone()).or_insert_with(LaurentPolyQ::zero);
            *entry2 += &h_c;
        }
    }
    result.retain(|_, v| !v.is_zero());
    result
}

/// **Left-multiply** by `T_{s_i}^{-1} = T_{s_i} − (q − q⁻¹)`.
pub fn hecke_mul_ts_inv_left(x: &HeckeElement, i: usize) -> HeckeElement {
    let h = LaurentPolyQ::hecke_h();
    let mut result = hecke_mul_ts_left(x, i);
    for (w, c) in x {
        let h_c = h.clone() * c.clone();
        let entry = result.entry(w.clone()).or_insert_with(LaurentPolyQ::zero);
        *entry -= &h_c;
    }
    result.retain(|_, v| !v.is_zero());
    result
}

/// **Hecke conjugation by T_{s_i}**: returns `T_{s_i} · x · T_{s_i}⁻¹`.
///
/// For class function evaluation: `χ_λ(T_{s_i} · x · T_{s_i}⁻¹) = χ_λ(x)`.
pub fn hecke_conjugate_by_s(x: &HeckeElement, i: usize) -> HeckeElement {
    let after_left = hecke_mul_ts_left(x, i);
    hecke_mul_ts_inv_right(&after_left, i)
}

/// Right-multiply by `T_{s_i}^{-1} = T_{s_i} − (q − q^{-1})`.
pub fn hecke_mul_ts_inv_right(x: &HeckeElement, i: usize) -> HeckeElement {
    let h = LaurentPolyQ::hecke_h();
    // x · T_{s_i}^{-1} = x · T_{s_i} − (q − q^{-1}) · x.
    let mut result = hecke_mul_ts_right(x, i);
    for (w, c) in x {
        let h_c = h.clone() * c.clone();
        let entry = result.entry(w.clone()).or_insert_with(LaurentPolyQ::zero);
        *entry -= &h_c;
    }
    result.retain(|_, v| !v.is_zero());
    result
}

/// Right-multiply by `2 · (σ + σ⁻¹)/2 = σ + σ⁻¹`, i.e. the **doubled
/// averaged crossing**.
///
/// **Why doubled**: the averaged Hecke crossing as a matrix is
/// `(σ + σ⁻¹) / 2 = σ − h/2 · I` (via the Hecke relation
/// `σ² = h · σ + I` ⇒ `σ⁻¹ = σ − h`).  Including the `/2` factor in
/// the Hecke-basis expansion would require rational coefficients in
/// `LaurentPolyQ`, which currently uses `BigInt`.  Instead we compute
/// the **doubled** version `(σ + σ⁻¹) · x = 2 · σ x − h · x` here,
/// and the caller tracks a separate `2^k` divisor (one factor of 2 per
/// averaged crossing in the word).  [`chi_lambda_via_gp_hoefsmit`]
/// divides the final χ^λ output by `2^k` to absorb the deferred
/// normalisation.
///
/// Returns a single Hecke element — **no basis branching**.  Despite
/// the half-sum semantics, the basis grows the same as for a single
/// σ-application (NOT doubled per averaged crossing the way a literal
/// 2^k expansion would).  This is the structural win that makes GP
/// viable for canonical atomic braids with averaged crossings.
pub fn hecke_mul_ts_averaged_right(x: &HeckeElement, i: usize) -> HeckeElement {
    let h = LaurentPolyQ::hecke_h();
    // (σ + σ⁻¹) · x = (σ · x) + (σ⁻¹ · x)
    //              = (σ · x) + (σ · x − h · x)
    //              = 2 · (σ · x) − h · x.
    let sigma_x = hecke_mul_ts_right(x, i);
    // result := 2 · sigma_x.
    let mut result: HeckeElement = BTreeMap::new();
    for (w, c) in &sigma_x {
        let mut c2 = c.clone();
        c2.scalar_mul_assign(2_i32);
        if !c2.is_zero() {
            result.insert(w.clone(), c2);
        }
    }
    // result := 2 · sigma_x − h · x.
    for (w, c) in x {
        let h_c = h.clone() * c.clone();
        let entry = result.entry(w.clone()).or_insert_with(LaurentPolyQ::zero);
        *entry -= &h_c;
    }
    result.retain(|_, v| !v.is_zero());
    result
}

/// Convert a braid word `[(sign, gen_1based), ...]` on `n` strands
/// into its expansion `T_β = Σ c_w(q) · T_w` in the Hecke basis.
pub fn braid_to_hecke(n: usize, word: &[(i32, u32)]) -> HeckeElement {
    let (x, _avg_count) = braid_to_hecke_with_avg(n, word);
    x
}

/// Like [`braid_to_hecke`] but also handles **averaged** crossings
/// (sign == 0) and returns the count of averaged crossings encountered.
///
/// The averaged crossings are expanded via the doubled half-sum
/// `(σ + σ⁻¹) · x = 2 σ x − h x` (see
/// [`hecke_mul_ts_averaged_right`]).  Each averaged crossing contributes
/// a deferred factor of `1/2` to the χ^λ output; the caller divides
/// by `2^avg_count` at the χ^λ evaluation step.
///
/// **Why a separate `avg_count` return** instead of pre-normalising:
/// `LaurentPolyQ` uses `BigInt` coefficients, so `h/2 = (q − q⁻¹)/2`
/// cannot be represented directly without migrating the whole
/// `LaurentPolyQ` arithmetic to rationals.  Tracking `2^k` as an
/// external scalar avoids that refactor and matches the
/// `averaging_denominator` convention already used by
/// `tools/hecke-engine/src/wenzl_lr.rs::averaging_denominator`.
///
/// **Key structural property**: the basis size grows as if we'd done
/// a single σ-application per averaged crossing — NOT the 2^k blow-up
/// that a literal sub-word enumeration would produce.  The half-sum
/// is computed as ONE Hecke element via the algebraic identity, not
/// as two separate computations.  This is the structural win that
/// makes GP viable on canonical atomic braids with averaged crossings.
pub fn braid_to_hecke_with_avg(
    n: usize,
    word: &[(i32, u32)],
) -> (HeckeElement, u32) {
    let mut x = hecke_identity(n);
    let mut avg_count: u32 = 0;
    for &(sign, gen) in word {
        let i = (gen as usize).saturating_sub(1);
        if i + 1 >= n {
            continue;
        }
        x = if sign > 0 {
            hecke_mul_ts_right(&x, i)
        } else if sign < 0 {
            hecke_mul_ts_inv_right(&x, i)
        } else {
            // sign == 0: averaged crossing.
            avg_count = avg_count
                .checked_add(1)
                .expect("braid_to_hecke_with_avg: averaged-crossing count overflow");
            hecke_mul_ts_averaged_right(&x, i)
        };
    }
    (x, avg_count)
}

/// **Compute minimal length within S_n conjugacy class** of cycle
/// type `mu` (sorted descending).  Equals `Σ (μ_i - 1) = n - r(μ)`
/// where `r(μ)` is the number of parts.
fn min_length_for_cycle_type(mu: &[usize]) -> usize {
    let n: usize = mu.iter().sum();
    let r = mu.len();
    n - r
}

/// **Reduced word for a permutation** (lex-first reduced expression).
///
/// Returns a sequence of 0-indexed simple-reflection indices `[i_1, i_2, ...]`
/// such that `w = s_{i_1} · s_{i_2} · ... · s_{i_k}` and `k = ℓ(w)`.
///
/// Algorithm: while w is not identity, find the **leftmost** descent
/// (smallest i such that w(i) > w(i+1)), apply s_i on the right
/// (i.e. swap positions i and i+1 — this removes that descent and
/// strictly decreases inversion count), and prepend i to the word.
/// Any descent gives a valid reduced word; we take the leftmost one
/// for determinism.  Per Copilot review #r3144... the docstring used
/// to say "rightmost" while the code took the leftmost — corrected
/// to match the implementation.
pub fn reduced_word(w: &Perm) -> Vec<u32> {
    let mut current = w.clone();
    let n = current.n();
    let mut word = Vec::new();
    while current.length() > 0 {
        // Find leftmost ascent in the current → identity reduction
        // (= leftmost descent in current).
        let mut found = None;
        for i in 0..n.saturating_sub(1) {
            if current.0[i] > current.0[i + 1] {
                found = Some(i);
                break;
            }
        }
        match found {
            Some(i) => {
                current.0.swap(i, i + 1);
                word.push((i + 1) as u32);  // 1-indexed
            }
            None => break,
        }
    }
    word.reverse();
    word
}

/// **F3.2.η — correct-but-slow chi via Hoefsmit per T_w.**
///
/// For each basis element T_w in the expansion of T_β, compute
/// χ_λ(T_w; q) by finding a reduced word for w and evaluating
/// the seminormal kernel on that word.  Sum: χ_λ(T_β) = Σ c_w · χ_λ(T_w).
///
/// **Trade-off**: correct at any q (matches Hoefsmit on β directly),
/// but no MN speedup — cost is `O(|basis| · dim² · ℓ_max)` which
/// is similar to direct Hoefsmit on β.  Useful as a CORRECTNESS
/// BASELINE to validate the basis-expansion + LR composition
/// infrastructure, even though F3.2.γ via q-MN would be faster
/// once F3.2.η_full (proper Geck-Pfeiffer cuspidal moves) lands.
pub fn chi_lambda_via_gp_hoefsmit(
    lambda: &[usize],
    n: usize,
    word: &[(i32, u32)],
    q: f64,
) -> f64 {
    let n_lambda: usize = lambda.iter().sum();
    if n_lambda != n {
        return 0.0;
    }
    // **Averaged-crossing handling (C-full Step 1, 2026-05-18)**:
    // `braid_to_hecke_with_avg` expands each averaged crossing
    // (sign == 0) via the doubled half-sum
    // `(σ + σ⁻¹) · x = 2 σ x − h x` as a single Hecke element (no
    // 2^k branching of the basis).  Each averaged crossing carries a
    // deferred factor of `1/2` which we divide out at the χ^λ
    // evaluation step here.
    let (basis_expansion, avg_count) = braid_to_hecke_with_avg(n, word);
    let mut total = 0.0_f64;
    for (w, c_w) in &basis_expansion {
        let red_word = reduced_word(w);
        let positive_word: Vec<(i32, u32)> = red_word.iter().map(|&g| (1, g)).collect();
        let chi_w = crate::seminormal::chi_lambda_braid(lambda, &positive_word, q);
        let c_w_f64 = c_w.evaluate_f64(q);
        total += c_w_f64 * chi_w;
    }
    // Apply the deferred `(1/2)^avg_count` averaging normalisation.
    // **Why `f64::powi` instead of `1u64 << avg_count`**: the bit-
    // shift is UB for `avg_count >= 64` (debug panic; release wraps).
    // Per Copilot + Gemini review on PR #720, this is a real concern
    // at the scaling targets — canonical atomic braid words for
    // heavy atoms can exceed 64 averaged crossings (per
    // `mass_at_3A_proper.atom_braid_word_3A`, each mixed-quark pair
    // and each pn-interface contributes; for A=40 the count is
    // ~120). f64::powi handles the full range up to f64::INFINITY
    // (~2^1023) and underflows gracefully beyond f64 mantissa width
    // (~1024) rather than silently corrupting the result.
    if avg_count > 0 {
        total /= 2.0_f64.powi(avg_count as i32);
    }
    total
}

/// **MPFR variant** of [`chi_lambda_via_gp_hoefsmit`] at arbitrary
/// precision (≥ 50 dps recommended for the QOU canonical-χ targets).
///
/// C-full Step 2 (2026-05-18): per the C-gate audit
/// (`docs/audits/2026-05-18-hoefsmit-c-gate-gp-cross-validate.md`),
/// the GP path needs MPFR for production canonical |tr_M| compute.
/// Uses [`crate::seminormal_mpfr::chi_lambda_braid_mpfr`] per T_w +
/// [`LaurentPolyQ::evaluate_mpfr`] for the basis-coefficient
/// polynomials, all at the precision implied by `q`.
///
/// **`q` is supplied as a decimal string** (not `f64`) to preserve
/// arbitrary precision through the FFI; the caller passes the
/// canonical 50-dps `Q_50_DIGIT_STR` (or higher) from
/// `folio-assistant/computations/q_parameter.py`. This matches the
/// convention of `chi_lambda_canonical_h_n_mpfr` in `wenzl_lr.rs`.
///
/// **Averaged-crossing handling**: same as the f64 variant — uses
/// [`braid_to_hecke_with_avg`] and divides by `2^avg_count` at the
/// end. The divisor is computed via the same `f64::powi` pattern
/// (then cast to MPFR `Float`) to avoid the `1u64 << k` UB for
/// large k (per Copilot/Gemini review on PR #720).
///
/// Returns the χ^λ value as a decimal string at `dps` precision
/// (matches `chi_lambda_braid_mpfr` for FFI compatibility).
pub fn chi_lambda_via_gp_hoefsmit_mpfr(
    lambda: &[usize],
    n: usize,
    word: &[(i32, u32)],
    q_str: &str,
    dps: u32,
) -> String {
    use rug::Float;
    let n_lambda: usize = lambda.iter().sum();
    let prec = (dps as f64 * 3.322 + 16.0) as u32;
    if n_lambda != n {
        return Float::with_val(prec, 0).to_string_radix(10, Some(dps as usize));
    }

    // Parse q at MPFR precision. A parse failure here is a caller
    // bug (caller is responsible for supplying a valid decimal
    // string) — panic loudly per Gemini review on #725.
    let q = Float::parse(q_str)
        .map(|p| Float::with_val(prec, p))
        .expect("chi_lambda_via_gp_hoefsmit_mpfr: q_str is not a valid decimal");

    let (basis_expansion, avg_count) = braid_to_hecke_with_avg(n, word);
    let mut total = Float::with_val(prec, 0);

    for (w, c_w) in &basis_expansion {
        let red_word = reduced_word(w);
        let positive_word: Vec<(i32, u32)> =
            red_word.iter().map(|&g| (1, g)).collect();
        // Per-T_w character at MPFR precision.
        let chi_w_str = crate::seminormal_mpfr::chi_lambda_braid_mpfr(
            lambda, &positive_word, q_str, dps,
        );
        // chi_lambda_braid_mpfr produces valid decimal output; a
        // parse failure here would indicate corruption, not a
        // recoverable error.
        let chi_w = Float::parse(&chi_w_str)
            .map(|p| Float::with_val(prec, p))
            .expect("chi_lambda_braid_mpfr returned an invalid decimal string");
        // Basis coefficient c_w(q) evaluated at MPFR precision.
        let c_w_mpfr = c_w.evaluate_mpfr(&q);
        // total += c_w * chi_w (all MPFR).
        let prod = Float::with_val(prec, &c_w_mpfr * &chi_w);
        total += &prod;
    }

    // Deferred (1/2)^avg_count normalisation.
    // **Why exact right-shift instead of `f64::powi` cast** (per
    // Gemini review on #725): `rug::Float` supports `ShrAssign<u32>`
    // which divides by exactly 2^k via the binary exponent field —
    // no precision loss, no f64-range cap (handles all u32 values),
    // exact in MPFR.  The `f64::powi` cast pattern from #720's
    // Copilot/Gemini review was for the f64 path; in MPFR we have
    // a strictly-better option.
    if avg_count > 0 {
        total >>= avg_count;
    }
    total.to_string_radix(10, Some(dps as usize))
}

/// **All partitions, MPFR, with per-T_w memoisation** (C-full Step 3).
///
/// Compute χ^λ for every partition λ ⊢ n on the same braid word, at
/// MPFR precision, sharing the GP basis-expansion + per-T_w
/// characters across partitions where possible.
///
/// **Why this is faster than calling `chi_lambda_via_gp_hoefsmit_mpfr`
/// per partition in a loop**:
///
/// - `braid_to_hecke_with_avg(n, word)` runs ONCE (basis expansion is
///   λ-independent).
/// - `reduced_word(w)` for each `w` in the expansion runs ONCE.
/// - The per-T_w MPFR character `chi_lambda_braid_mpfr(λ, positive_word, ...)`
///   is computed once per (λ, distinct positive_word) pair, not once
///   per (λ, basis-element). Different basis elements `T_w` and `T_w'`
///   often have the same reduced word (in their minimal-length
///   conjugacy class representative), so the cache hit rate grows
///   with basis size.
/// - The deferred `2^avg_count` divisor is computed once and applied
///   per partition.
///
/// Returns `Vec<(partition, chi_decimal_string)>` mirroring
/// `chi_lambda_canonical_all_partitions_mpfr`'s shape. Inner
/// computation is parallel across partitions via rayon.
///
/// **Memoisation thread-safety**: each partition's rayon task builds
/// its own λ-specific `chi_cache` (HashMap from reduced-word → χ^λ
/// MPFR) over the deduplicated `distinct_words` list. The cache is
/// **per-partition**, not shared across rayon tasks — cross-partition
/// sharing would require cross-thread mutation under rayon, which we
/// avoid. The λ-independent prefix (basis expansion, reduced-word
/// extraction, distinct-word deduplication, c_w(q) MPFR evaluation)
/// IS shared across all partitions: that part runs once before the
/// rayon dispatch and is read-only inside the parallel loop.
/// (Note corrected per Copilot review on PR #728.)
pub fn chi_lambda_via_gp_hoefsmit_all_partitions_mpfr(
    n: usize,
    word: &[(i32, u32)],
    q_str: &str,
    dps: u32,
) -> Vec<(Vec<usize>, String)> {
    use rayon::prelude::*;
    use rug::Float;
    use std::collections::HashMap;

    let prec = (dps as f64 * 3.322 + 16.0) as u32;

    // 1. Basis expansion runs once for the whole sweep.
    let (basis_expansion, avg_count) = braid_to_hecke_with_avg(n, word);

    // 2. For each w in the expansion, pre-compute its reduced word
    //    (a Vec<u32> of simple-transposition indices). The keying
    //    by reduced word lets distinct `w`'s share their χ^λ
    //    computation when they reduce to the same canonical form.
    let basis_terms: Vec<(Vec<u32>, LaurentPolyQ)> = basis_expansion
        .iter()
        .map(|(w, c_w)| (reduced_word(w), c_w.clone()))
        .collect();

    // 3. Collect the distinct positive_word signatures across the
    //    basis. The same reduced word can appear for multiple
    //    basis elements; cache its char once per λ.
    let mut distinct_words: Vec<Vec<u32>> = basis_terms
        .iter()
        .map(|(rw, _)| rw.clone())
        .collect();
    distinct_words.sort();
    distinct_words.dedup();

    // 4. Pre-compute the c_w(q) MPFR evaluations once (λ-independent).
    // Per Gemini review on PR #728 line 553: parse failure is a
    // caller bug, not a recoverable error — panic loudly rather
    // than silently default to q = 1.
    let q = Float::parse(q_str)
        .map(|p| Float::with_val(prec, p))
        .expect(
            "chi_lambda_via_gp_hoefsmit_all_partitions_mpfr: \
             q_str is not a valid decimal",
        );
    let c_w_mpfr_per_term: Vec<Float> = basis_terms
        .iter()
        .map(|(_, c_w)| c_w.evaluate_mpfr(&q))
        .collect();

    // 5. Deferred 2^avg_count normalisation will be applied per-
    //    partition inside the rayon loop via exact `>>= avg_count`
    //    on the running MPFR Float (mantissa-preserving via the
    //    binary exponent field, range-safe across the full u32, no
    //    f64-range cap).  Matches the convention in
    //    `chi_lambda_via_gp_hoefsmit_mpfr` after the Gemini #728
    //    review.

    // 6. Per λ: build the per-distinct-word cache, then sum.
    let partitions = crate::seminormal::partitions_of(n);
    partitions
        .par_iter()
        .map(|lambda| {
            // Per-T_w MPFR character cache for THIS λ.  Built sequentially
            // inside the partition's rayon task (no cross-partition state).
            let mut chi_cache: HashMap<Vec<u32>, Float> = HashMap::with_capacity(
                distinct_words.len(),
            );
            for rw in &distinct_words {
                let positive_word: Vec<(i32, u32)> =
                    rw.iter().map(|&g| (1, g)).collect();
                let chi_str = crate::seminormal_mpfr::chi_lambda_braid_mpfr(
                    lambda, &positive_word, q_str, dps,
                );
                // Per Gemini + Copilot review on PR #728:
                // chi_lambda_braid_mpfr emits valid decimal output;
                // a parse failure here would indicate corruption
                // and silently coercing to 0 would mask the bug and
                // also look like a legitimate cancellation.  Panic
                // loudly with the offending string instead.
                let chi_f = Float::parse(&chi_str)
                    .map(|p| Float::with_val(prec, p))
                    .unwrap_or_else(|_| {
                        panic!(
                            "chi_lambda_braid_mpfr returned a non-decimal \
                             string: {chi_str:?}"
                        )
                    });
                chi_cache.insert(rw.clone(), chi_f);
            }

            // Sum c_w * χ^λ(T_w) over the basis.
            let mut total = Float::with_val(prec, 0);
            for ((rw, _c_w), c_w_mpfr) in basis_terms.iter().zip(c_w_mpfr_per_term.iter()) {
                let chi = chi_cache
                    .get(rw)
                    .expect("chi_cache built from distinct_words, lookup must succeed");
                let prod = Float::with_val(prec, c_w_mpfr * chi);
                total += &prod;
            }

            // Apply the deferred 2^avg_count normalisation via
            // exact MPFR right-shift (mantissa-preserving, full-u32
            // safe).  Per Gemini #565 + Copilot #563 review on PR
            // #728: the f64::powi cast pattern from the older
            // divisor approach caps at f64 range ~2^1023 and
            // overflows to inf for avg_count > 1023, collapsing
            // results to 0.  `>>=` does the exact division via the
            // binary exponent field.
            if avg_count > 0 {
                total >>= avg_count;
            }
            (lambda.clone(), total.to_string_radix(10, Some(dps as usize)))
        })
        .collect()
}

/// **F3.2.ζ — partial Hecke-conjugation reduction (simple-reflection only).**
///
/// Given a Hecke element `x = Σ c_w · T_w`, repeatedly find a basis
/// element `T_w` whose `w` is NOT minimal-length within its
/// `S_n` conjugacy class, and apply Hecke conjugation by a SIMPLE
/// reflection `s_i` such that `ℓ(s_i w s_i) < ℓ(w)`.  The conjugation
/// produces a sum of basis elements via the Hecke relations.
///
/// **Algorithmic limitation (motivates F3.2.η)**: not every non-minimal
/// element of `S_n` has a length-reducing simple-reflection
/// conjugation.  For example, in the conjugacy class of 6-cycles in
/// `S_6`, the element `[1, 3, 4, 5, 0, 2]` has length 7 and minimal
/// length 5, but no `s_i w s_i` reduces length.  The full
/// Geck-Pfeiffer 2000 §3.2 algorithm uses "good cuspidal moves"
/// (specific products of consecutive simple reflections) to reach
/// minimal-length representatives in such cases.
///
/// **Empirical**: on the D atomic braid (n=6, word_len=23), this
/// partial reduction takes the basis from ~700 elements down to 145,
/// of which 17 are minimal-length and 128 still need the full
/// cuspidal-move algorithm.
///
/// At q = 1, even partial reduction is sufficient because cycle type
/// determines the character; the F3.2.γ wiring matches classical MN
/// at q = 1 regardless of `reduce_basis_to_minimal_length` behaviour.
pub fn reduce_basis_to_minimal_length(x: &HeckeElement) -> HeckeElement {
    let mut current = x.clone();
    // Iterate until fixed point.
    loop {
        // Find a non-minimal w in current.
        let target = current.iter()
            .find_map(|(w, _c)| {
                let mu = perm_cycle_type(w);
                let min_len = min_length_for_cycle_type(&mu);
                if w.length() > min_len { Some(w.clone()) } else { None }
            });
        let Some(target_w) = target else {
            return current;  // all basis elements are minimal-length
        };
        let n = target_w.n();

        // Find a simple reflection s such that ℓ(s · target_w · s) < ℓ(target_w).
        let target_len = target_w.length();
        let mut chosen_s: Option<usize> = None;
        for i in 0..n.saturating_sub(1) {
            let mut sws = target_w.clone();
            sws.apply_s_left(i);
            sws.apply_s_right(i);
            if sws.length() < target_len {
                chosen_s = Some(i);
                break;
            }
        }
        let Some(s_idx) = chosen_s else {
            // No length-reducing conjugation found.  This shouldn't
            // happen for n ≤ 6 in S_n (every non-minimal element has
            // a length-reducing s) but bail safely if it does.
            return current;
        };

        // Apply Hecke conjugation: replace c_w · T_w with
        // c_w · (T_s · T_w · T_s⁻¹) in current.
        let coeff = current.remove(&target_w).unwrap_or_else(LaurentPolyQ::zero);
        // Build singleton {target_w → coeff}.
        let mut singleton: HeckeElement = BTreeMap::new();
        singleton.insert(target_w.clone(), coeff);
        let conjugated = hecke_conjugate_by_s(&singleton, s_idx);
        // Merge into current.
        for (v, c_v) in conjugated {
            let entry = current.entry(v).or_insert_with(LaurentPolyQ::zero);
            *entry += &c_v;
        }
        current.retain(|_, v| !v.is_zero());
    }
}

/// **F3.2.ε — Geck-Pfeiffer cuspidal reduction by simple-reflection conjugation.**
///
/// Given `w ∈ S_n`, repeatedly conjugate by simple reflections `s`
/// (i.e., `w ↦ s w s`) when this strictly decreases length, until
/// no such reduction is possible.  The resulting element has the
/// same cycle type as the input but minimal length within the
/// conjugation orbit reachable by simple-reflection moves.
///
/// **Theoretical basis**: by Geck-Pfeiffer 2000 §3, two elements
/// connected by a length-decreasing conjugation `w → sws` give the
/// same value on every class function of `H_n(q)`:
///
///   χ_λ(T_w; q) = χ_λ(T_{sws}; q)   if ℓ(sws) < ℓ(w).
///
/// **Note**: this simple algorithm reaches MINIMAL representatives
/// for all conjugacy classes in `S_n` for `n ≤ 6` (sufficient for
/// D / T atomic braids).  For larger `n`, some classes may require
/// "good cuspidal moves" beyond simple conjugation; for those the
/// full Geck-Pfeiffer §3.2 algorithm is needed.
pub fn reduce_to_cuspidal(w: &Perm) -> Perm {
    let n = w.n();
    let mut current = w.clone();
    loop {
        let cur_len = current.length();
        if cur_len == 0 {
            return current;  // identity is cuspidal
        }
        let mut reduced = false;
        for i in 0..n.saturating_sub(1) {
            // Compute s_i · w · s_i.
            let mut candidate = current.clone();
            candidate.apply_s_left(i);
            candidate.apply_s_right(i);
            if candidate.length() < cur_len {
                current = candidate;
                reduced = true;
                break;
            }
        }
        if !reduced {
            return current;
        }
    }
}

/// Cycle type of a permutation (sorted descending).
fn perm_cycle_type(perm: &Perm) -> Vec<usize> {
    let n = perm.n();
    let mut visited = vec![false; n];
    let mut cycles = Vec::new();
    for start in 0..n {
        if visited[start] {
            continue;
        }
        let mut len = 0;
        let mut j = start;
        while !visited[j] {
            visited[j] = true;
            j = perm.0[j];
            len += 1;
        }
        cycles.push(len);
    }
    cycles.sort_by(|a, b| b.cmp(a));
    cycles
}

/// **F3.2.γ wiring**: compute `χ_λ(T_β; q)` for an arbitrary braid
/// word by expanding `T_β = Σ c_w · T_w` in the Hecke basis and
/// applying q-MN on each `T_w`.
///
///   χ_λ(T_β; q) = Σ_w c_w(q) · χ_λ(T_w; q)
///
/// **CRITICAL CORRECTNESS NOTE — F3.2.γ is structurally incomplete.**
///
/// At q ≠ 1, two basis elements `T_w` and `T_{w'}` with the SAME
/// cycle type but DIFFERENT lengths give DIFFERENT Hecke characters.
/// This is NOT a class function on cycle type — it's a class
/// function on `H_n(q)` (invariant under Hecke conjugation), which
/// for symmetric-group permutations means: invariant ONLY among
/// MINIMAL-LENGTH representatives of each conjugacy class.
///
/// Empirical verification (see q_mn_canonical.py cross-check):
///   χ^(2,1)(T_{s_1};       q₀) ≈ +0.209  (length 1, minimal)
///   χ^(2,1)(T_{s_1 s_2 s_1}; q₀) ≈ -0.000  (length 3, NOT minimal)
///   Both have cycle type (2, 1).
///
/// The simplified q-MN treats both as the canonical-cycle-type
/// character of the minimal-length representative — incorrect for
/// non-minimal w.
///
/// **Two paths to a correct implementation (F3.2.δ):**
///
/// 1. **Geck-Pfeiffer cuspidal reduction**: for each `T_w` in the
///    expansion, reduce w to its minimal-length representative
///    `w_min` within its conjugacy class via "good conjugations"
///    (s w s = w' with ℓ(w') ≤ ℓ(w) - 2), then apply q-MN to
///    `cycle_type(w_min)`.  Reference: Geck-Pfeiffer 2000 §3.
///
/// 2. **Hoefsmit per T_w**: for each basis element, build the
///    canonical reduced word `w_min` and evaluate via Hoefsmit
///    seminormal.  Correct but no MN speedup.
///
/// At q = 1 the simplified path is correct (Hecke ↦ S_n; characters
/// ARE class functions on cycle type alone).
pub fn chi_lambda_via_geck_pfeiffer(
    lambda: &[usize],
    n: usize,
    word: &[(i32, u32)],
) -> LaurentPolyQ {
    let n_lambda: usize = lambda.iter().sum();
    if n_lambda != n {
        return LaurentPolyQ::zero();
    }
    let basis_expansion = braid_to_hecke(n, word);
    // F3.2.ζ: reduce ALL basis elements to minimal-length representatives
    // via iterated Hecke conjugation.  This produces a sum where
    // each basis member T_w has ℓ(w) = minimal length within its
    // conjugacy class — at which point q-MN on cycle_type(w) gives
    // the correct character.
    let reduced = reduce_basis_to_minimal_length(&basis_expansion);
    let mut total = LaurentPolyQ::zero();
    for (w, c_w) in &reduced {
        let mu = perm_cycle_type(w);
        let chi_w = crate::seminormal_mn::chi_lambda_mn_qdef(lambda, &mu);
        total += &(c_w.clone() * chi_w);
    }
    total
}

/// **Batched Geck-Pfeiffer character evaluation** — computes
/// `χ^λ(T_β)(q)` for all `λ` in `shapes` from a SINGLE GP reduction
/// of the braid word. Per
/// `docs/audits/2026-06-07-pyhecke-native-gil-release-patch.md`
/// Patch 2 — the GP reduction is the expensive part (~O(n^10)
/// empirical) and depends only on `(n, word)`, not on `λ`. Sharing
/// it across the partition loop gives O(p(n))× speedup vs calling
/// `chi_lambda_via_geck_pfeiffer` per partition.
///
/// Returns `Vec<LaurentPolyQ>` indexed correspondingly to `shapes`.
pub fn chi_lambdas_via_geck_pfeiffer(
    shapes: &[Vec<usize>],
    n: usize,
    word: &[(i32, u32)],
) -> Vec<LaurentPolyQ> {
    use rayon::prelude::*;
    // GP reduction ONCE for this (n, word) — the expensive part.
    let basis_expansion = braid_to_hecke(n, word);
    let reduced = reduce_basis_to_minimal_length(&basis_expansion);
    // Pre-compute (cycle-type, coefficient) pairs from the reduced
    // basis so we don't recompute `perm_cycle_type(w)` per shape.
    let cycle_data: Vec<(Vec<usize>, LaurentPolyQ)> = reduced
        .iter()
        .map(|(w, c_w)| (perm_cycle_type(w), c_w.clone()))
        .collect();
    // Loop over shapes — Rayon-parallel so multi-core boxes get the
    // shape-loop speedup on top of the shared GP reduction.
    shapes
        .par_iter()
        .map(|lambda| {
            let n_lambda: usize = lambda.iter().sum();
            if n_lambda != n {
                return LaurentPolyQ::zero();
            }
            let mut total = LaurentPolyQ::zero();
            for (mu, c_w) in &cycle_data {
                let chi_w = crate::seminormal_mn::chi_lambda_mn_qdef(lambda, mu);
                total += &(c_w.clone() * chi_w);
            }
            total
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn perm_identity() {
        let id = Perm::identity(4);
        assert_eq!(id.length(), 0);
    }

    #[test]
    fn perm_length() {
        // s_0 (swap 0, 1): one inversion.
        let mut p = Perm::identity(3);
        p.apply_s_right(0);
        assert_eq!(p.length(), 1);
        // s_0 s_1 = (0 1)(1 2) in one-line: identity → s_0 → s_0 s_1.
        // After s_0: [1, 0, 2].  After s_1 (right): swap pos 1, 2 → [1, 2, 0].
        // Inversions of [1, 2, 0]: (1, 2) ↛, (1, 0) ✓, (2, 0) ✓ → 2 inversions.
        p.apply_s_right(1);
        assert_eq!(p.length(), 2);
    }

    #[test]
    fn hecke_identity_basis() {
        let id = hecke_identity(3);
        assert_eq!(id.len(), 1);
        let e = Perm::identity(3);
        assert!(id.contains_key(&e));
    }

    #[test]
    fn hecke_t_s_squared() {
        // T_{s_0}² = q² · T_e + (q − q^{-1}) · T_{s_0}.
        // (Hecke relation: T_s² = (q − q^{-1}) T_s + q · 1, but with
        // our conventions T_s² = q + (q − q⁻¹) T_s ... wait depends on
        // normalisation.)
        // Check: starting from 1, apply T_{s_0}, apply T_{s_0} again.
        let id = hecke_identity(3);
        let after_one = hecke_mul_ts_right(&id, 0);
        // After one s_0: just T_{s_0}, coefficient 1.
        assert_eq!(after_one.len(), 1);
        let s0 = Perm({
            let mut v = Perm::identity(3).0;
            v.swap(0, 1);
            v
        });
        assert_eq!(after_one.get(&s0), Some(&LaurentPolyQ::one()));

        let after_two = hecke_mul_ts_right(&after_one, 0);
        // T_{s_0} · T_{s_0}: ℓ(s_0 s_0) = 0 < 1 = ℓ(s_0).
        // So T_{s_0}² = T_e + (q − q^{-1}) · T_{s_0}.
        assert_eq!(after_two.len(), 2);
        assert_eq!(after_two.get(&Perm::identity(3)),
                   Some(&LaurentPolyQ::one()));
        assert_eq!(after_two.get(&s0), Some(&LaurentPolyQ::hecke_h()));
    }

    #[test]
    fn braid_word_to_hecke_simple() {
        // σ_1 σ_2 on 3 strands.
        let result = braid_to_hecke(3, &[(1, 1), (1, 2)]);
        // σ_1 σ_2 = s_0 s_1: one element, w = s_0 s_1 with one-line
        // form: id → s_0 → s_0 s_1 → ...
        // After s_0: [1, 0, 2].
        // After s_1 (right): swap pos 1, 2 → [1, 2, 0].
        let expected = Perm(vec![1, 2, 0]);
        assert_eq!(result.len(), 1);
        assert_eq!(result.get(&expected), Some(&LaurentPolyQ::one()));
    }

    /// F3.2.ζ: reduce_basis_to_minimal_length on T_{s_1 s_2 s_1}.
    /// Expected result: T_{s_2} + h · T_{s_1 s_2}.
    #[test]
    fn full_reduction_simple_case() {
        // Build T_{s_1 s_2 s_1}.
        let initial = braid_to_hecke(3, &[(1, 1), (1, 2), (1, 1)]);
        let reduced = reduce_basis_to_minimal_length(&initial);
        // Expected: 2 basis elements.
        //   T_{s_2}     with coefficient 1
        //   T_{s_1 s_2} with coefficient h = q − q⁻¹
        assert_eq!(reduced.len(), 2,
                   "expected 2 basis elements after reduction, got {}: {:?}",
                   reduced.len(), reduced);

        // Verify s_2 → 1, s_1 s_2 → h.
        let s_2 = {
            let mut p = Perm::identity(3);
            p.apply_s_right(1);
            p
        };
        let s_1_s_2 = {
            let mut p = Perm::identity(3);
            p.apply_s_right(0);
            p.apply_s_right(1);
            p
        };
        assert_eq!(reduced.get(&s_2), Some(&LaurentPolyQ::one()),
                   "T_{{s_2}} coefficient should be 1");
        assert_eq!(reduced.get(&s_1_s_2), Some(&LaurentPolyQ::hecke_h()),
                   "T_{{s_1 s_2}} coefficient should be h");
    }

    /// F3.2.ε: cuspidal reduction reaches minimal-length representatives.
    #[test]
    fn cuspidal_reduction_reaches_minimal() {
        // s_1 s_2 s_1 has length 3 in S_3, cycle type (2,1) whose
        // minimal length is 1.  Cuspidal reduction should reach a
        // length-1 representative.
        let mut w = Perm::identity(3);
        w.apply_s_right(0);  // s_1
        w.apply_s_right(1);  // s_1 s_2
        w.apply_s_right(0);  // s_1 s_2 s_1
        assert_eq!(w.length(), 3);
        let w_min = reduce_to_cuspidal(&w);
        assert_eq!(w_min.length(), 1,
                   "(2,1)-cycle minimal length should be 1; got {} from {:?}",
                   w_min.length(), w_min.0);
    }

    /// **F3.2.γ correctness boundary at q = 1 (CORRECT) vs q ≠ 1 (FAILS).**
    ///
    /// The current chi_lambda_mn_qdef uses the SIMPLIFIED strip
    /// weight `(−q⁻¹)^h · q^{k−1−h}` which collapses to `(−1)^h` at
    /// q = 1 (correct classical MN) but is the wrong q-deformation
    /// for general non-trivial irreps at q ≠ 1.
    ///
    /// Empirically: χ^(2,1)(T_{s_1}; q₀) ≈ +0.209 = h via Hoefsmit,
    /// but our chi_lambda_via_geck_pfeiffer returns 0 because the
    /// simplified MN gives 0 on cycle type (2,1) at any q (no
    /// size-2 strips removable from (2,1) under the beta-number rule).
    ///
    /// At q = 1, classical MN says χ^(2,1)((2,1)-cycle) = 0 (the
    /// 2D standard rep is "balanced" on transpositions).  My
    /// formula correctly returns 0 here.  But h evaluates to 0 at
    /// q=1 too, so this is consistent — h = q − q⁻¹ → 0 as q → 1.
    ///
    /// So: at q = 1 we get 0 (classical MN); at q ≠ 1 we ALSO get
    /// 0 (still no size-2 strips), but the TRUE Hecke character is
    /// h ≠ 0 at q ≠ 1.  The simplified MN under-counts.
    #[test]
    fn gp_correct_at_q_eq_one_only() {
        use num_bigint::BigInt;
        // CASE: σ_1 σ_2 σ_1 (length 3, cycle type (2,1) but NOT minimal).
        // At q = 1, classical MN: χ^(2,1)((2,1)) = 0.
        let chi = chi_lambda_via_geck_pfeiffer(
            &[2, 1], 3, &[(1, 1), (1, 2), (1, 1)],
        );
        assert_eq!(chi.evaluate_at_one(), BigInt::from(0),
                   "at q=1, χ^(2,1)((2,1)) = 0; got {}",
                   chi.evaluate_at_one());
        // We do NOT assert anything at q ≠ 1 — the simplified MN
        // gives wrong values there; F3.2.δ (proper Ram-Wenzl arm-leg
        // formula) is the next milestone.
    }

    /// chi_lambda_via_geck_pfeiffer matches direct chi_lambda_mn_qdef on
    /// canonical T_w (where the latter is correct).
    #[test]
    fn gp_matches_qmn_on_canonical_T_w() {
        // λ = (3), word = σ_1 σ_2 (canonical T_{(0 1 2)} 3-cycle).
        let chi_gp = chi_lambda_via_geck_pfeiffer(&[3], 3, &[(1, 1), (1, 2)]);
        let chi_direct = crate::seminormal_mn::chi_lambda_mn_qdef(&[3], &[3]);
        assert_eq!(chi_gp, chi_direct,
                   "GP via basis expansion should match q-MN on cycle type (3)\n\
                    GP={}, direct={}", chi_gp.pretty(), chi_direct.pretty());
    }

    /// At q = 1, GP-based char must equal classical MN on the
    /// underlying permutation cycle type.
    #[test]
    fn gp_at_q_eq_one_matches_classical() {
        use num_bigint::BigInt;
        // σ_1 σ_2 σ_1 on 3 strands: permutation [2, 1, 0] = (0 2)
        // cycle type (2, 1).  λ = (2, 1) (standard rep) → χ = 0.
        let chi_gp = chi_lambda_via_geck_pfeiffer(
            &[2, 1], 3, &[(1, 1), (1, 2), (1, 1)],
        );
        let classical = crate::seminormal_mn::mn_chi(&[2, 1], &[2, 1]);
        assert_eq!(chi_gp.evaluate_at_one(), BigInt::from(classical),
                   "GP at q=1 should match classical MN: got {}, expected {}",
                   chi_gp.evaluate_at_one(), classical);
    }

    #[test]
    fn inverse_generator() {
        // T_{s_0} · T_{s_0}^{-1} = T_e.
        let id = hecke_identity(3);
        let after_pos = hecke_mul_ts_right(&id, 0);
        let after_neg = hecke_mul_ts_inv_right(&after_pos, 0);
        // Should reduce to just T_e.
        assert_eq!(after_neg.len(), 1, "after positive*inverse = identity");
        assert_eq!(after_neg.get(&Perm::identity(3)), Some(&LaurentPolyQ::one()));
    }
}
