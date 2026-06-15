# polynomial_q_not_applicable: library / no own witness output; sympy used internally by callers.
"""
Unified witness infrastructure for QOU computation scripts.

Every Python computation that produces a witness statement should use
this module to ensure consistent structure, commit SHA tracking, and
content-block integration.

Usage:
    from qou_substrate.witness import WitnessBuilder
    # equivalently: from qou_substrate import WitnessBuilder

    w = WitnessBuilder("my-computation", engine="sympy")
    w.set_description("Computes foo from bar")
    w.add_assertion("Vol(4_1)", computed=2.0298, expected=2.0298, tolerance=1e-10, source="SnapPy")
    w.add_parameter("q", q0)
    w.add_data("extra_result", {"key": "value"})
    w.set_content_block("prop:my-proposition")
    w.save()  # writes my-computation.witness.json

The output conforms to the ComputationWitness interface in
folio-assistant/schemas/types.ts.

@module qou_substrate.witness
"""

import hashlib
import json
import os
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Mapping, Optional, Union


# ── Git helpers ──────────────────────────────────────────────────

def _repo_root() -> Path:
    """Find the repository root (walk up from this file)."""
    d = Path(__file__).resolve().parent
    while d != d.parent:
        if (d / ".git").exists():
            return d
        d = d.parent
    return Path(__file__).resolve().parent.parent.parent


def _git_head_sha() -> str:
    """Return the current HEAD commit SHA."""
    try:
        return subprocess.check_output(
            ["git", "rev-parse", "HEAD"],
            cwd=str(_repo_root()),
            stderr=subprocess.DEVNULL,
        ).decode().strip()
    except Exception as exc:  # noqa: BLE001
        if not getattr(_git_head_sha, "_warned", False):
            print(
                f"[qou_substrate.witness] git rev-parse failed ({exc!r}); "
                "commitSha will serialise as 'unknown'. Common cause in "
                "fresh sandboxes: dubious-ownership refusal — run "
                "`git config --global --add safe.directory <repo-root>`.",
                file=sys.stderr,
            )
            _git_head_sha._warned = True  # type: ignore[attr-defined]
        return "unknown"


def _git_file_sha(path: str) -> str:
    """Return the last commit SHA that touched a given file. `git log` exits
    cleanly with empty stdout for paths that have never been committed
    (e.g. a script generating its first witness pre-commit), so empty
    output is also normalised to "unknown" — matching `_git_head_sha`.

    Per Copilot review on PR #484: never return an ambiguous empty
    string; "unknown" is the canonical sentinel and serialises into
    witness JSON as a clear marker rather than `""`.

    An *exception* (as opposed to empty output) means the git
    invocation itself failed — e.g. the sandbox's dubious-ownership
    refusal when the checkout is owned by another uid. That case is
    warned to stderr instead of being silently conflated with the
    legitimate "file not yet committed" case (2026-06-13)."""
    try:
        sha = subprocess.check_output(
            ["git", "log", "-1", "--format=%H", "--", path],
            cwd=str(_repo_root()),
            stderr=subprocess.DEVNULL,
        ).decode().strip()
        return sha if sha else "unknown"
    except Exception as exc:  # noqa: BLE001
        if not getattr(_git_file_sha, "_warned", False):
            print(
                f"[qou_substrate.witness] git log failed for {path!r} "
                f"({exc!r}); scriptCommitSha will serialise as 'unknown'. "
                "Common cause in fresh sandboxes: dubious-ownership "
                "refusal — run `git config --global --add safe.directory "
                "<repo-root>`. (Warned once; further failures are "
                "silent.)",
                file=sys.stderr,
            )
            _git_file_sha._warned = True  # type: ignore[attr-defined]
        return "unknown"


def file_content_hash(path: str, length: int = 12) -> str:
    """SHA-256 content hash (hex prefix) of a file, matching lean-witness.ts."""
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    return hashlib.sha256(content.encode("utf-8")).hexdigest()[:length]


# ── Environment capture (software/library versions) ──────────────

