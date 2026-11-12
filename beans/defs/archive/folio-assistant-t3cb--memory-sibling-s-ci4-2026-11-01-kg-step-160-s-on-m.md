---
# folio-assistant-t3cb
$schema: bean/1.0.0
title: 'Memory: Sibling S-CI4 (2026-11-01): KG step 160 s on main; rail pass memo tools#1222, locale --core tools#1226, fa#2868 workflow + re-pin'
status: completed
type: task
priority: low
created_at: 2026-11-01T07:50:07Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `kg-step-changed-only.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Sibling S-CI4 (2026-11-01): KG step 160 s on main; rail pass memo tools#1222, locale --core tools#1226, fa#2868 workflow + re-pin


Thread "Export only changed KG nodes" (cmsg_017WNUkNK8kdDziPK58Pv6G9Wu54kMijZUtT21JZhBzcNq), sibling S-CI4 of folio-assistant-7w1o. Owner option C (2026-10-31 14:32Z).
KG step on fa main (run 41240607717, kgStepTimes in gh-pages build.json): 160 s = rail-standalone-pages 73 s (11,842 pages), instance-exports 25 s (10 x buildExport), kg-export 19 s, kg-locale-export 19 s (writes nothing), gen-slice kg 12 s.
- tools#1222 (issue #1221): rail pass memoises pagesNav per (toRoot, locale, scope), igSiteOwner per segment, one railDataWriter. Local 21.3 s to 7.0 s, all pages byte-identical.
- Editing scripts/lib/harness-rail.ts reshuffles minified navbar.js (committed in cat-harness), so navbar:assets:check fails: memoising the shared rail JSON there (3.2 s locally) needs a cat-harness regen PR too. Not done.
- tools#1226 (issue #1225): kg-locale-export --core <written core doc>; 28.9 s to 1.2 s.
- fa#2868: workflows pass --core; add the tools re-pin once both merge.
Local repro: fa clone + `bash .github/mount-from-lock.sh --root .` + bun install + `compose-docs.ts --out ./_docs`; synthetic site from gh-pages html paths (/home/claude/scratch/mksite.py); profile with `bun --cpu-prof`.
Next candidate: instance-exports 25 s (skip unchanged instances).
