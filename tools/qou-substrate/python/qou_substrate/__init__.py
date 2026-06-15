"""qou-substrate — pure-Python substrate infrastructure for the Quantum Observable Universe.

Three modules, no Rust dependency, ~1,100 LOC total:

- ``qou_substrate.constants``  — the substrate parameter ``q_0`` and its
  derived constants (``HA = q - q^-1``, ``E_CROSS``, ``TWO_Q``, ``LN_Q``,
  ``S_SKEIN``, ``q_int(n)``, …) plus uncertainty propagation. Single
  source of truth: re-run all witnesses if Vol(4_1) or m_μ/m_e changes.

- ``qou_substrate.precision`` — ``set_compute_dps(50)`` + ``fmt()``, the
  mpmath precision discipline (compute at OUTPUT_DPS+GUARD, serialise at
  OUTPUT_DPS) every witness script uses.

- ``qou_substrate.witness``   — ``WitnessBuilder``, the schema-shaped
  JSON emitter with git provenance, per-file content-hash staleness, and
  upstream-witness drift detection. Used by 67% of QOU compute scripts.

Stable re-exports below; the submodules are also importable directly if
the caller needs a symbol not flattened here.
"""

from __future__ import annotations

__version__ = "0.1.0"

# ── Substrate constants ─────────────────────────────────────────────
from .constants import (
    # Input measurements
    VOL_FIGURE_EIGHT,
    VOL_FIGURE_EIGHT_ERR,
    MASS_RATIO_MU_E,
    MASS_RATIO_MU_E_ERR,
    # The substrate parameter and its first derivatives
    HBAR_Q,
    HBAR_Q_SQ,
    Q,
    Q_ERR,
    Q_INV,
    Q_INV_ERR,
    HA,
    HA_ERR,
    E_CROSS,
    E_CROSS_ERR,
    S_SKEIN,
    S_SKEIN_ERR,
    TWO_Q,
    TWO_Q_ERR,
    TANH_LN_Q,
    TANH_LN_Q_ERR,
    LN_Q,
    # Quantum helpers
    log_q,
    q_int,
    q_int_err,
    # Rational form (for the Rust engine)
    Q_RAT_NUM,
    Q_RAT_DEN,
    # High-precision string + mpmath parallel API
    Q_50_DIGIT_STR,
    MASS_RATIO_MU_E_STR,
    HAS_MPMATH,
)

# Optional mpmath-backed names (only present when mpmath is installed,
# which it is by default since pyproject.toml lists it as a dep)
if HAS_MPMATH:
    from .constants import (
        vol_4_1_at,
        q_at,
        q_str,
        Q_MP,
        VOL_4_1_MP,
        HBAR_Q_SQ_MP,
        HBAR_Q_MP,
        Q_INV_MP,
        HA_MP,
        E_CROSS_MP,
        S_SKEIN_MP,
        TWO_Q_MP,
        TANH_LN_Q_MP,
        LN_Q_MP,
    )

# ── Precision discipline ────────────────────────────────────────────
from .precision import (
    set_compute_dps,
    fmt,
    COMPUTE_DPS,
    OUTPUT_DPS,
    PRECISION_GUARD,
    COMPUTE_DPS_DEFAULT,
    OUTPUT_DPS_DEFAULT,
    PRECISION_GUARD_DEFAULT,
)

# ── Witness builder ─────────────────────────────────────────────────
from .witness import (
    WitnessBuilder,
    Assertion,
    file_content_hash,
    load_and_hash_upstream,
    check_witness_staleness,
)

__all__ = [
    "__version__",
    # constants
    "VOL_FIGURE_EIGHT", "VOL_FIGURE_EIGHT_ERR",
    "MASS_RATIO_MU_E", "MASS_RATIO_MU_E_ERR",
    "HBAR_Q", "HBAR_Q_SQ",
    "Q", "Q_ERR", "Q_INV", "Q_INV_ERR",
    "HA", "HA_ERR", "E_CROSS", "E_CROSS_ERR",
    "S_SKEIN", "S_SKEIN_ERR", "TWO_Q", "TWO_Q_ERR",
    "TANH_LN_Q", "TANH_LN_Q_ERR", "LN_Q",
    "log_q", "q_int", "q_int_err",
    "Q_RAT_NUM", "Q_RAT_DEN",
    "Q_50_DIGIT_STR", "MASS_RATIO_MU_E_STR", "HAS_MPMATH",
    # precision
    "set_compute_dps", "fmt",
    "COMPUTE_DPS", "OUTPUT_DPS", "PRECISION_GUARD",
    "COMPUTE_DPS_DEFAULT", "OUTPUT_DPS_DEFAULT", "PRECISION_GUARD_DEFAULT",
    # witness
    "WitnessBuilder", "Assertion",
    "file_content_hash", "load_and_hash_upstream", "check_witness_staleness",
]
