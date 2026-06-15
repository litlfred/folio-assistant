"""Gram matrix G on the H_3(q) NF basis, NF multiplication, and exact
(Fraction) variants — canonical owner.

Authoritative source for:
  Constants   NF_BASIS, NF_NAMES, TR_M, z, W_SYM, W_STD, W_ALT, G, G_INV
  Functions   hm, hm_exact, nf_tr, nf_net
  Internals   _hm_dict, _reduce_nf, _build_gram

Moved here (with inversion in M2b) from the 3425-line
folio-assistant/computations/hecke_core.py so there is a single
source of truth that downstream code can depend on. `hecke_core.py`
now imports these back for backward compatibility.

Every coefficient carries over exactly from the original definition;
values of G, G_INV, and every NF multiplication are byte-identical
to the pre-inversion implementation.
"""

from __future__ import annotations

from fractions import Fraction

import numpy as np

from . import _legacy  # noqa: F401  — adjusts sys.path

# Prefer the in-repo folio-assistant/computations/q_parameter shim (which
# _legacy puts on sys.path).  Fall back to the published qou_substrate
# package when pyhecke is used outside the repo (e.g. inside a Sage
# docker, on PyPI installs, in Pyodide, …).  Same fallback chain the
# `constants` module already uses — making it consistent here unblocks
# the SageMath + Pyodide smokes.
try:
    from q_parameter import Q as q0, Q_INV as qi, HA as h  # type: ignore[import-not-found]
except ImportError:
    from qou_substrate.constants import (  # type: ignore[import-not-found]
        Q as q0, Q_INV as qi, HA as h,
    )


# ══════════════════════════════════════════════════════════════
# Scalar constants
# ══════════════════════════════════════════════════════════════

z = 1.0 / (q0 ** 0.5 + qi ** 0.5)

# Wedderburn-Artin weights for H_3(q)
_q2 = q0 ** 2
_denom_w = _q2 ** 2 + 4 * _q2 + 1
W_SYM = _q2 / _denom_w
W_STD = (_q2 + 1) ** 2 / _denom_w
W_ALT = _q2 / _denom_w


# ══════════════════════════════════════════════════════════════
# NF basis and Markov-trace weights
# ══════════════════════════════════════════════════════════════

NF_BASIS: list[tuple[int, ...]] = [(), (0,), (1,), (0, 1), (1, 0), (0, 1, 0)]
NF_NAMES: list[str] = ["γ", "σ₀", "σ₁", "L₊", "L₋", "e⁻"]
# Markov-Ocneanu-Wenzl trace tr_M on the GB-NF basis of H_3(q).
# tr_M(γ) = 1; tr_M(σ_i) = z; tr_M(σ_i σ_j) = z² (i ≠ j, by Markov axiom).
# For e⁻ = σ_0·σ_1·σ_0: via Markov-trace recursion (cyclicity + σ_0² =
# h·σ_0 + 1) the correct value is h·z² + z, NOT z³ as listed prior to
# the 2026-05-19 fix (see docs/audits/2026-05-19-trm5-markov-bug.md).
TR_M = np.array([1.0, z, z, z ** 2, z ** 2, h * z ** 2 + z])


# Bond operators for molecular binding (per-generator crossing chains)
INV_TREFOIL_G0 = [(1, -h), (1, -h)]  # σ₀⁻¹σ₀⁻¹
INV_TREFOIL_G1 = [(1, -h)]  # σ₁⁻¹


# ══════════════════════════════════════════════════════════════
# NF multiplication in H_3(q)
# ══════════════════════════════════════════════════════════════

