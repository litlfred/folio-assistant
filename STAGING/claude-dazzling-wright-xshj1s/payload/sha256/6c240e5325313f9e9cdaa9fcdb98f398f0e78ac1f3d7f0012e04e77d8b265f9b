---
# folio-assistant-u4up
title: merge:train drops gitignored-but-tracked test/results files
status: todo
type: bug
priority: high
created_at: 2026-10-04T16:44:20Z
updated_at: 2026-10-04T16:44:20Z
parent: folio-assistant-d33q
---

Measured 2026-10-04 building merge-train-2026-10-04a (#2113):

1. The built train tree omitted `cat-harness/test/results/lsi/cat-harness/skills.lsi.json` and its tool-run sidecar (tracked on main, gitignored), so `lsi:skills:check` and `lsi:viz:check` went red in CI while green locally. Restored by hand in 1635342194. Same family as 8j9e (#2090 fixed `merge-base.ts`, not the train tool).
2. Take-base on the same file failed for #1898 ("is in the index, but not at stage 2"), ejecting it.

## Done when
- `merge:train` keeps tracked-but-ignored paths, and its post-merge check runs `git diff --diff-filter=D <base> HEAD -- '*/test/results/*'` and refuses on any drop.
- take-base resolves a gitignored-tracked conflict without the stage-2 error; a test covers both.

## Also in merge:main (2026-10-04 ~17:55Z)
Not train-only. `merge:main` on `claude/gracious-mendel-du6nn8` (9e9ce3ea7f) dropped the same pair (`skills.lsi.json` + its tool-run sidecar) after take-base logged "is in the index, but not at stage 3". The takeover session (01BccmnV) hit it on #2105 independently. Restored by hand with `git add -f` in both cases. #2090's fix for 8j9e does not cover this path.
