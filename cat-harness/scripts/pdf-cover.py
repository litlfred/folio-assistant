#!/usr/bin/env python3
"""Render a PDF page to a PNG — the thumbnail a repository listing shows.

Generic on purpose: a page raster is a PDF fact, not a WHO one, and it sits
beside `pdf-images.py`, `pdf-pages.py` and `pdf-structure.py` rather than in an
instance. The instance decides WHICH documents get a cover and where the file
lands; this decides nothing.

It renders the FIRST PAGE and calls it the cover. That is a choice worth
stating, because it is the same choice `pdf-pages.py` makes about sections and
for the same reason: page 1 is a determined answer, and "the cover" is not.
Measured on the three WHO IRIS items, page 1 is the cover in all three and it
looks different in each — a portrait designed cover (2:3), a landscape designed
cover (0.705:1) and a scanned title page. A heuristic that tried to find "the
cover" would have had to be right about all three to beat taking page 1, and
would have had no way to say when it was unsure.

WHAT THIS PRODUCES IS DERIVED, AND IT IS NOT THE PUBLISHER'S THUMBNAIL. A
repository like DSpace generates its own THUMBNAIL bundle; this renders our
own from bytes we hold. A catalogue recording one of these as if it came from
upstream would assert something false about what it holds, so the caller is
expected to record the derivation. `--json` exists to make that cheap: it
prints the source, the page, the geometry and the digest, which is everything a
provenance record needs and nothing it has to guess.

Deterministic: MuPDF's rasteriser and PNG writer produce identical bytes from
identical input, verified across repeated renders (1.28.2), which is what lets
a caller run this under `--check` and compare bytes rather than re-deciding.

    python3 cat-harness/scripts/pdf-cover.py uploads/FILE.pdf -o cover.png
    python3 cat-harness/scripts/pdf-cover.py uploads/FILE.pdf -o cover.png --width 300 --json
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path


def render(pdf: Path, page: int, width: int) -> tuple[bytes, dict]:
    """PNG bytes for one page, plus the facts a provenance record needs.

    Raises rather than returning a placeholder. A missing backend and a
    zero-page PDF are different findings and neither is "here is a blank
    image": an image that renders is indistinguishable from one that worked,
    and a caller that got a blank would commit it.
    """
    try:
        import pymupdf
    except ImportError:  # pragma: no cover - environment-dependent
        sys.exit("pymupdf is not installed: pip install pymupdf")

    # Bounds the caller could otherwise turn into a silently useless file.
    # `--width 0` scales to nothing and writes a 0x0 PNG, which is a file that
    # exists, commits, and renders as a broken image at the far end; `--page 0`
    # would index `doc[-1]`, quietly returning the LAST page for a request that
    # meant the first. Both are refusals rather than clamps: a clamp answers a
    # question the caller did not ask.
    if width < 1:
        sys.exit(f"--width must be at least 1 pixel, got {width}")
    if page < 1:
        sys.exit(f"--page is 1-based; got {page}")

    doc = pymupdf.open(pdf)
    if doc.page_count < page:
        sys.exit(f"{pdf.name}: asked for page {page} of a {doc.page_count}-page document")

    pg = doc[page - 1]
    rect = pg.rect
    if rect.width <= 0 or rect.height <= 0:
        sys.exit(f"{pdf.name}: page {page} has no geometry ({rect.width}x{rect.height})")

    # Scaled on WIDTH, so a landscape cover and a portrait one occupy the same
    # column in a listing. Height follows the page's own aspect and is never
    # forced -- a cropped or letterboxed cover is a cover that misrepresents
    # the document, and the WPRO style guide (0.705:1) would have been the one
    # it misrepresented.
    scale = width / rect.width
    pix = pg.get_pixmap(matrix=pymupdf.Matrix(scale, scale), alpha=False)
    png = pix.tobytes("png")

    return png, {
        "source": str(pdf),
        "sourceSha256": hashlib.sha256(pdf.read_bytes()).hexdigest(),
        "page": page,
        "pageCount": doc.page_count,
        "pageWidthPt": round(rect.width, 2),
        "pageHeightPt": round(rect.height, 2),
        "pixelWidth": pix.width,
        "pixelHeight": pix.height,
        "bytes": len(png),
        "sha256": hashlib.sha256(png).hexdigest(),
        "mediaType": "image/png",
        "renderer": f"pymupdf {pymupdf.version[0]}",
    }


def main() -> int:
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    ap.add_argument("pdf", type=Path)
    ap.add_argument("-o", "--out", type=Path, required=True, help="PNG to write")
    ap.add_argument("--page", type=int, default=1, help="1-based page to render (default 1)")
    ap.add_argument("--width", type=int, default=300, help="output width in pixels (default 300)")
    ap.add_argument(
        "--json",
        action="store_true",
        help="print the provenance facts to stdout — source, page, geometry, digests",
    )
    ap.add_argument(
        "--check",
        action="store_true",
        help="do not write; exit non-zero if --out differs from what would be written",
    )
    a = ap.parse_args()

    png, facts = render(a.pdf, a.page, a.width)

    if a.check:
        prev = a.out.read_bytes() if a.out.exists() else None
        if prev == png:
            if a.json:
                print(json.dumps(facts, indent=2))
            return 0
        print(
            f"stale or missing: {a.out}" if prev is None else f"stale: {a.out}",
            file=sys.stderr,
        )
        return 1

    a.out.parent.mkdir(parents=True, exist_ok=True)
    a.out.write_bytes(png)
    if a.json:
        print(json.dumps(facts, indent=2))
    else:
        print(f"ok  {a.out}  {facts['pixelWidth']}x{facts['pixelHeight']}  {facts['bytes']} bytes")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
