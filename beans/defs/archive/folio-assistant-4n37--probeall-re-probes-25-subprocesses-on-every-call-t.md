---
# folio-assistant-4n37
title: 'SCRAPPED: probeAll is called ONCE per process and already memoises — no defect here'
status: scrapped
type: task
priority: normal
created_at: 2026-09-20T11:44:34Z
updated_at: 2026-09-20T13:54:39Z
parent: folio-assistant-d308
---

Found 2026-09-20 from a CI failure on PR #494 that recurred three times. The
symptom is fixed in that PR with an explicit test budget; **this bean is the cost
underneath it**, which a budget does not address.

## The measurement

`src/tools/capabilities.ts` → `probeAll(capabilities)` spawns one detection
subprocess per declared capability. Measured against `cat-harness` as the
instance:

| measurement | value |
|---|---|
| capabilities declared | **25** |
| `probeAll` run 1 | 433 ms |
| `probeAll` run 2 | **431 ms** |
| whole `degradation.test.ts` locally | 563 ms |

**Run 2 costing the same as run 1 is the finding.** There is no cache, so every
call re-spawns all 25. `degradation.test.ts` calls it from three tests, so one
run of that file spawns **75 subprocesses** to answer a question whose answer
cannot change within the run.

## What it cost, concretely

The test that joins skills against probed capabilities exceeded bun's default
5000 ms limit on three of four CI runs:

```
9268d23   5007.52 ms  FAIL        33edd5ab   5008.06 ms  FAIL
89d9dfee   822.85 ms  pass
```

Both failures logged `Terminate orphan process: pid (…) (java)` in the same job's
teardown — a shared runner with a JVM competing. Nothing in those diffs touched
capabilities or probing; `git diff origin/main...HEAD -- cat-harness/src/tools/`
was empty on the PR that kept failing.

So this blocked an unrelated PR twice and would block any PR intermittently.

## Why the fix is not simply "cache it"

**A cached probe is wrong if the environment changes mid-session**, and that is
not hypothetical for this repository: an agent can install a capability partway
through a session — `scripts/install-beans.sh` does exactly that, and the Lean
toolchain setup is another. A `probeAll` that answered from cache would report
`blocked` for something now present, and `capability-detection`'s whole point is
that a degraded state is reported rather than guessed.

So the question is **scope**, not whether to cache:

1. **Memoise per process.** Simplest, and correct for a test run or a single CLI
   invocation. Wrong for a long-lived MCP server session, which is where the
   mid-session install actually happens.
2. **Memoise with an explicit invalidation** the installer calls. Correct, and it
   couples the installer to the prober — a new install path that forgets to
   invalidate reintroduces the stale answer silently, which is worse than no
   cache.
3. **Memoise with a short TTL.** Bounds the staleness without coupling. Picking
   the TTL is a judgement, and a wrong one is invisible.
4. **Leave it uncached and let callers batch.** The honest reading of the
   measurement above: the defect is not that `probeAll` is slow, it is that ONE
   FILE calls it three times. A single `beforeAll` in that test file would take
   75 spawns to 25 with no semantic change at all.

**Recommendation: option 4 first, and possibly only option 4.** It is the change
with no correctness question attached — the three tests share one process and one
environment, so probing once for the file is not a cache, it is not repeating
work. If a real caller later needs `probeAll` twice in one operation, that is when
options 1–3 earn their risk.

## What is already done, and what this bean is NOT

PR #494 gives the failing test an explicit 30 s budget with its basis recorded —
~50x the local cost, chosen to clear contention rather than to sit just above the
observed 5008 ms. **That is a budget, not a relaxation:** every assertion still
runs and still holds, nothing is skipped or quarantined.

This bean is not a request to lower that budget afterwards. Even at 25 spawns the
test is subprocess-bound and a loaded runner can be slow; the budget should stay
until somebody has a measurement saying otherwise.

## Done when

- [ ] one of the four chosen — option 4 needs no decision about cache semantics
- [ ] if any of 1–3, the mid-session-install case is covered by a test that
      installs something and re-probes, not by a comment promising it works
- [ ] the spawn count per run of `degradation.test.ts` measured after the change,
      so the claim is a number rather than "should be faster"


---

## CORRECTED 2026-09-20 — the count, and who else hit this

