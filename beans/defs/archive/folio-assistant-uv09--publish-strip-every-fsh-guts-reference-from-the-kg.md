---
# folio-assistant-uv09
title: 'PUBLISH: strip every fsh-guts reference from the KG before publication'
status: completed
type: bug
priority: high
created_at: 2026-09-19T11:07:31Z
updated_at: 2026-09-19T11:16:30Z
parent: folio-assistant-t0i3
---

Owner, 2026-09-19:

> udpate publish skills. NEVER include fsh-guts, references to fsh-guts
> stripped out of KG before sending to publication.

## Why this is a correction, not a new feature

I declared `fsh-guts/` in `harness.json` as a graph kind earlier today. **The
declaration is itself exported** — an instance's directories become nodes in
`<stub>.jsonld` — so the published knowledge graph currently names the
trashcan, its path and its description.

Excluding the CONTENT from the render pipeline (done, and tested) is not the
same as excluding the REFERENCE from the graph, and I shipped the first while
believing it covered the second.

## The two artefacts, and only one of them is clean

Not a contradiction with the earlier instruction that `fsh-guts.jsonld` be
served: they are different documents.

| artefact | contains fsh-guts? |
|---|---|
| `<base>/fsh-guts.jsonld` | **yes** — it IS the trashcan's graph |
| `<base>/<stub>.jsonld` and everything else published | **no** — stripped |

A consumer that wants the trashcan asks for it by name. A consumer walking
the instance's graph must never arrive there by following an edge.

## Why stripping beats never-declaring

The directory has to be declared locally or no tool can find it, the
never-delete rule has no destination, and the `fsh-guts` graph kind cannot
resolve. So it is declared, and the **publication step** removes it. That
puts the rule at the boundary it is about.

## Done when

- [x] the KG export omits every `fsh-guts` directory entry, its graph-kind
      registration, and any edge pointing into it
- [x] a test asserts the published graph contains no `fsh-guts` substring —
      it FAILED against the unstripped export twice, which is how the skill
      leak was found at all
- [x] the publish skills say it — `kg-export.md`, `prepare-merge.md` and
      `fsh-guts.md`
- [ ] `<base>/fsh-guts.jsonld` still resolves — NOT DONE, the endpoint is
      not wired yet; tracked on the parent `t0i3`

## The trap to write down

A strip that runs only on the happy path is worse than none, because the
graph LOOKS clean and is not. Strip where the document is built, not where
it is uploaded, and let the test read the built artefact.

## Summary of Changes, 2026-09-19

`UNPUBLISHED_GRAPH_KINDS` in `schemas/cat-harness.ts` — one list, read by
every emitter, with `isPublishedGraphKind`, `isPublishedDirectory` and
`isPublishedSkill`.

**THREE emitters leaked, not the two I predicted**, and the third was found
only because the substring test kept failing after the first two were
filtered:

1. the graph-kind node
2. the Directory node — id, path, description — and its `holdsGraph` edge
3. **`skill/fsh-guts`, plus the `declaresSkill` edge from
   `package/folio-core`** — the skill I had written that morning
   documenting the trashcan

The third is right on the merits too: that skill's subject IS where SDLC
churn goes, so publishing it advertises the trashcan to every consumer.

A directory is excluded when ANY graph it holds is excluded, not when all
are — `graphs` is an array and `schemas/` already holds two.

## My own test was vacuous and I nearly shipped it

It read `.graph` where the export uses `@graph`, so it filtered
`undefined`, found nothing and passed — **while two nodes were still
leaking**. Caught by a throwaway probe, not by the test. It now asserts the
node list is non-empty before filtering it, and the failure is written into
the test's own comment.

The lesson is the one this repo keeps re-learning: a guard that cannot fail
reads exactly like a guard that passes.

## An existing invariant had to learn the exclusion

`skill-coverage.test.ts` asserts every resolvable skill is a node in the
export. Correct, and my strip breaks it. Rather than weaken it, it now
excludes unpublished skills AND asserts the exclusion list is exactly
`["fsh-guts"]` — so a later change that stops stripping fails here
instead of passing quietly.

Verified: 2453 tests / 0 fail, eslint 0, tsc 0, kg:audit:check 0,
kg:schema:check 0, readme:audit 0, agent-memory:check 0, check:tools 0,
gen-skill-docs --check 0.
