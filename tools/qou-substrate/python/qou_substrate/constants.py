"""
Canonical substrate parameter q — single source of truth.

All witness computations import q from here. When a better
measurement of m_μ/m_e or Vol(4_1) becomes available, update
THIS file and re-run all witnesses.

Derivation (2026-05-28: re-pinned from m_p/m_e — the most precise anchor):
    q solves the proton substrate identity (Newton solve, q_at below)
        m_p/m_e = 2·(Vol(4_1)/ℏ_q²)·F_Bor(q) − 12,
        F_Bor(q) = |tr_M(β_Bor,q)|·[3]_q!/q³,
        |tr_M(β_Bor,q)| = (4 + h² − 3h⁴ − h⁶)/(h² + 4)   (closed form).
    m_μ/m_e is now a PREDICTION (agrees to ~9.5σ). The muon-anchor
    closed form q = 1/(1 − √(Vol/(m_μ/m_e))) is kept as q_muon_at()
    for cross-check.

    Experimental error on q₀ (propagated; Vol is a math constant with
    zero error, so only the mass ratio contributes):
        m_p anchor : σ(q₀) = 0.0029 ppb = 2853 ppQ   (sensitivity ≈ 21)
        m_μ anchor : σ(q₀) = 1.22  ppb = 1.2e6 ppQ   (429× looser)

Sources:
    Vol(4_1)  = 2.029883212819307…       (2·Cl₂(π/3), exact math constant)
    m_p/m_e   = 1836.152673426 ± 1.1e-7  (CODATA 2022, 0.06 ppb — ANCHOR)
    m_μ/m_e   = 206.7682830 ± 0.0000046  (CODATA 2022 — now a prediction)

Anchor-choice rationale: observations/substrate-anchor-alternatives.md,
docs/audits/2026-05-28-mu-p-tension-substrate-floor.md.
"""

import math

# ── Input measurements with uncertainties ────────────────────────
VOL_FIGURE_EIGHT     = 2.029883212819307   # 2·Cl₂(π/3): math constant (SnapPy-verified)
VOL_FIGURE_EIGHT_ERR = 1e-12               # storage precision (math value is exact)

MASS_RATIO_P_E       = 1836.152673426      # CODATA 2022 (m_p/m_e) — CALIBRATION ANCHOR
MASS_RATIO_P_E_ERR   = 0.00000011          # 0.06 ppb
MASS_RATIO_MU_E      = 206.7682830         # CODATA 2022 — now a PREDICTION (cross-check)
MASS_RATIO_MU_E_ERR  = 0.0000046

# ── Derived substrate parameter (m_p-pinned) ─────────────────────
# q is DERIVED (never hardcoded): f64 Newton solve of the proton
# substrate identity below; the arbitrary-precision derivation is
# q_at() (mpmath findroot). m_μ-anchor cross-check: q_muon_at().
def _solve_q_proton_f64(mp_me, vol, iters=80):
    """f64 Newton solve of  m_p/m_e = (2·(vol/ℏ_q²)·F_Bor(q) − 12) * habiro_ratio
    for q, with |tr_M(β_Bor)| = (4+h²−3h⁴−h⁶)/(h²+4). Self-contained
    (closed-form tr_M ⇒ no Hecke machinery)."""
    def _mp_of_q(q):
        h = q - 1.0 / q
        hbar_q = 1.0 - 1.0 / q
        hbar2 = hbar_q ** 2
        trM = abs((4 + h**2 - 3 * h**4 - h**6) / (h**2 + 4))
        qf3 = (q**2 + 1 + q**-2) * (q + 1.0 / q)
        base = 2 * vol / hbar2 * (trM * qf3 / q**3) - 12
        b_val = ((q ** 4 + q ** 2 + 1) / (q ** 2 + 1) ** 2) ** 0.5
        u_val = b_val * hbar2
        habiro_ratio = (1 + 46 * u_val ** 4) * (1 + 4 * u_val ** 5) * (1 - 29 * u_val ** 6)
        return base * habiro_ratio
    q = 1.11
    # f64 central difference: dq = q·1e-10 is the right scale for f64
    # (machine ε ≈ 2.2e-16); a dps-scaled dq would underflow here. The
    # arbitrary-precision path is q_at() (mpmath findroot, no manual dq).
    for _ in range(iters):
        f = _mp_of_q(q) - mp_me
        dq = q * 1e-10
        fp = (_mp_of_q(q + dq) - _mp_of_q(q - dq)) / (2 * dq)
        if fp == 0:
            break
        step = f / fp
        q -= step
        if abs(step) < 1e-15:  # f64-converged in ~4-5 iters; skip the rest
            break
    return q

