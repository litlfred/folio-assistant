#!/usr/bin/env python3
"""scripts/lake-cache-produce.py — per-package lake-cache producer.

Implements the design at
docs/audits/2026-06-07-lake-cache-only-new-content-design.md:

  - Walk `lake-manifest.json` to discover dependency packages
  - For each package: create the orphan branch `lake-cache/<pkg>-<toolchain>`
    containing ONLY that package's `.olean` files + a `cache-index.json`
    master index for regenerating small metadata at restore time
  - Strip the non-essential derivable artefacts (.c codegen, .ilean
    incremental, .hash, .trace, redundant .json, .git/, bin/cache)
  - Push each orphan branch independently — granular per-package
    refresh on dependency bumps

Usage:
    ./scripts/lake-cache-produce.py                 # all packages, dry-run by default
    ./scripts/lake-cache-produce.py --push          # actually push
    ./scripts/lake-cache-produce.py --packages mathlib,aesop --push
    ./scripts/lake-cache-produce.py --branch-suffix test  # use lake-cache/<pkg>-<tc>-test

Exit codes:
  0 = success (or dry-run completed)
  1 = pre-flight failure (missing .lake/, bad manifest, etc.)
  2 = bad invocation
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
LAKE_DIR = REPO_ROOT / ".lake"
PACKAGES_DIR = LAKE_DIR / "packages"
MANIFEST = REPO_ROOT / "lake-manifest.json"
TOOLCHAIN_FILE = REPO_ROOT / "lean-toolchain"

# Files / patterns to strip from each package's .lake/ tree before
# committing. The design doc lists rationale per item.
STRIP_NAMES = {"cache"}             # the lake exe cache binary
STRIP_DIRS = {".git", "ir"}         # .git/ for dep history, ir/ for .c codegen
STRIP_EXTS = {".ilean", ".hash", ".trace"}
# .json files: most are regen-able (each-module's .json is derivable from
# .olean header + lake config). For the conservative first cut we KEEP
# .json since the cost is small (~50 MB across all packages combined)
# and not keeping them risks lake refusing the cache. See design §
# "What gets stripped".

INDEX_FILENAME = "cache-index.json"


def run(cmd: list[str], cwd: Path | None = None, check: bool = True,
        capture: bool = False) -> subprocess.CompletedProcess:
    """Wrapper around subprocess.run with consistent defaults."""
    return subprocess.run(
        cmd, cwd=cwd, check=check,
        capture_output=capture, text=capture,
    )


def toolchain_slug() -> str:
    """v4.24.0 -> v4-24-0"""
    text = TOOLCHAIN_FILE.read_text().strip()
    m = re.search(r"v\d+\.\d+\.\d+", text)
    if not m:
        sys.exit(f"lake-cache-produce: cannot parse toolchain from {TOOLCHAIN_FILE}")
    return m.group(0).replace(".", "-")


def src_commit_sha() -> str:
    """Current main commit SHA (for cache provenance)."""
    try:
        result = run(["git", "rev-parse", "HEAD"], cwd=REPO_ROOT, capture=True)
        return result.stdout.strip()
    except subprocess.CalledProcessError:
        return "unknown"


def load_packages() -> list[dict]:
    """Read lake-manifest.json and return git-installed packages."""
    if not MANIFEST.exists():
        sys.exit(f"lake-cache-produce: no lake-manifest.json at {MANIFEST}")
    data = json.loads(MANIFEST.read_text())
    pkgs = [p for p in data.get("packages", []) if p.get("type") == "git"]
    if not pkgs:
        sys.exit("lake-cache-produce: no git-installed packages in manifest")
    return pkgs


def package_lake_root(pkg_name: str) -> Path:
    """Path to a package's .lake/ subtree in this workspace."""
    return PACKAGES_DIR / pkg_name / ".lake"


