# smart-ig

The **L3** layer — a WHO SMART Guideline's FHIR Implementation Guide.

| in | out |
|---|---|
| the DAK API surface a SMART IG publishes | the bare IG pipeline — SUSHI, Publisher, Jekyll → `fhir-harness` |
| `smart.who.int` canonicals and WHO publication conventions | the DAK components → `smart-dak` |
| what a SMART Guideline's L3 owes beyond a plain IG | the guideline narrative → `smart-l1` |

## Instances of this layer

`smart-trust` and `smart-immunizations`. Both were declared *harness instances*
until now — which bean `nsbb` ruled against and `smart-immunizations`'s own
declaration flagged as provisional. They are instances **of** this layer
instead, which is the whole point: an ingested IG does not become a harness.

## Why it declares nothing yet

Nothing is here yet. Declaring a directory that is not there makes every
consumer scan an empty path and report a clean run over it (`dh4f`), so the
layer declares its scope and nothing else.
