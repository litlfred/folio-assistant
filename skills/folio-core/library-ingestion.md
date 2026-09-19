---
name: library-ingestion
roles: [ingestion-agent, authoring-agent, collaborator, owner]
description: >
  Taking a file from `uploads/` to `library/<bib-slug>/` — which rung to reach
  for and why, what a complete L1 entry holds, and why an inferred structure is
  refused rather than guessed. One entry point: `bun run ingest`.
---

# Library ingestion

`uploads/` and `library/` are two stages of **one** pipeline. `uploads/` is the
incoming queue — raw files as dropped, **not L1 and not greppable as corpus**.
`library/<bib-slug>/` is L1 source content, and every knowledge-graph reference
to a source resolves *through* it.

**Why that distinction bites.** The corpus-grep checklist searches `library/`
only. A file still sitting in `uploads/` does not merely go unread — it makes a
*clean grep* mean "nobody has done this" when the source is right there. That is
how a held result gets re-derived.

## One entry point

```sh
bun run ingest uploads/FILE.pdf          # choose the rung, run it, write the manifest
bun run ingest uploads/FILE.pdf --dry-run # say which rung it would pick, and why
```

It picks the rung, runs it, and writes the manifest. Everything below is what it
decides **on your behalf** — read it when the answer surprises you, not before.

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
- `toc_source: none`, `text_source: text-layer` → `pdf-pages` (`milnorlink`,
  `wpr-rdo-2020-003-eng`)
- `toc_source: none`, `text_source: ocr` → `pdf-ocr` then `pdf-pages --from-ocr`
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
                     granularity, text_source, sections[], structure_note,
                     source{} (see below)
  sections/          one Markdown file per section, front matter + body
  blocks/            the block projection consumers read
  manifest.jsonld    @id, @type folio:SourceDocument, contains[], provenance
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
`mimetype_source`. `pdf-structure` adds `pages`, `text_source` and `extractor`.

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
- `skills/workflows/document-ingestion.bpmn` — the process this sits inside
