---
layout: default
title: 'fhir-validation'
parent: Skill instructions
---

{: .note }
> Generated from [`skills/authoring-who-smart-guidelines/fhir-validation.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/authoring-who-smart-guidelines/fhir-validation.md) — do not edit here. Typed contract: [schema reference](../skills/fhir-validation.html).
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/skills/authoring-who-smart-guidelines/fhir-validation.md){: .fa-edit-source }

{% raw %}
# fhir-validation

> Skill id: `fhir-validation` · Package: `authoring-who-smart-guidelines` ·
> Named by `l3-fhir-pipeline.bpmn` (**Validate against profiles**, `Build
> pipeline` lane) and `ig-incremental-build.bpmn` (**Validate the cone
> (fhir_validate)**, `Publisher + validator services (JVM)` lane).

Validate an IG's FHIR artefacts against the profiles and packages they claim to
conform to.

> **Sourcing.** Conformance is defined by the FHIR specification and by the
> packages an IG depends on; the validator is HL7's. This skill states how it is
> invoked **in this harness** and what each outcome is allowed to mean. What
> makes a resource conformant is the spec's answer, not this file's.

## Inputs and outputs

`schemas/skills/fhir-validation/`:

- **in** — `igRoot` (required), `validationLevel`, `targetProfiles`
- **out** — `overallStatus`, `sushiResult`, `publisherResult`,
  `conformanceResults`

Three results, not one, and that is the design: **SUSHI compiling is not
conformance.** FSH can compile to JSON that the validator then rejects, so a
green `sushiResult` with an unrun `publisherResult` is not a pass.

## The two binaries

Declared capabilities, installed by this package's `docker` block:

```sh
sushi --version                                    # sushi-compiler
java -jar "${FHIR_VALIDATOR_JAR}" -version         # fhir-validator
java -jar "${IG_PUBLISHER_JAR}" -v                 # ig-publisher
```

`fhir-validator` is the standalone validator — **distinct from `ig-publisher`**,
which builds a whole IG. Validating a single resource against a package is the
validator's job and is what an authoring loop runs between builds; the
publisher is what a release is cut from. Both require `java-runtime`.

## A capability that is absent did not pass

If a probe fails, `overallStatus` is **not** a pass with an empty findings list.
It is "could not determine", and it is reported as such. This is the rule the
whole harness follows — the CI-health report, the README sections, the Pages
probe — and validation is where breaking it is most expensive, because a clean
run over a validator that never started looks exactly like a clean IG.

## Validating a cone

`ig-incremental-build.bpmn` validates a **restricted cone** — the artefacts a
change touches — rather than the whole IG, and reports the cone it chose. That
is a latency optimisation for the authoring loop. It is not what gates a
release: the full publisher build in `l3-fhir-pipeline.bpmn` is.

Do not let a green cone stand in for a green IG. The cone is defined by what
the change touched, and a profile the change did not touch can still be broken
by it.

## After validation

Quality gates on the aggregate are `quality-control`; publishing is
`ig-publication`. Keep them separate — a validator's verdict is an input to the
QC reviewer's decision, not the decision.
{% endraw %}

## Processes that run this skill

| process | step(s) that name it |
|---|---|
| [Incremental IG build](../../processes/ig-incremental-build.html) | Validate the cone (fhir_validate) |
| [L3 FHIR IG pipeline](../../processes/l3-fhir-pipeline.html) | Validate against profiles |

