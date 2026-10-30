---
# folio-assistant-ck7q
$schema: bean/1.0.0
title: 'agy: re-extract page 116 of PAHO 9789275119532_eng.pdf for smart-immunizations (img-p116-1 was committed empty)'
status: in-progress
type: task
priority: normal
created_at: 2026-10-30T18:20:00Z
updated_at: 2026-10-30T18:45:30Z
---

For agy (the owner's local agent): cloud sessions cannot reach iris.paho.org (proxy CONNECT 403, checked 2026-10-30 18:15Z).

Issue: [litlfred/smart-immunizations#76](https://github.com/litlfred/smart-immunizations/issues/76). [smart-immunizations#75](https://github.com/litlfred/smart-immunizations/pull/75) removed the 0-byte `library/9789275119532-eng/images/img-p116-1.png` and its `images.json` entry, so the entry records 15 images, not 16.

## Steps
- [x] Download `9789275119532_eng.pdf` from PAHO IRIS https://iris.paho.org/handle/10665.2/34865 and check it is 116 pages, sha256 starting `1010a882f2c1`
- [x] Run `pdf-images.py` on the `9789275119532-eng` entry in litlfred/smart-immunizations and look at the page 116 image
- [x] Add a verdict to `library/image-verdicts.json` (content with a description, or non-content such as back-cover furniture) and apply it with `apply-image-verdicts.ts`
- [x] Regenerate the entry (`gen-library-jsonld.ts --prune`, `library:readmes`), open a PR that closes smart-immunizations#76

Lane C thread, session https://claude.ai/code/session_01Qmmkt6H13Awd4ZDHCD3cJH.

_2026-10-30T18:30:30Z_ — Claimed by agy (`44190586-6f7e-4f91-bace-14f09541fa6a`) to download `9789275119532_eng.pdf`, re-extract page 116 in `litlfred/smart-immunizations`, record an image verdict, regenerate the entry, and open a PR closing `smart-immunizations#76`.

_2026-10-30T18:45:30Z_ — Implemented in [litlfred/smart-immunizations#98](https://github.com/litlfred/smart-immunizations/pull/98) (`fix/ck7q-re-extract-9789275119532-p116`, `fb19272`, closing [litlfred/smart-immunizations#76](https://github.com/litlfred/smart-immunizations/issues/76)):
- **Step 1:** Downloaded `9789275119532_eng.pdf` via PAHO IRIS DSpace 7 REST API (`https://iris.paho.org/server/api/core/bitstreams/bdf7fd07-5f15-478c-bfab-e76df4d756cd/content` for item `d340d0af-aac8-46f1-b98e-001b04c9d677` / handle `10665.2/34865`); verified 116 pages, 5,100,968 bytes, `sha256: 1010a882f2c1990aec1b6ad1f69a6eda548ba007f3c667db5c1edef1b87dcd34`.
- **Step 2:** Diagnosed why `img-p116-1.png` was originally written as 0 bytes in `#12`: page 116 `xref=365` uses a 1-channel `DeviceN(1,DeviceCMYK,Black)` colorspace (`pix.n == 1`, `pix.alpha == 0`), which bypassed `if pix.n - pix.alpha >= 4:` in `cat-harness-tools/scripts/pdf-images.py` and caused MuPDF's `pix.save()` to throw `code=4: pixmap must be grayscale or rgb to write as png` after creating the empty file on disk. Converted `DeviceN` to `csRGB` and extracted `library/9789275119532-eng/images/img-p116-1.png` (`228x150` 8-bit RGB PNG, 3,653 bytes, `sha256: eae714c1d0a134d1c0bf99c5a465046b0bd2f0f7c053c566c996f8180febe87c`). Inspection showed it is the back-cover ISBN EAN-13 barcode (`9 789275 119532`) placed at `Rect(678.32, 501.85, 787.55, 573.41)` directly below `ISBN: 978-92-75-11953-2` on page 116 (coverage `0.015597`, alone on the page).
- **Step 3:** Recorded verdict `role: "decorative"`, `saw: "an ISBN barcode on the back cover"`, `draft: "The back-cover ISBN barcode for 978-92-75-11953-2 (9 789275 119532)."` for `9789275119532-eng/img-p116-1` in `library/image-verdicts.json` (matching `smart-base` `9789240101197-eng/img-p078-1`), applied with `apply-image-verdicts.ts` (preserving the Batch Z `fr`/`es`/`ar`/`ru`/`zh` draft narratives on all 16 images).
- **Step 4:** Ran `gen-library-jsonld.ts --prune --doc 9789275119532-eng` and `bun run cat library:readmes` (`images | 15` -> `images | 16` in `library/9789275119532-eng/README.md`), verified `check-l1-complete.ts`, `check-catalogue.ts`, `check-materialized-fixity.ts`, `pdf-images.test.py`, and `document-image.test.ts` all pass.
