---
# folio-assistant-x4mt
title: 'SKILLS: cross-agent installation + fa- namespace prefix (issue #247)'
status: todo
type: task
priority: normal
created_at: 2026-09-18T15:28:10Z
updated_at: 2026-09-18T15:28:10Z
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
