---
# folio-assistant-m61r
title: 'Bean notes: per-PR files so sibling PRs stop conflicting on one bean'
status: in-progress
type: task
priority: normal
created_at: 2026-10-02T11:34:29Z
updated_at: 2026-10-02T11:34:45Z
parent: folio-assistant-ahvw
---

`beans/defs/folio-assistant-ob3m--navbar-visualiser-12-wireframe-findings.md` is appended to by many sibling PRs (findings 1, 3, 6, 7/8, 10, 12 …). Each time one merges, every other open PR conflicts on that file, and the merge-main bot refuses bean conflicts on purpose (`beans: refuse` in `merge-conflict-patterns.ts`), so each PR needs a hand-merge. On 2026-10-02 this forced hand-merges of #1798, #1805, #1807, #1808 and #1819 within a few hours.

## Owner's chosen design (option 1 of 3)

Per-PR notes, not appends: each PR writes its note as its own file beside the bean, named so two PRs never write the same path, and the bean body reaches them through a GENERATED index so no PR edits the bean. Rejected: teaching the bot to union this one bean.

Parent `ahvw` rather than `1xhc`: the defect is in how sibling sessions share one work-plan item (bean coordination), not in a gate failing to fire.

## Done when

- [ ] Notes directory declared in `beans/beans.json` with a registered graph kind; dot-prefix guard and `check:harness-dirs` green.
- [ ] A writer + `:check` for the generated index, wired into `regen` and CI, and the index matches a declared generated pattern.
- [ ] A test simulates two branches each adding a note and asserts disjoint paths plus a clean `git merge`; it fails if the naming rule is dropped.
- [ ] The convention is documented in the governing skill.
- [ ] `bun run gates` green.