**26 capabilities, not 25.** Re-measured after merging main. The figure above was
right when taken and is wrong now, which is the point main's own comment makes:
*"26 today, and the count only grows."* So a bean quoting the number needs it
re-derived, not read.

So one run of `degradation.test.ts` spawns about **78** processes, not 75.

**Main fixed the symptom independently, and better.** Two sessions reached the same
30 s budget from different commits: main at `a38fc2e3a3` (5012.69 ms) and a feature
branch at `4946c142e7` (5011.41 ms). With the two on this branch — `9268d23`
5007.52 ms, `33edd5ab` 5008.06 ms, against `89d9dfee` passing at 822.85 ms — that is
**four failures across three sessions, every one within ~13 ms of the limit**, and
the single pass nowhere near it. The signature of a test sitting exactly on its
budget, not of anything in a diff.

Main's rationale was also placed better — above the `test(` call rather than inside
it — and made a point I had not: 30 s still **fails fast if the probe ever genuinely
hangs**. The merge took main's version wholesale and folded in only what it lacked:
the JVM contention evidence, the two extra SHAs, and this bean's pointer. Keeping
two overlapping "why 30 s" comments is the drift this repo keeps paying for.

**What this changes for the bean: nothing about the recommendation, and one thing
about its urgency.** Option 4 — probe once per file in a `beforeAll` — is still the
change with no correctness question attached. But four independent sessions have now
spent time on this symptom, so the cost of leaving the root cause is measured in
other people's sessions rather than in runtime.


---

## SCRAPPED 2026-09-20 — the defect described here does not exist

Read the code before implementing the recommendation, and **every load-bearing
claim on this bean is false.** Three measurements, each one independently fatal:

### 1. `probeAll` is called ONCE per process, by every caller

The bean says *"three tests in this file each call `probeAll`, so one run spawns
~78 processes"*. Measured: `grep -c "probeAll("` in
`src/tools/degradation.test.ts` returns **1** — line 226, and that is the only
invocation. The other non-test caller, `src/index.ts:76`, also calls it once.

**No caller calls it twice.** So the recommendation — option 4, "probe once per
file in a `beforeAll`" — has nothing to deduplicate. It was a fix for a
duplication that is not there.

Where the wrong number came from: `describe("over the real corpus")` holds three
tests and each calls `loadSkillNeeds`. I read three tests in the block as three
calls to `probeAll`. One of them calls it.

### 2. It ALREADY memoises, at exactly the scope the bean asked for

`probeAll` carries a `resolved` map and an `inFlight` set, so a capability that
several others `require` is probed **once per call**, and a cycle resolves to
unmet rather than looping. The caching this bean proposed inventing is present,
written where it belongs, and handles the case the bean did not consider.

### 3. There is no performance problem to solve

| measurement | value |
|---|---|
| capabilities declared | 26 |
| one `probeAll` | 441 ms |
| the test's budget | 30 000 ms |
| headroom | **68×** |

### So what was actually wrong, and is it fixed?

Only the symptom: the test sat on bun's **default** 5000 ms limit and failed
intermittently on a loaded runner. That is fixed — main applied a 30 s budget with
its own rationale, this branch reached the same fix independently, and the merge
kept main's. Four failures across three sessions, all within ~13 ms of the old
limit; nothing since.

**The budget was never a workaround for this bean's root cause, because this
bean's root cause is not real.** It is the correct fix on its own terms: a test
that spawns 26 subprocesses has no business under a default meant for
pure-function tests, and 68× headroom still fails fast if a probe genuinely hangs.

### Scrapped rather than left open

`bean-coordination`: unwanted work is `scrapped` with its reasons, so the next
agent does not re-enter the dead end. Left open, this bean would have sent
somebody to implement a `beforeAll` that changes nothing, or — worse — a cache
whose correctness question (an agent can install a capability mid-session) is real
and would have been reasoned about at length to guard a saving of zero.

**The pattern, and it is the same one four times over in this session:** I
described a mechanism from its shape and its neighbours rather than reading it,
then reasoned carefully from the wrong premise. `covered-is-not-reachable`
§"Reachability is PLURAL" closes with it — *a name says what something is for; an
argument list says what it does* — and here one `grep -c` would have settled it
before the bean was written.
