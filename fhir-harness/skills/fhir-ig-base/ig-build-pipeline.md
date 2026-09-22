---
name: ig-build-pipeline
description: >
  The bare FHIR IG pipeline — FSH to SUSHI to the IG Publisher to a pages
  branch, with no pre-processing and no post-processing. What this layer runs,
  what it emits, and the list of things it deliberately refuses to know about.
  Read before adding anything to fhir-harness.
---

# ig-build-pipeline

> Skill id: `ig-build-pipeline` · Package: `fhir-ig-base` · Instance:
> `fhir-harness`

The **base**: run the FHIR IG Publisher over an IG, with no pre-processing and
no post-processing, and publish the result. This is how WHO SMART Guidelines
were built *before* DAK pre/post processing was added, so it is a shape that
demonstrably worked rather than a design being invented here.

It serves **any** FHIR IG. That is the whole point of the layer, and it is a
constraint rather than an aspiration — see §"What this layer refuses to know".

## The pipeline

```
input/fsh/          →  SUSHI      →  fsh-generated/resources/
input/pagecontent/  ┐
sushi-config.yaml   ┘  →  IG Publisher (JVM, Docker)  →  output/
                                                        →  publish to a pages branch
```

Four stages, and the only one that is not a straight invocation is the last: a
pages branch is a deployment target, and which one is the instance's to declare.

## What the Publisher run emits

Stated in [`ig-publication`](../../../cat-harness/skills/authoring-who-smart-guidelines/ig-publication.md)
§"The render-IG phase", because that skill owns the run and this one owns the
layer. Do not restate the list here — two copies of an emission list is two
copies free to drift, and the emission list is exactly the thing a new Publisher
release changes.

## What this layer refuses to know about

A list, because "generic" is a claim and a list is checkable. `fhir-harness`
must contain no reference to:

- `dak.config.json` (`dak.json` as upstream still spells it), the DAK logical
  model, or any DAK component
- `smart.who.int` canonicals, or any WHO publisher metadata
- the DAK API surface — `.schema.json`, `.displays.json`, `.openapi.json`, the
  `dak-api.html` hub
- the DAK pre- and post-processing steps, in either direction
- anything in the `authoring-who-smart-guidelines` package

**The import direction is the enforceable half.** The WHO package may reference
this layer; this layer may not reference the WHO package. A violation fails
nothing on its own — the build stays green and the layer simply stops being
usable for a non-WHO IG, which is the failure this list exists to make visible.

## Two steps that came DOWN from the WHO build

`strip_library_binaries.py` and `strip_library_content.py` strip base64 payloads
and inline CQL/ELM out of `Library` resources. They arrived labelled *"DAK
Postprocessing"* and nothing in either is DAK-shaped: any IG depending on
`hl7.fhir.uv.cql` produces oversized `Library` resources, and the WHO deploy
phase's *"Delete files >100MB before deployment"* is the same concern one layer
down.

They belong here. Recorded because this is the layering rule
([`smart-stack-layering`](../../../cat-harness/skills/authoring-who-smart-guidelines/smart-stack-layering.md))
producing a result its own step names contradicted — which is the only kind of
evidence that a split is doing work.

## Upgrading to the overlay

An IG that wants the DAK surface does not change this pipeline; it instantiates
`smart-dak` and gets the pre/post steps as an **overlay**. The base takes no
position on whether an overlay exists, and must not gain a flag for one — a
`do_dak` input at this layer would be this layer knowing about DAKs.

## Version floating is real here

`publisher.jar` is re-downloaded from the **latest** release on every WHO build,
so two builds of an unchanged commit can differ. If this layer pins instead, say
so in the instance's declaration and make the pin visible in the QA record;
bean `dhvf` is the general case.

Do not treat an unpinned toolchain as a detail. It makes "the build changed" and
"the content changed" indistinguishable, which is the same class of defect as an
unrecorded workflow outcome.
