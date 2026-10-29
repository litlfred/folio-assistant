---
# folio-assistant-r96p
$schema: bean/1.0.0
title: 'LIBRARY: draft summaries for the withheld who-iris entries (0/121, 0/250)'
status: completed
type: task
priority: normal
created_at: 2026-10-01T18:43:35Z
updated_at: 2026-10-11T06:23:23Z
parent: folio-assistant-slw1
---

Issue #1794 (follow-up to PR #1818, which only fixed the viewer).

## Why
The owner ruled on 2026-10-01 (option 1 of 4) that a WITHHELD library entry's rows show the section's summary when one exists, and otherwise "Withheld — copyright not granted" with a link to the catalogue record. Drafting the summaries was explicitly NOT part of that change. Measured at PR #1818: who-iris `who-pub-tps-931` has 0 of 121 sections summarised and `9789241548960-eng` has 0 of 250 (243 prose, 7 empty), so every row reads "Withheld". The banner reports the count.

## What
Drain the summary queue for the withheld entries with the existing machinery (library-ingestion skill, "Summarising prose blocks"): `bun run cat summaries:next -- --n 5 --entry <slug>`, then `bun run cat summaries:record`. Do it a few blocks at a time. A summary is 1–3 sentences in your own words and must never quote the refused text: the summary is published even though the text is not.

## Done when
- Both withheld entries have draft summaries for their prose blocks. The viewer banner then reads "N of M sections summarised" with N > 0.
- A no-leak check passes: grep the generated `cat-harness/docs/assets/library/entries/<slug>.json` for sentences from the entry's sections and find none outside the summaries.


## Closed 2026-10-09 on evidence (session https://claude.ai/code/session_01BJNRo4kh8U15HZVFDhYNJL)
- **Summaries drafted:** litlfred/who-iris main (f9e8303): `who-pub-tps-931` 121/121 sections, `9789241548960-eng` 243 summaries (= its 243 prose blocks); the published entry JSON on folio-assistant gh-pages already carries drafts dated 2026-10-06.
- **No-leak premise superseded:** the owner cleared every who-iris entry on 2026-10-08 (folio-assistant#2521, ruling 2): `who-iris/library/withheld.json` is `paths: []` by design, so neither entry is withheld and its text may be published.
- **Ran the check anyway, on the summaries:** of 1,008 + 2,387 source sentences (≥ 8 words), 0 appear verbatim in either `summaries.json`.
- **Found, not a leak any more, a quality defect:** 19 of who-pub-tps-931's 41 *inferred* outline titles are OCR body-text fragments (e.g. "List all authors when three or fewer; when four or more, give only"), published as section titles in `entries/who-pub-tps-931.doc.json`. 9789241548960-eng's 258 titles come from the PDF outline and are clean. Reported to the owner; no bean opened.

## Summary of Changes

Mirror copy. Closed in folio-assistant-core's store by drain lane C (core#50): the owner set both who-iris entries' copyright and restrictions gates to permitted on 2026-10-08, so who-iris/library/withheld.json is paths: [] and the no-leak grep no longer applies; the withheld path is covered by tools/test/coordinator/library-withheld-checkout.test.ts (3/3).