def hm(nf, c, d, gen):
    """Multiply NF element by (c·σ_gen + d·I). Returns new NF."""
    r = [0.0] * 6
    if gen == 0:
        tables = [
            (0, [(1, c), (0, d)]),
            (1, [(1, c * h), (0, c), (1, d)]),
            (2, [(3, c), (2, d)]),
            (3, [(3, c * h), (2, c), (3, d)]),
            (4, [(5, c), (4, d)]),
            (5, [(5, c * h), (4, c), (5, d)]),
        ]
    else:
        tables = [
            (0, [(2, c), (0, d)]),
            (1, [(4, c), (1, d)]),
            (2, [(2, c * h), (0, c), (2, d)]),
            (3, [(5, c), (3, d)]),
            (4, [(4, c * h), (1, c), (4, d)]),
            (5, [(5, c * h), (3, c), (5, d)]),
        ]
    for si, tgts in tables:
        if abs(nf[si]) < 1e-15:
            continue
        for ti, co in tgts:
            r[ti] += nf[si] * co
    return r


def nf_tr(nf):
    """Markov trace of NF element."""
    return sum(nf[i] * TR_M[i] for i in range(6))


def nf_net(nf):
    """Net (sum of NF coefficients)."""
    return sum(nf)


def nf_of_word(word, *, exact=False):
    """Normal-form 6-vector of a braid word in H_3(q).

    `word` is a tuple/list of generator indices (0 or 1); `()` is the
    identity. Built by right-multiplying the identity NF by each σ_gen
    (via `hm` / `hm_exact`, which fold in the GB reduction). With
    `exact=True` the result is a list of `Fraction`s."""
    if exact:
        nf = [Fraction(1), Fraction(0), Fraction(0),
              Fraction(0), Fraction(0), Fraction(0)]
        for g in word:
            nf = hm_exact(nf, Fraction(1), Fraction(0), g)
        return nf
    nf = [1.0, 0.0, 0.0, 0.0, 0.0, 0.0]
    for g in word:
        nf = hm(nf, 1.0, 0.0, g)
    return nf


def markov_trace_combo(terms, *, exact=False):
    """Markov trace of a linear combination Σ cᵢ·σ_{wᵢ} in H_3(q).

    `terms` is an iterable of `(coeff, word)` pairs, where `word` is a
    tuple of generator indices (0/1). Because `nf_tr` is linear (a dot
    product with `TR_M`), the trace of a linear combination is

        tr_M(Σ cᵢ σ_{wᵢ}) = Σ cᵢ · tr_M(NF(σ_{wᵢ})).

    This is the thin linear-combination extension point called out in
    `docs/scope/2026-06-04-fibre-composite4-implementation-spec.md`
    Step 1. With `exact=True` the Fraction path (`hm_exact`/`_TR_M_FRAC`)
    is used; pass rational `coeff`s (int/Fraction) in that mode.

    Caveat (exact mode): the NF *reduction* is exact in ℚ, but the
    Markov weights `_TR_M_FRAC` use `_Z_FRAC = 4993/10000`, a 4-digit
    rational approximation of the irrational `z = 1/(q^½+q^−½)`. So the
    exact-mode trace agrees with the float-mode trace only to ~1e-4
    (the z-truncation level), not to full precision; the float path is
    the more accurate of the two for the trace value itself."""
    if exact:
        acc = [Fraction(0)] * 6
        for c, word in terms:
            if isinstance(c, Fraction):
                cf = c
            elif isinstance(c, int):
                cf = Fraction(c)
            else:
                raise TypeError(
                    "markov_trace_combo(exact=True) requires int|Fraction "
                    f"coeffs (got {type(c).__name__}); pass exact rationals, "
                    "or use exact=False for float coeffs."
                )
            nfw = nf_of_word(word, exact=True)
            for i in range(6):
                acc[i] += cf * nfw[i]
        return sum(acc[i] * _TR_M_FRAC[i] for i in range(6))
    acc = [0.0] * 6
    for c, word in terms:
        nfw = nf_of_word(word)
        for i in range(6):
            acc[i] += c * nfw[i]
    return sum(acc[i] * TR_M[i] for i in range(6))


# ══════════════════════════════════════════════════════════════
# Gram matrix
# ══════════════════════════════════════════════════════════════

