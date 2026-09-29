<!-- kg:subgraph:begin -->
# folio-templates

Files `folio_init` WRITES INTO a new folio, kept as real files so they can be read, diffed and parsed rather than living as strings inside `scripts/init-folio.ts`. One subdirectory per content profile, mirroring the folio's own layout under it: `document/` is written into every folio and `paper/` additionally into a paper folio (profiles nest, as `content-profiles` says), and a `github/` segment lands as the folio's `.github/`, because a dot-prefixed directory is the one place this repository's own conventions refuse. Bean `52dz`, owner 2026-09-24: the generic QA workflows (`qa-sweep`, `qa-sweep-nightly`, `section-title-audit`) and the Lean workflows (`blueprint`, `lean-build`, `lean-build-sidecar`, `lean_ci`) moved here from `.github/workflows/`, where they could never run and counted as workflows that do not. `{{assistant}}`, `{{folio}}`, `{{platform_git}}` and `{{platform_repo}}` are substituted at write time; `${{ … }}` is GitHub's and is left alone. Declared `code` rather than a kind of its own: these are executable sources whose target is another repository, and nothing here reads them as graph nodes. `dependents: skip` -- a dependent inherits them through `folio_init`, not by owning a copy.

Part of [C@T Harness](../README.md) 0.1.0, declared as `folio-templates`, holding `code`.

| file | what it is | used by |
|---|---|---|
| [`document/`](document/) | 3 files | |
| [`paper/`](paper/) | 13 files | |
<!-- kg:subgraph:end -->
