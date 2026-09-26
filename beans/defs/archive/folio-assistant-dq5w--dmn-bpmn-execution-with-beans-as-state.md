---
# folio-assistant-dq5w
title: 'DOCS: options for executing DMN/BPMN with beans as state'
status: completed
type: task
priority: normal
created_at: 2026-09-18T15:01:37Z
updated_at: 2026-09-18T15:27:12Z
---

## What

Two things the author asked for on 2026-09-18, mid-session:

1. **Document the intent decision logic** — `getting-started.bpmn` +
   `decisions/folio-intent.dmn` exist (bean `n7bz`); the user-facing page
   explaining *why* the branch is computed rather than chosen does not.
2. **Write up the options for running the process engine with `.beans/` as the
   state store**, rather than (or alongside) `.folio/workflow/<id>.json`.

Today `src/workflow/store.ts` keeps one JSON file per instance and
`bean-link.ts` joins it to a bean. The open question is whether the bean should
BE the state — token-per-bean, activity-per-child-bean, state as a fold over the
bean's notes — and what each option costs in concurrency, auditability and
readability for a human looking at the work plan.

Relates to https://github.com/litlfred/folio-assistant/issues/203 (CRDM) and
https://github.com/litlfred/folio-assistant/issues/232.

## Done when

`docs/proposals/workflow-state-in-beans.md` sets out the options with the
trade-off each makes, and the getting-started documentation explains the intent
decision table to a reader who has never opened a DMN file.
