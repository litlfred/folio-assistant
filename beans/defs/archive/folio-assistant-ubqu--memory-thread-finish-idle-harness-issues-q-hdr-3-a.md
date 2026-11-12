---
# folio-assistant-ubqu
$schema: bean/1.0.0
title: 'Memory: Thread "Finish idle harness issues" (Q-HDR-3 A): tools#1259, #400 box 4, #1299 — PRs and state'
status: completed
type: task
priority: low
created_at: 2026-11-02T12:04:29Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `idle-harness-issues-2026-11-02.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Thread "Finish idle harness issues" (Q-HDR-3 A): tools#1259, #400 box 4, #1299 — PRs and state


Thread cmsg_017WNUkNK8kdDziPK58Pv6G9E2MM936aKdTfuSSRD7GVeN, started 11-02 11:56Z, child of drain thread …93tgDz3qufiWhn4SHZH4bHs (folio-assistant-6pek). Close each issue on merge and tell the drain thread.
- #1259 (bean-query + harness-state typed results): tools#1406 (bean_query returns structuredContent.rows) + cat-harness#975 (bean-query `report` Markdown + `result` BeanQueryRows; harness-state `result` HarnessStates). Both ready, subscribed.
- #400 box 4: fa#2915 (feature-staging.yml carry step expands a lock-only re-pin with staging-changes.ts expand into pr-files.txt; any doubt removes the list = carry all). Ready, subscribed. Pushing .github/workflows to fa worked.
- FINDING: fa lock has both `mounts[]` (harness/ref) and `instances[]` (instance/sha); expandRepins reads instances. A lock edit that moves no sha (new mounted dir) yields 0 repins -> fa#2915 treats that as doubt.
- #1299: core main 12e68b3 has 16 lower-layer reds (bpmn:checklist, ci-invocations, prov-qaqc, reference-direction x2, schema-nodes, visualiser-routes, workflow-script-paths, external-schemas, gen:jsonld, kind:register, libraries, library:keywords, readme:sync, separation:cutover, translate-bpmn:bootstrap). Core lock pins cat-harness 9c8fc67 / tools a8f46f0 (11-01 23:01Z) => mostly pin skew. 12:04Z cascade thread says core's own lock is NOT in its rounds: the core re-pin is MINE (cat-harness, tools, bootstrap c90ef456, bootstrap-tools mains), after the slash-IRI thread …5HvJ9m7xBV6qWhqn6M2rVj settles core (~12:30Z). Asked slash thread 12:06Z; check-in 12:35Z. Recount after. fa-reds thread owns schema-nodes, workflow-script-paths.
- Artifacts download is blocked (blob storage 403); read job logs and grep `##[group]<gate>: exit N`.
- 12:15Z core re-pin core#605 (branch claude/repin-core-1299): cat-harness 4bb08ed, tools e09d815, bootstrap c90ef45, bootstrap-tools 076173f; workflows restored (Q-PIN-6 C); bun.lock regen in sibling layout (core bun.lock uses ../ workspaces: delete in-tree mounts first). Ready, subscribed. Pins-only diffs may run no gates: confirm a full 'No new failures' job before merge. Recount #1299 on the next core main run.
- 12:10Z merge of tools#1406 (green) refused by safety check. Card Q-IDLE-1 in THIS thread (msg cmsg_017WNUkNK8kdDziPK58Pv6G9L2dyVtcHvfFSzEqoitfP7r): A merge all four (1406, ch#975, fa#2915, core#605) on green (rec), B only #1259 PRs, C hold.
- 12:13Z Q-IDLE-1 = A (tap here). tools#1406 MERGED 2b251af. Merge ch#975, fa#2915, core#605 on full green.
- 12:17Z cat-harness#975 MERGED 4e56866; #1259 CLOSED; drain thread told.
- 12:31Z core#605 MERGED fb6bf3c. KEY FINDING: core's PR/main checks mount FA's index (fa/index.lock.json at fa main), not core's own lock, so core#605 only cleared 3 (kind:register, readme:sync, visualiser-routes); 13 lower-layer reds remain and come from fa main's old pins (cat-harness 1b22283, tools f92092e). Real lever = fa re-pin train (current fa#2917; #2906-#2911 closed unmerged), owned by train thread …MmDK4fGPz89Zs2mtVYEY36. Recount #1299 on the first core main run after a train merges.
- 12:36Z fa#2915 MERGED 7e745b9; #400 CLOSED; drain told. Only #1299 left (waiting on fa train #2917).
- 13:17Z CODE FREEZE (Q-MVP-5 A) on lower layers (bootstrap-tools, tools, cat-harness, core, fhir-harness, who-iris, smart-base): only slash wave, re-pin-prep-named fixes, smart-base#280/#284 merge. #1299 fixes in those repos may be opened but NOT merged. Recount still due after fa train.
- 16:39Z fa lock still at f2e09af (11-01); trains #2917, #2920 closed unmerged, #2921 open. Stopped polling; told user. Resume #1299 recount when the train thread pings.
