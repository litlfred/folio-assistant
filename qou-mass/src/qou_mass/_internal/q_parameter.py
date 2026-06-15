"""
Canonical substrate parameter q — single source of truth.

All witness computations import q from here. When a better
measurement of m_μ/m_e or Vol(4_1) becomes available, update
THIS file and re-run all witnesses.

Derivation:
    ℏ_q² = Vol(4_1) / (m_μ/m_e)
    ℏ_q = 1 - q⁻¹
    q = 1 / (1 - ℏ_q)

Sources:
    Vol(4_1) = 2.029883212819307 ± 1e-12  (SnapPy 3.3.2, numerical precision)
    m_μ/m_e  = 206.7682830 ± 0.0000046    (CODATA 2022)
"""

import math

# ── Input measurements with uncertainties ────────────────────────
VOL_FIGURE_EIGHT     = 2.029883212819307   # SnapPy 3.3.2 (verified to 15 digits)
VOL_FIGURE_EIGHT_ERR = 1e-12               # numerical precision of SnapPy

MASS_RATIO_MU_E      = 206.7682830         # CODATA 2022
MASS_RATIO_MU_E_ERR  = 0.0000046           # CODATA 2022 uncertainty

# ── Derived substrate parameter ──────────────────────────────────
HBAR_Q_SQ = VOL_FIGURE_EIGHT / MASS_RATIO_MU_E
HBAR_Q    = math.sqrt(HBAR_Q_SQ)
Q         = 1.0 / (1.0 - HBAR_Q)

# ── Uncertainty propagation ──────────────────────────────────────
# q = 1/(1 - sqrt(V/R)) where V = Vol(4_1), R = m_μ/m_e
# dq/dR = q² × sqrt(V/R) / (2R)
# dq/dV = -q² × 1/(2R × sqrt(V/R)) ... but Vol is exact to 1e-12
# Dominant uncertainty comes from CODATA mass ratio:
_dq_dR = Q**2 * math.sqrt(VOL_FIGURE_EIGHT / MASS_RATIO_MU_E) / (2 * MASS_RATIO_MU_E)
Q_ERR  = _dq_dR * MASS_RATIO_MU_E_ERR  # ~ 1.3e-8

# ── Derived constants from q ─────────────────────────────────────
Q_INV     = 1.0 / Q
HA        = Q - Q_INV                        # q - q⁻¹
E_CROSS   = 0.5 * HA                         # crossing energy ½(q - q⁻¹)
S_SKEIN   = math.sqrt(Q) - 1.0/math.sqrt(Q)  # Skein amplitude q^½ - q^{-½}
TWO_Q     = Q + Q_INV                        # [2]_q = q + q⁻¹
TANH_LN_Q = HA / TWO_Q                      # tanh(ln q)
LN_Q      = math.log(Q)                      # ln(q) — for base-q conversions

def log_q(x):
    """Base-q logarithm: log_q(x) = ln(x) / ln(q).
    Maps Skein polynomial ratios to q-integers: log_q(q^n) = n."""
    return math.log(x) / LN_Q

def q_int(n):
    """Quantum integer [n]_q = (q^n - q^{-n}) / (q - q^{-1})."""
    return (Q**n - Q_INV**n) / HA

# ── Error propagation for derived constants ──────────────────────
# All errors are δX = |dX/dq| × Q_ERR
Q_INV_ERR     = Q_ERR / Q**2
HA_ERR        = Q_ERR * (1 + Q_INV**2)          # d(q-q⁻¹)/dq = 1+q⁻²
E_CROSS_ERR   = 0.5 * HA_ERR
S_SKEIN_ERR   = Q_ERR * 0.5 * (Q**(-0.5) + Q**(-1.5))
TWO_Q_ERR     = Q_ERR * abs(1 - Q_INV**2)
TANH_LN_Q_ERR = Q_ERR * 2.0 / TWO_Q**2         # d(tanh)/dq

def q_int_err(n):
    """Uncertainty in [n]_q from Q_ERR."""
    # d[n]_q/dq = (n q^{n-1} + n q^{-n-1}) / (q-q⁻¹)
    #           - (q^n - q^{-n})(1+q⁻²) / (q-q⁻¹)²
    num_deriv = n * (Q**(n-1) + Q_INV**(n+1))
    denom_corr = (Q**n - Q_INV**n) * (1 + Q_INV**2) / HA
    return abs(num_deriv / HA - denom_corr / HA) * Q_ERR

