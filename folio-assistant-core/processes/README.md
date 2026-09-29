<!-- kg:subgraph:begin -->
# folio-assistant-core-processes

The BPMN core owns -- `deep-document-research`, Doc-Researcher's iterative loop as an executable process. A TOP-LEVEL directory rather than `methodologies/processes/`, which is where it was first put: `check:layout-norms` refused that as a package subdirectory of an already-declared graph, declaring the same directory twice. `smart-base` carries the nested shape and is baselined, but the harness's own diagrams live in a top-level `processes/` and so do these. That satisfies bean `g43o` -- `workflowDirs` resolves from a DECLARED directory -- without the double declaration, which is strictly better than baselining a third instance of a tolerated exception. Declared here as well, repository-scoped, because the consumers that scan for diagrams run from this root.

Part of [C@T Harness](../../cat-harness/README.md), declared as `folio-assistant-core-processes`, holding `processes`.

| file | what it is | used by |
|---|---|---|
| [`deep-document-research.bpmn`](deep-document-research.bpmn) | a Process: Deep document research |  |
<!-- kg:subgraph:end -->
