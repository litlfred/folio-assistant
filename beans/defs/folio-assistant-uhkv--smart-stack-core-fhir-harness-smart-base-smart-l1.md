---
# folio-assistant-uhkv
$schema: bean/1.0.0
title: 'SMART STACK: core → fhir-harness → smart-base → {smart-l1, smart-dak, smart-ig}'
status: in-progress
type: epic
priority: high
created_at: 2026-09-22T19:07:23Z
updated_at: 2026-10-10T07:19:24Z
parent: folio-assistant-vuip
---

## The owner's ruling, verbatim

Paraphrase would lose the shape, and the shape is the whole decision:

> `core->fhir-harness-> smart-base->siblings{smart-l1, smart-dak, smart-ig}`,  no smart-guidelines.

Given 2026-09-22, in answer to four options offered on the same question. The
option chosen was NOT among the four — the owner supplied a fifth, and the
difference matters: every option offered kept a `smart-guidelines` layer, and
the ruling removes it.

## The stack

| layer | what it is | carries |
|---|---|---|
| `folio-assistant-core` | exists | folios, schemas, skills |
| **`fhir-harness`** | NEW — the **bare** FHIR IG pipeline | SUSHI + IG Publisher + Jekyll. No WHO assumption, no DAK pre/post. Serves any IG. This is bean `nsbb`'s "base", now named |
| **`smart-base`** | NEW harness, **and** instantiates the `smart.who.int.base` IG | WHO SMART harness rules and data models. No content |
| **`smart-l1`** | sibling | L1 narrative assets — the `smart-kg` work; the source DTHs are written from |
| **`smart-dak`** | sibling | L2 — the DAK harness every `smart-*` DAK repo instantiates. Lives at WHO |
| **`smart-ig`** | sibling | L3 — the FHIR IG instantiation of a DAK |

The three siblings are the **L1/L2/L3 knowledge layers**, and they are siblings
rather than a chain because an instance may hold any one without the others: an
L1 corpus with no DAK is a real thing, and so is an IG with no L1 behind it.

## What it settles, and what it overturns

**Settles `nsbb`**, open as `todo` since 2026-09-21 and the unrun referee
between two workstreams that were converging on the same question from opposite
ends — ingest (`qsf5`→`wjfu`→`qrnz`) reading a published IG's
`package/.index.json`, and render (`jut3`) reading `input/pages/`. Both answer
"what does a SMART page contain?" and neither was authorised to.

