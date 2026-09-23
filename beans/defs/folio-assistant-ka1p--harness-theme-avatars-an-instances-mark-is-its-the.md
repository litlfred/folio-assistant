---
# folio-assistant-ka1p
title: 'HARNESS THEME AVATARS: an instance''s mark is its theme art, cropped — and the supplier is not always the subject'
status: in-progress
type: task
parent: folio-assistant-p5wm
created_at: 2026-09-22T22:30:48Z
updated_at: 2026-09-22T22:30:48Z
---

Owner, 2026-09-22: "bootstrap and who-iris need theme avatars, bootstrap = cowboy grump cat", then the IRIS wordmark by screenshot.

## What was wrong

`tileFor` resolved an instance's theme backdrop against **its own** `decl.images`. `bootstrap` declares a sticky naming `theme: bootstrap` and **zero images** — `cat-harness` declares the `landing-bootstrap` role. So the resolver found nothing and reported a gap that was not one.

That is the inversion `ThemeBackdropSchema` exists for: a theme names a ROLE and whoever holds images for that role supplies the art. `gen-landing-data.ts` has always resolved a contributed sticky's art against the SITE OWNER's images, so the fix is that join rather than a second one — widened by an own-images-first step, which changes no existing answer because no instance below the owner declares a landing role today.

## Done when

- [x] bootstrap shows its cowboy-cat theme art, cropped, with no new asset
- [x] the path follows the SOURCE — art the owner supplies is published under the site's root, not the instance's mount
- [x] one resolved `mark` (theme avatar, else icon, crop solved) instead of five Liquid branches
- [x] an ICON may carry a crop too — a region on an icon was in the data and rendered by nothing
- [x] who-iris has a mark
- [ ] who-iris's mark is the asset the owner actually wants — see below

## who-iris: shipped with the WHO emblem, NOT the IRIS wordmark

The owner chose "reuse the captured who_logo.svg" from four options, with the option text stating it is the WHO emblem rather than the `iris.` wordmark they had screenshotted. So it is their informed choice and it is what shipped: copied OUT of `uploads/` per `10s1` to `who-iris/docs/assets/img/who-emblem.svg`, declared 581x178 with an `avatarRegion` taking the leftmost square — which a render confirms is the emblem.

**But they sent the `iris.` wordmark twice, before and after answering.** That is worth re-asking rather than treating as settled. Swapping it is one `src` and one re-measured `avatarRegion`; nothing else moves.

## Not done

smart-trust, folio-assistant-core and the rest still show initials: they declare neither a sticky-with-theme nor an icon. Reported as a finding, not invented.


## ROUND 2, 2026-09-22 — a card id is NOT the instance name

Owner: *"now do smart-trust and folio-assistant-core avatars"*.

`folio-assistant-core` needed no decision and no art. It already declares a
sticky naming `theme: library`, and `landing-library-card.webp` already exists
with a measured `avatarRegion`. **The resolver was wrong**, in the way this
repository has already paid for once:

    decl.stickies?.find((st) => st.id === decl.name)

`landing-sticky.test.ts` pins the opposite, by name:

> `folio-assistant-core/` is the directory since the owner's ruling of
> 2026-09-20; its card id stays `folio-assist-core` because **a card id is a
> published identifier on the landing page and the directory is only where the
> files sit** ... which is exactly why it broke when they were **assumed to be
> one string**.

That is the assumption I wrote yesterday, one file over, and it is why core had
no avatar while its theme was declared all along. There is a test asserting the
divergence and it was green throughout, because it tests `contributionsOf`
rather than the tile.

**Fixed by not assuming**: an instance's own sticky is the one its OWN
declaration contributes — exact id match first, and a single contribution
otherwise. Several contributions with no exact match is reported rather than
picked from.

- [x] folio-assistant-core shows the librarian cat, with no new art and no
      renamed id
- [x] smart-trust — owner chose `operations` from three cards; it contributes
      a card naming that theme, which ALSO puts it on the landing board (a
      theme is reached through a sticky, so that is inherent and is recorded
      in the declaration rather than discovered later)
- [x] an icon's URL is the SITE DIRECTORY's mount, not the front door — see
      below; this was shipped broken in #984


## A DEFECT I SHIPPED IN #984, found by running the mount

who-iris's mark 404'd on the published site. `publishedIcon` composed against
`folioRoot` — *"`/` for the instance that owns the site, `/<name>/` for one
mounted beneath it"* — which is the instance's FRONT DOOR, a different question
from where its SITE DIRECTORY lands.

Measured by running `mount-instance-docs` against a built preview:

    who-iris/library/  ->  /who-iris/        (1378 file(s))
    who-iris/docs/     ->  /docs/who-iris/   (4 file(s))

Every instance gets a `<kind>/<name>` route unconditionally; the bare `<name>`
route goes to whichever kind claims it FIRST, and for who-iris that is the
**library**. So its front door serves 1,378 corpus files and the icon pointed
into it. Confirmed 404 against 200 for the same asset.

