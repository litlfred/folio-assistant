---
layout: default
title: 'latex-authoring'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/authoring-math/latex-authoring.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/authoring-math/latex-authoring.md) — do not edit here. Typed contract: [schema reference](../skills/latex-authoring.html).
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/authoring-math/latex-authoring.md){: .fa-edit-source }

{% raw %}
# latex-authoring

> Skill id: `latex-authoring` · Package: `authoring-math` ·
> Named by `authoring-a-paper.bpmn` step **7 · Render PDF / HTML**, in the
> `Build pipeline — validate · render · publish` lane.

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

`content/pipeline/render-markdown.ts` assembles a document folio to one
Markdown file and takes it through pandoc, the PDF via
weasyprint/prince/wkhtmltopdf. **It never falls back to `latexmk`, and that is
deliberate**: a PDF that silently came out of LaTeX misreports what the folio
needs in order to build, and the next person on a clean machine pays for it.

So: if you are here because a document folio will not render, you are in the
wrong skill.

## Preflight before you build

`latex_preflight` is the check that says whether this folio can be typeset at
all — missing packages, missing fonts, an unavailable engine. Run it first.
A build that fails on a missing package after twenty minutes of compilation has
told you something preflight would have said immediately.

`latex-validation` is the per-block check; `latex-build-cache` is what keeps a
rebuild from re-running the whole corpus.

## Keep the TeX in the folio

The preamble, the class file, the macros and the bibliography style belong to
the **folio**, not to folio-assistant. This repository is the platform: it
holds the pipeline that runs LaTeX, not one paper's `\newcommand`s.

This has been paid for once already, in the README generator that carried one
folio's title, badges and directory layout inside a platform script and so
could not run anywhere else. A macro that only one paper uses, living here,
is the same defect in a different file.

## "Could not determine" is a real outcome

If no TeX engine is present, the correct report is that the render **was not
attempted** — not that it failed, and certainly not that it produced nothing
because there was nothing to produce. `check-deps` is how you find out what the
environment actually has; the capability is `latex-compiler`.
{% endraw %}

## Processes that run this skill

| process | step(s) that name it |
|---|---|
| [Authoring a paper](../../processes/authoring-a-paper.html) | 7 · Render PDF / HTML |

