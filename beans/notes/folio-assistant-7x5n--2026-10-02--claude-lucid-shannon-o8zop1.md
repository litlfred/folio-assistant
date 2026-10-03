---
# note on folio-assistant-7x5n from claude/lucid-shannon-o8zop1
$schema: folio-bean-note/v1
bean: folio-assistant-7x5n
branch: "claude/lucid-shannon-o8zop1"
created: "2026-10-02"
---
## Parcel B: seeding gate and heavy movers measured

Session https://claude.ai/code/session_01SmeBn6QZsDFaNQ4GtuC2sd, Parcel B (separation and seeding). Measured against `origin/main` @ 49c3ff2fe, 2026-10-02 ~22:10Z.

## Seeding gate: open PRs touching `cat-harness-tools/`

Method: each open PR's head diffed against its merge-base with main (`git diff --name-only $(git merge-base origin/main pr/N) pr/N`). This is the same set `merge:overlap` flags (all files), split into authored files and generated READMEs.

| PR | authored files under `cat-harness-tools/` | generated READMEs | note |
|---|---|---|---|
| #1899 | `schemas/viz-generators.test.ts` | 0 | member of merge train 6 (#1924) |
| #1764 | `schemas/kg-qa.test.ts` | 5 | `needs-merge-human`; #1916 is stacked on it (base is #1764's branch) and carries the same file |
| #1801 | `schemas/kg-qa.test.ts`, `schemas/kind-validator.test.ts` | 5 | heavy mover; **the hand-off brief omitted it** |
| #1790 | none | 5 | generated only; regenerated after any move anyway |

So the gate clears when #1899, #1764 and #1801 land. Seeding then still waits on the owner's explicit go-ahead (the steward's handover: "no seeding until the owner says so").

## #1896's "2 real test failures": stale

The handover named two: the XML comment in the DMN and the partition's unassigned file. Both were fixed in `f388822`. A full `bun test` on that head gave 14011 pass and 2 fail, but neither failure is #1896's:
- `check-environment` "is not distorted": my worktree's symlinked `node_modules` (bean `qook`'s guard), an artefact of how I set up the worktree;
- `subgraphs` entanglement report: a 5 s timeout while a typecheck ran beside it.

Re-run alone on a real install: 32 pass, 0 fail.

## Heavy movers against current main

| PR | commits behind | conflicted paths | authored conflicts |
|---|---|---|---|
| #1801 | 197 | 295 | qa-witness.ts, test-certification.dmn, kg-audit.ts, declared-path-baseline.json, translations |
| #1756 | 1062 | 32 | 6 |
| #1735 | 1188 | 83 | 11 |
| #1896 | 178 | 18 | 0 |

#1801's GitHub `mergeable_state: clean` was stale. Its owning session (01LKpuPo) posted `ready: 0f26313` at 22:05Z, so it is theirs or the train's to merge; it is not re-driven here.

## 9c7h / #1927

#1927 carries only the bean. Its step 1 needs `special-branches.json`, which arrives with #1913 in train 6. Steps 2 (push the branch) and 4 (remove `fsh-guts/` from main) each need the owner's confirmation. There is nothing to duplicate before train 6 lands.
