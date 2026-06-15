//! Markov-axiom recursive ascent for the canonical Jones-Markov
//! trace, ported from `folio-assistant/computations/laurent_q_trace.py`.
//!
//! Strategy #1 from
//! `docs/audits/2026-05-20-markov-peel-bottleneck-profile.md`,
//! Phase-2 (Rust port) per the user's "deeper Rust port" approval.
//!
//! Output type: [`ZHLaurent`] — a formal polynomial in (z, h) with
//! [`LaurentPolyQ`] coefficients. The Python side calls
//! `tr_m_word_lq_serialized(word, n_strands)` via PyO3, gets back
//! a serialised ZHLaurent (`Vec<((i32, i32), Vec<(i32, BigInt)>)>`),
//! and evaluates at q₀ to mpmath.mpf at production dps.
//!
//! No f64 anywhere in the recursion — every coefficient is exact
//! `BigInt` via [`LaurentPolyQ`]. Per CLAUDE.md §Precision goals L1.

use crate::laurent_poly_q::LaurentPolyQ;
use std::collections::{BTreeMap, HashMap};
use std::sync::{Mutex, OnceLock};

/// Formal polynomial in (z, h) with [`LaurentPolyQ`] coefficients.
///
/// Internal representation: `BTreeMap<(i32, i32), LaurentPolyQ>` —
/// (z_exp, h_exp) → coefficient. BTreeMap for deterministic
/// iteration order (canonical equality + cache key stability).
#[derive(Clone, Debug, Default)]
pub struct ZHLaurent {
    pub terms: BTreeMap<(i32, i32), LaurentPolyQ>,
}

impl ZHLaurent {
    pub fn zero() -> Self {
        Self { terms: BTreeMap::new() }
    }

    pub fn one() -> Self {
        let mut t = BTreeMap::new();
        t.insert((0, 0), LaurentPolyQ::one());
        Self { terms: t }
    }

    pub fn is_zero(&self) -> bool {
        self.terms.is_empty()
    }

    /// Multiply by the variable z: shift each (a, b) → (a+1, b).
    pub fn mul_by_z(&self) -> Self {
        let mut out = BTreeMap::new();
        for (&(a, b), c) in &self.terms {
            out.insert((a + 1, b), c.clone());
        }
        Self { terms: out }
    }

    /// Multiply by the variable h: shift each (a, b) → (a, b+1).
    pub fn mul_by_h(&self) -> Self {
        let mut out = BTreeMap::new();
        for (&(a, b), c) in &self.terms {
            out.insert((a, b + 1), c.clone());
        }
        Self { terms: out }
    }

    /// `self + other` (dict-merge with LaurentPolyQ addition on collisions).
    pub fn add_ref(&self, other: &ZHLaurent) -> Self {
        let mut out: BTreeMap<(i32, i32), LaurentPolyQ> = self.terms.clone();
        for (&k, v) in &other.terms {
            match out.get_mut(&k) {
                Some(existing) => {
                    let sum = existing.clone() + v.clone();
                    if sum.terms.is_empty() {
                        out.remove(&k);
                    } else {
                        *existing = sum;
                    }
                }
                None => {
                    out.insert(k, v.clone());
                }
            }
        }
        Self { terms: out }
    }

    /// Serialise to a Vec for FFI. Each entry: `((z_exp, h_exp),
    /// Vec<(q_half_exp, big_int_decimal_string)>)`. The BigInt is
    /// emitted as a decimal string so PyO3 can ferry arbitrary-
    /// precision integers across the boundary.
    pub fn to_ffi(&self) -> Vec<((i32, i32), Vec<(i32, String)>)> {
        self.terms
            .iter()
            .map(|(&(a, b), coef)| {
                let coefs: Vec<(i32, String)> = coef
                    .terms
                    .iter()
                    .map(|(&exp, c)| (exp, c.to_string()))
                    .collect();
                ((a, b), coefs)
            })
            .collect()
    }
}

