---
layout: default
title: 'Materializing from arXiv'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/folio-core/archiving-arxiv.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/folio-core/archiving-arxiv.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/folio-core/archiving-arxiv.md){: .fa-edit-source }

{% raw %}
# Materializing from arXiv

arXiv is the easiest case to get *nearly* right, which is why it is worth its
own page: the identifier looks obvious, and the obvious reading of it is
wrong in a way that only shows up later.

## The version suffix is part of the identity

This repository's own queue holds `2602.12670v4.pdf`, `2607.25032v1.pdf` and
`2608.08453v1.pdf`. Those `v` suffixes are **not decoration**.

An arXiv id without a version names *the latest* version, which is a moving
target. A paper can gain a version after you cite it, and then:

- the section you quoted may have moved, been rewritten, or gone
- a numbered result may refer to something else
- the PDF you archived and the PDF a reader fetches are different documents
  with the same name

So: **record the versioned id, always.** `2602.12670v4` is what was read.
`2602.12670` is a question, not an answer. If a source arrived without a
version — because somebody pasted a bare link — the version at capture time is
a fact to resolve and record, not to leave blank.

This is the same discipline [`filing-dublin-core`](filing-dublin-core.md)
states for identifiers generally: the id is the publisher's identity for the
thing, recorded as claimed. Here the claim simply has a component people drop.

## What to keep beside the PDF

The PDF is the rendering. Archiving only the rendering is the web-page mistake
in another costume ([`archiving-web-pages`](archiving-web-pages.md)):

| artefact | why |
|---|---|
| the **versioned id** and the abstract-page URL | the canonical handle, and where the metadata lives |
| the **metadata record** — title, authors, date, categories, abstract | this is the `dcterms` layer, and it is authoritative from arXiv rather than inferred from the PDF |
| the **DOI**, when the submission has one | many arXiv papers are also published; the DOI is a different identity for a possibly different version |
| the **licence** the submission declares | see below — it varies per paper |
| the **e-print source**, where the licence permits | the PDF is typeset output; the source is the document. Re-extraction from source beats OCR of a rendering, every time |

## The licence is per submission, and it is not uniform

arXiv hosting does **not** imply a redistributable licence. Submissions carry
different terms — some permissive, some effectively "you may read this here".
Being able to download a PDF is not permission to republish it inside a folio.

Record the declared licence with the capture. Whether this project may
redistribute a given source is a **person's** decision, and one they can only
make if the licence was written down at intake.

## What must be read, not recalled

**Do not write arXiv API endpoints, query parameters or response field names
from memory into code or into this page.** They are published, they are
stable enough to look up, and a field name that is *almost* right fails in the
worst way: it parses to `undefined`, and a metadata record silently loses its
authors rather than erroring.

The same goes for the id format's own history. arXiv identifiers changed shape
(there is an older scheme with a subject prefix, and a newer numeric one), and
any parser this project writes must be checked against the published
identifier specification rather than against the three examples that happen to
be sitting in `uploads/` today. Three samples agreeing proves nothing about
the fourth.

This is the rule
[`how-much-of-this-does-dublin-core-carry.md`](../../content/docs/document-ingestion/how-much-of-this-does-dublin-core-carry.md)
states for vocabularies, applied to an API: *settled against the published
specifications rather than from memory.*

## Where it lands

A materialized paper is a **queued unit**, not corpus. It arrives in
`uploads/` with its capture record and waits, exactly like anything else —
the badge on the uploads view counts it as waiting until
`library-ingestion` has made an L1 entry from it.

Resisting the temptation to write straight into `library/` matters: the
completeness gate is what decides an entry is finished, and a source that
skipped the queue skipped the gate. The pipeline's own failure edge keeps a
document in `uploads/` and opens a bean rather than landing it half-ingested
and looking finished.
{% endraw %}
