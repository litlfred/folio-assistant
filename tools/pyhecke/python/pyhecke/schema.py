"""JSON Schema validation for certificate-*.json and *.witness.json.

Uses Draft 2020-12. Schemas live under tools/hecke-engine/schemas/.
"""

from __future__ import annotations

import functools
import json
from pathlib import Path
from typing import Any

try:
    import jsonschema
    from jsonschema import Draft202012Validator
except ImportError as e:  # pragma: no cover
    raise ImportError(
        "pyhecke.schema requires `jsonschema` — install with\n"
        "    pip install jsonschema"
    ) from e


_SCHEMA_DIR_ENV = "PYHECKE_SCHEMA_DIR"


def schema_dir() -> Path:
    """Return the directory containing the JSON schemas.

    Search order:
      1. $PYHECKE_SCHEMA_DIR environment variable
      2. tools/hecke-engine/schemas/ relative to the installed package
      3. <repo-root>/tools/hecke-engine/schemas/ by walking up from cwd
    """
    import os

    env = os.environ.get(_SCHEMA_DIR_ENV)
    if env:
        p = Path(env)
        if (p / "certificate.schema.json").is_file():
            return p

    # Installed next to the package.
    pkg_candidate = Path(__file__).resolve().parent.parent.parent.parent / "hecke-engine" / "schemas"
    if (pkg_candidate / "certificate.schema.json").is_file():
        return pkg_candidate

    # Walk up from cwd looking for a repo root marker.
    d = Path.cwd().resolve()
    while d != d.parent:
        candidate = d / "tools" / "hecke-engine" / "schemas"
        if (candidate / "certificate.schema.json").is_file():
            return candidate
        d = d.parent

    raise FileNotFoundError(
        "Could not locate schema directory. Set $PYHECKE_SCHEMA_DIR or run "
        "from within the qou repository."
    )


@functools.lru_cache(maxsize=4)
def load_schema(kind: str) -> dict:
    """Load a named schema. `kind` is 'certificate' or 'witness'.

    Cached via lru_cache so CI batches that validate all 51 certs
    against the certificate schema (× 3 Python versions) skip 150 of
    151 disk reads.
    """
    if kind not in ("certificate", "witness"):
        raise ValueError(f"unknown schema kind: {kind!r}")
    path = schema_dir() / f"{kind}.schema.json"
    with path.open(encoding="utf-8") as f:
        return json.load(f)


@functools.lru_cache(maxsize=4)
def validator(kind: str) -> Draft202012Validator:
    """Return a compiled validator for the named schema.

    Cached — the Draft202012Validator construction is ~5-15 ms of
    schema compilation that we would otherwise pay per `validate()`
    call. With 51 committed certs, this saves ~500 ms on every full
    validation sweep.
    """
    return Draft202012Validator(load_schema(kind))


def validate(kind: str, obj: Any) -> None:
    """Validate an object against the named schema. Raises on failure.

    Parameters
    ----------
    kind : str
        'certificate' or 'witness'.
    obj : dict
        Parsed JSON object to validate.
    """
    validator(kind).validate(obj)


def iter_errors(kind: str, obj: Any):
    """Yield all jsonschema errors for `obj` against the named schema."""
    yield from validator(kind).iter_errors(obj)


def validate_file(kind: str, path: str | Path) -> None:
    """Validate a JSON file on disk against the named schema."""
    with Path(path).open(encoding="utf-8") as f:
        obj = json.load(f)
    validate(kind, obj)
