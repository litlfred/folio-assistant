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
import glob
import hashlib
import json
import os
import re
import unicodedata
from collections import Counter
import sys
import warnings
from dataclasses import dataclass, field, asdict
from typing import Any

warnings.filterwarnings("ignore")

# pypdf's import chain reaches `cryptography`, which panics rather than raising
# ImportError when its native extension is broken -- see scripts/_pypdf_compat.py.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _pypdf_compat import import_pypdf  # noqa: E402

PdfReader = import_pypdf("PdfReader")

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

# Marks that only a byline carries: an initial ("D. J."), an affiliation
# superscript ("Kreimer 2)", "Lv*1"), or a dagger/asterisk footnote. A title
# continuation has none of these, so their presence outranks the abstract test.
RE_BYLINE_MARKER = re.compile(
    r"(?:\b[A-ZÀ-ʯ]\.(?:\s|$)"          # an initial with its period
    r"|\d\s*\)"                          # "1)" affiliation marker
    r"|[∗*†‡§]"                           # footnote marks
    r"|\b[A-ZÀ-ʯ][a-zà-ʯ]+\s*\*?\d)"     # "Lv*1", "Zhou 2"
)

# Punctuation that betrays a list of names: a comma between them, or a
# conjunction. Necessary but far from sufficient — see `looks_like_byline`,
# which uses it as one of two routes and vetoes both with the abstract test.
RE_AUTHOR_HINT = re.compile(r"(,\s|\band\b|\&)", re.I)
# Words that join names in a byline, and carry no evidence either way.
BYLINE_CONNECTORS = {"and", "&", "und", "et", "e", "y"}
# Nobiliary particles and name prefixes, which are lower-case yet name-like.
NAME_PARTICLES = {
    "van", "von", "de", "der", "den", "del", "della", "di", "da", "das", "dos",
    "du", "la", "le", "ten", "ter", "bin", "ibn", "al", "mac", "mc", "st",
}
# Function words a *title* uses and a byline does not. Their presence is the
# cheapest proof that a line is title text rather than a list of names.
TITLE_FUNCTION_WORDS = {
    "a", "an", "the", "of", "for", "in", "on", "with", "to", "from", "via",
    "at", "as", "into", "over", "under", "between", "through", "without",
    "upon", "its", "their", "some", "new", "toward", "towards", "about",
    "against", "among", "beyond", "near", "per", "than", "that", "which",
    "when", "where", "why", "how", "is", "are", "be", "do", "does",
}
# Lines that end the title even though they are neither a byline nor the
# abstract marker: a numbered section heading, or the start of a table of
# contents. Without this the title runs on into the body — a bound book
# chapter with no byline took its whole first paragraph as its title.
RE_TITLE_STOP = re.compile(
    r"^\s*(?:\d+(?:\.\d+)*\.?\s+[A-ZÀ-ʯ]"
    r"|contents\b|table of contents\b|introduction\b|keywords?\b|key words\b)",
    re.I,
)
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
    # A journal name then "vol (year)" or "vol:issue". Commas and colons
    # have to be allowed inside the name or the pattern cannot cross them
    # — "Symmetry, Integrability and Geometry: Methods and Applications
    # SIGMA 7 (2011), 115" went unrecognised and became a paper's title.
    r"|[A-Za-z][A-Za-z\s&.,:\-]{5,}\s+\d{1,4}\s*[:(]\s*\d"
    r"|Vol(?:ume)?\.?\s*\d+\s*[,.(]"
    # An ISSN banner and a publication-date line, both printed above the
    # title on society offprints. Neither was recognised, and once the
    # start index stopped at the first non-furniture line rather than the
    # last furniture line, an unrecognised banner became the title itself.
    #
    #   0| ISSN 1472-2739 (on-line) 1472-2747 (printed) 537
    #   1| Algebraic & Geometric Topology
    #   3| Volume 3 (2003) 537-556
    #   4| Published: 16 June 2003
    #   5| Skein-theoretical derivation          <- the title starts here
    r"|ISSN\b|e-ISSN\b"
    r"|(?:Published|Received|Accepted|Revised)\s*:?\s*\d{1,2}\s+\w+\s+\d{4}"
    # Publisher furniture that prints ABOVE the title and was being taken
    # as the title: a submission banner, a download stamp, an
    # article-listing masthead, and the society banner that opens an AMS
    # or Springer offprint.
    r"|prepared\s+for\s+submission\b|downloaded\s+from\b"
    r"|contents\s+lists\s+available\b|journal\s+homepage\b"
    r"|(?:transactions|proceedings|communications|annals|bulletin|journal)\s+"
    r"(?:of|in)\b[^\n]{0,60}$"
    r"|https?://|doi\s*:|\bdoi\.org\b)",
    re.I,
)

