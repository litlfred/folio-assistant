---
layout: default
title: 'Archiving a web page'
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-core/archiving-web-pages.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-core/archiving-web-pages.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/skills/folio-core/archiving-web-pages.md){: .fa-edit-source }

{% raw %}
# Archiving a web page

**A URL is not an archive.** It is a request you hope somebody else keeps
answering. Everything below follows from that.

## Two fidelities, and they are evidence of different things

| | **PDF (or image) capture** | **zip / tarball (the page's own bytes)** |
|---|---|---|
| what it preserves | how the page LOOKED, at one moment, to one renderer | what the page WAS — markup, stylesheets, scripts, assets |
| what it is evidence of | appearance and layout | content and structure |
| reads without tooling | yes, anywhere, forever | no; needs unpacking, and often a browser |
| survives the site going dark | yes | yes |
| lets you re-extract text/tables later | badly — through OCR or PDF text, lossy | yes, from the source markup |
| citable as "this is what I saw" | **yes, and this is its job** | weakly — a reader cannot glance at it |

**Neither substitutes for the other**, and the queue in this repository proves
it. `uploads/` holds `Agent Skill best practices - Gemini CLI.pdf` and
`Best Practices - Google Antigravity Docs.pdf` — captured as PDF only. Their
images, stylesheets and any interactive content are simply gone, and no amount
of later work recovers them. The pages may still be live today; that is luck,
not archiving.

So the default is **both**, and dropping one is a decision to be recorded
rather than a default to fall into.

## What the capture has to carry with it

A file with no capture record is an orphan the moment it is renamed. Record,
as [`filing-dublin-core`](filing-dublin-core.md) describes:

- the **URL as requested**, and the final URL if it redirected — those differ
  more often than people expect, and the difference is sometimes the whole
  story
- **when** it was captured, to the timestamp
- **how** — "printed to PDF from a logged-in browser" and "fetched
  unauthenticated" are different documents, and the second is what a reader
  can reproduce
- **what came with it** — the asset list, which is what makes the tarball
  half meaningful
- the **producer** — which tool, which version

The `.extraction.json` sidecars already in `uploads/` carry `container`,
`method`, `capturedAt`, `producer`, `readAt` and `assets[]`. Read one before
inventing a shape.

## Things that are easy to get wrong

**A logged-in capture is not a public document.** If the page was behind a
session, the capture is of *your* view. Say so in the record, or a later
reader will cite it as though anyone could have fetched it.

**Dynamic pages do not capture themselves.** A page assembled by script after
load may print as an empty shell. Check the capture, do not assume it.
"Somebody saved a PDF" and "the content is in that PDF" are different claims.

**Paywalls and licences.** Being able to fetch something is not permission to
redistribute it. Record the licence or the absence of one; an unlicensed
capture may be fine to hold and not fine to publish, and those are separate
decisions made by a person.

**A redirect chain is data.** Shorteners and trackers in the requested URL are
part of how the source was found, and the final URL is what should be cited.

## What is NOT settled here

The **archive format** is not decided by this page. WARC is the standard web
archiving container and is the obvious candidate; a plain zip of a
single-page save is the cheap one. Which this project adopts — and whether a
capture should be replayable rather than merely stored — must be settled
against the published specification and the tooling actually available, not
from memory. That is the same rule
[`filing-dublin-core`](filing-dublin-core.md) states for vocabularies, and for
the same reason: a format asserted from recollection is indistinguishable from
a correct one until something tries to read it.

Until it is settled, capture **both fidelities**, record how, and do not
pretend the question is closed.
{% endraw %}
