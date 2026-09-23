---
layout: default
title: 'A tile is the harness''s, not the node''s'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/folio-core/harness-tiles.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/folio-core/harness-tiles.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/folio-core/harness-tiles.md){: .fa-edit-source }

{% raw %}
# A tile is the harness's, not the node's

The owner, 2026-09-20, correcting the question rather than answering it:

> no, its not a function of nodes, its a function of a harness watching a
> directort in repo root/ … basially if harness declares visaluzers, those
> should have tile. defaults to theme, but new can be changed. harness can
> declare >= 1 visualiztion (which then has a title)

**So the tile set is not a new registry — it is the visualiser obligation made
reachable.** `SubgraphCoverageSchema.visualiser` is where an instance says what
renders a directory, and `kg:audit` already reports which directories owe one.
A graph that owes a visualiser owes a tile, and the audit that already says so
needs no second list free to disagree with it.

## Instantiated is a different fact from declared

> only the instiatiated harnesses (not all dependent ones) in teh folio… so
> repo root has `<harness>.config.json`

The declaration says what an instance **declares**. `<name>.config.json` at the
instantiation root says the instance is instantiated **here**. The navbar could
not be derived from the declarations alone, and a directory listing is not the
question a reader is asking.

Dependencies keep a group of their own rather than disappearing. Making the
distinction a **disappearance** would answer *"where did who-iris go"* with
silence.

## A tile opens the INSTANCE, not a kind handler's view of it

`scripts/mount-instance-docs.ts` carries the owner's own rule for the two
routes:

| route | handler | what it is |
|---|---|---|
| `/<kind>/<instance>/` | the kind's, cat-harness's | the default rendering any instance declaring that kind gets |
| `/<instance>/` | the instance itself | its own themed root |

> `/docs/who-iris/` should be the cat-harness handler default for docs.
> who-iris themed at `/who-iris/`.

So the tile's target is the instance's **own themed root** when it has one, and
a handler's viewer only when it does not — *"cliking shoud go to folio view,
not the schema viweer"*. The viewers stay reachable, listed beneath.

An instance **has** that root when it has its own site directory, read from its
own declaration. Probing the BUILT site gives the wrong answer: an instance
whose pages are generated at build time has none in a working tree that has not
run its generator, while the published site plainly does.

## Order is the declared dependency stack, reversed

> So bootsteap, cat harness, fa-core, f-a, from bottom to top.

Computed from the declared `needs`, never written out as names: a name list is
a rule true only for the instances somebody remembered. The spine's head keeps
the top and its floor keeps the bottom.

**An instance whose layer nobody declared is undetermined** — placed below the
head, alphabetically, carrying a finding that says its place is not derived.
Absent is not `[]`: one is nobody having said, the other is an instance
asserting it sits on nothing.

**A broken graph does not blank the navbar.** `flattenDependencies` returns an
empty order on a cycle, which is right for a pipeline and wrong for a sidebar,
where showing nothing hides every instance over one typo. The problems are
reported and the list falls back to alphabetical.

## Two gaps, reported rather than hidden

Both are the third state, and they are DIFFERENT findings:

- **declared and not rendered** — a graph the instance declares with no
  published page. Not linked (`pb04`: a dead link invites a click and then
  reads as *"this site is broken"*), and reported.
- **rendered and not declared** — a page published under a kind the instance
  does not declare. Also not linked, because the declaration decides what a
  tile may claim to show — but staying silent would hide a working viewer
  behind a rule, and the remedy is one line in a declaration.

## An inert row SAYS why, and "no viewer" is four answers

A declared graph with no published viewer appears in the navbar as a row that
does not open. **Drawing it grey is not saying it.** Until 2026-09-23 the two
navbar surfaces disagreed about whether it was said at all: the Jekyll sidebar
carried `title="declared, with no published viewer"` on a `<span>`, and the
mounted rail carried `opacity:.55` and no words.

Both are `gjli`, for different reasons, and both are worth recognising
elsewhere:

