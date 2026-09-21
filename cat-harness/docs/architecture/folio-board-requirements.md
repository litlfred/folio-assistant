---
layout: default
title: The folio board — requirements as agreed
parent: Architecture
nav_order: 8
---

# The folio board — requirements as agreed
{: .no_toc }

1. TOC
{:toc}

---

## What this is, and what it is not

**A design record.** It states what was agreed for the folio board, in the CRDM
run on [issue #602](https://github.com/litlfred/folio-assistant/issues/602)
between 2026-09-20 and 2026-09-21, and it exists so that a person asking *why
is the board shaped like this* has one place to look.

It is **history, not instruction**, and that is the line the owner drew: a
skill carries what a competent practitioner needs *in order to do* the task,
and everything past that — the reasoning, the options not taken, the
measurements behind a threshold — is documentation. Every sentence below describes what was
agreed on a date, against a repository in a state. Where the implementation has
since diverged, the divergence is stated rather than smoothed. Nothing here
tells an agent what to do — the rules an agent follows live in the
`cat-harness` skills this set produced, and the processes live in the three
executable BPMN diagrams beside them.

**Filed here on the owner's ruling, 2026-09-21:**

> this is a memory asset as part of design, so it goes into docs/ […] this was
> an asset as part of building a feature […] but it is not the content we want
> displayed itself.

**And why it is in `cat-harness/docs/` specifically**, sharpened the same day:
*"if it is realated to some harness/feature/tool that detailed infromation/
design/planning/etc go into that harness' docs/"*. The board's schema and
behaviour live in `cat-harness` by the requester's own layering, so the record
of why they are shaped that way lives in that instance's `docs/` — not in the
repository root's, and not in a folio's.

The class, and why `fsh-guts` was the tempting wrong answer for it, is in
[`kg-contribution-offer`](https://litlfred.github.io/folio-assistant/reference/skill-instructions/kg-contribution-offer.html);
where inside `docs/` such a record files is in
[`placement`](https://litlfred.github.io/folio-assistant/reference/skill-instructions/placement.html).

---

## The need, in the requester's words

The whole set derives from this, kept verbatim because the layering sentence is
precise and a paraphrase loses it:

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

Two things in it are **constraints rather than preferences**, and both shaped
everything after:

- **the `todos/` ↔ `cat-harness` split** — content under `todos/`, schema and
  behaviour in `cat-harness`, tools kept distinct from schema;
- **"ALWAYS collapsable to linearly rendablee"** — an accessibility floor. A
  board that cannot be read linearly cannot be read by a screen reader, printed
  or translated.

---

## Round one — R1 to R7

Agreed in Phase 3. Of the seven, **exactly one introduced a genuinely new
mechanism**; that finding is why the implementation was ten small units rather
than one large one.

| | requirement | new mechanism? |
|---|---|---|
| **R1** | the board renders content, not only notes | no — a second rendering of an existing relation |
| **R2** | semantic zoom, with the threshold **declared** rather than a literal | **yes — the only one** |
| **R3** | `targetLabel` publishes its parts | no — a bug fix |
| **R4** | linear collapse, reachable without JavaScript | no, but it constrains R1 |
| **R5** | the badge counts only when `> 1` | no — two lines |
| **R6** | badge and panel stay **one** query | no — a regression test for something already true |
| **R7** | badges on avatars | no — R2 plus R6 |

### R1 — the board renders content, not only notes

The board SHALL render content nodes alongside notes, and a note attached to a
content node SHALL render **at that node** rather than at an independent
position.

*Accepted when* a board with one note attached to a block and one attached to
nothing renders **both** — the first at its block, the second at its declared
position. Removing the attachment moves the note to its position rather than
hiding it: "attached to nothing" is an existing declared state, not a new one.

### R2 — semantic zoom, with a declared threshold

As the board shrinks, a card SHALL stop rendering its words and render its
**avatar** instead. The threshold SHALL be **declared data**, not a literal in
the renderer.

*Accepted when* the card renders text at a declared size and its avatar below
it, a kind with no avatar takes `GENERIC` rather than rendering blank, and the
behaviour is **falsified in both directions** — a test that only checks the
shrunk case passes for a board that is always avatars.

*Consumer burden:* the threshold is **emitted**, never documented. *"We don't
need to emit it — the renderer knows"* is the smell this phase names.

### R3 — `targetLabel` SHALL publish its parts

The published todo index SHALL emit a note's **page and node as separate
fields**, not only the composite `targetLabel`.

This one was a **defect in something already published**. The value is
`sec:<page>-<node>`, page-qualified for a good reason — the bare node id
`what-is-not-built-yet` existed on two pages. But any consumer asking *which
page is this note on* had to string-manipulate: know the `sec:` prefix, know
the separator is `-`, and know node ids themselves contain `-`, so the split is
not unambiguous without already holding the page list.

**Our own client escaped it by accident**, matching on the whole string and
never parsing, which is exactly why it went unnoticed.

### R4 — the linear floor

The board SHALL always be collapsible to a linear rendering that works without
JavaScript. Movement SHALL be **keyboard-operable**; drag MAY be an accelerator
and SHALL NOT be the only way in — this instance's declared interaction profile
is low-dexterity.

### R5 to R7 — the badge

The badge SHALL show a count only when more than one note is attached (R5); the
badge and its panel SHALL be **two readings of one query** rather than a number
somebody maintains (R6); and an avatar carries the same badge from the same
query as the card it replaced (R7).

**A badge that can disagree with its own panel is the defect designed out**,
and it is designed out by derivation rather than by discipline.

---

## Round two — R8 to R14

These arrived **after** the requirements gateway had closed, and were checked
against the declared model rather than assumed compatible. They are additive:
nothing already agreed was invalidated.

| | requirement | relation to round one |
|---|---|---|
| **R8** | the dynamic board is an **overlay**; the standard rendering is a simple tile listing | **sharpens R4** — the floor is a tile listing, and movement is additive over it |
| **R9** | **everything starts as an avatar**; opening is an explicit act, `[x]` closes back | **splits R2** into two mechanisms — an explicit open/close a person performs, and automatic zoom by size. Conflating them is the defect to design out |
| **R10** | an open card is a panel with **fixed controls**, plus others depending on content; each content type controls its own rendering | the kind owned the zoom threshold; it now owns its whole rendering, under a chrome contract it cannot reach |
| **R11** | `fsh-guts` is a tile, and `[fishbones]` puts content into it as a **confirmed** action | new; reuses the declared non-rendered trashcan, whose founding rule is *do not delete unless explicit confirm* |
| **R12** | create a new sticky note — itself a tile | new |
| **R13** | filter the board by kind properties, **interactively** | a *reader's* filter at view time, distinct from the board document's *declared* filter. Two things that must not become one field |
| **R14** | resize open content, move it, drag and drop | rides R4's floor: drag is an accelerator, keyboard operation is not optional |

Recorded alongside them as scope rather than as a requirement: **"do all the
skills and bpmn workflows"** — each of these gets its skill and its diagram,
not only its schema.

---

## R15 and R16 — reconstructed, then confirmed

**They were referenced but never written down.** Bean `51wf` is assigned
*"R2, R9, R15"* and bean `zsah` *"R12, R16"*, and no comment on #602 states
either requirement. When this record was first written they were therefore
reported as **undefined**, with the recoverable meaning marked as inference —
because a design record that fills its own gaps with plausible sentences is
worse than one that names them, since invented text reads exactly like agreed
text.

**The owner confirmed both readings on 2026-09-21** (*"agreed on r15/16"*), so
they are now agreed requirements rather than reconstructions:

| | requirement | how it was recovered |
|---|---|---|
| **R15** | selecting any part of an open window **raises** it — z-order is a reader's act | `51wf`'s unit description, *"z-order with raise-on-select"* |
| **R16** | a tile opens the **existing** visualisation; nothing builds a second viewer | an aside on the issue, *"R12/R16 said a tile opens the existing visualisation"* |

Both were implemented to that reading before it was confirmed, which is why the
gap mattered: the code was already committed to an interpretation nothing had
stated. **The provenance is kept rather than tidied away** — a requirement
recovered from a bean's unit description and later ratified is not the same
artefact as one written down at the time, and a reader re-checking this
subsystem should know which it is.

---

## R17 — render safety

The last instruction became its own requirement: *"skill tool hints for XSS…
lazy load… assume assets in KG accessible, dynamic render where can"*.

**Only part of it has a subject.** The `Url` half shipped as
`schemas/safe-url.ts`, default-deny, with a source-level check that a renderer
ignoring it fails a test rather than shipping. The Tool-output render
vocabulary did **not**, and the reason is recorded rather than deferred
silently: nothing renders a *tool's* output even now, so choosing the terms
would be choosing them with no consumer to constrain them — a declared safety
property whose check does not answer its claim is worse than prose, because
prose is honestly unchecked.

---

## Round three — R18 to R32, the folio *visualisation*

These arrived on 2026-09-21, after R1–R17 had shipped and while `v0jv`'s tile
dock was still unmerged. They are the first round that is **about the folio as
a surface** rather than about the board's mechanics, and two of them corrected
work that had not yet landed — which is why they are recorded as a round rather
than folded into the requirements they revise. Reading them as amendments would
lose the fact that a shipped-to-branch design was turned round before a reader
ever saw it.

### Geometry — R18 to R23

| | requirement | in the requester's words |
|---|---|---|
| **R18** | the board's spacing SHALL be condensed | *"to much padding between panels, condense"* |
| **R19** | the board's tiles SHALL be the **same square tiles** as the LHS navbar's expanding menu, *or* a theme/avatar where that is the better fit — **which is which is R19b, settled below** | *"i meant to use same SQUARE TILES taht are in the expanding menu of LHS navbar OR use theme/avatars as appraopriate"* |
| **R20** | **no sub-panels.** One open, Miro-like board; everything lives on `fa-sticky-board` / `fa-landing-board` | *"i dont want sub-panels of the folio, just one open (miro-like) board"* |
| **R21** | stickies SHALL be **closed avatars, and small** | *"THE STICKIES MUST BE CLOSED AVATRS AND SMALL"* |
| **R22** | the folio visualisation SHALL have **no rounded corners** | *"drop all the rounded corners… too much dead space"* |
| **R23** | the square tiles SHALL be lined up along the **top** of the board, and the whole strip SHALL slide up when the reader does not want it | *"lets have the square tiles lined up on the top of the folio-sicky-board-landingpanel whole slides up if user doesnt want"* |

**R23 reverses `v0jv`, and that bean's own text says why the reversal was
available.** `v0jv` quoted the owner as *"stacked around (bottom?) of folio"* —
the parenthesis and the question mark are the requester's, and were carried
into the bean verbatim precisely because they marked an open question rather
than a decision. The dock was built to the bottom, closed, and R23 settles both
halves the other way: **top**, and **open by default**. The default is the half
that would have shipped silently — tiles a reader must open before they can see
what a folio offers read as absent, which is the complaint `v0jv` itself opened
with about the in-flow row.

**R21 and R22 share one reason, and it is not taste.** *"Too much dead space"*
is the stated cost in both. A corner radius on a card that is 320px wide spends
its corners on nothing; a sticky that opens by default spends the board on one
note. Recording the reason matters because the two requirements have different
*limits*: dead space is recoverable from a panel and is not recoverable from a
pill, which is why the count badges keep their `999px` and the record says so
rather than leaving a reader to discover the exception in the stylesheet.

### The folio is a **convention**, not a page — R24 to R29

This is the layering statement of the round, and it is the one a paraphrase
would lose:

> these requriements are really for how the "folio" visuallation from
> cat-harness should work. that should by convention be available on any
> harness for consistent feel. who-iris, smart-\*, etc are content libraries a
> user is browsing and their "folio" from the cat-harness is consistent across
> them. todo, etc can refernces cross KG library. who-iris, implements its own
> landing page and smart-\* has/will have its own harness

| | requirement | note |
|---|---|---|
| **R24** | the folio visualisation is **`cat-harness`'s**, and SHALL be available by convention on **any** harness, for a consistent feel | the harness supplies the folio; the instance supplies the library |
| **R25** | a reader SHALL be able to **pull their folio down** over whatever they are browsing | *"the user in visualization should be able to pull down their folio"* |
| **R26** | `cat-harness` SHALL declare **`folio/`** as the directory of the reader's own content | a declared `ContentDirectory`, like every other graph |
| **R27** | **materialised** assets from the static KG SHALL live in the folio — **settled 2026-09-21, see below** | *"clarifying if KG is static w/ materizlied…, materialized should live in folio"* |
| **R28** | new documents a reader creates **or links to** go in `folio/` | linking is a creation act here, not a reference |
| **R29** | todos and sticky notes MAY reference things **across** KG libraries | *"todo, etc can refernces cross KG library"* |

**A content library is not a folio, and the distinction is what R24 buys.**
`who-iris` and the `smart-*` instances are things a reader *browses*; each may
implement its own landing page and its own harness. What travels with the
reader between them is the folio — their notes, their materialised assets,
their links — and it looks and behaves the same in each because it belongs to
`cat-harness` rather than to any one library. **Consistency is the
requirement**, not similarity: two harnesses that each build a good folio have
failed R24.

### An asset has **three** states, not two — R30

Clarified in a follow-up the same day, and it is the requirement most likely to
be implemented as two states by somebody reading quickly:

> pulling down folio panel = glass/window on which stikcy notes/avatrs of
> materialized assets (including materialzied KG like bootrstap, cat-harness
> are visualized. they can also be closed and returned to their homes (e.g.
> "back in library", matieral asset still in folio/ but not displayed in
> folio, need to go back to library and pull it out to folio display window)

| | requirement |
|---|---|
| **R30** | an asset SHALL have three distinguishable states: **in the library** (not the reader's), **in `folio/` but not displayed** (materialised, theirs, off the glass), and **on the glass** (displayed in the pulled-down folio). Closing it from the glass returns it to the second state, never the first; returning it to the first is a separate act performed **from the library** |

**Why three rather than two.** A two-state model — *in the folio* or *not* —
makes closing a sticky and un-materialising an asset the same gesture, so a
reader tidying their glass silently discards work. The middle state is what
makes closing safe: the asset stays in `folio/`, and the way back onto the
glass is *"go back to the library and pull it out"*. That is also `l4zi`
applied one level up — the inverse of **close** must be reachable, and here it
is reachable from a different surface than the one that closed it, which is a
thing a design can get wrong without any single screen looking wrong.

### A sticky's face — R31 and R32

| | requirement | in the requester's words |
|---|---|---|
| **R31** | a closed sticky SHALL show its **condensed own text** — whitespace, newlines, bullets and list markers stripped. **No second string** | *"no, not hidden label, that's new data to maintain… just the condensend text"*, *"(strip whitesaplnce, newlines, bullets….)"* |
| **R32** | a sticky SHALL still be about **2.5 physical inches** on a large MacBook screen | *"sticky should stilll be ~2.5\" in large macbook screen"* |

**R31 rejected the recommendation that was put to the owner**, which had been a
hidden accessible label alongside the visible summary. The reason given is the
better one and is worth keeping: *"that's new data to maintain"* — a second
string is a second thing that can drift from the first, and a hidden label that
disagrees with the visible text is a defect no reader can see. Condensing the
text the sticky already carries has no such failure mode.

**R32 is a PHYSICAL measurement, and CSS cannot express it.** A CSS `in` is
defined as exactly 96 CSS px and is not an inch of glass. The 16" MacBook Pro
named in the requirement is 3456x2234 over a 16.2" diagonal — about 13.6" of
width — and presents 1728 CSS px across it, so one physical inch is roughly
**127 CSS px** and 2.5" is about 318px. `20rem` is 320px. Writing `2.5in` would
have rendered about 1.9" and looked like the requirement had been ignored. The
device is named in the code comment because the conversion is device-dependent:
the same `20rem` is about 3.7 physical inches on a 27" 1440p display, and that
is correct rather than a defect — the size was chosen for the screen the
requester uses.

**R21 and R32 are a pair, not a contradiction.** *"Small"* without R32 shrinks
the card until its condensed text is unreadable; R32 without *"small"* leaves
the dead space R18 was about. Either alone satisfies half the round and looks
like it satisfied all of it, which is why both are asserted.

### R19's second clause — reported open, then settled the same day

**It was recorded here as undefined**, and deliberately: *"OR use theme/avatars
as appropriate"* named a choice that nothing in the corpus said how to make,
and a rule invented to close the gap reads exactly like a rule that was agreed.

**The owner settled it on 2026-09-21**, choosing declaration ownership from
four options put to them:

| | the rule |
|---|---|
| **R19b** | a thing renders as a **tile** iff the **harness** declares it; as an **avatar** iff the **folio** holds it (a note, a document, a materialised asset in `library/` or `uploads/`). A **theme** is how either one looks, never a third kind |
| **R19c** | a tile is one of **two kinds**. A **functional** tile (a directory or sub-graph) is the visual interface to a **skill**, implemented by a **tool** chosen from potentially several — so it names the skill, never the tool. A **content** tile stands for a set of **schema instances** |

**R19c is the owner's correction to R19b, the same day**, and it is recorded
as its own requirement rather than folded in because R19b is still true and
still insufficient:

> content tiles = todos are schema instances. different from dir/sub-graph
> tiles = functional (they infact visual interfaces to skills implemented by
> some (potential choice of) tools)

*Who declared it* answers **tile or avatar** and stops. It does not say what a
tile **is**, and the two kinds bind to different things, resolve different
things when opened, and mean opposite things when empty:

| | **functional** | **content** |
|---|---|---|
| bound to | a **skill** | a **schema** |
| resolved on open | a **tool** implementing it | the **instances** |
| empty means | a **gap to report** — a skill nothing implements is unreachable | a **real state** — "nothing outstanding" is not "broken" |

**The operative half is "names the skill, never the tool."**
`schemas/tool-types.ts` exists to make tools interchangeable — *"Two tools
satisfying one skill — `beans-cli` and `beans-manual` — must declare the same
input type, or 'these are interchangeable' is an assertion nothing can
verify"* — so a tile bound to a tool breaks the moment the other tool is
chosen. The choice is the point.

**This is a shape the corpus already had**, which is the argument for it:
`VisualiserDeclarationSchema` takes *"one path, or several visualisations"*, so
a sub-graph may be rendered more than one way exactly as a skill may be
implemented more than one way. R19c names the two latitudes as the same
latitude.

**The empty asymmetry was already half-written too.** `head_custom.html`
records the content side — *"a board that opens empty is indistinguishable
from a person with nothing outstanding, and those are opposite facts"* — while
`pb04` covers the functional side: an affordance that promises and delivers
nothing.

**The provenance is kept rather than tidied away**, the same as R15/R16: this
is a rule recovered by argument and then ratified, not one written down at the
time, and a reader re-checking the board should know which it is.

**Two candidate rules were falsified by R30 before the choice was put.** R30
places *"avatars of materialized assets (including materialized KG like
bootstrap, cat-harness)"* on the glass — so a **whole knowledge graph renders
as an avatar**. That kills *"many behind it → tile"* outright, and it kills
*"opens a viewer over a set → tile"* too, since opening that avatar does open
a viewer over a set. Declaration ownership survives because a materialised
asset is in the reader's `folio/` **however big it is**.

**It is recognition rather than invention**, which is the reason to prefer it:
`harness-tiles` already carried *"a tile is the harness's, not the node's"*,
and the owner's own 2026-09-20 line — *"if harness declares visaluzers, those
should have tile. defaults to theme, but new can be changed"* — already said
both halves. The gap was that nobody had read them as an answer to this
question.

The rule lives in
[`harness-tiles`](https://litlfred.github.io/folio-assistant/reference/skill-instructions/harness-tiles.html),
with a pointer from `board-windows`. There is no check, and that is stated in
the skill rather than left as an omission: nothing classifies a folio item
yet, so a gate would be a declared property whose check cannot answer its own
claim — R17's lesson, one round later.

### R27 and question 1 — answered by the corpus, then settled

**The requester's own parenthetical marked this unsettled**: *"clarifying if
KG is static w// materizlied…"*. Measured 2026-09-21, the answer was already
in the corpus in three places, none of which had been read as answering it:

| | |
|---|---|
| `folio-assistant-core/schemas/materialization.ts` | **three states** — `referenced` (we know where, we hold no bytes), `materialized` (the bytes are here), `unknown` (we have not established which) — with **no default**, plus five gates, and `localPath` present **iff** `materialized` |
| `skills/workflows/materialize-remote.bpmn` | the act itself, as an executable **STRICT** process running five gates in a fixed order; `unknown` on any one keeps the node `referenced` |
| `skills/folio-core/directory-conventions.md` | the `catalogue` graph kind — *"a remote catalogue modelled BY REFERENCE … Distinct from `library`: that is content which IS here, this is the shape of a collection of which almost none is"* |

**So: yes.** The knowledge graph is static and modelled by reference;
materialisation is a separate, gated, checked act that produces bytes.
Question 1 needed no decision — it needed reading.

#### Where the bytes land — the part that DID need deciding

R27 says *"materialized should live in folio"*, and `who-iris` materialises
into `library/` (items and covers) and `uploads/` (source PDFs). **Neither is
`folio/`.** Three readings were put to the owner; they chose **the folio is
the reader's REPOSITORY**, of which `library/` and `uploads/` are already
declared parts:

```
{ id: "uploads", path: "uploads/", dependents: "reproduce", graphKinds: ["uploads"] },
{ id: "library", path: "library/", dependents: "reproduce", graphKinds: ["library"] },
```

`dependents: "reproduce"` is the schema saying **this is the reader's own
copy** — the exact fact R27 reaches for, and it predates R27.

**The literal reading would have broken a consumer, and that was found AFTER
the options were tabled.** It is recorded here for that reason rather than
folded into the argument as though it had been known.
`schemas/materialization.ts` states it outright — ***`corpus-grep` searches
`library/` only***, so a node materialised into `folio/` would read as ABSENT
to every consumer. That is the same defect the schema forbids one state up,
where collapsing `referenced` into `materialized` hides a node nobody holds.
Had the owner chosen the literal reading, it would have been a migration into
a known breakage, and the recommendation put alongside the options did not say
so because this had not been measured yet.

`folio/` is also the **renderable** graph kind, so the literal reading would
additionally have put a 40 MB PDF into the site build.

**R27 is therefore already satisfied, and already gated.**
`who-iris/scripts/check-catalogue.ts` checks that a `materialized` claim names
bytes that exist, with `local-path.ts`'s three states (`ok` / `missing` /
`unknown`) and bean `yl5w`'s scar behind it: *three claims resolved to nothing
and the gate said clean*.

### Still open from this round

**Whether the library view distinguishes materialised from not-materialised.**
The states now have a name and a schema — `referenced` / `materialized` /
`unknown` — so the question is no longer *is there a distinction* but *does
the reader's view render it*. Nothing yet says.

**F8/F9 is not built, and the gap is measured rather than asserted.** On the
deployed preview, `who-iris/index.html` loads `docs-ui.js` **0** times and
carries **0** boards and **0** tiles, against 9 / 1 / 28 on the
folio-assistant landing page. A reader browsing that library has **no folio at
all** — not a degraded one.

Both tracked on
[issue #796](https://github.com/litlfred/folio-assistant/issues/796).

---

## What the set produced

Each requirement's artefacts, so the record points at the code rather than
describing it:

| graph | what landed |
|---|---|
| `cat-harness` (BPMN) | `board-open-close`, `board-relocate`, `board-place-note` — executable diagrams with hand-authored Diagram Interchange |
| `cat-harness` (skills) | `board-windows`, `board-diagram-interchange`, `harness-tiles`, plus the `board-renderer` role and actor |
| `schemas` | `board-positions`, `window-stack`, `panel-chrome`, `reader-filter`, `semantic-zoom`, `safe-url` |

### One framing worth keeping

A **board is a diagram OF a folio**, in the OMG sense that a `BPMNDiagram` is a
diagram of a `bpmn:process`. The folio carries what is true; the layout layer
carries where it was drawn; the arrow runs `folio → board → position → note`
and never back.

Two consequences follow, and both are load-bearing: `board-positions` may not
put `x`/`y` on a note, for the same reason BPMN does not put coordinates on a
task — and **a folio is complete with no board.** Deleting every board loses
layout and no content.

---

## Where this diverged from what was agreed

One place, and it is recorded on the bean as well.

`51wf`'s checklist said *"every card starts as its avatar, at any size"*, which
cannot be literal alongside R2 — if cards are avatars at every width, R2 has
nothing to do. It was read as **"starts closed"**: a closed card shows its words
above the declared threshold and its avatar below it, with the avatar present at
every width as the control that opens the window. Flagged rather than silently
chosen, and **confirmed by the owner on 2026-09-21**.
