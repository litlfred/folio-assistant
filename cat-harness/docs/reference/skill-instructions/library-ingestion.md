---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: 'Library ingestion'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/folio-core/library-ingestion.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/folio-core/library-ingestion.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/folio-core/library-ingestion.md){: .fa-edit-source }

{% raw %}
# Library ingestion

`uploads/` and `library/` are two stages of **one** pipeline. `uploads/` is the
incoming queue — raw files as dropped, **not L1 and not greppable as corpus**.
`library/<bib-slug>/` is L1 source content, and every knowledge-graph reference
to a source resolves *through* it.

**Why that distinction bites.** The corpus-grep checklist searches `library/`
only. A file still sitting in `uploads/` does not merely go unread — it makes a
*clean grep* mean "nobody has done this" when the source is right there. That is
how a held result gets re-derived.

## TWO entry points, and this said "one" until 2026-09-20

The owner, that day:

> things can enter library through `uploads/` → `library/` document ingestion or
> through retrieval / materialization of asset known through listed external KG
> in one of the dependent harnesses

Both land L1 content in `library/`. They differ in **where the bytes come from**
and therefore in **what has to be decided first**.

| | **drop** | **materialize** |
|---|---|---|
| the source is | a file somebody put in `uploads/` | an asset listed in a remote graph a dependency declares |
| decided first | which rung reads it | the five gates, and a purpose |
| entry | `bun run ingest uploads/FILE.pdf` | `materialize-remote.bpmn` |
| owned by | this layer — the rungs are here | **`folio-assist-core`** — see below |

**Neither is a shortcut past the other.** A materialized asset still arrives as
bytes that have to be read, so it re-enters the rungs below at exactly the point
a dropped file does. What materialization adds is everything that happens
*before* there is a file: may we hold it, what does holding it cost, for what
purpose, and what happens when the source goes away.

### The layer split, and why it is not arbitrary

The owner, same day: *"some in cat-harness, some in folio-asst-core (and
further down dep tree)"*.

- **This layer (`cat-harness`) owns the rungs.** `pdf-structure`, `pdf-pages`,
  `pdf-ocr`, `pdf-tables` — reading bytes is platform work, and the owner's
  standing instruction is that OCR stays here.
- **`folio-assist-core` owns the remote half**, because `library/` is core's
  graph and so are `materialization.ts` and `library-ref.ts`. A harness that
  cannot hold content must not own the vocabulary for acquiring it.
- **`large-datasets` owns the question before both**: how to enumerate a corpus
  and ask it for a subset (`source-descriptor.ts`). Neither entry point can
  start until something says what is out there.
- **Further down the tree**, a dependency's declared `remoteGraphs` is what
  makes the second path reachable at all: an instance discovers assets through
  a graph it does not hold, and inherits that declaration the same way it
  inherits directories.

## Entry point one — a file in `uploads/`

```sh
bun run ingest uploads/FILE.pdf          # choose the rung, run it, write the manifest
bun run ingest uploads/FILE.pdf --dry-run # say which rung it would pick, and why
```

It picks the rung, runs it, and writes the manifest. Everything below is what it
decides **on your behalf** — read it when the answer surprises you, not before.

## Entry point two — an asset in a remote graph

An instance declares `remoteGraphs` in its declaration: a graph it knows
about and does not hold (`schemas/cat-harness.ts`, `RemoteGraph`). Assets listed
there are `referenced` in exactly the sense
`folio-assistant-core/schemas/materialization.ts` defines — we know they exist
and where, and we hold none of them.

Bringing one here runs `materialize-remote.bpmn` first: **purpose** (`working`
or `archival`), then the five gates, then the fetch. It lands in `library/` with
its provenance and its fixity, and a refusal leaves the node `referenced` rather
than failing.

**A reference is not a fetch.** The KG viewer follows a remote graph to show
the hierarchy without materialising anything, and that separation is the point
of declaring one: navigable without being held.

## Which rung, and why there is more than one

| rung | when | what it produces |
|---|---|---|
| `pdf-structure.py` | the PDF carries an **embedded outline** | real sections, the document's own chapters |
| `pdf-pages.py` | no outline | one section per **page** |
| `pdf-ocr.py` | text extraction yields almost nothing | a text layer to then page-split |
| `pdf-tables.py` | tables or figures matter | what `pdf-structure/v1`'s Section does not carry |

**The decision is mechanical, and the corpus shows all three paths.** Measured
2026-09-19 over the four entries in `library/`:

- `toc_source: outline` → `pdf-structure` (`9789241548960-eng`, 250 sections)
- `toc_source: none`, `source.text_source: embedded` → `pdf-pages` (`milnorlink`,
  `wpr-rdo-2020-003-eng`)
- `toc_source: none`, `source.text_source: ocr` → `pdf-ocr` then `pdf-pages --from-ocr`
  (`who-pub-tps-931`)

## An inferred chapter tree is refused, not guessed

This is the rule most worth understanding, because the failure it prevents is
**silent**.

Without an outline, a heading-detector *can* infer a table of contents — and an
inferred TOC is confidently wrong in a way the output does not show. Two
measured cases, both recorded in bean `6xaz`:

- `WPR-RDO-2020-003-eng.pdf` — 11 of 13 inferred sections were named after a
  **different publication**, because page 22 reproduces a sample table from one
  as a design example.
- `WHO_PUB_TPS_93.1.pdf` — inferred entries took page numbers from the
  *contents* pages, so 26 of 42 sections came out under 500 characters while
  37,923 characters landed in one section misnamed `18-usetul-reference-books`.

So `pdf-pages` claims **no** chapter tree and says so in `structure_note`. **A
page is a determined division; an inferred chapter was not.** Same third-state
rule the rest of this repository keeps: a structure that could not be determined
is never rendered as one that was.

## What a complete L1 entry holds

```
library/<bib-slug>/
  structure.json     "$schema": "pdf-structure/v1" — doc_id, toc_source,
                     granularity, sections[], structure_note,
                     source{} (see below; source.text_source says embedded|ocr)
  sections/          one Markdown file per section, front matter + body
  blocks/            the block projection consumers read
  manifest.jsonld    @id, @type folio:SourceDocument, contains[], provenance
  summaries.json     agent summaries of prose blocks, a QA sidecar (see below)
  ocr/               page-NNN.txt, only where the source was scanned
```

`bun run check:l1-complete` is the gate. It reports three states, never two: a
requirement **met**, **unmet**, or **not yet derivable** — the last because the
per-format arms (images, audio, tables, archives) are tracked separately and a
check that cannot run must not read as a pass. Bean `pn6j`.

## `source{}` — the technical facts, written by whichever rung ran

Every rung writes `source` on `structure.json`, from the single definition in
`scripts/_tech_meta.py`: `file`, full 64-hex `sha256`, `bytes`, `mtime` (the
SOURCE's, UTC to the second — not the ingest time, because what tells you a
re-fetch got something new is the file changing), `mimetype_sniffed` and
`mimetype_source`. Both rungs add `text_source`, `embedded` or `ocr`: ONE field and ONE
vocabulary for where the section text came from (issue #1121; `pdf-pages` used to write a
top-level `text-layer`). `pdf-structure` also adds `pages` and `extractor`.

**The mimetype is sniffed from the leading bytes and never falls back to the
extension.** An extension is a claim by whoever named the file; the magic bytes
are what the content is, and a `.pdf` that is really an HTML error page
extracts to nothing while every downstream verdict is about the wrong document.
Unrecognised bytes give `mimetype_sniffed: null` with `mimetype_source:
"unrecognised"` — the third state again, and it is load-bearing: a guess that
agrees with the filename is indistinguishable from a real sniff, which would
make the field worthless for the one case it exists to catch.

This was a **gap in the no-outline rung**, not a new requirement.
`pdf-structure.py` wrote `source`; `pdf-pages.py` wrote none and merged into
whatever file already existed — so `library/milnorlink/`, the one entry
`pdf-structure` never touched, carried no technical metadata at all, and the
other page-granularity entries had it only because `pdf-structure` ran on them
first. Bean `nso8`.

`bun run scripts/ingest-document.ts <pdf> --refresh-meta` backfills an existing
entry. It **reads the indent off the file** rather than choosing one: the two
rungs write at different widths, and hardcoding either reformats every entry
the other authored — measured at 4 349 changed lines to add three fields.

## `provenance` — who wrote it, and the closed union that makes omission impossible

Every block declares how its text came to be. The vocabulary is
`schemas/attribution.ts`, and it is **closed**:

- the literal `"ingested"` — verbatim source text. There is no author to name;
  the document it came out of is recorded by `source{}` above.
- an `Attribution` — `kind` (`script | agent | human`), `id`, and optionally
  `version`, `model`, `session`, `date`, `skill`.

