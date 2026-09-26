---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: 'Filing a source: what Dublin Core carries, and what it does not'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/folio-core/filing-dublin-core.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/folio-core/filing-dublin-core.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/folio-core/filing-dublin-core.md){: .fa-edit-source }

{% raw %}
# Filing a source: what Dublin Core carries, and what it does not

This is the **librarian's** half of intake, not the ingestion engine's. A file
lands in `uploads/`; describing *what it is* is filing, and deriving structure
from it is `library-ingestion`. Keeping those apart is why `uploads/` and
`library/` are two stages rather than one directory
([`uploads-and-library-are-two-stages-of-one-pipeline`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/content/docs/document-ingestion/uploads-and-library-are-two-stages-of-one-pipeline.md)).

## The line, and it is drawn by the vocabulary

`content/docs/document-ingestion/how-much-of-this-does-dublin-core-carry.md`
settles this and is the source of truth; the summary is:

**Dublin Core covers the bibliographic layer well** — `dcterms:title`,
`creator`, `date`, `language`, `identifier`, `hasPart`, `format`, `extent`. A
per-folder record and an archive's part/whole structure sit comfortably there.

**It does not cover the derived layer.** A narrative description of a figure, a
transcript, a back-translation confidence, a sheet's column headers, and above
all the **provenance of a generated narrative** are not `dcterms` terms.

The house rule is `schemas/jsonld.ts`'s, and it is the whole discipline in one
line:

> **generalising is sound; inventing is not.**

Where an existing vocabulary has the term, use it. Where it does not, the term
goes in this project's own namespace rather than being bent into an
approximate `dcterms` one. An approximate mapping is worse than a local term,
because it publishes a claim in somebody else's vocabulary that their
consumers will read by their definition and not yours.

## What is NOT decided, and must not be decided from memory

**Which vocabulary to reach for beyond Dublin Core is an open question.**
PROV-O is the obvious candidate for provenance and that is as far as the
record goes. The doc above says it plainly:

> … is **not yet decided** and must be settled against the published
> specifications rather than from memory.

So: do not mint a `prov:` term because it sounds right. Read the published
specification, or leave the fact in this project's namespace and say why. A
term invented from recollection is indistinguishable from a correct one until
somebody else's tool consumes it.

The same applies to Dublin Core itself. `dcterms` has element refinements and
range constraints this page does not restate; if you are about to use a term
not in the list above, read the DCMI specification rather than inferring it
from the name.

## What to record at INTAKE, and what waits

At intake you know how the thing arrived. That is exactly what nobody can
reconstruct later, so it is what filing must capture:

| fact | why it cannot wait |
|---|---|
| where it came from — the URL, the query, the person | a file in a queue has no origin written on it |
| when it was captured | the web changes; "now" is not recoverable next week |
| how it was captured | a PDF print and a crawl are different artefacts (see [`archiving-web-pages`](archiving-web-pages.md)) |
| what came with it | assets, sidecars, the parts of a multi-file capture |
| the identifier the source claims for itself | a DOI or an arXiv id is the publisher's identity, not ours |

The `.extraction.json` sidecars already in `uploads/` model most of this —
`container`, `method`, `capturedAt`, `producer`, `readAt`, `assets[]`. Read one
before designing a new shape.

Everything else — sections, structure, OCR, derived narrative — is the
ingestion engine's and is recorded in `library/<bib-slug>/`.

## A sidecar is not a document

`<source>.extraction.json` describes the capture of `<source>`. It is
metadata about a queued unit, not a queued unit. Counting it as one inflated
this instance's own queue badge from 20 to 27 until 2026-09-22 (issue #836),
and the same error one level along would have counted an intake's four
declared files as four documents.

The rule generalises: **a file that describes another file in the same queue
is not itself waiting to be ingested.** An *orphan* sidecar — one whose source
has gone — is a different thing and must stay visible, because a file nothing
accounts for is exactly what a queue view exists to surface.

## Identifiers are claimed, not assigned by us

A DOI, an ISBN, an arXiv id and a WHO publication number are the *publisher's*
identity for the thing. Record them as `dcterms:identifier` values with their
scheme; do not normalise them into one string, and do not treat the absence of
one as a defect. A working paper legitimately has none.

The slug under `library/` is **ours** and is a different kind of name: it is
how this corpus addresses the item, and every knowledge-graph reference
resolves through it. Do not derive one from the other silently — the mapping
is a fact worth recording, not a transformation worth repeating.
{% endraw %}
