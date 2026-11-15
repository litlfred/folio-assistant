---
# folio-assistant-vuu4
$schema: bean/1.0.0
title: 'Memory: Thread "Move left-nav into one shared file" (2026-10-31, done): rail already shared; real per-page nav churn was jtd-nav-activation; fixed by tools#1...'
status: completed
type: task
priority: low
created_at: 2026-11-12T09:45:00Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `slim-rail-cone.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Thread "Move left-nav into one shared file" (2026-10-31, done): rail already shared; real per-page nav churn was jtd-nav-activation; fixed by tools#1107, live via fa#2839


Thread cmsg_017WNUkNK8kdDziPK58Pv6G9TXKjDEmAzze4un8fQz6Kjv owned the rail/left-nav item of "Shrinking the cone" (doc https://claude.ai/artifact/JuXDLeTAi9XtNhabZd9jG7). Search ids, catalogue counts and pin links went to other threads.
Found 2026-10-31 on gh-pages cc01b54: the rail data was already one shared file (rail-<scope>.js, bean g196). The "12,700 pages" estimate was wrong for the rail. What still tied every Jekyll page to the whole nav was the theme's `<style id="jtd-nav-activation">` (nth-child positions).
Done 2026-10-31: cat-harness-tools#1107 merged (b03f70f, issue #1106); fa#2839 repinned tools to b03f70f, merged 4f8d2c7 (owner card taps). Related: folio-assistant-7w1o, folio-assistant-xq9j.
