---
# folio-assistant-1zrq
$schema: bean/1.0.0
title: 'Memory: Review page "What to expect in this review" pane (cat-harness-tools#1153/#1154): data source and PR-body marker format'
status: completed
type: task
priority: low
created_at: 2026-11-12T09:45:00Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `review-brief-pane.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Review page "What to expect in this review" pane (cat-harness-tools#1153/#1154): data source and PR-body marker format

2026-10-31: the staging review page (cat-harness-tools `scripts/gen-review-page.ts` + `scripts/review-brief.ts`) gets a "What to expect in this review" card. Issue cat-harness-tools#1153, PR #1154, merged 2026-10-31 17:16Z (3fbadcd). Live on a folio once it repins cat-harness-tools and restages.

- Works for ANY branch (user: not all branches are change sets). Source is the PR: title, body, issue it closes, CS-nnn chip when the title names one.
- If the PR body has `<!-- review-brief -->` … `<!-- /review-brief -->`, only that section shows. Change-set agents fill it with core#431 `agent-record.ts brief` (Overall + one line per comment + Where to look).
- Read live from api.github.com in the browser; fallback `review-brief.json` written by `stage-local.ts` via `gh`.
- Local test: clone bootstrap, bootstrap-tools, cat-harness as siblings and `bun install` in each, then `bun test` works.
Related: folio-assistant-q9rj, folio-assistant-y63k.
