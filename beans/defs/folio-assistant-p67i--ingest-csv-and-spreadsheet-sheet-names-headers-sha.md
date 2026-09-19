---
# folio-assistant-p67i
title: 'INGEST: CSV and spreadsheet — sheet names, headers, shape, narrative'
status: in-progress
type: task
priority: normal
created_at: 2026-09-16T06:43:50Z
updated_at: 2026-09-19T15:54:15Z
parent: folio-assistant-slw1
---

## What

For a CSV or spreadsheet, extract what makes a dataset findable rather than
merely stored: sheet/tab names, column and row headers, the shape (rows ×
columns per sheet), and a narrative description of what the data is about.

## Done when

`manifest.jsonld` carries a tabular record per sheet, the narrative carries its
provenance stamp, and a grep for a column header finds the dataset that has it.

Diagram: `skills/workflows/ingest-derive-content.bpmn`, `Task_Tabular`.

_2026-09-19T15:46:59Z_ — Claimed by claude/ecstatic-goldberg-eroyaz — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).

## 2026-09-19 — headers as the findable surface, and the narrative nobody wrote

Done. `scripts/tabular-records.py` + `schemas/tabular-records.ts`;
`tabular-records` leaves `NOT_DERIVABLE` (3 → 2: `d5f1`, `1r0p`).

**A defect in `twqe`, found by measuring before building.** An `.xlsx` routed
to the **archive** rung — it sniffs as `application/zip` because it *is* one —
so a spreadsheet would have been listed as a bag of XML parts instead of read
as a workbook. Same for `.docx`, `.odt`, `.epub`. Caught in the same PR that
introduced it.

The magic bytes cannot separate them: all are genuinely `PK\x03\x04`. The
container declares itself one level in — OOXML by `[Content_Types].xml` plus
the part names, ODF by its `mimetype` member, which the format requires stored
first and uncompressed *precisely so it can be read this way*. Same principle
as the byte sniff, not an exception to it.

**And they disagreed for one commit.** `planFor` called the magic-bytes-only
`sniff_mimetype` while `tech_meta` applied the refinement, so an `.xlsx` routed
as an archive while its own `source` block correctly called it a workbook.
`sniff_effective_mimetype` is now the one answer both ask. Found by testing all
five file types, not just the new one.

**Stdlib only** — `zipfile` + `xml.etree`, `csv`. This repo declares no Python
dependencies and CI installs only `ruff`, so an openpyxl dependency would pass
locally and fail there. I installed openpyxl to *build* a realistic fixture,
then **uninstalled it and read the file back** — same discipline as the empty
`PLAYWRIGHT_BROWSERS_PATH`.

**The bug that looked plausible.** The first reader prefixed `xl/` to every
relationship Target, but a real writer emits worksheets as
`/xl/worksheets/sheet1.xml` (package-root-absolute) and styles as `styles.xml`
(relative) **in the same file**. Result: `xl/xl/...`, every read raised, every
shape `undetermined`, every header list empty — and **the sheet names were
still right**, so the output read as a workbook that simply had no headers.
That is the worst shape a bug can take here, and it is the `6xaz` failure mode
in a new format.

**A CSV has no magic bytes**, so routing one cannot be a sniff and must not
become an extension guess. `is_tabular_text` asks the only content question
there is: do the first rows split into the same number of fields, more than
one? Prose, a single column and anything ragged all answer no — a one-column
"table" is indistinguishable from a list of lines.

**The narrative is where I deliberately stopped.** The bean asks for "a
narrative description of what the data is about". That cannot be produced
mechanically — it is somebody's account and needs an author. `narrative: null`
with `narrative_state: "not-authored"` records the slot as empty, and the
schema refuses a record that says both things at once. The headers are right
there and a plausible summary could be assembled from them; that is exactly why
it is not. When one is written it carries an `Attribution` (`iqim`).

**This bean is therefore not fully closed by its own "Done when"**, which asks
for the narrative too. The mechanical half is done and gated; the authored half
waits on an arm that actually writes narratives — `d5f1` is the first.

Tests: 20 in `scripts/tests/tabular-records.test.ts`; all five branches
mutation-checked (1, 4, 3, 3, 1 named failures). 2 850 pass / 0 fail; tsc,
eslint, 35/35 gates determined-pass.
