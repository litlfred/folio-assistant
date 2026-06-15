"""Tests for the linear-combination Markov trace `markov_trace_combo`
(spec Step 1, PR #1811 / docs/scope/2026-06-04-fibre-composite4-*).

Run directly (`python3 tools/pyhecke/tests/test_markov_combo.py`) or via
pytest. Requires the `pyhecke` + `qou-substrate` packages importable.
"""
from __future__ import annotations

from fractions import Fraction

from pyhecke import gram


def test_single_word_agrees_with_nf_tr():
    """A 1-term combo equals the plain Markov trace of that word's NF."""
    for word in [(), (0,), (1,), (0, 1), (1, 0), (0, 1, 0)]:
        combo = gram.markov_trace_combo([(1.0, word)])
        direct = gram.nf_tr(gram.nf_of_word(word))
        assert abs(combo - direct) < 1e-12, (word, combo, direct)


def test_basis_words_hit_TR_M_entries():
    """NF(word) of each basis word is a unit vector → trace is TR_M[i]."""
    expected = {
        (): gram.TR_M[0], (0,): gram.TR_M[1], (1,): gram.TR_M[2],
        (0, 1): gram.TR_M[3], (1, 0): gram.TR_M[4], (0, 1, 0): gram.TR_M[5],
    }
    for word, tr in expected.items():
        assert abs(gram.nf_tr(gram.nf_of_word(word)) - tr) < 1e-12, word


def test_linearity():
    """tr_M(2·σ₀ + 3·σ₁) == 2·tr_M(σ₀) + 3·tr_M(σ₁)."""
    combo = gram.markov_trace_combo([(2.0, (0,)), (3.0, (1,))])
    manual = 2.0 * gram.nf_tr(gram.nf_of_word((0,))) \
        + 3.0 * gram.nf_tr(gram.nf_of_word((1,)))
    assert abs(combo - manual) < 1e-12, (combo, manual)


def test_hecke_relation_via_trace():
    """σ₀² = h·σ₀ + 1, so tr_M(σ₀σ₀) == h·tr_M(σ₀) + tr_M(1).

    LHS computed as the trace of the reduced word (0,0); RHS as a
    linear combination using the substrate h = q - q⁻¹."""
    from qou_substrate.constants import HA as h  # type: ignore
    lhs = gram.markov_trace_combo([(1.0, (0, 0))])
    rhs = gram.markov_trace_combo([(float(h), (0,)), (1.0, ())])
    assert abs(lhs - rhs) < 1e-12, (lhs, rhs)


def test_exact_nf_reduction_is_truly_exact():
    """The NF *reduction* in Fraction mode is genuinely exact in ℚ:
    σ₀² reduces to exactly `_H_FRAC·σ₀ + 1` as a Fraction 6-vector,
    where `_H_FRAC = 2321/11100 = q - q⁻¹` at the exact-path rational
    model `q = 111/100` (NOT the float path's true q₀ = 1.10998…, which
    is why the two paths differ by ~1e-3 — a second approximation layer
    on top of the 4-digit z)."""
    h_frac = gram._H_FRAC
    assert h_frac == Fraction(2321, 11100)            # sanity on the model
    sq = gram.nf_of_word((0, 0), exact=True)
    expected = [Fraction(1), h_frac, Fraction(0),
                Fraction(0), Fraction(0), Fraction(0)]
    assert sq == expected, sq                          # exact ℚ equality


def test_exact_matches_float_to_z_approx():
    """Fraction path agrees with float only to ~1e-4 because _TR_M_FRAC
    uses the 4-digit z approximation `_Z_FRAC = 4993/10000` (documented
    caveat in markov_trace_combo). The float path is the accurate one."""
    terms_f = [(2.0, (0, 1, 0)), (-1.0, (1,)), (5.0, ())]
    terms_q = [(Fraction(2), (0, 1, 0)), (Fraction(-1), (1,)), (Fraction(5), ())]
    f = gram.markov_trace_combo(terms_f)
    q = gram.markov_trace_combo(terms_q, exact=True)
    assert abs(f - float(q)) < 1e-3, (f, float(q))   # z-truncation level


if __name__ == "__main__":
    test_single_word_agrees_with_nf_tr()
    test_basis_words_hit_TR_M_entries()
    test_linearity()
    test_hecke_relation_via_trace()
    test_exact_nf_reduction_is_truly_exact()
    test_exact_matches_float_to_z_approx()
    print("all markov_trace_combo tests passed")
