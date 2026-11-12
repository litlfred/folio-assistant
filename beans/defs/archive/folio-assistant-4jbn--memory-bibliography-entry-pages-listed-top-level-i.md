---
# folio-assistant-4jbn
$schema: bean/1.0.0
title: 'Memory: Bibliography entry pages listed top-level in Pages rail; fix = parent/grand_parent front matter (core#716, issue #715) + rail labelUnder (tools#1780)'
status: completed
type: task
priority: low
created_at: 2026-11-10T19:35:55Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `bib-entries-nested-nav-2026-11-10.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Bibliography entry pages listed top-level in Pages rail; fix = parent/grand_parent front matter (core#716, issue #715) + rail labelUnder (tools#1780)

Thread "Nest bibliography entries under Bibliography" (cmsg_017WNUkNK8kdDziPK58Pv6G9G6g9EGbG9kGSg8u3W5fieF), 2026-11-10.
- Cause: folio-assistant-core scripts/bibliography-page.ts wrote no `parent`; rail (cat-harness-tools scripts/lib/jekyll-pages-nav.ts) nests only by parent title, plus a title-prefix fold for `Bibliography: …` siblings. Entry pages have plain titles, so went top-level.
- Fix drafts (subscribed): core#716 (sub-graph pages parent Bibliography; entry + asset pages parent "Bibliography: <slug>", grand_parent Bibliography) and tools#1780 (`labelUnder` strips the parent's words from child labels). Non-content. Either order. Sites see it after re-pin + publish.
- Local test setup: scratch node_modules at /tmp/claude-0/nm symlinked to /home/user/node_modules with @litlfred/* symlinked to sibling clones (cat-harness needed for harness root). 8 navbar tests fail on main in this sandbox (env), unrelated.
Related: folio-assistant-q5sw, folio-assistant-o6rs
- 19:40Z both PRs green + clean; card Q-BIBNAV-1 (A mark ready + merge manager, rec). Coordinator handed both to merge manager under standing 'merge green' rule; marking ready from this thread was refused by the safety check.
- 19:55Z core#716 + tools#1780 MERGED (owner card A). Before/after rail shots in /mnt/project-files/bib-nav-nesting-2026-11-10/ (after = live gh-pages with rail-*.js pages patched by real pagesNav; script /tmp/claude-0/after.ts). Live after IG re-pin + publish. Thread left open for owner review.
- 11-12 08:40Z user: biblio still flat on smart-trust, "keeps happening across harnesses". Cause: IG pins predate core 05f5525 (#716). Has fix + nested live: dth-sc, dth-phc. Old pin: smart-trust (core 62fe7e7, gh-pages 11-01!), -phw, smart-immunizations, -ips-pilgrimage, smart-hiv, smart-base, smart-ra. dth-hrh has pin but publish 11-10 stale. No site uses cat-harness-tools standing-repin.yml (trust.standing). Card Q-BIBNAV-2 (A re-pin once after core#760 / B + standing re-pin rec / C standing only).
- 08:42Z coordinator: merge manager runs bottom-up re-pin cascade (core#761 -> smart-base -> who-iris/smart-ra -> dth-hrh); publish-on-push thread …GSmgusK4K8TCWBQfu5rM7S re-pins IG rollout PRs. Do per-IG re-pins WITH them, not separate PRs.
- 09:08Z owner typed "B" after tapping A (card shows A): doing B. Re-pins: rollout thread (smart-trust#198 etc.) + merge manager adds smart-hiv. Standing re-pin: issue tools#1948; smart-trust#200 draft (stacked on #198): trust.standing on all remote layers + .github/workflows/standing-repin.yml (workflow push WORKED). Owner must enable Allow auto-merge (off on smart-trust) + add REPIN_TOKEN secret per repo. Script /tmp/claude-0/standing.py. Other IGs after their re-pins merge.
