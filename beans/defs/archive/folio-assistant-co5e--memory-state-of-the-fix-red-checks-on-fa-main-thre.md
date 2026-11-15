---
# folio-assistant-co5e
$schema: bean/1.0.0
title: 'Memory: State of the "Fix red checks on fa main" thread (main reds across repos), as of 2026-11-02 04:40Z'
status: completed
type: task
priority: low
created_at: 2026-11-02T04:34:42Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `fa-main-red-2026-11-01.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: State of the "Fix red checks on fa main" thread (main reds across repos), as of 2026-11-02 04:40Z


Thread cmsg_017WNUkNK8kdDziPK58Pv6G9BbaFk6c5F5NCsTkzWpJ1eZ owns existing main reds across all repos (user 20:25Z 2026-11-01: "existing shoudl be fixed by an agent"). Cards are numbered Q-FMR-n. Merges happen under the user's own 12h window, which ends 2026-11-02 14:40Z (see folio-assistant-wmmg). Non-content PRs merge on green.

Done:
- fhir-harness#266 and #268, plus fhir-ig-publisher#12 (EXDEV seeder fix). The phw IG build is green.
- cat-harness#945 reverted #936. A held/materialised copy under subscriptions/ is never edited in place; check:declaration-claims already skips substrate-snapshot. Issue #944 is closed.
- cat-harness#947 (44bd7dd): process-bindings and reference-direction for wave 5.
- core#578: the fixity gate gives outsideMount -> unverifiable.
- bootstrap-tools#66 (fe7d9ca) gives unhinted fonts. The stale-SVG reds clear as pins move.
- tools#1368 (figure-export e2e: hover first, route on context) and tools#1369 (folio-mount e2e now reads who-iris/site/index.html, because community-list was removed on 10-30).

Pin drift, owned by the re-pin thread (…FDPvN5ktTn4HS2iruRVeZj):
- the core checklists are stale at pin 3f108a3;
- libraries:check needs libraries:derive.

Handed to the CI thread (…MRZwakYehKJLvPdaJcTu2m):
- translation pot;
- reference-direction refs in tools/core.

Q-FMR-11 A (user tap 06:16Z 2026-11-02): a pinned navbar unpins when the MOUSE leaves, and an open bar's avatar goes home. Code is cat-harness#953 (72215f2), tests are tools#1387 (817780b). All 25 hidden shard-1 e2e failures are fixed once fa pins move.

Gotcha: e2e shard 1 stops at render:bpmn:check, so its Playwright tests never ran on main. fa#2902 surfaced them.
