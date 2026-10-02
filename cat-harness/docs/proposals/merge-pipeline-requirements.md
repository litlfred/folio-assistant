---
title: "Merge-pipeline requirements from three merge-queue papers"
kind: proposal
summary: >-
  Requirements for the merge-train pipeline, read out of Uber's SubmitQueue
  (EuroSys 2019), its 2025 follow-up, and Google's TAP continuous-testing
  study. Each requirement names its source page, whether we meet it, and what
  it implies; then the techniques ranked by value per effort for this repo.
---

# Merge-pipeline requirements from three merge-queue papers
{: .no_toc }

The owner, 2026-10-02: *"ingest to library for methodologies and as source of
requirements for merge pipeline"*, then *"make sure to use methodologies...
ingest them and analyze. what is useful?"*

This note reads three papers as a **source of requirements** for the merge
train. It is not an adoption of their methods. Adoption is the owner's call
(step 8 of `methodology-from-source.bpmn`), and §5 is the input to it.

1. TOC
{:toc}

## 0. The sources, and what they can and cannot tell us

| key | source | library entry | what kind of evidence |
|---|---|---|---|
| **SQ19** | Ananthanarayanan et al., *Keeping Master Green at Scale*, EuroSys '19, ACM, doi:[10.1145/3302424.3303970](https://doi.org/10.1145/3302424.3303970) | `cat-harness/library/ananthanarayanan-2019-keeping-master-green` | system design + production evaluation at Uber (iOS/Android monorepos, 100–500 changes/hour simulated) |
| **SQ25** | Juloori, Lin, Williams, Shin, Mahajan, *CI at Scale: Lean, Green, and Fast*, arXiv:[2501.03440v2](https://arxiv.org/abs/2501.03440v2) (19 May 2025) | `cat-harness/library/arxiv-2501.03440v2` | enhancement to SQ19; 21-week before/after on Uber's Go, iOS and Android monorepos |
| **TAP17** | Memon, Gao, Nguyen, Dhanda, Nickell, Siemborski, Micco, *Taming Google-Scale Continuous Testing* | `cat-harness/library/memon-2017-taming-google-scale-testing` | empirical study of one month of Google TAP post-submit data (500K+ changelists, Feb–Mar 2016) |

All three are **recorded, not held**: the library entries carry identity,
sha256 and outline, and no text, because none of the three states a licence
that permits posting a copy (see each entry's `licence.json`). Section and page
citations below are to the PDFs whose sha256 the entries record.

**TAP17's venue is not printed on the PDF.** SQ19 cites it (reference [33],
p. 14) as *ICSE-SEIP 2017*, pp. 233–242. That citation is recorded here and not
in the library entry, because the entry holds only what the document states.

**Scale warning, once, for everything below.** Uber's monorepos take
"hundreds of changes an hour" (SQ19 §4.1, p. 5) with builds up to two hours
(SQ19 Fig. 9, p. 10); Google's TAP runs 800K builds and 150 million test runs a
day (TAP17 §I, p. 1). This repository merges about **40 PRs a day** with a
**6–8 minute** CI and a regenerate step measured at 5–13 minutes per run
(`merge-base.ts`, 2026-10-02). Where a requirement depends on scale it is
flagged **[scale]** and its transfer is argued, not assumed.

## 1. Our pipeline, as this note assumes it

- PRs are batched into a **train**. Each member is merged with
  `cat-harness/scripts/merge-base.ts --no-regen`, then **one** `bun run regen`
  runs over the result.
- CI (6–8 min) runs on the train; the merge is **pinned to the head SHA** that
  CI saw.
- A member whose conflicts no declared pattern resolves is **refused** and
  handed back to its owning session (draft PR #1888, bean `zacz`).
- Merge-gate epic `nok9` (PR #1887) proposes gates: adversarial agent review,
  no RED FLAG, Lean compiles, SUSHI compiles, KG JSON-LD/schema renders.
- Planned: `merge-train.bpmn`, a **merge-steward** role, train runs recorded as
  workflow instances, and the queue **computed from GitHub**, never stored.
- Context: GitHub's merge queue is not available on this repository (bean
  `1hjm`), and on 2026-09-24 the owner chose **fix forward** over an
  up-to-date requirement after a merge-skew red main (bean `391j`).

## 2. Measured, recommended, or claimed — kept apart

| | measured (the paper reports a number from its own data) | recommended or designed (the paper says do this) | claimed without measurement |
|---|---|---|---|
| SQ19 | P(real conflict) 5% with 2 concurrent potentially-conflicting changes, 40% with 16 (Fig. 1, §2.1, p. 3). P(breakage) 10–20% for changes 1–10 h stale (Fig. 2, p. 3). iOS mainline green 52% of one week before SubmitQueue (§8.5, p. 12). Only 7.9% of iOS changes alter the build graph (§5.2, p. 7). Single-Queue P50/P95/P99 turnaround 80×/129×/132× Oracle at 500 changes/h (§8.2, p. 10). SubmitQueue within 1.2× of Oracle at 500 changes/h with 500 workers (§8.2, p. 10). Logistic model accuracy 97% (§7.2, p. 9). Survey: 93% of 40 respondents say always-green helps productivity (§8.6, p. 13). | Serialise changes, not patches: land a change only if all build steps pass on HEAD plus it (§1, pp. 1–2; §3.2, p. 4). Speculation tree valued by P(build needed) (§4.2, pp. 5–6). Conflict analysis by target hashes (§5, pp. 6–8). Abort builds no longer needed (§6, p. 8). | "Our mainlines have remained green at all times" since launch (§8.5, p. 12): a statement, no measurement shown. |
| SQ25 | 40–65% of builds aborted prematurely (§I, p. 1). BLRD trigger rate 0–45% (Fig. 4, §IV, p. 4). Conflict rates 30–72% monthly (Fig. 2, p. 4). After rollout: builds-to-changes ratio down 45.45% / 47.86% / 64.02% (Go/iOS/Android), CPU hours down 44.70% / 34.86% / 52.23%, P95 wait down 44.67% / 33.32% / 31.66% (§X, pp. 8–10). Build-time model MAPE 3% / 6% / 3.5% (§IX-B, p. 8). | Let a small change bypass a large conflicting one when both orders give the same result (BLRD, §IV, p. 4). Predict build time; prioritise builds by P(needed) including bypass (§V–VII, pp. 5–7). A speculation threshold (§VIII, p. 7). Simulate before deploying a strategy (§IX-C, p. 8). | That the techniques are "language-agnostic and platform-independent" (§X, p. 8). |
| TAP17 | Only 1.23% of test targets ever found a breakage or fix (§III, Table II, p. 5). Of 115,160 targets that both passed and failed, 46,694 were flakes (Table II). Running only targets within MinDist ≤ 10 / ≤ 6 would have saved 42% / 55% of resources and missed no breakage **in this dataset** (§IV-A, Fig. 12, p. 7). Files modified more often appear in breaking changelists more often (§IV-B, Fig. 13, p. 7). Files touched by 3+ authors break more (§IV-E, Fig. 15, pp. 8–9). Delays of up to 9 hours (§I, p. 1). | Schedule rarely-failing tests less often; schedule risky changes sooner; give developers risk alerts (§IV, pp. 5–9). | That the correlations "likely exist in other companies" (§VI, p. 10) — from "verbal discussions", by the authors' own account. The authors also say MinDist = 10 "may not generalize" (§VI). |

## 3. Requirements

Status: **meets**, **partly**, **not**, or **n/a** (does not apply here).

| id | requirement | source | status | implication |
|---|---|---|---|---|
| R1 | What lands on `main` is exactly what CI tested: the merge result, at the SHA tested. | SQ19 §1 pp. 1–2 ("totally ordering changes is different from totally ordering code patches"); §3.2 p. 4 | **partly** — the train merge is pinned to the tested head SHA, but nothing stops another PR merging to `main` between test and land, since there is no merge queue (`1hjm`) | The steward must check `main` has not moved since CI started (compare the train's base SHA to `main` at merge time) and re-run if it has. |
| R2 | A change that passes alone can still break `main` in combination; a real conflict is only visible post-combination. | SQ19 §2.1 pp. 2–3, Fig. 1 (measured) | **meets** for the train (CI runs on the combination); **not** for PRs merged outside a train | Route every merge through the train, or accept fix-forward for the rest (the `391j` ruling). Record which. |
| R3 | Batches fail more often as they grow; a failed batch must be split and retried without the faulty change, not rejected whole. | SQ19 §2.2 p. 3 (Chromium Commit Queue critique; design argument, not measured here) | **partly** — a *conflicting* member is refused before CI (#1888); a member that makes the *combined CI* red has no ejection path | Add an eject-and-retry path for a red train (§5, T1, T2). |
| R4 | A refused change returns to its author with the reason. | SQ19 §3.2 p. 4 ("lands the change, or aborts it along with a reason"); SQ25 §III p. 3 | **partly** — #1888 hands back conflicts; red-CI refusals have no hand-back yet | The hand-back in #1888 must cover CI-red, gate-red (nok9) and conflict, each with its evidence. |
| R5 | Staler changes break `main` more often; test against current HEAD. | SQ19 Fig. 2 p. 3 (measured: 10–20% at 1–10 h staleness) | **meets** — each member is merged onto the current base by `merge-base.ts` | Keep it: never land a member on a cached old base. |
| R6 | Independent changes may land in parallel; only conflicting ones need ordering. Decide independence from the *build graph*, not from file names alone. | SQ19 §5.2 pp. 7–8 (target-hash rule, eq. 6) | **not** — trains are composed without a conflict prediction | §5 T3: a cheap independence test on authored paths and declared graph kinds. |
| R7 | Generated targets are where every pair of changes "conflicts". | Inference from SQ19 §5.2 p. 7: a change that alters the build graph (7.9% at Uber) needs the full test | **meets** — `merge-conflict-patterns.ts` takes the base's side of generated paths and one `regen` rebuilds them | The conflict test in R6 must **exclude** generated paths, or every pair predicts as conflicting and the test says nothing. |
| R8 | The planner aborts work that is no longer needed. | SQ19 §6 p. 8; SQ25 §III-D p. 3 | **n/a** now — one train at a time, no speculative builds | Revisit only if trains run in parallel. |
| R9 | Order should not make a small change wait behind a slow one when the outcome does not depend on the order. | SQ25 §IV p. 4 (BLRD); SQ19 §10 p. 14 (listed as a limitation) | **not** — members are taken in queue order | A DMN rule that puts high-risk or regen-heavy members last or in their own train (§5 T4). |
| R10 | Track turnaround and per-change waiting time as first-class metrics; evaluate a strategy before rolling it out. | SQ19 §8 pp. 9–13; SQ25 §IX-C p. 8 (simulation), §X pp. 8–10 | **not** — no train metrics are recorded | Each train-run workflow instance records enqueue, start, CI, regen and land times per member, so a replay can evaluate a rule change. |
| R11 | Distinguish a flaky failure from a real one before blaming a change. | TAP17 §I p. 2, Table II p. 5 (measured: 46,694 of 115,160 mixed-outcome targets were flakes) | **not** — a red gate is taken at face value | Retry a failed gate once before ejecting anyone; record both outcomes. **[scale]** Our gates are mostly deterministic, so this matters mainly for browser e2e jobs. |
| R12 | The mainline is always green: every commit point passes all build steps. | SQ19 abstract, §1 | **not as policy** — the owner chose fix-forward (`391j`) | Not a requirement until the owner revisits `391j`. The train makes it achievable for trained merges. |
| R13 | Every build step runs for every change; test selection is future work. | SQ19 §9 p. 14 ("Our build controller currently does not leverage any of these techniques") | **meets** — CI runs the full gate set | Keep. Selection (T5) is an optimisation, not a requirement. |
| R14 | Risk signals for a change (churn of the files it touches, number of recent authors) predict breakage. | TAP17 §IV-B, §IV-E pp. 7–9 (correlations, measured); SQ19 §7.2 p. 9 (features) | **not** | Usable as DMN inputs for ordering (§5 T4). **[scale]** Correlations at Google scale; untested here. |
| R15 | Speculative execution of a predicted outcome, valued by P(build needed). | SQ19 §4 pp. 4–6; SQ25 §V–VIII pp. 5–7 | **n/a** now | Needs parallel CI capacity and a merge queue we do not have. **[scale]** |
| R16 | Gate reviews per change, build steps on the combination. | nok9 proposal §composition; consistent with SQ19 §3.1 p. 4 (review before submit, build steps at land) | **planned** (PR #1887) | Keep: adversarial review keyed by member head SHA; compile gates on the train result. |

## 4. What does not transfer, and why

- **Speculation trees (SQ19 §4, SQ25 §V).** A tree of 2ⁿ−1 builds for n
  pending changes pays off when a build takes 30 minutes to 2 hours and
  hundreds of changes are pending. With 40 PRs a day (about 2–3 an hour in a
  working day) and a 6–8 minute CI, the queue rarely holds more than a train's
  worth, and there is no merge queue to run speculative builds against.
- **Learned success and build-time models (SQ19 §7.2, SQ25 §IX-B).** Trained on
  months of history with around 100 features. 40 PRs a day gives a few hundred
  outcomes a month, and the PRs are mostly agent-authored, so author features
  (SQ19 §7.2 "Developer", TAP17 §IV-D) do not mean what they meant at Uber.
- **MinDist test selection (TAP17 §IV-A).** The 42–55% saving is real in the
  dataset; its own authors say the threshold may not generalise (§VI). Our CI
  is 6–8 minutes, so the ceiling on the saving is a few minutes per run.

## 5. What is useful for us

Ranked by value per effort, for about 40 PRs a day, 6–8 minute CI and a
5–13 minute regenerate step. "Where it plugs in" names the place in the
planned design: the **queue schema** (fields computed from GitHub per member),
the **reprioritisation DMN** (inputs and rules), or **`merge-train.bpmn`**
(activities and gateways).

| rank | technique | verdict | why | where it plugs in |
|---|---|---|---|---|
| **T1** | **Eject a failing member and re-run the rest** | **adopt now** | Without it one bad member costs the whole train a full cycle (CI + regen, ~15–20 min) and every other member waits. SQ19 §2.2 (p. 3) names exactly this as the failure of batch-reject systems. Effort is small: the hand-back exists in #1888. | `merge-train.bpmn`: a gateway after CI, *red → identify culprit → eject → hand back (#1888) → re-run train without it*. Schema: `member.ejected_reason`, `member.evidence_url`. |
| **T2** | **Find the culprit in a failed train (bisect)** | **adopt now, simple form** | First use evidence we already have: a member whose own PR CI is red, or whose PR CI never ran (GitHub skips `pull_request` CI while a PR conflicts, `u7be`), is the prime suspect. If every member is green alone, the failure is a **real conflict** in SQ19's sense (§2.1, pp. 2–3), and only then bisect. With 3–6 members a bisect is 2–3 CI runs (~15–25 min). | DMN inputs: `member.own_ci` (`green`, `red`, `none`), `member.head_sha_matches_ci`. `merge-train.bpmn`: a call activity *Attribute failure* with two branches, *evidence* then *bisect*. |
| **T3** | **Predict which PRs conflict** | **adopt now, cheap form; learned form not applicable** | Use SQ19 §5.2's rule at our granularity: two members are independent when their **authored** paths do not overlap and neither touches a shared declaration (a schema, a generator, a `<instance>.json`, a BPMN or DMN file). Generated paths are excluded (R7). Effort: a path classifier we already have (`merge-conflict-patterns.ts`). The learned predictor (SQ19 §7.2) needs data we will not have. | Schema: `member.authored_paths`, `member.touches_shared` (computed from the PR's file list). DMN: compose trains from mutually independent members first, and put a conflicting pair in separate trains or in a fixed order. |
| **T4** | **Train size and member order from risk** | **adopt later** (after T1–T3 produce data) | P(train green) is roughly the product of the members' P(green) (SQ19 eq. 3, p. 6), so one risky member drags a large train. Cap the size, and put high-risk members (red history, touches shared declarations, regen-heavy, large diff) last or alone; SQ25's BLRD (§IV, p. 4) is the same idea at scale. Needs a few weeks of train-run records (R10) to set the cap. | DMN: inputs `member.risk` (from `touches_shared`, `own_ci`, diff size, refusal history) and `recent_train_failure_rate`; outputs `train_size_cap`, `member_order`. Schema: the inputs as computed fields. |
| **T5** | **Run only the gates a change affects** | **adopt later, low priority** | TAP17's saving (42–55%, §IV-A) is against hours-long test loads. Ours is 6–8 minutes, so the gain is minutes, and skipping a gate is a correctness risk that `391j`-style skew already showed. Worth it only for the slow browser jobs. | `gates.ts` (a per-gate `covers` mapping already exists through `@covers`); not the train. |
| **T6** | **Speculative parallel builds of train prefixes** | **not applicable now** | Needs parallel CI capacity and a merge queue (`1hjm`); value only appears with long builds and deep queues. **[scale]** | None now. Revisit if trains queue up or CI exceeds ~30 min. |
| **T7** | **Retry a failed gate once before ejecting** | **adopt now, narrow** | Cheap insurance against TAP17's flake rate (R11), but only for gates known to flake (browser e2e). Retrying deterministic gates wastes a CI cycle. | `merge-train.bpmn`: before *Attribute failure*, a *retry flaky gate* task for gates on a declared flaky list. |

**Recommended order:** T1 and T2 together, then T3. They need nothing new
except the queue fields above, and each removes a whole-train re-run. T4 waits
for R10's records, since setting a cap without data is guessing.

## 6. Open questions for the owner

1. **R1 / R12.** Should the steward refuse to merge when `main` moved after the
   train's CI started (re-run instead)? That is the always-green guarantee for
   trained merges. It costs one extra CI cycle whenever someone merges outside
   the train.
2. **Licences.** All three papers are recorded, not held. If arXiv's page for
   2501.03440v2 states a CC licence, that entry can be re-ingested with its
   text. Nobody in this container could reach arxiv.org.

## Related

- [`merge-conflict-patterns`](../../skills/sdlc/sdlc-core/merge-conflict-patterns.md)
- [`adopt-methodology-from-source`](../../skills/library/library-core/adopt-methodology-from-source.md)
- PR #1887 (merge-gate epic `nok9`), PR #1888 (refused-member hand-back, bean `zacz`)
- Beans `1hjm` (no merge queue on this repo), `391j` (merge skew, fix-forward ruling)
