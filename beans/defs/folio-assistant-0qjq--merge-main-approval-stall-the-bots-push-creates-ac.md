---
# folio-assistant-0qjq
title: 'MERGE-MAIN APPROVAL STALL — CORRECTED: already handled by design; the only gap is `stage`, deliberately preview-only, and the real fix is #1829 D1'
status: todo
type: bug
priority: low
parent: folio-assistant-d33q
created_at: 2026-10-02T14:10:55Z
updated_at: 2026-10-02T14:10:55Z
---

## This bean was filed on a false premise — corrected 2026-10-02

**I filed it without reading `merge-main.yml` first.** That is the error worth
recording, because everything the first version "discovered" is written in that
file, measured on the same day, with its reason and its fix.

The step is **"Have CI judge the merge commit"**:

> Every GATING workflow, so each judges the merge commit: a bot-actor push
> leaves their `pull_request` runs at action_required (measured 2026-10-02),
> and only a dispatch actually runs. Feature Staging is preview-only and stays
> as it is. The real fix is a GitHub App token (#1829), whose pushes trigger
> the PR's own runs.

```yaml
for wf in code-quality-gates.yml jsonld-gen-check.yml; do
  gh workflow run "$wf" --repo "$REPO" --ref "$REF"
done
```

So the `action_required` behaviour is known, the gating workflows ARE made to
judge the merge commit by dispatch, and `Feature Staging` is excluded **on
purpose**.

## What the original measurement actually showed

The numbers were right; the conclusion drawn from them was not.

| | |
|---|---|
| check runs on the bot's head `4bade842ee5` | 9, all `success` |
| workflow runs at `action_required` | 3 |
| of those, with a SEPARATE successful run | 2 — `code-quality-gates`, `jsonld-gen-check` |
| with no other run | 1 — `Feature Staging` |

Those two recovered **because the workflow dispatched them**. That is the
design working, not a defect. The third is the documented exclusion. So
`mergeable_state: unstable` traces entirely to `stage` never reporting, and
`stage` is the preview deploy.

## Two claims from the first version that do not hold

- **"Mutually defeating."** Too strong. The gating workflows do judge the merge
  commit, so `ready-to-merge`'s "green on every CI job" is satisfied in
  substance. Only the preview-only job is missing.
- **"Needs a human click."** Wrong, but be precise about how far the
  measurement goes. `rerun_workflow_run` **escapes `action_required`**: run
  `37016039406` moved `action_required` -> `queued` -> `in_progress` without
  any approval. It then finished **`cancelled`**, almost certainly by the
  workflow's concurrency group once a later push superseded that head — so
  *that a re-run yields a SUCCESSFUL `stage`* is **not** established, only that
  the approval gate itself is escapable. And the gating workflows never needed
  clearing at all, because the dispatch already covers them.

## Confirmed since, from the opposite direction

A later push to the same branch **by me rather than the bot** created **10
workflow runs with 0 at `action_required`**. So the gate is specific to the
bot-actor push, exactly as the workflow's comment states — independent evidence
for its diagnosis rather than against it.

## What is genuinely left

One question, and it is the one the first version asserted without measuring:

- [ ] does a re-run of `Feature Staging` on a head that is NOT immediately
      superseded actually complete? Mine was cancelled, so the question stands.

- [ ] **does `mergeable_state: unstable` actually stop the Merge Steward?** If
      the Steward reads check runs, nothing here blocks anything and this bean
      is closable. If it reads `mergeable_state`, then a PR can be green on
      every gating job and still never merge, and the remedy is the Steward's
      rather than the bot's. Unmeasured either way — I never found the
      Steward's logic.

- [ ] #1829 **D1** is the real fix and is the owner's to decide: one GitHub App
      vs a fine-grained token per need, with `MERGE_MAIN_TOKEN` renamed
      `PUSH_BRANCH_TRIGGERING_CI`. Setting it makes the bot's push fire the PR's
      own CI and the whole question disappears. Waiting on a decision, not on
      code.

**Do not "fix" this by re-running Feature Staging.** That contradicts a stated
decision in the workflow, and the owner asked for exactly that change on
2026-10-02 before this correction was found; it was declined with the reason,
not implemented.

## Why this is kept rather than scrapped

`scrapped` would say the work was unwanted. The subject is real and #1829 D1 is
open, so the bean stays — demoted to `low`, re-titled to what is actually
unresolved, and carrying the record of how a bean gets filed against a file
nobody read. `surprise-to-corpus`: the next agent to meet an `action_required`
run on a bot push should read `merge-main.yml`'s own comment first.

Related: `d33q` (the bot), #1829 (credentials design, D1), `mc8h` (the
merge-forward ruling this label exists to make cheap).
