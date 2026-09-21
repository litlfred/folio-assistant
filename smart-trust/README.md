# smart-trust

The artefact index of the **WHO SMART Trust** Implementation Guide, rebuilt
from what the IG publishes.

| | |
|---|---|
| Package | `smart.who.int.trust` v1.8.0 |
| FHIR | 5.0.0 |
| Canonical base | `http://smart.who.int/trust` |
| Published at | <https://worldhealthorganization.github.io/smart-trust> |
| DAK API | present |

## What is here

`fhir-artifact-index/index.json` lists every artefact of the IG with its
canonical URL, its published JSON / XML / Turtle / HTML representations, and —
where the IG's **DAK API** covers it — its JSON Schema, display strings,
OpenAPI fragment and JSON-LD vocabulary.

The index is **reconstructed**, not downloaded. No FHIR IG publishes an
artefact-index document: what looks like one (`ValueSets.schema.json` at the
published root) is a JSON Schema describing the shape of an enumeration
response, carrying an `example` that happens to hold the real list. So each
field here was assembled from the IG's published output, and `index.json`
records in its `provenance` block which file each part came out of.

Most of it is catalogued **by reference** — the index says where an artefact
lives and holds none of its bytes. The DAK API surface is materialised under
`fhir-artifact-index/dak/`, because those JSON Schemas have no other home.

## Regenerating

```sh
bun run ingest:ig -- --source <path-to-gh-pages> --kind gh-pages \
  --id smart-trust --base https://worldhealthorganization.github.io/smart-trust \
  --out smart-trust --materialize-dak
```

`bun run ingest:ig:check <path-to-gh-pages>` verifies the committed index is
current. It exits `0` current, `1` stale, `2` source not present — the third
because "could not check" is never green.

Nothing in this directory is hand-edited. See
[`AGENTS.md`](AGENTS.md) and the
[`ig-artifact-ingestion`](../cat-harness/skills/authoring-who-smart-guidelines/ig-artifact-ingestion.md)
skill.
