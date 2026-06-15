"""Tests for exact ℤ[δ_n] arithmetic."""

from __future__ import annotations

import math

import pytest

from pyhecke.metallic_q_arith import (
    MetallicNumber,
    hecke_scalar_at_metallic,
    hecke_sigma_eigenvalues,
)


# ── Construction ────────────────────────────────────────────────────────


def test_from_int():
    x = MetallicNumber.from_int(5, n=1)
    assert x.a == 5 and x.b == 0 and x.n == 1


def test_delta_silver():
    """δ_2 = 1 + √2 ≈ 2.414"""
    d = MetallicNumber.delta(2)
    assert d.a == 0 and d.b == 1 and d.n == 2
    assert abs(d.to_float() - (1 + math.sqrt(2))) < 1e-14


def test_n_must_be_positive():
    with pytest.raises(ValueError):
        MetallicNumber(1, 0, 0)


# ── Algebraic identities ───────────────────────────────────────────────


def test_delta_satisfies_quadratic():
    """δ_n² = n · δ_n + 1 for all metallic ratios."""
    for n in (1, 2, 3, 4, 5):
        d = MetallicNumber.delta(n)
        lhs = d * d
        rhs = MetallicNumber.from_int(n, n) * d + MetallicNumber.one(n)
        assert lhs == rhs, f"failed at n={n}: {lhs} ≠ {rhs}"


def test_hecke_scalar_is_integer_at_metallic():
    """q − q⁻¹ = n at q = δ_n."""
    for n in (1, 2, 3):
        v = hecke_scalar_at_metallic(n)
        assert v.a == n and v.b == 0


def test_delta_inverse():
    """δ_n⁻¹ = δ_n − n.  Equivalently: δ_n · (δ_n − n) = 1."""
    for n in (1, 2, 3, 4):
        d = MetallicNumber.delta(n)
        d_minus_n = d - MetallicNumber.from_int(n, n)
        product = d * d_minus_n
        assert product == MetallicNumber.one(n), \
            f"δ_{n} · (δ_{n} − {n}) ≠ 1: got {product}"


# ── Galois structure ───────────────────────────────────────────────────


def test_conjugate_is_involution():
    """bar(bar(x)) = x."""
    cases = [
        MetallicNumber(3, 5, 2),
        MetallicNumber(-2, 7, 3),
        MetallicNumber(0, 1, 1),  # δ_1 = φ
        MetallicNumber.from_int(42, 4),
    ]
    for x in cases:
        assert x.conjugate().conjugate() == x


def test_norm_is_multiplicative():
    """N(x · y) = N(x) · N(y)."""
    x = MetallicNumber(2, 3, 2)
    y = MetallicNumber(5, -1, 2)
    assert (x * y).norm() == x.norm() * y.norm()


def test_norm_of_delta_is_minus_one():
    """N(δ_n) = -1, because δ_n · bar(δ_n) = δ_n · (n - δ_n) = nδ_n - δ_n²
       = nδ_n - (nδ_n + 1) = -1."""
    for n in (1, 2, 3, 4):
        assert MetallicNumber.delta(n).norm() == -1


def test_trace_at_metallic():
    """Tr(δ_n) = δ_n + bar(δ_n) = n."""
    for n in (1, 2, 3, 4):
        assert MetallicNumber.delta(n).trace() == n


# ── Unit inverses ──────────────────────────────────────────────────────


def test_delta_is_unit_and_invertible():
    """δ_n is a unit (N = -1), so δ_n⁻¹ ∈ ℤ[δ_n]."""
    for n in (1, 2, 3):
        d = MetallicNumber.delta(n)
        inv = d.inv_exact()
        assert d * inv == MetallicNumber.one(n)
        # And inv = δ_n − n
        assert inv == d - MetallicNumber.from_int(n, n)


def test_non_unit_inverse_raises():
    """Non-unit elements raise on .inv_exact()."""
    x = MetallicNumber(3, 0, 2)  # x = 3, norm = 9, not ±1
    assert x.norm() == 9
    with pytest.raises(ValueError):
        x.inv_exact()


# ── Mixing different n raises ─────────────────────────────────────────


def test_cannot_mix_different_n():
    x = MetallicNumber.delta(2)
    y = MetallicNumber.delta(3)
    with pytest.raises(ValueError):
        _ = x + y
    with pytest.raises(ValueError):
        _ = x * y


# ── Numerical agreement ────────────────────────────────────────────────


def test_arithmetic_agrees_with_floats():
    """Exact integer arithmetic should agree with mpmath / float at silver."""
    x = MetallicNumber(5, 3, 2)
    y = MetallicNumber(-2, 4, 2)
    delta = 1 + math.sqrt(2)

    assert abs((x + y).to_float() - ((5 + 3 * delta) + (-2 + 4 * delta))) < 1e-13
    assert abs((x - y).to_float() - ((5 + 3 * delta) - (-2 + 4 * delta))) < 1e-13
    assert abs((x * y).to_float() - ((5 + 3 * delta) * (-2 + 4 * delta))) < 1e-13


def test_eigenvalues_of_sigma():
    """Eigenvalues of σ at q = δ_n are {δ_n, n − δ_n}."""
    delta, neg_inv = hecke_sigma_eigenvalues(2)
    # delta = δ_2 = 0 + 1·δ_2
    assert delta == MetallicNumber.delta(2)
    # -q⁻¹ = -(δ_2 − 2) = 2 − δ_2 = MetallicNumber(2, -1, 2)
    assert neg_inv == MetallicNumber(2, -1, 2)
    # Their product: δ_2 · (2 - δ_2) = 2δ_2 - δ_2² = 2δ_2 - (2δ_2 + 1) = -1
    assert delta * neg_inv == MetallicNumber.from_int(-1, 2)
