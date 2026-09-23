---
# folio-assistant-4pm8
title: 'PAGEFIND: evaluate as the search engine for the large-datasets subgraph'
status: todo
type: task
priority: normal
created_at: 2026-09-20T09:21:09Z
updated_at: 2026-09-23T02:45:00Z
parent: folio-assistant-5a3l
---

Owner, 2026-09-20: '4 bean up. for now give requrements/constraings/issues/pros/cons/otpons here only for analysis/discussion./ not durable.'

So this bean is the TRACKING ITEM and deliberately not the analysis. The requirements, constraints, pros, cons and options were given in chat for discussion and are explicitly NOT to be written into the repository yet. Recording that instruction here matters: the next agent finding a thin bean on a topic this size should know the thinness is a decision, not an omission.

WHY IT IS ON THE TABLE AT ALL. just-the-docs uses lunr.js, which loads the whole index and builds an in-memory inverted index in the browser. For a materialized full IRIS (~265k items, bounded from 1,057,223 files at ~3-4 files per item) that is ~53 MB on disk at title-and-url only, and roughly 150-500 MB in browser memory; with the theme's default content excerpts it is multiple GB. Packaging does not help — it moves the failure from 'cannot publish' to 'tab crashes on first search', which is worse because it fails at the reader rather than at the build.

DECIDED ALREADY, and this bean does not revisit it: search indexes ONLY materialized content (lunr), plus a prefix-sharded identifier lookup for referenced nodes, with delegation to the source as the fallback wherever `canDelegateSearch` says it is possible. Pagefind is a candidate to REPLACE the first two, not to sit beside them.

THE ONE CONSTRAINT THAT IS NOT NEGOTIABLE: the owner scoped the docs pipeline to 'no extensions. no fancy. no js (if possible)'. Pagefind is an extension and it is JavaScript. It is admissible ONLY inside the large-datasets subgraph, which is where the complicated stuff was explicitly scoped to live, and it must never become a dependency of the plain `docs` rendering.

## Done when
A decision is recorded with its basis — adopt, or decline and say what carries the case instead. Not before the prefix-sharded lookup has been built and MEASURED, since the whole question is whether that measurement leaves a gap.

---

## Re-parented off `kupb` 2026-09-23 — owner's ruling

Owner, 2026-09-22, on *"`kupb` has 12 open children and can't close, blocking
GOAL 3. Several aren't IRIS-catalogue work"*: **re-parent the non-catalogue
ones.** `kupb`'s Done-when is *"every child is closed"*, so a child that is not
about the IRIS catalogue holds GOAL 3 open for a reason unrelated to GOAL 3.

**Moved to `5a3l`.** PAGEFIND is a search-ENGINE choice. Which engine serves a large-datasets subgraph is a deployment/topology question, not a question about the IRIS catalogue.

**Nothing about this bean's own work changed** — not its status, not its
Done-when, not a line of its body above this note. Only the question *"whose
goal does finishing this serve?"* is answered differently.
