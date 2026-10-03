<!-- kg:subgraph:begin -->
# vocab-mappings

Vocabulary mappings: one `"$schema": "folio-vocab-mapping/v1"` table per source content type and target node, saying which source field becomes which target predicate and with what relationship. A table is shaped like a FHIR ConceptMap, so an existing ConceptMap is representable here and a table can be produced as one, with the loss reported (`schemas/vocab-mapping-fhir.ts`). Owner, 2026-09-23 (bean sl9u): "need Tools for this type of ETL procedure depending on source / target content type and other metadata". Ruled 2026-10-02 (bean k74z): option 1, tables as KG data applied by the in-process `vocab-map` Tool. First consumer: `scripts/glossary-export.ts`. `dependents: skip`: a table belongs to the Tool that applies it, which lives here.

Part of [C@T Harness](../README.md) 0.1.0, declared as `vocab-mappings`, holding `vocab-mapping`.

| file | what it is | used by |
|---|---|---|
| [`concept-scheme-naming.json`](concept-scheme-naming.json) | Concept scheme → its name, and when that name is also a document title |  |
| [`glossary-concept-scheme.json`](glossary-concept-scheme.json) | Swimlane glossary → SKOS concept scheme |  |
| [`glossary-lane-usage.json`](glossary-lane-usage.json) | Lane occurrence → lane usage node (swimlane glossary) |  |
| [`glossary-retired-concept.json`](glossary-retired-concept.json) | Retired glossary term → deprecated SKOS concept (swimlane glossary) |  |
| [`glossary-role-concept.json`](glossary-role-concept.json) | [Role](https://github.com/litlfred/bootstrap/blob/main/schemas/README.md#role) → SKOS concept (swimlane glossary) |  |
| [`glossary-variable-lane-concept.json`](glossary-variable-lane-concept.json) | Lane whose performer varies → SKOS concept (swimlane glossary) |  |
| [`kg-node-naming.json`](kg-node-naming.json) | Knowledge-graph node → name, title, description and summary (kg-export, fsh-guts-export) |  |
| [`licence-naming.json`](licence-naming.json) | Licensed resource → its licence (glossary and library item alike) |  |
| [`role-naming.json`](role-naming.json) | [Role](https://github.com/litlfred/bootstrap/blob/main/schemas/README.md#role) → its name and identifier (kg-export and glossary-export alike) |  |
<!-- kg:subgraph:end -->
