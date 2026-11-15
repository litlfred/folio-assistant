---
# folio-assistant-on9m
$schema: bean/1.0.0
title: 'Memory: User does not want PR previews moved to a separate GitHub Pages repo (Q-SPD-5 B withdrawn 2026-11-01)'
status: completed
type: task
priority: low
created_at: 2026-11-01T11:12:42Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `no-preview-repos.md` (memory type: feedback) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: User does not want PR previews moved to a separate GitHub Pages repo (Q-SPD-5 B withdrawn 2026-11-01)

Do not move folio-assistant (or other folio) PR previews to a separate "preview" Pages repo. Previews stay under STAGING/<slug>/ on the repo's own gh-pages.

**Why:** 2026-11-01 11:12Z the user wrote "wait.. no i dont want preview repos" (cmsg_017WNUkNK8kdDziPK58Pv6G9VX2h8YxLAnAavVAoFTkNHe), right after Q-SPD-5 B started thread "Move fa previews to their own Pages repo". Nothing was changed or opened.

**How to apply:** fix preview/main deploy collisions inside the same gh-pages (push gate, sharing, cone deploys), never with a new repo. Related: folio-assistant-xq9j, folio-assistant-mwfh.
