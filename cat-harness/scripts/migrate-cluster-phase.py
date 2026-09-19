#!/usr/bin/env python3
"""migrate-cluster-phase.py — execute a generic per-cluster move.

Generalization of `scripts/migrate-probes-phase1.py` for phases
2-5 of the subdirectory refactor: takes a cluster name + a glob
pattern, runs the same recipe (git mv + scriptFile-based
co-move of witnesses + path-bridge shim injection + HERE.parent
cosmetic fix).

USAGE

    python3 scripts/migrate-cluster-phase.py \\
        --cluster audits --glob '*_audit.py' [--write] [--limit N]
    python3 scripts/migrate-cluster-phase.py \\
        --cluster sweeps --glob '*_sweep.py' [--write] [--limit N]

The `--cluster` becomes a child directory of
`folio-assistant/computations/`. `--glob` is the script-file glob
RELATIVE to that root.

Output: appends to `/tmp/phase-move-table.json` (so running
multiple cluster invocations in a row produces a single
codemod-ready move table).

This is identical in semantics to migrate-probes-phase1.py — only
the cluster name + glob differ. Kept as a separate script so
Phase 1's idempotent re-run history is preserved verbatim.
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

SHIM_MARKER = "# Path bridge (subdirectory refactor — Phase"


def _build_shim(phase_label: str) -> str:
    return (
        "\n"
        f"# Path bridge (subdirectory refactor — {phase_label}, 2026-06-02).\n"
        "# Keeps flat-namespace imports (`from witness_base import …`)\n"
        "# working from the cluster subdirectory. The bridge module\n"
        "# also puts every other cluster subdir on sys.path so cross-\n"
        "# cluster bare-name imports resolve. Idempotent.\n"
        "import sys as _sys  # noqa: E402\n"
        "from pathlib import Path as _Path  # noqa: E402\n"
        "_sys.path.insert(0, str(_Path(__file__).resolve().parent.parent))\n"
        "import _path_bridge as _bridge  # noqa: E402, F401\n"
        "del _sys, _Path, _bridge\n"
    )


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
    global _WITNESS_PRODUCER_MAP
    if _WITNESS_PRODUCER_MAP is None:
        _WITNESS_PRODUCER_MAP = _build_witness_producer_map(COMPUTE_DIR)
    return list(_WITNESS_PRODUCER_MAP.get(script.name, []))


def inject_shim(script_path: Path, shim: str, dry: bool) -> bool:
    content = script_path.read_text()
    if SHIM_MARKER in content:
        return False
    lines = content.splitlines(keepends=True)
    insert_idx = 0
    if lines and lines[0].startswith("#!"):
        insert_idx = 1
    if insert_idx < len(lines) and lines[insert_idx].lstrip().startswith(('"""', "'''")):
        quote = '"""' if '"""' in lines[insert_idx] else "'''"
        rest_of_line = lines[insert_idx].lstrip().removeprefix(quote)
        if quote in rest_of_line:
            insert_idx += 1
        else:
            j = insert_idx + 1
            while j < len(lines) and quote not in lines[j]:
                j += 1
            insert_idx = j + 1
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
    while insert_idx < len(lines) and lines[insert_idx].startswith("from __future__"):
        insert_idx += 1
    while insert_idx < len(lines) and lines[insert_idx].strip() == "":
        insert_idx += 1
    new_content = "".join(lines[:insert_idx]) + shim + "\n" + "".join(lines[insert_idx:])
    if dry:
        print(f"  [DRY] inject shim at line {insert_idx}")
        return True
    script_path.write_text(new_content)
    return True


