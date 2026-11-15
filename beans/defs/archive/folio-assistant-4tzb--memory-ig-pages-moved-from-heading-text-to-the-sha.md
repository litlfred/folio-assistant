---
# folio-assistant-4tzb
$schema: bean/1.0.0
title: 'Memory: IG pages'' ✎/📣 moved from heading text to the shared right-gutter box (tools+cat-harness+fhir-harness branches claude/ig-section-rail)'
status: completed
type: task
priority: low
created_at: 2026-11-08T07:25:14Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `ig-section-rail-2026-11-08.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: IG pages' ✎/📣 moved from heading text to the shared right-gutter box (tools+cat-harness+fhir-harness branches claude/ig-section-rail)

Thread "Move IG edit/feedback icons to right rail" (cmsg_017WNUkNK8kdDziPK58Pv6G94zsdocqjzaJw3SsFh2bCsu), user ask 2026-11-08 07:18Z.
- Cause: fhir-harness build-ig-site.ts SOURCE_LINKS_JS appended ✎ 📣 inside each IG heading; other docs use cat-harness-tools edit-links runtime sectionBoxes() (needs .anchor-heading, which IG headings lack).
- Fix: runtime sectionBoxes reads `<script id="ig-source-lines">`, adds box per heading with ✎ (own source line) + 📣 (IG repo issue); fhir-harness drops SOURCE_LINKS_JS (file assets/ig-source-links.js keeps its name). New e2e test/ig-section-rail.e2e.ts.
- Merge order: tools + cat-harness (asset regen) first, then fhir-harness, then re-pin folio-assistant. Local commits 500fd75 / ea90148 / a0e09a2; swarm hold (CI queue) until re-pin train fa#3034 lands ~07:55Z before pushing.
- Screens: /mnt/project-files/ig-section-rail-2026-11-08/before-after.png
Related: folio-assistant-bxc4 (same file, LINK_CSS).
- 07:30Z add-on (user): docs pages' line under each heading (✎ Edit, ✍ suggest, QA/TR badges from gen-docs-pages) now moves into the gutter box; QA/TR chips open the panel and show each badge's text. Badges were "?" because folio-assistant's build has no QA corpus (qa-index corpus:"absent") so docs-ui paints them inert; real verdicts need the build to fetch QA results (not done). Extra commits on same branches.
- 07:58Z pushed: issue tools#1690; PRs tools#1691 (0a79160f), cat-harness#1142 (4d24f94), fhir-harness#311 (a0e09a2), drafts, subscribed. Merge 1691+1142 first, then 311, then re-pin.
- 08:27Z owner tapped A (hand to merge manager). Labeled+ready-commented tools#1691, cat-harness#1142. Merge order (merge manager): rail hover pair, then left-navbar pair tools#1682/cat-harness#1137, then ours (needs --write-asset regen after both; merge manager pings), then fhir-harness#311. Waits on fa#3036 (~09:15Z).
- 13:28Z ALL MERGED: cat-harness#1142, tools#1691, fhir-harness#311. Live after next folio-assistant re-pin (merge manager told).
