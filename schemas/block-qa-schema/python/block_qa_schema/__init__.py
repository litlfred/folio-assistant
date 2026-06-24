"""block-qa-schema — Pydantic models for the QOU block-QA sidecar format.

The canonical schemas are ``tools/block-qa-schema/schema/block-qa.schema.json``
(the per-block ``<block>.qa.json`` report) and
``tools/block-qa-schema/schema/qa-script.schema.json`` (the per-criterion
``<criterion-id>.script.json`` checker-staleness sidecar). This module ships
Pydantic v2 models that validate against the same shapes. Used by any Python
consumer that reads the QA sidecars emitted by the QOU qa-sweep pipeline
(``content/pipeline/qa-sweep.ts``; producing types in
``folio-assistant/schemas/block-qa.ts``).

Example::

    from block_qa_schema import BlockQaReport

    with open("carbon-valence.qa.json") as f:
        report = BlockQaReport.model_validate_json(f.read())

    for criterion, entries in report.criteria.items():
        latest = entries[-1]
        print(criterion, "→", latest.result, latest.reviewer.kind)
"""

from __future__ import annotations

from typing import Literal, Optional, Union

from pydantic import BaseModel, ConfigDict, Field, model_validator

__version__ = "0.1.0"

QaReviewerKind = Literal["script", "agent", "human"]

QaResult = Literal["pass", "fail", "warn", "n/a"]

QaSeverity = Literal["critical", "major", "minor"]

DaScope = Literal["limited", "structural"]
DaRuling = Literal["surviving", "rebutted", "partial"]
DaVerdict = Literal["clean", "survivable-objection", "open-objection"]


class QaReviewer(BaseModel):
    """Identity + provenance of the reviewer that produced an entry.

    ``kind: "script"`` entries carry the checker's own ``script_hash`` (plus
    ``deps_hash`` for extra inputs) so a checker bug fix auto-stales every
    verdict it ever wrote. ``kind: "agent"`` entries carry the model id,
    session, and dispatching skill so heterogeneous models can audit one
    another's verdicts. ``kind: "human"`` is the final-authority tier.
    """

    model_config = ConfigDict(extra="allow")

    kind: QaReviewerKind
    id: str
    version: Optional[str] = None
    # kind: "script" provenance — staleness drivers
    script_hash: Optional[str] = None
    script_commit_sha: Optional[str] = None
    deps_hash: Optional[str] = None
    # kind: "agent" provenance — model-level audit trail
    agent_model: Optional[str] = None
    agent_session: Optional[str] = None
    agent_date: Optional[str] = None
    agent_skill: Optional[str] = None


class QaFieldHash(BaseModel):
    """12-char SHA-256 prefixes of each source file's UTF-8 bytes.

    Absent fields mean the audit did not depend on that file (or it did
    not exist at audit time).
    """

    model_config = ConfigDict(extra="allow")

    md: Optional[str] = None
    ts: Optional[str] = None
    lean: Optional[str] = None


class QaScore(BaseModel):
    """Rubric score for rater-style quality criteria (``proof-rater-*``).

    A quality measure to improve over time, not a pass/fail gate.
    Convention: value/max >= 0.66 maps to result "pass", 0.33-0.66 to
    "warn", < 0.33 to "fail".
    """

    model_config = ConfigDict(extra="allow")

    value: float
    max: float
    rubric: Optional[dict[str, float]] = None


class QaEvidenceItem(BaseModel):
    """One structured evidence location.

    Some agent reviewers (voice axis especially) emit evidence as a list
    of ``{line, text}`` locations rather than a single string; the live
    corpus carries both shapes.
    """

    model_config = ConfigDict(extra="allow")

    line: Optional[int] = None
    text: Optional[str] = None


