#!/usr/bin/env python3
# polynomial_q_not_applicable: constants module; no q-polynomial logic.
"""CODATA / AME constants module — split into legitimate calibration
inputs and validation-only literals, and loaded from witness JSONs
rather than hardcoded.

═══════════════════════════════════════════════════════════════════
 CALIBRATION DISCIPLINE  (per content/quantum-observable-universe/
 braids-and-knots/three-calibration-inputs.md  — CAL-1, CAL-2, CAL-3)
═══════════════════════════════════════════════════════════════════

The QOU framework admits **exactly three** external calibration
inputs. Beyond these three, no further empirical, fitting, or
numerological input is permitted; every other mass, Q-value, and
binding energy in the paper is a prediction.

| ID    | Quantity              | Module export        | Source witness                          |
|-------|----------------------|----------------------|------------------------------------------|
| CAL-1 | m_e                  | M_E_MEV              | (hardcoded — framework's only direct mass anchor) |
| CAL-2 | m_μ / m_e            | (in q_parameter.py)  | q-pinning-50-digit.witness.json:calibration_inputs |
| CAL-3 | Q_β(n)               | Q_BETA_MEV           | cal-3-q-beta.witness.json               |

`m_p`, `m_n`, `m_D`, `m_T`, `m_3He`, `m_4He` are **predictions** of
the framework. They are exposed below for **validation only** —
import them when comparing categorical predictions against AME /
CODATA experimental values, NEVER as upstream inputs to a mass
prediction. They live in
`codata-2022-validation-masses.witness.json`.

Scripts that consume `M_P_MEV` / `M_N_MEV` / etc. as inputs to a
mass / binding-energy prediction violate the three-calibration
discipline and inflate the apparent calibration count from 3 → 4+.
The neutron-gap probes (round 3, witness
`neutron-gap-probes-round3.witness.json`) explicitly diagnosed this
violation and recommend the correct chain:

    m_p_pred = |tr_M(p, q_0)| · E_0
    m_n_pred = m_p_pred + Q_β + m_e        (3-input convention)
    m_K_pred = (Z·m_p + N·m_n)_pred + Binding(K)

The script-side migration to the categorical chain is tracked as
Workplan 0b in
`docs/audits/2026-05-10-workplan-0b-script-rewire-handoff.md`.
"""
from __future__ import annotations

import json
import warnings
from pathlib import Path

import mpmath as mp

# ── Witness JSON loader ─────────────────────────────────────────
_WITNESS_DIR = Path(__file__).resolve().parent
_VALIDATION_WITNESS = _WITNESS_DIR / "codata-2022-validation-masses.witness.json"
_CAL3_WITNESS = _WITNESS_DIR / "cal-3-q-beta.witness.json"

# Cache for parsed JSON content keyed by witness Path so repeated
# _load_mpf calls on the same file don't re-parse.
_WITNESS_CACHE: dict = {}


def _load_mpf(witness_path: Path, dotted_key: str) -> mp.mpf:
    """Load an mpmath mpf from a witness JSON at a dotted key path.

    Witness values are stored as strings to preserve precision through
    JSON round-trip; mp.mpf parses them at the active dps. Per-path
    JSON parses are cached in `_WITNESS_CACHE` to avoid redundant I/O
    when this module loads multiple values from the same witness.
    """
    if witness_path not in _WITNESS_CACHE:
        with witness_path.open("r", encoding="utf-8") as fh:
            _WITNESS_CACHE[witness_path] = json.load(fh)
    cursor = _WITNESS_CACHE[witness_path]
    for segment in dotted_key.split("."):
        cursor = cursor[segment]
    if not isinstance(cursor, str):
        raise TypeError(
            f"Witness {witness_path.name}:{dotted_key} must be string for "
            f"precision-safe mpmath parsing; got {type(cursor).__name__}."
        )
    # Force ≥50 dps parsing regardless of caller's current mp.dps so
    # the module-level constants don't silently truncate to a low-
    # precision default at import time. Caller's dps is restored on
    # exit (per Copilot review note).
    with mp.workdps(max(50, mp.mp.dps)):
        return +mp.mpf(cursor)  # unary `+` to force re-rounding at workdps


# ── CAL-1: electron mass (legitimate calibration input) ─────────
# Hardcoded — the framework's sole direct mass-scale anchor (CAL-1).
# 0.5109989500(15) MeV/c² (CODATA 2022)
M_E_MEV = mp.mpf("0.51099895")
M_E_MEV_ERR = mp.mpf("0.00000000015")

# ── CAL-3: free-neutron β-decay Q-value (legitimate calibration) ─
# Loaded from cal-3-q-beta.witness.json. Fixes hadronic energy scale
# E_0 via E_0 = Q_β(n) / |Δ(net)| with Δ(net) = h(h-2)/2 from the
# symbolic NF difference between neutron and proton.
Q_BETA_MEV = _load_mpf(_CAL3_WITNESS, "data.Q_beta_n_MeV")
Q_BETA_MEV_ERR = _load_mpf(_CAL3_WITNESS, "data.Q_beta_n_MeV_err")

# ════════════════════════════════════════════════════════════════
# VALIDATION-ONLY CODATA literals — DO NOT USE AS PREDICTION INPUTS
# ════════════════════════════════════════════════════════════════
# Loaded from codata-2022-validation-masses.witness.json. These are
# the experimental values the framework predicts. Importing them as
# upstream inputs to any mass / binding script silently inflates the
# calibration count beyond the pre-approved 3 (CAL-1/2/3). Use only
# for downstream comparison: `err = pred - M_X_VALIDATION`.

