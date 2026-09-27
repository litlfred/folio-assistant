---
# folio-assistant-sff8
title: Contention inflates a per-test budget ~35x, and vxho fixed ONE of 505 files — two more just failed on main
status: in-progress
type: bug
priority: normal
created_at: 2026-09-26T03:31:40Z
updated_at: 2026-09-27T07:02:49Z
parent: folio-assistant-1xhc
---


Measured 2026-09-26 on a clean checkout of `main` at `0ef9543ccf3`, while
starting unrelated work. `bun test` **exited 1**:

```
cat-harness/content/pipeline/translation-block-qa.test.ts:
(fail) buildReport — absence is absence > a translated block reports coverage,
       terms and echo — and NO round-trip verdict [5031.09ms]
  ^ this test timed out after 5000ms.

cat-harness/scripts/tests/profile-scoping.test.ts:
(fail) the sweep's profile gate, end to end > a paper-only criterion is n/a'd
       in a document folio, under its OWN outcome [12314.36ms]
  ^ this test timed out after 5000ms.
```

Both are **timeouts, not assertion failures** — the `^ this test timed out`
line says so. `11698 pass, 56 skip, 2 fail` across 505 files in 305s.

**Both pass in isolation.** The two files together: `45 pass, 0 fail, 12.44s`,
exit 0. So neither test is broken and neither is slow on its own.

The first one is the striking number: **5031ms against a 5000ms limit — 0.6 %
over.** That is not a race that happens sometimes; it is a coin whose bias
depends on what else the machine is doing.

## Why this is NOT a reopening of `vxho`

`vxho` is completed and its fix was right. It hoisted `SCHEMA_GRAPH` and
`LIBRARY_GRAPH` to module scope in **`viz-generators.test.ts`**, so that file's
filesystem work no longer sits inside any single test's budget, and it closed
with a stated falsifier:

> *"if this ever recurs on `viz-generators.test.ts` after this change, the cause
> is elsewhere and this entry is the record of what was already ruled out."*

It has **not** recurred there. It recurred in two other files. So `vxho`'s fix
holds and its falsifier is unfired — which is exactly why this is a separate
bean rather than a note on a closed one.

What `vxho` established and did not generalise is the mechanism:

> *"the test's own work is ~150ms and the full suite inflates it ~35x. That is
> CONTENTION — hundreds of test files against one disk."*

**That mechanism is a property of the suite, not of one file.** `vxho` fixed the
one file where it had been observed. 505 files remain, every one of which does
filesystem work inside a per-test budget shares the defect, and two of them
surfaced within 24 hours of `vxho` closing.

## Why it matters more than a re-run

The failure clears on re-run, so it teaches everyone who meets it to re-run —
and **flake is not a root cause**. Worse, it is indistinguishable from a real
failure at the moment you read it, which is `1xhc`'s subject from the other
side: here a gate fires when nothing is wrong, where `1xhc`'s usual case is a
gate staying silent when something is.

It also has a measurable cost in this repo: an author who runs `bun run gates`
and sees 2 red cannot tell it is not theirs, which is the same "could not
determine is never rendered as clean" failure that plausibly contributes to
open PRs sitting unlandable.

## What a fix is NOT

**Not a raised timeout.** `vxho` argued this and the argument holds: a bigger
number buys months and decays as the repo grows, and it converts "fails under
load" into "fails under more load".

**Not per-file hoisting, 505 times.** That is `vxho` applied by hand until
somebody stops, with no way to know when it is done.

## Done when

- [ ] the two files above are measured the way `vxho` measured its one — the
      test's own work timed in a quiet process, against its runtime under the
      full suite — so the ~35x is confirmed or corrected rather than assumed
      from `vxho`
- [ ] a decision is recorded on whether the general shape is addressable at the
      suite level at all: does `bun test` offer a per-test budget that excludes
      I/O, or concurrency limits that bound contention, or is per-file hoisting
      genuinely the only lever?
- [ ] MEASURED AFTER: whatever is chosen, `bun test` over the full suite is run
      repeatedly on a loaded machine and the pass rate reported — a single green
      run is what made this look fixed in the first place
