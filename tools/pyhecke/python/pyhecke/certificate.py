"""Certificate loading + validation.

Thin wrapper around pyhecke.schema that typesafes access to the
common fields emitted by tools/hecke-engine/ binaries.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Optional

from . import schema as _schema


@dataclass
class Isotope:
    z: int
    n: int
    a: int
    symbol: Optional[str] = None
    name: Optional[str] = None


@dataclass
class Engine:
    name: str
    version: str
    commit: Optional[str] = None
    binary: Optional[str] = None


@dataclass
class Certificate:
    isotope: Isotope
    engine: Engine
    f_pauli_f64: Optional[float] = None
    tr_alt_f64: Optional[float] = None
    net_f64: Optional[float] = None
    raw: Optional[dict] = None

    @classmethod
    def from_dict(cls, obj: dict) -> "Certificate":
        iso = obj["isotope"]
        eng = obj["engine"]
        return cls(
            isotope=Isotope(
                z=iso["z"], n=iso["n"], a=iso["a"],
                symbol=iso.get("symbol"), name=iso.get("name"),
            ),
            engine=Engine(
                name=eng["name"], version=eng["version"],
                commit=eng.get("commit"), binary=eng.get("binary"),
            ),
            f_pauli_f64=obj.get("f_pauli_f64"),
            tr_alt_f64=obj.get("tr_alt_f64"),
            net_f64=obj.get("net_f64"),
            raw=obj,
        )


def load(path: str | Path, validate: bool = True) -> Certificate:
    """Load and (optionally) validate a certificate file."""
    with Path(path).open(encoding="utf-8") as f:
        obj = json.load(f)
    if validate:
        _schema.validate("certificate", obj)
    return Certificate.from_dict(obj)


def load_all(
    directory: str | Path, pattern: str = "certificate-*.json",
    validate: bool = True,
) -> list[Certificate]:
    """Load every certificate in a directory."""
    paths = sorted(Path(directory).glob(pattern))
    return [load(p, validate=validate) for p in paths]
