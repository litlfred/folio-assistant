"""Extraction quality checks from the IRIS pilot. Owner, 2026-11-11 (who-iris, card Q-ODD-1 = A).

"force OCR when a page's text layer fails a quality check", "split single
blocks that hold a whole book", and "also foot notes/marks". Each case below
is a shortened copy of text measured on an IRIS PDF (named beside it), so the
checks can run without the PDFs.

## What these tests hold

1. `_text_quality.page_problem` flags the five broken text layers measured,
   and passes ordinary pages in the same languages, including a page of
   initials and list marks, a statistical table and a formula with Greek.
2. `pdf-structure.py` drops machine bookmark names from an outline and sets the
   outline aside when nothing usable is left or under half of it is printed.
3. An oversized section is cut at the headings inside it, else where the
   chapter in its running heads changes, else by page, and a
   section of ordinary length is left alone.
4. Failing pages, and only those, are replaced from the OCR cache.
5. `pdf-ocr.py` tries a second script only from another script family, and
   puts back Latin words a non-Latin read turned into digits.
6. `pdf-footnotes.py` recognises a foot-of-page note opening with a mark, and
   not a line of body-size text.
7. Inferred headings that do not read as headings are rejoined (a title cut to
   its last line) or dropped (a body word, a reference's author, a diagram's
   labels, a figure or table caption), and a page drawn out of print order is read in print order.
"""
import importlib.util
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
SCRIPTS = os.path.dirname(HERE)
sys.path.insert(0, SCRIPTS)


def load(name: str):
    spec = importlib.util.spec_from_file_location("_t_" + name.replace("-", "_").replace(".py", ""), os.path.join(SCRIPTS, name))
    assert spec and spec.loader, name
    mod = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = mod  # dataclasses look their module up here
    spec.loader.exec_module(mod)
    return mod


