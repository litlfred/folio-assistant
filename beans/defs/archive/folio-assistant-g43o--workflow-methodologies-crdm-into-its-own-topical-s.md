---
# folio-assistant-g43o
title: 'WORKFLOW METHODOLOGIES: CRDM into its own topical subgraph'
status: completed
type: task
created_at: 2026-09-20T12:08:32Z
updated_at: 2026-09-20T12:08:32Z
parent: folio-assistant-ahvw
---

Owner, 2026-09-20: *"RACI, CRDM, SDLC, MADR and other methodologies should
be in own topical subgraphs under workflow... so i think its
cat-harness/workflow-methodologies/CRDM. cat-harness/workflow-methodologies/RACI
etc. as these should really be in the core of cat-harness, easier to move
later if it bloats."*

## Done first, on its own, because a relocation is its own change

`#395`'s rule and bean `auap`'s precedent. RACI is built in the new home
next; moving CRDM and inventing RACI in one diff would make neither
reviewable.

## What moved

| from | to |
|---|---|
| `skills/folio-core/crdm-{detect,requirements-workflow,data-model}.md` | `methodologies/crdm/` |
| `processes/crdm-*.bpmn` (8) | `methodologies/crdm/processes/` |

A `package-manifest.json` for the package, and `folio-core`'s manifest
drops the three: 106 → 103.

## The layout this is, and why it cost one declaration line

**`skillMdDirs`'s own comment names `crdm` as the example.** Verbatim:
*"This is what lets a topical directory (`bootstrap/`, `crdm/`, …) cost a
declaration line and no code change."* `bootstrap/skills/` was the first
such root; this is the second. Nothing in the discovery path changed —
`kgDirectories` and `workflowDirs` picked both up from `harness.json`.

**Each methodology is declared SEPARATELY, not the parent.**
`workflowDirs` resolves `<kgdir>/workflows`, so declaring only
`methodologies/` would leave every diagram undiscovered — it
would look for `workflow-methodologies/workflows/`, which does not exist.

**SDLC and MADR are NOT declared yet.** They have no content, and a
declared-but-absent directory is the `dh4f` defect: every consumer scans
nothing and reports a clean run over it.

## Three things the corpus caught, all the same shape

Each was a **hardcoded path where a declaration was available** — and the
third is the interesting one because the refusal was designed in.

1. `scripts/tests/log-writer.test.ts` composed
   `../../processes/crdm-requirements.bpmn` and went ENOENT, which
   the test reported as *"the process does not declare folio:log"* — the
   wrong finding entirely. Now located through `workflowFiles`, with the
   lookup asserted so a missing diagram cannot read as a missing
   declaration.
2. `todos.test.ts`'s published-hierarchy order needed regenerating; its
   own comment had already warned *"this is the second hardcoded path in a
   test to break today"* and noted `check:declared-paths` skips
   `*.test.ts`. That exemption is now worth revisiting — see below.
3. **`gen-skill-docs.ts` REFUSED to publish the new package**, naming it,
   rather than guessing a heading. That is the behaviour its own comment
   demands — *"a package is not published under a guessed heading — that
   is how twelve skills went unpublished unnoticed"* — and it is why my
   earlier silent runs of the generator had been doing nothing. Keyed on
   the DECLARATION's id, since a root holding skills directly takes the
   `SKILLS_CATEGORIES[decl.id]` branch; keyed on the basename it threw,
   naming the id it wanted.

## Carried, not fixed

`check:declared-paths` skips `*.test.ts`, and two tests broke here for
exactly the reason it exists. Worth its own bean rather than a drive-by
widening: the exemption presumably has a reason, and finding out is the
work.

## Done when

- [x] `methodologies/crdm/` declared and discovered with no code
      change to the discovery path
- [x] skills and diagrams moved together; manifests updated both sides
- [x] every reference rewritten; generated artefacts regenerated
- [x] 52/52 gates
- [ ] RACI built in the new home (bean `7o7i`)
- [ ] SDLC, MADR — declared only when they have content


---

## Corrected mid-flight — ONE tree, not two

I first built this as `workflow-methodologies/crdm/`, the path the owner
named, having found that main had meanwhile grown
`cat-harness/methodologies/` (Kepner-Tregoe, MADR, DMN) from a sibling
session. I read the two as different axes — **process** methods, how a
process runs, against **judgement** methods, how to decide — and flagged
the boundary rather than assuming it, because MADR is on both lists.

Owner: *"put CRDM and RACI under methodologies as well."*

**One tree, and it is the better answer** for the reason this repository
keeps relearning: two directories whose boundary needs a paragraph to
explain are two answers to *where do methodologies live*, and the next
author picks the wrong one. The axis I saw is real but it is a property of
each methodology, not a reason to split the directory.

So: `cat-harness/methodologies/crdm/`, and RACI joins it.

### One thing this leaves open, flagged not assumed

`methodologies/` is declared as the `methodology` graph kind and holds
three flat `.md` files. `methodologies/crdm/` is declared separately as
`cat-harness`, because it holds skills and diagrams — so a `cat-harness`
graph now nests inside a `methodology` one.

That is the shape `#263` warns about, and it is exactly what `07xs` moved
`skills/memory/` out of. It is **not** obviously the same defect: there
the containing kind and the contents were on opposite LAYERS
(`content` holding `context`), whereas here both are things the harness
owns and reads. But the question is real, and it is the sibling author's
structure to settle rather than mine to restructure in passing.

Carried to `7o7i`, since RACI lands in the same tree and will make it
concrete.
