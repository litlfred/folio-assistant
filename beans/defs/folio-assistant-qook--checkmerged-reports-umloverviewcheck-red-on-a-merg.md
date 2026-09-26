---
# folio-assistant-qook
title: check:merged reports a merged tree defective when no real checkout of it is — a symlinked node_modules leaks into the corpus
status: in-progress
type: bug
parent: folio-assistant-1xhc
created_at: 2026-09-26T11:04:49Z
updated_at: 2026-09-26T12:24:21Z
---



## CORRECTED 2026-09-26 — the cause is NOT `ymsu`, and the title understates it

This bean was opened saying *"a sweep artefact"* and pointing at `ymsu` — a
gate that writes what a later gate reads. **That was wrong**, and it was a
hypothesis stated in a bean's title as though it were the finding. The actual
cause is a one-character `.gitignore` bug that distorts the CORPUS of every
worktree `check:merged` builds.

Both are kept here rather than the wrong one edited away: the wrong hypothesis
is why the first three probes proved nothing, and that is the reusable lesson.

## What was actually measured

`.gitignore` line 1 read `node_modules/`. **Git's trailing slash means
DIRECTORY ONLY.** `check:merged` symlinks the checkout's `node_modules` into
its throwaway worktree to avoid a second install — and a symlink is not a
directory, so there the path was not ignored,
`git ls-files --others --exclude-standard` returned it, and `gitCorpus` handed
every consumer **one phantom entry**.

On commit `0d3c49c8`, same tree, two environments:

| environment | corpus paths | `kg:detangle:check` |
|---|---|---|
| real checkout (`node_modules` a directory) | **13666** | ✓ 29 pinned current |
| worktree (`node_modules` a symlink) | **13667** | ✗ **5 STALE** |

`comm` on the two sorted lists differs by exactly one line: `node_modules`.
Removing the trailing slash took the corpus to 13666 and the stale set from
five files to one.

So `check:merged` reported two unrelated branches' merged trees defective when
no real checkout of either was — #1392 and #1395, within one hour, which is
what opened this bean.

## The three probes that proved nothing, and why

Recorded because the method is the lesson, not the result.

1. `uml:overview:check` alone on the merged tree, in `/tmp/probe2` → green.
2. The same on `/tmp/mrg` → green.
3. `kg:audit` then `uml:overview:check` → writes nothing, still green.

Every one of those worktrees ALSO symlinked `node_modules`, so they carried
the same distortion; they differed from `check:merged` in **two** ways at once
(directory NAME and single-check vs full sweep) and therefore discriminated
between nothing. `check-merged.ts`'s own docblock says the worktree is named
`…/folio-assistant` because tests assert that name — reading that is what
exposed the flaw in the probes.

The probe that worked held everything fixed but the environment: the **same
commit** in the real checkout versus a correctly-named worktree. And the
control that clinched it: pristine `origin/main` in a worktree is red the same
way, with a SUPERSET of the same files, so the staleness was never the merge's.

## What was NOT claimed

One residual is unexplained and deliberately not attributed: with the fix
applied to a clean probe tree, `cat-harness/skills/scientific-critical-thinking.detangle.json — proseMentions`
still reads STALE in a worktree while the real checkout at that commit is
green. Four of the five files are accounted for; this one is not. Naming a
cause for it would repeat the mistake this bean was opened with.

## Done when

- [x] The cause is identified by measurement rather than hypothesis — corpus
      diff between the two environments, one entry, `node_modules`.
- [x] `.gitignore` ignores `node_modules` whether it is a directory or a
      symlink.
- [x] A test pins it **at the corpus level**, in a scratch repo where the
      defect can actually occur (this repo's `node_modules` is a real
      directory, so the bug is invisible here), with the control that keeps it
      from passing vacuously —
      `cat-harness/scripts/tests/git-corpus-symlinked-deps.test.ts`.
      Falsified: restoring the trailing slash fails it and passes the control.
- [x] `check:merged` verifies its own environment BEFORE sweeping, and a
      distorted corpus is **exit 2, could not determine** — never a red. A
      false refusal from a tool whose job is to refuse teaches everyone to
      stop running it. Falsified against a genuinely defective `HEAD`: exit 2
      with the reason, no sweep.
- [ ] The residual `proseMentions` discrepancy above: find what else differs
      between a real checkout and a worktree at the same commit.
- [ ] Re-run `check:merged` on the two recorded trees (`d698d151`,
      `240f0953`) once the fix is on `main`, and confirm both go green. A fix
      verified only forwards is `1xhc`.

_2026-09-26T12:24:17Z_ — Claimed by claude/fx5r-close — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).

