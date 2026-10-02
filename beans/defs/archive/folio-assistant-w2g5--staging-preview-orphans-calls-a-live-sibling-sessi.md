---
# folio-assistant-w2g5
title: staging-preview-orphans calls a live sibling session's branch an orphan, and there is no way to act on a true one
status: completed
type: task
priority: normal
created_at: 2026-09-19T10:48:19Z
updated_at: 2026-09-19T11:53:10Z
parent: folio-assistant-1xhc
---

Found 2026-09-19 while acting on `staging-preview-orphans`' own findings, the
first time anybody tried to. Two defects, and the second is why the first is
not merely cosmetic.

## 1. The false positive the check must never produce

`bun run health` on `main` at `ef2988728`, 2026-09-19T10:45Z, named five
orphans. Four are genuinely dead — their branches are ancestors of `main`:

| preview | size | branch merged into `main`? |
|---|---|---|
| `STAGING/claude-d2kp-live-verdicts` | 36.8 MB | yes |
| `STAGING/claude-ecstatic-goldberg-eroyaz` | 37.5 MB | yes |
| `STAGING/claude-health-checks` | 37.1 MB | yes |
| `STAGING/claude-placement-skill` | 37.1 MB | yes |

The fifth is **not**:

    STAGING/claude-brave-hypatia-r820sf   37.2 MB   NOT merged

`git log origin/main..origin/claude/brave-hypatia-r820sf` shows one commit,
`cfa8ec68b`, *"1lfx: publication.host is its own declared axis"* — 343
insertions across `harness.json`, `schemas/cat-harness.ts`, a new
`scripts/tests/publication-host.test.ts`, `docs/proposals/deployment-topologies.md`
and a bean. It is dated **2026-09-19 10:43:03Z**, and the check ran at
10:45Z. **Two minutes old.**

That branch belongs to a *different session* (`session_01R7nwLkfzko7JAe7FVihJYE`)
which has used it for five successive PRs — #368, #375, #380, #384, #396 — each
merged and closed before the next was opened. `list_pull_requests` for
`head:claude/brave-hypatia-r820sf` returns all five, all `closed`; the most
recent closed at 10:37:21Z, six minutes before the commit above.

So the check is **literally correct and practically wrong**. "No open PR" is
true of that branch for the whole gap between merging one PR and opening the
next — and a session that reuses one branch across a run of PRs spends much of
its life in that gap. The finding invites a person to remove a live
collaborator's review artefact, which is precisely the one false positive
`AGENTS.md` and the check's own header say it must never produce: *"if the
open-PR listing 403s, the orphan check goes `unknown` rather than calling every
preview an orphan, which is the one false positive it must never produce."* The
403 case was guarded. This one was not, because "no open PR" was taken as a
synonym for "abandoned", and it is not.

**Proposed fix, not yet implemented.** The question the check means to ask is
"is anybody still using this?", and open-PR is one proxy among several. Make it
a conjunction of cheap, independent signals, any one of which spares the
preview:

- an **open PR** whose head is the branch (today's test);
- the branch **exists on the remote and is not an ancestor of the default
  branch** — i.e. it carries unmerged work;
- the branch's **head commit is recent** (the two-minute case above would have
  been caught by this alone).

A preview is an orphan only when every signal says so. And "could not evaluate
a signal" must go to `unknown` for that preview, not to orphan — the same
three-state discipline the rest of the sweep already keeps.

## 2. There is no way to act on a TRUE orphan

The finding's `action` names the `staging:cleanup` label, and that label is
real: `feature-staging.yml`'s `cleanup` job checks for it. But the job is
gated `if: github.event.action == 'closed'` on a `pull_request_target` event.

**Those PRs are already closed.** The `closed` event fired, the job ran, the
label was absent, cleanup was skipped — and labelling the PR afterwards fires
nothing, because there is no second `closed` event to catch. The documented
remedy is unreachable for every orphan the check can find, since being findable
as an orphan *requires* the PR to be closed already.