def fix_existing_HERE_bootstrap(script_path: Path, dry: bool) -> bool:
    content = script_path.read_text()
    pattern = re.compile(r"^(sys\.path\.insert\(0,\s*str\(HERE)\)", re.MULTILINE)
    new_content, count = pattern.subn(r"\1.parent)", content, count=1)
    if count == 0:
        return False
    if dry:
        print(f"  [DRY] fix HERE→HERE.parent")
        return True
    script_path.write_text(new_content)
    return True


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--cluster", required=True,
                        help="cluster subdirectory name (e.g. audits, sweeps)")
    parser.add_argument("--glob", required=True,
                        help="script-file glob (e.g. '*_audit.py')")
    parser.add_argument("--exclude-glob", action="append", default=[],
                        help="exclude scripts matching this glob (can repeat)")
    parser.add_argument("--phase-label", default=None,
                        help="phase label for the shim comment (default: 'Phase N')")
    parser.add_argument("--write", action="store_true")
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--append-to", default="/tmp/phase-move-table.json",
                        help="move-table output path (appends if exists)")
    args = parser.parse_args()

    cluster_dir = COMPUTE_DIR / args.cluster
    if not COMPUTE_DIR.is_dir():
        print(f"error: {COMPUTE_DIR} not found", file=sys.stderr)
        return 2

    # Phase 0's __init__.py must exist for the bridge to work.
    if not (COMPUTE_DIR / "_path_bridge.py").is_file():
        print(f"error: Phase 0 incomplete ({COMPUTE_DIR / '_path_bridge.py'} missing)",
              file=sys.stderr)
        return 2

    if args.write and not cluster_dir.exists():
        cluster_dir.mkdir()
        init_py = cluster_dir / "__init__.py"
        init_py.write_text(
            f'"""{args.cluster.capitalize()} — cluster subdirectory of '
            f'folio-assistant/computations/.\n\n'
            f'See [`docs/proposals/computations-subdirectory-'
            f'refactor.md`](../../../docs/proposals/computations-'
            f'subdirectory-refactor.md).\n"""\n'
        )

    phase_label = args.phase_label or "Phase 2"
    shim = _build_shim(phase_label)

    scripts = sorted(p for p in COMPUTE_DIR.glob(args.glob)
                     if p.is_file() and p.parent == COMPUTE_DIR)
    if args.exclude_glob:
        from fnmatch import fnmatch
        before = len(scripts)
        scripts = [p for p in scripts
                   if not any(fnmatch(p.name, ex) for ex in args.exclude_glob)]
        excluded = before - len(scripts)
        if excluded > 0:
            print(f"  --exclude-glob: skipped {excluded} script(s)")
    print(f"Cluster: {args.cluster}/  (glob: {args.glob})")
    print(f"Found {len(scripts)} scripts.")
    if args.limit:
        scripts = scripts[: args.limit]
        print(f"  --limit {args.limit} → moving {len(scripts)} this pass")
    print(f"Mode: {'WRITE' if args.write else 'DRY-RUN'}")
    print()

    # Load existing move table if appending
    move_table: list[list[str]] = []
    append_path = Path(args.append_to)
    if append_path.exists():
        try:
            move_table = json.loads(append_path.read_text())
            print(f"Appending to existing move table ({len(move_table)} prior entries)")
        except (OSError, json.JSONDecodeError):
            move_table = []

    for script in scripts:
        siblings = find_witness_siblings(script)
        dst_script = cluster_dir / script.name
        print(f"{script.name}")
        print(f"  → {args.cluster}/{script.name}")
        git_mv(script, dst_script, dry=not args.write)
        move_table.append([
            str(script.relative_to(REPO_ROOT)),
            str(dst_script.relative_to(REPO_ROOT)),
        ])
        for sib in siblings:
            dst_sib = cluster_dir / sib.name
            print(f"  + {sib.name} → {args.cluster}/{sib.name}")
            git_mv(sib, dst_sib, dry=not args.write)
            move_table.append([
                str(sib.relative_to(REPO_ROOT)),
                str(dst_sib.relative_to(REPO_ROOT)),
            ])
        if args.write:
            inject_shim(dst_script, shim, dry=False)
            fix_existing_HERE_bootstrap(dst_script, dry=False)
        else:
            print(f"  ~ would inject shim + fix HERE→HERE.parent")

    append_path.write_text(json.dumps(move_table, indent=2))
    print()
    print(f"Move table: {len(move_table)} total entries → {append_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
