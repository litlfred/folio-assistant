---
# folio-assistant-4475
title: Run build-ig-site in an IG's own repository (smart-trust first), once folio-assistant is split
status: todo
type: task
priority: normal
created_at: 2026-09-30T19:07:16Z
updated_at: 2026-10-09T17:43:31Z
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

## Block re-checked 2026-10-09: its condition is met
The `waits on` condition — folio-assistant split completely — happened 2026-10-07/08: smart-trust, smart-base and smart-immunizations were cut over to their own repositories and remote-mounted (#2320), and fhir-harness (which owns `build-ig-site`) is litlfred/fhir-harness (#2474). The index checkout now holds no in-tree instance. Under this bean's own handoff, the next step is to instantiate the smart-guideline harness on smart-trust's repository and wire `build-ig-site` into its CI. Not done; which repository counts as "smart-trust's" (WorldHealthOrganization/smart-trust or the litlfred/smart-trust fork the index mounts) is the owner's call. Session https://claude.ai/code/session_017QXvm7c7RDYFguWzSxhrMb.
