---
# folio-assistant-x4mt
$schema: bean/1.0.0
title: 'SKILLS: cross-agent installation + fa- namespace prefix (issue #247)'
status: completed
type: task
priority: normal
created_at: 2026-09-18T15:28:10Z
updated_at: 2026-10-20T09:35:00Z
parent: folio-assistant-vke6
---

## What

Install folio-assistant's skills into whichever agent is running (Claude Code,
Gemini CLI, Antigravity, Cursor, Copilot), across the whole dependency tree —
a folio links the platform as submodule or sibling, so the skill set is a union
across checkouts rather than one directory listing. Prefix every emitted skill
`fa-` so the host's namespace does not collide.

Not started. The issue records five open questions, the sharpest being whether
the prefix is applied **at rest** (a sweep of manifests, BPMN `folio:skill`
refs, two doc generators and every cross-reference) or **at install** (one
layer, nothing in the repo moves). The issue argues for install.

Watch for: this adds a copy of each skill per host agent, and three copies of
`todo-manager.md` already exist with only one of them checked.

Issue: https://github.com/litlfred/folio-assistant/issues/247

## Owner ruling, 2026-10-10 15:46 UTC

Prefix applied **at install** (nothing in the repo is renamed) — but the prefix is **per harness**, not a single 'fa-': each harness declares its own (e.g. `cat-` for cat-harness, `fa-` for folio-assistant). The prefix is a harness declaration that the install layer reads.

## Progress 2026-10-12 (lane C)
- cat-harness#160: declaration field `skillPrefix`; cat-harness declares `cat`.
- cat-harness-tools#143: `skills:install` writes `<prefix>-<name>/SKILL.md` into Claude Code (`.claude/skills`) or Antigravity (`.agents/skills`). Each skill takes its owning instance's prefix, falling back to the installing harness's; with neither, the install is refused.
- Measured on cat-harness: 217 skills installed, 28 skipped for having no description, and one real collision (two `idle-backlog.md`).
- Gemini CLI, Cursor and Copilot are not written yet; their formats are unverified.
- Still to do: folio-assistant declares `"skillPrefix": "fa"` (lane A, after #160 merges).

## Progress 2026-10-12 15:3x (lane C)
Both halves are merged: cat-harness#160 (ced73e7, `skillPrefix`) and cat-harness-tools#143 (476633d, `skills:install`). Remaining: folio-assistant declares `"skillPrefix": "fa"` (lane A), and a decision on adding Gemini CLI, Cursor and Copilot hosts.

## Progress 2026-10-12 15:5x (lane A)
`"skillPrefix": "fa"` is declared in folio-assistant-core.json (core#68, a0a4056) and folio-assistant-sci.json (sci#16, 26c4c70). It takes effect at folio-assistant's next re-pin, together with cat-harness ≥ ced73e7. Remaining: the owner's call on Gemini CLI, Cursor and Copilot hosts (lane C is drafting a bean).

_2026-10-16T06:30:00Z_ — Store reconciliation: status `todo` → `in-progress` (Owner ruling 2026-10-16, item 9: "based on semantic content"; the copies said folio-assistant: in-progress, cat-harness: todo). Evidence: owner ruling 2026-10-10; cat-harness#160 (ced73e7), cat-harness-tools#143 (476633d), core#68 merged; more hosts still to decide. Session https://claude.ai/code/session_01Pc8vSeXCwp5Ckvmz56cMDs.

## Summary of Changes

Closed 2026-10-20 (owner, thread "BPMN engine status": "1-3 as recommended"). The prefix is applied at install, per harness: cat-harness declares `cat` (cat-harness#160), folio-assistant-core and folio-assistant-sci declare `fa` (core#68, sci#16, all on main), and `skills:install` writes Claude Code and Antigravity hosts (cat-harness-tools#143). The one open item, Gemini CLI, Cursor and Copilot hosts, moved to its own bean `cat-tools-0nxe` (cat-harness-tools copy), which this thread is working next. Session https://claude.ai/code/session_01WisJFefMYG4g6iFhtgCUYG.
