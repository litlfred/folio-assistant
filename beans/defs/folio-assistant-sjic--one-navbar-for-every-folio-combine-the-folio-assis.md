---
# folio-assistant-sjic
title: 'ONE NAVBAR FOR EVERY FOLIO: combine the folio-assistant sidebar and the who-iris rail into a single component — fixed top, scrollable KG stack, fixed bottom'
status: in-progress
type: task
priority: normal
created_at: 2026-09-21T21:26:39Z
updated_at: 2026-09-22T21:28:43Z
parent: folio-assistant-p5wm
---

## What — the owner's spec, verbatim

2026-09-21, with a screenshot of the who-iris rail open and working:

> looks good.
>
> we should have same navbar across all folios though.  presented same way.
> need to comine the two.
>
> * keep exploding menu from folio-assisnt
> * keep [x] from who-iris, keep behavior of open/close, etc.
> * keep consistent docs/ library/ etc. when content/subgraphs present as in
>   who-iris, so you can see what is in the docs and library of a KG from
>   who-iris
> * keep home at bottom for who iris.
> * when a document or other indexed object is opened, the document
>   index/idices are shown in a  navbar tab/menu.
> * KG libraries is a scrollable stacks between fixed top an bottom parts of
>   navbar menu/tab.
> * keep the navba rmenu/tab of the  active/instantiated harnsesss from
>   folio-asst at bottom of navbar in en aexpanable menu.  use avatar/themes
>   of the hanreses
>
> each harness gets its own avatar/branding as part of theme.

Verbatim because the LAYOUT is specific and a paraphrase loses the part that
constrains it: **three regions, and the middle one is the only one that
scrolls.**

| region | holds | scrolls |
|---|---|---|
| fixed top | the instance, its `[x]`, and the open document's index when one is open | no |
| middle | the KG's own graphs — `docs/`, `library/`, every declared kind with content | **yes** |
| fixed bottom | the instantiated harnesses, expandable, each with its avatar; then home | no |

## Why this is one component and not two that agree

Today there are two: `harness-rail.ts` injects one into pages Jekyll never
sees, and `docs-ui.css` + `nav_footer_custom.html` style the theme's own
sidebar. They were brought to the same BEHAVIOUR across `hw9g` rounds 1-3 --
strip at rest, hover/`☰` to open, `[x]` to close, inner scroll -- by being
edited in parallel, twice, with the numbers derived separately on each side
and a test on each asserting its own copy.

That is two implementations agreeing by maintenance. The owner's "presented
same way" is the instruction to stop paying for that agreement.

## The collision, and it is the reason this bean exists before any code

**`603s` is in flight on PR #791**, branch
`claude/lhs-navbar-harness-folios-cqo9mu`, and its subject is the last two
bullets here: the navbar as one themed section per instance, in dependency
order, with `avatarRegion` and the harness themes. Three more PRs are in the
same files right now -- #803 (every graph tile 404s, missing baseurl), #805
(the library viewers' scripts do not parse), #781 (landing page sticky panel,
header controls, search).

Four sessions in one component. Building the unification on top of that
guarantees conflicts in exactly the files they hold, and this repository has
already paid for three sibling duplications (`y90d`, `lps0`, `u1iu`).

So this bean RECORDS the spec and claims nothing. Sequencing is the owner's.

## Done when

- [ ] One renderer produces the navbar for a Jekyll page and for a mounted
      page, with the difference DECLARED rather than branched on
      — **STILL OPEN after PR #959.** The sidebar shares the GEOMETRY (one
      generated region, gated) and the BEHAVIOUR, so the two can no longer
      disagree about a width. It is still Liquid plus CSS and does not call
      the renderer. "Cannot disagree" is not "one renderer".
- [x] The three regions are structural, not a styling convention -- the middle
      scrolls and the other two cannot
- [x] An instance's graphs appear from its DECLARATION, so a new graph kind
      with content needs no edit to the navbar
- [x] An open document's index appears in the fixed top, and disappears with it
- [x] Harness avatars come from the theme, not from a list in the renderer
- [x] The rail and the sidebar no longer state any number twice

## CLAIMED, and the boundary is the point — 2026-09-21, session_014HGPQoUnzXGqSspA8x6YyD

Owner's ruling on the collision above: **split by layer, not by file.**

| | owner | why |
|---|---|---|
| the RENDERER — three regions, one component, graphs from the declaration | **this bean** | `harness-rail.ts` is the only navbar nobody else is editing, and rounds 1-3 of `hw9g` are where both sides' behaviour was worked out |
| the harness AVATAR/THEME region | **`603s`, PR #791** | it is that bean's subject and it is mid-flight |
| the Jekyll sidebar's switch to the renderer | **after #791 lands** | `nav_footer_custom.html` is where we would collide, so it is the last thing to move, not the first |

