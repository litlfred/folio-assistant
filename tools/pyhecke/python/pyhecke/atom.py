"""Atomic braid NF + per-generator volume primitives.

**M2 inversion (2b Phase B, stacked on #1118 + #1121)**: this module
owns the canonical implementations of the atom-builder cluster
(11 functions + 6 module-level constants), which previously lived in
`hecke_core.py`.

Symbols owned by this module:
  _ID_NF, _PROTON_G0, _PROTON_G1, _NEUTRON_G0, _NEUTRON_G1,
  PROTON_NF, NEUTRON_NF,
  build_atom_nf_exact, nf_channel_exact, check_frobenius,
  build_atom_nf, vertex_volume, nucleon_gen_chains, atom_gen_chains,
  atom_V_full, _chain_V_full, atom_per_generator_volumes,
  build_nucleon_nf.

This is the heart of the canonical mass-pipeline surface. After this
PR lands, pyhecke owns the full Wedderburn + atom-builder + molecular
canonical surface — only the α-EM / E_MOL / FIG8 constants block
remains in hecke_core (a separate M2 PR will move that into
pyhecke.constants).

`E_MOL`, `alpha_em`, `FIG8_*`, `ALPHA_*`, `V_HAT_ELECTRON` constants
are still owned by hecke_core; the relevant functions here import
them lazily inside function bodies to avoid the circular-import
hazard (see molecular.py for the pattern).
"""

from __future__ import annotations

import math
from fractions import Fraction
import numpy as np

# Substrate constants + Gram / NF primitives — pyhecke owns these
# (M2b inversion landed earlier; pyhecke.gram is the canonical source).
from pyhecke.gram import (  # type: ignore[import-not-found]
    h, q0, qi, z,
    W_SYM, W_STD, W_ALT,
    NF_BASIS, NF_NAMES,
    hm, hm_exact, nf_tr, nf_net,
    G,
    _H_FRAC, _Z_FRAC, _SYM_EIG_FRAC, _ALT_EIG_FRAC,
    _Q_FRAC, _QI_FRAC,
)
# Wedderburn primitives — pyhecke owns these (PR #1118).
from pyhecke.wedderburn import (  # type: ignore[import-not-found]
    partitions_of, q_dimension, wedderburn_weight, q_factorial,
)

# Legacy bridge — keeps the sys.path bootstrap alive in case anything
# we lazy-import below requires it.
from . import _legacy  # noqa: F401

# Constants still owned by hecke_core (`alpha_em`, `E_MOL`,
# `E_HARTREE_EV`, `TWO_Q`, `KAPPA`, `M_E_MEV`, `FIG8_*`, `ALPHA_*`,
# `V_HAT_ELECTRON`) are imported LAZILY inside the functions that
# need them — module-top import would trigger hecke_core load which
# would circle back into this module's still-being-defined namespace
# via the back-compat re-export block.





# NF basis, trace weights, bond operators, hm, hm_exact, nf_tr, nf_net,
# _hm_dict, _reduce_nf, _build_gram, G, G_INV, and the exact-rational
# (_*_FRAC) constants have been moved to pyhecke.gram (M2b inversion).
# They are re-imported at the top of this file so every existing name
# remains accessible at module scope for downstream callers.

# Identity NF: the trivial braid [1, 0, 0, 0, 0, 0]
_ID_NF = np.array([1.0, 0, 0, 0, 0, 0])



