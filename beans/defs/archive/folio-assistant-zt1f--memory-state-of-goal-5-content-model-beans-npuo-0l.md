---
# folio-assistant-zt1f
$schema: bean/1.0.0
title: 'Memory: State of GOAL 5 content-model beans (npuo, 0lmb, slw1, x80s) and the summary backlog, as of 2026-11-01'
status: completed
type: task
priority: low
created_at: 2026-11-01T21:09:12Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `goal5-content-model.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: State of GOAL 5 content-model beans (npuo, 0lmb, slw1, x80s) and the summary backlog, as of 2026-11-01


Thread "Build the content-model machinery" (cmsg_017WNUkNK8kdDziPK58Pv6G9AE5RN2Qg6JSes9oQatYKLS) owns npuo/0lmb/slw1/x80s under MVP fa#2894 Phase 2c.

- Canonical beans for these live in folio-assistant-core `beans/defs/`. The `cat/cat-harness/state` branch copy is stale (last written 2026-10-03), so don't trust its statuses.
- 0lmb: all 10 children closed. Close-out PR: folio-assistant-core#529.
- slw1: only open child is x80s. The x80s tooling is done.
- Backlog on 2026-11-01 (`bun run cat summaries` after `bash .github/mount-from-lock.sh --root .` in fa): 1,693 blocks with no summary. 1,493 are in core (c2pa-2026-specification-2-5 731, dspace-7-rest-contract 762). 200 are in cat-harness, already drafted in cat-harness#835/#836 and waiting on the fa pin. 3,426 drafts await the user's `bun run cat narratives`.
- Q-CM-2 answered A (2026-11-01 21:00Z): 5 coordinator-spawned threads drain the core blocks and merge on green, plan in /mnt/project-files/x80s-drain-2026-11-01/README.md. User wants a QA report showing the drafts are NOT human-adjudicated; this thread writes qa-report.md there. Afterwards: close x80s, slw1 and npuo, and open a separate bean for the person review.
- DONE 2026-11-02 03:45Z: #529, #561 (C2PA 771 drafts), #562 (DSpace 762 drafts) and #571 are merged. 0lmb, x80s, slw1 and npuo are completed. Person review = bean pvq4 (outside the MVP). The QA report thread cmsg_017WNUkNK8kdDziPK58Pv6G9W1fjZj8SLo3JMUDJU9fNoY finalises qa-report.md. 200 cat-harness blocks clear with the next fa cat-harness pin.
- DSpace part 2 (s255–s508, 254 drafts): core PRs #530 → #551 → #552 → #553 → #554, stacked, merged in order. Tool note: `bun run cat summaries:record <file>` takes no `--`. The fa mount holds the pinned core, so record there and copy summaries.json into a checkout of core main.

**Why:** a later thread would otherwise re-measure and re-ask.
**How to apply:** Summaries are sidecars and never change the ingested text.
