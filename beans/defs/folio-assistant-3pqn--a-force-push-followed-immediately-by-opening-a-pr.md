---
# folio-assistant-3pqn
title: A force-push followed immediately by opening a PR produces a PR with zero checks
status: todo
type: bug
created_at: 2026-09-19T08:11:21Z
updated_at: 2026-09-19T11:48:27Z
---

OBSERVED TWICE, 2026-09-19, on `litlfred/folio-assistant`.

- **#340**, head `e0e3b4b8`: no `pull_request`-event run ever fired. The newest run on the branch was for `42efd043`, the commit the previous PR had squash-merged.
- **#349**, head `059cf9e1`: identical. Newest run was `5afe1f0a`, again the merged predecessor.

Both times the sequence was: `git push --force-with-lease`, then open the PR seconds later. Both times all checks had to be produced by hand with `workflow_dispatch` against the same commit.

**It is not a paths filter.** `feature-staging.yml` lists `.github/workflows/feature-staging.yml` among its `paths`, and #340's diff edited exactly that file. `code-quality-gates.yml` has `pull_request:` with no filters at all.

**Counter-evidence that isolates the timing:** a NORMAL push to an open PR (#349, merge commit `08d304b4`) fired all seven checks immediately. And after waiting ~45s between the force-push and opening the PR, #354 and #356 both picked up their full check set. So the trigger appears to be the race between the ref update and the `pull_request.opened` event, not anything in the workflow config.

## Why it matters more than it looks

**A PR carrying zero checks is visually indistinguishable from one whose checks have not started.** Both render as no status. The `xom7` bean is the same shape one layer down — a workflow failing invisibly — and the remedy there was to make the state legible rather than to trust that somebody would notice. Here, an agent or a human who merges on "nothing red" merges unverified.

I caught it only by checking twice and comparing against the workflow-run list.

## Done when

- [ ] the cause is established (GitHub-side race vs. something this repo controls)
- [ ] whatever the cause, a PR with NO check runs on its head is reported as such, not read as green — the third state, as everywhere else here
- [ ] if the workaround is procedural (settle between push and PR-open), it is written in the skill that governs opening a PR, not left as folklore

_2026-09-19T10:15:56Z_ — Two more observations, 2026-09-19, and one is COUNTER-EVIDENCE to the timing hypothesis.

- #383, head 1bbe12b20: force-with-lease push, PR opened ~52s later. ZERO pull_request runs — only a push-triggered jsonld check. Had to workflow_dispatch code-quality-gates and feature-staging by hand.
- #390, head 18a60583b: force-with-lease push, PR opened ~13s later. FULL check set fired automatically on pull_request.

So the shorter gap worked and the longer one did not, which is the opposite of what a ref-update/opened race predicts, and the opposite direction from the ~45s finding on #354/#356. Whatever the cause is, elapsed time alone does not predict it — four observations now, and no monotonic relationship.

I had independently guessed 'GitHub suppresses events authored by the app token' after seeing #383, and #390 falsified that within fifteen minutes. Recording both the wrong guess and its falsification so the next agent does not re-derive it.

What is NOT in doubt, and is the part worth acting on: a PR with zero checks renders identically to one whose checks have not started, so 'nothing red' is not evidence of anything. Verify against the workflow-run list (actions_list on the workflow, filtered by branch) and compare head_sha, rather than reading the PR page.

_2026-09-19T11:48Z_ — FIFTH observation, and the first that was **not a force-push**, which narrows this.

- **#409**, head `678065a99`. Only the push-triggered `.jsonld` check fired; no `pull_request` run for that sha at all. The newest `code-quality-gates` run on the branch was for `ca62e8892` — the commit the PREVIOUS PR (#399) had merged, exactly the #340/#349/#383 pattern. Fixed by `workflow_dispatch` against the branch, as before.

**The new evidence: this was a plain fast-forward push.** `git push -u` with no `--force`, and `git merge-base --is-ancestor ca62e8892 678065a99` returns true, so the old remote tip is an ancestor of the new head — no history was rewritten. Every prior observation in this bean was a `--force-with-lease` push, so the title ("A force-push followed immediately by…") is **too narrow** and a reader filtering for force-pushes will not recognise their own case. Not renaming it here, since it is not my bean; flagging it because the title is what the next agent greps.

Timing, added to the four already recorded: push 11:44:03Z, PR opened ~11:44:30Z, so **~30 s**. The series is now 52 s fail, ~45 s pass, 30 s fail, 13 s pass, seconds fail — which continues to show no monotonic relationship and is further counter-evidence to a ref-update/opened race.

One hypothesis this observation is consistent with and the bean has not recorded: the branch had just been **reset to `origin/main` and force-updated locally** (`branch: Reset to origin/main` in the reflog at 11:33:42Z) after its previous PR merged, so the PUSH was a fast-forward but the branch had very recently pointed at a merged commit. #340, #349 and #383 all also opened a PR on a branch whose predecessor had just merged. That is a property of the BRANCH's recent history rather than of the push, and it would explain why elapsed time predicts nothing. Stated as a hypothesis, not a finding — I have not tested it, and the correct test is to open a PR on a freshly-created branch name and compare.

What is unchanged and is the part worth acting on: a PR with zero checks renders identically to one whose checks have not started, so "nothing red" is evidence of nothing. Verify with `actions_list` on the workflow and compare `head_sha` against the PR's head.

_2026-09-19T11:50Z_ — SIXTH observation on #409, and it contradicts this bean's own counter-evidence.

The note above records #409's PR-open getting no run. I then pushed a second commit (`d87c66031`) to the **already-open** PR — the case this bean explicitly recorded as WORKING:

> Counter-evidence that isolates the timing: a NORMAL push to an open PR (#349, merge commit `08d304b4`) fired all seven checks immediately.

It did not fire. No `code-quality-gates` run exists for `d87c66031` on any event, minutes later. So "a normal push to an open PR always fires" is now falsified too, and the remaining shared property across all six observations is narrower than either the push kind or the elapsed time: **every one of them is on a branch whose previous PR had recently merged**, i.e. a reused branch name.

That strengthens the hypothesis in the note above from "consistent with" to "the only property not yet contradicted". It is still untested — the test remains: open a PR on a **freshly created** branch name and push to it twice, comparing both against the run list.

One incidental result worth keeping, because it is the only thing here that is good news: the hand-dispatched run (#980, `workflow_dispatch`, `678065a99`) completed **success**, including the `readme:audit` step wired in that same commit. So `workflow_dispatch` remains a reliable workaround, and the gate it exercised is sound in CI rather than only locally.
