"""Tests for the PyO3 native acceleration layer.

Skipped if `pyhecke_native` has not been built (requires
`cd tools/pyhecke-native && maturin build && pip install target/wheels/*.whl`).
"""

from __future__ import annotations

import pytest

from pyhecke import bridge


pytestmark = pytest.mark.skipif(
    not bridge.has_native(),
    reason="pyhecke_native wheel not installed — run `maturin build && pip install ...`",
)


def test_native_version():
    import pyhecke_native
    # Version is wired from Cargo.toml via env!("CARGO_PKG_VERSION") in
    # lib.rs. If Cargo.toml bumps, update the expected here in the same
    # commit.
    assert pyhecke_native.__version__ == "0.4.0"


def test_native_markov_z_matches_python():
    import pyhecke_native

    from pyhecke import gram as pg

    q = 1.1099785955541805
    assert abs(pyhecke_native.markov_z(q) - pg.z) < 1e-14


def test_native_trace_weights_match_python():
    import pyhecke_native

    from pyhecke import gram as pg

    q = 1.1099785955541805
    tr = pyhecke_native.trace_weights(q)
    assert len(tr) == 6
    for a, b in zip(tr, pg.TR_M.tolist()):
        assert abs(a - b) < 1e-14


def test_native_gram_matches_python():
    import numpy as np
    import pyhecke_native

    from pyhecke import gram as pg

    G_native = np.array(pyhecke_native.gram_matrix(1.1099785955541805))
    assert G_native.shape == (6, 6)
    assert np.max(np.abs(G_native - pg.G)) < 1e-14


def test_native_det_matches_python():
    import numpy as np
    import pyhecke_native

    from pyhecke import gram as pg

    d_native = pyhecke_native.gram_determinant(1.1099785955541805)
    d_py = np.linalg.det(pg.G)
    assert abs(d_native - d_py) < 1e-10


def test_bridge_dispatches_to_native():
    """When native is present, gram_matrix_from_rust uses it."""
    import numpy as np

    G = bridge.gram_matrix_from_rust()
    assert G.shape == (6, 6)
    assert abs(G[0, 0] - 1.0) < 1e-14


def test_bridge_det_uses_native():
    det = bridge.gram_det_from_rust()
    assert abs(det - (-0.3608011166161873)) < 1e-10


def test_native_gram_inverse_is_right_inverse():
    import numpy as np
    import pyhecke_native

    q = 1.1099785955541805
    G = np.array(pyhecke_native.gram_matrix(q))
    Gi = np.array(pyhecke_native.gram_inverse(q))
    prod = G @ Gi
    assert np.allclose(prod, np.eye(6), atol=1e-10)


def test_native_different_q_differs():
    """Different q values produce different Gram matrices."""
    import numpy as np
    import pyhecke_native

    G1 = np.array(pyhecke_native.gram_matrix(1.10))
    G2 = np.array(pyhecke_native.gram_matrix(1.20))
    assert not np.allclose(G1, G2)


# ── M3d+: hm / nf_tr / nf_net ──────────────────────────────────────────

def test_native_hm_identity_action():
    """hm(γ, 1, 0, 0) → σ_0 — matches pyhecke.gram.hm byte-for-byte."""
    import pyhecke_native
    from pyhecke import gram as pg

    nf = [1.0, 0.0, 0.0, 0.0, 0.0, 0.0]
    out_native = pyhecke_native.hm(nf, 1.0, 0.0, 0)
    out_py = pg.hm(nf, 1.0, 0.0, 0)
    for a, b in zip(out_native, out_py):
        assert abs(a - b) < 1e-14


def test_native_hm_nontrivial_matches_python():
    """Multi-step hm chain agrees with Python."""
    import pyhecke_native
    from pyhecke import gram as pg

    # Apply σ_0 then σ_1 to γ
    nf = [1.0, 0.0, 0.0, 0.0, 0.0, 0.0]
    a1 = pyhecke_native.hm(nf, 1.0, 0.0, 0)
    a2 = pyhecke_native.hm(a1, 1.0, 0.0, 1)
    p1 = pg.hm(nf, 1.0, 0.0, 0)
    p2 = pg.hm(p1, 1.0, 0.0, 1)
    for a, b in zip(a2, p2):
        assert abs(a - b) < 1e-14


