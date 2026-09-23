#!/usr/bin/env python3
"""What makes a dataset FINDABLE — bean `p67i`.

A CSV or spreadsheet in `uploads/` is stored but not findable: a grep for a
column header finds nothing, and the absence is indistinguishable from the
dataset not having that column. This writes `library/<slug>/tabular.jsonld` —
sheet names, headers, and the shape of each sheet — so the header vocabulary
joins the L1 source graph and that grep succeeds.

## Stdlib only, deliberately

`zipfile` + `xml.etree` for xlsx, `csv` for CSV. No openpyxl, no pandas.

This repository declares no Python dependencies — there is no
`requirements.txt` and CI installs only `ruff` — so a tool that needed one
would pass on a developer's machine and fail in CI. Everything this bean asks
for mechanically is in `xl/workbook.xml` and each sheet's `<dimension>`, so no
dependency is needed to get it. Measured on a workbook openpyxl itself wrote,
read back with openpyxl uninstalled.

## The narrative is NOT written here

The bean also asks for "a narrative description of what the data is about".
That cannot be produced mechanically: it is somebody's account, and it needs an
author. `narrative: null` with `narrative_state: "not-authored"` is the honest
record — the slot exists, nothing fills it, and when something does it carries
an `Attribution` (bean `iqim`) naming the human or the agent and its model.

Fabricating a summary from the header names and stamping it as agent-written
would be a claim nobody made, which is the failure the whole provenance arm
exists to prevent.

  python3 scripts/tabular-records.py -o library uploads/FILE.csv
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import sys
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _pdf_doc_id import slugify as _slugify  # noqa: E402
from _content_context import CONTENT_CONTEXT_URL  # noqa: E402


def _load_tech_meta():
    import importlib.util as _u
    spec = _u.spec_from_file_location("_tech_meta", str(Path(__file__).with_name("_tech_meta.py")))
    mod = _u.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


_tm = _load_tech_meta()

XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
_NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
       "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships"}

# `A1:C3` -> the two corners. A sheet with one cell has ref `A1`, no colon.
_REF = re.compile(r"^([A-Z]+)(\d+)(?::([A-Z]+)(\d+))?$")


def _col_index(letters: str) -> int:
    """`A` -> 1, `Z` -> 26, `AA` -> 27. Base-26 with no zero digit."""
    n = 0
    for ch in letters:
        n = n * 26 + (ord(ch) - 64)
    return n


def _shape(ref: str | None) -> tuple[int | None, int | None]:
    """Rows and columns from a `<dimension ref>`, or (None, None).

    None is a third state and is kept as one: a sheet whose dimension is absent
    or unparseable has an UNKNOWN shape, and reporting 0×0 would say it is
    empty — a different fact, and one a reader would act on.
    """
    if not ref:
        return None, None
    m = _REF.match(ref.strip())
    if not m:
        return None, None
    c1, r1, c2, r2 = m.group(1), int(m.group(2)), m.group(3), m.group(4)
    if c2 is None:
        return 1, 1
    return int(r2) - r1 + 1, _col_index(c2) - _col_index(c1) + 1


def _shared_strings(z: zipfile.ZipFile) -> list[str]:
    try:
        root = ET.fromstring(z.read("xl/sharedStrings.xml"))
    except (KeyError, ET.ParseError):
        return []
    # Every text node under the item, joined: a cell whose run is split by
    # formatting has several `<t>`, and taking only the first truncates it.
    return ["".join(t.text or "" for t in si.iter(f"{{{_NS['m']}}}t")) for si in root]


def _header_row(z: zipfile.ZipFile, part: str, strings: list[str]) -> list[str]:
    """Row 1's cell values, in column order."""
    try:
        root = ET.fromstring(z.read(part))
    except (KeyError, ET.ParseError):
        return []
    for row in root.iter(f"{{{_NS['m']}}}row"):
        if row.get("r") not in (None, "1"):
            continue
        out: list[str] = []
        for c in row.iter(f"{{{_NS['m']}}}c"):
            v = c.find(f"{{{_NS['m']}}}v")
            text = v.text if v is not None else None
            if c.get("t") == "s" and text is not None:
                try:
                    text = strings[int(text)]
                except (ValueError, IndexError):
                    text = None
            if text is None:
                inline = c.find(f"{{{_NS['m']}}}is")
                if inline is not None:
                    text = "".join(t.text or "" for t in inline.iter(f"{{{_NS['m']}}}t"))
            out.append(text if text is not None else "")
        return out
    return []


