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
