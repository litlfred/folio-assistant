---
# folio-assistant-4ccr
title: 'WIREFRAME FINDINGS: usability and accessibility defects the as-is wireframes observed (#1023)'
status: todo
type: epic
tags:
    - wireframe-findings
    - ui
created_at: 2026-09-23T10:36:13Z
updated_at: 2026-09-23T10:36:13Z
---

The as-is wireframes merged in #1032 record, for every declared harness visualiser, what the page actually does at 1280×800 (web) and 390×844 (mobile). The `## Findings` section of each `cat-harness/docs/wireframes/<kind>/intent.md` holds only what was observed on the rendered page or read off its generator; nothing is inferred.

This epic turns those findings into work (owner, 2026-09-23: *"make the findings into beans"*):
- one **cross-cutting** bug per defect that recurs across pages, so it is fixed once, in the shared template or CSS;
- one task per **visualiser**, holding that page's findings verbatim, each tagged with the cross-cutting bug that covers it.

It belongs to the rendered-surface stream, `folio-assistant-10uc` (navbar, visualisers, stickies).

Fixing a finding means changing the generator or the shared chrome, then re-drawing that visualiser's wireframe, so that `check:wireframes` and the wireframe stay the record of the page as it is.

## Re-verified 2026-09-29 on `main` 35402147f

Every finding in the 22 child beans was re-measured on a local build of that commit, 2,534 commits after the findings were written. **132 still present, 11 fixed, 4 could not be determined.** The verdicts are appended to each child bean. No child is fully fixed, so none closes.

- **Fixed:**
  - Page-level sideways scroll on catalogue, folio, translation-status and uploads (76b34f8ec). The tables now scroll inside their own box, but on catalogue the right-hand columns still start off-screen.
  - The handle no longer covers the title on folio or library.
  - The beans visualiser's site nav (ab046420f).
  - The external-schemas stat box (1b2d10c7e).
  - The glass strip's "More" tile (dbbc2b6ef).
  - A stray MADR backtick (c50675273).
- **The top still-present classes:**
  - Dark-theme tags at 2.1–2.7:1 (`rtuo`).
  - Long lists with no filter (`0fua`: skills is 270 rows and 67,046 px tall at 390).
  - References that are not links (`qgjh`: all 9 pages, 0 links in tools' 104 rows).
- **New regression:** `g9r2`, the who-iris replica.
- `mylx` is fixed in #1512.
