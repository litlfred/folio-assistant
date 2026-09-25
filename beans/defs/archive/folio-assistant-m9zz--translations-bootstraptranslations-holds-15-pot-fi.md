---
# folio-assistant-m9zz
title: 'TRANSLATIONS: bootstrap/translations/ holds 15 .pot files no declaration mentions'
status: completed
type: bug
priority: normal
created_at: 2026-09-21T23:25:32Z
updated_at: 2026-09-22T07:24:28Z
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

- [x] `bootstrap/translations/` is declared in `bootstrap.json` with graph kind `translation-sources`, `holds` and `renderable` settled as the kind requires
- [x] whatever the declaration owes it (coverage, or a stated exemption with a reason) is decided rather than left blank
- [x] the status page reports both directories, or states in one line that it measures one instance and which — the current page already does the latter, so this is the choice between the two rather than a gap

## Summary of Changes

`bootstrap/bootstrap.json` declares `bootstrap-translations` at
`translations/`, `graphKinds: ["translation-sources"]`, `dependents:
"reproduce"`.

Three decisions in it, none of them free:

**A SEPARATE ID from cat-harness's `translation-sources`.** Overrides match
on id, not on path, so reusing that id would REPLACE cat-harness's graph
with this one rather than add a second directory — the failure mode this
repository has already paid for twice (`bootstrap-roles` and
`bootstrap-processes` each resolved TWICE until their ids were fixed).

**`reproduce`, matching cat-harness's own entry.** A downstream instance
translating this diagram set needs catalogues of its own, not a pointer to
these.

**THE STATUS PAGE STILL MEASURES ONE DIRECTORY, deliberately.**
`gen-translation-status.ts` reads the one directory declared with kind
`translation-sources` at its own instance root, and its subtitle names that
directory. With bootstrap now declaring one too, the page's note — *"a graph
KIND, and more than one instance may declare it; this page measures the one
directory named in the subtitle"* — stopped being hypothetical the moment
this landed. Making it multi-instance is a real change to what the page is
and belongs in its own bean, not smuggled in behind a declaration fix. What
matters here is that the page cannot now be read as covering everything: it
says whose 298 templates those are.

Third done-when is therefore met by the SECOND branch of its own wording —
"or states in one line that it measures one instance and which" — which the
page already did before this bean was picked up.