def build_atom_nf_exact(Z, N):
    """Build atom NF using EXACT Fraction arithmetic.

    IDENTICAL algorithm to build_atom_nf but with Fraction arithmetic.
    Crossing order: per-nucleon (B₃ interleaved + quarks + inter-nucleon
    with all previous), then electrons. Matches build_atom_nf exactly.

    Reference: prop:atomic-braid-mass
    """
    A = Z + N
    if A == 0:
        return [Fraction(1), Fraction(0), Fraction(0),
                Fraction(0), Fraction(0), Fraction(0)]

    F0 = Fraction(0)
    F1 = Fraction(1)
    Fh = _H_FRAC
    Fh2 = Fh / 2

    # Ground-state ordering (same as build_atom_nf)
    ordering = []
    pc, nc = 0, 0
    for k in range(A):
        if (k % 2 == 0 and pc < Z) or nc >= N:
            ordering.append('p'); pc += 1
        else:
            ordering.append('n'); nc += 1

    nf = [Fraction(0)] * 6
    nf[0] = Fraction(1)

    for k in range(A):
        if ordering[k] == 'p':
            for _ in range(3):
                nf = hm_exact(nf, F1, F0, 0)
                nf = hm_exact(nf, F1, -Fh, 1)
            # Quark: (0,1)=uu→σ₀, (0,2)=ud→mixed, (1,2)=ud→mixed
            nf = hm_exact(nf, F1, F0, 0)      # uu
            nf = hm_exact(nf, F1, -Fh2, 0)    # ud mixed
            nf = hm_exact(nf, F1, -Fh2, 1)    # ud mixed
            # Gluon: 2 σ₀
            nf = hm_exact(nf, F1, F0, 0)
            nf = hm_exact(nf, F1, F0, 0)
        else:
            for _ in range(3):
                nf = hm_exact(nf, F1, F0, 0)
                nf = hm_exact(nf, F1, -Fh, 1)
            # Quark: (0,1)=ud→mixed, (0,2)=ud→mixed, (1,2)=dd→σ⁻¹
            nf = hm_exact(nf, F1, -Fh2, 0)
            nf = hm_exact(nf, F1, -Fh2, 0)
            nf = hm_exact(nf, F1, -Fh, 1)
            # Gluon: 2 σ₀
            nf = hm_exact(nf, F1, F0, 0)
            nf = hm_exact(nf, F1, F0, 0)

        # Inter-nucleon with all PREVIOUS nucleons (on gen 0)
        for prev in range(k):
            ti, tj = ordering[prev], ordering[k]
            if ti == 'p' and tj == 'p':
                nf = hm_exact(nf, F1, F0, 0)
            elif ti == 'n' and tj == 'n':
                nf = hm_exact(nf, F1, -Fh, 0)
            else:
                nf = hm_exact(nf, F1, -Fh2, 0)

    # Electrons on gen 1
    for _ in range(Z):
        nf = hm_exact(nf, F1, -Fh, 1)

    return nf



def nf_channel_exact(nf_frac):
    """Exact per-channel characters from Fraction NF.

    Returns (χ_sym, χ_std, χ_alt, tr_M) as Fractions.
    """
    chi_sym = sum(c * e for c, e in zip(nf_frac, _SYM_EIG_FRAC))
    chi_alt = sum(c * e for c, e in zip(nf_frac, _ALT_EIG_FRAC))
    tr_M = sum(c * e for c, e in zip(nf_frac, _TR_M_FRAC))

    # Wedderburn weights (exact)
    q2 = _Q_FRAC ** 2
    D = q2**2 + 4*q2 + 1
    w_sym = q2 / D
    w_std = (q2 + 1)**2 / D
    w_alt = q2 / D

    chi_std = (tr_M - w_sym * chi_sym - w_alt * chi_alt) / w_std
    return chi_sym, chi_std, chi_alt, tr_M



def check_frobenius(nf):
    """Check Frobenius positivity G·x ≥ 0. Returns (stable, Gx, violations)."""
    x = np.array(nf)
    Gx = G @ x
    violations = [(NF_NAMES[i], Gx[i]) for i in range(6) if Gx[i] < -1e-10]
    return len(violations) == 0, Gx, violations



# ══════════════════════════════════════════════════════════════
# Atom construction
# ══════════════════════════════════════════════════════════════

