---
# folio-assistant-4l4d
title: GEN-DOCS-PAGES reads QA badges through qa-store (5hox blocker)
status: todo
type: task
created_at: 2026-10-02T13:58:10Z
updated_at: 2026-10-02T13:58:10Z
parent: folio-assistant-3fva
blocking:
    - folio-assistant-5hox
---

Found by the 5hox prep (2026-10-02). docs:pages:check and check:ci-invocations go red with test/results/ absent: committed docs pages embed QA badges, and without the corpus gen-docs-pages writes 'not available', so every page reads stale. Either read the corpus through qa-store (fetch miss = UNKNOWN, never a stale page), or move the badges out of the committed pages into the build.

## Done when
- [ ] docs:pages:check passes with test/results/ absent and a qa-reports entry fetched
- [ ] a fetch miss is reported UNKNOWN, not as stale pages
