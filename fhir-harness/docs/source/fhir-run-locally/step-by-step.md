`stage-local.ts` runs these named steps in order. The layers supply them, so
you can also run any one of them on its own with `bun run cat <step>`:

| # | Step | Script | What it does |
|---|---|---|---|
| 1 | `ig-site:ast` | `ig-repo-site.ts ast` | restores the AST from the cache branch `cat/fhir-harness/fhir-ast/<package id>` (or keeps a valid `output-ast/`), and refuses a stale one |
| 2 | `ig-site:sidecars` | the landing layer's own | *optional*: API sidecars from the AST, when the landing layer has this step |
| 3 | `ig-index:build` | `build-ig-indexes.ts` | the artefact index, menu and releases in `fhir-artifact-index/` |
| 4 | `ig-site:compose` | `ig-repo-site.ts compose` | the thin artefact pages, with the IG's own pages composed at the site root |
| 5 | `ig-site:openapi` | cat-harness-tools | *optional*: a page per OpenAPI operation, when the IG has `openapi/cat-openapi.config.json` |
| 6 | `ig-site:publisher-pages` | `ig-repo-site.ts publisher-pages` | serves the AST's data, guards against leftover Publisher chrome, stamps the build |
| 7 | `ig-site:bar` | `ig-repo-site.ts bar` | the language picker and the IG's slim bar |

The scripts' own usage lines:

```text
ig-repo-site.ts ast [--ig <checkout>] [--work <dir>]
ig-repo-site.ts compose <site source> [--ig <checkout>] [--baseurl <base>] [--plantuml-jar <jar>] [--work <dir>]
ig-repo-site.ts publisher-pages <built site> [--ig <checkout>] [--work <dir>]
ig-repo-site.ts bar <built site> [--ig <checkout>]

ig-ast-build.sh [--ig-root DIR] [--tx URL] [--ast-export-ref SHA] [--work DIR] [--template-repo ID=OWNER/REPO]…
```

To publish an AST you built yourself to the cache branch, so the next render
and CI can reuse it (only from a default-branch commit):

```bash
bash fhir-harness/scripts/ig-cache.sh seed --ig-root . --push
```
