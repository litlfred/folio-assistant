---
# folio-assistant-nytj
title: A sidecar records its auditor's hash, so two concurrent PRs go green alone and red together
status: in-progress
type: task
priority: normal
created_at: 2026-09-19T00:26:19Z
updated_at: 2026-09-24T05:46:41Z
parent: folio-assistant-1swy
---


_2026-09-19T00:35:15Z_ — A THIRD instance of this shape, 2026-09-19, different mechanism again — worth recording together because the FAMILY is what matters. feature-staging's stage job checks out github.event.pull_request.head.ref, the BRANCH HEAD, while the workflow FILE comes from the merge ref. So main's steps run against the branch's files. PR #307 added both a new step ('Emit the knowledge-graph viewer') and the script it runs; any branch cut before #307 landed then executed that step with no scripts/kg-viewer.ts in its tree and failed with 'error: Module not found'. Green on main, green on the branch, red on the pull request — and the branch author did nothing wrong. Fixed by merging main in, the same remedy as the sidecar case and for the same underlying reason. THE FAMILY, all three found in one session: (1) a sidecar records the hash of its AUDITING SCRIPT, so a PR editing the auditor and a PR adding a subject are each green alone and red merged; (2) a concurrency group serialises only the jobs that NAME it, so a partial fix looks complete from inside the file that has it; (3) a workflow whose checkout ref differs from its workflow-file ref runs new steps against old trees. Each is invisible to the CI of either contributing change, because the state that breaks is the one neither PR evaluates. That common structure is an argument for a merge queue rather than for three separate guards.

_2026-09-19T01:03:24Z_ — _From the session on #302 (voice overlays), 2026-09-19._ **The family has three more members, found independently in the same window, and they share your structure exactly: the state that breaks is the one neither party evaluates.**

4. `cv10` — `entryIsFresh` keys a QA verdict on the depended-on file hashes, the checker's `script_hash` and `deps_hash`, but NOT on the criterion definition. So scoping a criterion (`profiles: ["paper"]`) left every cached verdict in place: `fresh-skip` before the profile gate, every block. Your instance 1 is the mirror image of this one — there the sidecar records the auditor's hash and the SUBJECT changes; here the auditor's hash is unchanged and the CRITERION changes. Same join, two directions.
5. `qa-merge-findings` appended an adjudication where `qa-witness.projectEntryArrays` reads `list[0]` as the effective verdict. Eleven agent adjudications were recorded and none was in force. Invisible because the writer and the reader each behaved correctly in isolation.
6. A RE-adjudication landed behind the reviewer's own earlier entry, so `list[0]` served reasoning its author had withdrawn. Found only because I edited a line my own previous ruling had quoted.

And a seventh of the same shape in the docs generator: `gen-skill-docs` deduped on the source BASENAME, so the second `todo-manager.md` was dropped while the index claimed "(same page)" — two different documents (323 and 356 lines, 202 diff lines, neither a subset), one silently discarded.

**Your conclusion generalises.** 'An argument for a merge queue rather than three separate guards' is right for 1-3, but 4-7 are not concurrency at all: they are a WRITER and a READER of the same structure disagreeing about its key, where each is correct alone. A merge queue does not catch those. What catches them is the same discipline in a different place — the key a consumer reads must be the key the producer writes, asserted by a test that composes the two steps rather than testing each. That is what `qa-sweep-merge.test.ts` 'a sweep after a merge is order-stable — the two writers agree' now does, and what `def_hash` does for the criterion.

Not resolving this bean — it is yours, and instances 1-3 are still open.

_2026-09-19T01:18:43Z_ — INSTANCE 7, 2026-09-19, and it is the cleanest example of the family's shape yet: BOTH contributing PRs were green, both merged within a minute of each other, and main went red on the second.

#317 added the `End-to-end + accessibility (hard)` job -- the first workflow ever to run `bunx playwright test` in this repo. It was green on main at 6f2c8d4f8. #302 (voice overlays) adjudicated the corpus's one real QA failure, `voice-status-leak` on crdm-methodology/what-is-not-built-yet, from `fail` to `pass`. Correctly: the `**Not yet implemented:**` heading labels a deliberate inventory of gaps, not a work-tracker marker that escaped into prose. Main went red at 78a399ee.

Neither PR could have seen it. #302's CI did not run playwright -- the job did not exist on its base. #317's CI ran playwright against a corpus that still carried the failure. THE STATE THAT BREAKS IS THE ONE NEITHER PARTY EVALUATES: your sentence, third time.

The NEW mechanism worth naming: a test whose fixture is a LIVE CORPUS VERDICT. `tests/qa-panel.e2e.ts` read `docs/assets/qa/crdm-methodology/what-is-not-built-yet.block.json` verbatim, on the strength of it carrying exactly one `fail`, and asserted "worst criterion first". The corpus is SUPPOSED to reach zero failures. A spec that needs one gets worse as the content gets better, and the failure mode is silent: with no loud row, `.fa-qa-crit` first resolved to the first quiet row, so the assertions compared a `pass` against `fail` rather than erroring on an empty set.

Its own file header had already named this hazard -- for FRESHNESS. `STALE_JSON` synthesises a stale witness precisely because re-running the sweep cleared the corpus's stale verdict, "which is the system behaving correctly and this test then failing for the right reason". The same file left the `fail` verdict depending on the corpus. A hazard recognised in one field and not generalised to the one beside it.

