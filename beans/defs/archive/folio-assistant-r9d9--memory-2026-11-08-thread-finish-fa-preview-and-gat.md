---
# folio-assistant-r9d9
$schema: bean/1.0.0
title: 'Memory: 2026-11-08 thread "Finish fa preview and gate drafts": fa#2953/#3004/#3018 merged main + pushed; card Q-RDY-1 (mark ready) open'
status: completed
type: task
priority: low
created_at: 2026-11-08T09:34:16Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `fa-preview-gate-drafts-2026-11-08.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: 2026-11-08 thread "Finish fa preview and gate drafts": fa#2953/#3004/#3018 merged main + pushed; card Q-RDY-1 (mark ready) open

Thread cmsg_017WNUkNK8kdDziPK58Pv6G918gycP36QV49K3R7NGiegf (spawned 09:22Z 11-08 by platform dispatch folio-assistant-lwnb).

- #2985 had merged; all three drafts already based on main, none superseded.
- 09:33Z pushed merges of main: #2953 e7a6204, #3004 45a5c31, #3018 73e6484 (also removed index.config.json `pending-baseline` entry for translation:page-qa:check; baseline present: qa-reports:main/da3ca52 + 9dd5301 hold 31 translation-qa/translations sidecars).
- `bun test test/workflows` 322/322 on each. #3004 and #3018 merge clean with #3035.
- 09:36Z user A: marked ready via `gh api -X POST repos/{o}/{r}/pulls/{n}/ccr/ready_for_review` (gh pr ready = GraphQL, blocked).
- 11:30Z: #3018 green -> ready-to-merge + ready: 73e6484ccd06d161f315f46449e698b035290795; #3004 gates green, CodeQL 504 infra red -> ready-to-merge + ready: 45a5c31; Merge Manager told.
- #2953: stage fails because restore makes uml:overview run concurrently with ig-index:build in derive:publish (race on smart-base/fhir-artifact-index/sidecars, ENOENT). Fix in cat-harness-tools (order uml:overview after ig-index:build). Card Q-TV20-1 (A tools fix first rec / B close / C park) in this thread.
- (earlier) `gh pr ready` refused by the safety check: card Q-RDY-1 (A all three ready, rec / B only #3004+#3018 / C keep drafts) in this thread. Drafts get only fast-tier CI.
- subscribe_pr_activity failed on these PRs; check-in scheduled 09:59Z.
- #2881 and #937 left open (2881 remainder: fa's own agent-built preview, merge-guard reading preview/agent-build, feature-staging.bpmn branch; 937 = epic). See folio-assistant-ip4l.
- 11:47Z user Q-TV20-1 = A. Fix committed locally (not pushed, swarm hold): cat-harness-tools branch claude/derive-enclosing-directory-reads 93b0f09 (declaredPlan: entry without `directory` fills the enclosing declared directory's kinds; tests in scripts/tests/sdlc/derive-at-publish-order.test.ts) + cat-harness branch claude/uml-overview-reads-artifact-index 929ac55 (uml:overview entry `reads: ["fhir-artifact-index"]`). Asked Merge Manager for release. Then: issue + draft PRs, re-pin fa, re-run #2953.
- 11:55Z pushed + opened: issue cat-harness-tools#1710, draft PRs cat-harness-tools#1711 (8deb791, merge first) + cat-harness#1153 (929ac55); subscribed. ready_for_review refused by safety check -> card Q-RDY-2 (A mark both ready rec / B keep drafts). Merge Manager will merge tools first, same batch.
- 13:03Z fa#3004 + #3018 MERGED. tools#1711 green at 0f8b74a (fixed check:reference-direction: comments must not name higher layers like smart-base) + cat-harness#1153 green 929ac55: both ready-to-merge, handed to Merge Manager (tools first). Next: fa re-pin, merge main into #2953, re-run stage.
- 15:30Z: tools#1711 + ch#1153 merged 13:03Z. Re-pin train fa#3048 red (5 new): mine = tools test literal "ns/context/v1.jsonld" refused by fa's declared-paths.test.ts (tools' own CI doesn't catch it). Fix tools#1726 (branch claude/derive-order-test-literal, 391cefd), draft; card Q-RDY-3 (A mark ready rec / B keep draft). Lesson: run fa's declared-paths.test.ts on new tools test literals.
- 18:27Z: re-pin train fa#3051 merged (tools 32aaeba, ch 225292f, both past the fix). #2953 merged main -> 0a70adf, stage GREEN, CI writer order ig-index:build -> uml:overview. BUT since fa#3047 (release-gated CI: non-release PRs run fast tier, gates skip QA working copy) the tv20 restore finds no producer -> reuse only helps `release`-labelled PRs. Card Q-TV20-2 (A merge / B close rec / C park).
- 18:30Z DONE: fa#2953 merged (0a70adf, owner Q-TV20-2 = A). All of fa#2953/#3004/#3018, tools#1711/#1726, cat-harness#1153 merged; tools#1710 closed. #2881 + #937 left open (2881: fa's own agent-built preview + merge-guard; 937 epic). Thread resolved.