// ──────────────────────────────────────────────────────────────────
// Recursive Markov-axiom ascent
// ──────────────────────────────────────────────────────────────────

/// Cache key: (cyclic-canonical word, n_strands, max_depth).
///
/// **Tier 1.C — cyclic canonicalisation (2026-05-21).**  The
/// Markov trace satisfies `tr_M(αβ) = tr_M(βα)`, so any two words
/// that are cyclic rotations of each other have the same `tr_M`.
/// The cache key uses the *lexicographically smallest* cyclic
/// rotation so that all `n` rotations of an `n`-long word share
/// one cache entry.  The recursion body still operates on the
/// **original** word (the rotations in the algorithm body are
/// semantic, not just cache canonicalisation) — only the cache
/// key is canonicalised.  See the brief in
/// `docs/audits/2026-05-20-compute-optimization-roadmap.md` §Tier 1.C.
///
/// `depth` is excluded — it is a recursion-guard parameter, not
/// part of the function's semantic identity.
type CacheKey = (Vec<u32>, usize, u32);

/// Lexicographically smallest cyclic rotation of `word`.
///
/// `O(n²)` — adequate at typical atomic-braid word lengths
/// (≤ a few hundred); could be tightened to `O(n log n)` via
/// Booth's algorithm if a profile ever flags this.  See
/// `docs/audits/2026-05-20-compute-optimization-roadmap.md`
/// §Tier 1.C for the optimisation rationale.
pub(crate) fn canonical_cyclic(word: &[u32]) -> Vec<u32> {
    let n = word.len();
    if n <= 1 {
        return word.to_vec();
    }
    let mut best: Vec<u32> = word.to_vec();
    let mut rot: Vec<u32> = Vec::with_capacity(n);
    for i in 1..n {
        rot.clear();
        rot.extend_from_slice(&word[i..]);
        rot.extend_from_slice(&word[..i]);
        if rot < best {
            best.clone_from(&rot);
        }
    }
    best
}

/// Global cache (HashMap-bounded by maxsize). `Mutex<HashMap>`
/// rather than a proper LRU for simplicity; at ~100K entries max
/// the Mutex contention is negligible compared to the per-call
/// recursion cost.
static TR_M_CACHE: OnceLock<Mutex<HashMap<CacheKey, ZHLaurent>>> = OnceLock::new();

fn cache() -> &'static Mutex<HashMap<CacheKey, ZHLaurent>> {
    TR_M_CACHE.get_or_init(|| Mutex::new(HashMap::new()))
}

/// Clear the global recursion cache. Call between independent atoms
/// to prevent unbounded memory growth in long-running sessions.
pub fn clear_cache() {
    if let Ok(mut g) = cache().lock() {
        g.clear();
    }
}

/// Canonical Markov-trace recursion at the word level.
///
/// `word`: tuple of generator indices (0-based by external convention;
///         pass 1-based here for consistency with the rest of
///         hecke-engine? No — markov_trace_canonical uses 0-based, so
///         we use 0-based too here to match the Python ZHLaurent
///         implementation exactly).
/// `n_strands`: H_n strand count.
///
/// Mirrors `folio-assistant/computations/laurent_q_trace.py
/// tr_M_word_lq` line-by-line. Phase-1+2 scope: empty / single-top /
/// multi-top Case A / Case B. Case C raises (caller falls back to
/// the sympy ocneanu path — same behaviour as Python).
pub fn tr_m_word_lq(
    word: &[u32],
    n_strands: usize,
    max_depth: u32,
) -> Result<ZHLaurent, String> {
    tr_m_word_lq_impl(word, n_strands, max_depth, 0)
}