# PDF text extraction damages words in two systematic ways. Both corrupt
# every downstream consumer at once — the title, the index brief, and the
# section text that corpus-grep runs over — so they are repaired here at
# the producer rather than in each reader.
LIGATURES = str.maketrans({
    "ﬀ": "ff", "ﬁ": "fi", "ﬂ": "fl", "ﬃ": "ffi",
    "ﬄ": "ffl", "ﬅ": "st", "ﬆ": "st",
})
# A floating accent emitted before its letter: "Gr¨ obner" -> "Gröbner",
# "J ´ER ˆOME" -> "JÉRÔME".
ACCENTS = {"¨": "̈", "´": "́", "`": "̀", "ˆ": "̂", "˜": "̃"}
RE_FLOAT_ACCENT = re.compile("([" + "".join(ACCENTS) + r"])\s*([A-Za-z])")
# A capital separated from the rest of its word by kerning: "V olume".
RE_SPLIT_CAP = re.compile(r"\b([A-Z])\s+([a-z]{2,})\b")


# Two adjacent all-caps runs, Unicode-aware. `[A-Z]` is ASCII-only in
# Python's re, which left "GR ÖBNER" and "J ÉR ÔME" split precisely for
# the accented names the accent repair had just fixed.
RE_CAPS_PAIR = re.compile(r"(?<![^\W\d_])([^\W\d_]+)\s+([^\W\d_]+)(?![^\W\d_])")


def repair_text(s: str) -> str:
    """Deterministic half: ligatures and floating accents only.

    Safe to apply anywhere — neither needs to know the document, and both
    are unambiguous. Anything that has to guess belongs in `rejoin_caps`,
    which can consult the document's own vocabulary.
    """
    if not s:
        return s
    s = s.translate(LIGATURES)
    s = unicodedata.normalize(
        "NFC", RE_FLOAT_ACCENT.sub(lambda m: m.group(2) + ACCENTS[m.group(1)], s))
    return re.sub(r"\s{2,}", " ", s)