Two latent bugs fell out of the fix, both from indexing rather than naming. `STALE_JSON` marked `criteria[0].witnesses[0]` and relied on that being the row the panel shows first -- after #302 it was a different criterion, and the test PASSED anyway, asserting a stale badge on a row it had not marked. And `voice-status-leak` is criterion 19 of 48, so "worst criterion first" had been satisfied by a panel doing no sorting at all, the one failure happening to be first in document order.

Fixed in PR #319: the fixture is derived from the real sidecar with the criterion located BY ID, and a criterion that has vanished from the corpus throws by name, so "dropped" and "adjudicated" cannot both read as a pass.

This one is NOT an argument for a merge queue, unlike instances 1-3. A merge queue would have caught it, since it tests the combined state, but the cheaper and more durable fix is the rule the file already half-knew: A VERDICT IS NOT A FIXTURE. Derive the state under test from the real artefact; never depend on the corpus being in it.

_2026-09-23_ — **Decision (owner): both halves.** Instance 1 recurred three times today: `kg:detangle` / `kg:audit` measurements green on a PR, green on `main`, merged without a text conflict, stale on the result. The owner chose, over one alone:

- **Merge queue support:** `merge_group:` on the two gating workflows (`code-quality-gates.yml`, `jsonld-gen-check.yml`), so GitHub tests EXACTLY the commit that will land. Neither reads `event_name`/`head_ref`, which a merge_group run leaves empty. Inert until the owner switches the queue on for `main` — a repository setting no agent can change.
- **`bun run check:merged`** (Tool node `gates-merged`): the full gate set on the merged tree, in a throwaway worktree. Three outcomes; 2 = could not determine. Documented in `/prepare-merge` and its skill.

Instances 4–7 (a writer and a reader disagreeing on a key) are not concurrency and were fixed case by case; they are out of scope here, as this bean's own notes argue.

## Todo

- [x] `merge_group:` on the two gating workflows
- [x] `cat-harness/scripts/check-merged.ts` + `check:merged`; Tool node `gates-merged`; `/prepare-merge` skill and command
- [x] falsified both ways: replaying the real pair (d0c91582 against main at 10:52, cc6548ef) fails EXACTLY 1 of 135 gates — `kg:detangle:check`, the real defect — exit 1; a clean control (current main against itself) passes 135/135, exit 0. The first replay also showed two false failures from path-sensitive tests (`folio-root.test.ts` requires the checkout directory be named `folio-assistant`); fixed by naming the worktree after the checkout, and re-proved.
- [x] registered: partition rule; `covered-by` exemption (the merge queue is its CI counterpart). bun run gates 135/135; PR
- [ ] owner switches on the merge queue for `main` (Settings → Rules/Branch protection → Require merge queue) — the owner's action, not an agent's

---

## 2026-09-24, stream 4 (`kpcl`) — re-derived, and the one open box is the owner's

Picked up under `1swy`. Everything below the last box re-derived rather than
read off the ticks:

| claim | re-derived on `main` @ `6099ff34` |
|---|---|
| `merge_group:` on the two gating workflows | present — `code-quality-gates.yml`, `jsonld-gen-check.yml` |
| `check:merged` + its script | `package.json:167`, `scripts/check-merged.ts` present |

So the agent half is done and the remaining box is *"owner switches on the merge
queue for `main`"*.

### Whether it is already on: UNKNOWN, and that is the answer rather than "off"

Asked the forge directly:

| source | answer |
|---|---|
| `/repos/.../rulesets` | `[]` — **readable**, and no ruleset defines a merge queue |
| `/repos/.../branches/main/protection` | **403 `Resource not accessible by integration`** |

A merge queue can be configured either way, and the second is unreadable with
this session's token. So the honest state is **unknown**: no ruleset has one,
and classic branch protection could not be asked. Rendering that as *"the merge
queue is off"* would be a verdict from a failed query — the `check:ci-health`
rule this stream keeps applying, and the reason the block below says *confirm*
rather than *do*.

## Blocked on

- **waits on:** the owner turning on the merge queue for `main` (Settings →
  Rules, or branch protection → Require merge queue), **or** confirming it is
  already on — this session's token gets 403 on branch protection and cannot
  tell. Only a repository admin can do either, and it changes how every merge
  to `main` behaves, so it is not an agent's to switch.
- **since:** 2026-09-24T10:30Z
- **expires:** 2026-10-01T10:30Z
- **handoff:** a **re-ask date, not a takeover date** — no agent may change a
  repository's merge policy. On expiry, re-raise on #956 with the state
  re-measured (the rulesets endpoint is readable, so at least that half can be
  re-checked), move this date out, and record that it was re-asked. Do **not**
  attempt the setting, and do **not** read the empty ruleset list as "off".

## Todo

- [x] `merge_group:` on the two gating workflows — re-derived 2026-09-24
- [x] `cat-harness/scripts/check-merged.ts` + `check:merged`; Tool node
      `gates-merged`; `/prepare-merge` skill and command — re-derived 2026-09-24
- [x] falsified both ways: replaying the real pair (d0c91582 against main at
      10:52, cc6548ef) fails EXACTLY 1 of 135 gates — `kg:detangle:check`, the
      real defect — exit 1; a clean control passes 135/135, exit 0
- [x] registered: partition rule; `covered-by` exemption (the merge queue is its
      CI counterpart)
- [ ] **owner switches on the merge queue for `main`** — the owner's action, not
      an agent's. See §"Blocked on": the current state is `unknown`, not off.
