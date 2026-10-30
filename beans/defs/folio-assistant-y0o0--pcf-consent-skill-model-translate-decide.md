---
# folio-assistant-y0o0
$schema: bean/1.0.0
title: 'pcf-consent skill (model, translate, decide) (PCF9)'
status: in-progress
type: task
priority: normal
created_at: 2026-10-30T15:46:00Z
updated_at: 2026-10-30T16:39:00Z
parent: folio-assistant-negd
blocked_by:
    - folio-assistant-jx7m
---

IHE PCF adoption, owner card 2026-10-30 15:44Z "A: Approve, take all advice": PCF 1.1.0 (Trial Implementation) and FHIR R4 Consent (Trial Use) approved; no IUA claim; home smart-trust-phw; IHE source via library snapshots + pinned FHIR package, profiles referenced by URL only; Basic consent first. Plan: `/mnt/project-files/dsa-analysis/ihe-pcf-vhl-options.md` §5. Issue: litlfred/folio-assistant#2702. GDHCN is only one possible trust anchor.

Repo: fhir-harness. Depends on: PCF5.

## Done when
- [x] skill_list shows it; phw AGENTS.md links it.

## Progress
- 2026-10-30: Authored `skills/content/fhir-ig-authoring/pcf-consent.md` in `fhir-harness` covering (1) **Model** (IHE PCF 1.1.0 Trial Implementation and FHIR R4 `Consent` Trial Use referenced by canonical URL only, `ihe.iti.pcf: 1.1.0` and `ihe.iti.vhl: 1.0.0-comment` in `sushi-config.yaml`, Basic consent + Additional `PurposeOfUse` first, no IUA claim, trust-anchor neutral with GDHCN as one possible trust anchor), (2) **Translate** (`consentToOdrl()` mapping PCF `Consent` provisions, HL7 v3 `ActReason` `PurposeOfUse` `odrl:isA`, `odrl:dateTime` period bounds, actors, data targets/constraints, nested exceptions, and the four IHE PCF Volume 1 §1:53.2.1 implicit-policy `Set`s to W3C ODRL 2.2 `Set` policies), and (3) **Decide** (three-valued `decide()` / `permits()` returning `permit` | `deny` | `unknown` with no silent permit, IHE ITI-108 Consent Registry reads via `findAccessConsents()`, `odrl:obtainConsent` duty evaluation on DSAs, and hash-chained PROV-O decision records citing `Consent.id` + `Consent.meta.versionId`). Registered `"pcf-consent"` in `skills/content/fhir-ig-authoring/package-manifest.json`, bound to `fhir-modeller` in `scenarios/roles.json`, updated `glossary/generated/fhir-harness/kg-skills.glossary.json`, and synced `AGENTS.md` (`skills:index`); verified `knownSkills` includes `"pcf-consent"` and `skill:register:declarations:check` passes. Added `AGENTS.md` in `smart-trust-phw` linking `pcf-consent`. Opened PRs `litlfred/fhir-harness#209` (`https://github.com/litlfred/fhir-harness/pull/209`) and `litlfred/smart-trust-phw#3` (`https://github.com/litlfred/smart-trust-phw/pull/3`).
