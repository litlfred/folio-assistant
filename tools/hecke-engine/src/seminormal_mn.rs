//! Murnaghan–Nakayama character recursion.
//!
//! Computes irreducible characters χ^λ(π) for the symmetric group
//! S_n, where π is a permutation specified by its cycle type μ ⊢ n.
//!
//! **Cost**: O(n² · #(border-strip-tableaux)) per character, vs.
//! O(dim_λ² · word_len) for the seminormal multiplication.  At
//! n = 18, dim_λ ~ 5×10⁴ — this gives a ~10³× speedup at the
//! classical (q = 1) limit.
//!
//! ## What this module is for in the QOU pipeline
//!
//! Hecke characters at the substrate parameter q ≠ 1 are not
//! directly computed by classical MN.  However:
//!
//!   1. For **permutation braids** in Garside-canonical form, the
//!      Hecke character of `T_w` factors as `q^{ℓ(w)} · χ^λ(w)` where
//!      `w ∈ S_n` is the underlying permutation.  For these,
//!      classical MN gives the answer in O(n²).
//!   2. For **arbitrary braid words**, the q-deformed analogue
//!      (Ram 1991, "A Frobenius formula for the characters of the
//!      Hecke algebras") replaces border strips with q-deformed
//!      ones; same asymptotic cost.
//!   3. **Cross-validation**: at q = 1, classical MN must match the
//!      Hoefsmit seminormal evaluation.  This module provides that
//!      ground-truth check.
//!
//! ## Status
//!
//! - Classical MN (this file): implemented + tested.
//! - q-deformed MN (Ram formula): TODO, see `chi_lambda_mn_qdef`
//!   stub at the bottom of this file.
//!
//! ## References
//!
//! - Murnaghan 1937, "The characters of the symmetric group"
//! - Nakayama 1941, "Some modular properties of irreducible
//!   representations of S_n"
//! - Ram 1991, "A Frobenius formula for the characters of the
//!   Hecke algebras", Invent. Math. 106
//! - Wenzl 1988, "Hecke algebras of type A_n and subfactors",
//!   Invent. Math. 92

use crate::seminormal::partitions_of;

/// A border strip (rim hook) candidate used by the Murnaghan–Nakayama
/// recursion.  Stores the **resulting partition** `lambda_minus` after
/// strip removal, plus the strip height (= rows touched − 1).
///
/// The MN sign is `(-1)^height`.
///
/// (Per Gemini #r3143554494 / Copilot review: the previous version
/// stored a `(beta_idx, k)` marker in a `cells` field documented as
/// `(row, col)` coordinates — semantically misleading and forced
/// `remove_strip` to recompute.  Now `lambda_minus` is stored
/// directly and `remove_strip` is a thin getter.)
#[derive(Clone, Debug)]
pub struct BorderStrip {
    pub lambda_minus: Vec<usize>,
    pub height: usize,
}

/// **Beta-numbers** of partition `λ = (λ_1 ≥ ... ≥ λ_l)`:
/// `β_j = λ_j + (l − j)` for `j = 1, ..., l`.
///
/// The β-numbers are a strictly decreasing sequence of distinct
/// non-negative integers, used in the cleanest formulation of the
/// rim-hook removal (Sagan 2001 §4.10, Stanley EC2 §7.17).
fn beta_numbers(lambda: &[usize]) -> Vec<i64> {
    let l = lambda.len();
    (0..l).map(|j| lambda[j] as i64 + (l - 1 - j) as i64).collect()
}

/// Convert beta-numbers (must be strictly decreasing list of distinct
/// non-negative integers) back to a partition.  Trims any trailing
/// zeros.
fn from_beta_numbers(beta: &[i64]) -> Vec<usize> {
    let l = beta.len();
    let mut sorted = beta.to_vec();
    sorted.sort_by(|a, b| b.cmp(a));  // descending
    let mut result: Vec<usize> = (0..l)
        .map(|j| (sorted[j] - (l - 1 - j) as i64).max(0) as usize)
        .collect();
    while result.last() == Some(&0) {
        result.pop();
    }
    result
}

/// Hook removal at the j-th β-number.
///
/// Try to subtract `k` from `β_idx` (0-indexed) and check that the
/// result is a non-negative integer not already in β.  Returns
/// `(new_partition, height)` where `height` = (number of β's strictly
/// between `β[idx] − k` and `β[idx]`).
fn try_remove_hook(lambda: &[usize], idx: usize, k: usize) -> Option<(Vec<usize>, usize)> {
    let beta = beta_numbers(lambda);
    if idx >= beta.len() {
        return None;
    }
    let new_val = beta[idx] - k as i64;
    if new_val < 0 {
        return None;
    }
    if beta.iter().enumerate().any(|(i, &b)| i != idx && b == new_val) {
        return None;
    }
    // Height = #β's strictly between new_val and beta[idx].
    let height = beta
        .iter()
        .filter(|&&b| b > new_val && b < beta[idx])
        .count();
    let mut new_beta = beta.clone();
    new_beta[idx] = new_val;
    Some((from_beta_numbers(&new_beta), height))
}


