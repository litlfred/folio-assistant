"""
_pdf_headings — table-of-contents inference from the PDF's LAYOUT, for the
documents that carry no embedded outline. Issue #2302, bean `cp3v`.

`pdf-structure.py`'s original fallback, `infer_headings`, reads plain page
text with regular expressions. Plain text has thrown away the one signal a
reader uses to see a heading — it is set larger, or bolder, than the body —
so that fallback can only find headings that are NUMBERED or carry one of a
dozen stock names. This module reads the text WITH its font metrics and
offers two methods, measured against held-out PDF outlines by
`toc-benchmark.py` (see `docs/guides/toc-extraction.md` for the numbers):

* `font_headings` — the rule-based tree constructor every open pipeline
  starts from (pdfminer / PyMuPDF layout blocks): find the body type, keep
  whole lines set in a more prominent style, drop running furniture, and
  rank the surviving styles into levels, with section numbering overriding
  the rank where present.
* `contents_headings` — parse a printed contents page (dotted leaders or a
  trailing page number), then map each printed page label to a physical page
  by finding the entry's title in the body (Wu, Mitra & Giles, ICDAR 2013).

Both work on a list of `Line`s, which either backend can produce:
`lines_pymupdf` (preferred, AGPL — see the licence note in pdf-structure.py)
or `lines_pdfminer` (MIT). The methods themselves import nothing.

Results are plain `Heading` tuples so this module does not depend on
pdf-structure.py; the caller converts.
"""

from __future__ import annotations

import re
import unicodedata
from collections import Counter, defaultdict
from dataclasses import dataclass
from difflib import SequenceMatcher
from typing import Iterable, NamedTuple


# ---------------------------------------------------------------- data


@dataclass
class Line:
    """One horizontal text line with the style that dominates it."""

    page: int            # 1-based physical page
    text: str
    size: float          # dominant font size (char-weighted), rounded to 0.5
    bold: bool           # dominant span is bold
    italic: bool         # dominant span is italic
    caps: bool           # letters are upper case (capitals or small capitals)
    font: str            # dominant font name, subset prefix removed
    uniform: float       # share of the line's characters in the dominant style
    x0: float
    y0: float
    x1: float
    y1: float
    page_height: float
    page_width: float

    @property
    def style(self) -> tuple[float, bool, bool, bool]:
        return (self.size, self.bold, self.caps, self.italic)


class Heading(NamedTuple):
    level: int
    title: str
    page: int | None
    number: str | None


# ---------------------------------------------------------------- backends

RE_HAS_WORD = re.compile(r"[^\W\d_]{2,}")

RE_BOLD_FONT = re.compile(
    r"bold|black|heavy|semibold|demi|extrabold|(?:^|[-,+])b(?:d|old)?$|cmbx|cmssbx|sfbx|"
    r"\.b$|-b$|medi",
    re.I,
)


RE_ITALIC_FONT = re.compile(r"ital|oblique|(?:^|[-,+])it$|cmti|cmsl|slant", re.I)


def _is_bold(font: str, flags: int = 0) -> bool:
    return bool(flags & 16) or bool(RE_BOLD_FONT.search(font))


def _is_italic(font: str, flags: int = 0) -> bool:
    return bool(flags & 2) or bool(RE_ITALIC_FONT.search(font))


def _caps(text: str) -> bool:
    letters = [c for c in text if c.isalpha()]
    return len(letters) >= 3 and sum(c.isupper() for c in letters) >= 0.9 * len(letters)


def _strip_subset(font: str) -> str:
    return re.sub(r"^[A-Z]{6}\+", "", font or "")


def _round(size: float) -> float:
    return round(size * 2) / 2