**An `agent` must name its `model`, structurally.** A narrative is a claim by
somebody, and the difference between "a curator described this figure" and "a
model described it, version X" is exactly what a reader needs in order to weigh
it — and what makes the set re-generatable when that model is superseded. An
agent attribution with no model records that a machine wrote it while losing
the only part anyone can act on, so `AttributionSchema` refuses it.

**The vocabulary is the QA reviewer's, not a second one.** `block-qa.ts`
re-exports `ATTRIBUTION_KINDS` as `QA_REVIEWER_KINDS`; the same three
participants review and author. What is *not* shared is `QaReviewer` itself,
most of which is about whether a criterion's cached verdict is stale.

### What the gate can and cannot enforce

`check:l1-complete` checks two things per block, and the second is the point:

1. `provenance` parses as a `Provenance`. An open string, a malformed
   attribution, an `agent` with no `model` — all `unmet`.
2. A block of an **authored** kind must not claim `"ingested"`.

`LIBRARY_BLOCK_ORIGIN` classifies each library block kind as `extracted` or
`authored`, and a test asserts it is **total over what actually occurs in
`library/`** — so a narrative arm cannot land a new kind without classifying
it, and classifying one `authored` arms requirement 2 immediately.

Closing the union does not stop an arm asserting something false. It makes the
**omission** impossible: a new arm has to choose, and choosing `"ingested"` for
a generated description is a false statement rather than a missing field.

**Today every one of the 424 blocks is extracted prose**, so the narrative count
is a real, reported zero — never silence. The authored branch is proved to fire
by fixtures in `scripts/tests/attribution.test.ts`, not by the corpus: a checker
that returned "fine" unconditionally would pass the corpus just as well. Each of
the three branches is mutation-checked — removing it fails a named test. Bean
`iqim`.

## Archives — the entry list is data, and the rung is chosen by CONTENT

A tar or zip in `uploads/` is opaque to every grep in the corpus: a search for
a filename inside one finds nothing, and that absence is indistinguishable from
the file not being there. `scripts/archive-contents.py` writes
`library/<slug>/contents.jsonld` — **one schema whatever the container**
(`schemas/archive-contents.ts`), so a consumer reads archives without knowing
whether it was tar or zip.

Per entry: `path`, `bytes`, `sha256`, `mtime`, `mimetype_sniffed`,
`mimetype_source` — the `source{}` vocabulary above, reused verbatim, because
**an archive entry is not a different kind of thing from a loose file**. The
mimetype is sniffed from the entry's own leading bytes, never from its name,
for the same reason it is outside an archive.

Four entry states, not two: a `directory` carries no size and no digest (a zero
would be a measurement nobody made); an unreadable member is
`mimetype_source: "unreadable"`, which is not an empty file; a `symlink` or
`special` is listed with its kind rather than dropped. Dropping directories
would make an archive of empty ones indistinguishable from an empty archive.
A file the sniffer does not recognise as an archive is **refused** — an empty
`entries[]` would read as an empty archive, a different fact.

### The rung is chosen before anything opens the file as a PDF

`planFor` sniffs first. Handing it a zip used to answer `undetermined` with
`why: "no PDF backend: No module named 'fitz'"` — the **refusal was right and
the diagnosis was wrong**: it reported a missing tool when the fact was that
the file is not a PDF, and a reader would go install PyMuPDF and fail again.
A file *named* `.pdf` that is really a zip now takes the archive rung, which is
the case only a sniff can decide.

### What the gate checks, and the determined zero

Which entries the requirement applies to is **derived, not guessed**: `source.
mimetype_sniffed` is already on every entry, so "this came from a zip" is a
recorded fact. An archive entry must carry a `contents.jsonld` that validates
against the declared schema.

`uploads/` holds four PDFs and **no archives**, so every entry reports
`not an archive (application/pdf)` — said out loud rather than passed in
silence, because "nothing to check here" and "the check never ran" are
different facts. The requirement is proved to fire by fixture archives built in
`scripts/tests/archive-contents.test.ts`, and each of its four branches is
mutation-checked. Bean `twqe`.

## Datasets — findable by their headers, and the narrative nobody wrote

`scripts/tabular-records.py` writes `library/<slug>/tabular.jsonld`: sheet
names, the header row, and the shape of each sheet. `header_vocabulary` is the
union across sheets, and it is the field a `grep` for a column name lands in —
without it a dataset is stored but not findable, and a failed search is
indistinguishable from the dataset not having that column.

