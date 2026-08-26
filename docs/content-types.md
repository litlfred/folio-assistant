---
layout: default
title: Content types
nav_order: 4
---

# Content types
{: .no_toc }

folio-assistant is **content-agnostic**: the platform knows nothing about any
particular paper or guideline. Each *kind* of content is supported by a
**content adapter** (code that knows how to validate/build/render that kind) and
a **skill package** (the authoring formalism — what an author and the LLM do).

> This page describes the **formalism** of each content type. It is intentionally
> kept separate from any concrete content; concrete artifacts live in their own
> content repository.

1. TOC
{:toc}

---

## The content lifecycle

Every content type moves through the same lifecycle, provided by the
cross-cutting **`content-lifecycle`** skill package:

<div class="bpmn-figure">
  <img src="assets/img/workflows/content-lifecycle.svg"
       alt="BPMN swimlane diagram of one folio cycle: the programme manager plans, the plan is seeded as beans, editing and HCI validation runs per proposed change, an integration test and QA sweep follows, then draft-review-publish; feedback is triaged and filed as beans, and the cycle either repeats or the folio is retired.">
</div>

[BPMN 2.0 source](workflows/content-lifecycle.bpmn) · [full-size SVG](assets/img/workflows/content-lifecycle.svg)
{: .bpmn-source }

| Stage | Skill | What happens |
|-------|-------|--------------|
| plan | `content-plan` | Scope the work, identify artifacts and actors |
| author | `content-author` | Create structured artifacts from source material |
| validate | `content-validate` | Check against schema + constraints |
| review | `content-review` | Human / SME review against criteria |
| test | `content-test` | Automated QA, build green, proofs/validators pass |
| publish | `content-publish` | Render and deploy the published form |
| feedback | `content-feedback` | Capture and route reviewer feedback |
| retire | `content-retire` | Deprecate or archive an artifact |

The lifecycle stages are the same regardless of content type — what differs is
the *authoring* skills and the *artifacts* each type produces. For the full list
of skills and the roles that drive them, see **[Skills & roles](skills.html)**.

Two things the eight stage names hide, and the diagram does not: `author` and
`validate` are not consecutive phases but a *loop* — every proposed change runs
the HCI validation gate, and the editor sees the findings before anything is
committed — and `review` happens twice, once per change and once over the
assembled draft. Both expand into their own diagrams on the
**[publication workflow](publication-workflow.html)** page.

---

## Scientific papers & books

**Skill package:** `authoring-math` ·
**Adapter:** `paper` ·
**Guide:** [Writing a paper](guides/writing-a-paper.html)

Rigorous scientific papers and books where prose and mathematics are backed by a
machine-checked **Lean 4** formalization and rendered through **LaTeX**.

- **Source model** — content is a tree of typed *blocks* (`definition`,
  `theorem`, `lemma`, `proof`, `equation`, `prose`, …). See the
  [TypeScript API reference](api/) for `Block`, `Chapter`, and `Paper`.
- **Formalization** — `lean-formalization` and `proof-verification` skills drive
  Lean; each theorem-like block can be tracked against its Lean counterpart, and
  every `sorry` is auditable.
- **Rendering** — `latex-authoring` plus the paper adapter's
  `paper_render_pdf` / `paper_render_html` tools.

| Block kind | Label prefix | Lean? |
|------------|-------------|-------|
| `definition` | `def:` | required |
| `theorem` / `lemma` / `proposition` / `corollary` | `thm:` / `lem:` / … | expected |
| `conjecture` | `conj:` | optional |
| `example` / `remark` / `proof` | `ex:` / `rem:` / `prf:` | optional |
| `prose` / `equation` / `diagram` | — / `eq:` / `fig:` | n/a |

Relevant skill schemas:
[`latex-authoring`](reference/skills/latex-authoring.html),
[`lean-formalization`](reference/skills/lean-formalization.html),
[`proof-verification`](reference/skills/proof-verification.html).

---

## WHO SMART Guidelines DAKs (L2)

**Skill package:** `authoring-who-smart-guidelines` ·
**Guide:** [Authoring a WHO SMART DAK](guides/who-smart-dak.html)

A **Digital Adaptation Kit (DAK)** is the *L2* (machine-readable, but
implementation-neutral) representation of a WHO guideline. folio-assistant
authors the L2 artifacts:

- **Business processes** — BPMN 2.0 workflows (`bpmn-authoring`)
- **Decision logic** — DMN decision tables (`dmn-authoring`)
- **Data dictionaries / core data elements** — Excel / structured tables
- **Terminology** — code systems and value sets (`terminology-management`)
- **Personas, scenarios, indicators, requirements**

Relevant skill schemas:
[`l2-dak-authoring`](reference/skills/l2-dak-authoring.html),
[`bpmn-authoring`](reference/skills/bpmn-authoring.html),
[`dmn-authoring`](reference/skills/dmn-authoring.html),
[`terminology-management`](reference/skills/terminology-management.html).

<div class="bpmn-figure">
  <img src="assets/img/workflows/l2-dak-authoring.svg"
       alt="BPMN swimlane diagram of L2 DAK authoring: a parallel gateway fans out personas, BPMN processes, DMN decision logic, the data dictionary and indicators across the business-analyst lane alongside the terminologist's bindings, then clinical SME validation gates assembly of the DAK.">
</div>

[BPMN 2.0 source](workflows/l2-dak-authoring.bpmn) · [full-size SVG](assets/img/workflows/l2-dak-authoring.svg)
{: .bpmn-source }


---

## WHO SMART Implementation Guides (L3)

**Skill package:** `authoring-who-smart-guidelines` ·
**Guide:** [Authoring a WHO SMART IG](guides/who-smart-ig.html)

The *L3* layer turns an L2 DAK into a computable **FHIR Implementation Guide**:

- **FHIR resources** authored as **FSH** (FHIR Shorthand) and compiled with
  **SUSHI** (`l3-fhir-authoring`)
- **Validation** against FHIR profiles (`fhir-validation`)
- **Publication** with the **HL7 FHIR IG Publisher** (`ig-publication`)
- **Quality control** gates (`quality-control`)

Relevant skill schemas:
[`l3-fhir-authoring`](reference/skills/l3-fhir-authoring.html),
[`fhir-validation`](reference/skills/fhir-validation.html),
[`ig-publication`](reference/skills/ig-publication.html),
[`quality-control`](reference/skills/quality-control.html).

<div class="bpmn-figure">
  <img src="assets/img/workflows/l3-fhir-pipeline.svg"
       alt="BPMN swimlane diagram of the L3 pipeline: map L2 to L3, author FSH, SUSHI compile, validate against profiles with a loop back to FSH on failure, QC gates that file findings as beans, IG Publisher build, and publication of the IG site.">
</div>

[BPMN 2.0 source](workflows/l3-fhir-pipeline.bpmn) · [full-size SVG](assets/img/workflows/l3-fhir-pipeline.svg)
{: .bpmn-source }

---

## Others — extending folio-assistant

New content types are first-class: add a content **adapter** and a skill
**package**, and the lifecycle, RBAC, and MCP plumbing come for free. See
[Adding a content type](guides/new-content-type.html).
