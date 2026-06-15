"""
Update Proof Status from Lean Build

Reads `lake build` output to determine which declarations contain `sorry`
and updates `proof-objects.json` accordingly.  Also writes witness files
for successfully-validated declarations (hash-based cache invalidation).

Usage:
    python .github/scripts/update_proof_status.py \\
        [--manifest proof-objects.json] \\
        [--build-log build.log]

This script is designed to run as part of CI after `lake build`.
"""

import argparse
import hashlib
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

from qou_lib.config import DEFAULT_MANIFEST, REPO_ROOT
from qou_lib.manifest import load_manifest, save_manifest, update_manifest_timestamp


CONTENT_DIR = REPO_ROOT / "content"
LEAN_DIR = REPO_ROOT / "lean"
HASH_LENGTH = 12


def lean_file_hash(path: Path) -> str:
    """Compute 12-char SHA-256 hex prefix of a file's content."""
    return hashlib.sha256(path.read_bytes()).hexdigest()[:HASH_LENGTH]


def find_lean_file(lean_info: dict) -> Path | None:
    """Resolve the .lean file path from a proof object's lean info."""
    # Try content-colocated files first
    if lean_info.get("file"):
        candidate = LEAN_DIR / lean_info["file"]
        if candidate.exists():
            return candidate
    # Search content dirs for .lean siblings — case-insensitive exact match
    if lean_info.get("decl"):
        decl_end = lean_info["decl"].split(".")[-1].lower()
        for p in CONTENT_DIR.rglob("*.lean"):
            if decl_end == p.stem.replace("-", "_").lower():
                return p
    return None


def stamp_witness(lean_path: Path) -> str | None:
    """Create a witness file for the current content of a .lean file.
    Clears stale witnesses first. Returns the hash."""
    if not lean_path.exists():
        return None
    # Clear old witnesses for this file
    for old in lean_path.parent.glob(f"{lean_path.name}.*.witness"):
        old.unlink()
    h = lean_file_hash(lean_path)
    witness = lean_path.parent / f"{lean_path.name}.{h}.witness"
    meta = json.dumps({
        "leanFile": lean_path.name,
        "hash": h,
        "stampedAt": datetime.now(timezone.utc).isoformat(),
    })
    witness.write_text(meta + "\n")
    return h


def parse_sorry_warnings(log_text):
    """Extract declaration locations that use sorry from build log output."""
    sorry_decls = set()
    pattern = re.compile(
        r"(\S+\.lean):(\d+):\d+:\s*warning:\s*declaration uses 'sorry'"
    )
    for m in pattern.finditer(log_text):
        sorry_decls.add((m.group(1), int(m.group(2))))
    return sorry_decls


def parse_sorry_decl_names(log_text):
    """Extract sorry-using declaration names from build log."""
    names = set()
    pattern = re.compile(r"'([^']+)'\s+uses sorry")
    for m in pattern.finditer(log_text):
        names.add(m.group(1))
    return names


def main():
    parser = argparse.ArgumentParser(description="Update proof status from Lean build.")
    parser.add_argument(
        "--manifest", type=Path, default=DEFAULT_MANIFEST,
        help="Path to proof-objects.json",
    )
    parser.add_argument(
        "--build-log", type=Path, default=None,
        help="Path to build log file (reads stdin if omitted)",
    )
    args = parser.parse_args()

    manifest = load_manifest(args.manifest)
    if not manifest.get("objects"):
        print(f"❌ No objects in manifest: {args.manifest}")
        sys.exit(1)

    if args.build_log and args.build_log.exists():
        log_text = args.build_log.read_text(encoding="utf-8")
    else:
        log_text = sys.stdin.read()

    sorry_names = parse_sorry_decl_names(log_text)

    updated = 0
    witnessed = 0
    for obj in manifest.get("objects", []):
        lean_info = obj.get("lean")
        if not lean_info or "decl" not in lean_info:
            continue

        decl = lean_info["decl"]
        old_status = obj.get("formalization_status", "not_started")

        if decl in sorry_names:
            new_status = "has_sorry"
            lean_info["sorry_free"] = False
            lean_info["witnessed"] = False
        elif old_status in ("stated", "has_sorry"):
            new_status = "proved"
            lean_info["sorry_free"] = True
        else:
            continue

        if new_status != old_status:
            obj["formalization_status"] = new_status
            updated += 1

        # Stamp witness for proved declarations
        if new_status == "proved":
            lean_path = find_lean_file(lean_info)
            if lean_path:
                h = stamp_witness(lean_path)
                if h:
                    lean_info["lean_hash"] = h
                    lean_info["witnessed"] = True
                    witnessed += 1

    update_manifest_timestamp(manifest)
    save_manifest(manifest, args.manifest)

    print(f"✅ Updated {updated} object statuses, stamped {witnessed} witnesses in {args.manifest}")


if __name__ == "__main__":
    main()
