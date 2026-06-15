"""Exact ℤ[δ_n] arithmetic at metallic-ratio specialisations of q.

At `q = δ_n = (n + √(n²+4))/2` (the n-th metallic ratio), the Hecke
quadratic `σ² = (q − q⁻¹)σ + 1` collapses to `σ² = n·σ + 1`, so every
expression in `q − q⁻¹` becomes an integer.  More generally, Markov
traces and characters at q = δ_n land in **ℤ[δ_n]** = the order of
the quadratic field `ℚ(δ_n)` over ℤ.

This module provides exact arithmetic in ℤ[δ_n] via the
`MetallicNumber(a, b, n)` class representing `a + b · δ_n` with
`a, b ∈ ℤ` and `n ∈ ℕ ≥ 1`.  Operations are exact integer arithmetic;
no floating-point or mpmath rounding error.

Key identities used:
  - δ_n² = n · δ_n + 1
  - δ_n⁻¹ = δ_n − n  (= -bar(δ_n) where bar(δ_n) = n − δ_n)
  - Galois conjugate: bar(a + b·δ_n) = (a + b·n) − b·δ_n
  - Norm: N(a + b·δ_n) = (a + b·δ_n)·bar(...) = a² + a·b·n − b²

Use cases (forward-looking):
  - Markov-trace evaluation at metallic control points without mpmath
  - SDP cost-coefficient symbolic verification at q = δ_n
  - Galois-orbit short-circuit for paired Wedderburn-block characters

Speedup target: ~100× over 50-dps mpmath at metallic control points
(exact integer arithmetic vs transcendental floating-point).

Lean grounding:
  - Pisot property of δ_n: QOU.AlgebraicSubstrate.MetallicHierarchy
    (PR #1999)
  - Silver coincidence theorem:
    QOU.AlgebraicSubstrate.MetallicLPIdentities.silver_lp_coincidence
    (PR #2047)
"""

from __future__ import annotations

from dataclasses import dataclass
from fractions import Fraction
from typing import Union


