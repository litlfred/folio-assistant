"""
Lean 4 Formalizer — Narrative to Proof Translation

Reads the Ontologist's glossary and the LaTeX source to generate Lean 4
theorem files with tactic-mapped proof skeletons and sorry bridges.

Usage:
    python .github/scripts/formalizer.py synthesize-imports [--glossary glossary.json]
    python .github/scripts/formalizer.py generate-theorems [--glossary glossary.json]
    python .github/scripts/formalizer.py export-proof-state --file FILE --line LINE
    python .github/scripts/formalizer.py all

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
    CHAPTER_LEAN_FILES,
    CHAPTERS_DIR,
    ENV_TYPES,
    LABEL_RE,
    LEAN_DIR,
    LEAN_KEYWORDS,
    MAX_ENV_SCAN_LINES,
    REPO_ROOT,
)
from qou_lib.git_utils import get_commit_sha

DEFAULT_GLOSSARY = REPO_ROOT / "glossary.json"

# ---------------------------------------------------------------------------
# Tactic mappings: narrative phrases → Lean tactics
# ---------------------------------------------------------------------------

TACTIC_MAPPINGS = [
    {
        "pattern": re.compile(r"by\s+calculation", re.IGNORECASE),
        "primary": "ring",
        "fallbacks": ["field_simp", "polyrith"],
        "context": "algebra",
    },
    {
        "pattern": re.compile(r"clearly\s+follows\s+from", re.IGNORECASE),
        "primary": "aesop",
        "fallbacks": ["linarith", "omega"],
        "context": "general",
    },
    {
        "pattern": re.compile(r"by\s+induction\s+on\s+(\w+)", re.IGNORECASE),
        "primary": "induction {0} with",
        "fallbacks": ["cases {0}"],
        "context": "general",
    },
    {
        "pattern": re.compile(r"by\s+the\s+universal\s+property", re.IGNORECASE),
        "primary": "exact Limits.IsLimit.lift",
        "fallbacks": ["exact Limits.IsLimit.hom_ext"],
        "context": "category_theory",
    },
    {
        "pattern": re.compile(r"diagram\s+commutes|naturality", re.IGNORECASE),
        "primary": "aesop_cat",
        "fallbacks": ["slice_lhs 1 2 => { simp [Category.assoc] }"],
        "context": "category_theory",
    },
    {
        "pattern": re.compile(r"by\s+contradiction", re.IGNORECASE),
        "primary": "by_contra",
        "fallbacks": ["exfalso"],
        "context": "general",
    },
    {
        "pattern": re.compile(r"by\s+definition", re.IGNORECASE),
        "primary": "rfl",
        "fallbacks": ["unfold", "simp only"],
        "context": "general",
    },
]

# ---------------------------------------------------------------------------
# Glossary-based import synthesis
# ---------------------------------------------------------------------------

# Map mathlib types to their import paths.
MATHLIB_IMPORTS = {
    "TopologicalSpace": "Mathlib.Topology.Basic",
    "SmoothManifold": "Mathlib.Geometry.Manifold.SmoothManifoldWithCorners",
    "SmoothManifoldWithCorners": "Mathlib.Geometry.Manifold.SmoothManifoldWithCorners",
    "CategoryTheory.Category": "Mathlib.CategoryTheory.Category.Basic",
    "CategoryTheory.Functor": "Mathlib.CategoryTheory.Functor.Basic",
    "CategoryTheory.NatTrans": "Mathlib.CategoryTheory.NatTrans",
    "CategoryTheory.MonoidalCategory": "Mathlib.CategoryTheory.Monoidal.Basic",
    "CategoryTheory.BraidedCategory": "Mathlib.CategoryTheory.Monoidal.Braided.Basic",
    "CategoryTheory.Abelian": "Mathlib.CategoryTheory.Abelian.Basic",
    "CategoryTheory.Limits.IsLimit": "Mathlib.CategoryTheory.Limits.IsLimit",
    "CategoryTheory.Adjunction": "Mathlib.CategoryTheory.Adjunction.Basic",
    "Group": "Mathlib.Algebra.Group.Basic",
    "Ring": "Mathlib.Algebra.Ring.Basic",
    "Module": "Mathlib.Algebra.Module.Basic",
    "FundamentalGroupoid": "Mathlib.Topology.AlgebraicTopology.FundamentalGroupoid",
    "ModuleCat": "Mathlib.Algebra.Category.ModuleCat",
    "Real": "Mathlib.Data.Real.Basic",
}


def synthesize_imports(glossary_entries, chapter_num):
    """Determine required Mathlib imports for a chapter from glossary entries."""
    imports = set()
    imports.add("import Mathlib.Data.Real.Basic")
    imports.add("import QOU.Glossary")

    for entry in glossary_entries:
        if entry.get("chapter") != chapter_num:
            continue
        mt = entry.get("mathlib_type", "")
        mi = entry.get("mathlib_import")
        if mi:
            imports.add(f"import {mi}")
        elif mt in MATHLIB_IMPORTS:
            imports.add(f"import {MATHLIB_IMPORTS[mt]}")

    return sorted(imports)


# ---------------------------------------------------------------------------
# Tactic suggestion
# ---------------------------------------------------------------------------


def suggest_tactic(proof_text):
    """Suggest a Lean tactic based on narrative proof text."""
    for mapping in TACTIC_MAPPINGS:
        m = mapping["pattern"].search(proof_text)
        if m:
            primary = mapping["primary"]
            # Substitute capture groups
            if m.lastindex:
                for gi in range(1, m.lastindex + 1):
                    primary = primary.replace(f"{{{gi - 1}}}", m.group(gi))
            return {
                "primary": primary,
                "fallbacks": mapping["fallbacks"],
                "context": mapping["context"],
            }
    return {"primary": "sorry", "fallbacks": [], "context": "unknown"}


# ---------------------------------------------------------------------------
# Theorem generation
# ---------------------------------------------------------------------------


def scan_theorems(filepath, chapter_num):
    """Scan a chapter for theorem-like environments and their proofs."""
    results = []

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
        title = m.group(2)
        if env_name not in LEAN_KEYWORDS:
            i += 1
            continue

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

        # Look for an immediately following \begin{proof}...\end{proof}
        proof_text = ""
        pk = j + 1
        while pk < min(j + 5, len(lines)):
            if re.search(r"\\begin\{proof\}", lines[pk]):
                # Collect proof text
                pl = pk + 1
                while pl < min(pk + MAX_ENV_SCAN_LINES, len(lines)):
                    if re.search(r"\\end\{proof\}", lines[pl]):
                        break
                    proof_text += lines[pl]
                    pl += 1
                break
            elif lines[pk].strip():
                break
            pk += 1

        if label:
            tactic = suggest_tactic(proof_text) if proof_text else None
            results.append({
                "env": env_name,
                "title": title.strip() if title else None,
                "label": label,
                "chapter": chapter_num,
                "body": " ".join(body_lines)[:500],
                "proof_text": proof_text[:500] if proof_text else None,
                "suggested_tactic": tactic,
            })

        i = j + 1 if j > i else i + 1

    return results


def generate_theorem_lean(theorems, chapter_num, glossary_entries):
    """Generate Lean theorem declarations for a chapter."""
    lean_file_rel = CHAPTER_LEAN_FILES.get(chapter_num)
    if not lean_file_rel:
        return None

    lean_file = LEAN_DIR / lean_file_rel
    namespace = lean_file_rel.replace(".lean", "").replace("/", ".")

    imports = synthesize_imports(glossary_entries, chapter_num)
    lines = []

    lines.append(f"/-!")
    lines.append(f"# {namespace} — Formalized Theorems")
    lines.append(f"")
    lines.append(f"Generated by: `python .github/scripts/formalizer.py generate-theorems`")
    lines.append(f"-/")
    lines.append(f"")

    for imp in imports:
        lines.append(imp)

    lines.append(f"")
    lines.append(f"open scoped Topology Manifold CategoryTheory")
    lines.append(f"")
    lines.append(f"namespace {namespace}")
    lines.append(f"")

    for thm in theorems:
        label = thm["label"]
        env = thm["env"]
        title = thm.get("title", label)
        body = thm.get("body", "")
        tactic_info = thm.get("suggested_tactic")
        lean_keyword = LEAN_KEYWORDS.get(env, "theorem")

        # Derive Lean name
        name = label.split(":", 1)[-1] if ":" in label else label
        name = name.replace("-", "_")
        name = re.sub(r"[^a-zA-Z0-9_]", "", name)

        # Docstring
        lines.append(f"/-- **{title}**")
        if body:
            lines.append(f"    {body[:200]}")
        lines.append(f"")
        lines.append(f"    LaTeX: `\\label{{{label}}}`")
        if tactic_info and tactic_info["primary"] != "sorry":
            lines.append(f"    Suggested tactic: `{tactic_info['primary']}`")
        lines.append(f"-/")

        # Declaration with sorry bridge
        lines.append(f"{lean_keyword} {name} : Sorry := by")
        if tactic_info and tactic_info["primary"] != "sorry":
            lines.append(f"  -- Narrative suggests: {tactic_info['primary']}")
            for fb in tactic_info.get("fallbacks", []):
                lines.append(f"  -- Fallback: {fb}")
        lines.append(f"  sorry")
        lines.append(f"")

    lines.append(f"end {namespace}")
    lines.append(f"")

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Proof state export
# ---------------------------------------------------------------------------


def export_proof_state(file_path, line_num):
    """Export a placeholder proof state at a given location.

    In a real implementation, this would invoke the Lean LSP server.
    For now, it generates a stub based on file analysis.
    """
    abs_path = Path(file_path)
    if not abs_path.is_absolute():
        abs_path = LEAN_DIR / file_path

    if not abs_path.exists():
        print(f"❌ File not found: {abs_path}")
        sys.exit(1)

    content = abs_path.read_text(encoding="utf-8")
    file_lines = content.splitlines()

    # Find the declaration at or near this line
    decl_name = None
    for li in range(max(0, line_num - 5), min(len(file_lines), line_num + 5)):
        m = re.search(r"(?:theorem|lemma|def)\s+(\w+)", file_lines[li])
        if m:
            decl_name = m.group(1)
            break

    state = {
        "declaration": decl_name or "unknown",
        "file": str(Path(file_path)),
        "line": line_num,
        "column": 0,
        "current_tactic": "sorry",
        "goals": [
            {
                "index": 0,
                "target": "Sorry",
                "hypotheses": [],
            }
        ],
        "is_complete": False,
        "exported_at": datetime.now(timezone.utc).isoformat(),
    }

    manifest = {"version": "1.0", "states": [state]}
    print(json.dumps(manifest, indent=2))
    return manifest


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main():
    parser = argparse.ArgumentParser(description="Lean 4 Formalizer: narrative to proof.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    p_imports = subparsers.add_parser("synthesize-imports", help="Show required imports per chapter.")
    p_imports.add_argument("--glossary", type=Path, default=DEFAULT_GLOSSARY)

    p_theorems = subparsers.add_parser("generate-theorems", help="Generate theorem stubs.")
    p_theorems.add_argument("--glossary", type=Path, default=DEFAULT_GLOSSARY)
    p_theorems.add_argument("--chapter", type=int, default=None, help="Specific chapter (default: all)")

    p_export = subparsers.add_parser("export-proof-state", help="Export proof state at a location.")
    p_export.add_argument("--file", type=str, required=True)
    p_export.add_argument("--line", type=int, required=True)

    p_all = subparsers.add_parser("all", help="Run full pipeline.")
    p_all.add_argument("--glossary", type=Path, default=DEFAULT_GLOSSARY)

    args = parser.parse_args()

    if args.command == "synthesize-imports":
        entries = _load_glossary(args.glossary)
        for ch in sorted(CHAPTER_LEAN_FILES.keys()):
            imports = synthesize_imports(entries, ch)
            print(f"\n-- Chapter {ch}:")
            for imp in imports:
                print(f"  {imp}")

    elif args.command == "generate-theorems":
        entries = _load_glossary(args.glossary)
        chapters = [args.chapter] if args.chapter else sorted(CHAPTER_LEAN_FILES.keys())
        total = 0
        for ch in chapters:
            filepath = CHAPTERS_DIR / CHAPTER_FILES[ch - 1]
            if not filepath.exists():
                continue
            theorems = scan_theorems(filepath, ch)
            if not theorems:
                print(f"  Chapter {ch}: no theorems found")
                continue
            lean_content = generate_theorem_lean(theorems, ch, entries)
            if lean_content:
                out_path = LEAN_DIR / CHAPTER_LEAN_FILES[ch]
                out_path.write_text(lean_content, encoding="utf-8")
                print(f"  Chapter {ch}: wrote {len(theorems)} theorems to {out_path.name}")
                total += len(theorems)
        print(f"\n✅ Generated {total} theorem stubs")

    elif args.command == "export-proof-state":
        export_proof_state(args.file, args.line)

    elif args.command == "all":
        entries = _load_glossary(args.glossary)
        # Synthesize imports (informational)
        for ch in sorted(CHAPTER_LEAN_FILES.keys()):
            imports = synthesize_imports(entries, ch)
            print(f"Chapter {ch}: {len(imports)} imports")
        # Generate theorems
        total = 0
        for ch in sorted(CHAPTER_LEAN_FILES.keys()):
            filepath = CHAPTERS_DIR / CHAPTER_FILES[ch - 1]
            if not filepath.exists():
                continue
            theorems = scan_theorems(filepath, ch)
            if not theorems:
                continue
            lean_content = generate_theorem_lean(theorems, ch, entries)
            if lean_content:
                out_path = LEAN_DIR / CHAPTER_LEAN_FILES[ch]
                out_path.write_text(lean_content, encoding="utf-8")
                total += len(theorems)
        print(f"\n✅ Generated {total} theorem stubs total")


def _load_glossary(path):
    """Load glossary from JSON."""
    if not path.exists():
        print(f"⚠️  Glossary not found: {path} — using empty glossary")
        return []
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    return data.get("entries", [])


if __name__ == "__main__":
    main()
