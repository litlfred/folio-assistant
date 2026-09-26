---
# folio-assistant-iabf
title: Project-management dashboard maintained in the issue body
status: completed
type: task
priority: normal
created_at: 2026-09-18T16:15:27Z
updated_at: 2026-09-18T16:48:24Z
---

From #203 comment 5731858210 (2026-09-18 14:58).

A project-management dashboard maintained **at the end of the original issue
post** (the issue body, not a comment), so a folio's project manager gets
status at a glance.

Specified contents:
- **Issue Summary** — initial request plus bullets for each additional
  request, each with a status badge AND a narrative.
- **Status vocabulary**, as badge + description:
  `in progress` (work initiated by X at T, expected to finish …) ·
  `stalled` · `closed` · `completed` (no open sub-issues) ·
  `ready for review` (STAGING published with all current changes) ·
  `dirty` (feature-branch STAGING not fully rendered) ·
  `synchronized` (matches main, including rendering).
- **Level of effort** — completed and remaining.
- **Links to related issues.**

Updated by the coder once a batch of changes is published to STAGING.

Open question for the author: `dirty` and `synchronized` are derivable from
the staging workflow's output, `stalled` and level-of-effort are not. Decide
which fields an agent asserts vs computes before building, or the dashboard
will carry numbers nobody can check — the same failure as a QA icon over
fabricated data.

@ritikarawlani was asked in the same comment for how PM tooling is used;
that answer may change the shape of this.