# ── For hecke_engine (exact rational arithmetic) ─────────────────
# The engine uses Fraction(p_num, p_den) where q = p_num/p_den.
# We provide the best rational approximation at the engine's precision.
# 11099786 / 10000000 gives q to 7 significant figures.
Q_RAT_NUM = 11099786
Q_RAT_DEN = 10000000

# ── Centralized high-precision string for q_0 (for mpmath callers) ─
# Derived from CAL-1 (m_μ/m_e) per the three-calibration discipline; this
# is the canonical 50-digit pin used by witness scripts that need
# arbitrary-precision evaluation. Imported by callers to avoid hardcoding
# the literal in many places (per Gemini review on PR #515).
#
# 2026-05-18 (Q6 follow-up): synced with the derived 50-dps value from
# `q-pinning-50-digit.witness.json::derived_50_digit::q` (computed
# from Vol(4_1) + m_μ/m_e via `q_pinning_50_digit.py`). The prior
# hardcoded literal diverged from the witness at digit 15
# (1.10997859555418051695... vs the derived 1.10997859555418057528...),
# producing a ~14-digit precision floor in every downstream mpfr
# computation that imported this string (PR #683 surfaced this via
# the canonical-chi-rust binary's disagreement with the
# atomic-tr-m-mpfr-50dps witness at digit 15).
Q_50_DIGIT_STR = (
    "1.10997859555418057528159407960950937799328227995870"
)

# ── High-precision (mpmath) parallel API ─────────────────────────
# The f64 globals above are bit-identical to what every existing
# witness script reads via `from q_parameter import Q, HBAR_Q, ...`.
# Don't change them — downstream f64 callers depend on stability.
#
# For the Clarabel high-precision / 50-dps work (CLARABEL_PRECISION_PLAN
# §S7), HP callers should use `q_at(dps)` or the `_MP` globals below,
# which carry mpmath.mpf values computed at 50 decimal digits by
# default.  Vol(4_1) is reused at 38-digit precision from
# `alpha_em_pslq_uniqueness.py`; the mass ratio is bounded by CODATA
# 2022's published precision (~7 sig figs).
#
# The mpmath path is bit-identical to f64 in the first ~15 digits
# (SnapPy's Vol limit); past that it is stable but bounded by
# CODATA m_μ/m_e uncertainty.

MASS_RATIO_MU_E_STR  = "206.7682830"   # CODATA 2022, ~7 sig figs (treated as exact for q_0 definition)

_DPS_DEFAULT = 50

# Note: previously this module reused a hardcoded 38-dps string for
# Vol(4_1) from `alpha_em_pslq_uniqueness.py:57`.  That string is
# inaccurate past digit ~30 — its trailing digits do not match the
# Clausen-converged value.  The function `vol_4_1_at` below recomputes
# from scratch at every requested precision, so q is correct at any
# dps the caller asks for.

