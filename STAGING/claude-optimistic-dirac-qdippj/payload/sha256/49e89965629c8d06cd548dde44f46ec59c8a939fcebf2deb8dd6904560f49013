# fhir-harness

The **bare FHIR IG pipeline** — the base layer of the SMART stack, and the one
layer with no WHO in it.

```
input/fsh/          →  SUSHI      →  fsh-generated/resources/
input/pagecontent/  ┐
sushi-config.yaml   ┘  →  IG Publisher (JVM, Docker)  →  output/  →  pages branch
```

No pre-processing, no post-processing. This is how WHO SMART Guidelines were
built *before* the DAK phases were added, so it is a shape that demonstrably
worked rather than a design invented here — and it is what any non-WHO
implementation guide instantiates.

**Contents**

<!-- readme:toc:begin -->

- [Scope](#scope)
- [Two steps came down from the WHO build](#two-steps-came-down-from-the-who-build)
- [Skills](#skills)

<!-- readme:toc:end -->

## Scope

| in | out |
|---|---|
| SUSHI, the IG Publisher, Jekyll assembly, publication | `dak.config.json` and the DAK logical model |
| rendering IG content through just-the-docs, including the IG API sidecars an IG publishes (`ig-api-views.ts`, bean `d313`) | the DAK API's names and production — the "DAK API" label, `dak-api.html` and its markers, the post-processing that writes the sidecars |
| stripping oversized `Library` payloads | any `smart.who.int` canonical or WHO publisher metadata |
| the artefact-index reconstruction | the DAK pre- and post-processing phases |

## Two steps came down from the WHO build

`strip_library_binaries.py` and `strip_library_content.py` arrived labelled
*"DAK Postprocessing"*, and nothing in either is DAK-shaped: any IG depending
on `hl7.fhir.uv.cql` produces oversized `Library` resources.

They are recorded here because this is the layering rule producing a result the
steps' own names contradicted — which is the only kind of evidence that a split
is doing work rather than describing one.

## Skills

- [`ig-build-pipeline`](skills/fhir-ig-base/ig-build-pipeline.md) — what the
  layer runs, and the list of what it refuses to know about.
- [`ig-render-jekyll`](skills/fhir-ig-base/ig-render-jekyll.md) — the three
  contracts: JSON only, navigation derived from `sushi-config.yaml`, LHS rail.
- [`smart-launch`](skills/fhir-client/smart-launch.md) — SMART on FHIR EHR and
  standalone launch through the SMARTerFHIR library.
- [`fhir-client-operations`](skills/fhir-client/fhir-client-operations.md) —
  reading, searching and writing FHIR resources through its client.
