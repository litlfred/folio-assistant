---
input: schemas/skills/latex-authoring/input.schema.json
output: schemas/skills/latex-authoring/output.schema.json
---

# latex-authoring

> Skill id: `latex-authoring` · Package: `authoring-math` ·
> Named by `authoring-a-paper.bpmn` step **9 · Render PDF and HTML**, in the
> `Build pipeline` lane.

Get a paper folio through LaTeX to a PDF, and keep the TeX a folio's own rather
than the platform's.

**Entry point.** `folio-paper-adapter` carries `latex-validation`,
`latex-build-cache`, `build-pdf` and `build-docs`; this says which to reach for
and states the two rules that are easy to break from outside them.

## The document render path takes no TeX — do not confuse the two

There are two render paths in this repo and they are not alternatives:

| path | for | entry |
|---|---|---|
| **LaTeX** | a **paper** folio: math kinds, `.lean` siblings, typeset output | this skill → `build-pdf` |
| **pandoc** | a **document** folio, and any folio being drafted on a machine with no TeX | `document_render_{md,html,pdf}` |

`cat-harness-tools/pipeline/render-markdown.ts` assembles a document folio to one
Markdown file and takes it through pandoc, the PDF via
weasyprint/prince/wkhtmltopdf. **It never falls back to `latexmk`**: a PDF that
silently came out of LaTeX would misreport what the folio needs to build.

So: if you are here because a document folio will not render, you are in the
wrong skill.

## Statements extracted from sources go in an appendix, never in a proof

Step **8 · Publish extracted statements**, just before the render, publishes
every statement the paper extracted from its library sources (core's
`publish-extracted-statements`, `bun run cat statements:pages`), each linked
to its library entry and section. In a paper the page is an appendix of
exposition about the sources. Nothing on it enters a definition, a theorem, a
proof or a Lean sibling: a quoted or measured statement is never a premise of
formal mathematics.

## Preflight before you build

`latex_preflight` is the check that says whether this folio can be typeset at
all — missing packages, missing fonts, an unavailable engine. Run it first.

`latex-validation` is the per-block check; `latex-build-cache` is what keeps a
rebuild from re-running the whole corpus.

## Keep the TeX in the folio

The preamble, the class file, the macros and the bibliography style belong to
the **folio**, not to folio-assistant. This repository is the platform: it
holds the pipeline that runs LaTeX, not one paper's `\newcommand`s.

## "Could not determine" is a real outcome

If no TeX engine is present, the correct report is that the render **was not
attempted** — not that it failed, and certainly not that it produced nothing
because there was nothing to produce. `check-deps` is how you find out what the
environment actually has; the capability is `latex-compiler`.
