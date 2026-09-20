---
# folio-assistant-603s
title: 'LANDING: the LHS navbar is one themed section per instance, scanned from the root, rendered in dependency order'
status: todo
type: task
created_at: 2026-09-20T12:32:20Z
updated_at: 2026-09-20T12:32:20Z
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
