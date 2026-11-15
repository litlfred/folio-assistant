---
# folio-assistant-y7jl
$schema: bean/1.0.0
title: 'Memory: Option D of CI bottleneck analysis (derive:publish skip records per main push) — tools#1702, local branch, waiting on swarm hold release'
status: completed
type: task
priority: low
created_at: 2026-11-08T09:51:46Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `writer-records-incremental-2026-11-08.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Option D of CI bottleneck analysis (derive:publish skip records per main push) — tools#1702, local branch, waiting on swarm hold release

User "D y" 2026-11-08 09:44Z approved option D (thread cmsg_017WNUkNK8kdDziPK58Pv6G9D13N7QDxT7C2RthacL6fK6).
- Issue cat-harness-tools#1702, draft PR #1707 (branch claude/writer-records-incremental, head 87b234c), pushed 10:10Z after hold release.
- 10:10Z user picked A (hybrid) — #1707 as built. User card 09:58Z picked B (re-pinner publishes, gate checks). Found: layer-mode PRs take lower layers AT MAIN, so code moves per lower-layer merge, not re-pin. New card Q (10:00Z) A hybrid (rec, built in #1707) / B re-pinner only / C runner-only. Records now in refs/cat/writer-records/<sha>|main (writer-records-ref.ts), gate publish:writer-records via writer-cone-verify --gate on main push.
- Design: record-writers job runs every main push; incremental = CAT_WRITER_RECORD+CAT_WRITER_SKIP: matching writers skipped and record carried (keeps own sha), only changed writers traced. Full strace re-record once per writer-record-hours (default 6 -> 24). WRITER_RECORD_VERSION 1 -> 2.
- Untraced records were rejected: unsound (a run whose inputs moved may read paths outside the old read set).
- Follow-up: user prefers caches published by whoever re-pins + checked by a gate, not runners (not in #1702).
- Local test setup: sibling clones cat-harness, bootstrap-tools, bootstrap + symlink ../node_modules -> cat-harness-tools/node_modules.
Related: folio-assistant-mapv, folio-assistant-k8nn.
- 10:54Z owner OK (card A: ready, merge on green); marked ready, label ready-to-merge, handed to the merge manager. User asked that the CI savings be measurable. Baseline (deep.txt, 11-07 07Z..11-08 07Z): derive step on PRs 1,316 min head (151 runs) + 805 min base (111); push runs 1,870 min (record jobs: cat-harness median 98, smart-base 72, bootstrap-tools 95 min). Re-measure: the same collect.py/deep.py over a 24h window starting once #1707 is merged AND fa has re-pinned tools (derive-at-publish runs at fa's tools pin).
- #1707 MERGED 11:59Z. Check-in scheduled 18:01Z (trig_01X5MVrChAkTfUbbvziMaP38) for the fa re-pin of tools, then a 24h measurement and a before/after chart for the user.
- fa re-pinned tools past #1707 (merge 839ee5d) at 2026-11-08 12:51Z (pin 3666855). Measurement window 11-08 13:00Z..11-09 13:00Z; check-in scheduled 11-09 13:15Z.
- MEASURED 11-09 (window 11-08 13Z..11-09 13Z, data /mnt/project-files/ci-speed/writer-records-after-2026-11-09/): FAILED. Every full runner record of cat-harness (10), fhir (6) and core (5) was cancelled at the 120-min timeout, so no v2 record was saved and PRs skipped 0 writers. The record jobs cost ~1,700 min/day. Layer mode mounts lower layers at main, so each tools merge forces a full record. Fix PR tools#1742 (draft, branch claude/writer-records-runner-off; force-push to the old branch was refused): input writer-record-on-runners default false. Card Q-WR-2 asks the user to merge it.
- 11-09 13:31Z user picked A; tools#1742 MERGED 13:32Z (runner records off). Thread done. Layer-mode pinned-lower-layers idea was offered, not requested.
