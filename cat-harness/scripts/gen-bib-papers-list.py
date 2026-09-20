#!/usr/bin/env python3
"""gen-bib-papers-list.py — scan content/schema/references.ts and emit
a paper list compatible with scripts/upload-bib-papers.sh.

Output format (stdout, also writes scripts/bib-papers-list.txt):

    <download-url>|<target-filename>|<short-description>

Selection rules — entries are included only when the URL or DOI
points at a publicly downloadable PDF/data file:

  1. URL contains arxiv.org/abs/<id>    → fetch arxiv.org/pdf/<id>
  2. URL contains arxiv.org/pdf/<id>    → use as-is
  3. URL contains numdam.org            → use as-is (open-access French
                                            math journal; serves PDFs)
  4. URL contains archive.org/details/X → fetch archive.org/download/X
                                            (book scans, usually PDF)
  5. URL contains oeis.org/A<id>        → fetch oeis.org/A<id>/b<id>.txt
                                            (sequence data)
  6. URL contains a known-free domain
     (Stanford/MIT/CIT/etc faculty)     → use URL as-is

Skipped (require manual upload from subscription source):
  - doi.org URLs (publisher landing pages, almost always paywalled)
  - wiley.com, springer.com, sciencedirect.com without an arXiv URL
  - wikipedia.org (not a paper)
  - sciencemag.org, nature.com (paywalled)

Plus a hand-augmented HEAD list of 5 high-value free-PDF entries
not covered by the URL field alone (Boyd & Vandenberghe textbook,
CODATA constants, AME mass table, OEIS by-DOI, free arXiv preprints
of paywalled QOU-bib entries).
"""
import json
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

# Memoise to avoid repeating the same metadata query if multiple refs
# happen to share the same archive.org item id (rare but possible).
_ARCHIVE_ORG_CACHE: dict[str, str | None] = {}


def _archive_org_resolve_pdf(item_id: str) -> str | None:
    """Query archive.org/metadata/<item_id> to find the actual PDF
    filename for an item.

    Returns the full download URL on success, or None if:
      - The metadata endpoint is unreachable (e.g. sandboxed network).
      - The item has no PDF file.
      - The JSON shape is unexpected.

    Caller is expected to fall back to the legacy `<id>.pdf` guess
    when this returns None.
    """
    if item_id in _ARCHIVE_ORG_CACHE:
        return _ARCHIVE_ORG_CACHE[item_id]

    meta_url = f"https://archive.org/metadata/{item_id}"
    try:
        req = urllib.request.Request(
            meta_url,
            headers={"User-Agent": "qou-gen-bib-papers-list/1.0"},
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, OSError):
        _ARCHIVE_ORG_CACHE[item_id] = None
        return None

    # archive.org metadata schema: data["files"] is a list of dicts
    # with "name", "format", etc. Prefer ".pdf" extension AND a
    # "Text" / "Image" format (avoid e.g. ".pdf.djvu" or
    # "_djvu_xml.txt"). Order matters: prefer canonical "<id>.pdf"
    # if present, else any name ending in ".pdf".
    files = data.get("files", [])
    if not isinstance(files, list):
        _ARCHIVE_ORG_CACHE[item_id] = None
        return None

    pdf_names = [
        f["name"] for f in files
        if isinstance(f, dict) and isinstance(f.get("name"), str)
        and f["name"].endswith(".pdf")
    ]
    if not pdf_names:
        _ARCHIVE_ORG_CACHE[item_id] = None
        return None

    # Preference: <id>.pdf > <id>_bw.pdf > anything else
    pdf_names.sort(key=lambda n: (
        0 if n == f"{item_id}.pdf" else
        1 if n == f"{item_id}_bw.pdf" else
        2 if n == f"{item_id}_text.pdf" else
        3
    ))
    chosen = pdf_names[0]
    full_url = f"https://archive.org/download/{item_id}/{chosen}"
    _ARCHIVE_ORG_CACHE[item_id] = full_url
    return full_url