def build_atom_nf(Z, N):
    """Build atom NF via Hecke multiplication.

    Construction:
      1. Build each nucleon via build_nucleon_nf (B₃ + quark crossings)
      2. Compose nucleons in ground-state interleaved order
      3. Apply inter-nucleon crossings between each pair (i,j):
           pp: σ₀           (c=1, d=0)    — EM repulsion
           nn: σ₀⁻¹         (c=1, d=-h)   — nuclear attraction
           pn: ½(σ₀+σ₀⁻¹)  (c=1, d=-h/2) — symmetric nuclear
      4. Apply pe crossings for electrons (σ₁⁻¹ per electron)

    No separate gluon dressing — B₃ IS the gluon structure.
    Generator 0 for inter-nucleon crossings (strong force channel).
    Generator 1 for pe crossings (EM channel).
    """
    A = Z + N
    if A == 0:
        return [1.0, 0, 0, 0, 0, 0]

    # Build ground-state ordering: interleaved protons and neutrons
    ordering = []  # 'p' or 'n'
    pc, nc = 0, 0
    for k in range(A):
        if (k % 2 == 0 and pc < Z) or nc >= N:
            ordering.append('p')
            pc += 1
        else:
            ordering.append('n')
            nc += 1

    # Start with identity
    nf = [1.0, 0, 0, 0, 0, 0]

    # Compose nucleon NFs sequentially
    for k in range(A):
        if ordering[k] == 'p':
            # B₃ confinement (3 interleaved σ₀, σ₁⁻¹)
            for _ in range(3):
                nf = hm(nf, 1, 0, 0)       # σ₀
                nf = hm(nf, 1, -h, 1)       # σ₁⁻¹
            # Quark crossings: (0,1)=uu→σ₀, (0,2)=ud→mixed, (1,2)=ud→mixed
            nf = hm(nf, 1, 0, 0)            # pair(0,1) uu → σ₀
            nf = hm(nf, 1, -h/2, 0)         # pair(0,2) ud → σ₀ mixed
            nf = hm(nf, 1, -h/2, 1)         # pair(1,2) ud → σ₁ mixed
            # Gluon self-coupling: 2 σ₀ (ILP-derived, prop:mass-endomorphism-tower)
            nf = hm(nf, 1, 0, 0)            # gluon 1
            nf = hm(nf, 1, 0, 0)            # gluon 2
        else:
            # B₃ confinement
            for _ in range(3):
                nf = hm(nf, 1, 0, 0)       # σ₀
                nf = hm(nf, 1, -h, 1)       # σ₁⁻¹
            # Quark crossings: (0,1)=ud→mixed, (0,2)=ud→mixed, (1,2)=dd→σ⁻¹
            nf = hm(nf, 1, -h/2, 0)         # pair(0,1) ud → σ₀ mixed
            nf = hm(nf, 1, -h/2, 0)         # pair(0,2) ud → σ₀ mixed
            nf = hm(nf, 1, -h, 1)           # pair(1,2) dd → σ₁⁻¹
            # Gluon self-coupling: 2 σ₀ (same as proton)
            nf = hm(nf, 1, 0, 0)            # gluon 1
            nf = hm(nf, 1, 0, 0)            # gluon 2

        # Inter-nucleon crossing with all PREVIOUS nucleons
        for prev in range(k):
            ti, tj = ordering[prev], ordering[k]
            if ti == 'p' and tj == 'p':
                nf = hm(nf, 1, 0, 0)        # pp: σ₀
            elif ti == 'n' and tj == 'n':
                nf = hm(nf, 1, -h, 0)       # nn: σ₀⁻¹
            else:
                nf = hm(nf, 1, -h/2, 0)     # pn/np: mixed

    # Electrons: pe crossing (EM channel, gen=1)
    for _ in range(Z):
        nf = hm(nf, 1, -h, 1)               # σ₁⁻¹

    return nf



# ══════════════════════════════════════════════════════════════
# Per-generator vertex volumes (3-channel Wedderburn-Artin)
# ══════════════════════════════════════════════════════════════

def vertex_volume(chain):
    """3-channel Wedderburn-Artin vertex volume from crossing chain.

    Each crossing (c, d) acts on the three irrep channels of H₃(q):
      symmetric:  eigenvalue cq + d
      standard:   traced volume z·a + b (from 2×2 transfer matrix)
      alternating: eigenvalue -cq⁻¹ + d

    Full volume = W_sym × λ_sym + W_std × V_std + W_alt × λ_alt.
    """
    a, b = 0.0, 1.0
    sp, ap = 1.0, 1.0
    for c, d in chain:
        a, b = a*c*h + a*d + b*c, a*c + b*d
        sp *= c*q0 + d
        ap *= -c*qi + d
    V_std = z * a + b
    return W_SYM * sp + W_STD * V_std + W_ALT * ap



