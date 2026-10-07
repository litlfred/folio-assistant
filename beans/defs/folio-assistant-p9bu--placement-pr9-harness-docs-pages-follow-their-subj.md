---
# folio-assistant-p9bu
title: 'Placement PR9: harness docs pages follow their subject to the owning instance'
status: in-progress
type: task
created_at: 2026-10-01T06:58:01Z
updated_at: 2026-10-06T06:56:20Z
parent: folio-assistant-iirv
blocked_by:
    - folio-assistant-63wl
    - folio-assistant-apcg
---

Placement proposal §2 (owner rulings 2026-09-30 §6; process: review → resolve issues → staged PRs). Parent of PR0/PR1 is `9umr`; PR2–PR9 sit under the separation epic because D4 (owner, 2026-10-01, option 3) interleaves them with the split stages into one ordered sequence. Every PR: references move with the subject; generated trees regenerated, never hand-edited; `beans/**` not rewritten; kg-qa sidecars RELOCATED (identity-checked), never deleted without the owner (`deletion-requires-confirmation`).

PR9 (follow-up): harness docs-folio pages about moved processes follow their subject — `guides-writing-a-paper` (44) → sci; `guides-who-smart-dak` (17), `guides-who-smart-ig` (23), `ig-publisher` (20), `fhir-content` (20) → smart-base / fhir-harness; `guides-writing-a-document` (43), `content-types` (32), `evidence` (29) → core; `document-ingestion` (38) split per §3. Under `1g4s` a dependent's `docs/` is a named member of `docs`, so nothing leaves the site.

Blocked by PR3 and PR6 (the processes these pages document must have moved).

## Done when
- [ ] `docs:pages:check` and `translated-links:check` green
- [ ] the published site's page count is unchanged

_2026-10-06T06:56:20Z_ — Claimed by claude/docs-follow-subject-p9bu — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).