def strip_tree(root: Path) -> tuple[int, int]:
    """Remove non-essential files from a copied .lake/ tree.

    Returns (files_removed, bytes_freed).
    """
    n_files = 0
    bytes_freed = 0
    for d in list(root.rglob("*")):
        if d.is_symlink():
            continue
        if d.is_dir() and d.name in STRIP_DIRS:
            try:
                bytes_freed += sum(f.stat().st_size for f in d.rglob("*") if f.is_file())
            except OSError:
                pass
            shutil.rmtree(d, ignore_errors=True)
            continue
        if d.is_file():
            if d.name in STRIP_NAMES or d.suffix in STRIP_EXTS:
                try:
                    bytes_freed += d.stat().st_size
                except OSError:
                    pass
                d.unlink(missing_ok=True)
                n_files += 1
    return n_files, bytes_freed


def xz_compress_oleans(root: Path) -> tuple[int, int, int]:
    """Replace each .olean in `root` with `.olean.xz`.

    On a sample mathlib workload, xz -9 cuts olean blobs to ~22 % of
    raw (vs ~33 % for git's default zlib in the pack). Net wire saving
    is ~34 % vs storing raw .olean files. Decompression on restore is
    fast (~1 sec / 5 MB / CPU) and fully parallelizable.

    Returns (files_compressed, raw_bytes, compressed_bytes).
    """
    n = 0
    raw = 0
    out = 0
    for f in root.rglob("*.olean"):
        if not f.is_file() or f.is_symlink():
            continue
        size_before = f.stat().st_size
        out_path = f.with_suffix(f.suffix + ".xz")
        # xz -9 -T1 picks the slowest/best ratio. Single-threaded per
        # file keeps memory bounded; parallelism is across files (the
        # caller of this function could parallelize, but it's already
        # fast enough sequentially).
        subprocess.run(
            ["xz", "-9", "-T1", "-z", "-c", str(f)],
            stdout=out_path.open("wb"),
            check=True,
        )
        raw += size_before
        out += out_path.stat().st_size
        f.unlink()
        n += 1
    return n, raw, out


def build_master_index(pkg: dict, slug: str, dest_lake: Path) -> dict:
    """Construct the cache-index.json master manifest for a package.

    Schema: lake-cache-index/v1 — see design doc § 'cache-index.json schema'.
    """
    olean_paths = sorted(p.relative_to(dest_lake).as_posix()
                         for p in dest_lake.rglob("*.olean"))
    # The stored .olean files are XZ-compressed (.olean.xz); fetcher
    # must run decompress_xz step before lake can load them.
    olean_xz_paths = sorted(p.relative_to(dest_lake).as_posix()
                            for p in dest_lake.rglob("*.olean.xz"))
    return {
        "$schema": "lake-cache-index/v1",
        "package": pkg["name"],
        "toolchain": slug,
        "source_commit": src_commit_sha(),
        "package_rev": pkg.get("rev", "unknown"),
        "package_url": pkg.get("url", ""),
        "olean_count": len(olean_xz_paths) or len(olean_paths),
        "regen_steps": [
            {
                "kind": "decompress_xz",
                "input_glob": "**/*.olean.xz",
                "remove_input": True,
                "note": "xz -d on each .olean.xz to produce .olean",
            },
            {
                "kind": "compute_hashes",
                "input_glob": "**/*.olean",
                "output_suffix": ".hash",
                "algorithm": "sha256-12hex",
            },
            {
                "kind": "touch_trace",
                "input_glob": "**/*.olean",
                "output_suffix": ".trace",
            },
        ],
        "stripped": sorted(STRIP_DIRS) + sorted(STRIP_NAMES)
                    + [f"**/*{e}" for e in sorted(STRIP_EXTS)],
    }


