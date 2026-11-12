---
# folio-assistant-kzm3
$schema: bean/1.0.0
title: 'Memory: Why fa previews'' derive step takes 10-13 min (QA working copy built inside uml:overview; skill:register re-runs 9 checks), fix fa#2867'
status: completed
type: task
priority: low
created_at: 2026-11-01T07:37:05Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `preview-derive-slow-s-ci2.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Why fa previews' derive step takes 10-13 min (QA working copy built inside uml:overview; skill:register re-runs 9 checks), fix fa#2867


Thread "Find why previews build slowly" (cmsg_017WNUkNK8kdDziPK58Pv6G9KQNjv5txJn3Uk9CvkYMYyF), sibling S-CI2 of folio-assistant-7w1o, 2026-11-01.

Measured (job logs readable via `gh api repos/.../actions/jobs/<id>/logs`):
- Preview job 124708101507: derive 817 s, of which uml:overview 511 s — it builds the QA working copy (qa:refresh, 29 writers) because a preview has no stamp.
- Main docs-site job 124653530529: separate "Produce the QA working copy" step 442 s + derive 320 s. Main is NOT faster overall; the "4 min" leaves that step out.
- In that build skill:register = 351 s, of which 233 s re-runs 9 verify checks; fa's code-quality-gates gates-kg runs skill:register:check anyway.
- writer-skip.txt was not present on any STAGING slug at 07:35Z (previews predate fa#2861).

Fix: fa#2867 (issue #2865, branch claude/preview-skip-register-verify): feature-staging sets CAT_SKILL_REGISTER_VERIFIED_BY_GATES from skill-register CHECKS. Follow-ups: same 233 s in cqg qa-working-copy job and docs-site; skill:register's writes duplicated by derive writers (subgraph:jsonld 30 s).

2026-11-01 16:20Z: fa#2867 MERGED (b7aa5d0) on owner's Q-CI2-3 A. Also covers cqg qa-working-copy job (Q-CI2-1 A; QA build 442 s → 251 s). docs-site deliberately unchanged (security gate reads results). Main's reds at merge: e2e 1/3+3/3 (stale smart-base SVGs), translation:pot:check (ihris file), bootstrap:schemas:check (graph.schema.json stale), bun test shards (real bean store, entanglement dangling).
