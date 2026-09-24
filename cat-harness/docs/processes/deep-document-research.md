---
title: 'Deep document research'
nav_exclude: true
---

{: .note }
> Generated from `folio-assistant-core/processes/deep-document-research.bpmn` by `gen-processes-viz.ts` — do not edit here. [All processes](index.html)

{% raw %}
# Deep document research

`Process_DeepDocumentResearch` · advisory · 4 step(s)

Answer a question from a corpus this folio ALREADY HOLDS, iteratively, stopping on a stated condition. It begins after `library-ingestion` has filed the sources, `ingest-*` has derived their structure, and the L1 completeness gate has said they are fit to use. Nothing here acquires or parses anything: a question about a document nobody ingested is not answered by this process, it is refused by it. ADVISORY at the process level. The judgement it contains is which granularity fits a question and whether the evidence so far is sufficient, and neither is gateable — the whole reason the loop carries an iteration cap is that sufficiency may never arrive.

<img src="../assets/img/workflows/deep-document-research.svg" alt="BPMN diagram: Deep document research" style="max-width:100%">

## How it connects

- **Called by:** no call activity names this process
- **Calls:** none
- **Skill:** [`deep-document-research`](../reference/skill-instructions/deep-document-research.html)

## Lanes — who acts

| lane | role | what it does here |
|---|---|---|
| Deep researcher | `deep-researcher` | One lane for all four of the paper's agents, because they are one accountability: somebody stands behind the synthesis and its citations. Splitting them into four swimlanes would say that the party who chose the granularity is answerable separately from the party who reported the answer, which is not true and which no diagram here should assert. The role admits person and agent. Every step is drawn as a plain task rather than a userTask for that reason — an agent performing this is legitimate, and a userTask would assert a person the model does not require. |

## Steps

Every one of the 4 step(s) is documented.

| step | lane | skill / sub-process | what it does |
|---|---|---|---|
| **Filter the corpus, choose the granularity, decompose the question**<br>`A_Plan` | Deep researcher | [`deep-document-research`](../reference/skill-instructions/deep-document-research.html) | The paper's Planner. Three outputs, and the middle one is the method's substance: a filtered document subset, the granularity to search at, and the sub-questions. CHOOSING THE GRANULARITY PER QUESTION is the whole point of parsing at several. A broad question is answered from summaries and a specific one from chunks; a pipeline that picks once has answered every future question the same way. This checkout cannot yet offer the choice — `l1-blocks.ts` produces blocks, there is no summary level — so this step SAYS which granularity it searched rather than implying the corpus offered alternatives. Re-entered on every iteration, not only the first: the sub-questions are re-derived from what has been found so far, which is what makes the loop a search rather than a retry. |
| **Retrieve for each sub-question**<br>`A_Search` | Deep researcher | [`deep-document-research`](../reference/skill-instructions/deep-document-research.html) | The paper's Searcher, at the granularity A_Plan chose. Which retrieval paradigm — text-only, vision-only or hybrid — is recorded in the methodology node as an open trade-off rather than settled here: the paper's comparison was measured on its own corpus and says nothing about a folio's. |
| **Deduplicate, and keep what is actually relevant**<br>`A_Refine` | Deep researcher | [`deep-document-research`](../reference/skill-instructions/deep-document-research.html) | The paper's Refiner. Accumulates into the evidence set the report is built from — so what is dropped here is invisible downstream, which is why it is a step somebody performs rather than a filter buried in retrieval. |
| **Synthesise, cite to a location, and say what was not found**<br>`A_Report` | Deep researcher | [`deep-document-research`](../reference/skill-instructions/deep-document-research.html) | The paper's Reporter, with two obligations it does not state. CITE TO A LOCATION, not to a document — the page and bounding box the parse preserved, so a reader verifies a claim where it was made rather than being sent to a PDF. AND SAY WHAT WAS NOT FOUND. The failure this method makes easy is that a search which ended quietly looks exactly like one that succeeded. Sub-questions that returned nothing are reported, distinguishing "not in the corpus" from "not found by this search" — only the first is a fact about the folio. A figure description an agent drafted is NOT reported as what the figure shows. `schemas/narrative.ts` holds that line and this step does not cross it. |

## Decisions

Every one of the 2 decision(s) is documented.

| decision | what decides it | branches |
|---|---|---|
| **Is the corpus there to search?**<br>`GW_Held` | Computable, and deliberately carries neither `folio:decision` nor `folio:judgement`: whether the library holds entries whose L1 completeness verdict is `met` is a fact about the checkout, so calling it a judgement would be false. Nothing computes it yet, which puts it in the DMN column rather than this one — the "no table because nobody has written one" state bean `q0tc` counts. Leaving here is the correct outcome, not a failure. A question about documents nobody ingested has an answer — "this corpus does not hold them" — and that answer is not produced by searching harder. | **held** → Filter the corpus, choose the granularity, decompose the question<br>**not held** → Not held — a question for library-ingestion |
| **Enough, or out of iterations?**<br>`GW_Sufficient` | TWO ways out, and both are load-bearing. Sufficiency alone never terminates on a question the corpus cannot answer, which is the ordinary case rather than the exception. The iteration cap alone stops an answerable question early and returns something indistinguishable from a complete answer. A loop carrying one of them is a different method with a failure mode this one does not have. WHICH ONE FIRED IS CARRIED TO THE REPORT. An answer that hit the cap is an answer with known gaps; one that reached sufficiency is not. A report that does not distinguish them hands the reader a confidence nobody established. | **not yet, and iterations remain** → Filter the corpus, choose the granularity, decompose the question<br>**sufficient** → Synthesise, cite to a location, and say what was not found<br>**out of iterations** → Synthesise, cite to a location, and say what was not found |

{% endraw %}
