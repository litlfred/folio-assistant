#!/usr/bin/env python3
"""
pdf-ocr — recover text from PDFs that `pdf-structure` cannot read.

Two kinds of document defeat text extraction entirely, and both are common
in an ingested corpus:

  * **A scan with no text layer.** `pypdf` returns 0 characters. The
    document is invisible to grep, has no title, and cannot be registered.
  * **A scan whose text layer is mojibake.** Older Japanese typesetting
    embeds a JIS-encoded font with no ToUnicode map, so extraction yields
    `Fs=E2=7k$SL\\$Ncolored Jones` — worse than nothing, because it looks
    like text and passes any "did we get characters" test.

This rasterises such documents and runs Tesseract over the images, caching
one text file per page beside the PDF. `pdf-structure.py --ocr` then reads
that cache instead of the embedded text.

## Why Tesseract and not a model-based OCR

Measured against this environment, not against benchmarks. Every
model-based option — PaddleOCR, docTR, Surya, EasyOCR — fetches weights
from Hugging Face on first run, and `huggingface.co` returns **403** here
(organisation policy). Tesseract's language data ships in Ubuntu packages,
so it installs from apt and runs entirely offline:

    apt-get install -y --no-install-recommends \\
        tesseract-ocr tesseract-ocr-eng tesseract-ocr-jpn \\
        poppler-utils poppler-data

`poppler-data` is not optional for CJK. Without it `pdftoppm` fails with
"Missing language pack for 'Adobe-Japan1' mapping" and produces no image
at all, so the OCR silently has nothing to read.

`rapidocr-onnxruntime` is the one model-based option that does work
offline — it ships its ONNX weights inside the wheel — and is the natural
second string if Tesseract's accuracy proves insufficient on a given
document class.

## Language

Passing the wrong language is not a small penalty: a Japanese page read as
English returns near-nothing. The language is guessed from Tesseract's own
orientation-and-script detection, which is cheap and does not need the
language pack for the script it detects. Override with `--lang`.

Script detection alone cannot tell languages that share a script apart:
French, Spanish and Portuguese are all `Latin`, Russian and Ukrainian are both
`Cyrillic`, Arabic and Persian are both `Arabic`. So a caller that knows the
document's languages passes them as `--lang-hint` (ISO 639 codes, as a Dublin
Core `dc.language.iso` carries them: `fr,en`). The hints are filtered to the
script the page shows, so a bilingual French/English record OCRs a French
page as `fra+eng`. A hinted language whose Tesseract pack is not installed is
an ERROR naming the package to install, never a silent fall back to English:
owner, 2026-11-10, "make sure OCR is language aware".

Right-to-left scripts (Arabic, Persian, Hebrew, Urdu) are recorded as such in
the run context (`direction: rtl`), so a later rule that reads lines or
margins can tell an RTL page from an LTR one instead of assuming LTR.

Usage:
    pdf-ocr.py <pdf> [-o OUTDIR] [--lang jpn+eng | --lang-hint fr,en] [--dpi 200] [--force]
    pdf-ocr.py --check            # report whether the tools are present
"""

from __future__ import annotations

import argparse
import glob
import os
import re
import shutil
import subprocess
import sys
import tempfile

# `-o` is the ROOT that `<doc-id>/` hangs off, the same meaning
# `pdf-structure.py -o` carries — and the doc-id is spelled by the SHARED
# helper so the two steps of one pipeline compose. Bean `rlp5`: this script
# used to write `<outdir>/ocr/` with no doc-id level, so a second scanned
# document overwrote the first page for page, silently, and
# `pdf-structure.py --ocr` looked somewhere this never wrote.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _pdf_doc_id import OCR_DIRNAME, derive_doc_id, ocr_cache_dir  # noqa: E402
import _run_context  # noqa: E402

# A page below this many characters is treated as having no usable text.
MIN_CHARS_PER_PAGE = 120
# Below this fraction of letters, the "text" is mojibake rather than prose.
MIN_ALPHA_RATIO = 0.55

SCRIPT_TO_LANG = {
    "Japanese": "jpn+eng",
    "HanS": "chi_sim+eng",
    "HanT": "chi_tra+eng",
    "Korean": "kor+eng",
    "Cyrillic": "rus+eng",
    "Greek": "ell+eng",
    "Arabic": "ara+eng",
    "Hebrew": "heb+eng",
    "Devanagari": "hin+eng",
    "Thai": "tha+eng",
}

