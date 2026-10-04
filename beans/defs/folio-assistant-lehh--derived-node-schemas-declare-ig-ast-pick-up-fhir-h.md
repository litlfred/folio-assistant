---
# folio-assistant-lehh
title: 'DERIVED NODE SCHEMAS: declare ig-ast (pick up fhir-harness/schemas/ig-ast.ts), lake-cache and gh-pages as graphs with schemas'
status: todo
type: task
created_at: 2026-10-04T13:52:13Z
updated_at: 2026-10-04T13:52:13Z
parent: folio-assistant-nama
---

Owner, 2026-10-04: *"bean - was an AST schema somewhere. pickup. add schemas for lean-cache (cat/folio-assistant-sci/lean-cache branch?) and gh-pages too"*

## Found (2026-10-04)
- **ig-ast**: the schema exists. `fhir-harness/schemas/ig-ast.ts` (Zod) has generated JSON Schemas `ig-ast.schema.json`, `ig-ast-plan.schema.json` and `ig-ast-dependencies.schema.json` (bean l0lq), gated by `ig-ast:schema:check`. `cat-harness/scripts/special-branches.json` already registers the branch family `cat/fhir-harness/fhir-ast/`. No declaration names it as a graph yet.
- **lake-cache** (the owner's "lean-cache"): an orphan-branch FAMILY `cat/folio-assistant-sci/lake-cache/<package>-<toolchain>`, refreshed by `.github/workflows/lake-cache-refresh.yml` from `.github/lake-packages.json`. Restored by `.github/actions/lake-cache-restore/`. Registered in special-branches.json. There is no schema for what a cache branch holds.
- **gh-pages**: registered in special-branches.json and built by `docs-site.yml` (main site) and `feature-staging.yml` (previews). There is no schema for its layout (the site root, preview prefixes, the per-IG sub-sites).
- **NOT registered**: the two route branches `cat/fhir-harness/ig-docs` (lbz8) and `cat/cat-harness/uml-overview` (xsrv).

## Done when
- [ ] ig-ast is declared as a derived graph in fhir-harness.json. Its node schema is the EXISTING ig-ast.ts (picked up, not restated), its storage is the fhir-ast branch family, and `derivedFrom` is the IG source
- [ ] lake-cache is declared in folio-assistant-sci, as a derived graph with a schema for a cache branch's contents (package, toolchain, the build products, provenance) and storage on the lake-cache family. Use the existing name `lake-cache` (a rename to "lean-cache" is the owner's call: it is Lake's cache, and the family already exists under that name)
- [ ] gh-pages is declared as the derived `site` graph, with a schema for its layout (root, previews, per-IG sub-sites) and `derivedFrom` naming every renderable graph that composes it
- [ ] ig-docs and uml-overview are registered in special-branches.json
- [ ] check:kind-validators passes for the new kinds (each has a runnable validator, or says why not)
