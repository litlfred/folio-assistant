"""Wedderburn-Artin weights, q-dimensions, partition utilities.

**M2 inversion (2b Phase B)**: this module now OWNS the canonical
implementations of these 8 q-combinatorics primitives. Previously
(M1) the file re-exported them from `hecke_core.py`; the post-carve-
out shim chain is now the reverse: `hecke_core.py` re-exports from
here for back-compat with the 22+ external scripts that still do
`from hecke_core import partition_dimension`.

Symbols owned by this module:
  q_hook_product, q_factorial, partitions_of, partition_dimension,
  partition_conjugate, partition_is_self_conjugate, q_dimension,
  wedderburn_weight

For the `partition_jet_depth` (jet-prefix combinatorial depth) symbol
— EXPLORATORY per the canonical/exploratory audit
(docs/audits/2026-05-24-hecke-core-canonical-audit.md) — see
`folio-assistant/computations/_deprecated/hecke_core_legacy.py`. It
is re-exported here for back-compat but lives in the legacy file.

See `partition.py` for Young-tableau specific helpers (SYT
enumeration, content-vector lookups) that build on top of these
primitives.
"""

from __future__ import annotations

import math

# Substrate q from q_parameter (no hecke_core dependency — this module
# is a SOURCE, not a re-exporter). q_parameter is part of the
# substrate trio that's been promoted to `qou-substrate` (PR #1068);
# the back-compat shim in folio-assistant/computations/q_parameter.py
# re-exports from qou_substrate, so either import path works at
# runtime.
try:
    from q_parameter import q_int  # type: ignore[import-not-found]
except ImportError:
    # Fallback for installations where qou-substrate is the only
    # provider (no folio-assistant/computations/ on sys.path).
    from qou_substrate.constants import q_int  # type: ignore[import-not-found]


def q_hook_product(partition):
    """q-hook product H_q(λ) = ∏_{x∈λ} [h_x(λ)]_q, evaluated numerically
    at the global substrate q = q0 (from q_parameter).

    For symbolic evaluation in q, use a sympy wrapper or the CRT
    reconstruction in crt_markov.py.

    Hook length h_x = arm_x + leg_x + 1 where arm = #boxes to the right
    in the same row, leg = #boxes below in the same column.
    """
    lam = list(partition)
    if not lam:
        return 1.0
    width = lam[0]
    conj = [sum(1 for p in lam if p > j) for j in range(width)]
    H = 1.0
    for i, li in enumerate(lam):
        for j in range(li):
            arm = li - j - 1
            leg = conj[j] - i - 1
            H *= q_int(arm + leg + 1)
    return H


def q_factorial(n):
    """[n]_q! = [1]_q · [2]_q · ... · [n]_q (symbolic in q)."""
    f = 1.0
    for i in range(1, n + 1):
        f *= q_int(i)
    return f


def partitions_of(n):
    """Enumerate partitions of n as decreasing tuples."""
    if n == 0:
        yield ()
        return
    def gen(rem, mx):
        if rem == 0:
            yield ()
            return
        for k in range(min(rem, mx), 0, -1):
            for r in gen(rem - k, k):
                yield (k,) + r
    yield from gen(n, n)


def partition_dimension(partition):
    """Dimension d(λ) = number of standard Young tableaux of shape λ
    (computed by the hook-length formula: d = n! / ∏ h_x)."""
    n = sum(partition)
    if n == 0:
        return 1
    fact_n = math.factorial(n)
    lam = list(partition)
    width = lam[0]
    conj = [sum(1 for p in lam if p > j) for j in range(width)]
    prod = 1
    for i, li in enumerate(lam):
        for j in range(li):
            arm = li - j - 1
            leg = conj[j] - i - 1
            prod *= (arm + leg + 1)
    return fact_n // prod


def partition_conjugate(partition):
    """Conjugate partition λ' = transpose of the Young diagram of λ.

    λ'_j = #{i : λ_i ≥ j}.  λ' is also a partition, and (λ')' = λ.
    λ is SELF-CONJUGATE iff λ = λ' (e.g. (3,2,1), (4,2,1,1)).
    """
    if not partition:
        return tuple()
    width = partition[0]
    return tuple(sum(1 for p in partition if p >= j + 1)
                 for j in range(width))


def partition_is_self_conjugate(partition):
    return tuple(partition) == partition_conjugate(partition)


def q_dimension(partition):
    """Quantum dimension d_q(λ) = [n]_q! / H_q(λ) (symbolic in q)."""
    n = sum(partition)
    if n == 0:
        return 1.0
    return q_factorial(n) / q_hook_product(partition)


def wedderburn_weight(partition):
    """Wedderburn-Artin weight w_λ = d_q(λ)² / [n]_q! (symbolic in q)."""
    n = sum(partition)
    if n == 0:
        return 1.0
    return q_dimension(partition)**2 / q_factorial(n)


# partition_jet_depth (EXPLORATORY, in _deprecated/hecke_core_legacy.py)
# is re-exported here for back-compat with the previous package surface.
# Delegate-only — this symbol is NOT inverted; legacy keeps ownership.
from . import _legacy  # noqa: F401, E402 — keeps the sys.path bridge alive

try:
    from hecke_core import partition_jet_depth  # type: ignore[import-not-found]
except ImportError:
    # Graceful: only legacy consumers need this symbol.
    partition_jet_depth = None  # type: ignore[assignment]


__all__ = [
    "partitions_of",
    "partition_dimension",
    "partition_conjugate",
    "partition_is_self_conjugate",
    "partition_jet_depth",
    "q_dimension",
    "wedderburn_weight",
    "q_factorial",
    "q_hook_product",
]
