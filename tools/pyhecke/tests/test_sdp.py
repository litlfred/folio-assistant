"""Tests for pyhecke.sdp — Track C multi-level SDP dispatcher."""

from __future__ import annotations

import pytest

from pyhecke import sdp


def test_dispatch_valid_levels():
    for lvl in (3, 4, 5, 6, 7):
        result = sdp.multi_level_sdp(lvl)
        assert isinstance(result, sdp.SDPResult)
        assert result.level == lvl


def test_dispatch_rejects_invalid_level():
    for lvl in (0, 1, 2, 8, -1):
        with pytest.raises(ValueError):
            sdp.multi_level_sdp(lvl)


def test_implemented_levels():
    """All four upper levels 3..7 are implemented."""
    assert sdp.implemented_levels() == [3, 4, 5, 6, 7]
    assert sdp.pending_levels() == []


# ── Level 4 — shell-magic SDP ──────────────────────────────────────────

def test_level4_rejects_non_magic_count():
    """A_magic = 3 is not a magic number — solver must reject."""
    result = sdp.solve_shell_magic_sdp(a_magic=3)
    assert result.level == 4
    assert result.status == "infeasible"
    assert any("magic" in c for c in result.caveats)


@pytest.mark.parametrize("a_magic", list(sdp.MAGIC_NUMBERS))
def test_level4_accepts_each_magic_number(a_magic):
    """Every canonical magic number must pass the 2x2 PSD test."""
    try:
        result = sdp.solve_shell_magic_sdp(a_magic=a_magic)
    except ImportError:
        pytest.skip("sigma_shell_characterization not importable")
    assert result.level == 4
    # Allow "not_implemented" (upstream import failure) or "optimal".
    if result.status == "not_implemented":
        pytest.skip(f"upstream not available: {result.caveats}")
    assert result.status == "optimal"
    assert result.primal is not None
    assert result.primal["a_magic"] == a_magic
    assert result.primal["hecke_level"] == 3 * a_magic
    det = result.primal["det_2x2"]
    assert det >= -1e-12, f"det(2x2) = {det} for a_magic = {a_magic}"


def test_level4_psd_block_structure():
    """PSD-blocks output must include the 2x2 shell-closure block."""
    try:
        result = sdp.solve_shell_magic_sdp(a_magic=2)
    except ImportError:
        pytest.skip("sigma_shell_characterization not importable")
    if result.status == "not_implemented":
        pytest.skip("upstream not available")
    blocks = result.psd_blocks
    assert len(blocks) == 1
    assert blocks[0]["name"] == "shell_closure_2x2"
    assert blocks[0]["size"] == 2


# ── Level 5 — cross-shell SDP ──────────────────────────────────────────

@pytest.mark.parametrize("a", [4, 12, 24, 40, 60, 100])
def test_level5_non_magic_counts(a):
    try:
        r = sdp.solve_cross_shell_sdp(a=a)
    except ImportError:
        pytest.skip("sigma_shell_characterization not importable")
    if r.status == "not_implemented":
        pytest.skip("upstream not available")
    assert r.level == 5
    assert r.status == "optimal"
    assert r.primal is not None
    assert r.primal["a_lower"] in sdp.MAGIC_NUMBERS
    assert r.primal["a_upper"] in sdp.MAGIC_NUMBERS
    assert r.primal["a_lower"] <= a <= r.primal["a_upper"] or r.primal["a_lower"] == r.primal["a_upper"]
    assert r.primal["det_2x2"] >= -1e-12


def test_level5_magic_count_collapses():
    """For a magic number, a_lower == a_upper."""
    try:
        r = sdp.solve_cross_shell_sdp(a=20)
    except ImportError:
        pytest.skip("sigma_shell_characterization not importable")
    if r.status == "not_implemented":
        pytest.skip("upstream not available")
    assert r.primal["a_lower"] == 20
    assert r.primal["a_upper"] == 20


# ── Level 6 — atom-electron SDP ────────────────────────────────────────

@pytest.mark.parametrize("z", [1, 2, 6, 20, 82])
def test_level6_stable_z(z):
    try:
        r = sdp.solve_atom_electron_sdp(z=z)
    except ImportError:
        pytest.skip("hecke_core.alpha_em not importable")
    if r.status == "not_implemented":
        pytest.skip("upstream not available")
    assert r.level == 6
    assert r.status == "optimal"
    assert r.primal["z"] == z
    assert r.primal["z_alpha"] < 1.0  # orbital stability


def test_level6_superheavy_infeasible():
    """Z >= 137 should fail the orbital-stability PSD bound."""
    try:
        r = sdp.solve_atom_electron_sdp(z=150)
    except ImportError:
        pytest.skip("hecke_core.alpha_em not importable")
    if r.status == "not_implemented":
        pytest.skip("upstream not available")
    assert r.status == "infeasible"


# ── Level 7 — molecule SDP ─────────────────────────────────────────────

@pytest.mark.parametrize("n_atoms,bond_order", [(2, 1.0), (3, 1.0), (4, 2.0), (6, 1.5)])
def test_level7_small_molecules(n_atoms, bond_order):
    r = sdp.solve_molecule_sdp(n_atoms=n_atoms, bond_order=bond_order)
    assert r.level == 7
    assert r.status == "optimal"
    assert r.primal["n_atoms"] == n_atoms
    assert r.primal["bond_order"] == bond_order
    # Diagonal must be 1
    m = r.primal["matrix"]
    for i in range(n_atoms):
        assert abs(m[i][i] - 1.0) < 1e-12


def test_level7_rejects_single_atom():
    r = sdp.solve_molecule_sdp(n_atoms=1)
    assert r.status == "infeasible"


def test_level7_all_levels_round_trip_through_dispatcher():
    """Every implemented level is reachable via multi_level_sdp()."""
    for lvl in sdp.implemented_levels():
        r = sdp.multi_level_sdp(lvl)
        assert isinstance(r, sdp.SDPResult)
        assert r.level == lvl


def test_sdp_result_dataclass():
    r = sdp.SDPResult(level=3, status="optimal", objective=1.5)
    assert r.level == 3
    assert r.status == "optimal"
    assert r.objective == 1.5
    assert r.psd_blocks == []
    assert r.caveats == []
