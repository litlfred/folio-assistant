---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: 'Materializing from arXiv'
parent: Skill instructions
---

{: .note }
> Generated from [`folio-assistant-core/skills/library/cataloguing/archiving-arxiv.md`](https://github.com/litlfred/folio-assistant/blob/main/folio-assistant-core/skills/library/cataloguing/archiving-arxiv.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/folio-assistant-core/skills/library/cataloguing/archiving-arxiv.md){: .fa-edit-source }

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

### The set a submitter chooses from

The submitter picks one, certifies they may grant it, and **cannot change it
afterwards**. Recorded as a [`source-licence`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/schemas/source-licence.ts)
record — the same one a library manifest carries in `meta.licence` and an
upload carries in `intake.json`, because bean `7bg9` settled that there is one
licence vocabulary rather than one per pipeline.

| as arXiv names it | `id` to record | may a folio redistribute it? |
|---|---|---|
| CC BY 4.0 | `CC-BY-4.0` | yes, with attribution; commercial use allowed |
| CC BY-SA 4.0 | `CC-BY-SA-4.0` | yes, with attribution — **derivatives must carry the same licence** |
| CC BY-NC-SA 4.0 | `CC-BY-NC-SA-4.0` | non-commercially, share-alike |
| CC BY-NC-ND 4.0 | `CC-BY-NC-ND-4.0` | verbatim only, non-commercially — **no derivatives**, so an extracted-and-restructured L1 entry is not covered |
| CC Zero | `CC0-1.0` | yes, unconditionally |
| arXiv.org perpetual, non-exclusive licence 1.0 | `http://arxiv.org/licenses/nonexclusive-distrib/1.0/` | **no.** It licenses *arXiv* to distribute, and limits re-use by anyone else |
| (pre-2004 submissions) | `http://arxiv.org/licenses/assumed-1991-2003/` | **no.** Same effect — see below |

**The last two have no SPDX identifier, and that is the case the schema's
"SPDX where one exists" is written for.** Record the licence URI as the `id`
rather than inventing an SPDX-shaped string: a plausible-looking identifier
that no registry resolves is worse than an honest URI, because it reads as
settled.

The ND row is the one that bites a *folio* specifically. Ingestion derives
structure and restructures prose, and that is exactly what "NoDerivatives"
withholds. A CC BY-NC-ND source can be cited and quoted; it cannot be
re-expressed into content blocks and shipped.

### Four readings that look right and are not

**An arXiv licence is not an open licence.** The row named for arXiv itself is
the most restrictive on the list bar the assumed one. An agent that reads
"arXiv.org perpetual, non-exclusive licence" as "arXiv says it is fine" has
inverted it: the grant runs *to arXiv*, not to the reader.

**Absence is not permission.** Submissions before January 2004 predate explicit
licensing, so arXiv operates on an *assumed* licence equivalent to its own.
That is a determined fact, so the record is `stated` with the assumed-licence
URI and a `basis` naming the submission's date — **not** `unknown`. `unknown`
asserts that somebody looked and could not establish it, and here it is
established. Getting this backwards turns the most restrictive case in the
corpus into the one that looks unexamined.

**The licence belongs to the version, not to the paper.** This is
[the version-suffix rule](#the-version-suffix-is-part-of-the-identity) again,
with teeth: different versions of one submission may carry different licences.
So a licence record is about `2602.12670v4` — the thing archived — and reading
v1's licence off the abstract page while holding v4's PDF is a mismatch no
later gate can detect, because both facts are individually true.

**The metadata field may understate the rights.** An author whose required
licence is not on arXiv's list may select the arXiv licence and state the real
one *on the first page of the article*; publisher permissions land there too.
So the abstract page's licence is where to start, not where to stop — if page
one carries a licence or copyright statement, it is part of the answer, and
the `basis` should say which of the two was read.

### What is always safe

**Article metadata is dedicated to CC0 1.0**, without exception and whatever
the article's own licence. Title, authors, date, categories and abstract can
therefore be recorded and republished even for a source whose full text cannot
be. An entry blocked on redistribution is still an entry that can carry a
complete `dcterms` layer — which is the difference between a catalogued
unavailable source and a gap.

**A recorded arXiv licence does not go stale.** Because the choice is
irrevocable per version, a licence established for a versioned id stays true.
Unlike most captured metadata, it does not need re-checking — the only thing
that can change the answer is archiving a *different version*, which by the
rule above is a different thing to record.

These facts are arXiv's, stated at
<https://info.arxiv.org/help/license/index.html> and
<https://arxiv.org/licenses/assumed-1991-2003/license.html>, and captured in
`uploads/arxiv-license-information/` and
`uploads/arxiv-licence-assumed-1991-2003/`. Read them there rather than from
this table when a decision turns on the wording — the rule this page already
states for API field names applies no less to licence terms.

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
[`how-much-of-this-does-dublin-core-carry.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/content/docs/guides-document-ingestion/how-much-of-this-does-dublin-core-carry.md)
states for vocabularies, applied to an API: *settled against the published
specifications rather than from memory.*

## Where it lands

A materialized paper is a **queued unit**, not corpus. It arrives in
`uploads/` with its capture record and waits, exactly like anything else —
the badge on the uploads view counts it as waiting until
[`l1-document-ingestion`](l1-document-ingestion.md) has made an L1 entry from it.

Resisting the temptation to write straight into `library/` matters: the
completeness gate is what decides an entry is finished, and a source that
skipped the queue skipped the gate. The pipeline's own failure edge keeps a
document in `uploads/` and opens a bean rather than landing it half-ingested
and looking finished.
{% endraw %}