REPO_ROOT = Path(__file__).resolve().parent.parent
REFS_TS = REPO_ROOT / "content" / "schema" / "references.ts"
OUTPUT_TXT = REPO_ROOT / "scripts" / "bib-papers-list.txt"

# ── Hand-curated free-access entries not detected by URL scan ────
HEAD_ENTRIES = [
    (
        "https://web.stanford.edu/~boyd/cvxbook/bv_cvxbook.pdf",
        "boyd-vandenberghe-2004-convex-optimization.pdf",
        "Boyd & Vandenberghe, Convex Optimization (CUP 2004) — free PDF from author's Stanford page; references.ts key boyd-vandenberghe-2004",
    ),
    # AME 2020 mass table already present at uploads/mass_1.mas20.txt;
    # no need to re-download.
    (
        "https://physics.nist.gov/cuu/Constants/Table/allascii.txt",
        "codata-2022-constants.txt",
        "CODATA 2022 fundamental physical constants (NIST ASCII table) — used by QOU's substrate-derived predictions",
    ),
    (
        "https://arxiv.org/pdf/1503.00315",
        "berarducci-mantova-2018-surreal-derivations.pdf",
        "Berarducci & Mantova, Surreal numbers, derivations and transseries (JEMS 2018) — arXiv:1503.00315; references.ts key berarducci2018",
    ),
    (
        "https://arxiv.org/pdf/hep-th/9310070",
        "faddeev-kashaev-1994-quantum-dilogarithm.pdf",
        "Faddeev & Kashaev, Quantum dilogarithm (Mod. Phys. Lett. A 1994) — arXiv:hep-th/9310070; references.ts key faddeev_kashaev1994",
    ),
]


def safe_filename(s: str) -> str:
    """Sanitise a string for use as a filename."""
    s = re.sub(r"[^A-Za-z0-9._-]", "-", s)
    s = re.sub(r"-+", "-", s).strip("-")
    return s[:80] or "paper"


def url_to_pdf(url: str) -> str | None:
    """Convert a URL to a direct-PDF URL when possible, or None if
    the URL is a publisher landing page that can't be auto-resolved.
    """
    # arxiv.org/abs/<id> or arxiv.org/abs/category/<id>
    m = re.match(r"https?://arxiv\.org/abs/(.+)$", url)
    if m:
        return f"https://arxiv.org/pdf/{m.group(1)}"
    # arxiv.org/pdf/<id> already direct
    if "arxiv.org/pdf/" in url:
        return url
    # NIST CGI Value-lookup is NOT a paper — it renders a single
    # constant as a GIF image inside an HTML page. Skip.
    if re.match(r"https?://physics\.nist\.gov/cgi-bin/cuu/Value", url):
        return None
    # numdam.org/item/<id>/  →  numdam.org/item/<id>.pdf
    # The /item/<id>/ URL serves the HTML landing page; append .pdf
    # (without trailing slash) to get the actual PDF.
    m = re.match(r"https?://(?:www\.)?numdam\.org/item/(.+?)/?$", url)
    if m:
        return f"https://www.numdam.org/item/{m.group(1)}.pdf"
    # archive.org/details/<id> → archive.org/download/<id>/<filename>.pdf
    #
    # Older approach: guess filename = <id>.pdf. Worked for some items
    # (klein1888) but failed for others (heisenberg1958: 401,
    # weil1948: 503) because archive.org filenames can differ
    # arbitrarily (`<id>_bw.pdf`, `<id>_text.pdf`, etc.).
    #
    # New approach (2026-05-19): query archive.org/metadata/<id>
    # to discover the actual PDF filename. Falls back to the
    # <id>.pdf guess if metadata lookup fails (no network, etc.).
    m = re.match(r"https?://archive\.org/details/([^/]+)/?$", url)
    if m:
        item_id = m.group(1)
        resolved = _archive_org_resolve_pdf(item_id)
        return resolved or f"https://archive.org/download/{item_id}/{item_id}.pdf"

    # (Documentation note retained below for historical context:)
    # Legacy archive.org fallback was the bare guess. For reliable
    # resolution, the archive.org metadata API IS now consulted (see
    # _archive_org_resolve_pdf above). Legacy duplicate match block
    # removed.
    # oeis.org/A<id>
    m = re.match(r"https?://oeis\.org/(A\d+)$", url)
    if m:
        return f"https://oeis.org/{m.group(1)}/b{m.group(1)[1:]}.txt"
    # Known free-PDF domains (faculty pages, open-access publishers)
    free_domains = (
        "web.stanford.edu/~", "math.lsu.edu/~", "math.harvard.edu/~",
        "people.maths.ox.ac.uk/", "people.math.harvard.edu/~",
        "www.math.lsu.edu/~", "www.numdam.org/", "openaccess.thecvf.com/",
        "physics.nist.gov/", "amdc.in2p3.fr/",
    )
    if any(d in url for d in free_domains):
        return url
    return None