# ISO 639-1 / 639-2 code (as `dc.language.iso` carries it) -> Tesseract pack.
ISO_TO_TESS = {
    "en": "eng", "eng": "eng", "fr": "fra", "fra": "fra", "fre": "fra",
    "es": "spa", "spa": "spa", "pt": "por", "por": "por", "de": "deu",
    "deu": "deu", "ger": "deu", "it": "ita", "ita": "ita", "nl": "nld",
    "ru": "rus", "rus": "rus", "uk": "ukr", "ukr": "ukr", "ar": "ara",
    "ara": "ara", "fa": "fas", "fas": "fas", "per": "fas", "ur": "urd",
    "he": "heb", "heb": "heb", "zh": "chi_sim+chi_tra", "zho": "chi_sim+chi_tra",
    "chi": "chi_sim+chi_tra", "ja": "jpn", "jpn": "jpn", "ko": "kor",
    "kor": "kor", "el": "ell", "ell": "ell", "hi": "hin", "hin": "hin",
    "th": "tha", "tr": "tur", "id": "ind", "vi": "vie", "sw": "swa",
}

# Which script each Tesseract pack writes in, as `--psm 0` names scripts.
TESS_SCRIPT = {
    "eng": "Latin", "fra": "Latin", "spa": "Latin", "por": "Latin",
    "deu": "Latin", "ita": "Latin", "nld": "Latin", "tur": "Latin",
    "ind": "Latin", "vie": "Latin", "swa": "Latin",
    "rus": "Cyrillic", "ukr": "Cyrillic", "ara": "Arabic", "fas": "Arabic",
    "urd": "Arabic", "heb": "Hebrew", "chi_sim": "Han", "chi_tra": "Han",
    "jpn": "Japanese", "kor": "Korean", "ell": "Greek", "hin": "Devanagari",
    "tha": "Thai",
}

RTL_SCRIPTS = {"Arabic", "Hebrew"}


def hint_packs(hints: list[str]) -> list[str]:
    """Tesseract packs for ISO 639 hints, in order, without repeats.

    `en_US` and `EN` read as `en`; an unknown code is dropped, because a
    record that names a language with no Tesseract model has nothing to ask
    for. Pure.
    """
    out: list[str] = []
    for h in hints:
        code = h.strip().lower().replace("-", "_").split("_")[0]
        for p in ISO_TO_TESS.get(code, "").split("+"):
            if p and p not in out:
                out.append(p)
    return out


def _script_family(script: str) -> str:
    """`HanS`/`HanT` are one family for matching against hints."""
    return "Han" if script.startswith("Han") else script


def choose_lang(script: str, hints: list[str], have: set[str]) -> tuple[str, list[str]]:
    """The `-l` value for a page whose detected script is `script`. Pure.

    Returns `(lang, missing)`: `missing` is the hinted packs the page needs
    that are not installed — the caller refuses on it rather than reading a
    French page as English. With no hints, the old script-only rule holds.
    """
    packs = hint_packs(hints)
    if packs:
        fam = _script_family(script)
        same = [p for p in packs if TESS_SCRIPT.get(p) == fam] if fam else []
        if fam == "Han" and same:
            # The detector does tell simplified from traditional.
            want = "chi_tra" if script == "HanT" else "chi_sim"
            same = [want] + [p for p in same if p != want and not p.startswith("chi_")]
        if not same:
            # The page's script matches no hinted language (or none was
            # detected): read it with every hinted pack.
            same = packs
        if "eng" in packs and "eng" not in same:
            same = same + ["eng"]
        missing = [p for p in same if p not in have]
        return "+".join(same), missing
    lang = SCRIPT_TO_LANG.get(script, "eng")
    # Fall back rather than fail: asking for a pack that is not installed
    # makes Tesseract exit non-zero and return nothing at all.
    kept = "+".join(p for p in lang.split("+") if p in have)
    return kept or "eng", []


def direction_of(lang: str) -> str:
    """`rtl` when the page's FIRST pack writes right to left, else `ltr`. Pure."""
    first = lang.split("+")[0]
    return "rtl" if TESS_SCRIPT.get(first) in RTL_SCRIPTS else "ltr"