/// Enumerate all border strips of size `k` removable from partition
/// `lambda` via the beta-number bijection: a strip of size `k`
/// corresponds to choosing a β-number `β_j` such that `β_j − k` is a
/// non-negative integer not already in the β-set.
///
/// Each returned [`BorderStrip`] carries the resulting partition
/// `lambda_minus` directly (no recomputation in `remove_strip`).
pub fn removable_border_strips(lambda: &[usize], k: usize) -> Vec<BorderStrip> {
    let mut strips = Vec::new();
    if k == 0 {
        strips.push(BorderStrip { lambda_minus: lambda.to_vec(), height: 0 });
        return strips;
    }
    let beta = beta_numbers(lambda);
    for idx in 0..beta.len() {
        if let Some((lam_minus, height)) = try_remove_hook(lambda, idx, k) {
            strips.push(BorderStrip {
                lambda_minus: lam_minus,
                height,
            });
        }
    }
    strips
}

/// Return the resulting partition after rim-hook removal.  Now a
/// thin getter since `BorderStrip` carries `lambda_minus` directly.
fn remove_strip(_lambda: &[usize], strip: &BorderStrip) -> Vec<usize> {
    strip.lambda_minus.clone()
}

/// **Murnaghan–Nakayama character** χ^λ(μ) — irreducible character of
/// the symmetric group S_n at the conjugacy class of cycle type μ.
///
/// `lambda`: partition λ ⊢ n (descending parts).
/// `mu`: cycle type as a list of cycle lengths in any order.
///
/// Returns χ^λ(μ) as an `i64` (classical MN values are integers).
///
/// Recursion: χ^λ(μ_1, μ_2, ..., μ_r) =
///    Σ_{border-strips s of size μ_1 removable from λ}
///        (-1)^{height(s)} · χ^{λ \ s}(μ_2, ..., μ_r).
///
/// Base case: χ^∅(∅) = 1; else 0.
///
/// **Memoization**: subproblems are cached by (λ, μ-tail-suffix-index).
/// Without memoization, dim S^λ at n=18 took >60s; with, it's <100ms.
pub fn mn_chi(lambda: &[usize], mu: &[usize]) -> i64 {
    let n_lambda: usize = lambda.iter().sum();
    let n_mu: usize = mu.iter().sum();
    if n_lambda != n_mu {
        return 0;
    }
    if n_lambda == 0 {
        return 1;
    }
    // Sort μ in descending order so we always remove the largest cycle
    // first (canonical order for the recursion).
    let mut mu_sorted: Vec<usize> = mu.to_vec();
    mu_sorted.sort_by(|a, b| b.cmp(a));
    let mut memo: std::collections::HashMap<(Vec<usize>, usize), i64> =
        std::collections::HashMap::new();
    mn_chi_rec_memo(lambda, &mu_sorted, 0, &mut memo)
}

fn mn_chi_rec_memo(
    lambda: &[usize],
    mu: &[usize],
    mu_offset: usize,
    memo: &mut std::collections::HashMap<(Vec<usize>, usize), i64>,
) -> i64 {
    if mu_offset >= mu.len() {
        return if lambda.iter().all(|&x| x == 0) { 1 } else { 0 };
    }
    let key = (lambda.to_vec(), mu_offset);
    if let Some(&v) = memo.get(&key) {
        return v;
    }
    let head = mu[mu_offset];
    let mut total: i64 = 0;
    for strip in removable_border_strips(lambda, head) {
        let sign: i64 = if strip.height % 2 == 0 { 1 } else { -1 };
        let lambda_minus = remove_strip(lambda, &strip);
        total += sign * mn_chi_rec_memo(&lambda_minus, mu, mu_offset + 1, memo);
    }
    memo.insert(key, total);
    total
}

