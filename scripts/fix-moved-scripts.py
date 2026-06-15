#!/usr/bin/env python3
"""fix-moved-scripts.py — post-move corrections for Phase 1/2 scripts.

Two bugs in the original shim-injection helper surfaced after the
Phase 1 + Phase 2 moves landed:

  (1) The shim was inserted right after the module docstring even
      when `from __future__ import …` was the next statement after
      a blank-line gap. Python requires `from __future__` to be the
      first non-docstring/non-comment statement; the shim's
      `import sys as _sys` ahead of it triggers
          SyntaxError: from __future__ imports must occur at the
                       beginning of the file
      38 scripts (15 in probes/, 23 in audits/+sweeps/) hit this.

  (2) Scripts using `COMPUTE_DIR = THIS.parent` (or similar) to
      look up sibling witness JSONs are now resolving paths INTO
      the cluster subdirectory instead of into the package root.
      e.g. binding_q_target_sweep.py now searches for
      `sweeps/canonical-tr-m-via-chi-cache.witness.json` instead
      of `canonical-tr-m-via-chi-cache.witness.json` at the
      package root.

This script fixes both, idempotently, across every Phase-1/2 file
in cluster subdirs.

USAGE

    python3 scripts/fix-moved-scripts.py [--write] [--check]

`--check` exits non-zero if any cluster-subdir script still fails
`compile()` (signals a remaining shim-order bug).
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
COMPUTE_DIR = REPO_ROOT / "folio-assistant" / "computations"


def _discover_cluster_dirs() -> tuple[str, ...]:
    """Return the names of every regular-package cluster subdir of
    folio-assistant/computations/ (skip _deprecated, __pycache__,
    data/, etc.). Auto-discovery so new clusters added by Phase N
    don't need a code change here."""
    out: list[str] = []
    for d in sorted(COMPUTE_DIR.iterdir()):
        if not d.is_dir():
            continue
        if d.name.startswith(("_", ".")):
            continue
        if not (d / "__init__.py").is_file():
            continue
        out.append(d.name)
    return tuple(out)


CLUSTER_DIRS = _discover_cluster_dirs()

SHIM_HEADER_RE = re.compile(
    r"^# Path bridge \(subdirectory refactor", re.MULTILINE
)
SHIM_FOOTER = "del _sys, _Path, _bridge"


def find_shim_block(content: str) -> tuple[int, int] | None:
    """Return (start_line_idx, end_line_idx_exclusive) for the shim
    block, or None if not present."""
    lines = content.splitlines(keepends=True)
    start = None
    for i, ln in enumerate(lines):
        if ln.startswith("# Path bridge (subdirectory refactor"):
            start = i
            break
    if start is None:
        return None
    # Find the SHIM_FOOTER line
    end = None
    for j in range(start, min(start + 30, len(lines))):
        if lines[j].rstrip().endswith(SHIM_FOOTER):
            end = j + 1
            break
    if end is None:
        return None
    return (start, end)


def find_future_import(content: str) -> int | None:
    lines = content.splitlines(keepends=True)
    for i, ln in enumerate(lines):
        if ln.startswith("from __future__"):
            return i
    return None


def fix_shim_order(content: str) -> tuple[str, bool]:
    """If the shim block sits BEFORE `from __future__`, move it to
    just AFTER the future-imports block. Returns (new_content,
    changed)."""
    block = find_shim_block(content)
    if block is None:
        return content, False
    fut = find_future_import(content)
    shim_start, shim_end = block
    if fut is None:
        # No `from __future__` in this file — the shim's position
        # may still be wrong (e.g. before a docstring), but Python
        # is fine with that. Leave as-is.
        return content, False
    if shim_start > fut:
        return content, False  # Already in correct order

    lines = content.splitlines(keepends=True)
    shim_lines = lines[shim_start:shim_end]

    # Find end of contiguous future-imports block (multiple `from
    # __future__` lines + blank lines between them)
    fut_end = fut + 1
    while fut_end < len(lines):
        ln = lines[fut_end]
        if ln.startswith("from __future__"):
            fut_end += 1
        else:
            break

    # Remove shim from its current (too-early) position
    without_shim = lines[:shim_start] + lines[shim_end:]
    # Re-index fut_end to account for the removal (shim is BEFORE fut
    # so fut shifts down by shim length).
    new_fut_end = fut_end - (shim_end - shim_start)

    # Insert shim right after future-imports, with a leading blank
    # to keep visual separation.
    new_lines = (
        without_shim[:new_fut_end]
        + ["\n"]
        + shim_lines
        + without_shim[new_fut_end:]
    )
    return "".join(new_lines), True