def _resolve_target(target: str) -> str:
    """A relationship Target as a path inside the package.

    BOTH forms are legal and both occur in ONE file: openpyxl writes worksheets
    as `/xl/worksheets/sheet1.xml` — package-root-absolute, leading slash — and
    styles as `styles.xml`, relative to the part's own directory. Prefixing
    `xl/` unconditionally gave `xl/xl/worksheets/sheet1.xml`, so every read
    raised `KeyError`, every shape came back `undetermined` and every header
    list came back empty. The sheet NAMES were still right, which is what made
    the output look plausible.
    """
    if target.startswith("/"):
        return target.lstrip("/")
    return "xl/" + target


def _xlsx_sheets(path: Path) -> list[dict[str, Any]]:
    with zipfile.ZipFile(path) as z:
        strings = _shared_strings(z)
        wb = ET.fromstring(z.read("xl/workbook.xml"))
        # r:id -> part path, so a sheet is matched to its XML by the package's
        # own relationships rather than by guessing `sheet<N>.xml` from order.
        rels: dict[str, str] = {}
        try:
            for rel in ET.fromstring(z.read("xl/_rels/workbook.xml.rels")):
                rels[rel.get("Id", "")] = _resolve_target(rel.get("Target") or "")
        except (KeyError, ET.ParseError):
            pass
        out: list[dict[str, Any]] = []
        for i, sh in enumerate(wb.iter(f"{{{_NS['m']}}}sheet"), start=1):
            rid = sh.get(f"{{{_NS['r']}}}id") or ""
            part = rels.get(rid) or f"xl/worksheets/sheet{i}.xml"
            ref = None
            try:
                dim = ET.fromstring(z.read(part)).find(f"{{{_NS['m']}}}dimension")
                ref = dim.get("ref") if dim is not None else None
            except (KeyError, ET.ParseError):
                part = ""
            rows, cols = _shape(ref)
            out.append({
                "name": sh.get("name") or f"Sheet{i}",
                "headers": _header_row(z, part, strings) if part else [],
                "rows": rows,
                "columns": cols,
                # Says WHY a shape is null rather than leaving a reader to guess
                # between "empty sheet" and "nothing read it".
                "shape_source": "dimension" if ref else "undetermined",
            })
        return out


def _csv_sheet(path: Path) -> list[dict[str, Any]]:
    with path.open(newline="", encoding="utf-8", errors="replace") as fh:
        sample = fh.read(64 * 1024)
        fh.seek(0)
        try:
            dialect: Any = csv.Sniffer().sniff(sample, delimiters=",;\t|")
            delim = dialect.delimiter
        except csv.Error:
            # Refused, not guessed at a comma: a mis-split file reports headers
            # that are not its headers, which is worse than saying so.
            dialect, delim = csv.excel, None
        reader = csv.reader(fh, dialect)
        rows = 0
        headers: list[str] = []
        cols = 0
        for i, row in enumerate(reader):
            if i == 0:
                headers = [c.strip() for c in row]
            cols = max(cols, len(row))
            rows += 1
    return [{
        "name": path.stem,
        "headers": headers,
        "rows": rows,
        "columns": cols or None,
        "shape_source": "counted",
        "delimiter": delim,
        "delimiter_source": "sniffed" if delim else "undetermined",
    }]


