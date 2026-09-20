---
# folio-assistant-kvsx
title: 'ARROW DIRECTION: 94% of KG edges point where the AUTHOR PUT THE POINTER, not where the dependency runs'
status: todo
type: bug
priority: critical
created_at: 2026-09-20T08:27:47Z
updated_at: 2026-09-20T08:27:47Z
parent: folio-assistant-kupb
---

Owner, 2026-09-20, one question: 'are arrows in wrong direction somewhere?' Yes. Measured the same hour. Parent is the epic because a bug may not hang off a task; the topic bean is `j79e` (detangle).

| extractor | cross-group edges | direction is |
|---|---|---|
| `bpmn-skill` | 340 | RECORDED |
| `json-skill` | 125 | RECORDED |
| `ts-import` | 28 | ENFORCED |
| `md-link` | 5 | RECORDED |

**470 of 498 cross-group edges -- 94% -- are RECORDED, not ENFORCED.**

THE DISTINCTION. An ENFORCED edge has a direction that is a FACT: reverse an `import` and the build breaks; reverse `calledElement` and the engine cannot find the process. A RECORDED edge has a direction that is a STORAGE CHOICE. `<folio:skill ref="S">` is written ON THE DIAGRAM, so the arrow runs diagram -> skill. Had the repository instead put `workflows: [...]` in each skill's front matter, the identical coupling would be stored the other way round and `skills/workflows` would measure as a SINK.

SO THE SOURCE/SINK VERDICTS ARE ARTEFACTS OF FILE LAYOUT for the two groups this whole discussion has been about:
- `skills/workflows` -- 0 in, 334 out, role `source`. All 334 are `bpmn-skill`.
- `skills/roles` -- 0 in, 122 out, role `source`. All 122 are `json-skill`, and `roles.json` is a REGISTRY. An index pointing at 122 things is not a heavy dependent; it is an index. The things it registers do not depend on it, and it does not USE them in any functional sense.

WHAT BREAKS EACH WAY is the test that settles whether a coupling is really directional. Delete a skill and `roles.json` has a dangling ref. Delete `roles.json` and every skill still works but no lane can reach one. BOTH break. The coupling is SYMMETRIC and merely written down once, on one side.

THIS IS A FAILURE AGENTS.md ALREADY NAMES ONE GRAPH OVER. 'Never populate `uses[]` from Lean -- it destroys the signal every ordering metric is computed from.' `uses[]` is the EDITORIAL relation, the Lean graph is the FORMAL one; they look alike, mean different things, and the rule exists because WHERE A FACT IS RECORDED determines what a metric over it means. `bpmn-skill` and `ts-import` are that same pair, unrecognised.

AND IT MEETS THE OWNER'S OTHER THREAD THE SAME DAY: 'rendering (jsutthedocs) can help by dynamic "see related" ... that looks at what KG content knows about that references that node.' A backlink IS the missing direction of a recorded edge, supplied at render time rather than authored twice. The same observation, arrived at from the reader's end instead of the metric's.

## Done when
- Every extractor declares `enforced` or `recorded`.
- `role` is computed from ENFORCED edges, or REFUSES and reports the boundary undetermined -- never computed over recorded edges as though they were facts. Same three-state rule as everywhere else here: 'could not determine' is not 'determined to be a source'.
- Recorded edges are reported as SYMMETRIC COUPLING with a count, which is a real finding, rather than as directed dependency.
- The `workflows` and `roles` verdicts are re-stated against the corrected model before either is carved.
