#!/usr/bin/env python3
"""A library entry that RECORDS a source and holds none of its text. Bean `scfh`, issue #1614.

The OMG BPMN 2.0.2 and DMN 1.5 specifications grant use on the condition that a
copy "will not be copied or posted on any network computer or broadcast in any
media". Ingesting one the normal way commits every section's full text to a
public repository, which is that condition broken. The owner chose (2026-09-30)
to record rather than copy.

This writes `referenced.json` — a plain JSON sidecar, like `images.json`, so
its keys are not read as JSON-LD terms — into `<out>/<slug>/`; `gen-library-jsonld.ts`
writes its manifest. It holds:

- **what the document is** — title, version, document number and date, read
  off its first page by the caller and passed in, never guessed from the name.
  A field the document does not print is an explicit `null`, recorded in
  `not_stated`; a paper adds `authors`, `venue`, `doi` or `arxiv` when it
  prints them;
- **which bytes were looked at** — `source{}`, the same `_tech_meta` block every
  rung writes, so the full sha256 identifies the exact PDF;
- **its outline** — heading titles and page numbers from the PDF's embedded
  outline, so a citation can name a clause and a page without the text;
- **a `folio-materialization/v1` record in state `referenced`** — "the node
  exists, we know where, we hold no bytes" — in the vocabulary
  `folio-assistant-core/schemas/materialization.ts` already defines;
- **why the text is withheld**, quoting the licence clause.

No `sections/`, no `blocks/`, no images. `check:l1-complete` knows the
`referenced` kind and does not ask it for them. It also refuses one that DOES
carry section text, because that would be the copy this kind exists not to make.

  bun run ingest FILE.pdf --reference IDENTITY.json --library .
  python3 scripts/referenced-source.py -o library FILE.pdf --identity IDENTITY.json
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _pdf_doc_id import slugify as _slugify  # noqa: E402


def _load_tech_meta():
    import importlib.util as _u
    spec = _u.spec_from_file_location("_tech_meta", str(Path(__file__).with_name("_tech_meta.py")))
    mod = _u.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


_tm = _load_tech_meta()
SCHEMA = "folio-referenced-source/v1"


def outline(path: Path) -> list[dict]:
    """The PDF's EMBEDDED outline, or []. Never an inferred one (bean `6xaz`)."""
    try:
        import pymupdf
    except ImportError as e:
        # Refused, not recorded as `none`: "this PDF has no outline" and "nothing
        # could read it" are different facts, and only the first is a finding.
        raise ValueError("pymupdf is not installed — cannot read the outline") from e
    with pymupdf.open(str(path)) as d:
        return [{"level": lvl, "title": t.strip(), "page": p if p > 0 else None} for lvl, t, p in d.get_toc()]


REQUIRED = ("title", "url", "withheld")
# A document may not print these — a paper states no document number, a
# preprint may state no publisher. Each must still be ANSWERED: a value, or an
# explicit JSON null meaning "the document does not state it". A key that is
# absent is refused, because nobody read the document for it.
STATABLE = ("version", "document_number", "date", "publisher")
# Read off the document when it prints them; passed through when given.
OPTIONAL = ("authors", "venue", "doi", "arxiv")


def identity_of(ident: dict) -> dict:
    missing = [k for k in REQUIRED if not ident.get(k)]
    missing += [k for k in STATABLE if k not in ident or ident[k] == ""]
    if missing:
        raise ValueError(
            f"identity file lacks {', '.join(missing)} — read them off the document, never guess "
            "(a field the document does not state is an explicit null)"
        )
    out = {k: ident[k] for k in ("title", *STATABLE)}
    out.update({k: ident[k] for k in OPTIONAL if ident.get(k)})
    not_stated = [k for k in STATABLE if ident[k] is None]
    if not_stated:
        out["not_stated"] = not_stated
    return out


def record(path: Path, ident: dict) -> dict:
    identity = identity_of(ident)
    meta = _tm.tech_meta(str(path))
    toc = outline(path)
    return {
        "$schema": SCHEMA,
        "identity": identity,
        "source": meta,
        "outline": toc,
        "outline_source": "embedded" if toc else "none",
        "materialization": {
            "$schema": "folio-materialization/v1",
            "state": "referenced",
            "provenance": {"upstream": {"url": ident["url"]}},
            "note": "Text withheld by licence; the bytes identified by `source.sha256` were read once to take this record.",
        },
        "withheld": {"what": "all text, figures and tables", "why": ident["withheld"]},
    }


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("file", type=Path)
    ap.add_argument("-o", "--outdir", type=Path, required=True)
    ap.add_argument("--identity", type=Path, required=True,
                    help="JSON: title, url, withheld; version, document_number, date, publisher (each a value or null); "
                         "optionally authors, venue, doi, arxiv")
    a = ap.parse_args()
    try:
        doc = record(a.file, json.loads(a.identity.read_text(encoding="utf-8")))
    except (ValueError, OSError) as e:
        print(f"SKIP {a.file.name}: {e}", file=sys.stderr)
        return 1
    out = a.outdir / _slugify(a.file.stem)
    out.mkdir(parents=True, exist_ok=True)
    (out / "referenced.json").write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    # No manifest here: `gen-library-jsonld.ts --entry` writes it, as it does
    # for every rung, so there is one manifest writer (bean `scfh`).
    print(f"ok  {out.name}  referenced, {len(doc['outline'])} outline entries, no text held")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