def parse_refs() -> list[dict]:
    """Quick-and-dirty parser for the ref({...}) blocks in references.ts.
    Returns list of dicts with id, title, URL, DOI."""
    text = REFS_TS.read_text()
    entries = []
    for block_match in re.finditer(r"ref\(\{(.+?)\}\),", text, re.DOTALL):
        body = block_match.group(1)
        def field(name: str) -> str | None:
            m = re.search(rf'{name}:\s*"([^"]+)"', body)
            return m.group(1) if m else None
        eid = field("id")
        if not eid:
            continue
        entries.append({
            "id": eid,
            "title": field("title") or "",
            "URL": field("URL"),
            "DOI": field("DOI"),
        })
    return entries


def main() -> int:
    entries = parse_refs()
    print(f"# Generated by scripts/gen-bib-papers-list.py from "
          f"content/schema/references.ts", file=sys.stderr)
    print(f"# Scanned {len(entries)} ref entries", file=sys.stderr)

    out_lines: list[str] = []
    out_lines.append("# upload-bib-papers.sh paper list — generated by")
    out_lines.append("# scripts/gen-bib-papers-list.py. Regenerate after")
    out_lines.append("# bib changes:  python3 scripts/gen-bib-papers-list.py")
    out_lines.append("#")
    out_lines.append("# Format: <url>|<target-filename>|<description>")
    out_lines.append("# Lines starting with # are comments (skipped).")
    out_lines.append("")
    out_lines.append("# ─── Hand-curated free-access entries ───")
    for url, target, desc in HEAD_ENTRIES:
        out_lines.append(f"{url}|{target}|{desc}")
    out_lines.append("")

    out_lines.append("# ─── Auto-extracted from references.ts URL field ───")
    skipped_paywall = 0
    added = 0
    seen_targets: set[str] = set()
    for e in entries:
        url = e["URL"]
        if not url:
            continue
        pdf_url = url_to_pdf(url)
        if not pdf_url:
            skipped_paywall += 1
            continue
        # Derive target filename: prefix with entry id for stable naming
        ext = ".pdf"
        if pdf_url.endswith(".txt"):
            ext = ".txt"
        target = safe_filename(e["id"]) + ext
        if target in seen_targets:
            continue
        seen_targets.add(target)
        title = e["title"][:60].replace("|", "-")
        desc = f"references.ts id={e['id']}; {title} (source: {url})"
        out_lines.append(f"{pdf_url}|{target}|{desc}")
        added += 1

    out_lines.append("")
    out_lines.append(f"# Summary: {len(HEAD_ENTRIES)} curated + {added} auto-extracted = "
                     f"{len(HEAD_ENTRIES) + added} total")
    out_lines.append(f"#          {skipped_paywall} entries skipped "
                     f"(paywall/non-PDF/no URL)")
    out_lines.append(f"#          {len(entries) - len(HEAD_ENTRIES) - added - skipped_paywall} "
                     f"entries had no URL field")

    OUTPUT_TXT.write_text("\n".join(out_lines) + "\n")
    print(f"wrote {OUTPUT_TXT.relative_to(REPO_ROOT)} "
          f"({len(HEAD_ENTRIES) + added} entries; "
          f"{skipped_paywall} skipped paywall)", file=sys.stderr)
    print("\n".join(out_lines))
    return 0


if __name__ == "__main__":
    sys.exit(main())
