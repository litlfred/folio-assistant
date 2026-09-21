"""The scan/figure rule is spelled twice; these pin it. Bean `d5f1`.

`roleFor` in `schemas/document-image.ts` decides what a consumer believes an
image is. `role_for` in `scripts/pdf-images.py` decides what gets written down.
They are in different languages, so nothing but a test holds them together.

This is the same shape as `scripts/tests/pdf-pages-outline.test.py`, and for
the same reason: earlier the same day, an outline rule spelled in two places
drifted silently and reported 35 entries of journal furniture as 19 usable
chapters. Two spellings are affordable only while something checks them.

The threshold is READ out of both sources rather than restated here. A literal
`0.8` in this file would be a third spelling, which is the defect itself.
"""
import importlib.util
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
SCRIPTS = os.path.dirname(HERE)
ROOT = os.path.dirname(SCRIPTS)
sys.path.insert(0, SCRIPTS)


def load(name: str):
    spec = importlib.util.spec_from_file_location(
        "_t_" + name.replace("-", "_").replace(".py", ""), os.path.join(SCRIPTS, name)
    )
    assert spec and spec.loader, name
    mod = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = mod
    spec.loader.exec_module(mod)
    return mod


def ts_const(name: str) -> float:
    """Read a threshold OUT of the TypeScript. Restating one here is the defect."""
    src = open(os.path.join(ROOT, "schemas", "document-image.ts"), encoding="utf-8").read()
    m = re.search(name + r"\s*=\s*([0-9.]+)", src)
    assert m, f"{name} not found in document-image.ts — did it move?"
    return float(m.group(1))


def ts_threshold() -> float:
    return ts_const("PAGE_COVERAGE_THRESHOLD")


# (coverage, images_on_page, expected role). Drawn from the corpus, not invented:
# 0.998 is WHO_PUB_TPS_93.1, 0.495 is the half-page figure in 9789241548960_eng,
# 0.013 is the median in WPR-RDO-2020-003-eng, 0.008 is milnorlink's one figure.
CASES = [
    (0.998, 1, "page-scan"),
    (1.000, 1, "page-scan"),
    (0.495, 1, "figure"),
    (0.013, 3, "figure"),
    (0.008, 1, "figure"),
    # A full-bleed image is NOT a page scan when it shares its page: something
    # else is on that page, so the image is not the page.
    (0.998, 2, "figure"),
    (0.000, 1, "figure"),
]


# (coverage, images_on_page, expected role) INSIDE a capture rung. Drawn from
# the six browser prints under uploads/, measured 2026-09-21 -- not invented:
# 0.000183 is the smallest of the 104 in `Agent Skills - Google Antigravity
# Docs`, 0.005804 is the single image in `Skills in OpenAI API` and the LARGEST
# nav-chrome value anywhere in the corpus, 0.139632 is the smallest real figure
# (`Equipping agents... - Anthropic`) and 0.361098 the largest (`Skill
# authoring best practices - Claude Platform Docs`).
CAPTURE_CASES = [
    (0.000183, 26, "chrome"),
    (0.000936, 26, "chrome"),
    (0.005804, 1, "chrome"),
    (0.139632, 6, "figure"),
    (0.361098, 3, "figure"),
    # A browser print can still place a full-bleed image alone on a page, and
    # that image is the page. The rung does not change what full-bleed means.
    (0.998, 1, "page-scan"),
]


