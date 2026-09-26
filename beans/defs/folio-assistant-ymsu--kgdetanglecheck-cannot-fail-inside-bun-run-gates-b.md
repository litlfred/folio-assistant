---
# folio-assistant-ymsu
title: kg:detangle:check CANNOT FAIL inside bun run gates — bun test repairs the sidecar 1140 lines earlier in the same run
status: in-progress
type: bug
priority: normal
created_at: 2026-09-25T18:38:34Z
updated_at: 2026-09-26T10:34:42Z
parent: folio-assistant-1xhc
---


Measured 2026-09-25, while establishing whether PR #1348 still had anything to
fix. It is the ROOT CAUSE of #1348's own subject: the detangle staleness that
broke `main` was invisible to `bun run gates` and surfaced only because a test
run left the working tree dirty.

## The mechanism

`bun run gates` runs 152 gates in order. Gate 1 is `bun test`. Somewhere in that
suite the detangle **writer** runs, not the checker:

    gates3.log:56    wrote 28 pinned measurement(s) to cat-harness/test/results/detangle/
    gates3.log:57    updated  cat-harness/skills/folio-core.detangle.json — internal

Gate 152 is `kg:detangle:check`, 1137 lines of output later:

    gates3.log:1194  ▸ bun run kg:detangle:check
    gates3.log:1233  ✓ 28 pinned measurement(s) current in cat-harness/test/results/detangle/

It reads the file gate 1 just repaired. It is comparing the writer's output to
the writer's output.

## Measured both ways, so this is not inference

Committed sidecar at `internal: 154`, working tree's true value `153`:

| invocation | result |
|---|---|
| `bun run kg:detangle:check` **alone** | **exit 1** — `STALE  …folio-core.detangle.json — internal` |
| `bun run gates` (same tree, same commit) | **exit 0** — `✓ 152 gate(s) pass` |

Same tree, same stale value, opposite verdicts. The checker is not broken —
run alone it catches the defect exactly as designed. What is broken is that
inside `gates` its subject no longer exists by the time it looks.

## Why this is worse than an absent gate

`1xhc`'s line is *"a gate that does not fire is indistinguishable from one that
passed."* This is a third state, and worse than either: the gate **does** fire,
reports specifically and by name, and the report is unfalsifiable. An absent
gate at least leaves `package.json` honest. This one is advertised, wired,
running, green, and load-bearing for nothing.

It also **destroys the evidence as it goes**: the repair is a working-tree write,
so an agent who runs `gates`, sees green and pushes has silently taken the
generated file's true value with them or left it behind depending on whether
they ran `git add -A`. That is how a wrong `internal` count reaches `main` at all.

## Scope — the 28 sidecars are the known instance, not the boundary

The writer emits **28** pinned measurements, so every one of them is inside the
blind spot, not just `folio-core`. The general question this raises for `1xhc`:
**which other `:check` gates run after a test that writes their subject?** That
is answerable mechanically — run each `:check` alone against a deliberately
staled input and compare with its verdict inside `gates` — and it has not been
asked.

## Not the same as two neighbours

- **`061n5`/intermittent-under-gates** is a test whose result varies with the run;
  this one is perfectly reproducible in both directions.
- **`v556`** is a generator with no `--check` at all, so nothing looks. Here
  something looks, at the wrong thing.

## Done when

- [ ] the writer does not run during `bun test` — a test needing detangle output
      computes it in a temp dir, as the profile-conformance tests already do
      (`/tmp/profile-axis-*`), rather than writing into
      `cat-harness/test/results/`
- [ ] `gates` fails when the tree is entered with a staled pinned measurement.
      MEASURED AFTER: stale one `internal` by hand, `bun run gates` exits
      non-zero
- [ ] `gates` refuses, or at minimum reports loudly, when a gate has MODIFIED
      tracked files — a gate run that changes the tree it is judging is the
      general form of this defect and would have caught it without knowing
      about detangle
- [ ] the other 27 sidecars are confirmed covered by the same fix, rather than
      assumed to be
- [ ] swept for siblings: which other `:check` gates have their subject written
      by an earlier gate in the same run

## Second instance, found by the same measurement — a `--check` that omits a field

Different mechanism, same consequence, so it is filed here rather than as its own
bean: above, the checker looks at a subject a predecessor already repaired; here
the checker looks at the subject but **not at the field that is wrong**.

`cat-harness/docs/assets/beans/index.json` carries a `tile.beans.count` badge for
the site. Measured on `origin/main`, 2026-09-25:

| | |
|---|---|
| committed `tile.beans.count` | **327** |
| non-archive beans actually in `beans/defs/` | **339** |
| `gen-docs-pages --check` on that tree | **"generated pages are up to date"** |

The badge is twelve beans behind and its own generator's `--check` calls it
current. `harness.json` then copies 327 out of it, so `docs:harness:check` is
green too — **two consistent gates over one wrong number**, because both compare
downstream-to-upstream and neither compares upstream-to-reality.

