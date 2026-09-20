---
name: asset-extraction
description: >
  Reading a container — a zip, a PDF, a saved web page — into the knowledge
  graph. What goes in by default (metadata), what does not (contents), the
  three timestamps that sit near each other and mean different things, and why
  a producer string is evidence.
---

# Asset extraction — the index goes in, the contents do not

A container arrives in `uploads/`: a zip of a saved web page, a PDF, a
tarball. Something inside it is wanted. **What enters the knowledge graph is
the INDEX** — what is in there, how big, what type, when it says it was
written — and not the files.

Owner, 2026-09-20:

> *"make sure you have zip ingestion skills to extract metadata of assets into
> KG. don't extract contents unless explict ask by user."*

```sh
bun run cat-harness/scripts/extract-assets.ts <container>
bun run cat-harness/scripts/extract-assets.ts <container> --extract <path> --because "<why>"
```

The first writes a `folio-extraction/v1` record beside the container. The
second additionally writes **one** named entry, and refuses without a reason.

## Why metadata is the default

A container's index is cheap and complete: a zip's central directory carries
every entry's size, name and timestamp without decompressing a byte. That is
enough to answer *what is in here*, *how big is it*, and *is any of it what I
want* — which is every question asked before somebody decides to take a file.

Extracting by default costs the opposite: a working tree full of files nobody
chose, each of which now looks committed-on-purpose to the next reader, and
none of which carries a reason.

**`--because` is required, and it is the point of the flag.** An entry written
to disk with no stated reason cannot be told from one nobody authorised. The
schema refuses it (`ExtractedAsset.superRefine`), so this is not a habit that
depends on remembering.

## The three timestamps, and the one that gets confused

| | says |
|---|---|
| `dc.date.issued` | when the PUBLISHER published the work |
| `materializedAt` | when WE brought the bytes local |
| `capturedAt` | when a TOOL produced this file out of something else |

**An extraction timestamp is never a publication date.** Measured on the WHO
IRIS capture, which is why this is a schema field rather than a note:

```
zip entries      2026-09-20 07:42   (all 11 of them)
page PDF         CreationDate D:20260920074221
info PDF         CreationDate D:20260920074925
```

The style guide those files contain was **published in 2020**. Every timestamp
in the capture is 2026, and every one of them is the moment somebody pressed
save. Folding the two would date a 2020 publication to 2026 and lose the only
evidence the artefact is second-hand.

`isSingleCapture()` computes the distinction rather than asserting it: when
every entry shares one minute, ONE ACT wrote the container and no entry's date
says anything about that asset's own history. When they differ, the container
preserved real dates and they can be read as such.

## A producer string is evidence, and is recorded verbatim

Both captured PDFs carry `Producer: Skia/PDF m152`. That is Chrome's
print-to-PDF — so neither file is WHO's own PDF, both are **printed web
pages**, and nothing else in a file listing, a byte count or a checksum shows
it.

Recorded as written, never normalised to "Chrome": the version is part of the
evidence, and a normaliser is a place for the fact to get smaller.

This is the mechanical half of a judgement the IRIS intake already records by
hand — the page PDF is filed with role `none`, because *"we looked and it is
not what it appears to be"* is a different fact from *"nobody looked"*.

## What is NOT dropped silently

A zip written on macOS carries a `__MACOSX/` shadow per entry. Skipping them
quietly makes the asset count disagree with the container's own, and a reader
reconciling the two finds nothing to explain the gap. They go in `omitted[]`
with a pattern, a reason and a count — measured on the IRIS zip: 11 real
entries, 12 shadows.

## Where the record lives

Beside the container, in `uploads/`. **`uploads/` is a `state` graph** — a
queue that ingestion drains — so an extraction record is not L1 corpus and
does not read as one. What a THEME or a LIBRARY entry cites is the extracted
file's `localPath`, which exists only once somebody asked for it.

## Related

- [`library-ingestion`](library-ingestion.md) — the other way in. A container
  read this way has not been ingested; it has been *described*.
- `schemas/extraction.ts` in folio-assist-core — the record, and why each
  field is optional or not.
- `schemas/materialization.ts` — `materializedAt`, the timestamp this one is
  most often confused with.