def rejoin_caps(s: str, vocab) -> str:
    """Vocabulary-gated half: undo arbitrary splits in all-caps runs.

    All-caps words get broken at arbitrary points by kerning — "STA VROS
    GAROUF ALIDIS" — and nothing about the *shape* of two capitalised
    fragments says whether they are one word or two. The document's own
    text decides.

    `vocab` is a Counter of lower-cased tokens, and the counts are load
    bearing: mere presence is not enough in either direction, because a
    document that carries this damage attests its own artefacts. "BASES
    FOR" was welded into one token because "basesfor" appeared elsewhere,
    and "NON-CRYST ALLOGRAPHIC" was left broken because the same damaged
    header repeats on every page, so "cryst" and "allographic" are both
    "words" too.

    Frequency separates them. A real word beats the fragments it was
    broken into (`crystallographic` 30 vs `cryst` 5), while a damage
    artefact loses to the real words it welded (`basesfor` 1 vs `for` 200).
    """
    if not vocab:
        return s

    def freq(w):
        return vocab.get(re.sub(r"[^\w]", "", w).lower(), 0)

    # A capital kerned away from the rest of its word: "V olume". Gated on
    # attestation, because the same shape is also a symbol followed by an
    # ordinary word — ungated, this turned the French "Soit K un corps"
    # into "Soit Kun corps".
    #
    # Attestation of the JOIN is not enough on its own, because the join can
    # be a real word while the split was never damage. Seidel's title, "A long
    # exact sequence for symplectic Floer cohomology", became "Along exact
    # sequence": `along` is attested on nearly every page of a symplectic
    # paper, so the join passed — and the paper this repo most wanted became
    # unfindable by its own name.
    #
    # A genuine kerning split leaves a fragment, not a word: "olume", "ector",
    # "opology". So the tail must be unattested as well. Erring this way is
    # the safe direction — a missed join leaves text readable, a wrong join
    # destroys a title.
    s = RE_SPLIT_CAP.sub(
        lambda m: m.group(1) + m.group(2)
        if freq(m.group(1) + m.group(2)) and not freq(m.group(2))
        else m.group(0), s)

    # Whole runs, longest first. A name can be broken more than once —
    # "J ÉR ÔME" — and joining pairwise never fires there, because the
    # intermediate "JÉR" is not a word and so is not attested. Only the
    # full run is.
    toks = re.split(r"(\s+)", s)
    out: list[str] = []
    i = 0
    while i < len(toks):
        run = []
        j = i
        while j < len(toks) and toks[j].strip() and toks[j].isupper():
            run.append(toks[j])
            j += 2                      # skip the separator between tokens
        joined = None
        for k in range(len(run), 1, -1):
            cand = "".join(run[:k])
            words = [(m.start(), m.end(), m.group(0))
                     for m in re.finditer(r"[^\W\d_]+", cand)]
            seams, ok = [], True
            for f in run[:k - 1]:
                seams.append((seams[-1] if seams else 0) + len(f))
            for idx, seam in enumerate(seams):
                # The word formed AT THE SEAM, not the whole concatenation:
                # "GR" + "ÖBNER-SHIRSHOV" makes "GRÖBNER", and asking
                # whether "gröbnershirshov" is a word answers a question
                # nobody posed. Every seam is checked, because checking
                # only the first once swallowed a whole title into one
                # token on a run whose first seam was a real join.
                w = next((t for a, b, t in words if a < seam <= b), "")
                if len(w) < 4 or not freq(w):
                    ok = False
                    break
                left = re.findall(r"[^\W\d_]+", run[idx])
                right = re.findall(r"[^\W\d_]+", run[idx + 1])
                # The join has to actually make a word. When a fragment
                # ends in a non-letter the seam word is just that fragment
                # unchanged — "HYPERBOLIC" + "3-MANIFOLDS" seams on
                # "HYPERBOLIC" — and every frequency test then compares the
                # word with itself and passes, welding two real words.
                if not left or not right or w in (left[-1], right[0]):
                    ok = False
                    break
                if freq(w) < min(freq(left[-1]), freq(right[0])):
                    ok = False
                    break
            if ok:
                joined, i = cand, i + 2 * k - 1
                break
        if joined:
            out.append(joined)
        else:
            out.append(toks[i])
            i += 1
    return "".join(out)


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
        # A table-of-contents page is itself a dense list of heading-shaped
        # lines, each ending in the page number it points at. Scraping it
        # yields a whole document's headings all claiming to start on the
        # TOC page — 3 corpus documents had over half their sections on one
        # page for this reason. Detect and skip the page, not the document:
        # its real headings are still found in the body.
        lines_ = text.splitlines()
        heading_ish = [l for l in lines_ if RE_NUMBERED.match(l) or RE_NAMED.match(l)]
        if len(heading_ish) >= 8:
            trailing_page_no = sum(
                1 for l in heading_ish if re.search(r"(?:\.\s*){2,}\d{1,4}\s*$|\s\d{1,4}\s*$", l)
            )
            if trailing_page_no >= 0.6 * len(heading_ish):
                continue

        for line in lines_:
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


