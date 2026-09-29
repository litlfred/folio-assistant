<!-- kg:subgraph:begin -->
# fsh-guts

The trashcan that is kept. Deprecated and throwaway structured content — addressable, exported as <base>/fsh-guts.jsonld, and DELIBERATELY absent from the rendered site. Every other declared kind here is non-renderable because it is a graph a tool reads and there was never a page to make of it; this one's contents could be rendered and are not, so that something can be kept without being published. It is also the destination that makes the never-delete rule enforceable beyond beans: AGENTS.md forbids deleting a bean because a scrapped item stops the next agent re-entering a dead end while a deleted one cannot be told from an accident, and that reasoning was always general — an agent removing a page or a script had only `rm`. Delete now means relocate here, and relocate is reversible. Files declare themselves with `$schema: folio-fsh-guts/v1`, per the same contract the bean and workflow stores use. NOTE on the name: `.fsh` is FHIR Shorthand in this codebase and across the WHO SMART folios; the collision was raised and the owner confirmed this spelling. REPOSITORY-scoped: it sits at the top of the checkout, not inside this instance, and it is deliberately never overlaid by a dependency.

Part of [C@T Harness](../cat-harness/README.md) 0.1.0, declared as `fsh-guts`, holding `fsh-guts`.

| file | what it is | used by |
|---|---|---|
| [`retired/`](retired/) | 16 files | |
| [`scripts/`](scripts/) | 16 files | |
<!-- kg:subgraph:end -->
