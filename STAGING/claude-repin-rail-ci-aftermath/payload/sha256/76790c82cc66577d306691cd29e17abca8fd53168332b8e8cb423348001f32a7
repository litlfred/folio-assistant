---
# folio-assistant-zckw
$schema: bean/1.0.0
title: 'check:declared-paths: rewrite the ~1,950 literals in 70lx-moved cat-harness-tools code to resolve through declarations (owner: no re-baseline)'
status: in-progress
type: task
priority: high
created_at: 2026-10-11T07:00:59Z
updated_at: 2026-10-11T15:35:00Z
parent: folio-assistant-ml9h
---

Owner ruling 2026-10-11 ~06:55 UTC (drain ml9h, asked in session_01JkK6uP3iU2etyMbrw7v3cu): **Rewrite the code** — no re-baseline. At folio-assistant#2529's pins check:declared-paths reports 199 named files (23 new) and 1973 literals unaccounted for against a baseline of 27, in 46 cat-harness-tools files that 70lx moved from cat-harness (it scans codeRoots = [root, TOOLS_ROOT]).

Assigned to lane B (session_01QmRtjQNyHiH2RuimTfuJDu, owns cat-harness-tools).

## Done when
- [x] every literal resolves through a declaration resolver, or is marked `declared-path-literal: <reason>`
- [ ] check:declared-paths green at the next folio-assistant re-pin with the baseline NOT raised — green on cat-harness-tools main (nothing above baseline, 0 lost / 0 new witnesses, declared-paths.test.ts 11/11, lane B); the folio-assistant re-pin (#2529) still has to show it

## Progress 2026-10-11 15:35 UTC (lane A, relaying lane B)
Merged: cat-harness-tools #128 (16 source files through the declaration resolvers), #129 (witness list; skillMdFile()), cat-harness #154 (adversarial-checklist refs as names). Closes when #2529 re-pins tools main and the gate is green there.
