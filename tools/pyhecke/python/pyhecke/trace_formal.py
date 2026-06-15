"""Formal-q Markov trace on the H_3(q) NF basis — symbolic over ℚ(s).

Spec Step 2 (`docs/scope/2026-06-04-fibre-composite4-implementation-spec.md`).
The float / Fraction Markov trace in `gram.py` evaluates at a fixed
numeric q (the substrate q₀, or the 111/100 rational model). This module
carries q **symbolically** so the trace can later be evaluated at any
point — in particular at **roots of unity** (Step 3), which the fibre /
Habiro analysis of the Q_β c_3 residue A needs.

## Why the variable is s = q^½, not q

The Markov weight `z = 1/(q^½ + q^−½)` is *not* a Laurent polynomial in
q (or in s): in `s = q^½` it is the rational function `z = s/(s²+1)`.
So the natural coefficient ring is **ℚ(s)** (rational functions in s),
not Laurent polynomials. We therefore use sympy with the symbol `s`;
`q = s²`, `h = q − q⁻¹ = s² − s⁻²` (Laurent in s), `z = 1/(s + s⁻¹)`.

## Optional dependency

This module requires `sympy`. It is imported lazily by the pyhecke
package (`pyhecke/__init__.py` PEP-562 loader), so importing pyhecke
itself does not require sympy — only `import pyhecke.trace_formal` does.

## Public API

    s, q_of_s, h_formal, z_formal      — the symbolic atoms
    TR_M_formal()                      — symbolic Markov weights (6-vector)
    nf_of_word_formal(word)            — NF 6-vector of a braid word
    nf_tr_formal(nf)                   — symbolic Markov trace of an NF vector
    markov_trace_combo_formal(terms)   — tr_M(Σ cᵢ σ_{wᵢ}), simplified
    specialize(expr, s_value)          — substitute s and simplify/evalf
    eval_at_root_of_unity(expr, N, k)  — q = exp(2πik/N) → s = exp(πik/N)
    quantum_int(n)                     — balanced [n]_q = (sⁿ−s⁻ⁿ)/(s−s⁻¹)
    habiro_profile(expr, N_max)        — family {ζ_N ↦ expr(ζ_N)} (Step 3)
    classical_limit(expr)              — value at q→1 (archimedean shadow)
"""
from __future__ import annotations

import cmath

import sympy as sp

# s = q^{1/2}.  Declared positive so sympy keeps real-axis simplifications
# clean; root-of-unity evaluation substitutes a complex value explicitly.
s = sp.symbols("s", positive=True)
q_of_s = s ** 2
h_formal = q_of_s - 1 / q_of_s          # = s² − s⁻²  (Laurent in s)
z_formal = 1 / (s + 1 / s)              # = s/(s²+1)  (rational in s)


# Built once at import — the symbolic Markov-Ocneanu-Wenzl weights are
# constant in s, so there is no need to rebuild the list on every call.
_TR_M_FORMAL: list[sp.Expr] = [
    sp.Integer(1), z_formal, z_formal,
    z_formal ** 2, z_formal ** 2, h_formal * z_formal ** 2 + z_formal,
]


def TR_M_formal() -> list[sp.Expr]:
    """Symbolic Markov-Ocneanu-Wenzl weights on the NF basis
    [γ, σ₀, σ₁, L₊, L₋, e⁻] — mirrors `gram.TR_M` with z, h symbolic.
    tr_M(e⁻) = h·z² + z (the 2026-05-19 fix, not z³). Returns the
    module-level cached list (built once at import); do not mutate."""
    return _TR_M_FORMAL


# NF multiplication by σ_gen (c=1, d=0) — symbolic mirror of gram.hm.
def _hm_formal(nf: list[sp.Expr], gen: int) -> list[sp.Expr]:
    h = h_formal
    r = [sp.Integer(0)] * 6
    if gen == 0:
        tables = [
            (0, [(1, sp.Integer(1))]),
            (1, [(1, h), (0, sp.Integer(1))]),
            (2, [(3, sp.Integer(1))]),
            (3, [(3, h), (2, sp.Integer(1))]),
            (4, [(5, sp.Integer(1))]),
            (5, [(5, h), (4, sp.Integer(1))]),
        ]
    else:
        tables = [
            (0, [(2, sp.Integer(1))]),
            (1, [(4, sp.Integer(1))]),
            (2, [(2, h), (0, sp.Integer(1))]),
            (3, [(5, sp.Integer(1))]),
            (4, [(4, h), (1, sp.Integer(1))]),
            (5, [(5, h), (3, sp.Integer(1))]),
        ]
    for si, tgts in tables:
        if nf[si] == 0:
            continue
        for ti, co in tgts:
            r[ti] += nf[si] * co
    return [sp.expand(x) for x in r]


def nf_of_word_formal(word) -> list[sp.Expr]:
    """Symbolic NF 6-vector of a braid word (tuple of 0/1 generators)."""
    nf = [sp.Integer(1), sp.Integer(0), sp.Integer(0),
          sp.Integer(0), sp.Integer(0), sp.Integer(0)]
    for g in word:
        nf = _hm_formal(nf, g)
    return nf