def main() -> int:
    rc = 0

    def check(label: str, cond: bool) -> None:
        nonlocal rc
        print(f"  {'ok  ' if cond else 'FAIL'} {label}")
        if not cond:
            rc = 1

    images = load("pdf-images.py")
    ts, py = ts_threshold(), images.PAGE_COVERAGE_THRESHOLD
    check(f"both sources declare the threshold  (ts={ts} py={py})", bool(ts and py))
    check("the two thresholds agree", ts == py)

    for coverage, on_page, expected in CASES:
        got = images.role_for(coverage, on_page)
        check(f"coverage {coverage:<6} x{on_page} -> {expected} (got {got})", got == expected)

    # The boundary is a boundary, not a vibe. Read off the threshold so this
    # keeps testing the edge if the threshold ever moves.
    check("at the threshold exactly, alone on the page, it is a scan",
          images.role_for(py, 1) == "page-scan")
    check("a hair below the threshold it is a figure",
          images.role_for(py - 1e-9, 1) == "figure")

    # Absence is never inferred. With no backend the sidecar must say so.
    from pathlib import Path
    sidecar = images.extract(Path("does-not-exist.pdf"), Path("library"), dry_run=True)
    check("an unopenable PDF yields images=None, not []", sidecar["images"] is None)
    check("...and says why", bool(sidecar.get("undetermined_reason")))

    # --- the capture rung, bean `r8br` / issue #722 -----------------------
    cap_ts, cap_py = ts_const("CAPTURE_CHROME_THRESHOLD"), images.CAPTURE_CHROME_THRESHOLD
    check(f"both sources declare the chrome bound  (ts={cap_ts} py={cap_py})", bool(cap_ts and cap_py))
    check("the two chrome bounds agree", cap_ts == cap_py)
    check("the chrome bound sits below the page bound", cap_py < py)

    # The detector needs BOTH signals. Skia alone is "a Chromium-family
    # renderer" -- Android and Flutter emit it too -- not "a browser printed a
    # web page". Each row is a real producer/creator pair from this corpus.
    DETECT = [
        ("Skia/PDF m152", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", True),
        ("pikepdf 8.15.1", "arXiv GenPDF (tex2pdf)", False),
        ("Atypon Systems, Inc.", "PDFplus", False),
        ("Pixel Translations (PIXPDF Ver.4.2.48)", "", False),
        ("", "", False),
        # Half the evidence is not the evidence. Both of these fail SAFE: the
        # images stay `figure` and keep blocking, rather than being
        # reclassified on one signal.
        ("Skia/PDF m152", "Some Other Tool", False),
        ("pikepdf 8.15.1", "Mozilla/5.0 (Macintosh)", False),
    ]
    for producer, creator, expected in DETECT:
        got = images.is_capture_print(producer, creator)
        check(f"capture? {producer[:22]!r:26} + {creator[:20]!r:24} -> {expected}", got == expected)

    for coverage, on_page, expected in CAPTURE_CASES:
        got = images.role_for(coverage, on_page, True)
        check(f"capture  {coverage:<9} x{on_page} -> {expected} (got {got})", got == expected)

    # The rung is the ONLY thing that changes these. Outside it, every capture
    # case must classify exactly as it did before `chrome` existed -- this is
    # what proves a typeset PDF is untouched.
    for coverage, on_page, _ in CAPTURE_CASES:
        outside = images.role_for(coverage, on_page, False)
        legacy = "page-scan" if (coverage >= py and on_page == 1) else "figure"
        check(f"outside the rung {coverage:<9} x{on_page} -> {legacy} (got {outside})", outside == legacy)

    check("at the chrome bound exactly it is a figure, not chrome",
          images.role_for(cap_py, 2, True) == "figure")
    check("a hair below the chrome bound it is chrome",
          images.role_for(cap_py - 1e-9, 2, True) == "chrome")

    # End to end on the corpus, when it is present.
    milnor = os.path.join(ROOT, "uploads", "milnorlink.pdf")
    if os.path.exists(milnor):
        s = images.extract(Path(milnor), Path("library"), dry_run=True)
        if s["images"] is None:
            print("       NOTE: no PDF backend here, so the end-to-end arm proved nothing.")
        else:
            roles = {}
            for i in s["images"]:
                roles[i["role"]] = roles.get(i["role"], 0) + 1
            check(f"milnorlink: 19 page-scan + 1 figure (got {roles})",
                  roles.get("page-scan") == 19 and roles.get("figure") == 1)
            # Every decided entry shows its working — the `nso8` rule the
            # schema enforces, checked here on real output rather than fixtures.
            check("every decided entry carries its basis",
                  all(("basis" in i) == (i["role"] != "undetermined") for i in s["images"]))
            check("no page scan carries a narrative slot",
                  all("narrative" not in i for i in s["images"] if i["role"] == "page-scan"))
            check("every figure does",
                  all("narrative" in i for i in s["images"] if i["role"] == "figure"))
    else:
        print("  NOTE uploads/milnorlink.pdf absent — the end-to-end arm did not run")

    # End to end on a real BROWSER PRINT. The cases above exercise `role_for`,
    # which could be perfectly right while `extract` never passes `capture` --
    # so this arm is the one that proves the rung is actually wired. Guarded
    # like the arm above: these live in the folio's uploads/, one level out.
    folio_root = os.path.dirname(ROOT)
    captures = [
        # (file, expected roles) -- measured 2026-09-21.
        ("Agent Skills - Google Antigravity Docs.pdf", {"chrome": 104}),
        # The one that matters most: a browser print whose images are REAL
        # figures. If the bound ever drifts up, this is what goes red -- a
        # change that made everything chrome would pass the promotion gate and
        # be worse than the bug it fixed.
        ("Equipping agents for the real world with Agent Skills _ Anthropic.pdf", {"figure": 6}),
    ]
    ran_capture = False
    for name, expected in captures:
        path = os.path.join(folio_root, "uploads", name)
        if not os.path.exists(path):
            continue
        s2 = images.extract(Path(path), Path("library"), dry_run=True)
        if s2["images"] is None:
            continue
        ran_capture = True
        roles = {}
        for i in s2["images"]:
            roles[i["role"]] = roles.get(i["role"], 0) + 1
        check(f"{name[:34]}: {expected} (got {roles})", roles == expected)
        check("...every entry carries a CAPTURE basis, naming the producer",
              all(i.get("basis", {}).get("method") == "capture"
                  and i["basis"].get("producer") for i in s2["images"]))
        check("...no chrome entry carries a narrative slot",
              all("narrative" not in i for i in s2["images"] if i["role"] == "chrome"))
        check("...every figure still does",
              all("narrative" in i for i in s2["images"] if i["role"] == "figure"))
    if not ran_capture:
        print("  NOTE no browser-print capture present — the capture end-to-end arm did not run")

    print()
    print("  all checks passed" if rc == 0 else "  FAILURES above")
    return rc


if __name__ == "__main__":
    sys.exit(main())
