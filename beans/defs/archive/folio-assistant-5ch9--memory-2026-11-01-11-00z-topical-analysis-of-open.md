---
# folio-assistant-5ch9
$schema: bean/1.0.0
title: 'Memory: 2026-11-01 11:00Z topical analysis of open beans/issues (211 items), artifact link, how counted, cards Q-TOP-1..4'
status: completed
type: task
priority: low
created_at: 2026-11-01T11:02:24Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `open-work-by-topic-2026-11-01.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: 2026-11-01 11:00Z topical analysis of open beans/issues (211 items), artifact link, how counted, cards Q-TOP-1..4


Thread "Analyze open beans and issues by topic" (cmsg_017WNUkNK8kdDziPK58Pv6G9UvDw8WGh9bR4o7QWX3LesX). Artifact: https://claude.ai/artifact/XUBpC6T8EmhYEKhJrZDTXn
Counted 11:00Z: 92 open beans + 119 litlfred-opened issues = 211 across 23 harness repos. Top topics: DTH 45, aai-programme 32, trust/VHL 29, BPMN 26, CI 23, review sheets/change sets 19.
How: issues via `gh api search/issues q='is:open is:issue author:litlfred user:litlfred'`; beans via each repo's `cat/<store>/beans` branch, `beans/defs/*.md` (not archive) — fa store lives in folio-assistant `cat/cat-harness/beans`; smart-ra store `cat/dpi-h-ra/beans` keeps beans in `beans/` directly. git clone over the proxy works without add_repo; gh api repos/... does not.
Cards (all recommend A): Q-TOP-1 answered B 11:02Z: PARK aai-programme, no agent work until the WHO owners answer; Q-TOP-2 answered A 11:03Z (sibling asked of coordinator) for ~10 functional no-PR items (core#472, cat-harness#880, tools#962, tools#1251, who-iris#104); Q-TOP-3 answered C 11:03Z: leave editor/committee items in their threads, no hand-over page; Q-TOP-4 answered A 11:03Z (sibling asked of coordinator, cards Q-EPIC-n): audit old epics (1xhc, 0lmb, slw1, 5a3l, vuip, yj32) and fa#223.
