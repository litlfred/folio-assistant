"""
LP-dual solver — first-class infrastructure for operator-selection LPs.

Per `prop:operator-selection-lp`, every knot-operator-selection block
must compute BOTH primal and dual:

    primal: min Σ t_i x_i  s.t.  Σ x_i = n_target,  Gx ≥ 0,  x_i ≥ -M
    dual:   max n_target · y_0  s.t.  y_0 + Σ G_{ji} y_i ≤ t_j,  y_i ≥ 0

The dual variables are the SHADOW PRICES:
    y_0^*  = marginal cost of unit target mass (binding-energy density)
    y_i^*  = saturation price of channel i (zero if slack, positive if tight)

The active demand channels are A = {i : y_i^* > 0} — the
"most receptive sub-braids on the shell".

Strong duality (no LP duality gap):
    Σ t_i x_i^*  =  n_target · y_0^*

This module is the canonical entry point. Any operator-selection
compute SHOULD use `solve_operator_selection_lp` to get a witness
that includes BOTH primal (coefficients) and dual (shadow prices).

The `verify_dual_present` validator checks that any operator-selection
witness JSON includes the required dual fields, so the LP dual
computation cannot be silently omitted again.
"""
from __future__ import annotations

import json
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import numpy as np


@dataclass
class LpDualResult:
    """Both sides of the operator-selection LP, with strong-duality check.

    Required fields per `prop:operator-selection-lp`:
      x_star          — primal optimum (knot operator coefficients)
      y0_star         — dual: shadow price of net constraint
      y_star          — dual: shadow prices of Frobenius constraints (≥ 0)
      active_set      — indices i with y_star[i] > tol
      primal_obj      — Σ t_i x_i^*
      dual_obj        — n_target · y0^*
      duality_gap     — |primal_obj - dual_obj|  (should be ~0)
    """
    x_star: list[float]
    y0_star: float
    y_star: list[float]
    active_set: list[int]
    primal_obj: float
    dual_obj: float
    duality_gap: float
    feasible: bool

    def to_dict(self) -> dict:
        return {
            "x_star": list(self.x_star),
            "y0_star": float(self.y0_star),
            "y_star": list(self.y_star),
            "active_set": list(self.active_set),
            "primal_obj": float(self.primal_obj),
            "dual_obj": float(self.dual_obj),
            "duality_gap": float(self.duality_gap),
            "feasible": bool(self.feasible),
        }


def solve_frobenius_dual_lp(
    t: np.ndarray,
    G: np.ndarray,
    n_target: float,
    u_demand: np.ndarray,
    *,
    M_bound: float = 1e6,
    dual_tol: float = 1e-9,
) -> LpDualResult:
    """Frobenius-dual minimum-action LP — TIGHTER than the basic
    Gx ≥ 0 inequality formulation.

    Problem:
        min t · x
        s.t. 1ᵀ x = n_target
             G x = u_demand          (equality, not inequality)

    The equality on G x = u_demand selects the unique x whose
    Frobenius pairing with the basis matches a target "demand
    vector" u_demand (typically the demand profile at the magic
    shell). This is the closed-form Frobenius-dual minimum-action
    formulation per `confinement-operator-selection.py`.

    Dual:
        max n_target · y_0 + u_demand · y
        s.t. y_0 · 1 + Gᵀ y = t      (no positivity on y here)

    Both y_0 and the y vector are returned; strong duality verified.
    """
    from scipy.optimize import linprog

    t = np.asarray(t, dtype=float)
    G = np.asarray(G, dtype=float)
    u = np.asarray(u_demand, dtype=float)
    d = len(t)

    c = t.copy()
    # Combined equalities: net + Frobenius-dual demand
    A_eq = np.vstack([np.ones((1, d)), G])
    b_eq = np.concatenate([[n_target], u])
    res = linprog(
        c=c, A_eq=A_eq, b_eq=b_eq,
        bounds=[(-M_bound, None)] * d,
        method="highs",
    )
    if not res.success:
        return LpDualResult(
            x_star=[float("nan")] * d,
            y0_star=float("nan"),
            y_star=[float("nan")] * d,
            active_set=[],
            primal_obj=float("nan"),
            dual_obj=float("nan"),
            duality_gap=float("nan"),
            feasible=False,
        )

    x_star = np.asarray(res.x)
    primal_obj = float(c @ x_star)
    # eq.marginals: first is y_0, remaining d are y_i
    eq_marginals = np.asarray(res.eqlin.marginals)
    y0_star = float(eq_marginals[0])
    y_star = eq_marginals[1:].tolist()
    active_set = [i for i, y in enumerate(y_star) if abs(y) > dual_tol]
    dual_obj = float(n_target * y0_star + u @ np.asarray(y_star))
    duality_gap = abs(primal_obj - dual_obj)

    return LpDualResult(
        x_star=list(x_star),
        y0_star=y0_star,
        y_star=y_star,
        active_set=active_set,
        primal_obj=primal_obj,
        dual_obj=dual_obj,
        duality_gap=duality_gap,
        feasible=True,
    )


