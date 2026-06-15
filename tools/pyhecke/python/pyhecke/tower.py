"""Φ_q tower and symbolic V̂ infrastructure.

Re-exports from hecke_core (canonical) + _deprecated/hecke_core_legacy
(exploratory `knot_factor`) + tower_binding_symbolic (optional).
"""

from __future__ import annotations

from . import _legacy  # noqa: F401

from hecke_core import (  # type: ignore[import-not-found]
    build_atom_nf,
    build_atom_nf_exact,
    vertex_volume,
    nucleon_gen_chains,
    atom_gen_chains,
    atom_V_full,
)
from hecke_core_legacy import (  # type: ignore[import-not-found]
    knot_factor,
)

try:
    from tower_binding_symbolic import (  # type: ignore[import-not-found]
        symbolic_binding,
        additive_wedderburn_symbolic,
        atom_crossings_symbolic,
        tower_mass_symbolic,
        Phi_q_numeric,
    )
    _HAS_SYMBOLIC = True
except ImportError:
    _HAS_SYMBOLIC = False

__all__ = [
    "build_atom_nf", "build_atom_nf_exact", "knot_factor", "vertex_volume",
    "nucleon_gen_chains", "atom_gen_chains", "atom_V_full",
]

if _HAS_SYMBOLIC:
    __all__ += [
        "symbolic_binding", "additive_wedderburn_symbolic",
        "atom_crossings_symbolic", "tower_mass_symbolic", "Phi_q_numeric",
    ]


def has_symbolic_backend() -> bool:
    """True if tower_binding_symbolic is importable."""
    return _HAS_SYMBOLIC
