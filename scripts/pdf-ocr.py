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


def ocr_pdf(pdf: str, outdir: str, lang: str | None, dpi: int,
            force: bool) -> tuple[int, str]:
    """Rasterise and OCR, caching one text file per page. Returns (pages, lang)."""
    cache = os.path.join(outdir, "ocr")
    os.makedirs(cache, exist_ok=True)
    done = sorted(glob.glob(os.path.join(cache, "page-*.txt")))
    if done and not force:
        return len(done), "cached"

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
        return len(pngs), use


def read_cache(outdir: str) -> list[str]:
    """The cached OCR text, one entry per page, or [] if there is none."""
    files = sorted(glob.glob(os.path.join(outdir, "ocr", "page-*.txt")))
    return [open(f, encoding="utf-8", errors="replace").read() for f in files]


def main() -> int:
    ap = argparse.ArgumentParser(description="OCR a PDF that has no usable text layer")
    ap.add_argument("pdfs", nargs="*")
    ap.add_argument("-o", "--outdir", help="where to write ocr/ (default: beside the PDF)")
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
        sys.exit(f"pdf-ocr: needs {', '.join(missing)} — "
                 "apt-get install -y --no-install-recommends "
                 "tesseract-ocr tesseract-ocr-eng poppler-utils poppler-data")

    for pdf in args.pdfs:
        out = args.outdir or os.path.dirname(os.path.abspath(pdf))
        try:
            n, lang = ocr_pdf(pdf, out, args.lang, args.dpi, args.force)
            print(f"  {os.path.basename(pdf)}: {n} pages ({lang})")
        except Exception as e:
            print(f"  {os.path.basename(pdf)}: FAILED — {e}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
