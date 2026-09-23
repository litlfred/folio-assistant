---
# folio-assistant-t3n8
title: The archive rung stages but can never promote, and no rung reads plain text at all
status: todo
type: bug
created_at: 2026-09-22T22:17:51Z
updated_at: 2026-09-22T22:17:51Z
parent: folio-assistant-ahvw
---

Measured 2026-09-22 while trying to ingest the MADR source (`adr/madr`, MIT OR CC0-1.0) as evidence for the `madr` methodology.

## The pipeline cannot terminate for an archive

```
$ bun run ingest cat-harness/uploads/adr-madr-2026-09-22.zip --library library
  rung: archive  —  sniffed application/zip, entries listed as data, not extracted
  ok  adr-madr-2026-09-22   7 file(s), 1 dir(s)  [zip]
  2 requirement(s) still to satisfy:
    technical-metadata     no `source` block — re-run the ingest rung
    manifest               no manifest.jsonld

$ bun run cat-harness/scripts/l1-blocks.ts -o cat-harness/ingest-staging/adr-madr-2026-09-22
  error: no structure.json — this is not a staged entry
```

`archive-contents.py` writes `contents.jsonld` and nothing else — by design, and its docstring says so: *"It does not extract. ... pulling the documents inside out into `sections/` is a separate question and a separate arm."*

But `l1-blocks.ts`, the arm that produces `manifest.jsonld`, **derives everything from `structure.json`**, which only the pdf rungs write. So an archive stages and can never be promoted. `mayPromote` requires every requirement met; two of them have no arm that can satisfy them for this rung.

**This is `l1-blocks.ts`'s own founding defect, one rung along.** That module exists because *"`bun run ingest` could stage a document and nothing could ever promote one"* — the same sentence is true of the archive rung today.

## The second half: there is no rung for plain text at all

`PlannedIngest.rung` is `archive | tabular | pdf-structure | pdf-pages | pdf-ocr+pdf-pages | undetermined`. **No markdown, no plain text, no HTML.** So an open-access source that is not a PDF cannot become readable L1 by any route:

- as loose `.md` files → no rung
- as an archive → stages, cannot promote, and would not extract the text anyway

That is what blocks `madr`, and it will block any future adoption whose canonical source is a repository or a web page rather than a paper. `archiving-web-pages` says the default capture is **both** a PDF and the page's own bytes; this repository can currently ingest only the first.

## Why it was not worked around

Hand-building a `library/adr-madr-2026-09-22/` with `sections/` written by hand would produce an entry that reads as ingested while nothing in the pipeline made it — the exact failure `6xaz` records and the reason `ingest` refuses an undetermined probe rather than guessing.

## What is held in the meantime

`cat-harness/uploads/adr-madr-2026-09-22.zip`, fetched from `raw.githubusercontent.com/adr/madr/main/` on 2026-09-22, MIT OR CC0-1.0. Per-file sha256 (the commit could not be pinned: `api.github.com` is gated to session-allowed repositories, so `main` is a moving reference and these hashes are the provenance):

```
075685b90e5367fb17b113e662b752e0705cedc065d11c49c5a27ee24101bc4b  README.md
cb9c3a276eb7991be197e401ae38d035f0f0efae425c21f499393f51c9b29ffd  LICENSE
03bf5dece8dc62b0c03b554f839176e1ac6efc2dfef182e1501dc4960d7c7db8  CHANGELOG.md
8ef8f054fbb6b89f5638e7de91e5863825938afef18243c6499f12608b7087bb  template/adr-template-bare-minimal.md
6196bf69b52ef2c118b53ba241a500df41939ebfab47efd39b87191025fb6e4e  template/adr-template-bare.md
24581feeb737b4dc5603467cf9d9453b97d1784e7251f4205774a0bbc0833d90  template/adr-template-minimal.md
940d45674563e0a2c6e96b4741b2778b18fdf0d5df1f47cc2a27a841d1b5ea82  template/adr-template.md
```

Sitting in `uploads/` is the correct state for it: that is the queue, and the declaration is explicit that a file there is NOT L1 and NOT greppable as corpus.

## Done when

- [ ] an archive can reach a promotable L1 entry, or the archive rung declares itself terminal and `check-l1-complete` stops asking it for a manifest
- [ ] a text/markdown rung exists, OR it is recorded as a deliberate refusal with the reason
- [ ] `madr`'s source is ingested and cited in its `evidence`
- [ ] whichever way it goes, `library-ingestion` says which source kinds can and cannot become L1 — today a reader has to read the rung union to find out