So the rail goes first and the sidebar follows. That ordering is not a
preference: the rail is the side with no other claimant, so it is the side
where the component can be got right without re-resolving against three moving
branches.

**A claim announces rather than reserves until the PR exists** -- so this line
is a courtesy to whoever reads the bean next, not a lock. If #791 reaches the
renderer first, it wins and this bean should be re-scoped rather than merged
against.

## Not in scope here, recorded so it is not lost

`v18c` (another session's, from #805) holds the two tiles that stay
non-functional after the library viewers' scripts are fixed: `uploads` and
`library` declare the SAME visualiser with no tab deep-linking, and
`cat-harness`'s own library is empty and looks identical to a populated tile
until opened. Both are declaration decisions, and both touch what a navbar
ENTRY means -- so this bean should read that one before it decides how a graph
with no content renders.


## RE-MEASURED 2026-09-22 (bean `osyc`, item 2) — the shared component EXISTS

This bean is `todo` in the ready queue and **its core deliverable is already on
`main`.** Anyone picking it up would rebuild it, which is the collision this
session hit four times in one day.

### What is there now

`cat-harness/scripts/lib/navbar.ts` opens *"ONE navbar, for a Jekyll page and
for a mounted page alike"* and quotes the same owner sentence this bean does.
`cat-harness/scripts/lib/harness-rail.ts` describes itself as *"a thin ADAPTER
over the shared navbar"*.

**Verified by IMPORT, not by the comment** — a comment claiming a refactor is
exactly what a roast should not accept:

    lib/harness-rail.ts:44  } from "./navbar.js";
    lib/harness-rail.ts:45  export type { NavGroup, NavItem, NavbarModel } from "./navbar.js";
    lib/harness-rail.ts:47  import { injectNavbar, ... } from "./navbar.js";

### Two corrections to this bean's own text

1. **The path is stale.** It says `harness-rail.ts`; the file is at
   `cat-harness/scripts/lib/harness-rail.ts`. It moved into `lib/` with the
   extraction.
2. **"Today there are two" is no longer true of the TS side.** The injector
   half is unified.

### What I did NOT establish, said rather than assumed

Whether the **Jekyll/theme** half — `docs-ui.css` plus
`nav_footer_custom.html` — now derives from the same component. Those are CSS
and a Liquid template, so they cannot import it, and I did not trace whether
their numbers are generated from `navbar.ts` or still maintained in parallel.
That is the remaining half of this bean and it may well be all of it.

**Suggested: re-scope rather than close.** The bean as written reads as though
nothing is built.


## ROUND 1, 2026-09-22 — the geometry is stated once, and it DISAGREED

