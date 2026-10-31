---
name: review-sheet-script
description: >
  Build, install and reuse the Google Apps Script that keeps a review sheet's
  links and joined columns current (Tool `review-sheet-sync`). Public-comment
  mode: comment numbers, sections, pages and lines link into the frozen review
  draft, and Review Change Sets joins its comments. Drafting mode: one
  Contributor Feedback tab where each row is a change set with its own GitHub
  issue, and Sections pick from the document's table of contents. Use when
  setting up either sheet for a document, when its links are missing or stale,
  or after a tab, header, anchor or draft link changes.
---

# The review sheet's Apps Script

The sheet itself, its tabs and who writes each column are the
[`public-comment`](public-comment.md) skill's (§"The live review sheet").
This skill is the script that keeps that sheet's links current, and the Tool
`review-sheet-sync` that builds it.

Links inside a cell's text (a section, a page, a "No. n" in a joined column)
cannot come from a formula: a formula makes at most one link per cell. They
are rich text, and rich text goes stale the moment the sheet changes. So the
sheet keeps them itself, with a Google Apps Script bound to it (owner,
2026-10-30: "Apps Script in the sheet"). Never paste them by hand from an
agent: it costs about 30 kB of tool output per 30 rows, and the next edit
undoes it.

**What it keeps current.** Columns are found by header text, so people may
move them.

| tab | column | becomes |
|---|---|---|
| Review Public Comments | No. | a link to the comment's page (`commentUrl` + its ref from Agent's *Comment ref*) |
| Review Public Comments | Sections | each section number, appendix, named section or chapter links to its first page in the draft |
| Review Public Comments | Page | each printed page or range links to that page |
| Review Public Comments | Agentic status | one line per pull request of the PC's change-sets (Agent's *Pull request (change set)*), `<repo>#n (status, completed) · what it changed` (the repository in the link text, because Sheets' link popup cuts the URL short): the PR linked; the PC's Agentic status and the matching line of *Agent completed (UTC, change set)* in bold; then the matching line of *What the PRs changed (change set)*. A PC in several change-sets lists all of their PRs, each once. With no PR, the status alone |
| Review Public Comments | Line no(s) / Table / Figure | each `p.N` and each `line(s) N–M` / `L N` links to its page. Draft line numbers restart, so a line is placed on the page, near the row's own pages, whose numbered lines hold it |
| Review Change Sets | Sections, Pages | the union over the change-set's comments, sorted by page, each linked |
| Review Change Sets | Agentic status | the same, per change-set; the status is its PCs' Agentic statuses, each once |
| Review Change Sets | Public Comments | `No. n (Status) · comment`, status in bold, joined by a blank line |
| Review Change Sets | Suggested Revisions, PC Architect Feedback, Dispositions | `No. n · text`, one per comment |

Every `No. n` in Review Change Sets links to `#gid=<Review Public Comments>&range=A<row>`.
Do not link to a named range by `#rangeid=`: Sheets shows "Invalid range"
for a named range whose id was set through the API.

**Build it.** From the folio's repository root, with the platform mounted:

```sh
bun run folio-assistant-core/tools/review-sheet-sync/build-review-sheet-script.ts --repo . --out Code.gs
```

`Code.gs` is not committed. It is rebuilt from the config, so attach it to
the thread or hand it over directly.

**Install it, once per sheet.** A person does this, from the sheet owner's
account, because Google asks the owner to authorise the script:

1. Open the sheet, then **Extensions → Apps Script**.
2. Replace everything in `Code.gs` with the built file, and save.
3. In the function list beside **Run** and **Debug**, pick
   **installTriggers** (not `onOpen`, which only adds the menu), and press
   **Run**. Allow access when asked.
4. Reload the sheet. A **Review links** menu appears.

`installTriggers` runs a full refresh, then installs two triggers: every edit
of the three tabs marks the sheet dirty, and every five minutes a dirty sheet
is rebuilt. **Review links → Refresh now** rebuilds at once.

**How to tell it works.** The first run of `installTriggers` takes about 20
seconds for 800 rows and its execution log ends "Execution completed" (a
one-second run means `onOpen` was picked). Then No. is a blue link, and
hovering a `No. n` on Review Change Sets shows a row such as A327. Failed
runs are listed with their error under **Executions** (the clock icon) in the
Apps Script editor. An agent checks from outside by reading a No. cell's
formula (`=HYPERLINK(…)`) and a joined cell's text-format runs.

**Protected columns.** The script runs as the account that installed it, so
it writes the grey and green columns even when they are protected, as long as
that account is an editor of the protected ranges. Install it from the
owner's account.

**Reuse it for another document's public comment.** Nothing in the template
names a document. Give the new folio:

1. The frozen review version in `library/<slug>/`, with its
   `pdf-line-map.json`, and the folio's `review-anchors.json` (the extraction
   described in `public-comment` §"The one fact everything rests on" makes both).
