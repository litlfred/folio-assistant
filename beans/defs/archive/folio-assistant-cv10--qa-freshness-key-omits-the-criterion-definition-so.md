---
# folio-assistant-cv10
title: QA freshness key omits the criterion definition, so scoping a criterion never clears a cached verdict
status: completed
type: bug
priority: normal
created_at: 2026-09-18T23:43:54Z
updated_at: 2026-09-18T23:55:14Z
---

`entryIsFresh` (`content/pipeline/qa-utils.ts:1222`) keys a script verdict on three things: the hashes of the files the criterion `depends_on`, the checker's own `script_hash`, and `deps_hash` over declared `extra_inputs`. The CRITERION DEFINITION is in none of them. So changing `profiles`, `adapters`, `applies_to` or `default_severity` leaves every existing verdict in place, and the sweep reports `fresh-skip` before it ever reaches the profile gate at `qa-sweep.ts:528`.

Measured 2026-09-19: added `profiles: ["paper"]` to `voice-scholarly-default` and re-swept `content/docs` (a `contentType: "document"` corpus). All ten findings stayed `fail`; `qa-sweep --only voice-scholarly-default` reports `outcome: "fresh-skip"` for every block. The mechanism the gate exists for does work — `voice-unicode-crash` on the same block reads `n/a` with "criterion applies to the paper profile; this folio is document" — but only for blocks swept AFTER it was scoped.

This is the same failure the registry already documents for Lean docstrings at `voice-scholarly-default`: "a docstring could both introduce a finding and — worse — fail to CLEAR one" (qou #4673). There the fix was `also_invalidated_by`. Here the stale input is the criterion itself.

It makes the scoping outcome of `skills/folio-core/voice-editorial-review.md` ("add `profiles: [\"paper\"]` … one edit clears the finding for every document folio") unusable on an existing corpus, which is where it is always applied.

## Done when
- A `def_hash` over the criterion's RUN-AFFECTING fields (`profiles`, `adapters`, `applies_to`, `depends_on`, `default_severity`, `lean_granularity`) is recorded on script reviewer entries and compared in `entryIsFresh`. Not `description`: prose churn must not invalidate a corpus.
- An entry with no `def_hash` is STALE when the criterion has one, following the `deps_hash` asymmetry rule already in that function. Consequence to state in the PR: one full re-sweep on adoption, replacing script entries only — `preserveNonScriptEntries` keeps every agent and human entry.
- A test asserts that re-scoping a criterion flips a cached `fail` to `n/a` without any file under it changing.

_2026-09-18T23:55:14Z_ — ## Summary of Changes

`def_hash` added: a 12-char digest over the six run-affecting fields (`profiles`, `adapters`, `applies_to`, `depends_on`, `default_severity`, `lean_granularity`), recorded on script reviewer entries and compared in `entryIsFresh` with the same asymmetry rule as `deps_hash`. `description` deliberately excluded. Verified: `fresh-skip` -> `n/a-wrong-profile` on all 7 blocks of one chapter. 7 tests.

Found a SECOND ordering bug of the same family while verifying: `qa-merge-findings` appended adjudications, but `qa-witness.projectEntryArrays` reads `list[0]` and `qa-sweep` writes `[...nonScript, script]` — so all 11 merged adjudications were recorded but not in force. Extracted `insertAdjudication` into `qa-utils`; 5 more tests, including the merge-then-sweep composition.
