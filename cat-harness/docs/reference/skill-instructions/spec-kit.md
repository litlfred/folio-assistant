---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: 'Spec Kit'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/spec-kit/spec-kit.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/spec-kit/spec-kit.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/spec-kit/spec-kit.md){: .fa-edit-source }

{% raw %}
# Spec Kit — spec-driven development

## Origin

github/spec-kit (GitHub, 2025), <https://github.com/github/spec-kit>. Its
`/speckit-*` command set, its specify → plan → tasks → implement → converge
cycle, and its `templates/spec-template.md`. Rendered here from the upstream
README and spec template, read 2026-09-21.

## Applies when

A change to the PLATFORM's own capability — a tool, a schema, a pipeline, a
skill, a gate — raised by somebody building the tooling rather than by somebody
writing a folio's subject matter, and whose answer does not depend on what any
folio says. Owner, 2026-09-21: *"spec-kit is specific to folio assistant feature
development requests by tool developers not content developers (content
agnostic, more scrum methodology process) for best practives of software
development"*. NOT for work whose requirements come from stakeholders who must
sign them off, and not for anything tied to a folio's domain — that is `crdm`.


**Adopted whole, 2026-09-21**, on the owner's decision (issue #730, option A):
spec-kit sits **beside** `crdm` as a parallel track, not blended with it. External
method, rendered faithfully. Where this text and the published method differ, the
published method is right and this file is wrong.

Its one-line claim, upstream's words:

> Define **what and why** before deciding **how** to build it.

## The cycle

`constitution` once per project, then per feature:

**specify → plan → tasks → implement → converge**, repeating **implement →
converge** until converge reports *Converged*.

Upstream installs these as skills:

| command | what it does |
|---|---|
| `/speckit-constitution` | establishes project principles |
| `/speckit-specify` | creates the specification from the request |
| `/speckit-plan` | develops the technical implementation strategy |
| `/speckit-tasks` | generates actionable work items |
| `/speckit-implement` | guides the building |
| `/speckit-converge` | validates completion against the artefacts |

Two extensions ship alongside: bug-fixing (`bug-assess` → `bug-fix` →
`bug-test`, artefacts under `.specify/bugs/{slug}/`) and idea assessment
(`assess-intake` → `assess-research` → `assess-define` → `assess-shape` →
`assess-decide`, producing go / needs-clarification / kill, under
`.specify/assessments/{slug}/`).

## The spec template

Upstream's `templates/spec-template.md`, in order. **Mandatory** where upstream
marks it so:

| section | asks for |
|---|---|
| header | feature name, branch, creation date, status |
| **User Scenarios & Testing** *(mandatory)* | prioritised independent journeys (P1, P2, …), each delivering standalone value, each with its rationale, an independent test approach, and Given-When-Then acceptance scenarios |
| Edge Cases | boundary conditions and error scenarios |
| **Requirements** *(mandatory)* | functional requirements `FR-001…`, plus key entities where data modelling applies |
| **Success Criteria** *(mandatory)* | measurable, **technology-agnostic** outcomes `SC-001…` |
| Assumptions | the defaults taken where the request was silent |

**Markers.** `[NEEDS CLARIFICATION: …]` flags an ambiguity that must be resolved
rather than guessed. `ACTION REQUIRED` marks a section that must be substantively
completed before approval.

## What this platform adds, and why it is an addition rather than a reading

**Upstream does not itself state a hard "no code without a spec" rule**, and it
does not claim its specs are executable. The gate is *ours*. It is stated here so
that nobody later cites spec-kit as the authority for a rule spec-kit does not
carry:

> No implementation work on a feature begins before a spec for it exists in the
> declared template and is posted to its governing issue.

Owner, 2026-09-21: *"ensure that the spec exists before anything is developed"*.

## What this platform refuses, with reasons

`methodology-adoption` requires both halves stated — a silent omission
misrepresents the standard.

- **The on-disk layout.** Upstream keeps a spec at `specs/NNN-feature/spec.md`
  and its own state under `.specify/`. **Not adopted.** A spec instance here is a
  comment on its governing issue and goes nowhere near the knowledge graph, per
  `where-a-proposal-goes` — the owner's standing rule of 2026-09-19, *"do not
  pollute the KG with SDLC churn"*. A spec is an argument about what to build,
  superseded the moment it is decided; it has the wrong lifetime for a permanent
  URL and needs none of translation, QA sidecars or link auditing. A `specs/`
  directory was drafted while adopting this and withdrawn before it was
  committed. The **template** is durable and belongs in the graph; an
  **instance** is not.
  `.specify/` is refused on a second ground as well: this repository's
  dot-prefix guard rejects a dot-prefixed segment, which is why `.beans/` and
  `.harness/` were moved out in 2026-09.
- **The `/speckit-*` command surface, as a surface.** The *method* is adopted;
  the concrete command names are upstream's packaging for tools that install
  slash commands. Adopting names this repository does not serve would be
  adoption by citation — the refusal `methodology-adoption` names second.
- **`constitution`, for now.** This repository already has a constitution in
  everything but the name: `AGENTS.md`, the skills it points to, and the
  `req:*` conformance lattice. A second statement of principles would be a
  second answer to "what binds here", free to disagree with the first. Revisit
  only if the two are ever reconciled into one.

## Against `crdm` — parallel, never blended

Both answer *request → agreed requirements*. `methodology-adoption` is explicit
that parallel means parallel: pick one per decision, name it, follow it. The
discriminator is in each one's `applies-when` above and in `crdm-detect`'s, and
the ladder question that reaches them is in `methodology-adoption`.

The short form, in the owner's terms: **who is asking, and does the answer depend
on what a folio says?** Tool developer, content-agnostic → here. Stakeholders who
must sign it off, tied to WHO/IG subject matter → `crdm`.

## Refusals

- **Never blend this with `crdm`.** A composite inherits neither one's authority
  while claiming both.
- **Never resolve a `[NEEDS CLARIFICATION]` by agent judgement.**
  `req:agent-workflow` → `judgement-stays-human` (SHALL) applies unchanged: an
  agent does not record a human's decision on their behalf. A marker silently
  closed is worse than one never raised, because it looks answered.
- **Never let a spec reach adjudicated status with a marker open.** Otherwise
  the marker becomes a way of appearing to ask without having asked.
- **Never cite spec-kit for the spec-before-code gate.** It is this platform's
  addition, stated above.
{% endraw %}
