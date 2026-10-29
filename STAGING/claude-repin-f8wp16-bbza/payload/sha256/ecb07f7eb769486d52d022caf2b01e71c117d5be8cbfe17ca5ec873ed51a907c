---
input: schemas/skills/l3-fhir-authoring/input.schema.json
output: schemas/skills/l3-fhir-authoring/output.schema.json
---

# l3-fhir-authoring

> Skill id: `l3-fhir-authoring` · Package: `fhir-ig-authoring` ·
> Named by `l3-fhir-pipeline.bpmn` (**Author FSH profiles**,
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

`fhir-harness/schemas/skills/l3-fhir-authoring/`:

- **in** — `artifactType` (required), `sourceModel` (required), `fshOutputDir`,
  `igRoot`
- **out** — `fshFiles`, `sushiResult`, `generatedResources`

`sourceModel` being required is the design: **L3 is derived, not authored from
scratch.** An L3 artefact with no source behind it is a profile nobody can
review against what it was meant to encode. Which source is the layer above's
to say, in its own process: that process maps its model and then CALLS
`l3-fhir-pipeline.bpmn` (`Process_L3Fhir`), which starts at "Source model
ready". Neither this skill nor that pipeline names the model, because
`fhir-harness` may not (`fhir-harness/AGENTS.md`). The mapping step lived in
`l3-fhir-pipeline.bpmn` itself until 2026-10-09 (bean `veiu`). Until stage D of the smart-* separation (#1767)
the input was `l2Source` and the skill depended on an overlay's authoring skill.

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

When the layer above carries transforms in the render direction — from its own
model to FSH, or to rendered tables — use them rather than hand-writing what a
transform already emits, and read that layer's own tooling skill for how they
behave. Whatever they emit is still FSH this skill owns: a collision between
two emitted files is a finding to decide (a duplicate input, or two sources
legitimately contributing the same thing), never one to let overwrite
silently.

## Validate before you publish

`fhir-validation` is the separate skill and the separate lane, and the
separation matters: SUSHI compiling is not conformance. A profile can compile
and still fail validation against the packages it claims to constrain.

## Incremental builds

`ig-incremental-build.bpmn` runs SUSHI on a **restricted tank** — a cone of the
artefacts a change touches rather than the whole IG. That is a build
optimisation, not a validation shortcut: the full publisher build in that same
diagram is what the release is cut from.
