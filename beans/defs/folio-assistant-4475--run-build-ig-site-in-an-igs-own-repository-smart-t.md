---
# folio-assistant-4475
title: Run build-ig-site in an IG's own repository (smart-trust first), once folio-assistant is split
status: todo
type: task
priority: normal
created_at: 2026-09-30T19:07:16Z
updated_at: 2026-10-09T19:22:44Z
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
- [x] the three Publisher-only fragments (dependency-table.xhtml, list-structuremaps.xhtml, actordefinition-short-summary.liquid) are either produced or explicitly accepted as markers

## Block re-checked 2026-10-09: its condition is met
The `waits on` condition — folio-assistant split completely — happened 2026-10-07/08: smart-trust, smart-base and smart-immunizations were cut over to their own repositories and remote-mounted (#2320), and fhir-harness (which owns `build-ig-site`) is litlfred/fhir-harness (#2474). The index checkout now holds no in-tree instance. Under this bean's own handoff, the next step is to instantiate the smart-guideline harness on smart-trust's repository and wire `build-ig-site` into its CI. Not done; which repository counts as "smart-trust's" (WorldHealthOrganization/smart-trust or the litlfred/smart-trust fork the index mounts) is the owner's call. Session https://claude.ai/code/session_017QXvm7c7RDYFguWzSxhrMb.


## 2026-10-09: re-measured (session https://claude.ai/code/session_01BJNRo4kh8U15HZVFDhYNJL)
- **Item 1, partly:** smart-trust's `claude/seed-smart-base` (ac8aa2f, 2026-10-09) carries `.github/workflows/folio-site.yml` with `INSTANCE: smart-trust`. It runs `stage-ig-sites`, and so `build-ig-site`, and it last deployed gh-pages 63303eb on 10-06. main declares the local instance (`index.config.json`, 5054f05) but has no site workflow. The workflow is manual-only by owner decision, so "its CI runs build-ig-site" holds on the seed branch, by hand. Whether that counts is the owner's call.
- **Item 2, measured on fhir-harness main:**
  - `list-structuremaps.xhtml` is PRODUCED, written from the artefact index (bean 9hfi).
  - `dependency-table.xhtml` and `actordefinition-short-summary.liquid` still fall back to the generic "not rendered" marker, reported in `StageResult`.
  - So one of the three is produced and two are markers. Accepting those two as markers is the owner's call; until then the item stays open.

## 2026-10-09: item 2 — all three produced (session https://claude.ai/code/session_01BJNRo4kh8U15HZVFDhYNJL)
- `list-structuremaps.xhtml`: from the artefact index (bean 9hfi, already on main).
- `actordefinition-short-summary.liquid`: the include is the IG's own (`local-template/includes/`) and was always found. What it lacked was DATA. smart-trust's `system-actors.md` loops `site.data.canonicals` and reads `site.data[stub]`, so the actor list rendered EMPTY with no marker (gh-pages 63303eb vs the Publisher's c6e0e45). litlfred/fhir-harness#16 (4ef85ce) writes both from the FHIR AST, and composition now rewrites `site.data[...]`.
- `dependency-table.xhtml` (+ `-short`, `-nontech`): litlfred/fhir-harness#17 (7c82be1) builds it from the IG's `dependsOn` / sushi `dependencies`, nested from the package cache. A package the cache lacks is said, not hidden.
- **Verified by tests** (291 pass, the loop and the tables rendered with liquidjs). NOT yet on a live site: that needs a folio-site run whose folio-assistant pin carries fhir-harness ≥ 7c82be1, which waits on #2518 like 48a6's rollout.
