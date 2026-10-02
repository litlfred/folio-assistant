---
# folio-assistant-3yi4
title: 'CI VISIBILITY: nothing here can see gh-pages build outcomes, so a cancelled deploy is invisible'
status: completed
type: bug
priority: normal
created_at: 2026-09-20T16:33:19Z
updated_at: 2026-09-20T18:05:00Z
parent: folio-assistant-1xhc
---

Split out of `bm6d` on the owner's instruction, 2026-09-20. `bm6d` fixed the
*cause* of the self-cancellations; this is the **blindness that let them run
for months unnoticed**, and it is bigger than that bean.

## The gap, measured

`bm6d` counted **6 of the last 10 `pages build and deployment` runs
`cancelled`**, in an exact pattern, and nothing in this repository said so.
Three properties combine to make those runs unreadable from here:

1. they are on **`gh-pages`**, not the default branch;
2. they are **bot-triggered** — actor `github-pages[bot]`, event `dynamic`;
3. `bun run check:ci-health` reads workflow state **on the default branch**,
   so it covers none of them.

The deploy job is green, the bot comments the URL, the link resolves — and the
build that was meant to serve it was cancelled. **This is `xom7` one ref over**:
*"a thing failing repeatedly with nothing in the repository saying so"*, which
is the bean `ci-health` itself exists to prevent.

## Why it survives `bm6d`

`bm6d` removed this repository's own self-inflicted half — one workflow pushing
twice. What it cannot touch is **contention between sessions**: four agents
deploying to one ref still cancel each other's builds, and that remains
invisible by exactly the same three properties. So the harm is reduced and the
blindness is not.

It also blocks `bm6d`'s own third Done-when — *"measured after: `cancelled`
runs over a comparable window are not caused by a repository's own consecutive
pushes"* — which could not be closed because nothing here can perform the
measurement. `bm6d` closed on its property instead, by the owner's decision.

## Done when

- [ ] `gh-pages` build outcomes are legible from inside the repository —
      whatever the mechanism, a person or an agent can ask *"are the previews
      actually building?"* and get an answer
- [ ] a `cancelled` run is reported as a **third state**, not folded into
      success or failure. It is neither: nothing broke, and nothing shipped
- [ ] and the report distinguishes **self**-cancellation from cross-session
      contention, because `bm6d` fixed the first and not the second, so a
      count that merges them cannot show whether it worked

## Not in scope

The contention itself (`6pfo`, `1feu`) and the `docs-site.yml` full-replace
question. This bean is about being able to SEE, not about reducing the
collisions.


## OWNER'S CORRECTION, 2026-09-20 — the framing in this bean was wrong

> **"they are not. changes status of repo. tools need to look external"**

This bean was filed asking that *"`gh-pages` build outcomes are legible from
**inside the repository**"*. **That is the wrong shape and the Done-when has
been rewritten.**

A Pages build outcome is **not repository state**. It is a fact held by an
external service that *changes the status of the repo* — the same as a workflow
conclusion, a check run, or a deployment. Trying to make it legible from a
checkout would mean writing it INTO the repo, which is a mirror that can go
stale, disagree with the source, and need a writer nobody owns.

**The tools look external.** `check-ci-health.ts` already does exactly this —
verified 2026-09-20, it calls
`https://api.github.com/repos/<slug>/actions/runs` with `GITHUB_TOKEN` when
present, and degrades with a named reason when it cannot. So the mechanism is
not missing; **the query is too narrow**. It asks about the default branch,
and these runs are on `gh-pages`, bot-triggered by `github-pages[bot]` with
event `dynamic`.

So this is *widen what the external query asks*, not *build a new store*.

## Done when — REWRITTEN to the owner's shape

- [ ] the existing external reader answers *"are the previews actually
      building?"* — the `gh-pages` / `dynamic` / `github-pages[bot]` runs it
      currently filters out
- [ ] a `cancelled` run is a **third state**, neither success nor failure:
      nothing broke and nothing shipped
- [ ] self-cancellation is distinguishable from cross-session contention,
      because `bm6d` fixed the first and not the second, and a merged count
      cannot show whether it worked
- [ ] **nothing is written into the repository to cache it.** Could-not-reach
      is reported as could-not-reach, the way `check:ci-health` already does
      for a private repo and for rate limiting — a stale mirror would be the
      `xom7` failure rebuilt in a new place

---

## CLOSED 2026-09-20 — all four Done-when re-derived, not quoted

