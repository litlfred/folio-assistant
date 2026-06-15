"""
Semantic Ontologist — Ambiguity Detection & Glossary Generation

Scans narrative LaTeX text for mathematical terms, detects ambiguities
(terms without unique type assignments), and generates:
  1. glossary.json — machine-readable glossary with ambiguity flags
  2. lean/QOU/Glossary.lean — Lean file with formal definitions
  3. mapping.json — narrative-to-Lean identifier mapping

Usage:
    python .github/scripts/ontologist.py scan [--output glossary.json]
    python .github/scripts/ontologist.py generate-lean [--glossary glossary.json]
    python .github/scripts/ontologist.py generate-mapping [--glossary glossary.json]
    python .github/scripts/ontologist.py all

Requires PYTHONPATH to include .github/scripts for qou_lib.
"""

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

from qou_lib.config import (
    BEGIN_RE,
    CHAPTER_FILES,
    CHAPTERS_DIR,
    ENV_TYPES,
    LABEL_RE,
    LEAN_DIR,
    MAX_ENV_SCAN_LINES,
    REPO_ROOT,
)
from qou_lib.git_utils import get_commit_sha

DEFAULT_GLOSSARY = REPO_ROOT / "glossary.json"
DEFAULT_MAPPING = REPO_ROOT / "mapping.json"
GLOSSARY_LEAN = LEAN_DIR / "QOU" / "Glossary.lean"

# ---------------------------------------------------------------------------
# Ambiguity triggers — phrases that signal an under-specified term.
# ---------------------------------------------------------------------------

AMBIGUITY_PATTERNS = [
    (re.compile(r"\bthe\s+mapping\b", re.IGNORECASE),
     "Mapping without specified domain/codomain types",
     ["ContinuousMap", "LinearMap", "RingHom", "Functor"]),
    (re.compile(r"\bthe\s+space\b", re.IGNORECASE),
     "Space without specified structure",
     ["TopologicalSpace", "MetricSpace", "SmoothManifold", "Scheme"]),
    (re.compile(r"\bsmoothness\b", re.IGNORECASE),
     "Smoothness without specified manifold/domain",
     ["SmoothManifoldWithCorners", "ContDiff", "Smooth"]),
    (re.compile(r"\bthe\s+group\b", re.IGNORECASE),
     "Group without specified algebraic structure",
     ["Group", "TopologicalGroup", "LieGroup", "CommGroup"]),
    (re.compile(r"\bthe\s+bundle\b", re.IGNORECASE),
     "Bundle without specified fiber/base",
     ["FiberBundle", "VectorBundle", "PrincipalBundle"]),
    (re.compile(r"\bthe\s+category\b", re.IGNORECASE),
     "Category without specified universe or structure level",
     ["Category", "SmallCategory", "Abelian", "MonoidalCategory"]),
]

# ---------------------------------------------------------------------------
# Known mathlib type mappings for common QOU terms.
# ---------------------------------------------------------------------------

