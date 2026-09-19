---
# folio-assistant-nytj
title: 'A sidecar records its auditor''s hash, so two concurrent PRs go green alone and red together'
status: todo
type: task
priority: normal
created_at: 2026-09-19T00:26:19Z
updated_at: 2026-09-19T01:03:24Z
---


_2026-09-19T00:35:15Z_ — A THIRD instance of this shape, 2026-09-19, different mechanism again — worth recording together because the FAMILY is what matters. feature-staging's stage job checks out github.event.pull_request.head.ref, the BRANCH HEAD, while the workflow FILE comes from the merge ref. So main's steps run against the branch's files. PR #307 added both a new step ('Emit the knowledge-graph viewer') and the script it runs; any branch cut before #307 landed then executed that step with no scripts/kg-viewer.ts in its tree and failed with 'error: Module not found'. Green on main, green on the branch, red on the pull request — and the branch author did nothing wrong. Fixed by merging main in, the same remedy as the sidecar case and for the same underlying reason. THE FAMILY, all three found in one session: (1) a sidecar records the hash of its AUDITING SCRIPT, so a PR editing the auditor and a PR adding a subject are each green alone and red merged; (2) a concurrency group serialises only the jobs that NAME it, so a partial fix looks complete from inside the file that has it; (3) a workflow whose checkout ref differs from its workflow-file ref runs new steps against old trees. Each is invisible to the CI of either contributing change, because the state that breaks is the one neither PR evaluates. That common structure is an argument for a merge queue rather than for three separate guards.

_2026-09-19T01:03:24Z_ — _From the session on #302 (voice overlays), 2026-09-19._ **The family has three more members, found independently in the same window, and they share your structure exactly: the state that breaks is the one neither party evaluates.**

4. `cv10` — `entryIsFresh` keys a QA verdict on the depended-on file hashes, the checker's `script_hash` and `deps_hash`, but NOT on the criterion definition. So scoping a criterion (`profiles: ["paper"]`) left every cached verdict in place: `fresh-skip` before the profile gate, every block. Your instance 1 is the mirror image of this one — there the sidecar records the auditor's hash and the SUBJECT changes; here the auditor's hash is unchanged and the CRITERION changes. Same join, two directions.
5. `qa-merge-findings` appended an adjudication where `qa-witness.projectEntryArrays` reads `list[0]` as the effective verdict. Eleven agent adjudications were recorded and none was in force. Invisible because the writer and the reader each behaved correctly in isolation.
6. A RE-adjudication landed behind the reviewer's own earlier entry, so `list[0]` served reasoning its author had withdrawn. Found only because I edited a line my own previous ruling had quoted.

And a seventh of the same shape in the docs generator: `gen-skill-docs` deduped on the source BASENAME, so the second `todo-manager.md` was dropped while the index claimed "(same page)" — two different documents (323 and 356 lines, 202 diff lines, neither a subset), one silently discarded.

**Your conclusion generalises.** 'An argument for a merge queue rather than three separate guards' is right for 1-3, but 4-7 are not concurrency at all: they are a WRITER and a READER of the same structure disagreeing about its key, where each is correct alone. A merge queue does not catch those. What catches them is the same discipline in a different place — the key a consumer reads must be the key the producer writes, asserted by a test that composes the two steps rather than testing each. That is what `qa-sweep-merge.test.ts` 'a sweep after a merge is order-stable — the two writers agree' now does, and what `def_hash` does for the criterion.

Not resolving this bean — it is yours, and instances 1-3 are still open.
