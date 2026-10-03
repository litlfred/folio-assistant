---
# folio-assistant-l4ay
title: 'SUBGRAPH SOURCE + NODE PATTERN: a declared subgraph declares where its content comes from (directory | branch | future), overridable by instance config; publishers use the declared Subgraph node + isPartOf'
status: in-progress
type: feature
priority: normal
created_at: 2026-10-03T08:31:48Z
updated_at: 2026-10-03T09:53:26Z
parent: folio-assistant-fs43
---

Owner rulings 2026-10-03 (verbatim): "todos = subgraph node + todo content nodes" -> option 1, "and make pattern for declared repo branches (and declared dir subgraphs)". Later the same day: "It's the same pattern. One of them is mounting the directory while one of them is mounting a branch. Another mount type could come in the future. A sub graph declares where it's getting its content.. It could also be a graph database in the future. That same information can be overwritten by the harness instance config. Update skills process processes and tools".

## Todo
- [ ] SubgraphSource discriminated union on ContentDirectory (directory | branch), mapping from #1764/#1937 storage
- [ ] instance-config override by directory id; one resolver
- [ ] Subgraph JSON-LD node carries resolved source
- [ ] generic subgraphNode/memberOf helper; todos.jsonld container = declared #todos Subgraph, todos gain isPartOf
- [ ] gate: publisher of a declared subgraph without Subgraph node / members without isPartOf fails
- [ ] skills (directory-conventions, content-context-and-state-graphs), processes, tools updated; skill:register
- [ ] audit other generators minting their own collection node; one follow-up bean
- [ ] interface comment on #1957; reader check on #1953

## Done when
PR merged-ready with CI green and the checklist above ticked.
