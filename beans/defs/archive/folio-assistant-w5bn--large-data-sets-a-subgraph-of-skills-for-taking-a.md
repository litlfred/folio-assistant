---
# folio-assistant-w5bn
title: 'LARGE DATA SETS: a subgraph of skills for taking a SUBSET of a corpus you will never hold — IRIS, mathlib, CODATA, weather'
status: completed
type: task
priority: critical
created_at: 2026-09-20T09:01:32Z
updated_at: 2026-09-23T18:44:43Z
parent: folio-assistant-zzmr
---

Owner, 2026-09-20, generalising away from IRIS:

> 'someone may want to pull in a few nodes of a large data set, IRIS, CODATA, cosomological, weather, whatever, need to know sources and how to get subsets of data, not acquire all. IRIS is one concrete example. lean-mathlib is another large corpus example. genealize processes.'

and, on where it belongs:

> 'maybe not core skill, sub-graph of skills to deal with "large data sets"'

THE CAPABILITY THAT IS MISSING IS NOT DOWNLOADING. `materialize-remote` already answers 'may we take this, and what does holding it cost'. It does NOT answer the question before it: **how do you enumerate a corpus, and how do you ask it for a SUBSET?** Every source answers that differently and none of it is guessable:

| corpus | enumerate | subset by |
|---|---|---|
| WHO IRIS | DSpace 7 REST `/server/api/discover` | community, collection, handle, MeSH subject |
| Lean mathlib | the module graph | import closure of a declaration |
| CODATA | dataset landing pages | quantity, epoch |
| weather reanalysis | catalogue services | bounding box, time range, variable |

Without a declared SOURCE DESCRIPTOR, an agent asked for 'the WPRO style guides' has to be told the API by a human every time, and the answer is not written anywhere.

MEASURED, why subsetting is the only option: IRIS is 1,057,223 files and 361.55 GB across 8 communities (its own storage report, 2026-09-20). Acquiring all is not a bigger version of acquiring three; it is a different activity with different everything.

## Done when
- A `large-datasets` named subgraph exists, with its own declaration.
- A SOURCE DESCRIPTOR schema: how to enumerate, how to subset, what identifiers the source mints, and what it costs to ask.
- IRIS is ONE worked descriptor, not the model. mathlib is the second, and it must be written before the abstraction is believed — one example is a special case with an interface drawn round it.
- `materialize-remote` CALLS this rather than restating it: enumerate/subset is upstream of the five gates.

---

## Re-parented off `kupb` 2026-09-23 — owner's ruling

Owner, 2026-09-22, on *"`kupb` has 12 open children and can't close, blocking
GOAL 3. Several aren't IRIS-catalogue work"*: **re-parent the non-catalogue
ones.** `kupb`'s Done-when is *"every child is closed"*, so a child that is not
about the IRIS catalogue holds GOAL 3 open for a reason unrelated to GOAL 3.

**Moved to `zzmr`.** Taking a SUBSET of a corpus you do not own is a KG-structure skill family. IRIS is the worked example, not the subject.

**Nothing about this bean's own work changed** — not its status, not its
Done-when, not a line of its body above this note. Only the question *"whose
goal does finishing this serve?"* is answered differently.

---

## Summary of Changes — checked and closed 2026-09-23

Owner's pick: **"w5bn check + close"**. Each done-when item was checked against
the files, not the bean's own claims. Two of the four did not hold, and both
were fixed before closing.

| Done-when item | Evidence |
|---|---|
| `large-datasets` subgraph with its own declaration | `large-datasets/large-datasets.json` (schemas, sources, skills) |
| a source-descriptor schema | `large-datasets/schemas/source-descriptor.ts`, `SourceDescriptorSchema` |
| IRIS **and** mathlib as worked descriptors | both in `large-datasets/sources/`. **mathlib FAILED its own schema**: it had an `_subsetIsSelfContained_note` key and the schema is `.strict()`. The owner chose a new optional `subsetBasis` field, and the note moved there word for word. |
| `materialize-remote` CALLS the descriptor | before this, only the skill's prose pointed at it. `materialize-remote.bpmn` now has **Task_Enumerate** before the SIZE gate: supported subset strategies, closure over dependencies when `subsetIsSelfContained` is false, and `enumerationCost()` undefined → SIZE refuses. |

**Why nobody noticed:** no gate read `sources/`. The new
`large-datasets/schemas/source-descriptor.test.ts` finds the directory through
the declaration and parses every descriptor. It was shown to fail on the
old mathlib file with the exact original error, then pass on the fixed one.
It also requires a `subsetBasis` wherever `subsetIsSelfContained` is false.

**Left open, not in this bean's done-when:** `large-datasets.json` declares no
`needs`, the same gap `detangle` and `kg-navigation` had (bean `byql`). It is
not scanned by `kg:detangle` today, so nothing reports it yet.
