#!/usr/bin/env python3
"""Batch-wire stale-claim witnesses into their content blocks.

Reads ``stale-claims.tsv`` from ``scripts/audit-wiring.ts``, groups rows
by content-block label, finds the matching ``.ts`` file under
``content/``, and inserts a ``computation:`` field that references the
script + witness(es).

* Skips files that already declare ``computation:`` (would require an
  array merge — defer to manual).
* Skips groups with > ``--max-witnesses-per-block`` claimants
  (default 4) — these need human judgment about which witness is
  canonical.
* Skips an explicit ``--exclude`` list of labels.

Run from repo root.
"""
from __future__ import annotations

import argparse
import csv
import json
import re
import sys
from collections import defaultdict
from pathlib import Path
from subprocess import run, PIPE

REPO = Path(__file__).resolve().parent.parent


def find_block_file(label: str) -> Path | None:
    """Return the .ts file declaring ``label: "<label>"`` or None."""
    pattern = f'label:.*"{label}"'
    res = run(
        ["grep", "-rl", "-E", pattern, "content/", "--include=*.ts"],
        cwd=REPO, stdout=PIPE, text=True,
    )
    files = [REPO / line for line in res.stdout.splitlines() if line.strip()]
    if not files:
        return None
    if len(files) > 1:
        # Prefer the one whose basename matches the slug after the colon
        slug = label.split(":", 1)[1]
        for f in files:
            if f.stem == slug:
                return f
    return files[0]


def witness_engine(witness_path: Path) -> str:
    """Return the ``engine`` field of a witness JSON, or "python"."""
    try:
        with witness_path.open(encoding="utf-8") as fh:
            d = json.load(fh)
        return str(d.get("engine") or "python")
    except (OSError, json.JSONDecodeError):
        return "python"


def witness_passing(witness_path: Path) -> bool:
    """True iff the witness has assertions and they all pass."""
    try:
        with witness_path.open(encoding="utf-8") as fh:
            d = json.load(fh)
    except (OSError, json.JSONDecodeError):
        return False
    a = d.get("assertions") or []
    if not isinstance(a, list) or not a:
        return False
    return d.get("allPassed") is True


# Match a `kind(...)` builder call followed by a single object literal.
# We insert before the final ``});`` of the export default block.
EXPORT_TAIL_RE = re.compile(r"\n?}\)\s*;\s*\n?\Z", re.MULTILINE)


def insert_computation(
    src: str, *, engine: str, script: str, witnesses: list[str], status: str
) -> str | None:
    """Return ``src`` with a ``computation:`` field inserted before ``});``."""
    if "computation:" in src:
        return None  # don't double-wire
    # Build the YAML-ish snippet matching repo style (2-space indent,
    # trailing comma, double quotes).
    if len(witnesses) == 1:
        witness_line = f'    witness: "{witnesses[0]}",\n'
    else:
        wbody = "".join(f'      "{w}",\n' for w in witnesses)
        witness_line = f"    witness: [\n{wbody}    ],\n"
    block = (
        "  computation: {\n"
        f'    engine: "{engine}",\n'
        f'    script: "{script}",\n'
        f"{witness_line}"
        f'    status: "{status}",\n'
        "  },\n"
    )
    m = EXPORT_TAIL_RE.search(src)
    if not m:
        return None
    return src[: m.start()] + "\n" + block + "});\n"


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--tsv", default="/tmp/audit-out/stale-claims.tsv",
                    help="Path to stale-claims.tsv")
    ap.add_argument("--max-witnesses-per-block", type=int, default=4)
    ap.add_argument("--max-scripts-per-block", type=int, default=4,
                    help="Skip groups with more than this many distinct scripts.")
    ap.add_argument("--exclude", action="append", default=[],
                    help="Skip these labels (repeatable).")
    ap.add_argument("--limit", type=int, default=20,
                    help="Stop after wiring this many distinct blocks.")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    tsv = Path(args.tsv)
    rows_by_label: dict[str, list[dict]] = defaultdict(list)
    with tsv.open() as fh:
        for row in csv.DictReader(fh, delimiter="\t"):
            rows_by_label[row["contentBlockClaim"]].append(row)

    excluded = set(args.exclude)
    wired = 0
    skipped: list[tuple[str, str]] = []

    # Process labels in TSV order (= original orphan order, which is
    # filesystem-glob order — stable across re-runs).
    seen: list[str] = []
    for label in (r["contentBlockClaim"]
                  for rows in rows_by_label.values() for r in rows):
        if label in seen:
            continue
        seen.append(label)
    for label in seen:
        if wired >= args.limit:
            break
        rows = rows_by_label[label]
        if label in excluded:
            skipped.append((label, "excluded by --exclude"))
            continue
        if len(rows) > args.max_witnesses_per_block:
            skipped.append((label,
                            f"{len(rows)} witnesses > limit"
                            f" {args.max_witnesses_per_block}"))
            continue

        ts_file = find_block_file(label)
        if ts_file is None:
            skipped.append((label, "no .ts file found"))
            continue
        src = ts_file.read_text(encoding="utf-8")
        if "computation:" in src:
            skipped.append((label, f"{ts_file.relative_to(REPO)} already has computation:"))
            continue

        # All rows in this group share an engine; use the first row's
        # engine.  Status: "verified" iff every witness is passing.
        witnesses = sorted({r["witness"] for r in rows})
        scripts = sorted({r["scriptFile"] for r in rows})
        if len(scripts) > args.max_scripts_per_block:
            skipped.append((label,
                            f"{len(scripts)} scripts > limit"
                            f" {args.max_scripts_per_block}"))
            continue
        # Choose canonical script: prefer non-probe_ prefix, then shortest
        # name (probe_ ... _round7 < probe_ ... _round6_canonical < ...).
        non_probe = [s for s in scripts if not s.startswith("probe_")]
        canonical_pool = non_probe if non_probe else scripts
        canonical = sorted(canonical_pool, key=lambda s: (len(s), s))[0]
        script = f"folio-assistant/computations/{canonical}"
        if not (REPO / script).exists():
            skipped.append((label, f"script not found: {script}"))
            continue

        engine = witness_engine(REPO / witnesses[0])
        all_pass = all(witness_passing(REPO / w) for w in witnesses)
        status = "verified" if all_pass else "experimental"

        new_src = insert_computation(
            src, engine=engine, script=script,
            witnesses=witnesses, status=status,
        )
        if new_src is None:
            skipped.append((label, "could not locate insertion point"))
            continue

        rel = ts_file.relative_to(REPO)
        if args.dry_run:
            print(f"[DRY] {rel}: would wire {len(witnesses)} witness(es), status={status}")
        else:
            ts_file.write_text(new_src, encoding="utf-8")
            print(f"wired: {rel}  ({len(witnesses)} witness(es), status={status})")
        wired += 1

    print()
    print(f"wired {wired} block(s); skipped {len(skipped)}")
    for label, reason in skipped:
        print(f"  SKIP {label}: {reason}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
