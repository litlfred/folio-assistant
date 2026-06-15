"""Molecular binding via Wedderburn-Artin channel decomposition.

**M2 inversion (2b Phase B)**: this module owns the canonical
implementations of the molecular binding primitives (`valence_Z`,
`_vertex_channels`, `molecular_binding_nf`, `molecular_binding_frobenius`),
which previously lived as M1 re-export bridges in `hecke_core.py`.

Symbols owned by this module:
  NOBLE_GAS_Z, valence_Z, _vertex_channels,
  molecular_binding_nf, molecular_binding_frobenius

Atom-builder dependencies (`atom_gen_chains`, `build_atom_nf`,
`check_frobenius`) are still owned by `hecke_core.py` and imported
here. A follow-up PR will invert those into `pyhecke.atom`; this
module will pick them up from the new location automatically since
the back-compat re-export in hecke_core stays in place.
"""

from __future__ import annotations

import math
import numpy as np

# Substrate constants + Gram primitives — pyhecke owns these (gram
# already M2-inverted earlier).
from pyhecke.gram import (  # type: ignore[import-not-found]
    h, q0, qi, z,
    W_SYM, W_STD, W_ALT,
    INV_TREFOIL_G0, INV_TREFOIL_G1,
    G, hm,
)

# E_MOL + atom-builder symbols (`atom_gen_chains`, `build_atom_nf`,
# `check_frobenius`) still live in hecke_core until their M2
# inversions land. They're imported LAZILY inside each function so
# `import pyhecke.molecular` doesn't trigger a `hecke_core` load
# (which would circle back into this module's still-being-defined
# namespace via the back-compat re-export block at the bottom of
# hecke_core.py).
#
# When the atom-builder M2 inversion lands and E_MOL moves to a
# pyhecke-owned module, these can become module-top imports.
from . import _legacy  # noqa: F401 — sys.path bridge


NOBLE_GAS_Z = [2, 10, 18, 36, 54, 86]


def valence_Z(Z):
    """Number of valence electrons (Z minus largest noble gas core).

    Noble gas cores have saturated Frobenius channels (Gx >> 0,
    LP dual shadow price = 0). Only valence electrons participate
    in molecular binding.
    """
    core = 0
    for z_ng in NOBLE_GAS_Z:
        if z_ng < Z:
            core = z_ng
    return Z - core


def _vertex_channels(chain):
    """Return (λ_sym, V_std, λ_alt) for a crossing chain.

    Evaluates each Wedderburn-Artin irrep channel separately:
      symmetric: ∏(c·q + d)      (1-dim, eigenvalue q per positive crossing)
      standard:  z·M₀₀ + M₁₀    (2-dim, transfer matrix product)
      alternating: ∏(-c·q⁻¹ + d) (1-dim, eigenvalue -q⁻¹ per positive crossing)
    """
    a, b = 0.0, 1.0
    sp, ap = 1.0, 1.0
    for c, d in chain:
        a, b = a * c * h + a * d + b * c, a * c + b * d
        sp *= c * q0 + d
        ap *= -c * qi + d
    V_std = z * a + b
    return sp, V_std, ap


