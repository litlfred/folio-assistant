---
# folio-assistant-w2g5
title: 'staging-preview-orphans calls a live sibling session''s branch an orphan, and there is no way to act on a true one'
status: todo
type: task
priority: normal
created_at: 2026-09-19T10:48:19Z
updated_at: 2026-09-19T10:48:19Z
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
