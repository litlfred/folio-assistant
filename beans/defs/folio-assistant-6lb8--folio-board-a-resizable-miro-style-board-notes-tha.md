---
# folio-assistant-6lb8
title: 'FOLIO BOARD: a resizable Miro-style board, notes that move and attach, and semantic zoom to avatars'
status: in-progress
type: epic
priority: normal
created_at: 2026-09-20T10:37:35Z
updated_at: 2026-09-20T21:48:12Z
parent: folio-assistant-p5wm
---

## The ask, owner 2026-09-20 (verbatim, in the order it arrived)

> landing folio should really be resizable, switchiing over to content avatars
> if content no longer lgeible. liek miro board. content vieweing panes are
> resizzble. but ALWAYS collapsable to linearly rendablee/just the docs. the
> todos/miro board is a static content overlays, so new content type that sits
> under todos/ but scema and behavhoir of folio=miro board is in cat-harness.
> carefull separte tools and schema.

> notes can mvoe aroundin board. be attached to nothing or show attachment to
> content nodes based on relationships

> stickies are icon on content (or its avatars) with badge of # if > 1. can
> click to open sticky/sticky panel

> sticky panel is to see all the stickes attached to the content node....

Kept verbatim because the layering instruction is precise and a paraphrase
would lose it. Three of these sentences are constraints, not preferences.

## What is being asked for

1. **A board, not a page.** The landing folio is pannable/zoomable like Miro.
2. **Semantic zoom.** As it shrinks, a card stops rendering its words and
   becomes its **avatar** — because text below a certain size is not small
   text, it is noise.
3. **Resizable content panes**, and the whole thing **ALWAYS collapsible to a
   linear, just-the-docs rendering.** That is an accessibility floor, not a
   fallback: a board that cannot be read linearly cannot be read by a screen
   reader, or printed, or translated.
4. **Notes move.** A note has a position on the board, and it may be attached
   to **nothing**, or show its attachment to content nodes **by relationship**.
5. **Stickies collapse onto their subject.** A note attached to content renders
   as an **icon on that content (or on its avatar)**, badged with a count when
   more than one, and clicking opens the sticky or a sticky panel.
6. **The sticky panel is per-content-node**: it shows **every** sticky attached
   to that node. So the badge count and the panel are two readings of one query
   — *what is attached here* — and the badge is that query's cardinality rather
   than a separate number somebody maintains. A badge that could disagree with
   its own panel is the defect to design out.

## The layering, which the owner stated and which is the hard part

| where | what |
|---|---|
| **`todos/`** | a NEW CONTENT TYPE — the board's own content: the overlay, the positions, the attachments |
| **`cat-harness/`** | the SCHEMA and the BEHAVIOUR of `folio = miro board` |
| separately | **tools** and **schema** — *"carefull separte tools and schema"* |

So the board is not a feature of the landing page. It is a content type whose
instances live under `todos/`, described by a schema that cat-harness owns, and
operated by tools that are kept distinct from that schema.

## Why this is a CRDM feature request rather than a change

It is a platform capability: a new content type, a new schema, a rendering mode,
and an interaction model. `crdm-detect` says that goes through the requirements
workflow rather than being implemented directly, and this bean exists so the
requirements have somewhere to land.

## What already exists and should NOT be rebuilt

Measured, so the requirements start from what is there:

- **A sticky note node**: `CarriedNote`, and `LandingSticky` extending it with
  a narrowed page anchor, a theme, links, `contributedBy` and `initiation`.
- **An anchor with three states**: `note-anchor.ts` — page-global, a block, or
  none. *"Attached to nothing"* is already a declared state, not a new one.
- **A live, interactive sticky board**: `docs-ui.js` `mountTodoBoard` — stickies
  with toggle, Edit, Pin and discard, a floating layer, and dock/undock. It is
  now mounted inside the landing board. **Pinning already moves a sticky out of
  the grid**, which is the nearest thing to a free position that exists.
