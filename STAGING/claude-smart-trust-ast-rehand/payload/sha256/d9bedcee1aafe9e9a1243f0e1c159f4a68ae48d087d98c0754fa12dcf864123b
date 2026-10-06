---
# folio-assistant-lehh
title: 'DERIVED NODE SCHEMAS: declare ig-ast (pick up fhir-harness/schemas/ig-ast.ts), lake-cache and gh-pages as graphs with schemas'
status: in-progress
type: task
priority: normal
created_at: 2026-10-04T13:52:13Z
updated_at: 2026-10-05T17:18:13Z
parent: folio-assistant-nama
---

Owner, 2026-10-04: *"bean - was an AST schema somewhere. pickup. add schemas for lean-cache (cat/folio-assistant-sci/lean-cache branch?) and gh-pages too"*

## Found (2026-10-04)
- **ig-ast**: the schema exists. `fhir-harness/schemas/ig-ast.ts` (Zod) has generated JSON Schemas `ig-ast.schema.json`, `ig-ast-plan.schema.json` and `ig-ast-dependencies.schema.json` (bean l0lq), gated by `ig-ast:schema:check`. `cat-harness/scripts/special-branches.json` already registers the branch family `cat/fhir-harness/fhir-ast/`. No declaration names it as a graph yet.
- **lake-cache** (the owner's "lean-cache"): an orphan-branch FAMILY `cat/folio-assistant-sci/lake-cache/<package>-<toolchain>`, refreshed by `.github/workflows/lake-cache-refresh.yml` from `.github/lake-packages.json`. Restored by `.github/actions/lake-cache-restore/`. Registered in special-branches.json. There is no schema for what a cache branch holds.
- **gh-pages**: registered in special-branches.json and built by `docs-site.yml` (main site) and `feature-staging.yml` (previews). There is no schema for its layout (the site root, preview prefixes, the per-IG sub-sites).
- **NOT registered**: the two route branches `cat/fhir-harness/ig-docs` (lbz8) and `cat/cat-harness/uml-overview` (xsrv).

## Done when
- [x] ig-ast is declared — restated 2026-10-05 per the owner's rulings below: the KIND is fhir-harness's (`fhir-harness/kinds/ig-ast.json`, node schema the existing `ig-ast.ts`), and the DIRECTORY is declared by the consuming folio: smart-trust's `smart-trust-ast`, storage on the `cat/fhir-harness/fhir-ast/` family at litlfred/smart-trust, naming Tool `ig-cache`. Original text: ig-ast is declared as a derived graph in fhir-harness.json. Its node schema is the EXISTING ig-ast.ts (picked up, not restated), its storage is the fhir-ast branch family, and `derivedFrom` is the IG source
- [x] lake-cache is declared — restated 2026-10-05 per the same rulings: the KIND is folio-assistant-sci's (`kinds/lake-cache.json`, validatorNotApplicable with its reason: branch content is Lake's build output), and so is the Tool (`lean-cache`, moved there 77201e7cf62a); the DIRECTORY is declared by the consuming Lean folio, qou (litlfred/qou#7523). Original text: lake-cache is declared in folio-assistant-sci, as a derived graph with a schema for a cache branch's contents (package, toolchain, the build products, provenance) and storage on the lake-cache family. Use the existing name `lake-cache` (a rename to "lean-cache" is the owner's call: it is Lake's cache, and the family already exists under that name)
- [x] gh-pages is declared as the derived `site` graph, with a schema for its layout (root, previews, per-IG sub-sites) and `derivedFrom` naming every renderable graph that composes it. Declared as cat-harness's `site/`, of kind `basic-cdn-site` (#2192). `derivedFrom` names the graphs cat-harness can reach; the rest are composed onto the site by mount-instance-docs.
- [ ] ig-docs (and, by its own bean, uml-overview) carry their branch as `storage` on their directory entry, never as a row in special-branches.json (owner's rva2 ruling, 2026-10-03)
- [x] check:kind-validators passes for the new kinds — measured 2026-10-05 on #2192: "every declared validator resolves to a runnable Zod schema, and every kind without one says why"

## 2026-10-04: two corrections and one owner ruling

**This bean asked for the wrong thing in one Done-when.** It said to register ig-docs and uml-overview in `special-branches.json`. The owner ruled on 2026-10-03 (bean rva2) that there is no central table: *"each harness declares it, (and each instance can also declare), why centralize?"* A special branch is the `storage` of a declared directory. The Done-when is rewritten to say so. A row for ig-docs was drafted and DROPPED before it was pushed, after the owner asked *"why special-branches.json. i thought we got rid of that. check beans"*. The file is still on main as debt until rva2 folds it in, and nothing here adds to it.

**Owner ruling: branch-only graphs are declared with a new keying, `family`** (option 1 of 3; rejected: register the kinds only, with no directories; or give special-branches rows a graph kind). A directory declares `storage: { branchPrefix, keyedBy: \"family\", keyFrom }` and a mount path, following the fsh-guts precedent (declared on a branch, present after `state:mount`), so `check:declared-dirs` can accept it as 'on a branch, mounted on demand' rather than as a dh4f absence. fhir-ast and lake-cache take `family`; gh-pages is one branch. Edges then resolve, and ig-ast's node schema is the existing `ig-ast.ts`.

**A measurement for rva2, not acted on:** both route-keyed seeds (uml-overview, ig-docs) record `seededFrom` and no `source.ref`, so `state-drift` reads them as unknown and never measures them. Measured by hand 2026-10-04: ig-docs is in sync with main for all three IGs, apart from the excluded READMEs. When rva2 moves state-drift onto declarations, a route seed's source is main by construction (one writer regenerates each route from main).

## 2026-10-04: ig-ast declared, not centrally

The `ig-ast` kind is a node in `fhir-harness/kinds/` (dmx1), never a central entry. Per the owner's rulings it is ingested into the CONSUMING folio, which may read it remotely or materialise it on a local branch. So family storage gained an optional `repository` (absent = materialised here), and smart-trust declares `smart-trust-ast` on `cat/fhir-harness/fhir-ast/` at litlfred/smart-trust, whose one member today is `smart.who.int.trust`. lake-cache follows the same pattern; the `.lake/` mount path is still open (rva2).

_2026-10-05T14:33:29Z_ — Claimed by claude/gifted-fermi-t8k217 — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).


## 2026-10-05: the site declared (#2192), on the owner's rulings
Asked how to declare gh-pages, the owner answered:
- *"in cat-harness/ not _site"*
- *"BasicCDNSite kind maybe? one w/o mime-types/redirects. In future will have CDNSite kind or so for Cloudflare"*
- *"do both now. local build vs github build = 2 tools same skill. site needs deployment Tool location"*
- *"gh-pages is almost like an archive (e.g. zip, tgz) for which we have a schema"*

So:
- Two kinds, `basic-cdn-site` and `cdn-site`, with schemas in `schemas/site.ts`. A site's files are `ArchiveEntrySchema` entries, and the kind adds the route layout.
- `cat-harness.json` declares `site/` on `gh-pages`, keyed by route, with `storage.tool: gh-pages`.
- The builds: `site-build-local` and `pages-publish` both satisfy `docs-generation`.

_2026-10-05_ — Boxes 1, 2 and 5 restated to the owner's rulings and ticked (see each box; original text kept). One deviation to note plainly: box 2 originally asked for a schema of a cache branch's contents; the kind instead declares `validatorNotApplicable` (branch content is Lake's binary build output, and `derived`). Box 4 (ig-docs, uml-overview `storage`) is left to beans lbz8 and xsrv, which own those branches and are claimed.
