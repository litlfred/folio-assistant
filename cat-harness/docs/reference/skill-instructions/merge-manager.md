---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: 'Merge Manager'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/sdlc/sdlc-core/merge-manager.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/sdlc/sdlc-core/merge-manager.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/sdlc/sdlc-core/merge-manager.md){: .fa-edit-source }

{% raw %}
# Merge Manager — one merger, many authors

> **DRAFT.** This skill is a proposal awaiting the owner's rulings on
> [#1800](https://github.com/litlfred/folio-assistant/issues/1800). The full
> argument (options compared, open questions) is the
> [Merge Manager proposal](../../proposals/merge-manager-2026-10-01.html).
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
3. **Bring main in with `bun run merge:main`.** It is the
   [`merge-conflict-patterns`](merge-conflict-patterns.md) command and executes
   `processes/merge-base.bpmn`. It merges (it does not rebase, so nobody
   force-pushes) and resolves only the conflicts a declared pattern covers.
   If any conflict is authored or undeclared, it aborts the whole merge.
   It then runs `bun run regen`. A conflict it refuses goes to step 12.
4. **Check the submodule pins before pushing.** `merge:main` re-syncs the
   submodule checkouts. Still check that `git ls-files -s bootstrap
   bootstrap-tools` equals `git ls-tree origin/main bootstrap bootstrap-tools`,
   unless the PR itself changes a pin. **Never `git add -A` with submodules
   checked out at the branch's old commit.** That records the stale pin and
   silently reverts `main`'s (measured 2026-10-01; caught only by
   `render:bpmn:check`). A hand merge done without `merge:main` must run
   `git submodule update --init bootstrap bootstrap-tools` before staging.
5. **Regenerate.** `bun run regen` runs as many passes as it needs until
   nothing changes (see [`prepare-merge`](prepare-merge.md) §"A clean merge can
   produce a wrong artefact"). Then run `bun run readme:subgraphs` **last**,
   because generated READMEs read what the other generators wrote. The tail of the order matters too, measured 2026-10-01 on #1802: `readme:subgraphs`, then `state:visualizer`, then `docs:harness` (it snapshots `docs/_data/harness.json` from what the others wrote), and only then their `:check` forms. Then run
   `bun run regen --dry-run` to confirm that nothing is still stale. (`merge:main`
   has already run `regen`; this step is for a hand merge, and for the README
   ordering.)
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
- [`merge-conflict-patterns`](merge-conflict-patterns.md): `bun run merge:main`,
  the base merge in step 3.
- [`continual-progress`](continual-progress.md): authors still push freely
  and open their PR at commit 1.
- [`ci-health`](ci-health.md): reading the verdict of a run you could not see.
- [`issue-working`](issue-working.md): an agent never closes an issue, or a
  PR, on its own say-so.
{% endraw %}
