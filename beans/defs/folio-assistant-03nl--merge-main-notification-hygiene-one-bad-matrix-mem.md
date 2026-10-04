---
# folio-assistant-03nl
title: 'MERGE-MAIN NOTIFICATION HYGIENE: one bad matrix member reds the whole run, and an unchanged failure re-notifies on every push to main'
status: in-progress
type: bug
priority: high
created_at: 2026-10-04T05:52:09Z
updated_at: 2026-10-04T05:52:31Z
parent: folio-assistant-1xhc
---

## Brief

**What and why.** The owner is being emailed *"Merge main into opted-in PRs /
merge:main into PR (1958) — Failed in 6 minutes and 18 seconds"* many times a
day. `merge-main.yml` fires on every push to `main` (many per hour) and runs one
matrix member per opted-in PR; a single member's failure makes the whole run
`failure`, and GitHub emails the run. Run `37179860536` failed on exactly one
member (`merge:main into PR (1801)`, step *"Fail on anything but a merge, an
up-to-date branch or a refusal"*). The condition was already known and already
fixed on another branch (bean `z7n1`), so every subsequent email carried no new
information. Notification hygiene is the deliverable; the particular PR is not.

**What is already measured.** The 1801 root cause is `qa-resolve-conflicts.ts`
staging with a plain `git add` under a newly gitignored directory, so
`merge-base.ts` aborted "without a refusal" (bean `z7n1`, fixed on
`claude/festive-galileo-s7ibx0`); `merge-base.ts` runs from main's copy, so the
fix only takes effect once it lands. The `merge-main` label was removed from
#1801 as a stopgap, which is not the fix.

**Approach.** (1) The matrix member no longer decides the RUN's colour:
`continue-on-error: true` on the `merge` job, with a single aggregating `notify`
job that fails only on a NEW or SYSTEMIC condition. (2) A failure signature is
written into the bot's existing in-place PR comment; a failure whose signature
the comment already records is a REPEAT and stays quiet. Falsifiable: if
`continue-on-error` on a job does not keep the run conclusion green, the emails
continue and the whole approach is wrong — pinned by the workflow test and
checkable on the first real red member after merge.

**Not doing.** Not re-fixing `z7n1`; not disabling the workflow; not removing
anyone's `merge-main` label; not reintroducing `needs-merge-human` (owner ruling
2026-10-03, retired on `claude/festive-galileo-s7ibx0`).

**Parent.** `folio-assistant-1xhc` — *a gate that does not fire is
indistinguishable from one that passed*. Suppressing a notification is one move
away from suppressing the gate, so every quiet outcome here still has to leave a
durable, findable record (the PR comment, the job summary, a red-but-ignored
job, an annotation). That is this epic's sentence applied to the notification
layer rather than to the gate layer.

## Done when

- [ ] a repeat of an identical failure on an unchanged PR head does not fail the run
- [ ] a new failure, a changed cause, a systemic failure and a `select` failure all still fail the run
- [ ] every quiet failure is still recorded in the PR comment AND the job summary, and its member job is still red
- [ ] `cat-harness/scripts/tests/merge-main-workflow.test.ts` covers the new behaviour
- [ ] bun run gates green, PR CI green, PR marked ready-to-merge
