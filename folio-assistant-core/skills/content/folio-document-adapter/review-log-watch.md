---
name: review-log-watch
description: >
  Poll a review log (a drafting Contributor Feedback sheet, or a
  public-comment sheet's Review Change Sets) and its folio repository's
  issues mechanically, with Tool `review-log-watch`, and
  start agent work only when a cell people set or an open issue changed.
  Each issue that no row links yet becomes a Contributor Feedback row, and a
  closed issue's row is hidden with its text struck through.
  Use on every wake of a review-log watcher, and when setting up a watcher
  for a new log.
---

# Review-log watch

A review log is a drafting or public-comment sheet (skill
[`review-sheet-script`](review-sheet-script.md)) for one folio repository.
The steps below are for a drafting log; a public-comment log differs as
set out in "Public-comment logs". A
watcher is the agent thread that keeps it moving. This skill is what the
watcher does on each wake. Process:
[`processes/content/review-log-watch.bpmn`](../../../processes/content/review-log-watch.bpmn)
(checklist beside it).

## Why mechanical

The watcher runs a core tool on every poll, and each issue gets a row on
Contributor Feedback, including existing issues; a closed issue's row is
hidden, its text struck through. The poll wakes the watcher thread every 3
minutes. Until the tool says `changed`, the watcher only reads and runs the
tool. It does not reason about the rows, edit anything or post anything.

## Each wake

1. **Read** two small ranges:
   - `Watch!F1:I1`, where the sheet script writes `Cells hash`, the hash
     itself, and the time it last checked. The script rewrites it on every
     refresh and every timer tick, from the cells people set.
   - Contributor Feedback's header row with its Change-set and Issue
     columns (A to K), so the tool can give a new row the next Change-set id.

   Save the values as JSON, with the header row and with an empty first row
   for each sheet row above it, so the row numbers stay the sheet's. A sheet
   whose script has no Watch tab yet is read whole, from row 1, and gets no
   `--sheet-hash`.
2. **Check**:

   ```
   bun run folio-assistant-core/tools/review-log-watch/watch.ts \
     --repo litlfred/dth-phc --sheet values.json \
     --state ~/.cache/review-log-watch/<sheet-id>.json \
     --sheet-hash <Watch!G1>
   ```

   - Exit 0 is `{"status":"unchanged"}`. Queue the next wake and stop.
   - Exit 10 is `changed`. The output has `changes` (an issue opened, updated
     or closed, or a cell's old and new text) and `append`.

   **Inserted rows.** People may insert a row anywhere. The state keys each
   cell by its row's Change-set id (`CS-004:Ready for agent`), and by sheet
   row only for a row with no id, so an insert moves no change set and
   reports nothing. A cell change carries `cs` and the row it is on now. Every
   row number in the output (`changes[].row`, `closedRows`) is from this
   read, so write only from the read you just checked, never from a row
   number kept from an earlier check.
3. **Append** each `append[].row` below the last row of Contributor Feedback.
   The row is already lined up with the header:
   - **Change-set:** the next id, also in `append[].agent.csId`.
   - **Title:** the issue's title.
   - **First Contributor Feedback column:** `@login (#N): first paragraph`.
   - **Issue:** the issue's URL.

   The issue's Markdown is turned into plain cell text: a `[label](url)`
   shows its label, and bold, italic and code marks are dropped. Its links
   are in `append[].links` (the column and each link's start, end and URL).
   Write the cell with those as `textFormatRuns` (`updateCells`), so each
   link is clickable.

   Then write `append[].agent` to the **Agent** tab as a new row: its
   Change-set and Issue columns. The script fills Contributor Feedback's
   Issue column from the Agent tab, by Change-set, on every refresh, so an
   Issue written only on Contributor Feedback is cleared on the next
   refresh.

   Every other cell stays empty. This tool is the only thing that adds issue
   rows, so nobody adds them by hand.
   A row with `closed: true` is appended like the others and then treated as
   in step 4.
4. **Closed issues.** Hide each row in `closedRows`, plus the rows just
   appended for closed issues, and strike its text through. Hiding and
   striking are formatting only, so the row's text and history stay. A
   reopened issue's row is shown again, without the strike-through, by hand.
5. **Agent pass.** Run [Contributor feedback](../../../processes/content/contributor-feedback.bpmn)
   on each changed row, and record the step on the Agent tab at once. A
   Ready for agent = Yes gets its edit, and a Ready for merge = Yes gets its
   merge. A Blue answer to a Decision needed question is taken up.

   **Feedback on every Blue change and every new row.** In every log the watcher keeps, the agent writes or rewrites
   Feedback (agent), in the layout of `review-sheet-script` ("The agent's
   feedback cell has a fixed layout"), for each row that:
   - is new, however it got there: from a GitHub issue (step 3), typed by a
     person, or copied from a TWG workbook;
   - has an empty Feedback (agent) cell; or
   - has Blue cells (Title, Selected Sections, any Contributor Feedback
     column, Disposition) that no longer match the Agent tab's Feedback
     basis (`feedbackBasis()`), which is when the script shows "⚠ Stale".
   It does this in the same wake, before accepting the state. A row it cannot
   finish keeps its stale mark and comes back on the next wake. The digest
   covers every row, not only issue rows, so a row with no issue still wakes
   the watcher.
6. **Accept.** Run the check again with the same inputs plus `--accept`, so
   the state file records what was handled. A row the pass could not finish
   still differs from the stored state, so it comes back on the next wake.
7. Queue the next wake.

## Public-comment logs

A log whose Config has `MODE` `public-comment` has Review Public Comments,
Review Change Sets, Agent - Comments and Agent - Change Sets instead of
Contributor Feedback and Agent. The watcher runs the same check, with these
differences:

- **Hash.** `Watch!G1` covers the cells people set on both people's tabs:
  on Review Change Sets Title, TWG (CS), every Committee Feedback column,
  Ready for agent, Dispositions confirmed, Ready for merge and Change Set
  (human); on Review Public Comments every Committee Feedback column,
  Disposition, Change Set (human) and TWG (human). Lines are keyed by
  Change-set id and comment No., so an inserted row changes nothing. The
  script writes it on every refresh, and the timer refreshes only after an
  edit or an Agent tab change, so `Checked (UTC)` can be old on a quiet
  sheet.
- **Read.** Review Change Sets' header row and Change-set column, as
  `--sheet`. It has no Issue column, so the tool tracks only issues
  labelled `change-set` (`--label` overrides) and appends no rows: each open
  one comes back as an `issue-unlinked` change. Handle those as in "Change
  sets people make" below.
- **Without a Watch tab**, read Review Change Sets whole. The tool then
  compares its cells itself; Review Public Comments' cells are seen only
  through the hash.
- **Steps 3 and 4** (append, hide closed rows) do not apply. The agent pass
  of step 5 is the change-set work of
  [Public comment](../../../processes/content/public-comment.bpmn).

## Lint each poll

After the change check, run
`bun tools/review-log-watch/lint.ts --feedback <Contributor Feedback values.json> --agent <Agent values.json>`.
It reads
each Agent row's pull requests from GitHub and prints, per change set, what
breaks the feedback layout in `review-sheet-script` ("The agent's feedback
cell has a fixed layout"):

- Needs human with no `Decision needed:` question, or a question without
  Needs human;
- the question not first, fewer than two lettered options, no single
  `(recommended)`, or no line saying where to answer;
- history in the cell (`Decided`, `Step n`, `Already done`), Markdown `**`,
  more than 10 lines;
- a PR that GitHub says is merged or closed while the Agent tab's status
  still says open;
- feedback on a row with no Selected Sections and no question asking which,
  or a PR that changes a chapter outside the Selected Sections without an
  `Outside the selected sections:` line.

Exit 0 is clean. Exit 10 lists problems: the watcher fixes the Agent tab
status or rewrites the cell to the layout in the same wake, and records the
Agent step. The lint writes nothing itself.

## Previews follow main

A preview is built from its pull request's head, so once main moves on, a
branch that lacks main's head shows a document main no longer is. The
watcher brings main into every open change-set branch.

**Modes.** The log's Config tab may hold a `PREVIEW_REFRESH` row:

- `automatic` (the default, also when there is no row): on every poll,
  whether or not a cell changed, check every open change-set PR. A move on
  main changes no cell, so the change check alone would never wake it.
- `on-feedback`: only in the agent pass for a change set people acted on.

**People's feedback triggers it in either mode:** new or changed Blue
feedback on the change set, Ready for agent set to Yes, or feedback that asks,
such as "update the preview" or "rebase on main"
(`bun tools/review-log-watch/previews.ts request --text <feedback>`).

**Each check:**

1. Run `bun tools/review-log-watch/previews.ts --agent <Agent values.json>`
   for every open change set, or `--prs owner/repo#n,...` for one. It prints
   `merge-main`, `resolve-conflict` or `none` for each PR. Exit 0 means
   current; exit 10 lists the work.
2. For `merge-main`: merge main into the branch (a merge commit, never a
   rebase or force-push), regenerate generated files with the repo's own
   tooling, push, and record the push with the agent-record tool. The sheet
   then shows the preview as stale until the new build is live.
3. For `resolve-conflict`: resolve it when both sides are generated or
   mechanical. When a person must choose, ask in the change set's feedback
   cell (a `Decision needed:` question) and leave the branch as it is.
4. This only brings main into the branch. Committee content is never merged
   into main by the watcher. Closed PRs and PRs from forks are skipped.

## Change sets people make

People make change sets, the way they open issues; how one came about does
not matter once people have adjudicated it. On a public-comment log the
watcher finds four kinds of request on each poll, and answers each in the
same wake:

- **A row with only a Title** on Review Change Sets. The sheet script gives
  it the next Change-set id. The watcher adds the matching row on Agent -
  Change Sets (same id and Title) and a change-set record, and proposes a
  direction in Change Set Feedback (agent), as for any change set.
- **A `change-set` issue** (form `templates/issue-forms/change-set.yml`,
  label `change-set`). `bun tools/review-log-watch/cs-requests.ts issue --body <file>`
  reads its fields. For "New change set" the watcher adds the Agent - Change
  Sets row, and the script then adds the Review Change Sets row with that
  Title. Split, merge and move go as below.
- **Feedback that asks for it**, e.g. "this CS needs to be split". Run
  `bun tools/review-log-watch/cs-requests.ts request --text <the person's feedback>`
  on every changed feedback cell; only the person's words, never the agent's
  or the script's lines. For a split, merge, move or new request, write a
  `Decision needed:` question naming the change sets and which comments go
  where, with lettered options and one recommended. Make them only once an
  Editor sets Ready for agent to Yes.
- **Change Set (human)** on Review Public Comments: a person typed another
  change set's id, several ids, or `new`. The script already counts the
  comment in its new change set; the watcher records the move on Agent -
  Comments (Change-sets) and on the change-set records, and for `new` makes a
  change set for the comment and proposes a Title.

**Triage each new comment.** A comment with no change set yet gets the
agent's suggestion: run `cs-requests.ts triage --input <json>` with the
comment's sections and the open change sets (id, sections, TWGs, status). It
ranks the open change sets that share its sections and always offers `new`.
Write the first as the comment's Change-sets on Agent - Comments and its
committees as TWG (agent). These are suggestions: a person's Change Set
(human) or TWG (human) always wins, and the watcher never overwrites a Blue
cell.

**Sheet comments.** People without edit rights use Insert, then Comment.
Neither the Sheets API nor the script reads those comments yet, so the
watcher does not see them; ask the person to copy the request into a
feedback cell, or open the change-set form.

## What counts as a change

- **Issues:** the repository's issues, open and closed, with their state and
  `updated_at`. `--author <login>` keeps only the issues one person opened.
  - Pull requests are left out.
  - So are issues labelled `no-sheet`, which an Editor sets to keep an issue
    off the sheet.
- **Cells:** with `--sheet-hash`, the script's hash stands for them, and a
  change shows as one change on `#hash`; the watcher then reads the rows to
  see which changed. Without it, the tool compares the cells itself. Either
  way, only the cells people set count, under these headers:
  - Title, Selected Sections, every Contributor Feedback column,
    Disposition and Change Set (human) (Blue);
  - Ready for agent, Ready for merge and Dispositions confirmed (Orange);
  - on a public-comment log also every Committee Feedback column, TWG (CS),
    TWG (human) and Change Set (human).

  The agent's Green columns and the script's Grey ones are not watched, so
  the watcher's own writes never wake it.
- **First check (`baseline: true`):** with no state file yet, every issue
  counts as new and every unlinked issue gets a row. This is how an existing
  sheet takes in its existing issues. The watcher appends the rows, hides the
  closed ones and accepts, but starts no agent pass, because a cell that is
  merely seen for the first time has not changed.

## Setting up a watcher

A log is not set up until a watcher has both of these wakes:

- a chain of **3-minute** delayed wakes (`send_later`), each of which queues
  the next;
- an hourly scheduled task that restarts the chain if it breaks.

Keep the state file outside the repository, one per sheet. Without it, a fresh
container treats its first check as a first check: it reports every issue as
opened, and appends rows only for issues that no row links yet.

## Limits

- The tool reads one tab and one repository, from the issues API (up to 100
  issues a page, every page). It never writes the sheet or
  GitHub.
- The summary is the issue's first paragraph, cut to 300 characters. A link
  the cut runs through keeps its target on the part that is left.
  Committee members may rewrite the Title and their own column.