def _find_clarabel_lp_bin(explicit: Optional[str] = None) -> str:
    """Locate the ``clarabel-operator-selection-lp`` binary.

    Search order: explicit arg, ``$QOU_CLARABEL_LP_BIN``, then the known
    ``tools/hecke-engine/target/release/`` path walking up from this file.
    """
    import os

    if explicit:
        return explicit
    env = os.environ.get("QOU_CLARABEL_LP_BIN")
    if env:
        return env
    rel = Path("tools") / "hecke-engine" / "target" / "release" / "clarabel-operator-selection-lp"
    for parent in Path(__file__).resolve().parents:
        cand = parent / rel
        if cand.exists():
            return str(cand)
    raise FileNotFoundError(
        "clarabel-operator-selection-lp not found. Build it via\n"
        "  cargo build --release --manifest-path tools/hecke-engine/Cargo.toml "
        "--features clarabel-mpfr --bin clarabel-operator-selection-lp\n"
        "or set $QOU_CLARABEL_LP_BIN."
    )


def _lp_result_from_dict(out: dict, d: int) -> LpDualResult:
    """Build an ``LpDualResult`` from the clarabel binding/CLI output dict."""
    if not out or "error" in out or not out.get("feasible", False):
        return LpDualResult(
            x_star=[float("nan")] * d, y0_star=float("nan"),
            y_star=[float("nan")] * d, active_set=[],
            primal_obj=float("nan"), dual_obj=float("nan"),
            duality_gap=float("nan"), feasible=False,
        )
    return LpDualResult(
        x_star=[float(v) for v in out["x_star"]],
        y0_star=float(out["y0_star"]),
        y_star=[float(v) for v in out["y_star"]],
        active_set=[int(i) for i in out["active_set"]],
        primal_obj=float(out["primal_obj"]),
        dual_obj=float(out["dual_obj"]),
        duality_gap=float(out["duality_gap"]),
        feasible=True,
    )


def _solve_operator_selection_lp_clarabel(
    t: np.ndarray,
    G: np.ndarray,
    n_target: float,
    *,
    M_bound: float = 1e6,
    dual_tol: float = 1e-9,
    prec_bits: int = 167,
    clarabel_bin: Optional[str] = None,
) -> LpDualResult:
    """EXPERIMENTAL: solve at ``prec_bits`` MPFR precision (≈50 dps) via
    Clarabel — the in-process ``pyhecke_native.operator_selection_lp`` PyO3
    binding when the installed wheel carries it (built with
    ``--features clarabel-lp``), else the ``clarabel-operator-selection-lp``
    CLI (subprocess).

    Values cross the boundary as decimal strings, so the marshalling adds no
    f64 truncation (the *inputs* are still f64 here because callers pass
    ``np.ndarray``; pass 50-dps strings upstream for full precision).

    NOT yet cross-checked against the scipy backend to 1e-25 — that needs a
    scipy+numpy environment.  The scipy backend therefore remains the
    default; this path is opt-in via ``backend="clarabel"``.
    """
    t = np.asarray(t, dtype=float)
    G = np.asarray(G, dtype=float)
    d = len(t)
    assert G.shape == (d, d), f"Gram matrix shape {G.shape} ≠ ({d},{d})"

    # Decimal-string marshalling (carries full precision across the boundary).
    t_str = [repr(float(x)) for x in t]
    G_str = [[repr(float(G[i, j])) for j in range(d)] for i in range(d)]
    n_str = repr(float(n_target))
    m_str = repr(float(M_bound))
    dt_str = repr(float(dual_tol))

    # Prefer the in-process PyO3 binding if the installed wheel carries it.
    try:
        import pyhecke_native
        _binding = getattr(pyhecke_native, "operator_selection_lp", None)
    except ImportError:
        _binding = None
    if _binding is not None:
        out = _binding(t_str, G_str, n_str, m_str, dt_str, int(prec_bits))
        return _lp_result_from_dict(dict(out), d)

    # Fall back to the CLI binary.
    import json as _json
    import subprocess

    payload = {
        "t": t_str, "G": G_str, "n_target": n_str,
        "m_bound": m_str, "dual_tol": dt_str, "prec_bits": int(prec_bits),
    }
    binp = _find_clarabel_lp_bin(clarabel_bin)
    proc = subprocess.run(
        [binp], input=_json.dumps(payload), capture_output=True, text=True,
    )
    out = _json.loads(proc.stdout) if proc.stdout.strip() else {}
    return _lp_result_from_dict(out, d)


