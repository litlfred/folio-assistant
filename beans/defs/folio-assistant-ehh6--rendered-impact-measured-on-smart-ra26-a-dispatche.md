---
# folio-assistant-ehh6
title: 'RENDERED IMPACT, measured on smart-ra#26: a dispatched staging run finds its PR; a file the site reads nothing from reaches no page; the review page shows the measurement'
status: in-progress
type: bug
priority: normal
created_at: 2026-10-06T18:25:34Z
updated_at: 2026-10-06T18:25:41Z
parent: folio-assistant-bnjs
---

Found by the real staging run on litlfred/smart-ra#26 (run 37507489070, bean dpi-h-ra-7ss8).

A. folio-staging.yml reads the PR only from a pull_request event. smart-ra runs staging by dispatch only (owner decision 2026-10-06), so PR=n/a, no bot comment, no review-comment ingestion, no qa-reports fetch, though GitHub lists the run under #26.
B. document-rendered-impact.ts puts every unplaced file at 'may change any page'. The bean file beans/dpi-h-ra-7ss8*.md landed there; no document builder reads the work plan, and an undetermined input holds the coverage gate shut, so nearly every PR would be blocked by a false alarm.
C. The review page lists the prediction but not rendered-measured.json: misses and not-base appear only in the PR comment, which A suppressed.

## Done when
- [ ] A dispatched run on a branch with an open same-repo PR uses that PR's number and base everywhere the pull_request run does, and comments on it.
- [ ] A changed file under no declared directory, no submodule, not .github/, and not a non-Markdown root file is an input that reaches no page; every other unplaced file stays undetermined; no declaration keeps today's behaviour.
- [ ] The review page shows the measurement: missed pages, not-base, or not measured, never silence.
- [ ] Tests for each; gates green.

Held by claude/laughing-ramanujan-uripip (session https://claude.ai/code/session_01HzVuZ2axYhgcko3rodMh2S).
