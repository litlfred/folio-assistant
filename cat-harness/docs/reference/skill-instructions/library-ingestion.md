---
layout: default
title: Library ingestion
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-core/library-ingestion.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-core/library-ingestion.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/skills/folio-core/library-ingestion.md){: .fa-edit-source }

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
                     granularity, text_source, sections[], structure_note
  sections/          one Markdown file per section, front matter + body
  blocks/            the block projection consumers read
  manifest.jsonld    @id, @type folio:SourceDocument, contains[], provenance
  ocr/               page-NNN.txt, only where the source was scanned
```

`bun run check:l1-complete` is the gate. It reports three states, never two: a
requirement **met**, **unmet**, or **not yet derivable** — the last because the
per-format arms (images, audio, tables, archives, technical metadata) are
tracked separately and a check that cannot run must not read as a pass. Bean
`pn6j`.

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
{% endraw %}
