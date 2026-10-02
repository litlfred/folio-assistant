---
$schema: folio-methodology/v1
name: merge-queue
title: Merge queue — land changes on a mainline that stays green, from three industrial studies
origin: >
  Rendered from three ingested sources, all recorded rather than held (no
  licence printed on any of them permits a copy). Ananthanarayanan, Saeida
  Ardekani, Haenikel, Varadarajan, Soriano, Patel & Adl-Tabatabai (2019),
  "Keeping Master Green at Scale", EuroSys '19, ACM,
  doi:10.1145/3302424.3303970 — Uber's SubmitQueue, design and production
  evaluation. Juloori, Lin, Williams, Shin & Mahajan (2025), "CI at Scale:
  Lean, Green, and Fast", arXiv:2501.03440v2 — the follow-up to SubmitQueue at
  Uber. Memon, Gao, Nguyen, Dhanda, Nickell, Siemborski & Micco, "Taming
  Google-Scale Continuous Testing" — an empirical study of one month of Google
  TAP data. The PDF prints no venue or date; the 2019 paper cites it as
  ICSE-SEIP 2017, pp. 233–242.
evidence:
  - library/ananthanarayanan-2019-keeping-master-green
  - library/arxiv-2501.03440v2
  - library/memon-2017-taming-google-scale-testing
applies-when: >
  **Deciding how changes that passed review are combined, tested and landed on
  a shared mainline**: how a batch (a "train") is composed, what happens when
  it fails, and how a failing change is identified and returned. Not for
  whether a change is correct (that is review, and the gates of epic `nok9`),
  and not for how a conflict is resolved textually (that is the
  `merge-conflict-patterns` skill). Most of what the sources measure is at
  Uber or Google scale (hundreds of changes an hour, builds up to two hours).
  This repository merges about 40 PRs a day on a 6–8 minute CI, so each
  technique below carries a verdict for this scale and not only the paper's.
---

# Merge queue — what three industrial studies measured, what they recommend, and what transfers

**Status: rendered 2026-10-02, awaiting the owner's review** (`O_Review` in
`methodology-from-source.bpmn` is open). Owner, 2026-10-02: *"ingest to
library for methodologies and as source of requirements for merge pipeline"*,
then *"write methodologies page if relevant"*. Nothing here is adopted until
that review closes. Where this text and a source differ, the source is right
and this file is wrong.

The requirement-by-requirement reading (R1–R16, each with its section and
page) is in
[`docs/proposals/merge-pipeline-requirements.md`](../docs/proposals/merge-pipeline-requirements.md).
This node is the method. That note is the evidence trail and the gap
analysis against our pipeline.

| key | source | library entry |
|---|---|---|
| **SQ19** | Ananthanarayanan et al., *Keeping Master Green at Scale*, EuroSys '19 | [`library/ananthanarayanan-2019-keeping-master-green`](../library/ananthanarayanan-2019-keeping-master-green/) |
| **SQ25** | Juloori et al., *CI at Scale: Lean, Green, and Fast*, arXiv:2501.03440v2 | [`library/arxiv-2501.03440v2`](../library/arxiv-2501.03440v2/) |
| **TAP17** | Memon et al., *Taming Google-Scale Continuous Testing* | [`library/memon-2017-taming-google-scale-testing`](../library/memon-2017-taming-google-scale-testing/) |

## The method, as the sources state it

1. **Order changes, not patches** (SQ19 §1, pp. 1–2; §3.2, p. 4). A change
   lands only if every build step passes on the current mainline plus that
   change. A change that passes alone can still break the mainline in
   combination, and that only shows after combining (SQ19 §2.1, pp. 2–3).
2. **A failed batch is split, not rejected whole** (SQ19 §2.2, p. 3). This is
   the paper's critique of batch-reject systems. Rejecting the whole batch makes
   every innocent member pay for the guilty one.
