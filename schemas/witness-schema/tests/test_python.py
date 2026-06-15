"""Smoke tests — Pydantic models validate real witness JSON shapes."""

import json
import pathlib

import pytest

from witness_schema import (
    ComputationAssertion,
    ComputationWitness,
    UpstreamWitnessHash,
    __version__,
)


def test_version():
    # Bump in lockstep with pyproject.toml + package.json + js/index.ts VERSION
    assert __version__ == "0.1.1"


def test_minimal_witness():
    """A witness with only the 4 required fields validates."""
    w = ComputationWitness.model_validate(
        {
            "engine": "mpmath",
            "engineVersion": "1.3.0",
            "computedAt": "2026-05-24T00:00:00+00:00",
            "assertions": [],
        }
    )
    assert w.engine == "mpmath"
    assert w.assertions == []
    assert w.commitSha is None


def test_full_witness_validates():
    """A maximal witness JSON shape parses and is semantically
    re-serialisable (no byte-identical guarantee from Pydantic)."""
    raw = {
        "engine": "mpmath",
        "engineVersion": "1.3.0",
        "computedAt": "2026-05-24T05:00:00+00:00",
        "commitSha": "abc123",
        "scriptCommitSha": "def456",
        "scriptHash": "a1b2c3d4e5f6",
        "scriptFile": "folio-assistant/computations/hyperbolic_volumes.py",
        "name": "hyperbolic-volumes",
        "description": "Vol(4_1) at 50 dps via Clausen-function identity.",
        "contentBlock": "prop:vol-4-1-mostow",
        "durationMs": 12.3,
        "allPassed": True,
        "assertions": [
            {
                "name": "Vol(4_1)",
                "computed": "2.0298832128193",
                "expected": "2.0298832128193",
                "passed": True,
                "tolerance": 1e-14,
                "unit": "hyperbolic volume",
                "source": "SnapPy 3.3.2",
            }
        ],
        "parameters": {"dps": 50},
        # In real witnesses, upstream_witness_hashes lives under data
        # (per `binding-K-direct.witness.json`,
        #  `canonical-isotope-witness-Z00.witness.json`, …), not at
        # the top level.
        "data": {
            "vol_5_2": "2.828122088334",
            "upstream_witness_hashes": [
                {
                    "path": "alpha-cluster-recursion.witness.json",
                    "sha256": "c7cd6663195d43322c4476db00e2228e636506104e46d3d038c3deedb7ebcd77",
                    "size_bytes": 3747,
                    "commitSha": "610a6aa2bde5fabec35796ead6bbb0adb76f6533",
                    # Real witnesses can carry `null` for absent fields:
                    "scriptCommitSha": None,
                    "computedAt": "2026-05-19T03:17:28.931573+00:00",
                },
            ],
        },
        "caveats": ["Bounded by SnapPy 3.3.2's 15-digit Vol precision."],
    }
    w = ComputationWitness.model_validate(raw)
    assert w.allPassed
    assert len(w.assertions) == 1
    assert w.assertions[0].name == "Vol(4_1)"
    assert w.parameters == {"dps": 50}
    # Round-trip is semantic (object-equal), not byte-identical:
    parsed_again = ComputationWitness.model_validate(w.model_dump(mode="json"))
    assert parsed_again.assertions[0].name == w.assertions[0].name
    # upstream_witness_hashes is accessed via data:
    uwh = (w.data or {}).get("upstream_witness_hashes", [])
    assert len(uwh) == 1
    assert uwh[0]["scriptCommitSha"] is None
    assert uwh[0]["commitSha"] == "610a6aa2bde5fabec35796ead6bbb0adb76f6533"


def test_engine_snappy_accepted():
    """Legacy `snappy` engine value is accepted (real in-repo witnesses use it)."""
    w = ComputationWitness.model_validate(
        {
            "engine": "snappy",
            "engineVersion": "snappy 3.3.2",
            "computedAt": "2026-05-24T00:00:00+00:00",
            "assertions": [],
        }
    )
    assert w.engine == "snappy"


