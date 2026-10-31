---
# folio-assistant-6chd
$schema: bean/1.0.0
title: 'Library ingestion: re-segment DTH handbook PDFs the same way every time'
status: todo
type: task
priority: normal
created_at: 2026-10-31T20:35:18Z
updated_at: 2026-10-31T20:35:18Z
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
