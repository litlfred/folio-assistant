---
# folio-assistant-35nj
title: A bean claim is invisible to a sibling until the PR exists, so claim-before-work does not prevent a same-minute duplicate
status: todo
type: task
created_at: 2026-09-19T09:41:30Z
updated_at: 2026-09-19T09:41:30Z
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
