---
# folio-assistant-r6es
title: 'BEANS PAGE FRESHNESS: say when the page was generated and how many commits behind main it is'
status: in-progress
type: feature
priority: normal
created_at: 2026-10-02T10:45:39Z
updated_at: 2026-10-02T11:00:19Z
parent: folio-assistant-o3xy
---

Owner 2026-10-02: the beans page should show a generated date so a reviewer knows how recent it is, and how many commits behind main.

## Constraint
Bean y7b3: no timestamp in a committed generated file (owner ruling 2026-09-30). So the stamp is written by the DEPLOY (docs-site.yml -> _site/build.json; previews already have staging.json) and read at load time; the behind-count is asked of the GitHub compare API at load time. Failure renders 'could not determine', never 'up to date'.

## Done when
- [x] docs-site.yml writes _site/build.json
- [x] fa-build-src meta on visualiser pages and Jekyll pages
- [x] work-plan.js renders the stamp
- [ ] verified on the live site after merge
