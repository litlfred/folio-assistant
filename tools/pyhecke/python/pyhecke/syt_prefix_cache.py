#!/usr/bin/env python3
"""
Shared-prefix cache for Hoefsmit seminormal matrix construction.

The Hoefsmit 1×1/2×2 block for generator σ_k in irrep λ acting on
the SYT |T⟩ depends only on the content distance
  ρ = c_T(k+1) − c_T(k)
between the cells of entries k and k+1.  This is identical for any
SYT of any partition sharing the same entry-k / entry-(k+1) cells.

``BlockCache`` keys by the rational ρ (an int in practice) and
stores the tuple (a_ρ, a'_ρ, b_ρ) used to build the block:

  a_ρ  = h / (1 − q^{−2ρ})         diagonal
  a'_ρ = h / (1 − q^{2ρ})          swap-diagonal (= a_{−ρ})
  b_ρ  = sqrt(a_ρ · a'_ρ + 1)      off-diagonal

Shared across the 77 partitions at n=12, block-value arithmetic is
evaluated at most (2n−1) times per q instead of
O(Σ_λ d_λ · (n−1)).  The bigger win is the SYT→index dict built
once per shape: it eliminates the O(d_λ²) inner search in the
legacy build_seminormal_matrices loop, which at n=12 dominates the
per-shape cost for large-dim irreps like (6, 3, 2, 1) where
d_λ ≫ 100.
"""
from __future__ import annotations

import math


class BlockCache:
    """Cache of Hoefsmit block values keyed by content distance ρ.

    Shared across all ``build_seminormal_matrices_cached`` calls
    within a single Ocneanu inversion; tied to one q value.
    """

    def __init__(self, q: float, h: float):
        self.q = q
        self.h = h
        self.hits = 0
        self.misses = 0
        self._by_rho: dict[int, tuple[float, float, float]] = {}

    def get(self, rho: int) -> tuple[float, float, float]:
        """Return (a_ρ, a'_ρ, b_ρ) — computes and memoizes if unseen."""
        cached = self._by_rho.get(rho)
        if cached is not None:
            self.hits += 1
            return cached
        self.misses += 1
        q = self.q
        h = self.h
        denom_a = 1.0 - q ** (-2 * rho)
        a = h / denom_a if abs(denom_a) > 1e-15 else 0.0
        denom_ap = 1.0 - q ** (2 * rho)
        a_prime = h / denom_ap if abs(denom_ap) > 1e-15 else 0.0
        b_sq = a * a_prime + 1.0
        b = math.sqrt(abs(b_sq))
        entry = (a, a_prime, b)
        self._by_rho[rho] = entry
        return entry


def build_seminormal_matrices_cached(shape, *, cache: BlockCache,
                                        sparse=None,
                                        q_val: float = None):
    """Fast rebuild of Hoefsmit seminormal matrices using a shared
    BlockCache for content-distance arithmetic and a per-shape
    SYT→index map to eliminate the O(d_λ²) swap-partner search.

    Accepts an optional q_val override (Track 2 uses this to rebuild
    matrices at q^{-1} without rebuilding the cache).  If q_val is
    provided and differs from cache.q, a TRANSIENT BlockCache at the
    new q is used instead (the shared cache is unchanged).

    Returns (sigmas, dim, syts) matching
    hecke_characters.build_seminormal_matrices.
    """
    import numpy as np
    from hecke_characters import standard_young_tableaux

    syts, cells, contents = standard_young_tableaux(shape)
    dim = len(syts)
    if dim == 0:
        return [], dim, syts
    n = sum(shape)
    use_sparse = sparse if sparse is not None else (dim > 500)

    # Use a transient cache if q is overridden.
    if q_val is not None and q_val != cache.q:
        local_cache = BlockCache(q_val, q_val - 1.0 / q_val)
    else:
        local_cache = cache

    # Precompute SYT hashable→index map for O(1) swap-partner lookup.
    syt_keys = [tuple(sorted(T.items())) for T in syts]
    syt_to_idx = {k: i for i, k in enumerate(syt_keys)}

    sigmas = []
    for k in range(1, n):
        rows, cols, vals = [], [], []
        processed = [False] * dim
        for i in range(dim):
            if processed[i]:
                continue
            ci_k = syts[i][k]
            ci_k1 = syts[i][k + 1]
            rho = contents[ci_k1] - contents[ci_k]
            a, a_prime, b = local_cache.get(rho)

            # Swap entries k and k+1 and look up by dict.
            Ti = dict(syts[i])
            Ti[k] = ci_k1
            Ti[k + 1] = ci_k
            key = tuple(sorted(Ti.items()))
            j = syt_to_idx.get(key)

            if j is None or j == i:
                rows.append(i)
                cols.append(i)
                vals.append(a)
                processed[i] = True
            else:
                rows.extend([i, j, i, j])
                cols.extend([i, j, j, i])
                vals.extend([a, a_prime, b, b])
                processed[i] = True
                processed[j] = True

        if use_sparse:
            from scipy import sparse as sp_sparse
            M = sp_sparse.csr_matrix(
                (vals, (rows, cols)), shape=(dim, dim))
        else:
            M = np.zeros((dim, dim))
            for r, c, v in zip(rows, cols, vals):
                M[r, c] = v
        sigmas.append(M)

    return sigmas, dim, syts
