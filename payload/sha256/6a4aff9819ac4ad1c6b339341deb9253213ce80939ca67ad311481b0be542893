# AGENTS.md — smart-base

The **WHO SMART Guidelines base layer**: the ingested WHO digital-health
corpus, the methodologies read out of it, and the editorial voices derived
from it.

> ## 🛑 Three rules, and each one has already been broken somewhere
>
> **1. Nothing under `library/` is authored, so nothing under it is edited.**
> Every section was produced from an ingested PDF by `bun run cat ingest`. A
> hand-edit is not a change — it is a defect that the next re-ingest
> overwrites. If a section is wrong, the fix is in the rung that read it, or
> in the upstream document. Never here.
>
> **2. A rule with no resolvable citation is refused, not downgraded.** Every
> voice rule carries `{ libraryId, sectionId, pages, quote }` and
> `check:voices` fails one whose citation does not resolve. This is not
> ceremony: PR #210 asserted that WHO house style was `-ise`, from common
> belief, and the Editorial Style Manual says `-ize` on page 14. A voice is
> auditable or it is one agent's taste.
>
> **3. The upstream toolchain is loaded, never vendored.**
> `WorldHealthOrganization/smart-base` carries ~54 Python scripts and its DAK
> repositories' own GitHub Actions invoke them in place. A copy here would be
> a second, drifting toolchain. See `smart-base-tools` for the wrapper and
> `SMART_BASE_HOME`.

## What is here

`library/` — one `<bib-slug>/` per ingested WHO publication. This is L1 source
content, and **every** knowledge-graph reference to one of these documents
resolves through it. That is why the bytes could not stay in `uploads/`: the
corpus-grep checklist searches `library/` only, so a publication sitting in the
incoming queue makes a clean grep mean *"nobody has done this"* while the
source is right there.

## What is coming, and why it is not declared yet

`methodologies/`, `skills/voices/` and `scenarios/` are declared in the commits
that create their content, never ahead of it. A declared-but-absent directory
is the `dh4f` defect — every consumer scans nothing and reports a **clean run**
over it, which is worse than a missing declaration because it reads as a
result. `who-iris` held its own `library` entry back on the same ground.

## The order is forced, and it is not a preference

A methodology is adopted by **rendering it faithfully from the source**, and a
voice rule cites a section by id. Neither can be written before the document it
draws on is in `library/`. So ingestion is not the first of four tasks; it is
the precondition for the other three. An agent that writes the DIIG methodology
from its own recollection of DIIG has not adopted a methodology — it has
written a house process and dressed it as an adoption, which is exactly what
`methodology-adoption` §1 refuses.

## Ingesting a document

```sh
bun run cat ingest uploads/FILE.pdf --library smart-base --dry-run   # which rung, and why
bun run cat ingest uploads/FILE.pdf --library smart-base
```

`--library` is **required** here rather than defaulted: this repository
declares several, and the destination is said rather than guessed.

**The rung is chosen mechanically and an inferred chapter tree is refused.**
Absence of an embedded outline selects *page* granularity; it never selects
"infer one". Bean `6xaz` records two documents where inference was confidently
wrong and the output did not show it. A PDF the prober cannot read is reported
`undetermined` and is **not** ingested — a document filed under the wrong rung
reads as ingested while its structure is wrong.

## Adopting a methodology here

Follow `methodology-adoption`. Its refusals bind, and the third is the one this
layer is most exposed to: **never quantify a judgement to make it look
measured.** Where a WHO method scores and sums, adopt the structure and refuse
the arithmetic — a total reads as a measurement, and the weights were invented.
State where the rendering stops, and state what was refused; a silent omission
misrepresents the standard.

## Against its neighbours

| | |
|---|---|
| `who-iris` | the IRIS catalogue — the *shape* of a corpus of 1,057,223 files, almost none of it held |
| `who-iris` style guide (`who-iris/skills/voices/`) | the three WHO editorial voices already derived, and the model this layer's voices follow; a separate `who-style-guide` instance until 2026-10-01 (bean `qsx4`) |
| the WHO SMART Trust and Immunizations IGs | reconstructed artefact indexes of published IGs; provisional per `nsbb` |

## The skills this layer publishes

<!-- skills:index:begin -->

_23 skills in 1 directory, generated from each skill's front matter. `bun run cat readme:sync` rewrites this list and `readme:sync:check` fails when it is stale. Skills this repository inherits are listed by the repositories that publish them._

**`skills/content/authoring-who-smart-guidelines/`** (23)