**Overturns the per-IG harness.** `smart-trust` is declared a harness instance
on main (#690, #717). Under this stack it is an **instance of `smart-ig`**, and
so is `smart-immunizations`. `nsbb` argued for this from the other direction
already — *"no `smart-trust` harness, because it adds no new functionality"*.

## Why `no smart-guidelines` is the load-bearing half

Every option offered kept that layer, on the reading that WHO SMART Guidelines
policy needed somewhere to live that was not the base IG. The ruling says it
does not: `smart-base` **is** that place, and it also instantiates its own IG.
So the thing to resist when writing this up is re-introducing the layer under
another name — a `smart-common`, a `smart-core`, a shared `skills/` package
that only the three siblings use. If three siblings need one rule, it belongs in
`smart-base`.

## Children

| bean | its part |
|---|---|
| `nsbb` | the layering itself, and the #690/#717 contradiction |
| `wm63` | `fhir-harness` as a layer — what is in it and what is deliberately not |
| `aqb6` | the 13 pre/post steps, each assigned to a layer |
| `kn0t` | the phased transition to AST-only |
| `a9tx` | IG Publisher fork requirements |
| `4yvj` | KG docs on the Publisher and FHIR content |
| `rjug` | schema proposals — metadata indexes, binary releases, QA reports |

## Done when

- [ ] the five layers exist as declared instances, each with a declaration that
      names only directories that exist (`dh4f`)
- [x] every one of the 13 pre/post-processing steps is assigned to exactly one
      layer, with none left unplaced — an unplaceable step falsifies the split
- [ ] `smart-trust` and `smart-immunizations` read as instances of `smart-ig`
      rather than as harnesses, and #690/#717 is resolved rather than left
      standing
- [ ] the write-up is skills, processes and actors — not prose in `AGENTS.md`
- [ ] gates green

Issue: https://github.com/litlfred/folio-assistant/issues/963

## Merged 2026-09-22 — and the epic is NOT done

PRs #881 (`b65612e4`) and #964 (`95e63c12`) are on `main`; issue #963 closed on
the owner's word. Merged `main` re-verified at 123/123 **after** the merge, not
only on the branches — `main` had moved (#970) between this PR's base and its
merge, and two independently-green PRs can be red together.

Both merged with a **merge commit rather than a squash**, deliberately: #964
merges #881's branch, so a squash of #881 would have landed the same files by a
second route and left #964 conflicting with changes it already contained.
Checked before merging, not after — `merge-base --is-ancestor` plus a dry run
reporting 0 conflicts.

### Children, honestly

| bean | state | why |
|---|---|---|
| `aqb6` | **completed** | all 26 steps assigned, each written into the skill owning its phase |
| `4yvj` | **completed** | both docs pages shipped and verified by building |
| `nsbb` | in-progress | the layering is settled and written, but the base has NOT been shown running for a non-WHO IG, and `smart-trust`/`smart-immunizations` still carry their own declarations |
| `wm63` | in-progress | same open criterion — the layer exists, nothing non-WHO has run through it |
| `kn0t` | in-progress | five phases written, **none executed** |
| `a9tx` | in-progress | requirements written, not approved, no fork |
| `rjug` | in-progress | one of three ruled; metadata indexes and binary releases untouched |
| `ylj7` | in-progress | cat-harness only, 15% → 73% |

### The epic's own criteria, re-read rather than assumed

**Three of the five layers do not exist.** `smart-l1`, `smart-dak` and
`smart-ig` are named in the ruling and in the skill; no instance directory
declares any of them. `fhir-harness` and `smart-base` are real.

So the criterion *"the five layers exist as declared instances"* is **not met**,
and neither is *"`smart-trust` and `smart-immunizations` read as instances of
`smart-ig`"* — they still declare themselves. What IS met is the falsification
test and the write-up-as-skills criterion.

Saying so here rather than letting a merged PR read as a finished epic: a
merge is evidence that code landed, never that a criterion was satisfied.


## 2026-10-10: done-when re-measured on the separated repos

- **Item 2 (each pre/post-processing step in exactly one layer): TICKED.**
  - aqb6 assigned all 26 steps of the WHO build, with none unplaceable and none needing two owners.
  - The four skills holding the assignment are on main after the separation: smart-base dak-preprocessing and dak-postprocessing; fhir-harness ig-publication (§render-IG) and ig-build-pipeline (§'The deploy phase').
- **Item 1 (declarations name only directories that exist): the measurable half is DONE.**
  - Measured core 19, fhir-harness 9 and smart-base 23 directories against their mains.
  - The only gap was smart-base-docs (docs/). It existed in the index repo until 2026-10-05 and was lost in the separation. smart-base#28 (d6743a5) regenerates it: 300 files, chrome applied, --check current.
  - The qa (test/results/) entries are not gaps; they declare storage.branch.
  - Box left OPEN on purpose. 'Five layers' predates the owner's 2026-10-01 revision (smart-l1 and smart-dak became document kinds in smart-base, #1767). The stack is now core → fhir-harness → smart-base → the IG instances, and no 'smart-ig' instance is declared anywhere (it appears only in generated harness.json). smart-trust's declaration needs smart-base directly. Whether this item should read 'four' is the owner's wording.
- **New gap found:** /smart-base/ has no landing page. Current gen-ig-pages leaves index.md to an IG site, and smart-base builds none (no menu.json).
- **Item 3 (smart-trust and smart-immunizations as instances of smart-ig):** turns on the same question; no smart-ig instance exists to be an instance of.


**Correction (same day):** the 'no landing page' gap above is wrong. smart-base-docs is declared igSite: true (owner, 2026-10-05), so its index, toc and artifacts pages come from smart-base's own IG site. smart-base/fhir-artifact-index/menu.json exists, so the IG site is staged (b8ip's 'no menu.json' is no longer true). gen-ig-pages deliberately drops index.md for an igSite instance.