Shipped in PR #574 (`3yi4`). Every line below is something re-run in the
session that closed this, per the `0pes` rule; the numbers in the bean above
are `bm6d`'s and were **not** reused.

### 1. The external reader answers the question

`bun run check:ci-health` now prints a **Pages deployments** section. The
reader was never missing — the query was too narrow, exactly as the owner's
correction said. Widened, not replaced:

| what | route taken | why not the obvious one |
|---|---|---|
| which workflow | `GET /actions/workflows`, entry whose `path` starts `dynamic/pages/` | it has **no file**, so it is addressable only by a per-repository id |
| which runs | `GET /actions/workflows/<id>/runs` | `?branch=<default>` excludes them; the by-path runs endpoint answers **404** |
| which branch | read off the runs' own `head_branch` | `GET /repos/<slug>/pages` answers **403** without admin |

Both refusals were **measured, not read**. Reading the publish branch off the
runs rather than hardcoding `gh-pages` also means a repository publishing from
`main` reports `main`.

**Measured live, 2026-09-20, window 2.6h:**

| | |
|---|---|
| default-branch page | **0** Pages deployments |
| publish branch | **51** cancelled, **49** succeeded, **0** failed |
| of the cancellations | **25** self-inflicted, named by slug |

### 2. `cancelled` is a third state

`PagesHealth` carries `success`, `cancelled`, `failure` and `unsettled`, and
the four partition the runs. The section prints all four **even at zero** — a
mutation pass found that dropping the `failed` or `succeeded` line changed
nothing any test could see, which is this bean's own defect reproduced inside
the function written for it. Now pinned.

### 3. Self-cancellation is distinguishable from contention

`selfSupersedes` pairs adjacent publish-branch commits naming one slug inside
a window. Run against the live history it found **25** — and every one of the
~9s pairs is `bm6d`'s two-writer signature on a **sibling branch running the
pre-fix workflow**, which is the measurement `bm6d` could not make and closed
without. My own branch does not appear. The rest are `6pfo`, and the section
says so rather than dropping them.

### 4. Nothing is written into the repository

`git status` after a full run: no new artefact, no results file. The answer is
asked every run and cached nowhere.

## What this cost, and what it found on the way

A surviving mutation over `slugOfDeployCommit`'s branch order exposed a real
defect: the cleanup jobs write `staging(cleanup): remove STAGING/<slug>`,
where `cleanup` is the **operation**. Read subject-first, every removal in the
repository resolved to one branch named `cleanup`, so two removals for two
unrelated PRs looked like self-contention — a false finding in the exact
direction this bean exists to remove. Confirmed against live history
(`d8af0bfaf`, `634b3ddda`). A path now wins wherever it appears.

The first fix for that also excluded the literal `cleanup` from the subject
branch. A test written for the **cost** of a fix rather than its benefit
caught that this makes a branch genuinely *named* `cleanup` permanently
invisible. Ordering alone carries it.

## Verification

- 37 tests in `cat-harness/scripts/tests/pages-health.test.ts`
- a **29-mutation pass, 29 caught by a named test**
- one mutation reported a false `SURVIVED` because the phrase it stubbed also
  occurs in the pre-existing `render()`; rerun scoped to the new section, it
  was caught. **A mutation harness that can mutate code the test file does not
  cover reports a pass it has not earned** — the same class as the wrong-`cwd`
  run earlier in this session.
- full suite 3243 pass / 0 fail; `typecheck` and `eslint` clean
- falsifier held: `ci-health.ts` has **zero deletions**, and
  `check-ci-health.ts`'s two are the same `render()` call with identical
  arguments routed through one helper. The default-branch report is unchanged.

## Where the discipline went

`skills/folio-core/ci-health.md` — the Pages section and a **pair** of rules,
deliberately not numbered 4 and 5. "The three rules" is quoted by that count in
four other files, so renumbering here would be the stale-count defect the rules
are themselves about. `AGENTS.md` carries the pointer only.

`memory/pages-deploys-are-not-on-the-default-branch.md` for the
`ci-health-watcher` agent. Its budget was at **199 of 200 lines**, so the entry
was added by splitting the largest existing entry's evidence into `detail/`
rather than by dropping anything — the mechanism the `agent-memory` skill
names. The generated region now ends at line 199 and every entry still reaches
the agent.

## Still open, and deliberately not touched

`6pfo` / `1feu` — the contention itself. This bean was about being able to
**see**, and it can now be measured for the first time: 26 of the 51
cancellations in that window were NOT self-inflicted.
