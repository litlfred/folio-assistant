---
# folio-assistant-4j86
title: 'STAGING CONE (file level): a preview rebuilds only what a PR''s changed files can reach — general rule, in the skills'
status: todo
type: task
priority: normal
created_at: 2026-10-04T13:49:44Z
updated_at: 2026-10-04T13:49:53Z
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
- [ ] the rule is written in feature-staging.md, with pointers from staging-review.md (what a cut preview leaves out) and before-after-preview.md (the general rule across rendered kinds)
- [ ] the cone is computed from changed files, generator import closures and the derived-graph edges, replacing the prefix match
- [ ] measured: a skill-only PR carries no IG, and a gen-ig-pages.ts change carries every IG
- [ ] per-IG Jekyll and AST sites rebuild only when in the cone
