---
layout: default
title: 'terminology-management'
parent: Skill instructions
---

{: .note }
> Generated from [`skills/authoring-who-smart-guidelines/terminology-management.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/authoring-who-smart-guidelines/terminology-management.md) — do not edit here. Typed contract: [schema reference](../skills/terminology-management.html).
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/skills/authoring-who-smart-guidelines/terminology-management.md){: .fa-edit-source }

{% raw %}
# terminology-management

> Skill id: `terminology-management` · Package: `authoring-who-smart-guidelines` ·
> Named by `l2-dak-authoring.bpmn` step **Terminology bindings**, in the
> `Terminologist` lane.

Bind a DAK's data elements to standard terminologies, and manage the value sets
and concept maps that result.

> **Sourcing.** ICD-11, SNOMED CT and LOINC are external code systems with
> their own licences, release cycles and editorial rules; FHIR's terminology
> layer is HL7's. This skill states how binding is worked **in this harness**
> and defers to those authorities for the semantics. It is deliberately silent
> on which code to choose for a given concept — that is the terminologist's
> judgement and the reason the process gives them their own lane.

## Inputs and outputs

`schemas/skills/terminology-management/`:

- **in** — `operation` (required), `targetStandard`, `inputFile`
- **out** — `resources`, `unmappedConcepts`

**`unmappedConcepts` is the important output.** A binding pass that maps
everything is either a small dictionary or a pass that guessed. Concepts with
no defensible code are a normal result, and reporting them is what lets the
clinical SME see where the DAK is asserting a local meaning.

## Why this has its own lane

`l2-dak-authoring.bpmn` gives the terminologist a lane of their own rather than
folding binding into authoring, and the reason is that a wrong binding is
invisible downstream. A data element bound to a plausible-but-wrong code
compiles, validates, publishes, and is wrong in every derived artefact. The
separation exists so that the person who chooses codes is not the person under
pressure to finish the dictionary.

The `terminologist` role carries this skill and `clinical-sme` does not: they
are different judgements. A clinician rules on whether the *concept* is right;
the terminologist rules on whether the *code* denotes it.

## Do not invent a code

If no code in the target standard denotes the concept, the answer is
`unmappedConcepts`, not the nearest neighbour. "Close enough" bindings are the
mechanism by which a DAK stops meaning what its guideline says, and they are
unrecoverable once downstream systems have consumed them.

## Tooling

`smart-base` carries `generate_jsonld_vocabularies` and the `generate_*_schemas`
family; the L2 data dictionary is read by `dd_extractor`. Load a checkout
rather than vendoring — `smart-base-tools`, which also states that an absent
`SMART_BASE_HOME` degrades the skill to `skip` rather than reporting a clean
run over a toolchain that was never present.

Validation of the resulting artefacts is `fhir-validation`, not this skill.
{% endraw %}

## Processes that run this skill

| process | step(s) that name it |
|---|---|
| [L2 DAK authoring](../../processes/l2-dak-authoring.html) | Terminology bindings |

