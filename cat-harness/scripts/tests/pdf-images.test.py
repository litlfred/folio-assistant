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


def ts_threshold() -> float:
    src = open(os.path.join(ROOT, "schemas", "document-image.ts"), encoding="utf-8").read()
    m = re.search(r"PAGE_COVERAGE_THRESHOLD\s*=\s*([0-9.]+)", src)
    assert m, "PAGE_COVERAGE_THRESHOLD not found in document-image.ts — did it move?"
    return float(m.group(1))


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

    print()
    print("  all checks passed" if rc == 0 else "  FAILURES above")
    return rc


if __name__ == "__main__":
    sys.exit(main())
