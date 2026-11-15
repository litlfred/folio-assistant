---
# folio-assistant-pghh
$schema: bean/1.0.0
title: 'Memory: A repo''s first harness PR (adds index.lock.json) is red by construction until cat-harness-tools#1235 merges; the owner approved merging it, and wants...'
status: completed
type: task
priority: low
created_at: 2026-11-12T09:45:00Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `first-harness-pr.md` (memory type: feedback) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: A repo's first harness PR (adds index.lock.json) is red by construction until cat-harness-tools#1235 merges; the owner approved merging it, and wants it to be green


A repository's first harness PR (the one that adds `index.lock.json`, `<name>.json` and `harness-pr-checks.yml`) fails index-mode checks: `Prepare the main side` cannot mount main (no lock), so `No new failures` says "could not determine". smart-trust-phw#4 and smart-ips-pilgrimage#7 (owner card Q-VC-9 A, 2026-11-01 09:21Z) were merged red for this reason.

**Why:** owner, 2026-11-01 09:22Z: "make sure that is a noted exception on merge/green/red... can it not be red in that case?"
**How to apply:** this is a known exception, but merging red still needs the owner's own OK. The fix is cat-harness-tools#1235 (issue #1234): when main has no lock, the base side is the PR's own tree, so the PR is green and the summary says it sets the first baseline. #1235 MERGED 2026-11-01 11:01Z, so first harness PRs should now be green; if one is still red, the failure is real. See folio-assistant-wmmg.
