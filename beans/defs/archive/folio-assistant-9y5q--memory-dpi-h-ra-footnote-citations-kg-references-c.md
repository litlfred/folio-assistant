---
# folio-assistant-9y5q
$schema: bean/1.0.0
title: 'Memory: dpi-h-ra footnote citations -> KG references/ + \cite keys + generated References list (smart-ra#232, issue #231, 2026-11-02)'
status: completed
type: task
priority: low
created_at: 2026-11-02T18:23:31Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `smart-ra-dpi-h-ra-bibliography.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: dpi-h-ra footnote citations -> KG references/ + \cite keys + generated References list (smart-ra#232, issue #231, 2026-11-02)

Owner 2026-11-02 18:15Z (thread "Move dpi-h-ra references to bibliography", cmsg_017WNUkNK8kdDziPK58Pv6G9PSc4XQEZrAnZp8PdoGokYJ): inline footnote citations in dpi-h-ra must become a proper bibliography.

Done in draft smart-ra#232 (branch claude/dpi-h-ra-bibliography, issue #231): 91 folio-reference/v1 nodes in references/ (declared in dpi-h-ra.json), `\cite{key}` + manifest `cites` on 53 blocks, References chapter block p-references-lead-071187 has cites + meta.referenceList {who, numbered} rendered by core references:render (run with core main; smart-ra pin 633d230 lacks it until re-pin #228). site:document passes `--bibliography-url ../folio-assistant-core/bibliography/`. Footnotes 12,14,17,29,31,39 kept (explanatory). Bare-URL entries got titles from the citing sentence (flagged for review).
MERGED 2026-11-02 19:02Z as 140ddd1 (owner card A 18:28Z merge as is; corpus gate red, owner card B 19:01Z merge with gate red). Issue #231 closed. Not yet published to the live site. Handover bean folio-assistant-rbib completed. Follows folio-assistant-e3w5 conventions (ISBN WHO works keyed `<isbn>-eng`).
