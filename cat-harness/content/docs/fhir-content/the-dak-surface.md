A WHO SMART Guidelines IG publishes an extra layer on top of standard IG
output — the **DAK API** — produced by scripts that run *after* the Publisher
exits:

- `<stem>.schema.json` — a JSON Schema per logical model and per ValueSet
- `<stem>.displays.json` — display labels
- `<stem>.openapi.json` — an OpenAPI description
- `<stem>.jsonld` — a JSON-LD vocabulary, built from ValueSet **expansions**
- `dak-api.html` — the hub a reader enters through

Its size varies by two orders of magnitude between IGs, so treat any figure
you have seen as a fact about one IG at one version rather than as a property
of the surface.

**None of this is the Publisher's work**, which is the practical reason to
know the boundary: a question about why a schema is missing is a question
about a post-processing script, not about the build. And because the JSON-LD
vocabularies are built from expansions, they inherit the terminology server's
availability — a thin vocabulary may mean a thin ValueSet or may mean nobody
could expand it, and the artefact alone does not say which.
