---
# folio-assistant-1acg
title: check:head-has-run counts an action_required run as RAN — a run that never executed satisfies 'the gates fired'
status: in-progress
type: bug
priority: high
created_at: 2026-10-03T00:15:20Z
updated_at: 2026-10-03T00:15:28Z
parent: folio-assistant-1xhc
---


## The defect, in one line

`ranAs` matches a run on **name and event** and never reads its `conclusion`:

```ts
function ranAs(runs: RunRow[], t: WorkflowTrigger, event: string): boolean {
  return runs.some((r) => r.name === t.name && r.event === event);
}
```

`RunRow` already carries `conclusion`. The data was in hand and not consulted.

A `pull_request` run that completes **`action_required`** was created and
**never executed**: no job ran, no gate was evaluated. It satisfies
`ranAs` anyway, so `coverageFor` reports `ran: true` and the CLI prints
`✓ all N workflow(s) owed for `pull_request` ran`.

This is the direct sequel to bean `9x9r`, which fixed *"a run of the wrong
event counts"*. Same shape one field over: **a run that did not run counts.**
`9x9r`'s own docblock states the intent this violates — *"{@link runsForHead}
answers 'is there a run', which is a strictly weaker question than **did the
gates fire**"*.

## Measured 2026-10-03, on the two heads the merge sweep flagged

`bun run check:head-has-run c975c7da7b9b1ce32e3466abd1028e29e34dbb29` (#1819):

```
  c975c7da7b — 5 run(s):
    Code-quality gates                   pull_request     action_required
    Feature Staging (GitHub Pages)       pull_request     action_required
    JSON-LD generated-file drift         pull_request     action_required
    JSON-LD generated-file drift         workflow_dispatch success
    Code-quality gates                   workflow_dispatch failure

✓ c975c7da7b — all 1 workflow(s) owed for `pull_request` ran.      exit 0
```

**Exit 0 on a head that is both unverified AND red.** The only run that
executed `Code-quality gates` at all is the `workflow_dispatch` one, and it
**failed**. `#1808` (`ead7c138ab`) is the same shape with a passing dispatch.

So the ✓ is not merely optimistic: it is printed over a *failure* that is
visible two lines above it in the script's own output.

## Why the ✗ cannot simply be "missing"

Three states must stay apart, and folding `action_required` into the existing
`missing` set would lose the one that tells the operator what to do:

| state | means | remedy |
|---|---|---|
| **ran** | a `pull_request` run executed | read its conclusion |
| **blocked** | a `pull_request` run exists and **never executed** | NOT a dropped event. Nothing to wait for and nothing to dispatch-fix |
| **absent** | no such run at all | the three `3pqn` / `52cz` causes |

`missingRequiredAdvice`'s `mergeable` branch says *"their absence is
unexplained (bean `3pqn`)"* and *"Dispatching against this ref is safe HERE"*.
Both sentences are **false for a blocked run**: its absence IS explained, and a
dispatch is what has been masking the problem rather than fixing it. Printing
`3pqn`'s advice here is the hazard this file has twice been fixed for — giving
advice that makes things worse.

## Root cause of the `action_required` itself — confirmed, not inferred

Bean `0qjq` recorded it as a hypothesis from `merge-main.yml`'s comment. Now
measured directly, on both heads, via
`actions/runs?head_sha=<sha>` → `actor.login` / `triggering_actor.login`:

| | |
|---|---|
| every `action_required` run's `actor` and `triggering_actor` | `github-actions[bot]` |
| `head.repo.fork` | `false` — **not** an outside-contributor gate |
| `head.repo.full_name` | `litlfred/folio-assistant` |
| PR author | `litlfred` — so actor ≠ author |

The bot-actor diagnosis in `merge-main.yml` is **confirmed**. The fix is the
one already named in `0qjq` and issue **#1829 D1** — a push credential whose
pushes trigger the PR's own runs (`MERGE_MAIN_TOKEN`, proposed rename
`PUSH_BRANCH_TRIGGERING_CI`). `merge-main.yml` already carries the
`HAS_TOKEN` branch, so **setting the secret is the whole change** — and it is
the owner's to make, not a code change.

## Done when

- [ ] `coverageFor` reports `blocked` distinctly from `ran` and from `absent`
- [ ] the CLI exits non-zero on a blocked required run
- [ ] the advice for `blocked` names the bot-actor cause and does NOT recommend
      a hand dispatch
- [ ] `check:prs-have-runs` stops calling an all-blocked head `has-run`
- [ ] tests over every new branch
