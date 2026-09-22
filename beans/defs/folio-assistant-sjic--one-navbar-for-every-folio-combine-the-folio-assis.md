---
# folio-assistant-sjic
title: 'ONE NAVBAR FOR EVERY FOLIO: combine the folio-assistant sidebar and the who-iris rail into a single component — fixed top, scrollable KG stack, fixed bottom'
status: in-progress
type: task
priority: normal
parent: folio-assistant-p5wm
created_at: 2026-09-21T21:26:39Z
updated_at: 2026-09-21T21:26:39Z
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
- [ ] The three regions are structural, not a styling convention -- the middle
      scrolls and the other two cannot
- [ ] An instance's graphs appear from its DECLARATION, so a new graph kind
      with content needs no edit to the navbar
- [ ] An open document's index appears in the fixed top, and disappears with it
- [ ] Harness avatars come from the theme, not from a list in the renderer
- [ ] The rail and the sidebar no longer state any number twice

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