def capture_environment() -> dict:
    """Capture the interpreter + numeric-library versions that produced a
    witness.

    Recorded in every witness under ``environment`` so version-driven drift
    is *attributable* — e.g. a different mpmath/sympy build shifting q₀ at
    ~1e-8 and cascading into every derived mass is now visible in the
    witness rather than an unexplained diff. Versions are read from package
    metadata (no module imports forced); missing packages are simply
    omitted. The list is deliberately small (the libraries whose version
    actually affects numeric output).
    """
    import importlib.metadata as _md

    env: dict[str, str] = {"python": sys.version.split()[0]}
    for pkg in ("numpy", "scipy", "sympy", "mpmath", "pyhecke-native", "clarabel"):
        try:
            env[pkg.replace("-", "_")] = _md.version(pkg)
        except Exception:
            # Not installed / no metadata — omit rather than guess.
            pass
    return env


# ── Upstream-witness hash recording (anti-staleness) ────────────

def load_and_hash_upstream(path: Union[str, Path]) -> tuple[dict, dict]:
    """Load an upstream witness file and return (body, hash_record).

    The hash_record is the data a downstream consumer needs to verify
    it has the same upstream as when its own witness was last
    regenerated: file sha256, commitSha, scriptCommitSha, computedAt.

    See ``witness_dependency_drift.py`` for the validator that walks
    ``upstream_witness_hashes`` arrays and reports staleness.
    See ``docs/audits/2026-05-16-stale-witness-infra-gap.md`` for
    the adoption pattern.
    """
    p = Path(path)
    if not p.exists():
        raise FileNotFoundError(
            f"Required upstream witness not found: {p}\n"
            f"Run its producer first."
        )
    raw = p.read_bytes()
    body = json.loads(raw.decode("utf-8"))
    return body, {
        "path":            p.name,
        "sha256":          hashlib.sha256(raw).hexdigest(),
        "size_bytes":      len(raw),
        "commitSha":       body.get("commitSha"),
        "scriptCommitSha": body.get("scriptCommitSha"),
        "computedAt":      body.get("computedAt"),
    }


# ── Assertion type ───────────────────────────────────────────────

class Assertion:
    """A single named claim with computed vs expected values."""

    def __init__(
        self,
        name: str,
        computed: Union[float, str],
        expected: Union[float, str],
        tolerance: Optional[float] = None,
        unit: Optional[str] = None,
        source: Optional[str] = None,
    ):
        self.name = name
        self.computed = computed
        self.expected = expected
        self.tolerance = tolerance
        self.unit = unit
        self.source = source

    @property
    def passed(self) -> bool:
        if self.tolerance is None:
            return self.computed == self.expected
        try:
            return abs(float(self.computed) - float(self.expected)) <= self.tolerance
        except (ValueError, TypeError):
            return str(self.computed) == str(self.expected)

    def to_dict(self) -> dict:
        d: dict[str, Any] = {
            "name": self.name,
            "computed": self.computed,
            "expected": self.expected,
            "passed": self.passed,
        }
        if self.tolerance is not None:
            d["tolerance"] = self.tolerance
        if self.unit:
            d["unit"] = self.unit
        if self.source:
            d["source"] = self.source
        return d


# ── WitnessBuilder ───────────────────────────────────────────────

