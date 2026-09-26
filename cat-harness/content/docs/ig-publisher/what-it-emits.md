Read from a published IG and from the build that produced it, rather than
inferred from the rendered pages:

| it produces | notes |
|---|---|
| `output/` — the rendered site | HTML per resource and per page, from `input/pagecontent/` and the `pages:` map in `sushi-config.yaml` |
| `{ResourceType}-{id}.json` per resource | the **structured** surface everything downstream reads |
| `.xml` and `.ttl` per resource | three serialisations of one resource; this platform's render path takes the JSON only |
| `package.tgz` → `package/.index.json` | filename, `resourceType`, `id` — index-version 2 |
| `canonicals.json`, `package.manifest.json` | partial views of the same artefact set |
| `artifacts.html` | the **only** source of an artefact's category |
| `qa.json` | the validation record |
| POT files | extracted translatable strings |

**No count is given here on purpose, and the table is dated by its source
rather than by this page.** The emission list changes with the Publisher's
releases, and — see below — the version is not pinned. Any statement about
what it emits is a measurement with a date and a version attached, or it is a
claim with no provenance.

**There is no artefact-index instance in that list, and its absence is the
single most consequential fact here.** `ValueSets.schema.json` at a published
root is a *schema* describing an enumeration response, which happens to carry
an `example` holding the list. Reading it as an index is a documented trap.
An index over a published IG has to be **reconstructed** from four partial
views, none sufficient alone — and which view carries the weight differs per
IG, which is why provenance records all of them rather than naming a winner.
