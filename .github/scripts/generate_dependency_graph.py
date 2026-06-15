"""
Generate Dependency Graph SVG from proof-objects.json

Produces a Graphviz DOT file and renders it to SVG showing the logical
dependency structure of all proof objects.

Usage:
    python .github/scripts/generate_dependency_graph.py \\
        [--manifest proof-objects.json] \\
        [--output dependency-graph.svg] \\
        [--pdf-base-url https://litlfred.github.io/qou/quantum-observable-universe.pdf]
"""

import argparse
import re
import subprocess
import sys
from pathlib import Path

from qou_lib.config import (
    CHAPTER_TITLES,
    DEFAULT_MANIFEST,
    DEFAULT_PDF_URL,
    REPO_ROOT,
    TYPE_PREFIX,
)

DEFAULT_OUTPUT = REPO_ROOT / "dependency-graph.svg"


def node_color(obj):
    """Determine node fill color based on formalization and review status."""
    reviews = obj.get("reviews", [])
    has_human = any(r.get("reviewer_type") == "human" for r in reviews)
    has_agentic = any(r.get("reviewer_type") == "agentic" for r in reviews)
    status = obj.get("formalization_status", "not_started")

    if has_human:
        return "#90EE90"  # light green
    if has_agentic:
        return "#FFD700"  # gold/orange
    if status in ("proved", "mathlib_ok"):
        return "#FFFACD"  # light yellow
    return "#FF6B6B"  # light red


def node_border_color(obj):
    """Border color based on formalization status."""
    status = obj.get("formalization_status", "not_started")
    if status == "mathlib_ok":
        return "#006400"
    if status == "proved":
        return "#228B22"
    if status == "has_sorry":
        return "#FF8C00"
    if status == "stated":
        return "#DAA520"
    return "#DC143C"


def sanitize_id(label):
    """Convert a LaTeX label to a valid Graphviz node ID."""
    return re.sub(r"[^a-zA-Z0-9_]", "_", label)


def node_display_label(obj):
    """Short display label for the node."""
    label = obj["label"]
    obj_type = obj.get("object_type", "")
    prefix = TYPE_PREFIX.get(obj_type, obj_type.capitalize())
    number = obj.get("latex", {}).get("number", "")
    if number:
        return f"{prefix} {number}"
    suffix = label.split(":", 1)[-1] if ":" in label else label
    if len(suffix) > 20:
        suffix = suffix[:17] + "..."
    return f"{prefix}\\n{suffix}"


def pdf_anchor_url(obj, pdf_base_url):
    """Generate a URL linking to the object in the PDF."""
    return f"{pdf_base_url}#{obj['label']}"


