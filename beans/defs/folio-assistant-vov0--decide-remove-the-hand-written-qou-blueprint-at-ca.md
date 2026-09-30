---
# folio-assistant-vov0
title: 'Decide: remove the hand-written QOU blueprint at cat-harness/blueprint/src'
status: todo
type: task
created_at: 2026-09-30T15:42:29Z
updated_at: 2026-09-30T15:42:29Z
parent: folio-assistant-zzmr
---

Found in a1ku (#1598). cat-harness/blueprint/src/ is a hand-written QOU blueprint: content.tex maps 1,192 lines of manuscript labels to QOU.* declarations, with a hand-synced \lean/\uses. Bean 0uu2 kept it on 2026-09-24 because qou held no copy.

Why it may now go: blueprint-layout.ts (#1598) GENERATES <paper>/lean/blueprint/src from the manifest in CI, so a hand-synced copy is a second answer, free to drift. It is also folio content inside the platform ('the platform, not the content').

Why it is not deleted here: deletion-requires-confirmation. Measured: NOTHING reads this directory. No .ts, .yml or .json references `cat-harness/blueprint`. The two readers of a `blueprint/src/content.tex` (validate-references.ts:206, bib-qa.ts:167) resolve against the CONTENT repo root (findContentRepoRoot), i.e. a folio's own blueprint, not this one.

## Done when
- [ ] the owner decides: remove it, or move it to qou (which has no copy)
