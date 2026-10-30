---
# folio-assistant-s4v2
$schema: bean/1.0.0
title: 'ODRL duties, required assignee, purpose/date constraints (DSA B1+B2)'
status: todo
type: feature
priority: normal
created_at: 2026-10-30T14:05:00Z
updated_at: 2026-10-30T14:05:00Z
parent: folio-assistant-negd
---

Workplan: `/mnt/project-files/dsa-analysis/missing-building-blocks-workplan.md` (analysis: `computable-dsa-analysis.md`, same folder). Issue: litlfred/folio-assistant#2702. Owner chose Option D on 2026-10-30 13:58Z.

In `cat-harness/schemas/content/odrl.ts`: add `duty` (odrl:delete, attribute, inform, obtainConsent); require `assignee` on Agreement (ODRL 2.2); left operands purpose (DPV), dateTime, elapsedTime; operators lt/lteq/gt/gteq/isA. `permits()`: unmet duty → deny, unknowable → unknown.

## Done when
- A 90-day delete duty: permit inside 90 days; after, deny without a deletion PROV record, permit with one, unknown when records are absent.
- `purpose isA dpv:ResearchAndDevelopment` permits a subclass purpose and denies an unrelated one; `dateTime lt` permits before and denies after.
- An Agreement with no assignee fails validation.
