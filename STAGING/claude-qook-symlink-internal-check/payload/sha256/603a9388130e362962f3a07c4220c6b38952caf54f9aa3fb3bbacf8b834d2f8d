---
# folio-assistant-eojz
title: 'LANDING: the site''s landing instance is resolved from a site.landing flag, not the generator''s directory (#1904)'
status: in-progress
type: task
priority: normal
created_at: 2026-10-02T22:49:23Z
updated_at: 2026-10-02T22:49:36Z
parent: folio-assistant-yj32
---

Issue #1904. Owner ruling 2026-10-02, verbatim: "Flag it, with a default (recommended). The chosen instance's own `<name>.config.json` carries `"site": { "landing": true }`. If exactly one harness is instantiated, it is the landing page and no flag is needed. That covers smart-trust. If there are several and none is flagged, a gate fails. If more than one is flagged, then neutral hub with listing of harnesses, todos,"

## Done when
- resolveLandingInstance(repoRoot) is the one resolver; check:landing-instance gate fails on ambiguous; sync-docs-harness, library-graph, schema-graph use it; cat-harness flagged; / unchanged for this repo.

Holder: claude/site-landing-instance, session https://claude.ai/code/session_01Cw8JgZEDT5VqQ5ergjdMjB
