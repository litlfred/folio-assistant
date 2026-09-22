# smart-l1

The **L1** layer — the narrative a WHO SMART Guideline is, before anything is
derived from it.

| in | out |
|---|---|
| guideline narrative and recommendations | DMN decision tables → `smart-dak` |
| the evidence behind a recommendation | FHIR profiles and terminology → `smart-ig` |
| figures and tables a DTH cites | the SMART rules and data models → `smart-base` |

## Why it declares nothing yet

Because nothing is here yet, and saying otherwise would be worse than saying
nothing: a declared-but-absent directory makes every consumer scan an empty
path and report a clean run over it (`dh4f`).

The WHO digital-health corpus lives in `smart-base/library/` today. Moving it
is a judgement about what those publications *are* — base-layer reference, or
L1 source for a specific guideline — and that judgement has not been made.
