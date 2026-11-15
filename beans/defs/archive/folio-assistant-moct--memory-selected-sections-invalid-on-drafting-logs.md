---
# folio-assistant-moct
$schema: bean/1.0.0
title: 'Memory: Selected Sections "Invalid" on drafting logs = Allow multiple selections tick off; API cannot set it on a range rule'
status: completed
type: task
priority: low
created_at: 2026-11-01T09:50:14Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `review-sheet-multiselect.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Selected Sections "Invalid" on drafting logs = Allow multiple selections tick off; API cannot set it on a range rule


2026-11-01: DTH-PHC and DTH-PC Contributor Logs had the Selected Sections chip dropdown without "Allow multiple selections" (HRH, SC had it), so two picks showed "Invalid: Input must fall within specified range". Issue litlfred/folio-assistant-core#472.

- The Sheets API CAN read `allowMultipleSelections`, but refuses to SET it on a ONE_OF_RANGE rule (only ONE_OF_LIST). Apps Script DataValidation has no setting at all.
- Library scope is spreadsheets.currentonly, so the Advanced Sheets service would need a wider scope.
- Manual fix: column C > Data > Data validation > rule > Advanced options > tick Allow multiple selections.
- Code direction pending user card Q-MS1 (A script writes ONE_OF_LIST rule, B louder reminder, C nothing).

Thread "Fix invalid multi-section pick in feedback sheet". See folio-assistant-94i3.
