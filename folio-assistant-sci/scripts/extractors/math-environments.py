#!/usr/bin/env python3
"""
The `math` class of Stage-B ingestion: theorem, definition and lemma
environments in a mathematics paper, proposed as content candidates and
routed to the formalizer.

This is a plugin, not a command. cat-harness-tools'
`scripts/extract-candidates.py` holds the machinery every class shares
(reading the Stage-A sections, choosing a class, counting, writing
`candidates.json`) and loads every mounted layer's `scripts/extractors/*.py`
by its `CLASS`. It moved here from that file (bean saqd, row 6) because what
a mathematics paper offers, and that a result is worth formalizing, is this
layer's knowledge.

The same boundary holds as before: these are proposals, never content, and
nothing here creates Lean. An imported result reaches `content/` only when
an agent or the author promotes it (`document-intake.md §Stage 4`).
"""

from __future__ import annotations

import re
from typing import Any

CLASS = "math"
# A paper with an arXiv id is claimed before any other class is asked.
PRIORITY = 10
# A document no extractor claims is read as a paper, as before the split.
FALLBACK = True
VALIDATED = True

# "Theorem 3.1 (Name). Statement..." at the head of a paragraph.
RE_MATH_ENV = re.compile(
    r"^\s*(?P<kind>Theorem|Proposition|Lemma|Corollary|Definition|Conjecture"
    r"|Claim|Remark|Example)\s*"
    r"(?P<num>\d+(?:\.\d+)*)?\s*"
    r"(?:\((?P<name>[^)]{2,80})\))?\s*[.:—-]?\s*"
    r"(?P<body>\S.*)$",
    re.M,
)
# Block kinds the folio actually has (schemas/types.ts).
KIND_MAP = {
    "theorem": "theorem", "proposition": "proposition", "lemma": "lemma",
    "corollary": "corollary", "definition": "definition",
    "conjecture": "conjecture", "claim": "proposition",
    "remark": "remark", "example": "example",
}
# A result the folio would plausibly want to *use* rather than merely cite.
FORMALIZABLE = {"theorem", "proposition", "lemma", "corollary", "definition"}


def clean(s: str, limit: int = 600) -> str:
    s = re.sub(r"\s+", " ", s).strip()
    return s[:limit]


def detect(meta: dict[str, Any], sections) -> bool:
    return bool(meta.get("arxiv"))


def extract(sections, meta) -> list[dict[str, Any]]:
    cands: list[dict[str, Any]] = []
    for fn, fm, body in sections:
        # References sections are citations, not claims.
        if re.search(r"reference|bibliograph", fm.get("section_title", ""), re.I):
            continue
        for m in RE_MATH_ENV.finditer(body):
            kind_raw = m.group("kind").lower()
            kind = KIND_MAP.get(kind_raw)
            if not kind:
                continue
            stmt = clean(m.group("body"))
            if len(stmt) < 25:          # a bare cross-reference, not a statement
                continue
            if re.match(r"^\d+(\.\d+)*\s*$", stmt):
                continue
            cands.append({
                "kind": kind,
                "source_kind": kind_raw,
                "number": m.group("num"),
                "name": m.group("name"),
                "statement": stmt,
                "section_file": f"sections/{fn}",
                "section_title": fm.get("section_title"),
                "pages": fm.get("pages"),
                "formalization_candidate": kind in FORMALIZABLE,
                "formalization_note": (
                    "Imported result — attribute to the source. If the folio uses it, "
                    "state it in Lean with `sorry` + `-- Ref:` to this document, or "
                    "prove it. Ingestion creates no Lean."
                ) if kind in FORMALIZABLE else None,
                "route_to": "formalizer" if kind in FORMALIZABLE else None,
            })
    return cands