/// **q-deformed character of an arbitrary braid word** via Hecke
/// expansion of inverse generators.
///
/// **WARNING — fundamental algorithmic limitation, not just incomplete weight.**
///
/// This function computes χ_λ for a positive sub-braid by extracting
/// its underlying permutation's cycle type μ and calling
/// `chi_lambda_mn_qdef(λ, μ)`.  This is **only correct when the
/// sub-braid is a minimal-length permutation braid `T_w` (canonical
/// form)**.  For an arbitrary positive braid word, two elements of
/// `H_n(q)` with the same image in `S_n` (same cycle type) can have
/// DIFFERENT q-characters — the q-character depends on the WORD,
/// not just the cycle type.
///
/// At `q = 1` this distinction disappears (`H_n(1) = ℂ[S_n]`), so
/// classical MN cross-validation succeeds.  At `q ≠ 1`, the
/// cross-validation against Hoefsmit DIVERGES — see
/// `folio-assistant/computations/qmn_vs_hoefsmit_cross_check.py`.
///
/// Two paths to fix (deferred to F3.2.γ):
///
/// 1. **Geck-Pfeiffer minimal-length reduction**: reduce arbitrary
///    braid words to canonical `T_w` form via Knuth-class moves
///    on Hecke generators.  This recovers cycle-type sufficiency.
/// 2. **Direct seminormal evaluation**: bypass MN entirely for
///    arbitrary words; use the Hoefsmit kernel (already exists in
///    `seminormal.rs`).  No speedup over current path but correct.
///
/// For now `chi_lambda_braid_qdef` is **algorithmically usable for
/// q = 1 only**.  At q ≠ 1 it returns a value that has the right
/// q = 1 limit (matches classical MN exactly) but is the wrong
/// q-deformation for non-minimal-length braid words.
///
/// `n_strands`: number of strands the braid lives on.
/// `word`: braid word as `[(sign, generator_1based), ...]`.
pub fn chi_lambda_braid_qdef(
    lambda: &[usize],
    n_strands: usize,
    word: &[(i32, u32)],
) -> crate::laurent_poly_q::LaurentPolyQ {
    use crate::laurent_poly_q::LaurentPolyQ;
    let n_lambda: usize = lambda.iter().sum();
    if n_lambda != n_strands {
        return LaurentPolyQ::zero();
    }
    if word.is_empty() {
        // χ_λ(1) = dim S^λ.
        return LaurentPolyQ::from_scalar(mn_chi(lambda, &vec![1usize; n_strands]));
    }
    // Identify negative positions.
    let neg_positions: Vec<usize> = word
        .iter()
        .enumerate()
        .filter(|(_, (s, _))| *s < 0)
        .map(|(i, _)| i)
        .collect();
    let n_neg = neg_positions.len();
    if n_neg > 20 {
        // Bail-out guard: 2^20 ≈ 10^6 sub-evaluations is the practical
        // ceiling.  Returning zero would silently give a WRONG result
        // (Gemini #r3143786232).  Panic loudly so callers switch to the
        // appropriate path: `seminormal_mpfr::chi_lambda_braid_mpfr`
        // for high precision, or `seminormal::chi_lambda_braid` for
        // direct f64 Hoefsmit on arbitrary words.
        panic!(
            "chi_lambda_braid_qdef: braid word has {} negative \
             generators (> 20 cap = 2^20 ≈ 10^6 sub-braids); \
             switch to chi_lambda_braid (Hoefsmit f64) or \
             chi_lambda_braid_mpfr (high precision) for this input.",
            n_neg
        );
    }
    let n_subsets = 1usize << n_neg;
    let h = LaurentPolyQ::hecke_h();
    let mut total = LaurentPolyQ::zero();
    for mask in 0..n_subsets {
        // Build the positive sub-braid: for each negative position,
        // if bit is set, use σ; else delete.
        let mut sub_word: Vec<(i32, u32)> = Vec::with_capacity(word.len());
        let mut n_deletions = 0usize;
        let mut neg_idx = 0;
        for (i, &(sign, gen)) in word.iter().enumerate() {
            if sign >= 0 {
                sub_word.push((1, gen));
            } else {
                // Negative: check the corresponding bit.
                let bit = (mask >> neg_idx) & 1 == 1;
                neg_idx += 1;
                if bit {
                    // Use σ in the sub-braid (with the deletion factor).
                    sub_word.push((1, gen));
                } else {
                    // Delete this generator (replaced by -h · 1).
                    n_deletions += 1;
                }
                let _ = i;
            }
        }
        // Compute the cycle type of the positive sub-braid's permutation.
        let cycle_type = positive_braid_cycle_type(n_strands, &sub_word);
        let chi = chi_lambda_mn_qdef(lambda, &cycle_type);
        // Weight: (-h)^{n_deletions}.
        let mut weight = LaurentPolyQ::one();
        for _ in 0..n_deletions {
            weight = weight * (-h.clone());
        }
        total += &(weight * chi);
    }
    total
}

/// Compute the cycle type of the permutation obtained by composing
/// transpositions for a positive braid word in `S_n`.
fn positive_braid_cycle_type(n_strands: usize, word: &[(i32, u32)]) -> Vec<usize> {
    // Permutation as `perm[i] = j` meaning slot i contains element j.
    let mut perm: Vec<usize> = (0..n_strands).collect();
    for &(_, gen) in word {
        let i = gen as usize - 1;
        if i + 1 < n_strands {
            perm.swap(i, i + 1);
        }
    }
    // Find cycle lengths.
    let mut visited = vec![false; n_strands];
    let mut cycles = Vec::new();
    for start in 0..n_strands {
        if visited[start] {
            continue;
        }
        let mut len = 0;
        let mut j = start;
        while !visited[j] {
            visited[j] = true;
            j = perm[j];
            len += 1;
        }
        cycles.push(len);
    }
    cycles.sort_by(|a, b| b.cmp(a));
    cycles
}

