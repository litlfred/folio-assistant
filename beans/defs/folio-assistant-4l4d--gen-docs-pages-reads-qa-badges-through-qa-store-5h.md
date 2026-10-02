---
# folio-assistant-4l4d
title: GEN-DOCS-PAGES reads QA badges through qa-store (5hox blocker)
status: todo
type: task
priority: normal
created_at: 2026-10-02T13:58:10Z
updated_at: 2026-10-02T16:54:44Z
parent: folio-assistant-3fva
blocking:
    - folio-assistant-5hox
---

Found by the 5hox prep (2026-10-02). docs:pages:check and check:ci-invocations go red with test/results/ absent: committed docs pages embed QA badges, and without the corpus gen-docs-pages writes 'not available', so every page reads stale. Either read the corpus through qa-store (fetch miss = UNKNOWN, never a stale page), or move the badges out of the committed pages into the build.

## Done when
- [ ] docs:pages:check passes with test/results/ absent and a qa-reports entry fetched
- [ ] a fetch miss is reported UNKNOWN, not as stale pages



## Coordination (2026-10-02, rule from PR #1886)
Overlap with session_013Wb's refactors #1885 (gp2f: nav/harness/icons/inline scripts → shared assets) and #1881 (library path IRIs). Agreed: 4l4d proceeds now and is not held on #1885; if badges become client-loaded they load as their OWN shared JSON asset fetched by the badge script, never inlined per page; gp2f builds on this. #1764/#1801's docs-site.yml and gen-docs-pages.ts changes land first; gp2f rebases.
