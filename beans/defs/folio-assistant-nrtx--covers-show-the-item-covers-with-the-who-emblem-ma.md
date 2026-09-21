---
# folio-assistant-nrtx
title: 'COVERS: show the item covers with the WHO emblem masked, and make the mask survive re-rendering'
status: completed
type: task
priority: normal
created_at: 2026-09-21T17:40:00Z
updated_at: 2026-09-21T18:10:00Z
parent: folio-assistant-vke6
---

## What

Show the three item covers on the who-iris replica with the WHO emblem blanked
out. Owner, 2026-09-21, choosing between four options: *"Show covers, but
strip/mask the emblem"* — after their earlier ruling that the emblem counts as
*"logo and other branding"* had them withheld entirely.

## Two faults were stacked, and the outer one hid the inner

1. `COVERS_SHOWN = false` — the ruling. Rows read **cover withheld**.
2. **The `src` was broken anyway.** `coverSrc` did
   `lp.replace(/^docs\//, "")`, correct while the pages lived in `docs/`. They
   moved to `library/` in `zgba` and the covers did not, so every `src`
   resolved to `library/assets/covers/…` — a 404.

Nobody could see (2) because (1) meant the `<img>` was never emitted. Flipping
the switch alone would have shown three broken images.

## The mask is in the BYTES, not in a display rule

`pdf-cover.py` blanks the regions **before it computes the digests**, so the
committed PNG does not contain the emblem and no downstream flag can leak it.
Masking afterwards would have left the renderer's provenance describing an
image nobody has, and `gen-covers --check` failing on every run while the file
was correct.

Regions are declared per item as `maskedRegions` on the THUMBNAIL bitstream,
with a **required `reason`** — a blanked rectangle and a publication that never
carried anything there are indistinguishable in the bytes and mean opposite
things. The fill is mid grey rather than the page colour, for the same reason:
an invisible mask is a claim nobody can check.

Found by pixel profiling, not by eye — per-row counts of non-background pixels
separate the logo lockup from the title beneath it:

| cover | lockup rows | mask |
|---|---|---|
| `wpr-rdo-2020-003-eng` 300x212 | 70–104 | (105,66)-(193,108) |
| `who-pub-tps-931` 300x424 | 229–263 | (118,226)-(164,264) |
| `9789241548960-eng` 300x450 | 355–382 | (99,351)-(195,386) |

## The TITLE is not masked where it contains "WHO"

*WHO Editorial Style Manual*, *WHO Handbook for Guideline Development*. That
names the work — a bibliographic fact — and is not branding this replica wears.
Masking it would leave a cover that names no book. Stated here because it is a
judgement inside the owner's instruction rather than a consequence of it.

## Where the covers live, and the two constraints that decided it

`who-iris/library/<slug>-cover.png`, flat. Not obvious, and arrived at by being
wrong twice:

- **Not `docs/assets/covers/`** (where they were): `library/` mounts at BOTH
  `/who-iris/` and `/library/who-iris/`, so no relative path from a library
  page reaches a `docs/` asset at both routes.
- **Not `library/assets/covers/`** (tried first): `check:l1-complete` treats
  **every directory** under `library/` as an L1 corpus entry and demanded
  `structure.json`, `sections/`, `blocks/` of it. Flat files it skips.

Pruning is safe: `orphansIn` is scoped to `OWNED_LIB`, which matches `.html`
only.

## Done when

- [x] Masks declared as data with a required reason, schema-validated, bounded
      by the declared raster
- [x] Applied in the renderer before the digests; `--check` round-trips
- [x] All three masks verified by pixel — rect is pure fill, nothing of the
      lockup survives outside it
- [x] Cover `src` derived from the page's directory rather than a literal strip
- [x] `COVERS_SHOWN = true`, alt text says the emblem was masked
- [x] `bun run gates` green — 92/92, with pymupdf and with a stub that hides it
- [x] Merged as `24570e7536`, and **verified on `main` after the merge**:
      `COVERS_SHOWN = true` at `gen-iris-pages.ts:358`, `gen-covers --check`
      clean, 3 declared regions, 3 `<img>` src resolve / 0 broken

## Summary of Changes

The emblem is absent from the committed bytes rather than hidden by a flag, so
no display decision downstream can leak it. Regions are data with a required
reason, schema-bounded by the declared raster; the renderer refuses an
out-of-bounds region rather than clamping, because a mask covering less than
asked looks exactly like one that worked.

**CI caught a real one.** The bytes-level test shelled out to `pymupdf`, in a
gate job that installs `ruff` and nothing else — which `gen-covers.ts`
documents, at length, as having reddened the branch three times before. I read
that paragraph while writing this and walked into it anyway. Fixed per
`verifyWithoutRender`'s rule: degrade to *slightly less* and say what was
skipped. Two of the three claims need no decoder, and both were falsified, so
the fallback can genuinely fail.

**Left open with the owner:** whether the publication titles containing "WHO"
should also be masked, and whether the mid-grey fill reads as deliberate or as
damage on a page whose job is to look like IRIS. Both are one-line reversals.

## Not this bean

Trimming `who-iris/library/` (1,375 files at two routes) and the hero image —
already a gradient per *"just use colors"*.
