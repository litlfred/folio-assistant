Nineteen BPMN 2.0 files, all under
[`skills/workflows/`](https://github.com/litlfred/folio-assistant/tree/main/skills/workflows)
(counted on `main`, 2026-09-18 — this line said "six" for long enough that it is
worth saying where the number came from).
Each is a real BPMN 2.0 document with diagram interchange — open it in
[bpmn.io](https://demo.bpmn.io/), Camunda Modeler, or any BPMN tool. The SVGs
throughout the docs are generated from these files by `bun run render:bpmn`;
never hand-edit an SVG.

**Before any of the rest** — the process a person meets first, and the only one
that runs when there is no folio yet:

| Diagram | Answers |
|---------|---------|
| `getting-started.bpmn` | Somebody said "create a folio". Which of the five things did they mean, and what has to be true before anything is written? |

Its intent gateway is *computed*, not chosen: `decisions/folio-intent.dmn`
returns the branch, and `ask` is one of the outcomes it can return — which is
what makes the question obligatory rather than a courtesy. See
[Getting started](getting-started.html).

**Content-agnostic** — these three apply to every folio, and the outer ones
reference the inner ones as **call activities**, so each process is described
once and reused:

| Level | Diagram | Answers |
|-------|---------|---------|
| 1 | [Content lifecycle](#content-lifecycle-overview) — `content-lifecycle.bpmn` | One cycle of a folio, plan → retire |
| 2 | [Draft → publication](#from-corpus-to-published-folio) — `draft-to-publication.bpmn` | How the corpus becomes an officially published folio |
| 3 | [Editing & HCI validation](#editing-and-the-hci-validation-gate) — `editing-hci-validation.bpmn` | What happens to **one** proposed change to **one** content block |

**Content-type specific** — how a particular kind of folio is authored. These
sit *inside* level 3's `Draft the block edit`, and live with their guides:

| Diagram | Content type | Where it is shown |
|---------|--------------|-------------------|
| `authoring-a-document.bpmn` | Documents & policy guidance | [Writing a document](guides/writing-a-document.html) |
| `authoring-a-paper.bpmn` | Scientific papers & books | [Writing a paper](guides/writing-a-paper.html#the-end-to-end-workflow) |
| `l2-dak-authoring.bpmn` | WHO SMART Guidelines DAK (L2) | [Authoring a WHO SMART DAK](guides/who-smart-dak.html#the-l2-artifacts) |
| `l3-fhir-pipeline.bpmn` | WHO SMART Implementation Guide (L3) | [Authoring a WHO SMART IG](guides/who-smart-ig.html#the-l3-pipeline) |
| `ig-incremental-build.bpmn` | WHO SMART IG (L3) — the build lane, incremental by dependency cone (proposed) | [Making the build incremental](guides/who-smart-ig.html#making-the-build-incremental) · [the overview](proposals/ig-incremental-build-overview.html) |

**Agent process** — how an agent works, rather than how content is authored.
These run alongside the content processes rather than inside them:

| Diagram | Answers |
|---------|---------|
| `crdm-requirements.bpmn` | A feature request arrived. How is it turned into agreed requirements, and who signs off? See [CRDM methodology](crdm-methodology.html) |
| `bean-lifecycle.bpmn` | When does an agent create, edit or scrap a bean — and why is one never deleted? See [Beans and todos](beans-and-todos.html) |
| `content-change-review.bpmn` | One author's change, from description through staging to review-committee approval |

**Review** — the generic entry and the two specialisms it descends into. They
are separate processes rather than extra skills on the reviewer, because the
subprocess stack is SCOPED: an actor takes on the inner lane's role for that
call path only, where `inherits` would carry both specialisms everywhere.

| Diagram | Answers |
|---------|---------|
| `review-task.bpmn` | What kind of thing changed, and which review does it descend into? |
| `review-narrative.bpmn` | Prose: register and voice, the editorial dependencies a reader needs, translation |
| `review-code.bpmn` | The graph's code nodes: Tool definitions and schema definition nodes — does the node declare what it is, do its references resolve, is the mechanism it advertises the one that runs? |

**Ingestion** — turning an uploaded source document into corpus. The first is
the outer process; the rest are its call activities:

| Diagram | Answers |
|---------|---------|
| `document-ingestion.bpmn` | The whole path from `uploads/` to a citeable L1 knowledge graph |
| `ingest-extract-structure.bpmn` | Text layer, OCR, sections, structure, claim candidates |
| `ingest-derive-content.bpmn` | Archive, technical metadata, images, audio, tabular data, provenance |
| `ingest-build-l1-kg.bpmn` | Dublin Core, manifest, assets, binding, linking |
| `ingest-l1-completeness-gate.bpmn` | Is the derived content complete enough to promote, and who says so? |

**Translation and evidence**:

| Diagram | Answers |
|---------|---------|
| `translation-workflow.bpmn` | POT extraction → translation → PO injection → round-trip QA → sign-off → staleness watch |
| `human-translation-workflow.bpmn` | The same cycle when a human translator and an SME reviewer are in it |
| `evidence-retrieval.bpmn` | Framing a question, searching trusted sources, appraising what comes back |

> **This list is checked, not maintained by hand.** `bun run check:workflow-refs`
> fails when a `.bpmn` under `skills/workflows/` is absent from this page. It was
> added because the page opened by counting nineteen files and then listed
> eight — the eleven above were present in the repository and invisible here,
> which is the same defect as a table of contents that stops halfway.