- **A `title` on a non-focusable element is a label for a pointer and for
  nothing else** — no keyboard path, and not reliably announced. It is not the
  accessible name it looks like.
- **Dimming alone is state carried by contrast.** The dim was not even a
  contrast failure here — measured, `opacity:.55` over `#1f2328` composites to
  5.03:1 — which is the point: it passed the ratio and still said nothing.

The fix is that the reason is **content**: real text in the row. It is in the
accessibility tree because it is text, it survives a stylesheet that does not
load, and it cannot disagree with a second signal because there is no second
signal. `aria-disabled` is the wrong reach — **nothing is disabled, because
nothing is a control**, and marking a `<span>` disabled announces a widget that
does not exist.

**And the wording is not one wording.** "No viewer" is four states, and
`inertNote` (`harness-tiles.ts`) is where they are told apart, because that is
where the four *findings* were already worded:

| state | the row says | is it a gap? |
|---|---|---|
| declared `publish: "staging-only"` | staging only | **no** — withheld on purpose |
| instance declares `renderExemption.of: ["visualiser"]` | no viewer by design | **no** — the owner's 2026-09-20 ruling |
| a viewer exists off the conventional path | viewer not published | yes, and a different one |
| nothing declares a viewer | no viewer yet | yes |

One wording for all four was wrong for two of them — and labelling an intended
state a gap is the same disease as hiding a real gap, which this generator's
own comments say twice about exactly these two cases.

**Neither navbar picks the words.** They render what the generator gave them,
which is what keeps them one navbar rather than two that agree by maintenance.
A kind the generator said nothing about renders with no claim about why: the
third state, and honest — it is the state both surfaces were in before.

## A tile, or an avatar? WHO DECLARED IT (settled 2026-09-21)

The question this skill left open, in the owner's words: *"use same SQUARE
TILES that are in the expanding menu of LHS navbar **OR use theme/avatars as
appropriate**"*. When is a thing on the folio a tile, and when its own avatar?

**One test, and it reads a declaration that already exists:**

> **A tile is what the HARNESS declares. An avatar is what the FOLIO holds.**

| the thing | renders as | because |
|---|---|---|
| a declared visualiser (`SubgraphCoverageSchema.visualiser`) — a directory or sub-graph | **tile**, *functional* | the harness declares it; §"A tile is the harness's" above |
| a set of schema instances — `todos` | **tile**, *content* | the harness declares the set; the instances are the folio's |
| a note, a document, a materialised asset in the folio's `reproduce` directories (`library/`, `uploads/`) | **avatar** | the folio holds it; it is the reader's, not the harness's |

### A TILE IS ONE OF TWO KINDS, and they bind to different things

The owner, correcting the first draft of this rule:

> content tiles = todos are schema instances. different from dir/sub-graph
> tiles = functional (they infact visual interfaces to skills implemented by
> some (potential choice of) tools)

"Who declared it" answers **tile or avatar** and stops there. It does not say
what a tile IS, and the two kinds are not interchangeable:

| | **functional** tile | **content** tile |
|---|---|---|
| subject | a directory or sub-graph | a set of schema instances |
| **bound to** | a **SKILL** | a **SCHEMA** |
| resolved when opened | a **tool** that implements the skill | the **instances** |
| what empty means | **a gap to report** — a skill nothing implements is unreachable | **a real state** — "nothing outstanding" is not "broken" |

**A functional tile names the SKILL, never the tool**, and that is the
operative rule rather than a distinction for its own sake. `schemas/tool-types.ts`
exists to make tools interchangeable — *"Two tools satisfying one skill —
`beans-cli` and `beans-manual` — must declare the same input type, or 'these
are interchangeable' is an assertion nothing can verify"* — so a tile bound to
a tool is a tile that breaks the moment the other tool is chosen. The choice is
the point; binding past it throws it away.

**The same latitude exists one level out**, which is why this is a shape the
corpus already has rather than a new one: `VisualiserDeclarationSchema` takes
*"one path, or several visualisations"*. A sub-graph may be rendered more than
one way, exactly as a skill may be implemented by more than one tool.

