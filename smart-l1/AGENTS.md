# AGENTS.md — smart-l1

The **L1** layer of WHO SMART Guidelines: the guideline narrative, the
recommendations and their evidence, the figures and tables a Digital Adaptation
Kit is written **from**.

## The one question for this layer

> **Would a reader of the guideline recognise this as part of it?**

If yes, it is L1. A recommendation's text is; the DMN table someone derived
from that recommendation is not — that is `smart-dak`.

## It is a sibling, not a stage

`smart-l1`, `smart-dak` and `smart-ig` all sit on `smart-base`. They are not a
pipeline: **an L1 corpus with no DAK behind it is a real thing**, and so is an
IG with no L1. Treating L1 as scaffolding that L2 replaces is how a
recommendation and the decision table derived from it drift apart with nothing
to notice.

## It declares no directories, and that is deliberate

`folio-assistant-core` set the precedent: created declaring none, because what
it would own was still interleaved elsewhere. **Declaring a directory that is
not there is the `dh4f` defect** — every consumer scans nothing and reports a
clean run over it.

Candidate content exists and has **not** been moved here on anybody's say-so:
the WHO digital-health corpus is in `smart-base/library/`, and `smart-kg/`
holds GRADE. Whether either belongs here is a judgement about what each asset
*is*, and it is not settled by this layer existing.

Placement:
[`smart-stack-layering`](../cat-harness/skills/authoring-who-smart-guidelines/smart-stack-layering.md).
