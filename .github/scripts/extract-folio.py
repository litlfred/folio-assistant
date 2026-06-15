#!/usr/bin/env python3
"""extract-folio.py — read content/folio.ts and emit paper metadata as JSON.

This is used by CI workflows to discover which papers exist in the folio,
so that document generation can loop over every paper.

Usage
-----
    python extract-folio.py [--folio-path content/folio.ts]

Output (stdout): JSON array of objects with keys:
    dir, title, description, tags

Example output:
    [
      {
        "dir": "quantum-observable-universe",
        "title": "Quantum Observable Universe",
        "description": "A framework for ...",
        "tags": ["quantum", "category-theory", "formalization"]
      }
    ]
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

# Match paperRef({ ... }) blocks in folio.ts.
# We parse the fields individually since the TS is simple enough.
_PAPER_REF_RE = re.compile(
    r"paperRef\(\s*\{(.*?)\}\s*\)", re.DOTALL
)

_FIELD_RE = re.compile(
    r"""(?:^|\n)\s*(\w+)\s*:\s*(?:"""
    r""""([^"]*?)"|'([^']*?)'"""  # simple string
    r"""|\[([^\]]*)\]"""           # simple array
    r"""|("(?:[^"\\]|\\.)*"))"""   # string with template concat — skip
    r""",?""",
    re.DOTALL,
)

_ARRAY_ITEM_RE = re.compile(r"""["']([^"']+)["']""")


def _parse_string_field(m: re.Match) -> str:
    """Extract a simple string from a field match."""
    return m.group(2) or m.group(3) or ""


def _parse_array_field(raw: str) -> list[str]:
    return _ARRAY_ITEM_RE.findall(raw)


def extract_papers(folio_path: Path) -> list[dict]:
    """Parse folio.ts and return paper metadata."""
    text = folio_path.read_text(encoding="utf-8")

    # Strip single-line comments so commented-out paperRef() calls are ignored.
    text = re.sub(r"//.*", "", text)

    # Also look for multi-line string concat:  "foo" + \n "bar"
    # Simplify by collapsing these into single strings first.
    text = re.sub(r'"\s*\+\s*\n\s*"', "", text)

    papers = []
    for block_match in _PAPER_REF_RE.finditer(text):
        block = block_match.group(1)
        paper: dict = {}

        for fm in _FIELD_RE.finditer(block):
            key = fm.group(1)
            if key in ("dir", "title", "description"):
                paper[key] = fm.group(2) or fm.group(3) or ""
            elif key == "tags" and fm.group(4) is not None:
                paper["tags"] = _parse_array_field(fm.group(4))

        if "dir" in paper:
            paper.setdefault("title", paper["dir"])
            paper.setdefault("description", "")
            paper.setdefault("tags", [])
            papers.append(paper)

    return papers


def main() -> None:
    ap = argparse.ArgumentParser(description="Extract paper list from folio.ts")
    ap.add_argument(
        "--folio-path",
        default="content/folio.ts",
        help="Path to folio.ts (default: content/folio.ts)",
    )
    args = ap.parse_args()

    folio_path = Path(args.folio_path)
    if not folio_path.exists():
        print(f"Error: {folio_path} not found", file=sys.stderr)
        sys.exit(1)

    papers = extract_papers(folio_path)
    print(json.dumps(papers, indent=2))


if __name__ == "__main__":
    main()
