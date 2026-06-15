#!/usr/bin/env python3
"""Sparse Laurent polynomial in q over Q — fast coefficient class.

Replaces sympy `Expr` for the (q, q^{-1})-coefficient algebra carried
by Hecke / Jones-Markov computations.  The two operations we hammer in
the GS reduction loop are coefficient multiplication and accumulation;
both are O(deg) integer-keyed dict ops here, vs. sympy's full
`Add`/`Mul`/`expand` machinery (1.9 M cache lookups per reduce on
tritium per the cProfile data).

Internal repr: `coefs = {int_exp: sp.Rational}`, e.g.

    q − 1/q       →  {1:  1, -1: -1}
    (q − 1/q)²    →  {2:  1,  0: -2, -2: 1}
    3q²/4         →  {2:  Rational(3, 4)}

Zero coefficients are dropped on every op so `bool(L)` and `L == 0`
short-circuit on dict-emptiness.

**Ring-not-field**: this class deliberately stays in `Z[q, q^{-1}]`
(or `Q[q, q^{-1}]`) — never division by polynomials.  Hecke
generators only ever multiply or add Laurent polynomials, so this
is closed under the relevant operations.

Boundary conversions:
  - `LaurentQ.from_sympy(expr, q)` — parse a sympy expression assumed
    to be Laurent in `q`; raises `ValueError` if it isn't.
  - `LaurentQ.to_sympy(q)` — emit the equivalent sympy expression.

The intended use is: convert the Hecke generators (q, q^{-1}, etc.)
to LaurentQ once at startup, run the GS reduction in pure-LaurentQ
arithmetic, convert the result back to sympy at the boundary for
downstream (`tr_M_element`, `term6_residues_at_roots`, ...).
"""
from __future__ import annotations

from numbers import Rational as _Rational

import sympy as sp


class LaurentQ:
    """Sparse Laurent polynomial in `q` with rational coefficients."""

    __slots__ = ("coefs",)

    def __init__(self, coefs=None):
        if coefs is None:
            self.coefs = {}
        else:
            # Drop zeros up front; keep sympy.Rational / int values as-is.
            self.coefs = {int(e): c for e, c in coefs.items() if c != 0}

    # ── Constructors ────────────────────────────────────────────

    @classmethod
    def constant(cls, c):
        if c == 0:
            return cls()
        return cls({0: c})

    @classmethod
    def monomial(cls, exp, coef=sp.Integer(1)):
        if coef == 0:
            return cls()
        return cls({int(exp): coef})

    @classmethod
    def zero(cls):
        return cls()

    @classmethod
    def one(cls):
        return cls({0: sp.Integer(1)})

    @classmethod
    def from_sympy(cls, expr, q):
        """Parse a sympy expression assumed to be Laurent in `q`.

        Accepts: integers, rationals, `q**k`, sums and products of
        the above.  Anything else raises `ValueError`.

        This is the boundary into the fast path — callers that supply
        an arbitrary sympy expression find out here whether the
        expression was actually Laurent.
        """
        e = sp.sympify(expr)
        out: dict[int, object] = {}

        def _add(exp, coef):
            exp = int(exp)
            cur = out.get(exp, 0)
            new = cur + coef
            if new == 0:
                out.pop(exp, None)
            else:
                out[exp] = new

        def _walk(node, factor=sp.Integer(1)):
            # `factor` is the rational multiplier accumulated from
            # outer Mul layers.  We never accept non-rational factors
            # except powers of q (handled below).
            if node.is_Number:
                _add(0, factor * node)
                return
            if node == q:
                _add(1, factor)
                return
            if node.is_Pow and node.base == q and node.exp.is_Integer:
                _add(int(node.exp), factor)
                return
            if node.is_Add:
                for arg in node.args:
                    _walk(arg, factor)
                return
            if node.is_Mul:
                # Pull out rational factors and a single q^k factor.
                rat = factor
                exp = 0
                for arg in node.args:
                    if arg.is_Number:
                        rat = rat * arg
                    elif arg == q:
                        exp += 1
                    elif arg.is_Pow and arg.base == q and arg.exp.is_Integer:
                        exp += int(arg.exp)
                    else:
                        # Non-Laurent factor — give up and demand
                        # caller use the slow sympy path instead.
                        raise ValueError(
                            f"LaurentQ.from_sympy: non-Laurent factor "
                            f"{arg} in {expr}"
                        )
                _add(exp, rat)
                return
            raise ValueError(
                f"LaurentQ.from_sympy: cannot parse {node!r} ({type(node).__name__})"
            )

        _walk(e)
        return cls(out)

    def to_sympy(self, q):
        if not self.coefs:
            return sp.Integer(0)
        return sum(c * q**e for e, c in self.coefs.items())

    # ── Predicates ──────────────────────────────────────────────

    def is_zero(self):
        return not self.coefs

    def __bool__(self):
        return bool(self.coefs)

    def __eq__(self, other):
        if isinstance(other, LaurentQ):
            return self.coefs == other.coefs
        if other == 0:
            return self.is_zero()
        # Compare against scalar
        if len(self.coefs) == 1 and 0 in self.coefs:
            return self.coefs[0] == other
        return False

    def __ne__(self, other):
        return not self.__eq__(other)

    def __hash__(self):
        return hash(frozenset(self.coefs.items()))

    # ── Arithmetic ─────────────────────────────────────────────

    def _coerce(self, other):
        if isinstance(other, LaurentQ):
            return other
        if isinstance(other, (int, _Rational, sp.Integer, sp.Rational)):
            return LaurentQ({0: other}) if other != 0 else LaurentQ()
        return NotImplemented

    def __add__(self, other):
        o = self._coerce(other)
        if o is NotImplemented:
            return NotImplemented
        result = dict(self.coefs)
        for e, c in o.coefs.items():
            new = result.get(e, 0) + c
            if new == 0:
                result.pop(e, None)
            else:
                result[e] = new
        return LaurentQ(result)

    def __radd__(self, other):
        return self.__add__(other)

    def __neg__(self):
        return LaurentQ({e: -c for e, c in self.coefs.items()})

    def __sub__(self, other):
        return self + (-other if isinstance(other, LaurentQ) else -1 * other)

    def __rsub__(self, other):
        return (-self) + other

    def __mul__(self, other):
        o = self._coerce(other)
        if o is NotImplemented:
            return NotImplemented
        if not self.coefs or not o.coefs:
            return LaurentQ()
        result: dict[int, object] = {}
        for e1, c1 in self.coefs.items():
            for e2, c2 in o.coefs.items():
                e = e1 + e2
                cc = c1 * c2
                cur = result.get(e, 0)
                new = cur + cc
                if new == 0:
                    result.pop(e, None)
                else:
                    result[e] = new
        return LaurentQ(result)

    def __rmul__(self, other):
        return self.__mul__(other)

    # ── Pretty / debug ──────────────────────────────────────────

    def __repr__(self):
        if not self.coefs:
            return "LaurentQ(0)"
        parts = []
        for e in sorted(self.coefs.keys(), reverse=True):
            c = self.coefs[e]
            if e == 0:
                parts.append(str(c))
            elif e == 1:
                parts.append(f"{c}*q")
            else:
                parts.append(f"{c}*q^{e}")
        return "LaurentQ(" + " + ".join(parts) + ")"
