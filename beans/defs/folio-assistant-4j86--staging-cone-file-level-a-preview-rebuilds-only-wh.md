---
# folio-assistant-4j86
title: 'STAGING CONE (file level): a preview rebuilds only what a PR''s changed files can reach — general rule, in the skills'
status: todo
type: task
priority: normal
created_at: 2026-10-04T13:49:44Z
updated_at: 2026-10-04T15:04:45Z
parent: folio-assistant-fs43
blocked_by:
    - folio-assistant-nama
---

Owner, 2026-10-04: *"staging rebuild only what is dependency cone of changes (general rule. update skills)"*. Asked how fine-grained, the owner chose FILE LEVEL (option 1 of 3).

## Today (measured 2026-10-04, read-only map)
feature-staging.yml's cut is a PREFIX MATCH, not a cone:
- compose-docs.ts `carriedInstances()` (bean ga8a) carries a composed instance only if a changed path starts with its root;
- tebu's regex covers the reference docs.

So a change to fhir-harness/scripts/gen-ig-pages.ts or to the shared chrome DROPS smart-trust from the preview, which is under-carrying. The per-IG Jekyll sites and the AST sites are always rebuilt in full, which is over-building.

## The rule (file level)
A rendered output is in the cone when a changed file is in:
- its own source data, or
- the import closure of the generators that render it (check-import-direction already extracts the edges), or
- a derived graph it is computed from (the DERIVED-GRAPH DEPENDENCIES bean).

When the cone cannot be computed (no changed-file list, an API failure, an unknown generator), the preview carries everything: today's rule for doubt, kept.

## Done when
- [x] the rule is written in feature-staging.md, with pointers from staging-review.md (what a cut preview leaves out) and before-after-preview.md (the general rule across rendered kinds)
- [x] the cone is computed from changed files, generator import closures and the derived-graph edges, replacing the prefix match
- [x] measured: a skill-only PR carries no IG, and a gen-ig-pages.ts change carries every IG
- [x] per-IG Jekyll and AST sites rebuild only when in the cone

## 2026-10-04: owner ruling — the generator is declared as `writer` on the directory

Asked where the cone learns which generator writes a directory, the owner chose **`writer` on the directory declaration** (option 1 of 3; rejected: inferring it from regen's script pairs, reading it from route-branch manifests). An optional list of repo-relative script files, or directories ending in `/` for what a generator READS rather than imports (templates). A gate checks each path exists, and a route branch manifest's `writer` must agree with it. The edges half of the cone exists: nama step 3 declared `derivedFrom` on the three IG page sets, and `downstreamOf` is drafted.
