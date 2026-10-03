---
title: "Methodologies"
description: "The methodologies this repository has adopted — what each is for, where it came from, and whether the source it rests on is held here."
renders:
  - cat-harness/methodologies
  - folio-assistant-core/methodologies
  - folio-assistant-sci/methodologies
  - smart-base/methodologies
rendered-by: methodologies-viewer
---
<style>
.mv-tag{display:inline-block;padding:.05rem .4rem;border-radius:3px;font-size:.72rem;
  font-weight:600;white-space:nowrap;border:1px solid currentColor}
/* Bean rtuo: light-page inks measured 2.06-2.71:1 on the default dark page
   (#27262b). Dark inks by default; the light scheme keeps the originals. */
.mv-ingested{color:#5cd3bd}  /* 8.23:1 on #27262b */
.mv-cited{color:#e6bd52}     /* 8.41:1 */
.mv-dangling{color:#ff9486}  /* 7.03:1 */
:root[data-fa-scheme="light"] .mv-ingested{color:#0d6e5e}
:root[data-fa-scheme="light"] .mv-cited{color:#8a6100}
:root[data-fa-scheme="light"] .mv-dangling{color:#a8200f}
.mv-grid{display:flex;flex-wrap:wrap;gap:.75rem;margin:1rem 0}
.mv-stat{flex:1 1 8rem;border:1px solid rgba(128,128,128,.35);border-radius:6px;padding:.5rem .7rem}
.mv-stat b{display:block;font-size:1.25rem;line-height:1.2}
.mv-stat span{font-size:.75rem;opacity:.75}
</style>

A **methodology** here is somebody else's named, external work that this
repository has adopted — a decision method, a responsibility matrix, an
evidence framework. That is the line `methodology-adoption` draws: a method
with no external origin is a *house process*, and belongs in `skills/`
written as one rather than dressed as an adoption.

So every node below carries an **origin**. Whether this checkout also holds
the source that origin names is a separate question, and the one the third
column answers.

<div class="mv-grid">
<div class="mv-stat"><b>25</b><span>adopted methodologies</span></div>
<div class="mv-stat"><b>22</b><span>with the source held here</span></div>
<div class="mv-stat"><b>3</b><span>cited, not ingested</span></div>
<div class="mv-stat"><b>4</b><span>instance(s) declaring the graph</span></div>
</div>

## Choosing one

`applies-when` is what a selection question matches against, so it is the
column to read first. A methodology whose applicability is unstated is one an
agent picks by resemblance, which is why the schema requires the field.

| methodology | applies when | origin held? | declared by |
|---|---|---|---|
| **[Adequacy-for-purpose modelling — a model is judged against what it is FOR, not against reality](#adequacy-for-purpose-modelling)**<br>`adequacy-for-purpose-modelling` | **A formal model is being built, and somebody will later ask whether it is right.** Use it when the artefact is a mathematical model of a process — a… | <span class="mv-tag mv-ingested">source held</span> | `cat-harness` |
| **[Bidirectional agentic autoformalization — extract, compile-fix, check faithfulness, then informalize back without the source](#bidirectional-agentic-autoformalization)**<br>`bidirectional-agentic-autoformalization` | **A whole paper, not a single theorem, is being formalised with an agent doing the Lean**, and the question is how to organise the run: what to extra… | <span class="mv-tag mv-ingested">source held</span> | `folio-assistant-sci` |
| **[Blueprint-driven formalization — Lean as the single source of dependency and status, the blueprint node as the unit of work](#blueprint-driven-formalization)**<br>`blueprint-driven-formalization` | **A formalization is large enough that its state has to be tracked node by node** — many interdependent definitions and theorems, several contributor… | <span class="mv-tag mv-ingested">source held</span> | `folio-assistant-sci` |
| **[Consensus-grounded subject evaluation — independent indexers as the answer key, and a panel instead of one score](#consensus-grounded-subject-evaluation)**<br>`consensus-grounded-subject-evaluation` | **Judging how good a set of controlled-vocabulary assignments is, when qualified people would themselves disagree about the exact answer.** Use it to… | <span class="mv-tag mv-ingested">source held</span> | `cat-harness` |
| **[Correspondence analysis for retrieval — decompose the departure from independence, not the counts](#correspondence-analysis)**<br>`correspondence-analysis` | … | <span class="mv-tag mv-ingested">source held</span> | `cat-harness` |
| **[DIIG — Digital Implementation Investment Guide](#diig)**<br>`diig` | Planning, costing and monitoring a DIGITAL HEALTH IMPLEMENTATION inside a health programme — from forming the team through to the budget and the moni… | <span class="mv-tag mv-ingested">source held</span> | `smart-base` |
| **[DMN — Decision Model and Notation](#dmn)**<br>`dmn` | The criteria RECUR and the inputs are data. A gateway that must branch the same way on the same facts every time. Not for a one-off judgement — that… | <span class="mv-tag mv-ingested">source held</span> | `cat-harness` |
| **[Doc-Researcher — parse for multiple granularities, then research iteratively against a sufficiency threshold](#doc-researcher)**<br>`doc-researcher` | **A question must be answered from documents this folio has ingested, and one retrieval pass will not do it.** Use it when the answer is spread acros… | <span class="mv-tag mv-ingested">source held</span> | `folio-assistant-core` |
| **[Hybrid LLM/deterministic — the model proposes a RULE, machinery validates and runs it](#hybrid-llm-deterministic)**<br>`hybrid-llm-deterministic` | **An agent must produce an artefact that something downstream will act on.** Use it when a language model is in the loop and a wrong output would be… | <span class="mv-tag mv-ingested">source held</span> | `cat-harness` |
| **[JSON-LD 1.1 — the knowledge graph serialised as Linked Data in plain JSON](#json-ld-serialisation)**<br>`json-ld-serialisation` | … | <span class="mv-tag mv-ingested">source held</span> | `cat-harness` |
| **[Kepner-Tregoe Decision Analysis](#kepner-tregoe)**<br>`kepner-tregoe` | A decision with several candidate options and no recurring rule — a platform choice, an architecture question, which of three fixes to take. Contextu… | <span class="mv-tag mv-cited">cited, not ingested</span> | `cat-harness` |
| **[Latent Semantic Indexing — retrieve and relate by co-occurrence structure, not by shared words](#lsi)**<br>`lsi` | … | <span class="mv-tag mv-ingested">source held</span> | `cat-harness` |
| **[MADR — Markdown Architectural Decision Records](#madr)**<br>`madr` | **Bean context** — the owner's binding, 2026-09-20. When a bean records a decision, this is the form. Not for the decision METHOD (see… | <span class="mv-tag mv-cited">cited, not ingested</span> | `cat-harness` |
| **[Aggregation-type MCDM — an alternatives-criteria matrix collapsed to one score per alternative](#mcdm-aggregation)**<br>`mcdm-aggregation` | **A FIXED, FINITE set of alternatives is to be ranked against several explicit criteria, all known up front.** The input is an alternatives-criteria… | <span class="mv-tag mv-ingested">source held</span> | `cat-harness` |
| **[ODRL 2.2 — what a party may do, as permission and prohibition rules over actions](#odrl-policies)**<br>`odrl-policies` | **What an actor may DO — may this party perform this action, here?** Use it when a grant or a refusal has to be written down so a machine can evaluat… | <span class="mv-tag mv-ingested">source held</span> | `cat-harness` |
| **[Probabilistic decision-making algorithms — and what their regret bounds are claims ABOUT](#probabilistic-decision-analysis)**<br>`probabilistic-decision-analysis` | **The alternatives can be TRIED, repeatedly, and what you learn from one try changes what you should try next.** Bandits, Bayesian optimisation and t… | <span class="mv-tag mv-ingested">source held</span> | `cat-harness` |
| **[Process-driven autoformalization — judge a formalised statement by compiling it WITH a proof, and read the first error as the step signal](#process-driven-autoformalization)**<br>`process-driven-autoformalization` | **A natural-language statement is being turned into a Lean statement and the question is how to test the candidate**, or… | <span class="mv-tag mv-ingested">source held</span> | `folio-assistant-sci` |
| **[PROV-O — the record of who did what, in which role, under which plan](#prov-o-provenance)**<br>`prov-o-provenance` | … | <span class="mv-tag mv-ingested">source held</span> | `cat-harness` |
| **[RACI — who is involved in an activity, and in which of four ways](#raci)**<br>`raci` | **Who is involved in an activity, and how.** Use it when a process or a breakdown exists and the question is participation — who answers for this, wh… | <span class="mv-tag mv-ingested">source held</span> | `cat-harness` |
| **[RASCI — RACI plus Supportive, for when doing the work and owning it come apart](#rasci)**<br>`rasci` | **Who is involved, when a role does the work without owning the deliverable.** Use it where a separate *Supportive* party is real — someone who contr… | <span class="mv-tag mv-cited">cited, not ingested</span> | `cat-harness` |
| **[Skill-pipeline subject indexing — one policy-grounded stage per cognitive step, each output inspectable](#skill-pipeline-subject-indexing)**<br>`skill-pipeline-subject-indexing` | … | <span class="mv-tag mv-ingested">source held</span> | `cat-harness` |
| **[SPDX 3 — a bill of materials as a graph of elements, for what crosses a trust boundary](#spdx-3)**<br>`spdx-3` | … | <span class="mv-tag mv-ingested">source held</span> | `cat-harness` |
| **[Specification-compiled agents — the control flow comes from the diagram, not from the model's plan](#specification-compiled-agents)**<br>`specification-compiled-agents` | **A process is already written down as a diagram, and something must now EXECUTE it.** Use it when the control flow is external and authored — a BPMN… | <span class="mv-tag mv-ingested">source held</span> | `cat-harness` |
| **[SWOT — situation analysis over internal and external factors](#swot)**<br>`swot` | **Situation analysis, before a decision — never instead of one.** Use it to assemble what is true about a subject's internal attributes and its exter… | <span class="mv-tag mv-ingested">source held</span> | `cat-harness` |
| **[WireGen: wireframing from a written design intent](#wiregen)**<br>`wiregen` | Designing a USER INTERFACE, for example a page layout, a navigation scheme or a visualiser, where the choice between candidate designs has to be revi… | <span class="mv-tag mv-ingested">source held</span> | `cat-harness` |

## Where each one came from

The three states are different facts and are kept apart deliberately.
**Source held** means an `evidence:` reference resolves to a document in a
declared library — you can open it from this checkout. **Cited, not
ingested** means the node names an origin and nobody has fetched it; that is
an open question, reported by `check:methodology-evidence` and gated by
nothing. **Citation does not resolve** is neither: the node claims a source
and the slug names nothing, which reads as evidence in every listing and is
strictly worse than declaring none.

### Adequacy-for-purpose modelling — a model is judged against what it is FOR, not against reality

<a id="adequacy-for-purpose-modelling"></a>

`adequacy-for-purpose-modelling` — declared by `cat-harness` — <span class="mv-tag mv-ingested">source held</span>

**Applies when.** **A formal model is being built, and somebody will later ask whether it is right.** Use it when the artefact is a mathematical model of a process — agents, action and reward spaces, update rules — and the question is what the model is allowed to claim. It answers *what would count as this model succeeding*, and nothing else. Reach for it BEFORE the model is written, because its whole force is that the purpose is declared first and the evaluation follows from it. Reaching for it afterwards turns it into a defence of whatever the model happens to do. Do NOT reach for it to choose between options (`kepner-tregoe`), to grade evidence, to settle a recurring rule (`dmn`), or to pick an algorithm (`probabilistic-decision-analysis`, `mcdm-aggregation`). It is not a decision method at all: it is a rule for judging a model, and it is filed here because `methodology-adoption` routes "how do we evaluate X" to a methodology node.

**Origin.** Kavya Ravichandran, "Algorithmic Approaches to Sequential Decision-Making and Social Epistemology", PhD thesis, Toyota Technological Institute at Chicago, August 2026; arXiv:2607.20636v1 [cs.DS], 22 July 2026. Chapter 5, "Why Algorithmic Approaches" — an essay inside the thesis rather than a result of it. Open access, ingested whole. The view it builds on is Wendy Parker's (2020) "adequacy-for-purpose", quoted directly in that chapter; the how-possibly / how-actually distinction is from the philosophy-of-explanation literature the chapter cites, and the confirmatory / applied prediction split is Elliott-Graves'. Ravichandran's contribution adopted here is the ORDERED three-purpose taxonomy and the evaluation rule that follows from it.

**Ingested sources:**

- [`library/arxiv-2607.20636v1`](../cat-harness/library/cat-harness/#cat-harness%2Farxiv-2607.20636v1) · [item page](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/library/arxiv-2607.20636v1/README.md) · [source](https://arxiv.org/abs/2607.20636v1)

### Bidirectional agentic autoformalization — extract, compile-fix, check faithfulness, then informalize back without the source

<a id="bidirectional-agentic-autoformalization"></a>

`bidirectional-agentic-autoformalization` — declared by `folio-assistant-sci` — <span class="mv-tag mv-ingested">source held</span>

**Applies when.** **A whole paper, not a single theorem, is being formalised with an agent doing the Lean**, and the question is how to organise the run: what to extract first, how the compile-fix loop is bounded, what happens to a statement the agent cannot prove, and how a mathematician who does not read Lean reviews what came out. Do NOT use it to decide that a formalisation is faithful because the pipeline's own faithfulness step said so (see §3 and §"Refusals"). Not for choosing an axiom policy — this platform already has one, and it is stricter.

**Origin.** Yuanjie Ren, Jinzheng Li and Yidi Qi, "MerLean: An Agentic Framework for Autoformalization in Quantum Computation" (arXiv:2602.16554v1 [cs.LO], Massachusetts Institute of Technology and Northeastern University, 18 February 2026). Open access. A SYSTEM paper: it reports one agent pipeline run on three quantum-computing papers. What is adopted below is the method; several of its steps are REFUSED here, and §"Refusals" says which and why.

**Ingested sources:**

- [`library/arxiv-2602.16554v1`](../cat-harness/library/folio-assistant-sci/#folio-assistant-sci%2Farxiv-2602.16554v1) · [item page](https://github.com/litlfred/folio-assistant/blob/main/folio-assistant-sci/library/arxiv-2602.16554v1/README.md) · [source](https://arxiv.org/abs/2602.16554v1)

### Blueprint-driven formalization — Lean as the single source of dependency and status, the blueprint node as the unit of work

<a id="blueprint-driven-formalization"></a>

`blueprint-driven-formalization` — declared by `folio-assistant-sci` — <span class="mv-tag mv-ingested">source held</span>

**Applies when.** **A formalization is large enough that its state has to be tracked node by node** — many interdependent definitions and theorems, several contributors or agents, and partial progress that someone must be able to read at a glance. Use it to decide where dependency and completion status are RECORDED and who may write them, and to decompose a target into units an automated prover can attempt one at a time. Do NOT use it to decide whether a Lean statement says what the prose says: a blueprint records that a node is `sorry`-free, never that it is faithful. That question belongs to the equivalence and vacuity audits, and this method makes it MORE pressing, not less (see §4). Not for a single-theorem formalization, where the graph has one node and the bookkeeping costs more than it saves.

**Origin.** Thomas Zhu, Pietro Monticone, Jeremy Avigad and Sean Welleck, "LeanArchitect: Automating Blueprint Generation for Humans and AI" (arXiv:2601.22554v1 [cs.LO], Carnegie Mellon University and University of Trento, 30 January 2026). Open access. The blueprint itself is older and is not this paper's: it is Patrick Massot's `leanblueprint` (2020), a plasTeX plugin whose `\uses`, `\lean` and `\leanok` macros this paper builds on (its §2, ref. [16]). `leanblueprint` is NOT ingested here, so everything this node says about it is SECOND-HAND, through the LeanArchitect paper. The LeanArchitect paper is a TOOL paper: it presents a method through one Lean package. What is adopted below is the method; §"Where this rendering stops" says which parts were left behind.

**Ingested sources:**

- [`library/arxiv-2601.22554v1`](../cat-harness/library/folio-assistant-sci/#folio-assistant-sci%2Farxiv-2601.22554v1) · [item page](https://github.com/litlfred/folio-assistant/blob/main/folio-assistant-sci/library/arxiv-2601.22554v1/README.md) · [source](https://arxiv.org/abs/2601.22554v1)

### Consensus-grounded subject evaluation — independent indexers as the answer key, and a panel instead of one score

<a id="consensus-grounded-subject-evaluation"></a>

`consensus-grounded-subject-evaluation` — declared by `cat-harness` — <span class="mv-tag mv-ingested">source held</span>

**Applies when.** **Judging how good a set of controlled-vocabulary assignments is, when qualified people would themselves disagree about the exact answer.** Use it to evaluate a subject-indexing system, compare two of them, or decide whether one is good enough to draft for a human reviewer. It is also for any labelling task whose gold standard is expert judgement with a subjective surface. It answers *how to measure*. It does not answer *how to produce the assignment*, which is `skill-pipeline-subject-indexing`, a parallel node. Not for certainty of evidence behind a recommendation (`grade`), and not for choosing among options (`kepner-tregoe`). Not applicable where the answer is decidable, meaning a single correct output a checker can verify, because then there is no disagreement for a consensus to absorb.

**Origin.** Kwok Leong Tang, "LCSHBench: A Multilingual, Consensus-Grounded Benchmark for Library of Congress Subject Heading Assignment" (arXiv:2606.04382v1), 2026. Open access, ingested whole and read before this node was written. The method is rendered from that paper. The parallel design it is contrasted with is the one used by the shared task the other ingested subject-indexing papers were entered in: D'Souza, Sadruddin, Israel, Begoin & Slawig, "SemEval-2025 Task 5: LLMs4Subjects — LLM-based Automated Subject Tagging for a National Technical Library's Open-Access Catalog" (arXiv:2504.07199v3), TIB Hannover. It was ingested and read too, so that design is described from its own text.

**Ingested sources:**

- [`library/arxiv-2606.04382v1`](../cat-harness/library/cat-harness/#cat-harness%2Farxiv-2606.04382v1) · [item page](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/library/arxiv-2606.04382v1/README.md) · [source](https://arxiv.org/abs/2606.04382v1)
- [`library/arxiv-2504.07199v3`](../cat-harness/library/cat-harness/#cat-harness%2Farxiv-2504.07199v3) · [item page](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/library/arxiv-2504.07199v3/README.md) · [source](https://arxiv.org/abs/2504.07199v3)

### Correspondence analysis for retrieval — decompose the departure from independence, not the counts

<a id="correspondence-analysis"></a>

`correspondence-analysis` — declared by `cat-harness` — <span class="mv-tag mv-ingested">source held</span>

**Applies when.** **The same question as `lsi` — which units of a prose graph are close in what they are about — when the answer must not be dominated by how LONG a unit is or how COMMON a term is.** CA removes those margins by construction, so it is the method to reach for when LSI's first dimensions are margins (a first dimension with no negative pole) or when the question is which units are UNUSUAL — outlier pages, specimen text, a list among prose. It answers *which units have similar term profiles, relative to independence*. Like `lsi`, every output is a PROPOSAL. Not for choosing between the two methods by blending them (`methodology-adoption` §"Parallel, not composable"), not for a controlled vocabulary (`skill-pipeline-subject-indexing`), and not for any decision.

**Origin.** Correspondence analysis is Jean-Paul Benzécri's (L'Analyse des Données, 1973) and is set out in Michael Greenacre, Theory and Applications of Correspondence Analysis (Academic Press, 1984) and Correspondence Analysis in Practice (3rd ed., 2017). Its application to information retrieval, and the comparison with latent semantic analysis this node rests on, is Qianqian Qi, David J. Hessen and Peter G. M. van der Heijden, "Improving information retrieval through correspondence analysis instead of latent semantic analysis", Journal of Intelligent Information Systems (2023), doi:10.1007/s10844-023-00815-y — open access, ingested whole and read.

**Ingested sources:**

- [`library/qi-hessen-vanderheijden-2023-ca-vs-lsa`](../cat-harness/library/cat-harness/#cat-harness%2Fqi-hessen-vanderheijden-2023-ca-vs-lsa) · [item page](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/library/qi-hessen-vanderheijden-2023-ca-vs-lsa/README.md) · [source](https://doi.org/10.1007/s10844-023-00815-y)

### DIIG — Digital Implementation Investment Guide

<a id="diig"></a>

`diig` — declared by `smart-base` — <span class="mv-tag mv-ingested">source held</span>

**Applies when.** Planning, costing and monitoring a DIGITAL HEALTH IMPLEMENTATION inside a health programme — from forming the team through to the budget and the monitoring plan. It is a programme-investment method, not a judgement method: it does not grade evidence (that is `grade`), does not choose between design options (`kepner-tregoe`), and does not constrain how a decision is recorded (`madr`). Reach for it when the question is *what shall we build, with whom, at what cost, and how will we know it worked* — and specifically when the answer has to survive a funder.

**Origin.** World Health Organization, International Telecommunication Union and the United Nations Foundation Digital Health Initiative, *Digital implementation investment guide (DIIG): integrating digital interventions into health programmes* (2020), ISBN 978-92-4-001056-7. Ingested at `smart-base/library/9789240010567-eng/`; every citation below resolves to a section there.

**Ingested sources:**

- [`library/9789240010567-eng`](../cat-harness/library/smart-base/#smart-base%2F9789240010567-eng) · [item page](https://github.com/litlfred/folio-assistant/blob/main/smart-base/library/9789240010567-eng/README.md)

### DMN — Decision Model and Notation

<a id="dmn"></a>

`dmn` — declared by `cat-harness` — <span class="mv-tag mv-ingested">source held</span>

**Applies when.** The criteria RECUR and the inputs are data. A gateway that must branch the same way on the same facts every time. Not for a one-off judgement — that is `kepner-tregoe`, recorded per `madr`.

**Origin.** Object Management Group, Decision Model and Notation (DMN) Version 1.5, OMG document formal/24-01-01, January 2024 (omg.org/spec/DMN). RECORDED, not held: its licence forbids posting copies on a network, so the library entry identifies the exact PDF (sha256) and its outline and holds no text.

**Ingested sources:**

- [`library/omg-2024-dmn-1-5`](../cat-harness/library/cat-harness/#cat-harness%2Fomg-2024-dmn-1-5) · [item page](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/library/omg-2024-dmn-1-5/README.md)

### Doc-Researcher — parse for multiple granularities, then research iteratively against a sufficiency threshold

<a id="doc-researcher"></a>

`doc-researcher` — declared by `folio-assistant-core` — <span class="mv-tag mv-ingested">source held</span>

**Applies when.** **A question must be answered from documents this folio has ingested, and one retrieval pass will not do it.** Use it when the answer is spread across several documents, or across text and figures within one, or when the asker will follow up. It answers *how to search a corpus you already hold*, never *what to hold* — `library-ingestion` and the L1 completeness gate answer that, and this method assumes their output. Do NOT reach for it for a single lookup in a known document. The loop below costs iterations, and a method whose cheapest path is more expensive than reading the page is the wrong method.

**Origin.** Kuicai Dong, Shurui Huang, Fangda Ye, Wei Han, Zhi Zhang, Dexun Li, Wenjun Li, Qu Yang, Gang Wang, Yichao Wang, Chen Zhang and Yong Liu, "Doc-Researcher: A Unified System for Multimodal Document Parsing and Deep Research" (arXiv:2510.21603v1, Huawei Technologies, 24 October 2025). Open access. THE PRIMARY IS HELD AND PROMOTED, at `library/arxiv-2510.21603v1`, which is what `evidence:` below points at. It was staged and unpromotable for a day: the extractor reported **383** images, 335 of them on page 3, and its `image-descriptions` requirement could not be met. It holds **fifty**. See §"What this checkout holds" — the first reading of those 383 was wrong, and the correction is kept there rather than tidied away. It is a SYSTEM paper reporting one implementation against a benchmark its own authors built, so what is adopted below is the METHOD, and §"Where this rendering stops" says which parts were left behind.

**Ingested sources:**

- [`library/arxiv-2510.21603v1`](../cat-harness/library/folio-assistant-core/#folio-assistant-core%2Farxiv-2510.21603v1) · [item page](https://github.com/litlfred/folio-assistant/blob/main/folio-assistant-core/library/arxiv-2510.21603v1/README.md) · [source](https://arxiv.org/abs/2510.21603v1)

### Hybrid LLM/deterministic — the model proposes a RULE, machinery validates and runs it

<a id="hybrid-llm-deterministic"></a>

`hybrid-llm-deterministic` — declared by `cat-harness` — <span class="mv-tag mv-ingested">source held</span>

**Applies when.** **An agent must produce an artefact that something downstream will act on.** Use it when a language model is in the loop and a wrong output would be acted on rather than merely read — a schema, a mapping, a classification, a branch, a judgement. It answers *how to get the output safely*, never *which option to choose*: a one-off choice among options is `kepner-tregoe`, a recurring rule is `dmn`, certainty of evidence is `grade`, the record of a decision is `madr`, who is involved is `raci`, and situation analysis is `swot`. Those pick an answer; this one constrains how an answer is produced. Not applicable where no model is involved, and unnecessary where the output is only ever read by a person who will notice it is wrong.

**Origin.** Felix Neubauer, Jürgen Pleiss and Benjamin Uekermann, "AI-assisted JSON Schema Creation and Mapping" (arXiv:2508.05192v2), University of Stuttgart. The authors' own word for it is a *"hybrid approach that combines large language models (LLMs) with deterministic techniques"*. Open access, read whole and ingested here — unlike most nodes in this graph, the primary IS held. It is a tool paper reporting one implementation (MetaConfigurator), so what is adopted below is the METHOD it generalises, and §"Where this rendering stops" says which parts were left behind.

**Ingested sources:**

- [`library/arxiv-2508.05192v2`](../cat-harness/library/cat-harness/#cat-harness%2Farxiv-2508.05192v2) · [item page](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/library/arxiv-2508.05192v2/README.md) · [source](https://arxiv.org/abs/2508.05192v2)

### JSON-LD 1.1 — the knowledge graph serialised as Linked Data in plain JSON

<a id="json-ld-serialisation"></a>

`json-ld-serialisation` — declared by `cat-harness` — <span class="mv-tag mv-ingested">source held</span>

**Applies when.** **Choosing how a node of the knowledge graph is written to disk or published, so that it is ordinary JSON to a reader with no RDF tooling and RDF to one with it.** Use it when adding a generated `.jsonld` sibling, a term to a published `@context`, a prefix, or a new exported document. It answers *how a node is identified, typed and linked in the serialisation*. It does NOT answer what a node means (that is the vocabulary and the schemas), whether a relation is true (`uses-editorial-review`), or how a table is modelled (CSVW, bound as a vocabulary, not a serialisation).

**Origin.** W3C, "JSON-LD 1.1 — A JSON-based Serialization for Linked Data", W3C Recommendation 16 July 2020 (https://www.w3.org/TR/2020/REC-json-ld11-20200716/), editors Gregg Kellogg, Pierre-Antoine Champin and Dave Longley; produced by the JSON-LD Working Group. Held as the Working Group's own publication snapshot of the REC (github.com/w3c/json-ld-syntax, commit 029777cf), under the W3C Software and Document License. The companion Recommendations — JSON-LD 1.1 Processing Algorithms and API, and JSON-LD 1.1 Framing — are NOT held.

**Ingested sources:**

- [`library/w3c-2020-json-ld-1-1`](../cat-harness/library/cat-harness/#cat-harness%2Fw3c-2020-json-ld-1-1) · [item page](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/library/w3c-2020-json-ld-1-1/README.md)

### Kepner-Tregoe Decision Analysis

<a id="kepner-tregoe"></a>

`kepner-tregoe` — declared by `cat-harness` — <span class="mv-tag mv-cited">cited, not ingested</span>

**Applies when.** A decision with several candidate options and no recurring rule — a platform choice, an architecture question, which of three fixes to take. Contextual, not default: if the criteria recur, use `dmn`; if the question is certainty of evidence for a recommendation, use `grade`.

**Origin.** Charles H. Kepner and Benjamin B. Tregoe, *The Rational Manager* (1965); *The New Rational Manager* (1981)

**No ingested source.** The origin above names one; nothing in this
checkout holds it. `literature-search` is the skill that closes one of
these.

### Latent Semantic Indexing — retrieve and relate by co-occurrence structure, not by shared words

<a id="lsi"></a>

`lsi` — declared by `cat-harness` — <span class="mv-tag mv-ingested">source held</span>

**Applies when.** **Finding or relating units of text that discuss the same thing in different words, across a corpus too large to read whole, where no controlled vocabulary has been assigned.** Use it to ask "what else in this graph is about this?", to propose a home for an unfiled item among existing groups, to find near-duplicates, and to surface clusters nobody named. It answers *which units are close in co-occurrence structure*. It does NOT answer whether a unit is relevant, correct, or a dependency: every output is a PROPOSAL a person or an agent confirms. Not for assigning terms from a controlled vocabulary (`skill-pipeline-subject-indexing`), not for judging an assignment (`consensus-grounded-subject-evaluation`), and not for any decision (`kepner-tregoe`, `dmn`).

**Origin.** Scott Deerwester, Susan T. Dumais, George W. Furnas, Thomas K. Landauer and Richard A. Harshman, "Indexing by Latent Semantic Analysis", Journal of the American Society for Information Science 41(6):391–407 (1990), for the method. Susan T. Dumais, "Improving the retrieval of information from external sources", Behavior Research Methods, Instruments & Computers 23(2):229–236 (1991), for the log-entropy term weighting. Michael W. Berry, Susan T. Dumais and Gavin W. O'Brien, "Using Linear Algebra for Intelligent Information Retrieval", SIAM Review 37(4):573–595 (1995), for folding-in and updating. Thomas K. Landauer, Peter W. Foltz and Darrell Laham, "An Introduction to Latent Semantic Analysis", Discourse Processes 25:259–284 (1998), and Thomas K. Landauer and Susan T. Dumais, "A Solution to Plato's Problem", Psychological Review 104(2):211–240 (1997), for the cognitive reading of the same computation (there called LSA), which this node does NOT adopt. Nathan Halko, Per-Gunnar Martinsson and Joel A. Tropp, "Finding Structure with Randomness", SIAM Review 53(2):217–288 (2011; arXiv:0909.4061v2), for the randomized SVD this platform computes it with — an implementation source, not part of the method.

**Ingested sources:**

- [`library/deerwester-1990-indexing-by-lsa`](../cat-harness/library/cat-harness/#cat-harness%2Fdeerwester-1990-indexing-by-lsa) · [item page](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/library/deerwester-1990-indexing-by-lsa/README.md)
- [`library/landauer-foltz-laham-1998-intro-lsa`](../cat-harness/library/cat-harness/#cat-harness%2Flandauer-foltz-laham-1998-intro-lsa) · [item page](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/library/landauer-foltz-laham-1998-intro-lsa/README.md)
- [`library/arxiv-0909.4061v2`](../cat-harness/library/cat-harness/#cat-harness%2Farxiv-0909.4061v2) · [item page](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/library/arxiv-0909.4061v2/README.md)
- [`library/qi-hessen-vanderheijden-2023-ca-vs-lsa`](../cat-harness/library/cat-harness/#cat-harness%2Fqi-hessen-vanderheijden-2023-ca-vs-lsa) · [item page](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/library/qi-hessen-vanderheijden-2023-ca-vs-lsa/README.md) · [source](https://doi.org/10.1007/s10844-023-00815-y)
- [`library/arxiv-2202.02427v1`](../cat-harness/library/cat-harness/#cat-harness%2Farxiv-2202.02427v1) · [item page](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/library/arxiv-2202.02427v1/README.md) · [source](https://arxiv.org/abs/2202.02427v1)

### MADR — Markdown Architectural Decision Records

<a id="madr"></a>

`madr` — declared by `cat-harness` — <span class="mv-tag mv-cited">cited, not ingested</span>

**Applies when.** **Bean context** — the owner's binding, 2026-09-20. When a bean records a decision, this is the form. Not for the decision METHOD (see `kepner-tregoe`) and not for a recurring rule (see `dmn`).

**Origin.** Michael Nygard, "Documenting Architecture Decisions" (2011), for the ADR form; MADR (github.com/adr/madr) for the Markdown template with an explicit Considered-Options section.

**No ingested source.** The origin above names one; nothing in this
checkout holds it. `literature-search` is the skill that closes one of
these.

### Aggregation-type MCDM — an alternatives-criteria matrix collapsed to one score per alternative

<a id="mcdm-aggregation"></a>

`mcdm-aggregation` — declared by `cat-harness` — <span class="mv-tag mv-ingested">source held</span>

**Applies when.** **A FIXED, FINITE set of alternatives is to be ranked against several explicit criteria, all known up front.** The input is an alternatives-criteria matrix: every alternative scored on every criterion, with weights obtainable. The output is a ranking. Use it when the decision is made ONCE, from data already in hand. Choose within the family by what you can supply. SAW and MEW need only weights and normalised scores. AHP needs pairwise comparisons, which grow as the square of the criteria count, and gives a consistency ratio in return. ANP needs those plus the interdependence structure, and is the only member that admits feedback between criteria. COPRAS, MOORA, FUCA and WASPAS sit between SAW and AHP in what they ask for. Do NOT reach for it when the alternatives are explored REPEATEDLY and information accrues as you go — that is `probabilistic-decision-analysis`. Do not use it for a recurring rule (`dmn`), for a decision whose criteria are MUSTs and WANTs rather than weighted scores (`kepner-tregoe`), or for grading evidence. It also assumes the criteria set is complete: a criterion nobody wrote down is weighted zero, silently.

**Origin.** Zhiyuan Wang (Singapore University of Social Sciences) and Gade Pandu Rangaiah (National University of Singapore; Vellore Institute of Technology), "Multi-Criteria Decision-Making: Aggregation-Type Methods", Chapter 8 of a forthcoming volume; arXiv:2509.06388v1, 2026. **The copy ingested is the authors' preliminary draft manuscript**, produced in Word and carrying no arXiv stamp, headed "Preliminary Draft Manuscript" and paginated 8-1 onward. `_pdf_doc_id.py` reads the arXiv id off page one's text layer, so this copy derived no `arxiv-` slug and fell back to the basename. Filed instead under the author-year convention the repository's other non-arXiv entries use (owner, 2026-09-29), which is why the bib-slug and the citation differ: **cite arXiv:2509.06388v1**; the slug is a filing key and nothing more.

**Ingested sources:**

- [`library/wang-rangaiah-2026-mcdm-aggregation`](../cat-harness/library/cat-harness/#cat-harness%2Fwang-rangaiah-2026-mcdm-aggregation) · [item page](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/library/wang-rangaiah-2026-mcdm-aggregation/README.md)

### ODRL 2.2 — what a party may do, as permission and prohibition rules over actions

<a id="odrl-policies"></a>

`odrl-policies` — declared by `cat-harness` — <span class="mv-tag mv-ingested">source held</span>

**Applies when.** **What an actor may DO — may this party perform this action, here?** Use it when a grant or a refusal has to be written down so a machine can evaluate it: who holds an action, scoped to a process, a task or a role, and which broader action it falls under. It answers *permit*, *deny* or *nobody has said*. It does NOT answer who is involved in an activity (`raci`), which lane an actor may act in (`role-model`), or how a decision is reached (`kepner-tregoe`, `dmn`). It is not used here for source licences, which are recorded as SPDX ids in each library entry's `licence.json`.

**Origin.** W3C, "ODRL Information Model 2.2", W3C Recommendation 15 February 2018, edited by Renato Iannella and Serena Villata, produced by the W3C Permissions and Obligations Expression Working Group. The held copy is the Working Group's own staged REC snapshot (github.com/w3c/poe), not compared byte for byte with the w3.org copy and without later errata — see the entry's `licence.json`. The companion "ODRL Vocabulary & Expression 2.2", which the model defers to for normative serialisation and the Common Vocabulary, is NOT held.

**Ingested sources:**

- [`library/w3c-2018-odrl-model-2-2`](../cat-harness/library/cat-harness/#cat-harness%2Fw3c-2018-odrl-model-2-2) · [item page](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/library/w3c-2018-odrl-model-2-2/README.md)

### Probabilistic decision-making algorithms — and what their regret bounds are claims ABOUT

<a id="probabilistic-decision-analysis"></a>

`probabilistic-decision-analysis` — declared by `cat-harness` — <span class="mv-tag mv-ingested">source held</span>

**Applies when.** **The alternatives can be TRIED, repeatedly, and what you learn from one try changes what you should try next.** Bandits, Bayesian optimisation and tree search all live here. The defining features are that the alternative set is sampled rather than scored, that information is gathered adaptively, and that each trial costs something — the monograph's motivating setting is scientific discovery, *"where experiments are costly"*. Reach for it also when the question is not which algorithm to run but **what an existing bound entitles anyone to say**: the monograph is an analysis text first, so it is the right source for reading a regret guarantee rather than quoting one. Do NOT reach for it for a one-shot choice from a fixed matrix — that is `mcdm-aggregation` — nor for a recurring rule (`dmn`), a MUST/WANT decision (`kepner-tregoe`), or grading evidence. And do not reach for it when you cannot actually run the alternatives: adaptivity is the whole premise, and without it every guarantee in the book is vacuous.

**Origin.** Agustinus Kristiadi (Western University and Vector Institute, Canada), "Introduction to the Analysis of Probabilistic Decision-Making Algorithms"; arXiv:2508.21620v2 [cs.LG], 23 May 2026. A monograph, open access, ingested whole. Its stated aim is accessibility: *"theoretical analyses in the literature are often inaccessible to non-experts"*, and it assumes only basic probability and statistics plus some Gaussian processes.

**Ingested sources:**

- [`library/arxiv-2508.21620v2`](../cat-harness/library/cat-harness/#cat-harness%2Farxiv-2508.21620v2) · [item page](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/library/arxiv-2508.21620v2/README.md) · [source](https://arxiv.org/abs/2508.21620v2)

### Process-driven autoformalization — judge a formalised statement by compiling it WITH a proof, and read the first error as the step signal

<a id="process-driven-autoformalization"></a>

`process-driven-autoformalization` — declared by `folio-assistant-sci` — <span class="mv-tag mv-ingested">source held</span>

**Applies when.** **A natural-language statement is being turned into a Lean statement and the question is how to test the candidate**, or **a Lean statement is being turned into prose** (a blueprint, a docstring, a narrative) and the question is how to keep that prose independent of the Lean it came from. Use it for the two checks it names — compile the statement together with a proof, and decompose informalization so the result is not a paraphrase of the syntax. Do NOT use it as evidence that a statement is FAITHFUL. The paper says itself that the compiler "can only validate the formal proof's correctness, not its semantic correspondence to the original natural language" (§5.1.2). Not for choosing, training or ranking models: the numbers in it are about the authors' models on the authors' dataset.

**Origin.** Jianqiao Lu, Yingjia Wan, Zhengying Liu, Yinya Huang, Jing Xiong, Chengwu Liu, Jianhao Shen, Hui Jin, Jipeng Zhang, Haiming Wang, Zhicheng Yang, Jing Tang and Zhijiang Guo, "Process-Driven Autoformalization in Lean 4" (arXiv:2406.01940v2 [cs.CL], 14 October 2024; version 1, June 2024). The paper labels itself "Work in progress". Open access. It is a MACHINE-LEARNING paper: it contributes a dataset (FormL4, built by informalizing Mathlib 4 theorems) and a training loop (an autoformalizer and a verifier fine-tuned against Lean compiler feedback). This platform trains no models, so what is adopted below is the small part of the method that survives without training; §"Where this rendering stops" is long on purpose.

**Ingested sources:**

- [`library/arxiv-2406.01940v2`](../cat-harness/library/folio-assistant-sci/#folio-assistant-sci%2Farxiv-2406.01940v2) · [item page](https://github.com/litlfred/folio-assistant/blob/main/folio-assistant-sci/library/arxiv-2406.01940v2/README.md) · [source](https://arxiv.org/abs/2406.01940v2)

### PROV-O — the record of who did what, in which role, under which plan

<a id="prov-o-provenance"></a>

`prov-o-provenance` — declared by `cat-harness` — <span class="mv-tag mv-ingested">source held</span>

**Applies when.** **Recording, after or as it happens, what was done — which activity ran, which agent was responsible for it, in which role, following which plan, and what it read and wrote — in a form another system can read without knowing this one.** Here that is the log of every BPMN task run, which the QA/QC after-check grades against policy, and the derivation and alternate-of links on the published knowledge graph. It answers *what happened and who answers for it*. It does NOT answer whether the action was permitted (that is the ODRL policy the record points at), how to decide anything (`kepner-tregoe`, `dmn`), or who should be involved in a task before it runs (`raci`).

**Origin.** W3C, "PROV-O: The PROV Ontology", W3C Recommendation 30 April 2013 (http://www.w3.org/TR/2013/REC-prov-o-20130430/), editors Timothy Lebo, Satya Sahoo and Deborah McGuinness, for the Provenance Working Group. It is the OWL2 encoding of the PROV Data Model (PROV-DM), which is cited by it and not held here.

**Ingested sources:**

- [`library/w3c-2013-prov-o`](../cat-harness/library/cat-harness/#cat-harness%2Fw3c-2013-prov-o) · [item page](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/library/w3c-2013-prov-o/README.md)
- [`library/w3c-2024-prov-jsonld`](../cat-harness/library/cat-harness/#cat-harness%2Fw3c-2024-prov-jsonld) · [item page](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/library/w3c-2024-prov-jsonld/README.md)

### RACI — who is involved in an activity, and in which of four ways

<a id="raci"></a>

`raci` — declared by `cat-harness` — <span class="mv-tag mv-ingested">source held</span>

**Applies when.** **Who is involved in an activity, and how.** Use it when a process or a breakdown exists and the question is participation — who answers for this, who must be asked first, who is told afterwards. Not a decision method: a one-off choice among options is `kepner-tregoe`, a recurring rule is `dmn`, certainty of evidence is `grade`, the record of a decision is `madr`, and situation analysis before any of them is `swot`. RACI answers *who*, never *what* or *whether*.

**Origin.** **NO PRIMARY SOURCE IS HELD HERE, and the ingested one is SECONDARY.** RACI is a responsibility assignment matrix from project-management practice. The text this node cites renders the four roles but does not originate them — it attributes them onward to PMI's *PMBOK Guide* (2021), which is a paid standard nobody here has opened. The earlier Linear Responsibility Chart literature is the other commonly named ancestor. Both stay in §"The primary is still not held" as CANDIDATES TO FETCH, unverified, rather than asserted here as provenance. Rendering from an open secondary was the owner's ruling of 2026-09-23 — the route `swot` took. See `literature-search`.

**Ingested sources:**

- [`library/dusengumuremyi-2026-ai-mediated-raci`](../cat-harness/library/cat-harness/#cat-harness%2Fdusengumuremyi-2026-ai-mediated-raci) · [item page](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/library/dusengumuremyi-2026-ai-mediated-raci/README.md)

### RASCI — RACI plus Supportive, for when doing the work and owning it come apart

<a id="rasci"></a>

`rasci` — declared by `cat-harness` — <span class="mv-tag mv-cited">cited, not ingested</span>

**Applies when.** **Who is involved, when a role does the work without owning the deliverable.** Use it where a separate *Supportive* party is real — someone who contributes effort or resources to an activity that another role answers for. **If no such party exists, use `raci` instead**: a fifth letter nobody fills is a column that makes the chart look more considered than it is. Like `raci` it answers *who*, never *what* or *whether* — a one-off choice among options is `kepner-tregoe`, a recurring rule is `dmn`, certainty of evidence is `grade`, the record of a decision is `madr`, situation analysis is `swot`.

**Origin.** **NOT ESTABLISHED FROM ANY SOURCE HELD HERE, and that is stated rather than guessed.** RASCI (also written RASIC) is the five-letter member of the responsibility-assignment-matrix family from project-management practice. No text for it is ingested in this repository and none was reachable when this node was written. The one RACI source this checkout does hold — `library/dusengumuremyi-2026-ai-mediated-raci` — was searched and contains ZERO occurrences of `rasci`, `racsi`, `supportive` or `five roles`, so it backs `raci` and expressly not this. The candidates are the same paid standards and books listed in `raci`'s §"The primary is still not held". See `literature-search`.

**No ingested source.** The origin above names one; nothing in this
checkout holds it. `literature-search` is the skill that closes one of
these.

### Skill-pipeline subject indexing — one policy-grounded stage per cognitive step, each output inspectable

<a id="skill-pipeline-subject-indexing"></a>

`skill-pipeline-subject-indexing` — declared by `cat-harness` — <span class="mv-tag mv-ingested">source held</span>

**Applies when.** **Assigning terms from a closed, rule-governed controlled vocabulary to a work: deciding what it is about and saying so in the vocabulary's own authorised form.** Use it when the vocabulary comes with a written policy manual (LCSH has the Subject Headings Manual; MeSH, AAT and FAST are the source's own named candidates) and an authority file that can be queried, and a wrong but plausible term would be acted on in cataloguing, retrieval or linking. It answers *how to produce the assignment*. It does not answer *how to tell whether an assignment is good*: that is `consensus-grounded-subject-evaluation`, which is a parallel node and is not folded into this one. Not for choosing between options (`kepner-tregoe`), a recurring decision rule (`dmn`), or making a model emit a rule instead of a result (`hybrid-llm-deterministic`); §"Against hybrid-llm-deterministic" explains why the last is a separate method and not this one's parent. Not for free keywording with no vocabulary to validate against, because the authority step is what the method rests on.

**Origin.** Eric H. C. Chow, "A Skill-Based Agentic Pipeline for Library of Congress Subject Indexing" (arXiv:2605.03537v1), School of Humanities, The University of Hong Kong. Open access, ingested whole and read before this node was written. The method is rendered from that paper alone. Two parallel tracks, both entrants in SemEval-2025 Task 5, were ingested beside it and read so that §"The parallel tracks, and why they are not this node" rests on the papers and not on how Chow summarises them: Suominen, Inkinen & Lehtinen, "Annif at SemEval-2025 Task 5: Traditional XMTC augmented by LLMs" (arXiv:2504.19675v2), National Library of Finland; and Bayrami Asl Tekanlou et al., "Homa at SemEval-2025 Task 5: Aligning Librarian Records with OntoAligner for Subject Tagging" (arXiv:2504.21474v1).

**Ingested sources:**

- [`library/arxiv-2605.03537v1`](../cat-harness/library/cat-harness/#cat-harness%2Farxiv-2605.03537v1) · [item page](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/library/arxiv-2605.03537v1/README.md) · [source](https://arxiv.org/abs/2605.03537v1)
- [`library/arxiv-2504.19675v2`](../cat-harness/library/cat-harness/#cat-harness%2Farxiv-2504.19675v2) · [item page](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/library/arxiv-2504.19675v2/README.md) · [source](https://arxiv.org/abs/2504.19675v2)
- [`library/arxiv-2504.21474v1`](../cat-harness/library/cat-harness/#cat-harness%2Farxiv-2504.21474v1) · [item page](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/library/arxiv-2504.21474v1/README.md) · [source](https://arxiv.org/abs/2504.21474v1)

### SPDX 3 — a bill of materials as a graph of elements, for what crosses a trust boundary

<a id="spdx-3"></a>

`spdx-3` — declared by `cat-harness` — <span class="mv-tag mv-ingested">source held</span>

**Applies when.** **Describing an artefact that LEAVES this repository so that a party who does not run our tooling can check what is in it, what it depends on, under which licences, and that it arrived intact** — a release, a signed package, a published instance's dependency set, the licences of what we redistribute. It answers *what is this, what is it made of, who supplied it, under what licence, with what known vulnerabilities*. It does NOT answer what happened inside the repository or who answers for it (`prov-o-provenance`), what an actor may do (`odrl-policies`), how a node is serialised internally (`json-ld-serialisation`), or whether a block passed its QA criteria (the house QA schemas; see §"What it refuses").

**Origin.** The Linux Foundation and its Contributors, with SPDX Model contributions from OMG, "System Package Data Exchange (SPDX) Specification Version 3.0", OMG formal/24-11-01, March 2025 (https://www.omg.org/spec/SPDX); its model is the SPDX 3.0.1 model (Annex A points at https://spdx.org/rdf/3.0.1/spdx-model.ttl). Licensed Community-Spec-1.0, with pre-existing portions CC-BY-3.0. SPDX® is a registered trademark of The Linux Foundation. SPDX 3.1, a release candidate since 2026-01-26, is held only as a secondary source (a 2025 conference deck, CC-BY-SA-3.0) and as its RC1 machine-readable schema queued in uploads/, NOT as a specification.

**Ingested sources:**

- [`library/omg-2024-spdx-3-0`](../cat-harness/library/cat-harness/#cat-harness%2Fomg-2024-spdx-3-0) · [item page](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/library/omg-2024-spdx-3-0/README.md)
- [`library/strauch-carbno-2025-spdx-3-1-supply-chain`](../cat-harness/library/cat-harness/#cat-harness%2Fstrauch-carbno-2025-spdx-3-1-supply-chain) · [item page](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/library/strauch-carbno-2025-spdx-3-1-supply-chain/README.md)

### Specification-compiled agents — the control flow comes from the diagram, not from the model's plan

<a id="specification-compiled-agents"></a>

`specification-compiled-agents` — declared by `cat-harness` — <span class="mv-tag mv-ingested">source held</span>

**Applies when.** **A process is already written down as a diagram, and something must now EXECUTE it.** Use it when the control flow is external and authored — a BPMN process, a DMN table, a pipeline someone drew — and the question is how an LLM should act inside it. It answers *where the plan comes from*, never *what the plan should be*: authoring the diagram is `bpmn-authoring`, deciding a branch from a table is `dmn`, and choosing between options is `kepner-tregoe`. Its companion is `hybrid-llm-deterministic`, and the two are the same shape at different grains: that one has the model emit a RULE that machinery validates and runs; this one has the model act inside a CONTROL GRAPH that machinery derived from a specification. Reach for this one when the artefact that constrains the model already exists as a diagram. Do NOT reach for it where no specification exists, or where the process is genuinely open-ended. The paper's own evaluation is scoped to deterministic workflows and says so; a setting with ambiguity, stochasticity or open-ended human decision-making is outside what it measured, and outside what this node claims.

**Origin.** Harris Borman, Herman Wandabwa, Fusun Yu, Sandeepa Kannangara, Justin Liu, Anna Leontjeva and Ritchie Ng, "Beyond Generalist LLMs: Specialist Agentic Systems for Structured Code Workflow Execution", Commonwealth Bank of Australia. Published as a workshop paper at SCALE, ICML 2026 (PMLR 306); arXiv:2607.14456v1 [cs.SE], 16 July 2026. Open access, ingested whole and read before this node was written. It is a SYSTEM paper reporting one implementation against a benchmark its own authors built, so what is adopted below is the METHOD, and §"Where this rendering stops" says which parts were left behind. §"What the figures say that the prose does not" carries a reading of the paper's own charts that changes how its headline numbers should be used, and it is the reason this node quotes almost none of them.

**Ingested sources:**

- [`library/arxiv-2607.14456v1`](../cat-harness/library/cat-harness/#cat-harness%2Farxiv-2607.14456v1) · [item page](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/library/arxiv-2607.14456v1/README.md)
- [`library/kg-folio-asst-2026-09-30`](../cat-harness/library/cat-harness/#cat-harness%2Fkg-folio-asst-2026-09-30) · [item page](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/library/kg-folio-asst-2026-09-30/README.md)
- [`library/omg-2013-bpmn-2-0-2`](../cat-harness/library/cat-harness/#cat-harness%2Fomg-2013-bpmn-2-0-2) · [item page](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/library/omg-2013-bpmn-2-0-2/README.md)

### SWOT — situation analysis over internal and external factors

<a id="swot"></a>

`swot` — declared by `cat-harness` — <span class="mv-tag mv-ingested">source held</span>

**Applies when.** **Situation analysis, before a decision — never instead of one.** Use it to assemble what is true about a subject's internal attributes and its external environment, when the point is to see the field whole rather than to choose between candidate options. Not for choosing: a one-off choice among options is `kepner-tregoe`, a recurring rule is `dmn`, certainty of evidence behind a health recommendation is `grade`, and the record of whatever is decided is `madr`. SWOT produces the INPUT to those; it is not a substitute for any of them.

**Origin.** Rendered from two ingested sources. Gürel, E. & Tat, M. (2017), "SWOT Analysis: A Theoretical Review", *The Journal of International Social Research* 10(51), pp. 994–1006, doi:10.17719/jisr.2017.1832 — a theoretical review, carrying the history, the variants and the criticism. And Sammut-Bonnici, T. & Galea, D. (2015), "SWOT Analysis", *Wiley Encyclopedia of Management* vol. 12 (Strategic Management), doi:10.1002/9781118785317.weom120103 — a reference chapter, carrying the conceptual framework and the practical discipline. The METHOD's own origin is contested and neither source settles it — see §"Where the method came from, and why that is not a settled question".

**Ingested sources:**

- [`library/gurel-tat-2017-swot-analysis`](../cat-harness/library/cat-harness/#cat-harness%2Fgurel-tat-2017-swot-analysis) · [item page](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/library/gurel-tat-2017-swot-analysis/README.md)
- [`library/sammut-bonnici-galea-2015-swot-analysis`](../cat-harness/library/cat-harness/#cat-harness%2Fsammut-bonnici-galea-2015-swot-analysis) · [item page](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/library/sammut-bonnici-galea-2015-swot-analysis/README.md)

### WireGen: wireframing from a written design intent

<a id="wiregen"></a>

`wiregen` — declared by `cat-harness` — <span class="mv-tag mv-ingested">source held</span>

**Applies when.** Designing a USER INTERFACE, for example a page layout, a navigation scheme or a visualiser, where the choice between candidate designs has to be reviewed and, when reviewers disagree, adjudicated. It is a design-generation and design-evaluation method. It does not choose between non-UI options (use the decision-analysis methodology) or grade evidence. It does not by itself settle a disagreement: that is `adjudication`.

**Origin.** Sidong Feng, Mingyue Yuan, Jieshan Chen, Zhenchang Xing and Chunyang Chen, "Designing with Language: Wireframing UI Design Intent with Generative Large Language Models", arXiv:2312.07755v1 [cs.HC], 12 Dec 2023. Ingested in full at `cat-harness/library/arxiv-2312.07755v1/`. The source states no licence, and its licence could not be established (see `check:source-licence`). Section numbers below are the paper's.

**Ingested sources:**

- [`library/arxiv-2312.07755v1`](../cat-harness/library/cat-harness/#cat-harness%2Farxiv-2312.07755v1) · [item page](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/library/arxiv-2312.07755v1/README.md) · [source](https://arxiv.org/abs/2312.07755v1)

## Files in the graph that are not methodology nodes

None — every `.md` in the declared directories carries
`$schema: folio-methodology/v1`.
