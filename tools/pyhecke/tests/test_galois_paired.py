"""Tests for Galois-pair short-circuit in Markov-trace assembly."""

from __future__ import annotations

import math

import pytest

from pyhecke.galois_paired import (
    dim_specht,
    markov_trace_sigma_pair_shortcircuit,
    pair_shortcircuit_speedup,
    partitions,
    transpose,
    transpose_pairs,
)


# ── Partition utilities ────────────────────────────────────────────────


def test_partitions_count():
    """p(n) for small n: 1, 2, 3, 5, 7, 11, 15."""
    assert len(partitions(1)) == 1
    assert len(partitions(2)) == 2
    assert len(partitions(3)) == 3
    assert len(partitions(4)) == 5
    assert len(partitions(5)) == 7
    assert len(partitions(6)) == 11
    assert len(partitions(7)) == 15


def test_transpose_involution():
    """transpose(transpose(λ)) = λ."""
    for n in (3, 4, 5, 6):
        for lam in partitions(n):
            assert transpose(transpose(lam)) == lam


def test_transpose_known_cases():
    """Hand-checked transposes."""
    assert transpose((3,)) == (1, 1, 1)
    assert transpose((2, 1)) == (2, 1)  # self-conjugate
    assert transpose((4, 1)) == (2, 1, 1, 1)
    assert transpose((2, 2)) == (2, 2)  # self-conjugate
    assert transpose((3, 2)) == (2, 2, 1)
    assert transpose((3, 1, 1)) == (3, 1, 1)  # self-conjugate at n=5


# ── Transpose-pair grouping ────────────────────────────────────────────


def test_transpose_pairs_covers_all():
    """Every partition of n appears exactly once in pairs or self-conjugates."""
    for n in (3, 4, 5, 6):
        pairs, sc = transpose_pairs(n)
        covered = set(sc)
        for lam, lam_t in pairs:
            covered.add(lam)
            covered.add(lam_t)
        assert covered == set(partitions(n))


def test_self_conjugates_at_n3():
    """At n=3: self-conjugate is just (2,1)."""
    _, sc = transpose_pairs(3)
    assert sc == [(2, 1)]


def test_self_conjugates_at_n4():
    """At n=4: self-conjugates are (2,2)."""
    _, sc = transpose_pairs(4)
    assert (2, 2) in sc


def test_self_conjugates_at_n5():
    """At n=5: self-conjugates are (3,1,1)."""
    _, sc = transpose_pairs(5)
    assert (3, 1, 1) in sc


# ── Dimensions ─────────────────────────────────────────────────────────


def test_dim_specht_n3():
    """χ at q=1 = standard S_n characters; dim_specht agrees."""
    assert dim_specht((3,)) == 1
    assert dim_specht((2, 1)) == 2
    assert dim_specht((1, 1, 1)) == 1


def test_dim_specht_n4():
    assert dim_specht((4,)) == 1
    assert dim_specht((3, 1)) == 3
    assert dim_specht((2, 2)) == 2
    assert dim_specht((2, 1, 1)) == 3
    assert dim_specht((1, 1, 1, 1)) == 1


def test_dim_specht_n5_sum_squared():
    """Sum of (dim_λ)² over partitions of n = n!"""
    for n in (3, 4, 5):
        from math import factorial
        assert sum(dim_specht(lam) ** 2 for lam in partitions(n)) == factorial(n)


# ── Short-circuit Markov trace ─────────────────────────────────────────


def _y_n3(lam):
    """Wenzl weight y_λ(q) for n=3 at q=1.5 (a specific test value)."""
    q = 1.5
    from math import prod
    # q-int [k]_q = (q^k − q^{-k}) / (q − q^{-1})
    def qint(k):
        return (q ** k - q ** (-k)) / (q - 1 / q)
    # q-factorial
    def qfact(n):
        return prod(qint(k) for k in range(1, n + 1))
    # q-dim via hook-length formula
    from pyhecke.galois_paired import hook_lengths
    d = prod(qint(h) for h in hook_lengths(lam))
    return d * d / qfact(sum(lam))


def _chi_sigma_n3(lam):
    """χ^λ(σ_0) for n=3 partitions at q=1.5."""
    q = 1.5
    A, B = {
        (3,): (1, 0),
        (2, 1): (1, 1),
        (1, 1, 1): (0, 1),
    }[lam]
    return A * q + B * (-1 / q)


def test_pair_shortcircuit_matches_naive():
    """Pair-short-circuit Markov trace = naive direct sum at q=1.5."""
    q = 1.5
    q_minus_qinv = q - 1 / q

    # Naive
    naive_total = sum(_y_n3(lam) * _chi_sigma_n3(lam) for lam in partitions(3))

    # Shortcircuit
    sc_total = markov_trace_sigma_pair_shortcircuit(
        n=3,
        q_minus_qinv=q_minus_qinv,
        y_lambda=_y_n3,
        chi_lambda_sigma=_chi_sigma_n3,
    )

    assert abs(naive_total - sc_total) < 1e-12, \
        f"naive={naive_total}, sc={sc_total}"


# ── Speedup report ─────────────────────────────────────────────────────


def test_speedup_report():
    """Speedup factor grows roughly as p(n) / (# self-conjugates)."""
    for n in (3, 4, 5, 6, 7):
        r = pair_shortcircuit_speedup(n)
        assert r["naive_calls"] == len(partitions(n))
        # Speedup must be > 1 (some partitions get short-circuited)
        assert r["reduction_factor"] > 1.0