def test_assertion_with_numeric_values():
    """Computed/expected accept JSON numbers (not just strings)."""
    a = ComputationAssertion.model_validate(
        {
            "name": "alpha_em_inv",
            "computed": 137.036,
            "expected": 137.035999084,
            "tolerance": 0.001,
            "source": "CODATA 2022",
        }
    )
    assert a.computed == 137.036


def test_upstream_witness_hash():
    """UpstreamWitnessHash validates with required fields only and
    accepts explicit `null` for the optional ones (which real
    witnesses carry — see canonical-isotope-witness-Z00.witness.json)."""
    h = UpstreamWitnessHash.model_validate(
        {
            "path": "hyperbolic-volumes.witness.json",
            "sha256": "abc123def456",
        }
    )
    assert h.path == "hyperbolic-volumes.witness.json"
    assert h.size_bytes is None

    h_with_nulls = UpstreamWitnessHash.model_validate(
        {
            "path": "low-isotope-binding-sweep.witness.json",
            "sha256": "7917dee289469c3747e4cd19f634c01891534ee0236b942b4acbf07a60cf9433",
            "size_bytes": 7924,
            "commitSha": "06e88b6885fd78860cf1e0d1d01de2a96f5b0811",
            "scriptCommitSha": None,
            "computedAt": None,
        }
    )
    assert h_with_nulls.scriptCommitSha is None
    assert h_with_nulls.computedAt is None


def test_extra_fields_allowed():
    """The witness format is extensible — extra fields don't fail validation."""
    w = ComputationWitness.model_validate(
        {
            "engine": "mpmath",
            "engineVersion": "1.3.0",
            "computedAt": "2026-05-24T00:00:00+00:00",
            "assertions": [],
            "my_custom_field": {"foo": "bar"},
        }
    )
    assert w.engine == "mpmath"


def test_invalid_engine_rejected():
    """Engine enum is closed."""
    with pytest.raises(Exception):
        ComputationWitness.model_validate(
            {
                "engine": "rust",  # not in the enum
                "engineVersion": "1.0",
                "computedAt": "2026-05-24T00:00:00+00:00",
                "assertions": [],
            }
        )


def test_json_schema_file_present():
    """The shipped JSON schema file is at the documented path."""
    schema_path = pathlib.Path(__file__).resolve().parent.parent / "schema" / "witness.schema.json"
    assert schema_path.exists(), f"missing: {schema_path}"
    schema = json.loads(schema_path.read_text())
    assert schema["title"] == "ComputationWitness"
    assert "engine" in schema["properties"]
    assert schema["properties"]["engine"]["enum"][0] == "snappea"


def test_precision_metadata_parses():
    """`precisionMetadata` field is recognised; the live in-repo witnesses
    on main started emitting it on 2026-05-24 (commit 146f3aeac)."""
    from witness_schema import PrecisionMetadata

    pm = PrecisionMetadata.model_validate({
        "compute_dps": 50,
        "output_dps": 40,
        "guard_digits": 10,
        "truncation_bound": "1e-40",
    })
    assert pm.compute_dps == 50
    assert pm.truncation_bound == "1e-40"  # string, not float

    # Top-level field on ComputationWitness
    w = ComputationWitness.model_validate({
        "engine": "mpmath",
        "engineVersion": "1.3.0",
        "computedAt": "2026-05-24T00:00:00+00:00",
        "assertions": [],
        "precisionMetadata": {
            "compute_dps": 50,
            "output_dps": 40,
            "guard_digits": 10,
            "truncation_bound": "1e-40",
        },
    })
    assert w.precisionMetadata is not None
    assert w.precisionMetadata.compute_dps == 50


def test_precision_metadata_optional():
    """Witnesses without precisionMetadata still validate."""
    w = ComputationWitness.model_validate({
        "engine": "mpmath",
        "engineVersion": "1.3.0",
        "computedAt": "2026-05-24T00:00:00+00:00",
        "assertions": [],
    })
    assert w.precisionMetadata is None