def _hm_dict(t1, t2):
    r = {}
    for w1, c1 in t1.items():
        for w2, c2 in t2.items():
            w = w1 + w2
            r[w] = r.get(w, 0.0) + c1 * c2
    return {w: c for w, c in r.items() if abs(c) > 1e-15}


def _reduce_nf(terms):
    changed = True
    while changed:
        changed = False
        new = {}
        for word, coeff in terms.items():
            if abs(coeff) < 1e-15:
                continue
            done = False
            for p in range(len(word) - 1):
                if word[p] == word[p + 1]:
                    i = word[p]
                    pre, suf = word[:p], word[p + 2:]
                    new[pre + (i,) + suf] = new.get(pre + (i,) + suf, 0) + coeff * h
                    new[pre + suf] = new.get(pre + suf, 0) + coeff
                    done = changed = True
                    break
            if done:
                continue
            for p in range(len(word) - 2):
                a, b, c = word[p], word[p + 1], word[p + 2]
                if a == c and abs(a - b) == 1:
                    nt = (b, a, b)
                    if nt < (a, b, a):
                        nw = word[:p] + nt + word[p + 3:]
                        new[nw] = new.get(nw, 0) + coeff
                        done = changed = True
                        break
            if not done:
                new[word] = new.get(word, 0) + coeff
        terms = {w: c for w, c in new.items() if abs(c) > 1e-15}
    return terms


def _build_gram():
    G = np.zeros((6, 6))
    for i in range(6):
        for j in range(6):
            prod = _hm_dict({NF_BASIS[i]: 1.0}, {NF_BASIS[j]: 1.0})
            nf = _reduce_nf(prod)
            vec = np.array([nf.get(b, 0.0) for b in NF_BASIS])
            G[i, j] = sum(vec[k] * TR_M[k] for k in range(6))
    return G


G = _build_gram()
G_INV = np.linalg.inv(G)

# Identity NF: the trivial braid [1, 0, 0, 0, 0, 0]
_ID_NF = np.array([1.0, 0, 0, 0, 0, 0])


# ══════════════════════════════════════════════════════════════
# Exact rational NF computation via Fraction arithmetic
# ══════════════════════════════════════════════════════════════
# H_3(q) at q = 111/100 is exact in ℚ. Uses Python's Fraction — no
# floating point, no overflow.

_Q_FRAC = Fraction(111, 100)
_QI_FRAC = Fraction(100, 111)
_H_FRAC = _Q_FRAC - _QI_FRAC  # h = q - 1/q (exact rational)
_Z_FRAC = Fraction(4993, 10000)  # z ≈ 1/(q^{1/2}+q^{-1/2})

_TR_M_FRAC = [Fraction(1), _Z_FRAC, _Z_FRAC,
              _Z_FRAC ** 2, _Z_FRAC ** 2,
              _H_FRAC * _Z_FRAC ** 2 + _Z_FRAC]  # fix 2026-05-19 (was _Z_FRAC ** 3)

_SYM_EIG_FRAC = [Fraction(1), _Q_FRAC, _Q_FRAC,
                 _Q_FRAC ** 2, _Q_FRAC ** 2, _Q_FRAC ** 3]
_ALT_EIG_FRAC = [Fraction(1), -_QI_FRAC, -_QI_FRAC,
                 _QI_FRAC ** 2, _QI_FRAC ** 2, -_QI_FRAC ** 3]