KNOWN_TYPES = {
    "topological space": {
        "lean_name": "TopologicalSpace",
        "kind": "class",
        "mathlib_import": "Mathlib.Topology.Basic",
    },
    "smooth manifold": {
        "lean_name": "SmoothManifold",
        "kind": "class",
        "mathlib_import": "Mathlib.Geometry.Manifold.SmoothManifoldWithCorners",
    },
    "category": {
        "lean_name": "CategoryTheory.Category",
        "kind": "class",
        "mathlib_import": "Mathlib.CategoryTheory.Category.Basic",
        "universes": {"objects": "u", "morphisms": "v"},
    },
    "functor": {
        "lean_name": "CategoryTheory.Functor",
        "kind": "structure",
        "mathlib_import": "Mathlib.CategoryTheory.Functor.Basic",
    },
    "natural transformation": {
        "lean_name": "CategoryTheory.NatTrans",
        "kind": "structure",
        "mathlib_import": "Mathlib.CategoryTheory.NatTrans",
    },
    "monoidal category": {
        "lean_name": "CategoryTheory.MonoidalCategory",
        "kind": "class",
        "mathlib_import": "Mathlib.CategoryTheory.Monoidal.Basic",
        "universes": {"objects": "u", "morphisms": "v"},
    },
    "braided monoidal category": {
        "lean_name": "CategoryTheory.BraidedCategory",
        "kind": "class",
        "mathlib_import": "Mathlib.CategoryTheory.Monoidal.Braided.Basic",
        "universes": {"objects": "u", "morphisms": "v"},
    },
    "abelian category": {
        "lean_name": "CategoryTheory.Abelian",
        "kind": "class",
        "mathlib_import": "Mathlib.CategoryTheory.Abelian.Basic",
        "universes": {"objects": "u", "morphisms": "v"},
    },
    "group": {
        "lean_name": "Group",
        "kind": "class",
        "mathlib_import": "Mathlib.Algebra.Group.Basic",
    },
    "ring": {
        "lean_name": "Ring",
        "kind": "class",
        "mathlib_import": "Mathlib.Algebra.Ring.Basic",
    },
    "hopf algebra": {
        "lean_name": "HopfAlgebra",
        "kind": "class",
        "mathlib_import": None,
    },
    "fundamental groupoid": {
        "lean_name": "FundamentalGroupoid",
        "kind": "def",
        "mathlib_import": "Mathlib.Topology.AlgebraicTopology.FundamentalGroupoid",
    },
    "braid group": {
        "lean_name": "BraidGroup",
        "kind": "def",
        "mathlib_import": None,
    },
}

# ---------------------------------------------------------------------------
# Scanner
# ---------------------------------------------------------------------------


def scan_chapter(filepath, chapter_num):
    """Scan a chapter file for definitions and extract glossary candidates."""
    entries = []

    with open(filepath, encoding="utf-8") as f:
        lines = f.readlines()

    i = 0
    while i < len(lines):
        line = lines[i]
        m = BEGIN_RE.search(line)
        if m and m.group(1) == "definition":
            env_name = m.group(1)
            title = m.group(2)

            label = None
            body_lines = []
            j = i + 1
            end_re = re.compile(r"\\end\{" + re.escape(env_name) + r"\}")
            while j < min(i + MAX_ENV_SCAN_LINES, len(lines)):
                body_line = lines[j]
                if end_re.search(body_line):
                    break
                lm = LABEL_RE.search(body_line)
                if lm and label is None:
                    label = lm.group(1)
                body_lines.append(body_line.strip())
                j += 1

            if label and title:
                body_text = " ".join(body_lines)
                # Clean LaTeX from body for the narrative definition
                narrative_def = re.sub(r"\\[a-zA-Z]+\{[^}]*\}", "", body_text)
                narrative_def = re.sub(r"[\\${}]", "", narrative_def).strip()

                lean_name = _label_to_lean_name(label, chapter_num)
                entry = {
                    "narrative_term": title.strip(),
                    "lean_name": lean_name,
                    "kind": "def",
                    "narrative_definition": narrative_def[:500],
                    "latex_label": label,
                    "chapter": chapter_num,
                }

                # Check against known types
                title_lower = title.strip().lower()
                if title_lower in KNOWN_TYPES:
                    kt = KNOWN_TYPES[title_lower]
                    entry["mathlib_type"] = kt["lean_name"]
                    entry["mathlib_import"] = kt.get("mathlib_import")
                    if "universes" in kt:
                        entry["universes"] = kt["universes"]

                # Check for ambiguity
                ambiguity = _check_ambiguity(body_text)
                if ambiguity:
                    entry["ambiguity"] = ambiguity

                entries.append(entry)

            i = j + 1 if j > i else i + 1
        else:
            i += 1

    return entries


