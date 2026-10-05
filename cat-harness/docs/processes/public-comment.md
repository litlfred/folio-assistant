---
title: 'Public comment on a review draft'
nav_exclude: true
---

{: .note }
> Generated from `folio-assistant-core/processes/content/public-comment.bpmn` by `gen-processes-viz.ts` — do not edit here. [All processes](index.html)

{% raw %}
# Public comment on a review draft

`Process_PublicComment` · strict · 11 step(s)

A frozen, line-numbered draft went out for public review. This is what
happens to ONE comment that comes back: placed on the block it cites,
triaged, weighed by the review committee, decided by the editor and, if
the decision changes the document, made on a feature branch whose
staging preview shows the text before and after. The change set is
reviewed by the same process as any content change
(Process_ContentChangeReview); only the intake is new. Skill:
public-comment.

<img src="../assets/img/workflows/public-comment.svg" alt="BPMN diagram: Public comment on a review draft" style="max-width:100%">

## How it connects

- **Called by:** [Draft, review and publish](draft-to-publication.html)
- **Calls:** [Content Change and Review](content-change-review.html)
- **Presented on:** no docs page section shows this diagram
- **Skill:** [`public-comment`](../reference/skill-instructions/public-comment.html)

## Lanes — who acts

| lane | role | what it does here |
|---|---|---|
| Public commenter | `feedback-provider` | Outside the folio: returns comments on the review version through a matrix, a form or a letter, and may withdraw one at any time. Never moves a comment past received; everything after that is the review's. |
| Intake agent | `ingestion-agent` | Turns each returned row, form response or cited passage into one comment and resolves its anchor through the review version's page/line map. A citation that resolves to nothing is kept as unplaced, never dropped. |
| Review coordinator | `review-coordinator` | Owns triage: confirms or moves each anchor, sets type and priority, closes duplicates, routes plain editorial points straight to the editor, and assigns the rest to committee members. |
| Review committee | `reviewer` | Recommends, does not decide: each member records one recommendation with a rationale, on GitHub or through the tool, and a later one replaces their earlier one. The editor weighs them. |
| Editor | `editor` | The one lane that decides. Every decision carries one of five codes and, for every code but accepted, a reason the commenter is owed. A decision that does not change the document ends here. |
| Author (human or agentic) | `author` | Once the editor has dispensed a comment with a decision that changes the document, an author makes the edit: a person, or an agent acting in the author role. The edit is made on a feature branch, which may carry the edits for several comments, and recorded on each comment it answers, so a comment shows where its change is being made while it is made. |
| Change set — feature branch and staging | `build-pipeline` | Where the author's edit is reviewed and lands: the feature branch's staging preview gives before/after deep links to each comment's anchor, the change set is reviewed as any content change, and each comment it answers is marked incorporated when it merges. |

## Steps

Every one of the 11 step(s) is documented.

| step | lane | skill / sub-process | what it does |
|---|---|---|---|
| **Ingest and place each comment**<br>`Task_Ingest` | Intake agent | [`public-comment`](../reference/skill-instructions/public-comment.html) | public-comment import / import-narrative: one record per row or cited passage, anchored through review-anchors.json. Status: received. |
| **Triage: confirm the anchor, type and priority**<br>`Task_Triage` | Review coordinator | [`public-comment`](../reference/skill-instructions/public-comment.html) | public-comment triage / reassign / duplicate. An unplaced or low-confidence anchor is placed here, by a person. |
| **Propose change-sets, as records with no issue yet**<br>`Task_ProposeChangeSets` | Intake agent | [`public-comment`](../reference/skill-instructions/public-comment.html) | public-comment-changesets seed / propose: the agent groups the comments to be weighed into change-sets, one per change the document may need, each a record under changesets/ with its requirements and members. A PROPOSAL: nothing is decided, no GitHub issue is opened, and a comment may sit in zero, one or several change-sets. The record is the only one; everything shown about a change-set is rendered from it. |
| **Agree each change-set's requirements on its issue**<br>`Task_GroupChangeSets` | Review committee | [`public-comment`](../reference/skill-instructions/public-comment.html) | A change-set gets its primary GitHub issue the first time somebody engages with it (the Discuss form, a recommendation or decision on one of its comments, a mention, a PR), opened by the folio's public-comment workflow; any number of other issues may discuss it and are linked. People agree the requirements there, and the committee or editor changes the record with cs-add / cs-remove / cs-title / cs-requirements / cs-merge / cs-split / cs-close / cs-new. The issue's change-set section is rendered from the record and put back if hand-edited; the nightly reconcile keeps every issue in line. The issue is for requirements; the PR that closes it is for preview, review and approval. |
| **Assign to committee members**<br>`Task_Assign` | Review coordinator | [`public-comment`](../reference/skill-instructions/public-comment.html) | public-comment assign: by GitHub login. A committee member who recommends on an unassigned comment is assigned it as they do. |
| **Recommend a decision, with a rationale**<br>`Task_CommitteeRecommends` | Review committee | [`public-comment`](../reference/skill-instructions/public-comment.html) | A GitHub comment tagged pc: PC-0042 / recommend: code, from a login in config.json committee, or public-comment recommend. |
| **Decide, weighing the recommendations**<br>`Task_EditorDecides` | Editor | [`public-comment`](../reference/skill-instructions/public-comment.html) | public-comment decide, or decide: code on GitHub from a login in config.json editors. accepted, accepted-modified, not-accepted, noted, deferred; a reason for all but accepted. Also reopens a decided comment. |
| **Edit the document as decided, on a feature branch**<br>`Task_AuthorEdits` | Author (human or agentic) | [`public-comment`](../reference/skill-instructions/public-comment.html) | public-comment edit --branch: the author (human, or an agent in the author role) edits the folio's blocks as the decision says, on a feature branch for one change-set. Its PR says Closes #N for the change-set issue, and opening it moves that issue's accepted comments to editing. |
| **Review the change set on its staging preview**<br>`CallActivity_ChangeSet` | Change set — feature branch and staging | calls [Content Change and Review](content-change-review.html)<br>[`staging-review`](../reference/skill-instructions/staging-review.html) | The existing content-change review, unchanged, of the author's branch: its PR lists the PC refs it answers, and its staging preview is the after side of every deep link. A change the reviewers send back returns to the author inside that process. |
| **Mark incorporated when the change set merges**<br>`Task_Incorporate` | Change set — feature branch and staging | [`public-comment`](../reference/skill-instructions/public-comment.html) | public-comment incorporate, naming the branch, PR and staging URL; done by the folio's workflow when the PR that closes a change-set issue merges. A PR closed unmerged moves nothing. |
| **Record the withdrawal**<br>`Task_Withdraw` | Public commenter | [`public-comment`](../reference/skill-instructions/public-comment.html) | public-comment withdraw, from any open status. |

## Decisions

**2** of 2 decision(s) carry no documentation — `gateway-documented` lists them.

| decision | what decides it | branches |
|---|---|---|
| **Duplicate, plain editorial, or to be weighed?**<br>`Gateway_Triage` | — | **duplicate** → Closed as a duplicate<br>**to be weighed** → Propose change-sets, as records with no issue yet<br>**plain editorial** → Decide, weighing the recommendations |
| **Does the decision change the document?**<br>`Gateway_ChangesDocument` | — | **no: not accepted, noted, deferred** → Decided, answer recorded<br>**yes: accepted** → Edit the document as decided, on a feature branch |

{% endraw %}
