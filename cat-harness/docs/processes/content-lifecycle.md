---
title: 'Content lifecycle'
nav_exclude: true
---

{: .note }
> Generated from `cat-harness/processes/content-lifecycle.bpmn` by `gen-processes-viz.ts` — do not edit here. [All processes](index.html)

{% raw %}
# Content lifecycle

`Process_Lifecycle` · strict · 8 step(s)

folio-assistant — the content lifecycle end to end, one cycle of a folio. Source of truth: this file. Open it in bpmn.io, Camunda Modeler, or any other BPMN 2.0 tool. The SVG under docs/assets/img/workflows/ is generated from it by `bun run render:bpmn` — never hand-edit the SVG. The <bootstrap.processes:skill> extension on an activity names the folio-assistant skill that implements it; <cat-harness.processes:bean> marks a step that reads or writes the shared work plan in beans/.

<img src="../assets/img/workflows/content-lifecycle.svg" alt="BPMN diagram: Content lifecycle" style="max-width:100%">

## How it connects

- **Called by:** no call activity names this process
- **Calls:** [Editing and HCI validation](editing-hci-validation.html), [Draft, review and publish](draft-to-publication.html)

## Lanes — who acts

| lane | role | what it does here |
|---|---|---|
| Programme manager | `programme-manager` | Opens and closes the cycle rather than running any of it: Task_Plan commits scope, team and artefacts before Lane_WorkPlan turns them into beans, and Task_Retire is reached only when Gateway_NextCycle finds nothing left to do — so this lane's second appearance is a judgement that the cycle is actually finished, not a step inside it. |
| Work plan — beans (shared by humans and agents) | `work-plan` | Touched twice, not once: Task_SeedBeans converts the programme manager's plan into trackable work at the start, and Task_FeedbackBeans converts triaged reader feedback into more of it at the end, immediately before Gateway_NextCycle asks whether to go around again — so this lane is what makes the lifecycle a LOOP rather than a line, carrying what closed one cycle into what opens the next. |
| Editors + authoring agents | `editor` | The single re-entry point for every round the cycle contains — Gateway_NextCycle's 'yes' branch (H09) loops straight back here rather than to Task_Plan — so this lane runs once per proposed change, not once per cycle, and is where the accept decision on each of those changes is made before anything reaches the corpus-wide Task_Test. |
| Validation and QA (mechanical + agents) | `validation-pipeline` | The corpus-wide check no single block's HCI validation gate can perform — cross-references, whole-folio build status, proof status and QA axes — sitting between the editor's accept and the publication manager's release, so a change that passed block-level review still has to clear folio-level checks before CallActivity_Publication ever runs. |
| Review team and SMEs | `reviewer` | The only reviewing this lane does happens AFTER publication, not before it: Task_Feedback triages what implementers and readers report on the LIVE folio, by severity and scope, and that triage — not a fresh review — is what Task_FeedbackBeans turns into the next cycle's work. |
| Publication manager | `publication-manager` | The single point in the cycle where the corpus becomes public: reached only after Task_Test has cleared the whole folio, and its own outcome is what Task_Feedback then collects reactions to — so whatever this lane calls out to in draft-to-publication.bpmn is the last gate before readers see anything. |

## Steps

Every one of the 8 step(s) is documented.

| step | lane | skill / sub-process | what it does |
|---|---|---|---|
| **Plan scope, team, artifacts**<br>`Task_Plan` | Programme manager | [`content-plan`](../reference/skill-instructions/content-plan.html) | Scope the work, identify artifacts and actors, form the team, set the timeline. |
| **Seed the work plan**<br>`Task_SeedBeans` | Work plan — beans (shared by humans and agents) | [`todo-manager`](../reference/skill-instructions/todo-manager.html) | The plan becomes beans. From here on, beans/ is the shared answer to 'what is done, what is next' — for humans and agents alike. |
| **Editing and HCI validation**<br>`CallActivity_Editing` | Editors + authoring agents | calls [Editing and HCI validation](editing-hci-validation.html)<br>[`content-author`](../reference/skill-instructions/content-author.html)<br>[`content-validate`](../reference/skill-instructions/content-validate.html)<br>[`content-review`](../reference/skill-instructions/content-review.html) | See editing-hci-validation.bpmn. Runs once per proposed change, not once per cycle. |
| **Integration test and QA sweep**<br>`Task_Test` | Validation and QA (mechanical + agents) | [`content-test`](../reference/skill-instructions/content-test.html) | Corpus-wide checks that a single-block gate cannot make: cross-references, build green, proof status, QA axes across the whole folio. |
| **Draft, review and publish**<br>`CallActivity_Publication` | Publication manager | calls [Draft, review and publish](draft-to-publication.html)<br>[`content-review`](../reference/skill-instructions/content-review.html)<br>[`content-publish`](../reference/skill-instructions/content-publish.html) | See draft-to-publication.bpmn. |
| **Triage published feedback**<br>`Task_Feedback` | Review team and SMEs | [`content-feedback`](../reference/skill-instructions/content-feedback.html) | Implementer and reader feedback on the published folio, triaged by severity and scope. |
| **File feedback as beans**<br>`Task_FeedbackBeans` | Work plan — beans (shared by humans and agents) | [`todo-manager`](../reference/skill-instructions/todo-manager.html)<br>[`content-feedback`](../reference/skill-instructions/content-feedback.html) | Triaged feedback re-enters the work plan as beans, which is how the next cycle knows what it is for. |
| **Retire or archive**<br>`Task_Retire` | Programme manager | [`content-retire`](../reference/skill-instructions/content-retire.html) | No more content is planned: deprecate the folio. Post a deprecation notice and timeline, update its status metadata, archive it, point references at any successor, and remove it from active publication. The programme manager decides; retirement archives rather than deletes. |

## Decisions

Every one of the 1 decision(s) is documented.

| decision | what decides it | branches |
|---|---|---|
| **More content?**<br>`Gateway_NextCycle` | Asked after feedback is filed as beans: is there more content to write for this folio? `yes` returns to editing and HCI validation; `no` retires or archives it. | **yes** → Editing and HCI validation<br>**no** → Retire or archive |

{% endraw %}
