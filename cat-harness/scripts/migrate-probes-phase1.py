#!/usr/bin/env python3
"""migrate-probes-phase1.py — execute the probes/ subdirectory move.

Per Phase 1 of the subdirectory-refactor proposal
(`docs/proposals/computations-subdirectory-refactor.md`):

  1. Move every `folio-assistant/computations/*_probe.py` into
     `folio-assistant/computations/probes/`.
  2. Co-move each probe's sibling `<slug>.witness.json` and
     `<slug>.derivation.json` (owner-decision 5: witnesses move
     with their producers).
  3. Inject the path-bridge shim at the top of each moved script
     so flat-namespace imports (`from witness_base import
     WitnessBuilder`) keep working after the move.
  4. Emit a move table JSON for the codemod (rewrites content/
     references via scripts/migrate-computation-paths.ts).

Idempotent: re-running after a successful move is a no-op (every
step checks "is this already done?").

USAGE

    python3 scripts/migrate-probes-phase1.py [--write] [--limit N]

Without `--write`, runs in dry-run mode — prints every action it
would take, doesn't touch any files. `--limit N` caps the move
count (useful for incremental testing before the full batch).

OUTPUT

    /tmp/phase1-move-table.json   (consumed by the codemod)
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
COMPUTE_DIR = REPO_ROOT / "folio-assistant" / "computations"
PROBES_DIR = COMPUTE_DIR / "probes"

SHIM = (
    "\n"
    "# Path bridge (subdirectory refactor — Phase 1, 2026-06-02).\n"
    "# Keeps flat-namespace imports (`from witness_base import …`)\n"
    "# working from the `probes/` cluster subdirectory. The bridge\n"
    "# module also puts every other cluster subdir on sys.path so\n"
    "# cross-cluster bare-name imports resolve. Idempotent.\n"
    "import sys as _sys  # noqa: E402\n"
    "from pathlib import Path as _Path  # noqa: E402\n"
    "_sys.path.insert(0, str(_Path(__file__).resolve().parent.parent))\n"
    "import _path_bridge as _bridge  # noqa: E402, F401\n"
    "del _sys, _Path, _bridge\n"
)

SHIM_MARKER = "# Path bridge (subdirectory refactor — Phase 1, 2026-06-02)."


def git_mv(src: Path, dst: Path, dry: bool) -> None:
    if dry:
        print(f"  [DRY] git mv {src.relative_to(REPO_ROOT)} {dst.relative_to(REPO_ROOT)}")
        return
    dst.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        ["git", "mv", str(src), str(dst)],
        cwd=REPO_ROOT, check=True,
    )


_WITNESS_PRODUCER_MAP: dict[str, list[Path]] | None = None


def _build_witness_producer_map(compute_dir: Path) -> dict[str, list[Path]]:
    """Scan every *.witness.json + *.derivation.json under compute_dir
    (top-level only — _deprecated/ excluded) and build a producer
    map keyed on the witness's `scriptFile` field. A few probes
    emit witnesses whose filename slug doesn't match the script's
    stem (e.g. A_operator_per_interface_probe.py produces
    A-operator-per-interface.witness.json — drops the `-probe`
    suffix), so the scriptFile lookup is more reliable than a
    naïve slug match."""
    mapping: dict[str, list[Path]] = {}
    for pattern in ("*.witness.json", "*.derivation.json"):
        for w in compute_dir.glob(pattern):
            if not w.is_file():
                continue
            try:
                data = json.loads(w.read_text())
            except (OSError, json.JSONDecodeError):
                continue
            sf = data.get("scriptFile")
            if isinstance(sf, str):
                mapping.setdefault(sf, []).append(w)
    return mapping


def find_witness_siblings(script: Path) -> list[Path]:
    """Find every *.witness.json + *.derivation.json that claims
    `script.name` as its `scriptFile`. Cached across calls."""
    global _WITNESS_PRODUCER_MAP
    if _WITNESS_PRODUCER_MAP is None:
        _WITNESS_PRODUCER_MAP = _build_witness_producer_map(COMPUTE_DIR)
    return list(_WITNESS_PRODUCER_MAP.get(script.name, []))


def inject_shim(script_path: Path, dry: bool) -> bool:
    """Add SHIM near the top of the moved script. Returns True if
    the file was modified (or would be in dry-run)."""
    content = script_path.read_text()
    if SHIM_MARKER in content:
        return False  # already injected
    # Insert AFTER `from __future__ import annotations` if present;
    # otherwise AFTER the top-level module docstring (closing """);
    # else at the very top after the shebang.
    lines = content.splitlines(keepends=True)
    insert_idx = 0
    # Skip shebang
    if lines and lines[0].startswith("#!"):
        insert_idx = 1
    # Skip module docstring (only single-line or triple-quoted)
    if insert_idx < len(lines) and lines[insert_idx].lstrip().startswith(('"""', "'''")):
        quote = '"""' if '"""' in lines[insert_idx] else "'''"
        # Single-line docstring on the same line
        rest_of_line = lines[insert_idx].lstrip().removeprefix(quote)
        if quote in rest_of_line:
            insert_idx += 1
        else:
            # Multiline docstring — skip until closing quote
            j = insert_idx + 1
            while j < len(lines) and quote not in lines[j]:
                j += 1
            insert_idx = j + 1  # past the closing line
    # Skip blank lines + comment-only lines between docstring close
    # and `from __future__` — Phase 2 bugfix (the shim used to land
    # before `from __future__` and break compile() in 38 scripts).
    look_ahead = insert_idx
    while look_ahead < len(lines) and (
        lines[look_ahead].strip() == ""
        or lines[look_ahead].lstrip().startswith("#")
    ):
        look_ahead += 1
    if look_ahead < len(lines) and lines[look_ahead].startswith("from __future__"):
        insert_idx = look_ahead
    # Skip `from __future__ import …` lines
    while insert_idx < len(lines) and lines[insert_idx].startswith("from __future__"):
        insert_idx += 1
    # Skip blank lines after future-imports
    while insert_idx < len(lines) and lines[insert_idx].strip() == "":
        insert_idx += 1
    new_content = "".join(lines[:insert_idx]) + SHIM + "\n" + "".join(lines[insert_idx:])
    if dry:
        print(f"  [DRY] inject shim at line {insert_idx} of {script_path.relative_to(REPO_ROOT)}")
        return True
    script_path.write_text(new_content)
    return True


