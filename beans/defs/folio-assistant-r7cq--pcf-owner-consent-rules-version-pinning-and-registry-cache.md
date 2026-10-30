---
# folio-assistant-r7cq
$schema: bean/1.0.0
title: 'PCF: owner consent rules 2 and 4 in the evaluator, ITI-108 client and phw processes'
status: completed
type: task
priority: normal
created_at: 2026-10-30T19:32:00Z
updated_at: 2026-10-30T19:32:00Z
parent: folio-assistant-negd
---

Owner card 2026-10-30 19:27Z approved four consent rules; card 19:29Z said to put them into the repos now. Text: `/mnt/project-files/dsa-analysis/missing-building-blocks-workplan.md` (before B2) and `dsa-processes.md` (before P10). Rules 1–3 go into folio-assistant-core's dsa-document-lifecycle BPMN (DSA thread). This bean covers the PCF side. Issue: [folio-assistant#2702](https://github.com/litlfred/folio-assistant/issues/2702).

Repo: fhir-harness, smart-trust-phw.

## Done when
- [x] Rule 2: `createPcfConsentEvaluator` counts a Consent only when `Consent.policy.uri` equals the agreement's fixed-version URL; a Consent for another version gives unknown.
- [x] Rule 4: `Iti108ConsentClient` can cache determined results; an entry ends at its TTL, at its Consents' `provision.period.end`, or when `consentWithdrawn(id)` is called.
- [x] The pcf-consent skill states all four rules.
- [x] smart-trust-phw's PCF business processes show P9 (consent) and rules 2–4 from the person's side.

## Progress
- 2026-10-30 ~19:45Z: [fhir-harness#227](https://github.com/litlfred/fhir-harness/pull/227) merged (b347890): rules 2 and 4 in the evaluator and ITI-108 client, skill updated; 35 tests pass.
- [smart-trust-phw#7](https://github.com/litlfred/smart-trust-phw/pull/7) merged (4077fba): rules 1-4 in processes A and C5, documentation only. SUSHI shows the same 14 errors on main and the branch, all from packages this sandbox cannot fetch (ihe.iti.vhl#1.0.0-comment, smart.who.int.pcmt-vaxprequal#current).