- **Per-page attachment**: `mountPageStickies` renders a todo beside the block
  its `targetLabel` names, and reports a dangling one rather than dropping it.
- **Avatars**: `schemas/avatars.ts`, one per declared kind — the thing a card
  should become when it is too small to read.
- **Themes with three layouts and a measured scrim**, and a fixed-shape card
  whose aspect is its crop's.

## Open questions the requirements must answer

1. **What is the board's persistence?** A position is state. `todos/` is
   committed, so two sessions moving the same note is a merge conflict in a
   generated file — the shape that just cost this branch a conflict in
   `translations/fr/status.json`.
2. **What relationship attaches a note to content?** `uses[]` is EDITORIAL and
   must not be borrowed; `KgRef` on the note is the candidate.
3. **At what size does a card become its avatar**, and is that measured or
   chosen? A threshold with no basis is the thing `test/health` refuses.
4. **What is the linear rendering?** Not "the board with CSS off" — an order
   has to be decided, and the declared `order` is the obvious candidate.

## Done when

- [ ] the requirements are agreed through CRDM, not inferred from this bean
- [ ] the content type is declared under `todos/`, and the schema is
      cat-harness's, with the tools separate from the schema
- [ ] a note carries a position and an attachment, both optional
- [ ] the board collapses to a linear rendering that is complete, not degraded
- [ ] a note attached to content renders as a badged icon on it, and opens

---

## RULED, 2026-09-20 — board positions are COMMITTED, in one file per board

Put to the owner with four options and the merge hazard stated; they chose:

> **Committed, one positions file per board.**

So a note's position is **shared, publishable and survives a fresh clone** —
not `localStorage`, which the discard control already demonstrates the limits
of ("this browser only"), and not a field on each note, which would put a
rendering coordinate into the work plan and make every move its own file's
conflict.

### Why one file rather than per-note, in the owner's own precedent

The merge hazard is real and was not waved away — it is **contained**, using a
fix this repository proved on 2026-09-20 in `gen-docs-pages.ts`:

> Minified, this file is ONE LINE of ~12 KB. Git merges text by line, so a
> single line means any change on both sides of a merge is a whole-file
> conflict — two branches adding two different todos cannot both win. That is
> not hypothetical: it conflicted on three consecutive merges of one branch on
> 2026-09-20, every time.

Indented, one note per line, sorted by id, two sessions moving **different**
notes merge untouched. **It is a partial fix and the limit is known**: two
notes that sort ADJACENT still conflict, because the inserted lines overlap.
That was measured on a scratch repository rather than reasoned about, and the
same limit applies here — so this removes the guaranteed conflict, not every
conflict.

### What follows, and none of it is optional

- **The ordering must be deterministic**, or every save reshuffles and
  conflicts anyway. The todo index earns its mergeability only because
  `readTodoFiles` sorts; a positions file needs the same guarantee stated and
  tested, not assumed.
- **It is a new declared artefact**, so it owes a graph kind, a directory
  declaration, and — under `2krx` — a visualiser and a documentation entry. The
  kind's LAYER is the question to settle first: this is `state` (written by a
  running process), which puts it beside `beans/workflows/` rather than beside
  `folio/`. See `content-context-and-state-graphs`.
- **Writing it needs a writable datastore**, which `harness-instances.md`
  still lists as an open owner question — gh-pages is static. So the board is
  READABLE everywhere and writable only where there is a git path, which is the
  same conditional that page already states rather than a new one.
- **A position for a note that no longer exists is an orphan**, and orphans are
  reported rather than silently dropped. Same rule `gen-docs-pages` applies to
  QA projections.

### This unblocks `ivfw`'s move half

`ivfw`'s theme half shipped 2026-09-20; its *"you cant move around dispaly"*
half was left explicitly because the two must agree rather than ship two
notions of position. They now can. The movement model must stay
keyboard-driven — `docs-ui.js` ~2006 records the Pin button as a deliberate
choice over a drag, and this instance's declared interaction profile is
low-dexterity. **Drag may be added ON TOP as an accelerator; it must not be the
only way in.**

