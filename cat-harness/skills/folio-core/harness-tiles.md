---
name: harness-tiles
description: >
  A tile is a function of the harness watching a directory, not of nodes.
  Where the tile set comes from, what a tile opens, and the two gaps it reports
  rather than hides.
adapters: [document, paper, dak]
profiles: [document, paper]
consulted: true
---

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

## A tile, or an avatar? WHO DECLARED IT (settled 2026-09-21)

The question this skill left open, in the owner's words: *"use same SQUARE
TILES that are in the expanding menu of LHS navbar **OR use theme/avatars as
appropriate**"*. When is a thing on the folio a tile, and when its own avatar?

**One test, and it reads a declaration that already exists:**

> **A tile is what the HARNESS declares. An avatar is what the FOLIO holds.**

| the thing | renders as | because |
|---|---|---|
| a declared visualiser (`SubgraphCoverageSchema.visualiser`) — `fsh-guts`, `todos`, `docs` | **tile** | the harness declares it; §"A tile is the harness's" above |
| a note, a document, a materialised asset under `folio/` | **avatar** | the folio holds it; it is the reader's, not the harness's |

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

**The same subject can be both.** `todos` is a tile in the strip *and* an
individual todo is an avatar on the glass. Those are not two answers: the
todo **viewer** is harness-declared and the todo **item** is folio content,
so the rule gives one answer per object and they happen to share a name.

### Why there is no check for this

Nothing classifies a folio item yet — the rule governs authoring and the
renderer reads the graph an item came from, which is already unambiguous. A
gate here would be a declared property whose check cannot answer its own
claim, which R17 already recorded as worse than prose.

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
