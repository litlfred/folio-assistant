---
# folio-assistant-b963
title: 'COLD START: the entry documents named scripts/ for the whole split, and nothing checks a command path'
status: todo
type: bug
priority: normal
tags:
    - instruction-gap
created_at: 2026-09-20T18:05:19Z
updated_at: 2026-09-20T18:05:19Z
parent: folio-assistant-ahvw
---

Found by the goal-review sweep of 2026-09-20 13:45–17:45 UTC (session_017PqeiS4JYySSWGAYLedmus, bean `mgta`, issue #578). An instruction gap: something the instructions said that the sweep could not do as written, said two ways, or did not say.

## Measured
`AGENTS.md` line 3 (the cold-start line every agent runs first), lines 192 and 351, `README.md` lines 4 and 371, and `cat-harness/docs/guides/agent-onboarding.md` lines 96–97 named `scripts/install-beans.sh`, `scripts/beans-fallback.ts`, `scripts/gen-schema-docs.ts` and `scripts/gen-skill-docs.ts`. There is no root `scripts/`; all four live under `cat-harness/scripts/` since the split. `bash scripts/install-beans.sh` fails with "No such file or directory", so a fresh container following the first instruction it reads gets no work-plan CLI. Nine occurrences, repointed on branch `claude/sharp-fermi-xvs06i`.

## The gap
`check:agents-claims` reads LOCATION claims of the shape `symbol` in `module.ts` and ABSENCE claims; `check:agent-entry-links` reads links. Neither reads a **command line**, so a path inside a fenced command can rot silently. AGENTS.md itself records the same defect for the two generator commands "until 2026-09-20" — it was fixed in one file and not in the other two.

## Done when
- [ ] A check reads every fenced command in the entry documents (AGENTS.md, README.md, the onboarding guide) and fails when a path in it does not resolve
- [ ] The nine occurrences are confirmed repointed on main