def _label_to_lean_name(label, chapter_num):
    """Convert a LaTeX label to a fully qualified Lean name."""
    from qou_lib.config import CHAPTER_LEAN_FILES
    name = label.split(":", 1)[-1] if ":" in label else label
    name = name.replace("-", "_")
    name = re.sub(r"[^a-zA-Z0-9_]", "", name)
    # Capitalize each word for Lean convention
    parts = name.split("_")
    camel = "".join(p.capitalize() for p in parts if p)

    if chapter_num in CHAPTER_LEAN_FILES:
        lean_file = CHAPTER_LEAN_FILES[chapter_num]
        namespace = lean_file.replace(".lean", "").replace("/", ".")
        return f"{namespace}.{camel}"
    return f"QOU.{camel}"


def _check_ambiguity(text):
    """Check if text contains ambiguous term usage."""
    for pattern, message, candidates in AMBIGUITY_PATTERNS:
        if pattern.search(text):
            return {
                "is_ambiguous": True,
                "message": message,
                "candidates": candidates,
                "resolved_to": None,
            }
    return None


# ---------------------------------------------------------------------------
# Glossary generation
# ---------------------------------------------------------------------------


def generate_glossary_lean(entries, output_path):
    """Generate Glossary.lean from glossary entries."""
    lines = []
    lines.append("/-!")
    lines.append("# QOU.Glossary — Formal Semantic Registry")
    lines.append("")
    lines.append("Central glossary of all mathematical terms used in the QOU manuscript.")
    lines.append("Each entry is defined as a `def`, `class`, or `constant` with a docstring")
    lines.append("containing the original narrative definition for LSP hover-support.")
    lines.append("")
    lines.append("Generated by: `python .github/scripts/ontologist.py generate-lean`")
    lines.append("-/")
    lines.append("")

    # Collect unique imports
    imports = set()
    imports.add("import Mathlib.Data.Real.Basic")
    imports.add("import Mathlib.Topology.Basic")
    imports.add("import Mathlib.CategoryTheory.Category.Basic")
    imports.add("import Mathlib.CategoryTheory.Functor.Basic")
    imports.add("import Mathlib.CategoryTheory.Monoidal.Basic")
    imports.add("import Mathlib.Geometry.Manifold.SmoothManifoldWithCorners")
    imports.add("import Mathlib.Analysis.InnerProductSpace.Basic")
    for entry in entries:
        mi = entry.get("mathlib_import")
        if mi:
            imports.add(f"import {mi}")

    for imp in sorted(imports):
        lines.append(imp)

    lines.append("")
    lines.append("open scoped Topology Manifold CategoryTheory")
    lines.append("")
    lines.append("namespace QOU.Glossary")
    lines.append("")

    for entry in entries:
        term = entry["narrative_term"]
        lean_name = entry["lean_name"].rsplit(".", 1)[-1]
        kind = entry.get("kind", "def")
        narrative_def = entry.get("narrative_definition", "")
        latex_label = entry.get("latex_label", "")
        mathlib_type = entry.get("mathlib_type")
        mathlib_import = entry.get("mathlib_import")
        universes = entry.get("universes")
        ambiguity = entry.get("ambiguity")

        # Docstring
        lines.append(f"/-- **{term}**")
        if narrative_def:
            # Wrap long lines
            wrapped = narrative_def[:300]
            lines.append(f"    {wrapped}")
        lines.append(f"")
        if latex_label:
            lines.append(f"    LaTeX: `\\label{{{latex_label}}}`")
        if mathlib_import:
            lines.append(f"    Mathlib: `{mathlib_import}`")
        if universes:
            u_obj = universes.get("objects", "u")
            u_mor = universes.get("morphisms", "v")
            lines.append(f"    Universes: objects in `{u_obj}`, morphisms in `{u_mor}`")
        if ambiguity and ambiguity.get("is_ambiguous"):
            lines.append(f"    ⚠️  AMBIGUOUS: {ambiguity['message']}")
            lines.append(f"    Candidates: {', '.join(ambiguity['candidates'])}")
        lines.append(f"-/")

        # Declaration
        if kind == "class":
            lines.append(f"class {lean_name} where")
            lines.append(f"  mk ::")
        elif kind == "structure":
            lines.append(f"structure {lean_name} where")
            lines.append(f"  mk ::")
        elif kind == "axiom":
            lines.append(f"axiom {lean_name} : Sorry")
        else:
            lines.append(f"def {lean_name} : Type* := sorry")

        lines.append("")

    lines.append("end QOU.Glossary")
    lines.append("")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text("\n".join(lines), encoding="utf-8")
    print(f"✅ Wrote {output_path}")