The three ways out, with what each costs:

1. **Give `cleanup` a `workflow_dispatch` path** taking a slug and an explicit
   confirmation input. Repeatable, auditable, runs as the workflow rather than
   as a person with a push token, and leaves the same commit trail the
   automatic path leaves. Cost: a workflow change, and a dispatch input is a
   deletion trigger that must be guarded as carefully as the label is.
2. **Push a `gh-pages` commit by hand** removing the directories. Cost: no
   audit trail beyond the commit, and it is exactly the shape of unilateral
   removal `deletion-requires-confirmation` exists to stop.
3. **Leave it.** Cost: the size check fires forever on artefacts nobody can
   remove, which is how a check gets switched off.

Recommendation: **1**.

## Done when

`staging-preview-orphans` does not name a branch carrying unmerged work or
recent commits, there is a test that fires on exactly the
`claude-brave-hypatia-r820sf` shape, and a true orphan can be removed by a
mechanism a person can actually invoke.

_2026-09-19T11:20:55Z_ — Claimed on branch `claude/w2g5-orphan-liveness` (session_01SFCwxF2nePwDpnQrX66fZE).

## Opening brief

**What and why.** Both defects in this bean: the orphan check names live branches, and its documented remedy cannot be invoked. Worth doing because the two compound — a false positive whose only advertised remedy is unreachable trains a reader to ignore the check, and acting on it by hand is the unilateral removal `deletion-requires-confirmation` exists to stop.

**What I already know, measured myself in this worktree at 2026-09-19T11:19Z** (`git fetch` + `merge-base --is-ancestor` per branch, against `origin/main`):

| branch | merged into main | tip (committer date) | age at measurement |
|---|---|---|---|
| `claude/d2kp-live-verdicts` | yes | 09:58:56Z | 80 min |
| `claude/ecstatic-goldberg-eroyaz` | yes | 10:19:49Z | 59 min |
| `claude/placement-skill` | yes | 10:23:07Z | 56 min |
| `claude/health-checks` | yes | 10:36:41Z | 42 min |
| `claude/brave-hypatia-r820sf` | **no** | 11:16:31Z | 2.6 min |

That measurement changes the design. **The bean's three signals as an ungated disjunction do not work on this data**: all four genuinely dead previews have tips from the last 80 minutes, so any recency horizon above ~40 minutes spares them too and the check reports nothing. Recency is still needed — it is the only signal covering the inter-PR gap, where a merge commit makes the branch an ancestor of `main` again and signal 2 goes quiet (brave-hypatia: PR #396 merged 10:37:21Z, next commit 10:43:03Z, gap 5m42s). So the horizon has to be SHORT, and its basis has to say so.

**How.** Liveness becomes a pure, exported function over per-preview evidence, with a new `branches` probe (remote refs whose slug matches a preview, plus ancestry and tip date). Any live signal spares; a signal that cannot be evaluated makes the check `unknown`, following `probes.ts`' own precedent that one unreadable preview makes the total unknown rather than smaller. The same function backs a `workflow_dispatch` cleanup preflight, so deletion re-checks liveness at deletion time rather than trusting a report that may be a day old.

**What would falsify it.** If the dead previews' branches were deleted from the remote after merge, the branch signals would be unevaluable for exactly the previews the check must still report. They are not: `git ls-remote --heads` lists 226 branches including all four. If this repo squash-merged, "ancestor of main" would never be true and every preview would be spared forever — it merge-commits (`Merge pull request #400 ...`), so it holds here, and I will say it is an assumption.

**Not doing.** Not deleting any preview. Not dispatching the workflow. Not changing the size check.

_2026-09-19T11:42:18Z_ — ## Outcome — PR #407, branch `claude/w2g5-orphan-liveness`

**Both defects addressed. Nothing was removed; no preview, no branch, no bean.**

### 1. Liveness is a disjunction now

`previewLiveness` in `test/health/checks.ts`, pure and exported. Three signals, any one spares:

