---
# folio-assistant-8j9e
title: 'A merge silently drops a gitignored-but-tracked file: green locally, red in CI (#2000)'
status: todo
type: bug
priority: high
created_at: 2026-10-04T13:33:34Z
updated_at: 2026-10-04T13:33:34Z
parent: folio-assistant-nok9
---

Related: `blgm` (the merge pipeline tools: `merge-base.ts` is where the check belongs). Filed under epic `nok9` because a bean can only have an epic, milestone or feature as its parent.

A merge can silently delete a file that `main` tracks but `.gitignore` covers, and nothing catches it until CI fails on a fresh checkout. Every local check stays green, because regen rewrites the file on disk and `git add -A` never stages an ignored path again.

## Evidence: PR #2000, 2026-10-04
- `a16089d07`, a hand merge of `main` by a sibling session, resolved conflicts in two gitignored-but-tracked files by deleting them:
  - `cat-harness/test/results/lsi/cat-harness/skills.lsi.json`
  - `cat-harness/test/results/tool-runs/lsi-index/cat-harness/skills.tool-run.json`
- Both are under `cat-harness/test/results/` (`.gitignore:263`), yet `main` tracks them.
- CI went red three heads in a row (a16089d, d98a5aa, a66d2ba) on `lsi:skills:check` with "needs an index … and has none". In every container that had run regen, `lsi:skills:check` and `skill:register:check` passed.
- Two wrong diagnoses were posted before the cause was found ("main moved"; "fixed point"). The cause showed up only on a fresh `git worktree add` of the head.
- The knock-on cost one more cycle: d98a5aa's regen, run without the index, rendered three `docs-auto` LSI pages for "no index". Restoring the index (a66d2ba) made them stale, fixed in e19b6a8.
- The check that would have caught it is one line, run after the merge: `comm -23 <(git ls-tree -r --name-only <merged-main> | sort) <(git ls-tree -r --name-only HEAD | sort)`. It lists paths the merged-in main tracks that the result lacks. It was run by hand on every later merge, including the bot's 11b433b, af1cb20, 7a452b4 and 795a7e1, and found nothing.

## Proposal (not built)
`merge-base.ts` asks a fourth question before it says "proved": **does the result still track every path the merged-in parent tracks, unless the branch itself deleted that path?** A branch-side deletion is the one legitimate drop, found from `git diff --diff-filter=D <merge-base> <branch-parent>`. Any other dropped path is refused, and its name is printed.
- It catches the hand-merge case only when that merge goes through `merge:main`. A hand `git merge` is not covered. Consider the same check in `check:head-has-run`, or as a CI gate comparing the PR head with `main`'s tracked set.
- Do not fix this by un-ignoring `test/results/`. Main deliberately tracks some files under an ignored directory, so the ignore is not the defect. The defect is that nothing verifies the tracked set.

## Done when
- [ ] `merge:main` refuses a merge that drops a path the merged-in parent tracks and the branch did not delete. There is a test with a gitignored-but-tracked fixture.
- [ ] Decided, with the owner, whether a hand merge needs a CI-side check too, and recorded the decision here.
- [ ] `merge-conflict-patterns` skill: one line on the failure signature ("green locally, red in CI, 'has none'") pointing here.