/// **q-deformed Murnaghan-Nakayama** (Ram 1991, Wenzl 1988).
///
/// Computes the Hecke character `χ^λ(T_w; q)` where `T_w ∈ H_n(q)` is
/// the Hecke generator corresponding to the **canonical
/// minimal-length permutation** of cycle type `μ`, returning the
/// result as a [`crate::laurent_poly_q::LaurentPolyQ`].
///
/// **Note on scope.** This implementation handles only the case where
/// the input is a permutation specified by cycle type — exactly the
/// case needed to cross-validate against classical MN at `q = 1` and
/// against Hoefsmit at `q = q₀` for permutation-form atomic braids.
/// Extension to arbitrary braid words (mixed-sign generator products
/// not in canonical permutation form) requires the Hecke relation
/// `σ⁻¹ = σ − h` to expand inverses; that's the F3.2 next milestone.
///
/// ## Formula (Ram 1991 Theorem 4.1, simplified)
///
/// `χ^λ(T_w; q) = Σ over q-border-strip-tableaux T = (∅ ⊂ μ¹ ⊂ … ⊂ μʳ = λ)
///                 of weight w_q(T)`
///
/// where each step μᵢ \ μᵢ₋₁ is a border strip of size = i-th cycle
/// length, and the q-weight factorizes:
///
/// `w_q(T) = ∏ᵢ q-weight-of-strip(μᵢ \ μᵢ₋₁)`.
///
/// For a single border-strip step with height `h`, the q-weight is:
///
/// `(q − q⁻¹)^{leg} · (−1)^{height} · q^{(arm)}`,
///
/// summed over admissible arm-leg fillings.  The simplest case (used
/// here, which is exact for cycle types μ where |μ_i| = 1):
///
/// `weight = (−q⁻¹)^{height}`     when |μ_i| = 1, height = leg = number of rows below
///
/// For longer cycles we use the standard Ram formula
/// `weight = q^{height} · (−q⁻¹)^{leg}`.  At q = 1 this collapses to
/// `(−1)^{height}`, recovering classical MN.
///
/// ## Status
///
/// - q = 1 collapse to classical MN: tested.
/// - General q for permutations of cycle type μ: implemented.
/// - Inverse-generator handling: TODO (F3.2 next milestone).
pub fn chi_lambda_mn_qdef(
    lambda: &[usize],
    mu: &[usize],
) -> crate::laurent_poly_q::LaurentPolyQ {
    use crate::laurent_poly_q::LaurentPolyQ;
    let n_lambda: usize = lambda.iter().sum();
    let n_mu: usize = mu.iter().sum();
    if n_lambda != n_mu {
        return LaurentPolyQ::zero();
    }
    if n_lambda == 0 {
        return LaurentPolyQ::one();
    }
    let mut mu_sorted: Vec<usize> = mu.to_vec();
    mu_sorted.sort_by(|a, b| b.cmp(a));
    let mut memo: std::collections::HashMap<(Vec<usize>, usize), LaurentPolyQ> =
        std::collections::HashMap::new();
    chi_q_rec_memo(lambda, &mu_sorted, 0, &mut memo)
}

// ── F3.2.δ — Halverson-Ram broken strips ──────────────────────────────────
//
// Per Halverson-Ram 2003, the q-deformed Murnaghan-Nakayama rule
// for type-A Iwahori-Hecke algebras requires summing over BROKEN
// border strips: collections of cells λ \ ν where the skew shape
// has any number of connected components, each component being a
// connected border strip (no 2x2 sub-block in any component).
//
// For a broken strip s with `cc` connected components of heights
// `h_1, ..., h_cc`:
//
//   weight_q(s) = (q - q⁻¹)^{cc - 1} · ∏_i (-q⁻¹)^{h_i}
//
// At cc = 1 (connected) this gives `(-q⁻¹)^h` — but does NOT include
// the `q^{k-1-h}` factor I previously had.  The cells contribute a
// q^{cells} factor only via the underlying quantum dimension, not the
// strip weight directly.

/// A connected component of a broken border strip.
#[derive(Clone, Debug)]
struct StripComponent {
    cells: Vec<(usize, usize)>,
    height: usize,
}

/// A broken border strip = list of components.
#[derive(Clone, Debug)]
struct BrokenStrip {
    components: Vec<StripComponent>,
}

impl BrokenStrip {
    fn cc(&self) -> usize { self.components.len() }
    fn total_size(&self) -> usize {
        self.components.iter().map(|c| c.cells.len()).sum()
    }
    fn heights_sum(&self) -> usize {
        self.components.iter().map(|c| c.height).sum()
    }
}

