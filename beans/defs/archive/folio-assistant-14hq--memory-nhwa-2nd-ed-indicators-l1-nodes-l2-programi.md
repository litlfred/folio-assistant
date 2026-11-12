---
# folio-assistant-14hq
$schema: bean/1.0.0
title: 'Memory: NHWA 2nd ed indicators -> L1 nodes -> L2 ProgramIndicator drafts, and the reusable indicator-extraction skill (2026-11-02); PRs, files, open DTH-HRH...'
status: completed
type: task
priority: low
created_at: 2026-11-02T07:34:06Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `nhwa-indicator-extraction.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: NHWA 2nd ed indicators -> L1 nodes -> L2 ProgramIndicator drafts, and the reusable indicator-extraction skill (2026-11-02); PRs, files, open DTH-HRH card

Thread "Extract NHWA indicators into L2" (cmsg_017WNUkNK8kdDziPK58Pv6G9BqMrkUVdrizRYAtGR9Acd4), started 2026-11-02 07:13Z.
Owner: "recreate NHWA 2nd edition and extract indicators into L2 style; a process added as part of L1 -> L2 extraction for DAK or DTH"; "those can be put into the DTH-HRH handbook" (content -> card Q-IND-2).

- NHWA = who-iris library/9789240081291-eng. 29 indicators (1-01..1-12, 2-01..2-07, 3-01..3-05, 4-01..4-05) + 33 sub-indicators (2-07.1-7, 4-01.1-12, 4-02.1-5, 4-05.1-9), PDF pages 51-91. Stage-A section text is mangled (side bars on the wrong sheet, 4-04 has no section), so sheets are read from the PDF layout.
- Tools: smart-base scripts/l1-indicator-sheets.py (PDF -> `indicator` candidates, aspect `indicators`, fields verbatim) and scripts/l2-program-indicators.py (ProgramIndicator drafts, derivedFrom L1, `gaps` never filled). Skill indicator-extraction bound to Task_Indicators (l2-dak-authoring) and Call_Data (dth-authoring).
- Block meta keys agreed with the structured-block styling thread (Q-IND-1 A): indicatorId, module, name, abbreviatedName, numerator, denominator, disaggregation, definition, glossary, reportingFrequency, reportingFrameworks, dataSources, furtherInformation, dimension; sub-indicators parentIndicator + guidingQuestions. Lists joined "; ".
- PRs (draft, subscribed): cat-harness-tools#1390 (candidate `fields` -> meta), smart-base#288 (tools + skill), who-iris#171 stacked on #165 (base claude/nhwa-registry-indicators; #165 owned by dth-hrh pilot thread …98q7ycpNcyZETyhTTp9ETxW). #171 blocks need who-iris re-pin to a tools commit with #1390 for gen --check.
- Files: /mnt/project-files/nhwa-indicators-2026-11-02/ (README.md table, nhwa-program-indicators.l2.json, nhwa-indicators.l1-candidates.json).
- Local tip: sibling repo checkouts next to who-iris break its bun workspaces ("../cat-harness-tool[s]"); keep other clones in a subdir. Mount with `bun cat-harness-tools/scripts/mount-from-lock.ts --root .`.
Related: folio-assistant-2yeq, folio-assistant-cesa, folio-assistant-wyqi.
- Q-IND-2 = A (owner 07:34Z): dth-hrh draft PR #96 (branch claude/dth-hrh-nhwa-indicators, stacked on #94 CS-001 ch11 restructure) adds 29 ind-nhwa-* blocks into ch11 module sections 11.2-11.5; change set issue dth-hrh#95 = CS-021 in DTH-HRH log (row added by watcher 07:40Z; send it preview URL + head when staged). Committee content: NEVER merge #96; keep #95 open.
- 08:16Z: who-iris#165 held: cat-harness generated schemas/kinds/library.schema.json still requires two @types on a library block (tools#1357 allows one); #171 hits the same. L1 ingestion thread to regenerate in cat-harness; dth-hrh pilot thread re-pins + merges #165 then tells this thread. #96 preview live (gh-pages 635c132, head 7d39507), sent to watcher.
- Q-IND-3 = A (owner tap 10:06Z): #1390, #288, #171 marked ready (10:07Z) and #1390/#288 update-branched; merge each on green; #171 only after #165, then retarget to main + re-pin to a tools commit with #1390.
- MERGED 10:38Z: cat-harness-tools#1390 (2af9f42), smart-base#288 (e96f9bb). Next: #171 re-pin who-iris to cat-harness-tools 2af9f42 (or later) after #165 lands.
- 10:40Z: #171 README fix pushed (e5ffda4). #96 preview redeployed (head accffd8, sent to watcher). #165 waits on cat-harness#968 (library schema fix); pilot thread re-pins + merges #165 then tells this thread.
- 11:31Z: #171 MERGED by owner into #165's branch (ed1ec7a), not main. Content reaches main with #165 (pilot thread; needs tools >= 2af9f42 pin). Told pilot thread.
- 2026-11-07: who-iris#165 merged to main 11-02 23:50Z with #171; all 62 indicator blocks on main. Only open: dth-hrh#96 draft + #95 (CS-021, committee, never merge).
