"""Skew standard Young tableau counts via Aitken-Steinberg determinant.

The number `f^{lambda/mu}` of standard Young tableaux of skew shape
`lambda/mu` is given by the Aitken-Steinberg determinant formula

    f^{lambda/mu} = (|lambda| - |mu|)! * det_{i,j} [ 1 / (lambda_i - mu_j - i + j)! ]

where i, j range over 1..ell(lambda), and `1/k! := 0` for k < 0.

Used by `UNIVERSAL-BRANCHING-PLAN.md` Gap #1 — atom character
expansion via universal branching rule

    chi_free(lambda) = sum_{(mu_1,...,mu_A), mu_i |- 3}
                       f^{lambda/(mu_1 sqcup ... sqcup mu_A)}
                       * prod_i chi^{mu_i}(K_i)

References:
  - Aitken (1943), "The monomial expansion of determinantal symmetric
    functions", Proc. Edinburgh Math. Soc. 7, 1-5.
  - Stanley, "Enumerative Combinatorics, Vol. 2", §7.16
    (Jacobi-Trudi / Aitken determinants for skew Schur functions).
  - Naruse (2014) hook formula for the cancellation-free analogue.

All arithmetic is exact (Fraction); the final determinant times
`(|lambda| - |mu|)!` is an integer.
"""

from __future__ import annotations

from fractions import Fraction
from math import factorial
from typing import Sequence


__all__ = [
    "skew_syt_count",
    "concatenate_partitions",
    "fits_inside",
]


def _inv_fact_frac(k: int) -> Fraction:
    """Return 1/k! as exact Fraction, or 0 for k < 0."""
    if k < 0:
        return Fraction(0)
    return Fraction(1, factorial(k))


def _det_fraction(matrix: list[list[Fraction]]) -> Fraction:
    """Exact determinant of a square Fraction matrix via Bareiss elimination.

    Bareiss fraction-free Gaussian elimination is O(n^3) and minimises
    denominator growth vs. naive Gauss on rationals. Comfortable for
    `ell(lambda) <= 3A` (A-nucleon atom; A <= 10 hits ell <= 30) which
    is the upper end of QOU atom-branching contexts.

    Reference: Bareiss (1968), "Sylvester's identity and multistep
    integer-preserving Gaussian elimination", Math. Comp. 22 (103).
    """
    n = len(matrix)
    if n == 0:
        return Fraction(1)
    if n == 1:
        return matrix[0][0]
    # Work on a copy; Bareiss mutates entries in-place.
    M = [row[:] for row in matrix]
    sign = 1
    prev_pivot: Fraction = Fraction(1)
    for k in range(n):
        # Partial pivoting on the leading entry.
        if M[k][k] == 0:
            swapped = False
            for i in range(k + 1, n):
                if M[i][k] != 0:
                    M[k], M[i] = M[i], M[k]
                    sign = -sign
                    swapped = True
                    break
            if not swapped:
                return Fraction(0)
        pivot = M[k][k]
        for i in range(k + 1, n):
            for j in range(k + 1, n):
                M[i][j] = (M[i][j] * pivot - M[i][k] * M[k][j]) / prev_pivot
            M[i][k] = Fraction(0)
        prev_pivot = pivot
    return Fraction(sign) * M[n - 1][n - 1]


def concatenate_partitions(partitions: Sequence[Sequence[int]]) -> tuple[int, ...]:
    """Concatenate a tuple of partitions into a single weakly-decreasing tuple.

    Used to build mu = mu_1 sqcup ... sqcup mu_A from per-nucleon
    H_3 partitions in the universal branching rule.

    Args:
        partitions: sequence of partitions (each weakly decreasing).

    Returns:
        Sorted-descending tuple of all parts (zeros dropped).
    """
    parts: list[int] = []
    for p in partitions:
        parts.extend(int(x) for x in p if int(x) > 0)
    parts.sort(reverse=True)
    return tuple(parts)


