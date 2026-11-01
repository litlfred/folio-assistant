---
# folio-assistant-s4v2
$schema: bean/1.0.0
title: 'ODRL duties, required assignee, purpose/date constraints (DSA B1+B2)'
status: completed
type: feature
priority: normal
created_at: 2026-10-30T14:05:00Z
updated_at: 2026-10-30T19:35:00Z
parent: folio-assistant-negd
---

Workplan: `/mnt/project-files/dsa-analysis/missing-building-blocks-workplan.md` (analysis: `computable-dsa-analysis.md`, same folder). Issue: litlfred/folio-assistant#2702. Owner chose Option D on 2026-10-30 13:58Z.

In `cat-harness/schemas/content/odrl.ts`: add `duty` (odrl:delete, attribute, inform, obtainConsent); require `assignee` on Agreement (ODRL 2.2); left operands purpose (HL7 PurposeOfUse codes; DPV is a CG report and not used, owner rule 2026-10-30 14:00Z: no draft standards unless approved), dateTime, elapsedTime; operators lt/lteq/gt/gteq/isA. `permits()`: unmet duty → deny, unknowable → unknown.

## Done when
- [x] A 90-day delete duty: permit inside 90 days; after, deny without a deletion PROV record, permit with one, unknown when records are absent.
- [x] `purpose isA` HL7 PurposeOfUse HRESCH permits a subclass purpose and denies an unrelated one; `dateTime lt` permits before and denies after.
- [x] An Agreement with no assignee fails validation.

## Progress
- 2026-10-30: Implemented ODRL duties (`odrl:delete`, `odrl:attribute`, `odrl:inform`, `odrl:obtainConsent`), required `assignee` on `Agreement`, HL7 v3 `ActReason` `PurposeOfUse` hierarchy (`purpose`), `dateTime` and `elapsedTime` left operands, `lt`/`lteq`/`gt`/`gteq`/`isA` operators, and duty/constraint evaluation in `permits()` with PROV records (`schemas/content/odrl.ts`, `schemas/content/odrl.test.ts`). Opened PR `litlfred/cat-harness#742` (`https://github.com/litlfred/cat-harness/pull/742`).

## Done
Merged in litlfred/cat-harness#742 (4f6a265), 2026-10-30.