3. **A refused change goes back to its author with a reason** (SQ19 §3.2,
   p. 4: the system "lands the change, or aborts it along with a reason").
4. **Independent changes need no ordering** (SQ19 §5.2, pp. 7–8). Whether two
   changes are independent is decided from the build graph (target hashes),
   not from file names.
5. **Tell flaky failures from real ones before blaming a change** (TAP17 §I,
   p. 2; Table II, p. 5).
6. **Measure turnaround and waiting time, and simulate a strategy before
   rolling it out** (SQ19 §8; SQ25 §IX-C, p. 8).
7. **At scale: speculate.** Build the likely outcomes in parallel, value each
   build by the probability that it will be needed, and abort the ones that
   no longer are (SQ19 §4, §6; SQ25 §V–VIII).

## Measured, recommended, claimed — kept apart

| | measured (a number from the paper's own data) | recommended (the paper says do this) | claimed without measurement |
|---|---|---|---|
| **SQ19** | Real-conflict probability 5% with 2 concurrent potentially-conflicting changes, 40% with 16 (Fig. 1, p. 3). Breakage 10–20% for changes 1–10 h stale (Fig. 2, p. 3). iOS mainline green 52% of one week before SubmitQueue (§8.5, p. 12). Only 7.9% of iOS changes alter the build graph (§5.2, p. 7). Within 1.2× of an oracle at 500 changes/h (§8.2, p. 10). | Serialise changes against HEAD; a speculation tree valued by P(needed); conflict analysis by target hashes; abort builds no longer needed. | That the mainlines "have remained green at all times" since launch (§8.5, p. 12). |
| **SQ25** | 40–65% of builds aborted prematurely (§I, p. 1). After rollout: builds-to-changes ratio down 45–64%, CPU hours down 35–52%, P95 wait down 32–45% across Go, iOS and Android (§X, pp. 8–10). | Let a small change bypass a large conflicting one when the order does not change the result (BLRD, §IV, p. 4); predict build time; a speculation threshold; simulate before deploying. | That the techniques are "language-agnostic and platform-independent" (§X, p. 8). |
| **TAP17** | Only 1.23% of test targets ever found a breakage or fix (Table II, p. 5). 46,694 of 115,160 mixed-outcome targets were flakes (Table II). Files changed often, or by 3+ authors, appear in breaking changes more often (§IV-B, §IV-E, pp. 7–9). | Schedule rarely-failing tests less often; schedule risky changes sooner; alert developers to risk. | That the correlations "likely exist in other companies" (§VI, p. 10), from "verbal discussions" by the authors' own account. |

## What this repository adopts, and what it refuses

Verdicts are for about 40 PRs a day, a 6–8 minute CI, and a regenerate step
measured at 5–13 minutes per run. The numbering follows §5 of the
requirements note.

| | technique | verdict | basis | reason at our scale |
|---|---|---|---|---|
| **T1** | **Eject a failing member and re-run the rest** | **adopt now** | SQ19 §2.2 (design argument) | Without it, one bad member costs every other member a full cycle (CI plus regen, ~15–20 min). The hand-back to the member's owner already exists in #1888. |
| **T2** | **Attribute the failure before bisecting** | **adopt now, simple form** | SQ19 §2.1 (measured: conflicts appear only in combination) | First use evidence we already have. A member whose own PR CI is red, or never ran, is the prime suspect. Only when every member is green alone is the failure a real conflict, and only then bisect (2–3 CI runs for 3–6 members). **"Green alone" is the owed-runs question, never a verdict read** — measured 2026-10-02 on #1889's head `7ab6119405`, where 9 runs were present with all 9 gating job NAMES matching, yet 3 suites had `completed` as `action_required` having executed nothing and a `conclusion == "failure"` filter returned zero. Counting the runs does not catch that; `check:head-has-run` (bean `3pqn`) asks which runs are *owed*, and #1894 makes it a DMN gate (`Rule_HeadNotGreen`) rather than advice. |
| **T3** | **Cheap conflict test** | **adopt now, cheap form** | SQ19 §5.2 (designed rule) | Two members are independent when their **authored** paths do not overlap. **Generated paths are excluded**, or every pair predicts as conflicting and the test says nothing. The learned predictor (SQ19 §7.2) is refused: it needs months of outcomes we will not have. **Refined 2026-10-02 after measuring it:** this row read "and neither touches a shared declaration", which makes *not independent* one verdict covering three different remedies. `merge:overlap` over all 36 open PRs (459 pairs) found **#1907 × #1909 `independent: false` with `authored_overlap = 0`**, colliding on `package.json` and generated regions only. A shared declaration is a **subset** of an authored path, not a sibling — `classify("package.json").strategy` is `refuse` *and* `isSharedDeclaration` is true — so the queue carries a four-way `overlapKind` (`none` / `generated-only` / `shared-declaration` / `authored`) and **only `authored` needs a train**: `generated-only` needs a regeneration and `shared-declaration` needs ordering. Landed on #1894. |
| **T7** | **Retry a failed gate once, narrowly** | **adopt now, narrow** | TAP17 Table II (measured flake rate, at Google) | Only for gates on a declared flaky list (browser e2e). Our other gates are deterministic, so retrying them wastes a CI cycle and hides nothing. |
| T4 | Train size and member order from risk | adopt later | SQ19 eq. 3; SQ25 §IV; TAP17 §IV | Needs a few weeks of recorded train runs before a size cap is more than a guess. |
| T5 | Run only the gates a change affects | adopt later, low priority | TAP17 §IV-A (measured, 42–55% saving) | The saving is minutes against a 6–8 minute CI, and skipping a gate is a correctness risk. |
| **T6** | **Speculative parallel builds of train prefixes** | **not applicable now** | SQ19 §4; SQ25 §V–VIII | Needs parallel CI capacity and a merge queue, which this repository does not have (bean `1hjm`). Its value appears only with long builds and deep queues. Revisit if trains queue up or CI exceeds ~30 minutes. |

**Refused outright:** SQ19's always-green mainline as **policy**. It is not
refused as a method. The owner chose fix-forward on 2026-09-24 (bean `391j`),
and this node does not overturn that ruling. A train makes always-green
achievable for the merges that go through it, and whether to require it is
open question 1 in the requirements note.

## Where it plugs in

- **`merge-train.bpmn`**, with the queue schema and the reprioritisation DMN:
  draft PR #1894 (epic `hfag`), at
  `cat-harness/processes/sdlc/merge-train.bpmn` on that branch. T1 is a gateway
  after CI (*red → attribute → eject → hand back → re-run*). T2 is a call
  activity *Attribute failure* with an *evidence* branch and a *bisect* branch.
  T7 is a *retry flaky gate* task before it. T3's inputs (`authored_paths`,
  `touches_shared`) are queue fields computed from GitHub.
- **The hand-back to the member's owner** (T1's last step): draft PR #1888, bean `zacz`.
- **The merge tools** (`merge:train`, `merge:overlap`, `merge:leftover`):
  **landed** — PR #1895, on `main` at `49c3ff2fe7a`. `merge:overlap` is where
  T3's test is computed, and it is the tool that measured T3's refinement above.
- **The gates a train must pass**: epic `nok9`. Review gates belong to each
  change, build gates to the combination, which is consistent with SQ19 §3.1, p. 4.
- **Generated-file families with no declared merge pattern**: bean `8rff`. T3
  depends on those paths being classified as generated, not authored.

## Related

- [`merge-conflict-patterns`](../skills/sdlc/sdlc-core/merge-conflict-patterns.md): resolving a conflict, as opposed to predicting one.
- [`adopt-methodology-from-source`](../skills/library/library-core/adopt-methodology-from-source.md): the process this node came from.
- [`methodology-adoption`](../skills/process/process-core/methodology-adoption.md): choosing among the methodologies here.
