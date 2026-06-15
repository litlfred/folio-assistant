"""Young partitions and partition-valued functionals.

Re-exports the partition-specific functionals: spectral rates, LP
shadow prices, Laplacian eigenvalues, resolvent weights.  These all
live on the Phase-5 EXPLORATORY surface
(`_deprecated/hecke_core_legacy.py`) — not on the canonical derivation
chain.  The canonical-vs-exploratory split is documented in
`docs/audits/2026-05-24-hecke-core-canonical-audit.md`.
"""

from __future__ import annotations

from . import _legacy  # noqa: F401

from hecke_core_legacy import (  # type: ignore[import-not-found]
    lp_shadow_price,
    q_laplacian_eigenvalue,
    q_resolvent_weight,
    partition_character_sigma1,
    partition_spectral_log_rate,
)

__all__ = [
    "lp_shadow_price",
    "q_laplacian_eigenvalue",
    "q_resolvent_weight",
    "partition_character_sigma1",
    "partition_spectral_log_rate",
]
