---
# folio-assistant-r9vk
$schema: bean/1.0.0
title: 'ITI-108 Consent Registry read client (PCF7)'
status: in-progress
type: task
priority: normal
created_at: 2026-10-30T15:46:00Z
updated_at: 2026-10-30T16:27:00Z
parent: folio-assistant-negd
blocked_by:
    - folio-assistant-jx7m
---

IHE PCF adoption, owner card 2026-10-30 15:44Z "A: Approve, take all advice": PCF 1.1.0 (Trial Implementation) and FHIR R4 Consent (Trial Use) approved; no IUA claim; home smart-trust-phw; IHE source via library snapshots + pinned FHIR package, profiles referenced by URL only; Basic consent first. Plan: `/mnt/project-files/dsa-analysis/ihe-pcf-vhl-options.md` §5. Issue: litlfred/folio-assistant#2702. GDHCN is only one possible trust anchor.

Repo: fhir-harness. Depends on: PCF5.

## Done when
- [x] Against a test FHIR server: finds active, ignores expired; unreachable gives unknown.

## Progress
- 2026-10-30: Implemented the IHE ITI-108 (*Find Access Consent*) FHIR R4 Consent Registry read client (`buildIti108SearchUrl`, `evaluateConsentValidity`, `isConsentExpired`, `filterIti108Bundle`, `findAccessConsents`, `Iti108ConsentClient`) and `Bun.serve` unit tests in `fhir-harness` (`schemas/iti-108-consent-client.ts`, `schemas/iti-108-consent-client.test.ts`). Opened PR `litlfred/fhir-harness#208` (`https://github.com/litlfred/fhir-harness/pull/208`).
