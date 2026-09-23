---
# folio-assistant-hwzu
title: bootstrap's published graph carries a timestamp and commit SHA its emission skill forbids
status: todo
type: bug
created_at: 2026-09-23T07:37:59Z
updated_at: 2026-09-23T07:37:59Z
parent: folio-assistant-zzmr
---

Found by n350 while writing BootstrapGraphDocumentSchema. bootstrap-graph-emission says the document has 'no timestamp, no commit SHA' (a generated file cannot name its own commit). But the ONE publisher since dyd3 is kg-export --instance ./bootstrap, and its output carries generatedAt, sourceCommit, sourceCommitSha, sourceCommitAt and sourceTreeDirty. The four properties are asserted only against gen-bootstrap-graph.ts, which no longer publishes. So the rule is tested on the generator that does not ship and broken by the one that does.

Two ways out, and it is the owner's call: (a) the rule holds for bootstrap: kg-export omits provenance for it, and the purity/order tests move onto the published document; (b) provenance is right for every published graph: the skill's rule is narrowed to the retired generator or dropped. BootstrapGraphDocumentSchema makes the provenance fields optional so both documents parse until this is settled.
