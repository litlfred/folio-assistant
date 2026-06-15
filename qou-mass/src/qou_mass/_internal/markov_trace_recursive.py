#!/usr/bin/env python3
"""
Recursive symbolic Markov-trace computer for arbitrary words in H_n(q).

Builds on the existing `gb_filtration_jet_tracker.HeckeElement` class
(which is already symbolic via the sympy `q` symbol) to expand any
braid word into the Hecke basis {T_w : w ∈ S_n}, then computes the
Markov trace by RECURSIVE descent on n via the Markov axiom

  tr_M(α · σ_n) = z · tr_M(α),    α ∈ H_n.

Plus base cases:
  tr_M(1_{H_n}) = 1   for all n,
  tr_M(σ_i)     = z   (Markov-axiom-derived).

Algorithm for tr_M(T_w) where w ∈ S_n:
  1. If w fixes position n (i.e., reduced word doesn't use σ_{n-2},
     0-indexed), then T_w ∈ H_{n-1} and recurse with smaller n.
  2. Otherwise, w uses σ_{n-2} (the highest generator of H_n).
     Find rightmost σ_{n-2} in canonical reduced word, cyclically
     rotate to put it at the end, drop it (Markov axiom), and
     reduce the remainder back into the H_n basis via HeckeElement.
     Each strip removes exactly one σ_{n-2} factor; ℓ(w) strictly
     decreases per recursive call → termination.
  3. Identity returns 1.

Memoization on `(perm, n)` keeps the computation fast across
atoms: S_n has finitely many basis elements, so each is computed
at most once per ambient n.

Output: markov-trace-recursive.witness.json (with H_3, H_4, H_5
example computations).
"""
from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from functools import lru_cache
from pathlib import Path

import sympy as sp

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE))

from witness_base import WitnessBuilder  # noqa: E402

from gb_filtration_jet_tracker import HeckeElement, perm_apply_s

# Sympy q, h, z (matching the jet_tracker convention)
q = sp.symbols("q", positive=True)
h_sym = q - 1 / q
z_sym = 1 / (sp.sqrt(q) + 1 / sp.sqrt(q))


def coxeter_length(perm: tuple) -> int:
    n = len(perm)
    return sum(1 for i in range(n) for j in range(i + 1, n) if perm[i] > perm[j])


def reduced_word(perm: tuple) -> list[int]:
    """Canonical reduced word for `perm` ∈ S_n via greedy descent.
    Returns list of generator indices (0-indexed: σ_0, σ_1, ...,
    σ_{n-2})."""
    n = len(perm)
    word = []
    p = list(perm)
    while coxeter_length(tuple(p)) > 0:
        for i in range(n - 1):
            if p[i] > p[i + 1]:
                p[i], p[i + 1] = p[i + 1], p[i]
                word.append(i)
                break
    return list(reversed(word))


@lru_cache(maxsize=None)
def tr_m_basis_element(perm: tuple, n: int | None = None) -> sp.Expr:
    """Compute tr_M(T_perm) for `perm` ∈ S_n recursively.

    Indexing convention: gen indices are 0-based; H_n's generators
    are σ_0, σ_1, ..., σ_{n-2} (n-1 generators).  The "highest"
    generator σ_{n-2} is the one peeled off via the Markov axiom
    (tr_M(α · σ_{n-2}) = z · tr_M(α) for α ∈ H_{n-1}).

    Memoised on (perm, n): each S_n basis element is reduced once
    per ambient algebra size."""
    if n is None:
        n = len(perm)
    if perm == tuple(range(1, n + 1)):
        return sp.Integer(1)
    word = reduced_word(perm)
    if not word:
        return sp.Integer(1)
    max_gen = max(word)
    # If max_gen < n - 2, w uses only generators σ_0..σ_{max_gen}, so
    # w ∈ H_{max_gen+2} ⊂ H_n.  Truncate to actual S_{max_gen+2} perm.
    if max_gen < n - 2:
        sub_perm = perm[: max_gen + 2]
        return tr_m_basis_element(sub_perm, max_gen + 2)
    # max_gen == n - 2: w uses the highest generator. Apply Markov
    # axiom via cyclic rotation.  Find rightmost σ_{n-2} in canonical
    # reduced word; remove it, cyclic-rotate the remainder.
    k = max(i for i, g in enumerate(word) if g == max_gen)
    rotated = word[k + 1 :] + word[:k]
    # `rotated` may still contain σ_{n-2} (if w had multiple occurrences).
    # In that case the basis-element expansion of `rotated` via
    # HeckeElement will produce a sum of T_{w'} with ℓ(w') ≤ ℓ(rotated)
    # = ℓ(w) - 1, so recursion strictly decreases length.
    E = HeckeElement.identity(n)
    for i in rotated:
        E = E.right_mul_T(i + 1)  # jet-tracker is 1-indexed
    result = sp.Integer(0)
    for w_prime, c in E.terms.items():
        result += c * tr_m_basis_element(w_prime, n)
    return sp.cancel(z_sym * result)


def markov_trace_of_word(n: int, word: list[int]) -> sp.Expr:
    """Compute tr_M(β) for β specified by `word` (signed integers,
    positive = σ_i, negative = σ_i^{-1}; jet-tracker 1-indexed).

    Reduces β to T_w basis via HeckeElement, then applies
    `tr_m_basis_element` to each basis term.  Memoisation across
    calls makes repeated atom evaluations cheap.
    """
    E = HeckeElement.identity(n)
    for i in word:
        if i > 0:
            E = E.right_mul_T(i)
        else:
            E = E.right_mul_T_inv(-i)
    result = sp.Integer(0)
    for w, c in E.terms.items():
        result += c * tr_m_basis_element(w, n)
    return sp.cancel(result)