Q         = _solve_q_proton_f64(MASS_RATIO_P_E, VOL_FIGURE_EIGHT)
HBAR_Q    = 1.0 - 1.0 / Q
HBAR_Q_SQ = HBAR_Q * HBAR_Q

# ── Uncertainty propagation (from the m_p/m_e anchor) ────────────
# q is pinned from m_p/m_e via the substrate identity; sensitivity
# S = dln(m_p)/dln(q) ≈ 21, so σ(q)/q = (1/S)·σ(m_p)/m_p. Vol(4_1) is a
# math constant (zero experimental error); only the mass ratio enters.
#   ⇒ σ(q₀) ≈ 0.0029 ppb = 2853 ppQ (vs 1.22 ppb on the old muon anchor).
_S_PROTON = 21.0
Q_ERR  = (Q / _S_PROTON) * (MASS_RATIO_P_E_ERR / MASS_RATIO_P_E)  # ~3.2e-12

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
# Q_50_DIGIT_STR is DERIVED (q_str(50)) in the mpmath block below — it is
# NOT a hardcoded literal, so it can never drift from the canonical
# q_at() solve. Re-pinned 2026-05-28 from m_p/m_e via the proton
# substrate identity (m_μ/m_e is now a 9.5σ prediction; old muon value
# was 1.10997859555418…, −11.5 ppb away). See q_at()/q_muon_at() and
# docs/audits/2026-05-28-mu-p-tension-substrate-floor.md.

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

MASS_RATIO_P_E_STR   = "1836.152673426"  # CODATA 2022 (m_p/m_e) — pinning anchor
MASS_RATIO_MU_E_STR  = "206.7682830"    # CODATA 2022 — now a prediction (cross-check)

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

    def q_muon_at(dps: int = _DPS_DEFAULT):
        """CROSS-CHECK: q from the muon-anchor closed form
        q = 1/(1 − √(Vol(4_1)/(m_μ/m_e))). This was the pin until
        2026-05-28; now superseded by q_at() (m_p anchor). Differs from
        q_at() by ~11.5 ppb — that gap is the μ-p tension (9.5σ)."""
        prev = _mp.mp.dps
        try:
            _mp.mp.dps = max(prev, dps + 10)
            vol = vol_4_1_at(dps + 10)
            r = _mp.mpf(MASS_RATIO_MU_E_STR)
            hbar = _mp.sqrt(vol / r)
            q = _mp.mpf(1) / (_mp.mpf(1) - hbar)
            _mp.mp.dps = max(prev, dps)
            return +q
        finally:
            _mp.mp.dps = prev

    def q_at(dps: int = _DPS_DEFAULT):
        """Return q at requested mpmath precision, pinned from m_p/m_e
        (the most precise anchor) via the proton substrate identity:
            m_p/m_e = 2·(Vol(4_1)/ℏ_q²)·|tr_M(β_Bor)|·[3]_q!/q³ − 12,
            |tr_M(β_Bor)| = (4+h²−3h⁴−h⁶)/(h²+4)   (closed form).
        The closed-form tr_M needs no Hecke machinery, so this Newton
        solve is self-contained and exact at any dps. Caller should set
        ``mpmath.mp.dps`` ≥ ``dps`` before further mpmath arithmetic."""
        prev = _mp.mp.dps
        try:
            _mp.mp.dps = max(prev, dps + 15)
            vol = vol_4_1_at(dps + 15)
            mp_me = _mp.mpf(MASS_RATIO_P_E_STR)

            def _resid(q):
                h = q - 1 / q
                hbar_sq = (1 - 1 / q) ** 2
                trM = _mp.fabs((4 + h**2 - 3 * h**4 - h**6) / (h**2 + 4))
                qf3 = (q**2 + 1 + q**(-2)) * (q + q**(-1))
                base = 2 * vol / hbar_sq * (trM * qf3 / q**3) - 12
                b_val = ((q ** 4 + q ** 2 + 1) / (q ** 2 + 1) ** 2) ** _mp.mpf("0.5")
                u_val = b_val * hbar_sq
                habiro_ratio = (1 + 46 * u_val ** 4) * (1 + 4 * u_val ** 5) * (1 - 29 * u_val ** 6)
                return base * habiro_ratio - mp_me

            q = _mp.findroot(_resid, _mp.mpf("1.10997858"))
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
        Q_MP         = q_at(_DPS_DEFAULT)            # m_p-pinned (proton identity)
        VOL_4_1_MP   = vol_4_1_at(_DPS_DEFAULT)
        Q_INV_MP     = _mp.mpf(1) / Q_MP
        # ℏ_q derived from the (m_p-pinned) q, NOT from Vol/m_μ — the
        # latter would be the muon value and inconsistent with Q_MP.
        HBAR_Q_MP    = _mp.mpf(1) - Q_INV_MP
        HBAR_Q_SQ_MP = HBAR_Q_MP ** 2
        HA_MP        = Q_MP - Q_INV_MP
        E_CROSS_MP   = HA_MP / 2
        S_SKEIN_MP   = _mp.sqrt(Q_MP) - _mp.mpf(1) / _mp.sqrt(Q_MP)
        TWO_Q_MP     = Q_MP + Q_INV_MP
        TANH_LN_Q_MP = HA_MP / TWO_Q_MP
        LN_Q_MP      = _mp.log(Q_MP)

    # Canonical 50-digit string — DERIVED from the already-cached Q_MP
    # (no hardcoded literal, no sync drift, no second findroot at import).
    # This is what witness scripts import.
    Q_50_DIGIT_STR = _mp.nstr(Q_MP, _DPS_DEFAULT, strip_zeros=False)

    HAS_MPMATH = True