class QaCriterionEntry(BaseModel):
    """The outcome of one reviewer evaluating one criterion on one block.

    A verdict whose ``field_hash`` no longer matches the present source
    files is stale and must be re-run. ``reviewed_sha`` is recommended but
    optional — legacy agent entries (pre-2026-06) omit it.
    """

    model_config = ConfigDict(extra="allow")

    field_hash: QaFieldHash
    result: QaResult
    severity: Optional[QaSeverity] = None
    score: Optional[QaScore] = None
    evidence: Optional[Union[str, list[QaEvidenceItem]]] = None
    # Descriptive structural measures a checker emits alongside its verdict
    # (e.g. the detangler axis's tanglement_score / cone_size / pagerank /
    # graph_energy snapshot) — not a quality score.
    metrics: Optional[dict[str, Union[int, float, str]]] = None
    
    # ── da-axis extension fields ──
    scope: Optional[DaScope] = None
    ruling: Optional[DaRuling] = None
    referee_argument: Optional[str] = None
    rebuttal: Optional[str] = None
    verdict: Optional[DaVerdict] = None

    reviewer: QaReviewer
    # ISO-8601 UTC datetime; legacy agent entries may carry a bare ISO date.
    reviewed_at: str
    reviewed_sha: Optional[str] = None
    notes: Optional[str] = None

    @model_validator(mode="after")
    def validate_da_constraints(self) -> "QaCriterionEntry":
        if self.ruling == "surviving" and self.result != "fail":
            raise ValueError("result must be 'fail' when ruling is 'surviving'")
        if self.ruling == "partial" and self.result != "warn":
            raise ValueError("result must be 'warn' when ruling is 'partial'")
        if self.ruling == "rebutted" and self.result != "pass":
            raise ValueError("result must be 'pass' when ruling is 'rebutted'")
            
        if self.verdict == "open-objection" and self.result != "fail":
            raise ValueError("result must be 'fail' when verdict is 'open-objection'")
        if self.verdict == "survivable-objection" and self.result != "warn":
            raise ValueError("result must be 'warn' when verdict is 'survivable-objection'")
        if self.verdict == "clean" and self.result != "pass":
            raise ValueError("result must be 'pass' when verdict is 'clean'")
            
        if self.scope == "structural":
            if not self.rebuttal:
                raise ValueError("structural scope requires a non-empty rebuttal")
            if not self.referee_argument:
                raise ValueError("structural scope requires a non-empty referee_argument")
                
        return self


class QaPaths(BaseModel):
    """Paths to the block's source files, relative to repo root."""

    model_config = ConfigDict(extra="allow")

    ts: str
    md: Optional[str] = None
    lean: Optional[str] = None


class BlockQaReport(BaseModel):
    """Top-level shape of a ``<block>.qa.json`` sidecar.

    ``criteria`` maps each criterion id to an append-only array of reviewer
    entries; multiple reviewers (script + agent + human) may co-exist and
    are NOT deduplicated. The criterion's current verdict is the most
    recent entry whose ``field_hash`` matches the present source files.
    """

    model_config = ConfigDict(extra="allow", populate_by_name=True)

    schema_marker: Literal["block-qa/v1"] = Field(alias="$schema")
    label: str
    kind: str
    paths: QaPaths
    source_hashes: QaFieldHash
    criteria: dict[str, list[QaCriterionEntry]]
    updated_at: str


class QaScriptSidecar(BaseModel):
    """Per-criterion ``<criterion-id>.script.json`` checker-staleness sidecar.

    Records the canonical (script_hash, script_commit_sha, deps_hash)
    triple at the most recent qa-sweep run — the single-source-of-truth
    view of "is checker X currently stale globally?".
    """

    model_config = ConfigDict(extra="allow", populate_by_name=True)

    schema_marker: Literal["qa-script/v1"] = Field(alias="$schema")
    criterion_id: str
    source_file: str
    script_hash: str
    script_commit_sha: str
    extra_inputs: Optional[list[str]] = None
    deps_hash: Optional[str] = None
    last_run_at: str
    last_run_sha: str
    engine_version: Optional[str] = None


__all__ = [
    "__version__",
    "QaReviewerKind",
    "QaResult",
    "QaSeverity",
    "DaScope",
    "DaRuling",
    "DaVerdict",
    "QaReviewer",
    "QaFieldHash",
    "QaScore",
    "QaEvidenceItem",
    "QaCriterionEntry",
    "QaPaths",
    "BlockQaReport",
    "QaScriptSidecar",
]
