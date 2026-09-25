---
title: 'L3 FHIR IG pipeline'
nav_exclude: true
---

{: .note }
> Generated from `cat-harness/processes/l3-fhir-pipeline.bpmn` by `gen-processes-viz.ts` — do not edit here. [All processes](index.html)

{% raw %}
# L3 FHIR IG pipeline

`Process_L3Fhir` · advisory · 8 step(s)

folio-assistant — the WHO SMART Guidelines L3 FHIR IG pipeline. Source of truth: this file. Open it in bpmn.io, Camunda Modeler, or any other BPMN 2.0 tool. The SVG under docs/assets/img/workflows/ is generated from it by `bun run render:bpmn` — never hand-edit the SVG. The <bootstrap.processes:skill> extension on an activity names the folio-assistant skill that implements it; <cat-harness.processes:bean> marks a step that reads or writes the shared work plan in beans/.

<img src="../assets/img/workflows/l3-fhir-pipeline.svg" alt="BPMN diagram: L3 FHIR IG pipeline" style="max-width:100%">

## How it connects

- **Called by:** no call activity names this process
- **Calls:** none
- **Presented on:** [Content types — WHO SMART Implementation Guides (L3)](../content-types.html#who-smart-implementation-guides-l3), [Authoring a WHO SMART IG (L3) — The L3 pipeline](../guides/who-smart-ig.html#the-l3-pipeline)

## Lanes — who acts

| lane | role | what it does here |
|---|---|---|
| FHIR modeller | `fhir-modeller` | Task_AuthorFsh is the single re-entry point for both failure paths in this diagram — an invalid-FHIR loop from Gateway_Valid with no record left behind, and a QC failure that arrives only after Task_QcBeans has filed it — so the lane has to be able to tell a mechanical re-run from a finding that needs to be read, and the diagram gives it no other signal than which edge fired. |
| Work plan — beans (shared by humans and agents) | `work-plan` | The only failure this diagram writes down: an invalid-FHIR loop at Gateway_Valid sends the modeller straight back with nothing recorded, but a QC finding always passes through here first, becoming a bean before Task_AuthorFsh sees it again — so a QC failure is discoverable outside the session that produced it and an invalid-FHIR one is not. |
| Build pipeline — SUSHI · validator · IG Publisher | `build-pipeline` | Two different jobs share this lane rather than one continuous run. Task_Sushi and Task_Validate turn FSH into validated FHIR JSON and loop straight back to the modeller lane on failure with no bean filed — re-running compile-and-validate is cheap enough that a durable finding would be noise. Task_IgPublisher is the other job, reached only once Lane_Qc has passed, and its output is what Lane_PubMgr actually publishes. |
| QC reviewer | `qc-reviewer` | The single gate between a syntactically valid FHIR JSON and the full IG Publisher build — Task_IgPublisher runs only once this lane says clean, so a QC finding here is what keeps a compiling-but-wrong profile from ever reaching a publishable IG rather than being caught only after the whole site is built. |
| Publication manager | `publication-manager` | The last lane and the only one with no path back into the loop — reaching it means Task_IgPublisher already succeeded on Lane_Qc's clean verdict. It does not itself decide whether the release is authorised: that call is draft-to-publication.bpmn's, and Task_PublishIg only executes what that separate process has already cleared. |

## Steps

Every one of the 8 step(s) is documented.

| step | lane | skill / sub-process | what it does |
|---|---|---|---|
| **Map L2 → L3**<br>`Task_MapL2` | FHIR modeller | [`l3-fhir-authoring`](../reference/skill-instructions/l3-fhir-authoring.html) | Each data element becomes a profile, each value set a ValueSet, each decision a PlanDefinition / Library. |
| **Author FSH profiles**<br>`Task_AuthorFsh` | FHIR modeller | [`l3-fhir-authoring`](../reference/skill-instructions/l3-fhir-authoring.html) | Write the FSH profiles, value sets and definitions the L2 mapping calls for. This is the stage where profiles, slicing and invariants belong — a decision that can only be expressed in FHIR comes here, not back into L2. |
| **SUSHI compile → FHIR JSON**<br>`Task_Sushi` | Build pipeline — SUSHI · validator · IG Publisher | [`l3-fhir-authoring`](../reference/skill-instructions/l3-fhir-authoring.html) | Compile the FSH to FHIR JSON with SUSHI. Compiling is not conformance: a green SUSHI result goes on to validation and never stands in for it. |
| **Validate against profiles**<br>`Task_Validate` | Build pipeline — SUSHI · validator · IG Publisher | [`fhir-validation`](../reference/skill-instructions/fhir-validation.html) | Validate the compiled resources against their profiles and the packages they constrain. A validator that could not start is could-not-determine, never a pass with an empty findings list. Failures return to authoring. |
| **QC gates**<br>`Task_QcGates` | QC reviewer | [`quality-control`](../reference/skill-instructions/quality-control.html) | The QC reviewer rules on the aggregate QA against the publication gates. Emitting the QA report is mechanical; ruling on it is a decision, which is why it sits in the reviewer's lane rather than the build's. |
| **File QC findings as beans**<br>`Task_QcBeans` | Work plan — beans (shared by humans and agents) | [`todo-manager`](../reference/skill-instructions/todo-manager.html) | QC findings do not stay in a report nobody re-reads — each becomes a bean the modeller and the agents both see. |
| **IG Publisher build**<br>`Task_IgPublisher` | Build pipeline — SUSHI · validator · IG Publisher | [`ig-publication`](../reference/skill-instructions/ig-publication.html) | Run the IG Publisher: it renders output/, writes each resource's JSON, the package, canonicals and qa.json, and does the two things no cache can — validates every resource against its profiles and resolves the dependency closure with terminology expansion. |
| **Publish the IG site**<br>`Task_PublishIg` | Publication manager | [`content-publish`](../reference/skill-instructions/content-publish.html)<br>[`ig-publication`](../reference/skill-instructions/ig-publication.html) | Release authorisation and review follow draft-to-publication.bpmn. |

## Decisions

Every one of the 2 decision(s) is documented.

| decision | what decides it | branches |
|---|---|---|
| **FHIR valid?**<br>`Gateway_Valid` | Answered by validating the resources against their profiles. `no` returns to FSH authoring; `yes` goes on to the QC gates. | **no** → Author FSH profiles<br>**yes** → QC gates |
| **QC clean?**<br>`Gateway_QcPass` | Answered by the QC gates. `no` files the findings as beans; `yes` goes on to the IG Publisher build. | **no** → File QC findings as beans<br>**yes** → IG Publisher build |

{% endraw %}
