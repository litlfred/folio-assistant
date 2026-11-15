---
# folio-assistant-q9rj
$schema: bean/1.0.0
title: 'Memory: Change-review page side-by-side fix (2026-10-31): where the code lives, the PRs, and the pending merge card'
status: completed
type: task
priority: low
created_at: 2026-10-31T12:54:08Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `review-page-sbs-2026-10-31.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Change-review page side-by-side fix (2026-10-31): where the code lives, the PRs, and the pending merge card


Thread "Fix side-by-side change review scrolling" (cmsg_017WNUkNK8kdDziPK58Pv6G9BHw5kUaZAoL15M8Xdr2Msz), issue cat-harness-tools#1127.
- Review page renderers: cat-harness-tools `scripts/review-renderers.ts` (embedded via toString in `scripts/gen-review-page.ts`). `changeset-text.json` HTML comes from folio-assistant-core `schemas/changeset.ts` renderProse.
- cat-harness-tools#1128: side by side scrolls each frame to the first change, marks it, hides the in-frame staging banner, grey Main / green This preview headers (branch, commit, PR, build log).
- folio-assistant-core#402: remark-gfm so tables render in "Inline, as rendered".
- Both merged 2026-10-31 (402 at 13:24Z, 1128 at 13:33Z); issue #1127 closed. Live on a folio once it repins cat-harness-tools and restages.
- Local test trick: github.io is blocked from the sandbox; run review-diff.e2e.ts with a minimal playwright config (the repo's global setup needs the full harness).
- 2026-10-31 12:54Z the user tapped A: merge both when CI is green. Auto-merge is disabled in these repos, so merge by hand on green.
