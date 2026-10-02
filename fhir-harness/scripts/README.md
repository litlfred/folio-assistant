<!-- kg:subgraph:begin -->
# fhir-ig-scripts

The IG site pipeline's code and the Liquid templates it renders with: `stage-ig-sites.ts` stages each instance's IG as its own just-the-docs site, `build-ig-site.ts` turns an IG's `input/` and `sushi-config.yaml` into that site (navigation, colour scheme, the lifted `site.data.fhir` artefact variables, and the Publisher-generated pages `toc` and `artifacts`), `ig-site-data.ts` lifts the IG's `_data`, and `ig-ast.ts` lists, checks, diffs and renders IG ASTs. Templates sit under `templates/`, beside the writer that reads them (`liquid-templates`). Undeclared until 2026-10-01 while the Tool nodes in `tools/` invoked every one of these files: a `.liquid` file in an undeclared directory is one no checker looks at, which is what declaring it fixes.

Part of [FHIR IG Harness](../README.md) 0.1.0, declared as `fhir-ig-scripts`, holding `code`.

| file | what it is | used by |
|---|---|---|
| [`build-ig-site.test.ts`](build-ig-site.test.ts) | a file |  |
| [`build-ig-site.ts`](build-ig-site.ts) | a file |  |
| [`dak-views.test.ts`](dak-views.test.ts) | a file |  |
| [`dak-views.ts`](dak-views.ts) | a file |  |
| [`gen-ig-pages.test.ts`](gen-ig-pages.test.ts) | a file |  |
| [`gen-ig-pages.ts`](gen-ig-pages.ts) | a file |  |
| [`ig-ast.test.ts`](ig-ast.test.ts) | a file |  |
| [`ig-ast.ts`](ig-ast.ts) | a file |  |
| [`ig-binary-audit.test.ts`](ig-binary-audit.test.ts) | a file |  |
| [`ig-binary-audit.ts`](ig-binary-audit.ts) | a file |  |
| [`ig-site-data.test.ts`](ig-site-data.test.ts) | a file |  |
| [`ig-site-data.ts`](ig-site-data.ts) | a file |  |
| [`ingest-ig-chrome.ts`](ingest-ig-chrome.ts) | a file |  |
| [`ingest-ig-menu.ts`](ingest-ig-menu.ts) | a file |  |
| [`p2-refusals.test.ts`](p2-refusals.test.ts) | a file |  |
| [`p2-refusals.ts`](p2-refusals.ts) | a file |  |
| [`pin-ig-terminology.ts`](pin-ig-terminology.ts) | a file |  |
| [`resource-tabs.test.ts`](resource-tabs.test.ts) | a file |  |
| [`resource-views.test.ts`](resource-views.test.ts) | a file |  |
| [`resource-views.ts`](resource-views.ts) | a file |  |
| [`stage-ig-sites.test.ts`](stage-ig-sites.test.ts) | a file |  |
| [`stage-ig-sites.ts`](stage-ig-sites.ts) | a file |  |
| [`templates/`](templates/) | 11 files | |
| [`tests/`](tests/) | 1 file | |
<!-- kg:subgraph:end -->
