"""An inferred table of contents has to justify itself. Bean `6xaz`.

`scripts/pdf-structure.py` reads a table of contents from the PDF's embedded
outline when there is one and otherwise INFERS it from heading-shaped lines.
Both used to be emitted with the same authority, and `sections/` recorded
neither, so a consumer could not tell them apart without re-reading
`structure.json`.

**Measured 2026-09-19 on `uploads/WPR-RDO-2020-003-eng.pdf`** (WHO WPRO style
guide, 33pp, no outline): 11 of 13 inferred sections were named after A
DIFFERENT PUBLICATION — 'FACILITY LEVEL: Improving hospital planning and
management', '2.1 Goal - Hospitals as a path to UHC' — scraped off page 22,
which is a SAMPLE TABLE the guide reproduces as a design example. Every one was
stamped `page: 22`, so the collision was visible in the output and nothing
acted on it.

That is worse than shipping nothing. `content/docs/document-ingestion/` argues
an un-ingested source is worse than an absent one "because it produces false
confidence rather than a gap"; a misnamed section is that failure one level in,
because it is greppable, it sits in `library/`, and it answers a question
wrongly with authority.

## What these tests hold

1. The detector fires on a list scraped off one or two pages.
2. **It never touches an outline.** A PDF's own outline is the document's
   answer; `9789241548960_eng.pdf`'s 250 sections must survive untouched. This
   is the falsifier the work was done against, and it is the arm most worth
   keeping.
3. A short document is not condemned for having nowhere else to put its
   headings.
4. End to end over a built PDF whose second page is a sample table: the sample
   does not become the document's structure.
"""
import importlib.util
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
SCRIPTS = os.path.dirname(HERE)
ROOT = os.path.dirname(SCRIPTS)
sys.path.insert(0, SCRIPTS)


def load(name: str):
    """A hyphenated script as a module — not importable by name, loaded by path."""
    spec = importlib.util.spec_from_file_location(
        "_t_" + name.replace("-", "_").replace(".py", ""), os.path.join(SCRIPTS, name)
    )
    assert spec and spec.loader, name
    mod = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = mod
    spec.loader.exec_module(mod)
    return mod


def build_sample_table_pdf(path: str) -> bool:
    """
    A three-page PDF: body, then a page reproducing another publication's
    contents as a worked example, then more body.

    Built with reportlab if present and otherwise by hand — the repository
    declares no PDF WRITER, and a fixture that needs an undeclared dependency
    is one CI cannot build.
    """
    pages = [
        "INTRODUCTION\n\nThis guide explains house style for publications.\n"
        + ("Body text about style and usage. " * 40),
        # The sample table: a whole other publication's contents, on one page.
        "OVERVIEW OF ACTION AREAS AND DOMAINS\n"
        "FACILITY LEVEL: Improving hospital planning\n"
        "1.1 Accountability\n"
        "1.2 Efficiency\n"
        "1.3 Quality\n"
        "2.1 Goal As A Path To Uhc\n"
        "2.2 Governance Of Services\n"
        "3.1 Workforce Planning\n"
        "3.2 Financing Arrangements\n",
        "PAGINATION\n\n" + ("More body text about page numbering. " * 40),
    ]
    try:
        return _write_pdf(path, pages)
    except Exception as exc:                                    # pragma: no cover
        print(f"  NOTE could not build the fixture PDF ({exc}) — arm 4 did not run")
        return False