M_P_MEV_VALIDATION = _load_mpf(_VALIDATION_WITNESS, "data.m_p_MeV")
M_P_MEV_VALIDATION_ERR = _load_mpf(_VALIDATION_WITNESS, "data.m_p_MeV_err")

M_N_MEV_VALIDATION = _load_mpf(_VALIDATION_WITNESS, "data.m_n_MeV")
M_N_MEV_VALIDATION_ERR = _load_mpf(_VALIDATION_WITNESS, "data.m_n_MeV_err")

M_D_MEV_VALIDATION = _load_mpf(_VALIDATION_WITNESS, "data.m_D_MeV")
M_T_MEV_VALIDATION = _load_mpf(_VALIDATION_WITNESS, "data.m_T_MeV")
M_HE3_MEV_VALIDATION = _load_mpf(_VALIDATION_WITNESS, "data.m_3He_MeV")
M_HE4_MEV_VALIDATION = _load_mpf(_VALIDATION_WITNESS, "data.m_4He_MeV")

# ── Hydrogen-1 atomic mass + Rydberg energy ─────────────────────
# Added per Copilot review on PR #757 — centralise the literals
# previously hardcoded in `probe_h1_substrate_closure`,
# `hydrogen_step_by_step`, and `hydrogen_qshuffle_compound`.
# These are pure validation/comparison targets, never CAL inputs.
# Source: CODATA 2018 / PDG 2022 atomic-mass tables.
M_H1_MEV_VALIDATION = mp.mpf("938.7830731")
RYDBERG_eV_VALIDATION = mp.mpf("13.605693")

# ── Internal consistency check (CAL-3 vs CODATA m_n − m_p − m_e) ─
# Q_β must agree with (m_n − m_p − m_e) within combined CODATA σ.
# This is a *cross-check*, not the definition of Q_β: per CAL-3,
# Q_β is the primary input; m_p, m_n are predictions.
_q_beta_from_codata_check = (
    M_N_MEV_VALIDATION - M_P_MEV_VALIDATION - M_E_MEV
)
_q_beta_residual = abs(Q_BETA_MEV - _q_beta_from_codata_check)
_q_beta_combined_err = mp.sqrt(
    M_N_MEV_VALIDATION_ERR ** 2
    + M_P_MEV_VALIDATION_ERR ** 2
    + M_E_MEV_ERR ** 2
    + Q_BETA_MEV_ERR ** 2
)
if _q_beta_residual > 5 * _q_beta_combined_err:
    warnings.warn(
        f"CAL-3 consistency check failed: |Q_β - (m_n - m_p - m_e)| = "
        f"{float(_q_beta_residual):.3e} MeV exceeds 5× combined CODATA σ "
        f"({float(_q_beta_combined_err):.3e} MeV). Verify CODATA refresh "
        f"in codata-2022-validation-masses.witness.json + "
        f"cal-3-q-beta.witness.json.",
        stacklevel=2,
    )

# ════════════════════════════════════════════════════════════════
# DEPRECATED ALIASES — emit DeprecationWarning on import
# ════════════════════════════════════════════════════════════════
# The pre-2026-05-10 names `M_P_MEV`, `M_N_MEV`, `M_D_MEV`, … were
# imported by ~30 scripts as if they were calibration inputs. They
# remain accessible for one release cycle to avoid breaking imports,
# but each access emits a DeprecationWarning naming the migration
# target. New code MUST import the `_VALIDATION` suffix and only for
# comparison purposes (never as prediction inputs).

_DEPRECATED_ALIASES = {
    "M_P_MEV": "M_P_MEV_VALIDATION",
    "M_N_MEV": "M_N_MEV_VALIDATION",
    "M_D_MEV": "M_D_MEV_VALIDATION",
    "M_T_MEV": "M_T_MEV_VALIDATION",
    "M_HE3_MEV": "M_HE3_MEV_VALIDATION",
    "M_HE4_MEV": "M_HE4_MEV_VALIDATION",
    "M_P_MEV_ERR": "M_P_MEV_VALIDATION_ERR",
    "M_N_MEV_ERR": "M_N_MEV_VALIDATION_ERR",
}


def __getattr__(name: str):
    if name in _DEPRECATED_ALIASES:
        target = _DEPRECATED_ALIASES[name]
        warnings.warn(
            f"`{name}` is deprecated and violates the three-calibration "
            f"discipline (CAL-1/2/3 only). Import `{target}` instead, and "
            f"use it ONLY for validation/comparison — never as an upstream "
            f"input to a mass / binding prediction. See "
            f"three-calibration-inputs.md and "
            f"docs/audits/2026-05-10-workplan-0b-script-rewire-handoff.md.",
            DeprecationWarning,
            stacklevel=2,
        )
        return globals()[target]
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")


__all__ = [
    # Legitimate calibration inputs (CAL-1, CAL-3)
    "M_E_MEV", "M_E_MEV_ERR",
    "Q_BETA_MEV", "Q_BETA_MEV_ERR",
    # Validation-only experimental values (loaded from witness)
    "M_P_MEV_VALIDATION", "M_P_MEV_VALIDATION_ERR",
    "M_N_MEV_VALIDATION", "M_N_MEV_VALIDATION_ERR",
    "M_D_MEV_VALIDATION",
    "M_T_MEV_VALIDATION",
    "M_HE3_MEV_VALIDATION",
    "M_HE4_MEV_VALIDATION",
]