def tools_present() -> dict[str, str | None]:
    return {t: shutil.which(t) for t in ("tesseract", "pdftoppm")}


def langs_present() -> set[str]:
    try:
        out = subprocess.run(["tesseract", "--list-langs"], capture_output=True,
                             text=True, timeout=30).stdout
    except Exception:
        return set()
    return {l.strip() for l in out.splitlines()[1:] if l.strip()}


def _first_line_version(cmd: list[str], pattern: str) -> str:
    """The version a tool prints about itself, or `unknown`."""
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
    except Exception:
        return "unknown"
    m = re.search(pattern, (r.stdout or "") + "\n" + (r.stderr or ""))
    return m.group(1) if m else "unknown"


def tessdata_dir() -> str | None:
    """Where Tesseract reads its language models from, as it reports it."""
    try:
        out = subprocess.run(["tesseract", "--list-langs"], capture_output=True,
                             text=True, timeout=30).stdout
    except Exception:
        return None
    m = re.search(r'"([^"]+)"', out.splitlines()[0] if out else "")
    return m.group(1) if m else os.environ.get("TESSDATA_PREFIX")


def _package_version(file: str) -> str | None:
    """The distribution package that owns `file`, where dpkg can say."""
    try:
        r = subprocess.run(["dpkg-query", "-S", file], capture_output=True, text=True, timeout=20)
        pkg = r.stdout.split(":", 1)[0].strip() if r.returncode == 0 else ""
        if not pkg:
            return None
        v = subprocess.run(["dpkg-query", "-W", "-f=${Version}", pkg],
                           capture_output=True, text=True, timeout=20).stdout.strip()
        return v or None
    except Exception:
        return None


def ocr_releases(langs: list[str]) -> list[dict]:
    """`releases[]` of a `folio-run-context/v1` for one OCR run (bean `turh`).

    The engine, the rasteriser, and each language model the run used — each
    with the sha256 of the bytes that ran. The model matters as much as the
    engine: Ubuntu's `tesseract-ocr-eng` and tessdata_best's `eng` are both
    "eng" and read the same page differently.
    """
    tools = tools_present()
    out = [
        _run_context.provisioned(
            "tesseract", _first_line_version(["tesseract", "--version"], r"tesseract\s+v?(\S+)"), tools["tesseract"]),
        _run_context.provisioned(
            "pdftoppm", _first_line_version(["pdftoppm", "-v"], r"pdftoppm version\s+(\S+)"), tools["pdftoppm"]),
    ]
    td = tessdata_dir()
    for lang in langs:
        f = os.path.join(td, f"{lang}.traineddata") if td else None
        if not f or not os.path.exists(f):
            out.append(_run_context.could_not_provision(
                f"tessdata-{lang}", "unknown", f"no {lang}.traineddata under {td or 'an unknown tessdata directory'}"))
            continue
        digest = _run_context.sha256_file(f) or ""
        version = _package_version(os.path.realpath(f)) or f"sha256-{digest[:12]}"
        out.append(_run_context.provisioned(f"tessdata-{lang}", version, f))
    return out


def write_ocr_run_context(pdf: str, root: str, cache: str, langs: list[str]) -> dict | None:
    """Record which software produced `cache`, beside it. None when no checkout can be named."""
    ctx = _run_context.build(
        invoker_script=os.path.abspath(__file__),
        releases=ocr_releases(langs),
        inputs=[pdf],
        where=[root, os.getcwd()],
    )
    if ctx is None:
        print(f"  warning: no git checkout found for {root}; ocr/{_run_context.RUN_CONTEXT_FILENAME} not written",
              file=sys.stderr)
        return None
    return _run_context.write(ctx, cache)


def is_mojibake(text: str) -> bool:
    """Text that decoded through the wrong codec.

    Distinct from "no text": the string is long, so a length test passes,
    but it is mostly punctuation and digits rather than letters.
    """
    if not text:
        return True
    letters = sum(c.isalpha() for c in text)
    return letters < MIN_ALPHA_RATIO * len(text)


