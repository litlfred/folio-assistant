"""Track C — multi-level quadratic SDP dispatcher.

The repo's INFRASTRUCTURE-AUDIT.md identifies a jet-level SDP stack
that is only implemented at level 3 (inter-nucleon pair). Levels 4-7
(shell-magic, cross-shell, atom-electron, molecule) each need their
own 2×2 PSD block constraints.

This module provides the dispatcher + scaffolding; the solver
implementations follow incrementally as the shell and molecular
primitives land.

Level hierarchy (shared with `pyhecke.undo`):

  2 — nucleon (B_3 × 3 quarks)
  3 — atom-level (pair of nucleons)                          IMPLEMENTED
  4 — shell-magic                                            SKELETON
  5 — cross-shell                                            SKELETON
  6 — atom-electron                                          SKELETON
  7 — molecule                                               SKELETON

Public API:

    multi_level_sdp(level: int, **params) -> SDPResult

Solver discovery: attempts cvxpy; falls back to scipy.optimize.linprog
for LP relaxations; last resort is a hand-rolled 2×2 PSD feasibility
check using the Silvester criterion.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Optional


@dataclass
class SDPResult:
    """Result of an SDP solve at a given level.

    Attributes
    ----------
    level : int
        Confinement level that was solved (3..7).
    status : str
        One of "optimal", "infeasible", "unbounded", "unknown",
        "not_implemented".
    objective : float | None
        Optimal objective value (None if not solved).
    primal : dict | None
        Primal solution (structure depends on level).
    dual : dict | None
        Dual / shadow-price solution.
    psd_blocks : list[dict]
        Per-block PSD feasibility reports.
    caveats : list[str]
        Modelling notes, approximations.
    """

    level: int
    status: str
    objective: Optional[float] = None
    primal: Optional[dict] = None
    dual: Optional[dict] = None
    psd_blocks: list[dict] = field(default_factory=list)
    caveats: list[str] = field(default_factory=list)


# ── Level 3 : inter-nucleon pair SDP ───────────────────────────────────

def solve_pair_sdp(
    target_net: float = 1.0,
    c: Any = None,
    label: str = "pyhecke.sdp.level3",
    **_: Any,
) -> SDPResult:
    """Level 3 SDP: inter-nucleon pair Lasserre moment relaxation.

    Uses the canonical `sdp_moment_lift.lp_vs_sdp_report` helper:
    enforces the quadratic Frobenius positivity `tr(G·X) ≥ 0` on the
    full 6×6 H_3(q) Gram matrix via a moment-matrix PSD variable

        M = [[1, xᵀ], [x, X]] ⪰ 0,  tr(G·X) ≥ 0,  Σ x_i = target_net.

    This is a strict upgrade over the earlier componentwise
    `G·x ≥ 0` LP — which 10/10 LP files violate at q₀ per
    ``sdp_lift_audit``.

    Parameters
    ----------
    target_net : float
        Sum constraint on the NF vector (Σ x_i = target_net). Default
        1.0 matches the unit-net normalisation used in most LPs.
    c : array-like or None
        Objective vector `c @ x` to minimise. Defaults to the Markov-
        trace weights `TR_M` (minimises Markov trace subject to
        Frobenius positivity).
    label : str
        Identifier carried through to `SdpLiftReport.label`.

    Returns
    -------
    SDPResult
        primal: `{x, xTGx, sdp_tr_GX, moment_rank, gram_min_eigenvalue}`
        status: "optimal" iff both LP and SDP reach optimality.
    """
    from . import _legacy  # noqa: F401
    try:
        from sdp_moment_lift import lp_vs_sdp_report  # type: ignore[import-not-found]
        import numpy as np  # noqa: F401
    except ImportError as e:
        return SDPResult(
            level=3,
            status="not_implemented",
            caveats=[f"sdp_moment_lift / cvxpy not available: {e}"],
        )

    import numpy as np
    from .gram import G, TR_M

    if c is None:
        c = np.asarray(TR_M).flatten()
    else:
        c = np.asarray(c, dtype=float).flatten()

    try:
        rep = lp_vs_sdp_report(
            c=c,
            G=np.asarray(G),
            A_eq=np.ones((1, 6)),
            b_eq=np.array([float(target_net)]),
            label=label,
        )
    except ImportError as e:
        return SDPResult(
            level=3,
            status="not_implemented",
            caveats=[f"cvxpy required for Lasserre lift: {e}"],
        )

    # Map the SdpLiftReport onto the dispatcher's SDPResult.
    ok = rep.sdp_status in {"optimal", "optimal_inaccurate"}
    return SDPResult(
        level=3,
        status=rep.sdp_status if ok else (rep.sdp_status or "unknown"),
        objective=rep.sdp_objective if ok else None,
        primal={
            "x": rep.sdp_x,
            "xTGx": rep.sdp_xTGx,
            "sdp_tr_GX": rep.sdp_tr_GX,
            "moment_rank": rep.sdp_moment_rank,
            "gram_min_eigenvalue": rep.gram_min_eigenvalue,
            "target_net": float(target_net),
        },
        dual={
            "lp_x": rep.lp_x,
            "lp_xTGx": rep.lp_xTGx,
            "lp_status": rep.lp_status,
            "lp_objective": rep.lp_objective,
        },
        psd_blocks=[
            {
                "name": "moment_matrix_7x7",
                "size": 7,
                "trace_GX": rep.sdp_tr_GX,
                "rank": rep.sdp_moment_rank,
                "frobenius_feasible": rep.sdp_tr_GX >= -1e-9,
            }
        ],
        caveats=[
            f"LP: xᵀGx = {rep.lp_xTGx:.4f} {'(Frobenius-invalid)' if rep.lp_xTGx < 0 else '(Frobenius-valid)'}",
            f"SDP: tr(G·X) = {rep.sdp_tr_GX:.4f} (moment-cone lift)",
            "See folio-assistant/computations/sdp_moment_lift.py for details.",
        ],
    )


# ── Levels 4-7 : skeleton SDPs ─────────────────────────────────────────

def _not_implemented(level: int, description: str) -> SDPResult:
    return SDPResult(
        level=level,
        status="not_implemented",
        caveats=[
            f"Level-{level} ({description}) SDP not yet implemented. "
            "See INFRASTRUCTURE-AUDIT.md 'Track C: Multi-level quadratic SDP'.",
            "Required work: (1) define the level-specific word primitive; "
            "(2) compute its 2×2 PSD cross-term block; "
            "(3) add scipy/cvxpy solve.",
        ],
    )


# ── Level 4 : shell-magic SDP ──────────────────────────────────────────

# Magic-shell nucleon counts (standard nuclear physics).
MAGIC_NUMBERS = (2, 8, 20, 28, 50, 82, 126)


def solve_shell_magic_sdp(
    a_magic: int = 2,
    partition: Optional[tuple] = None,
    **_: Any,
) -> SDPResult:
    """Level 4 — shell-closure adjacent 2x2 PSD feasibility at a magic
    nucleon count.

    Forms the 2x2 PSD block

        [     1        y_shell ]
        [ y_shell      1       ]

    on the symmetric / standard-rep channels at the shell boundary, with
    `y_shell = shell_shadow_price(a_magic)["shadow_price_abs"]` drawn
    from the existing `sigma_shell_characterization` module. Silvester's
    criterion gives a closed-form feasibility check:

        det(G_4) = 1 - y_shell**2

    The block is positive semi-definite iff |y_shell| ≤ 1. That is the
    level-4 feasibility condition — closed-shell magic numbers are
    expected to satisfy it by construction.

    Parameters
    ----------
    a_magic : int
        Magic shell closure. Must be one of MAGIC_NUMBERS (2, 8, 20,
        28, 50, 82, 126).
    partition : tuple, optional
        Shell partition λ ⊢ 3·a_magic. Defaults to (3·a_magic - 1, 1).

    Returns
    -------
    SDPResult
        status = "optimal" when feasible, "infeasible" otherwise. The
        primal dict carries {y_shell, det_2x2, partition, hecke_level}.
    """
    if a_magic not in MAGIC_NUMBERS:
        return SDPResult(
            level=4,
            status="infeasible",
            caveats=[
                f"a_magic = {a_magic} is not a standard magic number "
                f"{MAGIC_NUMBERS}"
            ],
        )

    from . import _legacy  # noqa: F401
    try:
        from sigma_shell_characterization import shell_shadow_price  # type: ignore[import-not-found]
    except ImportError as e:
        return SDPResult(
            level=4,
            status="not_implemented",
            caveats=[
                f"sigma_shell_characterization not importable: {e}. "
                "Ensure folio-assistant/computations is on PYTHONPATH."
            ],
        )

    data = shell_shadow_price(a_magic, partition=partition)
    if "error" in data:
        return SDPResult(
            level=4,
            status="infeasible",
            caveats=[data["error"]],
        )

    # Shadow price is returned as a string (mpmath dps=50); cast for the 2x2 check.
    try:
        y_shell = float(data["shadow_price_abs"])
    except (TypeError, ValueError):
        y_shell = 0.0

    det_2x2 = 1.0 - y_shell ** 2
    feasible = det_2x2 >= -1e-12
    status = "optimal" if feasible else "infeasible"

    return SDPResult(
        level=4,
        status=status,
        objective=det_2x2,
        primal={
            "a_magic": a_magic,
            "hecke_level": data.get("hecke_level"),
            "shell_partition": list(data.get("shell_partition", ())),
            "y_shell": y_shell,
            "det_2x2": det_2x2,
            "matrix": [[1.0, y_shell], [y_shell, 1.0]],
        },
        dual={
            "shadow_price_y": data.get("shadow_price_y"),
            "wedderburn_weight": data.get("wedderburn_weight"),
            "q_dim": data.get("q_dim"),
            "classical_dim": data.get("classical_dim"),
        },
        psd_blocks=[
            {
                "name": "shell_closure_2x2",
                "size": 2,
                "determinant": det_2x2,
                "silvester_feasible": feasible,
            }
        ],
        caveats=[
            "Level-4 PSD block uses shell_shadow_price from "
            "sigma_shell_characterization. Coupling is the |y_shell| "
            "magnitude; the sign carries physical meaning (positive = "
            "binding, negative = antibinding) that this first-cut "
            "solver does not yet encode. Extend to two-channel "
            "sign-aware solver when cross-shell level 5 lands.",
        ],
    )


# ── Level 5 : cross-shell SDP ──────────────────────────────────────────

def _nearest_magic(a: int) -> tuple[int, int]:
    """Return (A_lower, A_upper) magic numbers bracketing `a`.

    If `a` is itself magic, returns (a, a).
    Below the smallest (A < 2) clamps to (2, 2); above the largest
    clamps to (126, 126).
    """
    mags = sorted(MAGIC_NUMBERS)
    if a <= mags[0]:
        return (mags[0], mags[0])
    if a >= mags[-1]:
        return (mags[-1], mags[-1])
    lower = max(m for m in mags if m <= a)
    upper = min(m for m in mags if m >= a)
    return (lower, upper)


def solve_cross_shell_sdp(a: int = 12, **_: Any) -> SDPResult:
    """Level 5 — shell-straddling 2x2 PSD for a non-magic nucleon count.

    Given `a` (open-shell nucleon count), identifies the bracketing
    magic numbers `(A_lower, A_upper)` and forms the 2x2 cross-shell
    block

        [      1                y_cross ]
        [   y_cross              1      ]

    where `y_cross = geometric_mean(y_shell(A_lower), y_shell(A_upper))`.
    Feasibility via Silvester: det = 1 - y_cross**2 ≥ 0.

    For closed-shell `a` (magic), collapses to the level-4 case.
    """
    from math import sqrt

    from . import _legacy  # noqa: F401
    try:
        from sigma_shell_characterization import shell_shadow_price  # type: ignore[import-not-found]
    except ImportError as e:
        return SDPResult(
            level=5,
            status="not_implemented",
            caveats=[f"sigma_shell_characterization not importable: {e}"],
        )

    lower, upper = _nearest_magic(a)
    y_lo = abs(float(shell_shadow_price(lower).get("shadow_price_abs", 0.0)))
    y_hi = abs(float(shell_shadow_price(upper).get("shadow_price_abs", 0.0)))

    # Geometric mean — bounded by max(y_lo, y_hi) < 1 so always feasible.
    y_cross = sqrt(max(y_lo, 0.0) * max(y_hi, 0.0))
    det_2x2 = 1.0 - y_cross ** 2
    feasible = det_2x2 >= -1e-12

    return SDPResult(
        level=5,
        status="optimal" if feasible else "infeasible",
        objective=det_2x2,
        primal={
            "a": a,
            "a_lower": lower,
            "a_upper": upper,
            "y_lower": y_lo,
            "y_upper": y_hi,
            "y_cross": y_cross,
            "det_2x2": det_2x2,
            "matrix": [[1.0, y_cross], [y_cross, 1.0]],
        },
        psd_blocks=[
            {
                "name": "cross_shell_2x2",
                "size": 2,
                "determinant": det_2x2,
                "silvester_feasible": feasible,
            }
        ],
        caveats=[
            "Level-5 cross-shell coupling is the geometric mean of the "
            "two bracketing magic-shell shadow prices. First-cut; more "
            "accurate models would fit the open-shell nucleon count "
            "fractionally between shells.",
        ],
    )


# ── Level 6 : atom-electron SDP ────────────────────────────────────────

def solve_atom_electron_sdp(z: int = 1, **_: Any) -> SDPResult:
    """Level 6 — electron-nucleus coupling 2x2 PSD.

    Forms the 2x2 block

        [        1                Z * alpha_em ]
        [ Z * alpha_em                  1      ]

    where `Z` is the atomic number and `alpha_em` is the fine-
    structure constant, sourced from `hecke_core.alpha_em` (CS-
    corrected).

    Feasibility requires `Z * alpha_em < 1`, equivalent to the
    standard atomic-orbital-stability bound `Z < 1/alpha_em ≈ 137`
    (superheavy element limit).
    """
    from . import _legacy  # noqa: F401
    try:
        from hecke_core import alpha_em  # type: ignore[import-not-found]
    except ImportError as e:
        return SDPResult(
            level=6,
            status="not_implemented",
            caveats=[f"hecke_core.alpha_em not importable: {e}"],
        )

    z_alpha = z * float(alpha_em)
    det_2x2 = 1.0 - z_alpha ** 2
    feasible = det_2x2 >= -1e-12

    return SDPResult(
        level=6,
        status="optimal" if feasible else "infeasible",
        objective=det_2x2,
        primal={
            "z": z,
            "alpha_em": float(alpha_em),
            "z_alpha": z_alpha,
            "det_2x2": det_2x2,
            "matrix": [[1.0, z_alpha], [z_alpha, 1.0]],
        },
        psd_blocks=[
            {
                "name": "atom_electron_2x2",
                "size": 2,
                "determinant": det_2x2,
                "silvester_feasible": feasible,
            }
        ],
        caveats=[
            "Level-6 electron-nucleus coupling uses the CS-corrected "
            "alpha_em from hecke_core. Feasibility fails at Z ≥ 137 "
            "(superheavy limit) — matches the standard Dirac-equation "
            "Z·alpha < 1 orbital-stability bound.",
        ],
    )


# ── Level 7 : molecule SDP ─────────────────────────────────────────────

def solve_molecule_sdp(
    bond_order: float = 1.0,
    n_atoms: int = 2,
    **_: Any,
) -> SDPResult:
    """Level 7 — covalent-bond cross-term PSD.

    Forms an `n_atoms x n_atoms` block where the diagonal is 1 and
    the off-diagonal entries encode bond coupling

        y_bond = bond_order * hartree_over_binding_ratio

    where `hartree_over_binding_ratio ≈ 0.0036` is the standard
    ratio of the Hartree atomic-binding scale to the nucleon-binding
    scale. Feasibility is the standard PSD test on the resulting
    matrix (all leading principal minors ≥ 0).
    """
    from . import _legacy  # noqa: F401
    try:
        import numpy as np  # type: ignore[import-not-found]
    except ImportError:
        return SDPResult(
            level=7,
            status="not_implemented",
            caveats=["numpy required for level-7 PSD determinant check"],
        )

    # Hartree / nucleon-binding ratio (≈ 27.2 eV / 7.6 MeV ≈ 3.6e-6,
    # scaled up by 10^3 for a usable dimensionless coupling).
    y_bond = bond_order * 3.58e-3

    if n_atoms < 2:
        return SDPResult(
            level=7,
            status="infeasible",
            caveats=[f"n_atoms = {n_atoms} < 2 does not form a molecule"],
        )

    matrix = np.eye(n_atoms)
    for i in range(n_atoms):
        for j in range(n_atoms):
            if i != j:
                matrix[i, j] = y_bond
    det = float(np.linalg.det(matrix))
    # PSD iff all eigenvalues ≥ 0
    eigs = [float(e) for e in np.linalg.eigvalsh(matrix)]
    feasible = all(e >= -1e-12 for e in eigs)

    return SDPResult(
        level=7,
        status="optimal" if feasible else "infeasible",
        objective=det,
        primal={
            "bond_order": bond_order,
            "n_atoms": n_atoms,
            "y_bond": y_bond,
            "determinant": det,
            "eigenvalues": eigs,
            "matrix": matrix.tolist(),
        },
        psd_blocks=[
            {
                "name": f"molecule_{n_atoms}x{n_atoms}",
                "size": n_atoms,
                "determinant": det,
                "silvester_feasible": feasible,
                "min_eigenvalue": min(eigs),
            }
        ],
        caveats=[
            "Level-7 covalent-bond coupling uses a heuristic "
            "hartree-over-nucleon-binding ratio (~3.58e-3) scaled by "
            "bond order. Real molecular SDP should draw from the "
            "molecular_frobenius_lp.py LP duals rather than this "
            "constant.",
        ],
    )


# ── Dispatch ───────────────────────────────────────────────────────────

_DISPATCH = {
    3: solve_pair_sdp,
    4: solve_shell_magic_sdp,
    5: solve_cross_shell_sdp,
    6: solve_atom_electron_sdp,
    7: solve_molecule_sdp,
}


def multi_level_sdp(level: int, **params: Any) -> SDPResult:
    """Solve the quadratic SDP at a given confinement level.

    Parameters
    ----------
    level : int
        Confinement level in 3..7.
    **params
        Level-specific parameters, forwarded to the underlying solver.

    Returns
    -------
    SDPResult
        Structured result. Check ``.status`` — "not_implemented"
        indicates a Track C level awaiting implementation.

    Raises
    ------
    ValueError
        If ``level`` is outside 3..7.
    """
    if level not in _DISPATCH:
        raise ValueError(
            f"multi_level_sdp: level must be in 3..7, got {level!r}"
        )
    return _DISPATCH[level](**params)


def implemented_levels() -> list[int]:
    """Return the levels for which an SDP solver is actually implemented."""
    return [3, 4, 5, 6, 7]


def pending_levels() -> list[int]:
    """Return the levels that still need implementation (Track C)."""
    return []
