---
# folio-assistant-9954
$schema: bean/1.0.0
title: 'Memory: Drains work ONLY on issues opened by litlfred; leave all others (Jose, Ritika, bots) alone (user rule 2026-11-01 09:48Z)'
status: completed
type: task
priority: low
created_at: 2026-11-01T09:49:07Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `hands-off-jose-ritika.md` (memory type: feedback) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Drains work ONLY on issues opened by litlfred; leave all others (Jose, Ritika, bots) alone (user rule 2026-11-01 09:48Z)


Work only on GitHub issues opened by litlfred. Don't touch issues opened by anyone else, including Jose, Ritika and bot-filed issues (e.g. github-actions main-red issues): no comments, PRs, closing or relabelling. User: "dont touch issues from jose or ritika" (09:48:36Z, cmsg_017WNUkNK8kdDziPK58Pv6G91o4ATWJLFY8vPKNLyTJxM8), then "only litlfred" (09:48:41Z, cmsg_017WNUkNK8kdDziPK58Pv6G9UiyN7hT83uBs26PZiLictD).

**Why:** other people's issues are left to their authors.

**How to apply:** in any issue/bean drain, check the author (`gh api repos/O/R/issues/N --jq .user.login`) and skip unless it is `litlfred`. See folio-assistant-wmmg.
