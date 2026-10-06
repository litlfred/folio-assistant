"""A table of contents inferred from the LAYOUT, not from plain text. Issue #2302.

`pdf-structure.py` used to infer a missing outline with regular expressions over
plain page text, which has thrown away what makes a heading visible: it is set
larger, bolder, in capitals or in italics. `_pdf_headings.py` reads the text
WITH its font metrics. Over the 13 corpus PDFs that carry an outline, hidden and
used as the answer key (`toc-benchmark.py`), title F1 went from 0.30 to 0.86.

## What these tests hold

1. Prominent type is a heading; body text, running heads, captions and
   inline bold emphasis are not.
2. The IEEE convention — "I. INTRODUCTION" in small capitals and "A. Search
   strategy" in italics, both at body size and weight — is found, at two levels.
3. Levels are depths in a tree, so a rare style ranked between two common ones
   does not leave gaps (1, 3, 5).
4. A section number set in its own box is re-joined to its title, and not to a
   neighbouring column.
5. A printed contents page is parsed, and its printed page labels are moved to
   physical pages by finding the titles in the body.
6. A title that merely BEGINS "Table of Contents ..." does not end the front
   matter (measured on ICDAR2013-ToC.pdf, whose title and byline came out as
   sections).
7. The benchmark's metric: an identical TOC scores 1, and an outline that omits
   the chapter level is the same hierarchy (constant shift), not a zero.
8. End to end: `pdf-structure.py` on a PDF with no outline records
   `toc_inferred_method: "font"` and the headings. Skipped without PyMuPDF.
9. The benchmark reads Grobid's TEI-XML: depth from the head's `n`, page from
   its `coords`, body heads only.

Synthetic `Line`s carry every case but the last, so nothing here needs a PDF
library or a corpus file.
"""
import importlib.util
import os
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
SCRIPTS = os.path.dirname(HERE)
sys.path.insert(0, SCRIPTS)

import _pdf_headings as H  # noqa: E402


def load(name: str):
    spec = importlib.util.spec_from_file_location(
        "_t_" + name.replace("-", "_").replace(".py", ""), os.path.join(SCRIPTS, name)
    )
    assert spec and spec.loader, name
    mod = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = mod
    spec.loader.exec_module(mod)
    return mod


PAGE_H, PAGE_W = 800.0, 600.0


def ln(page, y, text, size=10.0, bold=False, italic=False, x0=72.0, uniform=1.0):
    return H.Line(page, text, size, bold, italic, H._caps(text), "Times", uniform,
                  x0, y, x0 + 6 * len(text), y + size, PAGE_H, PAGE_W)


def body(page, y0, n=6):
    return [ln(page, y0 + 14 * i, "the body of the text runs on in ordinary type here and there") for i in range(n)]


def titles(heads):
    return [(h.level, h.title) for h in heads]


def test_prominent_type_is_a_heading_and_noise_is_not():
    lines = []
    for p in range(1, 7):
        lines.append(ln(p, 20, "Journal of Examples, vol. 3", size=8))       # running head (margin, repeats)
        lines += body(p, 120)
    lines[1:1] = [ln(1, 60, "Abstract")]
    lines.insert(3, ln(1, 100, "1 Introduction", size=14, bold=True))
    lines += [ln(3, 100, "2 Method", size=14, bold=True),
              ln(3, 300, "2.1 Data", size=12, bold=True),
              ln(4, 300, "Figure 3: a picture of the method", size=12, bold=True),
              ln(4, 400, "important point in bold", bold=True),
              ln(5, 100, "3 Results", size=14, bold=True)]
    lines.sort(key=lambda l: (l.page, l.y0))
    got = titles(H.font_headings(lines))
    assert got == [(1, "Introduction"), (1, "Method"), (2, "Data"), (1, "Results")], got


def test_ieee_small_caps_and_italic_headings():
    lines = [ln(1, 60, "Abstract—we study things.", size=9, bold=True, uniform=1.0)]
    lines += [ln(1, 100, "I. INTRODUCTION")] + body(1, 120)
    lines += [ln(2, 100, "II. METHOD")] + body(2, 120)
    lines += [ln(2, 300, "A. Search strategy", italic=True)] + body(2, 320)
    lines += [ln(3, 100, "III. RESULTS")] + body(3, 120)
    got = titles(H.font_headings(lines))
    assert got == [(1, "INTRODUCTION"), (1, "METHOD"), (2, "Search strategy"), (1, "RESULTS")], got


def test_levels_are_tree_depths():
    raw = [H.Heading(1, "A", 1, None), H.Heading(3, "B", 1, None), H.Heading(5, "C", 2, None),
           H.Heading(3, "D", 3, None), H.Heading(1, "E", 4, None)]
    assert [h.level for h in H.tree_levels(raw)] == [1, 2, 3, 2, 1]


def test_bare_number_rejoined_to_its_title_only():
    num = ln(1, 100, "2.1", size=12, bold=True, x0=72)
    title = ln(1, 100, "Autonomous Agent", size=12, bold=True, x0=100)
    far = ln(1, 200, "3", size=10, x0=72)
    other_col = ln(1, 200, "Next column text", size=10, x0=330)
    out = H._join_same_baseline([num, title, far, other_col])
    assert [l.text for l in out] == ["2.1 Autonomous Agent", "3", "Next column text"], [l.text for l in out]