class WitnessBuilder:
    """
    Build a structured witness JSON conforming to ComputationWitness.

    Automatically captures:
      - Git commit SHA (HEAD and script file)
      - Script content hash (for staleness detection)
      - Timestamp
      - Engine and version
      - Execution duration

    Parameters
    ----------
    name : str
        Computation name (becomes the filename: `<name>.witness.json`).
    engine : str
        One of: "sympy", "mpmath", "snappea", "sage", "numpy", "python".
    engine_version : str, optional
        Explicit version string. Auto-detected if omitted.
    output_dir : str or Path, optional
        Directory for the witness file. Defaults to the directory of
        the calling script.
    """

    def __init__(
        self,
        name: str,
        engine: str = "python",
        engine_version: Optional[str] = None,
        output_dir: Optional[Union[str, Path]] = None,
        start_time: Optional[float] = None,
        _script_path: Optional[Union[str, Path]] = None,
    ):
        self.name = name
        self.engine = engine
        self.engine_version = engine_version or self._detect_version(engine)
        # `start_time` lets callers pre-stamp the duration baseline at
        # the *start* of an expensive computation, then construct the
        # builder later (e.g. via `wrap_legacy`) without losing the
        # measurement. Falls back to "now" for builders constructed
        # before the work begins (the original pattern).
        self._start_time = (
            start_time if start_time is not None else time.monotonic()
        )

        # Resolve caller frame ONLY when script path not explicitly
        # provided (factory classmethods like ``wrap_legacy`` pass it
        # in directly so they don't capture witness_base.py itself).
        if _script_path is not None:
            caller_file = Path(_script_path).resolve()
        else:
            import inspect
            caller_frame = inspect.stack()[1]
            caller_file = Path(caller_frame.filename).resolve()
        self._script_path = caller_file

        # Determine output directory
        if output_dir:
            self._output_dir = Path(output_dir)
        else:
            self._output_dir = caller_file.parent

        self.description: Optional[str] = None
        self.content_block: Optional[str] = None
        self.audit_only: Optional[str] = None
        self.assertions: list[Assertion] = []
        self.parameters: dict[str, Any] = {}
        self.data: dict[str, Any] = {}
        self.caveats: list[str] = []
        # Anti-staleness hashes for every upstream witness this
        # builder's caller has consumed.  Populated via
        # ``add_upstream(path)``; emitted by ``build()`` under
        # ``data.upstream_witness_hashes`` for the drift validator
        # (``witness_dependency_drift.py``) to walk.
        self._upstream_hashes: list[dict] = []
        # Extra top-level keys (used by wrap_legacy to preserve the
        # original flat layout of hand-written witnesses during P30
        # migration). Merged in by ``build()`` after the structured
        # fields, so structured values win on key collision.
        self._extra_top_level: dict[str, Any] = {}

    @staticmethod
    def _detect_version(engine: str) -> str:
        """Auto-detect engine version."""
        try:
            if engine == "sympy":
                import sympy
                return f"sympy {sympy.__version__}"
            elif engine == "mpmath":
                import mpmath
                return f"mpmath {mpmath.__version__}"
            elif engine in ("snappea", "snappy"):
                import snappy
                return f"snappy {snappy.version()}"
            elif engine == "sage":
                return "sage (version not detected)"
            elif engine == "numpy":
                import numpy
                return f"numpy {numpy.__version__}"
            else:
                return f"python {sys.version.split()[0]}"
        except ImportError:
            return f"{engine} (not installed)"

    def set_description(self, desc: str) -> "WitnessBuilder":
        """Set the human-readable description."""
        self.description = desc
        return self

    def set_content_block(self, label: str) -> "WitnessBuilder":
        """Link this witness to a content block label (e.g. 'prop:foo')."""
        self.content_block = label
        return self

    def set_audit_only(self, report_path: str) -> "WitnessBuilder":
        """Mark this witness as audit-only — produced by an audit/probe whose
        report lives in ``docs/audits/*.md`` and which is **not expected** to
        wire to a content block via ``computation.witness``.

        Setting this field excludes the witness from the orphan tally
        computed by ``scripts/audit-wiring.ts``.

        Parameters
        ----------
        report_path : str
            Path to the audit report (typically
            ``docs/audits/YYYY-MM-DD-<slug>.md``), relative to repo root.

        Examples
        --------
        ::

            w = WitnessBuilder("path-b-evacuation", engine="numpy")
            w.set_audit_only("docs/audits/2026-05-06-path-b-evacuation.md")
            ... # compute
            w.save()
        """
        self.audit_only = report_path
        return self

    def add_assertion(
        self,
        name: str,
        computed: Union[float, str],
        expected: Union[float, str],
        tolerance: Optional[float] = None,
        unit: Optional[str] = None,
        source: Optional[str] = None,
    ) -> "WitnessBuilder":
        """Add a named assertion."""
        self.assertions.append(
            Assertion(name, computed, expected, tolerance, unit, source)
        )
        return self

    def add_parameter(self, key: str, value: Any) -> "WitnessBuilder":
        """Record an input parameter."""
        self.parameters[key] = value
        return self

    def add_data(self, key: str, value: Any) -> "WitnessBuilder":
        """Attach arbitrary computation data."""
        self.data[key] = value
        return self

    def add_caveat(self, text: str) -> "WitnessBuilder":
        """Add a caveat or limitation note."""
        self.caveats.append(text)
        return self

    def add_upstream(self, path: Union[str, Path]) -> dict:
        """Load an upstream witness file, record its hash, return body.

        Replaces ``json.loads(path.read_text())`` at the call site
        while accumulating the sha256 + commit-SHA + computedAt of
        every upstream consumed.  The accumulated list is emitted by
        ``build()`` under ``data.upstream_witness_hashes`` for the
        drift validator ``witness_dependency_drift.py`` to walk.

        See ``docs/audits/2026-05-16-stale-witness-infra-gap.md`` for
        the rationale.
        """
        body, hash_record = load_and_hash_upstream(path)
        self._upstream_hashes.append(hash_record)
        return body

    # ── Reserved structured keys used by ``wrap_legacy`` ─────────
    # Keys that are routed to dedicated WitnessBuilder slots rather
    # than being preserved as raw top-level fields. Anything else in
    # the legacy payload is kept verbatim under ``_extra_top_level``.
    _RESERVED_LEGACY_KEYS = frozenset({
        "computation",
        "description",
        "contentBlock",
        "auditOnly",
        "engine",
        "engineVersion",
        "computedAt",
        "commitSha",
        "scriptFile",
        "scriptHash",
        "scriptCommitSha",
        "durationMs",
        "allPassed",
        "assertions",
    })

    @classmethod
    def wrap_legacy(
        cls,
        name: str,
        payload: Mapping[str, Any],
        *,
        script_path: Union[str, Path],
        engine: str = "python",
        engine_version: Optional[str] = None,
        output_dir: Optional[Union[str, Path]] = None,
        start_time: Optional[float] = None,
    ) -> "WitnessBuilder":
        """Wrap a legacy hand-written witness payload.

        Migrates a pre-existing ``json.dump(out_dict, f)`` writer to
        the ``WitnessBuilder`` API **without** changing the on-disk
        layout: every original top-level key is preserved verbatim,
        and the structured fields ``scriptHash``, ``scriptCommitSha``,
        ``engine``, ``engineVersion``, ``computedAt``, and
        ``durationMs`` are added so that ``run_pipeline.py`` can
        detect staleness (P30 in the compute-audit catalogue).

        Reserved keys (``description``, ``auditOnly``, etc.) are
        routed to their structured slots; everything else is held in
        ``_extra_top_level`` and emitted verbatim by ``build()``.

        Parameters
        ----------
        name : str
            Witness filename stem (becomes ``<name>.witness.json``).
        payload : Mapping[str, Any]
            The dict the legacy script was dumping with ``json.dump``.
        script_path : str or Path
            Absolute path to the calling script. Required because
            ``wrap_legacy`` is a classmethod and cannot reliably
            inspect the caller frame.
        engine, engine_version, output_dir
            Same as the constructor.

        Returns
        -------
        WitnessBuilder
            A builder whose ``save()`` will produce a witness JSON
            that contains every original key plus the staleness
            metadata. Bit-equivalence on the original keys is
            preserved.

        Example
        -------
        ::

            out = {"computation": "my-thing", "description": "...", ...}
            (WitnessBuilder.wrap_legacy(
                "my-thing", out, script_path=__file__,
                engine="mpmath",
            )
                .set_audit_only("docs/audits/2026-05-08-compute-audit-workplan.md")
                .save())
        """
        # Use the explicit script_path; engine_version is auto-detected
        # if not supplied. `start_time` lets the caller pre-stamp the
        # duration baseline (taken at the start of the heavy compute,
        # before `wrap_legacy` is invoked) so `durationMs` reflects
        # real runtime rather than just the save step.
        builder = cls(
            name=name,
            engine=engine,
            engine_version=engine_version,
            output_dir=output_dir,
            start_time=start_time,
            _script_path=script_path,
        )
        for key, value in payload.items():
            if key == "description" and isinstance(value, str):
                builder.set_description(value)
            elif key == "contentBlock" and isinstance(value, str):
                builder.set_content_block(value)
            elif key == "auditOnly" and isinstance(value, str):
                builder.set_audit_only(value)
            elif key == "computation":
                # Filename already encodes this; skip to avoid duplicate
                continue
            elif key in cls._RESERVED_LEGACY_KEYS:
                # Skip auto-generated metadata; build() will recompute
                continue
            else:
                builder._extra_top_level[key] = value
        return builder

    @staticmethod
    def stamp_staleness_metadata(
        payload: dict,
        *,
        script_path: Union[str, Path],
        engine: str = "python",
        engine_version: Optional[str] = None,
    ) -> dict:
        """Public helper: stamp the WitnessBuilder staleness fields onto
        an existing dict in place (used when the legacy filename is
        non-standard and ``wrap_legacy().save()`` cannot be applied
        without breaking consumers).

        Mutates and returns ``payload`` with ``scriptHash``,
        ``scriptCommitSha``, ``commitSha``, ``engine``, ``engineVersion``,
        ``computedAt``, and ``durationMs`` set. Avoids the need to
        import the underscore-prefixed ``_git_head_sha`` /
        ``_git_file_sha`` helpers from outside this module.
        """
        spath = str(script_path)
        payload["scriptHash"] = file_content_hash(spath)
        payload["scriptCommitSha"] = _git_file_sha(spath)
        payload["commitSha"] = _git_head_sha()
        payload["engine"] = engine
        payload["computedAt"] = datetime.now(timezone.utc).isoformat()
        payload["durationMs"] = 0
        if engine_version is None:
            # Mirror the auto-detection logic in __init__
            try:
                if engine == "mpmath":
                    import mpmath
                    engine_version = f"mpmath {mpmath.__version__}"
                elif engine == "sympy":
                    import sympy
                    engine_version = f"sympy {sympy.__version__}"
                elif engine == "python+mpmath":
                    import mpmath
                    engine_version = (
                        f"python {sys.version_info.major}."
                        f"{sys.version_info.minor} + "
                        f"mpmath {mpmath.__version__}"
                    )
            except Exception:
                pass
        if engine_version is not None:
            payload["engineVersion"] = engine_version
        return payload

    def is_fresh(self) -> bool:
        """Return True if an existing witness JSON on disk records the
        same script content hash as the current source.

        Use this to short-circuit expensive recomputations::

            w = WitnessBuilder("my-computation", engine="sympy")
            if w.is_fresh():
                print(f"✓ {w.name}.witness.json fresh; skipping")
                return
            ... # expensive compute
            w.add_assertion(...)
            w.save()

        Returns False if the witness file does not exist, is malformed,
        or records a different `scriptHash`.
        """
        out_path = self._output_dir / f"{self.name}.witness.json"
        if not out_path.is_file():
            return False
        try:
            with out_path.open("r", encoding="utf-8") as f:
                existing = json.load(f)
        except (json.JSONDecodeError, OSError):
            return False
        current_hash = file_content_hash(str(self._script_path))
        return existing.get("scriptHash") == current_hash

    def build(self) -> dict:
        """Build the witness dictionary (without writing to disk)."""
        duration_ms = int((time.monotonic() - self._start_time) * 1000)
        head_sha = _git_head_sha()
        script_sha = _git_file_sha(str(self._script_path))
        script_hash = file_content_hash(str(self._script_path))

        all_passed = all(a.passed for a in self.assertions)

        witness: dict[str, Any] = {
            # ── Structured fields (ComputationWitness interface) ──
            "engine": self.engine,
            "engineVersion": self.engine_version,
            "computedAt": datetime.now(timezone.utc).isoformat(),
            "commitSha": head_sha,
            "assertions": [a.to_dict() for a in self.assertions],
            "allPassed": all_passed,
            "durationMs": duration_ms,
            # ── Extended fields for staleness tracking ──
            "computation": self.name,
            "scriptFile": self._script_path.name,
            "scriptHash": script_hash,
            "scriptCommitSha": script_sha,
        }

        # ── Precision metadata (from qou_substrate.precision) ──────
        # Records the compute library's error floor so downstream
        # consumers know the truncation bound of every serialized value.
        try:
            from qou_substrate.precision import (
                COMPUTE_DPS, OUTPUT_DPS, PRECISION_GUARD,
            )
            witness["precisionMetadata"] = {
                "compute_dps": COMPUTE_DPS,
                "output_dps": OUTPUT_DPS,
                "guard_digits": PRECISION_GUARD,
                "truncation_bound": f"1e-{OUTPUT_DPS}",
            }
        except ImportError:
            pass

        # ── Environment / software versions ────────────────────────
        # Interpreter + numeric-library versions, so version-driven drift
        # (e.g. mpmath/sympy shifting q₀ at ~1e-8) is attributable.
        witness["environment"] = capture_environment()

        if self.description:
            witness["description"] = self.description
        if self.content_block:
            witness["contentBlock"] = self.content_block
        if self.audit_only:
            witness["auditOnly"] = self.audit_only
        if self.parameters:
            witness["parameters"] = self.parameters
        # Surface accumulated upstream hashes in ``data`` so the drift
        # validator (witness_dependency_drift.py) can find them.  Done
        # before the ``self.data`` check so a builder that tracked
        # only upstreams (no other data) still emits the field.
        if self._upstream_hashes:
            self.data.setdefault(
                "upstream_witness_hashes", self._upstream_hashes
            )
        if self.data:
            witness["data"] = self.data
        if self.caveats:
            witness["caveats"] = self.caveats

        # Append legacy top-level keys captured by ``wrap_legacy``
        # WITHOUT overwriting structured fields above. This preserves
        # the original layout of hand-written witnesses during P30
        # migration so downstream readers that key on top-level paths
        # do not break.
        for k, v in self._extra_top_level.items():
            if k not in witness:
                witness[k] = v

        return witness

    def save(self, extra: Optional[dict] = None) -> Path:
        """Build and write the witness JSON file. Returns the path.

        **Content-diff-aware:** if the on-disk witness already exists and
        differs from the new one ONLY in ephemeral meta fields (commitSha,
        scriptCommitSha, computedAt, durationMs), the on-disk file is
        PRESERVED unchanged. This breaks the CI drift loop (each commit
        embeds a fresh commitSha, but CI's strict-diff check would always
        fail) while keeping commitSha as a staleness audit-trail: it
        records the LAST commit that substantively changed the witness
        content, not the most recent commit that ran the validator.
        """
        witness = self.build()
        if extra:
            witness.update(extra)

        out_path = self._output_dir / f"{self.name}.witness.json"

        # If an existing witness is substantively identical (ignoring
        # ephemeral meta fields), preserve it — avoids CI drift loops
        # when only commitSha/computedAt/durationMs would change.
        if out_path.exists():
            try:
                with open(out_path, "r", encoding="utf-8") as f:
                    existing = json.load(f)
                if _witnesses_substantively_equal(existing, witness):
                    # Re-print the assertion summary for the validator runner
                    # without re-writing the file.
                    print(f"✓ Witness: {out_path.name}  "
                          f"({len(self.assertions)} assertions, "
                          f"{'all passed' if witness['allPassed'] else 'FAILURES'}) "
                          f"[unchanged — kept on-disk commitSha for staleness]")
                    return out_path
            except (json.JSONDecodeError, OSError):
                # On-disk file unreadable: fall through and overwrite.
                pass

        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(witness, f, indent=2, ensure_ascii=False, default=str)
            f.write("\n")

        print(f"✓ Witness: {out_path.name}  "
              f"({len(self.assertions)} assertions, "
              f"{'all passed' if witness['allPassed'] else 'FAILURES'})")

        return out_path


