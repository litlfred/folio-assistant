"""Tests for the formal-q (ℚ(s)) Markov trace `trace_formal`
(spec Steps 2–3, PR #1811). Requires sympy + pyhecke + qou-substrate.

Run directly: `python3 tools/pyhecke/tests/test_trace_formal.py`.
"""
from __future__ import annotations

import sympy as sp

from pyhecke import gram
from pyhecke.trace_formal import (
    s,
    h_formal,
    z_formal,
    nf_of_word_formal,
    nf_tr_formal,
    markov_trace_combo_formal,
    specialize,
    eval_at_root_of_unity,
    quantum_int,
    habiro_profile,
    classical_limit,
)

# qou-substrate substrate q₀ (float) for specialization checks.
from qou_substrate.constants import Q as Q0  # type: ignore

_SQRT_Q0 = float(Q0) ** 0.5


def _close(a, b, tol=1e-10):
    return abs(complex(a) - complex(b)) < tol


def test_z_and_h_specialize_to_substrate():
    """z, h symbolic specialized at s=√q₀ match the gram float values."""
    z_num = float(specialize(z_formal, _SQRT_Q0))
    h_num = float(specialize(h_formal, _SQRT_Q0))
    assert _close(z_num, float(gram.z)), (z_num, gram.z)
    # gram h = q - q⁻¹; reconstruct from gram constants
    h_gram = float(Q0) - 1.0 / float(Q0)
    assert _close(h_num, h_gram), (h_num, h_gram)


def test_basis_word_traces_match_TR_M():
    """nf_tr_formal of each basis word, at s=√q₀, equals gram.TR_M[i]."""
    words = [(), (0,), (1,), (0, 1), (1, 0), (0, 1, 0)]
    for i, w in enumerate(words):
        tr_sym = nf_tr_formal(nf_of_word_formal(w))
        val = float(specialize(tr_sym, _SQRT_Q0))
        assert _close(val, float(gram.TR_M[i])), (w, val, gram.TR_M[i])


def test_combo_matches_float_path_at_substrate():
    """markov_trace_combo_formal specialized at q₀ == float markov_trace_combo."""
    terms = [(2, (0, 1, 0)), (-1, (1,)), (5, ())]
    sym = markov_trace_combo_formal(terms)
    val = float(specialize(sym, _SQRT_Q0))
    flt = gram.markov_trace_combo([(2.0, (0, 1, 0)), (-1.0, (1,)), (5.0, ())])
    assert _close(val, float(flt)), (val, flt)


def test_hecke_relation_symbolic():
    """σ₀² = h·σ₀ + 1 as symbolic NF vectors (exact in ℚ(s))."""
    sq = nf_of_word_formal((0, 0))
    expected = [sp.Integer(1), h_formal, sp.Integer(0),
                sp.Integer(0), sp.Integer(0), sp.Integer(0)]
    for i in range(6):
        assert sp.simplify(sq[i] - expected[i]) == 0, (i, sq[i])


def test_trace_is_rational_in_s():
    """tr_M(σ₀) = z = s/(s²+1) — a genuine rational function in s, not a
    Laurent polynomial (the Step-2 raison d'être)."""
    tr = nf_tr_formal(nf_of_word_formal((0,)))
    assert sp.simplify(tr - s / (s ** 2 + 1)) == 0, tr


def test_root_of_unity_eval_runs_and_is_finite():
    """eval_at_root_of_unity returns finite complex values; tr_M(σ₀) at
    q=exp(2πi/N) equals z evaluated there (sanity, Step-3 hook)."""
    tr_sigma0 = nf_tr_formal(nf_of_word_formal((0,)))
    for N in (3, 5, 7, 12):
        val = complex(eval_at_root_of_unity(tr_sigma0, N))
        # s = exp(iπ/N); z = s/(s²+1)
        sv = complex(sp.N(sp.exp(sp.I * sp.pi * sp.Rational(1, N))))
        assert _close(val, sv / (sv ** 2 + 1)), (N, val)


# ──────────────────────────────────────────────────────────────────
# Step 3 — roots-of-unity / Habiro evaluation (PR #1811)
# ──────────────────────────────────────────────────────────────────

def test_quantum_int_classical_limit_is_n():
    """[n]_q → n as q→1; in particular [5]₁² = 25 — the undeformed `/25`
    denominator of the Q_β c_3 rung (impl-spec Step 3, #1811 probe)."""
    assert _close(complex(classical_limit(quantum_int(5))), 5)
    assert _close(complex(classical_limit(quantum_int(5) ** 2)), 25)
    assert _close(complex(classical_limit(quantum_int(3))), 3)


def test_quantum_int_25_is_fibre_local_not_global():
    """`[5]_q² = 25` holds ONLY at the classical fibre point q→1, NOT at
    a finite root of unity — the #1811 lesson that a Habiro element is a
    *family* of values, not a single point."""
    fam = quantum_int(5) ** 2
    assert _close(complex(classical_limit(fam)), 25)
    at7 = complex(eval_at_root_of_unity(fam, 7))   # ζ_7
    assert not _close(at7, 25, tol=1.0)


def test_habiro_profile_skips_trace_pole():
    """habiro_profile of tr_M(σ₀)=z=s/(s²+1) over N=1..6 skips the pole
    at N=2 (s=i ⇒ s²+1=0); every kept N carries z evaluated at ζ_N."""
    z_expr = nf_tr_formal(nf_of_word_formal((0,)))
    prof = habiro_profile(z_expr, 6)
    kept_N = [N for N, _ in prof]
    assert kept_N == [1, 3, 4, 5, 6], kept_N
    for N, val in prof:
        sv = complex(sp.N(sp.exp(sp.I * sp.pi * sp.Rational(1, N))))
        assert _close(val, sv / (sv ** 2 + 1)), (N, val)


def test_habiro_profile_keep_degenerate_marks_none():
    """skip_degenerate=False records the pole at N=2 as (2, None)."""
    z_expr = nf_tr_formal(nf_of_word_formal((0,)))
    prof = dict(habiro_profile(z_expr, 4, skip_degenerate=False))
    assert prof[2] is None, prof
    assert prof[1] is not None and prof[3] is not None


def test_habiro_profile_keeps_finite_zero():
    """A finite *zero* (a numerator quantum integer, [5] at ζ_5) is KEPT
    with value ≈ 0 — only denominator poles count as degenerate."""
    prof = dict(habiro_profile(quantum_int(5), 6))
    assert 5 in prof, prof
    assert _close(prof[5], 0, tol=1e-9), prof[5]


def test_classical_limit_of_trace_is_archimedean_shadow():
    """The q→1 limit of the bare trace tr_M(σ₀)=z is 1/2 (finite); this
    is the archimedean shadow recovered at N→∞ (impl-spec Step 3)."""
    z_expr = nf_tr_formal(nf_of_word_formal((0,)))
    assert _close(complex(classical_limit(z_expr)), 0.5)


if __name__ == "__main__":
    test_z_and_h_specialize_to_substrate()
    test_basis_word_traces_match_TR_M()
    test_combo_matches_float_path_at_substrate()
    test_hecke_relation_symbolic()
    test_trace_is_rational_in_s()
    test_root_of_unity_eval_runs_and_is_finite()
    # Step 3
    test_quantum_int_classical_limit_is_n()
    test_quantum_int_25_is_fibre_local_not_global()
    test_habiro_profile_skips_trace_pole()
    test_habiro_profile_keep_degenerate_marks_none()
    test_habiro_profile_keeps_finite_zero()
    test_classical_limit_of_trace_is_archimedean_shadow()
    print("all trace_formal tests passed (Steps 2–3)")