**The record is real JSON-LD, and so is `contents.jsonld`** (bean `yh6u`).
Both used to be named `.jsonld` with an `@id` and no `@context`, so a JSON-LD
processor dropped every key they wrote. Both arms now emit the published
content context (the URL lives once, in `scripts/_content_context.py`, pinned
to `CONTENT_CONTEXT_URL` by a test), and every key is a declared term. The
facts a consumer queries across documents — `format`, the counts,
`header_vocabulary` — are real terms; the nested structures that are ours —
`sheets`, `entries`, the technical metadata, the `narrative` — are `@json`
literals, **because that is how their nulls survive**: `rows: null` means
"could not be counted" and `narrative.text: null` means "nobody has written
one", and JSON-LD drops a null anywhere else. Records written before this
carry no `@context`; the schemas accept that, since folio repositories hold
them.

**Stdlib only** (`zipfile` + `xml.etree`, `csv`). This repository declares no
Python dependencies — no `requirements.txt`, and CI installs only `ruff` — so a
tool needing openpyxl would pass locally and fail there. Everything this arm
needs is in `xl/workbook.xml` and each sheet's `<dimension>`. Verified by
reading back a workbook openpyxl itself wrote, **with openpyxl uninstalled**.

### The narrative is a state machine — drafted by an agent, confirmed by a person

`schemas/narrative.ts`: `not-authored` → `draft` → `confirmed`, with `rejected`
as a real fourth state. The owner chose this (2026-09-19) over plain agent
attribution and over writing every narrative by hand.

**Two attributions, because they are two acts.** `drafted_by` is who wrote the
words; `confirmed_by` is who accepted them. The question a reader most wants
answered is not "did a machine touch this" but "has a person agreed to it".

**An agent cannot confirm its own draft** — `confirmed_by.kind` must be
`"human"`, structurally. That one refinement is the entire difference between
the chosen design and the one it replaced: without it, `confirmed` degrades
into "an agent said so twice".

**But a rule about who may act cannot be enforced by a rule about what is
written.** Driving the CLI in an agent container wrote
`"rejected_by": {"kind": "human", "id": "Claude"}` — `git config user.name` is
the agent's, so it recorded *itself* as the reviewer, and the schema could not
see it. `reviewer()` therefore refuses outside a terminal: a person confirming
at a prompt has one, an agent's subprocess and CI do not. **This stops accident,
not fraud** — an agent that set out to forge a confirmation could allocate a pty
— but it makes it impossible to confirm a narrative *while going about other
work*, which is the failure that would actually have happened.

**`rejected` keeps its reasons.** A rejected draft silently re-offered wastes
the reviewer's time; one that vanishes lets the next agent redraft the identical
thing — the argument `scrapped` wins on for beans, and the one
`qa-review.ts`'s `Decision` makes by requiring a note saying why this outcome
and not another.

### Reviewing: `bun run narratives`

Numbered list, numbered reasons, because the owner has very limited hand
function and a review step that demands a typed sentence is one that will not
happen — at which point `confirmed` means "nobody got round to objecting",
which is worse than not having the state.

```sh
bun run narratives                     # what is waiting on you
bun run narratives:confirm 1
bun run narratives:reject 1 --why 2    # or --why-text "..."
```

`check:l1-complete`'s `narrative-review` validates every narrative-bearing file.
A `draft` is **reported, not failed**: it is work waiting on a person, and
failing it would make an unreviewed queue indistinguishable from a broken arm.

A null `rows`/`columns` is likewise not an empty sheet: `shape_source` says
whether the shape was read, counted, or `undetermined`.

### Summarising prose blocks — a QA sidecar, drained slowly

Owner, 2026-09-24: *"on library/ page, the extract of a node is shown, but no
agentic summary"*, and on scope: *"Make as QA sidecar as part of general doc
ingestion to slowly drain."*

**The block stays verbatim.** A prose block is the source's text,
`provenance: "ingested"`, and re-ingestion regenerates it. A summary is an
agent's account of that text, so it lives beside the blocks in
`library/<slug>/summaries.json` (`folio-block-summaries/v1`,
`schemas/block-summary.ts`): one record per block, holding `block`, `source`
(the section file), `source_hash` and a `narrative`. That narrative is the
state machine above, not a second one: `draft`, `confirmed` by a person only,
`rejected` with a reason, and an agent author must name its model.