# Ephemeral meta fields that change on every validator run regardless of
# whether the substantive content drifted. Masked in the equality check
# so the on-disk witness is preserved when only these would change.
# Ephemeral meta fields — stripped before the "substantively equal"
# comparison in `_witnesses_substantively_equal`, so on-disk witnesses
# are PRESERVED when only these fields would change. Rationale:
#
#   - commitSha, scriptCommitSha — change on every commit; would
#     trigger CI drift loops if comparison were exact
#   - computedAt, durationMs — wall-clock metadata; not numeric content
#   - environment — Python + numeric-library versions; tracked for
#     attribution (see `capture_environment` docstring above) but a
#     runtime swap alone (e.g. 3.11.15 ↔ 3.12.3) shouldn't trigger
#     rewrites of otherwise-identical witnesses
#   - elapsed_seconds, elapsed_sec — per-item timing metrics buried
#     in `data` payloads; same rationale as durationMs
#
# The fields are RECURSIVELY stripped — `elapsed_seconds` nested
# inside `data.computations[...].elapsed_seconds` is caught too.
#
# Collision-risk note: the recursive mask strips ANY dict key with
# these names regardless of where it appears in the witness JSON. If
# a producer ever emits a substantive payload field named
# `elapsed_seconds` or `elapsed_sec` whose value carries numeric
# content (not timing metadata), it will be incidentally masked and
# could cause false substantive-equality matches. Mitigation:
# producers should prefix non-timing fields with a domain qualifier
# (e.g. `decay_seconds`, `physical_elapsed_s`) rather than reusing
# `elapsed_seconds`. The masked names are reserved for runtime-
# metadata semantics across the witness corpus.
#
# Sync note: mirrored in `qou-mass/src/qou_mass/_internal/witness_base.py`
# (PyPI bundle copy). The cross-package sync is asserted by the
# `test_ephemeral_mask_sync` test in `tools/qou-substrate/tests/`.
_EPHEMERAL_META_FIELDS = frozenset({
    "commitSha", "scriptCommitSha", "computedAt", "durationMs",
    "environment", "elapsed_seconds", "elapsed_sec",
})


