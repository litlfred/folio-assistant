---
name: merge-manager-watcher
description: >
  The merge manager agent's watch loop: what wakes it, how often it looks,
  how it tells whether it is the active merge manager, what it reads each
  time, which process each reading sends it to (merge train, saturation
  meta-merge, stalled-agent takeover), and how it keeps the swarm in step
  with hold and done broadcasts. Use for "be the merge manager", "watch the
  queue", "who merges", "the queue is stuck", and when starting or handing
  over the merge-steward lane.
user_invocable: true
---

# Merge manager watcher — the loop that runs the merge-steward role

The merge manager is the agent that holds the
[`merge-steward`](../../../scenarios/roles.json) role on one or more
repositories (actor
[`merge-manager`](../../../scenarios/actors/merge-manager.json)). The role
says what the steward may decide. The skills say how: what lands next
([`merge-queue`](merge-queue.md)), how it lands
([`merge-to-main`](merge-to-main.md)), conflicts
([`merge-conflict-patterns`](merge-conflict-patterns.md)), shared branches
([`ref-stewardship`](ref-stewardship.md)), and full runners
([`saturation-meta-merge`](saturation-meta-merge.md)). This page covers the
loop that runs them: when to look, what to read, and where each reading leads.
The process is
[`sdlc/processes/merge-manager-watch.bpmn`](../../processes/merge-manager-watch.bpmn).

## Am I the active merge manager?

Exactly one live session holds the lane on each repository. It holds the lane
when the owner gave it the lane, or when it took the lane over from a stalled
holder ([`stalled-agent-triage`](stalled-agent-triage.md)) and told the owner.
On taking the lane, it says so to the coordinator, so that every sibling
knows where to send PRs. On handing it over, it says to whom. A session that
cannot tell whether a merge manager is active asks the owner (`merge-queue`,
§"When no Merge Manager is active"). A memory that one existed yesterday
does not count, either way.

## What wakes it

- **A timer, every 10 minutes** while the merge window is open, and hourly
  outside it. This is a backstop, not the main signal.
- **A PR event** on a subscribed PR: ready for review, CI finished, review
  submitted, merged or closed. Subscribe to every open non-draft PR in the
  repositories it holds.
- **A main run finishing**, green or red.
- **A sibling's message**, for example "ready", "hold", or "done".

Never poll in a loop inside a turn. End the turn and let the next event wake
it.

## What it reads each time (live, never stored)

1. The open PRs: draft or ready, head SHA, mergeable state, owed checks, and
   whether any open decision is waiting on the owner.
2. The runner queue on each repository: queued and in-progress runs, and the
   age of the oldest queued run.
3. The latest main push run on each repository, and its verdict.
4. The owners of the PRs: the last push or comment by each owning session.

## Where each reading leads

| Reading | Process |
|---|---|
| A ready PR that stacks, and is all green (rule 1 below) | `merge-train` (Process_MergeTrain) |
| Queued runs 60+ minutes old with nothing landed, or the owner says runners are full | `saturation-meta-merge`: offer the card, never run without the owner's tap |
| A PR whose owner has not pushed or answered for 2+ hours | `stalled-agent-triage`: tell the owner and take it over |
| main red | The fix goes to main as its own PR first; when a dispatched `post-merge-regen` verify run says main is stale, a regen dispatched for the next PR commits the fix and that PR lands with priority (`merge-queue` §"Merge steward procedure: post-merge verification"). Trains wait for main to be green |
| Nothing to do | End the turn with no message |

## Merge-sweep rules (STRICT)

1. **"All green" is exact.** It has three parts.
   - **Finished.** Every check run on the head SHA has completed. Anything
     queued or in progress blocks. Wait for every tier, e2e included. A merge
     made before the last tier finished broke main (folio-assistant#2955).
   - **Full tier.** The "No new failures" judge, or every full test shard,
     ran. A draft or fast-tier-only pass never counts.
   - **Green as judged.** Where a "No new failures" judge exists, its
     success is the verdict. A red shard whose failures are all main's known
     failures is fine when the judge passes. With no judge, each check must
     have concluded success, skipped or neutral.

   A cancelled job counts only when a later run of the same workflow on the
   same head SHA passed the matching job (concurrency supersession). Merge
   with `expectedHeadSha` set to the full 40-hex head SHA, never a short one.
2. **Standing OK.** An owner instruction such as "merge everything green" is
   an explicit OK for every PR that meets rule 1, until the owner withdraws
   it. Merges still follow any stated chain order: a later PR in a chain
   waits for the earlier one.
3. **One PR per fix.** Before opening a fix or re-pin PR, search the open PRs
   in that repository for the same files. If one exists, compare the diffs
   and coordinate instead. If a duplicate is found later, the author of the
   later PR closes it, after checking that the diffs are identical. While
   main is red, one session owns the re-pin that fixes it, and says so to the
   merge-planning session.
4. **A main-red fix spans layers.** Find every layer the fix needs and pin
   them together in one re-pin. Verify on a fresh mount
   (`mount:remote --fresh`). A stale container mount gives false local
   passes.
5. **Hand back private caches.** A PR that adds its own cache scheme instead
   of the shared `cached-step` is held, not merged, and goes back to its
   author. Cache-first CI, rule 1: every cache goes through `cached-step`.
6. **Tabulation can be delegated.** A helper agent may tabulate the sweep
   under these rules. The helper never touches the PRs the steward owns, and
   never pushes, comments or closes.
7. **The train's PRs are the train's.** A PR labelled `merge-train` or
   `merge-train-batch` is landed by the merge train only, in a batch with one
   main move and one main CI run. The sweep skips it, as `merge-main.yml`
   does; every other PR that meets rule 1 merges as before. A sweep that
   merges a labelled PR one at a time starves the train (owner ruling,
   2026-11-06: "1. The train").

## Keeping the swarm in step

- **Hold.** Before any batch landing (a train or a meta-merge), message every
  sibling that pushes to the repositories involved: what is about to land,
  and "hold pushes, merges and run cancels here until done".
- **Done.** After the landing, post "done" with what landed and what is still
  open. Post it even when the owner chose not to go ahead. A hold with no
  "done" is an outage.
- **Hand back.** A PR that cannot land (conflict, protected path, red) goes
  back to its owner with the reason, on the PR's own thread or work item. It is
  never fixed inside the train.
- **Report.** After every landing, report to the owner: what merged, the main
  verdict on each repository, and any open decision. Keep it to one message.

## Safety rules (STRICT)

These come from the role; the watcher is the step that acts on them:

- Merges happen only on the owner's explicit OK. A card tap counts, and it
  names each PR. A standing OK counts for the PRs it covers (rule 2). A
  sibling's or coordinator's request does not count.
- Never merge committee content, change sets (CS-), or held
  `subscriptions/` trees. Never touch WHO or `smart-*` upstream repositories.
- Never push `.github/workflows/` changes without the workflows permission.
- Never cancel a main push run that has already started.
- Never skip, disable or quarantine a test to get to green.

## What this does not do yet

- The timer is each session's own scheduled check-in. No workflow wakes the
  merge manager yet.
- `bun run cat merge:watch -- --repo <owner/name>` (cat-harness-tools#1514)
  prints reading 1 with a rule-1 verdict per PR. Readings 2-4 are still
  made by hand with `gh api`.
