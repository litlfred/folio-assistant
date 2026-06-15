"""Unit tests for CRT polynomial reconstruction."""

from __future__ import annotations

from fractions import Fraction

from pyhecke.crt import LaurentPoly, reconstruct


def test_reconstruct_linear():
    # P(q) = 2q + 3, exponent range [0, 1]
    P_true = LaurentPoly({1: Fraction(2), 0: Fraction(3)})
    points = [
        (Fraction(1), P_true(Fraction(1))),
        (Fraction(2), P_true(Fraction(2))),
    ]
    P = reconstruct(points, (0, 1))
    assert P.coeffs == P_true.coeffs


def test_reconstruct_laurent_with_negative_exponent():
    # P(q) = q^{-1} + q
    P_true = LaurentPoly({-1: Fraction(1), 0: Fraction(0), 1: Fraction(1)})
    points = [
        (Fraction(1), Fraction(2)),
        (Fraction(2), Fraction(1, 2) + Fraction(2)),
        (Fraction(3), Fraction(1, 3) + Fraction(3)),
    ]
    P = reconstruct(points, (-1, 1))
    assert P(Fraction(4)) == Fraction(1, 4) + Fraction(4)


def test_to_terms_from_terms_roundtrip():
    P = LaurentPoly({-2: Fraction(1, 3), 0: Fraction(5), 3: Fraction(-7, 2)})
    P2 = LaurentPoly.from_terms(P.to_terms())
    assert P2.coeffs == P.coeffs
