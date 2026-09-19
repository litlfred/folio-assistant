#!/usr/bin/env python3
"""Ingest a PDF to library/ at PAGE granularity — one section per page.

WHY THIS EXISTS, and when to reach for it instead of `pdf-structure.py`.

`pdf-structure.py` is the right tool whenever a PDF carries an embedded
outline: the structure is then READ rather than guessed, and the sections it
writes are the document's own chapters. Measured on
`uploads/9789241548960_eng.pdf` (WHO handbook for guideline development, 2nd
ed): 258 outline entries, 250 sections, real titles, real page ranges.

Without an outline it INFERS, and an inferred TOC can be confidently wrong in a
way the output does not show. Two measured failures, 2026-09-19, both in
`bean 6xaz`:

  * `uploads/WPR-RDO-2020-003-eng.pdf` — 11 of 13 inferred sections were named
    after a DIFFERENT publication, because page 22 is a sample table the style
    guide reproduces as a design example.
  * `uploads/WHO_PUB_TPS_93.1.pdf` — the inferred entries took their page
    numbers from the CONTENTS pages, so 26 of 42 sections came out under 500
    characters while 37 923 characters landed in one section misnamed
    `18-usetul-reference-books`.

In both, the text was present and the structure was fiction. This script is the
third state made usable: it does not claim to know the chapters, so it emits the
one division that cannot be wrong — the page. `section_title: "Page N"` is a
determined answer, `pages: N-N` is exact, and a rule derived from the document
can cite a node that really contains it.

It is NOT a replacement for sectioning. A page tree is worse to read and worse
to cite than a chapter tree; it is better than a chapter tree that lies. Once
`6xaz` is fixed, re-ingest with `pdf-structure.py` and delete the page tree.

  python3 scripts/pdf-pages.py -o library uploads/FILE.pdf
  python3 scripts/pdf-pages.py -o library --from-ocr uploads/FILE.pdf
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path


def _load_slugify():
    """`slugify` from `pdf-structure.py`, loaded from the file rather than copied.

    Two spellings of one doc-id is bean `rlp5` — it is exactly why `pdf-ocr.py`
    wrote to `library/ocr/` while `pdf-structure.py` looked in
    `library/<doc-id>/ocr/`, and a third copy here would have made it worse.
    The first draft of this file DID reimplement it and produced
    `who-pub-tps-93-1` against `pdf-structure.py`'s `who-pub-tps-931` on the
    very first run, which is the whole argument in one line of output.

    The filename has a hyphen, so it is not importable as a module name; loaded
    by path instead.
    """
    import importlib.util

    src = Path(__file__).resolve().parent / "pdf-structure.py"
    spec = importlib.util.spec_from_file_location("_pdf_structure", src)
    if spec is None or spec.loader is None:  # pragma: no cover
        sys.exit(f"cannot load {src} — the doc-id spelling lives there")
    mod = importlib.util.module_from_spec(spec)
    # Registered BEFORE exec: `pdf-structure.py` defines dataclasses, and
    # `dataclasses` resolves a class's `__module__` through `sys.modules` while
    # the body runs. Without this the import dies on
    # `'NoneType' object has no attribute '__dict__'`.
    sys.modules[spec.name] = mod
    spec.loader.exec_module(mod)
    return mod.slugify


_slugify = _load_slugify()


def slug(text: str) -> str:
    """`pdf-structure.py`'s own `slugify`, so the two scripts cannot disagree."""
    return _slugify(text)


