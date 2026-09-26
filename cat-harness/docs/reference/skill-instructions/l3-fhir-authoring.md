---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: 'l3-fhir-authoring'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/authoring-who-smart-guidelines/l3-fhir-authoring.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/authoring-who-smart-guidelines/l3-fhir-authoring.md) — do not edit here. Typed contract: [schema reference](../skills/l3-fhir-authoring.html).
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/authoring-who-smart-guidelines/l3-fhir-authoring.md){: .fa-edit-source }

{% raw %}
# l3-fhir-authoring

> Skill id: `l3-fhir-authoring` · Package: `authoring-who-smart-guidelines` ·
> Named by `l3-fhir-pipeline.bpmn` (**Map L2 → L3**, **Author FSH profiles**,
> **SUSHI compile → FHIR JSON**) and `ig-incremental-build.bpmn`
> (**SUSHI on the restricted tank**).

Derive the **L3** layer — machine-readable FHIR artefacts — from an authored L2
DAK, using FHIR Shorthand and SUSHI.

> **Sourcing.** FHIR, FSH and SUSHI are HL7's; the SMART Guidelines L1–L4 model
> is WHO's. This skill states how they are wired **in this harness** — which
> lane, which inputs, which binaries the package installs — and defers to the
> FHIR and FSH specifications for what a conformant artefact must look like.
> Do not treat anything here as a substitute for the spec.

## Inputs and outputs

`schemas/skills/l3-fhir-authoring/`:

- **in** — `artifactType` (required), `l2Source` (required), `fshOutputDir`,
  `igRoot`
- **out** — `fshFiles`, `sushiResult`, `generatedResources`

`l2Source` being required is the design: **L3 is derived, not authored from
scratch.** An L3 artefact with no L2 behind it is a profile nobody can review
clinically, and it is the commonest way a DAK drifts from its guideline.

CQL — clinical decision logic — is part of this skill, not a separate one; the
input schema already carries `cql` among its artefact types.

## The toolchain this package installs

From `package-manifest.json`, so these are present rather than assumed:

```sh
sushi --version                     # fsh-sushi, npm
java -jar "$IG_PUBLISHER_JAR" -v    # /opt/ig-publisher/publisher.jar
```

`sushi-compiler` and `ig-publisher` are the declared capabilities; both require
`java-runtime`. If a capability probe fails, the correct outcome is that the
step **was not run** — never that it passed.

## Deriving rather than retyping

`smart-base` carries the transforms in the render direction — `bpmn2fsh` turns
an authored business process into FSH; `dmn2html` renders decision tables. Use
them rather than hand-writing what a transform already emits, and read
`smart-base-tools` first for the two behaviours that surprise people: one BPMN
can emit hundreds of files, and **paths collide across inputs** (measured on
`smart-dak-immz`: 313 emitted files landing at 201 distinct paths). A collision
is either a duplicate input to remove or two processes legitimately
contributing the same actor — decide, do not let it overwrite silently.

## Validate before you publish

`fhir-validation` is the separate skill and the separate lane, and the
separation matters: SUSHI compiling is not conformance. A profile can compile
and still fail validation against the packages it claims to constrain.

## Incremental builds

`ig-incremental-build.bpmn` runs SUSHI on a **restricted tank** — a cone of the
artefacts a change touches rather than the whole IG. That is a build
optimisation, not a validation shortcut: the full publisher build in that same
diagram is what the release is cut from.
{% endraw %}

## Processes that run this skill

| process | step(s) that name it |
|---|---|
| [Incremental IG build](../../processes/ig-incremental-build.html) | SUSHI on the restricted tank |
| [L3 FHIR IG pipeline](../../processes/l3-fhir-pipeline.html) | Map L2 → L3; Author FSH profiles; SUSHI compile → FHIR JSON |