def _dominant(spans: list[tuple[str, float, bool, bool, str]]) -> tuple[float, bool, bool, str, float]:
    """Char-weighted dominant (size, bold, italic, font) of a line, and its
    share of the line's characters.

    Small capitals are set as full capitals at two sizes, so a small-caps
    heading would split its weight between them. Sizes within 25% of each
    other inside an all-capitals run are therefore counted at the larger."""
    weight: Counter = Counter()
    fonts: dict[tuple, Counter] = defaultdict(Counter)
    total = 0
    caps = _caps("".join(s[0] for s in spans))
    top = max((s[1] for s in spans if s[0].strip()), default=0.0)
    for text, size, bold, italic, font in spans:
        n = sum(1 for c in text if not c.isspace())
        if not n:
            continue
        if caps and size >= 0.75 * top:
            size = top
        key = (_round(size), bold, italic)
        weight[key] += n
        fonts[key][font] += n
        total += n
    if not total:
        return 0.0, False, False, "", 0.0
    key, n = weight.most_common(1)[0]
    return key[0], key[1], key[2], fonts[key].most_common(1)[0][0], n / total


def lines_pymupdf(path: str) -> list[Line]:
    import pymupdf  # lazy; AGPL, optional

    out: list[Line] = []
    with pymupdf.open(path) as doc:
        for pno, page in enumerate(doc, start=1):
            try:
                d = page.get_text("dict")
            except Exception:
                continue
            h, w = page.rect.height, page.rect.width
            for b in d.get("blocks", []):
                for ln in b.get("lines", []):
                    dx, _ = ln.get("dir", (1.0, 0.0))
                    if abs(dx) < 0.99:
                        continue
                    spans = [
                        (s.get("text", ""), float(s.get("size", 0)),
                         _is_bold(s.get("font", ""), int(s.get("flags", 0))),
                         _is_italic(s.get("font", ""), int(s.get("flags", 0))),
                         _strip_subset(s.get("font", "")))
                        for s in ln.get("spans", [])
                    ]
                    text = re.sub(r"\s+", " ", "".join(s[0] for s in spans)).strip()
                    if not text:
                        continue
                    size, bold, italic, font, share = _dominant(spans)
                    x0, y0, x1, y1 = ln["bbox"]
                    out.append(Line(pno, text, size, bold, italic, _caps(text), font, share,
                                    x0, y0, x1, y1, h, w))
    return _join_same_baseline(out)


def lines_pdfminer(path: str) -> list[Line]:
    from pdfminer.high_level import extract_pages  # lazy; MIT
    from pdfminer.layout import LTChar, LTTextContainer, LTTextLine

    out: list[Line] = []
    for pno, layout in enumerate(extract_pages(path), start=1):
        h, w = layout.height, layout.width

        def walk(obj):
            if isinstance(obj, LTTextLine):
                yield obj
            elif isinstance(obj, LTTextContainer) or hasattr(obj, "__iter__"):
                try:
                    for child in obj:
                        yield from walk(child)
                except TypeError:
                    return

        for ln in walk(layout):
            spans = [
                (c.get_text(), float(c.size), _is_bold(_strip_subset(c.fontname)),
                 _is_italic(_strip_subset(c.fontname)), _strip_subset(c.fontname))
                for c in ln if isinstance(c, LTChar)
            ]
            text = re.sub(r"\s+", " ", ln.get_text()).strip()
            if not text or not spans:
                continue
            size, bold, italic, font, share = _dominant(spans)
            # pdfminer's y grows upwards; flip so y0 is the top, like PyMuPDF.
            out.append(Line(pno, text, size, bold, italic, _caps(text), font, share,
                            ln.x0, h - ln.y1, ln.x1, h - ln.y0, h, w))
    return _join_same_baseline(out)


RE_BARE_NUMBER = re.compile(r"^(?:\d{1,2}(?:\.\d{1,2}){0,4}|[IVX]{1,5}|[A-Z])\.?$")


