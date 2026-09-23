---
title: 'L2 DAK authoring'
nav_exclude: true
---

{: .note }
> Generated from `cat-harness/processes/l2-dak-authoring.bpmn` by `gen-processes-viz.ts` — do not edit here. [All processes](index.html)

{% raw %}
# L2 DAK authoring

`Process_L2Dak` · advisory · 10 step(s)

folio-assistant — authoring a WHO SMART Guidelines L2 Digital Adaptation Kit. Source of truth: this file. Open it in bpmn.io, Camunda Modeler, or any other BPMN 2.0 tool. The SVG under docs/assets/img/workflows/ is generated from it by `bun run render:bpmn` — never hand-edit the SVG. The <folio:skill> extension on an activity names the folio-assistant skill that implements it; <folio:bean> marks a step that reads or writes the shared work plan in beans/.

<img src="../assets/img/workflows/l2-dak-authoring.svg" alt="BPMN diagram: L2 DAK authoring" style="max-width:100%">

## How it connects

- **Called by:** no call activity names this process
- **Calls:** none
- **Skill:** [`l2-dak-authoring`](../reference/skill-instructions/l2-dak-authoring.html)

## Lanes — who acts

| lane | role | what it does here |
|---|---|---|
| Programme manager / technical officer | — | Sets the scope once, before the fork into six parallel authoring tracks. The actors and processes enumerated here are what everything downstream, including the terminology and clinical lanes, is scoped against, and nothing later in this diagram revisits that boundary. |
| Work plan — beans (shared by humans and agents) | — | A single claim made once, right after scoping and before the parallel fork. Unlike the per-edit lifecycle in editing-hci-validation, this diagram seeds one bean for the whole DAK and never returns here to log or resolve it, so tracking any one track's own progress is not this lane's concern. |
| Business analyst | — | Opens the parallel fork into six authoring tracks — five landing here, the sixth (terminology) crossing into a separate lane — and re-enters that same fork whenever clinical validation sends work back, so a fix after Gateway_Accurate revisits every track it is entangled with rather than patching only the one SME flagged. Performs the final assemble-and-validate once accuracy holds. |
| Terminologist | — | One parallel branch of the fork, producing bindings the other five tracks cite rather than author themselves. Kept a separate lane rather than folded into the analyst's because governance of a code binding is deliberately independent of the artefact that cites it. |
| Clinical SME | — | The one gate every authored track must clear before assembly: a "no" here does not return to the specific task that erred but loops back through Gateway_AuthorMerge into the fork itself, so this lane's judgement — not the analyst's — decides whether personas, BPMN, DMN, data dictionary and indicators all get revisited together. |

## Steps

Every one of the 10 step(s) is documented.

| step | lane | skill / sub-process | what it does |
|---|---|---|---|
| **Scope the DAK**<br>`Task_ScopeDak` | Programme manager / technical officer | [`content-plan`](../reference/skill-instructions/content-plan.html) | Enumerate the processes, decisions and data elements the guideline implies; identify the actors. |
| **Seed the work plan**<br>`Task_SeedBeans` | Work plan — beans (shared by humans and agents) | [`todo-manager`](../reference/skill-instructions/todo-manager.html) | Turn the scope into beans on the shared work plan — one per DAK component, since a DAK is completed component by component. beans create is not idempotent: check for an existing bean before every create, or a re-run duplicates the plan. |
| **Personas and scenarios**<br>`Task_Personas` | Business analyst | [`l2-dak-authoring`](../reference/skill-instructions/l2-dak-authoring.html) | Author the DAK's personas and the user journeys (scenarios) they appear in. These are the DAK's own actors, not this harness's scenarios/roles.json — the two vocabularies must not be conflated. |
| **Business processes · BPMN 2.0**<br>`Task_Bpmn` | Business analyst | [`bpmn-authoring`](../reference/skill-instructions/bpmn-authoring.html) | Author the DAK's L2 business processes as BPMN 2.0, with Diagram Interchange: a .bpmn with no x/y on its shapes parses and renders blank. Stay at L2 — reviewable by a clinician, not FHIR. |
| **Decision logic · DMN tables**<br>`Task_Dmn` | Business analyst | [`dmn-authoring`](../reference/skill-instructions/dmn-authoring.html) | Author the decision logic as DMN tables, within the FEEL subset the interpreter implements (any, literals, comparisons, one-of). Ranges, not() and function calls are refused at load, so write inside the subset. |
| **Data dictionary and core data elements**<br>`Task_DataDict` | Business analyst | [`l2-dak-authoring`](../reference/skill-instructions/l2-dak-authoring.html) | Author the data dictionary and core data elements for this component. Stay structured but not FHIR: a data element a clinician can review, from which L3 can later be derived rather than written twice. |
| **Indicators and requirements**<br>`Task_Indicators` | Business analyst | [`l2-dak-authoring`](../reference/skill-instructions/l2-dak-authoring.html) | Author the component's indicators and its functional and non-functional requirements. These are the DAK's requirements, distinct from skills/requirements/*.json, which are this harness's own conformance obligations. |
| **Terminology bindings**<br>`Task_Terminology` | Terminologist | [`terminology-management`](../reference/skill-instructions/terminology-management.html) | ICD-11, SNOMED CT, LOINC bindings — governed separately from the artifacts that cite them. |
| **Clinical validation**<br>`Task_SmeValidate` | Clinical SME | [`content-review`](../reference/skill-instructions/content-review.html) | Ground truth: does the DAK say what the guideline says? |
| **Assemble and validate the DAK**<br>`Task_AssembleDak` | Business analyst | [`content-validate`](../reference/skill-instructions/content-validate.html) | Assemble the validated components and run content validation: schemas, cross-component consistency and terminology bindings. The smart-base extractors read the authored artefacts; with SMART_BASE_HOME unset they report skip, never a clean run. |

## Decisions

**1** of 1 decision(s) carry no documentation — `gateway-documented` lists them.

| decision | what decides it | branches |
|---|---|---|
| **Clinically accurate?**<br>`Gateway_Accurate` | — | **changes needed** → Gateway_AuthorMerge<br>**validated** → Assemble and validate the DAK |

{% endraw %}
