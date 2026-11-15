---
# folio-assistant-7j96
$schema: bean/1.0.0
title: 'Memory: Triage of smart-base drafts #246/#259/#268/#273 and issues #242/#245 (thread …S3Bfr3EhHMBSScAVGY1pFJ); cards Q-SB-1..3'
status: completed
type: task
priority: low
created_at: 2026-11-08T09:28:56Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `smart-base-stale-drafts-2026-11-08.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Triage of smart-base drafts #246/#259/#268/#273 and issues #242/#245 (thread …S3Bfr3EhHMBSScAVGY1pFJ); cards Q-SB-1..3


Thread cmsg_017WNUkNK8kdDziPK58Pv6G9S3Bfr3EhHMBSScAVGY1pFJ, 2026-11-08 09:40Z.
- #242 CLOSED as completed (all items on main via #258, check-l2-dth.ts, dth-l1-to-l2-ingest skill).
- #246 (DAK kind fields, closes #245) at 823e579 and #273 (DTH voice rule refer-by-number-and-title; core check-reader-ids already on main) at df17449: main merged in via update-branch, tests pass, still draft. Safety check refused mark-ready without owner OK -> card Q-SB-1 (rec A: mark ready, hand to merge manager with label ready-to-merge + "ready: <sha>").
- #268 personas derivedFrom smart-ra (content) -> card Q-SB-2 (rec A: update, sushi, ready, merge).
- #259 DTH governance schemas proposal, gated on architect/PHC review, stray root schemas/ copy -> card Q-SB-3 (rec A: close, keep branch).
- Local test setup: mount platform, `bun install` in cat-harness-tools, symlink node_modules at repo root.
See folio-assistant-fofz, folio-assistant-8m1j.
- 09:31Z Q-SB-1 A (marked #246/#273 ready, subscribed). Q-SB-3 B: #259 tidied 316e846, stays draft. Q-SB-2 A then owner asked "why in smart-base / want smart-base clean of content": #268 HELD. Found: no repo references the DAK.Persona.System.{ClientRegistry,HMIS,LMIS} ids (only smart-base fixture + findings drafts); smart-ra depends on smart-base (backward link); WHO smart-base 1.0.0 has them. Card Q-SB-5: A close #268 + remove 3 (rec), B also EMR/Interop, C keep #268. smart-base-clinical harnessing went to the run-locally thread.
- 09:36Z Q-SB-5 B: issue #328 + draft PR #329 (branch claude/remove-system-personas, c98d92d) removes ClientRegistry/HMIS/LMIS/EMR/InteropPlatform; emr-system -> smart-ra PointOfServiceSystem; fixture regenerated (l1-scenario-vocabulary.ts --fsh-actors) + NPC scenario-candidates. sushi 0 err/17 warn (seeder with --mirror https://github.com/litlfred/fhir-package-mirror works). #268 closed superseded. Card Q-SB-6 asks mark #329 ready. #259 fix-up pushed.
- 09:41Z Q-SB-6 A (owner tap: mark #329 ready + merge on green). Deferred until swarm hold release (queue 43 at 09:40Z).
- 11:02Z #246 + #273 MERGED (#245 closed). #329 full tier red twice only on mounted cat-harness-tools remote-mount.test.ts 'hydrated mounts' (random subsets; known flake cat-harness-tools#1487); asked merge manager to judge (not labelled).
- 11:48Z #329 MERGED by merge manager. Thread done; only #259 stays draft pending architect/PHC review.
