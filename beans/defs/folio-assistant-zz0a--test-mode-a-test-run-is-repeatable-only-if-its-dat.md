---
# folio-assistant-zz0a
title: 'TEST MODE: a test run is repeatable only if its data and process are hashable and signable'
status: todo
type: task
priority: high
created_at: 2026-09-19T08:55:36Z
updated_at: 2026-09-19T08:55:36Z
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