def nucleon_gen_chains(quarks):
    """Per-generator crossing chains for one nucleon.

    Derives chains from the quark content, matching build_nucleon_nf:
      B₃ = (σ₀σ₁⁻¹)³ contributes to both gen 0 and gen 1
      Quark pairs: (0,1)→gen=0, (0,2)→gen=0, (1,2)→gen=1

    Returns (g0_chain, g1_chain) as lists of (c, d) tuples.
    """
    # B₃ confinement: (σ₀·σ₁⁻¹)³
    # gen 0 gets 3× σ₀ = (1, 0)
    # gen 1 gets 3× σ₁⁻¹ = (1, -h)
    g0 = [(1, 0)] * 3
    g1 = [(1, -h)] * 3

    # Quark pairwise crossings
    pairs = [(0, 1, 0), (0, 2, 0), (1, 2, 1)]  # (qi, qj, gen)
    for i, j, gen in pairs:
        qi_f, qj_f = quarks[i], quarks[j]
        if qi_f == qj_f == 'u':
            cd = (1, 0)       # σ
        elif qi_f == qj_f == 'd':
            cd = (1, -h)      # σ⁻¹
        else:
            cd = (1, -h/2)    # mixed
        if gen == 0:
            g0.append(cd)
        else:
            g1.append(cd)

    # Gluon self-coupling: 2 σ₀ per nucleon (ILP-derived)
    g0.append((1, 0))
    g0.append((1, 0))

    return g0, g1



# Precomputed per-generator chains for proton and neutron
_PROTON_G0, _PROTON_G1 = nucleon_gen_chains(['u', 'u', 'd'])

_NEUTRON_G0, _NEUTRON_G1 = nucleon_gen_chains(['u', 'd', 'd'])



def atom_gen_chains(Z, N):
    """Per-generator crossing chains for atom (Z, N).

    Builds the complete atomic braid crossing chains for generators
    σ₀ and σ₁, including:
      1. Intra-nucleon crossings (B₃ + quark pairs) — from nucleon_gen_chains
      2. Inter-nucleon crossings between ALL nucleon pairs — on gen 0
      3. Electron crossings (pe) — on gen 1

    Nucleon ordering: pp...nn (protons first, then neutrons).

    Inter-nucleon crossings (strong force, gen 0):
      pp: (1, 0)     — positive crossing
      nn: (1, -h)    — inverse crossing
      pn: (1, -h/2)  — mixed crossing

    Returns (g0_chain, g1_chain).
    """
    g0, g1 = [], []

    # Build nucleon ordering (interleaved, matching build_atom_nf)
    A = Z + N
    ordering = []
    pc, nc = 0, 0
    for k in range(A):
        if (k % 2 == 0 and pc < Z) or nc >= N:
            ordering.append('p')
            pc += 1
        else:
            ordering.append('n')
            nc += 1

    # 1. Nucleon crossings + inter-nucleon (matching build_atom_nf order)
    # Each nucleon's intra-nucleon crossings, then inter-nucleon with ALL previous
    for k in range(A):
        nuc_type = ordering[k]
        if nuc_type == 'p':
            g0.extend(_PROTON_G0)
            g1.extend(_PROTON_G1)
        else:
            g0.extend(_NEUTRON_G0)
            g1.extend(_NEUTRON_G1)

        # Inter-nucleon crossings with all previous nucleons (gen 0)
        for prev in range(k):
            ti, tj = ordering[prev], ordering[k]
            if ti == 'p' and tj == 'p':
                g0.append((1, 0))       # pp: σ₀
            elif ti == 'n' and tj == 'n':
                g0.append((1, -h))      # nn: σ₀⁻¹
            else:
                g0.append((1, -h / 2))  # pn: mixed

    # 2. Electron crossings: pe = σ⁻¹ on gen 1
    for _ in range(Z):
        g1.append((1, -h))

    return g0, g1



