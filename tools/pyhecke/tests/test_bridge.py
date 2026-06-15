"""Bridge dispatch tests — do not require a compiled binary to be present.

Exercises the resolver behaviour only; real subprocess tests live in M3
when the unified `hecke` binary ships.
"""

from __future__ import annotations

import os
from pathlib import Path

from pyhecke import bridge


def test_engine_dir_autodetect():
    d = bridge.engine_dir()
    assert d.name == "hecke-engine"


def test_binary_path_returns_none_for_unknown():
    assert bridge.binary_path("no-such-hecke-binary-xyz") is None
