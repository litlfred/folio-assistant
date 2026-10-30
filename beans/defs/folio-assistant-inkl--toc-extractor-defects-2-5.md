---
# folio-assistant-inkl
$schema: bean/1.0.0
title: 'INGEST: TOC extractor defects 2-5, including the DAK contents collapsing past the trust tests'
status: in-progress
type: task
priority: high
created_at: 2026-10-30T12:45:00Z
updated_at: 2026-10-30T13:35:00Z
parent: folio-assistant-slw1
---

Bean for folio-assistant#2302. The core work is merged (#2303, #2388, cat-harness-tools#803). These four of the five defects ritikarawlani measured on 2026-10-07 are still open:

## Done when
- [ ] (2) levels are consistent with nesting
- [ ] (3) a running header is no longer read as a contents entry (DDCC)
- [ ] (4) no entry is left without a section
- [ ] (5) the DAK's contents no longer collapse from 21 entries to 8 sections, and a trust test fails on that shape. This is the serious one: a degenerate tree passed all three trust tests (the 6xaz shape).

The test PDFs are in litlfred/smart-immunizations, so a session needs that repo attached.

Opened on the owner's card "A. Apply all", 2026-10-30 12:39Z (thread "Finish leftovers from closed lanes"). (https://claude.ai/code/session_01Qmmkt7iaCtGYwZbW9x7eYe)