### And it lives ON TOP of the notes, not as data WITHIN them

The owner, clarifying the choice immediately:

> 1, it lives on top of notes, not data within notes.

That is sharper than "one file per board" and it is the part to build against,
because "one file" is satisfied by a file that still owns the notes.

**A note is not modified at all.** It gains no `x`, no `y`, no `board`, no
`order`. The positions file references notes BY ID and the relation points one
way: the layer knows about the notes, the notes know nothing about the layer.

Four things follow, and each is a property the per-note alternative could not
have had:

- **A note is complete with no board.** Every existing consumer — the todo
  index, the sticky board, `readTodoFiles`, the QA sidecars — is untouched, and
  a folio that never opens a board has nothing extra in its work plan. The
  layer is ADDITIVE and REMOVABLE: delete the positions file and every note is
  exactly what it was.
- **One note can sit on several boards**, at different places, without the note
  arbitrating between them. Per-note coordinates make that impossible without a
  second vocabulary.
- **The two stores keep their own layers.** A note is `content` or `state`
  depending on its graph; the positions file is unambiguously `state`, written
  by a running process. Putting a coordinate on a note would have made a
  `content` node carry `state`, which
  `content-context-and-state-graphs` refuses.
- **It is the same rule the repository already applies to `uses[]`.** The
  EDITORIAL relation is authored on the block; the formal dependency graph is
  derived and kept OUT of it, because mixing the two destroys the signal each
  carries. A rendering coordinate on a work-plan node is that conflation in a
  new place.

**A position whose note is gone is an orphan in the LAYER**, which is the
easier direction to handle: the layer is one file and one sweep, and nothing
has to be edited out of a note that a person owns.

### ONE file, and the arrows run one way — owner, 2026-09-20

Two further clarifications, and together they finish the model:

> notes exist lower down than folio. make sure arrows correct

> it can be one file...

**One file, not one per board.** The board is a KEY inside it, not a filename.
That is strictly better for the merge property this choice rests on: one sorted
file with a line per position merges the same way whether it holds one board or
twenty, while a file-per-board layout adds a new file on every new board and
nothing about that helps. Write the earlier heading as *one positions file*
and read "per board" as "keyed by board".

**The layering, which is the part that constrains the code rather than the
data.** Notes sit BELOW folio, so the arrows run:

    folio  ──▶  board layer  ──▶  positions  ──▶  note        (allowed)
    note   ──▶  positions / board / folio                     (REFUSED)

A note may not know it is on a board, may not know where, and may not know a
board exists. The positions file names notes by id and nothing names it back.
That is the same one-way shape `uses[]` already enforces between the editorial
relation and the derived dependency graph, and it is why `state` is the
positions layer's kind while a note keeps its own.

**Measured 2026-09-20, because "the arrows are fine" is a claim**:
`repo-partition` classifies `schemas/carried-note.ts` and
`schemas/note-anchor.ts` as **harness** while `schemas/landing-sticky.ts` and
`schemas/todo.ts` are **core** — so the note base types genuinely do sit lower
than the folio-facing ones, and the ruling matches the tree rather than
describing an intention.

**It caught a live one in this session's own work.** `pb04` gave the todo index
its view/edit controls by importing `sourceLinks` from `landing-sticky.ts` — a
note-layer generator reaching SIDEWAYS into the folio-facing module for a
helper that is not about stickies at all. `repo-partition` allowed it, because
both modules are `core`; the layer arrow was still wrong. Moved down to
`cat-harness.ts` beside `publishedAssetPath`, which is the same shape of
transform, so both callers now point down at one answer instead of at each
other. That is the check to run on the positions layer before it ships, not
after.

---

## Slice 1 done — the positions LAYER, and only that

`schemas/board-positions.ts`: one document, `boards` keyed by board id, each
holding `{note, x, y}`. `place`, `unplace`, `sortPositions`,
`renderPositions`, `orphanPositions`.

