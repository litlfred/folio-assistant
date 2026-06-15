"""P2 integration tests — vendored canonical pipeline returns the
right numerical predictions for the canonical 8 atoms + nucleon
masses + composite mass.

P1 introduced NotImplementedError stubs. P2 replaced them with the
vendored-shard implementation. The previous P1 stub test has been
removed; replaced with these P2 numerical golden tests.
"""
from __future__ import annotations

from decimal import Decimal

import pytest

import qou_mass as qm


def test_proton_mass():
    r = qm.predict_nucleon("p")
    assert r.units == "MeV"
    assert abs(float(r.value) - 938.27185264) < 1e-6
    assert abs(float(r.ppm_vs_codata)) < 0.5  # Borromean is 0.25 ppm


def test_neutron_mass():
    r = qm.predict_nucleon("n")
    assert abs(float(r.value) - 939.56518467) < 1e-6
    assert abs(float(r.ppm_vs_codata)) < 0.5


def test_muon_mass():
    r = qm.predict_nucleon("mu")
    assert abs(float(r.value) - 105.65837565) < 1e-6
    assert abs(float(r.ppm_vs_codata)) < 0.01  # 0.001 ppm


def test_deuteron_binding():
    r = qm.predict("D")
    assert r.observable == "binding_energy"
    assert abs(float(r.value) - 2.2488207948647343) < 1e-12
    assert "L1" in r.method


def test_4he_binding():
    r = qm.predict("4He")
    assert abs(float(r.value) - 29.9557) < 1e-4
    assert "L1" in r.method


def test_8be_alpha_cluster():
    r = qm.predict("8Be")
    assert "L2-alpha-cluster" in r.method
    assert abs(float(r.value) - 62.3383) < 1e-3


def test_40ca_alpha_cluster():
    r = qm.predict("40Ca")
    assert "L2-alpha-cluster" in r.method
    assert abs(float(r.value) - 408.77) < 1e-2


def test_4he_composite_mass():
    r = qm.predict("4He", observable="mass")
    assert r.observable == "mass"
    # M(⁴He) ≈ 3725.7 MeV (composite via N·m_n + Z·m_p − B)
    assert 3700 < float(r.value) < 3750


def test_compute_tr_M_4he():
    tr = qm.compute_tr_M(Z=2, N=2)
    assert abs(float(tr) - 0.0553483458766979) < 1e-13


def test_compute_tr_M_proton():
    tr = qm.compute_tr_M(Z=1, N=0)
    assert abs(float(tr) - 1.0653062285923887) < 1e-13


@pytest.mark.skip(
    reason="P2 only ships pre-computed shard rows for canonical_braid; "
    "live computation via canonical_braid_crossings has deep "
    "transitive deps (mass_at_3A_proper → hecke_core → ...) that "
    "are P3 vendoring work."
)
def test_canonical_braid_4he():
    b = qm.canonical_braid(Z=2, N=2)
    assert b.n_strands == 12
    assert len(b.generators) > 0


def test_canonical_braid_smoke_n_strands():
    """Minimum smoke: n_strands always derivable from (Z, N)."""
    b = qm.canonical_braid(Z=2, N=2)
    assert b.n_strands == 12  # 3 · A = 3 · 4
    b = qm.canonical_braid(Z=1, N=1)
    assert b.n_strands == 6   # 3 · 2


def test_atom_label_parser_strings():
    from qou_mass.api import parse_atom_label
    assert parse_atom_label("4He") == (2, 2)
    assert parse_atom_label("He-4") == (2, 2)
    assert parse_atom_label("D") == (1, 1)
    assert parse_atom_label("p") == (1, 0)
    assert parse_atom_label((6, 6)) == (6, 6)


def test_unknown_atom_raises():
    with pytest.raises(ValueError):
        qm.predict("123Xyz")  # unknown element


def test_binding_for_free_nucleon_raises():
    # p is type=mass — asking for binding_energy is an error.
    with pytest.raises(ValueError):
        qm.predict("p", observable="binding_energy")


def test_predict_table_batch():
    rs = qm.predict_table(["D", "T", "3He", "4He"])
    assert len(rs) == 4
    assert all(r.observable == "binding_energy" for r in rs)


def test_witness_to_json_shape_roundtrip():
    from qou_mass import Witness
    w = Witness(
        engine="test",
        engine_version="0.0",
        computed_at="2026-05-19T00:00:00Z",
        commit_sha="abcdef",
        script_file="test.py",
        script_hash="123",
        description="smoke",
        parameters={"q": "1.1"},
        data={"x": 1},
    )
    s = w.to_json()
    import json
    obj = json.loads(s)
    for f in ("engine", "engineVersion", "computedAt", "commitSha",
              "scriptFile", "scriptHash", "description", "parameters",
              "data", "upstream_witness_hashes"):
        assert f in obj