- [ ] the two named tests stop appearing; and if a THIRD file appears before
      this is addressed, that count goes here rather than into a new bean

## Not claimed

Recorded and left `todo`. The session that found it was doing unrelated work
(`ymsu`) and deliberately did not pivot.



## Third independent confirmation, and one piece of evidence the bean does not yet have — 2026-09-26, ~17:30

Seen again on `81461747918` (a beans-only branch, no source change), inside
`bun run gates`. Same two files. **Not appending a duplicate observation: the new
element is that the failing SET VARIES between runs of the identical commit.**

    full run A   buildReport — absence is absence
                 the sweep's profile gate … > a paper-only criterion is n/a'd in a document folio
    full run B   the sweep's profile gate … > the same criterion runs in a paper folio
                 the sweep's profile gate … > a folio whose config cannot be read keeps its coverage

Four distinct test names across two runs, drawn from the same two files, same
commit, same container. Then `bun test cat-harness/scripts/tests/profile-scoping.test.ts`
alone: **16 pass / 0 fail, three times.**

"Passes in isolation" is consistent with a deterministic environment difference.
**A set that varies run to run is not** — it rules that out and leaves contention,
which is what this bean already says. The same discriminator settled a navbar e2e
question earlier today from the opposite direction: a deterministic browser
difference names the same elements every time, so a varying set meant a race.

CI on that same commit reported **1** `bun test` failure, not 3 — main's `t8g3`
drift and nothing else — so the runner does not reproduce it and the local gate set
is the surface that misreports.

Consequence worth recording for whoever takes this: **`bun run gates` and
`check:merged` inherit it.** A session comparing a local gate run against CI sees
2-of-158 locally against CI's 2 and has to establish, by hand and per run, that the
extra names are not findings. That is the third time in one session that a local
gate reading had to be discounted against CI — the other two were `xd1g`-class
residue (`3vc1`) and the `pull_request` merge-ref discovery (`g5o5`).

Status untouched, no claim taken — this is somebody else's to work; the evidence is
recorded here rather than in a new bean because `check before you create` would have
had me open a duplicate of it.


## Two more timeouts, and their MARGINS are the evidence

A clean-tree `bun run gates` on 2026-09-26 21:2x hit these, in the same file:

    (fail) a paper-only criterion is n/a'd in a document folio, under its OWN outcome  [5170.50ms]
      ^ this test timed out after 5000ms.
    (fail) a folio whose config cannot be read keeps its coverage                      [5047.46ms]
      ^ this test timed out after 5000ms.

**Both are timeouts at the limit plus a small remainder** — 5000 ms + 170 ms and
5000 ms + 47 ms — and that is the discriminating fact, not the failure itself. A
deterministic environment difference (a missing binary, a different resolution, a
path that is absent in one place) does not land just past a deadline: it fails
the same way every time, usually fast. Work that is merely **slower than the
budget under load** lands exactly here, arbitrarily close to the limit from
above.

Taken with the earlier datapoint — the failing test SET varies between runs of
the identical commit, while `profile-scoping.test.ts` is 16/16 in isolation —
the shape is contention for a shared resource, not a difference between this
container and CI's.

Recorded as evidence only; this is not my bean and its status is untouched. If
it is contention, the fix is a budget or a serialisation, not a code path, and
whoever holds it should decide which.


## A third margin, and the SPREAD is the new evidence

A clean-tree `bun run gates` on the merged tree (`6b4c89309ed`, 2026-09-27 05:0xZ)
failed exactly one gate of 167, and its one failing test was:

    (fail) buildReport — absence is absence > a translated block reports coverage,
           terms and echo — and NO round-trip verdict  [7463.84ms]
      ^ this test timed out after 5000ms.

A timeout, not an assertion — and in `profile-conformance-axis.test.ts`, the
second of the two files, not `profile-scoping.test.ts`.

So the margins over the 5000 ms budget now stand at **47 ms, 170 ms and 2464 ms**.
**The spread is the point.** A deterministic environment difference — a missing
binary, a different resolution, a path absent here — produces a STABLE duration,
because it is the same work every time. A budget exceeded by three different
amounts across three runs of the same suite is load, and load is contention.