| signal | test | threshold |
|---|---|---|
| `open-pr` | an open PR's head slugifies to the preview | — |
| `unmerged-branch` | a remote branch slugifies to the preview and its tip is not an ancestor of the default branch | — |
| `recent-commit` | that branch's tip is newer than `RECENT_COMMIT_MINUTES` | **30 minutes** |

**The bean's three signals as an ungated disjunction do not work**, and this is the one place the plan changed. Measured at 11:19Z on 2026-09-19, all four genuinely dead previews' branches had tips 42–80 minutes old, so a recency horizon above ~40 minutes spares every one of them and the check goes silent — the opposite failure, and no better. Recency is still necessary, because it is the only signal covering the inter-PR gap: a merge commit puts the branch back inside `main`, so `unmerged-branch` goes quiet exactly when `open-pr` has. 30 min ≈ five times the measured 5m42s gap between #396 merging and that branch's next commit. The basis says all of this, and says it is calibrated rather than standard.

Unevaluable → `unknown`, per preview, and one undetermined preview takes the WHOLE check to `unknown` while still naming the orphans it had determined. That follows `probes.ts` ("one unreadable preview makes the TOTAL unknown, not smaller") and `healthVerdict` (`unknown` outranks `findings`).

New `probeBranches`: one `ls-remote`, candidates only, no fetch for a tip already held. It refuses to read "not an ancestor" out of a truncated history — asked exactly, by intersecting the parentless commits reachable from the default branch with `.git/shallow`, bounded by the graft boundary's date so a tip that postdates it is still trusted. `--is-shallow-repository` is unusable here because `probeStaging` fetches `gh-pages` with `--depth=1` first and would blind every sweep. This container's clone IS shallow (780 commits, grafted root), which is how that was found.

### 2. A remedy that can be invoked

`cleanup-dispatch` in `feature-staging.yml`: `workflow_dispatch` with `cleanup_slug` + `cleanup_confirm`. The confirmation must REPEAT the slug, so it names the artefact it confirms and cannot be carried over from an earlier run. Shape checked against exactly what the workflow's sed pipeline can produce, `.`/`..` refused by name, every input bound to `env:` and never interpolated, `rm -rf --`. The `stage` job is excluded on a cleanup dispatch, and the concurrency group includes the slug.

**Decision on re-checking liveness at dispatch time: yes, and it fails closed.** `scripts/staging-cleanup-preflight.ts` calls the same `previewLiveness` — not a second implementation — and exits 0 remove / 1 live / 2 could-not-tell. The sweep is daily; between report and dispatch a branch can come back, which is the very behaviour this bean documents. The sweep proposes, the dispatch acts, so the acting end has to be the stricter one. Note the inversion: `unknown` means *do not accuse* in the check and *do not delete* here — both err away from removal.

### Verified positively

Per signal, by naming: each fires alone (`checks.test.ts`); the exact brave-hypatia shape is NOT reported and the old signal is shown silent; a merged/PR-less/11-day-idle preview still IS; unevaluable → `unknown` with the determined orphan still named; `probeBranches` against a real remote with a real merge, including both shallow cases. `feature-staging.yml` parsed and its guards asserted in `scripts/tests/staging-cleanup.test.ts` — parsed, never run, because running it deletes something.

Live run, 2026-09-19T12:5xZ: 12 previews, **6 orphans, all merged into `main`**; `claude-brave-hypatia-r820sf` and this branch's own preview dropped out. Preflight run bare against live slugs: brave-hypatia exit 1 (live), `claude-health-checks` exit 0, `../../etc` exit 2.

### Skills corrected

`staging-review` told a reader to re-run the cleanup workflow or hand-delete from `gh-pages`; both were wrong for a closed PR. `deletion-requires-confirmation` gains the sequel to `plj1`: a confirmation policy needs a removal that can be confirmed, or the confirmation has nowhere to go. `crdm-requirements-workflow` step 9 likewise.

### Not done / could not verify

