#!/usr/bin/env python3
"""scripts/lake-cache-fetch-multi.py — multi-package lake-cache restore.

Consumer for the per-package + .olean.xz + cache-index.json format that
scripts/lake-cache-produce.py writes (PR #1957). Complements
scripts/lake-cache-fetch.sh (which consumes the monolithic
lake-cache/qou-<toolchain> format).

For each git-installed package in `lake-manifest.json`:

  1. Shallow-fetch its orphan branch `lake-cache/<pkg>-<toolchain>`
     (or `<branch-suffix>` variant when --branch-suffix is given)
  2. git archive extract the .lake/ subtree into a staging dir
  3. Run the regen recipe from `cache-index.json`:
       - decompress_xz : foo.olean.xz → foo.olean (delete .xz)
       - compute_hashes: write foo.olean.hash (sha256 12-hex prefix)
       - touch_trace   : touch foo.olean.trace
  4. Atomic-rename staging .lake/packages/<pkg>/ into the repo's
     .lake/packages/<pkg>/

Skips a package if the orphan branch doesn't exist or the local
package's .lake/ is already populated (idempotent + safe to re-run).

Usage:
    ./scripts/lake-cache-fetch-multi.py
    ./scripts/lake-cache-fetch-multi.py --packages mathlib,aesop
    ./scripts/lake-cache-fetch-multi.py --branch-suffix test
    ./scripts/lake-cache-fetch-multi.py --force        # re-extract even if warm

Exit codes:
  0 = some/all packages restored or already warm
  1 = pre-flight failure
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
MANIFEST = REPO_ROOT / "lake-manifest.json"
TOOLCHAIN_FILE = REPO_ROOT / "lean-toolchain"


def run(cmd, cwd=None, check=True, capture=False):
    return subprocess.run(
        cmd, cwd=cwd, check=check,
        capture_output=capture, text=capture,
    )


def toolchain_slug() -> str:
    text = TOOLCHAIN_FILE.read_text().strip()
    m = re.search(r"v\d+\.\d+\.\d+", text)
    if not m:
        sys.exit(f"lake-cache-fetch-multi: cannot parse toolchain from {TOOLCHAIN_FILE}")
    return m.group(0).replace(".", "-")


def load_packages():
    if not MANIFEST.exists():
        sys.exit(f"lake-cache-fetch-multi: no lake-manifest.json at {MANIFEST}")
    data = json.loads(MANIFEST.read_text())
    return [p for p in data.get("packages", []) if p.get("type") == "git"]


def fetch_orphan(branch: str) -> bool:
    """Shallow-fetch an orphan branch from origin. Returns True on success."""
    result = run(
        ["git", "fetch", "--depth=1", "origin", branch],
        cwd=REPO_ROOT, check=False, capture=True,
    )
    return result.returncode == 0


def package_is_warm(pkg_name: str) -> bool:
    """True if .lake/packages/<pkg>/.lake/build/lib/ is already populated."""
    lib = REPO_ROOT / ".lake" / "packages" / pkg_name / ".lake" / "build" / "lib"
    if not lib.exists():
        return False
    return any(lib.iterdir())


def extract_lake_subtree(staging: Path) -> Path | None:
    """git archive the .lake/ tree from FETCH_HEAD into staging.

    Returns the staging-relative .lake/ Path or None on failure.
    """
    archive_proc = subprocess.Popen(
        ["git", "archive", "--format=tar", "FETCH_HEAD", "--", ".lake"],
        cwd=REPO_ROOT, stdout=subprocess.PIPE,
    )
    # GNU tar strips leading '/' by default — no flag needed; the
    # producer's git archive output never has absolute paths anyway.
    tar_proc = subprocess.Popen(
        ["tar", "-xC", str(staging)],
        stdin=archive_proc.stdout,
    )
    archive_proc.stdout.close()
    tar_proc.communicate()
    archive_proc.wait()
    lake = staging / ".lake"
    return lake if lake.exists() else None


def regen_from_index(staging_lake: Path, index_path: Path) -> int:
    """Walk cache-index.json regen_steps and apply each.

    Returns number of files materialized.
    """
    if not index_path.exists():
        # Best-effort default: decompress any .olean.xz, generate hashes.
        steps = [
            {"kind": "decompress_xz", "input_glob": "**/*.olean.xz", "remove_input": True},
            {"kind": "compute_hashes", "input_glob": "**/*.olean",
             "output_suffix": ".hash", "algorithm": "sha256-12hex"},
            {"kind": "touch_trace", "input_glob": "**/*.olean", "output_suffix": ".trace"},
        ]
    else:
        index = json.loads(index_path.read_text())
        steps = index.get("regen_steps", [])

    n = 0
    for step in steps:
        kind = step.get("kind")
        glob = step.get("input_glob", "")

        if kind == "decompress_xz":
            for src in list(staging_lake.rglob("*.olean.xz")):
                if not src.is_file():
                    continue
                dst = src.with_suffix("")  # strip .xz
                with src.open("rb") as si, dst.open("wb") as so:
                    subprocess.run(["xz", "-d", "-c"], stdin=si, stdout=so, check=True)
                if step.get("remove_input", True):
                    src.unlink()
                n += 1
        elif kind == "compute_hashes":
            suffix = step.get("output_suffix", ".hash")
            for f in staging_lake.rglob("*.olean"):
                if not f.is_file():
                    continue
                h = hashlib.sha256(f.read_bytes()).hexdigest()[:12]
                (f.with_suffix(f.suffix + suffix)).write_text(h + "\n")
                n += 1
        elif kind == "touch_trace":
            suffix = step.get("output_suffix", ".trace")
            for f in staging_lake.rglob("*.olean"):
                if not f.is_file():
                    continue
                (f.with_suffix(f.suffix + suffix)).touch()
                n += 1
        # Unknown step kinds: silently skip (forward-compat for future indexes).

    return n


def restore_one(pkg: dict, slug: str, suffix: str, force: bool) -> dict:
    name = pkg["name"]
    branch = f"lake-cache/{name}-{slug}{('-' + suffix) if suffix else ''}"

    if not force and package_is_warm(name):
        return {"name": name, "status": "warm-already"}

    if not fetch_orphan(branch):
        return {"name": name, "branch": branch, "status": "branch-missing"}

    with tempfile.TemporaryDirectory(prefix=f"lcfm-{name}-") as staging:
        staging_p = Path(staging)
        lake = extract_lake_subtree(staging_p)
        if lake is None:
            return {"name": name, "branch": branch, "status": "no-lake-tree"}

        # Locate this package's subtree within the archive
        pkg_subtree = lake / "packages" / name
        if not pkg_subtree.exists():
            return {"name": name, "branch": branch, "status": "no-package-subtree"}

        # Apply regen recipe (decompress xz + hashes + traces).
        index_path = staging_p / "cache-index.json"
        if not index_path.exists():
            # Producer also keeps the index at the .lake tree root sometimes;
            # fall back to root-level extract.
            alt_index = lake.parent / "cache-index.json"
            if alt_index.exists():
                index_path = alt_index
        n_regen = regen_from_index(pkg_subtree, index_path)

        # Move into place atomically (replace any existing partial).
        dst = REPO_ROOT / ".lake" / "packages" / name
        dst.parent.mkdir(parents=True, exist_ok=True)
        if dst.exists():
            shutil.rmtree(dst)
        shutil.move(str(pkg_subtree), str(dst))

        size_mb = sum(f.stat().st_size for f in dst.rglob("*") if f.is_file()) // (1024*1024)
        return {
            "name": name, "branch": branch, "status": "restored",
            "regen_files": n_regen, "size_mb": size_mb,
        }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--packages", help="comma-separated list (default: all in manifest)")
    parser.add_argument("--branch-suffix", default="",
                        help="suffix on lake-cache/<pkg>-<tc>-<suffix> branches")
    parser.add_argument("--force", action="store_true",
                        help="re-extract even if package is already warm")
    args = parser.parse_args()

    slug = toolchain_slug()
    all_pkgs = load_packages()
    if args.packages:
        wanted = set(args.packages.split(","))
        pkgs = [p for p in all_pkgs if p["name"] in wanted]
    else:
        pkgs = all_pkgs

    print(f"lake-cache-fetch-multi: {len(pkgs)} package(s), toolchain {slug}")
    stats = []
    for pkg in pkgs:
        try:
            stats.append(restore_one(pkg, slug, args.branch_suffix, args.force))
        except subprocess.CalledProcessError as e:
            stats.append({"name": pkg["name"], "status": f"failed: {e}"})

    print("\n=== Summary ===")
    n_restored = n_warm = n_missing = 0
    for s in stats:
        name = s["name"]
        st = s["status"]
        if st == "restored":
            print(f"  {name:>18}: ✓ restored "
                  f"({s.get('size_mb',0)} MB, {s.get('regen_files',0)} regen)")
            n_restored += 1
        elif st == "warm-already":
            print(f"  {name:>18}: · already warm (skip)")
            n_warm += 1
        elif st == "branch-missing":
            print(f"  {name:>18}: ⊘ branch {s.get('branch','')} not on origin")
            n_missing += 1
        else:
            print(f"  {name:>18}: {st}")

    print(f"\n  restored={n_restored}  warm={n_warm}  missing={n_missing}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
