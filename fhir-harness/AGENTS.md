# AGENTS.md — fhir-harness

The **bare** FHIR IG pipeline: SUSHI → IG Publisher → Jekyll → a pages branch,
with no pre-processing and no post-processing. It serves any implementation
guide.

## The one rule

**Nothing here may know about WHO.** Not `dak.config.json`, not the DAK logical
model, not `smart.who.int` canonicals, not the DAK API's names or the
post-processing that produces it, not the pre/post-processing steps, and
nothing from the `authoring-who-smart-guidelines` package. **Rendering** the
sidecars an IG publishes is generic and is here, as the IG API
(`ig-api-views.ts`; owner, 2026-10-03, bean `d313`); a WHO instance passes the
"DAK API" names in as configuration.

The import direction is the enforceable half: the WHO package may reference
this layer, this layer may not reference it. A violation **fails nothing** —
the build stays green and the layer simply stops being usable for the non-WHO
IG it exists for. That is why the refusal is written as a checkable list in
[`skills/fhir-ig-base/ig-build-pipeline.md`](skills/fhir-ig-base/ig-build-pipeline.md)
rather than left as an intention.

## Where the layer sits

```
folio-assistant-core → fhir-harness → smart-base (L1 and DAK document kinds) → smart-ig
```

The owner's ruling, 2026-09-22. An IG that wants the DAK surface does not
change this pipeline — the DAK document kind in `smart-base` supplies the
pre/post steps as an **overlay**. (Owner's stack ruling 2026-09-22, revised
2026-10-01: `smart-l1` and `smart-dak` became document kinds, #1767.) This
layer must not gain a `do_dak` flag: that would be this layer knowing about
DAKs.

Placement:
[`smart-stack-layering`](../smart-base/skills/content/authoring-who-smart-guidelines/smart-stack-layering.md).

## What is here

`skills/fhir-ig-base/`: `ig-build-pipeline`, `ig-render-jekyll`,
`ig-publisher-reduction` (the five phases), `ig-publisher-fork` (the AST
work, built as a library on top of the Publisher) and `ig-ast-delta` (list,
check, diff and render IG ASTs; `scripts/ig-ast.ts`). The package manifest is
the list, not this sentence.
`skills/fhir-client/` — `smart-launch` and `fhir-client-operations`, which use
the SMARTerFHIR library. Nothing else, and the declaration says so: a declared-but-absent directory is the
`dh4f` defect, where a consumer scans nothing and reports a clean run over it.
