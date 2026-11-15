---
# folio-assistant-7n1j
$schema: bean/1.0.0
title: 'Memory: Second CI thread (MVP sibling #1, 21:32Z) split: fa#2857/ksek, fs43, 3fva, 1xhc/fa#937, rwmf; state of each epic and what blocks closing'
status: completed
type: task
priority: low
created_at: 2026-11-01T21:35:45Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `platform-ci-sibling-2026-11-01.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Second CI thread (MVP sibling #1, 21:32Z) split: fa#2857/ksek, fs43, 3fva, 1xhc/fa#937, rwmf; state of each epic and what blocks closing


Thread "Stabilize platform state and CI" (cmsg_017WNUkNK8kdDziPK58Pv6G9LpArXTbi8RCePgLUzgqwrT), spawned 2026-11-01 21:32Z beside the older CI thread folio-assistant-xowb. Split agreed 21:33Z: this thread takes fa#2857 + beans fs43, 3fva, 1xhc, ksek, rwmf and fa#937; the older one keeps 7mwa, cat-harness main red, regen dry run, cancelled mains, ledger.

State 21:50Z:
- ksek: COMPLETED 23:05Z (fa#2857 merged 36b4fe0 by litlfred; beans 86a2e9a).
- fs43: COMPLETED by tools#1330 (owner Q-DQ-1 A, 22:39Z); my #1339 closed as duplicate.
- 3fva (tools): waits on 7mwa (other thread) and box "every Phase 3 reader reads the branch"; child 18p1 is draft (post-MVP, reparent before closing).
- 1xhc (tools) = fa#937: open children g196 (Slim preview thread …S8tFsJesctgzCegsSXJVcb, closes after fa#2893 + deploy measure), fwtz (cone deploy thread …FTTVvSSqoVgKV7nZkCWHDu), p7mb (older CI thread; needs tools#1347 merged + pinned into fa + 2 clean regen runs, 22:09Z). MVP scope per MVP thread 21:36Z (all queue items are MVP). Status asked 21:40Z; take over any stalled >2h. Close 1xhc + fa#937 when all three close.
- rwmf: milestone, 6 todo children; stays open.
Bean homes: tools main beans/defs (fs43, 3fva, 1xhc, 7mwa, g196); fa branch cat/cat-harness/beans (ksek, rwmf, fwtz, p7mb).
- 02:47Z MVP handed wave 5 tools reds (/mnt/project-files/pin-check-2026-11-01/wave5-layer-reds.md): libraries:check = usedBy drift (not versions) -> tools#1363 re-derive; check:bun-pin vs reusable-only sites -> tools#1364 (follows job-level uses: into mounted layers, else lists delegated). Merge on green (window to 2026-11-02 14:40Z), then message re-pin prep thread …FDPvN5ktTn4HS2iruRVeZj. fhir-harness zod/@types/fhir node is fhir-harness's own.
- Repro an index: in fa clone `bash .github/mount-from-lock.sh --root .`, swap a layer dir with `git archive`, `bun install`, run `bun <layer>/scripts/x.ts`.
- 03:43Z tools#1364 and #1363 merged (by litlfred); Q-PSC-1 closed.
- 04:15Z tools#1353 broke layer checks for callers with no tools mount (cat-harness#946); fix tools#1367 falls back to fa index lock's tools pin. Merge needs owner card (safety check refuses merges).
- 05:xxZ 11-02: #1371 (security) closed as dup; #1367 survives, all green; Q-PSC-2 names #1367. On merge: tell S9B + re-pin prep thread.
- 05:54Z tools#1367 MERGED; S9B + re-pin prep told. Q-PSC-2 done.
- 06:18Z owner Q-MVP-4 A: smart-base#278 own-lock job is post-MVP (noted in fa#2894); no change now.
