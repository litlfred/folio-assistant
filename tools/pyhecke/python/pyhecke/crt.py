"""CRT polynomial reconstruction — Track A scalable path.

Reconstruct a polynomial P(q) in Z[q^{±1}] from its evaluations at
several rational q_i values, via Chinese-Remainder-style interpolation.

This replaces the sympy.Poly blow-up hit by tower_binding_symbolic.py
at A >= 4. For heavy atoms (A up to 40), direct symbolic expansion is
intractable; interpolating from modular / mpmath evaluations is the
scalable alternative.

M1 scope: API + Lagrange-interpolation stub. Modular CRT reconstruction
(integer coefficient recovery from prime-mod evaluations) is a future
extension — out of scope for M1 bootstrap.
"""

from __future__ import annotations

from dataclasses import dataclass
from fractions import Fraction
from typing import Sequence


@dataclass
class LaurentPoly:
    """Sparse Laurent polynomial in q^{±1}.

    Stored as a dict from exponent (int) → coefficient (Fraction).
    Matches the `SparsePoly` shape of certificate-*.json when serialized
    via `to_terms()`.
    """

    coeffs: dict[int, Fraction]

    def __call__(self, q: float | Fraction) -> float | Fraction:
        return sum(c * (q ** e) for e, c in self.coeffs.items())  # type: ignore[return-value]

    def to_terms(self) -> list[list]:
        """Serialize to the [exponent, coefficient] list form used by
        SparsePoly in the certificate JSON Schema."""
        return [[e, str(c)] for e, c in sorted(self.coeffs.items())]

    @classmethod
    def from_terms(cls, terms: list[list]) -> "LaurentPoly":
        return cls(coeffs={int(e): Fraction(str(c)) for e, c in terms})


def lagrange_interpolate(
    points: Sequence[tuple[Fraction, Fraction]],
    exponent_range: tuple[int, int],
) -> LaurentPoly:
    """Recover P(q) ∈ Z[q^e_min, …, q^e_max] from points (q_i, P(q_i)).

    The number of points must equal the number of coefficient slots
    (e_max - e_min + 1). Solves a Vandermonde system via rational
    arithmetic.

    Parameters
    ----------
    points
        Sequence of (q_i, P(q_i)) pairs.
    exponent_range
        (e_min, e_max) inclusive — the exponent window of P.

    Returns
    -------
    LaurentPoly
        The reconstructed polynomial.
    """
    e_min, e_max = exponent_range
    n = e_max - e_min + 1
    if len(points) != n:
        raise ValueError(
            f"need exactly {n} points for exponent range [{e_min}, {e_max}], "
            f"got {len(points)}"
        )

    # Solve Vandermonde V · c = y where V[i,j] = q_i^{e_min + j},
    # c[j] = coefficient of q^{e_min + j}, y[i] = P(q_i).
    # Gaussian elimination in Fraction arithmetic.
    V = [[q ** (e_min + j) for j in range(n)] for q, _ in points]
    y = [p for _, p in points]

    # augment
    A = [[*row, yi] for row, yi in zip(V, y)]

    for i in range(n):
        # partial pivot
        pivot = i
        while pivot < n and A[pivot][i] == 0:
            pivot += 1
        if pivot == n:
            raise ValueError("Vandermonde singular — points must be distinct")
        if pivot != i:
            A[i], A[pivot] = A[pivot], A[i]
        # normalise row i
        inv = Fraction(1) / A[i][i]
        A[i] = [v * inv for v in A[i]]
        # eliminate other rows
        for k in range(n):
            if k == i:
                continue
            factor = A[k][i]
            if factor == 0:
                continue
            A[k] = [A[k][j] - factor * A[i][j] for j in range(n + 1)]

    coeffs = {e_min + j: A[j][-1] for j in range(n) if A[j][-1] != 0}
    return LaurentPoly(coeffs=coeffs)


def reconstruct(
    points: Sequence[tuple[Fraction, Fraction]],
    exponent_range: tuple[int, int],
) -> LaurentPoly:
    """Primary entry point — Lagrange interpolation for now.

    Future: add modular-CRT-style reconstruction for large-integer
    coefficients where rational Lagrange loses precision.
    """
    return lagrange_interpolate(points, exponent_range)