COMPUTE_DIR_PATTERNS = [
    # `COMPUTE_DIR = THIS.parent`  (where THIS = Path(__file__).resolve())
    (re.compile(r"^(\s*)(COMPUTE_DIR\s*=\s*)(THIS\.parent)\s*$", re.MULTILINE),
     r"\1\2THIS.parent.parent  # was: THIS.parent (pre-cluster-move)"),
    # `COMPUTE_DIR = HERE.parent`  (alt naming)
    (re.compile(r"^(\s*)(COMPUTE_DIR\s*=\s*)(HERE\.parent)\s*$", re.MULTILINE),
     r"\1\2HERE.parent.parent  # was: HERE.parent (pre-cluster-move)"),
    # `COMPUTE_DIR = Path(__file__).resolve().parent` (inline)
    (re.compile(r"^(\s*COMPUTE_DIR\s*=\s*Path\(__file__\)\.resolve\(\)\.parent)\s*$",
                re.MULTILINE),
     r"\1.parent  # was: .parent (pre-cluster-move)"),
]


def fix_compute_dir(content: str) -> tuple[str, bool]:
    """Rewrite COMPUTE_DIR = THIS.parent → COMPUTE_DIR = THIS.parent.parent
    (and similar) so upstream-witness lookups land at the package
    root instead of the cluster subdirectory."""
    changed = False
    for pattern, replacement in COMPUTE_DIR_PATTERNS:
        new_content, n = pattern.subn(replacement, content)
        if n > 0:
            content = new_content
            changed = True
    return content, changed


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--write", action="store_true")
    parser.add_argument("--check", action="store_true",
                        help="exit non-zero if any compile() still fails")
    args = parser.parse_args()

    cluster_files: list[Path] = []
    for sub in CLUSTER_DIRS:
        d = COMPUTE_DIR / sub
        if not d.is_dir():
            continue
        cluster_files.extend(d.glob("*.py"))
    print(f"Scanning {len(cluster_files)} cluster-subdir scripts")

    shim_fixed = 0
    cdir_fixed = 0
    for f in cluster_files:
        before = f.read_text()
        c, ch1 = fix_shim_order(before)
        c, ch2 = fix_compute_dir(c)
        if ch1:
            shim_fixed += 1
            rel = f.relative_to(REPO_ROOT)
            print(f"  shim-order: {rel}")
        if ch2:
            cdir_fixed += 1
            rel = f.relative_to(REPO_ROOT)
            print(f"  compute-dir: {rel}")
        if (ch1 or ch2) and args.write:
            f.write_text(c)

    print()
    print(f"shim-order fixes:  {shim_fixed}")
    print(f"compute-dir fixes: {cdir_fixed}")
    print(f"Mode: {'WRITE' if args.write else 'DRY-RUN'}")

    if args.check:
        still_broken: list[Path] = []
        for f in cluster_files:
            try:
                compile(f.read_text(), str(f), "exec")
            except SyntaxError as e:
                still_broken.append(f)
                print(f"  STILL BROKEN: {f.relative_to(REPO_ROOT)}: {e.msg}")
        if still_broken:
            print(f"\n{len(still_broken)} script(s) still fail compile().")
            return 1
        print("\nAll cluster-subdir scripts compile cleanly.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
