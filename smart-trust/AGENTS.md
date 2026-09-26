# AGENTS.md — smart-trust

The artefact index of the **WHO SMART Trust** Implementation Guide
(`smart.who.int.trust` v1.8.0, FHIR 5.0.0), reconstructed from what WHO
published.

> ## 🛑 Nothing here is authored, so nothing here is edited
>
> Every file under `fhir-artifact-index/` was produced by `ingest:ig` from the
> IG's `gh-pages` output. `ingest:ig:check` re-derives it and fails if the
> committed copy differs, so a hand-edit is not a change — it is a defect that
> the next check either overwrites or reports.
>
> If something in this index is wrong, the fix is in **the pipeline**
> (`cat-harness/scripts/ingest-ig-artifacts.ts`) or in **the upstream IG**.
> Never here.

## What it is

`fhir-artifact-index/index.json` — one `folio-fhir-artifact-index/v1` document
carrying every artefact of the IG by canonical URL and published
representation, with the DAK API's JSON Schema / JSON-LD sidecars attached as
an overlay where WHO publishes them.

`fhir-artifact-index/dak/` — the materialised DAK surface. It sits inside the
declared graph directory rather than beside it, so one declaration entry
covers both the index and the bytes it points at.

**Catalogued by reference, with a materialised core.** 655 of the 674 artefacts
are `referenced` — the index says where they are and holds none of their bytes.
The 19 the DAK API covers are `materialized`, at 332K, against 7.1M for the
full resource corpus. That ratio is the decision, not an accident of what was
convenient: the JSON Schemas have no other home, and the resource JSON does.

## Reading it

Ask the schema, not this page:
`folio-assistant-core/schemas/fhir-artifact-index.ts`. Three habits it is
written to enforce, and each has already caught something:

- **`provenance` says which file a field came from.** No IG publishes an
  artefact index — `ValueSets.schema.json` at the published root is a *schema*
  describing an enumeration response, with an `example` that happens to hold
  the list. Every row here was assembled, and the provenance block is how a
  reader tells a transcription from an inference.
- **An absent field is a fact.** `canonical` is absent on 604 artefacts because
  examples and instances have no canonical URL. `category` is absent on
  `ImplementationGuide/smart.who.int.trust` because the IG does not list itself
  on its own artefact page. Neither is a gap to fill.
- **Counts are checked, never quoted.** `count` is validated against
  `artifacts.length` by the schema. Any number in *this* file is prose and may
  have drifted — re-derive it with `ingest:ig` rather than citing it.

## Re-deriving it

```sh
# a published IG is large — smart-trust's gh-pages is 342,656 files
GIT_LFS_SKIP_SMUDGE=1 git clone --depth 1 --single-branch --branch gh-pages \
  --filter=blob:none https://github.com/WorldHealthOrganization/smart-trust /tmp/st

bun run ingest:ig -- --source /tmp/st --kind gh-pages --id smart-trust \
  --base https://worldhealthorganization.github.io/smart-trust \
  --out smart-trust --materialize-dak

bun run ingest:ig:check /tmp/st
```

`ingest:ig:check` has **three** outcomes, and the third is the point: `0` the
index is current, `1` it is stale, `2` the source was not present so nothing
was verified. A missing clone is never reported as a pass.

`--id`, `--base` and `--kind` default to what the committed index records about
itself, so a checker cannot disagree with the file it is checking.

## The discipline is in the skill, not here

[`ig-artifact-ingestion`](../cat-harness/skills/authoring-who-smart-guidelines/ig-artifact-ingestion.md)
carries which IGs qualify (the DAK API test, and why `unknown` is not a kind of
`absent`), the four partial views and what each one misses, the two traps
— `openapi/openapi.json` is the DDCC Gateway API, and `.index.json` is lossy —
why `gh-pages` and `output/` are different evidence, and how to add the next
IG.
