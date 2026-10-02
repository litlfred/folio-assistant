---
# folio-assistant-ynu8
title: CI health is reported only at session start, so a reader who never starts a session never sees a red
status: completed
type: task
priority: normal
created_at: 2026-08-26T18:03:23Z
updated_at: 2026-08-26T18:09:32Z
---

Worked on claude/publication-workflow-diagrams-4uw90m (PR #139).

## The premise I had been repeating was wrong

I twice told the user this cost Actions minutes they were avoiding. The repo is
PUBLIC, and standard GitHub-hosted runners are free for public repositories. I
should have checked that before repeating it rather than after.

## Summary of Changes

The gap: `xom7` made CI health visible at session start, but the failure mode it
guards against is a quiet stretch with nobody looking — which is exactly the
stretch in which no session starts.

- `.github/workflows/ci-health.yml` — weekly (`17 9 * * 1`) + dispatch. Runs the
  same checker and maintains ONE issue labelled `ci-health`: opened on a live
  failure, EDITED in place while it persists (an edit does not notify, so a long
  outage stays one unread item), closed automatically when main is clean.
  Deliberately not another email — GitHub sent 30 and nobody read them.
  Weekly, not daily: the defect is 'nobody noticed for two months', and the
  sweep already covers every day somebody is working.
- `--out <file>` on `check-ci-health.ts` — the report AND a real exit code from
  ONE API call. It could not reuse `--markdown`, which always exits 0 on
  purpose: `session-start-coord-sweep.sh` runs it as `if ! … --markdown; then`
  and would print the report AND 'Not checked' on every red.
- Three live README badges — same state at the front door, for the three
  workflows that actually run on main. Badging a dispatch-only one would report
  its last dispatch forever (lq7e).
- `scripts/tests/check-ci-health-cli.test.ts` — 7 tests pinning the exit-code
  contract, offline (a git repo with no origin drives the unreachable branch).

## Two things that are load-bearing, not incidental

`fetch-depth: 0`: the superseded rule asks git when a workflow file last
changed, a shallow clone cannot answer, and the false fires lq7e retired would
come straight back.

On 'could not check' the issue is left UNTOUCHED and the job fails. Closing it
would make going blind read as good news. A red ci-health.yml is itself reported
by next week's run — the watchdog is watched by the watchdog.

## Found by the repo's own guards

The 5rfy trigger-consistency test (`scripts/tests/workflow-triggers.test.ts`)
rejected my header: prose describing docs-site's push trigger read as a claim
about this workflow's own. Rephrased rather than disclaimed — its triggers are
exactly what it says.

Adversarial re-read caught two more before pushing: bun exits 1 on an uncaught
exception too, so exit 1 alone would misread a CRASH as 'red' and open an issue
from an absent report (now gated on the report file being non-empty); and both
issue paths filter by the label, so the clean path needed it ensured too.