**`source_hash` makes a changed source read as STALE.** It is the sha256 of
the section text the summariser was shown (`proseBody`). Re-ingest a document
and any section whose text moved puts its summary back in the queue, marked
stale. `bun run narratives` shows it and refuses to confirm it.

**The queue is derived, so nothing enqueues.** Every prose block in every
declared library is in it until it has a current draft or confirmation. A
rejected draft is back in it, and its rejection reason travels with it.

```sh
bun run summaries                                   # the backlog, per entry
bun run summaries:next -- --n 5 [--entry <slug>]    # next K blocks WITH their text, as JSON
bun run summaries:record -- drafts.json             # write drafts; validated, all or nothing
```

`drafts.json` is `{drafted_by: {kind: "agent", id, model, session}, drafted_at,
drafts: [{block, source_hash, text}]}`, with `source_hash` echoed from
`summaries:next`. `record` refuses a state other than `draft`, a hash that no
longer matches, and a block that already has a current summary.

**Drain K at a time during ingestion work**, not all at once: a thousand
unreviewed drafts at once is a buried reviewer. Write 1–3 sentences in your
own words, from the block's text only, adding nothing from outside it. If the
extraction put the wrong text under a heading, summarise what is there and say
so. The backlog is reported by `check:l1-complete` (`block-summaries`) and on
the library page. It is advisory, never a gate. What the gate does fail is a
sidecar that does not parse, names another entry, or holds a record for a block
or source that is not there.

### Describing a document's images — and why it is an ARM, not a step you run

`pdf-images.py` classifies by geometry, which answers exactly one question: is
this image the whole page, or something on it. It cannot tell a logo from a
chart. The finer roles come from LOOKING, and that judgement is **data** —
`<library>/image-verdicts.json`, one entry per image, reviewable line by line.

```sh
bun run ingest uploads/FILE.pdf --library <lib>   # stage; reports what is unmet
# look at ingest-staging/<doc-id>/images/, write the verdicts into
# <lib>/image-verdicts.json, then:
bun run ingest uploads/FILE.pdf --library <lib>   # re-stage: the arm applies them
bun run ingest uploads/FILE.pdf --library <lib> --promote
```

**Re-running `ingest` is the second step, not a separate apply command**, and
that is the whole design rather than a convenience. Bean `8suc`:

- `--promote` refuses an entry whose `image-descriptions` requirement is unmet;
- both writers of a narrative — `apply-image-verdicts.ts` and `narratives.ts` —
  resolved their targets through `directoriesForGraph(root, "library")`.

So a document with describable images could not be promoted without
descriptions, and could not be given descriptions without being promoted. A
cycle, and every staged document sat in it. It went unnoticed because every
entry carrying applied verdicts predated the gate, so the tool always found
it — the path that fails was the one nothing had walked.

**Applying by hand works exactly once.** `pdf-images.py` opens the sidecar with
`"w"` — no existence check, no merge — so the next `ingest` overwrites the
descriptions, and overwrites them *quietly*: the file still parses and still
validates, it simply has no narratives in it any more. Running the application
as the fourth arm, **after** `pdf-images.py`, makes a re-run RE-APPLY instead —
the sidecar is rebuilt from the PDF and the committed judgement is laid back
over it.

`--staging <entry-dir> --library <lib-dir>` is available directly if you need
it, and `--library` is **required**: a staging directory does not say which
library a document is being promoted into (`v1hw` — a queue does not determine
a library). An absent verdicts file exits **0**, because the first ingest
necessarily runs before anybody has looked at the images; `image-descriptions`
is the gate that refuses, not that script. An *orphaned* verdict — one naming
an image the sidecar does not have — still fails, in either mode.

Every narrative it writes lands as `draft`. Only a person confirms one.

#### Reading a figure: the text layer is not the figure

Two findings from `xeg6`, both of which would have shipped as descriptions:

**A diverging axis's SIGN cannot be read from the text layer.** `get_text`
returned `0.2 0.4 0.6` below the zero of a `Delta Pass Rate` bar with **no
sign at any codepoint** — matplotlib draws U+2212 as a vector path, so the
minus exists in the rendering and not in the text. Rendering the region showed
`-0.2 -0.4 -0.6` plainly. A verdict trusting the extraction would have called
a `-0.6` endpoint `+0.6`.

**And the direction is a fact about the axis, not about the colours.** The
recorded inspection said a bar ran *"blue low to red high"*. Its ticks said
`Pass Rate`, `1.0` at the top in dark blue: blue was HIGH. A reader given the
original sentence reads every heatmap in the paper inverted — **worse than no
description**, because a missing one is visibly missing.

