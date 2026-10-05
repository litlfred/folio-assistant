---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: 'public-comment'
parent: Skill instructions
---

{: .note }
> Generated from [`folio-assistant-core/skills/content/folio-document-adapter/public-comment.md`](https://github.com/litlfred/folio-assistant/blob/main/folio-assistant-core/skills/content/folio-document-adapter/public-comment.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/folio-assistant-core/skills/content/folio-document-adapter/public-comment.md){: .fa-edit-source }

{% raw %}
# public-comment

> Skill id: `public-comment` · Package: `folio-document-adapter` · Process:
> `folio-assistant-core/processes/content/public-comment.bpmn`
> (`Process_PublicComment`) · Tool: `folio-assistant-core/scripts/public-comment.ts`
> · Schema: `folio-assistant-core/schemas/public-comment.ts` · Bean `v26p`,
> issue #197.

Run a **public review** of a document folio. A frozen, line-numbered draft goes
out. Comments come back as spreadsheets, form exports, letters and GitHub
comments. Each comment is placed on the block it is about, triaged, weighed by
a review committee and decided by an editor. Where a decision changes the
document, the change lands on a feature branch whose staging preview shows the
text before and after.

## The one fact everything rests on: a comment cites the REVIEW VERSION

A reviewer writes "§3.4.5, p.22, l.618–624". Those numbers exist only in the
PDF the reviewer read. Word computes pages and lines at layout time and stores
neither. Once an editor changes the folio, the numbers no longer describe the
current text.

So the review version is frozen in the library, and the folio is extracted from
it in two halves:

1. `docx-structure.py` reads the **structure** from the .docx: headings, lists,
   tables, figures, footnotes, call-out boxes.
2. `pdf-line-map.py` reads the **page and line** of every item from the
   line-numbered PDF, by matching letters only. A miss is reported, never
   guessed.
3. `docx-to-folio.ts` writes the editable folio. Every block's `meta.source`
   records its page, printed page and lines. `review-anchors.json` is the same
   index in one file, which is what the importer reads.

**Never regenerate the folio over editors' work.** `docx-to-folio.ts` refuses
a non-empty folio without `--force`. The anchors keep resolving after edits,
because they point at the frozen version, not at the current text.

Read the alignment stats (`pdf-line-map.json` → `stats`) before trusting a
comment's anchor. On the DPI-H draft, 97% of text items aligned to exact lines.
The `unaligned` rest are listed by method, not hidden.

## Intake: one store, four routes, nothing dropped

| route | command | anchor comes from |
|---|---|---|
| comment matrix (.xlsx) | `import <file>` | section, page, line or Table/Figure columns |
| online-form export (.csv) | `import <file> --channel online-form` | the same columns, per row |
| narrative letter or email | `import-narrative <file> --reviewer …` | section, page/line, table or quotation in each paragraph |
| committee or editor on GitHub | the `github` job, from an issue or PR comment | the `pc:` reference |

### A consolidated review log

A secretariat often keeps one workbook for the whole review: a master log, a
tab per large submission, and a contributors sheet. `import` reads **every**
sheet that holds a comment table, records the sheet on each comment, and
passes over a blank template tab. Pass `--series <id>` naming the log. A copy
re-sent later is a different file holding the same rows, and each comment
carries the log's own row number ("No."), so a re-import adds only the rows
it has not seen.

What the log already says is carried, not re-done:

- **Status.** "Accepted", "Partially accepted", "Not accepted", "Noted" and
  "Deferred" arrive *decided*, with the log's disposition as the reason and
  `review-log` as who recorded it. "Reviewed" arrives *triaged*. A refusal
  with no rationale arrives triaged and is listed as held, because the
  commenter is owed a reason.
- **Categorisations.** Theme, stakeholder type, committee routing, a review
  question or priority ("Q9 - Conformance and testing", "P1") are kept in
  `labels`, verbatim and keyed by the column header. The three comment types
  stay `type`.
- **Consent.** Read from the contributors sheet by name, and only the name
  and consent columns are read. "NAIR, Tapas" and "Tapas Nair" are one
  person.

Rules that are not negotiable:

- **A row that resolves to nothing is `unplaced`, not dropped.** Triage places
  it (`triage <ref> --to <label>`) or leaves it as a general comment.
- **A narrative is split only where it cites something.** Paragraphs that cite
  nothing stay together as ONE general comment. Inventing an anchor for them
  would put a reviewer's words on a paragraph they never mentioned.
- **Re-importing a file is a no-op.** Batches are keyed by sha256.
- **Privacy.** The reviewer's email is never written, and an address typed
  into a comment's text is removed too. Their name is written
  only when they answered the acknowledgement question "Yes". Keep the
  original spreadsheets OUT of the folio's repository, because they hold
  emails. Record the batch, and keep the file in the review owner's private
  store.

## Placing a comment: how much to trust the anchor

`anchor.method` says how the place was found, and `confidence` says how far to
trust it:

- `caption` (high): "Table 3.1" named a captioned block.
- `page` (medium or low): a page with no usable line. A lines cell such as
  "Requirement 5" or "A14.01" names an item, not a line, so it is not read
  as one. Lands on the page's first block in the cited section.
- `page-line` (high, when the cited section agrees): the page is read as the
  **printed** page first, then as the PDF page index. Printed numbering restarts
  in the front matter, so the cited section breaks ties. "Section does NOT
  agree" in `anchor.note` is a triage signal. Check the comment.
- `quote` (medium or low): a quotation found in the text. Low means it occurs
  more than once. The other places are in `candidates`.
- `section` (medium): only the section resolved, by its number or by its
  title or acronym ("PHSP" is the Public Health Surveillance Platform). The
  anchor is the section label.
- `manual`: a person placed it with `reassign`.

## The lifecycle, and who moves it

`received → triaged → assigned → recommended → decided → editing → incorporated`, plus
`duplicate` and `withdrawn`. Every move is a task in `public-comment.bpmn`.
`transition()` refuses any other move. Do not edit a comment's `status` by
hand: the dashboard counts statuses, and a hand-closed comment reads as
adjudicated when no one decided it.

| who (role) | does | how |
|---|---|---|
| intake agent (`intake`) | propose change-sets, one issue each ([below](#the-agent-proposes-people-group)) | `public-comment-changesets.ts` |
| review coordinator (`review-coordinator`) | triage, place, mark duplicates, assign | `triage`, `reassign`, `duplicate`, `assign` |
| committee and editor | agree each change-set's requirements, and regroup it, on its issue | the issue thread, and its body's `pc:` line |
| committee member (`reviewer`) | recommend a decision, with a rationale | a GitHub comment `pc: PC-0042` / `recommend: accepted-modified`, or `recommend` |
| editor (`editor`) | decide, with a reason unless accepted | `decide: …` on GitHub (editors only) or `decide` |
| author (`author`), human or agentic | once a comment is dispensed with a changing decision, make the edit on a feature branch | `edit <ref> --branch … [--to <login>]` |
| pipeline (`build-pipeline`) | build the change set's staging preview, mark it incorporated on merge | staging workflow, `incorporate` |

Who can move a comment from GitHub. Both roles are read from the repository
itself by default (owner, 2026-10-05), so nobody maintains a list:

- **Editor: the repository's owner.** Only the editor decides.
- **Committee: the repository's collaborators** (owner, member or
  collaborator). Adding someone as a collaborator on GitHub is the whole
  on-boarding.

GitHub marks every comment with the commenter's relationship to the
repository, and that mark is what is checked. An `editors` or `committee` list
in `config.json` replaces that role's default with exactly those logins.
Anyone may *discuss* a comment there, but the record is not open to everyone.

The five decision codes (owner, 2026-10-04): `accepted`, `accepted-modified`,
`not-accepted`, `noted`, `deferred`. Every code but `accepted` needs a reason,
because the commenter is owed one.

## Change-sets: an issue to agree it, a PR to approve it

One editorial change often answers several comments, and one comment sometimes
needs several changes. So a comment belongs to **zero or more change-sets**
(`public.issues`), and a change-set is two GitHub objects with different jobs
(owner, 2026-10-05):

| object | what people do there |
|---|---|
| **the change-set ISSUE** | discuss and agree the *requirements*: what the document should say, which comments the change answers |
| **the PR that closes it** | preview the change on staging, review it, approve the merge to `main` |

Requirements argued on a PR get lost when it is closed and reopened; a diff
argued on an issue has nothing to point at. Keep each on its own object.

### The agent proposes; people group

`Task_ProposeChangeSets` (intake agent) then `Task_GroupChangeSets`
(committee). An agent may draft **every** change-set, but each one is a
*proposal* until people have discussed it on its issue. Tool:
`folio-assistant-core/scripts/public-comment-changesets.ts`.

1. `seed --out seed.json` lists the open comments that are not yet in any
   change-set, bucketed by section. **A bucket is not a change-set.** One
   section's comments usually ask for several different changes, and one
   change (a term used throughout, say) spans sections.
2. Read the buckets and decide the changes. One change-set is **one change a
   reviewer can approve or refuse as a whole**. Good signs: the comments ask
   for the same edit, or for edits that must land together. Bad signs: the
   title needs "and", or the requirements list unrelated edits.
3. `add --title … --requirements … --refs PC-0001,PC-0007 [--anchor <label>]`
   records each proposal as `changesets/CS-NNN.json`. Write the requirements as
   what the text must do ("define *actor* once, in 2.1, and use it
   consistently"), not as the new text itself: the text is the PR's job.
4. `body CS-001` renders the issue: requirements, the `pc:` line, and a table
   of the comments with deep links. Open the issue with that body (through
   the GitHub tools, by a person, or by a workflow). The tool holds no token.
5. `link CS-001 --issue 42` records the issue on the change-set and on each
   comment.

A comment the agent cannot place in a change-set is left out, not forced in.
It stays on the dashboard's **open, no change-set** tile, where a person can
pick it.

### People regroup on the issue

- **The issue body's `pc:` line is the membership.** When the committee or the
  editor edits it, the record follows it exactly. Anyone else's edit is
  refused, as for a `recommend:` from someone outside the committee.
- **Recommend or decide the whole set at once**: a comment `pc: #42` then
  `decide: accepted` (or any code) applies to every comment in issue 42.
- **Start a change-set by hand** from the dashboard. Tick the comments and
  press *Open a change-set issue for the selected comments*.
- Merging, splitting and closing an agent's proposals is ordinary work here,
  not a correction.

### The PR

1. Branch from `main`, named for the change. Open the PR at the first commit
   ([`continual-progress`](continual-progress.md)),
   with `Closes #42` in its body.
2. Opening (or editing) the PR moves the issue's **accepted** comments to
   *editing*, with the branch and PR recorded. Comments not yet decided, or
   decided `not-accepted`/`noted`/`deferred`, do not move.
3. Edit the folio's blocks. An agent in the `author` role edits only what the
   decision and the issue's requirements say.
4. The staging preview is published to `STAGING/<branch>/`. The dashboard links
   each comment's anchor on `main` (before) and on the preview (after). See
   [`staging-review`](staging-review.md).
5. Merging moves those comments to *incorporated*. A PR closed without merging
   moves nothing back or forward.

These moves come from the folio's `public-comment.yml` workflow listening to
`issues` and `pull_request` events, as well as `issue_comment`. The CLI
`edit` and `incorporate` still work for a change made outside a PR.

This is the same review loop as any content change
(`content-change-review.bpmn`), with a different intake. Reuse it rather than
building a parallel review.

## What not to do

- Do not answer a comment by editing the review version in `library/`. It is
  frozen, and every anchor depends on it.
- Do not re-anchor by renaming a block. Labels are the anchors. A block that
  is split or merged records its old label in `renamedFrom`.
- Do not put a decision in a commit message only. The comment record is the
  record. A commit is evidence.
{% endraw %}

## Processes that run this skill

This skill has its own process: **[Public comment on a review draft](../../processes/public-comment.html)**.

<img src="../../assets/img/workflows/public-comment.svg" alt="BPMN diagram: Public comment on a review draft" style="max-width:100%">

| process | step(s) that name it |
|---|---|
| [Draft, review and publish](../../processes/draft-to-publication.html) | Public comment on the review version (calls a sub-process) |
| [Public comment on a review draft](../../processes/public-comment.html) | Ingest and place each comment; Triage: confirm the anchor, type and priority; Propose change-sets, one GitHub issue each; Agree each change-set's requirements on its issue; Assign to committee members; Recommend a decision, with a rationale; Decide, weighing the recommendations; Edit the document as decided, on a feature branch; Mark incorporated when the change set merges; Record the withdrawal |

