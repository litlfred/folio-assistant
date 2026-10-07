---
# folio-assistant-4rbc
title: 'CI cone: enable the f017 input-hash skip under CI, seeded from main''s last green run'
status: in-progress
type: task
priority: normal
created_at: 2026-10-07T19:39:28Z
updated_at: 2026-10-07T19:39:38Z
parent: folio-assistant-hfag
---

Issue #2456. Owner approved 2026-10-07 ~19:40Z ("1y, 2y, 3y, 4y"). Measurements in the issue body.

_2026-10-07T19:39:38Z_ — Claimed by claude/ci-cone-f017 (session https://claude.ai/code/session_013WbQekVypi9A6YQbLDXMmJ).

## 2026-10-07: the approach as specified skips nothing, so no CI plumbing was built

**The falsifier hit before any code was written.** Under f017's existing rules, a pull request skips a check only when that check's fingerprint equals the one main recorded. Today no PR can meet that condition.

**What was measured, on `origin/main` @ 1d28c5c4562:**
- `bun run input-hash:coverage` reports 222 declared tasks: 162 skippable, 3 undetermined, 1 audit-clean but undeclared, and 56 blocked by an input site.
- Every one of the 162 is declared `inputs: [{tracked}]`, the whole working tree. That covers `TREE_READER` in `cat-harness/scripts/task-io.ts` and every `taskIo` row in `smart-base.json`, `who-iris.json` and `fhir-harness.json`. No task declares a narrower glob list.
- **What a beans-only edit does:** appending one line to one bean changed the fingerprint of `check:workflow-coverage` and of `check:import-direction`. Neither check reads beans. Measured with `checkFingerprint` in about 350 ms each. The `{tracked}` digest is part of every skippable fingerprint, so any change to any tracked file moves all 162.
- So, against main's last green run, a PR skips 0 checks and saves 0 runner-seconds. The same holds for a beans-only PR, the motivating case. Restoring the record would cost runner time and buy nothing.
- **The only case that would skip is a PR merge tree identical to a green main tree.** That case is issue #2456 item 2 (verdict reuse on main), not this bean.
- Checks with a `head` or `refs` site also hash the commit id. Those would miss even on an identical tree, because a PR merge commit is never main's commit.

**Test level (design item 5): same blocker.** A test file reads the tree like a gate does. With nothing narrower than `{tracked}` to declare, its import closure is not its input set. Fixture reads, directory walks and spawns are file reads that the closure does not name.

**What would make the cone real.** Each check needs an input set narrower than the tree, and that narrowing must be checked rather than merely claimed. `task-io.ts` currently forbids an unchecked narrow list: "a narrower list is a claim about FILES the audit cannot check". Two ways to check one:
1. **Declared narrow inputs, verified by a trace on main.** Each check declares globs. On every main run the check also runs under `strace -f`, recording opens, stats and directory listings. A read outside the declaration marks that declaration undetermined from then on.
   - Why this is sound, given f017's input-site audit: identical declared inputs and identical code give an identical run, so the same reads.
   - Cost: one declaration per check, 162 in all, which can be drafted from the first trace. The trace also makes the main run slower.
2. **A recorded read set, with no declaration.** The trace from main's green run is used directly as the check's inputs.
   - Less authoring than option 1.
   - It moves the "declared, not inferred" rule from f017. That rule is the owner's to change.

Both options need an owner decision. Until then this bean stays open, with no CI change.

## 2026-10-07 ~20:00–20:08Z: owner rulings

After the measurement above, the owner chose option 1, *"1y"*: narrow inputs, verified on every main run. He then refined it twice:

- *"derived is BEST"*: the narrow sets are DERIVED, computed by a deterministic, re-runnable procedure. They are neither hand-declared nor inferred.
- *"DERIVED = no drift, no extra data fields"*: no committed input-set file and no new `inputs` field. The read set is computed from the run itself and never stored as authored data.

**The rule becomes: an input set is declared or derived (computed from the run itself, never stored), never inferred.** It is stated in:
- `ci-health.md` §"A green step can be a SKIPPED one: the CI cone";
- the `input-hash.ts` and `task-io.ts` docblocks;
- the `ci-cone.ts` module comment.

## Design as built

1. **Record, on a push to main.** `gate-shell.sh` runs every `bun run <check>` step of `gates-kg` and `gates-docs` through `ci-cone.ts run`, which runs it under `strace -f`. A green run records, in `build/ci-cone/records.json`:
   - every path inside the checkout that the run opened, stat'ed, listed or probed, with the state it had (content digest, sorted listing, or absent);
   - every git command the run executed (only read-only subcommands with no stdin), with its exit status and output digests;
   - the check's f017 fingerprint without the tree: import closure, audited environment, tool versions and `--against` baseline.

   The job saves the file with `actions/cache/save` under `ci-cone-v1-<job>-<main sha>`.
2. **Decide, on a pull request.** The job restores the record under `<job>-<base sha>`, falling back to the newest `<job>-` key. `ci-cone.ts decide` re-computes the fingerprint, re-hashes every recorded path, and replays every recorded git command on the PR's tree. It skips only on an exact match. The step then prints `SKIPPED — inputs unchanged since <sha>` and is listed in the job summary under "CI cone". It is never reported as a pass.
3. **Why an exact match is sound.** The verdict and its read set come from the same run, so nothing can drift. The same code reading the same recorded content takes the same path, given that f017's input-site audit makes every other input hashed or refused. A data-dependent read is covered, because the file that chose the path is in the record.

   The caveat stands: a trace covers only the path that run took, and the argument above is what makes that enough.
4. **Recorded as undetermined, so the check always runs:**
   - a red run;
   - a write inside the checkout;
   - a git command that is not read-only;
   - a relative path with no known cwd;
   - an unclassified syscall;
   - more than 20,000 paths (the whole-tree walks);
   - a traced input site the run reached;
   - a fingerprint that moved while the check ran;
   - a check not declared `{tracked}` in task-io.

   One change to f017 itself: a `tree` site no longer forces `{tracked}` when the caller replays git. Only the cone passes that option.
