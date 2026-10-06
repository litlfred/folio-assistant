---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: 'document-publishing'
parent: Skill instructions
---

{: .note }
> Generated from [`folio-assistant-core/skills/content/folio-document-adapter/document-publishing.md`](https://github.com/litlfred/folio-assistant/blob/main/folio-assistant-core/skills/content/folio-document-adapter/document-publishing.md) — do not edit here. Typed contract: [schema reference](../skills/document-publishing.html).
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/folio-assistant-core/skills/content/folio-document-adapter/document-publishing.md){: .fa-edit-source }

{% raw %}
# document-publishing

Take a document folio from corpus to published artifact — without a TeX
installation.

## The pipeline

```
content/**  →  document_render_md   →  build/<slug>.md
                                    →  document_render_html  →  build/<slug>.html
                                    →  document_render_pdf   →  build/<slug>.pdf
```

One assembly step, then pandoc. `document_render_md` is not an intermediate to
skip past: run it first and read it. It is the only place the whole document
appears in reading order in one file, and ordering problems are invisible
block-by-block.

## Before rendering

Run, in this order, and fix what each reports before moving on:

1. **`content_validate`** — schema, constraints, and profile conformance. A
   document folio that has acquired a math block or a `.lean` sibling fails
   here, which is the point: it fails at authoring time rather than at
   publication.
2. **`qa_sweep`** — the QA axes over each block's sidecar.
3. **`document_render_md`** — read the assembly. Look for: sections that came
   out empty (a block written but never listed in `blocks[]`), blocks in an
   order that does not read, and the `> **Missing block:**` marker, which
   means a section names a root that failed to load.

## PDF without LaTeX

`document_render_pdf` drives pandoc with an HTML engine — `weasyprint`
(recommended), `prince`, or `wkhtmltopdf`. If none is installed it reports
which are missing and stops.

It does **not** fall back to `latexmk`, even on a machine that has it. A
document folio is defined by not requiring TeX to publish, and a PDF that
silently came out of LaTeX would misreport what the folio actually needs — the
next person to build it on a clean machine is the one who pays.

`document_render_html` needs only pandoc, so it works when the PDF path
cannot. When you are drafting rather than publishing, prefer it.

## Styling

Both HTML and PDF accept `css`, a stylesheet path relative to the repo root.
Keep it in the **folio** repo, not here — a house style is content, and the
platform ships no default beyond pandoc's.

The same stylesheet drives both outputs, so a print rule (`@page`, page
breaks, running heads) belongs in it alongside the screen rules rather than in
a second file that drifts.

## A large document loads its text as data

`build-document-site.ts` publishes a document of 200 or more blocks
(`LAZY_THRESHOLD`) as a **shell plus data**, because one page of every block
is too heavy to use: the DPI-H document was 2.3 MB and froze for 200 ms on
load (bean `v433`, owner 2026-10-06: *"dynamic JS load of KG, as should of
rest of content"*).

| file | holds | who reads it |
|---|---|---|
| `<slug>/index.html` | headings, every block anchor, a placeholder per block, [edit]/[feedback] as data, comment-note counts | readers |
| `<slug>/blocks/NNN.json` | each block's rendered HTML, 40 blocks per chunk, in document order | the shell, as the reader nears a block, then the rest in idle time |
| `<slug>/full.html` | the whole document on one page, as before | `file://` opens (fetch fails, so the shell goes there), readers without JavaScript, tools (`block-screenshots.ts`) |
| `<slug>/pc-notes.json` | each block's comment list (a public-comment folio) | a comment note, when opened |

A link to a block (`#prose:…`) or to a term inside one (`#term-…`) loads that
chunk first and lands on it. `--lazy always|never` overrides the threshold.

Two rules for anything that reads the document page:

- **Want the text? Read `full.html` when it exists.** The shell has
  placeholders where the text goes.
- **Find blocks by their anchor** (`<a id="<label>">`). It is on both pages.

Searching the document's comments is the dashboard's job, not the page's
(owner: *"only the visualizer search for the PCs"*).

## What is not implemented

No citations, no bibliography, no glossary, no automatic cross-reference
numbering. `\cite{…}` passes through **verbatim** — visible in the output
rather than silently dropped — so a folio that needs references today should
write them as Markdown links or footnotes.

Cross-references do work: every labelled block emits an HTML anchor, so
`[see the scope statement](#rec:scope)` resolves in both HTML and PDF. Use the
block's `label`, not a heading-derived anchor — the heading anchor changes
whenever the title is edited, which is exactly when the link most needs to
keep working.

## Release

Publication authorisation is the base process's, not this skill's:
`Task_AuthorizeRelease` and `Task_PublishRelease` are non-relaxable in
`draft-to-publication.bpmn` and no content type can opt out of them. Render,
review, then take the release decision through the workflow —
`workflow_next` will tell you what is enabled.
{% endraw %}

## Processes that run this skill

| process | step(s) that name it |
|---|---|
| [Authoring a document](../../processes/authoring-a-document.html) | 7 · Render MD / HTML / PDF |