def hm_exact(nf, c, d, gen):
    """Exact Fraction multiplication: NF × (c·σ_gen + d·I).

    Same logic as hm() but with Fraction arithmetic — no rounding.
    """
    r = [Fraction(0)] * 6
    if gen == 0:
        tables = [
            (0, [(1, c), (0, d)]),
            (1, [(1, c * _H_FRAC), (0, c), (1, d)]),
            (2, [(3, c), (2, d)]),
            (3, [(3, c * _H_FRAC), (2, c), (3, d)]),
            (4, [(5, c), (4, d)]),
            (5, [(5, c * _H_FRAC), (4, c), (5, d)]),
        ]
    else:
        tables = [
            (0, [(2, c), (0, d)]),
            (1, [(4, c), (1, d)]),
            (2, [(2, c * _H_FRAC), (0, c), (2, d)]),
            (3, [(5, c), (3, d)]),
            (4, [(4, c * _H_FRAC), (1, c), (4, d)]),
            (5, [(5, c * _H_FRAC), (3, c), (5, d)]),
        ]
    for si, tgts in tables:
        if nf[si] == 0:
            continue
        for ti, co in tgts:
            r[ti] += nf[si] * co
    return r


# ══════════════════════════════════════════════════════════════
# Public API
# ══════════════════════════════════════════════════════════════

__all__ = [
    # Scalar constants
    "z", "W_SYM", "W_STD", "W_ALT",
    # NF basis
    "NF_BASIS", "NF_NAMES", "TR_M",
    # Bond operators
    "INV_TREFOIL_G0", "INV_TREFOIL_G1",
    # NF multiplication
    "hm", "hm_exact", "nf_tr", "nf_net", "nf_of_word", "markov_trace_combo",
    # Gram matrix
    "G", "G_INV", "gram_matrix", "gram_inverse",
    # Native-dispatched atom kernels
    "build_atom_nf", "atom_per_generator_volumes", "has_native",
    # Exact-rational internals (rarely used externally)
    "_H_FRAC", "_Z_FRAC", "_TR_M_FRAC",
    "_SYM_EIG_FRAC", "_ALT_EIG_FRAC",
]


def gram_matrix() -> np.ndarray:
    """Return the 6x6 Gram matrix on the NF basis at q = q_0."""
    return G


def gram_inverse() -> np.ndarray:
    """Return G^{-1}."""
    return G_INV


# ══════════════════════════════════════════════════════════════
# Native-accelerated atom kernels
# ══════════════════════════════════════════════════════════════
# When the `pyhecke_native` wheel is installed, these dispatch to the
# Rust implementation (~100× on ⁴⁰Ca). Fallback is hecke_core's pure
# Python. hecke_core is imported lazily at call time to avoid
# circular-import with pyhecke.gram's own loading.

try:
    import pyhecke_native as _native  # type: ignore[import-not-found]
    _HAS_NATIVE = True
except ImportError:
    _native = None
    _HAS_NATIVE = False


def has_native() -> bool:
    """True iff the pyhecke_native wheel is installed."""
    return _HAS_NATIVE


def build_atom_nf(Z: int, N: int):
    """Build the atom NF for (Z, N). Native-dispatched; falls back
    to hecke_core.build_atom_nf when the wheel is absent."""
    if _HAS_NATIVE:
        return _native.build_atom_nf(Z, N)
    import hecke_core  # type: ignore[import-not-found]
    return hecke_core.build_atom_nf(Z, N)


def atom_per_generator_volumes(
    Z: int,
    N: int,
    include_inter: bool = True,
    crossings_per_pair: int = 1,
    m_pp=None, m_pn=None, m_nn=None,
):
    """Per-generator Wedderburn volumes for the atom braid. Native-
    dispatched; falls back to hecke_core.atom_per_generator_volumes
    when the wheel is absent."""
    if _HAS_NATIVE:
        return _native.atom_per_generator_volumes(
            Z, N,
            include_inter=include_inter,
            crossings_per_pair=crossings_per_pair,
            m_pp=m_pp, m_pn=m_pn, m_nn=m_nn,
        )
    import hecke_core  # type: ignore[import-not-found]
    return hecke_core.atom_per_generator_volumes(
        Z, N,
        include_inter=include_inter,
        crossings_per_pair=crossings_per_pair,
        m_pp=m_pp, m_pn=m_pn, m_nn=m_nn,
    )
