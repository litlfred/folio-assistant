---
# folio-assistant-uhkv
title: 'SMART STACK: core → fhir-harness → smart-base → {smart-l1, smart-dak, smart-ig}'
status: in-progress
type: epic
priority: high
created_at: 2026-09-22T19:07:23Z
updated_at: 2026-09-22T19:07:55Z
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
- [ ] every one of the 13 pre/post-processing steps is assigned to exactly one
      layer, with none left unplaced — an unplaceable step falsifies the split
- [ ] `smart-trust` and `smart-immunizations` read as instances of `smart-ig`
      rather than as harnesses, and #690/#717 is resolved rather than left
      standing
- [ ] the write-up is skills, processes and actors — not prose in `AGENTS.md`
- [ ] gates green

Issue: https://github.com/litlfred/folio-assistant/issues/963
