---
# folio-assistant-w6fu
title: 'Visualiser follow-ups: disabled kg-viewer language switcher, library title extraction'
status: in-progress
type: task
tags:
    - wireframe-findings
    - ui
created_at: 2026-10-02T09:01:57Z
updated_at: 2026-10-02T09:01:57Z
parent: folio-assistant-4ccr
---

Follow-up to beans `gnqa` (library) and `yhcq` (kg-viewer), stacked on PR #1839. Owner rulings 2026-10-02 on issue #1838:

1. Library cover size stays 34×46 — no work.
2. **kg-viewer language switcher: shown, DISABLED**, so readers see translations are planned while every catalogue is empty. Accessible: visible reason, `aria-disabled`, an explanation reachable by keyboard and tap (not hover-only), ≥24px targets. A catalogue that gains content enables its locale with no code change.
3. **Library titles of entries with no catalogue record: both, in order** — (a) improve PDF title extraction in the ingest path (PDF `Title` metadata, first-page largest-font heading, the document outline, before raw text; never guess — no trustworthy source keeps the raw title, marked unverified), measured before/after over every library entry; (b) whatever is still wrong is fixed as data in that entry's own metadata, as a recorded editorial correction with its basis.

Claimed by claude/visualiser-followups (session https://claude.ai/code/session_01CVVoavPoCHMLA7AASxG8cH) — issue #1838.

## Done when
- [ ] kg-viewer draws a disabled switcher listing the planned languages, with a visible, keyboard- and tap-reachable reason; e2e covers it and the enable-on-content path
- [ ] the ingest path resolves titles from corroborated sources and marks the rest unverified; before/after counted over every entry
- [ ] remaining bad titles corrected as data, one entry at a time, each with its basis
- [ ] before/after screenshots at 1280×800 and 390×844 committed and shown in the PR
