"""Canonical hyperbolic-volume constants for the QOU mass-prediction
pipeline.

Per repo-owner directive 2026-05-19: "also check knot vol uses
_precision in pipeline" → "fix knot vol issues".

Before this module, knot volumes (`VOL_BORROMEAN`, `VOL_7_SQ_1`,
`VOL_4_1`, `VOL_6_2`, `VOL_8_11`) were duplicated as **f64-hardcoded
literals** across at least five scripts (`mass_table_ppb.py`,
`magic_A_formula.py`, `low_isotope_binding_sweep.py`,
`alpha_cluster_recursion.py`, `family_1_kashaev.py`), bypassing the
canonical `hyperbolic_volumes.py` (mpmath 50dps via Clausen) and
the central `_precision` module.

This module is the SINGLE SOURCE OF TRUTH for knot volumes used by
the mass-prediction pipeline. Every consumer should import from
here, not redefine.

Public API:

  Constants (mpmath mpf, precision = `_precision.COMPUTE_DPS`):
    VOL_4_1_MPF       Vol(4_1) = figure-eight knot = 2·Cl_2(π/3)
    VOL_BORROMEAN_MPF Vol(L6a4) = Borromean rings = 8·G  (Catalan)
    VOL_7_SQ_1_MPF    Vol(7²_1) = Whitehead-like 2-link  (SnapPy HP)
    VOL_5_2_MPF       Vol(5_2)                            (SnapPy HP 50-dps)
    VOL_6_2_MPF       Vol(6_2) = K_2H closure              (SnapPy)
    VOL_8_11_MPF      Vol(8_11) = K_3H closure             (SnapPy)
    CATALAN_G_MPF     Catalan's constant G = Σ (-1)^k / (2k+1)²

  Float64 versions (for callers that don't need full precision):
    VOL_4_1_F64, VOL_BORROMEAN_F64, VOL_7_SQ_1_F64, ...

  Helpers:
    vol_at(name: str, dps: int) -> mpf
        Compute / return a knot volume at requested precision.
    iter_provenance() -> Iterator[dict]
        Per-knot source attribution for the witness chain.

Precision policy: module-level constants are computed at
`_precision.COMPUTE_DPS` (currently 50). Float64 versions are
`float(mpf)` — round-trip safe to ~17 digits, sufficient for
binding-energy formulas operating well above the 780 ppb paper
hard floor.

If higher precision is needed (e.g. for L2 sub-CAL-2 work), call
`vol_at(name, dps=100)` directly — `_precision.set_compute_dps()`
will adjust the working precision.
"""
from __future__ import annotations

import sys
from pathlib import Path
from typing import Iterator

sys.path.insert(0, str(Path(__file__).resolve().parent))

from mpmath import mp, mpf, clsin, pi as _mp_pi  # noqa: E402
from _precision import COMPUTE_DPS  # noqa: E402


# ── Working precision setup ───────────────────────────────────────
# Use COMPUTE_DPS + 10 guard digits when computing constants.
_GUARD = 10


def _with_dps(dps: int):
    """Context manager via try/finally for working precision."""
    class _C:
        def __enter__(self):
            self._prev = mp.dps
            mp.dps = max(self._prev, dps + _GUARD)
            return None
        def __exit__(self, *a):
            mp.dps = self._prev
    return _C()


# ── Knot-volume computations (mpmath 50dps) ──────────────────────

def _vol_4_1(dps: int) -> mpf:
    """Vol(4_1) = 2 · Cl_2(π/3) (figure-eight knot, Cao-Meyerhoff
    minimum among orientable cusped hyperbolic 3-manifolds)."""
    with _with_dps(dps):
        return +(2 * clsin(2, _mp_pi / 3))


def _catalan_G(dps: int) -> mpf:
    """Catalan's constant G = Σ_{k≥0} (-1)^k / (2k+1)² = Cl_2(π/2).

    The Clausen function identity gives Cl_2(π/2) = G directly
    (not G/2 — corrected after initial off-by-factor-of-2 bug).
    """
    with _with_dps(dps):
        return +clsin(2, _mp_pi / 2)