def test_native_hm_rejects_wrong_length():
    """hm must reject nf vectors that aren't length 6."""
    import pytest
    import pyhecke_native

    with pytest.raises(ValueError):
        pyhecke_native.hm([1.0, 2.0, 3.0], 1.0, 0.0, 0)


def test_native_nf_tr_matches_python():
    """nf_tr result agrees with pyhecke.gram.nf_tr."""
    import pyhecke_native
    from pyhecke import gram as pg

    nf = [1.5, -0.3, 0.7, -0.2, 0.11, 0.05]
    assert abs(pyhecke_native.nf_tr(nf) - pg.nf_tr(nf)) < 1e-14


def test_native_nf_net_matches_python():
    import pyhecke_native
    from pyhecke import gram as pg

    nf = [1.5, -0.3, 0.7, -0.2, 0.11, 0.05]
    assert abs(pyhecke_native.nf_net(nf) - pg.nf_net(nf)) < 1e-14


def test_native_version_bumped():
    import pyhecke_native
    # The version pin is sourced from Cargo.toml at compile time
    # (env!("CARGO_PKG_VERSION")). Bump together with Cargo.toml +
    # pyproject.toml when adding new kernels.
    assert pyhecke_native.__version__ == "0.4.0"


# ── M3d++: build_atom_nf ───────────────────────────────────────────────

@pytest.mark.parametrize("z,n", [(1, 0), (1, 1), (2, 1), (2, 2), (6, 6), (8, 8), (20, 20)])
def test_native_build_atom_nf_matches_python(z, n):
    """Rust build_atom_nf must be byte-identical to Python for every
    physically relevant (Z, N)."""
    import pyhecke_native
    from pyhecke import gram as pg  # noqa: F401 — triggers hecke_core import
    import hecke_core
    import numpy as np

    py = hecke_core.build_atom_nf(z, n)
    rs = pyhecke_native.build_atom_nf(z, n)
    diff = np.max(np.abs(np.array(py) - np.array(rs)))
    assert diff < 1e-12, f"Z={z} N={n}: max diff {diff}"


def test_native_build_atom_nf_vacuum():
    """(0, 0) must return the identity NF."""
    import pyhecke_native
    nf = pyhecke_native.build_atom_nf(0, 0)
    assert abs(nf[0] - 1.0) < 1e-14
    for x in nf[1:]:
        assert abs(x) < 1e-14


def test_native_build_atom_nf_length_six():
    import pyhecke_native
    assert len(pyhecke_native.build_atom_nf(6, 6)) == 6


# ── B2+: atom_per_generator_volumes ────────────────────────────────────

@pytest.mark.parametrize("z,n", [(1, 0), (2, 2), (6, 6), (8, 8), (20, 20)])
def test_native_atom_per_generator_volumes_matches_python(z, n):
    """Rust per-generator Wedderburn volumes match Python to f64 eps."""
    import pyhecke_native
    from pyhecke import gram as pg  # noqa: F401 — triggers hecke_core
    import hecke_core

    py = hecke_core.atom_per_generator_volumes(z, n)
    rs = pyhecke_native.atom_per_generator_volumes(z, n)
    assert len(py) == len(rs), f"Z={z} N={n}: length {len(py)} vs {len(rs)}"
    max_diff = max(
        abs(p[k] - r[k])
        for p, r in zip(py, rs)
        for k in ("sym", "std", "alt", "full")
    )
    assert max_diff < 1e-12, f"Z={z} N={n}: max diff {max_diff}"


def test_native_atom_per_generator_volumes_vacuum():
    import pyhecke_native
    assert pyhecke_native.atom_per_generator_volumes(0, 0) == []


def test_native_atom_per_generator_volumes_free_baseline():
    """include_inter=False gives n_gens_total = 2A."""
    import pyhecke_native
    vols = pyhecke_native.atom_per_generator_volumes(2, 2, include_inter=False)
    assert len(vols) == 2 * (2 + 2)  # 8 generators


def test_native_atom_per_generator_volumes_inter_baseline():
    """include_inter=True gives n_gens_total = 3A - 1."""
    import pyhecke_native
    vols = pyhecke_native.atom_per_generator_volumes(2, 2, include_inter=True)
    assert len(vols) == 3 * (2 + 2) - 1  # 11 generators
