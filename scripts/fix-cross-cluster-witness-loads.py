#!/usr/bin/env python3
"""fix-cross-cluster-witness-loads.py — rewrite the
`HERE / "X.witness.json"` (and "X.derivation.json") idiom to use
`_path_bridge.witness_path(...)` when X is NOT the script's own
emitted sidecar.

After Phases 1-4 of the subdirectory refactor, scripts that load
UPSTREAM witnesses produced by a different cluster (or by an
unmoved root script) silently resolve those paths into the wrong
directory. The bridge's new `witness_path(name, HERE)` helper
searches every cluster subdir + the package root, so the cross-
cluster lookups Just Work.

Heuristic for "is this an own-output write vs. an upstream
read":

  - If the bare name (with `.witness.json` / `.derivation.json`
    stripped) matches the script's slug (kebab-case of the
    script's basename), with or without a `-probe` / `-audit` /
    `-sweep` suffix, treat it as OWN OUTPUT and keep `HERE /
    "..."`.

  - Otherwise treat it as an UPSTREAM READ and rewrite to
    `_path_bridge.witness_path("...", HERE)`. Inject an
    `import _path_bridge` at the top of the rewritten block if
    not already imported by the script's shim.

USAGE

    python3 scripts/fix-cross-cluster-witness-loads.py [--write]
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
COMPUTE_DIR = REPO_ROOT / "folio-assistant" / "computations"


def _discover_cluster_dirs() -> list[str]:
    out: list[str] = []
    for d in sorted(COMPUTE_DIR.iterdir()):
        if not d.is_dir() or d.name.startswith(("_", ".")):
            continue
        if not (d / "__init__.py").is_file():
            continue
        out.append(d.name)
    return out


CLUSTER_DIRS = _discover_cluster_dirs()
HERE_JSON_RE = re.compile(
    r'HERE\s*/\s*"([a-z0-9][a-z0-9-]*\.(?:witness|derivation)\.json)"'
)


def own_witness_names(script: Path) -> set[str]:
    """Possible own-output witness names for this script."""
    slug = script.stem.replace("_", "-")
    base = slug
    for suffix in ("-probe", "-audit", "-sweep"):
        if slug.endswith(suffix):
            base = slug[: -len(suffix)]
            break
    return {
        f"{slug}.witness.json",
        f"{base}.witness.json",
        f"{slug}.derivation.json",
        f"{base}.derivation.json",
    }


def rewrite_script(script: Path, dry: bool) -> tuple[bool, list[str]]:
    content = script.read_text()
    own = own_witness_names(script)
    matches = list(HERE_JSON_RE.finditer(content))
    if not matches:
        return False, []
    changes: list[str] = []
    new_content = content
    for m in matches:
        name = m.group(1)
        if name in own:
            continue  # own-output write — keep HERE
        old_expr = m.group(0)
        new_expr = f'_pb.witness_path("{name}", HERE)'
        new_content = new_content.replace(old_expr, new_expr)
        changes.append(f"{name} (HERE → witness_path)")
    if not changes:
        return False, []
    # Ensure `_pb` (an alias for _path_bridge) is available before
    # the first witness_path call.
    if "import _path_bridge as _pb" not in new_content:
        injected = False
        # (a) Cluster scripts: the refactor shim does
        #     `del _sys, _Path, _bridge` — inject right after it.
        del_line_re = re.compile(r"^del _sys, _Path, _bridge\s*\n", re.MULTILINE)
        m = del_line_re.search(new_content)
        if m is not None:
            inject_idx = m.end()
            new_content = (
                new_content[:inject_idx]
                + "import _path_bridge as _pb  # noqa: E402 — cross-cluster witness lookup\n"
                + new_content[inject_idx:]
            )
            injected = True
        if not injected:
            # (b) Root scripts: they carry the bare
            #     `import _path_bridge  # noqa ... Phase 6 bridge`
            #     shim. Inject the `_pb` alias right after it.
            root_shim_re = re.compile(
                r"^import _path_bridge\b.*\n", re.MULTILINE
            )
            m = root_shim_re.search(new_content)
            if m is not None:
                inject_idx = m.end()
                new_content = (
                    new_content[:inject_idx]
                    + "import _path_bridge as _pb  # noqa: E402 — cross-cluster witness lookup\n"
                    + new_content[inject_idx:]
                )
                injected = True
        if not injected:
            # (c) No bridge shim at all (root script that neither
            #     moved nor imports substrate, but DOES read a witness
            #     that co-moved into a cluster, e.g.
            #     cross_check_trM_1ppb.py reads markov-peel-atomic-tr-m
            #     which moved into markov/). Inject the root bridge
            #     shim + the `_pb` alias at the top-of-module import
            #     position (after shebang / docstring / __future__).
            lines = new_content.splitlines(keepends=True)
            idx = 0
            if lines and lines[idx].startswith("#!"):
                idx += 1
            while idx < len(lines) and lines[idx].lstrip().startswith("#"):
                idx += 1
            if idx < len(lines) and lines[idx].lstrip().startswith(('"""', "'''")):
                q = '"""' if '"""' in lines[idx] else "'''"
                rest = lines[idx].lstrip().removeprefix(q)
                if q in rest:
                    idx += 1
                else:
                    j = idx + 1
                    while j < len(lines) and q not in lines[j]:
                        j += 1
                    idx = j + 1
            look = idx
            while look < len(lines) and (
                lines[look].strip() == "" or lines[look].lstrip().startswith("#")
            ):
                look += 1
            if look < len(lines) and lines[look].startswith("from __future__"):
                idx = look
            while idx < len(lines) and lines[idx].startswith("from __future__"):
                idx += 1
            while idx < len(lines) and lines[idx].strip() == "":
                idx += 1
            shim = (
                "import _path_bridge  # noqa: F401, E402 — bridge: reads a witness that co-moved into a cluster subdir\n"
                "import _path_bridge as _pb  # noqa: E402 — cross-cluster witness lookup\n"
            )
            new_content = "".join(lines[:idx]) + shim + "".join(lines[idx:])
            injected = True
    if dry:
        return True, changes
    script.write_text(new_content)
    return True, changes


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--write", action="store_true")
    parser.add_argument("--include-root", action="store_true",
                        help="also scan root-level scripts (those that "
                             "load a witness which co-moved into a cluster)")
    args = parser.parse_args()

    all_files: list[Path] = []
    for sub in CLUSTER_DIRS:
        all_files.extend((COMPUTE_DIR / sub).glob("*.py"))
    if args.include_root:
        all_files.extend(
            f for f in COMPUTE_DIR.glob("*.py")
            if f.name not in ("__init__.py", "_path_bridge.py")
        )
    print(f"Scanning {len(all_files)} scripts"
          f"{' (incl. root)' if args.include_root else ' (cluster-subdir only)'}")

    fixed = 0
    for f in sorted(all_files):
        changed, changes = rewrite_script(f, dry=not args.write)
        if changed:
            fixed += 1
            print(f"  {f.relative_to(REPO_ROOT)}:")
            for c in changes:
                print(f"    {c}")

    print()
    print(f"scripts {'rewritten' if args.write else 'would be rewritten'}: {fixed}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
