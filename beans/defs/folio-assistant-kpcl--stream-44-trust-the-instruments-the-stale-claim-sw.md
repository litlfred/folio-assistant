---
# folio-assistant-kpcl
title: 'STREAM 4/4: trust the instruments — the stale-claim sweep, CI that does not fire, and the QA record (1xhc + 1swy + ahvw, 43 open beans)'
status: in-progress
type: task
priority: high
created_at: 2026-09-22T18:29:28Z
updated_at: 2026-09-22T18:44:00Z
parent: folio-assistant-ahvw
---

## What this is

Stream 4 of 4 in the 2026-09-22 consolidation, added by the owner after the
first three were launched. It owns **the mechanism that produced the stall**,
not a feature area: `1xhc` (CI reliability, 11 open), `1swy` (QA, 17 open) and
`ahvw` (process, 15 open) — **43 beans** — plus the stale-claim sweep itself.

The other three streams make the goals move. This one makes the instruments
tell the truth, and it exists because a three-stream split left nobody owning
the thing that broke.

## The measurement, and why it is this stream's subject

Measured 2026-09-22T18:30Z:

| | |
|---|---|
| beans `in-progress` | **98** |
| of those, untouched **1–3 days** | 48 |
| untouched **3–7 days** | 28 |
| untouched **> 7 days** | 0 |
| **total untouched ≥ 1 day** | **76** |

**76 of 98 claims have nobody behind them.** `in-progress` is supposed to mean
*somebody is working on this right now*; at 76/98 it means almost nothing, and a
sibling session reading the store cannot tell a live claim from an abandoned one.
That is `bean-coordination`'s claim rule with a 78 % false-positive rate.

**Nothing is older than 7 days**, which is the useful half of the measurement:
this is not years of silt. It is one week of sessions that claimed work and
stopped, so the ages cluster and a sweep is tractable rather than archaeological.

## The worked example is this consolidation's own first commit

Bean `k59d` records that milestone critical paths go stale — `p5wm` and `yg29`
both advertise blockers that are complete. On 2026-09-22 the session writing the
stream claims **read that bean, wrote "re-verify before acting on it" into all
three claims, and then copied `p5wm`'s stale path in verbatim**. `check:stale-paths`
failed the PR for it.

Two things that follow, and they are this stream's brief in miniature:

1. **The gate worked and the discipline did not.** Knowing about `k59d` did not
   prevent reproducing `k59d`. A rule that lives only in prose is a rule with a
   compliance ceiling nobody measures — which is `1xhc`'s thesis one layer up.
2. **A passing gate is not a verified fact.** Bean `w0cr` carried the identical
   stale content and **passed**, because its path was prose rather than numbered
   steps. `check:stale-paths` reads arrow chains and numbered steps under a path
   heading; everything else it declines to judge. Gate-green and wrong is worse
   than red, and it is exactly `1xhc`'s *"a gate that does not fire is
   indistinguishable from one that passed"*.

## What this stream owns

**`1xhc` — CI reliability.** Including `u9r9` (two TypeDoc steps name a
working-directory that does not exist, so both workflows are unjudged), `iym1`
(vacuity is guarded one script at a time; no cross-gate reader pins a corpus),
`h2s9` (the sweep reads gh's `mergeable`, whose `UNKNOWN` means *not computed
yet*, and renders it as a verdict), `30hn` (16 of 33 BPMN processes are strict
by omission rather than by decision).

**Live corroboration, 2026-09-22T18:00Z:** `check:ci-health` reported eight
workflows green — and **31 further workflow files produced no run in the window**.
The tool says *"unjudged, not green"*. Anything that summarises that as a green
CI is the defect `1xhc` names.

**`1swy` — QA.** Including `cflw` (218 sidecars rewritten by one auditor edit),
`nytj` (a sidecar records its auditor's hash, so two concurrent PRs go green
alone and red together), `iumj` (e2e fixtures read the live QA corpus, so
adjudicating a finding turns CI red), `9gyz` (Finding, Decision and AuditNote are
three entities, not one).

