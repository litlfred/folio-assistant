---
# folio-assistant-rlp5
title: pdf-ocr and pdf-structure disagree about what -o means
status: todo
type: bug
created_at: 2026-09-19T00:12:09Z
updated_at: 2026-09-19T00:12:09Z
---

`scripts/pdf-structure.py -o DIR` writes `DIR/<doc-id>/` — its help says 'root for <doc-id>/ output dirs'. `scripts/pdf-ocr.py -o DIR` writes `DIR/ocr/` with no doc-id level at all.

Measured 2026-09-19: `python3 scripts/pdf-ocr.py -o library uploads/WHO_PUB_TPS_93.1.pdf` put 121 pages in `library/ocr/`, not `library/who-pub-tps-931/ocr/`. Had a second scanned document been OCR'd into the same `library/`, the first one's pages would have been overwritten silently — same filenames, same directory.

Then `pdf-structure.py --ocr` looks for the cache in the doc-id location, so the two steps of one documented pipeline do not compose: the OCR has to be moved by hand between them, which is what 'Today the move is a script plus whatever the agent remembers' (bean `apui`) describes.

## Done when
- `-o` means the same thing in both scripts: the ROOT that `<doc-id>/` hangs off.
- `pdf-ocr.py` derives `<doc-id>` the same way `pdf-structure.py` does, from one shared helper rather than two spellings.
- Overwriting another document's cached OCR is impossible by construction, not by convention.