It surfaced only because I ran the writer (`gen-docs-pages` without `--check`)
for an unrelated reason; the tile count jumped 327 → 340 and `docs:harness:check`
went red on the *correct* value. A gate going red when you fix something is the
signature of this whole family.

Worth noting against the code: `scanTileCounts`' docblock already reasons
carefully about **absence** — *"Every failure is ABSENCE, never zero … `dh4f`"* —
and gets that right. A stale non-absent number is the case it does not consider,
and absence is the one this design made safe.

### Adds to "Done when"

- [ ] `gen-docs-pages --check` compares `tile.*.count` against what a fresh run
      computes, not only the page bodies. MEASURED AFTER: hand-edit the count,
      `--check` exits non-zero
- [ ] the sweep item above is widened: for each `:check`, ask both *"could a
      predecessor have repaired its subject?"* and *"does it compare every field
      it writes?"* — this instance answers the second question wrongly and the
      first one fine

## Clause 3 IMPLEMENTED and falsified, 2026-09-26

`gates` now fails when one of its own gates changes the repository.
`cat-harness/scripts/gate-tree-guard.ts` snapshots `git status --porcelain`
between gates and attributes each change to the gate that made it; the runner
refuses to print its clean line when any gate did.

### The falsification, end to end

`folio-core.detangle.json`'s `internal` set to `999` by hand, then:

| | |
|---|---|
| `kg:detangle:check` **alone** | exit non-zero — `STALE … — internal` |
| `kg:detangle:check` **inside `bun run gates`** (line 1215 of the run) | **passed**, over `internal: 999` |
| the new guard | `✗ 1 gate(s) CHANGED THE REPOSITORY` → `bun test`, naming the exact sidecar |

So the bean's central claim is now reproduced on demand rather than only
remembered, and the blind spot it describes is closed by the runner rather than
by any gate.

### The direction that mattered, and would have been missed

The change `bun test` made was a **revert**, not new dirt: the file was ` M`
before gate 1 and CLEAN after it, because the writer put the correct value back.
So the entry *disappeared* from porcelain.

A guard asking *"did anything get dirtier?"* — the obvious first design — would
have reported nothing here. It would have missed its own test case. `diffReadings`
counts appearances, status transitions and disappearances for that reason, and
the disappearing case has its own test.

### Why it is safe as a HARD failure

Measured before committing to it: a full `bun test` on a clean `main` left the
tree **byte-identical**. A generator rewriting identical bytes does not appear in
`git status`, so the guard is silent on a healthy tree and fires exactly when a
committed artefact was stale.

The predicate is a per-gate **delta**, never "the tree is dirty" — running
`gates` on your own uncommitted work is the normal case, and a guard that failed
on that would be switched off the same day.

### Cost, measured rather than guessed

`git status --porcelain` over this repository's 13,529 tracked files is **~29ms**
(five runs: 29, 27, 29, 27, 29). 152 snapshots is **~4.4s**. That is what bought
per-gate attribution instead of a single before/after pair — the difference
between "the tree changed" and "gate 1 changed what gate 152 reads".

### Not done here, and still open above

Clause 1 — `bun test` should not run the detangle writer at all; a test needing
that output should compute into a temp directory, as the profile-conformance
tests already do. This guard makes that defect *visible and fatal*; it does not
fix it. Clauses 2 and 4 and the `:check` sweep are likewise untouched.

One limitation is documented in the module rather than defended against: a git
operation performed WHILE the gates run moves what is being measured, so it
would attribute an author's own `git add` to whichever gate was running. Commit
before or after a run, not during.

_2026-09-26T04:54:43Z_ — Claimed by claude/ymsu-gates-tree-guard — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).


## Third instance, and it is CI's step sequence rather than a writer — 45 gates unevaluated on main

Measured 2026-09-26 while deciding where a new chain gate could go. The bean's
open sweep clause asks *"which other `:check` gates have their subject written
by an earlier gate in the same run"*. This is the same consequence reached by a
different mechanism, so it is filed here: in CI the subject is not repaired, it
is **never looked at**.

`Code-quality gates` run 36234052354, head `e53bba8028466cf8093e546a18945b1da05094a0`
— main's latest completed run, and the base of this session's branch. Job
`TypeScript — tests, lint, types (hard)`:

| step | name | conclusion |
|---|---|---|
| 5 | `bun test` | **failure** |
| 6 | `bun run lint` | skipped |
| … | … | skipped |
| 33 | knowledge-graph audit | skipped |
| 37 | detangle measurements are current | skipped |
| … | … | skipped |
| 50 | translation index is current | skipped |

**Steps 6 through 50 are all `skipped`** — 45 gates — because step 5 failed and
no step carries `if: always()`. The job reports as one red.

### Why this is the same defect and not a new subject

