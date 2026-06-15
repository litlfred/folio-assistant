"""
qou_substrate.precision — shared precision infrastructure for QOU
compute scripts.

Centralizes the COMPUTE precision (mp.mp.dps) and the SERIALIZATION
precision used when emitting mpmath values into witness JSON.

USAGE
-----

At the top of any mpmath-based script::

    from qou_substrate import set_compute_dps, fmt
    # equivalently: from qou_substrate.precision import set_compute_dps, fmt

    set_compute_dps()           # set mp.mp.dps to COMPUTE_DPS (default 50)
    ...
    w.add_data("alpha", fmt(alpha))   # serialize at OUTPUT_DPS

Or with explicit per-script override::

    set_compute_dps(60)         # raise compute precision
    fmt(x, dps=50)              # override output dps for one value

WHY
---

mp.mp.dps controls the working precision of mpmath operations.  The
last few digits of any mp.mpf are inherently floor noise that varies
by:

  - mpmath version (the noise grows/shrinks with internal table sizes)
  - OS / libm version (transcendental functions like ``mp.sqrt`` lean
    on libm in some code paths)
  - Python interpreter rebuilds

Serializing values at full mp.dps with ``str(mpf)`` exposes those
trailing noise digits in committed witness JSON, which then drifts
between CI and local environments — producing reproducibility CI
failures even when the *physics* is bit-stable to ~45 digits.

The convention: COMPUTE at OUTPUT_DPS + GUARD digits, SERIALIZE at
OUTPUT_DPS.  GUARD = 10 by default (well below the precision a
single ``str(mpf)`` would expose).

ENVIRONMENT OVERRIDES
---------------------

Per-process overrides (useful in CI / sanity checks)::

    QOU_COMPUTE_DPS=60   python3 script.py     # raise compute precision
    QOU_OUTPUT_DPS=45    python3 script.py     # raise output precision
    QOU_PRECISION_GUARD=15  python3 script.py  # raise guard separately

CONSTANTS
---------

  COMPUTE_DPS_DEFAULT   = 70   (mp.mp.dps target)
  OUTPUT_DPS_DEFAULT    = 60   (serialization precision)
  PRECISION_GUARD_DEFAULT = 10 (COMPUTE = OUTPUT + GUARD)

  2026-05-31 (PR #1595 via 1ppq-qbeta queue probe-precision-headroom-bump):
  Bumped from 50/40/10 → 70/60/10. Rationale: 1 ppQ target (10⁻¹⁵)
  requires only 15 dps; previous defaults (65/50/15) already gave
  35 orders of magnitude headroom. New 70/60/10 gives 45 orders of
  magnitude headroom — pure future-proofing for sub-ppQ precision
  goals (1 part per quintillion = 10⁻¹⁸ → N ≥ log₁₀(10¹⁸)/2.07 − 1 ≈ 8
  rungs of the Q_β ladder, per qbeta_ck_truncation_order_analysis.py).
  Existing witnesses do NOT need regen — they remain mathematically
  valid at 50 dps. Future witnesses pick up the new defaults
  organically as scripts re-run.
"""
from __future__ import annotations

import os
from typing import Any
from mpmath import mp, mpf

# ── Defaults ────────────────────────────────────────────────────
# Bumped 2026-05-31 (PR #1595): 50→60 output, 65→70 compute. See
# top-of-file note. Existing witnesses don't need regen; new ones
# pick up the higher precision organically.
PRECISION_GUARD_DEFAULT: int = 10
OUTPUT_DPS_DEFAULT: int = 60
COMPUTE_DPS_DEFAULT: int = OUTPUT_DPS_DEFAULT + PRECISION_GUARD_DEFAULT  # 70

# ── Environment overrides ───────────────────────────────────────
def _env_int(key: str, default: int, minimum: int = 1) -> int:
    """Read a positive int from env ``key``, falling back to ``default``.

    Rejects unparseable values *and* values below ``minimum`` (default
    1) — ``mp.nstr(..., 0)`` raises and ``mp.dps = 0`` is meaningless,
    so we never accept ≤ 0 even when explicitly set in the env.
    """
    v = os.environ.get(key)
    if not v:
        return default
    try:
        parsed = int(v)
    except ValueError:
        return default
    if parsed < minimum:
        return default
    return parsed


COMPUTE_DPS: int = _env_int("QOU_COMPUTE_DPS", COMPUTE_DPS_DEFAULT)
OUTPUT_DPS: int = _env_int("QOU_OUTPUT_DPS", OUTPUT_DPS_DEFAULT)
PRECISION_GUARD: int = _env_int("QOU_PRECISION_GUARD", PRECISION_GUARD_DEFAULT)

# Auto-correct if env vars combine to violate guard
if COMPUTE_DPS - OUTPUT_DPS < PRECISION_GUARD:
    # Bump COMPUTE_DPS to keep the guard
    COMPUTE_DPS = OUTPUT_DPS + PRECISION_GUARD


def set_compute_dps(dps: int | None = None) -> int:
    """Set ``mp.mp.dps`` to ``dps`` (or ``COMPUTE_DPS`` if ``None``).

    Returns the actual value of ``mp.mp.dps`` after the set.
    Idempotent.
    """
    if dps is None:
        dps = COMPUTE_DPS
    mp.dps = dps
    return mp.dps


def fmt(value: Any, dps: int | None = None, strip_zeros: bool = False) -> str:
    """Serialize an mpmath value to its output-precision string form.

    Uses ``mp.nstr`` with ``OUTPUT_DPS`` (default) or an explicit per-
    call override.  ``strip_zeros=False`` keeps trailing zeros so
    JSON byte-stability is preserved across runs.

    Routing:

    - ``mpf`` (real) and ``mpc`` (complex): formatted via ``mp.nstr``
      at the requested precision — the canonical numeric path.
    - Everything else (``int``, ``float``, ``str``, ``Path``, lists,
      dicts, ``None``, …): short-circuited to ``str(value)`` without
      touching ``mp.nstr``.  ``int`` and ``float`` get their natural
      Python repr (no spurious mpf-promotion noise on a 0.1-style
      float).  Use ``str(...)`` directly for non-numeric witness
      fields; ``fmt`` tolerates them only as a safety net.
    """
    if dps is None:
        dps = OUTPUT_DPS
    from mpmath import mpc  # local import: mpc is rarely needed
    if isinstance(value, (mpf, mpc)):
        return mp.nstr(value, dps, strip_zeros=strip_zeros)
    return str(value)
