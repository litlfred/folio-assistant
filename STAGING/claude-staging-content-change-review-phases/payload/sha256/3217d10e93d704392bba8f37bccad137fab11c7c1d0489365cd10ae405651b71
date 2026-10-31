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
| Review Change Sets | Agentic status (filter) | one plain value per change set, for a filter view (owner, 2026-10-31): "Needs human" if any of its comments needs a person, else the least advanced of its comments' Agentic statuses (Not started, Working, PR open, Ready for review, Change merged); "Not in comment record" only when all are |
| Review Change Sets | Public Comments | `No. n (Status) · comment`, status in bold, joined by a blank line |
| Review Change Sets | Suggested Revisions, PC Architect Feedback, Dispositions | `No. n · text`, one per comment |

**Architect Feedback (agent)** (Review Change Sets, green, right of Ready for
merge; owner, 2026-10-31). The agentic architect role writes its proposed
direction for resolving the change set here, so the architects and editor
react to a proposal rather than drafting from nothing. The script does not
touch it. It is a proposal, never a person's feedback: a tool that collects
the people's `Architect Feedback (…)` columns by header must leave out
`(agent)`, or show it apart, and it decides nothing.

Every `No. n` in Review Change Sets links to `#gid=<Review Public Comments>&range=A<row>`.
Do not link to a named range by `#rangeid=`: Sheets shows "Invalid range"
for a named range whose id was set through the API.

**One script, one Config tab per sheet** (owner, 2026-10-31, option C).
`Code.gs` is the same file for every document: `review-sheet.gs`, stamped
with its commit and made plain ASCII. Nothing about a document is in it.
What differs per document lives in the sheet's **Config** tab: visible,
locked to the sheet's owner, columns Key and Value, rows `CFG`, `COLS` and
`DATA`, each JSON with a leading `|` (so Sheets never reads it as a number
or formula), a long value continued on the next rows under the same key.
`DATA` explains itself in its `ABOUT` entry. In public-comment mode it holds
`SECTIONS` (each section the comments can name: key → [name shown, PDF
page]), `ABBREVIATIONS` (short names such as HWR → a section key),
`PAGE_LINES` ([PDF page, first line, last line]), `PAGE_OFFSET` (PDF page =
printed page + this) and `LAST_PAGE`. In drafting mode it holds `TOC` (the
dropdown: [name shown, anchor]). A Config written before 2026-10-31 used the
short names `K`, `ABBR`, `LP`, `OFFSET` and `MAX`; the script still reads
them.

```sh
# the script, once per platform version
bun run folio-assistant-core/tools/review-sheet-sync/build-review-sheet-script.ts --script Code.gs
# one document's Config rows, from the folio's repository root
bun run folio-assistant-core/tools/review-sheet-sync/build-review-sheet-script.ts \
  --repo . --config review/public-comment/sheet-sync.json --out config-rows.json
```

The agent writes `config-rows.json` into the Config tab (A1 down, columns A
and B, clearing rows below) with the Sheets connector, which runs as the
owner, and keeps the tab protected so only the owner can edit it. CFG and
COLS, which a person might edit by hand (a URL, a tab or column renamed),
are indented JSON, cut into cells between lines, and column B wraps;
DATA, generated from the folio and never edited by hand, stays compact
(owner, 2026-10-31). The script joins a key's cells and parses them, and
JSON ignores the line breaks. Neither
file is committed: both are rebuilt.

**Install it, once per sheet.** A person does this, from the sheet owner's
account, because Google asks the owner to authorise the script:

1. Open the sheet, then **Extensions → Apps Script**.
2. Replace everything in `Code.gs` with the built file, and save. Code.gs
   is the only file to paste: leave the project's manifest as it is.
3. In the function list beside **Run** and **Debug**, pick
   **installTriggers** (not `onOpen`, which only adds the menu), and press
   **Run**. Allow access when asked.
4. Reload the sheet. A **Review links** menu appears.

`installTriggers` runs a full refresh, then installs two triggers: every edit
of the three tabs marks the sheet dirty, and every five minutes a dirty sheet
is rebuilt. A drafting sheet rebuilds **incrementally** (owner,
2026-10-31): an edit rebuilds only the rows it touched, at once, so a pick
shows its link and a new row its Change-set within seconds, however large
the sheet. The 5-minute trigger rebuilds only the rows whose change set's
Agent row changed (the agent writes through the API, which fires no edit;
the script keeps a short hash per change set to notice). A new table of
contents in Config, an edit of the header row, or Refresh now rebuilds
everything. A public-comment sheet rebuilds whole, since a comment feeds its
change sets: at once while a rebuild takes under 5 s, otherwise gathered for
the 5-minute trigger. **Review links → Refresh now** rebuilds at once.

