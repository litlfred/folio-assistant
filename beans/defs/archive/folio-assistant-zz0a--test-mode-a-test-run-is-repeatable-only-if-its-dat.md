---
# folio-assistant-zz0a
title: 'TEST MODE: a test run is repeatable only if its data and process are hashable and signable'
status: completed
type: task
priority: high
created_at: 2026-09-19T08:55:36Z
updated_at: 2026-09-19T16:21:21Z
parent: folio-assistant-5a3l
---

From [#363](https://github.com/litlfred/folio-assistant/issues/363): "need
repeatable (hasvake/signable) test data and processes" — read as
hashable/signable.

## What is being asked for

A test result is evidence only if a third party can establish **what was tested**
and **with what**. That needs two hashes, not one:

- the **data** hash — this exact data set produced this result
- the **process** hash — this exact scenario bank, criteria and configuration
  produced this result

Signable is the stronger form: a jurisdiction reviewing decision-support
behaviour may need to attest that a result came from a named reviewer, not merely
that it is internally consistent.

## This repository already got a version of this wrong

`folio-assistant-cv10`, completed: "QA freshness key omits the criterion
definition". A verdict keyed only on the subject went stale invisibly when the
*criterion* changed — the check said fresh, and was wrong. `folio-assistant-nytj`
records the sibling failure: two concurrent PRs each green alone and red
together, because a sidecar did not record its auditor's hash.

So the process hash is not optional and it is not a later refinement. Both those
beans are the same defect in different clothes: hashing the subject and
forgetting the thing that judged it. Read them before designing the key.

## Done when

- [ ] a result records both hashes, and neither is derivable from the other
- [ ] re-running with an unchanged data set and process reproduces the hashes
- [ ] a deliberate change to either is detected by a test that fails

## Open question for the BA

Signing needs a key and an identity, which is an infrastructure decision that
differs per topology — a sovereign-cloud jurisdiction may require its own. That
may mean signing is an axis value rather than a fixed mechanism. Flagged, not
resolved.

## Closed 2026-09-19 — all three criteria met

Shipped in [PR #438](https://github.com/litlfred/folio-assistant/pull/438).
`schemas/test-run.ts`, `folio-test-run/v1`. The three criteria are three
`describe` blocks in `schemas/test-run.test.ts`, in this order, so the bean
can be checked against the file rather than against a claim about it.

- **[x] a result records both hashes, neither derivable from the other** —
  and this turned out to be DECIDABLE rather than a property to promise.
  "Not derivable" is disjointness of the two input sets, so `buildTestRun`
  refuses a run whose bases overlap instead of recording a distinction that
  is not there.
- **[x] re-running unchanged reproduces the hashes** — and input ORDER does
  not matter while input SET does, and two files swapping names is a
  different basis (the path is hashed alongside the bytes).
- **[x] a deliberate change to either is detected** — two tests, one per
  half, each asserting the OTHER half did not move.

`cv10` and `nytj` did the design work, exactly as this bean predicted they
would. `crdm-detect.md` sits in the PROCESS basis beside the runner because
it is what the phrase list derives from — editing it changes the result
without touching the script, which is `cv10` in one line.

## One cost decided rather than glossed

A basis hashes WHOLE FILES. `cv10`'s fix could exclude `description`
because a criterion is declarative; a script cannot be split that way
without a parser, and a parser that got it wrong would under-invalidate.
So editing a comment in a runner moves the process hash. Over-invalidation
says "changed" when it may not have; under-invalidation says "same" when it
is not — and the second IS `cv10`. Prefer a separate configuration file
over a constant in the runner where this matters.

## The open question is now answerable, and is its own bean's worth of work

The bean asked whether signing is an axis value rather than a fixed
mechanism, because a key and an identity differ per deployment. Since
`folio-assistant-g7vb` landed the same day, the topology axes are declared
in code — so that question has somewhere to be answered rather than
guessed. Not done here.
