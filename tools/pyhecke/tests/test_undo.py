"""Tests for pyhecke.undo (Track B)."""

from __future__ import annotations

import pytest

from pyhecke import undo


def test_level_names_cover_all_levels():
    assert set(undo.LEVEL_NAMES) == {1, 2, 3, 4, 5, 6, 7}


def test_is_implemented_levels():
    assert undo.is_implemented(2)
    assert undo.is_implemented(3)
    for lvl in (4, 5, 6, 7):
        assert not undo.is_implemented(lvl)


def test_undo_nucleon_to_quarks_proton_shape():
    """Proton = uud expands to two chains."""
    pytest.importorskip("numpy")
    try:
        g0, g1 = undo.undo_nucleon_to_quarks(["u", "u", "d"])
    except ImportError:
        pytest.skip("hecke_core not importable in this env")
    assert isinstance(g0, list) and isinstance(g1, list)
    assert len(g0) > 0 and len(g1) > 0


def test_undo_atom_to_nucleons_hydrogen_shape():
    """Hydrogen (Z=1, N=0) expands to two generator chains."""
    pytest.importorskip("numpy")
    try:
        g0, g1 = undo.undo_atom_to_nucleons(1, 0)
    except ImportError:
        pytest.skip("hecke_core not importable in this env")
    assert isinstance(g0, list) and isinstance(g1, list)


@pytest.mark.parametrize("level", [4, 5, 6, 7])
def test_unimplemented_levels_raise_notimplementederror(level):
    with pytest.raises(NotImplementedError):
        undo.undo_to_quark(level)


def test_dispatcher_rejects_invalid_level():
    with pytest.raises(ValueError):
        undo.undo_to_quark(0)
    with pytest.raises(ValueError):
        undo.undo_to_quark(8)


def test_level_name_lookup():
    assert undo.level_name(1) == "quark"
    assert undo.level_name(7) == "molecule"
    with pytest.raises(ValueError):
        undo.level_name(99)
