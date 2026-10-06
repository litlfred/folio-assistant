---
# folio-assistant-l4ay
title: 'SUBGRAPH SOURCE + NODE PATTERN: a declared subgraph declares where its content comes from (directory | branch | future), overridable by instance config; publishers use the declared Subgraph node + isPartOf'
status: completed
type: feature
priority: normal
created_at: 2026-10-03T08:31:48Z
updated_at: 2026-10-06T06:26:36Z
parent: folio-assistant-fs43
---

Owner rulings 2026-10-03 (verbatim): "todos = subgraph node + todo content nodes" -> option 1, "and make pattern for declared repo branches (and declared dir subgraphs)". Later the same day: "It's the same pattern. One of them is mounting the directory while one of them is mounting a branch. Another mount type could come in the future. A sub graph declares where it's getting its content.. It could also be a graph database in the future. That same information can be overwritten by the harness instance config. Update skills process processes and tools".

## Todo
#1960 merged early (2026-10-03 10:45) carrying only this bean; the code lands through the follow-on PR from `claude/subgraph-node-pattern`. Code boxes stay open until that PR merges.

- [ ] SubgraphSource discriminated union on ContentDirectory (directory | branch), mapping from #1764/#1937 storage
- [ ] instance-config override by directory id; one resolver (`declaredSubgraph` → `resolveSubgraphSource`)
- [ ] Subgraph JSON-LD node carries resolved source (`contentSource`)
- [ ] generic subgraphContainer/memberOf helper; todos.jsonld container = declared todos Subgraph, todos gain inSubgraph (dcterms:isPartOf)
- [ ] gate: publisher of a declared subgraph without Subgraph node / members without isPartOf fails (subgraph-node.test.ts, subgraph-source.test.ts)
- [ ] skills (directory-conventions, content-context-and-state-graphs), process (kg/mount-subgraph.bpmn), tool (subgraph-resolve) updated
- [x] audit other generators minting their own collection node; one follow-up bean (r5wu)
- [x] interface comment on #1957; reader check on #1953
- [ ] follow-on PR merged with CI green

## Done when
PR merged-ready with CI green and the checklist above ticked.


## Summary of Changes

**Closed on evidence, 2026-10-06** (re-measured on main at 2fdbb5109a by session_01QSd18GZBc9NJNMy6GV9v7D, not quoted from earlier notes). Status history: never completed before, so not an owner reopen; no holder.

Follow-on #1987 merged 2026-10-03 with CI green. `source: SubgraphSourceSchema` is on ContentDirectory; instance-config overrides go through one resolver (`declaredSubgraph` → `resolveSubgraphSource`); `contentSource` is on the Subgraph node; todos.jsonld members use `inSubgraph` (its own term since bean 3f5f, superseding the box's dcterms:isPartOf wording); `mount-subgraph.bpmn`, both skills and the `subgraph-resolve` tool are present. subgraph-node and subgraph-source tests pass.
