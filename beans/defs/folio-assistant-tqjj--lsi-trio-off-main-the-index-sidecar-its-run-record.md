---
# folio-assistant-tqjj
title: 'LSI trio off main: the index sidecar, its run record and the viewer page conflict on ~80% of merges'
status: in-progress
type: task
priority: normal
created_at: 2026-10-04T08:21:22Z
updated_at: 2026-10-04T08:21:32Z
parent: folio-assistant-hfag
---

Sibling of ba9e (its worked example is PR #2044); the class is y7b3, "a timestamp or total in a committed generated file turns every pair of concurrent changes into a conflict". The landing place is arc 3fva, owner rulings D1/D4.

## Measured (2026-10-04, this checkout, 400 commits on main)

| file | commits touching it, of 400 |
|---|---|
| cat-harness/test/results/lsi/cat-harness/skills.lsi.json | 317 (79%) |
| cat-harness/docs/lsi/index.md | 319 (80%) |
| cat-harness/test/results/tool-runs/lsi-index/cat-harness/skills.tool-run.json | 254 (64%) |

## in5a does NOT apply, measured

in5a is about content that depends on the CONTAINER. Regenerated skills.lsi.json
in this container on an unchanged tree: byte-identical to the committed file
(diff 0 lines). It is tree-determined, so take-base plus a regeneration pass
converges -- in5a loop absent.

The reason take-base is still not the fix is global SENSITIVITY, not
nondeterminism. Appending one sentence to one of 229 skill files changed:

- fingerprint
- 9 of 12 `dimensions` entries
- 166 of 229 `neighbours` entries (72%)
- `findings`: UNCHANGED. Every other field: unchanged.

Byte shares of the 89,585-byte sidecar: `neighbours` 84,167 (94%),
`dimensions` 4,692 (5.2%), `findings` 248 (0.3%). So every merge rewrites 94%
of the file, and the only judgement in it is 0.3%.

## And nothing on main judges those bytes

.gitattributes 77-80 already records it: corrupting the sidecar fingerprint
left lsi:skills:check at exit 0, because that gate validates the RUN RECORD
fingerprint and never the sidecar contents. That measurement is why
skills.lsi.json was refused a -merge entry (eqxp).

## The landing place exists and the last blocker is gone

- cat-harness.json declares storage {branch: cat/cat-harness/qa-reports,
  keyedBy: commit} on test/results/.
- .gitignore:255 already ignores cat-harness/test/results/ and says "neither is
  committed" -- yet 1,028 files there are still TRACKED.
- Readers were migrated by oq1j.
- 5hox recorded on 2026-10-02 that lsi:viz:check exits 2 for want of a main/
  entry on qa-reports. 105 main/<sha> entries now exist (latest publish
  2026-10-04T08:16).

Measured with the LSI sidecars moved aside:

- lsi:skills:check  exit 0  "fresh -- recomputed in this run (229 units)"
- lsi:viz:check     exit 0  "indexes read from qa-reports main/12b916e9...;
                             cat-harness/docs/lsi/index.md is current"

## Scope

The LSI subset of 5hox only -- the 8 files whose readers oq1j already migrated.
NOT the 1,186-file removal: its (A)-(E) gate blockers are other QA families.

## Done when

[ ] the 4 *.lsi.json and 4 lsi-index *.tool-run.json are untracked from main
[ ] docs/lsi/index.md no longer carries a value that moves with a corpus edit
[ ] bun run gates green
[ ] merge-conflict-patterns / the LSI skill say where the data now lives


## Claim 2026-10-04

Held by session https://claude.ai/code/session_01SjvqTkDQsqa6SLLFjBwoD3, branch
worktree-agent-a51863e62bc94a374. beans:claim reported the bean is new on this
branch so no sibling can see it; claimed locally, visible when the PR opens.
