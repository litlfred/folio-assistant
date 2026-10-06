# AGENTS.md — smart-immunizations

The artefact index of the **WHO SMART Immunizations** Implementation Guide
(`smart.who.int.immunizations` v0.2.0, FHIR **4.0.1**), reconstructed from what
WHO published.

> ## 🛑 This instance is PROVISIONAL
>
> The owner ruled on 2026-09-21 that a per-IG harness should not exist — *"there
> does not neeed to be smart-trust harness, b/c no new funcionality"* — with the
> DAK/IG pipeline belonging in an IG base and output landing in a
> `smart-guideline` page under a new `smart-base` harness. See bean `nsbb`.
>
> This directory is declared so the repository is **consistent rather than
> half-migrated**, not because the shape is settled. Do not build on it.

> ## 🛑 Nothing here is authored, so nothing here is edited
>
> Everything under `fhir-artifact-index/` was produced by `ingest:ig`. If
> something is wrong, the fix is in the pipeline or in the upstream IG.

## What the second IG proved

It was ingested to test whether the pipeline generalises past smart-trust. It
did not, in three ways, all since fixed:

- **Sidecars were bound by composing `<ResourceType>-<id>`.** This IG names a
  Logical Model's sidecar after the model's `name`
  (`StructureDefinition-IMMZ_C4_Create_client_record` for the artefact
  `StructureDefinition/IMMZC4`), so ten of 198 schemas bound to nothing. Binding
  now resolves through the enumeration's own `example.schemas[]`.
- **An unbindable sidecar was dropped silently**, which is why the first defect
  was invisible. `dakUnbound` now records them.
- **The `size` materialisation gate quoted smart-trust's measurements** for
  every IG. It is measured per IG now.

Two findings about the IGs themselves, not the code:

- **748 artefacts, not the 712 both machine-readable indexes report.**
  `artifacts.html` is the *only* source for 36 published example instances
  (33 QuestionnaireResponse, 2 Patient, 1 RelatedPerson). In smart-trust it
  added none — which is why the four-view merge exists.
- **`canonicals.json` covers 100% here and 10% in smart-trust.** Which view
  carries the weight differs per IG, so provenance records all of them rather
  than naming a winner.

## Re-deriving it

```sh
GIT_LFS_SKIP_SMUDGE=1 git clone --depth 1 --single-branch --branch gh-pages \
  --filter=blob:none https://github.com/WorldHealthOrganization/smart-immunizations /tmp/si

bun run ingest:ig -- --source /tmp/si --kind gh-pages --id smart-immunizations \
  --base https://worldhealthorganization.github.io/smart-immunizations \
  --out smart-immunizations --materialize-dak
```

**But prefer not to.** `smart-base` already generates this surface —
`generate_valueset_schemas.py`, `generate_logical_model_schemas.py`,
`generate_jsonld_vocabularies.py`, `generate_dak_api_hub.py` — and knows the
id↔filename mapping this index had to reconstruct. Reading their output back is
the redundancy bean `nsbb` exists to remove.
