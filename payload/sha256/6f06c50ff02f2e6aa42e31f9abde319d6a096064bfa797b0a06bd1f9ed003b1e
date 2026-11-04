---
name: review-sheet-agent-columns
description: >
  Whenever an agent works on a change set of a folio whose review sheet is
  kept by the Tool `review-sheet-sync`, it writes the Agent tabs' columns for
  that change set and its comments as it goes: status, step, what it did,
  the PR, the staging page and its build, what the PR changed and when it
  finished. Use on every change-set edit, draft, PR, push, merge or close,
  in a sheet sync or not.
---

# Keep the review sheet's Agent columns current

The owner's rule, 2026-10-31: "if agent works on a CS via google sheet Tool
is enabled for PC, then it updates the necessary columns". It is part of the
process, not a courtesy at the end. The sheet's views (Agentic status,
Staging review and the ⏳ line on Review Public Comments and Review Change
Sets, or on Contributor Feedback in a drafting sheet) are built from the
Agent tabs, so a change set worked without writing them shows reviewers
nothing, or shows them something old as current.

The tabs, their columns and who writes each are the
[`public-comment`](public-comment.md) skill's (§"The live review sheet")
and, for a drafting sheet, [`review-sheet-script`](review-sheet-script.md)
§"Drafting mode". How the script reads them, and the tool that makes the
cells, are `review-sheet-script`'s ("Stale staging previews", "Checked by
commit", "Writing the Agent tab with the tool", "Where the agent is"). This
skill says **when** the agent writes and **what**.

## When it applies

The folio has the Tool enabled: it carries the Tool's config,
`review/public-comment/sheet-sync.json` (a drafting sheet:
`review/drafting/sheet-sync.json`), and the session can reach the sheet
through a Google Sheets connector. The sheet's id is not in the repository;
it is given by the project (its scheduled sheet-sync task, or the owner).

It applies to **any** work on a change set, however it started: a sheet
sync, a card, a thread message, an issue or a review comment on the PR. If
the Tool is enabled but the sheet cannot be reached, do the work, and say in
the reply that the sheet was not updated and why.

## The tabs

- **Agent - Comments** (public comment only): one row per comment (No.),
  with Agentic status, Agentic action taken, Agentic applied in, Agentic
  handled by, Agentic date actioned and Change-sets.
- **Agent - Change Sets** (a drafting sheet: **Agent**): one row per change
  set, with Pull request, Staging review page, What the PRs changed, Agent
  completed, Feedback basis, Staging built, PR head, Staging built from,
  Staging deploy and Agent step (each header ends "(change set)").

An older public-comment sheet may still have the one `Agent` tab (comments
left, change sets right, the Config's `AGENT_CS` empty). Write it the same
way, by header.

## When to write

Write as each step completes, not once at the end. Times, heads and steps
come from `bun run folio-assistant-core/tools/review-sheet-sync/agent-record.ts`,
never typed.

| step | per comment (Agent - Comments) | per change set (Agent - Change Sets) |
|---|---|---|
| work starts | Agentic status *Working* | Agent step `reading` (`agent-record.ts step reading`) |
| proposing, editing | | Agent step `proposing` or `editing` |
| PR opened, or a push to it | *PR open*; action taken, applied in, handled by, date actioned | Pull request, Staging review page, What the PRs changed; PR head, Staging deploy and Agent completed from `agent-record.ts push`; Agent step `pushing` |
| preview on gh-pages, then live | | Staging built from, Staging built; Staging deploy `pushed`, `deploying`, `deployed`; Agent step `staging`, `deploying` |
| Ready for agent acted on, no new commit | date actioned | Agent completed from `agent-record.ts done` |
| blocked on a decision | *Needs human*, and what is needed in action taken | Agent step `idle` |
| ready for review | *Ready for review* | Agent completed; Agent step `qa-review` or `idle` |
| merged | *Change merged* | clear the Staging review page (a merged branch's preview 404s); Agent step `idle` |
| closed unmerged | *Not started*, and say so in action taken | remove that PR's line from Pull request, What the PRs changed, Agent completed and PR head; Agent step `idle` |

A disposition for the change set is written only from
`agent-record.ts dispositions` (`review-sheet-script`, "Writing the Agent
tab with the tool").

## What to write

- **Re-read the headers first.** People move columns. Find each column by its
  header, never by a letter remembered from an earlier run.
- **Write only the Agent tabs.** Every other tab is people's, or formulas, or
  the Apps Script's. The exceptions are the agent's own Green feedback
  column (`review-sheet-script`) and an explicit instruction from the owner
  for a named cell.
- **Per comment** (every PC in the change set): Agentic status; Agentic
  action taken (what was done, in a sentence); Agentic applied in (the
  sections or blocks changed); Agentic handled by (the agent and its
  session); Agentic date actioned (`YYYY-MM-DD HH:MMZ`, UTC, from the clock).
- **Per change set:** Pull request (one PR URL per line); Staging review
  page (`STAGING/<slug>/en/review/` while the PR is open); What the PRs
  changed (one line per PR, in the same order as the URLs: what that PR
  changes in the document, in a reader's words); Agent completed and PR
  head (one line per PR, same order). A change set may have several PRs, and
  a line in any per-PR column always matches the line of its URL in Pull
  request.
- **Staging built** and **Staging built from**: when, and from which commit,
  the preview was last built, read from the newest gh-pages commit under
  `STAGING/<slug>/`. Write them on every rebuild. The script compares them
  with Agent completed and PR head and flags a preview built before the last
  push as stale.
- **Agent step**: write `idle` (or the next step) before leaving a change
  set. A step left behind shows "no update for N min" on the sheet.
- **Append, never reorder.** A change set new to the tab goes at the end.
  Review Change Sets' typed columns sit beside rows derived from it, so
  moving a row moves people's inputs onto the wrong change set.
- **No reviewer names or emails** anywhere the agent writes, in the sheet or
  in the repository. Name feedback by tab, row and column header.
- **Only a PR that edits the document** for the change set goes in Pull
  request (public-comment §"Which PR counts").

## Checking it

After writing, read the change set's row on Review Change Sets (or
Contributor Feedback) back. Once the Apps Script has refreshed (within five
minutes of an edit), its Agentic status shows
`<repo>#n (status, completed) · what it changed` for each PR, and Staging
review shows no ⚠ unless the preview really is behind. A missing or wrong
line there means an Agent cell is missing or out of step.
