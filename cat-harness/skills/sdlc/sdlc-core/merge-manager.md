---
name: merge-manager
description: >
  DRAFT — PROPOSED, NOT YET RULED ON (issue #1800). How green pull requests land
  on a default branch that moves faster than any one PR can keep up with: one
  Merge Manager merges, every other agent hands over with a label and a
  `ready: <sha>` comment. Covers when the role is needed and when it is not,
  intake, queue order, bringing main in, regenerating, the submodule-pin guard,
  the merge itself, the bounce-back protocol and the audit trail. Use when
  several green PRs are waiting on a busy main, when you are asked to act as the
  merge steward, or when you are an author wondering how your PR gets merged.
adapters: [document, paper, dak]
profiles: [document, paper]
---

# Merge Manager — one merger, many authors

> **DRAFT.** This skill is a proposal awaiting the owner's rulings on
> [#1800](https://github.com/litlfred/folio-assistant/issues/1800). The full
> argument (options compared, open questions) is the
> [Merge Manager proposal](../../../docs/proposals/merge-manager-2026-10-01.md).
> Until the owner rules, the **interim policy** quoted below is what binds, and
> nothing else here does.

## The interim policy, verbatim

Owner, 2026-10-01:

> MERGE POLICY: Do NOT merge to main yourself. When your PR is green on every
> CI job, mark it "Ready for review", add the label `ready-to-merge`, and
> comment "ready: <head sha>". The Merge Steward session (named "Separation")
> merges it after bringing main in and regenerating. If it comments that your
> PR went red, fix and re-label. Push your own work freely.

The author's half of that is the Tool `pr-ready-for-merge`. The rest of this
skill is the Merge Manager's half.

## Why one merger

When `main` moves roughly hourly, every open PR goes `dirty` on **generated**
files. In bean `eqxp`'s measurement, 24 of 25 conflicts over three merge cycles
were on generated files. Each author then repeats the same cycle: bring main
in, `bun run regen`, run the gates, push and wait. Each cycle can be overtaken
by the next merge (bean `mc8h`). Running that cycle once per merge, in one
place, turns N treadmills into one queue.

**Not needed** when one PR is open, or when `main` is quiet: an author who can
see a stable base merges by the ordinary
[`prepare-merge`](prepare-merge.md) route, with the owner's confirmation.

## Who does what

| | PR author agent | Merge Manager | Owner | CI | review bots |
|---|---|---|---|---|---|
| make the PR green | **R/A** | C | I | R (verdict) | C |
| hand over (`ready-to-merge`, `ready: <sha>`) | **R/A** | I | I | | |
| bring main in, regenerate, push | | **R** | A | R (verdict) | |
| merge to `main` | | **R** | **A** — the confirmation rule stands | | |
| bounce back on red | I (then fixes) | **R** | I | | |
| fix the PR's own defect | **R/A** | C | | | |

The Merge Manager **may**: push merge commits from `main` to a PR branch, push
regenerated artefacts, merge a PR the owner's policy has released, comment, and
add or remove `ready-to-merge`. It **may not**: change a PR's authored content
beyond a mechanical conflict resolution, force-push, close a PR, delete a
branch it did not create, or change repository settings.

## The SOP

1. **Intake.** A PR is in the queue when it is not a draft, carries
   `ready-to-merge`, and its LATEST `ready: <sha>` comment names its current
   head. A label with no matching comment, or a comment for an older head, is
   not intake. Comment that the hand-over is stale and leave the label alone.
2. **Order.** Oldest `ready:` comment first, unless the owner names an order.
   A PR that unblocks others, such as a fix for a red `main`, goes first.
3. **Bring main in.** `git fetch origin main`, then `git merge origin/main`
   (a merge, not a rebase, so there is no force-push).
4. **Re-pin submodules before staging anything.** Run
   `git submodule update --init bootstrap bootstrap-tools`, then check that
   `git ls-files -s bootstrap bootstrap-tools` equals
   `git ls-tree origin/main bootstrap bootstrap-tools`, unless the PR itself
   changes a pin. **Never `git add -A` with submodules checked out at the
   branch's old commit.** That records the stale pin and silently reverts
   `main`'s (measured 2026-10-01; caught only by `render:bpmn:check`).
5. **Regenerate.** `bun run regen` runs as many passes as it needs until
   nothing changes (see [`prepare-merge`](prepare-merge.md) §"A clean merge can
   produce a wrong artefact"). Then run `bun run readme:subgraphs` **last**,
   because generated READMEs read what the other generators wrote. Then run
   `bun run regen --dry-run` to confirm that nothing is still stale.
6. **Full local gates.** Run `bun run gates`. CI stops at the first failing
   gate, so a local run is the only place you see every failure at once.
7. **Push once, then wait for the verdict** on that head. Read it from the
   check runs, never from the legacy status API (bean `mc8h`'s correction).
   Do not merge main again while a run is in flight unless `main` went red.
8. **Merge** with a **merge commit**, the repository's convention
   (`Merge pull request #N from …`), only if every required job is green on
   the head you pushed.
9. **After the merge**, watch `main`'s run. If it goes red, fix forward in a
   small PR of its own (bean `391j`'s ruling) and check the parent commit
   before blaming the last merge.
10. **Bounce back** on red: remove `ready-to-merge` and comment with the
    failing job, the first failing gate and the head sha. The author fixes it
    and runs `pr-ready-for-merge` again.
11. **Stale labels.** A `ready-to-merge` whose `ready:` sha is not the head
    gets one comment. After 24 hours with no new `ready:`, remove the label
    with a comment saying why. The PR itself is never closed.
12. **Conflicts that need judgement** go back to the author or to the owner,
    with the two sides quoted. They are never resolved by picking a side.
13. **Audit trail.** Every merge, bounce and label removal leaves a PR comment
    with its reason and sha, so the queue's history is readable from GitHub
    alone.

## Related

- [`prepare-merge`](prepare-merge.md): the per-branch recipe this runs once
  per merge.
- [`continual-progress`](continual-progress.md): authors still push freely
  and open their PR at commit 1.
- [`ci-health`](ci-health.md): reading the verdict of a run you could not see.
- [`issue-working`](issue-working.md): an agent never closes an issue, or a
  PR, on its own say-so.
