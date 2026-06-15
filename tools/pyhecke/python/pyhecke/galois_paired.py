"""Galois-pair short-circuit for paired Wedderburn-block characters.

The closed-form identity (proved symbolically in
`folio-assistant/computations/metallic_q_symbolic_galois_proofs.py`,
sorry-free Lean §3b-cond class `GaloisPairCharacterSum` in
`QOU.AlgebraicSubstrate.MetallicLPIdentities`):

    χ^λ(σ_i) + χ^{λ'}(σ_i) = dim(λ) · (q − q⁻¹)

holds at all real q > 0 for any partition λ and its transpose λ'.  This
means **paired-partition contributions to the Markov trace have a
closed form** that avoids computing each character independently.

For the Markov trace assembly:

    tr_M(σ_i) = Σ_λ y_λ(q) · χ^λ(σ_i)
              = Σ_{transpose pairs (λ, λ')} y_λ(q) · (χ^λ + χ^{λ'})
                + Σ_{self-conjugate λ} y_λ(q) · χ^λ
              = Σ_{transpose pairs} y_λ(q) · dim(λ) · (q − q⁻¹)
                + Σ_{self-conjugate λ} y_λ(q) · χ^λ(σ_i)

So **only the self-conjugate partitions need explicit character
computation**; everything else uses the closed-form short-circuit.

Self-conjugate partitions (those fixed by transposition) are
comparatively rare — their count is the number of partitions of n into
distinct odd parts, which grows far more slowly than p(n).  The compute
reduction is therefore p(n) / sc(n), which **grows with n** rather than
converging to a constant: measured at 3× (n=3), 7× (n=5), 15× (n=7),
21× (n=10), and 44× (n=15).  See `pair_shortcircuit_speedup`.

This module provides:
  - `transpose_pairs(n)`: enumerate partitions of n grouped into
    transpose pairs + self-conjugate singletons.
  - `markov_trace_pair_shortcircuit(n, q, ...)`: compute tr_M(σ_i)
    using the closed-form pair contribution and explicit characters
    only for self-conjugate partitions.

The module is q-generic: it works at any real q > 0, not just at
metallic ratios.  Combined with `metallic_q_arith.MetallicNumber`,
one can also use it for exact symbolic computation at q = δ_n.

Lean grounding: GaloisPairCharacterSum class.
"""

from __future__ import annotations

from typing import Callable, Iterable, Union

from .metallic_q_arith import MetallicNumber

Partition = tuple[int, ...]
Numeric = Union[float, MetallicNumber]


# ── Partition utilities ────────────────────────────────────────────────


def partitions(n: int) -> list[Partition]:
    """All partitions of n in weakly decreasing order."""
    out: list[Partition] = []

    def rec(rem: int, mx: int, cur: list[int]) -> None:
        if rem == 0:
            out.append(tuple(cur))
            return
        for p in range(min(rem, mx), 0, -1):
            cur.append(p)
            rec(rem - p, p, cur)
            cur.pop()

    rec(n, n, [])
    return out


def transpose(lam: Partition) -> Partition:
    """Conjugate (transpose) partition: λ'_j = #{i : λ_i > j}."""
    if not lam:
        return ()
    return tuple(sum(1 for p in lam if p > j) for j in range(lam[0]))


def transpose_pairs(
    n: int,
) -> tuple[list[tuple[Partition, Partition]], list[Partition]]:
    """Group partitions of n into transpose-pair orbits.

    Returns (pairs, self_conjugates) where:
      - pairs: list of (λ, λ') with λ < λ' lexicographically and
               λ' = transpose(λ) ≠ λ
      - self_conjugates: list of self-conjugate partitions (λ' = λ)

    Each partition of n appears exactly once across (pairs flattened)
    and self_conjugates.
    """
    parts = partitions(n)
    seen: set[Partition] = set()
    pairs: list[tuple[Partition, Partition]] = []
    sc: list[Partition] = []
    for lam in parts:
        if lam in seen:
            continue
        lam_t = transpose(lam)
        if lam == lam_t:
            sc.append(lam)
            seen.add(lam)
        else:
            # Use lex order to pick the canonical representative
            if lam < lam_t:
                pairs.append((lam, lam_t))
            else:
                pairs.append((lam_t, lam))
            seen.add(lam)
            seen.add(lam_t)
    return pairs, sc


# ── Dimensions (hook-length formula) ───────────────────────────────────


def hook_lengths(lam: Partition) -> list[int]:
    if not lam:
        return []
    conj = transpose(lam)
    hooks: list[int] = []
    for i, row in enumerate(lam):
        for j in range(row):
            # h(i,j) = λ_i − j + λ'_j − i − 1 (with 0-indexing).
            # Verified at (3,): hooks = [3, 2, 1]; (2,1): hooks = [3, 1, 1].
            hooks.append(row - j + conj[j] - i - 1)
    return hooks


