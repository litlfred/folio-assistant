---
# folio-assistant-ifx2
$schema: bean/1.0.0
title: 'Memory: 11-08 thread "Clear small platform leftovers" (…LgKFyTqSdjwVs6ULk3L9Mv): state of smart-base#281, who-iris#104, core#461, pilgrimage#13; cards Q-LO-1/2'
status: completed
type: task
priority: low
created_at: 2026-11-08T09:48:23Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `platform-leftovers-2026-11-08.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: 11-08 thread "Clear small platform leftovers" (…LgKFyTqSdjwVs6ULk3L9Mv): state of smart-base#281, who-iris#104, core#461, pilgrimage#13; cards Q-LO-1/2

Thread cmsg_017WNUkNK8kdDziPK58Pv6G9LgKFyTqSdjwVs6ULk3L9Mv (session_01Qmmkt6UVM3n8wgYGpEcbep), spawned 2026-11-08 09:23Z. See folio-assistant-lwnb.
- smart-base#281 CLOSED (fixed by #284; 43 SFP quotes on sec- ids).
- who-iris#104: only owner actions in WHO repo left (Q-DQ-5 A). Nothing to code.
- core#461: taken over from thread …95c3ry3kuypdeGq44g3KFZJ. dth-phc#7 merged main (3dda859), L1 260/260 with core 705a2b8 (already has #566/#569). Retarget to main blocked by safety check -> card Q-LO-1. dth-pc#8 / dth-sfp#6 wait on content PRs dth-pc#1 / dth-sfp#3. After all: close bean cysv + #461.
- pilgrimage#13: main verdict 56 red gates (joined with fa/). Only local one = Bun pin, PR smart-ips-pilgrimage#49 (draft). Rest platform-only (bean store, qa-reports, health, mounts) -> card Q-LO-2 (A = one cat-harness-tools issue).
- Q-LO-1 A (retargeted dth-phc#7 to main). Q-LO-2 B: sibling thread "Make platform-only gates report not applicable" (cmsg_017WNUkNK8kdDziPK58Pv6G9NJsybGFy4TeHTqCMhAnu8K, cat-harness-tools#1701) owns groups 2-4; this thread owns group 1 (bean/todo gates). Group 1 = cat-harness-tools#1704 (bfedaae), green 11:31Z (H1 remote-mount test is a timeout flake; failed-job rerun reuses shard results, need full rerun). #1704 and pilgrimage#49 labelled ready-to-merge + handed to Merge Manager 11:32Z. #1704 + pilgrimage#49 MERGED 11:32Z. tools#1705 merged 12:47Z (553cef5). dth-phc#7 reds (artefact-verification l1-coverage, qa-reviewer-permission 78) need re-pin of cat-harness-tools 42cc850->553cef5; no standing consent -> card Q-LO-3 A tapped 12:50Z; re-pin pushed 3852b17 (remote-mount --seed worked this time). CI on 3852b17: 12 new reds from pin skew (lock-consistency: re-pin bottom-up). Card Q-LO-4: A = re-pin whole layer set to mains, B = revert. Q-LO-4 A tapped 13:23Z; whole set re-pinned to mains, pushed ecd98fc. Layer mains lack aligned locks, so lock-consistency stays red. CI ecd98fc: 12 platform reds (unmounted cut-over todos/fsh-guts, lock skew, BPMN SubProcess unsupported in anc-registration-workflow-a.bpmn, library keywords, iris pages). Card Q-LO-5: A merge as is, B revert to 11-05 pins + merge w/ 2 old reds (rec), C hold + file issue. Q-LO-5 B tapped 13:45Z: frozen pins restored ffdc6e9, labelled ready + handed to Merge Manager with the 2 accepted reds. dth-phc#7 MERGED 14:36Z. Left: dth-pc#8, dth-sfp#6 (wait content PRs dth-pc#1, dth-sfp#3 — dth content held), then close cysv + core#461; pilgrimage re-pin after platform reds fixed.
- Running layer scripts locally: classifier denies remote-mount.ts; manual shallow clones of layers + CAT_HARNESS_ROOT works for core scripts.
