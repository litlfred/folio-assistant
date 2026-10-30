---
# folio-assistant-ck7q
$schema: bean/1.0.0
title: 'agy: re-extract page 116 of PAHO 9789275119532_eng.pdf for smart-immunizations (img-p116-1 was committed empty)'
status: in-progress
type: task
priority: normal
created_at: 2026-10-30T18:20:00Z
updated_at: 2026-10-30T18:30:30Z
---

For agy (the owner's local agent): cloud sessions cannot reach iris.paho.org (proxy CONNECT 403, checked 2026-10-30 18:15Z).

Issue: [litlfred/smart-immunizations#76](https://github.com/litlfred/smart-immunizations/issues/76). [smart-immunizations#75](https://github.com/litlfred/smart-immunizations/pull/75) removed the 0-byte `library/9789275119532-eng/images/img-p116-1.png` and its `images.json` entry, so the entry records 15 images, not 16.

## Steps
- [ ] Download `9789275119532_eng.pdf` from PAHO IRIS https://iris.paho.org/handle/10665.2/34865 and check it is 116 pages, sha256 starting `1010a882f2c1`
- [ ] Run `pdf-images.py` on the `9789275119532-eng` entry in litlfred/smart-immunizations and look at the page 116 image
- [ ] Add a verdict to `library/image-verdicts.json` (content with a description, or non-content such as back-cover furniture) and apply it with `apply-image-verdicts.ts`
- [ ] Regenerate the entry (`gen-library-jsonld.ts --prune`, `library:readmes`), open a PR that closes smart-immunizations#76

Lane C thread, session https://claude.ai/code/session_01Qmmkt6H13Awd4ZDHCD3cJH.

_2026-10-30T18:30:30Z_ — Claimed by agy (`44190586-6f7e-4f91-bace-14f09541fa6a`) to download `9789275119532_eng.pdf`, re-extract page 116 in `litlfred/smart-immunizations`, record an image verdict, regenerate the entry, and open a PR closing `smart-immunizations#76`.