def solve_operator_selection_lp(
    t: np.ndarray,
    G: np.ndarray,
    n_target: float,
    *,
    M_bound: float = 1e6,
    dual_tol: float = 1e-9,
    backend: str = "auto",
    prec_bits: int = 167,
    clarabel_bin: Optional[str] = None,
) -> LpDualResult:
    """Solve operator-selection LP per prop:operator-selection-lp.

    Args:
      t: Markov traces t_i = tr_M(b_i), shape (d,)
      G: Frobenius Gram G_{ij} = tr_M(b_i b_j), shape (d, d)
      n_target: target categorical mass
      M_bound: large bound on x_i for boundedness
      dual_tol: threshold for "active" dual variable
      backend: "auto" (default — clarabel MPFR at ~50 dps when its binary
        or wheel is available, else scipy HiGHS f64), "scipy", or "clarabel"
        (force MPFR; raises if unavailable). The clarabel path is
        cross-checked equivalent to scipy to ~1e-12 (clarabel_lp_crosscheck.py).
      prec_bits: MPFR precision for the clarabel backend (167 ≈ 50 dps).
      clarabel_bin: explicit path to the clarabel LP binary (else autodetect).

    Returns LpDualResult with BOTH primal coefficients AND dual shadow
    prices.  Strong duality is verified; mismatch raises ValueError.
    """
    if backend not in ("auto", "scipy", "clarabel"):
        raise ValueError(f"unknown backend {backend!r}; use 'auto', 'scipy', or 'clarabel'")
    if backend in ("auto", "clarabel"):
        try:
            _res = _solve_operator_selection_lp_clarabel(
                t, G, n_target, M_bound=M_bound, dual_tol=dual_tol,
                prec_bits=prec_bits, clarabel_bin=clarabel_bin,
            )
        except (ImportError, FileNotFoundError) as _e:
            if backend == "clarabel":
                raise
            # clarabel unavailable. In strict mode (QOU_REQUIRE_CLARABEL=1)
            # do NOT silently downgrade to scipy float64 — raise so the
            # missing MPFR binary surfaces instead of producing low-precision
            # duals. Otherwise fall through to scipy.
            if os.environ.get("QOU_REQUIRE_CLARABEL") == "1":
                raise RuntimeError(
                    "QOU_REQUIRE_CLARABEL=1 but the clarabel-MPFR binary is "
                    "unavailable; refusing to fall back to scipy float64. "
                    f"Build it (see _find_clarabel_lp_bin). Cause: {_e!r}"
                ) from _e
        else:
            # Return clarabel when forced, or in auto mode when it actually
            # solved; otherwise (auto + infeasible/error) fall back to scipy.
            if backend == "clarabel" or _res.feasible:
                return _res

    from scipy.optimize import linprog  # SciPy is required for LP duals.

    t = np.asarray(t, dtype=float)
    G = np.asarray(G, dtype=float)
    d = len(t)
    assert G.shape == (d, d), f"Gram matrix shape {G.shape} ≠ ({d},{d})"

    # Use bounds=[(-M, None)] directly to keep x in the original variable
    # — avoids the substitution sign ambiguity for dual extraction.
    c = t.copy()  # objective: min c·x

    # Equality (net): Σ x_i = n_target
    A_eq = np.ones((1, d))
    b_eq = np.array([n_target])

    # Inequality (Frobenius positivity, in linprog ≤ form):  -Gx ≤ 0
    A_ub = -G
    b_ub = np.zeros(d)

    res = linprog(
        c=c, A_ub=A_ub, b_ub=b_ub, A_eq=A_eq, b_eq=b_eq,
        bounds=[(-M_bound, None)] * d,
        method="highs",
    )

    if not res.success:
        return LpDualResult(
            x_star=[float("nan")] * d,
            y0_star=float("nan"),
            y_star=[float("nan")] * d,
            active_set=[],
            primal_obj=float("nan"),
            dual_obj=float("nan"),
            duality_gap=float("nan"),
            feasible=False,
        )

    x_star = np.asarray(res.x)
    primal_obj = float(c @ x_star)

    # Extract dual variables. linprog ('highs') returns marginals with
    # convention: ∂(opt obj)/∂(rhs). For our MIN primal:
    #   ∂primal/∂b_eq[0] = y0  (the y_0 of operator-selection LP)
    #   ∂primal/∂b_ub[i] = -y_i  (since A_ub = -G, increasing b_ub[i]
    #     loosens the Frobenius constraint, decreasing optimum →
    #     marginal is negative)
    # In linprog 'highs' terms (gradient of LP value w.r.t. RHS):
    y0_star = float(res.eqlin.marginals[0])
    y_star = (-np.asarray(res.ineqlin.marginals)).tolist()
    active_set = [i for i, y in enumerate(y_star) if y > dual_tol]

    dual_obj = float(n_target * y0_star)
    duality_gap = abs(primal_obj - dual_obj)

    return LpDualResult(
        x_star=list(x_star),
        y0_star=y0_star,
        y_star=y_star,
        active_set=active_set,
        primal_obj=primal_obj,
        dual_obj=dual_obj,
        duality_gap=duality_gap,
        feasible=True,
    )