**The empty asymmetry is not a detail.** `head_custom.html` already records the
content half — *"a board that opens empty is indistinguishable from a person
with nothing outstanding, and those are opposite facts"* — so a content tile
opening on zero instances is CORRECT and must not be hidden. A functional tile
whose skill has no tool is `pb04`: an affordance that promises and delivers
nothing, and a gap to report rather than a state to render.

**THEME IS NOT A THIRD KIND, and reading it as one is the mistake the
question invites.** A theme is a palette and its art. A tile already takes
*"the avatar's declared hue"*, and the owner's 2026-09-20 line says the same
thing from the other side — *"defaults to theme, but new can be changed"*. So
theme is **how either one looks**, never an alternative to being a tile.

### The case that settles it, and the two rules it kills

R30 puts *"sticky notes/avatars of materialized assets (including materialized
KG like bootstrap, cat-harness)"* on the glass. **A whole knowledge graph
renders as an avatar.** That one sentence falsifies the two rules a reader
reaches for first:

- **"Many behind it → tile, one → avatar"** — `cat-harness` materialised is a
  whole graph and is an avatar. Adopting cardinality means overruling R30.
- **"Opens a viewer over a set → tile"** — opening that avatar *does* open a
  viewer over a set, so this rule makes it a tile. Same contradiction, and it
  additionally needs a per-item declaration of what selection does, which
  nothing carries today.

Declaration ownership survives because **a materialised asset is in the
reader's `folio/` however big it is**, and that is the fact being read.

### The consequence that looks like an inconsistency and is not

**The same subject can be both.** `todos` is a **content tile** in the strip
*and* an individual todo is an **avatar** on the glass. Those are not two
answers: the tile is bound to the SCHEMA and the avatar is one INSTANCE of it,
so the rule gives one answer per object and they happen to share a name. The
content/functional split above is what makes that legible — a content tile is
*supposed* to stand for instances that render individually.

### What is checkable here, and what is not

**Tile-vs-avatar is not.** Nothing classifies a folio item yet; the rule
governs authoring and the renderer reads the graph an item came from, which is
already unambiguous. A gate there would be a declared property whose check
cannot answer its own claim — R17's lesson.

**"A functional tile names the skill, never the tool" IS**, and it is written
down as a claim with a subject rather than as advice: a declared visualisation
naming a tool id where a skill name belongs is decidable against
`knownSkills()` and the Tool graph. No such tile exists yet, so nothing is
gated today — but the difference between the two halves is that this one has a
subject the moment one does, and the other still would not.

## The navbar icon row is DECLARED, and three states is not two

Owner, 2026-09-22: *"max is 6 and one for todos one for beans one for
processes viewer/ (the factory flow) one for KG viewer"*, and then, on where
the list lives: *"should be in each harness config which are shown (so some
could show none, but make this default in cat-harness that is inherited)."*

`navbarIcons` on the instance declaration. A **closed** set — `close`,
`todos`, `beans`, `processes`, `kg`, `launcher` — because a free string lets an
instance name an icon nothing draws, and the failure is a silent gap in a row
capped at six. Six is the cap and it is **refused, never truncated**: an
instance that declared seven has made a decision, and silently dropping its
last entry overrules that decision without saying so.

**The three states are the part to get right, and two of them look the same:**

| declared | means |
|---|---|
| absent | **inherit** — walk `needs`, site owner as the floor |
| `[]` | **show none**, which the owner asked for by name |
| a list | this instance's own answer |

Absent and `[]` must not collapse. The guard is `!== undefined`, never a
truthiness test — that shape is exactly what turns "nobody has said" into
"nothing to show", and it would make an un-migrated instance
indistinguishable from one that deliberately wants a bare navbar. The same
rule runs all the way down: `resolveNavbarIcons` returns `undefined` for
undetermined, `harness-tiles.ts` **omits** the field rather than writing `[]`,
`sync-docs-harness.ts` emits `null`, and the client draws no row and says so
once. Four layers, one distinction, preserved at each.

