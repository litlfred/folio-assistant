---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: 'smart-stack-layering'
parent: Skill instructions
---

{: .note }
> Generated from [`smart-base/skills/content/authoring-who-smart-guidelines/smart-stack-layering.md`](https://github.com/litlfred/folio-assistant/blob/main/smart-base/skills/content/authoring-who-smart-guidelines/smart-stack-layering.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/smart-base/skills/content/authoring-who-smart-guidelines/smart-stack-layering.md){: .fa-edit-source }

{% raw %}
# smart-stack-layering

> Skill id: `smart-stack-layering` · Package: `authoring-who-smart-guidelines`

## The stack, as the owner ruled it

2026-09-22, verbatim, because the shape **is** the decision:

> `core->fhir-harness-> smart-base->siblings{smart-l1, smart-dak, smart-ig}`,  no smart-guidelines.

### Revised 2026-10-01: L1 and DAK are document KINDS, not layers

The owner, reframing the three siblings during the smart-* separation (#1767):
*"what they really need to be are sub-document types/kinds/visualizer for them.
smart-L1 is like a L1 document that was fully computable from smart-base assets
… semi fixed structure … similarly DAK is a publication type w/ the 10
components, fixed structure."* Then, asked what happens to the directories:
**retire `smart-l1` and `smart-dak`, keep `smart-ig`.** Stage D, bean `kg83`.

```
folio-assistant-core
  └── fhir-harness              bare FHIR IG pipeline — no WHO anything
        └── smart-base          WHO SMART harness rules + data models; instantiates smart.who.int.base
              │                   ├─ L1  document kind — semi-fixed, computed from smart-base's library (+ PICO, Cochrane …)
              │                   └─ DAK document kind — fixed: the ten components
              └── smart-ig      L3 — the FHIR IG publication a DAK feeds
```

So the 2026-09-22 ruling's three siblings became **two kinds and one layer**.
An L1 document and a DAK are things an author PRODUCES with the smart-base
harness, which is what a document kind is; they never had code, tools or
processes of their own (each directory held only its boilerplate). An IG is
still a different thing: it is published through the IG Publisher, and every
ingested IG (`smart-trust`, `smart-immunizations`) `needs: smart-ig`.

**L1, DAK and the IG are still not a chain.** An L1 document with no DAK behind
it is real, and so is an IG with no L1. Chaining them would make every IG
declare a dependency on a narrative corpus it never reads.

## The question that settles placement

One question, asked in this order, first `no` wins:

> **1. Would a non-WHO FHIR IG need this?** → `fhir-harness`.
> **2. Would every WHO SMART asset need it, L1, L2 and L3 alike?** → `smart-base`.
> **3. Is it about publishing one guideline's FHIR IG?** → `smart-ig`.
> **4. Otherwise** → `smart-base`, as part of the L1 or DAK document kind it serves.

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
the WHO kinds import. If L1, DAK and the IG all need one rule, that rule is
`smart-base`'s. Agreement across them is not evidence that a missing layer
exists; it is evidence that the rule was always general. The 2026-10-01 revision
applies the same reasoning one step further: a "layer" that holds no code of its
own is a kind.

## What each layer may hold, and what it may not

| layer | holds | must NOT hold |
|---|---|---|
| `fhir-harness` | SUSHI, IG Publisher invocation, Jekyll assembly, publication to a pages branch, the artefact-index reconstruction | any WHO term, `dak.config.json`, any DAK pre/post step, any `smart.who.int` canonical |
| `smart-base` | the SMART harness rules, the DAK logical model, `dak.config.json`'s schema, WHO voices and methodologies, the `smart.who.int.base` IG — **and the two document kinds:** L1 (narrative assets, figure narratives, the corpus a DTH is written from) and DAK (the ten components, DMN/BPMN authoring, the DAK-shaped pre-processing) | subject matter for any one guideline; FHIR resources in an L1 document; FHIR profiles or publication in a DAK |
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

## Where this is going: smart-base becomes a conventional IG

The owner, 2026-09-22: *"want to slowly get smart-base back to a more
conventional IG state w/o tooling"*.

`WorldHealthOrganization/smart-base` currently does two jobs. It **is** an IG
(`smart.who.int.base`, FHIR 4.0.1, its own profiles and logical models), and it
**hosts the toolchain every downstream SMART IG runs** — `ghbuild.yml` is a
reusable workflow, and a downstream build `curl`s its scripts from smart-base's
`main` at build time.

That second job is what ends. Its consequences are worth naming, because each
is a reason rather than a preference:

- **A downstream IG's build depends on a branch it does not control.** Scripts
  are fetched from smart-base `main`, so an IG's build can change without its
  repository changing.
- **The IG and the toolchain version together.** A fix to one is a release of
  the other.
- **The tooling is invisible to the harness.** Scripts in somebody's `input/`
  are not Tool nodes, so no process can bind them and no audit can reach them.

The migration is `smart-base/tools/` in this repository: Tool nodes now,
execution later. **Declaring is not vendoring** — see
[`smart-base-tools`](smart-base-tools.md), whose *"never vendor it"* rule is
about copies of the code and is unchanged.

Scope, stated because it is easy to over-read: this is **pre-work in
`litlfred/*`**. Nothing at `WorldHealthOrganization/*` is being changed, and
the `dak.json` → `dak.config.json` rename is ours alone until upstream follows.

## The falsification test

The split is a claim, and it is checkable:

> **Every step of the existing WHO build assigns to exactly one layer.**

The build is 13 steps of DAK pre- and post-processing around one Publisher run,
read from `WorldHealthOrganization/smart-base`'s `.github/workflows/ghbuild.yml`
(the `do_dak` input gates the pre and post phases). If a step cannot be placed,
or if two owners both claim one, **the split is wrong** and this skill is what
should change. The assignment is in
[`dak-preprocessing`](dak-preprocessing.md) and
[`dak-postprocessing`](dak-postprocessing.md); those two skills carry the steps,
this one carries the rule they are placed by.

Do not resolve a conflict by adding a layer. Report it.

### The test has been run, and here is what it returned

**All 26 steps place.** 6 pre-processing, 1 Publisher run, 9 post-processing,
10 deploy. Three of them moved against their own step names, which is the only
outcome that tells you a split is load-bearing rather than descriptive:

| step | labelled | placed |
|---|---|---|
| `strip_library_binaries.py` | DAK Postprocessing | `fhir-harness` |
| `strip_library_content.py` | DAK Postprocessing | `fhir-harness` |
| comment on PR — deployment completed | (deploy) | `cat-harness` |

And the deploy phase as a whole came back **entirely generic** — see
[`ig-build-pipeline`](ig-build-pipeline.md)
§"The deploy phase". The overlay does not reach the deployment end at all,
which is the strongest evidence for `nsbb`'s base-plus-overlay claim.

**No step required a sixth layer, and none needed two owners.** The split
survives its own test. Re-run it when a step is added upstream; a test that was
passed once is not a test.

## Where an instance says which layer it is

In its declaration's `needs`, and nowhere else. `needs: ["smart-ig"]` is what
makes an instance a published WHO SMART IG; `needs: ["smart-base"]` makes it a
WHO SMART instance that publishes no IG; `needs: ["fhir-harness"]` is what makes
it a non-WHO IG. Which document kinds an instance authors (L1, DAK) is a
property of its CONTENT, not of its `needs`. There is no `layer` field and there should not be one — a second
place to state it is a second place for it to be wrong.

Conventions for the declaration itself:
[`directory-conventions`](directory-conventions.md).
{% endraw %}