Re-claimed. The 2026-09-21 claim above named branch
`claude/lhs-navbar-harness-folios-cqo9mu`; that branch now carries `624f`
sticky geometry (PR #955) and no navbar work, so the claim had lapsed. **No
open PR touches the navbar** — the four-way contention this bean was written to
sequence around has cleared, which is what makes the remaining half workable
now.

The `RE-MEASURED` section above is right that the shared RENDERER exists.
What it could not establish — *"whether the Jekyll/theme half now derives from
the same component"* — is measured, and the answer is **no, and the two were
different widths**:

| | `navbar.ts` | `docs-ui.css` |
|---|---|---|
| strip at rest | 40px | `3.5rem` = **56px** |
| open | 232px | `15.5rem` = **248px** |
| open, ≥66.5rem | *(no such state)* | `16.5rem` = **264px** |

Three of four disagreed and the fourth existed on one side only. **Both were
green**: `navbar.test.ts` asserts `navbarCss()`'s numbers and
`sidebar-strip.test.ts` asserts `docs-ui.css`'s, each against its own copy.
That is the failure mode this bean names — agreement by maintenance — caught
only by putting the two files side by side.

**Fixed by deriving both from one record**, not by copying one into the other:
`scripts/lib/navbar-geometry.ts`, rendered to `assets/css/navbar-geometry.css`
by `bun run navbar:geometry` and gated by `navbar:geometry:check` (in
`code-quality-gates.yml`, so `bun run gates` carries it).

**The sidebar's numbers won, and not by seniority.** Both sides derived their
strip — the rail from a 20px glyph and two 10px gutters, the sidebar from the
theme's gutter plus `.fa-site-mark` at 2rem plus a matching one. Neither was
arbitrary. What settles it is that only the sidebar is constrained from
OUTSIDE this repository: just-the-docs' `layout.scss` carries
`.side-bar { min-width: 16.5rem }`, and `docs-ui.css` already records what
crossing that floor cost. So the constrained side sets the numbers and the free
side adopts them. The rail's mark grows 20px → 32px, which also moves it the
right way against this instance's declared low-dexterity profile.

The two derivations turned out to be the same arithmetic in different units:
`NAV_PAD_PX` derives to 12px, which is `0.75rem` — exactly the "matching right
gutter" the stylesheet's own comment described.

### Remaining, this session

- [x] the three regions are structural in the sidebar (gap 2)
- [x] harness avatars in the sidebar (gap 3) and home at the bottom (gap 5)
- [x] `documentIndex` gets a supplier — it had none anywhere (gap 4)
- [x] `avatarRegion` reaches the navbar mark (gap 6) — the MECHANISM, with the
      missing harness→card assignment reported rather than invented

## ROUNDS 2-4 — and two defects the plan did not contain

Rounds 2-4 closed gaps 2-6. Two things were found only by **opening the page
in a browser**, which is now the `rendered-verification` skill.

### The harness dividers had no colour at all

`harness-tiles.ts` writes `tone` as a HUE and nine CSS rules fed that angle
straight to `color-mix()` and to a `border-left` shorthand. Proven with a
control in the page rather than from the spec:

    --h: 268; background: color-mix(in oklab, var(--h) 28%, transparent)
      -> rgba(0, 0, 0, 0)        INVALID at computed-value time
    --h: 268; background: hsl(var(--h) 45% 28%)
      -> rgb(69, 39, 104)        works

So the coloured tabs — *"as if you are opening a giant tabbed folio"* — had
**no background and no stripe**, and nothing caught it because an invalid
custom-property substitution fails silently. Derived through `--fa-tile-ink`
now, from the avatar generator's own two lightness targets. Contrast
re-measured in both schemes: worst stripe 4.41:1, all above the 3:1 bar.

`--fa-tile-on` carries the absence: `GENERIC.tone` is **0** and means "no
avatar declared", not red, and 9 of 14 harnesses are generic.

### The regions' caps competed, and the measurement is the argument

Each region got a cap and the arithmetic was never checked against a viewport.
With the document index open: 60px header + 33% index + 50% footer left the
middle **93px** in a 900px column. The middle now carries an **8rem floor**
and both capped siblings yield to it, which they can afford because each
scrolls inside its own cap.

### Measured, before -> after, Chromium 1280x900

| | before | after |
|---|---|---|
| `.side-bar` scroll | 1200/900 | 900/900 |
| `.site-nav` (middle) | 64px holding 944px | 297-386px, scrolls |
| `.site-footer` (bottom) | 1076px, overflowing | capped, scrolls internally |
| home | absent | pinned, y=884 |
| divider stripe | `0px none` | 6px solid, ≥4.41:1 |
| harness mark | none | avatar or initial |

### Gap 6 has no subject, and that is the finding

`603s` slice 1 declared seven `avatarRegion` crops and they are on
`landing-*-card` art. Every instance's `icon` is a **different image**
(`cat-harness` declares `mark`). **Which card belongs to which harness is an
assignment nobody has made** — the card names are roles and topics (engineer,
analyst, architecture), not instances. The crop mechanism is built and tested;
choosing the mapping is the owner's, not mine.


## Status against `## Done when` — 2026-09-22, PR #959

I set this bean `completed` and put it straight back to `in-progress`. Five of
the six criteria are met and are now ticked **in the canonical list above**;
the first is not, and it is the one the bean is named after.

That list is the only one. An earlier version of this section restated it here
with its own ticks, which `check:bean-bodies` correctly refuses as a
`shadow-checklist`: a reader consulting `## Done when` would have seen six
open boxes while a section further down claimed five were done. One checklist,
ticked in place.

**What the remaining half needs**, so the next agent does not re-derive it: the
Jekyll side would have to render `NavbarModel` — which means either a build
step emitting the sidebar's markup into `_includes/generated/`, or overriding
the theme's `sidebar.html`. This file already refuses the second for a
*placement*; for the whole sidebar it is a different trade and is the owner's
to make. Both are bigger than anything in #959 and neither is blocked.

**Everything the owner asked for on 2026-09-21 and 2026-09-22 is built and
green** (`gates --all`, 128/128 incl. 459 browser tests). The gap is between
"the same navbar" and "one navbar", and it is stated rather than closed.