2. A `draft/` redirect on its site to the library viewer, or use the full
   viewer address as `draftUrl`.
3. `review/public-comment/sheet-sync.json`:

   ```json
   {
     "anchors": "folio/<doc>/review-anchors.json",
     "lineMap": "library/<slug>/pdf-line-map.json",
     "draftUrl": "https://<site>/draft/#page=",
     "commentUrl": "https://<site>/en/folio-assistant-core/public-comments/folio/<doc>/index.html#",
     "namedSections": { "CR": "Client Registry" },
     "aliases": { "how to use the guidance": "How to use this guidance" },
     "tabs": { "RPC": "Review Public Comments" },
     "columns": { "rpc": { "lines": "Line no(s) / Table / Figure" } }
   }
   ```

   `namedSections` lists the unnumbered sections reviewers cite by name, and
   their abbreviations, which are matched only in capitals. `aliases` gives
   other names for front-matter chapters. `tabs` and `columns` override the
   defaults in `build-review-sheet-script.ts` only where the new sheet's
   headers differ. The printed-to-PDF offset and the last printed page are
   read from the line map.
4. A sheet with the tabs above, Agent's *No.*, *Comment ref* and
   *Change-sets* columns filled, then build and install as above.

**Test it without a sheet.** `bun test folio-assistant-core/tools/review-sheet-sync/review-sheet.test.ts`
builds the script for a small fake folio and runs it against a fake of the
Apps Script services over the three tabs. It checks every link and join in
the table above, the Agentic status lines, and the edit-and-timer refresh. It
proves the template and the builder agree with this skill. It does not prove
a given sheet has the script installed or current: that is **How to tell it
works**. Change the template, the builder or this table only together with
that test.

**Rebuild and paste again** when the review anchors change, the draft link
moves, or a tab or a header the script reads is renamed. Renaming a header
the script reads, without rebuilding, leaves that column unlinked; it fails
nothing.

## Trusting the script

A copy of a sheet carries its Apps Script, so anyone starting from a
template, us or someone else, should know what they are running.

- **Nothing runs until the sheet's owner allows it.** Editors of the sheet
  never run it. The owner runs `installTriggers`; Google then shows the
  scopes and the triggers run as the owner.
- **This sheet only.** The template starts with `@OnlyCurrentDoc`, so the
  consent screen asks for "this spreadsheet", not all of the owner's
  spreadsheets. The script uses only SpreadsheetApp, PropertiesService,
  LockService and ScriptApp: no UrlFetchApp, mail or Drive, so it sends
  nothing out. The test fails if one of those appears.
- **Check a copy against its source.** The header names the
  folio-assistant-core commit it was built from. Build again at that
  commit with the folio's config and compare; or ignore the copied script
  and paste one you built yourself.
- **"Google hasn't verified this app."** Bound scripts are unverified, so
  the owner clicks Advanced to continue. Publishing as a verified Workspace
  add-on would remove the warning; not done while the users are our own
  sheets.

## Drafting mode: editors' and contributors' feedback

Before a document goes to public comment, editors and contributors give
feedback on the working draft (owner, 2026-10-30, for dth-hrh). That needs a
simpler sheet: no Public Comment Source, no Review Public Comments, no TWGs.
Each row of feedback *is* a change set (CS: a list of related comments on one
topic), and each change set gets a GitHub issue.

**Tabs.**