**The local preview hid it**, which is the part worth keeping: `preview:site`
does not run the mount, so the asset was absent there for an unrelated reason
and the wrong URL looked like the same 404. I only separated them by running
the mount step by hand.

`siteDirMount` composes the `<kind>/<name>` route from the kind the instance
declares for that directory, and an instance that classifies its site dir under
no kind gets NO icon — a real answer, since nothing can be said about where an
unclassified directory is served.

**An existing test asserted the broken rule** (`"an instance mounted beneath the
site root carries its mount"` → `/sibling/...`) on the premise *"everything else
is at `/<name>/`"*. Updated with the measurement rather than deleted; four new
specs pin the kind coming from the declaration rather than the string `docs`.


## ROUND 3, 2026-09-23 — engineer for root, and the architecture theme is HELD

Owner: *"create architecture theme. engineer for root"*.

**engineer → root is done.** The root instance declares a card naming
`theme: engineer`, at order 5 so the repository reads ahead of cat-harness's
10. The art is cat-harness's `landing-engineer` — the root declares no images
— which is the supplier-is-not-the-subject fallback `bootstrap` already
relies on. **Every instantiated harness now carries a mark**; none is on an
initial. All five verified 200 against a MOUNTED build.

**The architecture theme ships PALETTE-ONLY, and the backdrop is withheld.**

The palette is real and measured rather than matched to its neighbours: the
card was drawn to a canvas and every pixel binned into a 32-step cube, giving
`#fdfbf0` 35.38 %, `#6a7c73` 33.07 %, `#a6aea8` 3.45 %, `#1a372d` 2.32 %. Ink
on surface is **12.43:1**, past the AAA 7:1 floor the whole set is held to.

**The art cannot carry a backdrop.** `landing-architecture` declares laptop and
card and **no mobile**; `resolveThemeBackdrop` refuses a partial set wholesale.
I wrote the entry WITH a backdrop first and `themes.test.ts` failed it — the
gate doing precisely its job, and its own comment names this case:

> the architecture art arrived as two layouts of three (**the third upload was
> a byte-identical copy of the second**), so no `architecture` theme is
> declared. If somebody adds one before the portrait crop arrives, this fails
> rather than shipping a theme that serves a landscape crop to a phone.

So the portrait crop was never supplied — it is not a mislaid file. I did not
derive one: there is no image tooling in this container (no PIL, no
ImageMagick, no sharp), and cropping a square card to portrait is a
compositional judgement about the owner's brand art rather than a mechanical
step.

The scrim is measured anyway and recorded in the entry, so the remaining edit
is declaring `landing-architecture-mobile` and pasting a four-line block:
**9.02:1** over pure black at 0.86, 12.52:1 over white, swept rather than
copied (0.78 already clears the floor at 7.36:1).

- [x] engineer for the root instance
- [x] architecture theme — id, palette, layouts, all measured
- [ ] architecture BACKDROP — blocked on a portrait crop that does not exist


## ROUND 4, 2026-09-23 — smart-base takes the who-iris route

Owner: *"smart-base avatar: use who-iris route, WHO blue no logo"*.

`smart-base` shipped as an **exemption** when `smart-base.config.json` made it
an instantiated harness, on the reasoning that WHO's mark is not this
repository's to choose. That exemption's own comment named the better route as
open and the owner's to take, and this is the owner taking it.

**Registry entry, not an asset.** `AVATARS["smart-base"]` — glyph
`M3 18h18M6 14h12M9 10h6M11 6h2` (a broad base with three narrowing courses
above it), `tone: 199`. No emblem, no crop, no file: that IS the who-iris
route — an organisation's published colour with a neutral glyph is not
inventing its identity, where cropping its logo would be.

**The glyph reads the instance's POSITION, not its subject.** `fhir-harness`
sits under smart-base; `smart-l1`, `smart-dak` and `smart-ig` are built on it.
A base course under narrowing ones is that shape. Every other WHO-adjacent
instance would draw the same subject matter, so the subject cannot
discriminate and the position can.

**Tone 199 is shared with `who-iris` deliberately.** Measured from the same
`#0093D5`, because they are two instances of the same organisation's material
and should read as a family. The registry constrains **glyphs** to be
distinct, not tones, and that is the right constraint: the glyph says which
instance, the tone says whose. A near-miss hue would assert a distinction
that does not exist.

**The exemption is removed in the same change**, which the check requires
rather than tolerates: `check:avatar-instances` FAILS on an exemption naming an
instance that has since declared an avatar, so the two edits cannot drift
apart. After: 6 instantiated harnesses, 1 exemption (`smart-trust`), no gap.

**`docs/_data/harness.json` moved too**, and that is the point of the change
rather than a side effect — the tile now carries `tone: 199` and the mark's
`reads` line instead of `genericAvatar: true`, and the finding *"smart-base: no
avatar declared for this instance — showing the generic mark"* is gone.

- [x] smart-base has a mark, on the who-iris route
- [x] the stale exemption removed in the same commit
