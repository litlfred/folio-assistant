---
# folio-assistant-bp4x
title: 'STICKIES: each initiator contributes its own sticky, rather than one list owning them all'
status: completed
type: feature
priority: normal
created_at: 2026-09-20T06:23:14Z
updated_at: 2026-09-20T08:47:46Z
parent: folio-assistant-o3xy
---

## The ask, owner 2026-09-20 (verbatim)

> each intiator should create its own sticky. bootstrap sticky will have link
> back to the source code + ghpaghes for boot strrap. boot streap avatar
> forthcoming.

## Why this is a real change of shape, not an addition

`mggs` built the landing stickies as a **fixed set of three**, returned by
`landingStickies()` in `schemas/landing-sticky.ts` and written by
`scripts/ensure-landing-sticky.ts`. That is a list this repository owns.

This ask inverts the ownership: **each initiator contributes its own sticky**,
so the set is composed from the layers present rather than enumerated in one
place. `bootstrap` contributes one, `cat-harness` contributes one, a downstream
folio contributes one. The list stops being a constant and becomes a
**contribution**, exactly like `registerFolioGraphKind` contributes a graph kind
— and `folio-graph-kind.ts` already states the principle it would follow: a
layer owns what it can serve, and the layer above does not enumerate it.

## What this makes possible, and what it costs

Possible: a bare bootstrap instance gets a bootstrap sticky and **no cat**,
which is the owner's earlier ruling (*"i want the grumpy cat moved out of
bootstrap and into cat harness"*) satisfied structurally rather than by
remembering not to.

Cost, and it is the part to design carefully: the ORDER of a composed set. The
current order is meaningful — the description first, because a reader needs to
know what the instance is before anything else means anything. A contributed
set needs a declared order or it renders in dependency-resolution order, which
is `resolveDirectories`' deepest-dependency-first and would put bootstrap's
sticky above the instance's own.

## Measured, so the bootstrap half is not started blind

- `bootstrap/harness.json` declares `name: "bootstrap"`, `description: "The
  graph an agent reads before it knows what this repository is."` and two
  assets (`AGENTS.md`, `README.md`). It declares **no `images[]`** and no
  `canonicalUrl`, so a bootstrap sticky has a description to carry but **no art
  and no site URL** yet.
- *"link back to the source code + ghpages for bootstrap"* therefore needs both
  to be decided. The source link is composable from the repository; the gh-pages
  URL for bootstrap **does not exist** — this instance's `canonicalUrl` is
  `https://litlfred.github.io/folio-assistant`, which is cat-harness's site, not
  bootstrap's.
- *"boot streap avatar forthcoming"* — `schemas/avatars.ts` already declares a
  `bootstrap` avatar among its 19 kinds, so an avatar exists; the ask is
  presumably for new art rather than a first one. Worth confirming.

## Done when

- [ ] a sticky is a CONTRIBUTION from a layer rather than an entry in one list
- [ ] order is declared rather than inherited from dependency resolution
- [ ] bootstrap contributes its own, with its source link and its gh-pages link
      once that URL exists
- [ ] a bare bootstrap instance gets no cat, proved by a test rather than by
      convention
- [ ] `ensure-landing-sticky.ts` writes the composed set, still idempotently and
      still under the same `--check` gate


_2026-09-20_ — **DONE.** The board is composed from declared contributions.

## Against the `## Done when` above

- [x] **a sticky is a CONTRIBUTION from a layer** — `stickies` on
      `CatHarnessDeclarationSchema`; `bootstrap/harness.json` contributes its
      own card and `cat-harness/harness.json` the other three.
- [x] **order is declared** — `order` on a shared scale, tie-broken on
      `(order, declaredBy, id)` so the board never depends on read order.
      Tested both sequences.
- [x] **bootstrap contributes its own, with its source link** — and
      **deliberately NOT a gh-pages link**, because bootstrap has no site: this
      instance's `canonicalUrl` is cat-harness's. A declared link to a page that
      does not exist is a 404 on the landing page. One line in the declaration
      adds it when the URL exists, and the `_comment` there says so.
- [x] **a bare bootstrap gets no cat, proved by a test** — `theme` has no
      default in the schema, and bootstrap declares `pale-sage`, which carries
      no `imageRole`. `resolveThemeBackdrop` reports `none` even composed inside
      an instance that DOES declare cat art, which is the case that matters.
      A second test proves the check can fire.
- [x] **`ensure-landing-sticky.ts` writes the composed set** — idempotently,
      under the same `--check` gate. Four files now, not three.

## A declaration, not a code registry — and the reason is the requirement

`registerStickyContributor()` was the obvious design, matching
`registerFolioGraphKind`. It cannot work: `bootstrap/` holds no TypeScript and
declares an instance that may not import the layer composed on top of it, so a
registry is a seam **bootstrap cannot reach** — and bootstrap contributing its
own card IS the ask. The cost is a small vocabulary (`bodyFrom`,
`onboardingLinks`) instead of arbitrary code, paid deliberately.

It also moved the words to the right place. `AGENTS.md`: subject matter in this
repository *"belongs in the folio as data"*. The cat's introduction and the
sub-graphs paragraph were living in `schemas/`.

## Three defects, each of which composed a PLAUSIBLE board

Worth recording because none of them threw:

1. **Discovery ignored `scope` and looked for `harness.json` INSIDE the declared
   directory.** `bootstrap` is declared `bootstrap/skills/` with **repository**
   scope, so both halves were wrong — the board composed **three** cards instead
   of four, silently. `rootForScope` and `findInstanceRoot` already knew; the
   composer now uses them rather than reimplementing either.
2. **A trailing slash survived `join`.** `inner/` and `inner` are two strings,
   which defeated the `Set` dedupe — reading one layer twice and raising a
   duplicate-id conflict against itself. `resolve` normalises.
3. **`contributedBy` stopped at the node** and never reached
   `docs/_data/stickies.json`, so *"which layer put this card here"* — the first
   question anyone debugging a composed board asks — was unanswerable from the
   page.

## One thing I reversed and put back

The fixed-set version fell back to the instance's `name` when it had no
description, with a stated reason: *initiation failing over a declaration
nobody has filled in yet is worse than a thin card.* My first version threw
instead. That is a decision being reversed in a rewrite rather than argued, so
the fallback is restored and tested.

## Verified

`bun test` 3264 pass / 0 fail; `eslint .` and `tsc --noEmit` clean; all package
gates green except two, both handled below. Board **rendered and inspected** at
1280 and 430 wide: four cards, no failed requests, no horizontal overflow, and
bootstrap's palette-only card reads as part of the board rather than as a
broken one. The content tests now read the DECLARATION — asserting the old
TypeScript constants would have been green while the shipped board said
something else.

## Two gates that did not pass, and what each was

- `check:corpus-gate` — an **argument** failure, not a real one. It needs
  `--staged` or `--since`; run as `--since origin/main` it reports *"no content
  blocks in this change"*. My own recorded lesson applies: a script failing on
  bad arguments says nothing about whether it fails on good ones.
- `translate-kg-viewer:check` — **red on `main`, not mine.** Untouched by this
  change, and in no workflow. Raised as bean `ot9a` rather than repaired,
  because the one-line fix adds a wrong-direction edge and the owner has an
  open decision on exactly that.