def is_tabular_text(path: str, min_columns: int = 2, sample_rows: int = 20) -> str | None:
    """The delimiter, if this file's CONTENT parses as a consistent table.

    A CSV has no magic bytes — there is nothing in the leading bytes of
    `country,year,cases` that says CSV — so routing one cannot be a sniff and
    must not become an extension guess. This asks the only question that is
    actually about the content: do the first rows split into the SAME number of
    fields, more than one, on some delimiter?

    Returns None for prose, for a single-column file, and for anything ragged.
    A one-column "table" is indistinguishable from a list of lines, and
    claiming it as tabular would file a text file as a dataset.
    """
    try:
        with open(path, newline="", encoding="utf-8") as fh:
            rows = []
            for i, line in enumerate(fh):
                if i >= sample_rows:
                    break
                rows.append(line.rstrip("\n"))
    except (OSError, UnicodeDecodeError):
        # Not decodable as UTF-8 text, so not a CSV. A binary file is refused
        # here rather than mangled into replacement characters.
        return None
    rows = [r for r in rows if r.strip()]
    if len(rows) < 2:
        return None
    for delim in (",", "\t", ";", "|"):
        widths = {len(next(csv.reader([r], delimiter=delim))) for r in rows}
        if len(widths) == 1 and next(iter(widths)) >= min_columns:
            return delim
    return None


def records(path: Path) -> dict[str, Any]:
    """The tabular record for one file, format decided by CONTENT."""
    meta = _tm.tech_meta(str(path))
    mime = meta["mimetype_sniffed"]
    if mime == XLSX:
        fmt, sheets = "xlsx", _xlsx_sheets(path)
    elif mime is None or mime.startswith("text/"):
        # A CSV has no magic bytes, so it is honestly `unrecognised` — there is
        # nothing in the leading bytes of `country,year,cases` that says CSV,
        # and inventing a signature for it would be the extension guess wearing
        # a different hat. The parse either yields a table or it does not.
        fmt, sheets = "csv", _csv_sheet(path)
    else:
        raise ValueError(
            f"{path.name}: sniffed {mime} — not a CSV or spreadsheet, nothing written"
        )
    return {
        # The record is JSON-LD, and says so (bean `yh6u`): without this every
        # key below was dropped by a JSON-LD processor.
        "@context": CONTENT_CONTEXT_URL,
        "$schema": "folio-tabular-records/v1",
        "@id": f"library/{_slugify(path.stem)}/tabular",
        "source": meta,
        "format": fmt,
        "sheets": sheets,
        "n_sheets": len(sheets),
        # The header vocabulary of the whole file, deduplicated and sorted: the
        # field a `grep` for a column name actually lands in.
        "header_vocabulary": sorted({h for s in sheets for h in s["headers"] if h}),
        # The empty slot (bean `ju0u`). A narrative needs an author, and then
        # a HUMAN to accept it, so nothing here fills it: a machine-made
        # summary shipped as the answer is the claim nobody made. Drafting one
        # and saying so is a different act, and it is `state: "draft"`.
        "narrative": {"text": None, "state": "not-authored"},
    }


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("files", nargs="+", type=Path)
    ap.add_argument("-o", "--outdir", type=Path, default=Path("."))
    a = ap.parse_args()
    for f in a.files:
        try:
            doc = records(f)
        except (ValueError, OSError, zipfile.BadZipFile, ET.ParseError) as e:
            print(f"SKIP {f.name}: {e}", file=sys.stderr)
            return 1
        out = a.outdir / _slugify(f.stem)
        out.mkdir(parents=True, exist_ok=True)
        (out / "tabular.jsonld").write_text(json.dumps(doc, indent=2) + "\n", encoding="utf-8")
        cols = ", ".join(doc["header_vocabulary"][:4])
        print(f"ok  {out.name:28s} {doc['n_sheets']} sheet(s)  [{doc['format']}]  {cols}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