def molecular_binding_nf(Z_A, N_A, Z_B, N_B, n_inv_trefoils=1):
    """Molecular binding via full Wedderburn-Artin decomposition.

    Evaluates each irrep's Skein polynomial separately, then weights:
      Φ_λ = Σᵢ |Δln|P_λ,i||    (per-irrep, per-generator binding)
      E = (W_sym·Φ_sym + W_std·Φ_std + W_alt·Φ_alt) × E_MOL

    This is the correct representation-theoretic approach: the Hecke
    algebra decomposes as a direct sum H₃(q) ≅ V_sym ⊕ V_std² ⊕ V_alt,
    and the binding acts independently on each block. The Wedderburn
    weights w_λ = dim_q(λ)²/[3]_q! are the LP shadow prices from
    the Frobenius positivity constraint (PR #360).

    For H-H: 4.55 eV (exp 4.478, 1.7% error).
    Bond ratios correct: double = 2×single, triple = 3×single.

    Returns (E_eV, binding_phi, phi_ub, phi_bond).
    """
    # Lazy hecke_core imports (see module docstring for rationale).
    from hecke_core import atom_gen_chains, E_MOL  # type: ignore[import-not-found]

    g0A, g1A = atom_gen_chains(Z_A, N_A)
    g0B, g1B = atom_gen_chains(Z_B, N_B)

    bond_g0 = INV_TREFOIL_G0 * n_inv_trefoils
    bond_g1 = INV_TREFOIL_G1 * n_inv_trefoils

    total_bind = 0.0
    phi_ub = 0.0
    phi_bond = 0.0

    for gA, gB, bg in [(g0A, g0B, bond_g0), (g1A, g1B, bond_g1)]:
        s_ub, v_ub, a_ub = _vertex_channels(gA + gB)
        s_bd, v_bd, a_bd = _vertex_channels(gA + bg + gB)

        # Per-irrep absolute binding
        bind_s = abs(math.log(abs(s_ub)) - math.log(abs(s_bd))) if abs(s_ub * s_bd) > 1e-300 else 0
        bind_v = abs(math.log(abs(v_ub)) - math.log(abs(v_bd))) if abs(v_ub * v_bd) > 1e-300 else 0
        bind_a = abs(math.log(abs(a_ub)) - math.log(abs(a_bd))) if abs(a_ub * a_bd) > 1e-300 else 0

        total_bind += W_SYM * bind_s + W_STD * bind_v + W_ALT * bind_a

        # Track phi for diagnostics
        V_ub = W_SYM * s_ub + W_STD * v_ub + W_ALT * a_ub
        V_bd = W_SYM * s_bd + W_STD * v_bd + W_ALT * a_bd
        if abs(V_ub) > 1e-300:
            phi_ub += math.log(abs(V_ub))
        if abs(V_bd) > 1e-300:
            phi_bond += math.log(abs(V_bd))

    E_eV = total_bind * E_MOL

    return E_eV, total_bind, phi_ub, phi_bond


def molecular_binding_frobenius(Z_A, N_A, Z_B, N_B, n_inv_trefoils=1):
    """Molecular binding from the Frobenius bilinear form.

    E_bond = ½ |x_A^T · G · Δ · x_B| × E_MOL

    where Δ = (T⁻¹)^n - I is the bond operator perturbation,
    and the ½ comes from Δ being symmetric (the bilinear form
    counts each bond from both A and B perspectives).

    For H-H: E = 4.295 eV (exp 4.478, 4.1% error).

    This is mathematically equivalent to the vertex volume approach
    for the standard representation channel. For atoms where the
    full NF is Frobenius-unstable (A > 3 generally), this falls
    back to molecular_binding_nf which uses per-generator vertex
    volumes (the standard representation, avoiding the indefinite
    Gram matrix).

    Returns (E_eV, raw_pairing).
    """
    # Lazy hecke_core imports (see module docstring for rationale).
    from hecke_core import build_atom_nf, check_frobenius, E_MOL  # type: ignore[import-not-found]

    nf_A = build_atom_nf(Z_A, N_A)
    nf_B = build_atom_nf(Z_B, N_B)

    stable_A, _, _ = check_frobenius(nf_A)
    stable_B, _, _ = check_frobenius(nf_B)

    if not (stable_A and stable_B):
        E, bind, _, _ = molecular_binding_nf(Z_A, N_A, Z_B, N_B, n_inv_trefoils)
        return E, bind

    M_Tinv = np.zeros((6, 6))
    for j in range(6):
        ej = [0.0] * 6
        ej[j] = 1.0
        result = list(ej)
        for _ in range(n_inv_trefoils):
            result = hm(result, 1, -h, 0)
            result = hm(result, 1, -h, 1)
            result = hm(result, 1, -h, 0)
        M_Tinv[:, j] = result
    Delta = M_Tinv - np.eye(6)

    pairing = float(np.array(nf_A) @ G @ Delta @ np.array(nf_B))
    E_eV = abs(pairing) * E_MOL / 2  # ½ from symmetric Δ

    return E_eV, pairing / 2


__all__ = [
    "NOBLE_GAS_Z",
    "valence_Z",
    "_vertex_channels",
    "molecular_binding_nf",
    "molecular_binding_frobenius",
]