def _write_pdf(path: str, pages: list[str], outline: list[tuple[str, int]] | None = None) -> bool:
    """
    A minimal text-only PDF, one content stream per page, no dependencies.

    `outline` writes a real `/Outlines` tree — `(title, 1-based page)` — which
    is what lets a test build the case the corpus does not contain: a document
    whose OWN outline is concentrated on one page. Without it, "an outline is
    never second-guessed" can only be checked against a document whose outline
    happens to be spread, and a mutation that second-guesses outlines survives.
    """
    objs: list[bytes] = []

    def add(b: bytes) -> int:
        objs.append(b)
        return len(objs)

    font = add(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
    kids, contents = [], []
    for text in pages:
        lines = []
        y = 760
        for raw in text.splitlines():
            # Wrap so long paragraphs become several show-text operations
            # rather than one line running off the page.
            for i in range(0, max(len(raw), 1), 95):
                chunk = raw[i:i + 95].replace("\\", "").replace("(", "").replace(")", "")
                lines.append(f"BT /F1 11 Tf 1 0 0 1 56 {y} Tm ({chunk}) Tj ET")
                y -= 14
                if y < 50:
                    break
            if y < 50:
                break
        stream = "\n".join(lines).encode("latin-1", "replace")
        contents.append(add(b"<< /Length %d >>\nstream\n%s\nendstream" % (len(stream), stream)))
    pages_obj = len(objs) + len(pages) + 1
    for c in contents:
        kids.append(add(
            b"<< /Type /Page /Parent %d 0 R /MediaBox [0 0 612 792] "
            b"/Resources << /Font << /F1 %d 0 R >> >> /Contents %d 0 R >>"
            % (pages_obj, font, c)
        ))
    tree = add(b"<< /Type /Pages /Kids [%s] /Count %d >>"
               % (b" ".join(b"%d 0 R" % k for k in kids), len(kids)))
    assert tree == pages_obj, (tree, pages_obj)
    if outline:
        # Reserve the /Outlines object so items can name it as /Parent.
        outlines_obj = len(objs) + len(outline) + 1
        items = []
        for title, pageno in outline:
            t = title.replace("\\", "").replace("(", "").replace(")", "")
            items.append(add(
                b"<< /Title (%s) /Parent %d 0 R /Dest [%d 0 R /Fit] >>"
                % (t.encode("latin-1", "replace"), outlines_obj,
                   kids[min(pageno, len(kids)) - 1])
            ))
        for i, obj in enumerate(items):
            extra = b""
            if i:
                extra += b" /Prev %d 0 R" % items[i - 1]
            if i + 1 < len(items):
                extra += b" /Next %d 0 R" % items[i + 1]
            objs[obj - 1] = objs[obj - 1][:-3] + extra + b" >>"
        got = add(b"<< /Type /Outlines /First %d 0 R /Last %d 0 R /Count %d >>"
                  % (items[0], items[-1], len(items)))
        assert got == outlines_obj, (got, outlines_obj)
        root = add(b"<< /Type /Catalog /Pages %d 0 R /Outlines %d 0 R >>" % (tree, outlines_obj))
    else:
        root = add(b"<< /Type /Catalog /Pages %d 0 R >>" % tree)

    out = bytearray(b"%PDF-1.4\n")
    offsets = [0]
    for i, body in enumerate(objs, start=1):
        offsets.append(len(out))
        out += b"%d 0 obj\n" % i + body + b"\nendobj\n"
    xref = len(out)
    out += b"xref\n0 %d\n0000000000 65535 f \n" % (len(objs) + 1)
    for off in offsets[1:]:
        out += b"%010d 00000 n \n" % off
    out += (b"trailer\n<< /Size %d /Root %d 0 R >>\nstartxref\n%d\n%%%%EOF\n"
            % (len(objs) + 1, root, xref))
    with open(path, "wb") as fh:
        fh.write(bytes(out))
    return True


def main() -> int:
    rc = 0

    def check(label: str, cond: bool) -> None:
        nonlocal rc
        print(f"  {'ok  ' if cond else 'FAIL'} {label}")
        if not cond:
            rc = 1

    pdf = load("pdf-structure.py")
    E = pdf.TocEntry

    def entries(pages: list[int]) -> list:
        return [E(1, f"Heading {i}", p, "inferred", None) for i, p in enumerate(pages)]

    print("\n1. the detector fires on a list scraped off a page or two")
    # The shape measured on WPR-RDO-2020-003-eng: almost every entry claiming
    # the page the sample table sits on.
    scraped = entries([22] * 11 + [3, 29])
    frac, pgs = pdf.toc_concentration(scraped)
    check(f"concentration is measured, not guessed (got {frac:.0%} on {pgs})",
          frac >= 0.8 and 22 in pgs)
    verdict = pdf.inferred_toc_verdict(scraped, 33)
    check("a scraped list is UNDETERMINED", verdict is not None)
    check("and the verdict says why, in numbers a reader can re-derive",
          verdict is not None and "13" in verdict and "%" in verdict and "22" in verdict)

    print("\n2. a real document's headings are spread through its body")
    spread = entries([3, 9, 14, 21, 28, 35, 44, 51, 60])
    check("a spread TOC is trusted", pdf.inferred_toc_verdict(spread, 64) is None)

    print("\n3. the guards")
    check("under five entries, concentration carries no information",
          pdf.inferred_toc_verdict(entries([7, 7, 7, 7]), 40) is None)
    check("a document with nowhere else to put its headings is not condemned",
          pdf.inferred_toc_verdict(entries([1, 1, 1, 2, 2, 2]), 2) is None)
    check("one threshold, not two spellings of it",
          pdf.TOC_MAJORITY == 0.6 and pdf.TOC_MAX_CONCENTRATED_PAGES == 2)

    print("\n4. end to end: a sample table does not become the structure")
    tmp = os.path.join(ROOT, "scripts", "tests", ".toc-verdict-fixture.pdf")
    built = build_sample_table_pdf(tmp)
    if built:
        try:
            artefact, sections = pdf.process(tmp, backend="auto")
            titles = " | ".join(s.title for s in sections)
            check(f"toc_source is 'undetermined', not 'inferred' (got {artefact['toc_source']!r})",
                  artefact["toc_source"] == "undetermined")
            check("the sample table's headings are NOT the document's sections",
                  "Accountability" not in titles and "Uhc" not in titles)
            check("the reason is recorded for a person to check",
                  bool(artefact.get("toc_undetermined_reason")))
            check("how many entries were inferred is reported either way",
                  artefact["diagnostics"].get("toc_inferred_entries", 0) >= 5)
            check("the text is still there — refusing a TREE is not discarding the DOCUMENT",
                  artefact["diagnostics"]["chars_total"] > 500)
        except ImportError as exc:
            # ONLY a missing backend is an environment fact. Catching `Exception`
            # here reported an AttributeError in this very file as "no usable
            # backend" — a defect wearing a skip's clothing, which is the exact
            # confusion this bean is about.
            print(f"  NOTE no usable PDF backend here ({exc}) — arm 4 proved nothing")
        finally:
            try:
                os.remove(tmp)
            except OSError:
                pass

    print("\n5. sections/ carries its OWN toc_source")
    # The second half of the bean, and the half that serves BOTH failure shapes:
    # a consumer reading `sections/*.md` could not tell an inferred tree from an
    # outline-derived one without going back to `structure.json`, and the two are
    # not comparable in trustworthiness. `sections/` is what gets read, quoted
    # and cited, so the provenance has to be on it.
    import tempfile
    for src in ("outline", "inferred", "undetermined"):
        with tempfile.TemporaryDirectory() as d:
            artefact = {
                "doc_id": "d", "metadata": {"title": "T"}, "toc_source": src,
                "source": {"file": "d.pdf", "sha256": "0" * 64},
            }
            sec = pdf.Section("sec-001-a", None, "A", 1, 1, 2, 3, 1, "body")
            pdf.write_sections(d, artefact, [sec])
            body = open(os.path.join(d, "sections", "sec-001-a.md")).read()
            check(f"a section written from a {src!r} TOC says so",
                  f"toc_source: {src}" in body)

    print("\n6. an outline is never second-guessed, even a CONCENTRATED one")
    # The property, not one document. The handbook's outline is spread over 179
    # pages, so a mutation that ran the verdict against outlines too would leave
    # it passing — measured, and the mutation survived until this arm existed.
    # The corpus contains no concentrated outline, so the test builds one.
    tmp2 = os.path.join(ROOT, "scripts", "tests", ".toc-verdict-outline.pdf")
    body = ["Chapter text. " * 60, "Glossary entries. " * 60, "Index. " * 60]
    concentrated = [(f"Entry {i}", 2) for i in range(9)]
    if _write_pdf(tmp2, body, outline=concentrated):
        try:
            art, _ = pdf.process(tmp2, backend="auto")
            check(f"a 9-entry outline all on page 2 is still 'outline' "
                  f"(got {art['toc_source']!r}, {len(art['toc'])} entries)",
                  art["toc_source"] == "outline")
            check("and no verdict is recorded against it",
                  art.get("toc_undetermined_reason") is None)
        except ImportError as exc:
            print(f"  NOTE no usable PDF backend here ({exc}) — arm 6 proved nothing")
        finally:
            try:
                os.remove(tmp2)
            except OSError:
                pass

    print("\n7. and the real handbook, end to end — the falsifier this was built against")
    handbook = os.path.join(ROOT, "uploads", "9789241548960_eng.pdf")
    if os.path.exists(handbook):
        artefact, sections = pdf.process(handbook, backend="auto")
        check(f"the handbook still reports 'outline' (got {artefact['toc_source']!r})",
              artefact["toc_source"] == "outline")
        check(f"and still yields its 250 sections (got {len(sections)})", len(sections) == 250)
        check("no verdict is recorded against an outline",
              artefact.get("toc_undetermined_reason") is None)
    else:
        # Never silently. An absent fixture is an untested claim, not a pass.
        print("  NOTE uploads/9789241548960_eng.pdf absent — the falsifier arm did not run")

    print()
    print("  all checks passed" if rc == 0 else "  FAILURES above")
    return rc


if __name__ == "__main__":
    sys.exit(main())