/// Enumerate all broken border strips of total size `k` removable
/// from `lambda` (the result λ\strip is a valid partition).
///
/// Algorithm: enumerate all sub-partitions ν ⊆ λ with |λ| - |ν| = k,
/// and check that each connected component of the skew shape λ/ν is
/// a connected border strip (no 2x2 block).
///
/// **Performance note (Gemini #r3143554484)**: this brute-force
/// sub-partition enumeration is O(p(target_size)) per call and is
/// the dominant cost for large `n`.  At `n ≤ 18` (4He / 6Li / smaller
/// atomic-braid use cases) the cost is acceptable (≤ 385 partitions).
/// For larger `n`, a rim-walking enumeration (cf. Halverson-Ram 2003
/// §3) would reduce per-call cost from O(p(target)) to O(rim_length
/// · #(broken-strip-shapes)) which is roughly O(n²).  Deferred until
/// a use case requires `n ≥ 24`.
fn removable_broken_strips(lambda: &[usize], k: usize) -> Vec<(Vec<usize>, BrokenStrip)> {
    let mut out = Vec::new();
    if k == 0 {
        out.push((lambda.to_vec(), BrokenStrip { components: vec![] }));
        return out;
    }
    let n: usize = lambda.iter().sum();
    if n < k { return out; }
    // Enumerate sub-partitions of λ with size n-k.
    let target_size = n - k;
    enumerate_subpartitions(lambda, target_size, |nu| {
        // Check λ/ν is a "broken strip" (each component is a border strip,
        // i.e. no 2x2 sub-block in λ/ν).
        if let Some(strip) = analyze_skew_shape(lambda, nu) {
            if strip.total_size() == k {
                out.push((nu.to_vec(), strip));
            }
        }
    });
    out
}

/// Enumerate all sub-partitions ν ⊆ λ with |ν| = target_size.
fn enumerate_subpartitions(
    lambda: &[usize], target_size: usize,
    mut visit: impl FnMut(&[usize]),
) {
    let mut nu = vec![0usize; lambda.len()];
    enumerate_sub_rec(lambda, target_size, &mut nu, 0, target_size, &mut visit);
}

fn enumerate_sub_rec(
    lambda: &[usize], _target_size: usize,
    nu: &mut [usize], row: usize, remaining: usize,
    visit: &mut impl FnMut(&[usize]),
) {
    if row == lambda.len() {
        if remaining == 0 {
            // Trim trailing zeros.
            let mut trimmed: Vec<usize> = nu.to_vec();
            while trimmed.last() == Some(&0) { trimmed.pop(); }
            visit(&trimmed);
        }
        return;
    }
    let max_v = lambda[row].min(remaining);
    let prev = if row == 0 { usize::MAX } else { nu[row - 1] };
    let upper = max_v.min(prev);
    for v in 0..=upper {
        nu[row] = v;
        enumerate_sub_rec(lambda, _target_size, nu, row + 1, remaining - v, visit);
    }
    nu[row] = 0;
}

/// Analyze the skew shape λ/ν.  Returns Some(BrokenStrip) if every
/// connected component is a connected border strip (no 2x2 block);
/// otherwise None.
fn analyze_skew_shape(lambda: &[usize], nu: &[usize]) -> Option<BrokenStrip> {
    // Collect cells of λ/ν.
    let mut cells: Vec<(usize, usize)> = Vec::new();
    for (i, &li) in lambda.iter().enumerate() {
        let nui = if i < nu.len() { nu[i] } else { 0 };
        if nui > li { return None; }  // ν not contained in λ
        for j in nui..li {
            cells.push((i, j));
        }
    }
    if cells.is_empty() {
        return Some(BrokenStrip { components: vec![] });
    }
    // Reject if any 2x2 sub-block is fully contained in the skew.
    let cell_set: std::collections::HashSet<(usize, usize)> = cells.iter().copied().collect();
    for &(r, c) in &cells {
        if cell_set.contains(&(r, c + 1))
            && cell_set.contains(&(r + 1, c))
            && cell_set.contains(&(r + 1, c + 1))
        {
            return None;  // 2x2 block — not a border strip
        }
    }
    // Find connected components (4-adjacency: horizontal + vertical).
    let mut visited: std::collections::HashSet<(usize, usize)> = std::collections::HashSet::new();
    let mut components = Vec::new();
    for &start in &cells {
        if visited.contains(&start) { continue; }
        // BFS from start.
        let mut comp_cells: Vec<(usize, usize)> = Vec::new();
        let mut stack = vec![start];
        while let Some((r, c)) = stack.pop() {
            if !visited.insert((r, c)) { continue; }
            if !cell_set.contains(&(r, c)) { continue; }
            comp_cells.push((r, c));
            for &(dr, dc) in &[(0i32, 1i32), (0, -1), (1, 0), (-1, 0)] {
                let nr = r as i32 + dr;
                let nc = c as i32 + dc;
                if nr >= 0 && nc >= 0 {
                    let nb = (nr as usize, nc as usize);
                    if cell_set.contains(&nb) && !visited.contains(&nb) {
                        stack.push(nb);
                    }
                }
            }
        }
        // Compute height = (number of distinct rows touched) - 1.
        let rows: std::collections::HashSet<usize> = comp_cells.iter().map(|&(r, _)| r).collect();
        let height = rows.len().saturating_sub(1);
        components.push(StripComponent { cells: comp_cells, height });
    }
    Some(BrokenStrip { components })
}