**The walk is `needs`**, not a second traversal. Nearest declaration wins,
breadth-first toward the foundation. It is the direction `resolveSkillDirs`
already composes and the spine `builtOn` documents; a new walk would be a
second answer to "what is this instance built on", free to disagree with the
first.

**Destinations are looked up, never written down.** They come from the
instance's own declared visualisations plus `siteLinks`, so an icon whose
graph this instance does not publish gets no href and renders as a **non-link**
— `pb04`, the same choice the tabs' graph list makes. `close` and `launcher`
carry no href on purpose: they drive controls on the page, and giving them one
would make them look like navigation.

## The theme avatar: the assignment is theme-mediated, and I got this wrong once

*"use theme avatar not the purply thing."* The navbar's mark is the instance's
**theme card art, clipped** — not its `icon`, which on this instance is the `@`
glyph.

The chain, and every link of it already existed:

> instance → its sticky contribution → the sticky's `theme` → the theme's
> `imageRole` → the instance's images carrying that role → the `card` layout →
> its `avatarRegion`

`resolveThemeBackdrop` is the join and returns the `DeclaredImage`, so the crop
comes with it.

**This was reported on 2026-09-22 as "an assignment nobody has made", and gap 6
was left unwired on that basis.** The report was wrong: it looked only for a
direct harness→card link, found none, and concluded none existed — while the
mapping ran through the theme the whole time. Worth keeping because the failure
is cheap to repeat: *an indirection is not an absence*, and "I could not find
it" is a statement about the search.

**Take the `card` layout, not laptop or mobile.** `KgImageSchema` refuses a
non-square `avatarRegion` in **pixels**, and only the square crop can satisfy
that — equal fractions on a landscape image are a box 1.78× wider than tall,
and the clip scales width and height separately.

**A card with no declared crop is a finding, not an avatar.** Rendering the
whole 1254px composition in a 2rem frame is `603s`'s "grey mush". Report it and
fall back to the mark.

## Where a tile lives, and what it must not eat

Tiles render in the navbar **and** on the board: one declaration, per-surface
visibility, never two registries free to disagree about what a tile is.

**On the board they are a strip along the TOP, and it starts OPEN.** Both
halves are rules rather than defaults to tune:

- **The top, not the bottom, and not in flow.** In flow the strip lands below
  the cards, and on a board of full-bleed art it reads as absent — which is the
  failure this placement exists to fix, not a cosmetic one.
- **Open, because closed reads as absent too.** Tiles a reader must open before
  they can see what a folio offers have the same effect as tiles that are not
  there. Sliding the strip up is the reader's act; it is never the starting
  position.
- **`sticky`, never `fixed`.** The strip belongs to the FOLIO: it travels with
  the board and goes when the board goes. A viewport-fixed bar is chrome for
  the *page*, a different object, and would follow a reader onto content with
  no tiles at all.
- **Chrome along the board, not a panel within it.** It carries no card, no
  content and no second surface. An open window passes **over** it, because
  chrome frames content and never the reverse.
- **An empty strip does not render.** A row that opens on nothing is `pb04`'s
  failure — an affordance that promises and delivers nothing.

**A board tile is SQUARE, and it is the launcher's tile.** Same template, same
declaration; what differs is the surface's geometry. Square is a measured
property rather than a declared one — assert the box, not the stylesheet.
`aspect-ratio` gives a height only while the content fits inside it, and a flex
line's default `align-items: stretch` un-squares every tile on a row the moment
one caption wraps. Both failures are invisible in a screenshot.

They are **collapsible**, with the count on the summary so a collapsed list
still says how much is behind it. That is not polish — a fixed-height sidebar
with a dozen fat tiles pushes the page nav off the top, which is a navigation
failure rather than a crowded one.

Theming comes from the avatar's **declared hue**: one hue, both schemes
derived, so no tile can be authored legible in one mode and invisible in the
other. A per-instance palette would be a second colour vocabulary beside
`theme.ts` — the drift that file exists to have ended.
{% endraw %}
