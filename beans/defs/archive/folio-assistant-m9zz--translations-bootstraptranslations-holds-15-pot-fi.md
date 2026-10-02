---
# folio-assistant-m9zz
title: 'TRANSLATIONS: bootstrap/translations/ holds 15 .pot files no declaration mentions'
status: completed
type: bug
priority: normal
created_at: 2026-09-21T23:25:32Z
updated_at: 2026-09-27T06:21:12Z
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

## SUPERSEDED 2026-09-27 — the declaration this bean added has been removed, and that is not a regression

This bean's fix declared `bootstrap-translations` at `bootstrap/translations/`
with graph kind `translation-sources`, and argued three decisions inside it
(a separate id, because overrides match on id; `dependents: "reproduce"`).
Every one of those arguments was right for the question asked.

PR #1448 removes that node. The reason is that the question changed: the 15
`.pot` files are no longer in bootstrap at all. They are at
`cat-harness/translations/<locale>/bootstrap/processes/`, covered by
cat-harness's existing `translations/` declaration, because a declared
directory covers its subtree.

The owner's instruction was ".pot shouldnt be in bootrtrap/ translations but
cat-harness/transslations/bootstrap or so", and the reason it is the better
answer is the one this bean could not see from where it stood: a `.pot` is an
extraction TEMPLATE, written by `translate-bpmn --extract` and consumed by
`msgmerge`. Nobody reads one. bootstrap's promise is that it is a floor an
agent READS, and 20 of its 38 files were tooling output (53%). It is now 5 of
23 (22%).

So this bean declared a directory correctly and the right fix was for the
directory not to exist. Recorded here rather than left for the next agent to
find a removed node and read it as a regression — the three arguments above
still hold for any instance that genuinely owns its own templates.

Follow-on: `qmqg`, for the convention fallback that would have let #1448's
declaration edit pass silently if the files had stayed.
