---
# folio-assistant-i8wf
title: After the cutover, a merged PR carrying a beans/** change re-creates the directory on main and turns check:declared-dirs red
status: todo
type: task
priority: high
created_at: 2026-10-04T06:43:41Z
updated_at: 2026-10-04T06:43:41Z
parent: folio-assistant-fs43
---

Arc `fs43`, found by reasoning while preparing the cutover (PR #2052) and **not** yet measured, because the cutover has not happened.

After `beans/` leaves `main`, any branch that still carries a `beans/**` change re-creates the directory on `main` when it merges. `tipPresence` then answers `not-cut-over` — *"the graph has two copies and nothing says which is authoritative"* — which is a finding, so `check:declared-dirs` exits 1 and **`main` is red until somebody removes the files by hand**. The remedy is a `git rm`, which is exactly the operation an agent may not perform on its own initiative (`deletion-requires-confirmation`), so the red can sit.

Three things make this likely rather than hypothetical on the first day:

- ~30 PRs are open at the time of the cutover, and an agent PR that closes a bean conventionally carries the bean's transition in its own last commit (`bean-coordination` §"Complete it in the PR's own last commit"). That rule and this one point opposite ways after the cutover, and `continual-progress`'s *"a bean edit is no longer part of the PR's commit set"* is the P5 (`89cl`) half that has not landed.
- `claim-bean` pushes to the default branch today; #2042 is the fix and is a hard prerequisite of the cutover for this reason.
- The measurement is cheap and worth having first: of `main`'s last 86 commits, **19 touch a bean path**, so the rate of branches carrying one is not small.

## Options, not a decision

1. **A merge-time refusal.** `merge:guard` / `merge-main.yml` refuses a branch whose diff against `main` touches a cut-over graph's path, naming `branch-store push --id beans` as the way to land it. Catches it before `main` goes red; needs the list of cut-over paths, which is derivable from the declarations (`tipLocations`).
2. **A PR-time gate.** The same question asked by `check:declared-dirs` over the PR's merge commit — which CI already builds for a `pull_request` run. Earlier feedback, but it is a gate that fails on somebody's unrelated PR for a file they did not think about.
3. **Accept and automate the repair.** A post-merge job that removes a re-added path and pushes the content to the branch instead. Reverses the direction of `deletion-requires-confirmation`, so it would need the owner's explicit go.

## Done when

- [ ] the owner has picked one, or ruled that the red is acceptable
- [ ] whichever is picked NAMES the remedy a contributor should run, rather than only refusing
- [ ] measured once for real: a branch carrying a `beans/**` change, merged after the cutover, and what the gate actually said