**`ahvw` — process.** Including `rq8s` (**a session blocked on the owner is
invisible** — four sessions held verbatim questions that never reached anybody;
this is the stall's other half and arguably the more expensive one), `oh78`
(54 merges, 2 issue updates), `k59d` itself, `pomp` (a stale `origin/main`
produced two confident wrong findings in one session), `m8gz` (bean lifecycle:
archiving is drawn nowhere).

## First three moves

1. **Sweep the 76 stale claims — and expect to be wrong about what they are.**
   The obvious reading is "abandoned, release them". The falsifier is that they
   are real work somebody is mid-way through, in which case the answer is a
   **blocked-record** sweep (`bean-blocking`'s four fields: waits on / since /
   expires / handoff) rather than a release. Sample before deciding in bulk, and
   **never delete a bean** — unwanted work is `scrapped`, with its reasons.
   PR #951 is directly relevant and currently `dirty`: it adds `check:bean-blocks`
   and measured **0 of 99** in-progress beans carrying `expires`, with 29 asserting
   a block in prose only. Coordinate with stream 1, which owns that PR.
2. **`rq8s` before the rest of `ahvw`.** A blocked session that cannot reach the
   owner is indistinguishable from a stalled one, so it both *causes* stale claims
   and *hides* them. Fixing the sweep without fixing this leaves the generator running.
3. **`u9r9` and the 31 unjudged workflows.** A workflow that never runs cannot
   fail, and its silence currently reads as consent.

## Not this stream

The three GOAL milestones — `vuip`+`zzmr` (stream 1), `p5wm` (stream 2), `yg29`
(stream 3). Do not touch their beans.

**And do not repair another bean's stated path.** `check:stale-paths` lists
`p5wm` and `yg29` as *outstanding*, which reserves the repair to the bean's
OWNER: fixing somebody's stated path means judging what they meant. Report it;
the owner decides. This stream is the one most tempted to break that rule,
because sweeping is its job.

## Done when

- [ ] The 76 stale claims triaged: each released, re-claimed, or given a
      structured `## Blocked on` record with all four fields
- [ ] `in-progress` means something again — a stated, measured definition of what
      the status asserts, and a check that can fail on it
- [ ] `rq8s` closed: a session blocked on the owner is visible to the owner
- [ ] `u9r9` fixed and the 31 no-run workflows each judged — dispatch-only,
      folio-vendored, or broken — rather than left silent
- [ ] The two failures from this consolidation's own first commit written down
      where the next agent meets them, not only in this bean

## The falsifier fired — the 76 are four populations, not one

Measured 2026-09-22T18:45Z, `beans list --json` against this branch plus the
live REST API (325 PRs, 25 open). **99 in-progress, 77 untouched ≥ 1 day**,
consistent with the owner's 98/76 at 18:30Z — the drift is new claim activity,
not disagreement. Partitioned by what the claim actually **asserts**:

| bucket | n | what `in-progress` means there |
|---|---|---|
| container (≥1 child) with an open child | **16** | the claim is **TRUE** |
| container, every child closed | **0** | — |
| leaf named by an open PR | 14 | live work, mid-flight |
| leaf named by no open PR | **47** | the candidate set |

**16 of the 77 are not stale claims at all.** Nobody edits a milestone when one
of its children moves, so a container's `updated_at` measures EDITING and the
sweep read it as LIVENESS. Releasing `vuip`, `p5wm`, `yg29`, `1xhc`, `1swy`,
`ahvw` or `zzmr` — all in that 16 — would have been a defect, and three of them
are the streams' own goals.

**A correction to this bean's own first pass.** It counted nine containers with
"no open child" and proposed reviewing them for closure. All nine have **zero**
children: they are leaves typed `feature`, and "no open child" was vacuous over
them. `rollupFindings` now requires `children.length > 0` before judging a
container at all, and a test pins it. Reported here rather than quietly fixed,
because it is the same shape as the consolidation's first commit — the sweep
reproducing the defect it was written to find.

## What landed

`bun run check:bean-rollup` (`scripts/check-bean-rollup.ts`, 10 tests):

- **The gate owns no clock.** `beans.ts` §`beanFindings` declines a
  stale-`in-progress` finding because anything computed against the clock
  changes on every run; a clock-dependent GATE turns CI red at an arbitrary
  hour with nobody having changed anything. So the gate is pure graph — a
  status its own subtree refutes — and `--sweep` carries the ages and never
  sets the exit code.
- **Two directions, both self-refuting without a date.** Open container / every
  child closed: **0**. Closed container / some child open: **1** — `5a3l`
  (DEPLOYMENT) is `completed` with **12** open children, so the roadmap reads
  that area as finished. Baselined, not repaired: re-opening or re-parenting
  somebody's epic is a judgement about that epic.
- **Unjudged is not guilty.** Without `--github` the leaf buckets are one
  `leaf-unjudged` group. Rendering an unreachable API as *"no PR names this
  bean"* would convict 47 beans of the network being down — `check:ci-health`'s
  third-state rule, inverted.
- **Nothing swept.** No status changed, nothing deleted. A leaf with no open PR
  is a candidate, never a verdict.