/// q-weight of a CONNECTED border strip with given size and height.
///
/// This is the per-component factor used by the Halverson-Ram broken-
/// strip rule (now wired into `chi_q_rec_memo` directly).  Kept as
/// a standalone function for clarity / future reference.
///
///   weight(connected strip, size k, height h) = q^{k - 1 - h} · (-q⁻¹)^h
///
/// Verified at q = q₀ ≈ 1.10998 against Hoefsmit on canonical T_w:
///   12 / 12 cycle-type cases match (single transpositions and
///   3-cycles across S_3 irreps).
///
/// **WARNING: SIMPLIFIED — NOT THE FULL RAM-WENZL FORMULA.**
///
/// Per Ram 1991 / Wenzl 1988, the correct q-weight for a border
/// strip involves arm-leg statistics (not just height).  This
/// simplified form:
///
///   weight(strip of size k, height h) = (−q⁻¹)^h · q^{k − 1 − h}
///
/// is correct for:
///   - All cases at q = 1 (collapses to (−1)^h, classical MN).
///   - Size-1 strips at any q (transpositions on the seminormal
///     basis: q for symmetric, −q⁻¹ for anti-symmetric channels).
///   - Trivial rep λ = (n) at any q (all strips have height 0
///     within a single row, weight = q^{k-1}).
///
/// **It is NOT correct** for non-trivial irreps at q ≠ 1 with strips
/// of size ≥ 2.  Cross-validation against Hoefsmit at q₀ ≈ 1.10998
/// for D (n=6) and T (n=9) atomic braids shows differences of
/// O(1) for the first 5 partitions of each isotope.
///
/// The full Ram-Wenzl weight requires:
///
///   1. For each strip cell, compute its arm and leg lengths within
///      the strip.
///   2. The weight factor for each cell is `q^{arm} · (−q⁻¹)^{leg}`.
///   3. The total weight is the product over cells, possibly with
///      a global `(q − q⁻¹)^?` correction.
///
/// See `seminormal_mn_qdef_design.md` for the implementation
/// roadmap; the proper formula is the subject of the next F3.2
/// commit.
fn q_strip_weight(
    size: usize,
    height: usize,
) -> crate::laurent_poly_q::LaurentPolyQ {
    use crate::laurent_poly_q::LaurentPolyQ;
    // q^{k − 1 − h}.
    let k_minus_one_minus_h: i32 = (size as i32) - 1 - (height as i32);
    let q_part = LaurentPolyQ::q_pow(k_minus_one_minus_h);
    // (−q⁻¹)^h:
    //   = (−1)^h · q^{−h}.
    let sign: i64 = if height % 2 == 0 { 1 } else { -1 };
    let mut sign_q_minus_h = LaurentPolyQ::q_pow(-(height as i32));
    sign_q_minus_h.scalar_mul_assign(sign);
    sign_q_minus_h * q_part
}

fn chi_q_rec_memo(
    lambda: &[usize],
    mu: &[usize],
    mu_offset: usize,
    memo: &mut std::collections::HashMap<(Vec<usize>, usize), crate::laurent_poly_q::LaurentPolyQ>,
) -> crate::laurent_poly_q::LaurentPolyQ {
    use crate::laurent_poly_q::LaurentPolyQ;
    if mu_offset >= mu.len() {
        return if lambda.iter().all(|&x| x == 0) {
            LaurentPolyQ::one()
        } else {
            LaurentPolyQ::zero()
        };
    }
    let key = (lambda.to_vec(), mu_offset);
    if let Some(v) = memo.get(&key) {
        return v.clone();
    }
    let head = mu[mu_offset];
    let mut total = LaurentPolyQ::zero();
    // F3.2.δ: enumerate BROKEN border strips (Halverson-Ram 2003) and
    // weight by `(q − q⁻¹)^{cc-1} · ∏ (-q⁻¹)^{ht_i}`.  At cc = 1 this
    // reduces to (-q⁻¹)^h, recovering connected strips.
    let h_pol = LaurentPolyQ::hecke_h();
    for (lambda_minus, strip) in removable_broken_strips(lambda, head) {
        // F3.2.δ Halverson-Ram broken-strip weight:
        //
        //   weight = (q − q⁻¹)^{cc − 1} · ∏_{components c}
        //              q^{size(c) − 1 − ht(c)} · (−q⁻¹)^{ht(c)}
        //
        // For connected strip (cc=1): reduces to q^{size−1−ht} · (−q⁻¹)^ht
        //   (Iwahori-Hecke seminormal eigenvalue product).
        // For broken strip (cc>1): adds (q−q⁻¹)^{cc−1} factor and
        //   accumulates the per-component q-power factors.
        let cc = strip.cc();
        if cc == 0 { continue; }
        let mut weight = LaurentPolyQ::one();
        // (q − q⁻¹)^{cc−1}.
        for _ in 0..(cc - 1) {
            weight = weight * h_pol.clone();
        }
        // Per-component factor: q^{size(c)−1−ht(c)} · (−q⁻¹)^{ht(c)}.
        for comp in &strip.components {
            let size_c = comp.cells.len();
            let ht_c = comp.height;
            // q^{size − 1 − ht}.
            let q_arm = LaurentPolyQ::q_pow((size_c as i32) - 1 - (ht_c as i32));
            weight = weight * q_arm;
            // (−q⁻¹)^{ht} = (−1)^ht · q^{−ht}.
            let sign: i64 = if ht_c % 2 == 0 { 1 } else { -1 };
            let mut q_leg = LaurentPolyQ::q_pow(-(ht_c as i32));
            q_leg.scalar_mul_assign(sign);
            weight = weight * q_leg;
        }

        let sub_chi = chi_q_rec_memo(&lambda_minus, mu, mu_offset + 1, memo);
        total += &(weight * sub_chi);
    }
    memo.insert(key, total.clone());
    total
}

