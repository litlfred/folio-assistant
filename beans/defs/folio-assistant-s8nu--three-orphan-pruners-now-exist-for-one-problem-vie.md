---
# folio-assistant-s8nu
title: Four orphan-selectors now exist for one question — orphanSubjectPages should be the only one
status: todo
type: task
created_at: 2026-09-21T05:33:00Z
updated_at: 2026-09-21T06:05:00Z
parent: folio-assistant-vke6
---


Recorded after `ankg` was fixed on main while this branch was fixing it too —
so the count below is measured against main, not against a plan.

## The four

| selector | where | how it decides |
|---|---|---|
| `prunableStickies` | `ensure-landing-sticky.ts` | the candidate parses as the thing it writes |
| `OWNED` | `who-iris/scripts/gen-iris-pages.ts` (#607) | a regex over FILE NAMES this generator emits |
| `orphanSubjectPages` | `gen-schema-viz.ts`, imported by `gen-library-viz.ts` and `gen-docs-auto.ts` | the page declares itself the subject page for *that very directory* |
| `prunableDashboards` | `state-visualizer.ts` ([#642](https://github.com/litlfred/folio-assistant/pull/642)) | an HTML comment naming the generator |

All four are correct. The multiplicity is the defect, and `y90d` predicted it
in advance — *"do not write a fourth"* — then wrote one, because at that
moment the third was not yet importable.

## They are not interchangeable, and that is the substance

`orphanSubjectPages` is the **strongest** of the four: a marker answers *did I
write this*, while naming the directory answers *did I write this HERE*. It
needs no new bytes in the page, and it already catches a page whose `SCOPE`
names some other subject — a case a marker cannot see at all.

`OWNED` is a different problem, not a weaker answer to the same one: `who-iris`
publishes FLAT FILES rather than subject directories, so there is no directory
name for a page to match. Folding it in means generalising the unit from
"directory holding an `index.html`" to "artefact this generator emits", which
is a real design step rather than a rename.

`prunableDashboards` is the one that genuinely cannot take the self-naming
test: dashboards publish at the SITE ROOT among 19 directories nothing here
owns, and their identity is the graph id rather than the path. A marker is the
right answer *there* — the bean is that it should be a parameter of one
selector, not a fourth selector.

## Done when

- [ ] `orphanSubjectPages` takes the ownership test as a parameter, with the
      self-naming test as its default, so a marker-based one is expressible
- [ ] `prunableDashboards` and `prunableStickies` are call sites of it, with
      their existing tests kept as the falsification — they must still fail on
      directory-selection and on an emptied keep-set
- [ ] a ruling recorded on whether `OWNED`'s flat-file case is in scope, since
      generalising the unit is the expensive half
- [ ] nothing names a fifth

## Not in scope

Changing a marker already committed to a published page. A marker is read off
files that exist; changing it strands every page written before the change,
which is this same defect one level up.

## A correction this bean is the record of

An earlier revision of this bean, and the first draft of
[#647](https://github.com/litlfred/folio-assistant/pull/647), asserted that
`ankg`'s cited precedent did not exist — *"#607 says it built pruning in
`gen-iris-pages.ts`; that file has no such code"*. **That was wrong.** `OWNED`
is at `who-iris/scripts/gen-iris-pages.ts:104` and the prune runs at 1575–1601.

The check was run against a tree that predated #607's merge (`0b312164`), and
"not present in my checkout" was reported as "does not exist". A `git show
origin/main:<path>` would have settled it in one command. Recorded rather than
quietly deleted, because the failure mode — grepping a stale base and
publishing the absence as a finding — is the same class as the `b963`
mis-citations it was accusing.


## Unblocked — 2026-09-21

[#642](https://github.com/litlfred/folio-assistant/pull/642) merged as
`05dfdbef`, so `prunableDashboards` is on main and all four selectors are now
in one tree. The reason this bean was reported rather than done — editing
another session's in-flight file — no longer holds.

One question still goes to the owner before the work starts, and it is the
expensive half rather than a detail: **is `OWNED`'s flat-file case in scope?**
Folding the other three together is a parameterisation. Folding `OWNED` in
means generalising the unit from *directory holding an `index.html`* to
*artefact this generator emits*, which changes the shape of the selector for
every caller, not just for `who-iris`.
