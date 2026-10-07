---
# folio-assistant-2uj7
title: merge:guard follows Link next URLs in /repositories/<id>/ form, which the agent proxy refuses (page 2 → 403)
status: in-progress
type: bug
priority: normal
created_at: 2026-10-05T05:11:59Z
updated_at: 2026-10-05T05:26:37Z
parent: folio-assistant-nok9
---

Issue #2137. getAll in cat-harness/scripts/merge-guard.ts follows GitHub's Link rel=next, which names /repositories/<id>/...; the agent egress proxy refuses that form (403, 'Numeric-ID repository paths ... not supported'). Fix: normalise next to repos/{owner}/{repo}/.

## Done when
- [ ] next-page URLs normalised; unreadable page still COULD NOT DETERMINE
- [ ] unit tests for page-2 normalised + page-2 failure
- [ ] bun run merge:guard on a >100-event PR gives a real verdict from an agent session

PR #2142 (branch claude/zealous-gates-3o9ma2-guard-paging). Code, tests and live verification are done (merge:guard 1898 PASS, 1955 real verdict); waiting on CI and the owner's merge.
