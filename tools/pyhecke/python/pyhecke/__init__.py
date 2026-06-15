"""pyhecke — Hecke algebra + Gram matrix + tower binding infrastructure.

M1 carve-out of folio-assistant/computations/hecke_core.py. This module
exposes a stable import surface while delegating the heavy lifting to
the legacy file so downstream scripts continue to work unchanged.

Stable re-exports:
  Constants:  G, G_INV, TR_M, NF_BASIS, NF_NAMES, z,
              W_SYM, W_STD, W_ALT, alpha_em, ALPHA_BORROMEAN,
              ALPHA_FIGURE8, CATALAN_G, VOL_BORROMEAN, VOL_FIGURE8,
              V_HAT_ELECTRON, FIG8_*, E_HARTREE_EV, TWO_Q, E_MOL,
              KAPPA, M_E_MEV, M_P_MEV, M_N_MEV, q2, E_0_CALIBRATION_MEV,
              NOBLE_GAS_Z, PROTON_NF, NEUTRON_NF
  Functions:  hm, hm_exact, nf_tr, nf_net,
              partitions_of, partition_dimension, partition_conjugate,
              partition_is_self_conjugate, q_dimension, wedderburn_weight,
              q_factorial, q_hook_product,
              build_atom_nf, build_atom_nf_exact, nf_channel_exact,
              check_frobenius, vertex_volume, nucleon_gen_chains,
              atom_gen_chains, atom_V_full, atom_per_generator_volumes,
              build_nucleon_nf, valence_Z, molecular_binding_nf,
              molecular_binding_frobenius

Submodules (lazy-loaded via PEP-562 __getattr__):
  pyhecke.gram, pyhecke.wedderburn, pyhecke.atom, pyhecke.molecular,
  pyhecke.constants, pyhecke.partition, pyhecke.trace, pyhecke.tower,
  pyhecke.skew_syt,
  pyhecke.certificate, pyhecke.bridge, pyhecke.schema, pyhecke.crt,
  pyhecke.undo, pyhecke.sdp

Import `pyhecke.<submodule>` to pay only the cost of that submodule
plus its own deps. `import pyhecke` on its own loads none of them.
"""

from __future__ import annotations

import importlib as _importlib
from typing import Any

__version__ = "0.1.0"

_SUBMODULES = (
    # Stdlib-only or pure-numpy — cheap
    "schema", "certificate", "bridge", "crt", "undo", "sdp",
    # Depend on hecke_core and its siblings — expensive (42s today)
    "gram", "wedderburn", "atom", "molecular", "constants",
    "partition", "trace", "tower",
    # Pure-Python combinatorics, no heavy deps
    "skew_syt",
)

# Flattened symbols exported at package level. The first time any of
# these is accessed, we load the owning submodule and cache the bind.
_FLATTENED = {
    # from pyhecke.gram
    "G": "gram", "G_INV": "gram", "TR_M": "gram",
    "NF_BASIS": "gram", "NF_NAMES": "gram",
    "hm": "gram", "hm_exact": "gram", "nf_tr": "gram", "nf_net": "gram",
    "z": "gram", "W_SYM": "gram", "W_STD": "gram", "W_ALT": "gram",
    "INV_TREFOIL_G0": "gram", "INV_TREFOIL_G1": "gram",
    # from pyhecke.wedderburn
    "partitions_of": "wedderburn",
    "partition_dimension": "wedderburn",
    "partition_conjugate": "wedderburn",
    "partition_is_self_conjugate": "wedderburn",
    "q_dimension": "wedderburn",
    "wedderburn_weight": "wedderburn",
    "q_factorial": "wedderburn",
    "q_hook_product": "wedderburn",
    # from pyhecke.atom
    "_ID_NF": "atom",
    "_PROTON_G0": "atom", "_PROTON_G1": "atom",
    "_NEUTRON_G0": "atom", "_NEUTRON_G1": "atom",
    "PROTON_NF": "atom", "NEUTRON_NF": "atom",
    "build_atom_nf_exact": "atom", "nf_channel_exact": "atom",
    "check_frobenius": "atom", "build_atom_nf": "atom",
    "vertex_volume": "atom", "nucleon_gen_chains": "atom",
    "atom_gen_chains": "atom", "atom_V_full": "atom",
    "_chain_V_full": "atom", "atom_per_generator_volumes": "atom",
    "build_nucleon_nf": "atom",
    # from pyhecke.molecular
    "NOBLE_GAS_Z": "molecular", "valence_Z": "molecular",
    "_vertex_channels": "molecular",
    "molecular_binding_nf": "molecular",
    "molecular_binding_frobenius": "molecular",
    # from pyhecke.constants
    "q2": "constants",
    "ALPHA_EM_INV_DERIVED": "constants",
    "alpha_em": "constants", "alpha_em_derived": "constants",
    "ALPHA_BORROMEAN": "constants", "ALPHA_FIGURE8": "constants",
    "ALPHA": "constants",
    "CATALAN_G": "constants",
    "VOL_BORROMEAN": "constants", "VOL_FIGURE8": "constants",
    "V_HAT_ELECTRON": "constants",
    "FIG8_A_BULK": "constants", "FIG8_F_COUL": "constants",
    "FIG8_F_EXCH": "constants",
    "FIG8_R_311": "constants", "FIG8_R_32": "constants",
    "FIG8_R_41": "constants",
    "E_HARTREE_EV": "constants", "TWO_Q": "constants",
    "E_MOL": "constants", "KAPPA": "constants",
    "M_E_MEV": "constants", "M_P_MEV": "constants", "M_N_MEV": "constants",
    "E_0_CALIBRATION_MEV": "constants",
    "E_0_CALIBRATION_MEV_ERR": "constants",
}

__all__ = ["__version__", *sorted(_SUBMODULES), *sorted(_FLATTENED)]


def __getattr__(name: str) -> Any:
    """PEP-562 lazy loader.

    Two paths:
      1. `name` is a submodule (e.g. "gram", "schema"): import it, bind
         it on this package, return.
      2. `name` is a flattened symbol (e.g. "G", "hm"): import its
         owning submodule, pull the attribute, bind on this package.
    """
    if name in _SUBMODULES:
        module = _importlib.import_module(f"{__name__}.{name}")
        globals()[name] = module
        return module
    if name in _FLATTENED:
        owner = _importlib.import_module(f"{__name__}.{_FLATTENED[name]}")
        try:
            value = getattr(owner, name)
        except AttributeError as e:
            raise AttributeError(
                f"pyhecke: submodule {_FLATTENED[name]!r} does not expose {name!r}. "
                f"This usually means hecke_core is not importable in this env."
            ) from e
        globals()[name] = value
        return value
    raise AttributeError(f"module 'pyhecke' has no attribute {name!r}")


def __dir__() -> list[str]:
    return list(__all__)