def generate_dot(manifest, pdf_base_url):
    """Generate a Graphviz DOT string from the manifest."""
    objects = manifest.get("objects", [])
    dependencies = manifest.get("dependencies", [])

    by_chapter = {}
    for obj in objects:
        chapter = obj.get("latex", {}).get("chapter", 0)
        by_chapter.setdefault(chapter, []).append(obj)

    obj_by_label = {obj["label"]: obj for obj in objects}

    lines = []
    lines.append("digraph ProofDependencies {")
    lines.append("  rankdir=TB;")
    lines.append("  newrank=true;")
    lines.append('  graph [fontname="Helvetica", fontsize=11, bgcolor="white",')
    lines.append("         pad=0.5, nodesep=0.4, ranksep=0.8];")
    lines.append('  node [fontname="Helvetica", fontsize=9, style="filled,rounded",')
    lines.append("        shape=box, penwidth=2.0, margin=\"0.1,0.05\"];")
    lines.append('  edge [penwidth=2.5, arrowsize=0.8];')
    lines.append("")

    # Legend
    lines.append("  subgraph cluster_legend {")
    lines.append('    label="Legend";')
    lines.append('    style=dashed; color="#888888"; fontsize=10;')
    lines.append('    legend_red   [label="No proof / Blocking" fillcolor="#FF6B6B" color="#DC143C"];')
    lines.append('    legend_orange [label="LLM Reviewed" fillcolor="#FFD700" color="#DAA520"];')
    lines.append('    legend_green [label="Human Reviewed" fillcolor="#90EE90" color="#228B22"];')
    lines.append('    legend_yellow [label="Proved (no review)" fillcolor="#FFFACD" color="#DAA520"];')
    lines.append("    legend_red -> legend_orange -> legend_green -> legend_yellow [style=invis];")
    lines.append("  }")
    lines.append("")

    for chapter_num in sorted(by_chapter.keys()):
        if chapter_num == 0:
            continue
        chapter_objects = by_chapter[chapter_num]
        chapter_objects.sort(key=lambda o: o.get("latex", {}).get("line", 0))

        title = CHAPTER_TITLES.get(chapter_num, f"Ch.{chapter_num}")
        lines.append(f"  subgraph cluster_ch{chapter_num} {{")
        lines.append(f'    label="{title}";')
        lines.append(f'    style=rounded; color="#CCCCCC"; bgcolor="#F8F8F8";')
        lines.append(f"    fontsize=10;")

        node_ids = []
        for obj in chapter_objects:
            nid = sanitize_id(obj["label"])
            node_ids.append(nid)
            fill = node_color(obj)
            border = node_border_color(obj)
            display = node_display_label(obj)
            url = pdf_anchor_url(obj, pdf_base_url)
            tooltip = obj.get("title", obj["label"])

            lines.append(
                f'    {nid} [label="{display}" fillcolor="{fill}" '
                f'color="{border}" URL="{url}" tooltip="{tooltip}" target="_blank"];'
            )

        if len(node_ids) > 1:
            lines.append(f"    {{ rank=same; {'; '.join(node_ids)}; }}")

        lines.append("  }")
        lines.append("")

    for dep in dependencies:
        from_label = dep.get("from", "")
        to_label = dep.get("to", "")
        relation = dep.get("relation", "uses")

        if from_label not in obj_by_label or to_label not in obj_by_label:
            continue

        from_id = sanitize_id(from_label)
        to_id = sanitize_id(to_label)

        if relation == "proves":
            edge_color = "#4169E1"
        else:
            edge_color = "#555555"

        lines.append(
            f'  {to_id} -> {from_id} [color="{edge_color}" style="solid"];'
        )

    lines.append("}")
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(
        description="Generate dependency graph SVG from proof-objects.json."
    )
    parser.add_argument(
        "--manifest", type=Path, default=DEFAULT_MANIFEST,
        help="Path to proof-objects.json",
    )
    parser.add_argument(
        "--output", type=Path, default=DEFAULT_OUTPUT,
        help="Output SVG file path",
    )
    parser.add_argument(
        "--pdf-base-url", type=str, default=DEFAULT_PDF_URL,
        help="Base URL for the published PDF (for anchor links)",
    )
    parser.add_argument(
        "--dot-only", action="store_true",
        help="Output DOT source instead of rendering SVG",
    )
    args = parser.parse_args()

    if not args.manifest.exists():
        print(f"❌ Manifest not found: {args.manifest}")
        print("Run extract_proof_objects.py first.")
        sys.exit(1)

    with open(args.manifest, encoding="utf-8") as f:
        import json
        manifest = json.load(f)

    dot_source = generate_dot(manifest, args.pdf_base_url)

    if args.dot_only:
        print(dot_source)
        return

    dot_path = args.output.with_suffix(".dot")
    dot_path.write_text(dot_source, encoding="utf-8")

    try:
        subprocess.run(
            ["dot", "-Tsvg", "-o", str(args.output), str(dot_path)],
            check=True,
            capture_output=True,
            text=True,
        )
        print(f"✅ Generated {args.output}")
    except FileNotFoundError:
        print("⚠️  Graphviz 'dot' not found — DOT file written but SVG not rendered.")
        print(f"   Install Graphviz and run: dot -Tsvg -o {args.output} {dot_path}")
    except subprocess.CalledProcessError as e:
        print(f"❌ Graphviz error: {e.stderr}")
        sys.exit(1)


if __name__ == "__main__":
    main()
