---
# folio-assistant-kvsx
title: 'ARROW DIRECTION: 94% of KG edges point where the AUTHOR PUT THE POINTER, not where the dependency runs'
status: completed
type: bug
priority: critical
created_at: 2026-09-20T08:27:47Z
updated_at: 2026-09-21T10:10:00Z
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

THE DISTINCTION. An ENFORCED edge has a direction that is a FACT: reverse an `import` and the build breaks; reverse `calledElement` and the engine cannot find the process. A RECORDED edge has a direction that is a STORAGE CHOICE. `<folio:skill ref="S">` is written ON THE DIAGRAM, so the arrow runs diagram -> skill. Had the repository instead put `workflows: [...]` in each skill's front matter, the identical coupling would be stored the other way round and `processes` would measure as a SINK.

SO THE SOURCE/SINK VERDICTS ARE ARTEFACTS OF FILE LAYOUT for the two groups this whole discussion has been about:
- `processes` -- 0 in, 334 out, role `source`. All 334 are `bpmn-skill`.
- `scenarios` -- 0 in, 122 out, role `source`. All 122 are `json-skill`, and `roles.json` is a REGISTRY. An index pointing at 122 things is not a heavy dependent; it is an index. The things it registers do not depend on it, and it does not USE them in any functional sense.

WHAT BREAKS EACH WAY is the test that settles whether a coupling is really directional. Delete a skill and `roles.json` has a dangling ref. Delete `roles.json` and every skill still works but no lane can reach one. BOTH break. The coupling is SYMMETRIC and merely written down once, on one side.

THIS IS A FAILURE AGENTS.md ALREADY NAMES ONE GRAPH OVER. 'Never populate `uses[]` from Lean -- it destroys the signal every ordering metric is computed from.' `uses[]` is the EDITORIAL relation, the Lean graph is the FORMAL one; they look alike, mean different things, and the rule exists because WHERE A FACT IS RECORDED determines what a metric over it means. `bpmn-skill` and `ts-import` are that same pair, unrecognised.

AND IT MEETS THE OWNER'S OTHER THREAD THE SAME DAY: 'rendering (jsutthedocs) can help by dynamic "see related" ... that looks at what KG content knows about that references that node.' A backlink IS the missing direction of a recorded edge, supplied at render time rather than authored twice. The same observation, arrived at from the reader's end instead of the metric's.

## Done when
- Every extractor declares `enforced` or `recorded`.
- `role` is computed from ENFORCED edges, or REFUSES and reports the boundary undetermined -- never computed over recorded edges as though they were facts. Same three-state rule as everywhere else here: 'could not determine' is not 'determined to be a source'.
- Recorded edges are reported as SYMMETRIC COUPLING with a count, which is a real finding, rather than as directed dependency.
- The `workflows` and `roles` verdicts are re-stated against the corrected model before either is carved.

## Re-measured 2026-09-21 — the model ALREADY LANDED, and it went further

Claimed this to build it and found it built. Every bullet above checked against
the tree rather than taken from the bean, because the bean was written before
`detangle/` existed as committed code and its own table names four extractors
that are not identifiers anywhere in `cat-harness/`.

**Where it actually lives:** `detangle/` — its own instance, with
`harness.json`, `schemas/detangle.ts` and `scripts/kg-detangle.ts`. Nothing in
`cat-harness/` mentions the extractors, which is why a search there finds
nothing and reads as "unbuilt".

| Done-when | state | evidence |
|---|---|---|
| every extractor declares enforced or recorded | **done, and extended** | `EdgeAuthority` is THREE states — `enforced \| recorded \| prose` — and `AUTHORITY` declares **8** extractors, not the 4 this bean lists. `bpmn-call`, `bpmn-import`, `bpmn-decision` were added as `enforced`. |
| role computed from ENFORCED edges, or REFUSES | **done** | `DetangleMetrics.enforcedBoundary`, documented *"`role` is read off these ALONE"*. `undetermined` is a real value in the report. |
| recorded edges reported as SYMMETRIC COUPLING with a count | **done** | `recordedBoundary`, documented in exactly those words, and the verdict clause prints *"all N boundary edges are RECORDED … `${m.inbound}` in / `${m.outbound}` out describes the filing, not the coupling."* |
| the workflows and roles verdicts re-stated | **done** | Both now read `undetermined`. `processes` 0 in / 387 out, `scenarios` 0 in / 222 out — the counts this bean called source-shaped, no longer reported as `source`. |

`detangle/` is also in `tsconfig.json` now, so the TS2322 its own comment
records as uncaught is caught today. That gap closed too.

## What was actually wrong, and is fixed here

**`AUTHORITY[via] ?? "recorded"` — a silent default on the one axis that must
not have one.**

Measured before touching it: the `via` values the extractors emit and the keys
`AUTHORITY` declares are **exactly equal, 8 and 8**, so the fallback was
unreachable and silenced nothing today. That is precisely what makes it worth
removing — bullet 1 was true by COINCIDENCE rather than by construction, which
is the `6tkl` shape: a clause that cannot fail cannot tell you anything.

It is not a neutral default either. `recorded` is the value that makes a
boundary edge stop counting toward `role`, so a new `enforced` extractor
landing under the fallback would turn real directed dependencies into
`undetermined` verdicts — and the report would look exactly as it does when the
analysis is right.

`authorityOf()` now refuses, naming the extractor and the three values it may
declare. Falsified by removing `md-link` from `AUTHORITY`:

    rc=1
    error: kg-detangle: extractor 'md-link' declares no authority. Add it to
    AUTHORITY in this file as 'enforced' ... Defaulting would file it as
    'recorded' and silently drop it from every role verdict.

## The finding this turned up, which is NOT this bean's

**Nothing runs `kg-detangle.ts`.** No npm script, no gate, no workflow. The
`detangler` hits in `qa-sweep.yml` and `witness-pipeline.yml` are the unrelated
CONTENT QA axis of the same name. So the model above is correct and unexercised,
and a regression in it is invisible — `xom7` one level out.

`kg:detangle` is added here so the tool is at least runnable by name. It is
deliberately NOT added to `gates`: it is an analysis that reports
*"Nothing here decides anything"*, and a gate that cannot fail is the thing
this repository keeps paying for. What it needs is a different question —
whether a committed sidecar should pin the verdicts the way `kg:audit` does —
and that is its own bean, not a line item here.

82 gates pass.

## Summary of Changes

Merged in #674 (`ce71f60`).

**The model was already built** — in `detangle/`, its own instance. This bean
predates that code and names four extractors that are not identifiers anywhere
in `cat-harness/`, which is why searching there reads as unbuilt. All four
"Done when" bullets were already satisfied, two beyond what was asked:
`EdgeAuthority` is three states over eight extractors, not two over four, and
`processes` / `scenarios` both read `undetermined` rather than
`source` — the exact re-statement demanded.

**What was actually wrong, and is fixed:** `AUTHORITY[via] ?? "recorded"`, a
silent default on the one axis that must not have one. Measured first — the
emitted `via` values and the declared keys are exactly equal, 8 and 8 — so the
fallback was unreachable and silenced nothing. That is what made it worth
removing: the requirement that every extractor DECLARES was true by coincidence
rather than construction, which is the `6tkl` shape. `recorded` is not a
neutral guess either: it is the value that stops a boundary edge counting
toward `role`. `authorityOf()` now refuses, falsified by removing `md-link`
(rc=1, actionable message).

Follow-up: `sb6z` — nothing RUNS `kg-detangle.ts`, so the model is correct and
unexercised. `kg:detangle` was added here for discoverability, deliberately not
gated.