def atom_V_full(Z, N):
    """Quark-level per-generator V̂_i^full for the mass-tower formula.

    Uses atom_gen_chains to get the FULL braid (B₃ × quarks +
    inter-nucleon + electrons), then computes the Wedderburn-weighted
    traced volume per generator:

      V̂_i^full = w_sym·λ_sym + w_std·V_std + w_alt·λ_alt

    For H₃(q), i ∈ {0, 1} (two generators).

    Returns (V0_full, V1_full) as floats.

    Reference: prop:mass-endomorphism-tower, thm:wedderburn-mass-formula
    """
    g0_chain, g1_chain = atom_gen_chains(Z, N)
    return _chain_V_full(g0_chain), _chain_V_full(g1_chain)



def _chain_V_full(chain):
    """Wedderburn-weighted traced volume from a crossing chain.

    chain: list of (c, d) tuples.
    Returns V̂^full = w_sym·λ_sym + w_std·V_std + w_alt·λ_alt.
    """
    lam_sym = 1.0
    for c, d in chain:
        lam_sym *= c * q0 + d

    lam_alt = 1.0
    for c, d in chain:
        lam_alt *= -c * qi + d

    M00, M01, M10, M11 = 1.0, 0.0, 0.0, 1.0
    for c, d in chain:
        t00 = c * h + d; t01 = c; t10 = c; t11 = d
        n00 = M00*t00 + M01*t10; n01 = M00*t01 + M01*t11
        n10 = M10*t00 + M11*t10; n11 = M10*t01 + M11*t11
        M00, M01, M10, M11 = n00, n01, n10, n11
    V_std = z * M10 + M11  # second row: [a,b] = [0,1] × M → (M₁₀, M₁₁)

    return W_SYM * lam_sym + W_STD * V_std + W_ALT * lam_alt



