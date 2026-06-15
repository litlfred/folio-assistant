"""qou-mass — Quantum Observable Universe mass-prediction library.

Public API:

  predict(atom, observable="binding_energy", ...) -> Prediction
  predict_nucleon(particle, ...) -> Prediction
  compute_tr_M(Z, N, ...) -> Decimal
  canonical_braid(Z, N) -> BraidWord
  predict_table(atoms, ...) -> list[Prediction]

See README.md for the 2-3 line quickstart.
"""
from ._version import __version__
from .prediction import Prediction, Witness, BraidWord
from .api import (
    predict,
    predict_nucleon,
    predict_table,
    compute_tr_M,
    canonical_braid,
)

__all__ = [
    "__version__",
    "predict",
    "predict_nucleon",
    "predict_table",
    "compute_tr_M",
    "canonical_braid",
    "Prediction",
    "Witness",
    "BraidWord",
]
