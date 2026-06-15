"""
Generate Lean 4 Stub Files from proof-objects.json

Reads `proof-objects.json` and populates the Lean chapter files under
`lean/QOU/` with `sorry`-based stubs for every theorem-like object that
has a `lean.decl` field but no existing Lean declaration.

Usage:
    python .github/scripts/generate_lean_stubs.py [--manifest proof-objects.json]

The script is idempotent: it will not overwrite declarations that already
exist in the Lean files.  New stubs are inserted before the last `end`
statement in each chapter file to maintain namespace structure.
"""

import argparse
import re
import sys
from pathlib import Path

from qou_lib.config import CHAPTER_LEAN_FILES, LEAN_DIR, LEAN_KEYWORDS
from qou_lib.manifest import load_manifest

DEFAULT_MANIFEST = LEAN_DIR.parent / "proof-objects.json"


def label_to_lean_name(label):
    """Convert a LaTeX label like 'thm:lifting-exists' to a Lean name
    like 'lifting_exists'."""
    name = label.split(":", 1)[-1] if ":" in label else label
    name = name.replace("-", "_")
    name = re.sub(r"[^a-zA-Z0-9_]", "", name)
    return name


def generate_stub(obj):
    """Generate a Lean stub declaration for a proof object."""
    label = obj["label"]
    obj_type = obj["object_type"]
    title = obj.get("title", "")
    lean_keyword = LEAN_KEYWORDS.get(obj_type, "theorem")

    if "lean" in obj and "decl" in obj["lean"]:
        decl_name = obj["lean"]["decl"].rsplit(".", 1)[-1]
    else:
        decl_name = label_to_lean_name(label)

    latex_file = obj.get("latex", {}).get("file", "")
    latex_line = obj.get("latex", {}).get("line", "")

    lines = []
    lines.append(f"/-- {title or label}")
    lines.append(f"")
    lines.append(f"LaTeX: `{latex_file}:{latex_line}` (`\\label{{{label}}}`)")
    lines.append(f"-/")
    lines.append(f"{lean_keyword} {decl_name} : Sorry := sorry")
    lines.append("")
    return "\n".join(lines)


def _camel_to_snake(name):
    """Convert CamelCase to snake_case: 'ProjectiveLineObject' → 'projective_line_object'."""
    s = re.sub(r"([A-Z]+)([A-Z][a-z])", r"\1_\2", name)
    s = re.sub(r"([a-z0-9])([A-Z])", r"\1_\2", s)
    return s.lower()


def get_existing_decls(filepath):
    """Read a Lean file and return the set of declaration names found.

    Returns both the original names and their snake_case equivalents so
    that CamelCase Lean declarations (e.g. ``ProjectiveLineObject``) match
    snake_case names derived from LaTeX labels (``projective_line_object``).
    """
    decls = set()
    if not filepath.exists():
        return decls
    content = filepath.read_text(encoding="utf-8")
    for m in re.finditer(r"(?:theorem|lemma|def|structure|class|instance|abbrev)\s+(\w+)", content):
        name = m.group(1)
        decls.add(name)
        decls.add(_camel_to_snake(name))
    return decls


def main():
    parser = argparse.ArgumentParser(description="Generate Lean stubs from proof-objects.json.")
    parser.add_argument(
        "--manifest",
        type=Path,
        default=DEFAULT_MANIFEST,
        help="Path to proof-objects.json",
    )
    args = parser.parse_args()

    manifest = load_manifest(args.manifest)
    if not manifest.get("objects"):
        print(f"❌ No objects in manifest: {args.manifest}")
        print("Run extract_proof_objects.py first (content build may have failed).")
        sys.exit(1)

    # Group objects by chapter
    by_chapter = {}
    for obj in manifest.get("objects", []):
        chapter = obj.get("latex", {}).get("chapter")
        if chapter and chapter in CHAPTER_LEAN_FILES:
            by_chapter.setdefault(chapter, []).append(obj)

    total_new = 0
    for chapter_num, objects in sorted(by_chapter.items()):
        lean_file = LEAN_DIR / CHAPTER_LEAN_FILES[chapter_num]
        if not lean_file.exists():
            print(f"⚠️  Lean file missing: {lean_file}")
            continue

        existing = get_existing_decls(lean_file)
        stubs = []

        for obj in objects:
            obj_type = obj["object_type"]
            if obj_type not in LEAN_KEYWORDS:
                continue  # skip examples, remarks

            if "lean" in obj and "decl" in obj["lean"]:
                decl_name = obj["lean"]["decl"].rsplit(".", 1)[-1]
            else:
                decl_name = label_to_lean_name(obj["label"])

            if decl_name in existing:
                continue  # already declared

            stubs.append(generate_stub(obj))

        if not stubs:
            print(f"  Chapter {chapter_num}: no new stubs needed")
            continue

        # Insert stubs before the final `end` line
        content = lean_file.read_text(encoding="utf-8")
        end_match = list(re.finditer(r"^end\s+", content, re.MULTILINE))
        if end_match:
            insert_pos = end_match[-1].start()
            new_content = (
                content[:insert_pos]
                + "\n".join(stubs)
                + "\n"
                + content[insert_pos:]
            )
        else:
            new_content = content + "\n" + "\n".join(stubs)

        lean_file.write_text(new_content, encoding="utf-8")
        print(f"  Chapter {chapter_num}: added {len(stubs)} stubs to {lean_file.name}")
        total_new += len(stubs)

    print(f"\n✅ Generated {total_new} new Lean stubs")


if __name__ == "__main__":
    main()
