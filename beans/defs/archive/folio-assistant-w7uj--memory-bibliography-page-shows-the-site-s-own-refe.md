---
# folio-assistant-w7uj
$schema: bean/1.0.0
title: 'Memory: Bibliography page shows the site''s own references first, dependencies in a labelled section (core#574 merged, live on smart-ra 2026-11-02)'
status: completed
type: task
priority: low
created_at: 2026-11-02T08:59:53Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `bibliography-own-first.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Bibliography page shows the site's own references first, dependencies in a labelled section (core#574 merged, live on smart-ra 2026-11-02)


Owner 2026-11-01 22:58Z: on smart-ra's bibliography page they expected only smart-ra's own references, with dependency entries clearly labelled.

Fix in folio-assistant-core `scripts/bibliography-page.ts` (PR #574 merged 2026-11-02 04:17Z as f294c18, issue #572): the instance declared at the checkout root is the site's "own"; its references come first, other layers go in a closed "From dependencies" section grouped by layer. A sub-graph id shared by layers (`library`) gets `<instance>-<id>/` pages for dependencies. No root instance (platform monorepo) = unchanged flat list. Live on smart-ra after re-pin smart-ra#227 and publish run 41411973742 (08:52Z): 3 own, 143 from 5 layers.

Facts: smart-ra's paper (dpi-h-ra) has no `\cite` keys and its References chapter is a placeholder. build-document-site.ts supports `--bibliography-url` but no site passes it yet.

smart-ra site-publish is workflow_dispatch only (a re-pin merge does not publish). Its stage-local step can run out of runner disk cloning gh-pages (~690k files, mostly STAGING/ previews); a re-run worked once. See folio-assistant-o7nv.
