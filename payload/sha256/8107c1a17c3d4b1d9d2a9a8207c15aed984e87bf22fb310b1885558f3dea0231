# AGENTS.md — smart-base

The **WHO SMART Guidelines base layer**: the ingested WHO digital-health
corpus, the methodologies read out of it, and the editorial voices derived
from it.

> ## 🛑 Three rules
>
> **1. Nothing under `library/` is authored, so nothing under it is edited.**
> Every section was produced from an ingested PDF by `bun run cat ingest`, and
> the next re-ingest overwrites a hand-edit. Fix a wrong section in the rung
> that read it, or in the upstream document.
>
> **2. A rule with no resolvable citation is refused, not downgraded.** Every
> voice rule carries `{ libraryId, sectionId, pages, quote }`, and
> `check:voices` fails one whose citation does not resolve.
>
> **3. The upstream toolchain is loaded, never vendored.**
> `WorldHealthOrganization/smart-base` carries ~54 Python scripts that its DAK
> repositories' GitHub Actions invoke in place. `smart-base-tools` has the
> wrapper and `SMART_BASE_HOME`.

## What is here

`library/` — one `<bib-slug>/` per ingested publication that is not a WHO IRIS
item. WHO IRIS publications (DIIG, the digital transformation handbooks) live
in `who-iris/library/` and are cited as `{instance: "litlfred/who-iris"}`.
Every knowledge-graph reference to a source resolves through a library, never
`uploads/`: the corpus-grep checklist searches `library/` only.

`methodologies/`, `skills/voices/` and `scenarios/` hold the adopted methods,
the voices and the roles. Declare a directory in `smart-base.json` in the
commit that creates its content, never ahead of it: a declared-but-absent
directory makes every consumer scan nothing and report a clean run.

## The order is forced

A methodology is adopted by rendering it faithfully from the source, and a
voice rule cites a section by id, so neither can be written before its document
is in a library. Ingestion comes first. A methodology written from recollection
is a house process, which `methodology-adoption` §1 refuses.

## Ingesting a document

```sh
bun run cat ingest uploads/FILE.pdf --library smart-base --dry-run   # which rung, and why
bun run cat ingest uploads/FILE.pdf --library smart-base
```

`--library` is required: this repository declares several.

**The rung is chosen mechanically and an inferred chapter tree is refused.**
No embedded outline selects *page* granularity, never an inferred outline. A
PDF the prober cannot read is reported `undetermined` and is **not** ingested.

## Adopting a methodology here

Follow `methodology-adoption`; its refusals bind. The one this layer meets most:
**never quantify a judgement to make it look measured.** Where a WHO method
scores and sums, adopt the structure and refuse the arithmetic. State where the
rendering stops and what was refused.

## Against its neighbours

| | |
|---|---|
| `who-iris` | the IRIS catalogue, and the WHO IRIS publications this layer cites |
| `who-iris` style guide (`who-iris/skills/voices/`) | the three WHO editorial voices already derived, and the model this layer's voices follow |
| the WHO SMART Trust and Immunizations IGs | artefact indexes of published IGs |

## The skills this layer publishes

<!-- skills:index:begin -->

_27 skills in 1 directory, generated from each skill's front matter. `bun run cat readme:sync` rewrites this list and `readme:sync:check` fails when it is stale. Skills this repository inherits are listed by the repositories that publish them._

**`skills/content/authoring-who-smart-guidelines/`** (27)