def _strip_ephemeral_fields(d: object) -> object:
    """Recursively strip the ephemeral-meta fields from a witness dict.
    Returns a new structure suitable for substantive-equality comparison."""
    if isinstance(d, dict):
        return {k: _strip_ephemeral_fields(v) for k, v in d.items()
                if k not in _EPHEMERAL_META_FIELDS}
    if isinstance(d, list):
        return [_strip_ephemeral_fields(item) for item in d]
    return d


def _witnesses_substantively_equal(a: dict, b: dict) -> bool:
    """True iff `a` and `b` are equal after masking ephemeral meta fields.

    Substantive content includes: assertions, allPassed, computation,
    description, data payload (minus per-item timing), parameters,
    scriptFile, scriptHash, engineVersion. Ephemeral (masked):
    commitSha, scriptCommitSha, computedAt, durationMs, environment,
    elapsed_seconds, elapsed_sec.

    Python-version swaps + per-item timing differences alone don't
    trigger witness rewrites of otherwise-identical numeric content.
    The fields stay IN the saved witness (for attribution / staleness
    audit trails) but are stripped BEFORE the substantive-equality
    comparison.

    See the `_EPHEMERAL_META_FIELDS` definition above for the
    per-field rationale and the recursive-mask collision-risk note.
    """
    return _strip_ephemeral_fields(a) == _strip_ephemeral_fields(b)


