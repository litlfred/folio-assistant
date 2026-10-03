---
# folio-assistant-uoob
title: 'MERGE GATE (f): refuse an unfinished PR — no current ready marker, or a base branch whose PR already merged'
status: in-progress
type: bug
created_at: 2026-10-03T13:53:29Z
updated_at: 2026-10-03T14:17:55Z
parent: folio-assistant-nok9
---

Owner ruling 2026-10-03: BOTH guards (option 1 of 4, asked by the Parcel B session; proposed by session 01CbYZTA). Three merges on 2026-10-03 landed work in a state its author had not finished, and nothing in the pipeline asked:

- **#1937** merged into its stale base `claude/quirky-davinci-ixuymr` after #1764 had already landed, so the branch-store never reached main (re-opened as #1978).
- **#1960** merged at head b9391d7 while it held only its bean; the code it promised (`declaredSubgraph`) stayed on the branch (re-opened as #1987).
- **#1957** merged while still a DRAFT, with no `ready:` comment, an hour after its reviewer warned that #1982 had landed a duplicate, so main now carries two mount/push implementations (reconciliation: bean `nij4`).

## The two guards
1. **Ready marker.** Refuse to merge a PR that has no `ready: <sha>` comment from its driver, or whose head is no longer that sha (and a draft is never merged). Catches #1960 and #1957.
2. **Dead base.** Refuse a PR whose base branch is the head of an already-merged PR, or retarget it to that PR's own base and re-run CI first. Catches #1937.

## Done when
- [ ] the merge pipeline (merge train / Merge Manager tooling, see `blgm`) applies both guards before merging, with a refusal that names which guard and the sha it expected
- [ ] tested on the three real shapes: no ready marker (#1957), head moved past the marker (#1960), base = a merged PR's head (#1937)
- [ ] the merge-pipeline skill states both rules

_2026-10-03T14:17:55Z_ — Claimed by claude/merge-guard — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).
