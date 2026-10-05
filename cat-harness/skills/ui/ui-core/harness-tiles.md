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

**A harness a KG subscription chose is instantiated by the same file**, with
no local declaration: its declaration is the substrate snapshot `kg:subscribe`
cached at the pin. `bun run kg:instantiate <subscription> <harness>` writes the
config and the harness's state directories, and refuses a harness that was not
chosen, not declared at the pin, or whose `needs` nothing here holds. The tile
is drawn from the snapshot (`scripts/subscribed-harnesses.ts`): it links
nowhere, because nothing of it is published here, and a snapshot that cannot
be read is a finding on the tile rather than an empty one. Issue #1719.

## Which harness `/` is: a flag, a default, and a hub (issue #1904)

The site's landing page is one of the **instantiated** harnesses, the same set
as the tiles. It is never the instance the generator happens to live in, and
never the repository's name. The owner's ruling, 2026-10-02, verbatim:

> Flag it, with a default (recommended). The chosen instance's own
> `<name>.config.json` carries `"site": { "landing": true }`. If exactly one
> harness is instantiated, it is the landing page and no flag is needed. That
> covers smart-trust. If there are several and none is flagged, a gate fails.
> If more than one is flagged, then neutral hub with listing of harnesses,
> todos,

| instantiated (`<name>.config.json` at the root) | flagged | `/` is |
|---|---|---|
| 0 | n/a | nothing to land on (`none`): a state of its own, not a default |
| 1 | n/a | that harness's landing, with no flag needed |
| several | exactly 1 | the flagged harness's landing |
| several | 0 | **`check:landing-instance` fails**: never guess |
| several | 2 or more | the **neutral hub**: the harness listing (`harness_details.html`, these tiles) and the todo panel (the landing sticky panel, not a second board) |

`resolveLandingInstance(repoRoot)` in `schemas/harness-config.ts` is the
**only** reader of the flag. `sync-docs-harness.ts` writes its answer to
`_data/harness.json` as `landingInstance`, `landing.html` branches on its
`kind`, and `library-graph.ts` / `schema-graph.ts` name an undeclared root
through `rootInstanceName`, which uses the same answer. A config that cannot
be read, or whose `site.landing` is not a boolean, makes the answer
`ambiguous` too: its flag might decide the case.

The flag is on the **config**, not the declaration, because the declaration
travels with the harness into every checkout that uses it, and the landing is
a fact about one checkout. A folio `folio_init` writes has one harness and
needs no flag; the second harness instantiated beside it is the moment to add
one. This repository flags `cat-harness` in `cat-harness.config.json`.

## "Harness" carries TWO senses, and only one of them is this rule

