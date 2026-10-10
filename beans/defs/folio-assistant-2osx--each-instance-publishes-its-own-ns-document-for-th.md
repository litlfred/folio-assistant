---
# folio-assistant-2osx
$schema: bean/1.0.0
title: Each instance publishes its own ns document for the block-kind classes it mints
status: completed
type: task
priority: normal
created_at: 2026-10-06T16:41:00Z
updated_at: 2026-10-09T16:27:00Z
parent: folio-assistant-7x5n
---

Follow-up to the vocabulary move (bean 0r7u, owner rulings 2026-10-06): block-kind classes are minted in the declaring instance's namespace (folio-assistant-core:Prose, folio-assistant-sci:Theorem, smart-base:Persona), but no instance publishes a document defining them, so the class IRIs do not dereference. The core ones never did (pre-existing gap); sci and smart-base are new namespaces with no ns document at all.

## Todo
- [x] Each instance's ns document is generated from its own block-kind nodes (label = heading, definition = rationale or a new gloss field), not from cat-harness's vocabulary.ts.
- [x] docs-site.yml's ns loop is driven by the instance declarations rather than the hard-coded harness/core pair, so sci and smart-base publish.
- [x] The ns-vocabulary Tool's maintains list (cat-harness/tools/index.ts) stops naming folio-assistant-core/ns.jsonld: each instance's Tool node declares its own.
- [x] ns:check (or a sibling) fails on a folioType whose owner publishes no definition.

## Done when
- [x] Dereferencing any block-kind class IRI returns a document defining it, published by the instance that owns the kind.

## Closed 2026-10-09

### Work Delivered
1. **Per-instance block kind classes in ns documents:**
   - Updated `scripts/ns-export.ts` to discover block-kind nodes per instance via `discoverBlockKinds`.
   - Each block kind class is emitted with:
     - `@id = node.folioType`
     - `@type = ["rdfs:Class", "skos:Concept"]`
     - `label = heading ?? className ?? kind` (with empty-heading fallback for kinds like `prose`)
     - `comment = definition`
     - `prefLabel = label`
     - `definition = rationale ?? heading ?? className ?? kind`
     - `notation = node.folioType`
     - `inScheme = conceptSchemeIriFor(instance)`
     - `isDefinedBy = conceptSchemeIriFor(instance)`
     - `layer = instance === "folio-assistant-core" ? "core" : instance`
   - Added `--instance <name>`, `--list-instances`, and `--out-dir` CLI options to `ns-export.ts`.
   - The `@context` now binds all publishing instance prefixes (`cat-harness`, `folio-assistant-core`, `folio-assistant-sci`, `smart-base`).
2. **Dynamic workflow loop:**
   - In `.github/workflows/docs-site.yml` and `feature-staging.yml`, replaced the hardcoded `harness:cat-harness core:folio-assistant-core` loop with `for DIR in $(bun run cat-harness/scripts/ns-export.ts --list-instances); do ... done`.
3. **Tool maintains list:**
   - Updated `cat-harness/tools/index.ts` so `ns-vocabulary` maintains only `cat-harness/ns.jsonld`.
4. **Validation in `ns:check`:**
   - `ns:check` fails when any discovered block kind's `folioType` has a prefix whose owner does not publish an ns definition.
5. **Fixture handling in `schemas/declared-nodes.ts`:**
   - Updated `declaredDirectories` so it avoids scanning the test fixture when `repoRoot` already contains instances declaring the requested graph typology.
6. **Tests:**
   - Added `scripts/tests/ns-export-instance.test.ts` (8 tests passing) covering all 4 instances, SKOS/RDFS fields, fallback behavior for `prose`, and error detection for unpublishing owners.
   - All 25 tests in `scripts/tests/ns-export*.test.ts` pass cleanly.
   - `bun run typecheck` passes cleanly.

### Commits
- `cat-harness`: commit `3ca44abd` on branch `claude/2osx-instance-ns-doc` pushed to `origin`.
- `folio-assistant`: commit `d9deb7f6b294` on branch `claude/2osx-instance-ns-doc` pushed to `origin`.