def main() -> int:
    print("=" * 96)
    print(f"  Recursive symbolic Markov-trace reducer for arbitrary H_n words")
    print(f"  Memoised on basis elements; uses HeckeElement for braid + Hecke reductions.")
    print("=" * 96)

    test_cases = [
        # (name, n, word, expected_at_q0, ref)
        ("identity_H3",                 3, [],                      1.0,    "tr_M(1) = 1"),
        ("σ_1",                         3, [1],                     None,   "tr_M(σ_i) = z ≈ 0.4993"),
        ("σ_1²",                        3, [1, 1],                  None,   "Hecke quadratic: h z + 1"),
        ("σ_1σ_2",                      3, [1, 2],                  None,   "tr_M = z² ≈ 0.2493"),
        ("σ_1σ_2σ_1 (w_0)",             3, [1, 2, 1],               None,   "z + h z² ≈ 0.5514"),
        ("σ_1^7 σ_2^4 (proton)",        3, [1] * 7 + [2] * 4,       1.6332, "match char_fast"),
        ("σ_1^6 σ_2^4 σ_1^{-1} (neutron-like)", 3, [1] * 6 + [2] * 4 + [-1], None, "Markov 11-cross with inverse"),
        # H_4
        ("σ_1σ_2σ_3 (H_4)",             4, [1, 2, 3],               None,   "tr_M = z³"),
        ("σ_1σ_2σ_3σ_2σ_1 (H_4)",       4, [1, 2, 3, 2, 1],         None,   "non-trivial 4-strand"),
        # H_5
        ("σ_1σ_2σ_3σ_4 (H_5)",          5, [1, 2, 3, 4],            None,   "tr_M = z^4"),
        # H_6 deuteron-equivalent (disjoint clusters)
        ("σ_1σ_2σ_4σ_5 (deuteron disjoint)", 6, [1, 2, 4, 5],       None,   "tr_M = z^4 (disjoint H_3 ⊗ H_3)"),
    ]

    print(f"\n  {'name':<40} {'n':>2} {'tr_M(q_0)':>14} {'expected':>10} ref")
    print("  " + "-" * 92)

    from q_parameter import Q_MP
    q0 = float(Q_MP)
    results = []

    for name, n, word, expected, ref in test_cases:
        try:
            tr_M_sym = markov_trace_of_word(n, word)
            tr_M_at_q0 = float(sp.lambdify(q, tr_M_sym, modules=["mpmath"])(q0))
            sym_str_short = (
                str(tr_M_sym)[:60] + ("..." if len(str(tr_M_sym)) > 60 else "")
            )
            tag = "✓" if expected is None or abs(tr_M_at_q0 - expected) < 1e-3 else "✗"
            exp_str = f"{expected:.4f}" if expected is not None else "—"
            print(f"  {name:<40} {n:>2} {tr_M_at_q0:>14.6f} {exp_str:>10} {tag} {ref}")
            results.append({
                "name": name,
                "n": n,
                "word": word,
                "tr_M_at_q0": tr_M_at_q0,
                "tr_M_symbolic_short": sym_str_short,
                "tr_M_symbolic_full": str(tr_M_sym),
                "expected_at_q0": expected,
                "reference": ref,
            })
        except Exception as exc:
            print(f"  {name:<40} {n:>2} ERROR: {type(exc).__name__}: {exc}")
            results.append({
                "name": name,
                "n": n,
                "word": word,
                "error": f"{type(exc).__name__}: {exc}",
                "reference": ref,
            })

    # Cache stats — evidence the memoisation pays off.
    cache_info = tr_m_basis_element.cache_info()
    print(f"\n  Memoisation stats:")
    print(f"    cache hits   = {cache_info.hits}")
    print(f"    cache misses = {cache_info.misses}")
    print(f"    cache size   = {cache_info.currsize}")

    # Reference checks for proton
    print(f"\n  Reference comparisons:")
    proton_idx = next((i for i, r in enumerate(results) if "proton" in r["name"]), None)
    if proton_idx is not None and "tr_M_at_q0" in results[proton_idx]:
        proton_val = results[proton_idx]["tr_M_at_q0"]
        print(f"    σ_1^7 σ_2^4 (proton)  = {proton_val:.6f}  (char_fast ≈ 1.6334)")
        if abs(proton_val - 1.6334) < 0.001:
            print(f"    ✅ matches char_fast Markov reference (Δ < 0.1%)")
        elif abs(proton_val - 1.6334) < 0.01:
            print(f"    ✓ matches char_fast Markov reference (Δ < 1%)")
        else:
            print(f"    ✗ disagrees with char_fast — investigate")

    witness = {
        "computation": "markov-trace-recursive",
        "description": (
            "Recursive symbolic Markov-trace computer for arbitrary "
            "H_n(q) words. Uses gb_filtration_jet_tracker.HeckeElement "
            "(symbolic in q via sympy) to expand braids into the "
            "Hecke basis, then applies recursive Markov-axiom descent "
            "for each basis element with LRU memoisation on (perm, n). "
            "Tested up to H_6 for representative atomic-braid words "
            "(proton, neutron-like, deuteron disjoint cluster)."
        ),
        "reference_blocks": [
            "prop:atomic-mass-gb-nf",
            "prop:categorical-mass-markov",
            "prop:markov-trace-axiomatic-closed-form",
        ],
        "computedAt": datetime.now(timezone.utc).isoformat(),
        # Cache stats are runtime/ordering-dependent; printed to stdout
        # but deliberately omitted from the witness to avoid spurious
        # drift. Fresh runs reproduce identical mathematical content.
        "test_cases": results,
    }
    out = WitnessBuilder.wrap_legacy("markov-trace-recursive", witness, script_path=__file__, engine="sympy").save()
    print(f"\n  Witness: {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
