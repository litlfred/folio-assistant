---
# folio-assistant-foaq
title: fsh-guts:viz renders untracked local mount files, so a regen from a dirty mount stales CI
status: todo
type: bug
priority: normal
created_at: 2026-10-04T18:00:42Z
updated_at: 2026-10-04T18:00:42Z
parent: folio-assistant-d33q
---

Measured 2026-10-04 on #2103 (e33c7280eb): `merge:main`'s regen ran `fsh-guts:viz` against the LOCAL fsh-guts mount, which held workflow-engine logs written "capture undetermined, so local only" (`fsh-guts/logs/*.json` from `workflow_complete`). The viewer page `cat-harness/docs/fsh-guts/index.md` gained 43 lines for those files; CI's clean mount (147 files) saw it as stale and `fsh-guts:viz:check` went red. Restored main's page by hand.

## Done when
- `gen-fsh-guts-viz` lists only files the state branch tracks (ask git, not the disk — the same rule as `git-corpus.ts`), or the workflow engine stops writing untracked logs into the mount; and a test covers a stray untracked file in the mount not changing the page.
