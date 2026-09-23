---
# folio-assistant-bvhf
title: 'UML overview per named sub-graph: PlantUML + Mermaid from one model'
status: in-progress
type: feature
created_at: 2026-09-23T05:54:59Z
updated_at: 2026-09-23T05:54:59Z
parent: folio-assistant-zzmr
---

Owner, 2026-09-23: cat-harness/uml/overview/<sub-graph path>. Groupings are the named sub-graphs a harness declares (bootstrap/processes, bootstrap/schemas, bootstrap/scenarios, ...) and the node schema kinds in them; colours are declared in theme CSS; just-the-docs renders Mermaid; each page cross-references its PlantUML source.

## Todo
- [x] generator: instances -> declared directories -> kind validators -> classes
- [x] .puml + .mmd per sub-graph and per instance under cat-harness/uml/overview/
- [x] docs pages rendering Mermaid, linking the .puml/.mmd sources
- [x] kind colours in CSS
- [x] declare uml/ (graph kind + cat-harness.json)
- [x] --check wired into CI gates
- [ ] gates green, pushed to PR #991
