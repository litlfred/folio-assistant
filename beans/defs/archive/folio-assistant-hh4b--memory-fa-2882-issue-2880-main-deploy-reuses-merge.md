---
# folio-assistant-hh4b
$schema: bean/1.0.0
title: 'Memory: fa#2882 (issue #2880): main deploy reuses merged PR''s cqg publish-pages artifact (derive:publish) with 4 checks; thread "Reuse PR pages in main deploy"'
status: completed
type: task
priority: low
created_at: 2026-11-01T16:34:23Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `publish-pages-reuse-2026-11-01.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: fa#2882 (issue #2880): main deploy reuses merged PR's cqg publish-pages artifact (derive:publish) with 4 checks; thread "Reuse PR pages in main deploy"


Thread cmsg_017WNUkNK8kdDziPK58Pv6G98sR4WoxyG8s4rWQx7Fd3Ls, sibling of CI deep review folio-assistant-7exb (Q-SPD-8 D). Questions go back via that thread (folio-assistant-swl0).
PR litlfred/folio-assistant#2882 (draft, branch claude/main-deploy-reuse-publish-pages), script .github/scripts/publish-pages-reuse.sh, step id pages-reuse before derive:publish in docs-site.yml. Merge on green under user window 16:08Z-19:08Z.
Checks: tested-tree match; pages job success; `qa-working-copy-bundle.sh verify` vs that run's qa-working-copy manifest; pages contain no run id / tested commit / PR head / `<n>/merge`. record_writers always builds.
Gotchas: sandbox proxy blocks artifact blob downloads (productionresultssa*.blob.core.windows.net 403), so artifacts cannot be inspected locally. tools package scripts live under `checkoutScripts` in cat-harness-tools/package.json. staging-stamp.ts (GITHUB_SHA/RUN_ID) is in many writers' import closure; if pages carry stamps, check 4 makes every deploy fall back: read first main deploy's step summary after merge.
17:25Z: fa#2882 checks done: workflows gate, lint, skill chain green; 8 red all inherited (same failures on fa#2875 run 41324233275), PR comment 6561167142. Card Q-PGR-1 (A merge on no new failures, rec / B wait main green / C hold) open.
17:26Z merged d1fd76e (Q-PGR-1 A). First deploy run superseded; run 41332007979 (df1156c): QA-copy reuse fell back (PR's last run tested older tree), then security gate REFUSED at check:lockfile-pinning (also on 5a0c104 / fa#2869 run 41331374643), so pages reuse never ran. Reported to "Fix red checks on fa main" thread. Still unproven: read next successful main deploy's "Reuse the merged PR's publish-time pages" step.
