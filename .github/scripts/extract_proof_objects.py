"""
Extract Proof Objects from LaTeX Source

Parses all chapter .tex files for theorem-like environments (theorem, lemma,
proposition, corollary, definition, example, remark, conjecture) and their
labels.  Outputs or updates `proof-objects.json` in the repository root.

Usage:
    python .github/scripts/extract_proof_objects.py [--output proof-objects.json]

The script preserves existing review records and Lean linkage data when
updating — it only adds new objects and removes objects whose labels no
longer exist in the LaTeX source.
"""

import argparse
import re
from pathlib import Path

from qou_lib.config import (
    BEGIN_RE,
    CHAPTER_FILES,
    CHAPTER_LEAN_FILES,
    CHAPTERS_DIR,
    ENV_TYPES,
    GH_PAGES_BASE,
    GITHUB_REPO,
    LABEL_RE,
    LEAN_RE,
    LEANOK_RE,
    MAX_ENV_SCAN_LINES,
    REPO_ROOT,
    USES_RE,
)
from qou_lib.git_utils import get_commit_sha
from qou_lib.manifest import (
    build_dependency_edges,
    merge_with_existing,
    save_manifest,
    update_manifest_timestamp,
)

DEFAULT_OUTPUT = REPO_ROOT / "proof-objects.json"


def parse_chapter(filepath, chapter_num):
    """Parse a single .tex file and return a list of proof objects."""
    objects = []
    rel_path = str(filepath.relative_to(REPO_ROOT))

    with open(filepath, encoding="utf-8") as f:
        lines = f.readlines()

    i = 0
    while i < len(lines):
        line = lines[i]
        m = BEGIN_RE.search(line)
        if not m:
            i += 1
            continue

        env_name = m.group(1)
        title = m.group(2)  # may be None
        begin_line = i + 1  # 1-indexed

        # Scan the environment body for \label, \lean, \uses, \leanok
        label = None
        lean_decl = None
        uses = []
        leanok = False
        j = i + 1
        end_re = re.compile(r"\\end\{" + re.escape(env_name) + r"\}")
        while j < min(i + MAX_ENV_SCAN_LINES, len(lines)):
            body_line = lines[j]
            if end_re.search(body_line):
                break

            lm = LABEL_RE.search(body_line)
            if lm and label is None:
                label = lm.group(1)

            lean_m = LEAN_RE.search(body_line)
            if lean_m:
                lean_decl = lean_m.group(1).strip()

            uses_m = USES_RE.search(body_line)
            if uses_m:
                uses = [u.strip() for u in uses_m.group(1).split(",")]

            if LEANOK_RE.search(body_line):
                leanok = True

            j += 1

        if label:
            obj = {
                "label": label,
                "object_type": ENV_TYPES[env_name],
                "latex": {
                    "file": rel_path,
                    "line": begin_line,
                    "chapter": chapter_num,
                },
            }
            if title:
                obj["title"] = title.strip()
            if lean_decl:
                lean_ref = {"decl": lean_decl}
                if chapter_num in CHAPTER_LEAN_FILES:
                    lean_file = CHAPTER_LEAN_FILES[chapter_num]
                    lean_ref["file"] = lean_file
                    lean_ref["gh_pages_url"] = f"{GH_PAGES_BASE}/lean/{lean_file}"
                    commit = get_commit_sha()
                    lean_ref["github_source_url"] = (
                        f"https://github.com/{GITHUB_REPO}/blob/{commit}/lean/{lean_file}"
                    )
                    lean_ref["last_edited_commit"] = commit
                obj["lean"] = lean_ref
                if leanok:
                    obj["formalization_status"] = "proved"
                else:
                    obj["formalization_status"] = "stated"
            else:
                obj["formalization_status"] = "not_started"
            if uses:
                obj["uses"] = uses

            objects.append(obj)

        i = j + 1 if j > i else i + 1

    return objects


def main():
    parser = argparse.ArgumentParser(description="Extract proof objects from LaTeX.")
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT,
        help="Output path for proof-objects.json",
    )
    args = parser.parse_args()

    all_objects = []
    for chapter_num, filename in enumerate(CHAPTER_FILES, start=1):
        filepath = CHAPTERS_DIR / filename
        if not filepath.exists():
            print(f"⚠️  Skipping missing chapter: {filepath}")
            continue
        objects = parse_chapter(filepath, chapter_num)
        print(f"  Chapter {chapter_num:2d} ({filename}): {len(objects)} objects")
        all_objects.extend(objects)

    print(f"\nTotal objects extracted: {len(all_objects)}")

    # Merge with existing data
    all_objects = merge_with_existing(all_objects, args.output)

    # Build manifest
    manifest = {
        "version": "1.0",
        "manuscript": {
            "repo": GITHUB_REPO,
            "pdf_url": f"{GH_PAGES_BASE}/quantum-observable-universe.pdf",
            "lean_docs_url": f"{GH_PAGES_BASE}/lean/",
        },
        "objects": all_objects,
        "dependencies": build_dependency_edges(all_objects),
    }
    update_manifest_timestamp(manifest)
    save_manifest(manifest, args.output)

    print(f"\n✅ Wrote {args.output}")


if __name__ == "__main__":
    main()