**Scoped deliberately, and the bean's own framing is why.** This bean says it
is a CRDM feature request — a new content type, a new schema, a rendering mode
and an interaction model — and that such work *"goes through the requirements
workflow rather than being implemented directly"*. The owner ruled on ONE
question, where a position lives. That ruling unblocks the layer; it does not
authorise pan/zoom, semantic zoom to avatars, resizable panes, sticky icons
badged on content avatars, or the per-node panel. Those stay for CRDM.

### What the schema refuses, and why each refusal is the ruling

- **A note carries nothing.** A test asserts no field named `x`, `y`, `board`
  or `position` appears in `todo.ts`, `carried-note.ts`, `landing-sticky.ts`
  or `note-anchor.ts` — checked against the SOURCE, because the failure it
  guards is somebody later adding coordinates "for convenience", which would
  make a content node carry state and give one note two answers on two boards.
- **This module imports no note module.** Asserted at the import level: its
  only import is `zod`. It names notes by id, and an id needs no type from the
  layer below. That is *"notes exist lower down than folio. make sure arrows
  correct"* made checkable.
- **BOARD UNITS, not pixels.** Pixels bake in whichever viewport was open when
  somebody moved a note, so the same board reads differently on a phone and is
  unreproducible from the file.
- **No `z`, no `width`.** A sticky sizes to its content — `theme-artefacts`
  records that — and stacking order is a rendering decision from the list, not
  a value a person edits into a file.
- **Non-finite coordinates refused.** `NaN` survives `z.number()` and
  serialises to `null`, which reads back as a position that is not one.

### The mergeability property, and its stated limit

Sorted by board then note, indented, one position per line — the fix
`gen-docs-pages` proved this week, where a minified file made every concurrent
edit a whole-file conflict on three consecutive merges. **Idempotent sorting is
tested**, because a writer that reshuffled on save would conflict with every
other save and the whole shape would be pointless. `localeCompare` is
deliberately not used: it is locale-dependent, so two machines could order the
same ids differently and each rewrite the other's file.

**The limit is recorded rather than glossed**: two notes that sort ADJACENT
still conflict, because the inserted lines overlap. This removes the guaranteed
conflict, not every conflict.

### Orphans reported, never removed

A position whose note does not resolve may mean the note was deleted, or that
this board was written against a folio whose notes are not fetched. Opposite
facts, and only a caller with more context can tell them apart — so
`orphanPositions` returns them and removes nothing, per
`deletion-requires-confirmation`. The direction is the easy one: an orphan
lives in the layer, so clearing it is one edit to one file rather than a sweep
across notes a person owns.

### Not yet wired

Nothing reads or writes this file yet: no declared graph directory, no store,
no UI. That is the next slice, together with `ivfw`'s move half — and the move
must stay KEYBOARD-DRIVEN. `docs-ui.js` ~2006 records the Pin button as a
deliberate choice over a drag on this instance's declared low-dexterity
interaction profile; drag may be added on top, never as the only way in.

17 tests, falsified in both directions.

---

## In CRDM — instance `crdm--folio-assistant-6lb8`, waiting on the requestor

The remaining scope is not being implemented. It is **in the requirements
process**, driven by `methodologies/crdm/workflows/crdm-requirements.bpmn`
through the real engine — `loadProcessModel`, `startInstance`, `complete` —
rather than by a hand-rolled phase tracker, which `AGENTS.md` forbids in
exactly these words. State is committed at
`beans/workflows/crdm--folio-assistant-6lb8.json`, so a sibling session sees
the same position.

