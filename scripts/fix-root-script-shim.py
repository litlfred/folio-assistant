#!/usr/bin/env python3
"""fix-root-script-shim.py — add a 1-line bridge import to every
root-level compute script that imports a substrate module that
moved into folio-assistant/computations/substrate/ during Phase 6.

After Phase 6, root scripts at folio-assistant/computations/*.py
no longer find substrate modules (witness_base, q_parameter,
_precision, etc.) on their auto-sys.path[0] (which is the
script's own dir = computations/). The path bridge fixes this:
`import _path_bridge` is found because _path_bridge.py is at
computations/, and the bridge then adds every cluster subdir
(including substrate/) to sys.path.

Heuristic: any root .py file that has `from <substrate-module>
import` or `import <substrate-module>` at module top level gets
the bridge prepended.

USAGE

    python3 scripts/fix-root-script-shim.py [--write] [--check]
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
COMPUTE_DIR = REPO_ROOT / "folio-assistant" / "computations"

SUBSTRATE_MODULES = (
    "witness_base",
    "q_parameter",
    "_precision",
    "experimental_constants",
    "codata_constants",
    "hecke_core",
    "hecke_core_symbolic",
    "knot_volumes",
    "lr_coefficients",
    "char_fast",
    "witness_constant_staleness",
)
# Match a substrate import anywhere — including indented / lazy
# imports inside a function body (e.g. compute_audit_scan.py does
# `from witness_base import WitnessBuilder` inside main()). The
# leading `\s*` (instead of `^`) catches those; without the bridge
# shim at module top, the lazy import still fails at call time.
IMPORT_PATTERN = re.compile(
    r"^\s*(?:from\s+("
    + "|".join(SUBSTRATE_MODULES)
    + r")(?:\s|\.)|import\s+("
    + "|".join(SUBSTRATE_MODULES)
    + r")(?:\s|$|,))",
    re.MULTILINE,
)

SHIM_LINE = "import _path_bridge  # noqa: F401, E402 — Phase 6 bridge: substrate modules moved into substrate/ subdir\n"
SHIM_MARKER = "import _path_bridge  # noqa: F401, E402 — Phase 6 bridge"


def imports_substrate(content: str) -> bool:
    return IMPORT_PATTERN.search(content) is not None


def has_shim(content: str) -> bool:
    return SHIM_MARKER in content


def inject_shim(content: str) -> str:
    lines = content.splitlines(keepends=True)
    insert_idx = 0
    # Skip shebang
    if lines and lines[0].startswith("#!"):
        insert_idx = 1
    # Skip leading comment block (some scripts open with
    # `# archimedean_by_design: ...` markers BEFORE the
    # module docstring — common in CLAUDE.md-tagged files).
    while insert_idx < len(lines) and lines[insert_idx].lstrip().startswith("#"):
        insert_idx += 1
    # Skip module docstring
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
    # Skip blank lines + comment-only lines before from __future__
    # (then skip the future-imports themselves + trailing blanks).
    # Same fix as the cluster-shim helper — see Phase 2 bugfix.
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
    return "".join(lines[:insert_idx]) + SHIM_LINE + "".join(lines[insert_idx:])


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--write", action="store_true")
    parser.add_argument("--check", action="store_true",
                        help="verify every root script compiles after the fix")
    args = parser.parse_args()

    root_pyfiles = sorted(
        f for f in COMPUTE_DIR.glob("*.py")
        if f.is_file() and f.name not in ("__init__.py", "_path_bridge.py")
    )
    print(f"Scanning {len(root_pyfiles)} root-level compute scripts")

    fixed: list[Path] = []
    skipped: list[tuple[Path, str]] = []
    for f in root_pyfiles:
        content = f.read_text()
        if not imports_substrate(content):
            skipped.append((f, "no substrate imports"))
            continue
        if has_shim(content):
            skipped.append((f, "shim already injected"))
            continue
        new_content = inject_shim(content)
        fixed.append(f)
        if args.write:
            f.write_text(new_content)

    print(f"  fixed:   {len(fixed)}")
    print(f"  skipped: {len(skipped)}")
    print(f"Mode: {'WRITE' if args.write else 'DRY-RUN'}")

    if args.check:
        still_broken: list[Path] = []
        for f in root_pyfiles:
            try:
                compile(f.read_text(), str(f), "exec")
            except SyntaxError as e:
                still_broken.append(f)
                print(f"  STILL BROKEN: {f.relative_to(REPO_ROOT)}: {e.msg}")
        if still_broken:
            return 1
        print("All root scripts compile cleanly.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
