---
name: l3-dependency-choice
description: >
  Stage 5 of smart-guideline-end-to-end: choose which existing FHIR IGs (WHO's,
  or a jurisdiction's) the guideline's L3 builds on. Indexes each candidate IG
  with ig-artifact-ingestion, matches the L1 knowledge graph and the stage-4
  L2 assets against the index, and returns one decision row per IG naming the
  profiles, value sets and libraries reused, derived from or not used. Read
  before choosing, or recording, an IG dependency.
input: schemas/skills/l3-dependency-choice/input.schema.json
output: schemas/skills/l3-dependency-choice/output.schema.json
---

# l3-dependency-choice

> Skill id: `l3-dependency-choice` · Package: `authoring-who-smart-guidelines` ·
> Stage 5 of [`smart-guideline-end-to-end`](smart-guideline-end-to-end.md),
> task `Task_DepsL3` of
> [`smart-guideline-end-to-end.bpmn`](../../../processes/content/smart-guideline-end-to-end.bpmn).
> Adjudicated by the FHIR modeller and the terminologist.

The L3 half of [`l2-dependency-choice`](l2-dependency-choice.md): the same
decision row, the same reuse-first precedence, the same `decision-comparison`
table and `DecisionRequest`. Only the candidates and the evidence differ.

## Input and output

The contract is [`input.schema.json`](../../../schemas/skills/l3-dependency-choice/input.schema.json) and [`output.schema.json`](../../../schemas/skills/l3-dependency-choice/output.schema.json).

- **In:** the `l1Kg` (stage 2), the `l2Assets` (every stage-4 [`l2-dak-authoring`](l2-dak-authoring.md) pass's `artifacts`), stage 3's `l2Dependencies`, and any candidate IGs already known.
- **Out:** `l3Dependencies` (`level: L3`), rows of the same `dependencyRow` whose `components` name canonicals, and `indexes`, the [`ig-artifact-ingestion`](ig-artifact-ingestion.md) index each row was read from, with its `dakApi` state. Stage 6 (fhir-harness `l3-fhir-authoring`) reads the adjudicated rows as `sushi-config.yaml` dependencies.

## Steps

1. **Candidates.** Those given, plus each IG that implements a DAK stage 3
   chose to `reuse`, `adapt` or `extend`.
2. **Index each one** with [`ig-artifact-ingestion`](ig-artifact-ingestion.md).
   The index is the evidence; an IG whose root was never read has
   `dakApi: unknown`, which is not `absent`.
3. **Match.** For each L2 asset and L1 node, find the profile, value set,
   CQL library or PlanDefinition in the index that already implements it.
   The matches are the row's `evidence`; what is taken is its `components`
   (`reuse`, `adapt`, `extend`, `not-used`).
   For each artefact type taken, record the `toolchain` stage 6 will use:
   how the candidate builds and tests its CQL and examples, found by the
   search in [`smart-base-tools`](smart-base-tools.md) §*Adapting a DAK*.
4. **Decide, table, ask and go on**, exactly as
   [`l2-dependency-choice`](l2-dependency-choice.md) steps 2–4.