def atom_per_generator_volumes(Z, N, include_inter=True, crossings_per_pair=1,
                                m_pp=None, m_pn=None, m_nn=None):
    """Per-generator additive Wedderburn volumes V̂_i^full for the atom braid.

    ⚠️  KNOWN BUG (audit 2026-05-25, PR #1238):
    This function uses HARDCODED H_3 Wedderburn weights regardless of
    atom size A. For A > 1 (deuteron, ⁴He, ⁶Li, ...), the braid lives
    in H_{3A}(q), not H_3(q), and the H_3 weights are systematically
    wrong. See docs/audits/2026-05-25-h3-vs-h3a-legacy-bug-audit.md.

    The CANONICAL replacement is:
        folio-assistant/computations/mass_at_3A_proper.py
            per_generator_V_hat_3A(Z, N, weight_scheme="normalized_plancherel")
    which sums over all partitions of 3A with proper Wedderburn weights.

    Migration is NOT YET DONE for the 15+ callers (mass_formula_6term.py,
    tower_isotope_absolute.py, paper_six_term_isotope_sweep.py, ...).
    Per-call migration is required because the return shape differs:
        legacy:  [{"std": Vs, "sym": sp, "alt": ap, "full": Vf}, ...]
        proper:  [{"full": V̂_i, "gen_word": [...]}, ...]
    A separate dedicated PR is queued for the migration sweep.

    If m_pp, m_pn, m_nn are given (ILP solution), use them per pair type.
    Otherwise fall back to uniform crossings_per_pair.

    Returns a list of length n_strands - 1 = 3A - 1 (atom case) or
    n_strands - 1 = 2A (free case) of dicts:
        [{"std": Vs, "sym": sp, "alt": ap, "full": Vf}, ...]
    indexed by generator position i = 0, 1, ..., len-1.

    These are the V̂_i^full feeding the tower formula
    (prop:mass-endomorphism-tower):
        𝔪(W) = |Π V̂_i| + Σ Φ_q(|V̂_i|)
              + z² Σ_{|i-j|=1} Φ_q(|V̂_i V̂_j|).

    Implementation: replays _step_chain_generic for each nucleon, but
    instead of tracking a single accumulated YSN matrix, accumulates
    per-generator (a, b, sp, ap) — the additive Wedderburn channel
    state.  Mirrors mass_endomorphism.additive_wedderburn_volumes
    extended to A-nucleon atoms.

    Parameters
    ----------
    Z, N : int
        Proton and neutron counts.
    include_inter : bool
        If True: full atom braid with pp/nn/pn inter-nucleon crossings.
        If False: free disconnected-tensor baseline.

    Returns
    -------
    list of dict, one per generator.
    """
    A = Z + N
    if A < 1:
        return []

    # H_3 vs H_{3A} legacy bug warning (audit 2026-05-25, PR #1238).
    # For A > 1 the H_3 Wedderburn weights used below are systematically
    # wrong. Callers should migrate to mass_at_3A_proper.per_generator_V_hat_3A.
    if A > 1:
        import warnings
        warnings.warn(
            f"atom_per_generator_volumes uses H_3 Wedderburn weights for "
            f"A={A} atom (Z={Z}, N={N}); H_{{3A}}={3*A} weights are correct. "
            "See docs/audits/2026-05-25-h3-vs-h3a-legacy-bug-audit.md. "
            "Migrate to mass_at_3A_proper.per_generator_V_hat_3A.",
            DeprecationWarning,
            stacklevel=2,
        )

    # Nucleon ordering (Z protons then N neutrons) — matches
    # atom_character_raw convention.
    ordering = ['p'] * Z + ['n'] * N

    # n_gens for the joint braid
    if include_inter:
        n_strands = 3 * A
        n_gens_total = n_strands - 1  # 3A - 1
    else:
        # Free baseline: per-nucleon disjoint blocks of 2 generators each
        n_gens_total = 2 * A

    # Per-generator accumulators (a, b for std; sp for sym; ap for alt)
    a_arr  = [0.0] * n_gens_total
    b_arr  = [1.0] * n_gens_total
    sp_arr = [1.0] * n_gens_total
    ap_arr = [1.0] * n_gens_total

    # Build the atom braid by walking the nucleon chain.  For each
    # nucleon k, the intra-nucleon crossings live on local gens; for
    # the joint braid, these are mapped to global gens 3k, 3k+1.
    # Inter-nucleon crossings (when include_inter) live on gen 3k+2,
    # connecting nucleon k with nucleon k+1.
    for k, nuc in enumerate(ordering):
        intra    = _PROTON_G0 if nuc == 'p' else _NEUTRON_G0
        intra_g1 = _PROTON_G1 if nuc == 'p' else _NEUTRON_G1
        if include_inter:
            base_g0 = 3 * k       # global gen for first intra slot
            base_g1 = 3 * k + 1   # global gen for second intra slot
        else:
            base_g0 = 2 * k
            base_g1 = 2 * k + 1
        # Intra-nucleon, first generator slot
        for c, d in intra:
            i = base_g0
            a_new = a_arr[i] * c * h + a_arr[i] * d + b_arr[i] * c
            b_new = a_arr[i] * c + b_arr[i] * d
            a_arr[i] = a_new
            b_arr[i] = b_new
            sp_arr[i] *= c * q0 + d
            ap_arr[i] *= -c * qi + d
        # Intra-nucleon, second generator slot
        for c, d in intra_g1:
            i = base_g1
            a_new = a_arr[i] * c * h + a_arr[i] * d + b_arr[i] * c
            b_new = a_arr[i] * c + b_arr[i] * d
            a_arr[i] = a_new
            b_arr[i] = b_new
            sp_arr[i] *= c * q0 + d
            ap_arr[i] *= -c * qi + d
        # Inter-nucleon crossings (only when include_inter and k < A-1)
        # crossings_per_pair: number of repetitions of the basic pair
        # crossing.  For ILP-stable pairs, this should be derived from
        # Frobenius positivity (currently a parameter; see witness).
        if include_inter and k < A - 1:
            i = 3 * k + 2  # global gen for inter-nucleon between k and k+1
            next_nuc = ordering[k + 1]
            if nuc == 'p' and next_nuc == 'p':
                base_cross = (1.0, 0.0)      # pp: σ
                m_this = m_pp if m_pp is not None else crossings_per_pair
            elif nuc == 'n' and next_nuc == 'n':
                base_cross = (1.0, -h)       # nn: σ⁻¹
                m_this = m_nn if m_nn is not None else crossings_per_pair
            else:
                base_cross = (1.0, -h / 2)   # pn: ½(σ + σ⁻¹)
                m_this = m_pn if m_pn is not None else crossings_per_pair
            pair_cross = [base_cross] * m_this
            for c, d in pair_cross:
                a_new = a_arr[i] * c * h + a_arr[i] * d + b_arr[i] * c
                b_new = a_arr[i] * c + b_arr[i] * d
                a_arr[i] = a_new
                b_arr[i] = b_new
                sp_arr[i] *= c * q0 + d
                ap_arr[i] *= -c * qi + d

    # Build per-generator V̂_full from accumulators
    z_mark = 1.0 / (q0 ** 0.5 + qi ** 0.5)
    h_val = q0 - qi
    def q_int(n):
        return (q0 ** n - qi ** n) / h_val if abs(h_val) > 1e-15 else float(n)
    # Wedderburn weights (H_3 weights — same as mass_endomorphism.py)
    nf3 = q_int(2) * q_int(3) * q_int(1)  # [3]_q!  (with [1]_q = 1)
    # Use H_3 weights as in mass_endomorphism (1-dim sym, 2-dim std, 1-dim alt)
    # W_sym, W_std, W_alt computed from quantum dimensions
    qdim_sym = 1.0
    qdim_std = q_int(2)
    qdim_alt = 1.0
    nf3_val = q_int(1) * q_int(2) * q_int(3)
    w_sym = qdim_sym ** 2 / nf3_val
    w_std = qdim_std ** 2 / nf3_val
    w_alt = qdim_alt ** 2 / nf3_val
    wt = w_sym + w_std + w_alt
    w_sym /= wt
    w_std /= wt
    w_alt /= wt

    vols = []
    for i in range(n_gens_total):
        Vs = z_mark * a_arr[i] + b_arr[i]
        Vf = w_sym * sp_arr[i] + w_std * Vs + w_alt * ap_arr[i]
        vols.append({"std": Vs, "sym": sp_arr[i], "alt": ap_arr[i], "full": Vf})
    return vols