def needs_ocr(pages: list[str]) -> tuple[bool, str]:
    """Decide from the embedded text alone, and say why."""
    if not pages:
        return True, "no pages could be read"
    total = sum(len(p or "") for p in pages)
    mean = total / len(pages)
    if mean < MIN_CHARS_PER_PAGE:
        return True, f"{int(mean)} chars/page — no text layer"
    head = " ".join((p or "") for p in pages[:3])
    if is_mojibake(head):
        return True, "text layer is mojibake — wrong codec"
    return False, f"{int(mean)} chars/page of readable text"


def detect_script(png: str) -> str:
    """Tesseract's orientation-and-script guess for one page, or ''."""
    try:
        out = subprocess.run(["tesseract", png, "stdout", "--psm", "0"], env=_tesseract_env(),
                             capture_output=True, text=True, timeout=90).stdout
    except Exception:
        return ""
    m = re.search(r"Script:\s*(\S+)", out)
    return m.group(1) if m else ""


def detect_lang(png: str, hints: list[str] | None = None) -> str:
    """The language to read `png` in: its script, narrowed by `hints`.

    Raises when a hinted pack the page needs is missing, naming the apt
    package, so a run never reads a page in a language it was not given.
    """
    lang, missing = choose_lang(detect_script(png), hints or [], langs_present())
    if missing:
        pkgs = " ".join("tesseract-ocr-" + p.replace("_", "-") for p in missing)
        raise RuntimeError(f"needs Tesseract language pack(s) {', '.join(missing)}: apt-get install {pkgs}")
    return lang


def ocr_pdf(pdf: str, root: str, lang: str | None, dpi: int,
            force: bool, hints: list[str] | None = None) -> tuple[int, str]:
    """Rasterise and OCR, caching one text file per page. Returns (pages, lang).

    `root` is the ROOT, not the cache directory: pages land in
    `root/<doc-id>/ocr/`. Two documents therefore cannot collide however many
    are OCR'd into one root — by construction rather than by the caller
    remembering to pass a different `-o` each time.
    """
    cache = ocr_cache_dir(root, pdf)
    os.makedirs(cache, exist_ok=True)
    done = sorted(glob.glob(os.path.join(cache, "page-*.txt")))
    # A cache counts only once a run has finished it. Pages are written one
    # at a time, so a run stopped part way left a few `page-*.txt` behind and
    # the next run reported them as the whole document (measured 2026-11-10:
    # 4 of 38 pages "cached" after an interrupted bulk ingest).
    if done and not force and len(done) == pdf_pages(pdf):
        return len(done), "cached"
    for f in done:
        os.remove(f)

    # A context left by an earlier run would describe software that did not
    # make the pages about to be written; remove it before they are.
    stale = os.path.join(cache, _run_context.RUN_CONTEXT_FILENAME)
    if os.path.exists(stale):
        os.remove(stale)
    with tempfile.TemporaryDirectory() as tmp:
        stem = os.path.join(tmp, "pg")
        r = subprocess.run(["pdftoppm", "-r", str(dpi), "-png", pdf, stem],
                           capture_output=True, text=True)
        pngs = sorted(glob.glob(stem + "*.png"))
        if not pngs:
            # The usual cause is a missing CMap pack, and the message goes
            # to stderr while the exit code stays 0 — so report it rather
            # than returning a silent zero.
            raise RuntimeError(
                f"pdftoppm produced no images: {(r.stderr or '').strip()[:200] or 'no output'}")
        # Detected per page when hints are given: a bilingual report is
        # often French on the left-hand pages and English on the right, or
        # one language per half, and page 1 alone would pick one for all.
        first = lang or detect_lang(pngs[0], hints)
        have_langs = langs_present()
        used: list[str] = []
        pages_meta: list[dict] = []
        for i, png in enumerate(pngs, 1):
            use = lang or (first if i == 1 or not hints else detect_lang(png, hints))
            if lang:
                try:
                    txt = subprocess.run(["tesseract", png, "stdout", "-l", use], capture_output=True,
                                         text=True, env=_tesseract_env(), timeout=PAGE_TIMEOUT).stdout
                except subprocess.TimeoutExpired:
                    print(f"  {os.path.basename(png)}: Tesseract ran past {PAGE_TIMEOUT}s; page left empty",
                          file=sys.stderr)
                    txt = ""
            else:
                txt, use = read_page(png, use, have_langs)
            open(os.path.join(cache, f"page-{i:03d}.txt"), "w",
                 encoding="utf-8").write(txt)
            for p in use.split("+"):
                if p not in used:
                    used.append(p)
            pages_meta.append({"page": i, "lang": use, "direction": direction_of(use)})
        # Per-page language and direction, beside the text, so a reader of
        # the pages need not assume left to right.
        import json as _json
        with open(os.path.join(cache, "languages.json"), "w", encoding="utf-8") as fh:
            _json.dump({"hints": hints or [], "forced": lang, "pages": pages_meta}, fh,
                       ensure_ascii=False, indent=1)
        use = "+".join(used)
        # Which software made these pages (bean `turh`). Written only for a
        # run that OCR'd: a cache hit was made by whatever ran then, and that
        # run's record is the one already beside it. Detection read the page
        # with `osd`, so it is a model this run used as well.
        models = use.split("+") + ([] if lang else ["osd"])
        write_ocr_run_context(pdf, root, cache, models)
        return len(pngs), use


