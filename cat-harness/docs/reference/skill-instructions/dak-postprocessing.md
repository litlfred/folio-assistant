---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: 'dak-postprocessing'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/authoring-who-smart-guidelines/dak-postprocessing.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/authoring-who-smart-guidelines/dak-postprocessing.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/authoring-who-smart-guidelines/dak-postprocessing.md){: .fa-edit-source }

{% raw %}
# dak-postprocessing

> Skill id: `dak-postprocessing` · Package: `authoring-who-smart-guidelines` ·
> Layer: **`smart-dak`**, except the two Library strippers, which are
> `fhir-harness` — see §"One step is not WHO's".

Everything the WHO build runs between `publisher.jar` finishing and deployment,
gated by `do_dak` and by `dak.json` (upstream's spelling; ours is
`dak.config.json`). Each step runs **inside the publisher's
Docker container** (`docker exec -w /work ig-run python3 …`), against `output/`.

> **Sourcing.** `WorldHealthOrganization/smart-base` —
> `.github/workflows/ghbuild.yml` and `input/scripts/` — read 2026-09-22 at that
> repository's `main`. Scripts are fetched at build time from smart-base `main`,
> so a downstream IG runs smart-base's current scripts, not its own checkout's.

## The steps, and what each accomplishes

| # | script | what it produces |
|---|---|---|
| 1 | `strip_library_binaries.py` | removes base64 `content.data` from `Library` resources |
| 2 | `strip_library_content.py` | replaces inline CQL/ELM with a URL reference |
| 3 | `generate_logical_model_schemas.py` | a JSON Schema per logical model |
| 4 | `generate_valueset_schemas.py` | a JSON Schema per ValueSet, plus the enumeration-response schemas |
| 5 | `generate_jsonld_vocabularies.py` | JSON-LD vocabularies from the ValueSet **expansions** |
| 6 | `generate_dak_api_hub.py` | `dak-api.html` — the hub page, and the `.openapi.json` / `.displays.json` sidecars |
| 7 | `update_translated_image_refs.py` | rewrites image references inside translated HTML pages |
| 8 | `generate_smart_liquid.py` + `inject_smart_liquid.py` | **IG metadata → Liquid variables**, and the include injected into every markdown page |

Steps 1–2 are two workflow steps with near-identical names; 3–4 share one step.

## Step 8 is the seam, and it already does what we want

`generate_smart_liquid.py` declares its own source of truth as *"IG Publisher
processed output directory (`output/`)"*. It scans that output for
`{ResourceType}-{id}.json`, and for each one emits Liquid assignments named

```
smart__<ResourceType>__<id_normalized>__<category>__<key>
```

with categories `url__canonical`, `url__page`, `url__json`, `text__display`,
`link__html`, and `elements__<key>` for scalars (`name`, `title`, `description`,
`status`, `version`, …). Ids are normalised by replacing every non-alphanumeric
character with `_`.

**This is exactly "use metadata from the IG Publisher to populate the variables
Jekyll processes" — already built, and aimed at the Publisher's own Jekyll.**
It is therefore the first thing to lift, not something to design: the transition
re-points an existing bridge rather than building one. Bean `jut3`, phase P0 of
`kn0t`.

### A defect worth knowing before you rely on it

The script writes `input/pagecontent/smart.liquid.md` and says so in its own
output: *"will be processed by IG Publisher on the NEXT build"*. The
documentation page for the variable surface is therefore **one build behind** —
and it works around this by writing `output/smart.liquid.html` directly, bypassing
Jekyll, so the page exists at all.

A metadata surface that needs two builds to converge cannot be the basis of an
incremental staging loop. Under the just-the-docs pipeline the variables are
computed and consumed in one pass, and this workaround goes away with the
problem.

## One step is not WHO's

Steps 1 and 2 strip base64 binaries and inline CQL/ELM out of `Library`
resources. Nothing in either is DAK-shaped: **any** FHIR IG that embeds CQL
produces oversized `Library` resources, and the deploy phase's *"Delete files
>100MB before deployment"* step is the same concern one layer down.

By the [`smart-stack-layering`](smart-stack-layering.md) question — *would a
non-WHO FHIR IG need this?* — the answer is yes, and it can be named: any IG
using `hl7.fhir.uv.cql`. **They belong in `fhir-harness`.**

This is the falsification test doing its job: two of thirteen steps refused to
sit in the layer their step name claims, and the split survived because there
was a lower layer to put them in.

## Steps 3–6 are the DAK API, and they are the reason ingestion works

The four schema/vocabulary/hub steps are what produce the surface
[`ig-artifact-ingestion`](ig-artifact-ingestion.md) reconstructs an index from:
`.schema.json`, `.displays.json`, `.openapi.json` under `schemas/`, and
`.jsonld` at the published root.

Two things already measured about that surface, which constrain any redesign:

- **No IG publishes an artefact-index instance.** `ValueSets.schema.json` at the
  published root is a *schema* describing an enumeration response, carrying an
  `example` that happens to hold the list. The index is reconstructed from four
  partial views, none sufficient alone (bean `qsf5`).
- **Coverage differs per IG, so no view is the winner.** `canonicals.json`
  covers 10 % of smart-trust and 100 % of smart-immunizations (bean `qrnz`).
  Provenance records all views rather than naming one.

Re-derive those numbers rather than quoting them.

## Step 5 depends on expansion, which depends on a terminology server

`generate_jsonld_vocabularies.py` reads ValueSet **expansions**, which exist only
if the Publisher expanded them — which depends on `tx`, the optional terminology
server input. An IG built with a dead or restricted `tx` produces fewer
vocabularies and **fails nothing**: the step reports a warning and continues.

So a thin vocabulary output is not evidence of a thin ValueSet. Check the
expansion before concluding anything about the content.

## Step 7 renders nothing and is not translation

`update_translated_image_refs.py` rewrites `<img>` references inside already
generated translated HTML. It exists because translation happens to pages after
they are built. Under a pipeline where the locale layer is part of rendering,
there is no already-built HTML to patch, and this step has no subject.

## What the QA reports say, and where they go

Every script here instantiates the same `QAReporter` as the pre-processing
scripts and emits a phase report: `successes`, `warnings`, `errors`,
`files_processed`, `files_expected`, `files_missing`, and a summary with counts
and a completion timestamp. `qa.json` from the Publisher run is uploaded as a
workflow artifact.

**Both are produced and neither was read downstream.** That is the evidence the
`qa-report` graph kind was registered from on 2026-09-22 —
`schemas/qa-report.ts`. The shape is what these scripts already emit, not a
design.

Three rules are enforced structurally rather than left to a checker, each one a
discipline this repository has already paid for in prose: a summary may not
disagree with the details it counts; `files_missing` must be a subset of
`files_expected`, which is what keeps a determined empty distinguishable from a
not-found; and `running` is never a pass — a script that died before writing
anything has zero errors, and `qaReportVerdict` returns `unknown` for it rather
than `ok`.

## Where the counterparts are

[`dak-preprocessing`](dak-preprocessing.md) — the six invocations before the
Publisher, and why most of them exist only to populate `sushi-config.yaml`'s
`pages:` and `menu:`. [`ig-publication`](ig-publication.md) — the Publisher run
and the authority to release. [`ig-artifact-ingestion`](ig-artifact-ingestion.md)
— reading the surface steps 3–6 produce, from a published IG.
{% endraw %}
