---
# folio-assistant-luxq
$schema: bean/1.0.0
title: 'Memory: IG left-nav TOC missing on thin pages (artifacts/toc/artifact/*/IG API hub); fix fhir-harness#279 (issue #278), 2026-11-02'
status: completed
type: task
priority: low
created_at: 2026-11-02T12:04:37Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `ig-thin-pages-toc.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: IG left-nav TOC missing on thin pages (artifacts/toc/artifact/*/IG API hub); fix fhir-harness#279 (issue #278), 2026-11-02


User 2026-11-02: smart-trust's artifacts.html shows no IG TOC in the left navbar while narrative pages do.

Cause: the rail's IG section is a DECLARED nav (fhir-harness build-ig-site.ts `igTocNav` -> `data-fa-visualiser-nav` + `fa-visualiser-label` meta), written only by the Jekyll layout of narrative pages. Thin pages (config ids ig-artifact-page, ig-index-page, ig-api-hub) are finished HTML drawn by script, so cat-harness-tools `injectRail` found nothing. On gh-pages: narrative pages load rail-45ihyd86ut (has documentIndex), thin pages rail-1dzse4kjkc2 (none).

Fix: `stampIgTocNav(site)` in fhir-harness scripts/ig-repo-site.ts, run in `publisherPages` (a site step, before the rail pass). PR fhir-harness#279 MERGED 12:44Z as b0150c2 (Q-TOC-1 A), thread cmsg_017WNUkNK8kdDziPK58Pv6G9T2NwvJrwiuyNa9WdtSZ8Ag. Live after smart-trust re-pins fhir-harness (pinned 4dc8571 as of 12:45Z). Not covered: index-hosted IG sites via stage-ig-sites.ts (folio-assistant), which may have the same gap.

Local test setup: fhir-harness needs siblings cat-harness-tools, folio-assistant-core, bootstrap-tools, cat-harness under node_modules/@litlfred (symlinks) to run bun test.

Code freeze on lower layers from 2026-11-02 13:16:56Z (Q-MVP-5 A). #279 merged before it. A smart-trust lock re-pin is a site change, still allowed. Card Q-TOC-2 open: A = fhir-harness-only re-pin PR (recommended), B = all layers, C = wait.

14:39Z Q-TOC-2 = B (all layers to main). smart-trust#138 (branch claude/repin-all-toc) opened 14:5xZ, marked ready, merge on green. Recipe: copy (not symlink) cat-harness-tools + bootstrap-tools into the site, CAT_HARNESS_ROOT=<cat-harness clone>, remote-mount.ts --fresh --seed ... then --fresh with no seed, then --check. Workflow-file pushes to smart-trust worked.

15:05Z #138 CI: 2 new reds. navbar:assets (cat-harness main navbar.js predates tools#1407) -> held tools at 3556cf9 (cadc213). who-iris:dc:render (108 dublin-core files stale vs core dspace slash IRIs) -> asked slash-IRI thread to regen who-iris (not in who-iris#170); re-pin who-iris after.
15:05Z who-iris#172 (ea41bd2) regenerates dc files; slash thread merges on green and tells me; then re-pin who-iris in #138.
15:06Z correction: #172 closed; the dc fix rides who-iris#165 (head 40d52ba, owned by the dth-hrh L2 pilot thread, also re-pins who-iris core to 478cd43). Decided NOT to pin smart-trust at an unmerged PR head; wait for #165 to merge (slash thread will tell me).
11-03 05:06Z #138 closed by its own session as superseded: smart-trust#137 merged with fhir-harness c702c34 (contains b0150c2). 11-07 16:05Z live gh-pages still from 11-01 (publish is by hand, workflow "Site publish (by hand)"); card Q-TOC-3 asks to publish (A rec).
11-08 06:31Z Q-TOC-3 = B: do not publish; fix goes live with the next publish someone starts. Thread done.
