---
# folio-assistant-9x9r
title: check:head-has-run passes on ANY run naming the sha — two unrelated push runs satisfy it while the gate workflow never fired
status: todo
type: bug
priority: high
created_at: 2026-09-24T19:38:43Z
updated_at: 2026-09-24T19:38:43Z
parent: folio-assistant-1xhc
---


Measured 2026-09-24, on PR #1309's head. The script printed a ✓, and the gate
set had never fired.

## The pass condition is strictly weaker than the defect it detects

`runsForHead` asks the Actions API for every run whose `head_sha` is this
commit, and line 191 decides:

```ts
return runs.length > 0 ? { state: "has-run", runs } : { state: "no-run" };
```

Any run. Any workflow, any event. The header says so in as many words —
*"at least one workflow run names this exact `head_sha`"* — so the ✓ is
honest about what it measured. It is the **question** that is wrong.

The operator running this script is asking *"did my PR's gates fire?"*. On
the measured head, two push-triggered runs of unrelated workflows named the
sha, and `Code-quality gates` — a `pull_request` workflow — had not fired at
all. That is `3pqn`, the exact condition this script exists to detect, and
the script reported it as clean.

## Why this is 1xhc and not a cosmetic gap

`sddf` fixed this script's *advice* (it recommended a dispatch that `yv4z`
had measured as unsafe). This is one level earlier: the **verdict** is wrong
before the advice is reached. A gate that does not fire is indistinguishable
from one that passed — and here a script written against that very sentence
reproduces it, because a run from a *different* workflow is admitted as
evidence for *this* one.

## Done when

The verdict names the workflow, not the commit. Candidates, not yet ruled:

1. Take the workflow(s) to require from `.github/workflows/` the same way
   `gates.ts` derives its list from `code-quality-gates.yml`, so the
   requirement cannot drift from what CI runs.
2. Ask per-event: a `pull_request` workflow is satisfied only by a
   `pull_request` run, never by a `push` run naming the same sha.

Whichever is chosen, the third state survives: could-not-ask stays distinct
from no-run, which is the one thing the current script gets right.
