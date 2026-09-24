---
# folio-assistant-hw9g
title: 'MOUNTED PAGES HAVE NO LHS RAIL: a collapsed icon-width harness nav for every mounted instance, opening on hover or click'
status: completed
type: task
priority: normal
created_at: 2026-09-21T18:40:00Z
updated_at: 2026-09-21T20:02:00Z
parent: folio-assistant-yj32
---

## What

Owner, 2026-09-21, looking at the published `/who-iris/`:

> *"i see no LHS navbar. It still should be there in this harness, but it can
> start collapsed (so only icon width wide), hovering/clicking on it will
> open"*

and earlier, on the same subject:

> *"f-a navbar should still be on the left, with who-iris and then link to docs
> on side in navbar"*

## Measured, not assumed

On the published site:

| page | LHS nav markup |
|---|---|
| root `index.html` | `side-bar`, `nav-list`, `nav-list-item` — just-the-docs' |
| `/who-iris/index.html` | `main` only — **none** |
| `/smart-trust/index.html` | **none** |

**Every mounted instance, not one of them.**

## Why — and it is deliberate, not an oversight

`mount-instance-docs.ts` copies finished HTML and does not run Jekyll over it.
Its own note says why: handing these to Jekyll *"would ask for front matter
they do not have and **a layout they do not want**"*. That is right —
`who-iris/` is a replica of IRIS, and just-the-docs' layout would replace
IRIS's chrome with folio-assistant's, which is the opposite of what a replica
is for.

So the bypass stays and the harness gets its navigation back another way: a
rail injected **at mount time**, the harness's frame *around* the instance's
page rather than instead of it.

## Why the mount layer and not `gen-iris-pages`

`smart-trust` has the identical gap. Put it in a folio's generator and every
instance needs its own copy of the platform's navbar — the boundary `AGENTS.md`
opens with. One implementation, and a new instance gets it by being mounted.

## Not this bean

`603s` — the LANDING page's navbar, instances as themed sections in dependency
order. **Another session's, in-progress.** Adjacent and not the same: `603s`
redesigns the navbar's content model for Jekyll pages, and a non-Jekyll page
would still have none after it lands. Put to the owner before starting rather
than assumed, because three sibling duplications had already cost real work
today.

## Done when

- [x] A collapsed icon-width rail on every mounted instance page, opening on
      hover, on keyboard focus, and on a click that pins it
- [x] No script injected into a document the harness does not own
- [x] Links derived from the mount table, so a new renderable kind needs no
      edit here
- [x] Every emitted href resolves against the built tree
- [x] Falsified, and the falsification found a weakness in the test itself
- [ ] `bun run gates` green
- [ ] Merged, and verified on `main`

## The depth bug, and the test that did not catch it

The first version computed `toRoot` from the mount's **route depth alone** and
argued for it in a comment. True of a mount's `index.html`, false of every page
beneath: `smart-trust/` mounts one segment deep and holds `artifact/*.html` one
deeper, so **57 of 188 rail links pointed at a directory that does not exist**.
Caught by resolving every emitted href against the built tree.

Then the falsification found the second defect. Planting the bug back left all
twelve unit tests **green** — the test had restated the expression locally "so
it would not share the buggy one", and a restated expression guards nothing at
the call site. `toRootFor` is exported now and the test binds to it; planting
the bug fails exactly the two nested cases.

## Round 2 — the owner looked at the deployed rail, 2026-09-21

> *"clicking on doc/ or library/ under who-iris navbar did nothing. i expected
> to see the design/proposal docs in the docs side of things, and under
> library/ the 3 assets listed. are those interfaces not done?"*
>
> *"also check navbar hidden width too wide"* (with a screenshot of the
> collapsed rail showing a sliver of each label)

### The interfaces ARE done. The link went to the wrong one.

`/library/who-iris/` mounts `who-iris/library/` verbatim, and that directory's
`index.html` is the IRIS replica home — **the page `/who-iris/` already
serves**. So the rail's `library` link navigated correctly to a byte-identical
document. A reader cannot tell that from a link that does nothing, and neither
could a review: the href resolved, the file was there, the page rendered.

The library visualiser that lists the three materialized items IS built and IS
published (`jbx2`, closed): `cat-harness/docs/cat-harness/library/who-iris/`,
declared on the `library` entry as `coverage.visualiser`, scoped `SCOPE =
"who-iris"`, reading `/assets/library/index.json`. Checked: that projection
carries exactly three who-iris entries — `9789241548960-eng` (55,174 words),
`who-pub-tps-931` (25,713), `wpr-rdo-2020-003-eng` (3,405).

So the rail now links a kind to its **declared visualiser** when that
visualiser is published, and to the mount route otherwise —
`visualiserHref()` in `mount-instance-docs.ts`, with `publishedDocsPrefix()`
reading the Jekyll source off the built instance's own declaration rather than
hardcoding `cat-harness/docs`.