def page_texts(pdf: Path, from_ocr: bool, outroot: Path) -> tuple[list[str], str]:
    """Page text, and where it came from. Never silently empty — see pdf-extract.py."""
    if from_ocr:
        ocr_dir = outroot / slug(pdf.stem) / "ocr"
        files = sorted(ocr_dir.glob("page-*.txt"))
        if not files:
            sys.exit(
                f"{pdf.name}: --from-ocr but no cached OCR at {ocr_dir}. "
                f"Run scripts/pdf-ocr.py first."
            )
        return [f.read_text(encoding="utf-8", errors="replace") for f in files], "ocr"
    try:
        import pymupdf
    except ImportError:
        sys.exit("pymupdf is not installed: pip install pymupdf")
    doc = pymupdf.open(pdf)
    texts = [doc[i].get_text() for i in range(doc.page_count)]
    if sum(len(t.strip()) for t in texts) == 0:
        sys.exit(
            f"{pdf.name}: zero extractable characters on {doc.page_count} pages "
            f"— this is a scan. Run scripts/pdf-ocr.py, then pass --from-ocr."
        )
    return texts, "text-layer"


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("pdfs", nargs="*", type=Path)
    ap.add_argument("-o", "--outdir", type=Path, default=Path("."),
                    help="root that <doc-id>/ hangs off — the same meaning as pdf-structure.py -o")
    ap.add_argument("--from-ocr", action="store_true",
                    help="read the cached OCR written by pdf-ocr.py instead of the text layer")
    ap.add_argument("--title", default=None, help="document title for the front matter")
    ap.add_argument("--first-page-label", type=int, default=None, metavar="N",
                    help="printed page number of the FIRST page that carries one, so sections are "
                         "labelled as the source document numbers them (a scanned journal article "
                         "is cited by its journal pages, not by its PDF pages)")
    ap.add_argument("--label-starts-at", type=int, default=1, metavar="K",
                    help="PDF page where --first-page-label applies; earlier pages keep PDF numbering "
                         "(default 1). A JSTOR cover sheet is page 1, so the article's p. 177 is K=2.")
    a = ap.parse_args()
    if not a.pdfs:
        ap.error("no PDFs given")

    for pdf in a.pdfs:
        doc_id = slug(pdf.stem)
        texts, source = page_texts(pdf, a.from_ocr, a.outdir)
        sha = hashlib.sha256(pdf.read_bytes()).hexdigest()[:16]
        secdir = a.outdir / doc_id / "sections"
        secdir.mkdir(parents=True, exist_ok=True)
        written = 0
        ids: list[tuple[str, str, str]] = []
        for i, text in enumerate(texts, start=1):
            # The printed page number, where the caller gave one. A scholarly
            # source is cited by the page the READER sees, and for a scanned
            # journal article that is never the PDF page — "Link Groups" is
            # pp. 177-195 of Annals of Mathematics 59(2) behind a JSTOR cover
            # sheet, so its PDF page 2 is p. 177. A citation to "page 2" would
            # not resolve for anyone holding the journal.
            if a.first_page_label is not None and i >= a.label_starts_at:
                label = str(a.first_page_label + (i - a.label_starts_at))
                title = f"p. {label}"
                section_id = f"page-{label}"
            else:
                label = str(i)
                title = f"Page {i}"
                section_id = f"page-{i:03d}"
            body = text.strip()
            if not body:
                # A blank page is a determined blank, and is recorded as one
                # rather than skipped: a gap in the numbering would read as a
                # missing page, which is a different fact.
                body = "_(no text on this page)_"
            fm = "\n".join([
                "---",
                f"doc_id: {doc_id}",
                f'doc_title: "{a.title or pdf.stem}"',
                f"section_id: {section_id}",
                f'section_title: "{title}"',
                f"pages: {label}-{label}",
                f"pdf_page: {i}",
                f"source_pdf: {pdf.name}",
                f"source_sha256: {sha}",
                f"text_source: {source}",
                "granularity: page",
                "---",
            ])
            (secdir / f"{section_id}.md").write_text(f"{fm}\n{body}\n", encoding="utf-8")
            ids.append((section_id, title, label))
            written += 1
        manifest = a.outdir / doc_id / "structure.json"
        existing = json.loads(manifest.read_text()) if manifest.exists() else {}
        existing.update({
            "_schema": existing.get("_schema", "pdf-structure/v1"),
            "doc_id": doc_id,
            "toc_source": "none",
            "granularity": "page",
            "text_source": source,
            "sections": [
                {"section_id": sid, "title": t, "pages": [lbl, lbl]} for sid, t, lbl in ids
            ],
            "structure_note": (
                "Ingested at PAGE granularity by scripts/pdf-pages.py. This PDF carries no "
                "embedded outline and its inferred chapter structure was measurably wrong "
                "(bean 6xaz), so no chapter tree is claimed. A page is a determined division; "
                "an inferred chapter was not."
            ),
        })
        manifest.write_text(json.dumps(existing, indent=2) + "\n", encoding="utf-8")
        print(f"ok  {doc_id:34s} {written:3d} pages  [{source}]")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
