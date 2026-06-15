"""Markov trace — numeric and arbitrary-precision (mpmath) variants.

Re-exports from hecke_core (canonical) + _deprecated/hecke_core_legacy
(exploratory `atom_character_raw`) + crt_markov (optional CRT backend).
"""

from __future__ import annotations

from . import _legacy  # noqa: F401

from hecke_core import (  # type: ignore[import-not-found]
    nf_tr,
    nf_net,
    TR_M,
)
from hecke_core_legacy import (  # type: ignore[import-not-found]
    atom_character_raw,
)

try:
    from crt_markov import (  # type: ignore[import-not-found]
        markov_trace_at_q,
        markov_trace_symbolic_eval,
        tower_mass_symbolic_eval,
        tr_M_at_q0_via_crt,
    )
    _HAS_CRT = True
except ImportError:
    _HAS_CRT = False

__all__ = ["nf_tr", "nf_net", "atom_character_raw", "TR_M"]

if _HAS_CRT:
    __all__ += [
        "markov_trace_at_q",
        "markov_trace_symbolic_eval",
        "tower_mass_symbolic_eval",
        "tr_M_at_q0_via_crt",
    ]


def has_crt_backend() -> bool:
    """True if crt_markov is importable (arbitrary-precision path available)."""
    return _HAS_CRT
