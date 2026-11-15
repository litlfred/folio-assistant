---
# folio-assistant-lwuw
$schema: bean/1.0.0
title: 'Memory: DTH-PC and DTH-SC Contributor Log sheet IDs and setup state (2026-10-31)'
status: completed
type: task
priority: low
created_at: 2026-11-12T09:45:00Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `dth-pc-sc-contributor-logs.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: DTH-PC and DTH-SC Contributor Log sheet IDs and setup state (2026-10-31)


Owner asked 2026-10-31 11:28Z for a content-management sheet for dth-pc (and dth-sc), following the Contributor Feedback process. The Review sheet Apps Script thread owns the sheets.
- DTH-PC Contributor Log: 1g9nj4rjK23oBs2of_jMogUcN1y0D6QUTMae-UhKwpV4 (tabs: Contributor Feedback 781608837, Agent 1664459376, TOC 971051088, Config 1343014900). Config + TOC written 11:40Z from dth-pc branch claude/dth-pc-scaffold (52 entries). dth-pc thread asked to commit review:anchors scripts, review-anchors.json, review/drafting/sheet-sync.json.
- DTH-SC Contributor Log: 1ZpIOAgRXXpzMKauSzz11nd27VoCTApiMp3rdSL26x9Y (tabs: CF 956416484, Agent 1213145625, TOC 851162695, Config 641277771). Waits on the dth-sc thread (cmsg_017WNUkNK8kdDziPK58Pv6G9GQXdyKKe12KdKW5a762KeE) pushing anchors to dth-sc#1; that thread owns them.
- core#384 (merged): anchors without seed file, --toc-out, "not linked yet" message. Owner still to paste Code.gs + installTriggers + tick multi-select in both.
Related: folio-assistant-azlf, folio-assistant-2a0d.
