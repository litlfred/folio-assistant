---
# folio-assistant-3pqn
title: A force-push followed immediately by opening a PR produces a PR with zero checks
status: todo
type: bug
created_at: 2026-09-19T08:11:21Z
updated_at: 2026-09-19T10:15:56Z
parent: folio-assistant-1xhc
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