def produce_one(pkg: dict, slug: str, branch: str, push: bool) -> dict:
    """Build one orphan-branch commit for a single package.

    Returns stats dict for reporting. No-op if the package's .lake root
    is missing (warns).
    """
    name = pkg["name"]
    pkg_lake = package_lake_root(name)
    if not pkg_lake.exists():
        print(f"  [{name}] SKIP — {pkg_lake} does not exist (build first?)")
        return {"name": name, "status": "skipped-missing"}

    # Use a temp dir + worktree at detached HEAD so the current checkout
    # is untouched. The orphan branch tree lives entirely in WORKDIR.
    with tempfile.TemporaryDirectory(prefix=f"lcp-{name}-") as workdir:
        workdir_p = Path(workdir)
        # Need to remove the dir for `git worktree add` to (re)create it.
        shutil.rmtree(workdir_p, ignore_errors=True)
        run(["git", "worktree", "add", "--detach", str(workdir_p), "HEAD"],
            cwd=REPO_ROOT, capture=True)
        try:
            # Make this worktree an orphan branch.
            run(["git", "checkout", "--orphan", branch], cwd=workdir_p, capture=True)
            run(["git", "rm", "-rf", "--cached", "--quiet", "."],
                cwd=workdir_p, check=False, capture=True)
            # Clear working tree (but keep .git symlink-file)
            for entry in workdir_p.iterdir():
                if entry.name == ".git":
                    continue
                if entry.is_dir() and not entry.is_symlink():
                    shutil.rmtree(entry, ignore_errors=True)
                else:
                    entry.unlink(missing_ok=True)

            # Copy the package's entire .lake/ subtree into the worktree.
            # We mirror the original layout (.lake/packages/<pkg>/.lake/...)
            # so lake's restore is a drop-in.
            dest_lake = workdir_p / ".lake" / "packages" / name / ".lake"
            dest_lake.parent.mkdir(parents=True, exist_ok=True)
            shutil.copytree(pkg_lake, dest_lake, symlinks=True)
            src_size = sum(f.stat().st_size for f in dest_lake.rglob("*") if f.is_file())

            # Strip non-essential files.
            n_stripped, bytes_freed = strip_tree(dest_lake)
            mid_size = sum(f.stat().st_size for f in dest_lake.rglob("*") if f.is_file())

            # XZ-compress each .olean in place (replace foo.olean with
            # foo.olean.xz). The master index records the decompress
            # step so the fetcher restores foo.olean before lake loads.
            xz_n, xz_raw, xz_out = xz_compress_oleans(dest_lake)
            final_size = sum(f.stat().st_size for f in dest_lake.rglob("*") if f.is_file())

            # Build + write the master index at the workspace root.
            index = build_master_index(pkg, slug, dest_lake)
            (workdir_p / INDEX_FILENAME).write_text(
                json.dumps(index, indent=2) + "\n",
            )

            # Stage + commit.
            run(["git", "add", "-f", ".lake", INDEX_FILENAME], cwd=workdir_p, capture=True)
            n_files_r = run(["git", "diff", "--cached", "--name-only"],
                            cwd=workdir_p, capture=True)
            n_files = len([l for l in n_files_r.stdout.splitlines() if l])

            if n_files == 0:
                print(f"  [{name}] SKIP — empty after strip (no oleans?)")
                return {"name": name, "status": "skipped-empty"}

            msg = (
                f"reseed lake-cache: {name} oleans at {slug}\n\n"
                f"Source main commit: {src_commit_sha()}\n"
                f"Package rev: {pkg.get('rev', 'unknown')}\n"
                f"Stripped {n_stripped} files ({bytes_freed // (1024*1024)} MB).\n"
                f"Generated by scripts/lake-cache-produce.py.\n"
                f"Restore via scripts/lake-cache-fetch.sh."
            )
            run([
                "git",
                "-c", "user.name=qou-lake-cache-bot",
                "-c", "user.email=qou-lake-cache-bot@users.noreply.github.com",
                "commit", "-m", msg, "--quiet",
            ], cwd=workdir_p, capture=True)
            commit_sha = run(["git", "rev-parse", "HEAD"], cwd=workdir_p,
                             capture=True).stdout.strip()

            xz_ratio_pct = (100 * xz_out // xz_raw) if xz_raw else 0
            stats = {
                "name": name,
                "branch": branch,
                "olean_count": index["olean_count"],
                "files_staged": n_files,
                "src_size_mb": src_size // (1024*1024),
                "mid_size_mb": mid_size // (1024*1024),
                "final_size_mb": final_size // (1024*1024),
                "stripped_files": n_stripped,
                "stripped_mb": bytes_freed // (1024*1024),
                "xz_count": xz_n,
                "xz_raw_mb": xz_raw // (1024*1024),
                "xz_out_mb": xz_out // (1024*1024),
                "xz_ratio_pct": xz_ratio_pct,
                "commit": commit_sha,
                "status": "pushed" if push else "dry-run",
            }

            if push:
                print(f"  [{name}] pushing {branch} (~{final_size // (1024*1024)} MB)")
                run(["git", "push", "--force", "origin", branch],
                    cwd=workdir_p, capture=True)
            else:
                print(f"  [{name}] DRY-RUN: {index['olean_count']} oleans, "
                      f"{final_size // (1024*1024)} MB; commit {commit_sha[:12]}")

            return stats
        finally:
            run(["git", "worktree", "remove", "--force", str(workdir_p)],
                cwd=REPO_ROOT, check=False, capture=True)
            # The temp branch is created by the worktree's --orphan checkout;
            # delete it from the repo's branch list.
            run(["git", "branch", "-D", branch],
                cwd=REPO_ROOT, check=False, capture=True)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--push", action="store_true",
                        help="actually push orphan branches (default: dry-run)")
    parser.add_argument("--packages", help="comma-separated list of package names "
                        "(default: all git-installed packages)")
    parser.add_argument("--branch-suffix", default="",
                        help="suffix appended to branch names (e.g. '-test')")
    args = parser.parse_args()

    if not LAKE_DIR.exists():
        sys.exit(f"lake-cache-produce: no .lake/ at {LAKE_DIR}; build first")

    slug = toolchain_slug()
    suffix = ("-" + args.branch_suffix) if args.branch_suffix else ""
    all_pkgs = load_packages()
    if args.packages:
        wanted = set(args.packages.split(","))
        pkgs = [p for p in all_pkgs if p["name"] in wanted]
        if not pkgs:
            sys.exit(f"lake-cache-produce: none of {wanted} matched the manifest")
    else:
        pkgs = all_pkgs

    print(f"lake-cache-produce: {len(pkgs)} package(s), toolchain {slug}, "
          f"{'PUSH' if args.push else 'DRY-RUN'}")
    stats = []
    for pkg in pkgs:
        branch = f"lake-cache/{pkg['name']}-{slug}{suffix}"
        try:
            stats.append(produce_one(pkg, slug, branch, args.push))
        except subprocess.CalledProcessError as e:
            print(f"  [{pkg['name']}] FAILED: {e}", file=sys.stderr)
            stats.append({"name": pkg["name"], "status": f"failed: {e}"})

    print("\n=== Summary ===")
    print(f"  {'package':>18} {'status':>8} {'oleans':>6} "
          f"{'src':>6} {'-> mid':>7} {'-> final':>9} {'xz_ratio':>9}")
    total_src = total_final = 0
    for s in stats:
        if s.get("status") in ("pushed", "dry-run"):
            print(f"  {s['name']:>18} {s['status']:>8} "
                  f"{s['olean_count']:>6} "
                  f"{s['src_size_mb']:>5} MB "
                  f"{s['mid_size_mb']:>5} MB "
                  f"{s['final_size_mb']:>6} MB "
                  f"{s['xz_ratio_pct']:>7}%")
            total_src += s["src_size_mb"]
            total_final += s["final_size_mb"]
        else:
            print(f"  {s['name']:>18} {s['status']}")
    print(f"  {'TOTAL':>18}: src {total_src} MB -> final {total_final} MB "
          f"({100 * total_final // max(total_src,1)}% of raw)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