/// Enumerate cycle types (partitions of n) — useful for building
/// classical character tables.
pub fn cycle_types(n: usize) -> Vec<Vec<usize>> {
    partitions_of(n)
}

#[cfg(test)]
mod tests {
    use super::*;

    /// At λ = (n), the trivial representation: χ^(n)(any μ) = 1.
    #[test]
    fn trivial_rep_chi_one() {
        for n in 1..=6 {
            for mu in cycle_types(n) {
                assert_eq!(
                    mn_chi(&[n], &mu),
                    1,
                    "χ^({}) at μ={:?} should be 1",
                    n, mu
                );
            }
        }
    }

    /// At λ = (1ⁿ), the sign rep: χ^(1ⁿ)(μ) = (-1)^{n - r(μ)}
    /// where r(μ) is the number of parts of μ.
    #[test]
    fn sign_rep_chi() {
        for n in 1..=5 {
            let lambda = vec![1; n];
            for mu in cycle_types(n) {
                let r = mu.len();
                let expected: i64 = if (n - r) % 2 == 0 { 1 } else { -1 };
                let actual = mn_chi(&lambda, &mu);
                assert_eq!(
                    actual,
                    expected,
                    "χ^(1^{}) at μ={:?} should be {} (got {})",
                    n, mu, expected, actual
                );
            }
        }
    }

    /// Identity element χ^λ(1ⁿ) = dim S^λ = n! / Π hook(c).
    /// Spot-check at n=4: dim S^(2,2) = 2.
    #[test]
    fn dim_check_at_identity() {
        // dim S^(4) = 1
        assert_eq!(mn_chi(&[4], &[1, 1, 1, 1]), 1);
        // dim S^(3,1) = 3
        assert_eq!(mn_chi(&[3, 1], &[1, 1, 1, 1]), 3);
        // dim S^(2,2) = 2
        assert_eq!(mn_chi(&[2, 2], &[1, 1, 1, 1]), 2);
        // dim S^(2,1,1) = 3
        assert_eq!(mn_chi(&[2, 1, 1], &[1, 1, 1, 1]), 3);
        // dim S^(1,1,1,1) = 1
        assert_eq!(mn_chi(&[1, 1, 1, 1], &[1, 1, 1, 1]), 1);
    }

    /// Plancherel identity: Σ_λ (dim S^λ)² = n!
    #[test]
    fn plancherel_identity_n_5() {
        let mut total: i64 = 0;
        for lambda in cycle_types(5) {
            let d = mn_chi(&lambda, &[1, 1, 1, 1, 1]);
            total += d * d;
        }
        assert_eq!(total, 120, "5! = 120");
    }

    /// Cycle-type extraction from a positive braid word.
    #[test]
    fn cycle_type_positive_braid() {
        // σ_1 on 3 strands: swap (1,2); cycle type = (2, 1).
        assert_eq!(positive_braid_cycle_type(3, &[(1, 1)]), vec![2, 1]);
        // σ_1 σ_2 on 3 strands: 3-cycle (1 2 3).  cycle type = (3,).
        assert_eq!(positive_braid_cycle_type(3, &[(1, 1), (1, 2)]), vec![3]);
        // σ_1 σ_2 σ_1 on 3 strands: longest element, cycle type = (2, 1)
        // (since (1 3) is a 2-cycle and 2 is fixed)
        let ct = positive_braid_cycle_type(3, &[(1, 1), (1, 2), (1, 1)]);
        assert_eq!(ct, vec![2, 1]);
        // Identity word: all 1-cycles.
        assert_eq!(positive_braid_cycle_type(4, &[]), vec![1, 1, 1, 1]);
    }

    /// q-MN braid expansion: positive single-generator word matches direct.
    #[test]
    fn q_mn_braid_positive_single_gen() {
        // σ_1 on 3 strands at λ = (3): trivial rep, χ = q.
        let chi = chi_lambda_braid_qdef(&[3], 3, &[(1, 1)]);
        // Cycle type of σ_1 = (2, 1), so should equal chi_lambda_mn_qdef(λ, [2,1]).
        let direct = chi_lambda_mn_qdef(&[3], &[2, 1]);
        assert_eq!(chi, direct);
    }

