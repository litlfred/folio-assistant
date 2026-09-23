---
# folio-assistant-ve07
title: 'smart-base: stage the instance and declare its graphs'
status: completed
type: task
priority: high
created_at: 2026-09-22T08:35:28Z
updated_at: 2026-09-22T09:33:37Z
parent: folio-assistant-2yyh
---

Issue #877. `smart-base/smart-base.json` + `AGENTS.md` + `README.md`, shaped as `smart-trust/` and `smart-immunizations/` are. Declares `library/` (kind `library`, holds `derived`), `methodologies/` (`methodology`, `context`), `skills/voices/` (`voices`, `content`) and `scenarios/` (`scenarios`, `content`). `needs: ["folio-assistant-core"]`.

**Declare only what exists** — the `dh4f` defect is a declared-but-absent directory, where every consumer scans nothing and reports a clean run over it. Each directory gets its `keepMarker` in the same change.

## Done when
- [ ] the declaration validates and `bun run ingest --library smart-base` resolves
