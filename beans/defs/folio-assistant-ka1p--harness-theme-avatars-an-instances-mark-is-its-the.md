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
