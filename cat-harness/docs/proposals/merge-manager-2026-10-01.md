---
title: "Merge Manager"
kind: proposal
issue: 1800
bean: folio-assistant-vola
summary: >-
  Who merges green pull requests when main moves faster than any one PR can keep up? A Merge Manager role, its SOP, five tooling options compared (merge queue, an organisation bot, a dedicated session on the personal account, a scheduled Action, hybrids), the skills and tools to add, and six questions for the owner. DRAFT, awaiting rulings.
---

# Merge Manager — who lands the green PRs
{: .no_toc }

**Status: DRAFT proposal, awaiting the owner's rulings on
[#1800](https://github.com/litlfred/folio-assistant/issues/1800).** Bean
`folio-assistant-vola`. Nothing here binds. The owner's interim policy (quoted
in §2) is what binds today.

**Placement.** Every artefact of this proposal is in the **cat-harness**
instance, on the owner's ruling of 2026-10-01: *"put in cat-harness"*. That
covers this page (cat-harness's proposals graph), the draft skill
`cat-harness/skills/sdlc/sdlc-core/merge-manager.md`, and the draft Tool
`pr-ready-for-merge` in `cat-harness/tools/merge.ts`. Nothing is placed in
folio-assistant-core, bootstrap or any other instance.

1. TOC
{:toc}

---

## The story in plain words

On 1 October 2026 the main branch changed about once an hour. Every time it
changed, every open pull request fell out of date. That was rarely because of
anything its author had written. It was because of files the build
**generates**: documentation pages, search indexes, the glossary, QA records
and READMEs. Each author's agent then had to:
1. bring main in;
2. regenerate those files;
3. run about 195 checks;
4. push;
5. wait.

Often main moved again before the wait was over. Ten agents doing that in
parallel is ten copies of one chore, and each copy can undo the last.

Two things went wrong in the process:
- One merge silently put two **submodule** pointers (the pinned versions of
  `bootstrap` and `bootstrap-tools`) back to old commits. Only an unrelated
  diagram check noticed.
- Some READMEs were generated before the files they summarise, so they were
  stale on arrival.

Separately, the safety check that watches an agent's actions refused an
agent's merge twice, even after the owner had answered "1". It went through
only on an explicit "merge 1762".

So the owner set an interim rule: **authors stop merging.** When a PR is green,
its author labels it and says which commit is ready, and one dedicated session
(named "Separation") brings main in, regenerates and merges, one PR at a time.
This proposal asks whether to keep that, how to write it down as a role and a
procedure, and what to run it on.

---

## 1. When a Merge Manager is needed, and when it is not

**Needed** when any of these holds:

| trigger | measured here |
|---|---|
| several green PRs waiting at once | 2026-10-01: every open PR repeatedly `dirty` |
| `main` moves faster than CI answers | ~hourly merges; a gates run is ~4 min once started, longer when queued (bean `mc8h`) |
| generated-file churn | bean `eqxp`: 24 of 25 conflicts over three cycles on #1633 were generated; 50 of the 60 most-churned paths are generated |
| the merge itself is blocked for the author | the auto-mode permission classifier refused "Merge Without Review" twice |
| PRs must land in an order | one PR unblocks another, or a red `main` must be fixed first |

**Not needed** when one PR is open, or when `main` has been quiet long enough
that a PR's CI run finishes on the base it will merge into. Then the ordinary
[`prepare-merge`](../reference/skill-instructions/prepare-merge.html) route,
with the owner's confirmation, is cheaper than a hand-over.

**What makes the role possible at all is a fact about the repository, not a
preference.** GitHub's merge queue is the structural answer, and it is
**unavailable here**: it needs an organisation-owned repository, and
`litlfred/folio-assistant` is owned by a personal account (bean `1hjm`, issue
#1711). On 2026-09-30 the owner also declined to turn on `allow_auto_merge` and
`allow_update_branch`. A Merge Manager is the queue the platform cannot offer
this repository.

---

## 2. The role

### The interim policy, verbatim

Owner, 2026-10-01:

> MERGE POLICY: Do NOT merge to main yourself. When your PR is green on every
> CI job, mark it "Ready for review", add the label `ready-to-merge`, and
> comment "ready: <head sha>". The Merge Steward session (named "Separation")
> merges it after bringing main in and regenerating. If it comments that your
> PR went red, fix and re-label. Push your own work freely.

### RACI

R = responsible (does it), A = accountable (answers for it), C = consulted,
I = informed.

| activity | PR author agent | Merge Manager | owner | CI | review bots |
|---|---|---|---|---|---|
| make the PR green | **R/A** | C | I | R (verdict) | C |
| hand over: label + `ready: <sha>` | **R/A** | I | I | | |
| order the queue | | **R** | **A** (may override) | | |
| bring main in, regenerate, push | | **R** | A | R (verdict) | |
| merge to `main` | | **R** | **A** | | |
| bounce back on red | I | **R** | I | | |
| fix the PR's own defect | **R/A** | C | | | |
| fix a red `main` after a merge | C | **R** (fix-forward PR) | A | | |

**May:** merge `main` into a PR branch; push regenerated artefacts and
mechanical conflict resolutions; merge a released PR with a merge commit; add
and remove `ready-to-merge`; comment.

**May not:**
- force-push;
- rewrite a PR's authored content;
- resolve a conflict that needs judgement;
- close a PR or an issue;
- delete a branch it did not create;
- change repository settings;
- merge anything the owner has not released.

**The confirmation rule stands.** `AGENTS.md` requires explicit user
confirmation before merging to `main`. This proposal does not relax it. It
moves *where* the confirmation is given. **Question 2** asks whether the
owner's standing interim policy is that confirmation, for any PR that passes
intake.

### As a BPMN swimlane — described, not drawn

Roles here are swimlanes (`role-model`). The process would be
`cat-harness/processes/merge-manager.bpmn`, with three lanes:

- **`authoring-agent`** (exists): `A_MakeGreen` → `A_HandOver` (Tool
  `pr-ready-for-merge`) → `A_FixBounce`.
- **`merge-manager`** (new role): `A_Intake` → `A_Order` → `A_BringMainIn` →
  `A_RepinSubmodules` → `A_Regenerate` → `A_LocalGates` → `A_Push` →
  `A_AwaitVerdict` → gateway green? → `A_Merge` | `A_BounceBack`, then
  `A_WatchMain`.
- **`user`** (exists): `A_Release`, the confirmation, satisfied by the
  standing policy if Question 2 says so.

**Neither the role nor the diagram is added in this PR.** The `kg:audit`
criteria `lane-binds-role`, `role-carries-activity-skill` and
`activity-skill-has-tool` require a role, its lane and its skills to arrive
together, and drawing them before the owner rules would commit to an answer to
Questions 1 and 3. They are one follow-up PR once ruled.

---

## 3. The SOP

The draft skill [`merge-manager`](../reference/skill-instructions/merge-manager.html)
carries it in full. In outline:

1. **Intake.** A PR counts as handed over only when all three hold: it is not
   a draft, it carries `ready-to-merge`, and its latest `ready: <sha>` names
   the current head. A label without a matching sha is a stale hand-over: say
   so and do not merge.
2. **Order.** Oldest `ready:` first. Fixes for a red `main` and PRs that
   unblock others jump the queue. The owner can name any other order.
3. **Bring main in** with a merge, never a rebase, so that nobody force-pushes.
4. **Submodule-pin guard.** Run `git submodule update --init bootstrap
   bootstrap-tools` *before* staging. Then check that `git ls-files -s
   bootstrap bootstrap-tools` equals `git ls-tree origin/main bootstrap
   bootstrap-tools`, unless the PR intends a pin change. **Never `git add -A`
   over a stale checkout**: that is the 2026-10-01 defect.
5. **Regenerate in order.** Run `bun run regen`, which repeats passes until a
   pass changes nothing. Then run `bun run readme:subgraphs` **last**, because
   generated READMEs summarise what the other generators wrote. Finally,
   `bun run regen --dry-run` must report nothing stale.
6. **Full local gates.** Run `bun run gates`. CI stops at the first failing
   gate, so fixes surface one per push. A local run shows them all at once.
7. **Push once, then wait** for check runs on that head. Read the verdict from
   check runs, never from the legacy status API: it is always empty here (bean
   `mc8h`'s correction). Do not merge main again while a run is in flight
   unless `main` is red.
8. **Merge** with a **merge commit**, the repository's convention
   (`Merge pull request #N from …`).
9. **Post-merge.** Watch `main`'s run. On red, fix forward in a small PR (bean
   `391j`'s ruling) and check the parent before blaming the last merge.
10. **Bounce-back.** On red, remove `ready-to-merge` and comment with the job,
    the first failing gate and the sha. The author fixes it and hands over
    again.
11. **Stale-label expiry.** If a label's `ready:` sha is no longer the head,
    comment once. After 24 h with no new `ready:`, remove the label and say
    why. Never close the PR.
12. **Escalation.** A conflict needing judgement goes to the author, or to the
    owner if the author's session is gone, with both sides quoted.
13. **Audit trail.** Every merge, bounce and label change leaves a PR comment
    naming the sha and the reason. The queue's history is then readable from
    GitHub alone, by a person or by the next Merge Manager session.

---

## 4. Tooling options, compared

| | (a) merge queue + required checks | (b) org bot / GitHub App | (c) dedicated session on the personal account (today) | (d) scheduled Action does regen-and-merge | (e) hybrid: (c) now, Action-assisted |
|---|---|---|---|---|---|
| **what it is** | GitHub tests the exact merge commit and lands it | a non-human identity with its own token merges | one long-lived agent session ("Separation") follows the SOP | a cron workflow merges main in, regenerates, pushes and merges with `GITHUB_TOKEN` | the session decides and merges; an Action does the mechanical regen/push |
| **available here?** | **no**: needs an org-owned repo (bean `1hjm`) | needs an org, or a second user account, plus a token | **yes**, running today | yes | yes |
| **cost** | free once in an org; the transfer cost is unexplored | org free tier; App setup; secret custody | agent time per merge; one session's attention | Actions minutes; the full gate set per PR per run | both, smaller |
| **security** | best: no token can merge untested code | scoped fine-grained token, but a long-lived secret | owner's own credentials, in a session | `GITHUB_TOKEN` with `contents: write`: any workflow bug can push to `main` | as (c), plus a narrowly scoped workflow |
| **auditability** | GitHub's queue log | the org audit log; the bot identity is distinct | PR comments; the identity is the owner's, so the bot and the human are indistinguishable in git | workflow logs | PR comments + workflow logs |
| **permission model** | branch rules; no agent needs merge rights | `CODEOWNERS` + rulesets; the App has exactly the scopes granted | the harness's auto-mode classifier gates each merge; needs an explicit confirmation form | repository settings | the classifier gates only the merge |
| **setup effort** | transfer the repo to an org, enable it, keep `merge_group:` triggers (already present) | create the org or account, App, token, rules | none: write down the SOP (this PR) | a new workflow plus a regen job that must be correct unattended | small: the SOP now, a regen workflow later |
| **failure modes** | none specific; a check that never reports stalls the queue | token leak; a bot merging on a misread verdict | the session dies or its context fills; the classifier refuses; one person's attention is the bottleneck | merges something the owner never released; regen that cannot settle loops; judgement conflicts have nowhere to go | as (c), with less toil |

**On (c) and the owner's input.** The owner types with difficulty, so every
confirmation the Merge Manager needs must be **selection-only**: a numbered
choice, never a sentence to compose. The classifier accepted "merge 1762" but
not "1". So either the hand-over policy counts as the standing confirmation
(Question 2), or the Merge Manager's prompt names the exact PR in a one-tap
option.

### Recommendation

**(e): keep (c), the dedicated "Separation" session, as the Merge Manager now,
under the SOP and skill in this PR. Revisit (a) only if the repository moves to
an organisation.** The reasons:
- (c) is the only option that is running today and needs no settings change,
  which the owner ruled against on 2026-09-30.
- It keeps judgement (order, escalation) with an agent the owner can talk to.
- The toil it pays is mechanical and can be moved into a workflow later
  without changing the role.

**What would falsify this recommendation:**
- the Merge Manager session cannot keep up, measured as a median time from
  `ready:` to merge above ~2 hours over a week, or as a growing queue;
- a merge it makes turns `main` red more than once a week for reasons a local
  `bun run gates` would have caught;
- the classifier keeps blocking merges even under a standing confirmation;
- the owner moves the repository to an organisation, which makes (a)
  strictly better.

---

## 5. Skills and tools to add

| name | kind | status | what it does |
|---|---|---|---|
| `merge-manager` | skill, `sdlc-core` | **added as DRAFT** | the role, RACI and the 13-step SOP |
| `pr-ready-for-merge` | Tool, `cat-harness/tools/merge.ts` | **added as DRAFT** | the author's hand-over, carrying the owner's tagging policy **verbatim**. Steps: re-read the head sha and verify every CI job on it is green; mark Ready for review; add `ready-to-merge`, keeping existing labels; comment exactly `ready: <40-char sha>`; on a bounce-back, fix, push and hand over again. Satisfies `merge-manager` and `prepare-merge`, the skill the PR-author lane (`authoring-agent`) holds |
| `merge-manager` role | `scenarios/roles.json` | **proposed only** | the swimlane; arrives with the BPMN |
| `merge-manager.bpmn` | process, `cat-harness/processes/` | **proposed only** | the lanes in §2 |
| `merge-queue-status` | Tool + script | proposed | lists PRs carrying `ready-to-merge`, whether the `ready:` sha matches the head, and the green or red verdict from check runs: the Merge Manager's intake view |
| `check:submodule-pins` | script (not wired into CI) | proposed | fails when the index's gitlinks differ from `origin/main`'s and the branch did not intend it; the §3 step-4 guard as a command |
| `regen --final readme:subgraphs` | option on `bun run regen` | proposed | makes "README generators last" part of the command rather than a remembered rule |

---

## 6. Open questions for the owner

Six decisions are open. Each is answerable by choosing a number, and each has
a default that applies if you say nothing.

**Q1. What runs the Merge Manager?** This decides whose identity merges and
whether settings change. The options are compared in §4.
1. **(recommended)** Hybrid (e): the "Separation" session merges now, and the
   regenerate-and-push toil moves into a workflow later.
2. (c) alone: the session does everything, indefinitely.
3. (b): set up an organisation bot or GitHub App.
4. (a): move the repository to an organisation and use the merge queue.

*Default if unanswered: 1.*

**Q2. Does the interim policy count as your merge confirmation?** If yes, a PR
that passes intake (label + matching `ready:` sha + all green) may be merged
without asking you again. If no, the Merge Manager asks you once per PR with a
one-tap option naming the PR.
1. **(recommended)** Yes, for PRs that pass intake. You can revoke it at any
   time.
2. No, ask per PR with a one-tap option.
3. Yes, but ask for PRs that touch `.github/workflows/` or submodule pins.

*Default if unanswered: 3, the cautious middle, until you choose.*

**Q3. Should the role and its BPMN be added now?** This decides whether the
procedure becomes executable (`workflow_start` / `workflow_next`) or stays as
skill prose.
1. **(recommended)** Yes, in a follow-up PR once Q1 and Q2 are ruled.
2. No, the skill is enough.

*Default if unanswered: 1, after Q1 and Q2.*

**Q4. Queue order.**
1. **(recommended)** Oldest `ready:` first, with red-`main` fixes and
   unblockers first.
2. Smallest diff first.
3. Only in the order you name.

*Default if unanswered: 1.*

**Q5. Stale `ready-to-merge` labels.**
1. **(recommended)** Comment once, then remove the label after 24 h with no
   new `ready:`.
2. Comment only; never remove the label.
3. Remove the label immediately when the head moves.

*Default if unanswered: 1.*

**Q6. Should the draft skill and Tool in this PR be promoted from DRAFT?**
1. **(recommended)** Yes, after Q1–Q2, edited to match the rulings.
2. Keep them as DRAFT until the BPMN lands.
3. Withdraw them; keep only this page.

*Default if unanswered: 2.*