def dim_specht(lam: Partition) -> int:
    """f^λ = n! / ∏ hook lengths."""
    from math import factorial
    n = sum(lam)
    prod = 1
    for h in hook_lengths(lam):
        prod *= h
    return factorial(n) // prod


# ── Pair-shortcircuit Markov trace assembly ────────────────────────────


def markov_trace_sigma_pair_shortcircuit(
    n: int,
    q_minus_qinv: Numeric,
    y_lambda: Callable[[Partition], Numeric],
    chi_lambda_sigma: Callable[[Partition], Numeric],
) -> Numeric:
    """Compute tr_M(σ_i) at strand count `n` using the Galois-pair
    closed-form short-circuit.

    Arguments:
      n               : strand count (≥ 2)
      q_minus_qinv    : the value of q − q⁻¹ (numeric or MetallicNumber)
      y_lambda(lam)   : Wenzl weight y_λ(q) — must be supplied by caller
      chi_lambda_sigma(lam) : χ^λ(σ_i) — only called on SELF-CONJUGATE
                              partitions; saves work elsewhere

    Returns: tr_M(σ_i) as the same numeric type as y_λ / q_minus_qinv.

    Identity used (proved at all q > 0):
      χ^λ(σ_i) + χ^{λ'}(σ_i) = dim(λ) · (q − q⁻¹)

    so paired contributions simplify to:
      y_λ · χ^λ + y_λ' · χ^λ'
      = y_λ · (χ^λ + χ^λ')         (since y_λ = y_λ' by hook symmetry)
      = y_λ · dim(λ) · (q − q⁻¹)

    Raises:
      ValueError if `n` is not an int ≥ 2.
      TypeError  if `q_minus_qinv` is not int/float/MetallicNumber, or if
                 either callback is not callable.
    """
    if not isinstance(n, int) or n < 2:
        raise ValueError(f"strand count n must be an int ≥ 2, got {n!r}")
    if not isinstance(q_minus_qinv, (int, float, MetallicNumber)):
        raise TypeError(
            "q_minus_qinv must be int, float, or MetallicNumber, got "
            f"{type(q_minus_qinv).__name__}"
        )
    if not callable(y_lambda):
        raise TypeError("y_lambda must be callable: Partition -> Numeric")
    if not callable(chi_lambda_sigma):
        raise TypeError(
            "chi_lambda_sigma must be callable: Partition -> Numeric"
        )
    pairs, sc = transpose_pairs(n)

    # Initialize accumulator at zero of correct type
    if isinstance(q_minus_qinv, MetallicNumber):
        total: Numeric = MetallicNumber.zero(q_minus_qinv.n)
    else:
        total = 0.0

    # Pair contributions: y_λ · dim(λ) · (q − q⁻¹)
    for lam, _lam_t in pairs:
        yl = y_lambda(lam)
        dim_lam = dim_specht(lam)
        if isinstance(yl, MetallicNumber):
            total = total + yl * MetallicNumber.from_int(dim_lam, yl.n) * q_minus_qinv  # type: ignore[arg-type]
        else:
            total = total + yl * dim_lam * q_minus_qinv  # type: ignore[arg-type, operator]

    # Self-conjugate contributions: y_λ · χ^λ(σ_i)  (explicit character)
    for lam in sc:
        yl = y_lambda(lam)
        chi_lam = chi_lambda_sigma(lam)
        if isinstance(yl, MetallicNumber):
            total = total + yl * chi_lam  # type: ignore[arg-type, operator]
        else:
            total = total + yl * chi_lam  # type: ignore[arg-type, operator]

    return total


# ── Convenience: report compute reduction at given n ───────────────────


def pair_shortcircuit_speedup(n: int) -> dict:
    """Report the compute-reduction ratio at strand count n.

    The character `chi_lambda_sigma` is the expensive call; pair-short-
    circuit avoids it for the paired partitions, computing it only for
    self-conjugate ones.
    """
    if not isinstance(n, int) or n < 2:
        raise ValueError(f"strand count n must be an int ≥ 2, got {n!r}")
    pairs, sc = transpose_pairs(n)
    total_partitions = 2 * len(pairs) + len(sc)
    expensive_calls_naive = total_partitions
    expensive_calls_shortcircuit = len(sc)
    reduction = (
        expensive_calls_naive / expensive_calls_shortcircuit
        if expensive_calls_shortcircuit > 0
        else float("inf")
    )
    return {
        "n": n,
        "total_partitions": total_partitions,
        "transpose_pairs": len(pairs),
        "self_conjugate": len(sc),
        "naive_calls": expensive_calls_naive,
        "shortcircuit_calls": expensive_calls_shortcircuit,
        "reduction_factor": reduction,
    }
