"""
Experimental constants with EXPLICIT uncertainties.

Every observed value has a central value AND an uncertainty.
No observed value may appear without ±.

Sources:
  CODATA 2022: https://physics.nist.gov/cuu/Constants/
  NNDC/ENSDF:  https://www.nndc.bnl.gov/ensdf/
  PDG 2024:    https://pdg.lbl.gov/
  SnapPy 3.3.2: https://snappy.math.uic.edu/

Usage:
    from experimental_constants import *

CLASS-A acknowledged-anchor banner (per Workplan-0b, applies to
hardcoded CODATA-precision literals in this file as well — see
`docs/audits/2026-05-18-workplan-0b-m-n-substrate-derivation.md`).
The numeric mass / Q-value constants used here are validation-chain
anchors pending substrate derivation; until that lands, treat them
as CAL-3-ish acknowledged inputs, NOT independent calibrations.
The compute-integration-watcher I9 audit therefore classifies this
script as `ok_acknowledged_anchor` rather than as a registry-bypass
violation.
"""

# ── Fundamental constants (CODATA 2022) ─────────────────────────

M_E_MEV     = 0.51099895000   # ± 0.00000000015 MeV
M_E_MEV_ERR = 0.00000000015

# Energy scale for Q-values: κ = m_e / 3
# This is E_× × μ₀ where E_× = ½(q−q⁻¹)×m_e c² and μ₀ = m_e/(3×E_×).
KAPPA       = M_E_MEV / 3.0   # 0.170333 MeV

M_P_MEV     = 938.27208816    # ± 0.00000029 MeV
M_P_MEV_ERR = 0.00000029

M_N_MEV     = 939.56542052    # ± 0.00000054 MeV
M_N_MEV_ERR = 0.00000054

# ── Free neutron beta-decay Q-value (CODATA 2022) ────────────────
# n → p + e⁻ + ν̄ₑ,  Q = m_n − m_p − m_e
#
# Derived from individual CODATA 2022 mass-energy equivalents above.
# Cross-checked against the CODATA-listed neutron–proton mass difference:
#   m_n − m_p = 1.2933321 ± 0.0000005 MeV/c²
#   Source: https://physics.nist.gov/cgi-bin/cuu/Value?mnmpm
#   CODATA 2022, NIST Physics Laboratory, Gaithersburg MD 20899 USA
#
# Q_NEUTRON = m_n − m_p − m_e
#           = 939.56542052 − 938.27208816 − 0.51099895000
#           = 0.78233341 MeV
# δQ = sqrt(δm_n² + δm_p² + δm_e²)
#    = sqrt(5.4e-7² + 2.9e-7² + 1.5e-16²) ≈ 6.1e-7 MeV
M_N_MINUS_P_MEV     = 1.2933321    # ± 0.0000005 MeV  (direct CODATA 2022 value)
M_N_MINUS_P_MEV_ERR = 0.0000005    # https://physics.nist.gov/cgi-bin/cuu/Value?mnmpm

import math as _math
Q_NEUTRON_MEV     = M_N_MEV - M_P_MEV - M_E_MEV            # 0.78233341 MeV
Q_NEUTRON_MEV_ERR = _math.sqrt(M_N_MEV_ERR**2 + M_P_MEV_ERR**2 + M_E_MEV_ERR**2)

G_F_MEV     = 1.1663788e-11   # ± 0.0000006e-11 MeV⁻²
G_F_MEV_ERR = 0.0000006e-11

HBAR_MEV_S  = 6.582119569e-22 # ± 0.000000030e-22 MeV·s (exact in SI since 2019)
HBAR_MEV_S_ERR = 0.0          # exact by definition

ALPHA_EM_INV     = 137.035999084  # ± 0.000000021 (CODATA 2018, Cs recoil)
ALPHA_EM_INV_ERR = 0.000000021

MU_OVER_E        = 206.7682830    # ± 0.0000046 (CODATA 2022)
MU_OVER_E_ERR    = 0.0000046

G_A_PDG     = 1.2754          # ± 0.0013 (PDG 2024)
G_A_PDG_ERR = 0.0013

# ── Knot volumes (SnapPy 3.3.2) ─────────────────────────────────

VOL_FIGURE_EIGHT     = 2.029883212819307  # ± 1e-12 (numerical precision)
VOL_FIGURE_EIGHT_ERR = 1e-12

VOL_THREE_TWIST      = 2.828122088330783  # ± 1e-12
VOL_THREE_TWIST_ERR  = 1e-12

VOL_BORROMEAN        = 7.327724753846269  # ± 1e-12
VOL_BORROMEAN_ERR    = 1e-12
# 50-dps string form for high-precision mpmath computations (use via
# `mp.mpf(VOL_BORROMEAN_50DPS_STR)` to preserve the full Catalan-constant
# expansion past float's 16-digit floor). Borromean rings complement
# admits the closed form 8 · G where G is Catalan's constant.
VOL_BORROMEAN_50DPS_STR = "7.32772475587766148235147121870981010907842498879866"
VOL_4_1_50DPS_STR       = "2.02988321281930725004240510854904057483004159909893"