def verify_dual_present(witness_path: str | Path) -> dict:
    """Validate that an operator-selection witness JSON includes dual.

    Required keys (anywhere in the JSON, recursive search):
      y0_star  — shadow price of net constraint
      y_star   — shadow prices of Frobenius constraints
      active_set OR active_constraints  — indices of tight Frobenius constraints
      primal_obj
      dual_obj
      duality_gap

    Returns:
      {"ok": bool, "missing": [list of required keys not found],
       "found": [keys found]}

    Use this as a content-validation hook on any block whose
    `tags` include "operator-selection" or "shadow-price".
    """
    REQUIRED = {"y0_star", "y_star", "primal_obj", "dual_obj", "duality_gap"}
    OPTIONAL_ALIASES = {"active_set", "active_constraints", "active_channels"}

    p = Path(witness_path)
    if not p.exists():
        return {"ok": False, "missing": list(REQUIRED), "found": [],
                "reason": f"witness file not found: {p}"}
    data = json.loads(p.read_text())

    found = set()

    def _scan(obj):
        if isinstance(obj, dict):
            for k, v in obj.items():
                if k in REQUIRED or k in OPTIONAL_ALIASES:
                    found.add(k)
                _scan(v)
        elif isinstance(obj, list):
            for item in obj:
                _scan(item)

    _scan(data)
    missing = REQUIRED - found
    has_active = bool(found & OPTIONAL_ALIASES)
    if not has_active:
        missing.add("active_set OR active_constraints OR active_channels")
    return {
        "ok": not missing,
        "missing": sorted(missing),
        "found": sorted(found),
    }


@dataclass
class SdpDualResult:
    """SDP version: primal + dual + strong-duality check.

    The SDP relaxes Frobenius positivity G x ≥ 0 (componentwise) to
    a Positive-Semidefinite Programming constraint M(x) ≽ 0 where
    M(x) is some PSD matrix linearly depending on x. Use when the
    LP relaxation is too loose (e.g., higher-strand cases where
    the Gram matrix has indefinite cross-block structure).

    Required fields:
      X_star          — primal optimum (matrix or vector, depending on problem)
      Z_star          — dual PSD certificate
      primal_obj
      dual_obj
      duality_gap
      eigenvalues     — of the optimum's PSD matrix (all should be ≥ -tol)
    """
    X_star: list  # may be vector or matrix
    Z_star: list
    primal_obj: float
    dual_obj: float
    duality_gap: float
    eigenvalues: list[float]
    feasible: bool

    def to_dict(self) -> dict:
        return {
            "X_star": self.X_star,
            "Z_star": self.Z_star,
            "primal_obj": float(self.primal_obj),
            "dual_obj": float(self.dual_obj),
            "duality_gap": float(self.duality_gap),
            "eigenvalues": list(self.eigenvalues),
            "feasible": bool(self.feasible),
        }