try:
    import mpmath as _mp

    def vol_4_1_at(dps: int = _DPS_DEFAULT):
        """Hyperbolic volume of the figure-eight knot, computed at
        requested precision.  Identity: Vol(4_1) = 2 Cl_2(π/3) where
        Cl_2 is the Clausen function (mpmath.clsin)."""
        prev = _mp.mp.dps
        try:
            _mp.mp.dps = max(prev, dps + 10)  # +10 guard digits
            vol = 2 * _mp.clsin(2, _mp.pi / 3)
            return +vol  # round to current dps
        finally:
            _mp.mp.dps = prev

    def q_at(dps: int = _DPS_DEFAULT):
        """Return q at requested mpmath precision.  Caller should
        set ``mpmath.mp.dps`` to at least ``dps`` before consuming
        the result if it does further mpmath arithmetic."""
        prev = _mp.mp.dps
        try:
            _mp.mp.dps = max(prev, dps + 10)
            vol = vol_4_1_at(dps + 10)
            r = _mp.mpf(MASS_RATIO_MU_E_STR)
            hbar_sq = vol / r
            hbar = _mp.sqrt(hbar_sq)
            q = _mp.mpf(1) / (_mp.mpf(1) - hbar)
            _mp.mp.dps = max(prev, dps)
            return +q
        finally:
            _mp.mp.dps = prev

    def q_str(dps: int = _DPS_DEFAULT) -> str:
        """Return q as a decimal string at requested precision —
        the canonical witness-JSON / Clarabel-HP serialisation."""
        return _mp.nstr(q_at(dps), dps, strip_zeros=False)

    # Compute the cached _MP globals at the default precision via
    # `mp.workdps` so this module does NOT mutate the caller's
    # `mp.mp.dps`.  Many downstream scripts set `mp.mp.dps` BEFORE
    # importing q_parameter; the previous global assignment silently
    # overrode their precision setting.  workdps restores on exit.
    with _mp.workdps(_DPS_DEFAULT):
        Q_MP         = q_at(_DPS_DEFAULT)
        VOL_4_1_MP   = vol_4_1_at(_DPS_DEFAULT)
        HBAR_Q_SQ_MP = VOL_4_1_MP / _mp.mpf(MASS_RATIO_MU_E_STR)
        HBAR_Q_MP    = _mp.sqrt(HBAR_Q_SQ_MP)
        Q_INV_MP     = _mp.mpf(1) / Q_MP
        HA_MP        = Q_MP - Q_INV_MP
        E_CROSS_MP   = HA_MP / 2
        S_SKEIN_MP   = _mp.sqrt(Q_MP) - _mp.mpf(1) / _mp.sqrt(Q_MP)
        TWO_Q_MP     = Q_MP + Q_INV_MP
        TANH_LN_Q_MP = HA_MP / TWO_Q_MP
        LN_Q_MP      = _mp.log(Q_MP)

    HAS_MPMATH = True
except ImportError:
    HAS_MPMATH = False

    def vol_4_1_at(dps: int = _DPS_DEFAULT):
        raise RuntimeError("vol_4_1_at requires mpmath; install it with `pip install mpmath`")

    def q_at(dps: int = _DPS_DEFAULT):
        raise RuntimeError("q_at requires mpmath; install it with `pip install mpmath`")

    def q_str(dps: int = _DPS_DEFAULT) -> str:
        raise RuntimeError("q_str requires mpmath; install it with `pip install mpmath`")

if __name__ == "__main__":
    print(f"Substrate parameter q (canonical)")
    print(f"  Vol(4_1)   = {VOL_FIGURE_EIGHT} ± {VOL_FIGURE_EIGHT_ERR}")
    print(f"  m_μ/m_e    = {MASS_RATIO_MU_E} ± {MASS_RATIO_MU_E_ERR}")
    print(f"  ℏ_q²       = {HBAR_Q_SQ:.15f}")
    print(f"  ℏ_q        = {HBAR_Q:.15f}")
    print(f"  q          = {Q:.15f} ± {Q_ERR:.2e}")
    print(f"  q⁻¹        = {Q_INV:.15f} ± {Q_INV_ERR:.2e}")
    print(f"  q - q⁻¹    = {HA:.15f} ± {HA_ERR:.2e}")
    print(f"  E_×        = {E_CROSS:.15f} ± {E_CROSS_ERR:.2e}")
    print(f"  s          = {S_SKEIN:.15f} ± {S_SKEIN_ERR:.2e}")
    print(f"  [2]_q      = {TWO_Q:.15f} ± {TWO_Q_ERR:.2e}")
    print(f"  tanh(ln q) = {TANH_LN_Q:.15f} ± {TANH_LN_Q_ERR:.2e}")
    print(f"  [9]_q      = {q_int(9):.10f} ± {q_int_err(9):.2e}")
    print(f"  [10]_q     = {q_int(10):.10f} ± {q_int_err(10):.2e}")
    alpha = Q_INV / (q_int(9) * q_int(10))
    inv_alpha = 1.0 / alpha
    # α error: dα/dq involves all three factors
    alpha_err = alpha * math.sqrt((Q_INV_ERR/Q_INV)**2
                                  + (q_int_err(9)/q_int(9))**2
                                  + (q_int_err(10)/q_int(10))**2)
    print(f"  α          = {alpha:.10f} ± {alpha_err:.2e}")
    print(f"  1/α        = {inv_alpha:.6f} ± {inv_alpha**2 * alpha_err:.4f}")
    print(f"  CODATA 1/α = 137.035999084 ± 0.000000021")
    print(f"  Rational:    {Q_RAT_NUM}/{Q_RAT_DEN}")
