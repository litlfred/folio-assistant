#!/usr/bin/env python3
"""
extract-candidates — Stage B of the ingestion pipeline.

Reads a Stage-A artefact (`structure.json` + `sections/*.md` from
pdf-structure.py) and proposes what the document *offers*, writing
`candidates.json` next to it.

    uploads/<doc-id>/candidates.json     ingest-candidates/v1

**These are proposals, never content.** A theorem extracted from someone
else's paper is a claim attributed to a source, not a folio claim — it
reaches `content/` only when an agent or the author promotes it, per
`document-intake.md §Stage 4`. Nothing here writes to `content/`, and
nothing here creates Lean. See docs/proposals/rag-document-ingestion.md
§7-bis for why that boundary is load-bearing.

Two extractor classes share the machinery and differ only in what they
look for and which skill they route to:

    math   theorem/definition/lemma environments  → formalizer
    who-l1 boxed recommendations, GRADE tables    → l2-dak-authoring

Class is auto-detected from the Stage-A metadata unless forced with
`--class`. The `who-l1` extractor is structurally complete but has not
been run against a real WHO L1 guideline — there is none in the corpus —
so it reports `"validated": false` in its output and should be treated
as untested until one is available.

Usage:
    extract-candidates.py uploads/<doc-id>/ [...]
    extract-candidates.py --corpus uploads/ --class math
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from typing import Any

SCHEMA = "ingest-candidates/v1"

# ---------------------------------------------------------------- math

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

# ---------------------------------------------------------------- who-l1

RE_WHO_REC = re.compile(
    r"^\s*RECOMMENDATION\s*(?P<num>\d+[a-z]?(?:\.\d+)*)?\s*[.:—-]?\s*(?P<body>.*)$",
    re.M | re.I,
)
RE_WHO_GPS = re.compile(r"^\s*Good\s+practice\s+statement\s*[.:—-]?\s*(?P<body>.*)$", re.M | re.I)
RE_WHO_REMARK = re.compile(r"^\s*Remarks?\s*[.:—-]\s*(?P<body>.*)$", re.M | re.I)
RE_WHO_RESEARCH = re.compile(r"^\s*Research\s+(?:priority|priorities|gap)\w*\s*[.:—-]?\s*(?P<body>.*)$", re.M | re.I)
# A GRADE marker, not merely a word that appears in GRADE tables. The
# certainty levels must be *bound* to a certainty/evidence/quality noun:
# an earlier form alternated on bare `\bhigh|moderate|low`, so the phrase
# "high malaria burden" three paragraphs away flagged a recommendation as
# GRADE-adjacent. Caught by the extractor's own negative test.
RE_GRADE = re.compile(
    r"(?:⊕"
    r"|\bGRADE\b"
    r"|\b(?:certainty|quality)\s+of\s+(?:the\s+)?evidence\b"
    r"|\b(?:very\s+low|low|moderate|high)\s+(?:certainty|quality)\b"
    r"|\b(?:certainty|quality)\s*[:=]\s*(?:very\s+low|low|moderate|high)\b"
    r")",
    re.I,
)
RE_STRENGTH = re.compile(r"\b(strong|conditional|context[- ]specific)\b\s+recommendation", re.I)


def clean(s: str, limit: int = 600) -> str:
    s = re.sub(r"\s+", " ", s).strip()
    return s[:limit]


def read_sections(docdir: str) -> list[tuple[str, dict[str, str], str]]:
    """Return (filename, front-matter, body) per section .md."""
    sdir = os.path.join(docdir, "sections")
    if not os.path.isdir(sdir):
        return []
    out = []
    for fn in sorted(os.listdir(sdir)):
        if not fn.endswith(".md"):
            continue
        raw = open(os.path.join(sdir, fn), encoding="utf-8", errors="replace").read()
        fm: dict[str, str] = {}
        body = raw
        if raw.startswith("---\n"):
            end = raw.find("\n---\n", 4)
            if end != -1:
                for line in raw[4:end].splitlines():
                    if ":" in line:
                        k, v = line.split(":", 1)
                        fm[k.strip()] = v.strip().strip('"')
                body = raw[end + 5:]
        out.append((fn, fm, body))
    return out


def extract_math(sections, meta) -> list[dict[str, Any]]:
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


def extract_who_l1(sections, meta) -> list[dict[str, Any]]:
    cands: list[dict[str, Any]] = []
    rules = (
        (RE_WHO_REC, "definition", "recommendation", "def:who"),
        (RE_WHO_GPS, "proposition", "good-practice-statement", "prop:who"),
        (RE_WHO_REMARK, "remark", "remark", "rem:who"),
        (RE_WHO_RESEARCH, "conjecture", "research-priority", "conj:who"),
    )
    for fn, fm, body in sections:
        for rx, kind, source_kind, prefix in rules:
            for m in rx.finditer(body):
                stmt = clean(m.group("body"), 900)
                if len(stmt) < 20:
                    continue
                window = body[m.start(): m.start() + 1800]
                strength = RE_STRENGTH.search(window)
                cands.append({
                    "kind": kind,
                    "source_kind": source_kind,
                    "number": (m.groupdict().get("num") if "num" in m.groupdict() else None),
                    "name": None,
                    "statement": stmt,
                    "section_file": f"sections/{fn}",
                    "section_title": fm.get("section_title"),
                    "pages": fm.get("pages"),
                    "label_prefix": prefix,
                    "grade_nearby": bool(RE_GRADE.search(window)),
                    "strength": strength.group(1).lower() if strength else None,
                    "formalization_candidate": False,
                    "route_to": "l2-dak-authoring",
                })
    return cands


def detect_class(meta: dict[str, Any], sections) -> str:
    if meta.get("arxiv"):
        return "math"
    blob = " ".join((fm.get("section_title") or "") for _, fm, _ in sections[:40])
    blob += " " + (meta.get("title") or "")
    if re.search(r"\bWHO\b|World Health Organization|guideline|recommendation", blob, re.I):
        return "who-l1"
    return "math"


def process(docdir: str, forced: str | None) -> dict[str, Any] | None:
    spath = os.path.join(docdir, "structure.json")
    if not os.path.exists(spath):
        return None
    art = json.load(open(spath))
    meta = art.get("metadata", {})
    sections = read_sections(docdir)
    cls = forced or detect_class(meta, sections)

    if cls == "who-l1":
        cands = extract_who_l1(sections, meta)
    else:
        cands = extract_math(sections, meta)

    by_kind: dict[str, int] = {}
    for c in cands:
        by_kind[c["kind"]] = by_kind.get(c["kind"], 0) + 1

    return {
        "_schema": SCHEMA,
        "doc_id": art.get("doc_id"),
        "document_class": cls,
        "validated": cls != "who-l1",   # who-l1 path is untested — no L1 PDF in corpus
        "source": {
            "structure_sha256": art.get("source", {}).get("sha256"),
            "file": art.get("source", {}).get("file"),
        },
        "provenance": {
            "title": meta.get("title"),
            "authors": meta.get("authors_raw"),
            "arxiv": meta.get("arxiv"),
            "doi": meta.get("doi"),
        },
        "disposition": "proposals only — promote via document-intake Stage 4; "
                       "nothing here is folio content and nothing here creates Lean",
        "summary": {
            "candidates": len(cands),
            "by_kind": by_kind,
            "formalization_candidates": sum(1 for c in cands if c["formalization_candidate"]),
        },
        "candidates": cands,
    }


def main() -> int:
    ap = argparse.ArgumentParser(description="Stage B — propose content candidates from a Stage-A artefact")
    ap.add_argument("docdirs", nargs="*")
    ap.add_argument("--corpus", help="root containing <doc-id>/ directories")
    ap.add_argument("--class", dest="cls", choices=["math", "who-l1"], help="force document class")
    ap.add_argument("--json", action="store_true", help="print to stdout, write nothing")
    args = ap.parse_args()

    dirs = list(args.docdirs)
    if args.corpus:
        dirs += sorted(
            os.path.join(args.corpus, d) for d in os.listdir(args.corpus)
            if os.path.isdir(os.path.join(args.corpus, d))
            and os.path.exists(os.path.join(args.corpus, d, "structure.json"))
        )
    if not dirs:
        ap.error("no document directories given")

    tot = fml = docs = 0
    for d in dirs:
        res = process(d, args.cls)
        if res is None:
            continue
        docs += 1
        tot += res["summary"]["candidates"]
        fml += res["summary"]["formalization_candidates"]
        if args.json:
            print(json.dumps(res, indent=2))
        else:
            with open(os.path.join(d, "candidates.json"), "w") as fh:
                json.dump(res, fh, indent=1)
            s = res["summary"]
            if s["candidates"]:
                kinds = " ".join(f"{k}={v}" for k, v in sorted(s["by_kind"].items()))
                print(f"{res['doc_id']:<34} {s['candidates']:>4}  {kinds}")

    if not args.json:
        print(f"\n{docs} documents, {tot} candidates, "
              f"{fml} flagged as formalization candidates", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
