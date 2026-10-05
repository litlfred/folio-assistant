---
# folio-assistant-r96p
title: 'LIBRARY: draft summaries for the withheld who-iris entries (0/121, 0/250)'
status: todo
type: task
created_at: 2026-10-01T18:43:35Z
updated_at: 2026-10-01T18:43:35Z
parent: folio-assistant-slw1
---

Issue #1794 (follow-up to PR #1818, which only fixed the viewer).

## Why
The owner ruled on 2026-10-01 (option 1 of 4) that a WITHHELD library entry's rows show the section's summary when one exists, and otherwise "Withheld — copyright not granted" with a link to the catalogue record. Drafting the summaries was explicitly NOT part of that change. Measured at PR #1818: who-iris `who-pub-tps-931` has 0 of 121 sections summarised and `9789241548960-eng` has 0 of 250 (243 prose, 7 empty), so every row reads "Withheld". The banner reports the count.

## What
Drain the summary queue for the withheld entries with the existing machinery (library-ingestion skill, "Summarising prose blocks"): `bun run summaries:next -- --n 5 --entry <slug>`, then `bun run summaries:record`. Do it a few blocks at a time. A summary is 1–3 sentences in your own words and must never quote the refused text: the summary is published even though the text is not.

## Done when
- Both withheld entries have draft summaries for their prose blocks. The viewer banner then reads "N of M sections summarised" with N > 0.
- A no-leak check passes: grep the generated `cat-harness/docs/assets/library/entries/<slug>.json` for sentences from the entry's sections and find none outside the summaries.
