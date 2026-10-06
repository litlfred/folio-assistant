---
# folio-assistant-6eiw
title: Library titles for non-PDF entries (pptx deck, CODATA table)
status: todo
type: task
tags:
    - ui
    - wireframe-findings
created_at: 2026-10-02T12:55:31Z
updated_at: 2026-10-02T12:55:31Z
parent: folio-assistant-4ccr
---

## Why

Bean `w6fu` (PR #1849) gave PDF library entries a verified title: a title is
used only when two independent sources agree, or when an editorial
`title_correction` exists. Two entries are not PDFs, so that resolver never
reaches them, and they still show placeholder titles:

| entry | format | what shows now | evidence in the file |
|---|---|---|---|
| `cat-harness/library/kg-folio-asst-2026-09-30` | slide deck (pptx) | placeholder title | no title metadata; slide 1 reads "WHO SMART Guidelines" |
| `folio-assistant-sci/library/codata-2022` | tabular text | `allascii-codata-2022.txt` (the file name) | nothing in the file names its title |

The owner decided on 2026-10-02 (option 1 on #1849): leave both as they are in
#1849, and track titling non-PDF entries as a separate bean.

## Approach (proposed, not decided)

- A title source for each non-PDF format: pptx `docProps/core.xml` dc:title,
  then the first slide's title placeholder; for tabular reference datasets,
  the catalogue record (`reference-dataset-ingestion`).
- Apply the same rule as `w6fu`: two agreeing sources, or an explicit editorial
  correction that records its basis. Never adopt a single unverified guess.

## Done when

- [ ] Both entries show a title that is verified or editorially corrected, and the source is recorded beside it.
- [ ] A non-PDF entry with no title source is reported as such rather than shown under its file name.
