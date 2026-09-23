---
name: review-comments
description: >-
  Reviewer comments on a folio's edit-set, from a tagged pull-request comment
  to a structured todo on the review page. Covers the tag a reviewer types, how
  the comments are ingested into `folio-review-comment/v1` todos, where the
  published `review-comments.json` comes from and when it refreshes, how a
  comment follows a renamed block and survives a removed one, who may change a
  comment's status, and how to change this process. Use when a reviewer asks
  how to comment on a block, when the review page shows no comments or a wrong
  one, when editing the ingestion, or when a folio's staging workflow is set up.
capability: review
package: folio-core
user_invocable: true
allowed-tools: Bash(bun run folio-assistant-core/scripts/review-comments.ts*) Read Grep Glob mcp__github__pull_request_read
---

# Review comments — from a PR comment to a structured todo

> Skill id: `review-comments` · Capability: `review` · Package: `folio-core`
> Tool: `folio-review-comments` · Bean: `423d` · Epic: `q4jm`

A reviewer comments on **one block** of a folio by writing an ordinary comment
on the edit-set's pull request, starting with a tag that names the block. The
review process turns each tagged comment into a **todo of a special kind**,
`folio-review-comment/v1`. The review page lists those todos beside the
blocks they are about.

## The rulings this rests on

The owner decided three things on 2026-09-23, and each has a reason:

| ruling | owner's words | why |
|---|---|---|
| The channel is a **PR conversation comment tagged with the block label** | (option 1 of four) | Needs nothing installed, sits beside the approve, and is anchored by LABEL, so it survives a block moving. A line review comment is anchored to a file line and is lost when the block moves. |
| The record is a **todo subtype declared by core, in the dynamic KG** | *"reviewers comment in dynamic KG content. folio-asst-core should declare as special type of todo. more structured."* and *"more restruicted process use"* | A board, heat map or reader that understands todos reads a review comment without knowing about review. |
| The preview gets comments from a **file the workflow writes** | *"JSON is the todo kind? then yes do 1. make sure it is a Skill/Tool so process can be modified later."* | Works for private and public repositories, and no token ever reaches a browser. |

The first two rulings do not say how they fit together. Reading the PR comment
as the **write channel** and the todo as the **canonical record** is the
agent's reconciliation, recorded as such on bean `423d`.

## Writing a comment: the tag

Start a conversation comment on the pull request with header lines, then a
blank line, then what you want to say:

```
block: prose:overview
kind: defect
role: clinical-sme

The dose in the second sentence contradicts table 3.
```

| header | required | values | default |
|---|---|---|---|
| `block:` | yes | the block's label, exactly as the review page shows it | — |
| `kind:` | no | `question`, `defect`, `suggestion`, `editorial` | `question`, which asserts least |
| `role:` | no | the lane you are reviewing in, a role id from `roles.json` | `reviewer` |

- **The headers must be the very first lines.** The first line that is not
  `key: value` ends the header.
- **`block:` takes the rest of the line**, because labels contain colons
  (`prose:overview`). It must be ONE label.
- **A comment without `block:` is conversation**, not a review comment, and is
  left alone. A PR thread is also where people talk.
- **A malformed tag is reported, never dropped.** An unknown `kind`, or two
  words after `block:`, appears in `malformed` with the comment's link, so
  the reviewer can fix it.

The review page shows the exact `block: <label>` line for every changed
block, ready to copy, and links to the pull request. GitHub cannot pre-fill a
comment box, so copying the line is the one manual step.

## What a review comment IS

`folio-review-comment/v1`, in
`folio-assistant-core/schemas/review-comment.ts`. It is declared with
`nodeKind` (bean `a1lq`) and its one parent is the harness todo, which itself
is `carried-note` + `themed`. So it IS a todo:

- **`targetLabel` is required.** A general todo may float free; a review
  comment is always about one block.
- **`status` is closed**: `open`, `addressed`, `resolved`, `adjudicated`,
  `withdrawn`.
- **Everything review-specific sits under one field, `review`**: the
  repository, PR, comment id and URL, reviewer, role, kind, the block's
  content hash and the commit when ingested, `orphaned`, `anchoredFrom`, and
  the `decision` that closed it.

Keeping the review fields under one key means no field here can collide with
one a parent adds later, which is the collision `nodeKind` refuses at load.

## Who may change a status: only the process

A status moves only through `transition(comment, to, {process, task})`, and
only along a row of `REVIEW_TRANSITIONS`. Anything else throws.

| move | from | to | by (BPMN task) | needs a Decision |
|---|---|---|---|---|
| ingest | — | open | `Process_LargeDocumentReview#Task_IngestComments` *(awaits `en2d`)* | |
| address | open | addressed | `Process_Review#Task_EditorDecides` | |
| send back | addressed | open | `Process_Review#Task_EditorDecides` | |
| resolve | addressed | resolved | `Process_Review#Task_EditorDecides` | yes |
| adjudicate | open, addressed | adjudicated | `Process_Adjudication#A_RecordEntry` | yes |
| withdraw | open, addressed | withdrawn | `Process_LargeDocumentReview#Task_WithdrawComment` *(awaits `en2d`)* | |

**Why so strict.** A comment's status is what the coverage gate will count.
A comment closed by hand, outside the process, would count as reviewed when
nobody in a review lane decided anything.

Two rows name a diagram bean `en2d` has not authored yet, and say so in
`awaits` rather than pointing at a task that is not there. A test holds
every other row to a task that exists in its `.bpmn`.

