---
# folio-assistant-bgle
title: 'site-dir-single-answer enumerates with git ls-files, so a NEW file is invisible to it until committed'
status: todo
type: task
priority: normal
created_at: 2026-09-19T11:09:58Z
updated_at: 2026-09-19T11:09:58Z
---


_2026-09-19T11:09:58Z_ — Measured 2026-09-19 on branch claude/wonderful-bohr-6kxh7b while building bean iurf. sourceFiles() in scripts/tests/site-dir-single-answer.test.ts enumerates via 'git ls-files', which lists TRACKED files only. Two new files of mine (scripts/gen-themes-css.ts, scripts/tests/theme-tokens.test.ts) both hardcoded the site root. A full 'bun test' run before committing reported 0 fail — the gate could not see them. The same suite on CI, after the commit, reported the failure. So the gate is blind to precisely the files most likely to violate it, at precisely the moment their author would catch it, and CI is the earliest possible detection. Not a hypothetical: it cost one red CI cycle on PR #405. Fix is probably to union 'git ls-files' with the untracked-but-not-ignored set ('git ls-files --others --exclude-standard'), which keeps node_modules and build output out while seeing new work. Worth checking whether any sibling gate enumerates the same way and has the same blind spot.
