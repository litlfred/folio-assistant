---
# folio-assistant-423d
title: 'REVIEW COMMENTS: anchored to block id as 9gyz Findings, surviving moves — and the write path a static page lacks'
status: todo
type: task
priority: normal
created_at: 2026-09-22T21:02:55Z
updated_at: 2026-09-23T06:15:45Z
parent: folio-assistant-q4jm
blocked_by:
    - folio-assistant-jwox
    - folio-assistant-a1lq
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
- [x] the owner has chosen the write path, recorded here with the reasons against the others (ruling below)
- [ ] comments are stored as Findings and survive a block move (test)
- [ ] the review page lists, filters and resolves comments, and resolution records a Decision


## Roast correction 2026-09-22 (epic q4jm, R2, R4)

- `QaReview.subject` is `{kind, id, path}`, and `Finding.subject` is a free string. **Neither carries a content hash or commit SHA.** The anchor needs a change to `cat-harness/schemas/qa-review.ts`, which is 9gyz's file: post intent naming that file before editing it.
- R2 settles less than 12's body claimed. PR-review approval cannot be given by the PR's author, and agent PRs are opened as the owner, so option A is not even the ACCEPT path for a single-owner folio.

## Owner ruling 2026-09-23: a PR conversation comment tagged with the block label

The owner was asked with four options side by side and chose **1**. A review comment is a **conversation comment on the edit-set's pull request**, carrying a machine-readable tag naming the block label, for example a first line `block: prose:overview`.
- **Writing.** The review page's per-block "comment" link opens GitHub's comment box on that PR, with the tag filled in. The reviewer needs a GitHub login.
- **Reading.** The page lists existing comments by reading the PR's comments and matching tags to blocks.

**Why this and not the others:**
- **A line review comment** is native, but anchored to a file line, so it is lost when a block moves.
- **The local MCP server** works only where someone runs it, and SMEs will not.
- **A committed review file** is durable, but makes every comment a commit.

The chosen path is anchored by LABEL, so it survives a move. That depends on `renamedFrom` (5xzc), which lets a comment on a renamed block be re-attached. It also sits beside the accept/approve on the same PR (q4cm).

**Still to design here:**
- **The tag's exact grammar.**
- **How the page finds the PR.** `staging.json` already carries the PR number and URL.
- **Private repositories.** Reading comments unauthenticated works only for public repos, so a private repo's review page needs another way.
- **A comment whose block was removed.** It is shown as orphaned, never dropped.

## Owner refinement 2026-09-23: a structured, process-restricted todo in the dynamic KG

Owner, verbatim: *"reviewers comment in dynamic KG content. folio-asst-core should declare as special type of todo. more structured."* and *"more restruicted process use"*.

**What that makes a review comment:**
- **Where it lives.** It is a node in the folio's dynamic KG content: the `todos` graph, whose layer is `state`, and which each folio reproduces (`dependents: reproduce`). It is not only a GitHub comment.
- **What it is.** A SUBTYPE of the existing todo (`TodoNodeSchema`, `folio-todo/v1`, in `cat-harness/schemas/todo.ts`), declared by **folio-assistant-core**. It carries its own tag, `folio-review-comment/v1`. Core extends the harness schema, which is the allowed direction.
- **More structured.** Fields a general todo leaves optional become required, and new ones are added:
  - `targetLabel`, the block (guarded by 5xzc);
  - the block's content hash and commit when the comment was made;
  - the edit-set PR;
  - the reviewer's role (reviewer, clinical-sme, qc-reviewer…);
  - a comment kind (question, defect, suggestion, editorial);
  - on resolution, a link to the 9gyz Decision that closed it.
- **Restricted process use.** Unlike a general todo, it is created and moved between states ONLY by the review process's tasks (en2d's BPMN). Its lifecycle is closed: open, then addressed, then resolved, adjudicated or withdrawn. A transition not made by a process task is refused.

**How it fits the earlier ruling (the PR comment).** The PR conversation comment stays the WRITE channel a reviewer uses: it needs nothing installed, and it sits beside the approve. The review process INGESTS each tagged comment into a review-comment todo, and the todo is the canonical, structured record that the review page and heat map read. **This reconciliation is the agent's reading of two rulings, not a third ruling. Correct it if wrong.**

**Revised Done when:**
- [ ] `folio-review-comment/v1` is declared in folio-assistant-core/schemas, extending `TodoNodeSchema`, with the required fields above
- [ ] the lifecycle is closed, and a transition made outside a review-process task is refused (test)
- [ ] a tagged PR comment is ingested into a review-comment todo, idempotently (re-ingest makes no duplicate)
- [ ] a comment whose block was removed is kept and shown as orphaned; a renamed block's comments follow `renamedFrom`
