---
# folio-assistant-rg3j
$schema: bean/1.0.0
title: 'Memory: Light card styling for structured blocks (FR/NFR/persona/scenario/DE) in document sites, 2026-11-01; where the code lives and open PRs'
status: completed
type: task
priority: low
created_at: 2026-11-01T23:33:10Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `structured-block-cards.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Light card styling for structured blocks (FR/NFR/persona/scenario/DE) in document sites, 2026-11-01; where the code lives and open PRs

Thread "Lightly style structured blocks in papers" (cmsg_017WNUkNK8kdDziPK58Pv6G9345NQt2RH4qaL3W9FwuGgj), 2026-11-01.

- Renderer: cat-harness-tools `pipeline/render-markdown.ts` `structuredBlockMarkdown` wraps every headed non-prose, non-figure/diagram/table block in `.fa-block` with `.fa-block-kind`, `.fa-block-id` (meta.requirementId), run-in first paragraph, `.fa-block-meta` for trailing `*Label:*` lines. PR cat-harness-tools#1355.
- CSS: cat-harness `site-chrome/assets/css/docs-ui.css` (all document sites, themed and hydrated pages). PR cat-harness#943.
- Kind-heading fallback now "Functional requirement" (schemas/content/translation.ts).
- Non-content: merge on green; reaches dth-* sites with the next re-pin.
- Q-SBC-1 A: #1355 and #943 merged 2026-11-02.
- Q-SAV-1 A: per-document structured-assets page at en/<slug>/assets/ (core scripts/structured-assets.ts, PR core#591), themed with poster tables, tiles, filter.
- Q-DE-1 A: data element cards fold their table behind 'Technical details' and link the name to a glossary entry with that label (core#591; CSS cat-harness#954). Only 1 of 10 dth-hrh data elements has a glossary entry; adding entries is dth content (paused).
- github.io is blocked from the sandbox; screenshots come from the gh-pages branch STAGING/<branch>/en/<doc>/index.hydrated.html opened locally.
Related: folio-assistant-8yzr.
- USER RULE 2026-11-02 07:15Z: tables are LEFT-aligned (start; right in RTL) with their titles; supersedes the 11-01 "tables centred" rule. Figures stay centred. PRs cat-harness#961 (docs-ui.css, cells top-aligned) + core#594 (tableStyle breakout removed, assets table fills column, one tag per list value). Non-content, merge on green.
- Q-IND-1 A (07:17Z): indicator-specific columns + cards on the assets page (numerator, denominator, disaggregation, NHWA module); align field names with NHWA extraction thread …BqMrkUVdrizRYAtGR9Acd4.
- 07:35Z: indicator PRs tools#1391, cat-harness#962 (on #961), core#597 (on #594). External glossary note: core#598 (scripts/external-glossaries.ts reads instance remoteGraphs [glossary], note above the doc glossary section), CSS cat-harness#964 (on #962). dth-hrh#93 (committee, never merge) now also declares remoteGraphs hrhis-registry-2015-glossary -> https://litlfred.github.io/who-iris/v0/ns/glossary/hrhis-registry-2015/ (live after who-iris#167 + slash IRIs).
- DONE 2026-11-02/03: all style PRs landed via meta-merge 2 (cat-harness#961/962/964, core#594/597/598, tools#1391). dth-hrh#93 merged 2026-11-03 05:47Z (by the owner).
