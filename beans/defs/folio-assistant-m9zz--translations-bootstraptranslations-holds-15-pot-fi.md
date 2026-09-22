---
# folio-assistant-m9zz
title: 'TRANSLATIONS: bootstrap/translations/ holds 15 .pot files no declaration mentions'
status: todo
type: bug
priority: normal
created_at: 2026-09-21T23:25:32Z
updated_at: 2026-09-21T23:25:32Z
parent: folio-assistant-bzyu
---

Found 2026-09-21 while merging `main` into the `lnur` branch. `j28g` moved the
workflow templates for diagrams cat-harness does not own out of
`cat-harness/translations/` and into `bootstrap/translations/` — correctly, the
templates now sit beside the instance that owns the diagrams. The half that did
not move is the DECLARATION.

## The finding

`bootstrap/bootstrap.json` declares four directories — `skills/`,
`skills/roles/`, `workflows/`, `render/` — and none of them is
`translations/`. On disk:

    find bootstrap/translations -name '*.pot' | wc -l   ->   15

Fifteen committed templates, in five locales, that no declaration mentions.
That is `dh4f` exactly: a consumer scans the declared set, finds nothing, and
reports a clean run over a directory it never looked at.

## What it costs, measured

The `lnur` status page reads the ONE directory declared with graph kind
`translation-sources` and says so in its subtitle. Before the move it measured
318 templates; after, 298. The twenty that left are not reported anywhere,
because the place they went is not declared — so the effect of a correct move
is a corpus that got smaller with nothing to say where the difference went.

## Done when

- [ ] `bootstrap/translations/` is declared in `bootstrap.json` with graph kind `translation-sources`, `holds` and `renderable` settled as the kind requires
- [ ] whatever the declaration owes it (coverage, or a stated exemption with a reason) is decided rather than left blank
- [ ] the status page reports both directories, or states in one line that it measures one instance and which — the current page already does the latter, so this is the choice between the two rather than a gap