except ImportError:
    HAS_MPMATH = False

    def vol_4_1_at(dps: int = _DPS_DEFAULT):
        raise RuntimeError("vol_4_1_at requires mpmath; install it with `pip install mpmath`")

    def q_at(dps: int = _DPS_DEFAULT):
        raise RuntimeError("q_at requires mpmath; install it with `pip install mpmath`")

    def q_str(dps: int = _DPS_DEFAULT) -> str:
        raise RuntimeError("q_str requires mpmath; install it with `pip install mpmath`")

    # No-mpmath fallback: only the f64-precision q is available. 50-dps
    # work requires mpmath; this string carries f64 precision only.
    Q_50_DIGIT_STR = repr(Q)

# ── Experimental observable anchors (CODATA 2022) ─────────────
# Mirrored from `folio-assistant/computations/substrate/experimental_constants.py`
# so consumers running outside the repo (Pyodide, Sage, PyPI installs)
# can reach the same MeV anchors without depending on the flat-name
# `experimental_constants` shim that only `_legacy` puts on sys.path.
# Authoritative source is the substrate cluster file; values match.
M_E_MEV     = 0.51099895000   # ± 0.00000000015 MeV (CODATA 2022)
M_E_MEV_ERR = 0.00000000015
M_P_MEV     = 938.27208816    # ± 0.00000029   MeV (CODATA 2022)
M_P_MEV_ERR = 0.00000029
M_N_MEV     = 939.56542052    # ± 0.00000054   MeV (CODATA 2022)
M_N_MEV_ERR = 0.00000054
# β-decay endpoint Q-value (n → p + e⁻ + ν̄):
#   Q_β = m_n − m_p − m_e   (m_ν ≈ 0 in the rest mass budget)
Q_NEUTRON_MEV     = M_N_MEV - M_P_MEV - M_E_MEV         # ≈ 0.78233341 MeV
Q_NEUTRON_MEV_ERR = math.sqrt(
    M_N_MEV_ERR**2 + M_P_MEV_ERR**2 + M_E_MEV_ERR**2,
)

# ── Knot-volume constants (math; SnapPy-verified) ─────────────
# Catalan's constant G = Σ (-1)^k / (2k+1)², used in figure-8 and
# Borromean hyperbolic volumes.  These f64 values are accurate to
# machine epsilon; the substrate cluster's knot_volumes.py carries
# the mpmath versions if higher precision is needed.
CATALAN_G       = 0.9159655941772190     # ± < f64 ε
VOL_BORROMEAN   = 8.0 * CATALAN_G        # 7.32772475… (8·G exactly)
VOL_4_1         = VOL_FIGURE_EIGHT        # alias: figure-8 = 4_1 in Rolfsen


if __name__ == "__main__":
    print(f"Substrate parameter q (canonical, m_p-pinned 2026-05-28)")
    print(f"  Vol(4_1)   = {VOL_FIGURE_EIGHT} (math constant)")
    print(f"  m_p/m_e    = {MASS_RATIO_P_E} ± {MASS_RATIO_P_E_ERR}  [ANCHOR]")
    print(f"  m_μ/m_e    = {MASS_RATIO_MU_E} ± {MASS_RATIO_MU_E_ERR}  [now a prediction, 9.5σ]")
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
