---
# folio-assistant-mm4u
$schema: bean/1.0.0
title: 'cat-harness-tools main Typecheck RED since its #58: build-instance-site.ts passes publishSite({into}) that only bootstrap-tools main has; folio-assistant index.lock pins an older bootstrap-tools'
status: todo
type: bug
priority: high
created_at: 2026-10-10T15:54:05Z
updated_at: 2026-10-10T16:58:41Z
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

## Handed over (2026-10-10)

folio-assistant#2531 closed as superseded by folio-assistant#2529 (session_017QXvm7c7RDYFguWzSxhrMb), which pins bootstrap-tools adea857 together with the cat-harness/cat-harness-tools re-pin. Close this when #2529 merges.
