---
# folio-assistant-n7bz
title: 'GETTING STARTED: getting-started.bpmn + folio-intent.dmn'
status: completed
type: task
priority: normal
created_at: 2026-09-18T14:49:11Z
updated_at: 2026-09-18T14:49:11Z
---

## What

`processes/getting-started.bpmn` — the onboarding process, lanes for the
user, the agent, the work plan and the build/publish pipeline. Its intent
gateway carries `<folio:decision/>` backed by
`processes/decisions/folio-intent.dmn`, so the branch is **computed from
facts**, not asserted by the agent.

This is the concrete answer to "force agentic Q&A into guided questions
following DMN logic".

## Done when

`bun run render:bpmn:check` and `bun run check:workflow-policy` are green, the
loader confirms every outcome the table can return names a real branch, and the
generated SVG is committed.

Issue: https://github.com/litlfred/folio-assistant/issues/232