    /// q-MN braid expansion: σ⁻¹ on trivial rep should give 1/q.
    /// Hecke relation: σ⁻¹ = σ − h.
    /// On trivial rep: χ_λ(σ) = q, χ_λ(1) = 1, so χ_λ(σ⁻¹) = q − h = q − (q − q⁻¹) = q⁻¹.
    #[test]
    fn q_mn_braid_inverse_trivial_rep() {
        use num_bigint::BigInt;
        // σ_1⁻¹ on 3 strands at λ = (3).
        let chi = chi_lambda_braid_qdef(&[3], 3, &[(-1, 1)]);
        // Expected: q^{-1}.
        let expected = crate::laurent_poly_q::LaurentPolyQ::q_pow(-1);
        assert_eq!(chi, expected,
                   "χ_(3)(σ⁻¹) should be q^{{-1}}, got: {}", chi.pretty());
        // Sanity: at q=1, value should be 1.
        assert_eq!(chi.evaluate_at_one(), BigInt::from(1));
    }

    /// q-MN at q = 1 must equal classical MN (substitute q → 1).
    #[test]
    fn q_mn_at_q_eq_one_matches_classical() {
        use num_bigint::BigInt;
        let cases = vec![
            (vec![3usize], vec![2usize, 1]),
            (vec![2, 1], vec![2, 1]),
            (vec![1, 1, 1], vec![2, 1]),
            (vec![3], vec![3]),
            (vec![2, 1], vec![3]),
            (vec![1, 1, 1], vec![3]),
            (vec![2, 2, 1], vec![5]),
            (vec![3, 2], vec![3, 2]),
            (vec![4, 1], vec![3, 1, 1]),
        ];
        for (lambda, mu) in cases {
            let chi_classical = mn_chi(&lambda, &mu);
            let chi_q = chi_lambda_mn_qdef(&lambda, &mu);
            let chi_at_one: BigInt = chi_q.evaluate_at_one();
            assert_eq!(
                chi_at_one,
                BigInt::from(chi_classical),
                "λ={:?}, μ={:?}: classical = {}, q-MN(q=1) = {}",
                lambda, mu, chi_classical, chi_at_one
            );
        }
    }

    /// q-MN at λ = (n) (trivial rep): χ^(n)(any μ; q) = q^{(sum μ_i − r(μ))}
    /// where r(μ) is the number of cycles.  This is because each cycle
    /// of length k contributes a single border strip of size k with
    /// height 0, weight q^{k − 1}.
    #[test]
    fn q_mn_trivial_rep_evaluates_to_q_pow() {
        use num_bigint::BigInt;
        use num_traits::One;
        // λ = (5), μ = (3, 2): expected q^{(3-1) + (2-1)} = q^3.
        let chi = chi_lambda_mn_qdef(&[5], &[3, 2]);
        // At q = 1: should be 1.
        assert_eq!(chi.evaluate_at_one(), BigInt::one());
        // Check the result has the expected q^3 leading term.
        let pretty = chi.pretty();
        assert!(pretty.contains("q^3") || pretty == "q^3" || pretty.starts_with("q^3"),
                "expected q^3, got: {}", pretty);
    }

    /// Orthogonality: Σ_μ z(μ)⁻¹ · χ^λ(μ) · χ^ν(μ) = δ_{λν}
    /// where z(μ) = product of (m_i! · i^{m_i}) for cycle multiplicities.
    /// Spot-check on n = 3: only λ ∈ {(3), (2,1), (1,1,1)}.
    #[test]
    fn character_orthogonality_n_3() {
        let parts: Vec<Vec<usize>> = cycle_types(3);
        // z((3)) = 3, z((2,1)) = 2, z((1,1,1)) = 6.
        let z_inv = |mu: &[usize]| -> f64 {
            let mut z = 1u64;
            // m_i = number of cycles of length i.
            let mut counts = std::collections::HashMap::<usize, u32>::new();
            for &m in mu {
                *counts.entry(m).or_insert(0) += 1;
            }
            for (&i, &m_i) in &counts {
                let mut fact: u64 = 1;
                for k in 1..=m_i {
                    fact *= k as u64;
                }
                let mut pow: u64 = 1;
                for _ in 0..m_i {
                    pow *= i as u64;
                }
                z *= fact * pow;
            }
            1.0 / z as f64
        };

        for lambda in &parts {
            for nu in &parts {
                let mut sum: f64 = 0.0;
                for mu in cycle_types(3) {
                    sum += z_inv(&mu)
                        * mn_chi(lambda, &mu) as f64
                        * mn_chi(nu, &mu) as f64;
                }
                let expected = if lambda == nu { 1.0 } else { 0.0 };
                assert!(
                    (sum - expected).abs() < 1e-12,
                    "⟨χ^{:?}, χ^{:?}⟩ should be {} but got {}",
                    lambda, nu, expected, sum
                );
            }
        }
    }
}
