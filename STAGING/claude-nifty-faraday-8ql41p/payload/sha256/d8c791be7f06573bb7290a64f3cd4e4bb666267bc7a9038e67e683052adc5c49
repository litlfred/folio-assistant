---
# folio-assistant-ba9e
title: 'Generated README subdirectory counts: 207 volatile integers across 54 READMEs — move them to the _data layer'
status: in-progress
type: task
priority: normal
created_at: 2026-10-02T22:34:28Z
updated_at: 2026-10-04T05:43:41Z
parent: folio-assistant-hfag
---

Child of `y7b3` part 2, which the owner left as "decide later" on 2026-09-30
with three options on the table (band the count, drop it, keep it exact).
**Owner chose a fourth on 2026-10-02: pull the count dynamically from the KG
JSON-LD rather than freeze it into committed markdown.**

## Why that is the right answer and the other three are not

The repository had already reached this conclusion from the opposite
direction. `.gitattributes` lines 85-92, measured in a scratch repository:

> `-merge` does NOT reduce the NUMBER of conflicts ... What it buys is one
> clean whole-file conflict to resolve by regenerating ... **Removing these
> conflicts, rather than tidying them, needs the files off `main`
> altogether.**

And a custom merge driver is refused on purpose (`.gitattributes` line 23):
it needs per-checkout `git config merge.*.driver`, so it "would work here and
nowhere else, including CI".

Banding only lowers the frequency; a band crossing still conflicts. Dropping
the count loses what the owner asked for on 2026-09-29 (a large instance
shows a count instead of listing every file). Taking it off `main` is the
only option that removes the class.

## The measured size of the class — wider than `y7b3` states

`y7b3` measured one file. Measured 2026-10-02 across the checkout:

| | |
|---|---|
| generated READMEs carrying a `\| N files \|` subdirectory row | **54**, across 14 instances |
| such rows in total | **207** |
| worst single file | `cat-harness/library/README.md`, 40 rows |
| `beans/README.md`, the one `y7b3` measured | 4 rows |

So this is a class fix for 54 files, which is the argument for fixing it in
the writer rather than per file.

## Why `_data` is the landing place, measured

`classify()` from `merge-conflict-patterns.ts`, run 2026-10-02:

| path | strategy |
|---|---|
| `cat-harness/docs/_data/harness.json` | **`take-base`** |
| `beans/README.md` | `generated-regions` |
| `package.json` | `refuse` |

`merge-conflict-patterns.ts:171` already globs
`cat-harness/docs/_data/**` under the `site-data` pattern. **So a count moved
into `_data/` is auto-resolved by machinery that exists**, with no new
pattern, no `.gitattributes` entry and none of the per-checkout git config the
repository rejected. A README is not eligible for the same treatment because
it carries authored prose outside the markers, which is exactly the
carry-forward test `.gitattributes` states.

## Separately, and smaller: the count should not read the WORKTREE at all

`bootstrap-tools/scripts/git-files.ts:23` runs
`git ls-files --cached --others --exclude-standard`. `--exclude-standard`
keeps ignored junk out (the `__pycache__` case in that module's header), but
`--others` still counts an untracked file nobody ignored, so a transient from
an earlier step moves a committed count and reddens
`readme:subgraphs:check` for nobody's fault. Train 6 hit this.

Counting `--cached` only makes the count a function of the COMMIT,
reproducible by anyone at that sha. The nuance that keeps it honest: during a
`readme:sync` the files just written are untracked, so `--cached` alone would
undercount until they are staged -- which is why the merge-train process now
carries an explicit clean-tree precondition on `Task_Admit` rather than
assuming one.

## Not a one-repo change

The renderer is `bootstrap-tools/scripts/subgraph-readmes.ts` (a PINNED
submodule); the `_data` writer and the Jekyll include are `cat-harness`. So it
is a two-repo change and was deliberately NOT bundled into #1894, which would
have meant a submodule bump inside a process PR.

## Done when
- [ ] `bootstrap-tools`: subdirectory rows render a marker invariant under
      adding one file, not an integer; counts written to `_data`
- [ ] `bootstrap-tools`: `filesIn` counts the committed tree (`--cached`),
      with the staging nuance above handled rather than ignored
- [ ] `cat-harness`: the page resolves the live count from `site.data`
- [ ] `readme:subgraphs:check` green with a transient file present in the tree
      — the regression test for the Train 6 failure
- [ ] `y7b3` part 2 checked off, with this bean named as its answer

_2026-10-04T05:43:41Z_ — Claimed by claude/zealous-thompson-y8dcf1-ba9e — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).
