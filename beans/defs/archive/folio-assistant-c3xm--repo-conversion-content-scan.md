---
# folio-assistant-c3xm
title: 'GETTING STARTED: convert an existing repo + scan it for content'
status: completed
type: task
priority: normal
created_at: 2026-09-18T14:49:11Z
updated_at: 2026-09-18T14:49:11Z
---

## What

`skills/folio-core/repo-conversion.md` plus `scripts/scan-repo-content.ts` — a
read-only scan of an existing repository that classifies candidate files into
`library/` (external source) and `content/` (authored), reports what it cannot
classify as a third state, and never moves anything on its own.

The skill covers the three questions the scan cannot answer: import or not,
library or content, leave in place or reorganize; and whether to dispatch one
ingestion agent or a small swarm.

## Done when

Scanner runs on this repo and on a bare fixture without crashing, "could not
classify" is reported as its own bucket, and the skill is wired to
`document-ingestion` and to `dispatch-agent`.

Issue: https://github.com/litlfred/folio-assistant/issues/232
