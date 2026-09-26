---
# folio-assistant-ymsu
title: kg:detangle:check CANNOT FAIL inside bun run gates — bun test repairs the sidecar 1140 lines earlier in the same run
status: in-progress
type: bug
priority: normal
created_at: 2026-09-25T18:38:34Z
updated_at: 2026-09-26T15:15:42Z
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


## 2026-09-26 — a MEASURED instance, with the numbers, and it is the inverse direction

Found while merging `origin/main` (87 commits) into `claude/wonderful-gauss-7frcrw`
for PR #1369. AGENTS.md states this hazard as *"`bun test` runs two of the five
writers, so gates reports their artefacts current when they are not"*. Here it ran
the other way, and the consequence is worse than a false green on a stale file: the
gate cannot see a WRONG file that `main` is carrying.

### The file, and the two regimes

`cat-harness/test/results/detangle/cat-harness/schemas.detangle.json` exists in two
populations, ~6x apart:

| | size | internal | cohesion |
|---|---|---|---|
| what `main` carries | 229 | 125 | 0.82 |
| what the real generator produces here | **1443** | **709** | **0.96** |

Both grew by exactly **+2** across the 87-commit merge (1441→1443, 227→229), so
these are not two moments of one measurement drifting — they are **two different
scopes**, tracking the same corpus in parallel.

### The decisive test

    with main's 229 committed   → kg:detangle:check FAIL
    with the generated 1443     → kg:detangle:check PASS

So `main` is carrying a sidecar its own check rejects.

### Why no gate catches it

`bun run gates` reported **3** failures on this tree and `kg:detangle:check` was
not among them — because `bun test` runs earlier in the same gate set and
**rewrites the sidecar to the 1443 values**, so the check that runs afterwards
validates a file the run itself had just repaired. The gate set is self-healing
for exactly the artefact it is supposed to be judging.

That is why this bean's rule — *measure one check at a time* — is not a
convenience. Run in isolation, `kg:detangle:check` FAILS on main's file. Run inside
`gates`, it passes. Neither run is lying; they are answering different questions,
and only the isolated one answers the question a reviewer thinks they asked.

### Not diagnosed here

