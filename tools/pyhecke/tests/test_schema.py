"""Validate every committed certificate-*.json against the schema.

This is the M1 acceptance gate: the schema must accept every
certificate currently on disk. If any fails, either the schema is
wrong or the certificate is malformed — both are actionable.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from pyhecke import schema as pyhecke_schema
from pyhecke import certificate as pyhecke_certificate


REPO_ROOT = Path(__file__).resolve().parents[3]
ENGINE_DIR = REPO_ROOT / "tools" / "hecke-engine"


def _cert_paths() -> list[Path]:
    return sorted(ENGINE_DIR.glob("certificate-*.json"))


def test_schema_loads():
    """Both schemas parse as valid Draft 2020-12 documents."""
    cert = pyhecke_schema.load_schema("certificate")
    wit = pyhecke_schema.load_schema("witness")
    assert "$schema" in cert
    assert "$schema" in wit


def test_schema_dir_discovers():
    d = pyhecke_schema.schema_dir()
    assert (d / "certificate.schema.json").is_file()
    assert (d / "witness.schema.json").is_file()


@pytest.mark.parametrize("path", _cert_paths(), ids=lambda p: p.name)
def test_certificate_validates(path: Path):
    """Every committed certificate must validate against the schema."""
    with path.open(encoding="utf-8") as f:
        obj = json.load(f)
    pyhecke_schema.validate("certificate", obj)


def test_certificate_load_roundtrip():
    """Exercise the typed loader end-to-end on one sample."""
    paths = _cert_paths()
    if not paths:
        pytest.skip("no certificate files on disk")
    cert = pyhecke_certificate.load(paths[0])
    assert cert.isotope.z >= 0
    assert cert.engine.name


def test_invalid_certificate_rejected():
    """A certificate missing required fields must fail validation."""
    bad = {"foo": "bar"}
    with pytest.raises(Exception):
        pyhecke_schema.validate("certificate", bad)