def _solve_psd_via_clarabel_lp(
    t: np.ndarray,
    G: np.ndarray,
    n_target: float,
    *,
    M_bound: float = 1e6,
    prec_bits: int = 167,
    clarabel_bin: Optional[str] = None,
) -> SdpDualResult:
    """Faithful Clarabel port of the *diagonal* PSD lift.

    ``solve_psd_operator_selection_sdp`` enforces ``M(x) = diag(Gx) ⪰ 0``,
    which is exactly the componentwise constraint ``Gx ≥ 0`` of the
    operator-selection LP.  So the faithful MPFR port delegates to the
    verified LP solver (`_solve_operator_selection_lp_clarabel`) and
    repackages the result as an ``SdpDualResult`` — the PSD matrix's
    eigenvalues are its diagonal entries ``(Gx)_i``.

    A genuine *dense* PSD lift (off-diagonal correlations / moment matrix)
    is NOT this function: it needs Clarabel's PSD cone (``clarabel-sdp``
    f64 + LAPACK, or an MPFR eigensolver) and is tracked as a follow-up.
    """
    lp = _solve_operator_selection_lp_clarabel(
        t, G, n_target, M_bound=M_bound, prec_bits=prec_bits,
        clarabel_bin=clarabel_bin,
    )
    if not lp.feasible:
        d = len(np.asarray(t, dtype=float))
        return SdpDualResult(
            X_star=[float("nan")] * d, Z_star=[],
            primal_obj=float("nan"), dual_obj=float("nan"),
            duality_gap=float("nan"), eigenvalues=[], feasible=False,
        )
    G = np.asarray(G, dtype=float)
    x_star = np.asarray(lp.x_star, dtype=float)
    gx = (G @ x_star).tolist()
    return SdpDualResult(
        X_star=lp.x_star,
        Z_star=[lp.y0_star, *lp.y_star],
        primal_obj=lp.primal_obj,
        dual_obj=lp.dual_obj,
        duality_gap=lp.duality_gap,
        eigenvalues=sorted(gx),
        feasible=True,
    )