def _join_same_baseline(lines: list[Line]) -> list[Line]:
    """Backend order, with a bare section number re-joined to its title.

    Backends often emit "2.1" and "Autonomous Agent" as two lines when the
    number is set in its own box. Left apart, the number is lost and with it
    the depth it states. Only a BARE NUMBER on the left is joined, and only
    across a small gap on the same baseline, so two text columns never are.
    The joined line takes the title's style: the number's own type is often
    different and is not what marks the heading.
    """
    # The backend's own order is kept: PyMuPDF and pdfminer both emit text
    # column by column, while a sort on y would interleave two columns.
    ordered = list(lines)
    out: list[Line] = []
    i = 0
    while i < len(ordered):
        l = ordered[i]
        if RE_BARE_NUMBER.match(l.text) and i + 1 < len(ordered):
            n = ordered[i + 1]
            if (n.page == l.page and abs(n.y0 - l.y0) < 0.4 * max(n.size, 1, l.size)
                    and 0 <= n.x0 - l.x1 < 4 * max(n.size, 1) and RE_HAS_WORD.search(n.text)):
                out.append(Line(n.page, f"{l.text} {n.text}", n.size, n.bold, n.italic, n.caps, n.font,
                                n.uniform, l.x0, min(l.y0, n.y0), n.x1, max(l.y1, n.y1),
                                n.page_height, n.page_width))
                i += 2
                continue
        out.append(l)
        i += 1
    return out


def extract_lines(path: str, backend: str = "auto") -> list[Line]:
    if backend in ("auto", "pymupdf"):
        try:
            return lines_pymupdf(path)
        except ImportError:
            if backend == "pymupdf":
                raise
    return lines_pdfminer(path)


# ---------------------------------------------------------------- helpers

RE_NUM = re.compile(
    r"^(?:(?:chapter|section|part|annex|appendix)\s+)?"
    r"(?P<num>\d{1,2}(?:\.\d{1,2}){0,4}|[IVX]{1,5}|[A-Z](?:\.\d{1,2}){0,3})"
    r"(?:[.:)]|\s)\s*(?P<title>\S.*)$",
    re.I,
)
# Lines that are set like headings but are not sections.
RE_NOT_SECTION = re.compile(
    r"^(?:fig(?:ure)?\.?|table|tab\.|algorithm|listing|box|panel|source|note|notes|"
    r"proof|theorem|lemma|proposition|corollary|definition|remark|example|exercise|"
    r"conjecture|claim|step|case|equation|keywords?|index terms|e-?mail|https?:)\b"
    r"(?:\s*[\dA-Z.:]*\s*$|\s*\d)",
    re.I,
)


def norm_title(s: str) -> str:
    """Comparison form: lower-case, accents and numbering stripped."""
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c)).lower()
    s = re.sub(r"^\s*(?:(?:chapter|section|part|annex|appendix)\s+)?"
               r"(?:\d+(?:\.\d+)*|[ivx]+|[a-z](?:\.\d+)*)[.:)]?\s+", "", s)
    s = re.sub(r"[^a-z0-9]+", " ", s)
    return s.strip()


def split_number(text: str) -> tuple[str | None, str]:
    m = RE_NUM.match(text)
    if not m:
        return None, text
    num, title = m.group("num"), m.group("title").strip()
    # A single capital letter is a section number only when what follows reads
    # as a title ("A Proof of ..."), never an ordinary word run ("I think").
    if re.fullmatch(r"[A-Za-z]", num) and not re.search(r"appendix|annex", text[:12], re.I):
        if not title[:1].isupper() or num.lower() in ("a", "i") and not re.match(r"^[A-Z][.:]", text):
            return None, text
    if re.fullmatch(r"[IVX]+", num, re.I) and not re.match(r"^[IVX]+[.:)]", text, re.I):
        return None, text
    return num, title


def _depth(num: str | None) -> int | None:
    """Depth a section number states. A Roman numeral is a top-level
    section; a lone letter is ambiguous (appendix "A", or subsection "A"
    under "II") so it states nothing and the style decides."""
    if not num:
        return None
    if re.fullmatch(r"[IVX]+", num, re.I):
        return 1
    if re.fullmatch(r"[A-Z]", num, re.I):
        return None
    if re.match(r"[A-Z]\.", num, re.I):
        return num.count(".") + 1
    return num.count(".") + 1