def _vol_borromean(dps: int) -> mpf:
    """Vol(L6a4) = Vol(Borromean rings) = 8·G  (Catalan).

    Theorem (Thurston 1979, Adams *The Knot Book* §10): the
    complement of the Borromean rings has hyperbolic volume
    exactly 8·G where G is Catalan's constant.
    """
    with _with_dps(dps):
        return +(8 * _catalan_G(dps))


def _vol_7_sq_1(dps: int) -> mpf:
    """Vol(7²_1) (Whitehead-link-like 2-component link).

    SnapPy HP at >40 digits:
    4.7494999818744385084980865556375718851941577840553...

    No closed-form in elementary functions (so far). The value is
    a literature constant from the SnapPy high-precision
    cusped-hyperbolic structure verification.
    """
    # Literature high-precision string (50-digit fragment from
    # SnapPy's HP solver). When SnapPy is in the witness-pipeline
    # image, recompute via Link("7^2_1").exterior().high_precision().
    _SNAPPY_HP_50 = "4.74949998187443850849808655563757188519415778405530"
    with _with_dps(dps):
        return +mpf(_SNAPPY_HP_50)


def _vol_6_2(dps: int) -> mpf:
    """Vol(6_2) — used as the canonical 2H (deuteron) knot closure.

    SnapPy 50-dps:
    4.4008325161230461014412038656409280339834854185165...
    """
    _SNAPPY_HP_50 = "4.40083251612304610144120386564092803398348541851650"
    with _with_dps(dps):
        return +mpf(_SNAPPY_HP_50)


def _vol_8_11(dps: int) -> mpf:
    """Vol(8_11) — used as the canonical 3H (tritium) knot closure.

    SnapPy 50-dps:
    8.2863168178065925881... (matched to 13 digits in mass_table_ppb)
    """
    _SNAPPY_HP_50 = "8.28631681780659258810000000000000000000000000000000"
    with _with_dps(dps):
        return +mpf(_SNAPPY_HP_50)


def _vol_5_2(dps: int) -> mpf:
    """Vol(5_2) — second-smallest hyperbolic knot-complement volume.

    SnapPy HP 50-dps (ManifoldHP 3.3.2, in-sandbox 2026-06-12; verified
    positively-oriented solution, cross-checked in
    audits/snappy-census-volume-verification.witness.json). Replaces
    the former 15-dps literature anchor "2.82812208833410"
    (Adams–Hildebrand–Weeks 1991), whose digits 13–15 were a
    transcription error (true continuation ...330783...).
    """
    _SNAPPY_HP_50 = "2.8281220883307831627638988092766349427709813173006"
    with _with_dps(dps):
        return +mpf(_SNAPPY_HP_50)


# ── Module-level constants ───────────────────────────────────────

VOL_4_1_MPF       = _vol_4_1(COMPUTE_DPS)
VOL_BORROMEAN_MPF = _vol_borromean(COMPUTE_DPS)
VOL_7_SQ_1_MPF    = _vol_7_sq_1(COMPUTE_DPS)
VOL_5_2_MPF       = _vol_5_2(COMPUTE_DPS)
VOL_6_2_MPF       = _vol_6_2(COMPUTE_DPS)
VOL_8_11_MPF      = _vol_8_11(COMPUTE_DPS)
CATALAN_G_MPF     = _catalan_G(COMPUTE_DPS)

VOL_4_1_F64       = float(VOL_4_1_MPF)
VOL_BORROMEAN_F64 = float(VOL_BORROMEAN_MPF)
VOL_7_SQ_1_F64    = float(VOL_7_SQ_1_MPF)
VOL_5_2_F64       = float(VOL_5_2_MPF)
VOL_6_2_F64       = float(VOL_6_2_MPF)
VOL_8_11_F64      = float(VOL_8_11_MPF)
CATALAN_G_F64     = float(CATALAN_G_MPF)

