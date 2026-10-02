WHO SMART Guidelines names **five** knowledge layers. FHIR content lives in
the first three, and those three are the clearest available vocabulary for
FHIR content generally:

| layer | what it holds | form |
|---|---|---|
| **L1** Narrative | narrative guidance — the publication a recommendation comes from | prose, figures, tables |
| **L2** Operational | the Digital Adaptation Kit — its ten components, from health interventions to test scenarios | BPMN, DMN, structured tables |
| **L3** Machine readable | the FHIR Implementation Guide | FSH → FHIR resources |
| L4 Executable | reference applications and services that execute the static algorithms | software |
| L5 Dynamic | dynamic algorithms trained and optimised on data — the precision-health model | models, analytics |

The five names and their one-line meanings are the WHO *Digital
transformation handbook for primary health care* (2024), §1.2 pp. 20–21,
ingested as `smart-base/library/9789240093362-eng`. It cites, as its ref. 18,
the primary source: Mehl G. et al., *WHO SMART guidelines: optimising
country-level use of guideline recommendations in the digital age*, Lancet
Digital Health 2021;3(4):e213–e216, ingested as
`smart-base/library/mehl-2021-who-smart-guidelines` (CC BY 3.0 IGO). It
presents the same five as "knowledge layers (L1–L5)".

**This page stops at L3 on purpose.** L4 and L5 are software and trained
models. They consume what L1–L3 publish, but they are not authored as FHIR
content, so nothing in this platform validates them as content. An earlier
version of this page said SMART Guidelines "names three layers". That is the
kind of rounding that tells a reader L4 and L5 do not exist.

**They are layers, not stages, and the difference is load-bearing.** A stage
model says each is produced from the one before and then left behind. In
practice all three are live at once: an L2 decision table and the L3
`PlanDefinition` derived from it both exist, both are published, and both can
change. Treating L2 as scaffolding that L3 replaces is how a decision table
and its FHIR representation drift apart with nothing to notice.

It is also why an instance may hold any one of the three without the others.
An L1 corpus with no DAK behind it is a real thing; so is an IG with no L1.

**The SMART layers are not the platform's layers.** `cat-harness`,
`folio-assistant-core` and `folio-assistant-sci` are layers of *this software*.
Each depends on the one before and inherits its skills and directories. L1–L5
are layers of *guideline knowledge*. A WHO folio holds L1–L3 *content*; the
platform layers are the tools that author and check it, and none of them is
"the L2 layer". The deck that set the two side by side is
`cat-harness/library/kg-folio-asst-2026-09-30` (slide 1).