fn tr_m_word_lq_impl(
    word: &[u32],
    n_strands: usize,
    max_depth: u32,
    depth: u32,
) -> Result<ZHLaurent, String> {
    if depth > max_depth {
        return Err(format!(
            "tr_m_word_lq recursion too deep: word={:?}, n={}",
            word, n_strands
        ));
    }
    // Tier 1.C: cache key is the cyclic-canonical rotation, but the
    // recursion body uses the original `word` (the algorithmic
    // rotations inside `tr_m_word_lq_body` carry semantic meaning,
    // not just cache canonicalisation).
    let key: CacheKey = (canonical_cyclic(word), n_strands, max_depth);
    if let Some(cached) = cache().lock().unwrap().get(&key) {
        return Ok(cached.clone());
    }

    let result = tr_m_word_lq_body(word, n_strands, max_depth, depth)?;

    if let Ok(mut g) = cache().lock() {
        // Bound the cache; drop everything if we hit the cap.
        if g.len() >= 100_000 {
            g.clear();
        }
        g.insert(key, result.clone());
    }
    Ok(result)
}

fn tr_m_word_lq_body(
    word: &[u32],
    n_strands: usize,
    max_depth: u32,
    depth: u32,
) -> Result<ZHLaurent, String> {
    // (1) Empty word — tr_M(1) = 1
    if word.is_empty() {
        return Ok(ZHLaurent::one());
    }

    let max_gen = *word.iter().max().unwrap() as usize;

    // Generator validity guard. B_n has generators {0, 1, ..., n-2},
    // i.e. max_gen <= n_strands - 2, equivalently max_gen + 2 <= n_strands.
    // Without this, an out-of-range generator (e.g. gen=1 on B_2 where
    // only gen=0 is valid) skipped case (3) and fell through to case
    // (4)'s `top_positions.last().unwrap()`, which panicked on the
    // empty Vec. Surfaced by the hecke-engine-c smoke test for
    // tr_m_atomic_mpfr on n=2 with a single-letter word.
    if max_gen + 2 > n_strands {
        return Err(format!(
            "tr_m_word_lq: generator index {} out of range for B_{} \
             (valid range is [0, {}]; word = {:?})",
            max_gen,
            n_strands,
            n_strands.saturating_sub(2),
            word
        ));
    }

    // (2) Generator support below n - 2 — recurse at H_{max_gen + 2}
    if max_gen + 2 < n_strands {
        return tr_m_word_lq_impl(word, max_gen + 2, max_depth, depth + 1);
    }

    let top = (n_strands as i32 - 2) as u32;
    let top_positions: Vec<usize> = word
        .iter()
        .enumerate()
        .filter_map(|(i, &g)| if g == top { Some(i) } else { None })
        .collect();

    // (3) Single top — cyclic rotate + Markov II: tr_M(w·σ_top) = z·tr_M(rest)
    if top_positions.len() == 1 {
        let pos = top_positions[0];
        let mut rest: Vec<u32> = Vec::with_capacity(word.len() - 1);
        rest.extend_from_slice(&word[pos + 1..]);
        rest.extend_from_slice(&word[..pos]);
        let inner = tr_m_word_lq_impl(&rest, n_strands - 1, max_depth, depth + 1)?;
        return Ok(inner.mul_by_z());
    }

    // (4) Multiple tops — rotate so last top at rightmost position.
    let last_top = *top_positions.last().unwrap();
    let mut rotated: Vec<u32> = Vec::with_capacity(word.len());
    rotated.extend_from_slice(&word[last_top + 1..]);
    rotated.extend_from_slice(&word[..=last_top]);
    let rest = &rotated[..rotated.len() - 1];

    // Defensive guard (matches Python + markov_trace_canonical reference).
    if !rest.contains(&top) {
        let inner = tr_m_word_lq_impl(rest, n_strands - 1, max_depth, depth + 1)?;
        return Ok(inner.mul_by_z());
    }

    // Find the position of the second-to-last top (the "inner" one).
    let inner_pos = rest.len() - 1
        - rest.iter().rev().position(|&g| g == top).unwrap();
    let segment = &rest[inner_pos + 1..];

    // (5) Case A — no top-1 in segment: apply σ² = hσ + 1 after commute
    if !segment.iter().any(|&g| g == top - 1) {
        let prefix = &rest[..inner_pos];
        let mut new_base: Vec<u32> = Vec::with_capacity(prefix.len() + segment.len());
        new_base.extend_from_slice(prefix);
        new_base.extend_from_slice(segment);
        // term1 = tr_M(new_base + σ_top)
        let mut new_base_with_top = new_base.clone();
        new_base_with_top.push(top);
        let term1 = tr_m_word_lq_impl(&new_base_with_top, n_strands, max_depth, depth + 1)?;
        // term2 = tr_M(new_base)
        let term2 = tr_m_word_lq_impl(&new_base, n_strands, max_depth, depth + 1)?;
        return Ok(term1.mul_by_h().add_ref(&term2));
    }

    // (6) Case B — top-1 in segment: apply braid relation
    //     σ_top · σ_{top-1} · σ_top = σ_{top-1} · σ_top · σ_{top-1}
    let first_tm1_in_seg = segment.iter().position(|&g| g == top - 1).unwrap();
    let alpha = &segment[..first_tm1_in_seg];
    if alpha.iter().any(|&g| g == top - 1) {
        return Err(format!(
            "tr_m_word_lq: unexpected top-1 in alpha segment; word={:?}, n={}",
            word, n_strands
        ));
    }
    let beta = &segment[first_tm1_in_seg + 1..];
    if beta.iter().any(|&g| g == top - 1) {
        // Case C — multiple top-1 in segment. Python raises
        // NotImplementedError and caller routes through the sympy
        // ocneanu fallback. We do the same here so the Python
        // caller knows to fall back.
        return Err(format!(
            "tr_m_word_lq: Case C (multiple top-1 in segment) \
             not implemented; word={:?}, n={}",
            word, n_strands
        ));
    }

    // Build rewritten word:
    //   rest[:inner_pos] · alpha · σ_{top-1} · σ_top · σ_{top-1} · beta
    let mut new_word: Vec<u32> = Vec::with_capacity(rest.len() + 2);
    new_word.extend_from_slice(&rest[..inner_pos]);
    new_word.extend_from_slice(alpha);
    new_word.push(top - 1);
    new_word.push(top);
    new_word.push(top - 1);
    new_word.extend_from_slice(beta);
    tr_m_word_lq_impl(&new_word, n_strands, max_depth, depth + 1)
}