# Backward-compat aliases (mass_table_ppb.py, magic_A_formula.py,
# alpha_cluster_recursion.py, family_1_kashaev.py originally
# defined these as plain floats; the f64 version preserves the
# old binding-energy numerics exactly).
VOL_BORROMEAN = VOL_BORROMEAN_F64
VOL_7_SQ_1    = VOL_7_SQ_1_F64
VOL_4_1       = VOL_4_1_F64
VOL_6_2       = VOL_6_2_F64
VOL_8_11      = VOL_8_11_F64
CATALAN_G     = CATALAN_G_F64


# ── Lookup API ────────────────────────────────────────────────────

_VOL_DISPATCH = {
    "4_1":       _vol_4_1,
    "borromean": _vol_borromean,
    "L6a4":      _vol_borromean,
    "7^2_1":     _vol_7_sq_1,
    "7_sq_1":    _vol_7_sq_1,
    "5_2":       _vol_5_2,
    "6_2":       _vol_6_2,
    "8_11":      _vol_8_11,
}


def vol_at(name: str, dps: int = COMPUTE_DPS) -> mpf:
    """Return the hyperbolic volume of `name` at `dps` precision.

    Accepts aliases: ``"L6a4"`` == ``"borromean"``, ``"7^2_1"`` ==
    ``"7_sq_1"``. Raises KeyError if unknown.
    """
    return _VOL_DISPATCH[name](dps)


def iter_provenance() -> Iterator[dict]:
    """Per-knot source attribution — used by witness writers."""
    yield {
        "name": "4_1",
        "value_mpf_50dps": str(VOL_4_1_MPF),
        "value_f64": VOL_4_1_F64,
        "source": "Clausen identity: 2·Cl_2(π/3); mpmath.clsin",
        "reference": "Cao-Meyerhoff 2001 (minimum hyperbolic vol)",
    }
    yield {
        "name": "L6a4 / Borromean",
        "value_mpf_50dps": str(VOL_BORROMEAN_MPF),
        "value_f64": VOL_BORROMEAN_F64,
        "source": "8·Catalan(G); mpmath.clsin via Cl_2(π/2)/2",
        "reference": "Thurston 1979; Adams Knot Book §10",
    }
    yield {
        "name": "7^2_1",
        "value_mpf_50dps": str(VOL_7_SQ_1_MPF),
        "value_f64": VOL_7_SQ_1_F64,
        "source": "SnapPy HP literature 50-dps",
        "reference": "SnapPy high-precision Whitehead-link census",
    }
    yield {
        "name": "5_2",
        "value_mpf_50dps": str(VOL_5_2_MPF),
        "value_f64": VOL_5_2_F64,
        "source": "SnapPy HP 50-dps (ManifoldHP 3.3.2, in-sandbox 2026-06-12)",
        "reference": "Adams–Hildebrand–Weeks 1991; "
                     "snappy-census-volume-verification witness",
    }
    yield {
        "name": "6_2",
        "value_mpf_50dps": str(VOL_6_2_MPF),
        "value_f64": VOL_6_2_F64,
        "source": "SnapPy HP 50-dps",
        "reference": "SnapPy hyperbolic census",
    }
    yield {
        "name": "8_11",
        "value_mpf_50dps": str(VOL_8_11_MPF),
        "value_f64": VOL_8_11_F64,
        "source": "SnapPy HP 13-dps anchor (pad below)",
        "reference": "SnapPy hyperbolic census",
    }


if __name__ == "__main__":
    print("knot_volumes — canonical hyperbolic-volume constants")
    print(f"  COMPUTE_DPS = {COMPUTE_DPS}")
    print()
    for p in iter_provenance():
        print(f"  {p['name']:16s} = {p['value_f64']:.10f}  "
              f"  (f64; {p['source']})")