**Why** the two scopes differ by 6x. Both are produced by writers in this
repository, and a difference that large is a difference in what is being scanned
rather than in the corpus — bean `xd1g` (*"11 root-rooted scans have no gitignore
awareness"*) is the obvious candidate and is NOT established as the cause. Stated
as a candidate rather than asserted.

I committed the 1443 values, because they are what the check requires in a clean
run. If CI disagrees, the scope difference is environmental and that is the finding.


## CORRECTION 2026-09-26 — I had the two populations BACKWARDS

The instance recorded above says `main` was *"carrying a sidecar its own check
rejects"*, with 229 wrong and my 1443 right. **That is inverted.** 229 was correct
and 1443 was mine, inflated.

### What established it

Merging 40 more commits of `main` and regenerating gave **230**, and
`kg:detangle:check` passes with it. The cause is in that range —
`a0f7719032e`, *"xd1g: kg-detangle asks git for its corpus"*. Before it, the
generator WALKED THE FILESYSTEM and so counted untracked and ignored content;
after it, it asks git, and only the tracked corpus counts. 1443 was an
ignore-blind scan; 229/230 is the corpus.

So the check genuinely failed with 229 in my container and passed with 1443 — I
measured that correctly — but the fault was in the SCAN, not in the sidecar, and I
attributed it to the sidecar. Beans `xd1g` and `biz4` had this right while I was
writing the opposite.

### The part of my own reasoning that failed

I tested the hypothesis that an untracked `_kg/` (4.8 MB, gitignored) explained the
inflation, moved it aside, still got 1443, and concluded the inflation was not
ignore-blindness. **The test was too narrow rather than wrong**: removing one
ignored directory does not remove the others an ignore-blind walk also sees, so
1443 barely moved and I read "barely moved" as "not the cause". A negative result
from removing ONE member of a set says nothing about the set.

The right control was the one `biz4` names — a clean checkout, which has none of
them — and I had used exactly that control earlier in the session for a different
question and did not reach for it here.

### What survives

The observation this bean is actually about is untouched and still correct:
`bun run gates` did not report the failing `kg:detangle:check` because `bun test`
runs earlier in the same set and rewrites the sidecar first, so the check validated
a file the run itself had just written. That is this bean's subject, it is
independent of which value was right, and it is why the discrepancy was invisible
until I measured one check at a time.

## Two sessions reached the same root cause independently — and that is the strongest evidence in this bean

Merge note, 2026-09-26. The two blocks above arrived from PR #1369
(`claude/wonderful-gauss-7frcrw`); the three below were written here, on PR
#1399, without either session seeing the other's work. **They converge on the
same cause from opposite starting points, and neither is a copy of the other.**

| | #1369 | #1399 (below) |
|---|---|---|
| entered by | merging 87 commits of `main` | deciding where a new chain gate could go |
| first reading | `main` carries a sidecar its own check rejects | `kg:detangle:check` is stale on `main` |
| numbers seen | 229 committed vs **1443** generated | 227 committed vs **1441** generated |
| first reading was | withdrawn, then re-established inverted | withdrawn, then re-established as first written |
| cause found | `a0f7719032e` — the generator walked the filesystem | `walk()`'s bare `readdirSync`; 2719 gitignored `node_modules` files |

Both pairs of numbers differ by exactly the 2 commits between the two
measurements, so they are the same two populations, and both sessions traced
them to the same commit's subject: an ignore-blind scan, not a wrong sidecar.

**What the convergence buys that neither session could alone.** Each of us
withdrew a correct reading on the strength of a local re-run and then had to
reinstate it — which is a pattern, not an accident, and it is this bean's
subject seen from the observer's side rather than the artefact's. A check whose
verdict depends on what a previous gate installed produces a sequence of
honest, contradictory measurements, and the natural response to a contradiction
is to distrust the *earlier* reading. Both of us did that, and both times the
earlier reading was right.

**Recorded, not fixed.** The remedy is the corpus rule (`gitCorpus`), which is
`xd1g`'s subject and already applied to the detangler. What stays open here is
the ten remaining scanners, already a `Done when` clause below.
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


## THE WITHDRAWAL ABOVE IS ITSELF WITHDRAWN — CI settled it, and the cause is a filesystem walk

Same day, after the correction above. The §"CORRECTION … does not reproduce"
block withdrew the six-stale-sidecar reading on the strength of three local runs
exiting 0 over byte-identical committed bytes. **CI, on a fresh checkout of the
same commit, agrees with the ORIGINAL reading.** Job 108392401874 on head
`9549e285425`, the first thing that has ever evaluated `kg:detangle:check` in CI
here — six STALE, the same six, the same axes.

So the sequence was: right, then wrongly withdrawn, then right again. The cause
makes all three consistent, and it is not this bean's masking mechanism.

### The cause — `kg-detangle.ts`'s `walk` read the DISK

| `cat-harness/schemas` | `size` |
|---|---|
| fresh checkout (CI) | **227** |
| this container, after a gate ran `bun install` in a publishable subpackage | **1441** |
| committed sidecar | 1441 |

`cat-harness/schemas/block-qa-schema/node_modules/` — **2719 gitignored files**
— were being counted as graph nodes. `walk()` was a bare `readdirSync`
recursion, so the measurement moved when `check:published-packages` built that
package. My first run happened BEFORE that install (saw 227, committed 1441 →
stale, correct); my later runs happened after (saw 1441 == 1441 → current,
also correct, over a polluted corpus).

**The instrument changed under me, and the corpus never did.** That is why
"same commit, same bytes, opposite verdicts" was a true observation with a false
explanation: nothing about the committed tree varied, and nothing about
`bun test`'s repair was involved either.

Fixed by calling `gitCorpus` — which existed, and whose own docblock already
named this failure (`rsi6`: *"the moment a gate installed a publishable
package's devDependencies, it descended into `node_modules/`"*) and recorded
that `xd1g` counted **11** such scanners. The detangler was one of the eleven.
Local now computes CI's 227 and the check exits 0.

### What this means for THIS bean, which is narrower than it looked

Three of the instances recorded above are the masking mechanism — `bun test`
repairing an artefact a later gate reads. **This one is not**, and conflating
them would have been the error: it is an environment-dependent measurement, and
the remedy is a corpus rule rather than test isolation. Filed here because the
symptom was identical from the outside (a `:check` whose verdict could not be
trusted) and because the previous entry pointed at this bean's mechanism as the
suspected cause. Left in place so the next reader sees that the obvious
explanation was wrong.

The §"uml:overview manufactures a red" instance above **stands** and is
independent: that one really was `bun test` writing 227 into the sidecar
mid-run. What changes is which number was right — 227 was, all along.

### Adds to "Done when"

- [ ] the other TEN `xd1g` scanners are checked against `gitCorpus`, since one
      of eleven being fixed leaves ten measurements that move with the disk.
      MEASURED AFTER: install a subpackage's devDependencies, re-run each, and
      confirm no committed artefact changes
- [x] `kg:detangle:check` gives the same verdict on one commit in two
      environments — local and a fresh CI checkout now both compute 227


## The cascade did not vanish with the job split — it shrank from 45 to 6, and MOVED

Correcting a claim of mine from earlier today, before it is quoted. I wrote that
`main`'s workflow split had eliminated the skip cascade. **Half right, and the
half that is wrong is the half with a number in it.**

Measured 2026-09-26 on the merged tree, by parsing the workflow:

| | |
|---|---|
| `typescript` job | 6 steps, `bun test` is the LAST one |
| steps skipped by a `bun test` failure | **0** — this part of the claim holds |
| `gates` job | 48 steps |
| `translation:drift:check` position | step **41** |
| steps skipped when it fails | **6** |

So the cascade is not gone. It is **six steps instead of forty-five**, and it now
sits in a different job behind a different failure. A 45→6 reduction is a large
improvement and worth having; "gone" is a different claim and it is false.

### Why this matters beyond the arithmetic

`main` carries `translation:drift:check` red BY DECISION (bean `ngxj`, issue
#206). So on `main` today, six gates at the end of the `gates` job return no
verdict, permanently, for the same structural reason the forty-five did. The
remedy the split delivered is a smaller blast radius, not a fixed mechanism —
nothing yet makes a failing step report the steps behind it as UNEVALUATED
rather than as absent.

One consequence is already visible on PR #1399: the accepted drift red now
surfaces as **two** red checks with different names — `TypeScript` (the
`no NEW drift` test) and `Repository gates (hard)` (the
`translation:drift:check` script) — which is one root cause wearing two faces, a
thing a reviewer has to be told rather than shown.

### The useful side effect, and how it was verified

`check:rendered-labels` is step **20** of that job, ahead of the drift check at
41, so it runs. That its verdict is a PASS needs no separate query: GitHub runs
steps in order and skips only after a failure, so the drift check reaching step
41 is itself proof that every step before it passed. The position of the failure
is the evidence.

### Adds to "Done when"

- [ ] a failing step's successors are reported as UNEVALUATED rather than
      silently `skipped`. The split reduced the count; it did not make the third
      state legible, which is this bean's and `1xhc`'s actual subject. MEASURED
      AFTER: with one step red, the run's summary names how many gates returned
      no verdict


## The 6-step cascade CONFIRMED in CI, and it is no longer a parse of the workflow

The block above measured the cascade at 6 by parsing `code-quality-gates.yml`.
CI has now produced it directly. Run 36250420858, head `a21d2fcbb40`, job
`Repository gates (hard)`:

| step | name | conclusion |
|---|---|---|
| 43 | gates that were registered and never run | **failure** |
| 44 | generated docs pages are current | skipped |
| 45 | voices projection and viewer are current | skipped |
| 46 | folio projection and viewer are current | skipped |
| 47 | viewer pages keep the navbar they had | skipped |
| 48 | handler namespace index is current | skipped |
| 49 | translation index is current | skipped |

**Six, named.** A parse said "six steps" and could not say which; the run says
which, and that matters because a reader can now see that `translation index is
current` — a gate about the very subject the failing step is about — is one of
the six returning no verdict. The instrument and the run agree, which is the
first time on this bean that a prediction of mine about the cascade has been
confirmed rather than corrected.

## And the position-of-the-failure argument held a second time

`translation:pot:check` had only ever run on one laptop, which by this bean's own
standard is not evidence that it runs. It is line 910 of that step, three lines
above `translation:drift:check`, and the step opens with `set -e`. So the drift
check producing its 36 findings PROVES `translation:pot:check` exited 0 — the
failure's position is the verdict on everything before it, the same reasoning
used for `check:rendered-labels` at step 22.

That is worth naming as a general move, because it is the cheap way around this
bean's whole subject: **inside a `set -e` step, a later command's output is a
pass certificate for every earlier one.** It does not work across steps, which is
exactly why the cascade above is opaque and this is not.

All three gates added on this branch ran in that CI run and passed:
`check:rendered-labels` (step 22), `translation:pot:check` (step 43, by the
argument above), and the whole `Skill-registration chain, unmasked (hard)` job
(10s, green).
