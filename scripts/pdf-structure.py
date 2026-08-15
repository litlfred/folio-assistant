#!/usr/bin/env python3
"""
pdf-structure — turn an opaque upload into greppable, structured text.

Reads a PDF and emits a domain-neutral structure artefact:

    uploads/<doc-id>/
      structure.json          pdf-structure/v1 — metadata + TOC + section index
      sections/NN-slug.md     one file per section, YAML front-matter + text

The `sections/` tree is the point. Agents in this project find things by
grepping (`AGENTS.md` §"Before declaring open ... corpus-grep checklist"),
and `uploads/` is the one part of the corpus that grep cannot see, because
it is 339 PDFs. Extracting sections to plain Markdown makes uploads a
first-class grep path, with the front-matter naming the document and page
so a hit is immediately citable.

This script is deliberately **domain-neutral**: no math logic, no WHO
logic. It produces structure. Class-specific extractors (formalization
candidates, L1 recommendation blocks) consume `structure.json` and are
separate — see docs/proposals/rag-document-ingestion.md §7.

Metadata is derived from the *text*, not from the PDF DocInfo dictionary:
measured over the qou corpus only 126 of 339 documents (37%) carry a
plausible `/Title`, while the arXiv stamp is reliably present in page-1
text for arXiv papers, both new-style (`arXiv:0706.2213v3 [math.GT]`) and
old-style (`arXiv:hep-th/0001202v2`). DocInfo is recorded as a
cross-check, never as the source of truth.

Table of contents comes from the PDF outline when there is one (194 of
339, 57%) and is otherwise inferred from heading patterns in the text.
Which route was used is recorded per entry, so a consumer can weight it.

Usage:
    pdf-structure.py <pdf> [<pdf>...] [-o OUTDIR] [--no-sections] [--json]
    pdf-structure.py --corpus uploads/ -o uploads/

Dependencies: pypdf (BSD-3-Clause). Install: pip install pypdf
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
import warnings
from dataclasses import dataclass, field, asdict
from typing import Any

warnings.filterwarnings("ignore")

try:
    from pypdf import PdfReader
except ImportError:  # pragma: no cover
    sys.exit("pdf-structure: needs pypdf — pip install pypdf")

SCHEMA = "pdf-structure/v1"

# ---------------------------------------------------------------- patterns

# arXiv stamp printed down the left margin of page 1 by arXiv itself.
# Two eras: 0706.2213v3 (2007-04 onward) and hep-th/0001202v2 (before).
RE_ARXIV_NEW = re.compile(
    r"ar\s*X\s*iv\s*[:.]?\s*(?P<id>\d{4}\.\d{4,5})\s*(?P<ver>v\d+)?"
    r"(?:\s*\[(?P<cls>[a-zA-Z\-]+(?:\.[A-Za-z\-]{2,})?)\])?",
    re.I,
)
RE_ARXIV_OLD = re.compile(
    r"ar\s*X\s*iv\s*[:.]?\s*(?P<id>[a-zA-Z\-]+(?:\.[A-Z]{2})?/\d{7})\s*(?P<ver>v\d+)?",
    re.I,
)
RE_DOI = re.compile(r"\b(10\.\d{4,9}/[-._;()/:A-Za-z0-9]+?)(?=[\s,;)\]]|$)")
RE_DATE = re.compile(
    r"\b(\d{1,2}\s+"
    r"(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})\b"
)

# A heading, for the 43% of documents with no PDF outline.
RE_NUMBERED = re.compile(r"^\s{0,6}(\d{1,2}(?:\.\d{1,2}){0,3})\.?\s+(\S.{1,86})$")
RE_ROMAN = re.compile(r"^\s{0,6}([IVXLC]{1,6})\.\s+([A-Z]\S.{1,86})$")
NAMED = (
    "abstract", "introduction", "preliminaries", "background", "notation",
    "conclusion", "conclusions", "discussion", "references", "bibliography",
    "acknowledgements", "acknowledgments", "appendix",
)
RE_NAMED = re.compile(
    r"^\s{0,6}((?:appendix\s+[a-z0-9]{1,3}[.:]?\s*)?(?:" + "|".join(NAMED) + r"))\s*$",
    re.I,
)
MONTHS = (
    "January|February|March|April|May|June|July|August|September|October|"
    "November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec"
)
# Lines that look like headings but are not.
RE_NOT_HEADING = re.compile(
    r"(?:"
    r"\.\s*$"            # ends in a full stop — a sentence
    r"|^\s*\(\d+\)"      # numbered equation
    r"|^\s*\[\d+\]"      # bibliography entry
    r"|\bet\s+al\b"
    r"|\d{4}\)\s*$"      # trailing citation year
    r"|\b(?:" + MONTHS + r")\b\s*\d{0,4}\s*$"   # a date line
    r"|\b(?:19|20)\d{2}\b"                       # any year — dates, citations
    r"|^\s*\S+\s*\(\d+\)\s*$"                    # "1 (9)" equation reference
    r")",
    re.I,
)
# An author line: "A. Smith, B. Jones and C. Lee" / "SMITH, JONES, AND LEE".
# Periods must be allowed — initials are near-universal — so a sentence is
# excluded by looking for ". " followed by a lower-case word instead.
RE_AUTHORS = re.compile(r"^[A-ZÀ-ʯ](?![^\n]*[.!?]\s+[a-z])[^!?]{2,120}$")
RE_AUTHOR_HINT = re.compile(r"(,\s|\band\b|\&)", re.I)
# Report numbers / preprint stamps that precede the title.
RE_REPORT_NO = re.compile(
    r"^\s*(?:[A-Z]{2,}[-–—/]{1,2}[\w\-–/.]*\d|[a-z\-]+(?:\.[A-Z]{2})?/\d{7}"
    r"|preprint\b|submitted\b|\d{1,2}\s+(?:" + MONTHS + r")\s+\d{4}"
    # Journal front matter, in the order a published paper prints it:
    # a publisher mark ("msp"), the masthead ("ALGEBRA AND NUMBER THEORY
    # 14:7 (2020)"), then the DOI. Without these three a split journal
    # paper takes the publisher mark as its title — all ten papers of a
    # bound issue came out titled "msp".
    r"|\S{1,4}\s*$"
    r"|[A-Za-z][A-Za-z\s&.\-]{5,}\s+\d+\s*[:(]\s*\d"
    r"|https?://|doi\s*:|\bdoi\.org\b)",
    re.I,
)


# ---------------------------------------------------------------- structures

@dataclass
class TocEntry:
    level: int
    title: str
    page: int | None
    source: str            # "outline" | "inferred"
    number: str | None = None


@dataclass
class Section:
    id: str
    number: str | None
    title: str
    level: int
    page_start: int | None
    page_end: int | None
    n_chars: int
    n_words: int
    text: str = field(repr=False, default="")


def sha256_of(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def slugify(s: str, maxlen: int = 48) -> str:
    s = re.sub(r"[^\w\s-]", "", s.lower()).strip()
    s = re.sub(r"[\s_]+", "-", s)
    return (s[:maxlen].rstrip("-")) or "section"


# ---------------------------------------------------------------- extraction

def page_texts(reader: PdfReader) -> list[str]:
    out = []
    for p in reader.pages:
        try:
            out.append(p.extract_text() or "")
        except Exception:
            out.append("")
    return out


def read_outline(reader: PdfReader) -> list[TocEntry]:
    """PDF bookmarks, flattened with nesting depth preserved."""
    try:
        raw = reader.outline
    except Exception:
        return []
    if not raw:
        return []

    entries: list[TocEntry] = []

    def page_of(item: Any) -> int | None:
        try:
            return reader.get_destination_page_number(item) + 1
        except Exception:
            return None

    def walk(node: Any, level: int) -> None:
        for item in node:
            if isinstance(item, list):
                walk(item, level + 1)
                continue
            try:
                title = str(item.get("/Title", "")).strip()
            except Exception:
                continue
            if not title:
                continue
            num = None
            m = re.match(r"^\s*(\d+(?:\.\d+)*)\.?\s+(.*)$", title)
            if m:
                num, title = m.group(1), m.group(2).strip()
            entries.append(TocEntry(level, title, page_of(item), "outline", num))

    walk(raw, 1)
    return entries


def infer_headings(pages: list[str]) -> list[TocEntry]:
    """Heading detection for documents with no outline (43% of the corpus)."""
    entries: list[TocEntry] = []
    seen: set[str] = set()

    for pageno, text in enumerate(pages, start=1):
        for line in text.splitlines():
            line = line.rstrip()
            if not (3 <= len(line.strip()) <= 92) or RE_NOT_HEADING.search(line):
                continue

            num, title, level = None, None, 1

            m = RE_NUMBERED.match(line)
            if m and not re.match(r"^\d{4}$", m.group(1)):
                num, title = m.group(1), m.group(2).strip()
                level = num.count(".") + 1
                # Section numbers are small; "28 January 2000" is not §28.
                if int(num.split(".")[0]) > 30:
                    continue
                # A real heading starts with a capital and is not mostly digits.
                if not re.match(r"^[A-Z(]", title) or sum(c.isdigit() for c in title) > len(title) / 3:
                    continue
            if title is None:
                m = RE_ROMAN.match(line)
                if m:
                    num, title, level = m.group(1), m.group(2).strip(), 1
            if title is None:
                m = RE_NAMED.match(line)
                if m:
                    title, level = m.group(1).strip().title(), 1
            if title is None:
                continue

            title = re.sub(r"\s{2,}", " ", title).strip(" .")
            key = f"{num or ''}|{title.lower()}"
            if key in seen:
                continue
            seen.add(key)
            entries.append(TocEntry(level, title, pageno, "inferred", num))

    return entries


def parse_front_matter(pages: list[str]) -> dict[str, Any]:
    """Title, authors, abstract, arXiv id, DOI — from page-1 text."""
    p1 = pages[0] if pages else ""
    head = "\n".join(("\n".join(pages[:2])).splitlines()[:120])
    meta: dict[str, Any] = {}

    arxiv = None
    for rx in (RE_ARXIV_NEW, RE_ARXIV_OLD):
        m = rx.search(p1)
        if m:
            arxiv = {
                "id": m.group("id"),
                "version": (m.groupdict().get("ver") or "").lstrip("v") or None,
                "primary_class": m.groupdict().get("cls"),
            }
            d = RE_DATE.search(p1[m.end(): m.end() + 90])
            arxiv["stamp_date"] = d.group(1) if d else None
            break
    meta["arxiv"] = arxiv

    m = RE_DOI.search(head)
    meta["doi"] = m.group(1).rstrip(".") if m else None

    # Title and authors sit between the arXiv stamp / report numbers and the
    # abstract. Walk down, skipping stamp lines, collecting title lines until
    # something that reads like an author list or the abstract marker.
    lines = [l.strip() for l in p1.splitlines()]
    start = 0
    for i, l in enumerate(lines[:16]):
        if re.search(r"ar\s*X\s*iv", l, re.I) or RE_REPORT_NO.match(l):
            start = i + 1

    title_lines: list[str] = []
    author_lines: list[str] = []
    for l in lines[start:start + 20]:
        if re.match(r"^abstract\b", l, re.I):
            break
        if not l or len(l) < 3 or re.match(r"^\d+$", l) or RE_REPORT_NO.match(l):
            if title_lines and not l:
                # blank line after a title usually precedes the authors
                continue
            continue
        # An author line: capitalised, comma/and-separated, no trailing colon,
        # and we already have some title text.
        if title_lines and RE_AUTHORS.match(l) and RE_AUTHOR_HINT.search(l) \
                and not l.endswith(":") and len(l) < 120:
            author_lines.append(l)
            break
        title_lines.append(l)
        if len(" ".join(title_lines)) > 180:
            break

    title = re.sub(r"\s{2,}", " ", " ".join(title_lines)).strip(" .,")
    meta["title"] = title or None
    authors = re.sub(r"\s{2,}", " ", " ".join(author_lines)).strip(" .,")
    meta["authors_raw"] = authors or None

    # Abstract: everything after the marker, cut at the first section heading.
    meta["abstract"] = None
    m = re.search(r"\babstract\b\s*[.:—–-]?\s*", p1, re.I)
    if m:
        tail = p1[m.end(): m.end() + 2600]
        cut = re.search(
            r"\n\s*(?:1\s*\.?\s+Introduction\b|Introduction\b|Contents\b"
            r"|Keywords?\b|Key words\b|MSC\b|AMS\b|\d{4}\s+Mathematics)",
            tail, re.I,
        )
        if cut:
            tail = tail[: cut.start()]
        tail = re.sub(r"\s+", " ", tail).strip()
        if len(tail) >= 40:
            meta["abstract"] = tail[:2000]
    return meta


def split_sections(pages: list[str], toc: list[TocEntry]) -> list[Section]:
    """Slice the document text at heading boundaries."""
    marks: list[tuple[int, int, TocEntry]] = []  # (page_idx, line_idx, entry)
    used: set[int] = set()

    for e in toc:
        needle = e.title.lower()[:44]
        if not needle:
            continue
        lo = max(0, (e.page or 1) - 2)
        hi = min(len(pages), (e.page or 1) + 2)
        found = None
        for pi in range(lo, hi):
            for li, line in enumerate(pages[pi].splitlines()):
                cand = re.sub(r"\s+", " ", line).strip().lower()
                if needle in cand and len(cand) < 120:
                    found = (pi, li)
                    break
            if found:
                break
        if found and found not in used:
            used.add(found)  # type: ignore[arg-type]
            marks.append((found[0], found[1], e))

    marks.sort(key=lambda t: (t[0], t[1]))
    if not marks:
        whole = "\n".join(pages).strip()
        return [Section("sec-000-document", None, "Document", 1, 1, len(pages),
                        len(whole), len(whole.split()), whole)]

    page_lines = [p.splitlines() for p in pages]
    sections: list[Section] = []
    for i, (pi, li, e) in enumerate(marks):
        if i + 1 < len(marks):
            epi, eli, _ = marks[i + 1]
        else:
            epi, eli = len(pages) - 1, len(page_lines[-1])

        buf: list[str] = []
        for p in range(pi, min(epi + 1, len(pages))):
            src = page_lines[p]
            s = li + 1 if p == pi else 0
            t = eli if p == epi else len(src)
            buf.extend(src[s:t])
        body = re.sub(r"\n{3,}", "\n\n", "\n".join(buf)).strip()

        num = e.number
        sid = f"sec-{i:03d}-" + slugify(f"{num + ' ' if num else ''}{e.title}")
        sections.append(Section(sid, num, e.title, e.level, pi + 1, epi + 1,
                                len(body), len(body.split()), body))
    return sections


# ---------------------------------------------------------------- doc id

def derive_doc_id(path: str, meta: dict[str, Any]) -> str:
    ax = meta.get("arxiv")
    if ax and ax.get("id"):
        base = "arxiv-" + ax["id"].replace("/", "-")
        return base + (f"v{ax['version']}" if ax.get("version") else "")
    return slugify(os.path.splitext(os.path.basename(path))[0], 60)


def process(path: str) -> tuple[dict[str, Any], list[Section]]:
    reader = PdfReader(path)
    pages = page_texts(reader)

    outline = read_outline(reader)
    toc = outline or infer_headings(pages)
    meta = parse_front_matter(pages)
    sections = split_sections(pages, toc)

    try:
        info = reader.metadata or {}
        docinfo = {k.lstrip("/"): str(v) for k, v in info.items()
                   if k in ("/Title", "/Author", "/Producer", "/Creator", "/CreationDate")}
    except Exception:
        docinfo = {}

    empty = sum(1 for p in pages if len(p.strip()) < 20)
    doc_id = derive_doc_id(path, meta)

    artefact: dict[str, Any] = {
        "_schema": SCHEMA,
        "doc_id": doc_id,
        "source": {
            "file": os.path.basename(path),
            "sha256": sha256_of(path),
            "bytes": os.path.getsize(path),
            "pages": len(pages),
        },
        "metadata": meta | {"docinfo": docinfo},
        "toc": [asdict(e) for e in toc],
        "toc_source": "outline" if outline else ("inferred" if toc else "none"),
        "sections": [
            {k: v for k, v in asdict(s).items() if k != "text"} for s in sections
        ],
        "diagnostics": {
            "pages_without_text": empty,
            "likely_scanned": empty > len(pages) * 0.5,
            "toc_entries": len(toc),
            "sections": len(sections),
            "chars_total": sum(s.n_chars for s in sections),
        },
    }
    return artefact, sections


def write_sections(outdir: str, artefact: dict[str, Any], sections: list[Section]) -> None:
    sdir = os.path.join(outdir, "sections")
    os.makedirs(sdir, exist_ok=True)
    for old in os.listdir(sdir):
        if old.endswith(".md"):
            os.remove(os.path.join(sdir, old))

    doc_id = artefact["doc_id"]
    title = (artefact["metadata"].get("title") or "").replace('"', "'")
    for s in sections:
        fm = [
            "---",
            f"doc_id: {doc_id}",
            f'doc_title: "{title[:180]}"',
            f"section_id: {s.id}",
            f'section_title: "{s.title.replace(chr(34), chr(39))[:180]}"',
            f"section_number: {s.number or 'null'}",
            f"pages: {s.page_start}-{s.page_end}",
            f"source_pdf: {artefact['source']['file']}",
            f"source_sha256: {artefact['source']['sha256'][:16]}",
            "---",
            "",
        ]
        with open(os.path.join(sdir, f"{s.id}.md"), "w") as fh:
            fh.write("\n".join(fm) + s.text + "\n")


def main() -> int:
    ap = argparse.ArgumentParser(description="PDF → metadata + TOC + greppable sections")
    ap.add_argument("pdfs", nargs="*")
    ap.add_argument("--corpus", help="directory of PDFs to process")
    ap.add_argument("-o", "--outdir", default=None,
                    help="root for <doc-id>/ output dirs (default: alongside the PDF)")
    ap.add_argument("--no-sections", action="store_true", help="structure.json only")
    ap.add_argument("--json", action="store_true", help="print artefact to stdout, write nothing")
    args = ap.parse_args()

    targets = list(args.pdfs)
    if args.corpus:
        targets += sorted(
            os.path.join(args.corpus, f)
            for f in os.listdir(args.corpus) if f.lower().endswith(".pdf")
        )
    if not targets:
        ap.error("no PDFs given")

    ok = failed = 0
    for path in targets:
        try:
            artefact, sections = process(path)
        except Exception as exc:
            failed += 1
            print(f"FAIL  {os.path.basename(path)}: {type(exc).__name__}: {exc}",
                  file=sys.stderr)
            continue

        if args.json:
            print(json.dumps(artefact, indent=2))
        else:
            root = args.outdir or os.path.dirname(os.path.abspath(path))
            outdir = os.path.join(root, artefact["doc_id"])
            os.makedirs(outdir, exist_ok=True)
            with open(os.path.join(outdir, "structure.json"), "w") as fh:
                json.dump(artefact, fh, indent=1)
            if not args.no_sections:
                write_sections(outdir, artefact, sections)
            d = artefact["diagnostics"]
            flag = " SCANNED?" if d["likely_scanned"] else ""
            print(f"ok  {artefact['doc_id']:<34} "
                  f"{artefact['source']['pages']:>4}pp  "
                  f"toc={d['toc_entries']:<3}({artefact['toc_source'][:3]})  "
                  f"sec={d['sections']:<3}  {d['chars_total']//1000:>4}kc{flag}")
        ok += 1

    if not args.json:
        print(f"\n{ok} ok, {failed} failed", file=sys.stderr)
    return 1 if failed and not ok else 0


if __name__ == "__main__":
    sys.exit(main())