def looks_like_byline(line: str, abstract_words: set[str]) -> bool:
    """Is `line` a list of author names rather than more of the title?

    This replaces a punctuation test — a line counted as the byline only if it
    held a comma, "and", or "&" — which failed in both directions. Every
    **single-author** byline slipped through and was appended to the title
    (`"FLOER COHOMOLOGY AND PENCILS OF QUADRICS IVAN SMITH"`), and a title
    continuation that happened to contain "and" was taken *as* the byline,
    truncating the title and losing the real authors
    (`"...IN THE MIRROR OF THE PROJECTIVE"` / `"PLANE AND A BINODAL CUBIC
    CURVE"`). Measured on nine documents ingested 2026-08-24, one title in
    nine came out correct.

    Two signals, because neither is sufficient alone.

    **Shape.** A byline is names: capitalised words, initials, and nobiliary
    particles, joined by connectors. One `TITLE_FUNCTION_WORDS` member settles
    it — no byline says "of" or "the". This alone kills the *"PLANE AND A
    BINODAL CUBIC CURVE"* case on its bare article "A".

    **The abstract.** Shape cannot separate `"TOM BRIDGELAND"` from
    `"TORUS KNOT"`; both are two capitalised words. But an author is rarely
    named in their own abstract, while the nouns of a title are almost always
    restated in it. So a line whose name-like words are mostly *already in the
    abstract* is title text. Majority rather than any single hit, so a paper
    whose author shares a surname with its subject — Roth, on Roth's theorem —
    is not derailed by one coincidence.

    Document frequency was tried first and rejected: running heads repeat the
    author surname on every even page, so a name is not rarer than a title
    word in the text as a whole. The abstract is the part of the document that
    discriminates.

    `line` must already be repaired (`repair_text` + `rejoin_caps`).
    Letter-spacing damage splits "IVAN" into "IV AN", and "AN" is a function
    word — so testing the raw line rejects exactly the bylines this exists to
    catch.
    """
    toks = [t.strip(".,;:()[]") for t in re.split(r"[\s,;]+", line) if t.strip(".,;:()[]")]
    content = [t for t in toks if t.lower() not in BYLINE_CONNECTORS]
    if not content:
        return False

    # The abstract test: a line whose capitalised words are mostly already in
    # the abstract is title text, because an author is rarely named in their
    # own abstract while the nouns of a title are almost always restated.
    words = [t.lower() for t in content if len(t) >= 3 and t[:1].isupper()]
    hits = sum(1 for w in words if w in abstract_words) if abstract_words else 0
    # A STRICT majority, and never on the strength of one word.
    #
    # `>= half` collapses to "any single hit" on a two-name byline: filtering
    # initials and digits leaves `['broadhurst', 'kreimer']`, and one match
    # satisfies `1 * 2 >= 2`. The old docstring defended "majority rather than
    # any single hit" — true of a long byline, false of exactly the short one
    # this test is usually asked about.
    in_abstract = bool(words and hits >= 2 and hits * 2 > len(words))

    # …and the veto does not apply at all to a line carrying INITIALS or
    # affiliation markers. Those are positive byline evidence that a title
    # continuation does not have, and they outrank the abstract heuristic,
    # whose premise — "an author is rarely named in their own abstract" — is
    # simply false in physics: `hep-th/0001202`'s abstract names both
    # Broadhurst and Kreimer, and that is ordinary self-reference.
    if RE_BYLINE_MARKER.search(line):
        in_abstract = False

    # Route 1, inherited: punctuation. A comma, "and" or "&" between names.
    # Kept because it is what catches the messy real-world byline — emails,
    # affiliations and daggers inline — which no name-shape test survives:
    # "Nori Jacoby (nori jacoby@hotmail.com) and Ruth Lawrence (...)". Dropping
    # it for the shape rule alone ran 104 titles on into their affiliations.
    #
    # The abstract veto is applied to this route ONLY when the sole signal is a
    # bare "and"/"&" with no comma. That is precisely the title-continuation
    # case — "...IN THE MIRROR OF THE PROJECTIVE" / "PLANE AND A BINODAL CUBIC
    # CURVE" — while a genuine multi-author byline separates with commas.
    # Vetoing the comma case as well cost 40 titles their stopping point, the
    # byline no longer being detected at all: "Modern Theory of Nuclear Forces
    # E. Epelbaum∗" ran on into "Forschungszentrum Jülich, Institut für ...".
    if RE_AUTHOR_HINT.search(line):
        if in_abstract and "," not in line:
            return False
        return True

    if in_abstract:
        return False

    # Route 2, new: name shape, for the single-author byline that carries no
    # punctuation at all and so was invisible to route 1.
    #
    # The token cap belongs to THIS route only. A real byline is often long and
    # messy — "Ma¨ ıté Dupuis1,∗ and Florian Girelli 2, 1,†" is nine tokens of
    # kerning damage, superscripts and affiliation markers — and route 1
    # already recognises it by its punctuation. Applying the cap to both routes
    # rejected those and let the title run on into the affiliation.
    if len(content) > 8:
        return False
    all_caps = line == line.upper()
    names: list[str] = []
    initials = 0
    for tok in content:
        low = tok.lower()
        # Particles are tested before the short-token rule, or "DE LA FACULTÉ"
        # banks two "initials" and passes as a byline.
        if low in NAME_PARTICLES:
            continue
        if len(tok) == 1 and tok.isalpha() and low not in ("a", "i"):
            initials += 1
            continue
        # In an ALL-CAPS line case carries no information and kerning damage is
        # the norm, so a one- or two-letter token is a fragment, not a word.
        # "IVAN SMITH" extracts as "IV AN SMITH" and the damage repeats in the
        # running heads, so "ivan" is never attested and `rejoin_caps` cannot
        # repair it; reading "AN" as the article rejects the byline outright.
        if all_caps and len(tok) <= 2 and tok.isalpha():
            initials += 1
            continue
        if low in TITLE_FUNCTION_WORDS:
            return False
        if not tok[:1].isupper():
            return False
        if len(tok) >= 3:
            names.append(low)

    if not names:
        return False
    # A lone capitalised word is a title continuation far more often than a
    # byline — "...FOR NUMBER" / "FIELDS" cost 23 titles their tail. Demand a
    # second name, or an initial beside it ("E. Epelbaum").
    return len(names) >= 2 or initials >= 1


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
    # Skip the CONTIGUOUS run of furniture at the top, and stop at the
    # first line that is not furniture. Taking the last furniture line
    # anywhere in the window instead — which this did — walks straight past
    # the title whenever any furniture is printed *below* it, and plenty
    # is: a DOI URL under the byline, a "Received ... Published online"
    # line, or an arXiv margin stamp that pypdf emits last because it is
    # rotated. Both cost the title outright.
    #
    #   0| arXiv:1105.1998v3 [math.CA] 16 Dec 2011
    #   1| ... SIGMA 7 (2011), 115, 11 pages          <- furniture
    #   2| A Connection Formula                       <- the title
    #   ...
    #   9| http://dx.doi.org/10.3842/SIGMA.2011.115   <- furniture, below it
    #
    # The old rule started at line 10.
    def furniture(l: str) -> bool:
        # "Chapter 5" / "Part II" / "Appendix A" head a book division and are
        # not the title. Left in, a bound chapter took "Chapter 5" as its
        # title and pushed its real one ("ROTH'S LEMMA") into the byline.
        if re.match(r"^(?:chapter|section|part|appendix)\s+[\dIVXLC]+\.?$", l, re.I):
            return True
        return bool(re.search(r"ar\s*X\s*iv", l, re.I) or RE_REPORT_NO.match(l))

    start = 0
    skipped = False
    for i, l in enumerate(lines[:16]):
        if not l:
            start = i + 1
            continue
        if furniture(l):
            start, skipped = i + 1, True
            continue
        # A bare journal name carries no volume or year to match on, so it
        # is unrecognisable on its own — but it sits INSIDE the furniture
        # run, with more furniture under it:
        #
        #   ISSN 1472-2739 (on-line) ...      furniture
        #   Algebraic & Geometric Topology    <- this line
        #   ATG                               furniture
        #   Volume 3 (2003) 537-556           furniture
        #   Published: 16 June 2003           furniture
        #   Skein-theoretical derivation      the title
        #
        # Only once something above it was already skipped, so a title
        # sitting on line 0 above a date line is never mistaken for one.
        #
        # The furniture run has to genuinely CONTINUE — both of the next two
        # non-empty lines — not merely have some furniture near it. Asking
        # for *any* furniture within two lines, which this did, matches the
        # commonest front matter there is and eats the title and the byline
        # together:
        #
        #   0| arXiv:hep-th/9310164v2  22 Jul 1998   furniture
        #   1| SPHERICAL CA TEGORIES                 <- the title
        #   2| John W. Barrett & Bruce W. Westbury   <- the byline
        #   3| 10 August 1993; revised 22 July 1998  furniture (a date)
        #
        # Line 3 is furniture, so line 1 was skipped for it, then line 2 for
        # the same line, and `start` landed on the abstract: no title, no
        # authors, nothing to fall back on. A byline is not furniture, so
        # requiring the run to continue tells the two layouts apart.
        nxt = [x for x in lines[i + 1:i + 6] if x][:2]
        if skipped and len(nxt) == 2 and all(furniture(x) for x in nxt):
            start = i + 1
            continue
        break

    # The document's own token set, used to decide whether an all-caps
    # split is real, and built from *repaired* text so an accented name
    # can attest its own join.
    #
    # Drawn from the whole document, not from `head`. Front matter is
    # exactly where the damage is — it is the part set in caps and
    # letter-spaced — so a two-page sample often fails to attest the very
    # names it needs. An author surname reappears unbroken in the running
    # heads and the bibliography, which is what makes the join decidable.
    vocab = Counter(w.lower() for w in
                    re.findall(r"[^\W\d_]{3,}", repair_text("\n".join(pages))))

    fix = lambda s: rejoin_caps(repair_text(s), vocab).strip(" .,")

    # The abstract's vocabulary, needed *before* the title/byline walk because
    # `looks_like_byline` uses it to tell a name from a title noun. Read
    # straight from page-1 text rather than from `meta["abstract"]`, which is
    # assembled further down and would make the two mutually dependent.
    abstract_words: set[str] = set()
    _am = re.search(r"\babstract\b\s*[.:—–-]?\s*", p1, re.I)
    if _am:
        _tail = p1[_am.end(): _am.end() + 2600]
        # Cut at the first section heading — the SAME cut `meta["abstract"]`
        # uses below, so the two cannot disagree about what the abstract is.
        #
        # A raw window overruns the abstract into the body, the author
        # addresses and the bibliography, and then "named in the abstract"
        # becomes "named anywhere on page 1" — which every author is.
        # `arxiv-math-0304010v1` lost its byline to exactly this: all four of
        # Vladimir/Ivanov/Grigori/Olshanski were found, so the veto fired at
        # full strength on a line that is nothing but names.
        _cut = re.search(
            r"\n\s*(?:1\s*\.?\s+Introduction\b|Introduction\b|Contents\b"
            r"|Keywords?\b|Key words\b|MSC\b|AMS\b|\d{4}\s+Mathematics)",
            _tail, re.I,
        )
        if _cut:
            _tail = _tail[: _cut.start()]
        abstract_words = {w.lower() for w in re.findall(r"[^\W\d_]{3,}", _tail)}

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
        # A numbered section heading or a table of contents ends the title,
        # even where the document carries no byline at all to stop it.
        if title_lines and RE_TITLE_STOP.match(l):
            break
        # An author line: capitalised, name-shaped, no trailing colon, and we
        # already have some title text. `looks_like_byline` is given the
        # *repaired* line — letter-spacing damage splits "IVAN" into "IV AN",
        # and "AN" reads as a function word, so the raw line rejects the very
        # bylines this is here to catch.
        if title_lines and RE_AUTHORS.match(l) and not l.endswith(":") \
                and len(l) < 120 \
                and looks_like_byline(fix(l), abstract_words):
            author_lines.append(l)
            break
        title_lines.append(l)
        if len(" ".join(title_lines)) > 180:
            break

    title = fix(" ".join(title_lines))
    meta["title"] = title or None
    authors = fix(" ".join(author_lines))
    meta["authors_raw"] = authors or None
    # The lines the title was assembled from, kept separately.
    #
    # Joining them destroys the one boundary that reliably separates a
    # title from its byline: the line break. `looks_like_byline` now makes
    # that test in-place, so the byline no longer silently lands in the
    # title — but the lines stay exported anyway. The case that motivated
    # them is real and unsolved by shape alone ("THEORY TOM BRIDGELAND" is
    # indistinguishable from "TORUS KNOT"); the byline test settles it with
    # the abstract's vocabulary, which is evidence, not proof. A consumer
    # that disagrees can still re-split on the original boundary.
    meta["title_lines"] = [fix(l) for l in title_lines] or None

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