**Measured 2026-09-23** (bean `ogit`, [#1109](https://github.com/litlfred/folio-assistant/issues/1109)), after the owner asked *"why is detangle a harness? review all things labeled are harnesses -- are they?"*

`detangle` is no longer an instance at all — #1123 folded it into this harness as a directory the same day, which dissolves that particular question rather than answering it. The two senses below are why the question was worth asking anyway, and they outlive the example.

The rule above is a rule about **sense 1**. The word is also used, correctly
and by the owner, for something else:

| sense | what it means | how you tell |
|---|---|---|
| **1 — instantiated here** | this checkout runs it | a `<name>.config.json` at the **repository** root — `ls *.config.json`, not a number quoted here |
| **2 — a layer others instantiate** | a base a *downstream* repo stands up | nothing in this checkout. It is a statement about the layer's role in the stack |

**No count is given for either sense, on purpose.** The first draft of this
section said "5 of 19" and was stale within the hour: `smart-base` was
instantiated by #1129 while this page sat in review, making it 6. That is the
rule this corpus states everywhere and keeps paying for — *a count in prose is
a claim nothing checks* — caught here only because the merge that broke it
happened to land in the same session. Ask the filesystem.

Sense 2 is not loose talk. `smart-stack-layering` says *"the DAK harness every
smart-\* DAK repo instantiates"*; `fhir-harness`'s own description says *"what
a non-WHO implementation guide instantiates"*; the owner's bean titles use it —
`2yyh` **SMART-BASE HARNESS**, `wm63` **FHIR-HARNESS**.

**So a thing can carry the word and not satisfy this page's rule, and be
right.** `fhir-harness` is the clearest case: declared, not instantiated, and
it declares no visualiser either, so by the rule above it owes no tile and gets
none — while being exactly what a downstream IG instantiates.

### Do not write a checker for this

One was built and withdrawn, and the measurement is the argument. Anchored on
declared instance names beside the word: **246 findings** first, then **31**
after excluding names that contain "harness" — and **none of the 31 was the
defect being hunted**. Ten came from one generator template, four from the
retired declaration filename that `check:declaration-filename` already counts
(not written out here — that gate flagged this very paragraph for naming it,
which is the gate working), the rest from directory listings, hyphenated ids,
and the check flagging its own docstring.

A predicate that cannot separate its two senses is not a check. It is an
**adjudication**, and this corpus already says what that means: if a mechanism
could decide it, the process would not have been entered
([`adjudication`](../../sdlc/sdlc-core/adjudication.md)).

**What to do instead when the word is load-bearing:** say which sense, or say
the fact. *"instantiated here"* and *"a layer downstream repos instantiate"*
are both shorter than the ambiguity is expensive.

## A tile opens the INSTANCE, not a kind handler's view of it

(A viewer page is a RENDERING with its own IRI, separate from the asset it
shows; how the two IRIs relate is in `kg-viewer` §"The asset and its rendering
are two resources with two IRIs".)

`scripts/mount-instance-docs.ts` carries the owner's own rule for the two
routes:

| route | handler | what it is |
|---|---|---|
| `/<kind>/<instance>/` | the kind's, cat-harness's | the default rendering any instance declaring that kind gets |
| `/<instance>/` | the instance itself | its own themed root |

> `/docs/who-iris/` should be the cat-harness handler default for docs.
> who-iris themed at `/who-iris/`.

**A mount route is outside the docs tree, and the tile's path says so.** The
tiles are rendered inside cat-harness's own docs, which publish under
`<base>/docs/cat-harness/` since 2026-10-05 (issue #2188), and every path in
`_data/harness.json` is against that base. So a target at the site root —
`/who-iris/`, `/docs/who-iris/…`, the knowledge-graph viewer — is written as a
climb out of it, `/../../who-iris/`, which every consumer resolves to
`<base>/who-iris/` without special-casing it. A COMPOSED instance's root
(`/smart-trust/`) is inside the docs tree and needs no climb.
`harness-requirements` §"Where a visualiser is published" carries the rule.

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
`todos`, `beans`, `processes`, `kg`, `fsh-guts`, `launcher` — because a free
string lets an instance name an icon nothing draws, and the failure is a silent
gap in a row capped at seven. Seven is the cap and it is **refused, never
truncated**: an instance that declared eight has made a decision, and silently
dropping its last entry overrules that decision without saying so.

The cap was six until 2026-10-02, when the owner put the fsh-guts trashcan in
the row *"with the others"* (#1925) rather than in place of one. `fsh-guts` is
a control, like `launcher`: a button that opens the discarded-items list and
carries its live count, not a link. It is also the **way back** the discard
confirmation names — *"make sure confirmed by user"* (owner, 2026-10-02) — so
that dialog says "the fish in the icon row" only when this icon is on the page,
and points at Page settings otherwise. The confirmation itself is
`board-windows` §"Send to fsh-guts asks first".

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

Tiles render in the navbar **and** on the glass: one declaration, per-surface
visibility, never two registries free to disagree about what a tile is.

**The sticky board carries NO tiles.** Owner, 2026-10-02 (issue #1905, bean
`t6ht`): *"stickies panel shouldnt have all those icons"*. That reverses the
2026-09-21 ruling (bean `v0jv`) which put a "Visualisations" strip of square
tiles along the top of every sticky board — on every board, not only the
landing one, because the ruling names the panel rather than a page.

- **Removing a surface loses nothing only if the others still carry it.**
  Check that before removing one: every tile this repository declares names
  `navbar` and `glass` as well, so each stays reachable. A tile that named
  ONLY the removed surface would vanish silently — report it, do not
  re-route it to another surface on the author's behalf.
- **`board` stays a legal value in `TILE_SURFACES`, and nothing mounts it.**
  Retiring the value would turn every existing declaration that names it
  invalid on the commit that removed it — the cost the "every field but `ref`
  is optional" rule in `schemas/cat-harness.ts` exists to avoid. A
  declaration saying `["board"]` alone is valid and renders no tile; the
  graph-tiles e2e asserts both halves.
- **A ruling that reverses an earlier one is cited where the old one was.**
  The comments that quoted `v0jv` now quote the 2026-10-02 words, so a reader
  meeting the code sees the current reason and the one it replaced, not a
  stale rationale for code that is gone.

They are **collapsible**, with the count on the summary so a collapsed list
still says how much is behind it. That is not polish — a fixed-height sidebar
with a dozen fat tiles pushes the page nav off the top, which is a navigation
failure rather than a crowded one.

Theming comes from the avatar's **declared hue**: one hue, both schemes
derived, so no tile can be authored legible in one mode and invisible in the
other. A per-instance palette would be a second colour vocabulary beside
`theme.ts` — the drift that file exists to have ended.

## The glass strip — pinned first, and "+N more" counts the rest

**No tile may be silently off-screen.** That is the rule, and the owner's
ruling on bean `ob3m` finding 10 (2026-10-01, option 1 of 4, *"Pinned tiles
first, plus '+N more'"*) is how the glass's bottom strip keeps it. The strip
once held 25 tiles in one row and scrolled them sideways with no arrow, count
or fade: 11 were visible at 1280 px and about 2½ at 390, and on a phone
library, processes and tools were all off it. A reader cannot tell a tile
scrolled out of view from a tile that does not exist.

- **The pinned set is DECLARED, never written into a surface.** `glassStrip`
  on the instance's declaration lists the pins in order: `{ "chrome": … }` for
  the glass's own controls (`todos`, `filter`, `settings`) and
  `{ "kind": … }` for a graph typology. It is inherited along `needs` like
  `navbarIcons`, so absent inherits and `[]` pins nothing.
  `sync-docs-harness.ts` resolves each kind to ONE tile (`resolveGlassStrip`):
  the directory named for the kind, else the first glass tile that holds it.
  A kind several harnesses publish gets one slot, and the others wait in More,
  where their qualifiers tell them apart. A pinned kind that no tile holds is
  reported in `glassStrip.unmatched` and never skipped silently.
- **Fit, not scroll.** The strip shows as many pins as fit at the current
  width, in declared order, and refits whenever its box changes. It never
  scrolls sideways (`scrollWidth <= clientWidth` is asserted at 1280×800 and
  390×844).
- **The last tile says "+N more", and N is exact.** N counts every tile not on
  screen: pins with no room at this width, plus everything the reader keeps in
  More. Shown + N is always the total. The tile is a button named "N more
  tiles"; it opens More and moves focus into it. Pins that did not fit come
  first in More, marked as pinned, so a narrow screen loses their place on the
  strip but never the tiles themselves.
- **The reader may still arrange.** A strip the reader has arranged, by
  dragging or with the Strip and More buttons, overrides the declared default
  in that browser. The fit and the count apply to their arrangement too.

- **It starts HIDDEN** (owner, 2026-10-01: *"have folio bottom strip tiles
  default to hidden away when folio first opened"*). With no stored choice,
  the folio opens with the strip slid away. Only its tab shows, and it says
  "Show tiles (N)" so the reader knows what is behind it. The tab is the one
  control both ways (`l4zi`, [`board-windows`](board-windows.md)) and carries
  `aria-expanded`. The reader's choice is remembered in this browser as `1`
  or `0`, and storage that cannot be read counts as no choice: hidden. This
  is the glass's own strip. The BOARD's tile strip, above, still starts open.

`glass-strip-fit.e2e.ts` holds the four fit assertions and
`glass-strip-default-hidden.e2e.ts` the default. Both fail against the strip
as it was before the ruling.

## `summary` and `alsoWritten` — what a reader sees, kept apart from why it was named

A harness section on the landing page shows the declaration's `summary`, a
one-line gloss, and lists `alsoWritten`, the other spellings of the name. Both
exist because `description` was being made to carry them (bean `ob3m` findings
4–5). One harness's description was a naming rationale with literal backticks,
and another's was five newline-separated spellings that rendered as one line.
Authoring notes belong in `description` or a `_comment`. The reader-facing
line goes in `summary`, and alternative spellings go in `alsoWritten` as a
list, never inline.

**A harness's sticky shows the same text.** The owner's ruling on `ob3m`
finding 3 (2026-10-01): *"Stickies show the same text as the landing page"*.
A sticky contribution declares `bodyFrom: "summary"`, and the card's words are
`readerText` in `schemas/sticky-contribution.ts`: the `summary` (else the
description), then the `alsoWritten` spellings after "Also written:". That is
the rule `docs/_includes/harness_details.html` applies, read from the same two
declaration fields, so there is no copy of the text to keep in step. Before
the ruling, stickies read `bodyFrom: "description"`. The folio-assistant card
then opened with "NAMED `folio-assistant-checkout`…", the reason the name was
chosen, which is written for a maintainer. `bodyFrom: "description"` still
parses, because the pinned `bootstrap/bootstrap.json` declares it.
`bun run landing:sticky:check` fails when a card built from its declaration
does not open with that text. A `bodyAppend` may follow the reader's text,
and a card with a literal `body` is not compared.