# Below this mean word confidence a page is read again with a second script.
LOW_CONFIDENCE = 70.0
# A second read is kept only when it is this many points more confident.
MIN_GAIN = 10.0
# The scripts a page may mix in, one pack each, tried in this order.
SECOND_SCRIPTS = ["eng", "ara", "rus", "chi_sim", "fas"]
# A second-script read is an attempt to do better; it gets less time than the first.
SECOND_READ_TIMEOUT = 180


# One page's read may not run longer than this. Measured 2026-11-11 on the
# IRIS re-derive: four ingests side by side, each Tesseract left to start one
# OpenMP thread per core, read single A4 pages for over 30 minutes each (a
# normal read takes seconds). So Tesseract runs single-threaded unless the
# caller set OMP_THREAD_LIMIT, and a read past the limit is given up: a second-
# script retry is skipped, a first read leaves the page empty and says so.
PAGE_TIMEOUT = 600


def _tesseract_env() -> dict:
    env = dict(os.environ)
    env.setdefault("OMP_THREAD_LIMIT", "1")
    return env


def _ocr_with_confidence(png: str, lang: str, timeout: int = PAGE_TIMEOUT) -> tuple[str, float]:
    """Tesseract's text for `png` read as `lang`, and its mean word confidence (0-100).

    ("", -1.0) when the read ran past `timeout` seconds.
    """
    with tempfile.TemporaryDirectory() as tmp:
        base = os.path.join(tmp, "o")
        try:
            subprocess.run(["tesseract", png, base, "-l", lang, "txt", "tsv"], capture_output=True, text=True,
                           env=_tesseract_env(), timeout=timeout)
        except subprocess.TimeoutExpired:
            print(f"  {os.path.basename(png)}: Tesseract ({lang}) ran past {timeout}s; given up", file=sys.stderr)
            return "", -1.0
        try:
            txt = open(base + ".txt", encoding="utf-8").read()
        except OSError:
            return "", 0.0
        confs = []
        try:
            for row in open(base + ".tsv", encoding="utf-8").read().splitlines()[1:]:
                cols = row.split("\t")
                if len(cols) >= 12 and cols[11].strip():
                    try:
                        c = float(cols[10])
                    except ValueError:
                        continue
                    if c >= 0:
                        confs.append(c)
        except OSError:
            pass
    return txt, (sum(confs) / len(confs) if confs else 0.0)


def second_script_candidates(lang: str, have: set[str]) -> list[str]:
    """`lang` plus one more installed pack of ANOTHER script, for each such pack. Pure."""
    packs = lang.split("+")
    scripts = {TESS_SCRIPT.get(p) for p in packs}
    out = []
    for extra in SECOND_SCRIPTS:
        if extra in have and extra not in packs and TESS_SCRIPT.get(extra) not in scripts:
            out.append(f"{lang}+{extra}")
    return out