# ── Staleness checker ────────────────────────────────────────────

def check_witness_staleness(witness_path: str) -> dict:
    """
    Check if a witness JSON is stale relative to its script.

    Returns dict with:
      stale: bool
      reason: str (if stale)
      scriptHash: current vs recorded
      commitSha: current vs recorded
    """
    with open(witness_path, "r") as f:
        witness = json.load(f)

    result: dict[str, Any] = {
        "witnessFile": os.path.basename(witness_path),
        "stale": False,
    }

    # Check script hash
    script_file = witness.get("scriptFile")
    if script_file:
        script_path = os.path.join(os.path.dirname(witness_path), script_file)
        if os.path.exists(script_path):
            current_hash = file_content_hash(script_path)
            recorded_hash = witness.get("scriptHash")
            result["currentScriptHash"] = current_hash
            result["recordedScriptHash"] = recorded_hash
            if recorded_hash and current_hash != recorded_hash:
                result["stale"] = True
                result["reason"] = "script content changed since witness"
                return result

    # Check commit SHA (informational, not staleness)
    #
    # The commit SHA records WHEN the witness was generated, but doesn't
    # determine staleness. A new commit that doesn't touch the script
    # doesn't invalidate the witness. The scriptHash check above is the
    # authoritative staleness signal — if the script content is unchanged,
    # the witness is still valid regardless of intervening commits.
    commit_sha = witness.get("commitSha")
    if commit_sha and commit_sha != "unknown":
        current_head = _git_head_sha()
        result["currentCommitSha"] = current_head
        result["recordedCommitSha"] = commit_sha

    return result


# ── CLI ──────────────────────────────────────────────────────────

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Witness infrastructure utilities")
    sub = parser.add_subparsers(dest="command")

    # check-stale
    cs = sub.add_parser("check-stale", help="Check if a witness is stale")
    cs.add_argument("witness_file", help="Path to .witness.json")

    # check-all
    ca = sub.add_parser("check-all", help="Check all witnesses for staleness")

    args = parser.parse_args()

    if args.command == "check-stale":
        result = check_witness_staleness(args.witness_file)
        print(json.dumps(result, indent=2))
        sys.exit(1 if result["stale"] else 0)

    elif args.command == "check-all":
        comp_dir = Path(__file__).resolve().parent
        witnesses = sorted(comp_dir.glob("*.witness.json"))
        stale_count = 0
        for wf in witnesses:
            result = check_witness_staleness(str(wf))
            icon = "🔄" if result["stale"] else "✓"
            reason = f" — {result['reason']}" if result.get("reason") else ""
            print(f"  {icon} {wf.name}{reason}")
            if result["stale"]:
                stale_count += 1
        print(f"\n{len(witnesses) - stale_count} current, {stale_count} stale — {len(witnesses)} total")

    else:
        parser.print_help()