## Ingestion: the Tool

```sh
bun run folio-assistant-core/scripts/review-comments.ts \
  --repo owner/name --pr 7 --out _site/review-comments.json \
  --folio folio --blocks-out _site/blocks.json \
  --existing <previous review-comments.json>
```

Declared as the Tool `folio-review-comments` in
`folio-assistant-core/tools/index.ts`, whose `satisfies` names this skill.

1. **Read the comments.** All pages of the PR's conversation comments, with
   `GITHUB_TOKEN` when set. `--comments <file>` reads them from a file
   instead, for offline runs and tests.
2. **Know the blocks.** Either `--folio <dir>`, which reads the manifests as
   text and executes nothing, or `--blocks <blocks.json>` from an earlier
   run.
3. **Keep everything already ingested.** Every comment in `--existing` is
   kept, status included. A comment's id is `review-pr<N>-c<commentId>`, so a
   re-run finds it rather than adding a second one.
4. **Add the new ones.** Each tagged comment not yet ingested becomes an
   `open` todo. A `defect` gets priority `high`; the others get `medium`.
5. **Re-anchor every comment** against the head's blocks
   (`reanchorToBlocks`):
   - the label is present: anchored;
   - a block lists the label in its `renamedFrom`: the comment moves to
     that block, and the old label goes into `review.anchoredFrom`;
   - neither: `orphaned: true`. **Kept and shown, never dropped.**
6. **Write `review-comments.json`**, `folio-review-comments/v1`. Its
   `comments` ARE the todo kind, each validated as one. The envelope adds
   only what one node cannot: provenance (`repo`, `pr`, `commit`,
   `generatedAt`), the `malformed` list, and the `untagged` count. So "no
   comments" and "comments nobody could parse" can be told apart.

**Why re-anchor against `renamedFrom` and not the ChangeSet.** A ChangeSet
compares against `main`. A block ADDED in the pull request and then renamed
inside it is "added" both times, so the comment made on its first label
would be orphaned. The block's own `renamedFrom` (bean `5xzc`, guarded by
`id-stable`) says where it came from whatever the base. `reanchor()` over a
ChangeSet also exists, for a caller that has only that.

## Publication: where the file comes from, and when

`folio-staging.yml` (the reusable workflow a folio calls) has two jobs:

| job | runs on | blocks from | what it writes |
|---|---|---|---|
| `stage` | the folio's pull request | `--folio`, the checked-out PR | the site, `changeset.json`, `blocks.json`, `review-comments.json` |
| `comments` | a new or edited PR comment containing `block:` | the published `blocks.json` | `review-comments.json` only |

**The `comments` job never checks out or runs the pull request's code.**
It is started by anyone who can comment, and it holds a token that can write
to the publish branch. Checking out a PR's code in such a job is the
well-known way to hand that token to a stranger. So it checks out only:
- the **platform**, at `platform_ref` (never a copy the PR carries);
- the **publish branch**, which holds only what earlier trusted builds wrote.

A comment body is parsed as data and never reaches a shell. The job also
skips bot comments, so the preview comment the workflow itself posts cannot
start it.

**Freshness.** A new comment appears on the page about a minute later, after
the `comments` job runs. A push rebuilds everything and keeps every comment.
Nothing refreshes on a comment when there is no preview yet (no
`blocks.json`), and the job says so rather than failing.

**The caller must opt in.** A folio's own workflow has to list
`issue_comment` among its triggers for the `comments` job ever to run.
`init-folio` writes that for a document folio.

## The review page

`review/index.html` in the preview reads `../review-comments.json` beside
`../changeset.json` when it is opened:

- each changed block lists its comments: kind, status, reviewer and role,
  the first line, and a link to the PR comment;
- a comment on a block this PR did not change is listed separately, since
  a review of a whole document comments on unchanged text too;
- **orphaned** comments are listed under their own heading, with the label
  they were made on;
- `malformed` tags are listed with their links, so the reviewer can fix them;
- every changed block shows its `block: <label>` line and a link to the PR,
  for writing a new comment;
- no `review-comments.json` means the page SAYS it has no comment data. An
  empty list would read as "nobody commented".

## Changing this process

That is why it is a Skill and a Tool rather than YAML steps. Where each kind
of change goes:

| to change | edit | and |
|---|---|---|
| the tag grammar | `parseReviewTag` in `schemas/review-comment.ts` | this skill's tag table; the tests |
| a status or who may move it | `REVIEW_COMMENT_STATUSES` / `REVIEW_TRANSITIONS` | the BPMN task it names; this skill's table |
| a field on the record | `ReviewFieldsSchema` | the page, if it shows it |
| what the ingestion does | `folio-assistant-core/scripts/review-comments.ts` | the Tool node's `io` if a flag changes |
| when it runs | `folio-staging.yml` and `init-folio`'s caller template | the trust notes above |

## Not yet decided

- **Where a status change is persisted.** The Tool keeps whatever
  `--existing` says, and `transition()` enforces the rules. But nothing yet
  writes a moved status back to a committed store. The candidates are the
  folio's own `todos` graph (canonical and committed, but a CI write to a PR
  branch) or the published file (easy, but not reviewed). This is the next
  decision on bean `423d`.
- **A reviewer who edits a comment after ingest.** The edit is not re-read, so
  a record an editor has already acted on is not silently rewritten. Whether
  an edit should reopen the comment is open.
- **Line review comments** are not read, by the owner's ruling. A reviewer
  who uses one gets no todo.