def test_contents_page_parsed_and_linked_to_physical_pages():
    # Physical page 2 is the contents; printed page 1 is physical page 4.
    contents = [ln(2, 60, "Contents", size=14, bold=True)]
    entries = [("1 Introduction", 1, 72), ("1.1 Scope", 2, 90), ("2 Methods", 3, 72),
               ("2.1 Data", 3, 90), ("3 Results", 5, 72), ("References", 7, 72)]
    for i, (t, pg, x) in enumerate(entries):
        contents.append(ln(2, 100 + 20 * i, f"{t} {'.' * 20} {pg}", x0=x))
    lines = [ln(1, 100, "A Report", size=20)] + contents
    for i, (t, pg, _) in enumerate(entries):
        lines += [ln(pg + 3, 80 + i, t, size=14, bold=True)] + body(pg + 3, 120, 3)
    heads = H.contents_headings(lines)
    got = [(h.level, h.title, h.page) for h in heads]
    assert got == [(1, "Introduction", 4), (2, "Scope", 5), (1, "Methods", 6),
                   (2, "Data", 6), (1, "Results", 8), (1, "References", 10)], got
    assert H.layout_headings(lines)[1] == "contents"


def test_title_beginning_table_of_contents_is_front_matter():
    lines = [ln(1, 80, "Table of Contents Recognition and Extraction", size=22),
             ln(1, 120, "Zhaohui Wu, Prasenjit Mitra", size=11),
             ln(1, 160, "Abstract—Existing work on book contents.", size=9, bold=True)]
    lines += body(1, 200) + [ln(1, 400, "I. INTRODUCTION")] + body(1, 420)
    lines += [ln(2, 100, "II. RELATED WORK")] + body(2, 120)
    got = [h.title for h in H.font_headings(lines)]
    assert got == ["INTRODUCTION", "RELATED WORK"], got


def test_metric_identity_and_constant_level_shift():
    tb = load("toc-benchmark.py")
    gold = [H.Heading(1, "Introduction", 1, None), H.Heading(2, "Scope", 1, None),
            H.Heading(1, "Methods", 2, None)]
    s = tb.score(gold, gold)
    assert s["title_f1"] == 1 and s["level_f1"] == 1 and s["teds"] == 1, s
    shifted = [h._replace(level=h.level + 1) for h in gold]
    s = tb.score(gold, shifted)
    assert s["level_f1"] == 1, s
    s = tb.score(gold, [])
    assert s["title_f1"] == 0, s


def test_grobid_tei_heads_read_with_depth_and_page():
    tb = load("toc-benchmark.py")
    tei = """<TEI xmlns="http://www.tei-c.org/ns/1.0"><text><body>
      <div><head n="1" coords="1,72,90,200,12">Introduction</head><p>x</p></div>
      <div><head n="2.1" coords="3,72,90,200,12">Data   sets</head></div>
      <div><head>Acknowledgements</head></div>
    </body><back><div><head>Not a body head</head></div></back></text></TEI>"""
    with tempfile.TemporaryDirectory() as d:
        path = os.path.join(d, "x.tei.xml")
        with open(path, "w") as f:
            f.write(tei)
        got = [(h.level, h.title, h.page, h.number) for h in tb._tei_headings(path)]
    assert got == [(1, "Introduction", 1, "1"), (2, "Data sets", 3, "2.1"),
                   (1, "Acknowledgements", None, None)], got


def test_nougat_markdown_heads_read_as_a_tree():
    tb = load("toc-benchmark.py")
    mmd = "# A Title\n\ntext\n\n## 1 Introduction\n\n```\n# not a heading\n```\n#### 1.1 Scope\n## 2 Methods\n"
    with tempfile.TemporaryDirectory() as d:
        path = os.path.join(d, "x.mmd")
        with open(path, "w") as f:
            f.write(mmd)
        got = [(h.level, h.title, h.number) for h in tb._mmd_headings(path)]
    assert got == [(1, "A Title", None), (2, "Introduction", "1"), (3, "Scope", "1.1"),
                   (2, "Methods", "2")], got


def test_pdf_structure_records_the_layout_method():
    try:
        import pymupdf
    except ImportError:
        print("  SKIP end-to-end: pymupdf not installed")
        return
    ps = load("pdf-structure.py")
    filler = "Ordinary body text continues for a while on this page. " * 3
    with tempfile.TemporaryDirectory() as d:
        path = os.path.join(d, "no-outline.pdf")
        doc = pymupdf.open()
        for title in ("Introduction", "Background", "Results", "Discussion"):
            page = doc.new_page()
            page.insert_text((72, 100), title, fontsize=16, fontname="hebo")
            for i in range(12):
                page.insert_text((72, 140 + 16 * i), filler[:90], fontsize=10, fontname="helv")
        doc.save(path)
        artefact, _ = ps.process(path, backend="pymupdf")
    assert artefact["toc_source"] == "inferred", artefact["toc_source"]
    assert artefact["diagnostics"]["toc_inferred_method"] == "font", artefact["diagnostics"]
    got = [(e["title"], e["page"]) for e in artefact["toc"]]
    assert got == [("Introduction", 1), ("Background", 2), ("Results", 3), ("Discussion", 4)], got


def main() -> int:
    tests = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    failed = 0
    for t in tests:
        try:
            t()
            print(f"PASS {t.__name__}")
        except AssertionError as e:
            failed += 1
            print(f"FAIL {t.__name__}: {e}")
    print(f"{len(tests) - failed}/{len(tests)} passed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