def solve_psd_operator_selection_sdp(
    t: np.ndarray,
    G: np.ndarray,
    n_target: float,
    *,
    backend: str = "auto",
    prec_bits: int = 167,
    clarabel_bin: Optional[str] = None,
) -> SdpDualResult:
    """SDP version of operator-selection: enforce M(x) ≽ 0 instead of Gx ≥ 0.

    The PSD lift: build M(x) = diag(Gx) (positive-semidefinite ⇔
    componentwise non-negative for diagonal); equivalent to LP for
    diagonal but generalizable when off-diagonal correlations matter.

    For higher-strand cases where the LP relaxation is too loose
    (Frobenius constraints don't capture cross-channel correlation),
    replace M(x) with a denser SDP lift (e.g., the moment-matrix
    SDP from sdp_moment_lift.py).

    Args:
      backend: "auto" (default — clarabel MPFR via the diagonal-lift LP when
        available, else cvxpy/SCS f64; falls back to cvxpy if clarabel is
        unavailable or infeasible), "cvxpy", or "clarabel" (force; raises if
        unavailable). For the current diagonal lift clarabel is EXACT. The
        genuine dense-PSD cone is `operator_selection_sdp.rs`
        (Rust, clarabel-sdp) — not yet wired into this Python entry point.
      prec_bits: MPFR precision for the clarabel backend (167 ≈ 50 dps).
      clarabel_bin: explicit path to the clarabel LP binary (else autodetect).

    Returns SdpDualResult with both X*, Z* and strong-duality gap.
    """
    if backend not in ("auto", "cvxpy", "clarabel"):
        raise ValueError(f"unknown SDP backend {backend!r}; use 'auto', 'cvxpy', or 'clarabel'")
    if backend in ("auto", "clarabel"):
        try:
            _res = _solve_psd_via_clarabel_lp(
                t, G, n_target, prec_bits=prec_bits, clarabel_bin=clarabel_bin,
            )
        except (ImportError, FileNotFoundError) as _e:
            if backend == "clarabel":
                raise
            # clarabel unavailable. Strict mode refuses the cvxpy float64
            # downgrade so the missing MPFR binary surfaces.
            if os.environ.get("QOU_REQUIRE_CLARABEL") == "1":
                raise RuntimeError(
                    "QOU_REQUIRE_CLARABEL=1 but the clarabel-MPFR binary is "
                    "unavailable; refusing to fall back to cvxpy float64. "
                    f"Build it (see _find_clarabel_lp_bin). Cause: {_e!r}"
                ) from _e
        else:
            # Return clarabel when forced, or in auto mode when it solved;
            # otherwise (auto + infeasible/error) fall back to cvxpy.
            if backend == "clarabel" or _res.feasible:
                return _res

    try:
        import cvxpy as cp
    except ImportError as e:
        raise ImportError(
            "SDP requires cvxpy. Install via `pip install cvxpy`."
        ) from e

    t = np.asarray(t, dtype=float)
    G = np.asarray(G, dtype=float)
    d = len(t)

    x = cp.Variable(d)
    constraints = [
        cp.sum(x) == n_target,
        G @ x >= 0,  # Frobenius positivity (componentwise; LP-equivalent)
    ]
    objective = cp.Minimize(t @ x)
    prob = cp.Problem(objective, constraints)
    prob.solve(solver="SCS")

    feasible = prob.status in ("optimal", "optimal_inaccurate")
    if not feasible:
        return SdpDualResult(
            X_star=[float("nan")] * d, Z_star=[],
            primal_obj=float("nan"), dual_obj=float("nan"),
            duality_gap=float("nan"), eigenvalues=[], feasible=False,
        )

    x_star = np.asarray(x.value)
    primal_obj = float(prob.value)

    # Dual variables (CVXPY exposes via .dual_value on each constraint).
    # CVXPY sign convention for `Minimize` + `==`: dual_value is the
    # negative of scipy's marginal — flip to match the operator-
    # selection LP's stated dual program (max n_target · y_0).
    y_eq = -float(constraints[0].dual_value)
    y_ineq = np.asarray(constraints[1].dual_value)
    dual_obj = float(n_target * y_eq)
    duality_gap = abs(primal_obj - dual_obj)

    # PSD eigenvalues (here Gx is a vector; treat as diag PSD matrix)
    Gx = G @ x_star
    eigenvalues = sorted(Gx.tolist())

    return SdpDualResult(
        X_star=x_star.tolist(),
        Z_star=[float(y_eq), *y_ineq.tolist()],
        primal_obj=primal_obj,
        dual_obj=dual_obj,
        duality_gap=duality_gap,
        eigenvalues=eigenvalues,
        feasible=True,
    )


if __name__ == "__main__":
    # Quick smoke test on a 3-channel dummy LP.
    print("=" * 70)
    print("Smoke test: 3-channel dummy LP")
    print("=" * 70)
    t = np.array([1.0, 0.5, 0.3])
    G = np.array([[1.0, 0.2, 0.1],
                  [0.2, 1.0, 0.3],
                  [0.1, 0.3, 1.0]])
    n_target = 1.0
    res = solve_operator_selection_lp(t, G, n_target)
    print(f"  Primal x*  = {[f'{x:.4f}' for x in res.x_star]}")
    print(f"  Dual y0*   = {res.y0_star:.6f}  (shadow price of net constraint)")
    print(f"  Dual y*    = {[f'{y:.4f}' for y in res.y_star]}")
    print(f"  Active set = {res.active_set}")
    print(f"  Primal obj = {res.primal_obj:.6f}")
    print(f"  Dual obj   = {res.dual_obj:.6f}")
    print(f"  Gap        = {res.duality_gap:.2e}  (should be ~0)")
    print(f"  Feasible   = {res.feasible}")
    assert res.feasible
    assert res.duality_gap < 1e-6, f"Strong duality fails: gap = {res.duality_gap}"
    print()
    print("  ✓ LP strong duality verified")
    print()
    print("=" * 70)
    print("Smoke test: SDP version (same problem)")
    print("=" * 70)
    try:
        sdp = solve_psd_operator_selection_sdp(t, G, n_target)
        print(f"  Primal obj   = {sdp.primal_obj:.6f}")
        print(f"  Dual obj     = {sdp.dual_obj:.6f}")
        print(f"  Gap          = {sdp.duality_gap:.2e}")
        print(f"  Min eigenval = {min(sdp.eigenvalues):.4e}")
        print(f"  Feasible     = {sdp.feasible}")
        if sdp.feasible and sdp.duality_gap < 1e-4:
            print()
            print("  ✓ SDP strong duality verified")
    except ImportError as e:
        print(f"  (skipped — {e})")
