---
# folio-assistant-cjvs
title: '190 dangling refs in the KG: 137 ts-import, 28 md-link, 25 bpmn-skill'
status: todo
type: bug
created_at: 2026-09-26T06:33:48Z
updated_at: 2026-09-26T06:33:48Z
parent: folio-assistant-vke6
---

`bun run kg:detangle`, measured 2026-09-26 on `main`:

```
Detangle — 697 nodes, 2828 edges, 190 dangling
```

Breakdown, from the tool's own JSON rather than from prose:

| via | count |
|---|---|
| `ts-import` | 137 |
| `md-link` | 28 |
| `bpmn-skill` | 25 |

A dangling ref is a link-shaped value that does not dereference — bean `blv9`
— at scale, in the graph the whole separation effort is computed over.

## Why this matters for the split rather than being tidying

Every separation metric is computed over these edges. `check:partition`
reports 0 wrong-direction across 1143 modules and `kg:detangle` reports 1
across 28 groups, and **both numbers are computed over a graph with 190 edges
that go nowhere.** Whether a dangling edge would have been a cross-edge, a
wrong-direction edge, or nothing at all is not knowable from the count.

So "0 wrong-direction" is 0 *among the edges that resolve*. That is not the
same claim, and nothing currently says which one is being made.

## The surprising bucket

**137 of 190 are `ts-import`** — not markdown rot, which is the usual shape of
this defect, but TypeScript imports the scanner could not resolve. That could
be scanner limitation (path aliases, `.js` extensions on `.ts` sources, barrel
re-exports) rather than genuinely broken imports, and the two have opposite
remedies. `tsc --noEmit` is clean on `main`, which is evidence for the first
reading: a real broken import would not typecheck.

Sample, `md-link`:

```
from: cat-harness/skills/authoring-who-smart-guidelines/grade.md
ref:  ../../methodologies/dmn.md
```

## Done when

- [ ] The 137 `ts-import` entries are split into scanner limitation vs genuinely
      unresolvable — the first is a fix to the scanner, the second to the code,
      and reporting them as one number hides which.
- [ ] `kg:detangle` says whether its wrong-direction count is over all edges or
      only the resolving ones. Today a reader cannot tell.
- [ ] The 28 `md-link` and 25 `bpmn-skill` entries are each fixed or recorded
      with a reason.

## Not claimed

Found while answering *"where are we in code separation"* (2026-09-26). Recorded
and left `todo`; the session that found it was working `1xhc`'s CI cluster and
deliberately did not pivot.
