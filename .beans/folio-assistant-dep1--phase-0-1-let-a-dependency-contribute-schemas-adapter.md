---
# folio-assistant-dep1
title: 'Phase 0.1 — let a dependency contribute block kinds, an adapter and MCP tools (#223)'
status: todo
type: task
priority: high
created_at: 2026-09-18T15:00:27Z
updated_at: 2026-09-18T15:00:27Z
---

**BLOCKER for the whole five-repo split.** See
[migration plan §0.1](../docs/architecture/migration-plan.md).

`dependencies.folioAssistant` resolves translations only. Measured 2026-09-18:
`resolveSkillDirs` 0 external callers, `resolveTranslationDirs` 0,
`resolveContentDirs` does not exist, and schemas + MCP tools are ruled out
**by design** (`schemas/folio-config.ts` docstring).

`folio-asst-sci` exists to own `MATH_BLOCK_KINDS` (schemas), `PaperContentAdapter`
(code) and `lean_build` (MCP tool). It is unbuildable until this changes.

Needs a maintainer decision between three shapes: load-time registration /
manifest-declared contributions / adapters stay root-only. Gate: a synthetic
two-repo fixture where the dependency contributes one block kind, one skill and
one MCP tool, with a test asserting a kind collision is **refused**, not
silently overlaid (`adapterForKind` must stay total and unambiguous).
