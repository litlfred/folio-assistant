---
# folio-assistant-f327
$schema: bean/1.0.0
title: 'DIFF RENDERER: structural diff for DAK artefacts — a decision-table row, data element, indicator or FHIR profile element compared as fields, not text'
status: completed
type: task
priority: normal
created_at: 2026-09-23T10:00:13Z
updated_at: 2026-10-16T09:55:00Z
parent: folio-assistant-q4jm
---

Child of d903 (renderer 4 of the five it listed). A text diff of a decision table is unreadable, which is the case that proved a single 'the diff' wrong.

Needs, before it can be built:
- the structured shape of each DAK artefact on BOTH sides. The ChangeSet reads manifests as text and never executes them; a field diff needs the parsed artefact (FHIR JSON, a DMN table, a data dictionary row);
- a registry entry in cat-harness/schemas/diff-renderers.ts with a new `needs` input (say `structure`), and defaults for the DAK block kinds, once those kinds exist in BLOCK_KINDS (today there are none).

## Done when
- [x] the DAK artefact kinds it applies to are real block kinds
- [x] the structured sides are published beside changeset-text.json
- [x] a field-level renderer is registered and tested in the browser


2026-10-09: item 1 verified landed — litlfred/smart-base main carries 21 `folio-block-kind/v1` nodes under `smart-base/block-kinds/`, among them the four this bean names: `decision-table`, `data-element`, `indicator`, `profile` (plus business-process, persona, plan-definition, measure, …). Items 2–3 (structured sides beside changeset-text.json; a browser-tested field renderer in cat-harness's diff-renderers registry) remain. (session https://claude.ai/code/session_01BJNRo4kh8U15HZVFDhYNJL)

_2026-10-16T09:55:00Z_ — Completed; owner 2026-10-16 09:46Z: "do so". Each box has evidence: persona and functional-requirement are contributed block kinds that `changeset.ts` reads as structured (`snapshot`, `fields`); `stage-local` publishes `changeset-structure.json` beside `changeset-text.json`; the `structure` renderer is in `cat-harness/schemas/diff-renderers.ts` (needs `structure`), and its "Fields, before and after" view was checked in Chromium on litlfred/dth-hrh#35 (persona `title`, requirement `meta.priority`). The orphaned-comment bug found there is fixed by litlfred/folio-assistant-core#132. Session https://claude.ai/code/session_013hWB2emNRv744CRMvP9Wud.
