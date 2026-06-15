#!/usr/bin/env python3
"""
canonical_braid_crossings.py — bridge `atom_braid_word_3A` →
`(gen_idx, ctype)` format for `chi_lambda_symbolic` consumers.

Generalises the `deuteron_canonical_crossings` helper from PR #564's
`rho_k_h3a_refinement.py` to arbitrary `(Z, N)`.  Replaces all
calls to the **legacy** `hecke_character_symbolic.atomic_braid_to_crossings`
(which uses a non-canonical disjoint-product convention; per the
P3' canonical word fix on PR #564 commit c068550c, the canonical
convention is `mass_at_3A_proper.atom_braid_word_3A` with the
operator-valued interface `I = σ_{n_1} − h/2 · 1`).

The conversion classifies each `(c, d, gen_idx)` triple by `d`:

    d = 0        →  ctype = "sigma"     (positive crossing σ_g)
    d = −h       →  ctype = "sigma_inv" (negative crossing σ_g⁻¹;
                                         from σ² = h·σ + 1 ⇒ σ⁻¹ = σ − h)
    d = −h/2     →  ctype = "averaged"  (interface σ_g − h/2 · 1)

All three are the canonical Hecke-algebra building blocks consumed
by `hoefsmit_symbolic.chi_lambda_symbolic` and
`hecke_character_symbolic.q_character_on_braid_word`.

References:
- PR #546 (`hoefsmit_symbolic.py`) — closed-form symbolic χ^λ
- PR #564 commit c068550c — canonical-word fix on rho_k_h3a_refinement.py
- prop:hecke-branching-trace-decomposition (operator-valued interface)
- prop:q-hecke-seminormal-character-closure (this PR's closure)

@module folio-assistant/computations/canonical_braid_crossings
"""

from __future__ import annotations

import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))


def atom_canonical_crossings(
    Z: int, N: int,
    *,
    include_inter: bool = True,
    m_pp: int = 1, m_pn: int = 1, m_nn: int = 1,
) -> list[tuple[int, str]]:
    """Canonical (gen_idx, ctype) crossings for atomic braid β(Z, N).

    Source of truth: `mass_at_3A_proper.atom_braid_word_3A(Z, N)`.

    Returns a list of `(gen_idx, ctype)` pairs consumable by
    `hoefsmit_symbolic.chi_lambda_symbolic` and
    `hecke_character_symbolic.q_character_on_braid_word`.

    Replaces the legacy `hecke_character_symbolic.atomic_braid_to_crossings`,
    which used a disjoint-product convention not matching the
    canonical Markov-axiom reducer.
    """
    from mass_at_3A_proper import atom_braid_word_3A
    from hecke_core import h as h_val  # numeric h = q_0 − q_0⁻¹

    triples = atom_braid_word_3A(
        Z, N,
        m_pp=m_pp, m_pn=m_pn, m_nn=m_nn,
        include_inter=include_inter,
    )
    out: list[tuple[int, str]] = []
    for (c, d, g) in triples:
        # c is always 1 in this convention; classify by d.
        if abs(c - 1.0) > 1e-12:
            raise ValueError(
                f"Unexpected coefficient c={c} in canonical word "
                f"(expected c=1)"
            )
        if abs(d) < 1e-12:
            ctype = "sigma"
        elif abs(d - (-h_val)) < 1e-9:
            ctype = "sigma_inv"
        elif abs(d - (-h_val / 2)) < 1e-9:
            ctype = "averaged"
        else:
            raise ValueError(
                f"Unrecognised crossing (c, d) = ({c}, {d}) at gen "
                f"{g} in atom_braid_word_3A({Z}, {N}) — expected "
                f"d ∈ {{0, -h, -h/2}} where h = q_0 - q_0^{{-1}} "
                f"≈ {h_val:.6f}"
            )
        out.append((int(g), ctype))
    return out


__all__ = ["atom_canonical_crossings"]
