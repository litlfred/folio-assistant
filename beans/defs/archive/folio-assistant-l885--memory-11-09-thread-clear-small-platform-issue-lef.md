---
# folio-assistant-l885
$schema: bean/1.0.0
title: 'Memory: 11-09 thread "Clear small platform issue leftovers" (…Wgnuvn3Tp7VT2NxFygsoV4): fhir-harness#316, who-iris#104, pilgrimage#13/#51 state; cards Q-LO-6/7'
status: completed
type: task
priority: low
created_at: 2026-11-09T13:03:27Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `platform-leftovers-2026-11-09.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: 11-09 thread "Clear small platform issue leftovers" (…Wgnuvn3Tp7VT2NxFygsoV4): fhir-harness#316, who-iris#104, pilgrimage#13/#51 state; cards Q-LO-6/7

Thread cmsg_017WNUkNK8kdDziPK58Pv6G9Wgnuvn3Tp7VT2NxFygsoV4 (session_01Qmmkt92M4zxJQLtTNEU3U2), spawned 2026-11-09 13:00Z. Follows folio-assistant-ifx2.
- fhir-harness#316: fully done on main (#317 -> #314 branch b916014e, #314 merged to main 3b583fd9, 11-09 10:36Z). Closing the issue was denied by the auto-mode classifier -> card Q-LO-6 (A close it).
- who-iris#104: only owner actions in WHO/who-iris left (Q-DQ-5 A keeps it open). Nothing to code.
- pilgrimage#51: PR smart-ips-pilgrimage#52 (README issues link + 9 IG Publisher files in index.config.json contentTypes.ig.include, read by check:undeclared-files since tools#1701). Draft, subscribed.
- pilgrimage#13: main "No new failures" green but absolute reds remain, all upstream (unmounted cat-harness state dirs, health id ambiguity x3, stale baselines/declarations, nav-names). Pins still tools d2e4e7c (11-07). Card Q-LO-7: user chose A (re-pin now) 13:32Z -> PR smart-ips-pilgrimage#53 (all 9 layers to mains, via node mount-from-lock.ts then bun cat-harness-tools/scripts/remote-mount.ts --seed ... --consent-by litlfred, evidence on stdin; root `bun install --no-save` needed before agent-surface generators). Known red: lock-consistency skew (who-iris/smart-trust-tools own locks older). Q-LO-6 A: fhir-harness#316 closed 13:33Z.
- Classifier blocks from this thread: adding labels, ccr/ready_for_review. Merge Manager does those.
- 11-09 15:25Z #52 merged, #51 closed. 11-11 16:37Z owner closed #53 as superseded by smart-ips-pilgrimage#66 (re-pin to mains + publish on push; card Q-WRAP-1 B). #13 stays open, now rides #66. Thread done.