def read_page(png: str, lang: str, have: set[str]) -> tuple[str, str]:
    """One page's text, read again with a second script when the first read is unsure.

    Owner, 2026-11-11 (who-iris, card Q-ODD-1 = A). Tesseract reads a page in
    the script its detector names, and a page often holds two: the Arabic
    abstract of a French EMHJ article (10665/117378) read as `fra` came out as
    "er ie obus AU ball Aélroll"; the Latin URLs of an Arabic toolkit's
    references (10665/75211, page 221) read as `ara` came out as Arabic
    letters, mean word confidence 54. Read as `ara+eng` the same page gives
    "http://www.health.gov.au/internet/main/..." at confidence 86. So a page
    under LOW_CONFIDENCE is read again with each other installed script added,
    and the most confident read is kept when it gains MIN_GAIN points. A page
    the first read is sure of costs nothing more. Returns (text, lang used).
    """
    txt, conf = _ocr_with_confidence(png, lang)
    if conf >= LOW_CONFIDENCE or conf < 0:
        return txt, lang  # sure enough, or the page outran the time limit: no retry
    best = (txt, conf, lang)
    for cand in second_script_candidates(lang, have):
        t, c = _ocr_with_confidence(png, cand, timeout=SECOND_READ_TIMEOUT)
        if c > best[1]:
            best = (t, c, cand)
    if best[1] - conf >= MIN_GAIN:
        return best[0], best[2]
    return txt, lang


def pdf_pages(pdf: str) -> int | None:
    """The PDF's page count from `pdfinfo` (poppler, already required), or None."""
    try:
        out = subprocess.run(["pdfinfo", pdf], capture_output=True, text=True, timeout=60).stdout
    except Exception:
        return None
    m = re.search(r"^Pages:\s+(\d+)", out, re.M)
    return int(m.group(1)) if m else None


def read_cache(root: str, pdf: str) -> list[str]:
    """The cached OCR text for one PDF, one entry per page, or [] if none.

    Takes the PDF as well as the root, because the cache is keyed on the
    DOCUMENT. It previously took only a directory and read `<dir>/ocr/`, which
    is what made the cache un-addressable once two documents shared a root.
    """
    files = sorted(glob.glob(os.path.join(ocr_cache_dir(root, pdf), "page-*.txt")))
    return [open(f, encoding="utf-8", errors="replace").read() for f in files]


def main() -> int:
    ap = argparse.ArgumentParser(description="OCR a PDF that has no usable text layer")
    ap.add_argument("pdfs", nargs="*")
    ap.add_argument("-o", "--outdir", metavar="ROOT",
                    help="root that <doc-id>/ocr/ hangs off, the same ROOT "
                         "pdf-structure.py -o takes (default: beside the PDF)")
    ap.add_argument("--lang", help="tesseract language, e.g. jpn+eng (default: detect)")
    ap.add_argument("--lang-hint", default="",
                    help="the document's languages as ISO 639 codes, e.g. fr,en "
                         "(from dc.language.iso); narrows detection, refuses missing packs")
    ap.add_argument("--dpi", type=int, default=200)
    ap.add_argument("--force", action="store_true", help="re-OCR even if cached")
    ap.add_argument("--check", action="store_true", help="report tool availability and exit")
    args = ap.parse_args()

    tools = tools_present()
    if args.check:
        for t, p in tools.items():
            print(f"  {t:<10} {p or 'MISSING'}")
        have = sorted(langs_present())
        print(f"  languages  {', '.join(have) if have else 'none'}")
        return 0 if all(tools.values()) else 1

    missing = [t for t, p in tools.items() if not p]
    if missing:
        # Get it rather than route around it (skill `finding-software`): the
        # command installs exactly what this script declares it needs.
        sys.exit(f"pdf-ocr: needs {', '.join(missing)} — "
                 "bun run cat software:ensure --for scripts/pdf-ocr.py")

    for pdf in args.pdfs:
        root = args.outdir or os.path.dirname(os.path.abspath(pdf))
        try:
            hints = [h for h in args.lang_hint.split(",") if h.strip()]
            n, lang = ocr_pdf(pdf, root, args.lang, args.dpi, args.force, hints)
            # Name the directory, because it is no longer the one the caller
            # passed and a reader should not have to derive it.
            rel = os.path.join(derive_doc_id(pdf), OCR_DIRNAME)
            print(f"  {os.path.basename(pdf)}: {n} pages ({lang}) -> {rel}/")
        except Exception as e:
            print(f"  {os.path.basename(pdf)}: FAILED — {e}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
