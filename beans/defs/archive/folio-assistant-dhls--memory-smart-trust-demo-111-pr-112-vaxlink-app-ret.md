---
# folio-assistant-dhls
$schema: bean/1.0.0
title: 'Memory: smart-trust-demo #111/PR #112: VaxLink app retired, "journeys" wording, parity beans JV-01..03; card Q-JRN-2 (merge)'
status: completed
type: task
priority: low
created_at: 2026-11-12T09:45:00Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `smart-trust-demo-journeys-rename.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: smart-trust-demo #111/PR #112: VaxLink app retired, "journeys" wording, parity beans JV-01..03; card Q-JRN-2 (merge)

2026-11-11, thread cmsg_017WNUkNK8kdDziPK58Pv6G968BAvjQLFviuzhdSETh1je. User: VaxLink should be gone, say "journeys" not "narrative".

Facts: the harness journeys viewer IS live at root en/smart-trust-demo/journeys/smart-trust-demo/workshops/dpi-h-policy-track/ (overview, walkthrough/<step>, map, personas, how, discuss, sheets, demo/S1-S8). Its app bar said "VaxLink" (workshop presentation.name). /vaxlink/ was the React app from web/, kept by index.config.json site.build.keep. github.io is blocked by the sandbox proxy; inspect gh-pages via git fetch.

Q-JRN-1 = A (user "A" in project chat 08:55Z; also Q-GAME-7 = A): retire now. Draft PR litlfred/smart-trust-demo#112 (branch claude/journeys-wording, 1604821b + beans d9a8e023): links to viewer, journeys wording, menu "Journey examples" (URL vaxlink-examples.html kept), presentation.name Journeys, deviceDemo dropped, web/ + CI job + keep rule removed. SUSHI clean. Site content: card Q-JRN-2 (A merge rec / B wait) open.

Parity beans in the PR: JV-01 ArchiMate boxes -> element pages, JV-02 payload drawer on every view (upstream cat-harness-tools scripts/journeys/present*.ts, WP-1); JV-03 owner side-by-side vs parity ref/*.webp (WP-2). Sent to coordinator for sibling dispatch. Related: folio-assistant-1cnn, folio-assistant-8n0n.

Later 11-11: JV-04/05 content pushed (778408a9, cast + chapterTitles). JV-09 tagRows waits for the cat-harness-tools PR from thread cmsg_017WNUkNK8kdDziPK58Pv6G944mnj777QrpP5JgRCK7Pxk to merge, then re-pin + add. PR #114 (fictional countries) is stacked on claude/journeys-wording: never force-push or rename that branch.
- 09:4xZ: #112 and #114 merged. Re-pin of cat-harness-tools needs the owner's own consent (the auto-mode classifier refused to record consent from a relay). Card Q-JRN-3 (A: re-pin to 0860bc2 + tagRows). Pending content from the code-gaps thread: tagRows (tools#1870, merged), presentation.inspector (JV-08, after tools#1871), presentation.architecture (JV-13, after tools#1873). JSON is in /mnt/project-files/journeys-viewer-style-2026-11-11/presentation-content.json. Best: one re-pin to a tools commit that has all three.
- 09:5xZ: PR #117 (re-pin to 0860bc2 + tagRows, consent Q-JRN-3 = A), green; card Q-JRN-4 (merge) open. tools#1871 and #1873 merged (tools main 728ef3a3). tools#1874 is pending: device-screen "client" {name, version, time, config}; VaxLink configs S1 "Hospital EMR & Print Station", S4 "OHS Player Facility Config (Tablet EMR)", S8 "OHS Player Viewer Config (Web/Tablet)". Plan: once #1874 merges, ask the owner one card for a re-pin to the tools commit that has all of these, then add inspector, architecture and client.
- Wait for tools#1875 (stacked on #1874; adds presentation.cover {"table":"patterns"}). Then one re-pin card, and one PR with inspector, architecture, cover and the per-screen client fields.
- 10:38Z: the owner tapped Q-JRN-4 A, and I merged #117 (09e992eb). tools#1875 merged at af33d460 (includes #1874). Card Q-JRN-5: re-pin to af33d46 and add inspector, architecture, cover and the client on s1/s4/s8. Content is in /mnt/project-files/journeys-viewer-style-2026-11-11/presentation-content.json.
- 10:5xZ: PR #118 (53014bac). It re-pins cat-harness-tools to af33d46 (Q-JRN-5 = A) and adds inspector, architecture (Taifafeki/Onesa groups id-f6321e91…, id-1068df96…), cover and client on s1/s4/s8. It also renames vaxlink-examples to journey-examples (catalogues too) and drops the home VaxLink credit. Owner rule (10:41Z): merge only after the full test suite passes. The merge card comes once green.
- 10:57Z: Q-JRN-6 = A, and I merged #118 (fa6c6fea). checks.yml bpmn-generated now uses .github/mount-from-lock.sh, because a whole clone breaks on a lock `except`. VaxLink work is done; the live site waits on the owner's manual publish. Thread resolved.