- The workflow was never dispatched, so the removal path is verified by parsing only. The four authorised slugs are the owner's to run.
- `unmerged-branch` assumes merge-commit or rebase merges. Under squash-merge a branch tip is never an ancestor of the default branch, so every preview would be spared forever — safe direction, useless check. Stated in the code; this repo merge-commits.
- `bun run health` exits 1, as it did before this change, on the pre-existing 100 MB `staging-preview-size` finding.

_2026-09-19T11:53:10Z_ — Closing: fixed in PR #407, merge commit 98144b5a8 on main, and then exercised against live data with a result better than any fixture could give.

BOTH DEFECTS FIXED. (1) staging-preview-orphans is now a disjunction of independent liveness signals — an open PR, OR a branch carrying unmerged work, OR a recent head commit — and a preview is an orphan only when every signal says so; a signal that cannot be evaluated sends that preview to unknown, never to orphan. (2) feature-staging.yml gains a cleanup-dispatch job, so a true orphan is removable by a mechanism a person can actually invoke; the staging:cleanup label could never reach one, because being findable as an orphan requires the PR to be closed already and that event has long since fired.

WHERE THE PLAN CHANGED, and the implementing agent was right to change it. This bean proposed the three signals as an UNGATED disjunction. Measured against the real branches, that does not work: every genuinely dead preview's branch had been touched within 80 minutes, so any recency horizon above ~40 minutes spares all of them and the check goes silent — the opposite failure to the one this bean is about, and no better. Recency could not be dropped either, being the only signal that covers the inter-PR gap. So the horizon is 30 MINUTES, calibrated on the measured 5m42s between PR #396 merging and the next commit on that branch, and its basis says NO EXTERNAL STANDARD in those words rather than implying a rigour it does not have.

VERIFIED BY ME, not taken on report, before anything was removed: the preflight run bare against the live repo gave claude-brave-hypatia-r820sf exit 1 (LIVE, refuses), the four authorised slugs exit 0, and '../../etc' exit 2 (refuses). bun test test/health/checks.test.ts: 44 pass, 0 fail.

THE FINDING WORTH KEEPING, and it is better than the bean it came from. Of the four slugs the owner authorised, three were removed and ONE REFUSED ITSELF AT DISPATCH TIME. Run 35441195403, 11:50:44Z:

  REFUSING to remove STAGING/claude-ecstatic-goldberg-eroyaz: it is still in use.
    open-pr + unmerged-branch + recent-commit — an open pull request has it as its head;
    `claude/ecstatic-goldberg-eroyaz` is NOT in `main`, tip 1 min old

ALL THREE SIGNALS FIRED. When I measured that branch at ~11:19 it was merged into main and 59 minutes idle — dead by every test available. By 11:50 the session owning it had reused the branch and opened a new pull request on it. That is this bean's own pattern, happening live, on a DIFFERENT branch, inside the half hour it took to build the fix.

Two consequences. The old check would have deleted it, and so would a hand-pushed gh-pages commit — a live collaborator's review artefact, removed minutes after they opened a PR against it, on a slug authorised in good faith from a measurement that was true when taken. And this is precisely why the dispatch re-checks liveness rather than trusting the sweep: a daily sweep PROPOSES and a dispatch ACTS, and the gap between them is where a branch comes back. That design choice earned its place within minutes of shipping.

STATE AFTER: 12 previews to 9. Removed: claude-d2kp-live-verdicts, claude-health-checks, claude-placement-skill. Refused and left alone: claude-ecstatic-goldberg-eroyaz. The sweep now reports 2 orphans — claude-4kiw-memory-pointer and claude-consolidate-test-dir — each carrying its evidence ('already in main, tip 56 min old'), and neither is authorised for removal. claude-brave-hypatia-r820sf no longer appears at all.

NOT VERIFIED, carried forward from the PR: unmerged-branch assumes merge-commit or rebase merges — under squash-merge a branch tip is never an ancestor of the default branch, so every preview would be spared forever, which is the safe direction but a useless check. This repo merge-commits. Stated in the code.
