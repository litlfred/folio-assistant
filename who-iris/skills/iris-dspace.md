---
name: iris-dspace
description: >
  How WHO IRIS uses DSpace and qualified Dublin Core — the three identifier
  systems, MeSH as a controlled vocabulary, bundles, and the containment path.
  What a later tool needs from a record, stated as requirements it can be
  checked against.
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

| | |
|---|---|
| files | **1,057,223** |
| storage | **361.55 GB** |
| top-level communities | **8** |

**That is a FILE count, not an item count.** An item carries several bitstreams
(below), so the item count is smaller and IRIS does not publish it. Any
denominator built from this **overstates**, which is the safe direction for a
size gate and the wrong direction for a completeness claim.

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
| **R8** | Never infer metadata from the PDF when a record exists | see below |
| **R9** | Record what the source says even when it contradicts the file | `dc.description` says `30 p.`; the PDF has **33** |

### R8 has a worked failure, in this repository

`who-pub-tps-931` has no IRIS capture, so its metadata was derived from the PDF.
`structure.json` carries `title: "Abies"` and `authors_raw: "Cpe N"` — OCR noise
off a scanned title page. **A pipeline trusting derived metadata would have
catalogued the WHO Editorial Style Manual as a publication called *Abies*.**

`9789241548960-eng` fails differently and just as usefully: three renderings of
one title (`Handbook forGuideline Development 2nd edition` from joined title
lines, `GRC Handbook - second edition` from PDF docinfo, and the real one), with
no authority among them. That is what an IRIS record settles.

## Getting a record, and why there isn't one for two of three

DSpace 7 exposes `/server/api/discover/search/objects`, paged and filterable by
`dsoType`, `scope` and facets; communities are listed at `/community-list`.

**None of that was exercised here.** `iris.who.int` is egress-blocked from this
environment — `curl` returns `CONNECT tunnel failed, response 403`, the same
block bean `r1lz` recorded on 2026-09-19. So the API shape above is read from
DSpace's documentation and the site's own navigation, and two of the three items
carry **derived** records marked as such. They are placeholders with honest
provenance, to be replaced wholesale when IRIS is reachable — not records.

Enumeration cost, subsetting and the characterisation that decides whether IRIS
may be cited at all are in
[`large-datasets/sources/who-iris.json`](../../large-datasets/sources/who-iris.json).