Independently: **CI passed this exact test on this exact commit** minutes before,
along with the four profile-scoping tests, in `TypeScript — tests, lint, types
(hard)` on `6b4c89309ed`. That is the third consecutive CI run to pass what this
container fails, which is this bean's premise holding rather than an assumption
about it.

Evidence only when written. **Superseded by the claim note below**: this session
claimed the bean at 05:16Z, so "no claim taken" stopped being true minutes after it
was written, and the line is corrected here rather than left standing. The remedy is
now this session's to propose, under the `## Done when` already recorded above —
which rules out both a raised budget and per-file hoisting, so neither is on the
table as a shortcut.

_2026-09-27T05:16:34Z_ — Claimed by claude/wonderful-bohr-6kxh7b — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).


## The SECOND half, diagnosed — and it is not contention for a disk either

`translation-block-qa.test.ts`'s *"absence is absence > a translated block reports
coverage, terms and echo"* is the case this bean stayed open for. Measured
2026-09-27 on `128b52fe2c3`.

### Where its time goes, measured rather than assumed

    mkdtempSync                            0.12 ms
    the two writeFileSync                  0.25 ms
    rmSync recursive on the temp dir       0.14 ms
    buildReport alone                    ~50 ms warm, 194 ms cold

**The filesystem scaffolding is 0.5 ms of it.** So `vxho`'s account — hundreds of
test files against one disk — does not explain this test, and the obvious remedy of
sharing one temp directory across the file would save half a millisecond.

Inside `buildReport`, the parts that look expensive are not:

    measureBlock (glossary prebuilt)       0.12 ms
    readGlossary(root, "fr")               3.4 ms

### The cause: two git SUBPROCESSES per criterion

`entry()` — built once per criterion — calls `reviewer()`, which calls
`gitFileCommitSha`, and `gitHeadSha(INSTANCE_ROOT)`. Both are uncached
`execFileSync("git", …)` in `qa-utils.ts`:

    gitHeadSha(root)     git rev-parse HEAD             1.96 ms/call
    gitFileCommitSha     git log -n 1 --format=%H -- p 20.05 ms/call
    one entry()                                        22.0 ms
    buildReport, ~3 criteria entries                  ~66 ms of git

That is the ~50 ms warm cost, and the answers are **invariant for the whole
process**: the same HEAD, the same script's last commit, re-asked per criterion per
block.

### Why this model fits what the bean could not explain

| observation | explanation |
|---|---|
| 4 % of budget when the machine is idle | 66 ms of git is cheap on a quiet machine |
| seen at **5031 ms** and **7463 ms** — 28–41× | PROCESS CREATION is what degrades catastrophically under load; the spawns queue behind every other test file's work |
| its three neighbours in the same file do not blow up | the two "no report" tests return `undefined` BEFORE reaching `entry()`, so they spawn nothing |
| the test that calls `buildReport` TWICE is 108 ms, less than this one's 181 | ≈ 2 × 50 ms warm, while this test pays the 194 ms COLD call — it runs first |

So contention is real, and it is contention for the **process table** rather than a
disk — and it is caused by the code spawning `git` at all, not by the suite.

### This is a PRODUCTION cost, not a test-budget quirk

`buildReport` is what the QA sweep runs per block per locale. At ~66 ms of git each,
a sweep over N subjects spends 66N ms re-answering two constant questions. The test
is only where it became visible.

### Not fixed here, because the fix has a trade-off that is not mine

Memoising `gitHeadSha` (per root) and `gitFileCommitSha` (per root+path) in
`qa-utils.ts` would take this test from ~50 ms to ~22 ms and a sweep from 66N to
~66 ms. But `qa-utils.ts` is also reachable from the long-running MCP server, where
a process-lifetime cache holds a stale HEAD after a commit — and "stale provenance
recorded as a fresh verdict" is the failure mode `sfjo` and `rmcf` are both about.
So the scope of the cache is a design decision, and it is put to the owner rather
than chosen here.

**What is NOT in question**: the numbers above, and that the remedy is not the one
this bean's `## What a fix is NOT` section rules out. It is neither a raised timeout
nor per-file hoisting — the work is 66 ms of subprocess spawning inside a function
that should not be spawning at all.