**Stale staging previews** (owner, 2026-10-31, option C: sheet and page).
The agent records when it built a change set's preview in the Agent tab's
**Staging built (UTC, change set)**, beside **Agent completed (UTC, change
set)**. When a PR of the change set was completed after the build, the
script writes the Staging review cell as `review ⚠ stale: built <time>,
PR changed since`, in both modes (Review Change Sets takes the link from the
Agent tab's Staging review page (change set) where it names one). Without a
build time it claims nothing. The preview page shows its own live banner too
(the site's staging build, cat-harness-tools).

**Stale agent proposals.** `Contributor Feedback (agent)` (drafting) and
`Architect Feedback (agent)` (Review Change Sets) carry the agent's proposal.
The agent records what it wrote against in the Agent tab's **Feedback basis
(change set)**: `feedbackBasis()` in `tools/review-sheet-sync/feedback-issue.ts`,
a hash of the row's blue cells (drafting: Title, Selected Sections, people's
Contributor Feedback; public comment: Title, TWG (CS), people's Architect
Feedback). The script computes the same hash; while they differ it puts
"⚠ Stale: the row changed since this proposal; the agent will propose
again." on the proposal's first line, and takes it off if the row changes
back. The agent's next sync replaces the proposal and the basis.

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
     "draftUrl": "draft/#page=",
     "commentUrl": "en/folio-assistant-core/public-comments/folio/<doc>/index.html#",
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

**Rewrite the Config tab** when the review anchors change, the draft link
moves, or a tab or a header the script reads is renamed. Re-paste Code.gs
only when the script itself changes. Renaming a header the script reads,
without rewriting Config, leaves that column unlinked; it fails nothing.

## Sheet conventions (any agent-written Google Sheet)

These hold for every Google Sheet an agent writes or keeps current, not only
the review sheets (owner, 2026-10-31):

| colour | who controls it | lock |
|---|---|---|
| grey | mechanical: ids, headers, copied source text | owner only |
| blue | people: the human-controlled columns | open to the sheet's editors |
| orange | editor gates (Ready for agent, Ready for merge) | its own lock, owner plus the named editors |
| green | agent-derived: links, joins, status | owner only |

- **Templates** are locked to the owner except the blue columns; the orange
  gates carry their own lock that starts with the owner alone.
- **The Config tab** is visible, never hidden, and locked to the owner: the
  agent writes it, people can read what the sheet is set up for.
- **Which template** depends on the document's authoring stage: the
  Contributor template while it is being drafted and authored, the Public
  Comment Review template once public comment opens.

## Published with the document's site

`scripts/review-sheet-site.ts --out <site>` (package script
`site:review-sheet` in a folio, a `sourceSteps` entry of its site build)
writes `<site>/review-sheet/`: the generic `Code.gs`,
each `review/<mode>/sheet-sync.json` as `<mode>.config-rows.json`,
`review-sheet.jsonld` (the script as `schema:SoftwareSourceCode` with its
SHA-256 and commit; each document's settings as a `schema:Dataset` linked
to its sheet and to the Tool), and an `index.html` with the setup steps and
the SHA-256 to check a pasted copy against. Point people there rather than
sending the file.

## Trusting the script

A copy of a sheet carries its Apps Script, so anyone starting from a
template, us or someone else, should know what they are running.

- **Nothing runs until the sheet's owner allows it.** The owner runs
  `installTriggers`; Google then shows the scopes, and the triggers run as
  the owner, whoever's edit fires them. So an editor's edit makes owner
  code read what they typed: the script therefore never writes typed text
  as a formula (`asText`, `q`), and touches only this sheet.
- **Security review.** [`tools/review-sheet-sync/security-review.md`](../../../tools/review-sheet-sync/security-review.md)
  (2026-10-31) records the threat model and findings F1 to F10, each fixed
  with a test or accepted with its reason. Re-review on any new write sink,
  service, or editor-writable tab.
- **The agent caps new issues** (finding F6): it opens a change set's
  issue only for a row with a Title or feedback text, and asks a person
  before opening more than 20 in one sync.
- **This sheet only.** The template starts with `@OnlyCurrentDoc`, so the
  consent screen asks for "this spreadsheet", not all of the owner's
  spreadsheets. The script uses only SpreadsheetApp, PropertiesService,
  LockService and ScriptApp: no UrlFetchApp, mail or Drive, so it sends
  nothing out. `review-sheet-security.test.ts` fails if one of those, or
  `eval`/`new Function`, appears.
- **Three permissions, one file** (owner, 2026-10-31: "why do we need two
  files?"). Google works out a script's permissions from its code, and
  `@OnlyCurrentDoc` narrows the spreadsheet one to this sheet. So the consent
  screen asks for exactly three: this spreadsheet, the script's own
  triggers, and its menu. `tools/review-sheet-sync/appsscript.json` records
  those three for the security test, which fails if the code would need
  more. It is a record, not a file to paste.
- **Plain ASCII.** The built script escapes every non-ASCII character, so a
  paste cannot mangle it. The build prints its SHA-256; compare it with the
  pasted copy.
- **Wrong sheet.** Pasted into a sheet it was not built for, it stops with a
  message naming the config and tab it expected, before installing triggers.
- **Check a copy against its source.** The script is the same for every
  document, so one review covers all copies. Its header names the
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
| **Contributor Feedback** | people, plus the Apps Script | one row per change set. Grey, mechanical: **Change-set** (the script gives a used row the next `CS-nnn` once; it stays with the row). Blue, people: **Title** (human-controlled), **Selected Sections** (a multi-select dropdown of the document's table of contents, each section indented under its chapter by three U+2800 blanks per level, since a dropdown cannot nest (owner, 2026-10-31; a "└ " mark was tried first and found too cluttered); not real spaces, because Sheets trims a multi-select cell and the first chip would lose them and read as Invalid; it stays plain, because a dropdown chip cannot carry a link), any number of **Contributor Feedback (…)** columns, one per contributor, with their initials or name in the brackets (e.g. `Contributor Feedback (CL)`); the script reads every column whose header is `Contributor Feedback` or starts `Contributor Feedback (`; **Disposition** (a dropdown: Pending, Accepted, Partially accepted, Not accepted, Noted, Duplicate, Out of scope; owner, 2026-10-31), the committee's verdict on the row. Orange: **Ready for agent**, **Ready for merge** (Yes/No, editors). Grey, mechanical, by the script (owner, 2026-10-31): **Section links** (each selected section on its own line, linked to its place on the document page, like the Sections column of the public-comment log; it is mechanical, a copy of Selected Sections with links, so grey, not green). Green, by the agent: **Contributor Feedback (agent)**, right of Ready for merge (owner, 2026-10-31): the agent's proposed direction for resolving the change set, so people react to a proposal rather than draft from nothing; it is not a person's feedback, the script leaves it out of the Contributor Feedback columns, and it decides nothing. Green, by the script from Agent: **Issue** (`<repo>#n`, linked), **Agentic status** (as in public-comment mode: one line per PR, `<repo>#n (status, completed) · what it changed`), **Staging review** (a "review" link to the change set's review page on its staging preview, `STAGING/<branch>/en/review/`, while its PR is open; the column was "Staging review page" until 2026-10-31, owner), **Agentic status (filter)** (the change set's status as one plain value, for the "By agentic status" filter view; green like the other columns the script copies from Agent, owner 2026-10-31) |
| **Agent** | the agent only | one row per change set: Change-set, Issue (URL), Agentic status, Pull request (change set), What the PRs changed (change set), Agent completed (UTC, change set), Staging review page (change set), Feedback basis (change set). The agent writes it as each step completes, by the steps of the `review-sheet-agent-columns` skill (core#315, not yet merged); a drafting sheet has no per-comment rows, so only its change-set columns apply |
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
  "sectionUrl": "en/<doc>/#"
}
```

Write the URLs **relative to the folio's site**: the build resolves them
against `iriBase` in the folio's `<instance>.json` (e.g.
`https://litlfred.github.io/dth-hrh/`), so no organisation name is written
in sheet-sync.json and a folio that moves (to WHO, say) changes one
`iriBase` and rewrites its Config (owner, 2026-10-31). An absolute
`https://` URL is still taken as written.

`tabs` and `columns` (`draft`, `draftAgent`) override the headers as in
public-comment mode. Write its Config with `--config review/drafting/sheet-sync.json`
and install as above. The Sections dropdown is a data validation "dropdown
from a range" on `TOC!A2:A` with **Allow multiple selections** ticked; set it
once in the template (the Sheets API cannot tick that box), and copies keep it.
Without the tick, a cell with two or more sections shows "Invalid: Input must
fall within specified range".

**The agent's part: every change set has an issue.** On each sync, for every
Contributor Feedback row with a Change-set:

1. If the Agent tab has no row for it, add one (Change-set, Agentic status
   `Not started`).
2. If that row has no Issue, open a GitHub issue in the folio's repository:
   title `CS-nnn: <Title>` (or the first feedback line while Title is
   empty), body the linked sections, every Contributor Feedback (…) cell
   verbatim, and a link back to the sheet row. Write its URL into Issue.
3. When feedback is added to a row later, comment the new text on its issue.
4. Propose a direction in **Contributor Feedback (agent)** whenever the
   row changes, whoever changed it, a person or an agent. On each sync
   compute `feedbackBasis(header, row)` (`tools/review-sheet-sync/feedback-issue.ts`:
   a short hash of Title, Selected Sections and the people's Contributor
   Feedback columns). Where it differs from the Agent tab's **Feedback
   basis (change set)**, or the proposal cell is empty (a person clears it
   to ask for a fresh one), write a new proposal and the new basis. The
   script's own writes (ids, links, tree marks) do not change the basis.
5. Work a change set only when **Ready for agent** is Yes; its PRs say
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
(`https://docs.google.com/spreadsheets/d/<template id>/copy`); then the agent writes the new document's Config tab, and the owner runs
installTriggers. The script in the template needs no change.

**Locks in a template and its copies** (owner, 2026-10-31): every cell is
locked to the owner except the blue, human-controlled columns. That covers
the headers, the grey mechanical and green agent-derived columns, the
Config tab, the Agent tab and the hidden TOC. The orange Ready-for-agent and
Ready-for-merge columns have a lock of their own, **"Ready columns:
editors"**, which starts with only the owner; the owner adds each document
editor to it in each copy (step 4 below).

### Setting up a sheet for a new document

The owner (informatics.avengers) does steps 1 to 6; the agent does step 3.

1. **Copy the template.** Open the "make a copy" link for the mode (table
   above), name the copy "<document> Contributor Log" or "<document> Public
   Comment Log", and keep it in the informatics.avengers Drive. A file copy
   keeps tabs, colours, dropdowns, locks and the script.
2. **Share it.** Share > add contributors or reviewers as **Editor**. The
   locks still keep them to the blue columns.
3. **Write the Config tab (agent).** Give the agent the copy's URL. It adds
   `"sheet": "<id>"` to the folio's `review/<mode>/sheet-sync.json`, builds
   the rows (`--config … --out config-rows.json`) and writes them into
   Config with the Sheets connector. For drafting it also fills the hidden
   TOC by the first refresh.
4. **Add editors to the Ready columns.** Data > Protect sheets and ranges >
   "Ready columns: editors" > Change permissions > "Restrict who can edit
   this range" > Custom > add each editor's email > Done. Only they and the
   owner can then set Ready for agent and Ready for merge.
5. **Install the script.** Extensions > Apps Script. Replace all of
   `Code.gs` with the published generic file and save (the only file to
   paste). Pick **installTriggers**
   in the function list and press Run; allow access (Advanced > continue,
   since bound scripts are unverified). Reload the sheet: a **Review links**
   menu appears. A copy of the template already holds the script, so the
   paste is needed only when the script changes; **installTriggers is needed
   in every copy**, because triggers and the owner's permission do not copy.
   Paste the script into the template itself once, so every copy starts with
   it. A copy keeps the version it was made with: when Code.gs changes,
   paste it again into each sheet in use.
6. **Drafting only: finish the Selected Sections dropdown.** installTriggers
   checks the dropdown: it adds the rule (a dropdown from `TOC!A2:A`) when
   the column has none, and leaves an existing one alone (a rewrite would
   clear its tick). Two settings are a person's, once per sheet:
   - click the column letter above "Selected Sections" to select the column;
   - choose Data, then Data validation;
   - open the rule for that column (the sidebar lists it by its range, such
     as `'Contributor Feedback'!E2:E1000`, as "Dropdown (from a range)");
   - tick **Allow multiple selections**;
   - open Advanced options and set Display style to **Chip**;
   - press Done.

   Neither Apps Script nor the Sheets API can read or set these two
   settings, so installTriggers cannot check them directly. It shows the
   steps, with the exact range, unless it has evidence they are done: a cell
   already holding two sections from the list, or a Yes to the box's "Is this
   done already?" (kept as the document property `dropdownDone`). Copies made
   after the template has them keep them. The same steps are written at the
   top of the Config tab, in its `Instructions - Setup` row, so they stay with
   the sheet (owner, 2026-10-31); the script ignores that row.

**Who may set the Ready columns: the `EDITORS` row** (owner, 2026-10-31).
Everyone who works in a log is shared as Editor; protected ranges decide what
each can change. Blue columns are open to all of them. The orange **Ready for
agent** and **Ready for merge** columns are for editors only, and the owner
names them in the Config tab's `EDITORS` row: plain emails, one per line (or
separated by commas). installTriggers and Review links > Refresh now lock each
`Ready for ...` column to the owner plus those emails, under a protection the
script owns and rebuilds each time (other protections are left alone). An
empty row leaves the columns open to anyone who can edit; a Config with no
`EDITORS` row leaves them as they are. `EDITORS` is the one Config row a person
keeps: the agent writes it empty and keeps the sheet's value whenever it
rewrites the tab, and the emails never go into `sheet-sync.json`, which is
committed. To delegate who decides, the owner can add a delegate to the Config
tab's protection, or send the agent the list.

**The Instructions rows** (owner, 2026-10-31). Every visible tab opens with an
`Instructions` row that says what that tab is for and how it works, in that
tab's own terms ("make 'how this sheet works' specific to each tab").
`tabInstructions()` in the builder writes the text for each tab. On a people's
tab (RPC, RCS, Contributor Feedback) the row is frozen with the header and grey
like it, a lighter grey than the header. Its first line is the colour key,
worded for the mode by `colourKey()`:

- **Blue**: input by people, named by their process role: the Feedback Review
  Committee in public-comment mode (the DPI-H RA's architects hold it, but the
  sheet names the role, not the job), the Authoring Committee in drafting mode;
- **Green**: written by the agent;
- **Orange**: workflow, set by an Editor (the `Ready for ...` columns);
- **Grey**: mechanical, kept by the script or the source.

Then come the steps for that tab, one per line. Each colour word in the text
is capitalised (Blue, Green, Orange, Grey), and the sheet shows that word,
and only that word, bold in its colour (owner, 2026-10-31). On a change-set tab they are
the human-to-agent workflow, worded by process role: people write in blue, the
agent proposes in green, an Editor sets Ready for agent, the agent opens one
pull request for the row whose `Staging review` opens the preview's
what-changed page, reviewers answer in blue, and an Editor sets Ready for merge
and the agent merges. On Review Public Comments the steps say that decisions
are made per change set. Last come the filter views, and a link to the
harness's page for the process the sheet runs, where every step and role is in
full: `public-comment.html` for public comment and `contributor-feedback.html`
for drafting, under `en/cat-harness/processes/` on the folio-assistant site
(`processPage()`; `CFG.PROCESS` overrides it).

The first cell reads `Instructions`, and the text is one merged cell across the
rest of the row, the colour names in their colours. The script reads any leading
rows whose first cell starts `Instructions` (or `Colour key`, the first name) as
for people: the header is the row after them, and every write, lock and edit
range starts below the header. Insert the row only after the sheet runs a
Code.gs that knows it; an older script reads the legend as the header and finds
no columns. Filter views and protections start at the header row, so shift them
down by one row when the row is inserted. A filter view's custom formula does
not move when a column is inserted, so rewrite it.

The Config tab keeps its Instructions short, one subject per row, so no row is
taller than the window (owner, 2026-10-31): `Instructions` (the tab's purpose:
nothing here needs you unless you install the script), `Instructions - Setup`
(`setupSteps()`) and `Instructions - Editors` (`editorSteps()`), then the
`Key | Value` header. Its rows are not frozen. The script reads Config keys by
name, so it ignores these rows.

**A stale proposal hands control back to an Editor** (owner, 2026-10-31).
When a row's proposal turns stale (a blue cell changed since the agent wrote
it), the script sets that row's `Ready for agent` from Yes to No, once, on the
turn. The agent does not act on the row until an Editor sets Yes again, which
is the signal to update the row's pull request. A Yes set while the row is
still stale stays.

**One row, one branch, one active pull request** (owner, 2026-10-31, option A).
A change-set row keeps one branch for its whole life, and at most one pull
request is open on it. Every later agent run pushes to that branch and updates
that PR, so the row's `Staging review` link stays the same. If the PR is
closed and the committee or contributors want the work back, the agent
reopens it, or opens a new PR on the same branch when it cannot be reopened.
It never starts a second branch for the row. Each earlier PR stays listed in
the row's Agentic status, one line per PR, so the history is read in the sheet.

**Filter views** (owner, 2026-10-31). Each template carries saved filter
views, which copy with it. Use Data > Filter views, never a plain filter: a
plain filter changes the view for everyone, a filter view only for whoever
opens it.

| sheet | view | shows |
|---|---|---|
| drafting: Contributor Feedback | By agentic status | every row; pick values in the Agentic status (filter) column's filter (a plain copy of the change set's Agent status, owner 2026-10-31) |
| | Open | rows with a Title, Ready for merge not Yes |
| | Ready for editor | rows with a Title, Ready for agent not Yes |
| | Decided | Ready for merge is Yes |
| public comment: Review Change Sets | Change sets: Open / Ready for editor / Decided | the same three, on its Ready columns |
| | Change sets: by agentic status | every change set; pick values in the Agentic status (filter) column's filter |
| public comment: Review Public Comments | Comments: Open | a No., Disposition empty |
| | Comments: Decided | Disposition filled |

