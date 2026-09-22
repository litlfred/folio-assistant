---
# folio-assistant-603s
title: 'LANDING: the LHS navbar is one themed section per instance, scanned from the root, rendered in dependency order'
status: in-progress
type: task
priority: normal
created_at: 2026-09-20T12:32:20Z
updated_at: 2026-09-20T22:56:24Z
parent: folio-assistant-yj32
---


Owner, 2026-09-20, verbatim — the structure is specific enough that paraphrase
would lose the parts that constrain the design:

> then landing page rendering is now cleaer... scan the root of the repo, look
> for <harness>.config.json as named instances. do their rendering (in
> depdendcy ordering). on LHS navbar, there is global section (w/ themed color)
> for each harness. when collapsed on LHS they are info. bootstrap = footer
> content, cat-harness next lower, link to docs on workflow, basic doc ingestion
> etc.. opening on LHS shows docs navigation, display panel shows any named
> display subgraphs by that instance (so uploads subgrpah is in cat-harness as
> it is defined there). next up would be f-a-core, etc... would be a tab for all
> materizled local subgraphs and declared remote graphs. opening up content
> should indicate if local or remote

## What this supersedes

The landing board is currently a flat grid of one sticky per instance. This
replaces the NAVIGATION model around it: instances become the top-level
structure of the left-hand nav, each in its own theme, ordered by dependency.
The stickies do not go away — they are what a collapsed section shows.

## The four things it asks for

1. **Discovery by scan, not by list.** Walk the repository root for instances.
   Today that is `harness.json` per directory, and the root itself now carries
   one too (`889e003012`). The owner wrote `<harness>.config.json`; this repo
   has both `harness.json` (the directory/graph declaration) and
   `harness.config.json` (dependencies) — WHICH ONE NAMES AN INSTANCE is the
   first question to settle, and the answer is probably `harness.json`, since
   that is what every existing consumer treats as the marker.
2. **Dependency ordering.** `bootstrap` is the footer (it is what an agent reads
   before it knows anything), `cat-harness` above it, then `folio-assist-core`,
   then the rest. That is the same deepest-first overlay order `resolveSkillDirs`
   already computes — reuse it rather than mint a second answer.
