---
# folio-assistant-rmer
title: 'Language-trap skill is neither generated nor CI-gated: .claude/skills/local is absent from GROUPS'
status: in-progress
type: task
created_at: 2026-09-18T23:38:18Z
updated_at: 2026-09-18T23:38:18Z
---

`.claude/skills/local/language-trap-agent-audit.md` is the authoritative spec for the ten `trap-*` criteria (`content/pipeline/qa-criteria-registry.ts:2242-2251`), carrying the owner directive of 2026-08-15 and the false-positive classes each category needs. `GROUPS` in `scripts/gen-skill-docs.ts` lists `skills/content-lifecycle`, `src/skills`, `skills/folio-core` and the two adapter dirs; `.claude/skills/local/` is not among them, so the file is not published and `gen-skill-docs --check` does not guard it.

Known cost, from AGENTS.md: that directory holds 25 entries, 22 of them `.json` (capability/skill descriptors, not instruction bodies), so publishing it needs a filter rather than a bare path. And `todo-manager.md` there differs from the `folio-core` copy by 188 diff lines, so publishing the directory surfaces that divergence as a second published page — which is information, not a regression, but it is the reason this was left alone before.

## Done when
- The `.md` instruction bodies under `.claude/skills/local/` are generated into `docs/reference/skill-instructions/` and guarded by `gen-skill-docs --check`, with the `.json` descriptors excluded.
- Either the `todo-manager.md` divergence is resolved, or the two published copies each say which is canonical.
