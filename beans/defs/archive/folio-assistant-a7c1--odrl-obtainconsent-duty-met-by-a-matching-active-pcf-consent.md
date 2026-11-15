---
# folio-assistant-a7c1
$schema: bean/1.0.0
title: 'odrl:obtainConsent duty met by a matching active PCF Consent (PCF6)'
status: completed
type: task
priority: normal
created_at: 2026-10-30T15:46:00Z
updated_at: 2026-10-30T17:58:00Z
parent: folio-assistant-negd
blocked_by:
    - folio-assistant-jx7m
---

IHE PCF adoption, owner card 2026-10-30 15:44Z "A: Approve, take all advice": PCF 1.1.0 (Trial Implementation) and FHIR R4 Consent (Trial Use) approved; no IUA claim; home smart-trust-phw; IHE source via library snapshots + pinned FHIR package, profiles referenced by URL only; Basic consent first. Plan: `/mnt/project-files/dsa-analysis/ihe-pcf-vhl-options.md` §5. Issue: litlfred/folio-assistant#2702. GDHCN is only one possible trust anchor.

Repo: cat-harness. Depends on: B1, PCF5.

## Done when
- [x] DSA + no Consent gives unknown; deny Consent gives deny; matching permit gives permit.

## Progress
- 2026-10-30: Implemented `odrl:obtainConsent` (`obtainConsent`) duty evaluation against active IHE PCF / FHIR R4 Consents and translated ODRL `Set` policies in `cat-harness/schemas/content/odrl.ts` (`evaluatePcfConsent`, `permits`, `decide`) with PCF left operands (`pcf:securityLabel`, `pcf:dataPeriod`, `pcf:author`, `pcf:encounter`), verifying DSA + no/inactive Consent → `unknown`, DSA + deny Consent → `deny`, and DSA + matching active permit Consent → `permit` in `cat-harness/schemas/content/odrl.test.ts`. Updated PR `litlfred/cat-harness#742` (`https://github.com/litlfred/cat-harness/pull/742`).
- 2026-10-30: landed in [cat-harness#742](https://github.com/litlfred/cat-harness/pull/742) (merged). Layer fix follows in folio-assistant-6jnx.
