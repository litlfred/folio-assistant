---
# folio-assistant-zlq9
title: 'CAT-QA-REPORTS: read and write either branch name before the rename (PR #1913, bean 32f6)'
status: todo
type: task
created_at: 2026-10-02T19:14:12Z
updated_at: 2026-10-02T19:14:12Z
parent: folio-assistant-3fva
---

Requested by the merge steward (session 01ToWZR4…, owner-approved 2026-10-02): special branches get a cat- prefix (PR #1913, bean 32f6); qa-reports → cat-qa-reports is next. The steward will not rename until this arc confirms dual-name support is pushed and green.

## Rule (from #1913)
cat-qa-reports if it exists, else qa-reports if it exists, else cat-qa-reports. Writers use the same rule. Read #1913's special-branches.json when present; else fall back to the constant.

## Sites (from #1913's body, adjusted to #1801)
- qa-store.ts DEFAULT_QA_BRANCH and every read/write using it
- qa-site-assets.ts, qa-verify-moved.ts
- storage.branch in each instance declaration (10 on #1801)
- cat-harness.ts schema/default
- workflows: qa-publish, qa-reports-prune, docs-site, folio-staging.yml

## Done when
- [ ] every reader and writer resolves the branch by the rule, with tests for all three cases (only old, only new, both)
- [ ] #1801 green with the change; steward told, and a 30-minute no-push window given
