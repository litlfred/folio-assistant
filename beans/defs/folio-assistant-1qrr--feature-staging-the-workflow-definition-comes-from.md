---
# folio-assistant-1qrr
title: 'FEATURE-STAGING: the workflow definition comes from the BASE but the checkout is the PR HEAD, so a newly-added step fails every branch that predates it'
status: todo
type: bug
created_at: 2026-10-03T15:33:32Z
updated_at: 2026-10-03T15:33:32Z
---

## The split

`.github/workflows/feature-staging.yml:190` checks out the PR **head**:

```yaml
ref: ${{ github.event.pull_request.head.ref || inputs.branch || github.ref }}
```

But for a `pull_request` event GitHub takes the workflow **definition** from the
BASE branch. So the steps that run are `main`'s, while the tree they run
against is the PR's head. Those two disagree the moment a step is added that
invokes something new.

## Measured 2026-10-03

A step `Publish the identifier lookup` landed on `main` in `d8207832fea` at
**14:24:38** (bean `1br0`, #1972 step 3). PR #2001's head `11ae41ee55a`
branched before that:

```
$ git cat-file -e 11ae41ee55a:cat-harness-tools/scripts/publish-id-lookup.ts
fatal: path '...' does not exist in '11ae41ee55a'
$ git cat-file -e origin/main:cat-harness-tools/scripts/publish-id-lookup.ts
(exists)
```

So the run executed `main`'s step 17 against a tree with no such script, and
`stage` failed at exactly that step. The seven runs that passed between 15:01
and 15:14 were all on branches that had merged `main` after 14:24:38; the one
that failed, at 15:21, had not.

## Why it is worse than a plain stale-branch failure

**The failure names a file the author never touched**, so the natural reading
is "my branch broke the staging build". It was nearly read that way here: the
failing branch was the ONLY failure in 30 runs of this workflow against 7
successes, and a 1-in-30 statistic points hard at the one. The branch was
innocent; it was merely old.

This is the one place in this repository where *"the workflow is the
authority"* and *"the checkout is the head"* disagree, and nothing says so.

It also fires in **bursts**: an arc landing in steps (#1972 is landing in
steps) adds a step, and from that instant every open PR that has not merged
`main` fails staging until it does. With ~20 open PRs that is ~20 misleading
failures per added step.

## Not fixed here, and the options are not equivalent

Three shapes, and they differ in what they give up:

1. **Check out the merge ref** instead of the head, so the definition and the
   tree come from the same place. Closest to correct; changes what a preview
   previews (the merge result, not the branch) — which may be what a reviewer
   wants anyway, or may not.
2. **Guard each step** on the existence of what it invokes. Keeps previewing
   the branch; pays a conditional per step forever, and a skipped step is the
   `1xhc` shape unless it reports.
3. **Leave it and document it**, so the next reader is not misled.

Option 1 changes the meaning of a preview and that is a decision, not a fix.

## Done when

- [ ] the owner picks a shape, or rules that documenting it is enough
- [ ] whichever lands, a stale branch's staging run no longer names a script
      its author never touched
- [ ] the hazard is written where somebody debugging a red `stage` will find
      it, not only in this bean