@dataclass(frozen=True)
class MetallicNumber:
    """Element of ℤ[δ_n] represented as `a + b · δ_n` with `a, b ∈ ℤ`
    and `n ≥ 1` (metallic ratio index).

    All arithmetic operations are exact integer arithmetic.  No floating-
    point evaluation is performed unless `.to_float()` is explicitly
    called.

    Invariant: the metallic-ratio index `n` is fixed; mixing
    `MetallicNumber`s with different `n` raises `ValueError`.
    """

    a: int   # rational part
    b: int   # δ_n coefficient
    n: int   # metallic ratio index (≥ 1)

    def __post_init__(self) -> None:
        if self.n < 1:
            raise ValueError(f"metallic index n must be ≥ 1, got n={self.n}")

    # ── Constructors ──────────────────────────────────────────────────

    @classmethod
    def from_int(cls, k: int, n: int) -> "MetallicNumber":
        """The integer `k` as an element of ℤ[δ_n]: `k + 0·δ_n`."""
        return cls(int(k), 0, n)

    @classmethod
    def delta(cls, n: int) -> "MetallicNumber":
        """The metallic ratio `δ_n` itself."""
        return cls(0, 1, n)

    @classmethod
    def one(cls, n: int) -> "MetallicNumber":
        return cls(1, 0, n)

    @classmethod
    def zero(cls, n: int) -> "MetallicNumber":
        return cls(0, 0, n)

    # ── Arithmetic ─────────────────────────────────────────────────────

    def _check_n(self, other: "MetallicNumber") -> None:
        if self.n != other.n:
            raise ValueError(
                f"cannot mix metallic indices: n={self.n} and n={other.n}"
            )

    def __add__(
        self, other: Union["MetallicNumber", int]
    ) -> "MetallicNumber":
        if isinstance(other, int):
            return MetallicNumber(self.a + other, self.b, self.n)
        self._check_n(other)
        return MetallicNumber(self.a + other.a, self.b + other.b, self.n)

    def __radd__(self, other: int) -> "MetallicNumber":
        return self + other

    def __sub__(
        self, other: Union["MetallicNumber", int]
    ) -> "MetallicNumber":
        if isinstance(other, int):
            return MetallicNumber(self.a - other, self.b, self.n)
        self._check_n(other)
        return MetallicNumber(self.a - other.a, self.b - other.b, self.n)

    def __rsub__(self, other: int) -> "MetallicNumber":
        return MetallicNumber(other - self.a, -self.b, self.n)

    def __neg__(self) -> "MetallicNumber":
        return MetallicNumber(-self.a, -self.b, self.n)

    def __mul__(
        self, other: Union["MetallicNumber", int]
    ) -> "MetallicNumber":
        if isinstance(other, int):
            return MetallicNumber(self.a * other, self.b * other, self.n)
        self._check_n(other)
        # (a + b·δ)(c + d·δ) = a·c + (a·d + b·c)·δ + b·d·δ²
        # = a·c + (a·d + b·c)·δ + b·d·(n·δ + 1)
        # = (a·c + b·d) + (a·d + b·c + n·b·d)·δ
        a, b, c, d, n = self.a, self.b, other.a, other.b, self.n
        return MetallicNumber(a * c + b * d, a * d + b * c + n * b * d, n)

    def __rmul__(self, other: int) -> "MetallicNumber":
        return self * other

    def __eq__(self, other: object) -> bool:
        if isinstance(other, int):
            return self.a == other and self.b == 0
        if not isinstance(other, MetallicNumber):
            return NotImplemented
        return self.a == other.a and self.b == other.b and self.n == other.n

    def __hash__(self) -> int:
        return hash((self.a, self.b, self.n))

    # ── Galois structure ──────────────────────────────────────────────

    def conjugate(self) -> "MetallicNumber":
        """Galois conjugate: bar(a + b·δ_n) = (a + b·n) − b·δ_n.

        This is the image under the unique non-trivial automorphism of
        ℚ(δ_n)/ℚ, equivalent to δ_n ↦ n − δ_n = bar(δ_n).
        """
        return MetallicNumber(self.a + self.b * self.n, -self.b, self.n)

    def norm(self) -> int:
        """N(c) = c · bar(c) ∈ ℤ.

        For c = a + b·δ_n: N(c) = a² + a·b·n − b².
        """
        return self.a * self.a + self.a * self.b * self.n - self.b * self.b

    def trace(self) -> int:
        """Tr(c) = c + bar(c) = 2·a + b·n ∈ ℤ."""
        return 2 * self.a + self.b * self.n

    # ── Division and inverse ──────────────────────────────────────────

    def inv_exact(self) -> "MetallicNumber":
        """Compute the multiplicative inverse if exact (norm = ±1).

        Returns the inverse as an exact `MetallicNumber` when it lies in
        ℤ[δ_n]; raises `ValueError` if the norm is not ±1 (would require
        rational coefficients, outside the ring).
        """
        if self.a == 0 and self.b == 0:
            raise ZeroDivisionError("inverse of zero")
        norm = self.norm()
        if norm not in (1, -1):
            inv_a = self.a + self.b * self.n  # numerator of rational part
            raise ValueError(
                f"non-unit element (norm={norm}, not ±1); the inverse is "
                f"conjugate()/norm = ({inv_a}/{norm}) + ({-self.b}/{norm})"
                f"·δ_{self.n}, which has rational coefficients and so lies "
                f"in ℚ(δ_{self.n}) but not in ℤ[δ_{self.n}] — it cannot be "
                f"represented as a MetallicNumber."
            )
        conj = self.conjugate()
        if norm == 1:
            return conj
        return -conj

    def to_rational(self) -> tuple[Fraction, Fraction]:
        """Express as rational pair (p, q) so that self = p + q · δ_n.

        Always succeeds; returns Fractions.
        """
        return (Fraction(self.a), Fraction(self.b))

    # ── Numerical evaluation ──────────────────────────────────────────

    def to_float(self) -> float:
        """Evaluate as a float.  ONLY use when entering numerical
        comparison territory; otherwise stay exact."""
        import math
        delta_n_val = (self.n + math.sqrt(self.n * self.n + 4)) / 2
        return float(self.a) + float(self.b) * delta_n_val

    # ── Display ───────────────────────────────────────────────────────

    def __repr__(self) -> str:
        return f"MetallicNumber({self.a} + {self.b}·δ_{self.n})"

    def __str__(self) -> str:
        if self.b == 0:
            return str(self.a)
        if self.a == 0:
            return f"{self.b}·δ_{self.n}" if self.b != 1 else f"δ_{self.n}"
        sign = "+" if self.b > 0 else "−"
        b_abs = abs(self.b)
        if b_abs == 1:
            return f"{self.a} {sign} δ_{self.n}"
        return f"{self.a} {sign} {b_abs}·δ_{self.n}"


# ── Convenience: Hecke-scalar at metallic q ────────────────────────────


def hecke_scalar_at_metallic(n: int) -> MetallicNumber:
    """Return `q − q⁻¹ = n` as an exact element of ℤ[δ_n].

    Witnessed by MetallicHierarchy Theorem 1 (PR #1999): for q = δ_n,
    q − q⁻¹ is the integer n.
    """
    return MetallicNumber.from_int(n, n)


def hecke_sigma_eigenvalues(n: int) -> tuple[MetallicNumber, MetallicNumber]:
    """Return the eigenvalues of the Hecke generator σ at q = δ_n.

    Eigenvalues: {q, −q⁻¹} = {δ_n, n − δ_n} = {δ_n, bar(δ_n)}.

    Since `δ_n⁻¹ = δ_n − n`, we have `−q⁻¹ = −(δ_n − n) = n − δ_n`,
    which is exactly bar(δ_n).  Both eigenvalues exact in ℤ[δ_n].
    """
    delta = MetallicNumber.delta(n)
    return (delta, delta.conjugate())
