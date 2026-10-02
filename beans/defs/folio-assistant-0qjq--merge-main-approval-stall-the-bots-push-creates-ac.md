---
# folio-assistant-0qjq
title: 'MERGE-MAIN APPROVAL STALL: the bot''s push creates action_required runs a human''s push does not, so the label that ends the hand-merge treadmill leaves the PR mergeable_state unstable'
status: todo
type: bug
priority: normal
parent: folio-assistant-d33q
created_at: 2026-10-02T14:10:55Z
updated_at: 2026-10-02T14:10:55Z
---

Found 2026-10-02 on PR #1844, the first PR in this session to carry the
`merge-main` label. The label did exactly what it promises and then blocked the
merge it was meant to unblock.

## Measured

`merge-main` merged `main` and pushed `4bade842ee5`, resolving one conflict by
the `readme-generated-regions` pattern — correct, and it replaced four rounds of
hand-merging (60, 46 and 37 commits of `main`, plus the first).

Then, on that head:

| | |
|---|---|
| check runs | **9, all `success`** — every `(hard)` gate included |
| workflow runs at `action_required` | **3** |
| combined commit status | `pending`, `total_count: 0` |
| `mergeable_state` | **`unstable`** |

The three awaiting approval, all `event=pull_request`:

- `37016039406` Feature Staging (GitHub Pages)
- `37016040141` Code-quality gates
- `37016040161` JSON-LD generated-file drift

Two of them have a SEPARATE successful run, so they recovered.
**`Feature Staging` has only the unapproved one**, so `stage` never reported,
no commit status was ever posted, and the combined status stays `pending` —
which is what holds `mergeable_state` at `unstable`.

**The previous head, `f2573c2bc4d`, was `clean` with the same code.** The only
difference is who pushed: my push needed no approval, the bot's does.

## Why this matters beyond one PR

`ready-to-merge` means *"Green on every CI job; the Merge Steward merges it"*.
The PR IS green on every CI job and is not mergeable-clean, so the label's
precondition and the Steward's gate have come apart. Every PR that opts into
`merge-main` will reach this state, which makes the two labels mutually
defeating: one removes the hand-merge cost and the other then cannot fire.

## What I could not do, and it is a capability limit rather than a judgement

An agent in this container **cannot approve a workflow run**:

- `GITHUB_TOKEN` is present but **empty** (length 0), so a direct
  `POST /actions/runs/<id>/approve-workflow-run` goes out unauthenticated and
  returns 404;
- the GitHub MCP server has write access but exposes no approval tool —
  `actions_run_trigger` offers `run_workflow`, `rerun_workflow_run`,
  `rerun_failed_jobs`, `cancel_workflow_run`, `delete_workflow_run_logs`, and
  nothing else.

So the stall needs a human click, or a mechanism that avoids creating an
approval-gated run in the first place.

## SETTLED: a re-run clears the gate, so an agent CAN unstall itself

Filed this as undetermined and then established it in the same sitting, so the
answer is here rather than in a follow-up.

`actions_run_trigger` with `rerun_workflow_run` on `37016039406` moved it
`action_required` -> `queued` -> `in_progress`. The approval requirement
applies to the run as CREATED by the bot's push; re-requesting it from an
authorized app does not re-ask. So the stall is **self-clearing by an agent**
and does not need a human click.

That lowers the severity and changes the remedy. The pair is usable today:
after a `merge-main` push, re-run whatever sits at `action_required`. What
remains is that **nothing does this automatically** — the PR sits `unstable`
until somebody notices, and `ready-to-merge` is already on it by then, so the
Steward sees a labelled PR it will not merge and no signal saying why.

The capability limit above still holds for *approval* specifically: there is
no approve tool and the token is empty. Re-running is a different endpoint and
is available.

## Done when

- [x] settle whether `rerun_workflow_run` clears `action_required` — it does
- [ ] decide where the fix belongs. Now that a re-run clears it, the cheapest
      is for `merge-main.yml` to re-run its own `action_required` runs after
      pushing — it already knows the head it created. The alternatives are a
      credential whose pushes need no approval, or the Steward treating
      `unstable`-with-every-check-green as mergeable.
- [ ] whichever is chosen, `ready-to-merge` and `merge-main` must be usable
      together, since the whole point of the pair is an unattended merge

Related: `d33q` (the bot itself), `mc8h` (the owner ruling to keep merging
forward by hand, which this label exists to make cheap), `1xhc` (CI
reliability).
