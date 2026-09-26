---
# folio-assistant-tvf8
title: 'STALE OPEN PRs: three untouched 4-8 days, and #229''s ''clean'' merge would RESURRECT a path main deleted'
status: in-progress
type: task
created_at: 2026-09-26T10:32:05Z
updated_at: 2026-09-26T10:32:05Z
---


Swept the 15 open pull requests for staleness at 2026-09-26 10:30Z. Three are
untouched for 4 days or more; the rest were base-merged by their sessions within
the day, so the population needing attention is small.

| PR | stale | behind `main` | merge | files | author |
|---|---|---|---|---|---|
| #229 | **8.2 d** | 4,287 | "clean" | 1 | Carl Leitner |
| #231 | **8.1 d** | 4,316 | CONFLICTS | 43 | costateixeira (human) |
| #731 | **4.0 d** | 1,446 | CONFLICTS | 21 | Claude |
| #1290 | 1.6 d | 362 | CONFLICTS | 314 | Claude |

## The finding: a clean merge is not a safe merge

**#229's entire content is one line** — `<!-- staging preview trigger -->`
appended to `docs/fr/index.md`. It was pushed 2026-09-18 to make the staging
workflow build a preview, and nothing else.

`git merge-tree --write-tree` reports the merge **clean**. It is not safe.
`docs/fr/index.md` does not exist on `main`: the docs tree moved under the
declared instance directory, and the file now lives at
`cat-harness/docs/fr/index.md`. Merging #229 would not modify that file — it
would **create `docs/fr/index.md` afresh**, resurrecting a path `main` deleted
and putting a second French index page outside the directory
`cat-harness.json` declares.

So the trap is general and worth the bean on its own: **`merge-tree` answers
"do the two sides touch the same lines", not "does this side still refer to
anything that exists".** A branch thousands of commits behind a restructure
merges cleanest precisely when its paths have gone, because nothing on the other
side is there to conflict with. Staleness measured in commits-behind is a
stronger signal than conflict status, and the two point opposite ways here.

`#229` also holds no live review preview — `claude-206-staging-preview` is
absent from the 14 `STAGING/` directories on `gh-pages` — so nothing is serving
from it and it is not a demo anybody is reading.

## What each needs, and who may do it

- **#229** — nothing to merge. Its one line is a dead trigger at a dead path.
  Recommend closing; reopenable if the preview is wanted, in which case the
  trigger belongs at the current path.
- **#231** — a **human** contributor's (costateixeira), 43 files, conflicts,
  4,316 behind. NOT an agent's to resolve: the standing rules put a larger ask
  on a PR an agent did not open with its author. Report only.
- **#731**, **#1290** — sibling Claude sessions'. A base merge with a merge
  commit is permitted (it keeps their checkout valid); rebase, amend and
  force-push are not. #1290's 314 files are mostly `library/` arXiv content and
  `test/results/library-qa` sidecars, so most conflicts should be regenerable
  rather than hand-resolved.

## Done when

- [x] every open PR's staleness, behind-count and merge state measured
- [x] the `merge-tree`-clean-but-unsafe case established with the actual path
- [ ] #229 resolved — recommended closed, awaiting the owner
- [ ] #731 base-merged and its state reported
- [ ] #1290 base-merged, conflicts regenerated rather than side-picked
- [ ] #231 left to its human author, with a note rather than a push
