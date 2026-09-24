---
name: iris-dspace
description: >
  How WHO IRIS uses DSpace and qualified Dublin Core — the three identifier
  systems, MeSH as a controlled vocabulary, bundles, and the containment path.
  What a later tool needs from a record, stated as requirements it can be
  checked against.
conformsTo:
  - dcmi-terms
---

# IRIS, DSpace and Dublin Core

**Every claim here was read off one captured record** — the DSpace full item
record for `wpr-rdo-2020-003-eng`, uploaded in `9a60f6f` and extracted with
`pdftotext -layout` on 2026-09-20. Nothing is asserted from general knowledge of
DSpace, because that is the `source: null` defect bean `r1lz` was opened over:
*a voice with no provenance is the same class of defect as a measurement with no
date.* Where this file and the record disagree, the record wins.

The record itself is at
[`catalogue/records/wpr-rdo-2020-003-eng.dc.json`](../catalogue/records/wpr-rdo-2020-003-eng.dc.json).
The type is `folio-assistant-core/schemas/dublin-core.ts` — **generic**, because
Dublin Core is ISO 15836 and DSpace is a platform; neither is WHO's. Only what
IRIS *does with them* is here.

## Scale, so a size gate has a denominator

From IRIS's own storage report (By Location → Entire Site), read 2026-09-20:

| | | source |
|---|---|---|
| items | **273,559** | the home page's search placeholder |
| files | **1,057,223** | the storage report |
| storage | **361.55 GB** | the storage report |
| top-level communities | **8** | the storage report |

**These are two different denominators and they were one field until
2026-09-20.** The storage report publishes files; `totalItemsUpstream` was fed
the file count with a note saying so, because an item carries several
bitstreams and IRIS — *on that page* — does not publish how many items there
are. It publishes it on the **home page**, in the search box: *"Search through
the repository's 273559 items"*. So the catalogue now carries both, and
`totalFilesUpstream` exists in the schema for exactly this.

**3.86 files per item**, which lands inside the 3–4× range this section
predicted from the bundle structure before either number was known. The
prediction is not the point; the point is that a *labelled* wrong denominator
could be replaced the day the right one appeared, while a silently wrong one
would still be in every fraction.

The storage figure is **derived, not transcribed**: the report prints two
decimals and no byte count, so `totalBytesUpstream` is `round(361.55 × 1024³)`
and is good to about ±5 MiB. It is GiB rather than GB because that is the
reading under which every per-community figure the same report prints —
238.58, 19.72, 34.84, 26.14, 25.71 — reproduces **exactly**, and none of them
does at 10⁹.

## Three identifier systems, and the one in our slugs is the weakest

The single worked item carries all three:

| system | value | authoritative? |
|---|---|---|
| DSpace UUID | `18892cf3-5a4f-42a4-923c-a93f4a594dec` | **no** — IRIS's own, stable only while this DSpace instance is |
| Handle | `10665/332098` | **yes** — guaranteed by the Handle System, outside WHO |
| WHO govdoc | `WPR/RDO/2020/003` | no — WHO's publication number |

**The library slug here is `wpr-rdo-2020-003-eng`, derived from the third.** So
a tool resolving by slug is resolving by the weakest key available, and one that
resolves by Handle survives the source moving. Worth knowing before writing
anything that looks up an item.

### A legacy handle is live in the record, and must not be deduplicated

`dc.identifier.uri` appears **twice**:

```
https://iris.who.int/handle/10665/332098          ← global
http://iris.wpro.who.int/handle/10665.1/14518     ← regional, merged away
```

Regional IRIS instances were folded into the global one and **both URIs were
kept**. A pipeline that "cleaned up duplicate identifiers" would discard a real
alternate identifier — and the only evidence this repository holds that a source
host can disappear, which is the `sourceLoss` gate's worked example.

## Qualified, repeated, language-tagged