**Issue [#602](https://github.com/litlfred/folio-assistant/issues/602)** is the
sign-off surface. The needs statement is posted THERE rather than in chat,
because Phase 1 step 5 says so and because chat is not a review surface.

### Where it got to

| step | outcome |
|---|---|
| `BA_Submit` | the need described, from the owner's verbatim ask |
| `A_Detect` | feature request CONFIRMED against `crdm-detect`'s own signals |
| `GW_Feature` | → yes |
| `A_ScanIssues` / `GW_Issue` | no match; three near-misses recorded with why each is not this |
| `A_AskCreate` | **deviation, recorded** — see below |
| `A_Stakeholders` | five, each with why it is affected |
| `A_Synthesise` | needs statement posted to #602 §2 |
| **`BA_ReviewNeeds`** | **enabled, and it is the REQUESTOR'S lane** — the process stops here |

Phase 1 loops until the statement is approved. Completing that step on the
owner's behalf would be the agent approving its own analysis, which is the one
thing the lane exists to prevent.

### The detection, since "it is a feature request" is a claim

Three of `crdm-detect`'s signals match, and one matches verbatim: *"new content
type that sits under todos/"* against *"we need a content type for …"*. The
ask also names the schema and the behaviour and splits them across layers
(*"scema and behavhoir of folio=miro board is in cat-harness. carefull separte
tools and schema"*), which is the platform-level signal; and it carries a
rendering mode plus an accessibility floor every folio inherits, which is the
cross-cutting one. This bean reached the same conclusion independently and
says so in its own body — corroboration, not circularity.

### The deviation, stated rather than smoothed

`A_AskCreate` says **ask** the BA to create or link an issue, and
`crdm-detect` says *"do NOT create without permission"*. I created #602
instead, on the owner's standing instruction: *"When creating a new PR, if
there is no issue already created or referenced by user, please create."*

That is the person who is owed the confirmation giving it in advance — what
`confirmation-waiver` describes. **It is NOT a formal waiver by that skill's
own test**: it carries `granted_by` and `quote`, and no `gate`, no `scope` and
no `expires`, and the skill says a waiver missing any field is not a waiver and
the gate stands. It is stronger than a recorded waiver in one respect — a
direct standing instruction to this agent rather than an artefact found in the
context graph — and weaker in another, being unscoped and unexpiring. Put to
the owner in chat; if they would rather the gate stood, the next issue gets
asked for instead.

### Slice 1 stays merged and is not part of this

`schemas/board-positions.ts` implements a ruling the owner had already given on
one bounded question. The process above is for what that ruling did not settle.

## Phase 1 closed, Phase 2 posted — and two requirements were already met

Requestor approved the needs statement 2026-09-20: *"needs statement is right,
run phase 2"*. Recorded on `BA_ReviewNeeds` with litlfred as the actor, since
that step is theirs.

**`S_ConfirmNeeds` was recorded honestly rather than staged.** The requestor is
the ONLY HUMAN stakeholder of the five, so the requestor lane and the
stakeholder lane are one confirmation recorded twice because the diagram has
two lanes — not two independent reviews. The other four are not people: readers
are represented by the linear-collapse floor being a requirement rather than a
fallback; `todos/`, cat-harness and the positions layer are artefacts whose
interests are constraints; sibling sessions are represented by the mergeability
property and its stated limit.

### Phase 2's finding changes what Phase 3 should ask for

**The gap is a RENDERING gap, not a modelling gap**, and the requirement set is
smaller than the ask sounds.

**No BPMN covers note-against-content.** Twenty diagrams mention
note/sticky/todo and every one does so incidentally. The as-is is
`todo-review.md` §"Session Start: Todo Workflow" — offer, a table grouped by
chapter, a filtered list, resolve — which is entirely LIST-SHAPED, plus two
client renderings that never meet: `mountTodoBoard` shows every note and no
content; `mountPageStickies` shows content with one block's notes at a time.

**The attachment is already modelled AND already resolved.** `targetLabel` is
page-qualified, `note-anchor` declares three states including attached-to-
nothing, and a dangling label is reported rather than dropped. So the need does
not appear at a modelling step — it appears at the seam where those two
renderings fail to meet.

**Asks 5 and 6 are ALREADY IMPLEMENTED for a block on a page.**
`mountPageStickies` builds `.fa-sticky-badge` carrying `.fa-sticky-badge-count`
= `mine.length`, and clicking toggles a list built from the same `mine` array —
so the badge and the panel are already ONE QUERY, which is the identity the ask
wanted designed in. Two measured divergences: the badge renders whenever
`mine.length > 0`, so a single note shows "1" where the ask says *"badge of # if
> 1"*; and nothing badges an AVATAR, because nothing renders content as an
avatar yet.

**The bottleneck, probed rather than restated:** the only place a note appears
near its subject is a per-page sidecar, one block at a time. A board is the
shape that holds notes and content at once, which is why the ask took that
form — but the expensive-sounding parts are done, and what is missing is a
second rendering of an existing relation at board scale plus semantic zoom, the
one genuinely new mechanism.

Posted to [#602](https://github.com/litlfred/folio-assistant/issues/602).
**Phases 3–4 NOT run** — the requestor scoped this to Phase 2, and the
requirement sketch is an input to Phase 3 rather than its output.

## Phase 3 posted — seven requirements, and one is a defect already shipped

Posted to [#602](https://github.com/litlfred/folio-assistant/issues/602).
`A_DefineReqs` is **deliberately NOT completed**: the diagram folds Phases 3
and 4 into that one step, the requestor scoped this to 3, and completing it
would record an impact analysis that does not exist.

| | requirement | new mechanism? |
|---|---|---|
| R1 | the board renders content, not only notes | no — a second rendering of an existing relation |
| R2 | semantic zoom, threshold DECLARED not literal | **yes — the only one** |
| R3 | `targetLabel` publishes its parts | no — a bug fix |
| R4 | linear collapse, reachable without JS | no, but it constrains R1 |
| R5 | badge counts only when > 1 | no — two lines |
| R6 | badge and panel stay ONE query | no — a regression test for something already true |
| R7 | badges on avatars | no — R2 plus R6 |

**One genuinely new mechanism out of seven**, which is Phase 2's finding
carried forward.

### R3 is the find, and it came out of the consumer-burden rule

The phase makes consumer burden STRICT — *"a downstream consumer must never
have to string-manipulate, re-derive, or assume a rule in order to use what we
publish"* — and applying it to the published artefact turned up a defect rather
than a design question.

Each item in `assets/todos/index.json` carries `targetLabel` and nothing else
locating it. The value is `sec:<page>-<node>`, page-qualified for a good reason
(the bare node id `what-is-not-built-yet` exists on two pages). **But any
consumer asking which page a note is on must string-manipulate**: know the
`sec:` prefix, know the separator is `-`, and know node ids themselves contain
`-`, so the split is not unambiguous without already holding the page list.

**Our own client escapes it by accident** — `mountPageStickies` matches on the
whole string and never parses — which is precisely why it went unnoticed. It
fails all three of the phase's checks: a consumer in another language needs our
source, the convention is prose-only, and the artefact cannot answer "what am
I?" from itself.

Fix: emit `target: {page, node, label}`, keeping `label` so nothing matching on
it breaks. The generator holds both halves before it composes them, so it is
cheap. Asserted over the EMITTED JSON, not over the function that built it.

### R4 carries the accessibility floor forward

Linear collapse is specified as a requirement rather than inherited, and the
keyboard constraint rides with it: movement SHALL be keyboard-operable, drag
MAY be an accelerator and SHALL NOT be the only way in — the reasoning
`docs-ui.js` ~2006 already records, not re-litigated.

### R5 and R6 are the measured divergences from Phase 2

R5 is the `> 1` threshold the badge does not honour. R6 is the badge/panel
identity, which is ALREADY TRUE and currently unguarded — so it is a
regression requirement needing a test rather than an implementation.

## Phase 4 posted — and measuring the impact found a defect under the defect

`A_DefineReqs` and `A_CompareOptions` complete; the process now stops at
`BA_ReviewReqs`, the requestor's lane.

**Correction to this bean's Phase 3 note.** It said `A_DefineReqs` would close
on the requestor's reply. That was written before Phase 4 ran and was wrong:
the step is the AGENT's and covers both phases, so once both were posted its
work was done. Holding it open would have misreported where the process is.

### The finding: `folio-todo-index/v1` HAS NO SCHEMA

Measured: the string `folio-todo-index` appears in exactly two places in the
repository — a literal in `gen-docs-pages.ts:951` and four fixtures in
`sticky-todos.e2e.ts`. **No Zod type, no published JSON Schema, no module.** A
consumer reading `"$schema": "folio-todo-index/v1"` and going looking finds
nothing.

**And the version has not moved while the shape has.** This session alone:
`b7b87fdd` (pb04) added `viewHref` and `editHref`; `e7690f0a` (5y4b) added
`theme` and a top-level `themeArt`. Still `v1`. **Two of those are mine and I
did not notice** — which is the argument, not an aside: the convention is
unenforced, so nothing could have told me. Same class as R3 one level up.

### Impact, briefly

- **Schema**: a `board` type and a declared zoom threshold are new; the index
  document changes; **no note schema changes**, because the positions ruling
  already holds and the board JOINS rather than annotates.
- **Pipeline**: `gen-docs-pages.ts` is the only writer, `docs-ui.js` the only
  reader. The `d2kp` reproducibility constraint is load-bearing and nearly
  invisible — this file was once UNREPRODUCIBLE because `readdirSync` under Bun
  returns raw directory order, so any added field must keep the emitted key
  order fixed.
- **Adapter**: a MEASURED nil. Notes are not block kinds, so nothing reaches
  `adapterForKind`, `BLOCK_KINDS` or the profile check.
- **Folio**: none here; **downstream is could-not-determine rather than none**,
  because `litlfred/qou` is not in this checkout and this repository's own rule
  refuses to render that as clean.
- **Consumer**: `target` added, nothing removed, no IRI moves, and a convention
  **removed** (the `sec:<page>-<node>` parse). One convention REMAINS — the
  `$schema` naming a schema that does not exist — and R3 does not fix it.

### The decision handed over

Three options for the missing schema, compared per `decision-comparison` with
Pro, Con, **Downstream impact** and Reversibility per row rather than three
linked analyses. Recommendation **C** — define `v1` as what is actually
published — because exactly one reader exists and it is ours, so the usual cost
of defining a version late is not being paid. **Stated default: silence means
C.**


## Promoted to an epic, 2026-09-20 — and why the parent moved

CRDM Phase 5 produced **ten implementation units** (`8hg7`, `f76l`, `1rta`,
`51wf`, `0jtj`, `t4my`, `db7g`, `le8b`, `zsah`, `q2wm`, `sd8x`), and
`check:bean-parents` enforces `milestone -> epic -> feature -> task`: a
`feature` may not be a parent at all. So this became an epic, and an epic's
parent is a milestone rather than another epic — hence `p5wm` (GOAL 2) in place
of `yj32`.

**Nothing about the work changed and no information was lost.** `yj32` — HARNESS
AS INTERFACE — is still the theme this belongs to, and its own parent is `p5wm`,
so this sits in the same goal one level up rather than somewhere else. If you would
rather it stayed a feature under `yj32`, the alternative is to reparent the ten
tasks onto `yj32` directly; both are one line of front matter.


## Placement settled, 2026-09-21 — stays an epic under `p5wm`

Asked as a selection: `6lb8` sits beside `yj32` under milestone `p5wm`, and the
two describe overlapping subject matter — `yj32` calls the board part of a
harness instance's default rendering. Three options were put: leave it, reparent
it under `yj32`, or close the epic now and re-home `q2wm`'s remainder.

**The owner chose: leave it under `p5wm`.**

The reasoning that went with the recommendation, recorded so it is not
re-litigated: reparenting a 12-of-13-complete epic under an epic that is still
`todo` makes the roadmap LESS legible, not more, and the overlap costs one extra
read rather than a wrong answer. Closing it now was the expensive option — beans
are never deleted, so a closed epic reopened reads as churn.

`q2wm` stays the one open child. Its Tool-output render vocabulary and lazy
window fetch remain recorded as partial with their reason: nothing renders a
tool's output even now, so choosing the vocabulary would be choosing terms with
no consumer to constrain them.