The bean's parent `1xhc` line is *"a gate that does not fire is
indistinguishable from one that passed."* From the job summary a reader sees
`TypeScript — tests, lint, types (hard): failure` and one named failing test.
Nothing says that forty-five further gates returned no verdict. So the same
third state this bean describes — advertised, wired, load-bearing for nothing —
is reached without any writer being involved.

It matters right now because `main` has been red on ONE deliberately-accepted
test (`no NEW drift`, bean `ngxj` / issue #206) since 2026-09-25. For as long as
that holds, **every gate after `bun test` in that job has been unevaluated on
main.** `kg:detangle:check`'s state on main is therefore not "green" and not
"red" — it is unknown from CI, and the only first-hand evidence is a local run.

### Measured locally, on that same commit

`bun run kg:detangle:check` alone, tree clean apart from three files outside any
declared graph directory (`scripts/skill-register.ts`, `package.json`, a
workflow): **exit 1**, six sidecars STALE —

    bootstrap/skills — proseMentions
    cat-harness/schemas — size, internal, outbound, cohesion, recordedBoundary, proseMentions
    cat-harness/skills/folio-core — inbound, recordedBoundary, proseMentions
    cat-harness/skills/folio-paper-adapter — inbound, recordedBoundary
    cat-harness/skills/hypothesis-generation — proseMentions
    cat-harness/skills/scientific-critical-thinking — proseMentions

Pre-existing rather than caused by those three files, and that is structural
rather than asserted: `size`, `internal`, `outbound` and `cohesion` on
`cat-harness/schemas` are functions of files under `cat-harness/schemas/`, which
this tree does not touch. The sidecars were last committed
2026-09-26T08:54:47Z and main has moved since.

### What I am NOT claiming

That the skip cascade caused the staleness — it did not, it **hid** it. And not
that `if: always()` is the remedy: 45 steps that each `bun install`-depend on a
green tree may fail for reasons that are all one cause, which is a different
report rather than a better one. The remedy is a decision, recorded on the child
bean of `v625` rather than assumed here.

### Adds to "Done when"

- [ ] the sweep clause above is widened a second time: for each `:check`, ask
      also *"is it reachable in CI when an earlier step in its job fails?"* —
      45 of this job's steps answer no today
- [ ] main's job reports which gates returned NO VERDICT, distinctly from those
      that passed and those that failed. MEASURED AFTER: with one test failing,
      the run's own summary names a count of unevaluated gates rather than only
      the failure


### CORRECTION to the block above — the "six stale sidecars" measurement does not reproduce

Written the same session, before pushing. The §"Measured locally, on that same
commit" block above reported `bun run kg:detangle:check` exiting 1 with six
STALE sidecars, and drew from it that `kg:detangle:check` is stale on `main`.
**Re-measured three times on the same commit with the committed sidecars
byte-identical to `HEAD`: exit 0, `✓ 28 pinned measurement(s) current`.**

The reading is withdrawn. What the two observations jointly establish is
weaker and more interesting than either:

| run | committed sidecar (`cat-harness/schemas`) | verdict |
|---|---|---|
| earlier this session | `size: 1441` (= `HEAD`) | **exit 1**, six STALE |
| three times after | `size: 1441` (= `HEAD`) | **exit 0**, 28 current |

Same commit, same committed bytes, opposite verdicts — so **the check's verdict
is not a function of the committed tree alone.** That is this bean's subject
arriving from a third direction, and it is worse than the masking already
recorded: masking made the check unable to fail, and this makes it able to
fail spuriously.

**The mechanism is NOT established and is not guessed at here.** The candidate
is some earlier writer run in this session's working tree, but `git status`
showed the sidecars unmodified at the time of the red run, which does not fit.
Recorded as could-not-determine rather than as a cause.

One consequence IS established, and it is the useful half: a downstream artefact
inherits the instability. After a `bun run gates` in this tree, `bun test`
repaired the six sidecars (1441 → 227), and `uml:overview:check` — whose page
carries the detangler's pinned numbers — went **red**, naming
`cat-harness/docs/uml/overview/cat-harness.md` and `.../cat-harness/schemas.md`
as stale. On the restored tree it is green. So `bun test`'s repair does not only
hide a failure in the gate that reads the sidecar; it **manufactures** one in
the gate that reads the sidecar's consumer. I regenerated that page and reverted
it once the cause was traced — committing it would have pinned 227 into a page
whose sidecar says 1441.

### Adds to "Done when"

- [ ] `kg:detangle:check` gives the same verdict twice on one commit with a
      clean tree. MEASURED AFTER — the two runs above disagree today, and until
      that is reproducible nothing else in this bean can be confirmed or
      refuted
- [ ] the spurious direction is covered too: after a `bun test`, no `:check`
      over a DOWNSTREAM artefact goes red on a tree that was clean before it.
      `uml:overview:check` is the measured instance