Every field is `element.qualifier`. **Four fields repeat in this one record** —
two `dc.date.accessioned`, two `dc.date.available`, two `dc.identifier.uri`, two
`dc.subject.mesh` — so `Record<string, string>` silently keeps the last and
drops the rest.

And there is a per-field **language column**, present on `dc.title`,
`dc.description` and each `dc.subject.mesh`, absent on the author, the dates and
the identifiers. **An absent tag is not `en`** — it is a value whose language
nobody asserted, and flattening the two invents an assertion the source never
made.

## MeSH is a controlled vocabulary, not a keyword

`dc.subject.mesh` = `Publishing`, `Guidelines as Topic`. These are **NLM Medical
Subject Headings**, with their own identifiers and hierarchy at
`https://id.nlm.nih.gov/mesh/`. The practical difference: a MeSH term can be
*resolved*, and it can be *subsumed* — searching "Guidelines as Topic" should
reach narrower terms. A free-text keyword can do neither. `DcValue.authority`
is where that distinction is recorded per value.

## An item is not a file: bundles

The Files section reads **"Original bundle"**, then the bitstream. DSpace groups
bitstreams into bundles — conventionally `ORIGINAL`, plus `TEXT` (extracted),
`THUMBNAIL` and `LICENSE`. So **size and format are per-bitstream**: the 2.68 MB
here is the PDF's, not the item's, and the ~3–4× gap between the file count and
the item count is these.

## Containment is a path, not a parent

The breadcrumb: `Home → 7. Regional Office for the … → Regional Office for the
W… → Information products` — four levels, two of them communities and one a
collection. DSpace also permits an item to be **mapped into several
collections**, so a consumer walking "the" parent of a node is already wrong on
real data. `CatalogueNode.parents` is a list of *paths* for this reason.

## What a later tool needs — as requirements, not prose

Each of these is checkable against a record, which is the point of writing them
this way rather than as advice.

| # | requirement | why, in one line |
|---|---|---|
| **R1** | Resolve by **Handle** where one exists; treat UUID and govdoc as secondary | only the Handle is guaranteed outside WHO |
| **R2** | Never deduplicate `dc.identifier.uri` | the second one is evidence of a host that vanished |
| **R3** | Preserve repetition on **every** field, not a known list | four fields repeat in a single record; assume more do |
| **R4** | Treat an absent `language` as *unasserted*, never as `en` | both states occur in one record |
| **R5** | Carry `dc.subject.mesh` as a **controlled** value with its authority | it can be resolved and subsumed; a keyword cannot |
| **R6** | Model bitstreams per **bundle**, with size and format on the bitstream | an item is not a file |
| **R7** | Model containment as a list of **paths** | four levels deep, and multiple mappings are legal |
| **R8** | Never infer metadata from the PDF when a record exists | OCR off a title page catalogued the WHO Editorial Style Manual as *Abies* |
| **R9** | Record what the source says even when it contradicts the file | `dc.description` says `30 p.`; the PDF has **33** |
| **R10** | An item with no known collection carries `parents: []` — never a guessed one | held-and-unplaceable is a STATE; inventing containment is unfalsifiable |
| **R11** | Key a node by **path** when its UUID is not in the capture | an invented UUID resolves to nothing while looking authoritative |
| **R12** | Keep the **page captured** and the **identifier** apart | `/items/<uuid>/full` is what was fetched; the Handle is what the item IS |
| **R13** | A `materialized` claim must name bytes that EXIST, and something must check it | see `yl5w`: three claims resolved to nothing and the gate said "clean" |
| **R14** | Read a storage figure in the units that round-trip its own bytes | IRIS prints "GB" for what its byte counts make **GiB** — a 7% error |
| **R15** | Never fall back to a parent URL when an item has no upstream URI | "no upstream URI recorded" is the answer; the front page is a lie that resolves |
| **R16** | A partial transcription must SAY it is partial | a truncated abstract that does not declare itself cannot be told from a short one |
| **R17** | Hold what you hold: model the bitstreams whose bytes are here | the handbook lists **8** upstream; this repository has **1** |
| **R18** | Do not "correct" a record that looks wrong | the English-titled editorial manual really does carry an **Italian** ISBN |
| **R19** | A derived figure must round-trip the figure it was derived from | the site total claimed to be `361.55 × 1024³` and rendered as **361.56** |
| **R20** | An item count and a file count are different denominators | 273,559 against 1,057,223 — a fraction built from the wrong one is off by 3.86× |

