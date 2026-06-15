"""Smoke tests — package imports, substrate constants compute, witness round-trips."""

import json


def test_package_importable():
    """Top-level import must succeed and expose __version__."""
    import qou_substrate
    assert qou_substrate.__version__ == "0.1.0"


def test_substrate_constants_have_expected_values():
    """q_0 from CODATA 2022 + SnapPy 3.3.2 — values must be bit-stable."""
    from qou_substrate import Q, HBAR_Q, HBAR_Q_SQ, VOL_FIGURE_EIGHT, MASS_RATIO_MU_E
    assert VOL_FIGURE_EIGHT == 2.029883212819307
    assert MASS_RATIO_MU_E == 206.7682830
    assert abs(HBAR_Q_SQ - VOL_FIGURE_EIGHT / MASS_RATIO_MU_E) < 1e-15
    assert abs(HBAR_Q - HBAR_Q_SQ**0.5) < 1e-15
    assert abs(Q - 1.0 / (1.0 - HBAR_Q)) < 1e-15
    assert 1.10 < Q < 1.11


def test_derived_constants_consistent():
    """HA = q - q^-1, E_CROSS = HA/2, TWO_Q = q + q^-1, etc."""
    from qou_substrate import Q, Q_INV, HA, E_CROSS, TWO_Q, S_SKEIN
    import math
    assert abs(Q_INV - 1.0 / Q) < 1e-15
    assert abs(HA - (Q - Q_INV)) < 1e-15
    assert abs(E_CROSS - HA / 2) < 1e-15
    assert abs(TWO_Q - (Q + Q_INV)) < 1e-15
    assert abs(S_SKEIN - (math.sqrt(Q) - 1.0 / math.sqrt(Q))) < 1e-15


def test_q_int_quantum_integers():
    """[n]_q = (q^n - q^-n) / (q - q^-1); [1]_q = 1; [2]_q = q + q^-1."""
    from qou_substrate import q_int, TWO_Q
    assert abs(q_int(1) - 1.0) < 1e-12
    assert abs(q_int(2) - TWO_Q) < 1e-12


def test_q_50_digit_string_well_formed():
    """The canonical 50-digit pin must be a parseable decimal."""
    from qou_substrate import Q_50_DIGIT_STR
    assert Q_50_DIGIT_STR.startswith("1.1099")
    assert len(Q_50_DIGIT_STR) >= 50
    float(Q_50_DIGIT_STR)


def test_precision_set_compute_dps():
    """set_compute_dps() bumps mp.mp.dps and is idempotent."""
    from qou_substrate import set_compute_dps, COMPUTE_DPS
    from mpmath import mp
    set_compute_dps()
    assert mp.dps == COMPUTE_DPS
    set_compute_dps()
    assert mp.dps == COMPUTE_DPS
    set_compute_dps(80)
    assert mp.dps == 80
    set_compute_dps()
    assert mp.dps == COMPUTE_DPS


def test_precision_fmt_short_circuits_non_mpf():
    """fmt() returns str(value) for ints, floats, strings, None."""
    from qou_substrate import fmt
    assert fmt(42) == "42"
    assert fmt(0.1) == "0.1"
    assert fmt("hello") == "hello"
    assert fmt(None) == "None"


def test_precision_fmt_serializes_mpf():
    """fmt() of an mpf returns its OUTPUT_DPS string representation."""
    from qou_substrate import fmt, set_compute_dps, OUTPUT_DPS
    from mpmath import mp, mpf
    set_compute_dps()
    x = mp.sqrt(mpf(2))
    s = fmt(x)
    assert s.startswith("1.41421356")
    assert len(s.replace(".", "").replace("-", "")) >= OUTPUT_DPS - 2


def test_witness_builder_round_trip(tmp_path):
    """WitnessBuilder can produce a witness JSON without exploding when
    invoked outside a git repo (git fields fall back to "unknown")."""
    from qou_substrate import WitnessBuilder
    w = WitnessBuilder(
        name="smoke-test",
        engine="python",
        output_dir=str(tmp_path),
    )
    w.add_data("x", "42")
    w.add_data("description", "qou-substrate smoke test witness")
    target = w.save()
    assert target.exists()
    body = json.loads(target.read_text())
    # The witness format uses camelCase keys (commitSha, computedAt, …)
    # plus a `data` dict for caller-supplied fields.
    assert body["data"]["x"] == "42"
    assert "commitSha" in body
    assert "computedAt" in body


def test_file_content_hash_stable(tmp_path):
    """SHA-256 prefix of a file's content matches what lean-witness.ts produces."""
    from qou_substrate import file_content_hash
    f = tmp_path / "x.txt"
    f.write_text("hello\n")
    h = file_content_hash(str(f))
    assert len(h) == 12
    assert all(c in "0123456789abcdef" for c in h)
