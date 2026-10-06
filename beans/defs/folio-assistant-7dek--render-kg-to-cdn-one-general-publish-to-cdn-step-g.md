---
# folio-assistant-7dek
title: 'render-kg-to-cdn: one general publish-to-CDN step; gh-pages is one Tool with its own subprocess'
status: completed
type: task
priority: normal
created_at: 2026-10-01T06:58:00Z
updated_at: 2026-10-06T19:30:00Z
parent: folio-assistant-iirv
blocked_by:
    - folio-assistant-hx65
---

Owner, 2026-09-30: gh-pages is "one specific tool of general 'publish to CDN'"; render a KG (or a list of subgraphs) to a CDN at a publication root URL, independent of staging vs release; output = push status + message; "tools can describe their own specific subprocesses if needed to not bog down general skills" (placement ruling 6). Owner, 2026-10-01: a gh-pages branch must exist before Pages can be turned on.

Built (not on main as of `b0ca040`, 2026-10-01): commits `26107496681`, `e86768b01cb`, `76cfec01463`, merged locally into `next/cdn-pr0` with PR0 (`ejye`); per the coordinating session it rides branch `claude/laughing-thompson-vjcmlx`.
- `processes/render-kg-to-cdn.bpmn` + `skills/process/workflow/render-kg-to-cdn.md`: tool-agnostic, one call activity bound by the target's Tool
- `schemas/tool.ts`: optional `subprocess`; `tools/index.ts`: `gh-pages` Tool whose subprocess is bootstrap-tools `Process_RenderKgToGitHubPages`
- `docs-site-publish` / `feature-staging` call `Process_RenderKgToCdn`; `draft-to-publication`'s release step names it

Related: `xies` (PUBLISH TO CDN — the signoff → merge → CDN flow this step serves), `1lfx`, `l9v6`.

## Done when
- [x] general process, skill and the `gh-pages` Tool with its own subprocess
- [x] merged to main; `render:bpmn:check`, `check:tools`, `skill:register:check` green there — all three exit 0 on main bac5800 (2026-10-01)
- [x] `xies` updated to name `Process_RenderKgToCdn` as its publication step  — note added to xies 2026-10-06


## 2026-10-01 — separation arc (7x5n)
Merged (#1758 / #1760). Remaining boxes need green gates ON MAIN, which is red at cdb0a018, so this waits on S0 (hx65) and closes in S1 (a4of).

## Summary of Changes

Closed 2026-10-06 by claude/sep-bookkeeping-s1-s3 (7x5n S1, a4of).
- Box 2, re-measured on main at 24b221415 (2026-10-06): `render:bpmn:check`, `check:tools` and `skill:register:check` all exit 0. The last of these was run inside `bun run gates` on the bookkeeping branch.
- Box 3: `xies` now carries a note naming `Process_RenderKgToCdn` (cat-harness/processes/process/render-kg-to-cdn.bpmn) as the step that executes its fourth gate ("publish to CDN"). The note was added in the same commit as this close.