def main() -> int:
    rc = 0

    def check(what: str, ok: bool) -> None:
        nonlocal rc
        print(("  ok    " if ok else "  FAIL  ") + what)
        if not ok:
            rc = 1

    import _text_quality as q

    french_ok = ("L'utilisation du thiomersal comme conservateur pour vaccins. L'OMS approuve la déclaration "
                 "faite le 7 juillet 1999 par l'American Academy of Pediatrics et le Service de santé publique "
                 "des États-Unis concernant l'élimination progressive du thiomersal, un composé chimique contenant "
                 "du mercure utilisé en quantités infimes dans certains procédés de fabrication des vaccins. ") * 2
    check("plain French passes", q.page_problem(french_ok, ["fr", "en"]) is None)
    split_ar = ("ال ج د و ل ب ل د ا ن نامي ت أ خر ى صفحة " * 12)
    check("10665/192500: Arabic letters placed apart fail", "one letter" in (q.page_problem(split_ar, ["ar"]) or ""))
    whole_ar = ("الجدول البلدان النامية الأخرى في الصفحة التالية تقرير مرحلي وتقييمي للبرنامج الموسع " * 6)
    check("ordinary Arabic passes", q.page_problem(whole_ar, ["ar"]) is None)
    greek = french_ok.replace("é", "Θ").replace("'", "Æ")
    check("10665/231031: accents mapped to Greek fail", "Greek" in (q.page_problem(greek, ["fr", "en"]) or ""))
    formula = ("The rate α was estimated with confidence β and a variance σ for each country in the region. " * 6)
    check("a formula's Greek letters in English pass", q.page_problem(formula, ["en"]) is None)

    split = ("D'u ne m anière générale, à m esu re qu e le PIB par habitant au g m ente, la part de celu i-ci "
             "qu i est consacrée à la santé au g m ente au ssi et la part des dépenses de santé cou vertes par "
             "le secteu r pu blic au g m ente égalem ent. De nom breu x systèm es de santé sont com partim entés. ") * 3
    check("10665/83270: words split by kerning fail", "stray single letter" in (q.page_problem(split, ["fr"]) or ""))
    refs = ("A. Ahmed, B. Latoundji and C. D. Smith (eds). a) first item; b) second item. J. Med. Res. 12(3). "
            "WHO. Global report on hepatitis. Geneva: World Health Organization; 2024. ") * 6
    check("initials and list marks pass", q.page_problem(refs, ["en"]) is None)

    bold = ("剂量 剂量 剂量 剂量 标准的儿童接种剂量为 疫苗采购 疫苗采购 疫苗采购 疫苗采购 在大多数国家 疫苗基金 "
            "会资助的 疫苗都通过联 合国儿童基金会采购 ") * 8
    check("10665/66977-chi: fake bold fails", "repeat" in (q.page_problem(bold, ["zh"]) or ""))

    persian_bad = "زؾتٹضاٮ ٗٳ٭ ټبی ثطای ٚطثبٮ٫طی ٸ زضٲبٴ يبی ٗبت پیف ؾط َبٶی رٽت پیك٫یطی اظ ؾط َبٴ ؾطٸی٧ؽ " * 6
    check("10665/94830-per: wrong Arabic code points fail",
          "alphabet" in (q.page_problem(persian_bad, ["fa"]) or ""))
    persian_ok = "دستورالعمل های سازمان جهانی بهداشت برای غربالگری و درمان ضایعات پیش سرطانی جهت پیشگیری از سرطان سرویکس " * 6
    check("plain Persian passes", q.page_problem(persian_ok, ["fa"]) is None)

    mojibake = ("¤EG 14 øe IóàªŸG ¶ ¹ » « ¬ ­ ® ¯ ° ± ² ³ ´ µ ¶ · ¸ ¹ º » ¼ ½ ¾ ¿ " * 12)
    check("a font with no Unicode mapping fails", "mojibake" in (q.page_problem(mojibake, ["ar"]) or ""))
    table = ("Germany 1 090 000 2 000 000 3 100 000 ... 12.5% 13.1% (2015–2020) ................ 45 " * 10)
    check("a table of digits and dot leaders passes", q.page_problem(table, ["en"]) is None)
    check("a near-blank page is not judged", q.page_problem("12", ["en"]) is None)

    s = load("pdf-structure.py")
    E = s.TocEntry
    pages = ["Introduction\nSome text here about the topic.\n", "Methods\nMore text.\n", "Results\nEven more.\n"]
    junk = [E(1, "_tyjcwt", 1, "outline"), E(1, "_Hlk62546849", 2, "outline"), E(1, "Blank Page", 3, "outline")]
    kept, why = s.trusted_outline(junk, pages)
    check("an outline of bookmark names is set aside", kept == [] and "machine bookmark" in (why or ""))
    real = [E(1, "Introduction", 1, "outline"), E(1, "_GoBack", 1, "outline"), E(1, "Methods", 2, "outline"), E(1, "Results", 3, "outline")]
    kept, why = s.trusted_outline(real, pages)
    check("bookmark names are dropped and real entries kept", [e.title for e in kept] == ["Introduction", "Methods", "Results"] and why is None)
    english = [E(1, "Chapter 1. Introduction and approach", 1, "outline"), E(1, "Chapter 2. Identification", 2, "outline")]
    kept, why = s.trusted_outline(english, ["Глава 1. Введение\n", "Глава 2. Выявление\n"])
    check("an outline the pages do not print is set aside", kept == [] and "name a heading" in (why or ""))
    check("merged file names are machine bookmarks", s.machine_bookmark("9789241547727_eng_Chapter1-4"))

    n = 40
    book = [f"Page {i} " + "word " * 400 for i in range(1, n + 1)]
    whole = s.Section("sec-000-document", None, "Document", 1, 1, n, 0, 400 * n, "")
    out, rep = s.split_oversized([whole], book, [])
    check("a whole-book section with no headings is split by page", len(out) == n and rep and rep[0]["by"] == "pages")
    check("a whole document split by page is titled Page N", out[3].title == "Page 4")
    book[9] = "Part Two\n" + book[9]
    book[24] = "Part Three\n" + book[24]
    heads = [E(1, "Part Two", 10, "inferred"), E(1, "Part Three", 25, "inferred")]
    big = s.Section("sec-005-part-one", None, "Part One", 1, 2, n, 0, 15000, "")
    out, rep = s.split_oversized([big], book, heads)
    check("an oversized section is cut at the headings inside it", rep and rep[0]["by"] == "headings"
          and [x.title for x in out][:3] == ["Part One", "Part Two", "Part Three"])
    # 10665/75211: three volumes in one PDF, the contents page lists Part 1
    # only. Each page prints its part at the top and its chapter at the foot;
    # the oversized tail is cut where the chapter changes, not page by page.
    import _pdf_headings as ph
    def L(page, text, top):
        y0 = 15 if top else 750
        return ph.Line(page, text, 9.0, False, False, False, "F", 1.0, 50, y0, 400, y0 + 9, 792, 612)
    margins = []
    for pg in range(1, n + 1):
        part = "Toolkit • Part 1: Vision" if pg < 20 else "Toolkit • Part 2: Action plan"
        chapter = "Chapter 1. Context" if pg < 12 else "Annex G. Definitions" if pg < 20 else \
            "Chapter 2. Manage" if pg < 31 else "Chapter 3. Engage"
        margins += [L(pg, part, True), L(pg, f"{chapter} » page {pg}", False),
                    ph.Line(pg, "body " * 10, 10.0, False, False, False, "F", 1.0, 50, 300, 500, 310, 792, 612)]
    margins = [m for m in margins if not (m.page in (20, 21) and m.y0 > 700)]  # a part's cover and its title page
    tail = s.Section("sec-009-annex-g", None, "Definitions", 1, 12, n, 0, 12000, "")
    out, rep = s.split_oversized([tail], book, [], margins)
    check("an oversized section with running heads is cut where the chapter changes",
          rep and rep[0]["by"] == "running heads"
          and [(x.title, x.page_start, x.page_end) for x in out] == [
              ("Annex G. Definitions", 12, 19), ("Toolkit • Part 2: Action plan", 20, 21),
              ("Chapter 2. Manage", 22, 30), ("Chapter 3. Engage", 31, 40)])
    small = s.Section("sec-001-intro", None, "Intro", 1, 2, 4, 0, 900, "")
    out, rep = s.split_oversized([small], book, heads)
    check("a section of ordinary length is left alone", out == [small] and rep == [])

    got, replaced = s.replace_failing_pages([french_ok, greek], ["ocr one", "ocr two"], ["fr"])
    check("only the failing page is taken from OCR", got == [french_ok, "ocr two"] and [r["page"] for r in replaced] == [2])
    got, replaced = s.replace_failing_pages([french_ok, greek], ["ocr one"], ["fr"])
    check("an incomplete OCR cache replaces nothing", got == [french_ok, greek] and replaced == [])

    p354 = ["Antecedentes\nTexto del cuerpo de la sección.\n1.2\t\nFunción de la salud digital en el \n"
            "fortalecimiento del sistema sanitario y la \ncobertura sanitaria universal\nLa meta de la Cobertura "
            "Sanitaria Universal es garantizar la calidad.\n"]
    wrapped = E(1, "sanitaria universal", 1, "inferred")
    fixed, rep = s.tidy_inferred([wrapped], p354)
    check("10665/354399: a title cut to its last line is rejoined up to its number",
          len(fixed) == 1 and fixed[0].number == "1.2" and fixed[0].title.startswith("Función de la salud digital")
          and fixed[0].title.endswith("cobertura sanitaria universal") and rep[0]["action"] == "rejoined")
    p353 = ["Texte.\n4.1 \t Identifier et sélectionner les interventions  \nde santé numérique pour les défis prioritaires  \n"
            "liés au système de santé\nAu cours des vingt dernières années.\n"]
    fixed, rep = s.tidy_inferred([E(1, "liés au système de santé", 1, "inferred")], p353)
    check("10665/353150: a number on the title's first line is found too",
          len(fixed) == 1 and fixed[0].number == "4.1" and fixed[0].title.startswith("Identifier et sélectionner"))
    words = [E(1, "un", 1, "inferred"), E(1, "On", 1, "inferred"), E(1, "YOUNG,", 1, "inferred", "10"),
             E(1, "Programme", 1, "inferred"), E(1, "un", 1, "outline")]
    kept, rep = s.tidy_inferred(words, ["un On YOUNG, Programme\n"])
    check("10665/264857: body words set apart by a font are not headings; an outline entry is kept",
          [(e.title, e.source) for e in kept] == [("Programme", "inferred"), ("un", "outline")])
    caps = [E(1, "CHAPITRE 5 : PLANIFIER LA MISE EN ŒUVRE", 75, "inferred"),
            E(1, "Schéma 5.1. Composants essentiels de la mise en œuvre", 78, "inferred"),
            E(1, "Tableau 5.2. Considérations illustratives", 78, "inferred"),
            E(1, "Encadré 5.1.1. Ressource sur la gestion du matériel", 81, "inferred"),
            E(2, "Considérations relatives à l'infrastructure", 81, "inferred", "5.1"),
            E(1, "Figure 3", 9, "outline")]
    kept, rep = s.tidy_inferred(caps, [""] * 90)
    check("10665/353150: figure, table and box captions from a contents page are not headings",
          [e.title for e in kept] == ["CHAPITRE 5 : PLANIFIER LA MISE EN ŒUVRE",
                                      "Considérations relatives à l'infrastructure", "Figure 3"])
    sec = lambda t, p, w: s.Section("sec-001-x", None, t, 1, p, p, 0, w, "")
    flow = [sec("Annexe 1", 18, 103), sec("Suivre les lignes", 18, 22), sec("Demander un nouvel", 18, 6),
            sec("Analyse ultérieure", 18, 6), sec("Annexe 2", 19, 46), sec("ANNEXES", 19, 0)]
    check("10665/329296: a run of short sections on one page is a diagram's labels",
          s.label_runs(flow) == {("Suivre les lignes", 18), ("Demander un nouvel", 18), ("Analyse ultérieure", 18)})
    parts = [sec("Promote, prevent and protect maternal and perinatal health", 9, 1), sec("Antenatal care", 9, 3),
             sec("Nutrition", 9, 400)]
    check("10665/259268: a part heading over its first chapter heading is not a label", s.label_runs(parts) == set())

    late = "The CFE enabled WHO to respond.\n" + "body line\n" * 30 + "OVERVIEW\nAbout the WHO Contingency Fund\n"
    early = "OVERVIEW\nAbout the WHO Contingency Fund\nThe CFE enabled WHO to respond.\n" + "body line\n" * 30
    ov = [E(1, "OVERVIEW", 1, "outline"), E(2, "About the WHO Contingency Fund", 1, "outline")]
    got, redone = s.print_order_pages([late], ov, lambda i: early)
    check("10665/342236: a page whose headings come last in its text is read in print order",
          got == [early] and redone == [1])
    got, redone = s.print_order_pages([early], ov, lambda i: late)
    check("a page already in print order is left alone", got == [early] and redone == [])

    class Rect: x0, width = 0.0, 595.0
    class Page:
        rect = Rect()
        def __init__(self, blocks): self.blocks = blocks
        def get_text(self, kind): return self.blocks
    p72 = Page([(45, 56, 287, 155, "left column\n", 0, 0), (304, 56, 551, 155, "right column\n", 1, 0),
                (45, 188, 268, 214, "4.5 Contrôle des progrès\n", 2, 0)])
    check("10665/353150 p72: a heading under both columns stays after them",
          s.print_order_text(p72).split("\n")[:3] == ["left column", "right column", "4.5 Contrôle des progrès"])
    p11 = Page([(305, 127, 440, 146, "Replenishing the CFE\n", 0, 0), (43, 128, 250, 141, "Table 1\n", 1, 0),
                (47, 146, 286, 159, "Event\n", 2, 0), (305, 154, 554, 232, "The CFE was conceived\n", 3, 0)])
    check("10665/342236 p11: a table row touching the band above stays in its column",
          s.print_order_text(p11).split("\n")[:4] == ["Table 1", "Event", "Replenishing the CFE", "The CFE was conceived"])
    p17 = Page([(305, 105, 558, 777, "15. Mazanderani\n", 0, 0), (40, 34, 251, 102, "RÉFÉRENCES\n", 1, 0),
                (40, 106, 291, 780, "1. UNAIDS\n", 2, 0)])
    check("10665/329296 p17: two columns under a heading read left column first",
          s.print_order_text(p17).split("\n")[:3] == ["RÉFÉRENCES", "1. UNAIDS", "15. Mazanderani"])
    refs = [E(1, "RÉFÉRENCES BIBLIOGRAPHIQUES", 1, "inferred")]
    stored = "15. Mazanderani AH.\n" * 12 + "RÉFÉRENCES BIBLIOGRAPHIQUES\n" + "1. UNAIDS.\n" * 13
    printed = "17\nRÉFÉRENCES BIBLIOGRAPHIQUES\n" + "1. UNAIDS.\n" * 13 + "15. Mazanderani AH.\n" * 12
    got, redone = s.print_order_inferred([stored], refs, None, lambda i: printed)
    check("10665/329296: a heading under half way down an inferred page still triggers the print-order read",
          redone == [1] and got[0].lstrip("17\n").startswith("RÉFÉRENCES"))
    mid = "body line\n" * 12 + "RÉFÉRENCES BIBLIOGRAPHIQUES\n" + "1. UNAIDS.\n" * 13
    got, redone = s.print_order_inferred([mid], refs, None, lambda i: mid)
    check("a heading truly in mid page is left where it is", got == [mid] and redone == [])

    o = load("pdf-ocr.py")
    have = {"ara", "eng", "fra", "rus", "chi_sim", "fas"}
    check("an Arabic page may add Latin, Cyrillic, Han", o.second_script_candidates("ara", have) == ["ara+eng", "ara+rus", "ara+chi_sim"])
    check("a French page may add Arabic but not English", "fra+eng" not in o.second_script_candidates("fra", have)
          and "fra+ara" in o.second_script_candidates("fra", have))
    # 10665/94830-per page 28: read as Persian only, "HIV" came out as "۳۱۱۷";
    # read as fas+eng it is "HIV" at 95, beside English junk at 42-72.
    w = lambda t, c, x: {"text": t, "conf": c, "box": (x, 10, 40, 12), "line": (1, 1, 1)}
    primary = [w("وضعیت", 90, 100), w("۳۱۱۷", 88, 60), w("منفی", 91, 10)]
    mixed = [w("وضعیت", 90, 100), w("HIV\u200f", 95, 60), w("Shee", 42, 10)]
    check("a sure Latin word replaces the digits read under it, junk does not",
          o.latin_rescues(primary, mixed) == [("۳۱۱۷", "HIV")])
    check("a word of the page's own script is never replaced",
          o.latin_rescues([w("یا", 90, 10)], [w("La", 90, 10)]) == [])
    check("only a read with eastern digits gets the second read", o.RE_EASTERN_DIGITS.search("زنان ۲۱۷ منفی")
          and not o.RE_EASTERN_DIGITS.search("زنان منفی ۴"))

    calls = []
    real = o._ocr_with_confidence
    o._ocr_with_confidence = lambda png, lang, timeout=0: (calls.append(lang), ("", -1.0))[1]
    check("a page that outran the time limit is not read again in other scripts",
          o.read_page("p.png", "fra", have) == ("", "fra") and calls == ["fra"])
    o._ocr_with_confidence = real
    check("Tesseract runs single-threaded unless told otherwise",
          o._tesseract_env().get("OMP_THREAD_LIMIT") == os.environ.get("OMP_THREAD_LIMIT", "1"))

    f = load("pdf-footnotes.py")
    span = lambda t, size, flags=0, y1=100.0: {"text": t, "size": size, "flags": flags, "bbox": [0, y1 - size, 10, y1]}
    note = {"spans": [span("3", 6, 1), span(" Resolution WHA58.28 (2005): www.who.int", 8)], "size": 8, "y0": 700, "y1": 710,
            "text": "3 Resolution WHA58.28 (2005): www.who.int"}
    check("a small line opening with a superscript mark is a note", f.note_start(note, 10.0) == ("3", "Resolution WHA58.28 (2005): www.who.int"))
    body = {"spans": [span("3 countries reported", 10)], "size": 10, "y0": 700, "y1": 710, "text": "3 countries reported"}
    check("a line of body-size text is not a note", f.note_start(body, 10.0) is None)

    if rc == 0:
        print("all checks passed")
    return rc


if __name__ == "__main__":
    raise SystemExit(main())
