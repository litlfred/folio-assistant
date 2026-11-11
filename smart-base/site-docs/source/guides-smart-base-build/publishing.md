Every workflow here is **started by hand** from the Actions tab. Nothing
publishes on push.

| Workflow | What it does |
|---|---|
| [`ig-ast-refresh.yml`](https://github.com/litlfred/smart-base/blob/main/.github/workflows/ig-ast-refresh.yml) | calls the FHIR IG layer's reusable refresh, with `pre-export: bash smart-base/scripts/dak-pre-export.sh` and the WHO template. Seeds the AST cache from `main` |
| [`site-publish.yml`](https://github.com/litlfred/smart-base/blob/main/.github/workflows/site-publish.yml) | mounts the layers and runs `stage-local.ts --repo .`. On `main` it publishes the `gh-pages` root; on another branch, `branches/<branch>/` |
| [`pr-preview.yml`](https://github.com/litlfred/smart-base/blob/main/.github/workflows/pr-preview.yml) | a pull request preview, deployed after a collaborator approves it in the `pr-preview` environment |
| [`ghbuild.yml`](https://github.com/litlfred/smart-base/blob/main/.github/workflows/ghbuild.yml) | the plain WHO build (above) |
| [`release.yml`](https://github.com/litlfred/smart-base/blob/main/.github/workflows/release.yml) | checks `publication-request.json` for a release |

The `gh-pages` root publish also keeps `ns/`, `0.1.0/` and `sitepreview/`
(`site.build.keep` in `index.config.json`): the JSON-LD context and
vocabulary that `publish-context.yml` writes.
