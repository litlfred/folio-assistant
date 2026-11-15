---
# folio-assistant-6chd
$schema: bean/1.0.0
title: 'Library ingestion: re-segment DTH handbook PDFs the same way every time'
status: completed
type: task
priority: normal
created_at: 2026-10-31T20:35:18Z
updated_at: 2026-11-01T20:47:00Z
parent: folio-assistant-dthl
---

Owner, 2026-10-31 (card "A. Both"): pass litlfred/dth-phc#1 section 9 item 3 to its owner as a bean.

Every DTH L1 needed the same hand fixes: PHC (running headers, chapter-opener panels, glossary references), PC (outline, step tables, page header), SC (page split, flat tables).

- [ ] Use the PDF outline for sections.
- [ ] Strip running headers and side navigation.
- [ ] Keep chapter-opener panels with their chapter and reference lists whole.
- [ ] Rebuild tables with pdfplumber.
- [ ] Re-run on the PHC, PC and SC entries and compare with the hand-fixed branches.

A proposal for the owner, not approved work. Source: dth-phc#1 section 8, L8.

_2026-11-01T20:47Z_ — Completed (owner card Q-DQ-2 A): the tool work is merged. The remaining DTH table fixes stay tracked in the "Drain DTH issues" thread. Session https://claude.ai/code/session_01Qmmkt7h4RWc6UwiBW5kbZ2