3. **Collapsed vs open.** Collapsed is INFO (the instance's sticky, essentially).
   Open shows that instance's docs navigation, and the display panel shows the
   named display subgraphs THAT INSTANCE declares — so `uploads` renders under
   cat-harness because cat-harness declares it, and the root's own `uploads/`
   renders under the root instance. Attribution follows declaration, which is
   exactly why the two same-id queues must stay two declarations.
4. **A tab for every graph, local and remote, and the distinction must SHOW.**
   Materialised local subgraphs and declared remote ones in one list, with
   local-vs-remote visible on open. A remote graph that renders identically to a
   local one is how somebody edits a copy that is not the source.

## Open questions, all genuinely the owner's

- Which file marks an instance — `harness.json` or `harness.config.json`?
- What is a "display subgraph"? Every declared `graphs` entry, or an opt-in
  subset? Today `uploads` and `library` are declared but have no renderer.
- Where does the existing `.fa-landing-board` fit — does it become the open
  state of the root instance's section, or stay a separate page?

## The avatar crop is DATA, not CSS — measured 2026-09-20

The navbar avatar is the theme's card art **clipped to the cat's head and
torso**, not the card scaled down: scaling the whole 1:1 card into a 46px frame
makes the cat about four pixels tall and every theme looks like grey mush.

**The box is per-image and cannot be derived.** The cat sits in a different
place in every composition — measured off a 10% grid overlay of the seven cards
that exist today, as fractions `x y w h` of the card:

| card | box |
|---|---|
| `landing-card` (grumpy-cat) | `0.00 0.46 0.50 0.50` |
| `landing-library-card` | `0.14 0.40 0.42 0.42` |
| `landing-bootstrap-card` | `0.27 0.615 0.24 0.24` |
| `landing-operations-card` | `0.19 0.505 0.24 0.24` |
| `landing-engineer-card` | `0.00 0.40 0.46 0.46` |
| `landing-analyst-card` | `0.05 0.48 0.36 0.36` |
| `landing-architecture-card` | `0.00 0.36 0.46 0.46` |

So production declares an **`avatarRegion`** per crop, sibling to the existing
`textRegion` — same reason `textRegion` is declared rather than assumed. A
literal in a stylesheet is a value with no schema, no validation and no way for
a new theme to supply its own, which is how the next avatar silently frames a
patch of sky. Two of the seven boxes above were wrong on the first pass (the
library and analyst crops landed on scenery, not the cat) and only a render
caught it — so whatever declares `avatarRegion` should be rendered in review,
not eyeballed in a diff.

**The box must be SQUARE.** The frame is square and the clip scales width and
height by `1/w` and `1/h` independently, so a non-square box stretches the cat
by `w/h`. The owner's two example crops were non-square and were explicitly
withdrawn as examples on that ground.

## Depends on

`6lb8` (the Miro-style folio board) overlaps on the display panel and should be
designed with this rather than after it. `pb04` (sticky edit/view affordances)
lands inside whatever this produces.

## Not started

Queued per the owner's standing instruction to queue rather than pivot.

## x-ref — `b5f0`, 2026-09-20: the owner tied the navbar to INSTANTIATION

> "instantiating a harness means that you get a slot in the LHS navbar = set of
> controls on folio"

That makes the slot a **consequence of instantiating**, not a thing an instance
may opt into. Measured against that (`b5f0` §6): the contribution seam already
exists and already inverts ownership the right way
(`schemas/sticky-contribution.ts`), and `bootstrap/harness.json` declares its
own card — but the **root** instance declares no `stickies` at all, and
`grep -rln "navbar" cat-harness/schemas cat-harness/src` returns nothing.

So the gap is not the seam. It is that instantiation **permits** a slot rather
than **producing** one, and there is no navbar for the slot to be in.

---

## Slice 1 done, 2026-09-20 — `avatarRegion` is declared, and the boxes were RENDERED

`avatarRegion?: ImageRegion` sits beside `textRegion` on `KgImage`, and all
seven measured boxes are declared in `cat-harness/harness.json`. Nothing
consumes it yet: the navbar does not exist, and this slice is the declaration
the navbar will read.

**The squareness rule is checked against PIXELS, not fractions**, and that
turned out to be the part worth building rather than asserting. The bean says
the box must be square because the clip scales `w` and `h` independently. Equal
FRACTIONS are square only on a square image — on the 1671x941 landscape crops
the same numbers are a box 1.78x wider than tall, and a fraction-only check
passes it. So the refinement lives on `KgImageSchema` rather than on
`ImageRegionSchema`, because squareness needs `width` and `height`, which are
siblings of the region and invisible from inside it. All seven cards are
1254x1254 with dimensions declared, so every box is checkable.

**An image with no declared dimensions may not declare an `avatarRegion` at
all.** Refused rather than accepted unchecked: an unverifiable box sitting
among six verified ones reads as verified and is not. Tolerance is 1px, because
fractions authored to three decimals against 1254px land on sub-pixel
boundaries that an exact comparison would reject for no visible reason — and
the stretch worth catching is tens of pixels.

`textRegion` is deliberately NOT subject to it. Every one declared today is
wide and shallow, because a quiet interior for a sentence is; applying the
avatar rule to both would have failed the entire existing corpus.

The out-of-bounds message was `"textRegion extends past the edge of the
image"`. Now `"region extends past…"` — a message naming one of two callers is
wrong half the time, and the half it is wrong about is the newer one, whose
author most needs it right.

### Rendered, because no assertion can answer the question that matters

The schema guarantees each box is square and in bounds. **It cannot tell
whether the box is on the cat**, which is exactly how two of the first seven
landed on scenery. So `bun run avatar:crops` emits a self-contained contact
sheet — each card with its box drawn, the clip at 120px, and the clip at 46px
navbar size — with the art inlined as `data:` URIs so the page opens in a
review comment or a chat panel rather than rendering seven broken images the
moment it leaves the repository.

**Verified by looking, this session: all seven frame the cat's head and torso.
None is on scenery.** The tightest are `bootstrap` and `operations` (0.24)
and they read best at 46px; `landing-card` (0.50) carries the most chest.

It PRINTS and never gates, on purpose — it answers a question no assertion can
carry. `--out` defaults under `_kg/`, which is gitignored.

17 tests, falsified in both directions: a non-square box is refused and a
square one is not; equal fractions on a non-square image are refused and the
matching pixel-square box on that same image is accepted; a box with no
dimensions is refused and an image with no `avatarRegion` needs none.

### Still open in this bean, and untouched by this slice

The four navigation questions — discovery by scan, dependency ordering,
collapsed-vs-open, and the local/remote tab — and the three open questions
(which file marks an instance, what a "display subgraph" is, where
`.fa-landing-board` fits). This slice deliberately does not guess at any of
them.


---

## Slice 1 SHIPPED, 2026-09-20 — the tiles exist and are clickable

Owner, re-asserting the ask in narrower terms:

> I still want to see for every initiated harness a themed fat navbar tile,
> boot strap at bottom, that user can click on. And basic stats/info via icon +
> bafges. Use existing harness vaiyalizaiin(s).

**What landed**

- `cat-harness/scripts/harness-tiles.ts` — one tile per initiated harness,
  discovered by scanning the repository root for `harness.json` (this bean's
  question 1, answered: `harness.json` is what names an instance).
  **↑ SUPERSEDED TWICE — see the 2026-09-22 entry at the end of this bean.
  `harness.json` no longer exists, and the answer is no longer a filename.**
- Wired into `scripts/sync-docs-harness.ts`, so it rides the existing
  `docs:harness:check` staleness gate rather than arriving as a second
  generated file with a second gate free to disagree with the first.
- `docs/_includes/nav_footer_custom.html` — just-the-docs' own seam INSIDE the
  sidebar, so no theme override to re-read on every version bump.
- `docs/assets/css/docs-ui.css` — the fat tile, themed from the avatar's
  declared hue.
- 17 tests.

**Measured on this repository: 11 instances, bootstrap last.**

**Three decisions worth keeping**

1. **"Bootstrap at bottom" is read from the DECLARATION, not from a name.**
   `bootstrap/harness.json` carries a `renderExemption` whose reason says
   it in those words — *"bootstrap IS the navbar footer"* — so the ordering
   is `isExemptFrom(decl, "visualiser")`. It falls out correctly rather than by
   coincidence: an instance exempt from owing a visualiser is exactly an
   instance whose tile has nothing to open.
2. **A link is declaration-driven and presence-checked.** The declaration says
   what a tile may claim to show; the disk says whether each is a link or a
   gap. A declared graph with no page is REPORTED, never linked (`pb04`: a dead
   link invites a click and then reads as "this site is broken"), and a page
   published under a kind the instance does not declare is reported too — the
   other half of `flh4`'s third state. Exactly one of those exists here today:
   `/cat-harness/library/folio-assistant/`.
3. **Themed by the avatar's declared hue**, not a new palette. A per-instance
   colour vocabulary beside `theme.ts` is the drift that file exists to have
   ended.

**One finding the feature immediately surfaced: 9 of 11 instances have no
avatar of their own** and take the generic question mark. That is `4kj4`'s
territory and is now visible rather than theoretical.

## What is still THIS bean, after the slice

- [ ] **Dependency ordering.** This slice sorts by name with the declared
      footer last; the ask says *"do their rendering (in depdendcy ordering)"*.
      `harness.config.json` carries dependencies and is a different file from
      `harness.json` — the ordering wants it read.
- [ ] **Collapsed = info, opened = docs navigation.** A tile is one target
      today; the ask has two states.
- [ ] **The display panel** showing an instance's named display subgraphs.
- [ ] **A tab for materialised local subgraphs and declared remote graphs**,
      and opening content indicating local or remote.

---

*2026-09-21, session_01AYHimvYMmf8h8e9fFN6dW5 — **this bean's recorded answer to
question 1 is superseded by an owner ruling.***

This bean records *"this bean's question 1, answered: `harness.json` is what
names an instance"*, and `harness-tiles.ts` scans for that filename. The owner
ruled **REPLACE** on `b5f0` — `<name>.config.json` becomes the single
declaration and `harness.json` goes — reconfirmed and widened 2026-09-21 to
cover `bootstrap/` and the `folio-assistant-*` instances.

The scanner is repointed rather than defended. **Not edited here**: this is a
sibling's bean, the ruling is recorded on `b5f0` where it was asked, and this
note exists so the next agent reading question 1 does not implement against a
superseded answer. The measured cost and the ordering are on `b5f0`.

---

*2026-09-22, session_01V4NobpyNLPku8t7aM7DFqF — **a new owner requirement for
this bean, with the accessor that already answers it.***

Owner, 2026-09-22, in the same breath as two smaller asks (issue #851):

> All of these style of sub-graph visualizera should all have common expanding
> nav element ton the navbar to show which dependent harnesses have skills or
> tools or docs content

This is the part this bean does not already say. The bean has the per-instance
section, the dependency ordering, and the collapsed/open pair. What is new:
the expanding element is **common across every sub-graph viewer** rather than
per-viewer chrome, and what it expands to show is **which DEPENDENT harnesses
hold content of a given kind**.

**The question it has to answer is already computable, and the accessor
exists.** `graph-tiles.visualisationsOf(coverage, id)` returns an instance's
declared viewers for a directory, and `undeclaredProjections` selects the
opposite case — a published page nobody declared. Between them, "does harness
X have skills / tools / docs content, and is it reachable" is a lookup rather
than a new scan. Do not mint a second answer to it; `harness-tiles.ts` already
reads the same accessor and a second reader is how the navbar and the tiles
drift apart.

**The per-instance split it needs now exists for `skills`.** As of #851, all
seven `skills` directories declare a `coverage.visualiser` pointing at their
own `docs-auto/index/skills/<id>/` page — `cat-harness`, `bootstrap-render`,
`methodology-raci`, `methodology-crdm`, `kg-navigation`,
`large-datasets-skills`, `who-iris-skills`. Before that they were rendered but
undeclared, so every one of them read as "no published viewer" to exactly the
accessor this element would consult. `schemas` and `library` were already
split this way. So the data this element needs is per-dependency and present
for three kinds; `docs` is the one the owner names that is not yet.

**Not built, and deliberately.** The owner was given the collision and chose
specification over implementation: `sjic`/`p5wm` own the navbar component and
PR #842 is live on `claude/lhs-navbar-harness-folios-cqo9mu` right now. Two
sessions designing one expanding element separately is the outcome
`bean-coordination` exists to prevent. **Not edited above** — this is a
sibling's bean and the sections it already carries are theirs.

**The kind list, extended.** Owner, same day: *"…or library"*. So the element
covers **skills, tools, docs and library**. Measured state of each, since the
four are not in the same position and one of them must not be treated like the
other three:

| kind | directories | declared viewer | per-instance? |
|---|---|---|---|
| `skills` | 7 | 7 | yes, as of #851 |
| `library` | 4 | 4 | yes, already |
| `tools` | 1 | 1 | n/a — only one instance declares a tools graph |
| `docs` | 2 | **0** | **no, and it must not be** |

**`docs` is the exception, and declaring a visualiser for it would be a
defect.** Its kind is `renderable: true`, and the rule on `owesVisualiser`
says why: *"a renderable kind is its own view — demanding a separate viewer
would be asking for a second rendering of the same thing."* So the element
must link an instance's docs at its RENDERED ROUTE, not through
`coverage.visualiser`. Reading all four kinds through one accessor is the
obvious implementation and it is the wrong one; `docs` needs the route and the
other three need the declaration.

`tools` is not evidence either way. One instance declares a tools graph, so
"per-instance" is satisfied trivially and would need a second instance with
tools before the split is exercised. An element that renders correctly today
for `tools` has not been tested on it.

---

*2026-09-22, session_01SrFVoXeLER715HHQQaK22u, stream `10uc` (GOAL 2) —
**question 1 is CLOSED, and the note above it is stale by one ruling.***

The 2026-09-21 entry above records the owner ruling **REPLACE** on `b5f0`. That
ruling was **reversed by the owner later the same day**, so an agent that reads
this bean top to bottom currently gets the retired answer twice: once as
`harness.json` and once as the merge that replaced it.

**The standing answer, and it has landed in code:**

| | |
|---|---|
| `<name>.json` | the **declaration** — directories, graphs, dependents, assets, stickies. `readDeclaration()` |
| `<name>.config.json` | the **config** — contentType, adapter, feedbackDir, viewer, readme. `readHarnessConfig()` |

The owner's words, from `b5f0`: *"rename the stub need cat-harness.config.json
and cat-harness/cat-harness.json, same for folio-assistant (instance,
declration)"*, and *"1"* when the conflict with REPLACE was put back to them.
It is the option this bean's §1 had itself offered — *"`<name>.json` +
`<name>.config.json` would at least pair them"*.

**The important part for this bean is not which name won. It is that the
question changed shape.**

> **An instance is no longer marked by a FILENAME.** `findDeclarationFile(dir)`
> takes the file whose filename **stem equals its own declared `name`**
> (`CONFIG_SUFFIX` / `instanceDeclarationFilename`,
> `cat-harness/schemas/cat-harness.ts:145-185`). A declaration is
> self-identifying, so a renamed clone still resolves — which is what answered
> migration-plan I.8's objection that a per-repo name *"fails silently"*.

So question 1 — *"Which file marks an instance?"* — is answered **"none in
particular; ask `findDeclarationFile`."** Any future navbar work that scans for
a literal is wrong under either ruling.

**Measured on `main` 2026-09-22, not carried forward:** six `*.config.json` at
instantiation roots, paired with `bootstrap/bootstrap.json`,
`cat-harness/cat-harness.json`, `who-iris/who-iris.json` and
`folio-assistant.json`. `find . -name harness.json` returns exactly one hit,
`cat-harness/docs/_data/harness.json`, which `b5f0` names as generated data
rather than a declaration.

**The code in this bean is already correct.** `harness-tiles.ts:290` and `:297`
call `findDeclarationFile`, not a literal filename. The scanner was repointed
when the rename landed. **Only the prose was stale**, which is why the inline
marker above points here rather than the line being rewritten — an append
cannot collide with another session.

This closes `b5f0`'s open Done-when *"`AGENTS.md`, `zkgs`'s Done-when and
`603s`'s recorded answer are corrected, or each says why it still reads the
other way"* **for this bean only**. `AGENTS.md` and `zkgs` are not this
stream's and are untouched.

**Still open on this bean, and unchanged:** what a "display subgraph" is, where
`.fa-landing-board` fits, and the 2026-09-22 common expanding nav element from
issue #851. Question 1 was the blocking one.
