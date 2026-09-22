---
# folio-assistant-423d
title: 'REVIEW COMMENTS: anchored to block id as 9gyz Findings, surviving moves — and the write path a static page lacks'
status: todo
type: task
priority: normal
created_at: 2026-09-22T21:02:55Z
updated_at: 2026-09-22T21:04:32Z
parent: folio-assistant-q4jm
blocked_by:
    - folio-assistant-jwox
---

Owner: *"and then manage review comments etc."*

**The real obstacle, measured.** `docs-ui.js` states it outright: *"A
published page cannot write back to the repo"* (lines 2077 and 2592). The
review page is static on gh-pages, so "manage comments" needs a WRITE PATH,
and choosing it is the owner's decision:

| option | anchors to | cost |
|---|---|---|
| A. GitHub PR review comments | a line of a `.ts` manifest | exists today; the anchor is a file line, so a comment is lost when a block moves |
| B. a GitHub issue or discussion per review, one comment per block | the block id, in a comment body | exists; the id convention is ours to parse |
| C. the local MCP server (`--http`, `feedback.ts`) | the block id | works only where a reviewer runs the server, and SMEs will not |
| D. the review record committed as data (via a PR the page opens) | the block id | durable and auditable; each comment is a commit |

**Whichever write path is chosen, the model is the same.** A review comment IS
a 9gyz `Finding`: anchored to (block id, content hash, commit SHA), with
states open → resolved | adjudicated. Disagreement goes to `adjudication.bpmn`
(7pdi). It is **not** a parallel comment type. It re-anchors across renders
through `renamedFrom` (child 01), and a comment whose block was removed is
shown as "orphaned", never dropped.

**Relations.**
- v1hw: "the first WRITABLE surface". Whichever ships first sets the
  precedent for the other.
- 6lb8 / z1ug: stickies. Should a review comment render as a sticky?
- todo-review: feedback triage.

## Done when
- [ ] the owner has chosen the write path, recorded here with the reasons against the others
- [ ] comments are stored as Findings and survive a block move (test)
- [ ] the review page lists, filters and resolves comments, and resolution records a Decision


## Roast correction 2026-09-22 (epic q4jm, R2, R4)

- `QaReview.subject` is `{kind, id, path}`, and `Finding.subject` is a free string. **Neither carries a content hash or commit SHA.** The anchor needs a change to `cat-harness/schemas/qa-review.ts`, which is 9gyz's file: post intent naming that file before editing it.
- R2 settles less than 12's body claimed. PR-review approval cannot be given by the PR's author, and agent PRs are opened as the owner, so option A is not even the ACCEPT path for a single-owner folio.
