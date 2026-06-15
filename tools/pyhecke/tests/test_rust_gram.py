"""Integration: Rust `hecke-gram` vs Python `pyhecke.gram.G`.

Only runs if the Rust binary has been built (release mode). Otherwise
the test is skipped — the package must work even when the Rust engine
is absent.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from pyhecke import bridge


def _rust_gram_available() -> bool:
    return bridge.binary_path("hecke-gram") is not None


pytestmark = pytest.mark.skipif(
    not _rust_gram_available(),
    reason="hecke-gram binary not built (run `cargo build --release` in tools/hecke-engine/)",
)


def test_rust_gram_validates_against_schema():
    """Rust output must validate against gram.schema.json."""
    import jsonschema

    cert = bridge.gram_from_rust()
    schema_path = (
        Path(__file__).resolve().parents[2] / "hecke-engine" / "schemas" / "gram.schema.json"
    )
    with schema_path.open() as f:
        schema = json.load(f)
    jsonschema.validate(cert, schema)


def test_rust_and_python_gram_agree():
    """Rust and Python Gram matrices must agree at f64 precision."""
    import numpy as np

    from pyhecke import gram as pg

    rust_G = bridge.gram_matrix_from_rust()
    py_G = pg.G
    assert rust_G.shape == py_G.shape == (6, 6)
    max_diff = np.max(np.abs(rust_G - py_G))
    assert max_diff < 1e-14, f"Rust and Python Gram disagree: max diff {max_diff:.2e}"


def test_rust_gram_det_matches_python():
    import numpy as np

    from pyhecke import gram as pg

    cert = bridge.gram_from_rust()
    py_det = np.linalg.det(pg.G)
    rust_det = cert["determinant"]
    assert abs(rust_det - py_det) < 1e-10


def test_rust_gram_inverse_is_right_inverse():
    """G · G_inv = I (sanity)."""
    import numpy as np

    cert = bridge.gram_from_rust()
    G = np.array(cert["matrix"])
    G_inv = np.array(cert["inverse"])
    prod = G @ G_inv
    assert np.allclose(prod, np.eye(6), atol=1e-10)


def test_rust_gram_at_custom_q():
    """Different q values produce different G matrices."""
    import numpy as np

    c0 = bridge.gram_from_rust(q=1.10)
    c1 = bridge.gram_from_rust(q=1.20)
    G0 = np.array(c0["matrix"])
    G1 = np.array(c1["matrix"])
    assert not np.allclose(G0, G1)
