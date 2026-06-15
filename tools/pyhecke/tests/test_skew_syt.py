"""Tests for `pyhecke.skew_syt` — skew standard Young tableau counts."""

from __future__ import annotations

import pytest

from pyhecke.skew_syt import (
    concatenate_partitions,
    fits_inside,
    skew_syt_count,
)


# --- Straight shapes (mu = ()) -------------------------------------------


def test_straight_singletons_and_columns():
    """f^{(n)} = f^{(1^n)} = 1 (unique row/column tableau)."""
    for n in range(1, 8):
        assert skew_syt_count((n,)) == 1
        assert skew_syt_count(tuple([1] * n)) == 1


def test_straight_hook_shapes():
    """f^{(n-1, 1)} = n - 1 (hook shape with one box in row 2)."""
    for n in range(2, 8):
        assert skew_syt_count((n - 1, 1)) == n - 1


def test_straight_known_values():
    """Cross-check against tabulated hook-formula values."""
    assert skew_syt_count((2, 2)) == 2
    assert skew_syt_count((3, 2)) == 5
    assert skew_syt_count((3, 2, 1)) == 16
    assert skew_syt_count((4, 3, 2, 1)) == 768  # staircase
    assert skew_syt_count((5,)) == 1
    assert skew_syt_count((3, 3)) == 5
    assert skew_syt_count((4, 2)) == 9


# --- Skew shapes ----------------------------------------------------------


def test_skew_examples_stanley_ec2():
    """Skew shapes — cross-checked by recursive corner-removal."""
    # f^{(3,2)/(1)} = 5 (Stanley EC2 §7.16 example).
    assert skew_syt_count((3, 2), (1,)) == 5
    # f^{(3,2)/(2)} = 3: skew shape has boxes (1,3),(2,1),(2,2); enumerate.
    assert skew_syt_count((3, 2), (2,)) == 3
    # f^{(3,2,1)/(1)} = 16, verified by f^{λ/μ} = Σ_{ν=λ-corner} f^{ν/μ}
    #   = f^{(2,2,1)/(1)} + f^{(3,1,1)/(1)} + f^{(3,2)/(1)} = 5 + 6 + 5.
    assert skew_syt_count((3, 2, 1), (1,)) == 16
    # f^{(2,2,1)/(1)} = 5 (component of the recursion above).
    assert skew_syt_count((2, 2, 1), (1,)) == 5
    # f^{(3,1,1)/(1)} = 6 (component of the recursion above).
    assert skew_syt_count((3, 1, 1), (1,)) == 6


def test_skew_empty_relations():
    """Trivial skew cases."""
    # Empty skew shape (mu = lambda) -> 1
    assert skew_syt_count((2, 2), (2, 2)) == 1
    assert skew_syt_count((4, 3, 2, 1), (4, 3, 2, 1)) == 1
    # Empty outer shape -> 1
    assert skew_syt_count(()) == 1
    assert skew_syt_count((), ()) == 1


def test_skew_non_containment_returns_zero():
    """mu not contained in lambda -> 0."""
    assert skew_syt_count((2, 1), (3,)) == 0
    assert skew_syt_count((3, 1), (2, 2)) == 0
    assert skew_syt_count((2,), (1, 1)) == 0  # mu longer than lambda's nonzero part


def test_trailing_zeros_in_mu_are_tolerated():
    """Padding mu with zeros should not change the count."""
    assert skew_syt_count((3, 2), (1,)) == skew_syt_count((3, 2), (1, 0))
    assert skew_syt_count((3, 2), (1,)) == skew_syt_count((3, 2), (1, 0, 0, 0))


# --- Input validation -----------------------------------------------------


def test_negative_lambda_raises():
    with pytest.raises(ValueError, match="negative"):
        skew_syt_count((-1, 2))
    with pytest.raises(ValueError, match="negative"):
        skew_syt_count((3, -2))


def test_negative_mu_raises():
    with pytest.raises(ValueError, match="negative"):
        skew_syt_count((3, 2), (-1,))


def test_non_partition_lambda_raises():
    with pytest.raises(ValueError, match="weakly decreasing"):
        skew_syt_count((2, 3))


def test_non_partition_mu_raises():
    with pytest.raises(ValueError, match="weakly decreasing"):
        skew_syt_count((4, 3), (1, 2))


# --- Helpers --------------------------------------------------------------


def test_concatenate_partitions_sorts_descending():
    assert concatenate_partitions([(3,), (2, 1)]) == (3, 2, 1)
    assert concatenate_partitions([(2, 1), (3,)]) == (3, 2, 1)
    assert concatenate_partitions([(1, 1, 1), (1, 1, 1)]) == (1, 1, 1, 1, 1, 1)
    assert concatenate_partitions([(2, 1), (2, 1), (2, 1)]) == (2, 2, 2, 1, 1, 1)


def test_concatenate_partitions_drops_zeros():
    assert concatenate_partitions([(3, 0), (2, 1, 0)]) == (3, 2, 1)


def test_concatenate_partitions_empty():
    assert concatenate_partitions([]) == ()
    assert concatenate_partitions([(), ()]) == ()


def test_fits_inside_basic():
    assert fits_inside((2, 1), (3, 2)) is True
    assert fits_inside((3,), (2, 2)) is False
    assert fits_inside((), (5,)) is True
    assert fits_inside((3, 2), (3, 2)) is True


def test_fits_inside_trailing_zeros():
    assert fits_inside((2, 1, 0), (3, 2)) is True
    assert fits_inside((2, 1), (3, 2, 0, 0)) is True


# --- Universal branching usage pattern (A=2 deuteron) ---------------------


def test_universal_branching_a2_partitions():
    """A=2 atom (deuteron-like): lambda |- 6, mu_i |- 3 each.

    For each lambda |- 6 and each (mu_1, mu_2) with mu_i in
    {(3), (2,1), (1,1,1)}, f^{lambda/concat(mu_1, mu_2)} should be
    a non-negative integer. Spot-check a few.
    """
    # mu = (3, 3) (two row-shape nucleons) inside lambda = (6)
    assert skew_syt_count((6,), (3, 3)) == 0  # (3,3) not contained in (6)
    # mu = (3, 3) inside lambda = (3, 3)
    assert skew_syt_count((3, 3), (3, 3)) == 1
    # mu = (3,) inside lambda = (6) -> contained
    assert skew_syt_count((6,), (3,)) == 1
    # mu = (2, 1) inside lambda = (3, 2, 1): skew is the anti-diagonal
    # boxes (1,3), (2,2), (3,1) — 3 boxes in 3 distinct rows AND
    # 3 distinct columns, so no row/column constraints between them;
    # 3! = 6 fillings.
    assert skew_syt_count((3, 2, 1), (2, 1)) == 6