def build_nucleon_nf(quarks):
    """Build a single nucleon NF from quark content.

    quarks: list of 'u' or 'd' characters, e.g. ['u','u','d'] for proton.

    Construction: nucleon = B₃ · crossings(quarks)
    where B₃ = (σ₀σ₁⁻¹)³ is the gluon field (Borromean confinement),
    and crossings encode flavor:
      uu → σ_gen (c=1, d=0)
      dd → σ_gen⁻¹ (c=1, d=-h)
      ud → ½(σ_gen + σ_gen⁻¹) (c=1, d=-h/2)

    Generator assignment: pair (i,j) uses gen = i (the lower quark index).
    For 3 quarks: (0,1)→gen=0, (0,2)→gen=0, (1,2)→gen=1.

    No separate gluon dressing — B₃ IS the gluon structure.
    """
    nf = [1.0, 0, 0, 0, 0, 0]
    # B₃ confinement: (σ₀·σ₁⁻¹)³
    for _ in range(3):
        nf = hm(nf, 1, 0, 0)       # σ₀
        nf = hm(nf, 1, -h, 1)      # σ₁⁻¹
    # Quark pairwise crossings: (0,1), (0,2), (1,2)
    pairs = [(0, 1), (0, 2), (1, 2)]
    for i, j in pairs:
        qi, qj = quarks[i], quarks[j]
        gen = i  # generator = lower index
        if qi == qj == 'u':
            nf = hm(nf, 1, 0, gen)       # σ_gen
        elif qi == qj == 'd':
            nf = hm(nf, 1, -h, gen)      # σ_gen⁻¹
        else:  # mixed u-d
            nf = hm(nf, 1, -h/2, gen)    # ½(σ + σ⁻¹)
    return nf



# Precomputed nucleon NFs
PROTON_NF = build_nucleon_nf(['u', 'u', 'd'])

NEUTRON_NF = build_nucleon_nf(['u', 'd', 'd'])


__all__ = [
    "_ID_NF",
    "_PROTON_G0", "_PROTON_G1", "_NEUTRON_G0", "_NEUTRON_G1",
    "PROTON_NF", "NEUTRON_NF",
    "build_atom_nf_exact", "nf_channel_exact", "check_frobenius",
    "build_atom_nf", "vertex_volume", "nucleon_gen_chains",
    "atom_gen_chains", "atom_V_full", "_chain_V_full",
    "atom_per_generator_volumes", "build_nucleon_nf",
]
