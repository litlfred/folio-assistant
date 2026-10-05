**No FHIR IG publishes an index of its own artefacts.** This is the fact that
shapes every attempt to read one back as a graph, and it surprises people
because a published IG plainly *knows* what it contains.

What exists instead is four partial views, and none is sufficient alone:

| view | carries |
|---|---|
| `package.tgz` → `package/.index.json` | filename, `resourceType`, `id` for every file |
| `canonicals.json` | id, type, url, version, name — canonical resources only |
| `artifacts.html` | the only source of an artefact's **category** |
| `package.manifest.json` | package-level metadata |

So an index is **reconstructed**, and each field records which published file
it came from. The provenance is not bookkeeping: coverage differs per IG, and
badly. `canonicals.json` covers about a tenth of one WHO IG's artefacts and
all of another's. A pipeline that picked a winner on the first IG it met would
be silently wrong on the second, reporting a clean run over the artefacts that
view does not reach.

Two traps are documented because both have been hit:

- **`ValueSets.schema.json` at the published root is a schema, not an index.**
  It describes an enumeration endpoint's response and carries an `example`
  that holds the list — and the hub page links it to a `schemas/` directory it
  is not in.
- **`openapi/openapi.json` is not the DAK API.** In at least one WHO IG it is
  an unrelated domain API, so an ingest that globs for OpenAI-shaped files
  mis-files it.