def body_size(lines: Iterable[Line]) -> float:
    c: Counter = Counter()
    for l in lines:
        c[l.size] += len(l.text)
    return c.most_common(1)[0][0] if c else 0.0


def furniture_keys(lines: list[Line], n_pages: int) -> set[str]:
    """Text that recurs on many pages — running heads, footers, stamps."""
    if n_pages < 4:
        return set()
    pages_of: dict[str, set[int]] = defaultdict(set)
    for l in lines:
        k = re.sub(r"\d+", "#", l.text.lower()).strip()
        pages_of[k].add(l.page)
    limit = max(3, 0.2 * n_pages)
    return {k for k, ps in pages_of.items() if len(ps) >= limit}


def _furniture_key(l: Line) -> str:
    return re.sub(r"\d+", "#", l.text.lower()).strip()


# ---------------------------------------------------------------- method 1: font


def font_headings(lines: list[Line], max_levels: int = 4) -> list[Heading]:
    if not lines:
        return []
    n_pages = max(l.page for l in lines)
    body = body_size(lines)
    furniture = furniture_keys(lines, n_pages)
    # A printed contents page is a list of every heading, set in heading
    # styles; read as headings it would put the whole document on that page.
    by_page: dict[int, list[Line]] = defaultdict(list)
    for l in lines:
        by_page[l.page].append(l)
    skip_pages = set(contents_pages(by_page, max_scan=n_pages, every_run=True))

    # Page 1's front matter (title, byline, affiliations) is set prominently
    # and is not a section. Skip it up to the first line that opens one.
    first_opening = None
    for l in lines:
        if l.page > 1:
            break
        t = l.text.strip().lower()
        if re.match(r"^(?:abstract|summary|contents|table of contents|1\.?\s+\S|i\.\s+\S|introduction)\b", t):
            first_opening = (l.y0, l.x0)
            break

    cands: list[Line] = []
    for l in lines:
        t = l.text.strip()
        if l.uniform < 0.85 or not RE_HAS_WORD.search(t) or not (2 <= len(t) <= 160):
            continue
        if _furniture_key(l) in furniture or l.page in skip_pages:
            continue
        # Margins: running heads and folios live in the outer 6% of the page.
        if l.y1 < 0.06 * l.page_height or l.y0 > 0.94 * l.page_height:
            continue
        prominent = l.size >= body + 0.9 or (l.bold and l.size >= body - 0.6)
        # A NUMBERED line set apart from the body some other way — capitals
        # or small capitals ("I. INTRODUCTION"), or italic ("A. Search
        # strategy"), the IEEE and ACM conventions — is a heading even at
        # body size and weight.
        if not prominent and l.size >= body - 0.6 and (l.caps or l.italic) and len(t) <= 100:
            num, _ = split_number(t)
            prominent = num is not None
        if not prominent:
            continue
        if RE_NOT_SECTION.match(t):
            continue
        if l.page == 1 and first_opening and (l.y0, l.x0) < first_opening:
            continue
        cands.append(l)

    # Merge a heading set over two lines: same page and style, close below,
    # and the continuation does not start a new number.
    merged: list[Line] = []
    for l in cands:
        p = merged[-1] if merged else None
        if (p and p.page == l.page and p.style == l.style
                and 0 <= l.y0 - p.y1 < 0.8 * l.size
                and split_number(l.text)[0] is None
                and not p.text.rstrip().endswith(".")):
            merged[-1] = Line(p.page, f"{p.text} {l.text}", p.size, p.bold, p.italic, p.caps, p.font, p.uniform,
                              min(p.x0, l.x0), p.y0, max(p.x1, l.x1), l.y1, p.page_height, p.page_width)
        else:
            merged.append(l)

    # A heading reads as a heading, not a sentence or a table cell.
    def heading_like(l: Line) -> bool:
        t = l.text.strip()
        num, title = split_number(t)
        if len(title) > 140 or title.endswith((".", ",", ";")) and not num:
            return False
        if sum(c.isdigit() for c in title) > len(title) / 3:
            return False
        if not re.match(r"^[\W\d]*[A-Z0-9(\"'“]", title) and not num:
            return False
        return True

    merged = [l for l in merged if heading_like(l)]

    # A style that fires many times per page is emphasis or a table header,
    # not a section style. Real heading styles are sparse.
    per_style_pages: dict[tuple, set[int]] = defaultdict(set)
    per_style_count: Counter = Counter()
    for l in merged:
        per_style_pages[l.style].add(l.page)
        per_style_count[l.style] += 1
    dense = {s for s, n in per_style_count.items() if n / max(1, len(per_style_pages[s])) > 4}
    merged = [l for l in merged if l.style not in dense]
    if not merged:
        return []

    # Rank styles: larger first, bold before regular at the same size.
    styles = sorted({l.style for l in merged}, key=lambda s: (-s[0], not s[1], not s[2], s[3]))
    rank = {s: i + 1 for i, s in enumerate(styles)}

    # Where styles carry section numbers, the numbering depth is the truth;
    # learn which depth each style mostly carries and use it for the
    # style's unnumbered headings too.
    style_depth: dict[tuple, Counter] = defaultdict(Counter)
    for l in merged:
        d = _depth(split_number(l.text)[0])
        if d:
            style_depth[l.style][d] += 1
    learned = {s: c.most_common(1)[0][0] for s, c in style_depth.items()}

    out: list[Heading] = []
    for l in merged:
        num, title = split_number(l.text.strip())
        level = _depth(num) or learned.get(l.style) or rank[l.style]
        out.append(Heading(min(level, max_levels + 2), title.strip(), l.page, num))
    # Levels are ranks, not sizes: renumber the ones in use from 1 so that a
    # document whose two largest styles were front matter does not start at 3.
    used = {lv: i + 1 for i, lv in enumerate(sorted({h.level for h in out}))}
    out = [h._replace(level=used[h.level]) for h in out]
    # Keep the first occurrence of an identical heading (a repeated chapter
    # title on a part page, say).
    seen: set[str] = set()
    uniq = []
    for h in out:
        k = f"{h.number}|{norm_title(h.title)}"
        if k in seen:
            continue
        seen.add(k)
        uniq.append(h)
    return uniq