def fix_existing_HERE_bootstrap(script_path: Path, dry: bool) -> bool:
    """If a moved script has `sys.path.insert(0, str(HERE))` where
    HERE = Path(__file__).parent, change to `HERE.parent` so the
    flat namespace stays on sys.path. Returns True if rewritten.

    This is a layered defense — the SHIM above already adds the
    parent directory to sys.path, so this fixup is cosmetic. Keep
    it because the existing pattern is misleading post-move."""
    content = script_path.read_text()
    pattern = re.compile(r"^(sys\.path\.insert\(0,\s*str\(HERE)\)", re.MULTILINE)
    new_content, count = pattern.subn(r"\1.parent)", content, count=1)
    if count == 0:
        return False
    if dry:
        print(f"  [DRY] fix HERE→HERE.parent in {script_path.relative_to(REPO_ROOT)}")
        return True
    script_path.write_text(new_content)
    return True


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--write", action="store_true",
                        help="apply changes (default: dry-run)")
    parser.add_argument("--limit", type=int, default=None,
                        help="cap the number of probes moved")
    args = parser.parse_args()

    if not COMPUTE_DIR.is_dir():
        print(f"error: {COMPUTE_DIR} not found", file=sys.stderr)
        return 2
    PROBES_DIR.mkdir(exist_ok=True)
    init_py = PROBES_DIR / "__init__.py"
    if not init_py.exists():
        print(f"error: {init_py} missing (Phase 0 incomplete)", file=sys.stderr)
        return 2

    probes = sorted(p for p in COMPUTE_DIR.glob("*_probe.py")
                    if p.is_file() and p.parent == COMPUTE_DIR)
    print(f"Found {len(probes)} probes to move.")
    if args.limit:
        probes = probes[: args.limit]
        print(f"  --limit {args.limit} → moving {len(probes)} this pass")
    print(f"Mode: {'WRITE' if args.write else 'DRY-RUN'}")
    print()

    move_table: list[list[str]] = []
    for script in probes:
        siblings = find_witness_siblings(script)
        dst_script = PROBES_DIR / script.name
        print(f"{script.name}")
        print(f"  → probes/{script.name}")
        git_mv(script, dst_script, dry=not args.write)
        move_table.append([
            str(script.relative_to(REPO_ROOT)),
            str(dst_script.relative_to(REPO_ROOT)),
        ])
        for sib in siblings:
            dst_sib = PROBES_DIR / sib.name
            print(f"  + {sib.name} → probes/{sib.name}")
            git_mv(sib, dst_sib, dry=not args.write)
            move_table.append([
                str(sib.relative_to(REPO_ROOT)),
                str(dst_sib.relative_to(REPO_ROOT)),
            ])
        if args.write:
            inject_shim(dst_script, dry=False)
            fix_existing_HERE_bootstrap(dst_script, dry=False)
        else:
            # In dry-run we can't inspect a not-yet-moved file in
            # its destination, so we just report what we would do.
            print(f"  ~ would inject path-bridge shim + fix HERE→HERE.parent")

    out_path = Path("/tmp/phase1-move-table.json")
    out_path.write_text(json.dumps(move_table, indent=2))
    print()
    print(f"Move table: {len(move_table)} entries → {out_path}")
    print("Next step:")
    print(f"  bun scripts/migrate-computation-paths.ts {out_path}            # dry-run")
    print(f"  bun scripts/migrate-computation-paths.ts {out_path} --write    # apply")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
