---
# folio-assistant-aw7q
$schema: bean/1.0.0
title: 'Memory: Why review-log Feedback (agent) cells read all-bold/unclear (2026-11-01) and the pending fix card Q-FBK-1'
status: completed
type: task
priority: low
created_at: 2026-11-01T19:31:34Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `review-log-feedback-clarity.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Why review-log Feedback (agent) cells read all-bold/unclear (2026-11-01) and the pending fix card Q-FBK-1

User 2026-11-01 19:27Z: Feedback (agent) cells unclear (what is asked?), all text bold; only a tag like "Decision needed:" should be bold.

Root causes (folio-assistant-core tools/review-sheet-sync/review-sheet.gs):
1. decisionSpans bolds from "Decision needed" to next blank line; the script's own ⏳ line "answer the Decision needed below" matches, so the whole cell goes bold.
2. progressLine says "Needs you: answer the Decision needed below" whenever status is Needs human, without checking a block exists (dth-hrh #81-#85 had none).
3. PR state ("#61 open") comes from Agent tab, never refreshed from GitHub.
4. No fixed cell layout (skill review-sheet-script.md), so the ask is buried under history.

Card Q-FBK-1 (thread "Make review-log feedback clear by default", cmsg_017WNUkNK8kdDziPK58Pv6G9VHDRMJhDdGxmnuvJ2VhfLC): A all (layout + tag-only bold + warning + watcher PR refresh/lint, recommended), B script only, C layout/checks only. Watcher thread told of interim rules. Related: folio-assistant-94i3, folio-assistant-ou0y.

19:32Z: cause 1 (bold) already fixed by the watcher in core PR #514 (d0c7f32, issue #513; copy page build 1fa04122). Build the rest on #514's branch, not a second PR.
19:32Z owner chose Q-FBK-1 A. 19:45Z: core PR #517 (draft, stacked on #514, branch claude/review-feedback-clear): fixed cell layout in review-sheet-script skill (Decision needed first + lettered options + recommended + where to answer; Proposal:, Next:; no history/**; <=10 lines), askChecked in review-sheet.gs, tools/review-log-watch/lint.ts (+ skill review-log-watch "Lint each poll"). Watcher told. After merge: republish copy page.
19:45Z user rule: agent writes Feedback (agent) on every Blue change and every new row (issue, person or TWG workbook), in all 5 logs; in skills review-log-watch step 5 + review-sheet-script + review-log-watch.bpmn (#517 at 607db8b). Layout tag is "Proposed direction:" (matches #514 askFirst). Q-FBK-2 card (merge #514 then #517 when green) open.
19:46Z Q-FBK-3 A (links + Selected Sections): #517 at d3969d3. Script autolinks repo#n (owner from REPO_URL, /issues/n) and adds "↳ Where to review:" per Selected Section on preview; lint sectionProblems (no sections w/o asking; PR chapter outside sections w/o "Outside the selected sections:" line). Watcher told.
20:28Z Q-FBK-2 A (owner tap): merge #514 then #517 on green. Both marked ready 20:31Z (#517 head 0f82a98 incl. #514's dbcefb6). Watcher asked not to push to #514 until merged. After merge: republish copy page (codegs-copy-page).
22:30Z: #514 green then dirty vs main; pushed 135c0d8 (merged main, dist regen). #517 head 7261b0d (watcher pushed 2 commits). Waiting CI (full tier ~2h).
23:10Z: #514 CLOSED as superseded by another Claude (commits in #517; main #524 did column colours). #517 retargeted to main, head b354122 (dropped stale instructionRuns test). Merge #517 on green (Q-FBK-2 A covers it). Local agent-record tests fail on missing cat-harness-tools modules (env, not this PR).
01:25Z 11-02: #517 run failed only root:lint (4 new, mine); fixed at 3df649e. Rerun pending; then merge (Q-FBK-2 A).
03:55Z: run 2 failed only typecheck TS2769 (my test types); fixed at 18a3f3f8.
04:25Z: #517 MERGED b483bdc. Copy page already == main dist (watcher published f8cc624 build); no republish. User paste pending.
06:30Z: user pasted; logs live (Watch 06:25Z all 4). Follow-up #592 (draft): no 'No section selected' on finished rows. Q-FBK-4 card asks merge.
06:28Z Q-FBK-4 B (owner tap): merge #592 on green, then send copy-page link for paste.
07:05Z: #592 MERGED 138ebf9; copy page republished build 3410e629 (v31). Config LATEST_BUILD should be 3410e629 (watcher). User paste pending.
07:10Z: NEW ask (user 07:07Z + "improve processes"): Title on PC log/template Blue; CS creation/split human-controlled (like issues); triage new PCs into open/new CS with suggested committees; update BPMN+skills. Today Review Change Sets rows = FILTER of 'Agent - Change Sets'!A3:B. Card Q-CS-1 (cmsg_017WNUkNK8kdDziPK58Pv6G9LnRKLyzLsYn3tC3amuUmVU): A sheet row (rec), B issue form, C both. Shared parts started.
Q-CS-1 C (07:16Z, both sheet row + issue form) + user 07:17Z: a committee comment like 'this CS needs to be split' also triggers (watcher proposes split, Ready for agent=Yes makes it). Branch claude/human-change-sets.
07:45Z: core #596 draft (issue #595, branch claude/human-change-sets, dc8c2482): Blue Title + Title-only rows get id (FILTER spill frozen once), Change Set (human) col on RPC, templates/issue-forms/change-set.yml, tools/review-log-watch/cs-requests.ts (request/issue/triage), public-comment.bpmn docs + pots, skills. Watcher told. Cell comments not readable (needs Drive advanced service). Card Q-CS-2: merge when green.
07:50Z: user 07:32-33Z: previews follow main ONLY on human feedback (not automatic). core #600 draft (issue #599, branch claude/previews-follow-main): tools/review-log-watch/previews.ts (--prs, request --text), skill section, review-log-watch.bpmn doc + pots. cat-harness#959 merge-manager skill not touched (repo not attached).
07:35Z: HOLD pushes/merges on core etc until Meta-merge thread posts 'meta-merge 2 done' (coordinator).
07:37Z: user 07:34Z reversed: previews refresh AUTOMATIC by default (Config PREVIEW_REFRESH automatic|on-feedback), feedback also triggers. Committed locally on claude/previews-follow-main; push held for meta-merge 2.
07:55Z: user 'OK' in thread = Q-CS-2 A (merge #596 and #600 when green). Still on hold for meta-merge 2; then push d31178c6 to #600, mark both ready, merge on green, republish copy page.
08:17Z: #596 MERGED 971e66bb. Copy page republished build ff855ec7 (v32). User paste pending. Config LATEST_BUILD -> ff855ec79082c869 (watcher). #600 CI running, merge on green (Q-CS-2 A via 'OK').
19:30Z: answered user how agents access sheets (Google Sheets connector OAuth as owner + Apps Script). #600 was dirty; merged main at 5498b93f, CI pending, merge on green.
11-07 16:02Z: #600 MERGED 11-03 05:00Z (by another session). All work merged; only user's Code.gs paste (build ff855ec7) pending.
11-08 09:27Z: user pasted; DPI-H log verified: RCS Title blue, A:B plain values, RPC has Change Set (human) after Change Set. Thread resolved.
