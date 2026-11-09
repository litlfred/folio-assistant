```
input/, sushi-config.yaml, ig.ini
   │  ig-ast-refresh.yml      (reusable; the only writer of the AST cache)
   ▼
cat/fhir-harness/fhir-ast/<package id>    the AST cache branch
   │  site-publish.yml → stage-local.ts   (no Publisher runs here)
   ▼
gh-pages:  /                   from the default branch
           /branches/<branch>/ from any other branch (a preview)
   │  GitHub Pages
   ▼
https://<owner>.github.io/<repo>/
```

| Workflow | Where it lives | What it does |
|---|---|---|
| [`ig-ast-refresh.yml`](https://github.com/litlfred/fhir-harness/blob/main/.github/workflows/ig-ast-refresh.yml) | this layer (reusable, `workflow_call`) | restores the cache and judges it (`valid`, `stale`, `cannot-tell` or `missing`). If it is not valid, it builds the AST: incrementally when it can, in full otherwise. It seeds the cache branch only from a default-branch commit; otherwise it uploads the AST as an `output-ast` run artifact |
| [`templates/ig-repo-site/ig-ast-refresh.yml`](https://github.com/litlfred/fhir-harness/blob/main/templates/ig-repo-site/ig-ast-refresh.yml) | copied into the IG repository | the caller. A layer above adds its own `pre-export:` step and `template-repos:` here |
| [`templates/ig-repo-site/site-publish.yml`](https://github.com/litlfred/fhir-harness/blob/main/templates/ig-repo-site/site-publish.yml) | copied into the IG repository, unchanged | job `ast` calls the refresh. Job `publish` mounts the layers from `index.lock.json` and runs `stage-local.ts --repo .`; the `plan` input adds `--plan` |
| [`publish-qa.yml`](https://github.com/litlfred/fhir-harness/blob/main/.github/workflows/publish-qa.yml) | this layer | publishes this layer's QA results to `cat/cat-harness/qa-reports` |

The rules (when an AST is valid, who may seed the cache, what a stale AST
refuses) are in the `ig-build-pipeline` skill, §"The AST cache lifecycle".
