---
# folio-assistant-en2d
title: 'PROCESS: large-document-review.bpmn composing staging, review-task, adjudication and a coverage gate — and whether editor already is the coordinator'
status: todo
type: task
priority: normal
created_at: 2026-09-22T21:02:55Z
updated_at: 2026-09-22T21:04:31Z
parent: folio-assistant-q4jm
---

Owner: *"process, roels ... integrate into current processes"*.

**Roles, measured 2026-09-22.** `roles.json` already declares reviewer,
editor, narrative-reviewer, qc-reviewer, clinical-sme, adjudicator,
feedback-provider and stakeholder. `.claude/skills/actors/` adds
technical-officer and content-reviewer. **No new review role is obviously
needed.** The candidate is a **review coordinator**: somebody who slices the
document, assigns slices and watches coverage. Test whether `editor` already
IS that lane before adding one. The role-model skill says to add a role only
for a lane no existing role binds.

**Process.** `large-document-review.bpmn` in `cat-harness/processes/`. It
composes existing diagrams rather than restating them:
1. `feature-staging.bpmn` deploys.
2. ChangeSet (child 02), plus the QA sweep including the id criteria (child 01).
3. The coordinator slices and assigns.
4. `review-task.bpmn`, called per slice, in parallel lanes by role.
5. Findings → `adjudication.bpmn` on disagreement.
6. A coverage gate (DMN: every changed block has a verdict, or is waived with
   a reason).
7. `content-change-review` / `draft-to-publication` sign-off.

Every activity carries `<folio:skill ref>` and `<folio:bean>`, per
`bpmn-processes`.

**Integration points to edit:**
- the `staging-review` skill emits the review/ link;
- the `diff` skill reads the ChangeSet;
- `prepare-merge` reports coverage;
- CRDM Phase 6 names the review page as the thing a reviewer opens;
- lx2s's missing "BPMN for the review SOP" is **this diagram**. Close that
  box there when it lands.

## Done when
- [ ] the diagram renders (`render:bpmn:check`) and runs via workflow_start/next/complete on a fixture
- [ ] the coverage gateway is DMN-backed
- [ ] the role question is answered: `editor` reused, or `review-coordinator` added with a lane it binds
- [ ] the four integration edits have landed, and lx2s is updated


## Roast correction 2026-09-22 (epic q4jm, R3)

`content-change-review.bpmn` already carries "Compare main vs staging", "Deploy to STAGING/<slug>/" and a Review Committee lane. **Extend it rather than drawing `large-document-review.bpmn`**: add a sliced-review sub-process and the coverage gateway at "Compare main vs staging". Also split its single **"Approve and merge"** task into approve (q4cm's tool) and merge (the existing explicit-confirmation step). Today it fuses them.

- [ ] "Approve and merge" is split into two tasks

## Task ids the review-comment lifecycle already names (423d, 2026-09-23)

`REVIEW_TRANSITIONS` in `folio-assistant-core/schemas/review-comment.ts` names
two tasks in the diagram this bean authors. They are marked
`awaits: "en2d"`:

- `Process_LargeDocumentReview#Task_IngestComments`: tagged PR comments
  become review-comment todos;
- `Process_LargeDocumentReview#Task_WithdrawComment`: a reviewer withdraws
  one.

Author them with these ids, or rename both sides together. Then remove
`awaits`, and the existing test will hold the ids to the BPMN.
