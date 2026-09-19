---
# folio-assistant-35nj
title: A bean claim is invisible to a sibling until the PR exists, so claim-before-work does not prevent a same-minute duplicate
status: completed
type: task
created_at: 2026-09-19T09:41:30Z
updated_at: 2026-09-19T11:40:54Z
---


## What happened, measured 2026-09-19

Two sessions independently fixed bean `plj1` (`docs-site.yml`'s full-replace publish deleting every open PR's `STAGING/` preview) and opened two PRs for it: [#377](https://github.com/litlfred/folio-assistant/pull/377) and [#379](https://github.com/litlfred/folio-assistant/pull/379). Same diagnosis, same design choice, two implementations. #379 was withdrawn.

The timestamps are the finding. From the two branches' own bean edits:

| event | time |
|---|---|
| sibling sets `plj1` `in-progress` | 09:28:18Z |
| I set `plj1` `in-progress` | 09:29:19Z |
| #377 opened | ~09:36 |
| #379 opened | 09:37 |

**Both claims were made before either PR existed.** `AGENTS.md` says "claim before you work (set `in-progress` + note your branch) so two sessions don't pick the same item", and both sessions did exactly that — 61 seconds apart — and it prevented nothing.

## Why claim-before-work cannot prevent this as written

A claim is a commit to `beans/defs/<bean>.md` **on a feature branch**. A sibling session reads `main`, where the bean still says `status: todo`. So the claim becomes visible to anyone else only once the claiming session pushes and opens a PR — and the repo's own "open the PR at the first commit" rule is what makes it visible *at all*, rather than at the end.

That leaves a window from "I decided to work this" to "my PR exists" in which the bean reads as unclaimed to every other session. Here that window was about eight minutes and two sessions both entered it. The mechanism is not broken, it is **branch-local**, and the instruction is written as though it were global.

This is not the `nytj` failure (two concurrent PRs each green alone and red together, via a sidecar's recorded auditor hash) — that is about *merging* concurrent work. This is about two sessions choosing the same work in the first place.

## Options, none of them implemented here

Recording rather than choosing, because the cheapest option is a wording change and the effective ones all cost something:

1. **Say so in the skill** and leave the mechanism alone. `todo-manager.md` currently implies a claim is globally visible; it should say the claim is branch-local until the PR exists, and that a session should re-check `origin/main` and the open PR list *before* starting a bean, not only at session start. Cheapest, and catches the case where the sibling's PR already exists — which would have caught #379 if I had looked at eight minutes later.
2. **Push the claim to `main` directly**, separately from the work. Makes it global immediately and is what a lock would look like, but it means every session pushing to the default branch, which this repo otherwise routes through PRs.
3. **Check the open PR list for the bean id** as part of claiming. A bean id in a PR title or body is already the convention here, so a claim step could grep it. Narrower than a lock, no default-branch write, and it would have fired at 09:37 but not at 09:29.
4. **Accept it.** Two sessions duplicating an eight-minute fix costs one withdrawal, and the withdrawal produced a real comparison of two designs. Not obviously wrong, and worth saying out loud rather than treating collision as always a defect.

Option 1 is what I would do, because it is honest about the mechanism without pretending to a lock the store cannot provide, and option 3 is a reasonable follow-on.

## Done 2026-09-19 — option 2, the owner's choice: push the claim to the default branch

`scripts/claim-bean.ts`, wired as `bun run beans:claim <id>`. It builds the
status change as a commit of its **own** and pushes it to the default branch, so
a sibling sees the claim immediately rather than when the PR opens. Chosen over
the PR-list check on the stated cost: a session writes to the default branch for
claims, which this repo otherwise routes through pull requests.

### The design was reshaped by a measurement, not by a preference

The brief said the whole approach dies if the default branch is protected, and
that this would be checked first. It could not be: `GET /branches/main/protection`
answers **403 "Resource not accessible by integration"**, and `git push --dry-run`
does not run the receive hooks that enforce protection. So neither the API nor git
can answer in advance.

That did not kill the design, it **reshaped** it: the tool attempts the push and
handles the rejection, rather than assuming either way. Which is better
engineering than the version that would have shipped had the probe succeeded.

### Five outcomes, three of them refusals

| outcome | exit | meaning |
|---|---|---|
| `pushed` | 0 | on the default branch; every session sees it |
| `already-claimed` | 0 | a sibling holds it, and is **named**. Nothing written |
| `new-on-branch` | 0 | not on the default branch yet, so nobody can see it and there is nothing to race over |
| `fell-back` | **3** | push REJECTED. Not claimed anywhere a sibling can see; the message names the fallback |
| `unknown` | **2** | the branch could not be read. **Never** "the bean is free" |

`new-on-branch` was **not** in the design and was added because the first run
found it: a bean created on this branch reported COULD NOT DETERMINE, which is
the one answer this tool must never give when it knows. `beans create` followed
immediately by a claim is the common case, and pushing the bean itself would be
pushing *work* to the default branch, which is not what a claim is.

### Two bugs of mine, both found by running it

1. **The store defaulted to the PLATFORM root.** Beans live in the *folio*;
   `AGENTS.md` is explicit that folio-assistant is the platform, not the content.
   Run from a folio it reported `no bean matching "<id>" in this store` for a bean
   in front of it. Now defaults to `process.cwd()` with `--repo` to override.
2. **`repoAt + 1` ate the id.** With no `--repo`, `repoAt` is `-1`, so `-1 + 1`
   is index 0 — the id itself — and the CLI printed its own usage on a valid
   call. Guarded on `repoAt >= 0`.

And one real robustness fix: pushing by remote **name**, then by the raw
`get-url` value, both failed from the temp worktree with *"'../remote.git' does
not appear to be a git repository"* — a relative remote resolves against the
**worktree**. `absoluteRemote` resolves a local path against the repo and leaves
a scheme or scp-form URL untouched. Irrelevant for an `https://` remote, which is
every real one; the failure it prevents looks like a permissions problem and
would be diagnosed as one.

### Verified against a real bare remote, seven cases

Not stubbed, because the states that matter cannot be faked: protection rejects
at the receive stage and a non-fast-forward is a genuine ref race.

| case | result |
|---|---|
| free bean | `pushed`; status on the branch, claim note names the branch, **1 file** in the commit, working tree untouched, no leaked worktree |
| different branch | `already-claimed`, holder named, **no** commit |
| same branch again | idempotent, **no** second commit |
| protection rejects | `fell-back`, exit 3, branch untouched, worktree cleaned, fallback spelled out |
| remote unreadable | `unknown`, exit 2 |
| bean new on branch | `new-on-branch`, exit 0, correct advice |
| non-fast-forward | retried, succeeded on attempt 2, and **said so** |

`scripts/tests/claim-bean.test.ts` — 9 tests, each building a real bare remote.

### What this does NOT do

It does not make the claim atomic with the decision to work: there is still a gap
between reading the branch and the push landing, which the non-fast-forward retry
handles by re-reading rather than by locking. And if the default branch refuses
direct pushes in this repository, the mechanism degrades to exactly the old
behaviour — a branch-local claim plus an early PR — and says so. Whether it
actually works here will be known the first time somebody runs it.

### A sixth outcome, found by running `--dry-run` against the real store

`--dry-run` never pushes, so it was safe to exercise the real repository, and it
found a defect the synthetic tests had not: **the tool offered to claim a
`completed` bean** without comment. Two things came out of that run.

1. **`already-closed`** — a bean that is `completed` or `scrapped` on the default
   branch is now refused. Re-opening finished work is bad; re-entering a
   `scrapped` one is worse, because a scrapped bean exists precisely to record
   that something was considered and **rejected** so the next session does not
   walk back into it. That is the same reasoning as never deleting a bean.
   Reviving either is a real decision and must be deliberate, not a side effect
   of asking to claim. Exit 0 — the question was answered.
2. **`origin/HEAD` is not set in this checkout**, so `defaultBranch()` fell
   through to the `origin/main` fallback, which worked. That fallback is
   load-bearing here rather than defensive decoration — hardcoding `main` would
   have worked by luck, and asking `origin/HEAD` alone would have failed.

Also worth recording: `35nj` read as `todo` on the default branch while being
`completed` in my working tree, which is **correct** — the tool reads
`origin/main`, where this commit has not landed. My first reading of that output
was that the tool was wrong; it was measuring the thing it is supposed to measure.

### The open question is closed: `main` DOES accept a claim push

The PR that shipped this said the one thing it could not verify was whether
`beans:claim` can actually reach the default branch here, since the protection
API answers 403 and a dry-run push does not run the receive hooks — and that the
answer would come the first time somebody ran it.

Ran it, 2026-09-19T11:35:38Z, claiming `t373`:

    ✓ claimed t373 on the default branch — every session can see it now

Verified on the branch rather than trusting the exit code: `origin/main` carries
`status: in-progress`, the note `Claimed by claude/fervent-mccarthy-nw4olk`, and
commit `1112c823f` touching **exactly one file**. The mechanism works end to end
against this repository.

`fell-back` remains implemented and tested against a simulated protected branch,
because the answer could change the moment a protection rule is added.

### And using it found a hazard in it: the claim reverted itself at merge time

The claim lands on the default branch and left the caller's own checkout
untouched. Measured immediately after the `t373` claim above:

    main:  status: in-progress
    local: status: todo

Committing that stale copy on the feature branch and merging would have
**reverted the claim** — the branch's older value wins as an ordinary content
change, so the tool would have quietly undone its own work. A claim mechanism
that unclaims on merge is worse than none, because the window it closes reopens
silently at exactly the moment the work lands.

Fixed: a successful push now writes the same status into the caller's tree, so
the merge is a no-op for that field instead of a regression. It is deliberately
**not committed** — what to commit and when is the session's business, and a tool
that commits to your branch behind your back is worse than the problem. If the
local write fails the push still stands, and the outcome says so rather than
undoing a landed claim.

**An existing test had to change, and that is worth flagging rather than
hiding.** "a free bean is claimed there … without touching the working tree"
asserted a clean `git status`. It is now asserted as *exactly one* modified
file — the bean — which keeps the original guarantee (no checkout, nothing else
touched) while stating the new behaviour. A loosened assertion would have hidden
the change; a precise one records it.

That is the fifth defect this tool surfaced by being run rather than reasoned
about, after the platform-root default, the `repoAt + 1` off-by-one, the relative
remote, and claiming a `completed` bean.