def ocr_pages(path: str, outdir: str | None) -> list[str]:
    """Cached OCR text for this PDF, if `pdf-ocr.py` has been run on it.

    Read rather than generated: OCR costs seconds per page and needs
    binaries this script deliberately does not depend on, so producing it
    is a separate, explicit step.
    """
    base = outdir or os.path.dirname(os.path.abspath(path))
    for d in (os.path.join(base, "ocr"),
              os.path.join(base, slugify(os.path.splitext(os.path.basename(path))[0], 60), "ocr")):
        files = sorted(glob.glob(os.path.join(d, "page-*.txt")))
        if files:
            return [open(f, encoding="utf-8", errors="replace").read() for f in files]
    return []


def text_is_unusable(pages: list[str]) -> bool:
    """No text layer, or one that decoded through the wrong codec.

    The second case is why a length test is not enough: a JIS-encoded
    Japanese scan yields ~1,100 characters per page of
    `Fs=E2=7k$SL\\$Ncolored Jones`, which passes every "did we get text"
    check and is worth less than nothing downstream.
    """
    if not pages:
        return True
    mean = sum(len(p or "") for p in pages) / len(pages)
    if mean < 120:
        return True
    head = " ".join((p or "") for p in pages[:3])
    letters = sum(c.isalpha() for c in head)
    return bool(head) and letters < 0.55 * len(head)


def process(path: str, outdir: str | None = None, use_ocr: bool = False,
            ) -> tuple[dict[str, Any], list[Section]]:
    reader = PdfReader(path)
    pages = page_texts(reader)
    ocr_used = False
    if use_ocr and text_is_unusable(pages):
        cached = ocr_pages(path, outdir)
        if cached:
            pages, ocr_used = cached, True

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
            # Whether this artefact was built from OCR rather than from the
            # PDF's own text. A consumer that ranks or cites this document
            # should know the text is a transcription.
            "text_source": "ocr" if ocr_used else "embedded",
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
    ap.add_argument("--ocr", action="store_true",
                    help="for a PDF whose text layer is absent or mojibake, use the "
                         "cached OCR text written by pdf-ocr.py (which must be run first)")
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
            artefact, sections = process(path, args.outdir, args.ocr)
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
