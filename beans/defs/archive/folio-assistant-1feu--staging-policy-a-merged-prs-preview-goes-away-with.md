---
# folio-assistant-1feu
title: 'STAGING POLICY: a merged PR''s preview goes away without a label; closed-unmerged still needs one'
status: completed
type: feature
priority: normal
created_at: 2026-09-20T07:02:37Z
updated_at: 2026-09-20T07:07:07Z
parent: folio-assistant-1xhc
---


**Owner, 2026-09-20**: *"change policy, if merged to main, then staging goes
away"* — during the cleanup sweep that found 11 previews at 449.4 MB.

## The rule, and why it is a distinction rather than a relaxation

| the PR was | the preview is | so |
|---|---|---|
| **merged** | what the MAIN SITE now shows | redundant on the instant → removed, no label |
| **closed, unmerged** | the ONLY rendering of that work | the last copy → label still required |

`deletion-requires-confirmation` is satisfied, not waived: **the merge IS the
confirmation.** A person decided the content belongs on `main`, which says
more about the preview than a label does. What the label still guards is the
case where nobody decided anything.

**It does not reverse `plj1`.** That failure deleted every **OPEN** PR's
preview — work nobody had accepted, mid-review. Nothing here reaches an open
PR; the job's `if:` is still `github.event.action == 'closed'`, and there is
a test asserting that specifically so a later widening has to argue with it.

## Changed

- `.github/workflows/feature-staging.yml` — the `cleanup` job's gate reads
  `github.event.pull_request.merged`, bound to `env:` like every other
  event-derived value in that file (it runs on `pull_request_target` with
  `contents: write`, so an interpolated payload value is arbitrary code
  execution). Emits `reason=merged|labelled|closed-unmerged-and-unlabelled`,
  so an audit can tell which rule removed a preview.
- The policy is stated in FOUR places; all four updated, with
  `staging-review.md` carrying the reasoning and the rest pointing at it:
  `staging-review.md`, `deletion-requires-confirmation.md` (the disposal
  table row, plus a note on the `plj1` example saying it is untouched),
  `crdm-requirements-workflow.md` step 9.
- 5 tests on the gate, including the `plj1` guard.

## Not done here — the backlog

The policy applies to future merges. The 11 previews already on `gh-pages`
predate it, including those for PRs merged earlier today. Clearing them is
the `feature-staging.yml` dispatch path (`cleanup_slug` + matching
`cleanup_confirm`), one directory per run, and each is preflighted against
the same liveness signals the health sweep uses.
