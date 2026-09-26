---
# folio-assistant-oq57
title: 'GATES CANNOT PASS ANYWHERE: script sidecars commit engine_version, so main''s new tree-write detector fails on whichever bun version is in the minority'
status: todo
type: bug
created_at: 2026-09-26T20:07:20Z
updated_at: 2026-09-26T20:07:20Z
parent: folio-assistant-1swy
---

Measured 2026-09-26, immediately after merging 51 commits of `main`.

`main` added a check I welcome — `bun run gates` now FAILS a run in which a gate
wrote to the tree it is being judged on, even when every gate passed:

    ✗ every gate passed, and the run is NOT clean — 1 gate(s) changed the tree.
      164 verdict(s) above were reached against a tree that a gate had already
      repaired, so the later ones describe a state you have not committed.

That is bean `ymsu`'s subject instrumented, and it is the right check. **It also
cannot be satisfied by anybody, and the reason is already committed.**

## The measurement

`bun test` rewrote **72** script sidecars under
`cat-harness/content/pipeline/script-sidecars/`. The diff per file is not content:

    - "last_run_at": "2026-09-26T19:43:36.482Z"      + "2026-09-26T20:01:32.915Z"
    - "last_run_sha": "abee3acee29e…"                + "80743fab7cfc…"
    - "engine_version": "bun-1.3.14"                 + "bun-1.3.11"

`saveQaScriptSidecar` in `content/pipeline/qa-utils.ts` guards correctly — it
skips the write unless something SUBSTANTIVE changed, comparing `source_file`,
`script_hash`, `script_commit_sha`, `deps_hash`, `engine_version` and
`extra_inputs`, deliberately excluding the two `last_run_*` fields. So the write
happened because **`engine_version` genuinely differs**, and the guard is doing
its job.

**The repository already carries BOTH values:**

    bun-1.3.14 : 72 sidecars
    bun-1.3.11 : 14 sidecars

Written by two different machines. This container runs `bun 1.3.11`; whatever
last swept the other 72 ran `1.3.14`.

## Why there is no fixed point

`engine_version` is a property of the RUNNER, not of the corpus, and it is
committed. So:

- commit my regeneration → 86 sidecars say `1.3.11`, and the next machine on
  `1.3.14` rewrites 86 and its own `gates` run fails
- leave it → my `gates` run fails on 72, every time, forever
- and whichever way it settles, the minority camp's `gates` can never be clean

The tree-write detector turns a pre-existing cosmetic churn into a HARD failure
for everyone whose toolchain differs from the last committer's. Both decisions
are individually right; together they are unsatisfiable.

## What this is NOT — and the archived bean that says so

`kto9` (completed, archived) investigated this exact file family and concluded
*"re-running the sweep leaves every `script_commit_sha` byte-identical; only
`last_run_at` / `last_run_sha` / content hashes move."* That reading treated
`engine_version` as content-derived and stable. **It is not stable**: it is the
runner's. So `kto9`'s conclusion holds only while every contributor runs one bun
version, which the 72/14 split shows is already false.

Not the same as `xd1g` either, though it is the same FAMILY — a committed
measurement whose value depends on the environment. `xd1g` is about scans
reading the wrong FILES; this is about a field recording the wrong MACHINE.

## Candidate remedies — NOT chosen, this is an owner call

1. `engine_version` stops being committed (moved out of the sidecar, or normalised
   to a major/minor). Smallest change; loses the ability to say which engine
   produced a verdict.
2. The tree-write detector ignores paths whose only diff is run metadata. Keeps
   the provenance; weakens the detector with a path list, which is the shape
   `xd1g` teaches not to trust.
3. The toolchain is pinned so every runner agrees. Correct in principle and not
   this repository's to enforce on a contributor's laptop.

I am NOT choosing. Recommendation if asked: (1), because a field that records the
runner is provenance about the RUN and belongs with the run, not in the corpus —
and `kto9` already excludes the other two run fields from the comparison for
exactly that reason, so (1) finishes a line of reasoning the code has half made.

## Done when

- [ ] the owner picks a remedy, recorded here in their words with a date
- [ ] `bun run gates` is clean on two machines with DIFFERENT bun versions, from
      the same commit. MEASURED AFTER: both runs report no tree write
- [ ] the `72 / 14` split is gone — one value, or no value
