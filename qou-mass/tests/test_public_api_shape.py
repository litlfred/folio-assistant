"""P1 smoke tests — verify the public API surface is importable and
the dataclasses behave."""
from __future__ import annotations

from decimal import Decimal

import pytest


def test_imports():
    """Every advertised symbol resolves."""
    import qou_mass as qm
    for sym in (
        "__version__",
        "predict", "predict_nucleon", "predict_table",
        "compute_tr_M", "canonical_braid",
        "Prediction", "Witness", "BraidWord",
    ):
        assert hasattr(qm, sym), f"qou_mass missing public symbol: {sym}"


def test_version_string():
    import qou_mass as qm
    assert isinstance(qm.__version__, str)
    assert qm.__version__.startswith("0.")  # alpha series


def test_prediction_str():
    from qou_mass import Prediction
    p = Prediction(
        atom="4He",
        Z=2, N=2,
        observable="binding_energy",
        value=Decimal("28.295"),
        units="MeV",
        method="markov_peel",
        precision_dps=50,
    )
    s = str(p)
    assert "4He" in s
    assert "28.295" in s
    assert "MeV" in s


# test_p1_stubs_raise_notimplemented removed in P2 — the public
# compute paths are now LIVE (read from vendored per-Z shards).
# See test_p2_integration.py for the numerical golden tests that
# replaced this shape-only check.
