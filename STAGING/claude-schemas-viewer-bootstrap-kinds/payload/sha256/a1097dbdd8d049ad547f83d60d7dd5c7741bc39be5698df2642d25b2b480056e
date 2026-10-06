---
# folio-assistant-s43p
title: 'SCHEMAS VIEWER: /cat-harness/schemas/bootstrap is a 404 — dependency instances'' schemas are excluded, and node kinds are not searchable'
status: in-progress
type: bug
priority: normal
created_at: 2026-10-06T12:09:39Z
updated_at: 2026-10-06T12:09:47Z
parent: folio-assistant-o3xy
---

Owner, 2026-10-06, verbatim:

> i expected https://litlfred.github.io/folio-assistant/cat-harness/schemas/bootstrap to work and show all schemas in bootstrap
> (i also expected to be able to search for node kinds and see them here).
> (following general patern requirements of harness visualizers)

## Measured 2026-10-06 on main d34afab78

- gen-schema-viz.ts publishes one subject page per instance found by readSchemaGraph(cat-harness). schemaRoots() calls corpusDirectoriesForGraph(root, 'schemas'), i.e. checkoutDirectories with stackedOn: the instance and those stacked ON it. Dependencies (bootstrap, bootstrap-tools) are excluded by design, so no bootstrap page is ever written. Subjects today: cat-harness, cat-openapi, fhir-harness, folio-assistant-core, smart-base.
- bootstrap/schemas/ holds JSON Schema files (*.schema.json), and the reader reads *.ts only, so even with the root included bootstrap would be an empty subject.
- bootstrap.json declares nodeSchemas (its node kinds) and no page shows them.

## Todo
- [ ] the viewer reads the whole checkout's declared schemas directories (dependencies included), without changing what kg-audit / glossary read
- [ ] JSON Schema files are read as declarations
- [ ] node kinds shown and searchable on the page
- [ ] screenshots of /cat-harness/schemas/bootstrap and one other instance sent to the owner
- [ ] PR green and merged
