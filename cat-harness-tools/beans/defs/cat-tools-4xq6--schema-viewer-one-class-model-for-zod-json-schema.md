---
# cat-tools-4xq6
title: 'SCHEMA VIEWER: one class model for Zod, JSON Schema and FHIR logical models, drawn by schema:viz'
status: in-progress
type: feature
priority: normal
created_at: 2026-11-14T10:19:11Z
updated_at: 2026-11-14T10:19:19Z
---

Owner, 2026-11-14 (card answer B): 'Is there a schema viewer page that shows a UML-like diagram derived from schemas such as logical models or JSON schemas that are in the reference schema node kind? Or TypeScript? A consistent visualization.'

Today schema:viz draws Zod (schema-graph.ts) and reads *.schema.json shallowly; FHIR logical models (StructureDefinition kind=logical) get no class diagram.

- [ ] Class model: fields carry cardinality (min..max) as well as type; every reader fills the same SchemaDecl/SchemaEdge
- [ ] Reader registry (scripts/class-model/): one reader per source, dispatched by file content, never by folio name
- [ ] JSON Schema reader: $ref, allOf, properties, items (array cardinality from minItems/maxItems), nested definitions
- [ ] FHIR logical-model reader: StructureDefinition kind=logical, differential/snapshot elements, a type reference becomes an edge, backbone elements become classes
- [ ] Undetermined stays explicit: a source the reader cannot model is a stated undetermined declaration, never an empty box
- [ ] schema:viz draws every source with one look: box fill and ink from uml.css (--fa-uml-schema / --fa-uml-edge)
- [ ] Tests + Gherkin; before/after screenshots (Zod, JSON Schema, FHIR logical model) in the PR
