---
# folio-assistant-mm4u
title: 'cat-harness-tools main Typecheck RED since its #58: build-instance-site.ts passes publishSite({into}) that only bootstrap-tools main has; folio-assistant index.lock pins an older bootstrap-tools'
status: in-progress
type: bug
priority: high
created_at: 2026-10-10T15:54:05Z
updated_at: 2026-10-10T16:34:13Z
parent: folio-assistant-ml9h
---

Found by drain lane B (session_01QmRtjQNyHiH2RuimTfuJDu) on cat-harness-tools#59, 2026-10-10.

CI log: one error, build-instance-site.ts — 'into' does not exist in type 'PublishOptions'. Identical on main and on #59, so every cat-harness-tools PR shows a red Typecheck that is not its own. A cast is NOT the fix: with the pinned bootstrap-tools, 'into' is silently ignored, so a staging preview publish would overwrite the whole site branch.

## Done when
- [ ] folio-assistant index.config.json / index.lock.json pin a bootstrap-tools ref that has PublishOptions.into
- [ ] cat-harness-tools main Typecheck green on a re-run
- [ ] the #58 merge-with-red-typecheck is noted on the merge-gate bean so it is counted

## Progress

Owner consented to adea857 (2026-10-10). PR: https://github.com/litlfred/folio-assistant/pull/2531
