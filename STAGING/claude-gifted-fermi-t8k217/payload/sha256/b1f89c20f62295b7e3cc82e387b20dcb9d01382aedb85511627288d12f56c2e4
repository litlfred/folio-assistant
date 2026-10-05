---
# folio-assistant-4475
title: Run build-ig-site in an IG's own repository (smart-trust first), once folio-assistant is split
status: todo
type: task
created_at: 2026-09-30T19:07:16Z
updated_at: 2026-09-30T19:07:16Z
parent: folio-assistant-vke6
---

From bamf (#1670). The owner, 2026-09-30: an IG's site is built by the IG's own repository, by instantiating the smart-guideline harness there, and existing repos are NOT instantiated until folio-assistant is split completely (epic vke6).

## What is ready
fhir-harness's build-ig-site stages an IG source repository as one just-the-docs Jekyll site, with the Publisher's site.data.fhir. Verified on WorldHealthOrganization/smart-trust@30d55b3:
- 42/42 pages build;
- {{ site.data.fhir.packageId }} resolves;
- 2 PlantUML diagrams render.

## Blocked on

- **waits on:** folio-assistant being split completely (epic vke6); the owner will not instantiate a harness on an existing IG repository before then
- **since:** 2026-09-30T19:00Z
- **expires:** 2026-12-31T00:00Z
- **handoff:** if the split has landed, instantiate the smart-guideline harness on smart-trust's repository and wire build-ig-site into its CI. If it has not, ask the owner whether the block still holds, rather than proceeding.

## Done when
- [ ] smart-trust's repository instantiates the smart-guideline harness and its CI runs build-ig-site
- [ ] the three Publisher-only fragments (dependency-table.xhtml, list-structuremaps.xhtml, actordefinition-short-summary.liquid) are either produced or explicitly accepted as markers
