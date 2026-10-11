---
# folio-assistant-zckw
title: 'check:declared-paths: rewrite the ~1,950 literals in 70lx-moved cat-harness-tools code to resolve through declarations (owner: no re-baseline)'
status: todo
type: task
priority: high
created_at: 2026-10-11T07:00:59Z
updated_at: 2026-10-11T07:00:59Z
parent: folio-assistant-ml9h
---

Owner ruling 2026-10-11 ~06:55 UTC (drain ml9h, asked in session_01JkK6uP3iU2etyMbrw7v3cu): **Rewrite the code** — no re-baseline. At folio-assistant#2529's pins check:declared-paths reports 199 named files (23 new) and 1973 literals unaccounted for against a baseline of 27, in 46 cat-harness-tools files that 70lx moved from cat-harness (it scans codeRoots = [root, TOOLS_ROOT]).

Assigned to lane B (session_01QmRtjQNyHiH2RuimTfuJDu, owns cat-harness-tools).

## Done when
- [ ] every literal resolves through a declaration resolver, or is marked `declared-path-literal: <reason>`
- [ ] check:declared-paths green at the next folio-assistant re-pin with the baseline NOT raised