def nf_tr_formal(nf: list[sp.Expr]) -> sp.Expr:
    """Symbolic Markov trace of an NF 6-vector (dot with TR_M_formal)."""
    weights = TR_M_formal()
    return sp.simplify(sum(nf[i] * weights[i] for i in range(6)))


def markov_trace_combo_formal(terms) -> sp.Expr:
    """Symbolic tr_M(Σ cᵢ·σ_{wᵢ}) over ℚ(s).

    `terms` is an iterable of `(coeff, word)`; coeffs may be ints,
    Fractions, or sympy expressions. Returns a simplified rational
    function in `s`."""
    acc = [sp.Integer(0)] * 6
    for c, word in terms:
        cf = c if isinstance(c, sp.Basic) else sp.sympify(c)
        nfw = nf_of_word_formal(word)
        for i in range(6):
            acc[i] += cf * nfw[i]
    return nf_tr_formal(acc)


def specialize(expr: sp.Expr, s_value, *, dps: int = 50):
    """Substitute a numeric value for s and evaluate to `dps` digits.

    `s_value` may be real or complex; returns a sympy Float/complex."""
    return sp.N(expr.subs(s, sp.sympify(s_value)), dps)


def eval_at_root_of_unity(expr: sp.Expr, N: int, k: int = 1, *, dps: int = 50):
    """Evaluate `expr` at q = exp(2πik/N), i.e. s = q^½ = exp(πik/N).

    Returns a (generally complex) sympy number at `dps` digits. This is
    the Step-3 hook: a Habiro element is the *family* of these values
    over all roots of unity, not any single one."""
    s_val = sp.exp(sp.I * sp.pi * sp.Rational(k, N))
    return sp.N(expr.subs(s, s_val), dps)


def quantum_int(n: int) -> sp.Expr:
    """Balanced quantum integer `[n]_q = (sⁿ − s⁻ⁿ)/(s − s⁻¹)`, q = s².

    Properties used downstream:
    - `[n] → n` as `s → 1` (so `[5]₁² = 25`, the undeformed `/25`
      denominator of the Q_β c_3 rung — see the #1811 fibre probe and
      impl-spec Steps 3–4);
    - `[n]` vanishes at `ζ = exp(iπk/N)` iff `N | k·n`, which is the
      "degenerate `[n]_ζ = 0`" case `habiro_profile` skips.

    Provided so Step-4 callers can build / recognise the `[5]_q²`
    structure without re-deriving it; it is *not* itself a trace."""
    return (s ** n - s ** (-n)) / (s - 1 / s)


def _finite_complex(val):
    """Coerce a sympy number to a finite Python complex, or None if it
    is a pole (`zoo`/`oo`/`nan`) or otherwise non-finite."""
    try:
        c = complex(val)
    except (TypeError, ValueError):
        return None
    return c if cmath.isfinite(c) else None


def habiro_profile(expr: sp.Expr, N_max: int, *, k: int = 1,
                   dps: int = 50, skip_degenerate: bool = True):
    """Root-of-unity *family* `{ ζ_N ↦ expr(ζ_N) : N = 1..N_max }`,
    ζ_N = exp(2πik/N) (so s = exp(iπk/N)).

    A Habiro-ring element is determined by this whole family of values,
    **not** by any single evaluation — the key lesson of the #1811
    fibre reconnaissance probe, which found `/25 = [5]_q²` only at the
    classical fibre point `q = 1`, at no finite root of unity, and not
    at the substrate q₀. So the right object to compare against a
    candidate c_3 residue-A element (impl-spec Step 4) is this profile,
    not a point value.

    Returns a list of `(N, value)` pairs. Degenerate N — where `expr`
    has a pole at ζ_N (a quantum integer `[n]_ζ` in a denominator
    vanishes; for the bare Markov trace `z = s/(s²+1)` this is N = 2k)
    — are dropped when `skip_degenerate` (default), so the list is
    sparse in N; pass `skip_degenerate=False` to keep them as
    `(N, None)`. `value` is a Python `complex`."""
    profile: list[tuple[int, complex | None]] = []
    for N in range(1, N_max + 1):
        val = _finite_complex(eval_at_root_of_unity(expr, N, k, dps=dps))
        if val is None:
            if not skip_degenerate:
                profile.append((N, None))
            continue
        profile.append((N, val))
    return profile


def classical_limit(expr: sp.Expr, *, dps: int = 50):
    """Value at the trivial fibre point `q → 1` (`s → 1`): the
    archimedean shadow of a Habiro element (impl-spec Step 3, "q→1 =
    N→∞"). Uses `sp.limit`, not `subs`, so removable `0/0` singularities
    (e.g. `quantum_int(n) → n`) resolve correctly. Returns a sympy
    number at `dps` digits."""
    return sp.N(sp.limit(expr, s, 1), dps)
