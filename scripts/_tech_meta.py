"""Technical facts about an ingested file — one definition, shared by the rungs.

Bean `nso8`. `pdf-structure.py` already wrote a `source` block; `pdf-pages.py`
wrote none, so a document ingested ONLY through the no-outline rung carried no
technical metadata at all. Measured 2026-09-19: `library/milnorlink/` — the one
entry `pdf-structure` never touched — has `source` absent, while the other two
page-granularity entries have it only because `pdf-structure` ran on them first
and `pdf-pages` merges into the existing file.

Underscore-prefixed because a module with a hyphen cannot be imported; same
reason as `_pdf_doc_id.py` and `_pypdf_compat.py`. Importable rather than
copied for the reason `rlp5` records: three spellings of `slugify` existed
before that module, and a copy drifts.

## The mimetype is SNIFFED, and that is the point of it

An extension is a claim by whoever named the file; the magic bytes are what the
content actually is. A `.pdf` that is really HTML — an error page saved by a
download that failed — extracts to nothing, and every downstream verdict about
it is about the wrong document.

So {@link sniff_mimetype} reads the leading bytes and returns **None** when it
does not recognise them. It never falls back to the extension: a guess that
agrees with the filename is indistinguishable from a real sniff, which makes
the field worthless for exactly the case it exists to catch. "Could not
determine" is a third state here as everywhere else in this repository.
"""
from __future__ import annotations

import datetime
import hashlib
import os
from typing import Any

# Leading-byte signatures, longest first so a prefix cannot shadow a longer
# match. Deliberately small: these are the formats an ingested corpus actually
# holds, and an unknown one is reported as unknown rather than guessed.
_MAGIC: list[tuple[bytes, str]] = [
    (b"%PDF-", "application/pdf"),
    (b"PK\x03\x04", "application/zip"),
    (b"\x89PNG\r\n\x1a\n", "image/png"),
    (b"GIF87a", "image/gif"),
    (b"GIF89a", "image/gif"),
    (b"\xff\xd8\xff", "image/jpeg"),
    (b"II*\x00", "image/tiff"),
    (b"MM\x00*", "image/tiff"),
    (b"\x1f\x8b", "application/gzip"),
    (b"ustar", "application/x-tar"),
    (b"{\\rtf", "application/rtf"),
    (b"<!DOCTYPE html", "text/html"),
    (b"<html", "text/html"),
]


def sniff_mimetype(path: str) -> str | None:
    """What the CONTENT says this is, or None when the bytes are unrecognised.

    Never consults the extension. See the module docstring for why a fallback
    would make the field worthless.
    """
    try:
        with open(path, "rb") as fh:
            head = fh.read(512)
    except OSError:
        return None
    for sig, mime in sorted(_MAGIC, key=lambda kv: -len(kv[0])):
        if head.startswith(sig):
            return mime
    # `ustar` sits at offset 257 in a tar header rather than at the start.
    if len(head) > 262 and head[257:262] == b"ustar":
        return "application/x-tar"
    return None


def sha256_of(path: str) -> str:
    """Full 64-hex digest, streamed so a large PDF does not land in memory."""
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def tech_meta(path: str) -> dict[str, Any]:
    """The mechanical facts `nso8` asks for, for one file.

    `mimetype_sniffed` is None when the bytes were not recognised, and
    `mimetype_source` says so explicitly rather than leaving a reader to infer
    it from a null — a consumer that sees `"unrecognised"` knows the file was
    looked at, which absence alone does not tell it.
    """
    st = os.stat(path)
    mime = sniff_mimetype(path)
    return {
        "file": os.path.basename(path),
        "sha256": sha256_of(path),
        "bytes": st.st_size,
        # ISO-8601 UTC, seconds. Not the ingest time: this is when the SOURCE
        # last changed, which is what tells you a re-fetch got something new.
        "mtime": datetime.datetime.fromtimestamp(
            st.st_mtime, tz=datetime.timezone.utc
        ).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "mimetype_sniffed": mime,
        "mimetype_source": "magic-bytes" if mime else "unrecognised",
    }
