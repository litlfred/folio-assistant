"""Immutable result records returned by qou_mass public API."""
from __future__ import annotations

from dataclasses import dataclass, field
from decimal import Decimal
from typing import Any, Mapping, Optional


@dataclass(frozen=True, slots=True)
class BraidWord:
    """Canonical braid word for an atom (Z, N).

    Two parallel sequences:
      - generator indices (1-based, signed: + = σ, − = σ⁻¹)
      - crossing labels (intra-nucleon, inter-nucleon, closure)
    """
    n_strands: int
    generators: tuple[int, ...]
    crossing_types: tuple[str, ...]


@dataclass(frozen=True, slots=True)
class Witness:
    """Provenance + parameter capture for a single prediction.

    Mirrors the QOU witness JSON contract (engine, scriptFile,
    commitSha, computedAt, parameters, data) so a `Witness.to_json()`
    round-trips to the same shape consumed by the paper CI.
    """
    engine: str
    engine_version: str
    computed_at: str          # ISO 8601 UTC
    commit_sha: str
    script_file: str
    script_hash: str
    description: str
    parameters: Mapping[str, Any]
    data: Mapping[str, Any]
    upstream_witness_hashes: tuple[Mapping[str, Any], ...] = ()

    def to_json(self, path: str | None = None, *, indent: int = 2) -> str:
        """Serialise to JSON; optionally write to `path`."""
        import json
        obj = {
            "engine": self.engine,
            "engineVersion": self.engine_version,
            "computedAt": self.computed_at,
            "commitSha": self.commit_sha,
            "scriptFile": self.script_file,
            "scriptHash": self.script_hash,
            "description": self.description,
            "parameters": dict(self.parameters),
            "data": dict(self.data),
            "upstream_witness_hashes": [dict(u) for u in self.upstream_witness_hashes],
        }
        s = json.dumps(obj, indent=indent, default=str, ensure_ascii=False)
        if path is not None:
            with open(path, "w", encoding="utf-8") as fh:
                fh.write(s + "\n")
        return s


@dataclass(frozen=True, slots=True)
class Prediction:
    """A single mass / binding-energy / |tr_M| prediction.

    Fields are populated based on `observable`:
      - "binding_energy": value is B_pred in MeV; uncertainty optional.
      - "mass":           value is m_pred in MeV; ppm_vs_codata populated.
      - "tr_M":           value is |tr_M(β_atom, q_0)|, dimensionless.
      - "mass_excess":    value is Δ (M − A·u) in MeV.
    """
    atom: str
    Z: int
    N: int
    observable: str
    value: Decimal
    units: str
    uncertainty: Optional[Decimal] = None
    ppm_vs_codata: Optional[Decimal] = None
    method: str = "auto"
    precision_dps: int = 50
    q_value: Optional[Decimal] = None
    witness: Optional[Witness] = None
    intermediates: Mapping[str, Decimal] = field(default_factory=dict)

    def __str__(self) -> str:
        u = f" ± {self.uncertainty}" if self.uncertainty else ""
        ppm = (
            f" ({self.ppm_vs_codata:+.3f} ppm vs CODATA)"
            if self.ppm_vs_codata is not None else ""
        )
        return f"{self.atom}: {self.value} {self.units}{u}{ppm}"
