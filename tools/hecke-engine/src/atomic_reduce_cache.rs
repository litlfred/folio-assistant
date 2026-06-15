//! Rust-side cache of reduced [`LaurentHeckeElement`]s keyed by
//! signed-word-prefix hash.  **Zero FFI marshalling on hit.**
//!
//! The disk-resident JSON cache landed in
//! `_prefix_cache.py` was empirically a net loss on the canonical
//! sweep (12% slower at ⁶Li) because shipping the cached state
//! Python → Rust through decimal-string FFI exceeded the saving
//! from skipping the prefix's reduce work.  See
//! [`docs/audits/2026-05-22-prefix-cache-negative-bench.md`].
//!
//! This in-process cache fixes that: when a Python caller invokes
//! [`crate::tr_m_atomic_mpfr::tr_m_atomic_mpfr_cached`], the
//! signed-word prefix is hashed *inside Rust*, the cached
//! `LaurentHeckeElement` is fetched by hash (no marshalling), the
//! suffix is reduced from that state, and the final state is
//! re-cached under the full signed-word's hash.
//!
//! Cache lifetime: process-bound (no persistence across `python3`
//! invocations).  For mass-table sweeps that compute many atoms in
//! one process, the cumulative wall is essentially the wall of the
//! largest atom (suffix-only reduce on each).

use crate::laurent_hecke_element::LaurentHeckeElement;
use rustc_hash::FxHasher;
use std::collections::HashMap;
use std::hash::Hasher;
use std::sync::{Mutex, OnceLock};

/// Per-entry memory is dominated by `LaurentHeckeElement` size,
/// which scales as `terms × coefs_per_term`.  ⁶Li alone is ~50 MB.
/// Cap on entry count: 64 — comfortably covers a full mass-table
/// sweep (8 atoms × small variants) without thrashing.
const MAX_ENTRIES: usize = 64;

static REDUCE_CACHE: OnceLock<Mutex<HashMap<u64, LaurentHeckeElement>>> = OnceLock::new();

fn cache() -> &'static Mutex<HashMap<u64, LaurentHeckeElement>> {
    REDUCE_CACHE.get_or_init(|| Mutex::new(HashMap::new()))
}

/// FxHash of a signed-word prefix.  `FxHasher` is non-cryptographic
/// but fast and well-distributed at our scale (≤ thousands of
/// prefixes per session); 64-bit space makes collisions astronomically
/// unlikely for the kinds of prefix sets atomic-braid sweeps produce.
pub fn hash_prefix(signed_word_prefix: &[(i8, i32)]) -> u64 {
    let mut h = FxHasher::default();
    // Manually feed each (sign, gen) pair so the hash depends on the
    // full content, not just the slice length / address.
    for &(sign, gen) in signed_word_prefix {
        h.write_i8(sign);
        h.write_i32(gen);
    }
    h.finish()
}

/// Find the longest cached prefix of `signed_word` (possibly the
/// full word — exact-match cache hits return `prefix_len ==
/// signed_word.len()` with an empty suffix, which is the
/// expected behavior when the same atom is recomputed).
///
/// Returns `(prefix_len, Option<state_clone>)`.  The state is
/// cloned out of the cache because the caller will mutate it
/// (apply the suffix); the cache itself stays warm.
pub fn find_longest_cached_prefix(
    signed_word: &[(i8, i32)],
) -> (usize, Option<LaurentHeckeElement>) {
    let g = match cache().lock() {
        Ok(g) => g,
        Err(_) => return (0, None),  // poisoned mutex: degrade gracefully
    };
    // Try prefix lengths in decreasing order so we find the LONGEST
    // matching prefix first.  Range is `1..=len` (inclusive) so the
    // full-word cache hit is returned when the same atom is
    // recomputed in the same process — the resume-from-state path
    // then runs zero crossings and just re-evaluates MPFR.
    for prefix_len in (1..=signed_word.len()).rev() {
        let h = hash_prefix(&signed_word[..prefix_len]);
        if let Some(state) = g.get(&h) {
            return (prefix_len, Some(state.clone()));
        }
    }
    (0, None)
}

/// Insert or update the cache entry for `signed_word` with the
/// reduced `state`.  Cache entries are bounded by [`MAX_ENTRIES`];
/// when the cap is hit, the cache is fully cleared (simple, fast,
/// adequate for the mass-table-sweep workload).
pub fn save_prefix_state(signed_word: &[(i8, i32)], state: &LaurentHeckeElement) {
    let h = hash_prefix(signed_word);
    if let Ok(mut g) = cache().lock() {
        if g.len() >= MAX_ENTRIES && !g.contains_key(&h) {
            // Drop everything when we hit the cap.  Matches the
            // pattern in `tr_m_word_lq::cache()` and avoids the
            // complexity of an LRU at our scale.
            g.clear();
        }
        g.insert(h, state.clone());
    }
}

/// Empty the cache.  Call between independent sessions (or between
/// runs that should not share state) to avoid unbounded growth.
pub fn clear_cache() {
    if let Ok(mut g) = cache().lock() {
        g.clear();
    }
}

/// Number of cached entries (for stats / debug).
pub fn cache_size() -> usize {
    cache().lock().map(|g| g.len()).unwrap_or(0)
}
