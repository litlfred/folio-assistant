---
# folio-assistant-v26p
title: 'PUBLIC COMMENT: tabular comments returned on a line-numbered draft, mapped by page and line to block ids, then triaged, reassigned and dispensed as Findings'
status: todo
type: task
priority: normal
created_at: 2026-09-22T21:09:45Z
updated_at: 2026-09-22T21:09:52Z
parent: folio-assistant-q4jm
blocked_by:
    - folio-assistant-5xzc
---

Owner, issue #197 (2026-09-17), *"prepare also for draft publication review processes: a fixed version (rendered PDF version w/ line numbers) goes out, then people return with excel/csv/tablular data of comments and feedback that needs to be reviewed and dispensed with"*, and it asks for *"show all comments that are on a page, at a line number, re-assign a comment to a more appropriate place, triage a comment, assign a comment to another collaborattor"*, plus *"update the bpmn diagrams to show more detailed \"Public Comment\" workflow"*.

Found by the q4jm roast (R9). The plan as first written had only in-page comments (423d) and missed the SME and public-consultation path, which is how DAK and L1 review is actually run.

**What.**
- **A frozen draft**: a rendered PDF with line numbers, and a **page/line → block id map** emitted at render time and committed with the draft's tag.
- **Import**: CSV/XLSX rows (page, line, commenter, text) become Findings (9gyz) anchored to block ids through that map. A row that maps to no block is kept as "unplaced", never dropped.
- **Operations**: list by page, line or block; reassign to another block; triage; assign to a collaborator; dispense with a Decision and its reason (adjudication, 7pdi). Each is a Tool node.
- **Process**: a Public Comment sub-process in the lifecycle diagram (en2d), with where it sits between draft and publication.
- The review/ page and the heat map (txut, qbfi) show imported comments beside in-page ones: **one Finding store, two intake routes**.

The page/line provenance for INGEST is xtpc (the other half of #197).

## Done when
- [ ] a line-numbered draft render emits the page/line → block map
- [ ] a CSV and an XLSX of comments import as Findings, with unplaced rows kept
- [ ] the five operations are Tool nodes, each with a test
- [ ] the Public Comment sub-process is in the lifecycle BPMN, and #197 is updated each round