So: render the region and read the ticks. Two images that look alike need the
same check each — the same record called three bars one repeated legend when
the third was a different, signed scale, and it had the disconfirming datum
(5188 bytes against 5167 twice) already written down beside the claim.

### The figure that is DRAWN — `pdf-vector-labels.py`, the other arm

`pdf-images.py` answers "what does this page PLACE". A WHO conceptual figure —
a framework, a maturity model, a taxonomy, a process flow — is drawn in path
operators and text, so it places nothing, and the raster arm is silent about
it truthfully. `9789240120747-eng` declares six captioned figures, places zero
images, and `image-descriptions` reported *"0 image(s), 0 describable and all
described"* over it: **a determined empty that is true about raster and
misleading about figures.** Bean `m4xy`.

The vector arm (bean `a8wy`) runs beside the raster one in `withDerivedArms`
and writes `vector-labels.json` — every positioned text line on a page that
declares a figure, with its rectangle in the visible frame, its fonts and
sizes, and whether it intersects a drawing.

**Read the sidecar, not a count.** Three things it deliberately does not do,
each because the obvious version of it was tried and failed on a real page:

- **It does not say which labels belong to the figure.** `intersectsDrawing`
  is recorded and never filtered on. On `9789240120747-eng` page 34 it
  separates perfectly; on `9789240010567-eng` page 25 it is false for thirty
  labels that are plainly figure content, because they sit in the white space
  *between* the drawn boxes.
- **It does not group above the MuPDF LINE.** A block on that same page holds
  six circled numerals 200 pt apart across three different diagrams.
- **It does not compare its counts to anything.** `m4xy`'s rule: declared
  figures and recovered labels are not commensurable.

So when you describe such a figure, the labels are your evidence and the
grouping is your judgement — which is the same split as
`image-verdicts.json`, one level over. The rule from the section above holds
here with more force, not less: **render the page and look at it.** The arm
recovers what the text layer says; it cannot tell you that the arrows run
clockwise.

The determined empty is still meaningful: `who-rhr-1806-eng` records zero
pages because it contains no `Fig.` or `Figure` mention at all. A document with
**no text layer** returns `pages: null` with a reason instead — the one place
this arm could otherwise report a clean run over an unread scan (`dh4f`).

### An `.xlsx` IS a zip, and that broke the archive routing

The magic bytes of an OOXML or ODF document say `application/zip`, which is
true and useless: it sent every spreadsheet to the archive rung to be listed as
a bag of XML parts. The magic cannot tell them apart, so
`_tech_meta.sniff_zip_package` asks the **container**, which declares itself —
OOXML by `[Content_Types].xml` plus the part names, ODF by its `mimetype`
member. Same principle as the byte sniff, one level in.

`sniff_effective_mimetype` is the single answer the router and the recorder
both ask. They disagreed for one commit — `planFor` called the magic-only
function, so an `.xlsx` routed as an archive while its own `source` block
correctly called it a workbook.

**A CSV has no magic bytes at all**, so routing one cannot be a sniff and must
not become an extension guess. `is_tabular_text` asks the only content question
available: do the first rows split into the *same* number of fields, more than
one? Prose, a single column and anything ragged all answer no — a one-column
"table" is indistinguishable from a list of lines.

Proved on fixtures built at test time, all five branches mutation-checked.
Bean `p67i`.

## Ingestion is a HARNESS capability, not core's

`uploads` and `library` are both graph kinds declared by the **harness** layer;
`folio` — authored content — is `folio-assist-core`'s. So this skill and its
tooling belong with the harness.

Putting ingestion in core would make the harness's own `library` graph writable
only from a layer above it: a wrong-direction dependency, and after the split
(issue #223) a circular one between repositories. That is exactly what bean
`zlmp` exists to drain.

## Related

- [`directory-conventions`](directory-conventions.md) — the graph kinds and who declares them
- [`bib-qa`](bib-qa.md) — auditing what is already in `library/`
- `processes/document-ingestion.bpmn` — the process this sits inside
{% endraw %}

## Processes that run this skill

| process | step(s) that name it |
|---|---|
| [Content acquisition](../../processes/content-acquisition.html) | Route it, and watch the queue |
| [Document ingestion — uploads/ to the L1 source knowledge graph](../../processes/document-ingestion.html) | Prose blocks enter the summary queue |

