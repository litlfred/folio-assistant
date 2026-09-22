---
# folio-assistant-cpmo
title: 'SMART-BASE CROSSWALKS: the v1 to v2 ConceptMaps exist, are draft, and one is incomplete'
status: todo
type: task
priority: normal
created_at: 2026-09-22T09:06:44Z
updated_at: 2026-09-22T09:06:44Z
parent: folio-assistant-2yyh
---

The owner, 2026-09-22: *"See smart-base for more info on classications and mappings better 1 and 2..."* — pointing at `WorldHealthOrganization/smart-base` as the implementation authority for the classification and for the crosswalk between editions 1 and 2.

Surveyed against the checkout (read-only). Every claim below carries a path; counts were re-derived with `grep -c` rather than read off prose.

## What is there

| artefact | path | rows |
|---|---|---|
| v1→v2 intervention crosswalk | `input/fsh/conceptmaps/CDHIv1toCDHIv2.fsh` | 120 |
| v1→v2 system-category crosswalk | `input/fsh/conceptmaps/CDSCv1toCDSCv2.fsh` | 25 |
| edition-2 code system | `input/fsh/codesystems/CDHIv2.fsh` | 138 codes |
| edition-1 code system | (CDHIv1) | 119 codes |

**Both ConceptMaps are real and both are `status: #draft`, `experimental: true`.** They carry `equivalent` / `wider` / `inexact` equivalence codes with human-readable rationale comments — which is more than a bare code pairing and is the part worth reading.

`CDHIv1toCDHIv2.fsh` is **incomplete against its own stated scope**: it stops mid-group-4 and never emits the unmatched rows for the v2-only codes its own description promises (1.4.4, 1.6.2, 1.8, 2.5.6, 2.11, 3.1.5, 3.5.7, 3.5.8, 3.8, 4.3.5, 4.5). `CDSCv1toCDSCv2.fsh` is complete on the source side, one row per v1 letter A–Y.

Code shape: CDHI is dotted hierarchical numeric — v1 carries a `.0` group suffix (`1.0`, `1.1`, `1.1.1`) and v2 drops it (`1`, `1.1`, `1.1.1`). CDSC is single letters A–Y in v1 and letter+digit A1–E2 in v2, across five architecture groups.

## What it already changed

The voice rule asserting the current abbreviation was **wrong and is corrected** (issue #877, bean `7mi0`). smart-base uses **CDISAH**, with the leading C, in 17 places across its FSH; the bare form appears in no FSH or prose there. Checking that against the ingested publication showed the publication itself carries both — `CDISAH` on page 7 and in its own short link `bit.ly/CDISAH`, and a one-off bare `DISAH` on page 9.

So the survey did not merely add information, it caught a rule that would have taught the wrong term. The rule now records both forms and names which artefact uses which.

## One claim that did NOT survive

The "nine categories of health system challenge" is **not** in smart-base. The only resource titled for health system challenges (`input/fsh/valuesets/CDSCv1.fsh`) is a relabelled wrapper around the 25-code A–Y system-categories ValueSet. The nine categories ARE in the ingested publication (`library/9789240081949-eng/sections/page-010.md`, which lists information, availability, quality, acceptability, utilization, efficiency, cost, accountability, equity), so the fact stands on the publication — but **the implementation does not encode it**, and that gap is itself worth knowing before anyone builds against it.

## Personas

No coded link between `GenericPersona` / `ActorDefinition` and CDHI codes: `GenericPersona.fsh`'s only bound vocabulary is ISCO-08. The link to CDISAH v2 is narrative only, in the free-text `description` of `input/fsh/actors/DAK.Persona.DataManager.fsh`, which names v2 codes and cites the publication by ISBN.

## What this bean is for

Not the survey — that is done. The open questions it raises:

- Should the two ConceptMaps be ingested as a graph here, so a v1 citation can be resolved to its v2 code mechanically rather than by hand? They are `draft`/`experimental`, which is a reason to model their STATE rather than to treat them as settled.
- Should the incompleteness of `CDHIv1toCDHIv2.fsh` be reported upstream? It is a finding about someone else's repository and is not ours to fix.
- The nine-category gap between publication and implementation: worth a note to whoever owns the FSH.

## Done when
- [ ] the owner has said whether the crosswalks are ingested here or merely cited
- [ ] the upstream findings are either reported or deliberately not
