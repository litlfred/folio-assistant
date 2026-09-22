---
name: smart-stack-layering
description: >
  Which of the five layers a WHO SMART asset, rule, script or page belongs to,
  and the one question that settles it. Read before adding anything to
  fhir-harness, smart-base, smart-l1, smart-dak or smart-ig, before creating a
  per-IG harness, and before moving a pre/post-processing step.
---

# smart-stack-layering

> Skill id: `smart-stack-layering` · Package: `authoring-who-smart-guidelines`

## The stack, as the owner ruled it

2026-09-22, verbatim, because the shape **is** the decision:

> `core->fhir-harness-> smart-base->siblings{smart-l1, smart-dak, smart-ig}`,  no smart-guidelines.

```
folio-assistant-core
  └── fhir-harness              bare FHIR IG pipeline — no WHO anything
        └── smart-base          WHO SMART harness rules + data models; instantiates smart.who.int.base
              ├── smart-l1      L1 — narrative assets, the source a DTH is written from
              ├── smart-dak     L2 — the DAK harness every smart-* DAK repo instantiates
              └── smart-ig      L3 — the FHIR IG instantiation of a DAK
```

**The three are siblings, not a chain.** An instance may hold any one without
the others: an L1 corpus with no DAK behind it is a real thing, and so is an IG
with no L1. Chaining them would make every IG declare a dependency on a
narrative corpus it never reads.

## The question that settles placement

One question, asked in this order, first `no` wins:

> **1. Would a non-WHO FHIR IG need this?** → `fhir-harness`.
> **2. Would every WHO SMART asset need it, L1, L2 and L3 alike?** → `smart-base`.
> **3. Otherwise** → whichever of the three siblings owns that knowledge layer.

It is deliberately not "which layer does it feel like". The first question is
answerable by naming one non-WHO IG that would want the thing; if you cannot
name one, the answer is no.

## `no smart-guidelines` is the load-bearing half

Four stack options were offered and **every one of them kept a
`smart-guidelines` layer**, on the reading that WHO SMART policy needed a home
that was not the base IG. The ruling says it does not — `smart-base` is that
home, and it also instantiates its own IG.

So the failure mode to watch for is **re-introducing the layer under another
name**: a `smart-common`, a `smart-core`, a `shared/` skills package that only
the three siblings import. If three siblings need one rule, that rule is
`smart-base`'s. Three siblings agreeing is not evidence that a fourth layer is
missing; it is evidence that the rule was always general.

## What each layer may hold, and what it may not

| layer | holds | must NOT hold |
|---|---|---|
| `fhir-harness` | SUSHI, IG Publisher invocation, Jekyll assembly, publication to a pages branch, the artefact-index reconstruction | any WHO term, `dak.config.json`, any DAK pre/post step, any `smart.who.int` canonical |
| `smart-base` | the SMART harness rules, the DAK logical model, `dak.config.json`'s schema, WHO voices and methodologies, the `smart.who.int.base` IG | subject matter for any one guideline; anything only one sibling needs |
| `smart-l1` | narrative L1 assets, figure narratives, the corpus a DTH is written from | FHIR resources; anything an IG build reads |
| `smart-dak` | L2 — the DAK components, DMN/BPMN authoring, the DAK-shaped pre-processing | FHIR profiles; publication |
| `smart-ig` | L3 — FSH, profiles, terminology binding, the IG build for one guideline | L1 narrative; DAK authoring |

## Two consequences that overturn what is on `main`

**1. There is no per-IG harness.** `smart-trust` is declared a harness instance
today (#690, #717) and `smart-immunizations` carries a declaration whose own
comment calls itself *"PROVISIONAL BY DESIGN"*. Under this stack both are
**instances of `smart-ig`**. Bean `nsbb` had already argued it from the other
direction — *"no `smart-trust` harness, because it adds no new functionality"*.

**2. `fhir-harness` may not import the WHO package.** It is the layer a non-WHO
IG instantiates, and a dependency on `authoring-who-smart-guidelines` would make
that impossible while still passing every gate — nothing would fail, the layer
would simply stop being usable for what it is for. This skill lives in the WHO
package **and describes `fhir-harness`**, which is the right direction: the
upper layer may know the stack, the lower layer may not.

## The falsification test

The split is a claim, and it is checkable:

> **Every step of the existing WHO build assigns to exactly one layer.**

The build is 13 steps of DAK pre- and post-processing around one Publisher run,
read from `WorldHealthOrganization/smart-base`'s `.github/workflows/ghbuild.yml`
(the `do_dak` input gates the pre and post phases). If a step cannot be placed,
or if two siblings both need to own one, **the sibling split is wrong** and this
skill is what should change. The assignment is in
[`dak-preprocessing`](dak-preprocessing.md) and
[`dak-postprocessing`](dak-postprocessing.md); those two skills carry the steps,
this one carries the rule they are placed by.

Do not resolve a conflict by adding a layer. Report it.

## Where an instance says which layer it is

In its declaration's `needs`, and nowhere else. `needs: ["smart-base"]` is what
makes an instance a sibling; `needs: ["fhir-harness"]` is what makes it a
non-WHO IG. There is no `layer` field and there should not be one — a second
place to state it is a second place for it to be wrong.

Conventions for the declaration itself:
[`directory-conventions`](../folio-core/directory-conventions.md).