def fits_inside(mu: Sequence[int], lambda_: Sequence[int]) -> bool:
    """Return True iff mu is contained in lambda_ as Young diagrams."""
    mu_ = [int(x) for x in mu if int(x) > 0]
    lam = [int(x) for x in lambda_ if int(x) > 0]
    if len(mu_) > len(lam):
        return False
    return all(mu_[i] <= lam[i] for i in range(len(mu_)))


def skew_syt_count(
    lambda_: Sequence[int],
    mu: Sequence[int] = (),
) -> int:
    """Count standard Young tableaux of skew shape lambda/mu.

    Computes `f^{lambda/mu} = |SYT(lambda/mu)|` via the Aitken-Steinberg
    determinant formula. Returns an exact integer.

    Args:
        lambda_: outer partition (weakly decreasing positive ints).
        mu: inner partition (default empty -> straight shape).
            Need not be pre-padded; trailing zeros are accepted.

    Returns:
        Number of standard Young tableaux of shape lambda/mu.
        Returns 0 if mu is not contained in lambda_.

    Examples:
        >>> skew_syt_count((2, 1))           # f^{(2,1)} = 2
        2
        >>> skew_syt_count((3, 1))           # f^{(3,1)} = 3
        3
        >>> skew_syt_count((3, 2), (1,))     # f^{(3,2)/(1)} = 5
        5
        >>> skew_syt_count((2, 2), (2, 2))   # empty skew shape -> 1
        1
    """
    raw_lam = [int(x) for x in lambda_]
    if any(x < 0 for x in raw_lam):
        raise ValueError(
            f"skew_syt_count: lambda_ has negative parts: {lambda_!r}"
        )
    lam = [x for x in raw_lam if x > 0]
    L = len(lam)
    # Weak-decrease check (partitions are weakly decreasing).
    if any(lam[i] < lam[i + 1] for i in range(L - 1)):
        raise ValueError(
            f"skew_syt_count: lambda_ not weakly decreasing: {lambda_!r}"
        )
    if L == 0:
        # Empty outer shape: only the empty skew is valid.
        if any(int(x) != 0 for x in mu):
            return 0
        return 1

    raw_m = [int(x) for x in mu]
    if any(x < 0 for x in raw_m):
        raise ValueError(
            f"skew_syt_count: mu has negative parts: {mu!r}"
        )
    # Weak-decrease check for mu (ignoring trailing zeros).
    mu_nz_len = len([x for x in raw_m if x > 0])
    if any(raw_m[i] < raw_m[i + 1] for i in range(mu_nz_len - 1)):
        raise ValueError(
            f"skew_syt_count: mu not weakly decreasing: {mu!r}"
        )
    m = list(raw_m)
    # Pad mu with zeros up to length L
    while len(m) < L:
        m.append(0)
    # Truncate if mu longer than lambda (with nonzero overflow -> 0)
    if any(m[i] > 0 for i in range(L, len(m))):
        return 0
    m = m[:L]

    # Containment check
    if any(m[i] > lam[i] for i in range(L)):
        return 0

    n = sum(lam) - sum(m)
    if n == 0:
        return 1

    # Aitken-Steinberg: M[i][j] = 1 / (lambda_{i+1} - mu_{j+1} - (i+1) + (j+1))!
    # i, j 0-indexed in code; +1 to match the formula.
    M = [
        [_inv_fact_frac(lam[i] - m[j] - (i + 1) + (j + 1)) for j in range(L)]
        for i in range(L)
    ]
    det = _det_fraction(M)
    result = factorial(n) * det
    # Result is provably an integer (Aitken-Steinberg). Use an explicit
    # runtime check rather than `assert` so it survives `python -O`.
    if result.denominator != 1:
        raise RuntimeError(
            f"skew_syt_count({lambda_!r}, {mu!r}): non-integer result "
            f"{result} — Aitken-Steinberg should yield Z; this is a bug."
        )
    return result.numerator
