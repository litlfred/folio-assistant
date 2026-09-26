---
# folio-assistant-twqe
title: 'INGEST: archives — extract a standardized greppable contents manifest'
status: completed
type: task
priority: normal
created_at: 2026-09-16T06:43:50Z
updated_at: 2026-09-19T15:41:06Z
parent: folio-assistant-slw1
---

## What

A tar or zip lands in `uploads/` and its contents are opaque to every grep in
the corpus until something lists them **as data**.

Extract a standardized `contents` manifest — one schema, whatever the archive
format — so the entry list is greppable and joins the L1 source graph as part
of that document's own record.

## Per entry

Path, size, mimetype, checksum, timestamp. These are the same fields the
technical-metadata bean (`folio-assistant-nso8`) defines for a loose file; an
archive entry is not a different kind of thing.

## Done when

`library/<slug>/contents.jsonld` exists for every archive, is referenced from
`manifest.jsonld`, and a grep for a filename inside an archive finds it.

Diagram: `processes/ingest-derive-content.bpmn`, `Task_Archive`.

_2026-09-19T15:34:30Z_ — Claimed by claude/ecstatic-goldberg-eroyaz — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).

## 2026-09-19 — the listing, and the rung that stopped diagnosing archives as broken PDFs

Done. `scripts/archive-contents.py` + `schemas/archive-contents.ts`;
`archive-contents` leaves `NOT_DERIVABLE` (4 → 3: `d5f1, 1r0p, p67i`).

**What I measured first.** `uploads/` holds four PDFs and **zero archives**, so
"a `contents.jsonld` exists for every archive" is *vacuously true* today —
worse than `iqim`, where 424 blocks were at least there to validate. And
handing `ingest-document.ts` a real zip answered:

    rung: undetermined
    why:  no PDF backend: No module named 'fitz'

The **refusal was right** — it did not mis-ingest. The **diagnosis was wrong**:
it named a missing tool when the fact was that the file is not a PDF, so a
reader would go install PyMuPDF and fail again. `probe()` opens everything as a
PDF, so it could not have said otherwise.

**A retraction, before it spreads.** I first read that message as a
module-name bug — `probe()` imports `fitz` while the rungs import `pymupdf`.
It is not: **neither is importable in this container**, so "no PDF backend" is
accurate. The corpus was ingested elsewhere and `library/` is committed. `apui`
is not broken.

**The fix is to route on sniffed content before anything opens the file.**
`planFor` asks `_tech_meta.sniff_mimetype` first, so an archive takes the
archive rung — including a file *named* `.pdf` that is really a zip, which is
the case only a sniff can decide. That routing needs **no PDF backend**, which
is why it is testable here at all, and was the brief's stated condition.

**Per entry, the `nso8` vocabulary verbatim** — `path`, `bytes`, `sha256`,
`mtime`, `mimetype_sniffed`, `mimetype_source` — because an archive entry is
not a different kind of thing from a loose file. Four entry states, not two: a
directory carries no size and no digest; an unreadable member is `"unreadable"`
rather than an empty file; a symlink is listed with its kind. Dropping
directories would make an archive of empty ones indistinguishable from an empty
archive. A non-archive is **refused**, because an empty `entries[]` reads as an
empty archive.

**What the gate can honestly claim.** Which entries it applies to is DERIVED:
`source.mimetype_sniffed` is already recorded, so "this came from a zip" is a
fact, not a judgement. Every entry today reports `not an archive
(application/pdf)` — said out loud, never silence. Proved by fixture archives
(a zip and a tar.gz of the same tree, asserted to list identically), and all
four branches mutation-checked: stubbing each fails 1, 1, 4 and 1 named tests.

**A defect caught by my own test.** An empty-string `mimetype_sniffed` rendered
as `not an archive ()` — `typeof mime === "string"` is true for `""`. Both
spellings of absence now say "no sniffed mimetype", and the test covers both.

Tests: 18 in `scripts/tests/archive-contents.test.ts`. 2 804 pass / 0 fail;
tsc, eslint, and 33/33 CI gates determined-pass.
