---
$schema: folio-memory/v1
id: the-publish-branch-keeps-its-own-log
label: stable
summary: "`gh-pages` keeps an append-only render log at `_render-log/`"
createdAt: 2026-09-20
roles:
  - code-reviewer
agents:
  - platform-boundary-guard
  - ci-health-watcher
---
*What happened to `STAGING/<slug>`?* — `_render-log/<YYYY-MM-DD>.jsonl` at the
branch ROOT, outside `STAGING/` so `rm -rf "STAGING/$SLUG"` cannot reach it.

A full replace does NOT preserve it: `CARRIED_PREFIXES` in
`restore-staging.ts` carries it across, and `--verify` checks the carry as well
as the previews. Add a prefix there, never a third code path. Skill:
[`folio-core/render-logging.md`](../cat-harness/skills/folio-core/render-logging.md).