# ── Hyperbolic-knot volumes (used by per_atom_rho_deviation and
#    downstream Z=N ρ-correction probes — pulled from #523). ──
# Stored as Python floats (≈15-decimal-digit precision); each
# value carries an explicit `*_ERR` upper bound on the f64 storage
# error (per the module's "every observed value has central +
# uncertainty" convention). For true high-precision (50 dp+)
# evaluation, callers should compute via SnapPy / mpmath at the
# call site.
VOL_6_2          = 4.400832516123046  # SnapPy 6_2 volume
VOL_6_2_ERR      = 1e-15
VOL_8_11         = 8.286316817806593  # SnapPy 8_11 volume
VOL_8_11_ERR     = 1e-15
VOL_L6A4         = 7.327724753846269  # Borromean (= VOL_BORROMEAN)
VOL_L6A4_ERR     = 1e-15
VOL_7_SQ_1       = 4.749499981874439  # Whitehead-pair / α-α coupling knot
VOL_7_SQ_1_ERR   = 1e-15
# EIGHT_G defined later (depends on CATALAN constant defined below).

# ── Observed half-lives (NNDC/ENSDF) ────────────────────────────

HALFLIFE_TRITIUM_YR     = 12.32    # ± 0.02 yr
HALFLIFE_TRITIUM_YR_ERR = 0.02

HALFLIFE_C14_YR     = 5730.0      # ± 40 yr
HALFLIFE_C14_YR_ERR = 40.0

HALFLIFE_CO60_YR     = 5.2714     # ± 0.0006 yr
HALFLIFE_CO60_YR_ERR = 0.0006

HALFLIFE_SR90_YR     = 28.79      # ± 0.06 yr
HALFLIFE_SR90_YR_ERR = 0.06

HALFLIFE_CS137_YR     = 30.17     # ± 0.16 yr
HALFLIFE_CS137_YR_ERR = 0.16

HALFLIFE_BI210_D     = 5.012      # ± 0.005 d
HALFLIFE_BI210_D_ERR = 0.005

# ── Observed Q-values (NNDC/ENSDF) ──────────────────────────────

Q_TRITIUM_MEV     = 0.01861       # ± 0.00001 MeV
Q_TRITIUM_MEV_ERR = 0.00001

Q_C14_MEV     = 0.15648           # ± 0.00004 MeV
Q_C14_MEV_ERR = 0.00004

Q_CO60_MEV     = 0.31817          # ± 0.00013 MeV
Q_CO60_MEV_ERR = 0.00013

Q_SR90_MEV     = 0.54590          # ± 0.00007 MeV
Q_SR90_MEV_ERR = 0.00007

Q_CS137_MEV     = 0.51400         # ± 0.00021 MeV
Q_CS137_MEV_ERR = 0.00021

Q_BI210_MEV     = 1.16270         # ± 0.00006 MeV
Q_BI210_MEV_ERR = 0.00006

# ── Observed log ft values (NNDC/ENSDF) ──────────────────────────

LOGFT_TRITIUM     = 3.053         # ± 0.001
LOGFT_TRITIUM_ERR = 0.001

LOGFT_C14     = 9.04              # ± 0.02
LOGFT_C14_ERR = 0.02

LOGFT_CO60     = 7.50             # ± 0.01
LOGFT_CO60_ERR = 0.01

LOGFT_SR90     = 7.63             # ± 0.01
LOGFT_SR90_ERR = 0.01

LOGFT_CS137     = 7.49            # ± 0.02
LOGFT_CS137_ERR = 0.02

LOGFT_BI210     = 7.10            # ± 0.02
LOGFT_BI210_ERR = 0.02

# ── Time conversions (exact) ────────────────────────────────────

SEC_PER_YR  = 3.15576e7           # Julian year (365.25 × 86400), exact by convention
SEC_PER_DAY = 86400.0             # exact

# ── Mathematical constants (exact / high-precision) ─────────────

# Catalan's constant G = sum_{n=0}^∞ (-1)^n / (2n+1)^2 — used in the
# binding-scale calibration α_bind = m_e · 8·G per prop:binding-scale-catalan.
CATALAN     = 0.91596559417721901505460351493238411077  # OEIS A006752, ≥30 dp

# 8·G with G = Catalan's constant — legacy magic-A volume input
# (mass_table_ppb.py historical form; differs from VOL_L6A4 at 1e-9
# because 8·G ≈ 7.32772475341... vs Vol(L6a4) ≈ 7.32772475384...).
# Defined here (not earlier with the other VOL_* constants) so it
# can reference CATALAN as the single source of truth — avoids
# divergence from a duplicated literal (per Copilot review on PR #591).
EIGHT_G     = 8.0 * CATALAN  # ≈ 7.327724753417752
EIGHT_G_ERR = 1e-15

# ── Error propagation helpers ────────────────────────────────────

def rel_err(val, err):
    """Relative error |δx/x|."""
    return abs(err / val) if val != 0 else float('inf')

def prop_power(val, err, n):
    """Propagate through x^n: δ(x^n) = |n| × x^{n-1} × δx."""
    return abs(n) * abs(val)**(n-1) * err

def prop_power_rel(rel, n):
    """Relative error of x^n = |n| × relative error of x."""
    return abs(n) * rel