| Skill | What it is for |
|---|---|
| [`classify-and-code-content`](skills/content/authoring-who-smart-guidelines/classify-and-code-content.md) | Classify and code L1 narrative content (recommendations, implementation practices, remarks, and proposed coverage exclusions) and L2 DAK slots (personas, business processes, guideline domains,… |
| [`dak-l1-library`](skills/content/authoring-who-smart-guidelines/dak-l1-library.md) | Build a DAK's library from the L1 sources its Component 1 cites, and the L1 knowledge graph that records them. |
| [`dak-postprocessing`](skills/content/authoring-who-smart-guidelines/dak-postprocessing.md) | What the DAK post-processing phase accomplishes after the IG Publisher runs — the JSON/JSON-LD surface, the DAK API hub, and the metadata-to-Liquid bridge that is the seam the just-the-docs… |
| [`dak-preprocessing`](skills/content/authoring-who-smart-guidelines/dak-preprocessing.md) | What the DAK pre-processing phase actually accomplishes, step by step, before the IG Publisher runs — and which of its steps exist only to satisfy the Publisher's own page index — and how it runs as… |
| [`grade`](skills/content/authoring-who-smart-guidelines/grade.md) | GRADE — the grading system a WHO guideline folio declares for certainty of evidence, and the Evidence-to-Decision judgement a recommendation rests on. |
| [`guideline-use-case`](skills/content/authoring-who-smart-guidelines/guideline-use-case.md) | Stage 0 of smart-guideline-end-to-end: turn a request for a SMART Guideline into a use case — population, setting, jurisdiction and interventions in scope, new or an adaptation — in the requester's… |
| [`ig-artifact-ingestion`](skills/content/authoring-who-smart-guidelines/ig-artifact-ingestion.md) | Point at a published FHIR Implementation Guide, read what it actually published, and reconstruct its artefact index as a knowledge graph keyed by the IG's own canonical URLs — linking each artefact… |
| [`l2-component-edit-review`](skills/content/authoring-who-smart-guidelines/l2-component-edit-review.md) | How one L2 DAK component is edited by the agent and reviewed by a person: personas and user scenarios, BPMN business processes, DMN decision and scheduling logic, core data elements and glossary… |
| [`l2-dak-authoring`](skills/content/authoring-who-smart-guidelines/l2-dak-authoring.md) | Author the L2 layer of a WHO SMART Guideline — the Digital Adaptation Kit between the narrative L1 guideline and the L3 FHIR artefacts — one DAK component per pass (personas, user scenarios,… |
| [`l2-dependency-choice`](skills/content/authoring-who-smart-guidelines/l2-dependency-choice.md) | Stage 3 of smart-guideline-end-to-end: choose which existing DAKs (WHO's, or a jurisdiction's adaptation) the guideline builds on. |
| [`l3-dependency-choice`](skills/content/authoring-who-smart-guidelines/l3-dependency-choice.md) | Stage 5 of smart-guideline-end-to-end: choose which existing FHIR IGs (WHO's, or a jurisdiction's) the guideline's L3 builds on. |
| [`l3-readiness`](skills/content/authoring-who-smart-guidelines/l3-readiness.md) | The check between stages 5 and 6 of smart-guideline-end-to-end (Gateway_L3Ready): may the agent write L3 assets yet? |
| [`l4-application-brief`](skills/content/authoring-who-smart-guidelines/l4-application-brief.md) | Stage 7 of smart-guideline-end-to-end: get from the requester a description of the consuming application — who uses it, on what device, which L2 processes and L3 resources it covers, connectivity,… |
| [`l4-application-build`](skills/content/authoring-who-smart-guidelines/l4-application-build.md) | Stage 8b of smart-guideline-end-to-end: build the consuming application against the stage-6 IG build (a clean build, not a publication), from the brief and the chosen stage-8a wireframes, with… |
| [`recommendation-candidates`](skills/content/authoring-who-smart-guidelines/recommendation-candidates.md) | Turn one ingested L1 source into L1 3.0 recommendation nodes: list every normative sentence as a candidate, let the agent decide each in a curation file, then refuse a non-verbatim statement or… |
| [`recommendation-extraction`](skills/content/authoring-who-smart-guidelines/recommendation-extraction.md) | Extract the recommendations of an L1 source as L1 3.0 recommendation and remark nodes, then describe each one's scenario: the persona (role) who acts on it, the business process they act in, and the… |
| [`recommendation-scenarios`](skills/content/authoring-who-smart-guidelines/recommendation-scenarios.md) | Join each L1 recommendation to who acts on it and during which business process: one smart-kg L2 user-scenario candidate per recommendation, from the agent's mapping, reusing the target guide's… |
| [`smart-base-tools`](skills/content/authoring-who-smart-guidelines/smart-base-tools.md) | smart-base Toolchain |
| [`smart-guideline-create`](skills/content/authoring-who-smart-guidelines/smart-guideline-create.md) | Somebody asked for a new WHO SMART Guideline (an IG built on smart-base, or a DAK that will feed one). |
| [`smart-guideline-end-to-end`](skills/content/authoring-who-smart-guidelines/smart-guideline-end-to-end.md) | The whole road from a use case to a running application on WHO SMART Guidelines, for a new guideline or a jurisdiction's adaptation, as an orchestrator of ten named stage skills, each with its own… |
| [`smart-stack-layering`](skills/content/authoring-who-smart-guidelines/smart-stack-layering.md) | Which layer a WHO SMART asset, rule, script or page belongs to — fhir-harness, smart-base (with its L1 and DAK document kinds) or smart-ig — and the one question that settles it. |
| [`toolchain-ownership`](skills/content/authoring-who-smart-guidelines/toolchain-ownership.md) | Taking ownership of the WHO smart-base scripts in a litlfred fork, rewriting them to the Skill I/O contract, and the one gate that governs when a script may actually move. |
| [`transcription-verbatim`](skills/content/authoring-who-smart-guidelines/transcription-verbatim.md) | Check L1 authored from pictures (a schedule poster, a slide deck: a source with no usable text layer) against the image narratives and transcriptions it names: every statement verbatim in one of… |

<!-- skills:index:end -->
