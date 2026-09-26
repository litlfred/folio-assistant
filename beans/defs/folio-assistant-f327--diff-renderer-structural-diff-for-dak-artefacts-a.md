---
# folio-assistant-f327
title: 'DIFF RENDERER: structural diff for DAK artefacts — a decision-table row, data element, indicator or FHIR profile element compared as fields, not text'
status: todo
type: task
created_at: 2026-09-23T10:00:13Z
updated_at: 2026-09-23T10:00:13Z
parent: folio-assistant-q4jm
---

Child of d903 (renderer 4 of the five it listed). A text diff of a decision table is unreadable, which is the case that proved a single 'the diff' wrong.

Needs, before it can be built:
- the structured shape of each DAK artefact on BOTH sides. The ChangeSet reads manifests as text and never executes them; a field diff needs the parsed artefact (FHIR JSON, a DMN table, a data dictionary row);
- a registry entry in cat-harness/schemas/diff-renderers.ts with a new `needs` input (say `structure`), and defaults for the DAK block kinds, once those kinds exist in BLOCK_KINDS (today there are none).

## Done when
- [ ] the DAK artefact kinds it applies to are real block kinds
- [ ] the structured sides are published beside changeset-text.json
- [ ] a field-level renderer is registered and tested in the browser