# ---------------------------------------------------------------- method 2: contents page

RE_LEADER = re.compile(r"^(?P<title>.*?\S)\s*(?:[.…·_]\s*){3,}\s*(?P<page>\d{1,4}|[ivxlc]{1,6})\s*$", re.I)
RE_TRAIL = re.compile(r"^(?P<title>.*?[^\d\s.])\s{1,}(?P<page>\d{1,4})\s*$")
RE_CONTENTS_TITLE = re.compile(r"^\s*(?:table of )?contents\s*$|^\s*sommaire\s*$|^\s*índice\s*$", re.I)


def _rows(page_lines: list[Line]) -> list[Line]:
    """Join lines that share a baseline: a contents entry's title, leader and
    page number are often three separate text lines."""
    rows: list[list[Line]] = []
    for l in sorted(page_lines, key=lambda l: (l.y0, l.x0)):
        if rows and abs(rows[-1][0].y0 - l.y0) < 0.5 * max(l.size, 1) and abs(rows[-1][0].y1 - l.y1) < 0.6 * max(l.size, 1):
            rows[-1].append(l)
        else:
            rows.append([l])
    out = []
    for r in rows:
        r.sort(key=lambda l: l.x0)
        f = r[0]
        out.append(Line(f.page, " ".join(x.text for x in r), f.size, f.bold, f.italic, f.caps, f.font, f.uniform,
                        f.x0, f.y0, max(x.x1 for x in r), max(x.y1 for x in r), f.page_height, f.page_width))
    return out


def _parse_entry(t: str) -> tuple[str, str] | None:
    m = RE_LEADER.match(t) or RE_TRAIL.match(t)
    if not m:
        return None
    title = m.group("title").strip(" .")
    if not RE_HAS_WORD.search(title):
        return None
    return title, m.group("page")


