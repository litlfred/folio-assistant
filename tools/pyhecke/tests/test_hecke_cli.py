"""Tests for the unified `hecke` CLI (M2e).

Skipped if the binary hasn't been built.
"""

from __future__ import annotations

import json
import subprocess

import pytest

from pyhecke import bridge


def _hecke_path():
    return bridge.binary_path("hecke")


pytestmark = pytest.mark.skipif(
    _hecke_path() is None,
    reason="`hecke` binary not built (run `cargo build --release` in tools/hecke-engine/)",
)


def _run(*args: str) -> subprocess.CompletedProcess:
    return subprocess.run(
        [str(_hecke_path()), *args],
        capture_output=True,
        text=True,
        check=False,
        timeout=30,
    )


def test_help_lists_all_subcommands():
    r = _run("--help")
    assert r.returncode == 0
    for sub in ("gram", "schema", "mass", "atomic", "molecular", "pergen", "qvalues"):
        assert sub in r.stdout


def test_gram_subcommand_emits_valid_json():
    r = _run("gram")
    assert r.returncode == 0
    blob = json.loads(r.stdout)
    assert blob["n"] == 3
    assert len(blob["matrix"]) == 6


def test_gram_subcommand_custom_q():
    r = _run("gram", "--q", "1.20")
    assert r.returncode == 0
    blob = json.loads(r.stdout)
    assert abs(blob["q"] - 1.20) < 1e-12


def test_schema_subcommand_prints_certificate_schema():
    r = _run("schema", "certificate")
    assert r.returncode == 0
    s = json.loads(r.stdout)
    assert "Hecke-engine witness certificate" in s.get("title", "")


def test_schema_subcommand_prints_gram_schema():
    r = _run("schema", "gram")
    assert r.returncode == 0
    s = json.loads(r.stdout)
    assert s.get("title") == "Gram matrix certificate"


def test_schema_subcommand_prints_witness_schema():
    r = _run("schema", "witness")
    assert r.returncode == 0
    s = json.loads(r.stdout)
    assert s.get("title") == "Computation witness"


def test_unknown_subcommand_fails():
    r = _run("not-a-subcommand")
    assert r.returncode != 0
