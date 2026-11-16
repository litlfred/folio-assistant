---
# folio-assistant-sp4k
$schema: bean/1.0.0
title: 'Content sites: shared site build presets and a link check that refuses the publish'
status: in-progress
type: task
priority: high
created_at: 2026-11-16T07:10:00Z
updated_at: 2026-11-16T07:10:00Z
parent: folio-assistant-v8bg
tags:
    - site-publish
    - handover
---

Owner chose option A (coordinator card, 2026-11-15/16) after smart-ra's glossary and bibliography 404s: one shared, layered list of site build steps for every content site, and every publish fails on a broken internal link. Thread "Stop content sites missing pages" (https://claude.ai/code/project/chan_017WNUkNK8kdDziPK58Pv6G9?thread=cmsg_017WNUkNK8kdDziPK58Pv6G9TknJmb6WAJuHJXQCHbrj7K).

## Design

- `site.build.extends: "<preset>"` → `templates/site-presets/<name>.json` of a mounted layer (cat-harness-tools `scripts/lib/site-presets.ts`). Preset fields = site.build + `extends`, `scripts` (step commands; the site's own package script of the same name wins), `when` (step needs a path; absent → skipped and said). Preset steps first, site's own after; within a phase the upper list orders steps it names again.
- `links: refuse` gates ALL unresolved internal links (platform pages, content pages, self-address, diagrams). Namespace IRIs (`…/v<N>/ns…`) never count. Declared `links`/`coverage` (even `report`) override the preset.
- Presets: cat-harness-tools `folio-base` (archimate when `archimate`, context, links refuse); folio-assistant-core `document-folio` extends it (document, library when `library`, review-sheet when `review`, glossary, bibliography, archimate, context).

## State

- Issue cat-harness-tools#2345; draft PR cat-harness-tools#2346 (mechanism + folio-base).
- Issue core#824; draft PR core#825 (document-folio preset).
- Drift found 2026-11-16: dth-hrh/dth-phc/dth-sc lack bibliography; dth-phc/dth-sc lack archimate+context; dth-pc lacks glossary+library. smart-ra fixed by WHO smart-ra#49 (merged 6211ebd).

## Next

1. #2346 and #825 green → merge manager.
2. After re-pin: each document folio (WHO dth-hrh, smart-ra; litlfred dth-pc, dth-phc, dth-sc) sets `"extends": "document-folio"` and keeps only its extras; expect link-refuse reds to fix per site (build locally first).

_2026-11-16T07:10:00Z_ — Created by thread "Stop content sites missing pages", session https://claude.ai/code/session_01Qmmkt8uBwv6vsMUHNmy7AQ.