def contents_pages(by_page: dict[int, list[Line]], max_scan: int = 20,
                   every_run: bool = False) -> list[int]:
    """Pages that are mostly entries ending in a page number.

    By default the first contiguous run within the first `max_scan` pages —
    the document's contents (Wu et al. 2013 search min(20, N/5)). With
    `every_run`, every such page anywhere: the font method must skip an
    appendix's own contents page too."""
    found: list[int] = []
    for p in sorted(by_page)[:max_scan]:
        rows = _rows(by_page[p])
        if not rows:
            continue
        entries = sum(1 for r in rows if _parse_entry(r.text))
        has_title = any(RE_CONTENTS_TITLE.match(r.text) for r in rows)
        if entries >= 5 and (entries >= 0.4 * len(rows) or has_title and entries >= 0.25 * len(rows)):
            found.append(p)
        elif found and not every_run:
            break                     # contents pages are contiguous
    return found


def contents_headings(lines: list[Line]) -> list[Heading]:
    by_page: dict[int, list[Line]] = defaultdict(list)
    for l in lines:
        by_page[l.page].append(l)
    pages = contents_pages(by_page)
    if not pages:
        return []

    raw: list[tuple[str, str, float, Line]] = []    # title, label, x0, row
    pending: Line | None = None
    for p in pages:
        for r in _rows(by_page[p]):
            if RE_CONTENTS_TITLE.match(r.text):
                continue
            parsed = _parse_entry(r.text)
            if parsed:
                title, label = parsed
                x0 = r.x0
                if pending is not None and r.y0 - pending.y1 < 0.8 * r.size and not split_number(title)[0]:
                    title, x0 = f"{pending.text} {title}", pending.x0
                raw.append((title, label, x0, r))
                pending = None
            else:
                pending = r if RE_HAS_WORD.search(r.text) and len(r.text) < 140 else None
    if len(raw) < 3:
        return []

    # Levels: numbering depth where present; otherwise indentation rank.
    xs = sorted({round(x / 6) for _, _, x, _ in raw})
    indent_rank = {x: i + 1 for i, x in enumerate(xs)}

    # Printed page label -> physical page: the most common offset at which an
    # entry's title is found as a line in the body.
    body = [l for l in lines if l.page not in pages]
    index: dict[str, list[int]] = defaultdict(list)
    for l in body:
        index[norm_title(l.text)].append(l.page)
    offsets: Counter = Counter()
    for title, label, _, _ in raw:
        if not label.isdigit():
            continue
        key = norm_title(title)
        for phys in index.get(key, []):
            offsets[phys - int(label)] += 1
    offset = offsets.most_common(1)[0][0] if offsets else 0
    n_pages = max(by_page)

    out: list[Heading] = []
    for title, label, x0, r in raw:
        num, t = split_number(title)
        level = _depth(num) or indent_rank[round(x0 / 6)]
        page = int(label) + offset if label.isdigit() else None
        if page is not None and not (1 <= page <= n_pages):
            page = None
        out.append(Heading(level, t, page, num))
    return out


# ---------------------------------------------------------------- method 3: hybrid


def layout_headings(lines: list[Line]) -> tuple[list[Heading], str]:
    """The printed contents when the document has one, else font metrics.

    Returns the headings and which method produced them.
    """
    toc = contents_headings(lines)
    if len(toc) >= 5:
        return toc, "contents"
    return font_headings(lines), "font"


# ---------------------------------------------------------------- scoring


def similar(a: str, b: str) -> float:
    if not a or not b:
        return 0.0
    if a == b:
        return 1.0
    # Length alone bounds the ratio; skip the quadratic comparison when it
    # cannot reach any threshold worth asking about.
    la, lb = len(a), len(b)
    if 2 * min(la, lb) / (la + lb) < 0.7:
        return 0.0
    sm = SequenceMatcher(None, a, b, autojunk=False)
    if sm.quick_ratio() < 0.7:
        return 0.0
    return sm.ratio()
