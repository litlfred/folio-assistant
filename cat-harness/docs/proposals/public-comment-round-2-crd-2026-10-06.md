---
title: "Public comment, round 2: requirements from the chief-editor walkthrough"
kind: proposal
summary: >-
  Proposed 2026-10-06, for the owner's review BEFORE approval: sixteen
  requirements and four defects from a 17-minute CRDM walkthrough of the DPI-H
  Reference Architecture public-comment dashboard with its chief editor. Change
  sets get a type axis and a committee axis, new comments are ingested
  incrementally with duplicate detection, only an editor proposes or splits a
  change set, and human and agent categorisation are compared. Nothing is built.
---

# Public comment, round 2: requirements from the chief-editor walkthrough

**Status: DRAFT, for review before approval.** Nothing here is built, and
nothing will be until the owner approves, amends or rejects each requirement
below (CRDM Phase 3, [`crdm-requirements-template`](../../skills/sdlc/crdm/crdm-requirements-template.md)).

Issue [#197](https://github.com/litlfred/folio-assistant/issues/197) ·
bean `uphx` (parent `q4jm`; round 1 was `v26p`) · first customer
`litlfred/smart-ra` (DPI-H Reference Architecture, about 2,630 comments).

## Source

A Teams call on 2026-10-06 (10:47, 17 min 8 s), *"Quick touchbase re: Ref arc
feedback and Assured AI WS1"*. Two people:

- **Carl Leitner**: business analyst running CRDM; demonstrates the
  staging dashboard.
- **Chinemerem Chika (Chinni) Eyetan**: chief editor of the reference
  architecture; states the requirements.

Uploaded as [litlfred/smart-ra@9eb6ad3](https://github.com/litlfred/smart-ra/commit/9eb6ad3de3eea24d80c6cd8742ba9030872b3e58):

| file | what it is |
|---|---|
| `uploads/Quick touchbase re_ Ref arc feedback and Assured AI WS1.docx` | Teams transcript export: speaker, `m:ss`, paragraph. 85 of its 86 images are the two speakers' avatar icons, plus one more icon; **no screen content**. |
| `uploads/Quick touchbase re_ Ref arc feedback and Assured AI WS1.vtt` | WebVTT captions: 275 cues, 00:00:05.8 to 00:17:03.7. |

The **video recording is forthcoming**. Screenshots are to be added where the
speakers refer to the screen; the moments are listed in [§Screenshots
pending](#screenshots-pending).

### The two transcripts are one transcript

The two were compared word by word after normalising case and punctuation:
**2,474 words (.vtt) against 2,469 (.docx), similarity 0.980.** Every
difference is one of two things, and neither changes the meaning:

1. **An interjection in a different place.** The .vtt interleaves the
   listener's "okay", "yeah", "mhm" inside the speaker's sentence at its cue
   time; the .docx moves them to the listener's next paragraph.
2. **Two words joined at a line break** in the .docx export: "andrequests",
   "canalso", "i'mconcerned", "begrouped", "hadasked".

Neither carries a statement the other lacks. Both are the **same Teams speech
recognition**, so they share its errors. Comparing them cannot catch those
errors; an independent transcription of the video can, and the video is the
arbiter wherever the two disagree with it.

Speech-recognition errors read through in this document:

| transcript says | meant |
|---|---|
| "Carl Lightner" | Carl Leitner |
| "Tini", "Jiun" | Chinni |
| "Saroop", "Swarupu" | a colleague's name, not confirmed: **ask** |
| "chain sets", "compliment" | change sets, comment |
| "philtres" | filters |
| "DPIF" | DPI-F |

Speaker share: Leitner 1,539 words, Eyetan 935.

## What the walkthrough showed (round 1, as demonstrated)

From 1:40 to 4:40, the BA walks through the staging dashboard (screen shared):

- about 2,600 comments, grouped into **change sets** (CS-001: 14 comments,
  with a common set of requirements such as "complete incomplete sentences,
  define DPI-F at first use, simplify the flagged wording");
- a change set's comments, expandable to the commenter, the decision so far,
  and the committee;
- links into the document to every comment on a section;
- **Discuss** on a change set (CS-164 shown): sets up a GitHub issue for a
  working-group call, for notes, attachments and comments from anyone with a
  GitHub account;
- after discussion, assigning an agent (or Copilot) to open the PR that
  implements the approved changes.

The editor (4:40): *"I think it works fine in terms of the workflow."* What
follows are the additions.

## Measured against the data already imported

The imported log in smart-ra already carries the editor's own categories,
kept verbatim as labels from her spreadsheet:

| label (column in her log) | comments | values |
|---|---|---|
| `TWG consideration? AI categorisation` | 764 | Core architects 412, Editorial 98, Metadata registries 98, Clinical 55, No 52, Financial systems 29, WHO 10, Supply chain 10 |
| `Consider by TWG? Human categorisation` | 100 | No 57, Core architects 14, Editorial 7, Clinical 6, Metadata 4, and mixed values such as "Core architects/ WHO" and "HWF team" |
| `type` (the comment matrix's own field) | 662 | technical 305, general 248, editorial 109; **1,970 comments have none** |

**Of the 100 comments she categorised by hand, her AI agreed on 48.** The
largest disagreement is 29 comments the AI sent to *Core architects* that she
marked *No*. That is exactly what she describes at 13:35: comments the AI routed
to a domain group, *"but… not things that we plan to even cover in the
reference architecture"*. (Measured 2026-10-06 over
`review/public-comment/comments/*.json` on smart-ra `main`; the label values
were compared after splitting on "/" and treating "Metadata registries" as
"Metadata".)

So REQ-01 and REQ-11 do not start from nothing: the vocabulary and a labelled
sample are already in the data.

## Requirements

Priority: **M** must-have, **S** should-have, **N** nice-to-have. *Today*
says what round 1 already does. Every *Source* is a transcript timestamp.

### A. Categorisation of change sets

**REQ-01: Two category axes on a change set: type, and committee.** (M)
A change set SHALL carry a **type** (`editorial`, `general` or `technical`)
and, when the type is `technical`, one or more **committees**: `core-architects`,
`metadata-registries`, `supply-chain`, `financial-systems`, `clinical`. Any type
MAY also be routed to `who`. The tags SHALL sit *on top of* the thematic
grouping that change sets already have; they do not replace it.
*Source:* 4:40–5:50 and 7:30–7:55. *Today:* the comment matrix's
`general`/`technical`/`editorial` is a comment field; a change set has no
type and no committee. *Accept:* every change set shows its type; every
technical one has at least one committee; the dashboard filters on both.

**REQ-02: Who reviews each type.** (M)
`editorial` SHALL route to the editorial team, `general` to the WHO editorial
team, and `technical` to the named committees.
*Source:* 7:30–7:55. *Accept:* the routing table is configuration in the folio
(`config.json`), not code, and the dashboard shows each change set's
reviewing group.

**REQ-03: The committee rolls up from comments to the change set.** (M)
A change set's committees SHALL be **derived** from its comments' committees,
as a union; an editor MAY override the result, and the override is recorded.
The dashboard SHALL support the query *"editorial change sets within this
committee"*.
*Source:* 7:55–8:56. *Today:* a comment carries the committee only as a
verbatim label. *Accept:* changing a comment's committee changes its change
sets' committees on the next build; a filter `type=editorial &
committee=clinical` returns exactly those.

**REQ-04: Categorisation is consistent.** (M)
The same comment text SHALL receive the same category every time it is
categorised, and every category assignment SHALL record **who or what**
assigned it (a person, or an agent with its rule version) and when.
*Source:* 4:40–5:20 (*"concerned… that there's consistency in the way it goes
through the categorization"*). *Accept:* re-running the categoriser over an
unchanged log changes no category; every category shows its assigner.

**REQ-05: A reference-architecture component axis.** (N, **deferred**)
A change set MAY be tagged by reference-architecture component (metadata
component, business-domain component, …).
*Source:* 8:56–9:35. Both speakers agreed to **start without it**, trial
REQ-01 to REQ-03 first, and decide after the trial.

### B. Ingesting new comments

**REQ-06: Incremental ingest.** (M)
New comments SHALL be ingestible into the running review without re-importing
from scratch, from either source: a **new version of a log already
ingested**, where only the delta is processed, or a **new document** (for
example comments from the mailbox that were never routed to the review's
sub-mailbox).
*Source:* 9:36–10:36 and 10:36–11:12. *Today:* a re-send of the same log
imports without duplicates (round 1, #2173); a delta report and a new-document
path are not described. *Accept:* ingesting v2 of a log reports N new, M
changed, K unchanged, and creates only the N.

**REQ-07: Duplicates detected on ingest.** (M)
Ingest SHALL detect **potential duplicates** of existing comments, both exact
re-sends and near-duplicates in wording, and SHALL NOT merge them silently:
it proposes, and a person confirms.
*Source:* 11:12 (*"Yes, I would prefer deduplication"*), 12:01. *Accept:* a
near-duplicate fixture is flagged with the comment it resembles and a score,
and stays `received` until confirmed.

**REQ-08: "Looks like a duplicate of PC-nnnn" on the comment.** (M)
A comment's view SHALL show its candidate duplicates, each linked, and offer
confirming one; confirming it uses the existing `duplicate` transition
(`duplicateOf`).
*Source:* 12:01–12:21. *Today:* the `duplicate` transition exists; nothing
proposes candidates. *Accept:* a flagged comment shows the link, and one action
marks it a duplicate.

### C. Commenters and acknowledgement

**REQ-09: Acknowledgements generated from decisions.** (S)
The commenter (name, organisation, consent to be acknowledged) SHALL stay
recorded per comment, and the system SHALL generate an acknowledgements list
from the comments whose change sets were decided.
*Source:* 11:12–11:45, 11:43–12:01. *Today:* the reviewer and their consent
are on every comment (`public.reviewer.acknowledge`); no list is generated.
*Accept:* one command or tool produces the list, and it honours consent.

### D. Building and governing change sets

**REQ-10: An editor proposes, splits or creates a change set from selected comments.** (M)
A person SHALL be able to select comments and propose a new change set from
them, or split an existing one. **Only an editor** SHALL be able to do so.
Delegating it to committees is explicitly *later*.
*Source:* 12:21–12:51. *Today:* change sets are proposed by the agent;
`cs-*` commands exist on a change set's issue. *Accept:* a non-editor's
proposal is refused and says why; an editor's creates a `proposed` change set
with its history.

**REQ-11: Discuss, then an agent implements.** (M, *confirm round 1*)
**Discuss** on a change set SHALL set up its issue for a working-group call
(notes, attachments, contributions from anyone with a GitHub account). After
the discussion approves the changes, an agent or Copilot MAY be assigned to
open the PR that implements them.
*Source:* 3:16–4:40. *Today:* demonstrated; listed so that approval covers
it, not because it is new.

**REQ-12: An out-of-scope outcome.** (S)
Triage SHALL be able to mark a comment, or a change set, as **requesting
something the reference architecture does not plan to cover**, with a reason,
distinct from a domain routing.
*Source:* 13:35–13:51; the 29 AI "Core architects" / human "No" disagreements
measured above. *Open question:* is this the existing decision code
`not-accepted` with a reason, or a triage outcome before any committee sees
it? It decides whether a committee spends time on it, so it is the owner's
call.

### E. Quality assurance of agent work

**REQ-13: Human and agent categorisation are compared, and disagreements adjudicated.** (S)
The system SHALL compare categories from the editor (human), the editor's
own AI (her spreadsheet), and this system's agents, report agreement per
category, and list disagreements for a person to adjudicate. Options for
improvement come from the disagreements.
*Source:* 12:51–13:35 and 14:20–14:34. *Today:* the data exists (see the
measurement above); no report does.
*Accept:* a report reproduces "48 of 100" from today's data and lists the 52
disagreements.

**REQ-14: Imported columns are accounted for.** (S)
When an ingested template has columns the importer does not recognise, the
system SHALL report each one and where its values went (kept as a verbatim
label, mapped to a field, or dropped), rather than "doing something with it".
*Source:* 13:51–14:20 (the BA could not tell what the agent did with the new
columns). *Today:* unknown columns are kept verbatim as labels (round 1); the
ingest report does not say so. *Accept:* the ingest report lists every
column and its destination.

**REQ-15: A review threshold for agent work.** (S, *needs definition*)
The process SHALL define when an agent's output (categorisation, placement,
change-set grouping, proposed edit) needs human review, for example below a
confidence level or as a sampling rate, and the dashboard SHALL show what is
waiting for that review. The thresholds are to be defined **with the working
group**, not chosen by an agent.
*Source:* 14:38–15:39. *Open:* the editor and a colleague (name to confirm,
see above) are to look at it.

**REQ-16: Editorial-style checks on proposed edits.** (S)
A change set's proposed edit SHALL be checkable against the WHO publication
voice and style rules (the existing one-voice checks, built from three WHO
IRIS documents), as one of the QA checks REQ-15 selects.
*Source:* 15:39–16:39. *Open:* the editor asked whether this is the
handbook a colleague (Nat) shared earlier. The BA is to send the link.

### Process requirements (this round)

- **P-1:** Implement the approved requirements on a **staging site with a
  shareable preview link** (16:39–16:59).
- **P-2:** The editor shows the dashboard to the **core architects group on
  2026-10-07** to trial it as a workflow (9:15–9:35). REQ-01 to REQ-03 are the
  ones that trial exercises.

## Defects observed in the demo

Recorded for triage. Each one is to be reproduced before it is fixed; none is
reproduced yet.

| id | what was seen | when |
|---|---|---|
| D-1 | Some comments show as **closed** that nobody asked to close (*"2629 are open… Why some are closed?"*, 2:08). Today's data has 2,619 `received`, 10 `triaged`, 2 `incorporated`, 1 `decided`; to check which state the dashboard counts as closed. | 2:08 |
| D-2 | The **type dropdown** (editorial / general / technical) *"seemed to be working before, but doesn't work now"*. | 7:21 |
| D-3 | **Back navigation** does not work (*"oh, the back things don't work"*). | 8:42 |
| D-4 | Not a broken control: the agent's handling of the template's new columns could not be explained. Covered by REQ-14. | 13:51 |

## Screenshots pending

To be cut from the video when it arrives, at the moments the speakers point at
the screen:

| time | what is on screen |
|---|---|
| 1:50, 2:08 | the staging dashboard: comment counts, open against closed (D-1) |
| 2:21–2:28 | the change-set list; CS-001 with its 14 comments and requirements |
| 2:55 | a change set's comments expanded: commenter, decision, committee |
| 3:12 | links from the document to a section's comments |
| 3:34–3:54 | CS-164 and its **Discuss** link |
| 7:21 | the type dropdown (D-2) |
| 8:42 | the back navigation failing (D-3) |
| 12:25 | selecting comments to make a new change set (REQ-10) |

## For approval

Each requirement is approved, amended or rejected on its own. Two open
questions need the owner's ruling before their requirements can be built:

1. **REQ-12:** is "out of scope" a decision code (`not-accepted` with a
   reason) or a triage outcome before any committee?
2. **REQ-01 and REQ-02:** are the committee names exactly the five the editor
   named, with `who` as a sixth? Her own log also has "HWF team".