| Skill | What it is for |
|---|---|
| [`classify-and-code-content`](skills/content/authoring-who-smart-guidelines/classify-and-code-content.md) | Classify and code L1 narrative content (recommendations, implementation practices, remarks, and proposed coverage exclusions) and L2 DAK slots (personas, business processes, guideline domains,… |
| [`dak-l1-library`](skills/content/authoring-who-smart-guidelines/dak-l1-library.md) | Build a DAK's library from the L1 sources its Component 1 cites, and the L1 knowledge graph that records them. |
| [`dak-postprocessing`](skills/content/authoring-who-smart-guidelines/dak-postprocessing.md) | What the DAK post-processing phase produces after the IG Publisher runs — the JSON/JSON-LD surface, the DAK API hub, and the metadata-to-Liquid bridge — and how an IG repository's own site gets the… |
| [`dak-preprocessing`](skills/content/authoring-who-smart-guidelines/dak-preprocessing.md) | What each DAK pre-processing step does before the IG Publisher runs, which steps exist only to feed the Publisher's page index, and how the phase runs as the overlay on fhir-harness's AST cache… |
| [`dth-authoring`](skills/content/authoring-who-smart-guidelines/dth-authoring.md) | How a WHO Digital Transformation Handbook (DTH) is produced, from sources to publication, in the seven stages and milestones of dth-authoring.bpmn — and the rules the diagram cannot carry: which… |
| [`dth-l1-to-l2-ingest`](skills/content/authoring-who-smart-guidelines/dth-l1-to-l2-ingest.md) | Turn a WHO Digital Transformation Handbook that exists only as an L1 publication (ingested in who-iris) into an L2 DTH in its own repository that depends on smart-ra: write the handbook's workplan… |
| [`grade`](skills/content/authoring-who-smart-guidelines/grade.md) | GRADE — the grading system a WHO guideline folio declares for certainty of evidence, and the Evidence-to-Decision judgement a recommendation rests on. |
| [`guideline-use-case`](skills/content/authoring-who-smart-guidelines/guideline-use-case.md) | Stage 0 of smart-guideline-end-to-end: turn a request for a SMART Guideline into a use case — population, setting, jurisdiction and interventions in scope, new or an adaptation — in the requester's… |
| [`ig-artifact-ingestion`](skills/content/authoring-who-smart-guidelines/ig-artifact-ingestion.md) | The artefact index of a FHIR Implementation Guide is a knowledge graph keyed by the IG's own canonical URLs, linking each artefact to its JSON, JSON Schema and JSON-LD representations. |
| [`indicator-extraction`](skills/content/authoring-who-smart-guidelines/indicator-extraction.md) | Extract the indicators an L1 source prints (indicator reference or metadata sheets: name, numerator, denominator, disaggregation, definition, data sources) as L1 `indicator` nodes with every printed… |
| [`l2-component-edit-review`](skills/content/authoring-who-smart-guidelines/l2-component-edit-review.md) | How one L2 DAK component is edited by the agent and reviewed by a person: personas and user scenarios, BPMN business processes, DMN decision and scheduling logic, core data elements and glossary… |
| [`l2-dak-authoring`](skills/content/authoring-who-smart-guidelines/l2-dak-authoring.md) | Author the L2 layer of a WHO SMART Guideline — the Digital Adaptation Kit between the narrative L1 guideline and the L3 FHIR artefacts — one DAK component per pass (personas, user scenarios,… |
| [`l2-dependency-choice`](skills/content/authoring-who-smart-guidelines/l2-dependency-choice.md) | Stage 3 of smart-guideline-end-to-end: choose which existing DAKs (WHO's, or a jurisdiction's adaptation) the guideline builds on. |
| [`l3-dependency-choice`](skills/content/authoring-who-smart-guidelines/l3-dependency-choice.md) | Stage 5 of smart-guideline-end-to-end: choose which existing FHIR IGs (WHO's, or a jurisdiction's) the guideline's L3 builds on. |
| [`l3-readiness`](skills/content/authoring-who-smart-guidelines/l3-readiness.md) | The check between stages 5 and 6 of smart-guideline-end-to-end (Gateway_L3Ready): may the agent write L3 assets yet? |
| [`l4-application-brief`](skills/content/authoring-who-smart-guidelines/l4-application-brief.md) | Stage 7 of smart-guideline-end-to-end: get from the requester a description of the consuming application — who uses it, on what device, which L2 processes and L3 resources it covers, connectivity,… |
| [`l4-application-build`](skills/content/authoring-who-smart-guidelines/l4-application-build.md) | Stage 8b of smart-guideline-end-to-end: build the consuming application against the stage-6 IG build (a clean build, not a publication), from the brief and the chosen stage-8a wireframes, with… |
| [`l4-application-run-local`](skills/content/authoring-who-smart-guidelines/l4-application-run-local.md) | Run an L4 application that is already built, on the agent's own machine, against a clean IG build, so a person can try or demonstrate it before anything is hosted. |
| [`recommendation-candidates`](skills/content/authoring-who-smart-guidelines/recommendation-candidates.md) | Turn one ingested L1 source into L1 3.0 recommendation nodes: list every normative sentence as a candidate, let the agent decide each in a curation file, then refuse a non-verbatim statement or… |
| [`recommendation-extraction`](skills/content/authoring-who-smart-guidelines/recommendation-extraction.md) | Extract the recommendations of an L1 source as L1 3.0 recommendation and remark nodes, then describe each one's scenario: the persona (role) who acts on it, the business process they act in, and the… |
| [`recommendation-scenarios`](skills/content/authoring-who-smart-guidelines/recommendation-scenarios.md) | Join each L1 recommendation to who acts on it and during which business process: one smart-kg L2 user-scenario candidate per recommendation, from the agent's mapping, reusing the target guide's… |
| [`smart-base-tools`](skills/content/authoring-who-smart-guidelines/smart-base-tools.md) | smart-base Toolchain |
| [`smart-guideline-create`](skills/content/authoring-who-smart-guidelines/smart-guideline-create.md) | Somebody asked for a new WHO SMART Guideline (an IG built on smart-base, or a DAK that will feed one). |
| [`smart-guideline-end-to-end`](skills/content/authoring-who-smart-guidelines/smart-guideline-end-to-end.md) | The whole road from a use case to a running application on WHO SMART Guidelines, for a new guideline or a jurisdiction's adaptation, as an orchestrator of ten named stage skills, each with its own… |
| [`smart-stack-layering`](skills/content/authoring-who-smart-guidelines/smart-stack-layering.md) | Which layer a WHO SMART asset, rule, script or page belongs to — fhir-harness, smart-base (with its L1 and DAK document kinds) or smart-ig — and the one question that settles it. |
| [`toolchain-ownership`](skills/content/authoring-who-smart-guidelines/toolchain-ownership.md) | Taking ownership of the WHO smart-base scripts in litlfred, rewriting them to the Skill I/O contract, and the one gate that governs when a script may actually move. |
| [`transcription-verbatim`](skills/content/authoring-who-smart-guidelines/transcription-verbatim.md) | Check L1 authored from pictures (a schedule poster, a slide deck: a source with no usable text layer) against the image narratives and transcriptions it names: every statement verbatim in one of… |

<!-- skills:index:end -->
