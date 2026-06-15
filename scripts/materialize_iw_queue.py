"""Materialize the compute-integration-watcher queue from audit witnesses.

Reads every I-pattern audit witness under `folio-assistant/computations/`,
extracts the `rows[]` array, and emits a unified
`todos/compute-integration-watcher-queue.json` per the integration-
watcher schema.

Each queue item carries:

  - id              — `<pattern>:<index>` (unique within the file)
  - pattern         — I3 / I5 / I7 / I8 / I9 / I10 / I11 / I12 / I13 / I1 / I2
  - source          — "audit:<witness-name>"
  - status          — "queued" (initial)
  - priority        — high | medium | low (computed from severity × tractability)
  - label / path / details — pattern-specific evidence

Run once per session at start (or on user invocation) to refresh
the queue from current audit state.

Usage:
    python3 scripts/materialize_iw_queue.py
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parent.parent
WITNESS_DIR = REPO_ROOT / "folio-assistant" / "computations"
TODOS_DIR = REPO_ROOT / "todos"
OUT_PATH = TODOS_DIR / "compute-integration-watcher-queue.json"

# Per-pattern (audit witness filename, result-bucket-name, priority).
# Priority guides §5b auto-pull order.  Low → high.
SOURCES = [
    # (audit_filename, failure-bucket(s), I-pattern, default-priority)
    ("guarded-off-audit.witness.json",      ["i3_candidate"],            "I3",  "medium"),
    ("content-block-label-audit.witness.json", ["missing_label"],         "I5",  "high"),
    ("stale-probe-audit.witness.json",      ["stale"],                   "I7",  "medium"),
    ("float64-leak-audit.witness.json",     ["i8_violation"],            "I8",  "high"),
    ("hardcoded-literal-audit.witness.json", ["i9_violation"],           "I9",  "low"),
    ("legacy-formula-audit.witness.json",   ["i10_violation",
                                              "i10_candidate"],          "I10", "low"),
    ("validation-as-input-audit.witness.json", ["i11_violation"],        "I11", "high"),
    ("lean-ref-resolution-audit.witness.json", ["sibling_no_decl",
                                                  "grep_no_match",
                                                  "lake_root_no_decl",
                                                  "lake_root_missing_grep_hit",
                                                  "sibling_missing",
                                                  "unregistered_package"], "I12", "medium"),
    ("incomplete-coverage-audit.witness.json", ["any"],                  "I13", "medium"),
    ("i1-no-probe-audit.witness.json",      ["i1_no_probe",
                                              "i1_no_probe_conditional",
                                              "i1_pre_lean"],            "I1",  "low"),
    ("i2-probe-only-audit.witness.json",    ["i2_probe_only"],           "I2",  "low"),
]


def _items_from_witness(audit_file: Path, buckets: list[str],
                        pattern: str, priority: str) -> list[dict[str, Any]]:
    """Extract queue items from one audit witness's rows[]."""
    try:
        d = json.loads(audit_file.read_text(encoding="utf-8"))
    except (OSError, UnicodeDecodeError, json.JSONDecodeError):
        return []
    r = d.get("results", d.get("data", d))
    if not isinstance(r, dict):
        return []
    rows = r.get("rows", [])
    if not isinstance(rows, list):
        return []
    items: list[dict[str, Any]] = []
    for idx, row in enumerate(rows):
        if not isinstance(row, dict):
            continue
        result = row.get("result", "unknown")
        if "any" not in buckets and result not in buckets:
            continue
        # Skip I13 — handled separately below.
        items.append({
            "id": f"{pattern}:{idx}",
            "pattern": pattern,
            "audit_witness": audit_file.name,
            "audit_result_bucket": result,
            "source": f"audit:{audit_file.name}",
            "status": "queued",
            "priority": priority,
            "details": {
                k: v for k, v in row.items()
                if k != "hits" and not isinstance(v, (list, dict))
            },
            "label": row.get("label") or row.get("ref"),
            "path": row.get("path") or row.get("witness"),
        })
    return items


def _items_from_i13(audit_file: Path) -> list[dict[str, Any]]:
    """I13's row shape is different — one entry per error_kind."""
    try:
        d = json.loads(audit_file.read_text(encoding="utf-8"))
    except (OSError, UnicodeDecodeError, json.JSONDecodeError):
        return []
    r = d.get("results", d.get("data", d))
    if not isinstance(r, dict):
        return []
    rows = r.get("rows", [])
    items: list[dict[str, Any]] = []
    for row in rows:
        if not isinstance(row, dict):
            continue
        for sample in row.get("sample_entries", []):
            items.append({
                "id": f"I13:{row['witness']}:{sample.get('json_path', '')}",
                "pattern": "I13",
                "audit_witness": audit_file.name,
                "source": f"audit:{audit_file.name}",
                "status": "queued",
                "priority": "medium",
                "details": sample,
                "path": row["witness"],
            })
    return items


def main() -> int:
    TODOS_DIR.mkdir(exist_ok=True)
    all_items: list[dict[str, Any]] = []
    counts_by_pattern: dict[str, int] = {}
    for fname, buckets, pattern, priority in SOURCES:
        p = WITNESS_DIR / fname
        if not p.exists():
            print(f"  MISSING: {fname}")
            continue
        if pattern == "I13":
            items = _items_from_i13(p)
        else:
            items = _items_from_witness(p, buckets, pattern, priority)
        counts_by_pattern[pattern] = len(items)
        all_items.extend(items)

    payload = {
        "$schema": "iw-queue.schema.v1",
        "watcher": "compute-integration-watcher",
        "queue": all_items,
        "summary": {
            "total_items": len(all_items),
            "by_pattern": counts_by_pattern,
        },
    }
    OUT_PATH.write_text(json.dumps(payload, indent=2))
    print(f"Wrote {len(all_items)} items to {OUT_PATH.relative_to(REPO_ROOT)}")
    for p, n in sorted(counts_by_pattern.items()):
        print(f"  {p:<5s}: {n}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