def generate_mapping(entries, output_path):
    """Generate mapping.json from glossary entries."""
    mappings = []
    for entry in entries:
        mappings.append({
            "narrative": entry["narrative_term"],
            "lean_id": entry["lean_name"],
            "latex_label": entry.get("latex_label"),
        })

    manifest = {
        "version": "1.0",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "mappings": mappings,
    }

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)

    print(f"✅ Wrote {output_path}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main():
    parser = argparse.ArgumentParser(description="Semantic Ontologist: glossary & ambiguity detection.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # scan
    p_scan = subparsers.add_parser("scan", help="Scan LaTeX for definition terms.")
    p_scan.add_argument("--output", type=Path, default=DEFAULT_GLOSSARY)

    # generate-lean
    p_lean = subparsers.add_parser("generate-lean", help="Generate Glossary.lean.")
    p_lean.add_argument("--glossary", type=Path, default=DEFAULT_GLOSSARY)
    p_lean.add_argument("--output", type=Path, default=GLOSSARY_LEAN)

    # generate-mapping
    p_map = subparsers.add_parser("generate-mapping", help="Generate mapping.json.")
    p_map.add_argument("--glossary", type=Path, default=DEFAULT_GLOSSARY)
    p_map.add_argument("--output", type=Path, default=DEFAULT_MAPPING)

    # all
    p_all = subparsers.add_parser("all", help="Run full pipeline: scan + generate.")
    p_all.add_argument("--glossary", type=Path, default=DEFAULT_GLOSSARY)
    p_all.add_argument("--mapping", type=Path, default=DEFAULT_MAPPING)
    p_all.add_argument("--lean", type=Path, default=GLOSSARY_LEAN)

    args = parser.parse_args()

    if args.command == "scan":
        entries = _run_scan()
        _save_glossary(entries, args.output)

    elif args.command == "generate-lean":
        entries = _load_glossary(args.glossary)
        generate_glossary_lean(entries, args.output)

    elif args.command == "generate-mapping":
        entries = _load_glossary(args.glossary)
        generate_mapping(entries, args.output)

    elif args.command == "all":
        entries = _run_scan()
        _save_glossary(entries, args.glossary)
        generate_glossary_lean(entries, args.lean)
        generate_mapping(entries, args.mapping)


def _run_scan():
    """Run the scanner across all chapters."""
    all_entries = []
    for chapter_num, filename in enumerate(CHAPTER_FILES, start=1):
        filepath = CHAPTERS_DIR / filename
        if not filepath.exists():
            continue
        entries = scan_chapter(filepath, chapter_num)
        print(f"  Chapter {chapter_num:2d} ({filename}): {len(entries)} glossary entries")
        all_entries.extend(entries)

    ambiguous = sum(1 for e in all_entries if e.get("ambiguity", {}).get("is_ambiguous"))
    print(f"\nTotal entries: {len(all_entries)}")
    print(f"Ambiguous: {ambiguous}")
    if ambiguous > 0:
        print("⚠️  Pipeline should halt until ambiguities are resolved.")
    return all_entries


def _save_glossary(entries, path):
    """Save glossary entries to JSON."""
    ambiguous = sum(1 for e in entries if e.get("ambiguity", {}).get("is_ambiguous"))
    manifest = {
        "version": "1.0",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "commit_sha": get_commit_sha(),
        "entry_count": len(entries),
        "ambiguity_count": ambiguous,
        "entries": entries,
    }
    with open(path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    print(f"✅ Wrote {path}")


def _load_glossary(path):
    """Load glossary entries from JSON."""
    if not path.exists():
        print(f"❌ Glossary not found: {path}")
        print("Run 'ontologist.py scan' first.")
        sys.exit(1)
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    return data.get("entries", [])


if __name__ == "__main__":
    main()