### R8 has a worked failure, in this repository

`who-pub-tps-931` has no IRIS capture, so its metadata was derived from the PDF.
`structure.json` carries `title: "Abies"` and `authors_raw: "Cpe N"` — OCR noise
off a scanned title page. **A pipeline trusting derived metadata would have
catalogued the WHO Editorial Style Manual as a publication called *Abies*.**

`9789241548960-eng` fails differently and just as usefully: three renderings of
one title (`Handbook forGuideline Development 2nd edition` from joined title
lines, `GRC Handbook - second edition` from PDF docinfo, and the real one), with
no authority among them. That is what an IRIS record settles.

## Covers: an artefact we made, filed where IRIS files its own

The replica's Recent Submissions strip shows a cover beside each item, because
the real page does. **None of them came from IRIS.** Each is page 1 of a PDF
this repository already holds, rasterised by
`cat-harness/scripts/pdf-cover.py` and filed as a `THUMBNAIL`-bundle bitstream
— which is the bundle name DSpace uses for the thumbnails **it** generates.
That collision is the whole hazard: nothing downstream can tell the two apart
from the bundle name, so the node has to say.

`who-iris/scripts/gen-covers.ts` is the instance half. It renders only covers
the **catalogue asks for** — a node declares the `THUMBNAIL` bitstream and
this supplies the bytes, so adding one is a catalogue edit rather than a script
quietly adding files to the repository. And it **refuses** to write bytes for a
`THUMBNAIL` whose `materialization.note` does not declare the derivation:
generating that sentence would make the check circular, since a tool cannot
attest to its own output.

`--check` re-renders and compares bytes, the recorded `sha256` and the recorded
pixel dimensions. That is R13 discharged for the one case this script is
responsible for — the rest of `yl5w` is still open.

### The WHO emblem is on the covers, and that is not the chrome rule

The site chrome carries no WHO mark, per the owner: *"leeav off WHO logo (as
with all who-pages for now, not until published under WHO, just use colors)."*
The **covers do** — the WPRO style guide's cover is the emblem over a blue
field, and both HQ items carry it in print. That is content, not branding: the
instruction is about not dressing *our* page as WHO's, and the same message
that gave it also asked for the covers to be extracted. Reversible in one
place — the `<img>` in `submission()` — without touching the catalogue that
records them.

## Getting a record — and the prediction this section made, which came true

DSpace 7 exposes `/server/api/discover/search/objects`, paged and filterable by
`dsoType`, `scope` and facets; communities are listed at `/community-list`.

**None of that has ever been exercised here.** `iris.who.int` is egress-blocked
from this environment — `curl` returns `CONNECT tunnel failed, response 403`,
the same block bean `r1lz` recorded on 2026-09-19. The API shape above is read
from DSpace's documentation and the site's own navigation, not from a call.

This section used to end by saying two of the three items carried **derived**
records, *"placeholders with honest provenance, to be replaced wholesale when
IRIS is reachable — not records."*

**That is exactly what happened, by a route it did not anticipate.** IRIS is
still unreachable. On 2026-09-20 the owner captured the two full item records
by hand and uploaded them, and both derived records were replaced wholesale.
The lesson is not that the prediction was lucky: it is that *marking a derived
record as derived* is what made the replacement a clean swap instead of an
archaeology exercise. Nothing had to be reconciled, because nothing downstream
had been allowed to believe the placeholder.

Enumeration cost, subsetting and the characterisation that decides whether IRIS
may be cited at all are in
[`large-datasets/sources/who-iris.json`](../../large-datasets/sources/who-iris.json).
