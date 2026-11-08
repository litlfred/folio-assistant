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

Usage:
    pdf-ocr.py <pdf> [-o OUTDIR] [--lang jpn+eng] [--dpi 200] [--force]
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
}


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


def detect_lang(png: str) -> str:
    """Guess the language from Tesseract's script detection."""
    try:
        out = subprocess.run(["tesseract", png, "stdout", "--psm", "0"],
                             capture_output=True, text=True, timeout=90).stdout
    except Exception:
        return "eng"
    m = re.search(r"Script:\s*(\S+)", out)
    script = m.group(1) if m else ""
    lang = SCRIPT_TO_LANG.get(script, "eng")
    have = langs_present()
    # Fall back rather than fail: asking for a pack that is not installed
    # makes Tesseract exit non-zero and return nothing at all.
    kept = "+".join(p for p in lang.split("+") if p in have)
    return kept or "eng"


def ocr_pdf(pdf: str, root: str, lang: str | None, dpi: int,
            force: bool) -> tuple[int, str]:
    """Rasterise and OCR, caching one text file per page. Returns (pages, lang).

    `root` is the ROOT, not the cache directory: pages land in
    `root/<doc-id>/ocr/`. Two documents therefore cannot collide however many
    are OCR'd into one root — by construction rather than by the caller
    remembering to pass a different `-o` each time.
    """
    cache = ocr_cache_dir(root, pdf)
    os.makedirs(cache, exist_ok=True)
    done = sorted(glob.glob(os.path.join(cache, "page-*.txt")))
    if done and not force:
        return len(done), "cached"

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
        use = lang or detect_lang(pngs[0])
        for i, png in enumerate(pngs, 1):
            txt = subprocess.run(["tesseract", png, "stdout", "-l", use],
                                 capture_output=True, text=True).stdout
            open(os.path.join(cache, f"page-{i:03d}.txt"), "w",
                 encoding="utf-8").write(txt)
        # Which software made these pages (bean `turh`). Written only for a
        # run that OCR'd: a cache hit was made by whatever ran then, and that
        # run's record is the one already beside it. Detection read the page
        # with `osd`, so it is a model this run used as well.
        models = use.split("+") + ([] if lang else ["osd"])
        write_ocr_run_context(pdf, root, cache, models)
        return len(pngs), use


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
            n, lang = ocr_pdf(pdf, root, args.lang, args.dpi, args.force)
            # Name the directory, because it is no longer the one the caller
            # passed and a reader should not have to derive it.
            rel = os.path.join(derive_doc_id(pdf), OCR_DIRNAME)
            print(f"  {os.path.basename(pdf)}: {n} pages ({lang}) -> {rel}/")
        except Exception as e:
            print(f"  {os.path.basename(pdf)}: FAILED — {e}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
