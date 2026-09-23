---
# folio-assistant-12s9
title: 'PREFIX = DECLARING SUBGRAPH: rename the folio: BPMN prefix and folio-*/v1 schema ids to the path of the Subgraph that declares them (owner ruling iwtn #1)'
status: todo
type: task
created_at: 2026-09-23T21:03:10Z
updated_at: 2026-09-23T21:03:10Z
parent: folio-assistant-88mg
---

## Owner ruling, 2026-09-23 (bean iwtn, ruling 1 of 4)

> use `<sub>:` as prefix when assets are declared/instantiated in `<sub>`. what patterns for sub-sub-graphs? `<path>:<in>:<graph>:` or so?

A nested Subgraph uses its **path of Subgraph ids joined with dots**. XML forbids a colon inside a prefix, so `a:b:c:` cannot be used. The owner chose this pattern on 2026-09-23 over "Harness name only" and "joined with hyphens":

    <bootstrap.processes:skill ref="confirm-harness"/>
    xmlns:bootstrap.processes="<base>/bootstrap/processes/ns#"
    $schema: bootstrap/processes/workflow-instance/v1

Programs match on the namespace address, never on the prefix. The prefix is what a reader sees. The address carries the full path.

## Measured 2026-09-23, on main at c33dd611

- 71 `.bpmn` files declare `xmlns:folio="https://litlfred.github.io/folio-assistant/bpmn"`.
- About 20 `.ts` files reference the prefix or the address, among them `schemas/namespaces.ts`, `types/bpmn-moddle.d.ts`, `src/workflow/process-model.ts`, `content/pipeline/bpmn-translate.ts`, `scripts/kg-export.ts` and `scripts/ns-export.ts`.
- 40+ distinct `folio-*/v1` schema ids. The most used are folio-document-images (41 uses), folio-detangle-sidecar (30) and folio-library-entry (29).
- Folios in other repositories (qou, folio-test) carry diagrams too.

## Where each element is declared decides its prefix

- `skill`, `role`, `decision`, `precondition` and `no-skill` are about Skills, Roles and Processes. Those are bootstrap's terms, so they belong in `bootstrap.processes:`.
- `bean` is a cat-harness concept (the work plan), so it takes a cat-harness Subgraph prefix.
- Each `folio-*/v1` schema id moves to `<harness>/<subgraph>/<name>/v1`, using the Subgraph where that schema is declared.

## Stages (each stage is one PR, and each stage is green on its own)

- [ ] 1. Declare one namespace address per declaring Subgraph, in `schemas/namespaces.ts`. The parser and the moddle descriptor accept both the old address and the new one.
- [ ] 2. Migrate bootstrap's 3 diagrams, and remove the ALLOW entries in `bootstrap-tools/schemas/graph.test.ts`.
- [ ] 3. Migrate the rest of this repository's diagrams, and move the `folio-*/v1` schema ids with a read-both window.
- [ ] 4. Folio repositories (qou needs the owner's go-ahead first), then drop the old address.

## Done when

No file under `bootstrap/` carries `folio:` or `folio-*/v1`, and the ALLOW list in `graph.test.ts` holds only bootstrap's own location.