`docs` keeps `/docs/who-iris/`: that entry declares no visualiser, and the
three pages there (`index`, `ingestion-notes`, `kg-to-portal`) are the
design/proposal docs the owner expected.

**A visualiser declared but NOT under the published tree is named, not
composed into a plausible URL.** Quietly composing one is how the dead-looking
link survived review.

### Collapsed width

`RAIL_COLLAPSED_PX` was a bare `48` while the glyph column inside it was
`14 + 20 = 34`, so the first ~8px of every label sat inside the clip. At the
screenshot's zoom that is a visible sliver of a word per row, which reads as a
rail that failed to collapse.

Now **derived** — `RAIL_PAD_PX * 2 + RAIL_GLYPH_PX` = 40 — so the collapsed
rail is exactly the icon and its gutters. Deriving it is only half: clipping is
a geometry argument and a host stylesheet can move where a label starts without
touching these constants, so every label also carries `.fa-rail-label` at
`opacity:0` while collapsed. `opacity`, not `display:none` — the labels stay in
the accessibility tree, and this rail is the only harness navigation a mounted
page has.

The test binds to the markup (every non-`aria-hidden` span must carry the
class), so a label added later without it fails here rather than bleeding.
Falsified three ways: dropping the class, restoring the bare `48`, and making
`visualiserHref` compose a URL instead of refusing — 3 of 19 failed, one per
planted defect.

## Left open — `/library/who-iris/` is still a 1,378-file duplicate

Nothing links to it now, and it is a byte copy of `/who-iris/`. That
contradicts this script's own stated contract, which says `/<kind>/<instance>/`
is *"the KIND's handler, cat-harness's"* — and for `library` that handler's
output is the visualiser, published at `/cat-harness/library/who-iris/`.

Not fixed here, because every option changes a published URL and the owner's
addressing rule is theirs to change:

- **leave it** — a duplicate nobody links to, and the site carries 1,378
  redundant files;
- **stop mounting it** — `/library/who-iris/` 404s, which is worse for a URL
  somebody may have;
- **serve a redirect stub there** — keeps the URL, costs one file. Cannot be a
  copy of the visualiser: its `fetch("../../../assets/library/index.json")` is
  written for depth 3 and `/library/who-iris/` is depth 2, so a copy would
  reach past the site root and report a corpus it could not load.

## Round 2b — BOTH sides carried a cross-mount link, and both 404ed

Found while checking the destinations rather than the links. `who-iris/docs/`
mounts at `/docs/who-iris/` and `who-iris/library/` at `/who-iris/` — two
segments apart — so a relative href written on one side and rendered on the
other resolves to nothing:

| page | href | resolves to | exists |
|---|---|---|---|
| every docs page (shared chrome) | `community-list.html` | `/docs/who-iris/community-list.html` | no |
| `/who-iris/` landing, "Browse" | `ingestion-notes.html` | `/who-iris/ingestion-notes.html` | no |

`gen-iris-pages.ts` anticipated this in its own comment — *"linking across two
mount points once the split landed, which is a relative path that breaks the
first time either route moves"* — and the links were written anyway. A
generator-side gate cannot catch it: both files are present in the SOURCE tree,
one directory apart, and only the mount pulls them apart.

Fixed by removing both, not by composing `../../who-iris/`: the harness rail IS
the cross-mount navigation and it is injected by the layer that knows the
routes. A generator composing that path would be this instance holding a second
copy of the mount table, free to disagree with it. `page()` now takes `side`,
so the replica chrome's one internal link is library-side only.

Checked the way the rail's depth bug was checked — by resolving every local
href against the BUILT tree, not by reading the code: **157 local hrefs across
all three mounts, all resolve.**

## Closed — merged, and verified ON MAIN rather than on the branch

PR #785, merge commit `b34efee271`, 2026-09-21. `bun run gates` green (93 of
93) on the merged tree; CI green on head `4ba42590d9`; docs-site run #393
fired on the merge, which is the `tyyc` check — a merge that triggers no site
build looks exactly like one that did.

Checked by reading main, not the branch:

| | on `origin/main` |
|---|---|
| `RAIL_COLLAPSED_PX = RAIL_PAD_PX * 2 + RAIL_GLYPH_PX` | present, `harness-rail.ts:94` |
| `visualiserHref` | present in `mount-instance-docs.ts` |
| `href="community-list.html"` in `who-iris/docs/index.html` | **0** occurrences |

The rail itself is done. What this bean left open moved to **`2b5s`**, and it
grew on the way: the owner asked *"where are duplicates?"*, and answering it
showed that `/library/who-iris/` duplicating `/who-iris/` is the smaller half
— 1,367 of those 1,378 files are L1 corpus sidecars being published as a
website, once at `/who-iris/` before any duplication. The prior question is
whether a mount copies a directory wholesale at all.

