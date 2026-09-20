---
# folio-assistant-ll11
title: 'GAPS: no check for undeclared files on disk, and the engineer art is 16x heavier than its siblings'
status: todo
type: task
created_at: 2026-09-20T06:23:14Z
updated_at: 2026-09-20T06:23:14Z
parent: folio-assistant-o3xy
---

Two gaps `mggs` surfaced but deliberately did not fix, so they are not lost.

## 1. Nothing checks for a file on disk that no declaration names

`check-declared-assets.ts` walks **declared -> disk** only: it reports a
declared asset that is missing, a dead link, or one it could not check. There is
no reverse sweep, and its `DECLARED_INSTANCES` is `["cat-harness", "bootstrap"]`
— the repository root is deliberately not an instance since the move.

Measured cost, 2026-09-20: commit `0301fbd2` added three 1.6-1.8 MB PNGs at the
repository root, with spaces and commas in their filenames, and **no gate
noticed**. They sat outside every instance, undeclared, invisible. They were
found only because somebody went looking for them by hand. An automated pass
then misread them as a regeneration of the existing landing art and recommended
overwriting three declared `.webp` files; opening the image showed a completely
different costume. Both halves of that near-miss trace to the same absence: a
file nothing declares is a file nothing reasons about.

This is the `dh4f` shape inverted. `dh4f` is "declared but absent, so a consumer
scans nothing and reports a clean run". This is "present but undeclared, so no
consumer ever sees it at all".

**Done when** a sweep reports files on disk under an instance's asset-bearing
directories that no declaration names, with the repository root included
explicitly rather than by accident, and it can fail.

## 2. The engineering landing art is PNG at ~1.6 MB a crop

`cat-harness/docs/assets/img/harness/landing-engineer-{laptop,mobile,card}.png`
are 1,597,650 / 1,755,166 / 1,688,979 bytes. Their `.webp` siblings for the
original art are 102,904 / 128,970 / 100,350 — roughly **16x smaller**.

They are PNG because no converter was available in the environment where they
arrived: no `cwebp`, no ImageMagick, no PIL. Declared as PNG rather than renamed
to imply a conversion that did not happen.

Only ONE is loaded per viewport — `<picture>` picks a crop — so a visitor pays
~1.6 MB, not 5 MB. Still the heaviest thing on the landing page by an order of
magnitude, and the landing page is the first thing anybody loads.

**Done when** the three are webp at comparable quality, `harness.json`'s `src`
and byte-sensitive expectations follow, and the PNGs are removed only after the
webp are verified to render — never the other way round.