A filter view covers the rows the tab had when the view was made; when rows
are added past that, widen its range (Data > Filter views > the view >
Options > Update range).

**Keeping the section list current (agent).** The dropdown's list is the
hidden TOC tab, and the script writes it from `DATA.TOC` in the Config tab
on every refresh. So when the document's chapters or sections change (any PR
that changes `review-anchors.json`, the same moment `review:anchors` runs),
the agent rebuilds the Config rows (`--config review/drafting/sheet-sync.json
--out config-rows.json`) and writes them into each drafting sheet the folio
names, in the same change. Nobody edits the TOC tab by hand.

**How picks stay valid.** On each refresh the script repairs Selected
Sections before anything else:

| the pick | what the script does |
|---|---|
| a current section, with or without its indent (or the old "└ " mark) | rewrites it to the dropdown's name, indent included |
| a section renamed or renumbered since it was picked | finds it by its anchor (the TOC tab's column C keeps the anchors of the names it offered before) and rewrites it to the new name |
| a section no longer in the document | keeps it, so nothing a person chose is lost, and adds a line in Section links: ⚠ "<name>" is not in the document now: pick its section again |

So "Invalid" after a document change clears by itself at the next refresh,
except for a section that was removed, which a person repicks.

**Change-set ids.** Any row a person has filled in gets the next `CS-nnn`
at the next refresh, whichever column they started in (owner,
2026-10-31). A cell holding only "No" (a Yes/No dropdown's default) and the
script's own columns do not count.

**Selected Sections shows "Invalid".** Three causes. A pick of a section
removed from the document: Section links flags it; pick again. Otherwise: The cell holds several sections
but the rule does not allow multiple selections: tick it (step 6). Or the
cell carries links: Sections must be plain text, the links belong in Section
links. Older scripts linked the column; clear its formatting (Format > Clear
formatting) and the current script keeps it plain.

**Check it.** Review links > Refresh now. In drafting mode a filled-in row
gets a CS id and its picked sections appear, linked, in Section links;
in public-comment mode each No. becomes a link. An error names what is
missing: no Config tab, a Config row, or a tab the Config names.

| mode | template (owned by informatics.avengers) | make a copy |
|---|---|---|
| public-comment | Folio Assistant - Public Comment Review Template, `14PtLd2U_tBQV5OHoEEVRJK1EKfsbZEBPP_MIqo2E3o4` | https://docs.google.com/spreadsheets/d/14PtLd2U_tBQV5OHoEEVRJK1EKfsbZEBPP_MIqo2E3o4/copy |
| drafting | Folio Assistant - Contributor Template, `1PtcNJgLQIA1BjapU51pAQzqQjGylBHYNKlCPzZkwVag` | https://docs.google.com/spreadsheets/d/1PtcNJgLQIA1BjapU51pAQzqQjGylBHYNKlCPzZkwVag/copy |

A copy keeps tabs, colours, dropdowns and formulas. It does not keep
protected ranges (re-add them: Agent whole tab; the grey and green
columns), and its TOC tab is empty until the script's first refresh. A
document's own sheet is named in its `sheet-sync.json` as `sheet` (the
spreadsheet id), so the agent's sync knows where to read and write.