| tab | who writes | columns |
|---|---|---|
| **Contributor Feedback** | people, plus the Apps Script | one row per change set. Grey, mechanical: **Change-set** (the script gives a used row the next `CS-nnn` once; it stays with the row). Blue, people: **Title** (human-controlled), **Sections** (a multi-select dropdown of the document's table of contents; the script links each choice to its place on the document page), any number of **Contributor Feedback** columns (each contributor signs with initials). Orange: **Ready for agent**, **Ready for merge** (Yes/No, editors). Green, from Agent by the script: **Issue** (`<repo>#n`, linked), **Agentic status** (as in public-comment mode: one line per PR, `<repo>#n (status, completed) · what it changed`) |
| **Agent** | the agent only | one row per change set: Change-set, Issue (URL), Agentic status, Pull request (change set), What the PRs changed (change set), Agent completed (UTC, change set) |
| **TOC** (hidden) | the script | the Sections dropdown's list and each entry's link. Rewritten on every refresh, so it follows the document |

Colours as in public-comment mode: grey mechanical, blue human, orange
editor gates, green agent-derived.

**Table of contents.** Built from the folio's `review-anchors.json`: each
chapter (`Ch 3 Digital Transformation Approach`), each numbered section
(`3.1 DIIG alignment`) and each unnumbered section, prefixed by its chapter
(`Ch 3 · Objectives and key messages`). A multi-select cell joins its choices
with `, `, so commas in titles become `;`. Each links to
`sectionUrl` + the anchor (`sec:3-1`, `chap:<dir>`), which the document page
carries as element ids.

**Config**, `review/drafting/sheet-sync.json`:

```json
{
  "mode": "drafting",
  "anchors": "folio/<doc>/review-anchors.json",
  "sectionUrl": "https://<site>/en/<doc>/#"
}
```

`tabs` and `columns` (`draft`, `draftAgent`) override the headers as in
public-comment mode. Build with `--config review/drafting/sheet-sync.json`
and install as above. The Sections dropdown is a data validation "dropdown
from a range" on `TOC!A2:A` with **Allow multiple selections** ticked; set it
once in the template (the Sheets API cannot tick that box), and copies keep it.

**The agent's part: every change set has an issue.** On each sync, for every
Contributor Feedback row with a Change-set:

1. If the Agent tab has no row for it, add one (Change-set, Agentic status
   `Not started`).
2. If that row has no Issue, open a GitHub issue in the folio's repository:
   title `CS-nnn: <Title>` (or the first feedback line while Title is
   empty), body the linked sections, every Contributor Feedback cell
   verbatim, and a link back to the sheet row. Write its URL into Issue.
3. When feedback is added to a row later, comment the new text on its issue.
4. Work a change set only when **Ready for agent** is Yes; its PRs say
   `Closes #n` for the change set's issue, and go to Agent's PR columns.

Title stays the contributors': the agent never writes it (in public-comment
mode, by contrast, Review Change Sets' Title is agent-derived and green).

**Feedback from the site.** A folio with
`.github/ISSUE_TEMPLATE/block-feedback.yml` (copy the shared
`templates/issue-forms/block-feedback.yml`) gets 📣 feedback links that open
that form with Content, Section, Block, page and Source prefilled; the
contributor picks a Type and writes Comment and Proposed change. On each
sync the agent lists open issues labelled `feedback` that no Agent row
names, and for each appends a Contributor Feedback row from
`tools/review-sheet-sync/feedback-issue.ts` (`feedbackRow`): Sections the
block's TOC entry, Title a draft (`<section>: <first sentence>`, which
people may rewrite), Contributor Feedback `@login (Type): comment` plus
`Proposed: …`. The script then gives it a CS id, and the agent writes the
issue's URL into that change set's Agent row: the feedback issue *is* the
change set's issue, so step 2 above opens none. A comment added to the
issue later is added to the row's next empty Contributor Feedback cell.

**Linked templates.** Each mode keeps one template sheet in the
informatics.avengers Drive, laid out as above, script installed, no rows.
A new document starts from its "make a copy" link
(`https://docs.google.com/spreadsheets/d/<template id>/copy`); then replace
the config block of Code.gs with the new folio's build and run
installTriggers.

| mode | template (owned by informatics.avengers) | make a copy |
|---|---|---|
| public-comment | Folio Assistant - Public Comment Review Template, `14PtLd2U_tBQV5OHoEEVRJK1EKfsbZEBPP_MIqo2E3o4` | https://docs.google.com/spreadsheets/d/14PtLd2U_tBQV5OHoEEVRJK1EKfsbZEBPP_MIqo2E3o4/copy |
| drafting | Folio Assistant - Contributor Template, `1PtcNJgLQIA1BjapU51pAQzqQjGylBHYNKlCPzZkwVag` | https://docs.google.com/spreadsheets/d/1PtcNJgLQIA1BjapU51pAQzqQjGylBHYNKlCPzZkwVag/copy |

A copy keeps tabs, colours, dropdowns and formulas. It does not keep
protected ranges (re-add them: Agent whole tab; the grey and green
columns), and its TOC tab is empty until the script's first refresh. A
document's own sheet is named in its `sheet-sync.json` as `sheet` (the
spreadsheet id), so the agent's sync knows where to read and write.