// ──────────────────────────────────────────────────────────────────
// Tests — cross-check against the Python ZHLaurent reference at
// the prop:categorical-mass-markov table values.
// ──────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    /// `tr_M(σ_0) = z` — single top at H_2.
    #[test]
    fn test_single_top() {
        clear_cache();
        let result = tr_m_word_lq(&[0], 2, 200).unwrap();
        // Should be ZHLaurent { (1, 0): 1 }
        assert_eq!(result.terms.len(), 1, "expected 1 term, got {:?}", result.terms);
        let key = (1i32, 0i32);
        assert!(result.terms.contains_key(&key),
                "expected (z^1 h^0), got keys {:?}",
                result.terms.keys().collect::<Vec<_>>());
        // coefficient should be 1 (i.e. LaurentPolyQ::one())
        let c = &result.terms[&key];
        assert!(c.terms.contains_key(&0), "coef should be q^0 = 1");
    }

    /// `tr_M(σ_0 σ_1) = z²` at H_3.
    #[test]
    fn test_two_gen_z_squared() {
        clear_cache();
        let result = tr_m_word_lq(&[0, 1], 3, 200).unwrap();
        let key = (2i32, 0i32);
        assert!(result.terms.contains_key(&key),
                "expected (z^2 h^0), got keys {:?}",
                result.terms.keys().collect::<Vec<_>>());
    }

    /// `tr_M(σ_0²) = h · z + 1` at H_2 (Hecke relation σ² = hσ + 1
    /// → tr_M(hσ + 1) = h · z + 1).
    #[test]
    fn test_hecke_quadratic() {
        clear_cache();
        let result = tr_m_word_lq(&[0, 0], 2, 200).unwrap();
        // Should be { (1, 1): 1, (0, 0): 1 }
        let key_hz = (1i32, 1i32);
        let key_const = (0i32, 0i32);
        assert!(result.terms.contains_key(&key_hz),
                "expected h·z term");
        assert!(result.terms.contains_key(&key_const),
                "expected constant 1 term");
    }

    // ── Tier 1.C: cyclic-canonical-form cache key ──────────────

    #[test]
    fn canonical_cyclic_smoke() {
        // Length 0 / 1 — passthrough.
        let v0: Vec<u32> = vec![];
        assert_eq!(canonical_cyclic(&v0), v0);
        let v1 = vec![7u32];
        assert_eq!(canonical_cyclic(&v1), v1);

        // (0, 1, 2) and (1, 2, 0) and (2, 0, 1) all canonicalise to (0, 1, 2).
        let canon = vec![0u32, 1, 2];
        assert_eq!(canonical_cyclic(&[0, 1, 2]), canon);
        assert_eq!(canonical_cyclic(&[1, 2, 0]), canon);
        assert_eq!(canonical_cyclic(&[2, 0, 1]), canon);

        // (2, 1, 0), (1, 0, 2), (0, 2, 1) — pick (0, 2, 1).
        let canon2 = vec![0u32, 2, 1];
        assert_eq!(canonical_cyclic(&[2, 1, 0]), canon2);
        assert_eq!(canonical_cyclic(&[1, 0, 2]), canon2);
        assert_eq!(canonical_cyclic(&[0, 2, 1]), canon2);
    }

    #[test]
    fn cache_hits_on_cyclic_rotation() {
        // Two words that are cyclic rotations of each other should
        // share a cache entry.  Verifies via cache-size increment.
        clear_cache();
        let _ = tr_m_word_lq(&[0, 1], 3, 200).unwrap();
        let size1 = cache().lock().unwrap().len();
        // Rotation [1, 0] = σ_1 σ_0.  tr_M is cyclic-invariant so
        // tr_M(σ_0 σ_1) = tr_M(σ_1 σ_0); the cache canonicalises
        // both to the same key.
        let _ = tr_m_word_lq(&[1, 0], 3, 200).unwrap();
        let size2 = cache().lock().unwrap().len();
        // Without cyclic canonicalisation the second call would
        // add a new entry; with canonicalisation it must hit the
        // existing one.  (The body may add intermediate entries
        // for recursive sub-calls — we only check that the *top-
        // level* cyclic-rotation call did not increment.)
        // The two calls share the same recursion tree, so size
        // should stay equal at the top-level invocation count.
        assert_eq!(size1, size2,
                   "cyclic rotation should hit existing cache entry; \
                    size before {} != after {}",
                   size1, size2);
    }

    #[test]
    fn cyclic_rotations_yield_equal_traces() {
        // σ_0 σ_1 and σ_1 σ_0 are cyclic rotations; their traces
        // must be bit-identical via the canonical-key cache.
        clear_cache();
        let r1 = tr_m_word_lq(&[0, 1], 3, 200).unwrap();
        let r2 = tr_m_word_lq(&[1, 0], 3, 200).unwrap();
        assert_eq!(r1.terms, r2.terms,
                   "tr_M cyclic-invariance violated: {:?} vs {:?}",
                   r1.terms, r2.terms);
    }

    /// Out-of-range generator returns an Err rather than panicking.
    /// Regression test for the n=2 / single-gen-1 panic surfaced by the
    /// hecke-engine-c smoke test.
    #[test]
    fn test_out_of_range_generator_errors() {
        clear_cache();
        // B_2 has only generator 0; passing gen=1 must error, not panic.
        let result = tr_m_word_lq(&[1], 2, 200);
        assert!(result.is_err(), "expected Err for gen=1 in B_2, got {:?}", result);
        let msg = result.unwrap_err();
        assert!(msg.contains("out of range"),
                "expected 'out of range' in error message, got: {msg}");
    }
}
