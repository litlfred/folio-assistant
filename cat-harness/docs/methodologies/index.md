---
title: "Methodologies"
description: "The methodologies this repository has adopted — what each is for, where it came from, and whether the source it rests on is held here."
---
<style>
.mv-tag{display:inline-block;padding:.05rem .4rem;border-radius:3px;font-size:.72rem;
  font-weight:600;white-space:nowrap;border:1px solid currentColor}
.mv-ingested{color:#0d6e5e}
.mv-cited{color:#8a6100}
.mv-dangling{color:#a8200f}
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
<div class="mv-stat"><b>11</b><span>adopted methodologies</span></div>
<div class="mv-stat"><b>4</b><span>with the source held here</span></div>
<div class="mv-stat"><b>7</b><span>cited, not ingested</span></div>
<div class="mv-stat"><b>4</b><span>instance(s) declaring the graph</span></div>
</div>

## Choosing one

`applies-when` is what a selection question matches against, so it is the
column to read first. A methodology whose applicability is unstated is one an
agent picks by resemblance, which is why the schema requires the field.

| methodology | applies when | origin held? | declared by |
|---|---|---|---|
| **[DIIG — Digital Implementation Investment Guide](#diig)**<br>`diig` | Planning, costing and monitoring a DIGITAL HEALTH IMPLEMENTATION inside a health programme — from forming the team through to the budget and the moni… | <span class="mv-tag mv-cited">cited, not ingested</span> | `smart-base` |
| **[DMN — Decision Model and Notation](#dmn)**<br>`dmn` | The criteria RECUR and the inputs are data. A gateway that must branch the same way on the same facts every time. Not for a one-off judgement — that… | <span class="mv-tag mv-cited">cited, not ingested</span> | `cat-harness` |
| **[Doc-Researcher — parse for multiple granularities, then research iteratively against a sufficiency threshold](#doc-researcher)**<br>`doc-researcher` | **A question must be answered from documents this folio has ingested, and one retrieval pass will not do it.** Use it when the answer is spread acros… | <span class="mv-tag mv-cited">cited, not ingested</span> | `folio-assistant-core` |
| **[GRADE — Grading of Recommendations, Assessment, Development and Evaluation](#grade)**<br>`grade` | Certainty of evidence for a HEALTH RECOMMENDATION, over a body of evidence answering one PICO question. Not for platform or architecture decisions —… | <span class="mv-tag mv-cited">cited, not ingested</span> | `smart-kg` |
| **[Hybrid LLM/deterministic — the model proposes a RULE, machinery validates and runs it](#hybrid-llm-deterministic)**<br>`hybrid-llm-deterministic` | **An agent must produce an artefact that something downstream will act on.** Use it when a language model is in the loop and a wrong output would be… | <span class="mv-tag mv-ingested">source held</span> | `cat-harness` |
| **[Kepner-Tregoe Decision Analysis](#kepner-tregoe)**<br>`kepner-tregoe` | A decision with several candidate options and no recurring rule — a platform choice, an architecture question, which of three fixes to take. Contextu… | <span class="mv-tag mv-cited">cited, not ingested</span> | `cat-harness` |
| **[MADR — Markdown Architectural Decision Records](#madr)**<br>`madr` | **Bean context** — the owner's binding, 2026-09-20. When a bean records a decision, this is the form. Not for the decision METHOD (see `kepner-tregoe… | <span class="mv-tag mv-cited">cited, not ingested</span> | `cat-harness` |
| **[RACI — who is involved in an activity, and in which of four ways](#raci)**<br>`raci` | **Who is involved in an activity, and how.** Use it when a process or a breakdown exists and the question is participation — who answers for this, wh… | <span class="mv-tag mv-ingested">source held</span> | `cat-harness` |
| **[RASCI — RACI plus Supportive, for when doing the work and owning it come apart](#rasci)**<br>`rasci` | **Who is involved, when a role does the work without owning the deliverable.** Use it where a separate *Supportive* party is real — someone who contr… | <span class="mv-tag mv-cited">cited, not ingested</span> | `cat-harness` |
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

### DIIG — Digital Implementation Investment Guide

<a id="diig"></a>

`diig` — declared by `smart-base` — <span class="mv-tag mv-cited">cited, not ingested</span>

**Applies when.** Planning, costing and monitoring a DIGITAL HEALTH IMPLEMENTATION inside a health programme — from forming the team through to the budget and the monitoring plan. It is a programme-investment method, not a judgement method: it does not grade evidence (that is `grade`), does not choose between design options (`kepner-tregoe`), and does not constrain how a decision is recorded (`madr`). Reach for it when the question is *what shall we build, with whom, at what cost, and how will we know it worked* — and specifically when the answer has to survive a funder.

**Origin.** World Health Organization, International Telecommunication Union and the United Nations Foundation Digital Health Initiative, *Digital implementation investment guide (DIIG): integrating digital interventions into health programmes* (2020), ISBN 978-92-4-001056-7. Ingested at `smart-base/library/9789240010567-eng/`; every citation below resolves to a section there.

**No ingested source.** The origin above names one; nothing in this
checkout holds it. `literature-search` is the skill that closes one of
these.

### DMN — Decision Model and Notation

<a id="dmn"></a>

`dmn` — declared by `cat-harness` — <span class="mv-tag mv-cited">cited, not ingested</span>

**Applies when.** The criteria RECUR and the inputs are data. A gateway that must branch the same way on the same facts every time. Not for a one-off judgement — that is `kepner-tregoe`, recorded per `madr`.

**Origin.** OMG Decision Model and Notation, v1.x (omg.org/dmn)

**No ingested source.** The origin above names one; nothing in this
checkout holds it. `literature-search` is the skill that closes one of
these.

### Doc-Researcher — parse for multiple granularities, then research iteratively against a sufficiency threshold

<a id="doc-researcher"></a>

`doc-researcher` — declared by `folio-assistant-core` — <span class="mv-tag mv-cited">cited, not ingested</span>

**Applies when.** **A question must be answered from documents this folio has ingested, and one retrieval pass will not do it.** Use it when the answer is spread across several documents, or across text and figures within one, or when the asker will follow up. It answers *how to search a corpus you already hold*, never *what to hold* — `library-ingestion` and the L1 completeness gate answer that, and this method assumes their output. Do NOT reach for it for a single lookup in a known document. The loop below costs iterations, and a method whose cheapest path is more expensive than reading the page is the wrong method.

**Origin.** Kuicai Dong, Shurui Huang, Fangda Ye, Wei Han, Zhi Zhang, Dexun Li, Wenjun Li, Qu Yang, Gang Wang, Yichao Wang, Chen Zhang and Yong Liu, "Doc-Researcher: A Unified System for Multimodal Document Parsing and Deep Research" (arXiv:2510.21603v1, Huawei Technologies, 24 October 2025). Open access. THE PRIMARY IS HELD IN THIS CHECKOUT BUT NOT PROMOTED, and `evidence:` is omitted rather than pointed at a staged entry. `bun run ingest` staged it as `arxiv-2510.21603v1` — 22 blocks and a manifest — and its `image-descriptions` requirement is unmet: the extractor placed **383** images, 335 of them from page 3 alone and many byte-identical in size, which are fragments of one composite architecture figure rather than 335 figures. Writing 383 descriptions would be the fabrication `document-image.ts`'s inspection basis exists to refuse. Recorded rather than worked around; see §"What this checkout holds, and what it does not". It is a SYSTEM paper reporting one implementation against a benchmark its own authors built, so what is adopted below is the METHOD, and §"Where this rendering stops" says which parts were left behind.

**No ingested source.** The origin above names one; nothing in this
checkout holds it. `literature-search` is the skill that closes one of
these.

### GRADE — Grading of Recommendations, Assessment, Development and Evaluation

<a id="grade"></a>

`grade` — declared by `smart-kg` — <span class="mv-tag mv-cited">cited, not ingested</span>

**Applies when.** Certainty of evidence for a HEALTH RECOMMENDATION, over a body of evidence answering one PICO question. Not for platform or architecture decisions — those are `kepner-tregoe`, recorded per `madr`.

**Origin.** The GRADE Working Group (gradeworkinggroup.org); Evidence-to-Decision frameworks per Alonso-Coello et al., BMJ 2016. WHO applies it through the *WHO Handbook for Guideline Development*.

**No ingested source.** The origin above names one; nothing in this
checkout holds it. `literature-search` is the skill that closes one of
these.

### Hybrid LLM/deterministic — the model proposes a RULE, machinery validates and runs it

<a id="hybrid-llm-deterministic"></a>

`hybrid-llm-deterministic` — declared by `cat-harness` — <span class="mv-tag mv-ingested">source held</span>

**Applies when.** **An agent must produce an artefact that something downstream will act on.** Use it when a language model is in the loop and a wrong output would be acted on rather than merely read — a schema, a mapping, a classification, a branch, a judgement. It answers *how to get the output safely*, never *which option to choose*: a one-off choice among options is `kepner-tregoe`, a recurring rule is `dmn`, certainty of evidence is `grade`, the record of a decision is `madr`, who is involved is `raci`, and situation analysis is `swot`. Those pick an answer; this one constrains how an answer is produced. Not applicable where no model is involved, and unnecessary where the output is only ever read by a person who will notice it is wrong.

**Origin.** Felix Neubauer, Jürgen Pleiss and Benjamin Uekermann, "AI-assisted JSON Schema Creation and Mapping" (arXiv:2508.05192v2), University of Stuttgart. The authors' own word for it is a *"hybrid approach that combines large language models (LLMs) with deterministic techniques"*. Open access, read whole and ingested here — unlike most nodes in this graph, the primary IS held. It is a tool paper reporting one implementation (MetaConfigurator), so what is adopted below is the METHOD it generalises, and §"Where this rendering stops" says which parts were left behind.

**Ingested sources:**

- `library/arxiv-2508.05192v2`

### Kepner-Tregoe Decision Analysis

<a id="kepner-tregoe"></a>

`kepner-tregoe` — declared by `cat-harness` — <span class="mv-tag mv-cited">cited, not ingested</span>

**Applies when.** A decision with several candidate options and no recurring rule — a platform choice, an architecture question, which of three fixes to take. Contextual, not default: if the criteria recur, use `dmn`; if the question is certainty of evidence for a recommendation, use `grade`.

**Origin.** Charles H. Kepner and Benjamin B. Tregoe, *The Rational Manager* (1965); *The New Rational Manager* (1981)

**No ingested source.** The origin above names one; nothing in this
checkout holds it. `literature-search` is the skill that closes one of
these.

### MADR — Markdown Architectural Decision Records

<a id="madr"></a>

`madr` — declared by `cat-harness` — <span class="mv-tag mv-cited">cited, not ingested</span>

**Applies when.** **Bean context** — the owner's binding, 2026-09-20. When a bean records a decision, this is the form. Not for the decision METHOD (see `kepner-tregoe`) and not for a recurring rule (see `dmn`).

**Origin.** Michael Nygard, "Documenting Architecture Decisions" (2011), for the ADR form; MADR (github.com/adr/madr) for the Markdown template with an explicit Considered-Options section.

**No ingested source.** The origin above names one; nothing in this
checkout holds it. `literature-search` is the skill that closes one of
these.

### RACI — who is involved in an activity, and in which of four ways

<a id="raci"></a>

`raci` — declared by `cat-harness` — <span class="mv-tag mv-ingested">source held</span>

**Applies when.** **Who is involved in an activity, and how.** Use it when a process or a breakdown exists and the question is participation — who answers for this, who must be asked first, who is told afterwards. Not a decision method: a one-off choice among options is `kepner-tregoe`, a recurring rule is `dmn`, certainty of evidence is `grade`, the record of a decision is `madr`, and situation analysis before any of them is `swot`. RACI answers *who*, never *what* or *whether*.

**Origin.** **NO PRIMARY SOURCE IS HELD HERE, and the ingested one is SECONDARY.** RACI is a responsibility assignment matrix from project-management practice. The text this node cites renders the four roles but does not originate them — it attributes them onward to PMI's *PMBOK Guide* (2021), which is a paid standard nobody here has opened. The earlier Linear Responsibility Chart literature is the other commonly named ancestor. Both stay in §"The primary is still not held" as CANDIDATES TO FETCH, unverified, rather than asserted here as provenance. Rendering from an open secondary was the owner's ruling of 2026-09-23 — the route `swot` took. See `literature-search`.

**Ingested sources:**

- `library/dusengumuremyi-2026-ai-mediated-raci`

### RASCI — RACI plus Supportive, for when doing the work and owning it come apart

<a id="rasci"></a>

`rasci` — declared by `cat-harness` — <span class="mv-tag mv-cited">cited, not ingested</span>

**Applies when.** **Who is involved, when a role does the work without owning the deliverable.** Use it where a separate *Supportive* party is real — someone who contributes effort or resources to an activity that another role answers for. **If no such party exists, use `raci` instead**: a fifth letter nobody fills is a column that makes the chart look more considered than it is. Like `raci` it answers *who*, never *what* or *whether* — a one-off choice among options is `kepner-tregoe`, a recurring rule is `dmn`, certainty of evidence is `grade`, the record of a decision is `madr`, situation analysis is `swot`.

**Origin.** **NOT ESTABLISHED FROM ANY SOURCE HELD HERE, and that is stated rather than guessed.** RASCI (also written RASIC) is the five-letter member of the responsibility-assignment-matrix family from project-management practice. No text for it is ingested in this repository and none was reachable when this node was written. The one RACI source this checkout does hold — `library/dusengumuremyi-2026-ai-mediated-raci` — was searched and contains ZERO occurrences of `rasci`, `racsi`, `supportive` or `five roles`, so it backs `raci` and expressly not this. The candidates are the same paid standards and books listed in `raci`'s §"The primary is still not held". See `literature-search`.

**No ingested source.** The origin above names one; nothing in this
checkout holds it. `literature-search` is the skill that closes one of
these.

### SWOT — situation analysis over internal and external factors

<a id="swot"></a>

`swot` — declared by `cat-harness` — <span class="mv-tag mv-ingested">source held</span>

**Applies when.** **Situation analysis, before a decision — never instead of one.** Use it to assemble what is true about a subject's internal attributes and its external environment, when the point is to see the field whole rather than to choose between candidate options. Not for choosing: a one-off choice among options is `kepner-tregoe`, a recurring rule is `dmn`, certainty of evidence behind a health recommendation is `grade`, and the record of whatever is decided is `madr`. SWOT produces the INPUT to those; it is not a substitute for any of them.

**Origin.** Rendered from two ingested sources. Gürel, E. & Tat, M. (2017), "SWOT Analysis: A Theoretical Review", *The Journal of International Social Research* 10(51), pp. 994–1006, doi:10.17719/jisr.2017.1832 — a theoretical review, carrying the history, the variants and the criticism. And Sammut-Bonnici, T. & Galea, D. (2015), "SWOT Analysis", *Wiley Encyclopedia of Management* vol. 12 (Strategic Management), doi:10.1002/9781118785317.weom120103 — a reference chapter, carrying the conceptual framework and the practical discipline. The METHOD's own origin is contested and neither source settles it — see §"Where the method came from, and why that is not a settled question".

**Ingested sources:**

- `library/gurel-tat-2017-swot-analysis`
- `library/sammut-bonnici-galea-2015-swot-analysis`

### WireGen: wireframing from a written design intent

<a id="wiregen"></a>

`wiregen` — declared by `cat-harness` — <span class="mv-tag mv-ingested">source held</span>

**Applies when.** Designing a USER INTERFACE, for example a page layout, a navigation scheme or a visualiser, where the choice between candidate designs has to be reviewed and, when reviewers disagree, adjudicated. It is a design-generation and design-evaluation method. It does not choose between non-UI options (use the decision-analysis methodology) or grade evidence. It does not by itself settle a disagreement: that is `adjudication`.

**Origin.** Sidong Feng, Mingyue Yuan, Jieshan Chen, Zhenchang Xing and Chunyang Chen, "Designing with Language: Wireframing UI Design Intent with Generative Large Language Models", arXiv:2312.07755v1 [cs.HC], 12 Dec 2023. Ingested in full at `cat-harness/library/arxiv-2312.07755v1/`. The source states no licence, and its licence could not be established (see `check:source-licence`). Section numbers below are the paper's.

**Ingested sources:**

- `library/arxiv-2312.07755v1`

## Files in the graph that are not methodology nodes

None — every `.md` in the declared directories carries
`$schema: folio-methodology/v1`.
